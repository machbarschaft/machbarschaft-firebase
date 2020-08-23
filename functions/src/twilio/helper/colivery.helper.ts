//import { logger, LogLevel } from './logger.helper';
//import { OrderDao } from './model/order.dao';
import { OrderMeta } from '../model/order.model';
import * as https from "https";
//import * as http from "http";
import * as functions from 'firebase-functions';
import * as firebase from 'firebase';
import * as url from 'url';
import { logger } from './logger.helper';
//import * as util from 'util'
const firebaseConfig = {
  apiKey: functions.config().fire.apikey,
  authDomain: functions.config().fire.authdomain,
  databaseURL: functions.config().fire.databaseurl,
  projectId: functions.config().fire.projectid,
  storageBucket: functions.config().fire.storagebucket,
  messagingSenderId: functions.config().fire.messagingsenderid,
  appId: functions.config().fire.appid,
  measurementId: functions.config().fire.measurementid
};

export const coliveryPostApiCall = async (path: string, token: string, jsonData: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const createUserOptions = {
      hostname: functions.config().colivery.host,
      port: 443,
      path: path,
      method: 'POST',
      headers: {
           'Content-Type': 'application/json',
           'Content-Length': jsonData.length,
           'Authorization': 'Bearer '+token
         }
    };

    let resStr = "";

    const req = https.request(createUserOptions, (res) => {
      console.log('statusCode:', res.statusCode);
      console.log('headers:'+ JSON.stringify(res.headers,null,0));
      //console.log("RES: "+util.inspect(res));

      res.on('data', (d) => {
        resStr += d.toString('utf8');
      });
      res.on('end', () => {
          console.log(resStr);
          console.log("EndPOST");
          resolve(resStr);
      });
    });

    req.on('error', (e) => {
      console.error(e);
      reject(e);
    });
    console.log("POSTED DATA: "+jsonData);
    req.write(jsonData);
    req.end();
  });
}

export const coliveryGetApiCall = async (path: string, token: string, jsonData: any): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const requestUrl = url.parse(url.format({
      protocol: 'https',
      hostname: functions.config().colivery.host,
      pathname: path,
      query: jsonData || {}
    }));
    console.log("PATH: "+requestUrl.path);

    const searchUserOptions = {
      hostname: requestUrl.hostname,
      port: 443,
      path: requestUrl.path,
      method: 'GET',
      headers: {
        'Authorization': 'Bearer '+token.toString()
      }
    };

    let resStr = "";

    const req = https.request(searchUserOptions, (res) => {
      console.log('statusCode:', res.statusCode);
      console.log('headers:'+ JSON.stringify(res.headers,null,0));

      res.on('data', (d) => {
        resStr += d.toString('utf8');
        //console.log(d.toString('utf8'));
      });
      res.on('end', () => {
          console.log(resStr);
          console.log("EndGET");
          resolve(resStr);
      });
    });

    req.on('error', (e) => {
      console.error(e);
      reject(e);
    });
    req.end();
  });
}

