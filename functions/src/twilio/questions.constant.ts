import { Question, AnswerType, UserInput } from './question.model';
import { Type, Urgency } from './model/order.model';

export enum Playable {
    WELCOME_INTRO = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fhallo_Projekt.mp3?alt=media&token=227cb4e4-c2ea-4646-ba47-878d7cbf2211",
    ASK_FOR_PRIVACY = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fdatenschutz.mp3?alt=media&token=06a5b310-5c25-4afe-a980-ee191186d5fc",

    ASK_FOR_TYPE = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fbittewaehlensie_Projekt.mp3?alt=media&token=24a6abb2-f337-42f8-b211-37d89154911f",
    ASK_FOR_CAR = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fautonotwendig_Projekt.mp3?alt=media&token=bbcb08ec-21ae-4e96-87dc-2966b88e5a71",
    ASK_FOR_PRESCRIPTION = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Frezept_Projekt.mp3?alt=media&token=b2d1a5c0-a539-4544-af7e-34bd3fb4a761",
    ASK_FOR_URGENCY = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fwiedringend_Projekt.mp3?alt=media&token=7c5cf37d-a493-4b88-97d9-1d9d978cb35e",

    ALMOST_ACCOMPLISHED = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Ffastgeschafft_Projekt.mp3?alt=media&token=480c5075-beef-4d5f-8538-9bf8637df562",
    ASK_FOR_NAME = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fnamen_Projekt.mp3?alt=media&token=53eeacbf-5a19-4698-bd8c-560ceeaa34a7",
    ASK_FOR_ADDRESS_HOUSE_NUMBER = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fhausnummer_Projekt.mp3?alt=media&token=7324a033-edf4-4158-b469-8ca93f819d44",
    ASK_FOR_ADDRESS_STREET = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fstrasse_Projekt.mp3?alt=media&token=a4bd64b0-c8a7-40ac-b251-602d1de4745f",
    ASK_FOR_ADDRESS_ZIP = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fplz_Projekt.mp3?alt=media&token=d6f12bf0-9f71-44da-9351-76ea180f2f74",
    ASK_FOR_ADDRESS_CITY = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fort_Projekt.mp3?alt=media&token=b6a08b88-6baa-461f-af11-aeb48d189666",

    GOT_ADDRESS = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Ffolgendeadresseerkannt_Projekt.mp3?alt=media&token=075faac2-ef6d-4c51-86a9-2e73cf76ee53",
    ASK_FOR_ADDRESS_CHECK_UP = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fadresserichtig_Projekt.mp3?alt=media&token=5c2c5202-7d05-4305-bf3d-f22a89bf5cf8",
    GOT_INVALID_ADDRESS = "Leider konnten wir die genannte Adresse nicht finden.",

    GOT_INCOMPLETE_ORDER = "Hallo, hier ist Lisa von Machbarschaft. Zu dieser Telefonnummer gibt es noch eine unvollständige Anfrage von",
    ASK_TO_RESUME_ORDER = "Wollen Sie Ihre Anfrage vervollständigen?",
    ORDER_RESUMED = "Okay, Sie können nun die übrigen Fragen beantworten.",
    GOT_OPEN_ORDER = "Hallo, hier ist Lisa von Machbarschaft. Zu dieser Telefonnummer gibt es noch eine offene Anfrage von",
    ASK_TO_KEEP_ORDER = "Wollen Sie die Anfrage löschen?",

    SUPPRESSED_PHONE_NUMBER = "Hallo, hier ist Lisa von Machbarschaft. Um ein Hilfegesuch zu erstelllen, benötigen wir Ihre Telefonnummer. Diese wird aktuell jedoch unterdrückt und ist uns nicht bekannt. Bitte ändern Sie die Einstellungen Ihres Telefons und versuchen Sie es erneut. Vielen Dank.",

    ORDER_DELETED = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fok_Projekt.mp3?alt=media&token=b546677c-59dd-4826-8ebf-88333f52bb13",
    ORDER_KEEPED = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fallesklar_Projekt%20(online-audio-converter.com).mp3?alt=media&token=f251d6a9-e2f9-4365-b1fb-966095ea19e1",

    MISUNDERSTOOD = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fnichtverstanden_Projekt.mp3?alt=media&token=24b2c191-55c6-4933-a861-92f84bf7f930",
    THANK_YOU_BYE = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fanfrageangenommen_Projekt.mp3?alt=media&token=5ad72d1a-7188-4bb4-b6f7-e29f51bc154d",
    UNEXPECTED_PROBLEM = "https://firebasestorage.googleapis.com/v0/b/einanrufhilft-95d29.appspot.com/o/twilio%2Fkonntenichtbearbeitetwerden_Projekt.mp3?alt=media&token=4c5c7e4c-ebf6-4cd5-8d76-970837d2bccd"
}

