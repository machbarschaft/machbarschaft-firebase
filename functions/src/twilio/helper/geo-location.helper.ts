import { Client, GeocodeResponse, Status, AddressType, GeocodingAddressComponentType } from "@googlemaps/google-maps-services-js";
import { firestore } from 'firebase-admin';
import { logger, LogLevel } from './logger.helper';
import * as functions from 'firebase-functions';
import { overpassCsv } from "overpass-ts";
import didYouMean from 'didyoumean2';//, { ReturnTypeEnums }

export const getGeoPosByLocation = async (_street: string, _house_number: string, _zip: string, _city: string, language: string): Promise<{geoPoint:firestore.GeoPoint, house_number: String, street: String, city: String, zip: String}> => {
    let inStreet: string = _street;
    const inHouse_number: string = _house_number;
    const inCity: string = _city;
    let inZip: string = _zip;
    inZip = inZip.replace(/[^0-9]/g, "");
    const query: string = '[out:csv(name;false)]; area[postal_code="'+inZip+'"]->.a; way(area.a)[highway][name]; out;';
    console.log("inZip: "+inZip+" _zip: "+_zip);
    console.log("query: "+query);
    const streets: string = await overpassCsv(query);
    const streetSet: Set<string> = new Set(streets.split("\n"));
    streetSet.delete('');
    const altStreet = didYouMean(inStreet, Array.from(streetSet.values()));
    console.log(altStreet);
    if(altStreet)
        inStreet = altStreet;
    
    const address: string = inStreet+" "+inHouse_number+", "+inZip+" "+inCity;
    return new Promise((resolve, reject) => {        
        new Client({})
            .geocode({
                params: {
                    address,
                    language,
                    components: {
                        country: 'DE',
                        postal_code: inZip
                    },
                    key: functions.config().fire.apikey || ''
                },
                timeout: 5000
            }).then((r: GeocodeResponse) => {
                logger('', '', `Found Address via Google Geo API`, r.data);
                if (r.data.status === Status.OK) {
                    const res = r.data.results[ 0 ];
                    const geoPoint: firestore.GeoPoint = new firestore.GeoPoint(
                            res.geometry.location.lat,
                            res.geometry.location.lng
                        );
                    let house_number: String = '';
                    let street: String = '';
                    let city: String = '';
                    let zip: String = '';

                    for(let comp of res.address_components){
                        logger('', '', `Current address component:`, comp);
                        if(comp && comp.types && comp.long_name){
                            if(comp.types.includes(GeocodingAddressComponentType.street_number))
                                house_number = comp.long_name;
                            else if(comp.types.includes(AddressType.route))
                                street = comp.long_name;
                            else if(comp.types.includes(AddressType.locality))
                                city = comp.long_name;
                            else if(comp.types.includes(AddressType.postal_code))
                                zip = comp.long_name;
                        }
                    }

                    resolve({
                        geoPoint: geoPoint,
                        house_number: house_number, 
                        street: street, 
                        city: city, 
                        zip: zip
                    });
                } else {
                    logger('', '', `Failed Find Address via Google Geo API: Status Not OK`, r.statusText, LogLevel.ERROR);
                    reject();
                }
            })
            .catch(e => {
                logger('', '', `Failed Find Address via Google Geo API: `, e, LogLevel.ERROR);
                reject(e);
            });
        });
};
