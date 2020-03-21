const functions = require('firebase-functions');
const Firestore = require('firestore');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();
exports.helloWorld = functions.https.onRequest((request, response) => {
    console.log('body', request.body);
    db.collection('Order').add(request.body);
    response.send("OK");
});