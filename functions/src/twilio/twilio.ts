
import * as functions from 'firebase-functions';
import express, { urlencoded } from 'express';
import { interview } from './twilio-voice';

const appInbound = express();
appInbound.use(urlencoded({ extended: true }));
appInbound.post('/voice', interview);
appInbound.post('/voice/:responseId/gather/:questionIndex', interview);

export const inboundCallForRequest = functions.region('europe-west3').https.onRequest(appInbound);
