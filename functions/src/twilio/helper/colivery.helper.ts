//import { logger, LogLevel } from './logger.helper';
//import { OrderDao } from './model/order.dao';
import * as om from '../model/order.model';
import * as https from "https";
//import * as http from "http";
import * as functions from 'firebase-functions';
import * as firebase from 'firebase';
import * as url from 'url';
import { logger } from './logger.helper';

import * as crypto from 'crypto';
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

function checksum(str: string) {//, algorithm, encoding
  let res = str;
  res = functions.config().pepper.pre + res + functions.config().pepper.post;
  return crypto
    .createHash('sha256')
    .update(res, 'utf8')
    .digest('hex');
}

export const coliveryPutApiCall = async (path: string, token: string, jsonData: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    console.log("PATH PUT: "+path);
    const createUserOptions = {
      hostname: functions.config().colivery.host,
      port: functions.config().colivery.port,
      path: path,
      method: 'PUT',
      headers: {
           'Content-Type': 'application/json; charset=utf-8',
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
          console.log("EndPUT");
          resolve(resStr);
      });
    });

    req.on('error', (e) => {
      console.error(e);
      reject(e);
    });
    console.log("PUTTED DATA: "+jsonData);
    req.write(jsonData);
    req.end();
  });
}

export const coliveryPostApiCall = async (path: string, token: string, jsonData: string): Promise<string> => {
  return new Promise(async (resolve, reject) => {
    console.log("PATH POST: "+path);
    const createUserOptions = {
      hostname: functions.config().colivery.host,
      port: functions.config().colivery.port,
      path: path,
      method: 'POST',
      headers: {
           'Content-Type': 'application/json; charset=utf-8',
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
    console.log("PATH GET: "+requestUrl.hostname+requestUrl.path);

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
          console.log("GET length: "+resStr.length.toString());
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

export const sendOrderToColiveryAPI = async (order: om.OrderMeta): Promise<string> => {
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
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
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
      console.log("Authed firebase hotline: "+functions.config().fbauth.mail+" "+await result.user.getIdToken());
      resolve(await result.user.getIdToken());
    }
    else{
      console.error("Could not get hotline token!");
      reject("Could not get hotline token!");
    }
  });
}

export const authHotlineUser = async (phoneNumber: string): Promise<string> => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return new Promise(async (resolve, reject) => {
    const result = await firebase.auth().signInWithEmailAndPassword(phoneNumber+"@machbarschaft.jetzt", checksum(phoneNumber))
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
      console.log("Authed firebase hotline user: "+phoneNumber+"@machbarschaft.jetzt"+" pw: "+checksum(phoneNumber)+" "+await result.user.getIdToken());
      resolve(await result.user.getIdToken());
    }
    else{
      console.error("Could not get hotline user token for hotline user: "+phoneNumber+"@machbarschaft.jetzt"+" pw: "+checksum(phoneNumber));
      reject("Could not get hotline user token!");
    }
  });
}

export const createHotlineUser = async (phoneNumber: string): Promise<string> => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return new Promise(async (resolve, reject) => {
    const result = await firebase.auth().createUserWithEmailAndPassword(phoneNumber+"@machbarschaft.jetzt", checksum(phoneNumber))
      .catch(function(error) {
        console.log(error);
      });
    if(result && result.user){
      console.log("Created firebase hotline user: "+phoneNumber+"@machbarschaft.jetzt"+" pw: "+checksum(phoneNumber)+" "+await result.user.getIdToken());
      resolve(await result.user.getIdToken());
    }
    else{
      console.error("Could not create hotline user: "+phoneNumber+"@machbarschaft.jetzt"+" pw: "+checksum(phoneNumber));
      reject("Could not create hotline user!");
    }
  });
}

export const getUser = async (phoneNumber: string): Promise<any> => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
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
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return new Promise(async (resolve, reject) => {
    authHotline().then(async (token: string) => {
      console.log("token: "+token);

      const hsDataRes = await coliveryGetApiCall(
        '/v1/help-seeker/search/'+phoneNumber, 
        token.toString(), 
        {});

      resolve(hsDataRes);      
    }).catch((reason: any) => {
      reject("Could not get token!");
    });
  });
}

