import { Playable } from './questions.constant';

export class Question {
    constructor(
        public index: string,
        public announcementSource: Playable,
        public answerType: AnswerType,
        public introSources?: Playable[],
        public addInputToIntro?: UserInput,
        public multipleAnswers?: Map<string, Question[]> // if AnswerType is MULTIPLE
    ) { }
}

export enum AnswerType {
    YES_OR_NO = "yesno",
    MULTIPLE = "multiple",
    FREE_ANSWER = "free_answer"
}

export enum UserInput {
    ADDRESS = "address",
    CREATE_DATE = "create_Date",
    CREATE_DATE_OPEN = "create_Date_Open",
    NAME = "name"
}