export enum OrderFlow {
    ASK_FOR_PRIVACY = "intro_privacy",
    ASK_FOR_TYPE = "ask_for_type",
    ASK_FOR_EXTRA_GROCERIES = "ask_for_extra_groceries",
    ASK_FOR_EXTRA_MEDICINE = "ask_for_extra_medicine",
    ASK_FOR_URGENCY = "ask_for_urgency",
    ASK_FOR_NAME = "ask_for_name",
    ASK_FOR_ADDRESS_HOUSE_NUMBER = "ask_for_address_house_number",
    ASK_FOR_ADDRESS_STREET = "ask_for_address_street",
    ASK_FOR_ADDRESS_ZIP = "ask_for_address_zip",
    ASK_FOR_ADDRESS_CITY = "ask_for_address_city",
    ASK_FOR_ADDRESS_CHECK_UP = "ask_for_address_check_up",
    ASK_FOR_ADDRESS_RECHECK = "ask_for_address_recheck",
    ASK_FOR_OPEN_ORDER = "ask_for_open_order",
    ASK_FOR_INCOMPLETE_ORDER = "ask_for_incomplete_order",
}

export const QUESTIONS: Question[] = [
    {
        index: OrderFlow.ASK_FOR_PRIVACY,
        introSources: [ Playable.WELCOME_INTRO ],
        announcementSource: Playable.ASK_FOR_PRIVACY,
        answerType: AnswerType.YES_OR_NO
    },
    {
        index: OrderFlow.ASK_FOR_TYPE,
        announcementSource: Playable.ASK_FOR_TYPE,
        answerType: AnswerType.MULTIPLE,
        multipleAnswers: new Map(
            [
                [ Type.GROCERIES, [ {
                    index: OrderFlow.ASK_FOR_EXTRA_GROCERIES,
                    announcementSource: Playable.ASK_FOR_CAR,
                    answerType: AnswerType.YES_OR_NO
                } ]
                ],
                [ Type.MEDICINE, [ {
                    index: OrderFlow.ASK_FOR_EXTRA_MEDICINE,
                    announcementSource: Playable.ASK_FOR_PRESCRIPTION,
                    answerType: AnswerType.YES_OR_NO
                } ]
                ],
                [ Type.OTHER, [] ]
            ]
        )
    }, {
        index: OrderFlow.ASK_FOR_URGENCY,
        announcementSource: Playable.ASK_FOR_URGENCY,
        answerType: AnswerType.MULTIPLE,
        multipleAnswers: new Map(
            [
                [ Urgency.ASAP, [] ],
                [ Urgency.TODAY, [] ],
                [ Urgency.TOMORROW, [] ]
            ]
        )
    },
    {
        index: OrderFlow.ASK_FOR_NAME,
        introSources: [ Playable.ALMOST_ACCOMPLISHED ],
        announcementSource: Playable.ASK_FOR_NAME,
        answerType: AnswerType.FREE_ANSWER
    },
    {
        index: OrderFlow.ASK_FOR_ADDRESS_HOUSE_NUMBER,
        announcementSource: Playable.ASK_FOR_ADDRESS_HOUSE_NUMBER,
        answerType: AnswerType.FREE_ANSWER
    },
    {
        index: OrderFlow.ASK_FOR_ADDRESS_STREET,
        announcementSource: Playable.ASK_FOR_ADDRESS_STREET,
        answerType: AnswerType.FREE_ANSWER
    },
    {
        index: OrderFlow.ASK_FOR_ADDRESS_ZIP,
        announcementSource: Playable.ASK_FOR_ADDRESS_ZIP,
        answerType: AnswerType.FREE_ANSWER
    },
    {
        index: OrderFlow.ASK_FOR_ADDRESS_CITY,
        announcementSource: Playable.ASK_FOR_ADDRESS_CITY,
        answerType: AnswerType.FREE_ANSWER
    },
    {
        index: OrderFlow.ASK_FOR_ADDRESS_CHECK_UP,
        introSources: [ Playable.GOT_ADDRESS ],
        addInputToIntro: UserInput.ADDRESS,
        announcementSource: Playable.ASK_FOR_ADDRESS_CHECK_UP,
        answerType: AnswerType.YES_OR_NO
    },
    {
        index: OrderFlow.ASK_FOR_ADDRESS_RECHECK,
        introSources: [ Playable.GOT_INVALID_ADDRESS ],
        addInputToIntro: UserInput.ADDRESS,
        announcementSource: Playable.ASK_FOR_ADDRESS_CHECK_UP,
        answerType: AnswerType.YES_OR_NO
    },
    {
        index: OrderFlow.ASK_FOR_OPEN_ORDER,
        introSources: [ Playable.GOT_OPEN_ORDER ],
        addInputToIntro: UserInput.CREATE_DATE,
        announcementSource: Playable.ASK_TO_KEEP_ORDER,
        answerType: AnswerType.YES_OR_NO
    },
    {
        index: OrderFlow.ASK_FOR_INCOMPLETE_ORDER,
        introSources: [ Playable.GOT_INCOMPLETE_ORDER ],
        addInputToIntro: UserInput.CREATE_DATE,
        announcementSource: Playable.ASK_TO_RESUME_ORDER,
        answerType: AnswerType.YES_OR_NO
    },
];