export const getHelpRequests = async (phoneNumber: string): Promise<any> => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return new Promise(async (resolve, reject) => {
    authHotlineUser(phoneNumber).then(async (token: string) => {
      console.log("token: "+token);

      const allHelpRequests = await coliveryGetApiCall(
        "/v1/help-request", 
        token.toString(), 
        "");

      const result = JSON.parse(allHelpRequests)
        .filter((r: any) => (r?.helpSeeker?.phone === phoneNumber 
                              && !(r?.requestStatus === "CLOSED" || r?.requestStatus === "DELETED")));
      //console.log("pre");
      //console.log(JSON.parse(allHelpRequests).toString());
      //console.log("post");
      //console.log(result.toString());
      resolve(result);      
    }).catch((reason: any) => {
      reject("Could not get token!");
    });
  });
}

export const deleteLatestHelpRequest = async (phoneNumber: string): Promise<any> => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return new Promise(async (resolve, reject) => {
    getHelpRequests(phoneNumber).then(async (requests: any) => {

      if(Object.keys(requests).length > 0){
        console.log("ID: "+requests[0]?.id)
        authHotlineUser(phoneNumber).then(async (token: string) => {
          const dataRes = await coliveryPutApiCall(
            '/v1/help-request/'+requests[0]?.id+'/status', 
            token.toString(), 
            JSON.stringify({"status": "DELETED"}));

          console.log("Status update result: "+dataRes);
          resolve(dataRes); 
        }).catch((reason: any) => {
          reject("Could not get token!");
        });
      }
      else {
        reject("No help requests saved!");
      }     
    }).catch((reason: any) => {
      reject("Could not get help requests!");
    });
  });
}

export const createUser = async (order: om.OrderMeta): Promise<any> => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return new Promise(async (resolve, reject) => {
    createHotlineUser(order.data.phone_number).then(async (token: string) => {
      console.log("token: "+token);

      const createUserData = umlautSanitizer(JSON.stringify({
          firstName: '',
          lastName: order.data.name || '',
          street: order.data.address?.street || '',
          streetNo: order.data.address?.house_number || '',
          zipCode: order.data.address?.zip || '',
          city: order.data.address?.city || '',
          email: order.data.phone_number+'@machbarschaft.jetzt' || '',
          location: {
          longitude: order.data.location?.gps?.longitude.toString() || 0,
          latitude: order.data.location?.gps?.latitude.toString() || 0
          },
          phone: order.data.phone_number || '',
          source: 'HOTLINE'
      }));

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
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
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
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return new Promise(async (resolve, reject) => {  
    authHotlineUser(phoneNumber).then(async (token: string) => {
      const createDataRes = await createHelpSeekerToken(phoneNumber, name, token);
      resolve(createDataRes);
    }).catch((reason: any) => {
      reject("Could not get token!");
    });
  });
}

export const createOrGetUser = async (order: om.OrderMeta): Promise<any> => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
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
              reject("Could not create help seeker! Respone malformed 1.");
            }
          }
          else {
            reject("Could not create help seeker! Response empty 1.");
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
            reject("Could not create user! Respone malformed 2.");
          }
        }
        else {
          reject("Could not create user! Response empty 2.");
        }
      }
    }
    else {//user does not exist
      logger(order.data.phone_number, '', 'User does not exist, trying to create user.');
      const createResult = await createUser(order);
      if(createResult && createResult.length > 0){
        const createData = JSON.parse(createResult);
        if(createData && createData.id){
          resolve(createData.id);
        }
        else {
          reject("Could not create user! Respone malformed. 3");
        }
      }
      else {
        console.log(createResult);
        reject("Could not create user! Response empty. 3");
      }
    }
  });
}

