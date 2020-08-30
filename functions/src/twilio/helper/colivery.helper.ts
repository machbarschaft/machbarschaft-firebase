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
      port: functions.config().colivery.port,
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
      port: functions.config().colivery.port,
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

export const sendOrderToColiveryAPI = async (order: OrderMeta): Promise<string> => {
    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }
      
    return new Promise(async (resolve, reject) => {
      console.log("In sendOrderToColiveryAPI");
      const helpSeekerID = await createOrGetUser(order);
      if(helpSeekerID && helpSeekerID.length > 0){
        console.log("helpSeekerID: "+JSON.stringify(helpSeekerID));
        const hrRes = createHelpRequest(order, helpSeekerID);
        console.log("hrRes: "+hrRes);

        resolve(order.id);
      }
      else{
        reject("Something went wrong!");
      }
    });
    
};

export const authHotline = async (): Promise<string> => {
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
      resolve(await result.user.getIdToken());
    }
    else{
      console.error("Could not get hotline token!");
      reject("Could not get hotline token!");
    }
  });
}

export const authHotlineUser = async (phoneNumber: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const result = await firebase.auth().signInWithEmailAndPassword(phoneNumber+"@machbarschaft.jetzt", phoneNumber)
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
      resolve(await result.user.getIdToken());
    }
    else{
      console.error("Could not get hotline user token!");
      reject("Could not get hotline user token!");
    }
  });
}

export const createHotlineUser = async (phoneNumber: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    const result = await firebase.auth().createUserWithEmailAndPassword(phoneNumber+"@machbarschaft.jetzt", phoneNumber)
      .catch(function(error) {
        console.log(error);
      });
    if(result && result.user){
      resolve(await result.user.getIdToken());
    }
    else{
      console.error("Could not create hotline user!");
      reject("Could not create hotline user!");
    }
  });
}

export const getUser = async (phoneNumber: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    authHotline().then(async (token: string) => {
      console.log("token: "+token);

      const userDataRes = await coliveryGetApiCall(
        '/v1/user/search', 
        token.toString(), 
        {
          "phoneNumber": phoneNumber
        });

      resolve(userDataRes);      
    }).catch((reason: any) => {
      reject("Could not get token!");
    });
  });
}

export const getHelpSeeker = async (phoneNumber: string): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    authHotline().then(async (token: string) => {
      console.log("token: "+token);

      const hsDataRes = await coliveryGetApiCall(
        '/v1/help-seeker/search', 
        token.toString(), 
        {
          "phoneNumber": phoneNumber
        });

      resolve(hsDataRes);      
    }).catch((reason: any) => {
      reject("Could not get token!");
    });
  });
}

export const createUser = async (order: OrderMeta): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    createHotlineUser(order.data.phone_number).then(async (token: string) => {
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
      const hsRes = await createHelpSeekerToken(order.data.phone_number, order.data.name || '', token.toString());
      console.log("HS result: "+hsRes);
      resolve(hsRes);
    }).catch((reason: any) => {
      reject("Could not get token!");
    });
  });
}

export const createHelpSeekerToken = async (phoneNumber: string, name: string, token: string): Promise<string> => {
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

export const createHelpSeeker = async (phoneNumber: string, name: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {  
    authHotlineUser(phoneNumber).then(async (token: string) => {
      const createDataRes = await createHelpSeekerToken(phoneNumber, name, token);
      resolve(createDataRes);
    }).catch((reason: any) => {
      reject("Could not get token!");
    });
  });
}

export const createOrGetUser = async (order: OrderMeta): Promise<any> => {
  return new Promise(async (resolve, reject) => {
    const userResult = await getUser(order.data.phone_number);
    console.log(userResult);
    if(userResult && userResult.length > 0){//user exists
      const userData = JSON.parse(userResult);
      if(userData && userData.id){
        logger(order.data.phone_number, '', 'User has ID '+userData.id);
        const hsResult = await getHelpSeeker(order.data.phone_number);
        if(hsResult && hsResult.length > 0){//help seeker exists
          const hsData = JSON.parse(hsResult);
          if(hsData && hsData.id){
            logger(order.data.phone_number, '', 'Help seeker has ID '+hsData.id);
            resolve(hsData.id);
          }
        }
        else{//help seeker does not exist
          const createResult = await createHelpSeeker(order.data.phone_number, order.data.name || '');
          if(createResult && createResult && createResult.length > 0){
            const createData = JSON.parse(createResult);
            if(createData && createData.id){
              resolve(createData.id);
            }
            else {
              reject("Could not create help seeker! Respone malformed.");
            }
          }
          else {
            reject("Could not create help seeker! Response empty.");
          }
        }
      }
      else {
        logger(order.data.phone_number, '', 'Returned userdata malformed, trying to create user. Returned data: '+userResult);
        const createResult = await createUser(order);//creates user and help seeker, returns help seeker data
        if(createResult && createResult.length > 0){
          const createData = JSON.parse(createResult);
          if(createData && createData.id){
            resolve(createData.id);
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
      if(createResult && createResult && createResult.length > 0){
        const createData = JSON.parse(createResult);
        if(createData && createData.id){
          resolve(createData.id);
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

export const createHelpString = (order: OrderMeta): string => {
  let ret = "";
  ret += "Typ: "+order.data.type+", ";
  ret += "Auto notwendig: "+(order.data.extras?.car_necessary ? "ja" : "nein")+", ";
  ret += "Rezept notwendig: "+(order.data.extras?.prescription ? "ja" : "nein")+", ";
  ret += "Dringlichkeit: "+order.data.urgency+", ";
  ret += "Erstellt am: "+order.data.created+", ";

  return ret;
}

export const createHelpRequest = async (order: OrderMeta, helpSeekerID: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {  
    authHotlineUser(order.data.phone_number).then(async (token: string) => {
      const createHRData = JSON.stringify({
        helpSeeker: helpSeekerID,
        requestText: createHelpString(order),
        requestStatus: 'OPEN'
      });

      const createDataRes = await coliveryPostApiCall('/v1/help-request', token.toString(), createHRData);
      resolve(createDataRes);
    }).catch((reason: any) => {
      reject("Could not get token!");
    });
  });
}