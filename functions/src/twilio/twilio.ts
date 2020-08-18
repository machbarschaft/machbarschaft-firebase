
import * as functions from 'firebase-functions';
import express, { urlencoded } from 'express';
import { interview } from './twilio-voice';
import { lastChange } from './twilio-last-change';
//import { closedOrdersCheck } from './twilio-closed-orders-check';
//import { openOrdersCheck } from './twilio-open-orders-check';

const appInbound = express();
appInbound.use(urlencoded({ extended: true }));
appInbound.post('/voice', interview);
appInbound.post('/voice/:responseId/gather/:questionIndex', interview);

export const inboundCallForRequest = functions.region('europe-west3').https.onRequest(appInbound);
export const inboundCallForNinetyNineProblems = functions.region('europe-west3').https.onRequest(lastChange);

//export const outboundCallForClosedOrdersCheck = functions.region('europe-west3').pubsub.schedule('*/5 9-19 * * *').onRun(closedOrdersCheck);

//export const outboundCallForExpiredOrders = functions.region('europe-west3').pubsub.schedule('*/5 9-19 * * *').onRun(openOrdersCheck);