export const updateUser = async (order: om.OrderMeta): Promise<any> => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return new Promise(async (resolve, reject) => {
    authHotlineUser(order.data.phone_number).then(async (token: string) => {
      console.log("token: "+token);

      const resultingUser = await coliveryPutApiCall(
        "/v1/user", 
        token.toString(), 
        umlautSanitizer(JSON.stringify({
          firstName: '',
          lastName: order.data.name || '',
          street: order.data.address?.street || '',
          streetNo: order.data.address?.house_number || '',
          zipCode: order.data.address?.zip || '',
          city: order.data.address?.city || '',
          email: order.data.phone_number+'@machbarschaft.jetzt' || '',
          location: {
          longitude: order.data.location?.gps?.longitude.toString() || 0,
          latitude: order.data.location?.gps?.latitude.toString() || 0
          },
          phone: order.data.phone_number || '',
          source: 'HOTLINE'
      })));
      
      resolve(resultingUser);      
    }).catch((reason: any) => {
      reject("Could not get token!");
    });
  });
}

/*export const updateUser = async (order: om.OrderMeta): Promise<void> => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return new Promise(async (resolve, reject) => {
    //const userResult = await getUser(order.data.phone_number);
    console.log(userResult);
    if(userResult && userResult.length > 0){//user exists
      const userData = JSON.parse(userResult);
      if(userData && userData.id){
        //TODO: use this when only new info is gathered per call and we don't want to set every field
      }
      else {
        logger(order.data.phone_number, '', 'Returned userdata malformed. Returned data: '+userResult);
        reject('Returned userdata malformed.');
      }
    }
    else {//user does not exist
      logger(order.data.phone_number, '', 'User does not exist.');
      reject('User does not exist.');
    }
  });
}*/

export const typeToString = (type: om.Type | null): string => {
    switch (type) {
      case om.Type.MEDICINE:
        return "Medizin"
        break;

      case om.Type.GROCERIES:
        return "Einkaufen"
        break;

      case om.Type.OTHER:
        return "Sonstiges"
        break;
      
      default:
        return ""
        break;
    }
}

export const urgencyToString = (type: om.Urgency | null): string => {
    switch (type) {
      case om.Urgency.ASAP:
        return "So schnell wie möglich"
        break;

      case om.Urgency.TODAY:
        return "Heute"
        break;

      case om.Urgency.TOMORROW:
        return "Morgen"
        break;
      
      default:
        return ""
        break;
    }
}

export const createHelpString = (order: om.OrderMeta): string => {
  let ret = "";
  ret += "Typ: "+typeToString(order.data.type)+"\n";//TODO: improve
  if(order.data.extras?.car_necessary || order.data.extras?.car_necessary === false)
    ret += "Auto notwendig: "+(order.data.extras?.car_necessary ? "ja" : "nein")+"\n";
  if(order.data.extras?.prescription || order.data.extras?.prescription === false)
    ret += "Rezept notwendig: "+(order.data.extras?.prescription ? "ja" : "nein")+"\n";
  ret += "Dringlichkeit: "+urgencyToString(order.data.urgency);
  //ret += "Erstellt am: "+order.data.created+", ";

  return ret;
}

export const umlautSanitizer = (str: String): string => {
  return str.replace(/\u00dc/g, "Ue").replace(/\u00fc/g, "ue")
    .replace(/\u00c4/g, "Ae").replace(/\u00e4/g, "ae")
    .replace(/\u00d6/g, "Oe").replace(/\u00f6/g, "oe")
    .replace(/\u00df/g, "ss");
}

export const createHelpRequest = async (order: om.OrderMeta, helpSeekerID: string): Promise<string> => {
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  return new Promise(async (resolve, reject) => {  
    authHotlineUser(order.data.phone_number).then(async (token: string) => {
      const createHRData = umlautSanitizer(JSON.stringify({
        helpSeeker: helpSeekerID,
        requestText: createHelpString(order),
        requestStatus: 'OPEN'
      }));

      const createDataRes = await coliveryPostApiCall('/v1/help-request', token.toString(), createHRData);
      resolve(createDataRes);
    }).catch((reason: any) => {
      reject("Could not get token!");
    });
  });
}