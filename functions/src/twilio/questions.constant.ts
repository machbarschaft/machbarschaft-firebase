import { Question, AnswerType, UserInput } from './question.model';
import { Type, Urgency } from './model/order.model';

export enum Playable {
    WELCOME_INTRO = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/hallo_Projekt.mp3",
    ASK_FOR_PRIVACY = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/datenschutz.mp3",

    ASK_FOR_TYPE = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/bittewaehlensie_Projekt.mp3",
    ASK_FOR_CAR = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/autonotwendig_Projekt.mp3",
    ASK_FOR_PRESCRIPTION = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/rezept_Projekt.mp3",
    ASK_FOR_URGENCY = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/wiedringend_Projekt.mp3",

    ALMOST_ACCOMPLISHED = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/fastgeschafft_Projekt.mp3",
    ASK_FOR_NAME = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/namen_Projekt.mp3",
    ASK_FOR_ADDRESS_HOUSE_NUMBER = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/hausnummer_Projekt.mp3",
    ASK_FOR_ADDRESS_STREET = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/strasse_Projekt.mp3",
    ASK_FOR_ADDRESS_ZIP = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/plz_Projekt.mp3",
    ASK_FOR_ADDRESS_CITY = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/ort_Projekt.mp3",

    GOT_ADDRESS = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/folgendeadresseerkannt_Projekt.mp3",
    ASK_FOR_ADDRESS_CHECK_UP = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/adresserichtig_Projekt.mp3",
    GOT_INVALID_ADDRESS = "Leider konnten wir die genannte Adresse nicht finden.",

    GOT_INCOMPLETE_ORDER = "Hallo, hier ist Lisa von Machbarschaft. Zu dieser Telefonnummer gibt es noch eine unvollständige Anfrage von",
    ASK_TO_RESUME_ORDER = "Wollen Sie Ihre Anfrage vervollständigen?",
    ORDER_RESUMED = "Okay, Sie können nun die übrigen Fragen beantworten.",
    GOT_OPEN_ORDER = "Hallo, hier ist Lisa von Machbarschaft. Zu dieser Telefonnummer gibt es noch eine offene Anfrage von",
    ASK_TO_KEEP_ORDER = "Wollen Sie die Anfrage löschen?",

    SUPPRESSED_PHONE_NUMBER = "Hallo, hier ist Lisa von Machbarschaft. Um ein Hilfegesuch zu erstelllen, benötigen wir Ihre Telefonnummer. Diese wird aktuell jedoch unterdrückt und ist uns nicht bekannt. Bitte ändern Sie die Einstellungen Ihres Telefons und versuchen Sie es erneut. Vielen Dank.",

    ORDER_DELETED = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/ok_Projekt.mp3",
    ORDER_KEEPED = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/allesklar_Projekt%20(online-audio-converter.com).mp3",

    MISUNDERSTOOD = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/nichtverstanden_Projekt.mp3",
    THANK_YOU_BYE = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/anfrageangenommen_Projekt_MitVerabschiedung.mp3",
    UNEXPECTED_PROBLEM = "https://storage.googleapis.com/mbs-prd-300213.appspot.com/twilio/konntenichtbearbeitetwerden_Projekt.mp3"
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
        index: OrderFlow.ASK_FOR_ADDRESS_STREET,
        announcementSource: Playable.ASK_FOR_ADDRESS_STREET,
        answerType: AnswerType.FREE_ANSWER
    },
    {
        index: OrderFlow.ASK_FOR_ADDRESS_HOUSE_NUMBER,
        announcementSource: Playable.ASK_FOR_ADDRESS_HOUSE_NUMBER,
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
        addInputToIntro: UserInput.CREATE_DATE_OPEN,
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
