const functions = require('firebase-functions');
const Firestore = require('firestore');
const admin = require('firebase-admin');
admin.initializeApp(functions.config().firebase);
let db = admin.firestore();
const Client = require("@googlemaps/google-maps-services-js").Client;

exports.helloWorld = functions.https.onRequest((request, response) => {

    console.log('body', request.body);
    db.collection('Order').add(request.body);

    const client = new Client({});

    var currentUserAddress = request.body.fields.street.stringValue+", "+request.body.fields.zip.stringValue+", Deutschland";
    client
      .geocode({
        params: {
          address: currentUserAddress,
          key: 'AIzaSyDA9AqX4iQ442DW67vlwybfd8NFS1R9fiM'
        },
        timeout: 10000 // milliseconds
      })
      .then(r => {
        console.log(r.data.results[0]);
        console.log(r.data.results[0].geometry);
        console.log(r.data.results[0].geometry.location);
        console.log(r.data.results[0].geometry.location.lat+", "+r.data.results[0].geometry.location.lng);//.results[0].geometry.location.latitude+" "+r.data.results[0].geometry.location.longitude);
      })
      .catch(e => {
        console.log(e);
      });
    
    /*var publicConfig = {
      key: 'AIzaSyDA9AqX4iQ442DW67vlwybfd8NFS1R9fiM',
      stagger_time:       1000, // for elevationPath
      encode_polylines:   false,
      secure:             true, // use https
    };
    var gmAPI = new GoogleMapsAPI(publicConfig);


    gmAPI.geocode( { 'address': currentUserAddress}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
          var latitude = results[0].geometry.location.latitude;
          var longitude = results[0].geometry.location.longitude;
          var latlng = new LatLng(latitude, longitude);
          var userAddress = new LatLng(currentUserAddress)
          console.log(userAddress);
      } 
    }); */
    response.send("OK");
});