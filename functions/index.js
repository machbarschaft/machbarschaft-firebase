const functions = require('firebase-functions');
const Firestore = require('firestore');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();
exports.helloWorld = functions.https.onRequest((request, response) => {
    var XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
    console.log('body', request.body);
    var http = new XMLHttpRequest();
    var body = Buffer.from(JSON.stringify(request.body), 'base64').toString();//atob(request.body);//'ewogICJmaWVsZHMiOiB7CiAgICAicGhvbmVfbnVtYmVyIjogeyAic3RyaW5nVmFsdWUiOiAiVEJEIiB9LAogICAgInppcCI6IHsgInN0cmluZ1ZhbHVlIjogIjU1MTIyIiB9LAogICAgInN0cmVldCI6IHsgInN0cmluZ1ZhbHVlIjogIlRCRCIgfSwKICAgICJuYW1lIjogeyAic3RyaW5nVmFsdWUiOiAiVEJEIiB9LAogICAgInNob3BwaW5nX3NpemUiOiB7ICJzdHJpbmdWYWx1ZSI6ICJUQkQiIH0sCiAgICAicHJvZHVjdF9ncm91cCI6IHsgInN0cmluZ1ZhbHVlIjogIk1FRElDSU5FIiB9CiAgfQp9'
    console.log('body2', body);
    //body = request.body;
    db.collection('Order').add(request.body);
    response.send("OK");
});