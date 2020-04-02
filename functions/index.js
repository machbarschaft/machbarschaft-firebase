const functions = require('firebase-functions');
const Firestore = require('firestore');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);

let db = admin.firestore();
db.settings({ timestampsInSnapshots: true });

async function getGeoPosByLocation(locationString) {
    const Client = require("@googlemaps/google-maps-services-js").Client;

    return new Promise((resolve, reject) => {
        new Client({})
            .geocode({
                params: {
                    address: locationString,
                    language: 'de_DE',
                    key: process.env.MAPS_API_KEY
                },
                timeout: 5000
            }).then(r => {
                console.log(r.data);

                resolve({
                    latitude: r.data.results[ 0 ].geometry.location.lat,
                    longitude: r.data.results[ 0 ].geometry.location.lng
                });
            })
            .catch(e => {
                reject(e);
            });
    });
}

function saveToFirebase(collection, doc) {
    return db.collection(collection).add(doc);
}

function setOrderStatusExpired(id) {
    return db.collection('Order').doc(id).update({ status: 'expired' });
}

exports.dataExtender = functions.region('europe-west3').https.onRequest(async (request, response) => {

    console.log('body', request.body);

    if (!request.query.auth || request.query.auth !== process.env.AUTH_KEY) {
        return response.status(401).send("Missing authentication");
    }

    let newDoc = request.body;

    // handle missing street and/or zip
    if (!newDoc || !newDoc.street || !newDoc.zip || !newDoc.city) {
        return response.status(400).send("MISSING STREET, HOUSE_NUMBER, ZIP AND/OR CITY");
    }

    // fetch geoPos with street and zip
    let geoPos = await getGeoPosByLocation(`${newDoc.street} ${newDoc.house_number}, ${newDoc.zip}, Deutschland"`).catch((e) => { console.error(e.message) });

    // try again with city only
    if (!geoPos) {
        geoPos = await getGeoPosByLocation(`${newDoc.city}, Deutschland"`).catch((e) => { console.error(e.message) });
    }

    newDoc.timestamp = admin.firestore.Timestamp.now();
    newDoc.location_validated = geoPos ? true : false;
    newDoc.lat = geoPos ? geoPos.latitude : null;
    newDoc.lng = geoPos ? geoPos.longitude : null;

    console.log("FINAL DOCUMENT", newDoc)

    saveToFirebase('Order', newDoc).then(() => {
        return response.send(newDoc);
    }, e => {
        console.error(e);
        return response.status(500).send("ERROR SAVING DOCUMENT");
    });
});

exports.gatherFeedback = functions.region('europe-west3').https.onRequest(async (request, response) => {

    console.log('body', request.body);

    if (!request.query.auth || request.query.auth !== process.env.AUTH_KEY) {
        return response.status(401).send("Missing authentication");
    }

    let newDoc = request.body;

    newDoc.timestamp = admin.firestore.Timestamp.now();

    console.log("FINAL FEEDBACK", newDoc)

    saveToFirebase('Feedback', newDoc).then(() => {
        return response.send(newDoc);
    }, e => {
        console.error(e);
        return response.status(500).send("ERROR SAVING DOCUMENT");
    });
});

function getLatestExpiredOrders() {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    console.log(`FIND ALL DOCS FROM: ${yesterday.toISOString()}`);

    return db.collection('Order')
        .where("timestamp", "<", yesterday)
        .where("status", "==", "open")
        .orderBy("timestamp")
        .get();
}

// NOT ACTIVATED YET
// .pubsub.schedule('every 5 minutes')
exports.periodicCheck = functions.region('europe-west3').https.onRequest(async (request, response) => {
    const latestExpiredOrders = await getLatestExpiredOrders();

    if (!request.query.auth || request.query.auth !== process.env.AUTH_KEY) {
        return response.status(401).send("Missing authentication");
    }

    if (!latestExpiredOrders) {
        return response.status(500).send("ERROR GET LATEST EXPIRED ORDER PHONE NUMBER");
    } else if (latestExpiredOrders.docs && latestExpiredOrders.docs.length === 0) {
        return response.send("NO LAST EXPIRED ORDERS COUNT");
    }

    console.log(latestExpiredOrders.docs);
    console.log(`LATEST EXPIRED ORDERS COUNT: ${latestExpiredOrders.docs.length}`);

    const currentExpiredOrder = latestExpiredOrders.docs[ 0 ];
    const currentExpiredOrderData = currentExpiredOrder.data();
    const callerId = currentExpiredOrderData.phone_number;

    console.log(`LATEST EXPIRED ORDER`, currentExpiredOrderData);

    var accountSid = process.env.TWILIO.SID;
    var authToken = process.env.TWILIO.AUTH_TOKEN;
    var twilio = require('twilio');
    var client = new twilio(accountSid, authToken);

    client.studio.v1.flows('FWb0b3a2284d1699d205b458922153611f')
        .executions
        .create({ to: '+4915233145276', from: '+4940299960980' })
        .then((message) => {
            console.log(`CALLED: ${callerId} # SID: ${message.sid}`);
            return response.send(`CALLED: ${callerId} # SID: ${message.sid} # DOC ID: ${currentExpiredOrder.id}`);

            setOrderStatusExpired(currentExpiredOrder.id).then(() => {
                return response.send(`CALLED: ${callerId} # SID: ${message.sid} # DOC ID: ${currentExpiredOrder.id}`);
            }, e => {
                console.error(e);
                return response.status(500).send("ERROR SAVING DOCUMENT");
            });
        }).catch(e => {
            console.error(e);
            return response.status(500).send("ERROR TWILIO API CALL");
        });
});
