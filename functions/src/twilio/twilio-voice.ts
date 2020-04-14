
import VoiceResponse from 'twilio/lib/twiml/VoiceResponse';
import * as functions from 'firebase-functions';
import { OrderDao } from './model/order.dao';
import { Order, Type, Urgency, Location } from './model/order.model';
import { Playable, QUESTIONS, OrderFlow } from './questions.constant';
import { Question, AnswerType, UserInput } from './question.model';

export const interview = async (request: functions.Request, response: functions.Response) => {
    const phone_number: string = request.body.From;
    const input: string = request.body.RecordingUrl || request.body.Digits

    const responseId = request.params.responseId;
    const questionIndex = request.params.questionIndex;
    const speechResult = request.body.SpeechResult;

    console.log(JSON.stringify(request.body));
    console.log(`[PHONE_NUMBER ${phone_number} # INPUT ${input} # QUESTION_INDEX: ${questionIndex} # SPEECH_RESULT: '${speechResult}'] Incoming Call`);

    // TO DO: move basic twilio inputt check to other file
    if (!phone_number) {
        response.status(400).send(`Missing Caller ID`);
    }

    const twiml = new VoiceResponse();
    twiml.gather()

    const orderDao: OrderDao = OrderDao.init();

    // TO DO: move to helper class
    const addPlayable = (text: Playable) => {
        twiml.play({ loop: 1 }, text.toString());
    }

    // TO DO: move to helper class
    const addSay = (text: string) => {
        twiml.say({ language: 'de-DE', voice: 'Polly.Marlene' }, text);
    }

    // TO DO: move to helper class
    const addGathering = (q: Question) => {
        twiml.gather({
            input: [ 'speech' ],
            action: '/twilio-inboundCallForRequest/voice/' + order.id + '/gather/' + q.index,
            hints: q.answerType === AnswerType.YES_OR_NO ? 'ja, nein'
                : q.answerType === AnswerType.MULTIPLE && q.multipleAnswers ? Array.from(q.multipleAnswers?.keys()).join(",")
                    : undefined,
            language: 'de-DE',
            method: 'POST',
            profanityFilter: true
        }).play(q.announcementSource);
    }

    // TO DO: move to helper class
    const respond = () => {
        response.type('text/xml');
        response.send(twiml.toString());
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
        } else if (o.address === null) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_HOUSE_NUMBER);
        } else if (o.address && !o.address.street) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_STREET);
        } else if (o.address  && !o.address.zip) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_ZIP);
        } else if (o.address && !o.address.city) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_CITY);
        } else if (o.location === null) {
            return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_CHECK_UP);
        }

        return null;
    }

    if (responseId && questionIndex) {
        const question: Question | null = getQuestionByIndex(questionIndex);

        if (!question) {
            response.status(500).send(`NO QUESTION FOUND for ${questionIndex}`).end();
            return;
        }

        // TO DO: move to helper class
        // TO DO: optimise compare method
        const checkSpeechResult = (result: string, possibleAnswer: string): boolean => {
            return result.toLocaleLowerCase() === possibleAnswer.toLocaleLowerCase()
        };

        // TO DO: use Enum Type and Urgency as Key, outsource all Translations to constant
        // TO DO: specify language to choose based on caller language
        const translatedAnswers: { [ key: string ]: string } = {
            groceries: "einkaufen",
            medicine: "Apotheke",
            other: "einkaufen",
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
                        break;
                    case OrderFlow.ASK_FOR_ADDRESS_CHECK_UP:
                        // TO DO: GET ADDRESS FROM GOOGLE MAPS API
                        await orderDao.changeOrderById(responseId, { 'location': new Location(37.8324, 112.5584, 'ww8p1r4t8').parseToFirebaseDoc() });
                        break;
                }
            } catch (e) {
                console.error(`#ANSWER [PHONE_NUMBER ${phone_number} # ID ${responseId}] Error Updating Question`, e);
                response.status(500).send("ERROR UPDATING QUESTION").end();
            }
        }
    }

    // Find Current Order or Create New Order
    const order: { id: string, data: Order } = await orderDao.findOrCreateOrder(phone_number);
    console.log(`[PHONE_NUMBER ${order.data.phone_number} # ID ${order.id}] Found Order`, order);


    if (!order || !order.id || !order.data) {
        console.log(`[PHONE_NUMBER ${order.data.phone_number} # ID ${order.id}] Could not find or create order`);
        addPlayable(Playable.UNEXPECTED_PROBLEM);
        respond();
    }

    const nextQuestion: Question | null = spotNextQuestion(order.data);
    console.log(`[PHONE_NUMBER ${order.data.phone_number} # ID ${order.id}] Found Next Question Index`, nextQuestion?.index);

    if (!nextQuestion) {
        // TO DO: set status to open
        console.log(`[PHONE_NUMBER ${order.data.phone_number} # ID ${order.id}] Finished Order`);
        addPlayable(Playable.THANK_YOU_BYE);
        respond();
        return;
    }

    nextQuestion.introSources?.forEach((playable: Playable) => {
        addPlayable(playable);
    });

    if (nextQuestion.addInputToIntro === UserInput.ADDRESS) {
        addSay(`${order.data.address?.street} ${order.data.address?.house_number}, ${order.data.address?.zip} ${order.data.address?.city}`);
    } else if (nextQuestion.addInputToIntro === UserInput.NAME) {
        addSay(`${order.data.name}`);
    }

    addGathering(nextQuestion);

    console.log(`[PHONE_NUMBER ${order.data.phone_number} # ID ${order.id}] Twilio Commands`, twiml.toString());
    respond();
};
