# Machbarschaft

![Machbarschaft Logo](logo.jpeg)

![WirVsVirus Hackathon Logo](Logo_01_300px.jpg)

Project Machbarschaft was created in the context of [WirVsVirus Hackathon](https://wirvsvirushackathon.org/) hosted by the German Government. Our pitch video can be found [on youtube](https://www.youtube.com/watch?v=8YJ0I0dMmWg). We also have a [Devpost Profile](https://devpost.com/software/einanrufhilft) and a website [machbarschaft.jetzt](https://machbarschaft.jetzt/). Our main repository is [here](https://github.com/marc-sommer/machbarschaft).

This repository contains the details of used services of the Firebase ecosystem and an API to connect our Twilio-Bot with a Firebase/Firestore database utilizing [Firebase Functions](https://firebase.google.com/docs/functions).

## Firebase: Firestore

Our database in Firestore (noSQL) is the central element in our architecture to save processed data from Twilio to make it accessible for the Android and iOS Apps.

Please get in contact with us to learn more about our database structure.
### Data structure 
The data stored in our database in divided into three entities. Those three entities with their attributes and an example dataset are explained in the following table.

Account *(account of a volunteer who wants to help)*
| attribute  | data type | description | example |
| ------------- | ------------- | ----------- | ------ |
| first_name | string | first name of a helper | Max |
| last_name | string | last name of a helper | Mustermann |
| id | string | phone number of a helper used as an id | +49 160 1234567 |
| radius | number | radius in which the helper looks for orders, unit: kilometers | 10 |
| credits | number | scoring system to reward active volunteers in the future | 30 |

Order *(order made by a person who needs help)*
| attribute  | data type | description | example |
| ------------- | ------------- | ----------- | ------ |
| name | string | name of person who needs help | Max Mustermann |
| city | string | city the person who needs help lives in | Musterstadt |
| street | string | street the person who needs help lives in | Musterstraße |
| house_number | number | housenumber of the house the person who needs help lives in | 1 |
| zip | string | zip code of the place where the person who needs help lives | 12345 |
| lat | number | latitude coordinate calculated by adress using Google Maps API | 50,0017921 |
| lng | number | longitude coordinate calculated by adress | 8,2361562 |
| location_validated | boolean | value if location was validated, i.e. coordinates have been found for the adress using Google Maps API | false |
| phone_number | string | phone_number of person who needs help | +491631234567 |
| type_of_help | string | enum of three values (APOTHEKE, ) | APOTHEKE |
| prescription | boolean | is a prescription needed | false |
| carNecessary | boolean | car is necessary for transportation of ordered products | true |
| status | string | status of order (open, confirmed or closed) | open |
| urgency | string | one of three values (low, medium or high) | low |
| timestamp | string | timestamp when order was crated | 2020-03-21T14:01:56.212Z |
| id | string | uuid of order, technically needed | e99d60f0-6e04-11ea-bc55-0242ac130003  |

Order_account *(assinging/mapping an order to a volunteer account)*
| attribute  | data type | description | example |
| ------------- | ------------- | ----------- | ------ |
| account_id | string | id of account, usually a phone number | +49 160 1234567 |
| created_timestamp | string | time the volunteer accepted this order | 2020-03-21T14:01:56.212Z" |
| order_id | string | uuid of order | e99d60f0-6e04-11ea-bc55-0242ac130003 |

## Firebase: Firestore API (Cloud function for Twilio-to-Firebase connection)

## What is it?

The main code can be found in functions/index.js. It is split up into two Firebase functions, "dataExtender" and "periodicCheck". 

The dataExtender function gets called by a Twilio POST-Request with all the data collected during a successful call. The main job of that function is to use Google Maps API to deduce latitude and longitude coordinates from the transcribed address. If that's possible, those coordinates are added to the JSON, otherwise NULL is saved. Finally, the script adds the new JSON, together with a timestamp, to our Firestore database. There it can be read by our App.

The periodicCheck function is scheduled on a regular basis and searches for orders which are open for more than 24 hours, i.e. no volunteer has been found for that order. For every such order, it triggers a recall to the person wo placed the order. This is done by sending a corresponding request to our Twilio instance through the Twilio NodeJS-API.

## Why do we need this?

Unfortunately, there seems to be no way to get latitude and longitude coordinates directly from Twilio. Moreover, sending the call data directly to a Firestore database did not really work in the first place. Additionally, we needed to call our periodicCheck function, well.., periodically which seems to be impossible to do with Twilio directly. For that reasons we decided to move that wirk to two Firebase functions.

## How do I set it up myself?

To reproduce our setup, you need a Twilio account configured as described in [our Twilio repository](https://github.com/machbarschaft/machbarschaft-twilio) and a Google Firebase account. We use [Google Firebase Cloud Functions](https://firebase.google.com/docs/functions) to run the two functions dataExtender and periodicCheck.

You mostly just need to upload the two Firebase functions described above to your Firebase account. There you get a link to call the function with (using a POST-request usually). For dataExtender, that link has to be added to your Twilio flow. periodicCheck calls the Twilio API by itself, so no work to do here.
