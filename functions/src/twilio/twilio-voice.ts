
import VoiceResponse, { GatherAttributes, SayLanguage } from 'twilio/lib/twiml/VoiceResponse';
import * as functions from 'firebase-functions';
import { OrderDao } from './model/order.dao';
import { Order, Type, Urgency, Location, OrderStatus, OrderMeta, Address } from './model/order.model';
import { Playable, OrderFlow } from './questions.constant';
import { Question, AnswerType, UserInput } from './question.model';
import { encode } from 'ngeohash';
//import { firestore } from 'firebase-admin';
import moment from 'moment';
// tslint:disable-next-line:no-import-side-effect
import 'moment/locale/de';
import { getGeoPosByLocation } from './helper/geo-location.helper';
import { sendOrderToColiveryAPI, deleteLatestHelpRequest, getHelpRequests, updateUser, updateHelpSeeker, createOrGetUser } from './helper/colivery.helper';//
import { getQuestionByIndex, spotNextQuestion } from './helper/question.helper';
import { checkSpeechResult } from './helper/check-answer.helper';
import { TranslateAnswer } from './service/translate-answer.service';
import { logger, LogLevel } from './helper/logger.helper';

export const interview = async (request: functions.Request, response: functions.Response) => {
    const phoneNumber: string = request.body.From;
    const call_sid: string = request.body.CallSid;
    const input: string = request.body.RecordingUrl || request.body.Digits

    /*const jsonStr = '{"id":"IjERvUXEAkGExkcSgt20","data":{"address":{"house_number":"12","street":"Hochstraße","city":"Lüdenscheid","zip":"58511","confirmed":true},"urgency":"tomorrow","account_id":null,"last_call_sid":"CA1a8f4e0c2816cb403a747b6aad51c10f","extras":{"car_necessary":false},"status":"incomplete","location":{"geohash":"u1j7q4erf","gps":{"_latitude":23.2113697,"_longitude":12.6510467}},"privacy_agreed":true,"name":"Max Musterfrau","phone_number":"+49235128888","created":{"_seconds":1624054257,"_nanoseconds":188000000},"type":"groceries"}}';
    const om: OrderMeta = JSON.parse(jsonStr) as OrderMeta;//new OrderMeta("IjERvUXEAkGExkcSgt20", new Order("+4915237135198", "CA1a8f4e0c2816cb403a747b6aad51c10f"));
    om.data.location = new Location(new firestore.GeoPoint(23.2113697,12.6510467), "u1j7q4erf");
    //om.copyInto(JSON.parse(jsonStr));
    //om.data.address = new Address("38", "Von-der-Mark-Straße", "58511", "Lüdenscheid.");
    console.log(om);

    console.log("ActiveOrder: "+JSON.stringify(om));
    await sendOrderToColiveryAPI(om).then(async (id: string)=>{
        //await orderDao.deleteOrderById(id);
    });
    const newUser = await updateUser(om);
    const newHS = await updateHelpSeeker(om);
    console.log("New user: "+JSON.stringify(newUser));
    console.log("New HS: "+JSON.stringify(newHS));*/

    //console.log(getHelpRequests("+49235128809"));
    //await deleteLatestHelpRequest("+49235128809");

    /*authHotlineUser("+49235128809").then(async (token: string) => {
        coliveryGetApiCall("/v1/help-request", token, "").then((res: string) => {
            console.log(res);
        }).catch((reason: any) => {
        console.log(reason);
        });
    }).catch((reason: any) => {
        console.log(reason);
    });*/

    //const pn = "+4988498689864984";
    //await sendOrderToColiveryAPI(new OrderMeta(pn, new Order(pn,pn)));

    const responseId = request.params.responseId;
    const questionIndex = request.params.questionIndex;
    const speechResult = request.body.SpeechResult;

    // TO DO: set based on caller origin
    const twilioLanguage: SayLanguage = 'de-DE';
    moment.locale('de');

    logger(phoneNumber, responseId, `IP ADDRESS - ${request.headers[ 'x-forwarded-for' ] || request.connection.remoteAddress}`);
    logger(phoneNumber, responseId, `Incoming Call with INPUT: ${input} # QUESTION_INDEX: ${questionIndex} # SPEECH_RESULT: '${speechResult}'`);

    const twiml = new VoiceResponse();
    const orderDao: OrderDao = OrderDao.init();

    const addPlayable = (text: Playable | string) => {
        if (text.startsWith('http')) {
            twiml.play({ loop: 1 }, text.toString());
        } else {
            twiml.say({ language: twilioLanguage, voice: 'Polly.Marlene' }, text);
        }
    }

    const addGathering = (q: Question, orderId: string) => {
        const gatherAttributes: GatherAttributes = {
            input: [ 'speech' ],
            actionOnEmptyResult: true,
            // TO DO: use constant
            action: '/twilio-inboundCallForRequest/voice/' + orderId + '/gather/' + q.index,
            hints: q.answerType === AnswerType.YES_OR_NO ? `${new TranslateAnswer().getAnswer('ja')}, ${new TranslateAnswer().getAnswer('nein')}`
                : q.answerType === AnswerType.MULTIPLE && q.multipleAnswers ? Array.from(q.multipleAnswers?.keys()).join(",")
                    : undefined,
            language: twilioLanguage,
            method: 'POST',
            speechTimeout: 'auto',
            profanityFilter: true
        };

        if (q.announcementSource.startsWith('http')) {
            twiml.gather(gatherAttributes).play(q.announcementSource);
        } else {
            twiml.gather(gatherAttributes).say({ language: twilioLanguage, voice: 'Polly.Marlene' }, q.announcementSource);
        }
    }

    const respond = () => {
        response.type('text/xml');
        response.send(twiml.toString()).end();
    }

    let skipGathering: boolean = false;

    // Phone Number is suppressed
    if (!phoneNumber) {
        logger(phoneNumber, responseId, `Phone Number Suppressed`);
        addPlayable(Playable.SUPPRESSED_PHONE_NUMBER);
        skipGathering = true;
    }

    // MODE: has answer from previous question
    if (responseId && questionIndex) {
        // No Speech Input
        if (typeof speechResult === 'undefined') {
            addPlayable(Playable.MISUNDERSTOOD);
        } else {
            const question: Question | null = getQuestionByIndex(questionIndex);

            if (!question) {
                response.status(500).send(`NO QUESTION FOUND for ${questionIndex}`).end();
                return;
            }

            let answer: string | boolean | Type | Urgency | null = null;

            switch (question.answerType) {
                case AnswerType.YES_OR_NO:
                    if (checkSpeechResult(speechResult, new TranslateAnswer().getAnswer('yes'))) {
                        answer = true;
                    } else if (checkSpeechResult(speechResult, new TranslateAnswer().getAnswer('no'))) {
                        answer = false;
                    }
                    break;
                case AnswerType.MULTIPLE:
                    answer = question.multipleAnswers ? Array.from(question.multipleAnswers.keys()).find((a: string) => checkSpeechResult(speechResult, new TranslateAnswer().getAnswer(a))) : speechResult;
                    break;
                case AnswerType.FREE_ANSWER:
                    answer = speechResult;
                    break;
            }

            logger(phoneNumber, responseId, `AnswerType: ${question.answerType}, Answer: '${answer}'`);

            // no answer matches - ask again
            if (answer === null || typeof answer === 'undefined') {
                addPlayable(Playable.MISUNDERSTOOD);
            } else {
                try {
                    switch (question.index) {
                        case OrderFlow.ASK_FOR_OPEN_ORDER:
                            if (answer) {
                                await deleteLatestHelpRequest(phoneNumber);
                                await orderDao.deleteOrderById(responseId);
                                addPlayable(Playable.ORDER_DELETED);
                                skipGathering = true;
                            } else {
                                await orderDao.deleteOrderById(responseId);
                                addPlayable(Playable.ORDER_KEEPED);
                                skipGathering = true;
                            }

                            break;
                        case OrderFlow.ASK_FOR_INCOMPLETE_ORDER:
                            if (answer) {
                                await orderDao.changeOrderById(responseId, { last_call_sid: call_sid });
                                addPlayable(Playable.ORDER_RESUMED);
                            } else {
                                await orderDao.deleteOrderById(responseId);
                                addPlayable(Playable.ORDER_DELETED);
                                skipGathering = true;
                            }
                            break;
                        case OrderFlow.ASK_FOR_PRIVACY:
                            if (answer) {
                                await orderDao.changeOrderById(responseId, { privacy_agreed: true });
                            } else {
                                await orderDao.deleteOrderById(responseId);
                                addPlayable(Playable.ORDER_DELETED);
                                skipGathering = true;
                            }
                            break;
                        case OrderFlow.ASK_FOR_TYPE:
                            await orderDao.changeOrderById(responseId, { type: answer });
                            break;
                        case OrderFlow.ASK_FOR_EXTRA_GROCERIES:
                            await orderDao.changeOrderById(responseId, { extras: { car_necessary: answer } });
                            break;
                        case OrderFlow.ASK_FOR_EXTRA_MEDICINE:
                            await orderDao.changeOrderById(responseId, { extras: { prescription: answer } });
                            break;
                        case OrderFlow.ASK_FOR_URGENCY:
                            await orderDao.changeOrderById(responseId, { urgency: answer });
                            break;
                        case OrderFlow.ASK_FOR_NAME:
                            await orderDao.changeOrderById(responseId, { name: answer });
                            break;
                        case OrderFlow.ASK_FOR_ADDRESS_HOUSE_NUMBER:
                            await orderDao.changeOrderById(responseId, { 'address.house_number': answer });

                            const currentOrder: Order = await orderDao.findOrderById(responseId);
                            logger(phoneNumber, responseId, `currentOrder for geo validation`, currentOrder);

                            if (currentOrder.address !== null) {
                                try {
                                    //street: string, house_number: string, city: string, zip: string
                                    const {geoPoint, house_number, street, city, zip} 
                                    = await getGeoPosByLocation(`${currentOrder.address.street}`, `${currentOrder.address.house_number}`, `${currentOrder.address.zip}`, `${currentOrder.address.city}`, 'de_DE');
                                    const geoHash: string = encode(geoPoint.latitude, geoPoint.longitude);
                                    await orderDao.changeOrderById(responseId, { 'location': new Location(geoPoint, geoHash).parseToFirebaseDoc() });
                                    await orderDao.changeOrderById(responseId, { 'address.house_number': house_number });
                                    await orderDao.changeOrderById(responseId, { 'address.street': street });
                                    await orderDao.changeOrderById(responseId, { 'address.city': city });
                                    await orderDao.changeOrderById(responseId, { 'address.zip': zip });
                                } catch (e) {
                                    logger(phoneNumber, responseId, `Error Validating Address`, e, LogLevel.ERROR);
                                }
                            }

                            break;
                        case OrderFlow.ASK_FOR_ADDRESS_STREET:
                            await orderDao.changeOrderById(responseId, { 'address.street': answer });
                            break;
                        case OrderFlow.ASK_FOR_ADDRESS_ZIP:
                            await orderDao.changeOrderById(responseId, { 'address.zip': answer });
                            break;
                        case OrderFlow.ASK_FOR_ADDRESS_CITY:
                            await orderDao.changeOrderById(responseId, { 'address.city': answer });
                            break;
                        case OrderFlow.ASK_FOR_ADDRESS_RECHECK:
                            if (!answer) {
                                await orderDao.changeOrderById(responseId, { 'address': new Address().parseToFirebaseDoc(), 'location': new Location().parseToFirebaseDoc() });
                            } else {//TODO!!
                                const currentOrderRecheck: Order = await orderDao.findOrderById(responseId);
                                logger(phoneNumber, responseId, `currentOrderRecheck for geo validation`, currentOrderRecheck);

                                if (currentOrderRecheck.address !== null) {
                                    try {
                                        /*const geoPoint = await getGeoPosByLocation(`${currentOrderRecheck.address.zip} ${currentOrderRecheck.address.city}, Deutschland`, 'de_DE');
                                        const geoHash: string = encode(geoPoint.latitude, geoPoint.longitude);
                                        await orderDao.changeOrderById(responseId, { 'address.confirmed': true, 'location': new Location(geoPoint, geoHash).parseToFirebaseDoc() });*/
                                        const {geoPoint, house_number, street, city, zip} 
                                        = await getGeoPosByLocation(`${currentOrderRecheck.address.street}`, `${currentOrderRecheck.address.house_number}`, `${currentOrderRecheck.address.zip}`, `${currentOrderRecheck.address.city}`, 'de_DE');
                                        const geoHash: string = encode(geoPoint.latitude, geoPoint.longitude);
                                        await orderDao.changeOrderById(responseId, { 'location': new Location(geoPoint, geoHash).parseToFirebaseDoc() });
                                        await orderDao.changeOrderById(responseId, { 'address.house_number': house_number });
                                        await orderDao.changeOrderById(responseId, { 'address.street': street });
                                        await orderDao.changeOrderById(responseId, { 'address.city': city });
                                        await orderDao.changeOrderById(responseId, { 'address.zip': zip });
                                        await orderDao.changeOrderById(responseId, { 'address.confirmed': true });
                                    } catch (e) {
                                        logger(phoneNumber, responseId, `Error Validating Address (ZIP and CITY)`, e, LogLevel.ERROR);
                                    }
                                }
                            }
                            break;
                        case OrderFlow.ASK_FOR_ADDRESS_CHECK_UP:
                            if (answer) {
                                await orderDao.changeOrderById(responseId, { 'address.confirmed': true });
                            } else {
                                await orderDao.changeOrderById(responseId, { 'address': new Address().parseToFirebaseDoc(), 'location': new Location().parseToFirebaseDoc() });
                            }
                            break;
                    }
                } catch (e) {
                    logger(phoneNumber, responseId, `Error Updating Question`, e, LogLevel.ERROR);
                    response.status(500).send("ERROR UPDATING QUESTION").end();
                }
            }
        }
    }

    if (!skipGathering) {
        const tempOrder: Order = new Order(phoneNumber, call_sid);
        const tempOrderMeta: OrderMeta = new OrderMeta("", tempOrder);
        console.log("Create or get user for "+phoneNumber);
        const hsData: any = await createOrGetUser(tempOrderMeta);
        console.log("Create or get user result: "+JSON.stringify(hsData));
        // Find Current Order or Create New Order
        const orders: OrderMeta[] = await orderDao.findOrCreateActiveOrdersByPhoneNumber(phoneNumber, call_sid);

        //const ongoingOrder: OrderMeta | undefined = orders.find((o: OrderMeta) => o.data.status === OrderStatus.OPEN || o.data.status === OrderStatus.IN_PROGRESS);
        const activeRequests: any = await getHelpRequests(phoneNumber);


        let nextQuestion: Question | null;
        let activeOrder: OrderMeta | undefined;

        if (typeof activeRequests !== 'undefined' && Object.keys(activeRequests).length > 0) {//typeof ongoingOrder !== 'undefined'
            nextQuestion = getQuestionByIndex(OrderFlow.ASK_FOR_OPEN_ORDER);
            /*activeOrder = new OrderMeta("ALREADY_OPEN", new Order(phoneNumber, "ALREADY_OPEN"));
            activeOrder.id = "ALREADY_OPEN";
            activeOrder.data = new Order(phoneNumber, "ALREADY_OPEN");*/
            activeOrder = orders.find((o: OrderMeta) => o.data.status === OrderStatus.INCOMPLETE);
            if(typeof activeOrder !== 'undefined')
                activeOrder.data.status = OrderStatus.OPEN;
        } else {
            activeOrder = orders.find((o: OrderMeta) => o.data.status === OrderStatus.INCOMPLETE);
            nextQuestion = activeOrder ? spotNextQuestion(activeOrder.data) : null;

            // ASK TO COMPLETE INCOMPLETE ORDER
            if (activeOrder && activeOrder.data.last_call_sid !== call_sid) {
                logger(phoneNumber, responseId, `CALL SID are not equal: ${activeOrder.data.last_call_sid} - ${call_sid}`);
                nextQuestion = getQuestionByIndex(OrderFlow.ASK_FOR_INCOMPLETE_ORDER);
            }
        }

        if (!activeOrder || !activeOrder.id || !activeOrder.data) {
            logger(phoneNumber, responseId, `Could not find or create any order`);
            addPlayable(Playable.UNEXPECTED_PROBLEM);
            respond();
            return;
        }

        logger(activeOrder.data.phone_number, activeOrder.id, `Found Order`, activeOrder);
        logger(activeOrder.data.phone_number, activeOrder.id, `Found Next Question Index: ${nextQuestion?.index}`);

        if (!nextQuestion) {
            logger(activeOrder.data.phone_number, activeOrder.id, `Finished Order`);
            await orderDao.changeOrderById(activeOrder.id, { status: OrderStatus.OPEN.toString() });
            addPlayable(Playable.THANK_YOU_BYE);
            console.log("ActiveOrder: "+JSON.stringify(activeOrder));
            await sendOrderToColiveryAPI(activeOrder).then(async (id: string)=>{
                await orderDao.deleteOrderById(id);
            });
            const newUser = await updateUser(activeOrder);
            const newHS = await updateHelpSeeker(activeOrder);
            console.log("New user: "+JSON.stringify(newUser));
            console.log("New HS: "+JSON.stringify(newHS));
            respond();
            return;
        }

        nextQuestion.introSources?.forEach((playable: Playable) => {
            addPlayable(playable);
        });

        if (nextQuestion.addInputToIntro === UserInput.ADDRESS) {
            addPlayable(`${activeOrder.data.address?.street} ${activeOrder.data.address?.house_number}, ${activeOrder.data.address?.zip} ${activeOrder.data.address?.city}`);
        } else if (nextQuestion.addInputToIntro === UserInput.CREATE_DATE) {
            addPlayable(`${moment(activeOrder.data.created.toDate()).fromNow()}`);
        } else if (nextQuestion.addInputToIntro === UserInput.CREATE_DATE_OPEN
            && typeof activeRequests !== 'undefined' 
            && Object.keys(activeRequests).length > 0
            && typeof activeRequests[0].createdAt !== 'undefined') {
            addPlayable(`${moment(new Date(activeRequests[0].createdAt)).fromNow()}`);
        } else if (nextQuestion.addInputToIntro === UserInput.NAME) {
            addPlayable(`${activeOrder.data.name}`);
        }

        addGathering(nextQuestion, activeOrder.id);
    }

    respond();
};