export const sendOrderToColiveryAPI = async (order: OrderMeta): Promise<void> => {
    //console.log("1 "+JSON.stringify(functions.config()));
    /*const config = functions.config().firebase;
    config.apiKey = functions.config().fire.apikey;
    console.log("Conf: "+JSON.stringify(config));*/
    firebase.initializeApp(firebaseConfig);
    
    

      const createUserData = JSON.stringify({
          firstName: '',
          lastName: '',
          street: '',
          streetNo: '',
          zipCode: '12345',
          city: 'Entenhausen',
          email: '',
          location: {
          longitude: 0,
          latitude: 0
          },
          phone: '+49123456789',
          source: 'HOTLINE'
      });

      const createUserOptions = {
        hostname: 'service-api-ng-nightly-gttzwulpia-ew.a.run.app',
        port: 443,
        path: '/v1/user',
        method: 'POST',
        headers: {
             'Content-Type': 'application/json',
             'Content-Length': createUserData.length,
             'Authorization': 'Bearer '+token.toString()
           }
      };

      let data1 = "";

      const req1 = https.request(createUserOptions, (res) => {
        console.log('statusCode:', res.statusCode);
        console.log('headers:'+ JSON.stringify(res.headers,null,0));
        //console.log("RES: "+util.inspect(res));

        res.on('data', (d) => {
          data1 += d.toString('utf8');
        });
        res.on('end', () => {
            console.log(data1+" End2");
            //resolve();
        });
      });

      req1.on('error', (e) => {
        console.error(e);
      });
      console.log("POSTED DATA: "+createUserData);
      req1.write(createUserData);
      req1.end();
      
      return new Promise((resolve, reject) => {
          /*const getData = JSON.stringify({
            "phoneNumber": order.data.phone_number.toString()
          });*/
          /*const requestUrl = url.parse(url.format({
            protocol: 'https',
            hostname: 'service-api-ng-nightly-gttzwulpia-ew.a.run.app',
            pathname: '/v1/user/search',
            query: {
              phoneNumber: order.data.phone_number.toString()
            }
          }));
          console.log("PATH: "+requestUrl.path);

          const options = {
            hostname: requestUrl.hostname,
            port: 443,
            path: requestUrl.path,
            method: 'GET',
            headers: {
              //'Content-Type': 'application/json',
              //'Content-Length': getData.length,
              'Authorization': 'Bearer '+token.toString()
            }
          };

          let resStr = "";

          const req = https.request(options, (res: http.IncomingMessage) => {
            console.log('statusCode:', res.statusCode);
            //console.log('headers:', res.headers);

            res.on('data', (d) => {
              resStr += d.toString('utf8');
              //console.log(d.toString('utf8'));
            });
            res.on('end', () => {
                console.log(resStr);
                console.log("End");
                resolve();
            });
          });

          req.on('error', (e) => {
            console.error(e);
          });
          //req.write(getData);
          req.end();*/
          

          //order.data.
          //https.request(options: string | https.RequestOptions | URL, callback?: ((res: IncomingMessage) => void) | undefined)
          /*const options = {
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
          req1.end();*/

          resolve();
      });
    
};

export const getUser = async (phoneNumber: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    const result = await firebase.auth().signInWithEmailAndPassword(functions.config().fbauth.mail || '', functions.config().fbauth.pw || '')
      .catch(function(error) {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
          console.error('Wrong password.');
        } else {
          console.error(errorMessage);
        }
        console.log(error);
      });
      if(result && result.user){
        const token = await result.user.getIdToken();
        console.log("token: "+token);

        const userDataRes = await coliveryGetApiCall(
          '/v1/user/search', 
          token.toString(), 
          {
            "phoneNumber": phoneNumber
          });

        resolve({
          data: userDataRes,
          authToken: token.toString()
        });
        
        /*const requestUrl = url.parse(url.format({
          protocol: 'https',
          hostname: functions.config().colivery.host,
          pathname: '/v1/user/search',
          query: {
            "phoneNumber": phoneNumber
          }
        }));
        console.log("PATH: "+requestUrl.path);

        const searchUserOptions = {
          hostname: requestUrl.hostname,
          port: 443,
          path: requestUrl.path,
          method: 'GET',
          headers: {
            'Authorization': 'Bearer '+token.toString()
          }
        };

        let resStr = "";

        const req = https.request(searchUserOptions, (res) => {
          console.log('statusCode:', res.statusCode);
          //console.log('headers:', res.headers);

          res.on('data', (d) => {
            resStr += d.toString('utf8');
            //console.log(d.toString('utf8'));
          });
          res.on('end', () => {
              console.log(resStr);
              console.log("End");
              resolve(resStr);
          });
        });

        req.on('error', (e) => {
          console.error(e);
        });
        //req.write(getData);
        req.end();*/
        
      }
      else{
        return reject("Could not get token!");
      }
  });
}

