//import { logger, LogLevel } from './logger.helper';
//import { OrderDao } from './model/order.dao';
import { OrderMeta } from '../model/order.model';
import * as https from "https";
import * as http from "http";
//import * as functions from 'firebase-functions';

export const sendOrderToColiveryAPI = async (order: OrderMeta): Promise<void> => {
    return new Promise((resolve, reject) => {
        //order.data.
        //https.request(options: string | https.RequestOptions | URL, callback?: ((res: IncomingMessage) => void) | undefined)
        const options = {
          hostname: 'davidschmidt.dev',
          port: 443,
          path: '/',
          method: 'GET'
        };

        const req = https.request(options, (res: http.IncomingMessage) => {
          console.log('statusCode:', res.statusCode);
          console.log('headers:', res.headers);

          res.on('data', (d) => {
            console.log(d.toString('utf8'));
          });
          res.on('end', () => {
              console.log("End");
              //resolve();
          });
        });

        req.on('error', (e) => {
          console.error(e);
        });
        req.end();

        const postData = JSON.stringify({msg: 'Hello World!'})

        const options1 = {
          hostname: 'postman-echo.com',
          port: 443,
          path: '/post',
          method: 'POST',
          headers: {
               'Content-Type': 'application/json',
               'Content-Length': postData.length
             }
        };

        const req1 = https.request(options1, (res) => {
          console.log('statusCode:', res.statusCode);
          console.log('headers:', res.headers);

          res.on('data', (d) => {
            console.log(d.toString('utf8'));
          });
          res.on('end', () => {
              console.log("End2");
              //resolve();
          });
        });

        req1.on('error', (e) => {
          console.error(e);
        });

        req1.write(postData);
        req1.end();

        resolve();
    });
};
