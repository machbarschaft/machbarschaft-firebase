import { OrderFlow, QUESTIONS } from '../questions.constant';
import { Question } from '../question.model';
import { Order, Type } from '../model/order.model';

export const getQuestionByIndex = (index: OrderFlow | string): Question | null => {
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

export const spotNextQuestion = (o: Order): Question | null => {
    if (!o.privacy_agreed) {
        return getQuestionByIndex(OrderFlow.ASK_FOR_PRIVACY);
    } else if (o.type === null) {
        return getQuestionByIndex(OrderFlow.ASK_FOR_TYPE);
    } else if (o.type === Type.GROCERIES && o.extras?.car_necessary === null) {
        return getQuestionByIndex(OrderFlow.ASK_FOR_EXTRA_GROCERIES);
    } else if (o.type === Type.MEDICINE && o.extras?.prescription === null) {
        return getQuestionByIndex(OrderFlow.ASK_FOR_EXTRA_MEDICINE);
    } else if (o.urgency === null) {
        return getQuestionByIndex(OrderFlow.ASK_FOR_URGENCY);
    } else if (o.name === null) {
        return getQuestionByIndex(OrderFlow.ASK_FOR_NAME);
    } else if (o.address && !o.address.zip) {
        return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_ZIP);
    } else if (o.address && !o.address.city) {
        return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_CITY);
    } else if (o.address && !o.address.street) {
        return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_STREET);
    } else if (o.address && !o.address.house_number) {
        return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_HOUSE_NUMBER);
    } else if (!o.location?.gps || !o.location?.geohash) {
        return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_RECHECK);
    } else if (o.address && !o.address.confirmed) {
        return getQuestionByIndex(OrderFlow.ASK_FOR_ADDRESS_CHECK_UP);
    }
    return null;
}