export const createUser = async (order: OrderMeta): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    const result = await firebase.auth().signInAnonymously()
      .catch(function(error) {
        // Handle Errors here.
        const errorCode = error.code;
        const errorMessage = error.message;
        if (errorCode === 'auth/wrong-password') {
          console.error('Wrong password.');
        } else {
          console.error(errorMessage);
        }
        console.log(error);
      });
      if(result && result.user){
        const token = await result.user.getIdToken();
        console.log("token: "+token);

        const createUserData = JSON.stringify({
            firstName: order.data.name || '',
            lastName: '',
            street: order.data.address?.street || '',
            streetNo: order.data.address?.house_number || '',
            zipCode: order.data.address?.zip || '',
            city: order.data.address?.city || '',
            email: '',
            location: {
            longitude: order.data.location?.gps?.longitude || 0,
            latitude: order.data.location?.gps?.latitude || 0
            },
            phone: order.data.phone_number || '',
            source: 'HOTLINE'
        });

        const createDataRes = await coliveryPostApiCall('/v1/user', token.toString(), createUserData);
        console.log("Created user, result: "+createDataRes);
        const hsRes = await createHelpSeeker(order.data.phone_number, order.data.name || '', token.toString());
        console.log("HS result: "+hsRes);
        resolve({
          dataCU: createDataRes,
          dataHS: hsRes,
          authToken: token.toString()
        });

        /*const createUserOptions = {
          hostname: functions.config().colivery.host,
          port: 443,
          path: '/v1/user',
          method: 'POST',
          headers: {
               'Content-Type': 'application/json',
               'Content-Length': createUserData.length,
               'Authorization': 'Bearer '+token.toString()
             }
        };

        let resStr = "";

        const req = https.request(createUserOptions, (res) => {
          console.log('statusCode:', res.statusCode);
          console.log('headers:'+ JSON.stringify(res.headers,null,0));
          //console.log("RES: "+util.inspect(res));

          res.on('data', (d) => {
            resStr += d.toString('utf8');
          });
          res.on('end', () => {
              console.log(resStr+" End2");
              resolve(resStr);
          });
        });

        req.on('error', (e) => {
          console.error(e);
        });
        console.log("POSTED DATA: "+createUserData);
        req.write(createUserData);
        req.end();*/
      }
      else{
        return reject("Could not get token!");
      }
  });
}

export const createHelpSeeker = async (phoneNumber: string, name: string, token: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {   
    const createHSData = JSON.stringify({
      fullName: name,
      phone: phoneNumber,
      source: 'HOTLINE'
    });

    const createDataRes = await coliveryPostApiCall('/v1/help-seeker', token.toString(), createHSData);
    resolve(createDataRes);
  });
}

export const createOrGetUser = async (order: OrderMeta): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    const userResult = await getUser(order.data.phone_number);
    if(userResult && userResult.data && userResult.data.length > 0){//user exists
      const userData = JSON.parse(userResult.data);
      if(userData && userData.id){
        logger(order.data.phone_number, '', 'User has ID '+userData.id);
        resolve({
          userID: userData.id,
          authToken: userResult.authToken
        });
      }
      else {
        logger(order.data.phone_number, '', 'Returned userdata malformed, trying to create user. Returned data: '+userResult);
        const createResult = await createUser(order);
        if(createResult && createResult.dataCU && createResult.dataCU.length > 0){
          const createData = JSON.parse(createResult.dataCU);
          if(createData && createData.id){
            resolve({
              userID: createData.id,
              authToken: createResult.authToken
            });
          }
          else {
            reject("Could not create user! Respone malformed.");
          }
        }
        else {
          reject("Could not create user! Response empty.");
        }
      }
    }
    else {//user does not exist
      logger(order.data.phone_number, '', 'User does not exist, trying to create user.');
      const createResult = await createUser(order);
      if(createResult && createResult.dataCU && createResult.dataCU.length > 0){
        const createData = JSON.parse(createResult.dataCU);
        if(createData && createData.id){
          resolve({
            userID: createData.id,
            authToken: createResult.authToken
          });
        }
        else {
          reject("Could not create user! Respone malformed.");
        }
      }
      else {
        reject("Could not create user! Response empty.");
      }
    }
  });
}

export const createHelpRequest = async (order: OrderMeta, user: any, token: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {   
    const createHSData = JSON.stringify({
      fullName: name,
      phone: phoneNumer,
      source: 'HOTLINE'
    });

    const createDataRes = await coliveryPostApiCall('/v1/help-seeker', token.toString(), createHSData);
    resolve(createDataRes);
  });
}