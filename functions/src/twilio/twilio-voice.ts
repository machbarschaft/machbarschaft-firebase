
import VoiceResponse, { GatherAttributes } from 'twilio/lib/twiml/VoiceResponse';
import * as functions from 'firebase-functions';
import { OrderDao } from './model/order.dao';
import { Order, Type, Urgency, Location, OrderStatus, OrderMeta } from './model/order.model';
import { Playable, QUESTIONS, OrderFlow } from './questions.constant';
import { Question, AnswerType, UserInput } from './question.model';
import { Client, GeocodeResponse, Status } from "@googlemaps/google-maps-services-js";
import { firestore } from 'firebase-admin';
import { encode } from 'ngeohash';
import moment from 'moment';
// tslint:disable-next-line:no-import-side-effect
import 'moment/locale/de';

export const interview = async (request: functions.Request, response: functions.Response) => {
    const phone_number: string = request.body.From;
    const call_sid: string = request.body.CallSid;
    const input: string = request.body.RecordingUrl || request.body.Digits

    const responseId = request.params.responseId;
    const questionIndex = request.params.questionIndex;
    const speechResult = request.body.SpeechResult;

    console.log(JSON.stringify(request.body));
    console.log(`IP ADDRESS - ${request.headers[ 'x-forwarded-for' ] || request.connection.remoteAddress}`);
    console.log(`[PHONE_NUMBER ${phone_number} # INPUT ${input} # QUESTION_INDEX: ${questionIndex} # SPEECH_RESULT: '${speechResult}'] Incoming Call`);

    const twiml = new VoiceResponse();
    const orderDao: OrderDao = OrderDao.init();

    moment.locale('de');

    // TO DO: move to helper class
    const getGeoPosByLocation = async (location: string): Promise<firestore.GeoPoint> => {
        return new Promise((resolve, reject) => {
            new Client({})
                .geocode({
                    params: {
                        address: location,
                        language: 'de_DE',
                        key: process.env.GOOGLE_GEO_API_KEY || ''
                    },
                    timeout: 5000
                }).then((r: GeocodeResponse) => {
                    console.log('getGeoPosByLocation', r.data);
                    if (r.data.status === Status.OK) {
                        resolve(new firestore.GeoPoint(
                            r.data.results[ 0 ].geometry.location.lat,
                            r.data.results[ 0 ].geometry.location.lng
                        ));
                    } else {
                        console.log(r.data.error_message);
                        reject();
                    }
                })
                .catch(e => {
                    reject(e);
                });
        });
    }

    const addPlayable = (text: Playable | string) => {
        if (text.startsWith('http')) {
            twiml.play({ loop: 1 }, text.toString());
        } else {
            twiml.say({ language: 'de-DE', voice: 'Polly.Marlene' }, text);
        }
    }

    const addGathering = (q: Question, orderId: string, maxSpeechTime: number = 3) => {
        const gatherAttributes: GatherAttributes = {
            input: [ 'speech' ],
            action: '/twilio-inboundCallForRequest/voice/' + orderId + '/gather/' + q.index,
            hints: q.answerType === AnswerType.YES_OR_NO ? 'ja, nein'
                : q.answerType === AnswerType.MULTIPLE && q.multipleAnswers ? Array.from(q.multipleAnswers?.keys()).join(",")
                    : undefined,
            language: 'de-DE',
            method: 'POST',
            speechTimeout: 'auto',
            maxSpeechTime: maxSpeechTime,
            profanityFilter: true
        };

        if (q.announcementSource.startsWith('http')) {
            twiml.gather(gatherAttributes).play(q.announcementSource);
        } else {
            twiml.gather(gatherAttributes).say({ language: 'de-DE', voice: 'Polly.Marlene' }, q.announcementSource);
        }
    }

    // TO DO: move to helper class
    const respond = () => {
        response.type('text/xml');
        response.send(twiml.toString()).end();
    }

    // TO DO: move to helper class
    const getQuestionByIndex = (index: OrderFlow | string): Question | null => {
        let next: Question | null = null;
        QUESTIONS.forEach((parQuestion: Question) => {
            if (parQuestion.index === index) {
                next = parQuestion;
            } else if (parQuestion.multipleAnswers) {
                Array.from(parQuestion.multipleAnswers.values()).forEach((questions: Question[]) => {
                    const possibleNext: Question | undefined = questions.find((q: Question) => q.index === index);
                    if (typeof possibleNext !== 'undefined') {
                        next = possibleNext;
                    }
                });
            }
        });
        return next;
    }

    // TO DO: move to helper class
    const spotNextQuestion = (o: Order): Question | null => {
        if (!o.privacy_agreed) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_PRIVACY);
        } else if (o.type === null) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_TYPE);
        } else if (o.type === Type.GROCERIES && o.extras === null) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_EXTRA_GROCERIES);
        } else if (o.type === Type.MEDICINE && o.extras === null) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_EXTRA_MEDICINE);
        } else if (o.urgency === null) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_URGENCY);
        } else if (o.name === null) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_NAME);
        } else if (o.address && !o.address.house_number) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_HOUSE_NUMBER);
        } else if (o.address && !o.address.street) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_STREET);
        } else if (o.address && !o.address.zip) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_ZIP);
        } else if (o.address && !o.address.city) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_CITY);
        } else if (!o.location?.gps || !o.location?.geohash) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_RECHECK);
        } else if (o.address && !o.address.confirmed) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_CHECK_UP);
        }
        return null;
    }

    // MODE: has answer from previous question
    if (responseId && questionIndex) {
        const question: Question | null = getQuestionByIndex(questionIndex);

        if (!question) {
            response.status(500).send(`NO QUESTION FOUND for ${questionIndex}`).end();
            return;
        }

        // TO DO: move to helper class
        // TO DO: optimise compare method
        const checkSpeechResult = (result: string, possibleAnswer: string): boolean => {
            return result.toLocaleLowerCase().indexOf(possibleAnswer.toLocaleLowerCase()) !== -1
        };

        // TO DO: use Enum Type and Urgency as Key, outsource all Translations to constant
        // TO DO: specify language to choose based on caller language
        const translatedAnswers: { [ key: string ]: string } = {
            groceries: "Einkaufen",
            medicine: "Apotheke",
            other: "andere",
            asap: "sehr dringend",
            today: "heute",
            tomorrow: "morgen"
        };

        let answer: string | boolean | Type | Urgency | null = null;

        switch (question.answerType) {
            case AnswerType.YES_OR_NO:
                if (checkSpeechResult(speechResult, 'ja')) {
                    answer = true;
                } else if (checkSpeechResult(speechResult, 'nein')) {
                    answer = false;
                }
                break;
            case AnswerType.MULTIPLE:
                answer = question.multipleAnswers ? Array.from(question.multipleAnswers.keys()).find((a: string) => checkSpeechResult(speechResult, translatedAnswers[ a ])) : speechResult;
                break;
            case AnswerType.FREE_ANSWER:
                answer = speechResult;
                break;
        }

        console.log(`#ANSWER [PHONE_NUMBER ${phone_number} # ID ${responseId}] AnswerType: ${question.answerType}, Answer: '${answer}'`);

        // no answer matches - ask again
        if (!answer) {
            addPlayable(Playable.MISUNDERSTOOD);
        } else {
            try {
                switch (question.index) {
                    case OrderFlow.ASK_FOR_OPEN_ORDER:
                        if (answer) {
                            await orderDao.deleteOrderById(responseId);
                            addPlayable(Playable.ORDER_DELETED);
                        } else {
                            addPlayable(Playable.ORDER_KEEPED);
                        }
                        respond();
                        break;
                    case OrderFlow.ASK_FOR_INCOMPLETE_ORDER:
                        if (answer) {
                            await orderDao.changeOrderById(responseId, { last_call_sid: call_sid });
                            addPlayable(Playable.ORDER_RESUMED);
                        } else {
                            await orderDao.deleteOrderById(responseId);
                            addPlayable(Playable.ORDER_DELETED);
                        }
                        break;
                    case OrderFlow.ASK_FOR_PRIVACY:
                        if (answer) {
                            await orderDao.changeOrderById(responseId, { privacy_agreed: true });
                        } else {
                            await orderDao.deleteOrderById(responseId);
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
                        break;
                    case OrderFlow.ASK_FOR_ADDRESS_STREET:
                        await orderDao.changeOrderById(responseId, { 'address.street': answer });
                        break;
                    case OrderFlow.ASK_FOR_ADDRESS_ZIP:
                        await orderDao.changeOrderById(responseId, { 'address.zip': answer });
                        break;
                    case OrderFlow.ASK_FOR_ADDRESS_CITY:
                        await orderDao.changeOrderById(responseId, { 'address.city': answer });

                        const currentOrder: Order = await orderDao.findOrderById(responseId);
                        console.log(`#ANSWER [PHONE_NUMBER ${phone_number} # ID ${responseId}] currentOrder for geo validation`, currentOrder);

                        if (currentOrder.address !== null) {
                            try {
                                const geoPoint = await getGeoPosByLocation(`${currentOrder.address.street} ${currentOrder.address.house_number},
                                    ${currentOrder.address.zip} ${currentOrder.address.city}, Deutschland`);
                                const geoHash: string = encode(geoPoint.latitude, geoPoint.longitude);
                                await orderDao.changeOrderById(responseId, { 'location': new Location(geoPoint, geoHash).parseToFirebaseDoc() });
                            } catch (e) {
                                console.error(`#ANSWER [PHONE_NUMBER ${phone_number} # ID ${responseId}] Error Validating Address`, e);
                            }
                        }

                        break;
                    case OrderFlow.ASK_FOR_ADDRESS_RECHECK:
                        if (!answer) {
                            await orderDao.changeOrderById(responseId, { 'address': null });
                        } else {
                            const currentOrderRecheck: Order = await orderDao.findOrderById(responseId);
                            console.log(`#ANSWER [PHONE_NUMBER ${phone_number} # ID ${responseId}] currentOrder for geo validation`, currentOrderRecheck);

                            if (currentOrderRecheck.address !== null) {
                                try {
                                    const geoPoint = await getGeoPosByLocation(`${currentOrderRecheck.address.zip} ${currentOrderRecheck.address.city}, Deutschland`);
                                    const geoHash: string = encode(geoPoint.latitude, geoPoint.longitude);
                                    await orderDao.changeOrderById(responseId, { 'address.confirmed': true, 'location': new Location(geoPoint, geoHash).parseToFirebaseDoc() });
                                } catch (e) {
                                    console.error(`#ANSWER [PHONE_NUMBER ${phone_number} # ID ${responseId}] Error Validating Address (ZIP and CITY)`, e);
                                }
                            }
                        }
                        break;
                    case OrderFlow.ASK_FOR_ADDRESS_CHECK_UP:
                        if (answer) {
                            await orderDao.changeOrderById(responseId, { 'address.confirmed': true });
                        } else {
                            await orderDao.changeOrderById(responseId, { 'address': null });
                        }
                        break;
                }
            } catch (e) {
                console.error(`#ANSWER [PHONE_NUMBER ${phone_number} # ID ${responseId}] Error Updating Question`, e);
                response.status(500).send("ERROR UPDATING QUESTION").end();
            }
        }
    }

    // Phone Number is suppressed
    if (!phone_number) {
        console.log(`[PHONE_NUMBER ${phone_number}] Phone Number Suppressed`);
        addPlayable(Playable.SUPPRESSED_PHONE_NUMBER);
        respond();
        return;
    }

    // Find Current Order or Create New Order
    const orders: OrderMeta[] = await orderDao.findOrCreateActiveOrdersByPhoneNumber(phone_number, call_sid);
    const ongoingOrder: OrderMeta | undefined = orders.find((o: OrderMeta) => o.data.status === OrderStatus.OPEN || o.data.status === OrderStatus.IN_PROGRESS);

    let nextQuestion: Question | null;
    let activeOrder: OrderMeta | undefined;

    if (typeof ongoingOrder !== 'undefined') {
        nextQuestion = getQuestionByIndex(OrderFlow.ASK_FOR_OPEN_ORDER);
        activeOrder = ongoingOrder;
    } else {
        activeOrder = orders.find((o: OrderMeta) => o.data.status === OrderStatus.INCOMPLETE);
        nextQuestion = activeOrder ? spotNextQuestion(activeOrder.data) : null;

        // ASK TO COMPLETE INCOMPLETE ORDER
        if (activeOrder && activeOrder.data.last_call_sid !== call_sid) {
            console.log(`[PHONE_NUMBER ${phone_number}] CALL SID are not equal: ${activeOrder.data.last_call_sid} - ${call_sid}`);
            nextQuestion = getQuestionByIndex(OrderFlow.ASK_FOR_INCOMPLETE_ORDER);
        }
    }

    if (!activeOrder || !activeOrder.id || !activeOrder.data) {
        console.log(`[PHONE_NUMBER ${phone_number}] Could not find or create any order`);
        addPlayable(Playable.UNEXPECTED_PROBLEM);
        respond();
        return;
    }

    console.log(`[PHONE_NUMBER ${activeOrder && activeOrder.data.phone_number} # ID ${activeOrder && activeOrder.id}] Found Order`, activeOrder);
    console.log(`[PHONE_NUMBER ${activeOrder.data.phone_number} # ID ${activeOrder.id}] Found Next Question Index`, nextQuestion?.index);

    if (!nextQuestion) {
        console.log(`[PHONE_NUMBER ${activeOrder.data.phone_number} # ID ${activeOrder.id}] Finished Order`);
        await orderDao.changeOrderById(activeOrder.id, { status: OrderStatus.OPEN.toString() });
        addPlayable(Playable.THANK_YOU_BYE);
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
    } else if (nextQuestion.addInputToIntro === UserInput.NAME) {
        addPlayable(`${activeOrder.data.name}`);
    }

    addGathering(nextQuestion, activeOrder.id);

    console.log(`[PHONE_NUMBER ${activeOrder.data.phone_number} # ID ${activeOrder.id}] Twilio Commands`, twiml.toString());
    respond();
};
