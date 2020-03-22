const functions = require('firebase-functions');
const Firestore = require('firestore');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();
const Client = require("@googlemaps/google-maps-services-js").Client;

async function getGeoPosByLocation(locationString) {
    return new Promise((resolve, reject) => {
        new Client({})
            .geocode({
                params: {
                    address: locationString,
                    key: 'AIzaSyDA9AqX4iQ442DW67vlwybfd8NFS1R9fiM'
                },
                timeout: 5000
            }).then(r => {
                console.log(r.data.results[ 0 ]);

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

function saveToFirebase(newDoc) {
    return db.collection('Order').add(newDoc);
}

exports.dataExtender = functions.region('europe-west1').https.onRequest(async (request, response) => {

    console.log('body', request.body);

    // TO DO: better authentication ;)
    if (!request.query.auth || request.query.auth !== 'YC8o1_wffEerdxjAynodxj_wfyno8k') {
        response.status(401).send("Missing authentication");
    }

    let newDoc = request.body;

    // handle missing street and/or zip
    if (!newDoc || !newDoc.street || !newDoc.zip || !newDoc.city) {
        response.status(400).send("MISSING STREET, HOUSE_NUMBER, ZIP AND/OR CITY");
    }

    let geoPos = null;
    geoPos = await getGeoPosByLocation(`${newDoc.street} ${newDoc.house_number}, ${newDoc.zip}, Deutschland"`).catch((e) => { console.error(e.message) });

    if (!geoPos) {
        geoPos = await getGeoPosByLocation(`${newDoc.city}, Deutschland"`).catch((e) => { console.error(e.message) });
    }

    newDoc.timestamp = new Date().toISOString();
    newDoc.location_validated = geoPos ? true : false;
    newDoc.lat = geoPos ? geoPos.latitude : null;
    newDoc.lng = geoPos ? geoPos.longitude : null;

    console.log("FINAL DOCUMENT", newDoc)

    saveToFirebase(newDoc).then(() => {
        response.send(newDoc);
    }, e => {
        console.error(e);
        response.status(500).send("ERROR SAVING DOCUMENT");
    });
});