import * as functions from 'firebase-functions';
import VoiceResponse, { SayLanguage } from 'twilio/lib/twiml/VoiceResponse';
import { Playable } from './questions.constant';
export const lastChange = async (request: functions.Request, response: functions.Response) => {
    const twilioLanguage: SayLanguage = 'de-DE';
    const twiml = new VoiceResponse();

    const addPlayable = (text: Playable | string) => {
        if (text.startsWith('http')) {
            twiml.play({ loop: 1 }, text.toString());
        } else {
            twiml.say({ language: twilioLanguage, voice: 'Polly.Marlene' }, text);
        }
    }

    addPlayable(Playable.UNEXPECTED_PROBLEM);

    response.type('text/xml');
    response.send(twiml.toString()).end();
};