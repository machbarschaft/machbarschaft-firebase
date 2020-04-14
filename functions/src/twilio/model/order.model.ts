import { firestore } from 'firebase-admin';


export class Order {
    constructor(
        public phone_number: string,
        public status: Status = Status.INCOMPLETE,
        public type: Type | null = null,
        public extras: Extras | null = null,
        public urgency: Urgency | null = null,
        public name: string | null = null,
        public address: Address | null = null,
        public location: Location | null = null,
        public account_id: string | null = null,
        public privacy_agreed: boolean = false,
        public created: firestore.Timestamp = firestore.Timestamp.now()
    ) { }

    parseToFirebaseDoc(): any {
        return {
            phone_number: this.phone_number,
            status: this.status,
            type: this.type,
            extras: this.extras,
            urgency: this.urgency,
            name: this.name,
            address: this.address,
            location: this.location,
            account_id: this.account_id,
            privacy_agreed: this.privacy_agreed,
            created: this.created
        };
    }
}

export enum Type {
    GROCERIES = "groceries",
    MEDICINE = "medicine",
    OTHER = "other"
}

export enum Urgency {
    ASAP = "asap",
    TODAY = "today",
    TOMORROW = "tomorrow"
}

export enum Status {
    OPEN = "open",
    IN_PROGRESS = "in_progress",
    CLOSED = "closed",
    INCOMPLETE = "incomplete",
    INVALID = "invalid"
}

export class Address {
    constructor(
        public house_number: String,
        public street: String,
        public zip: String,
        public city: String
    ) { }
}

export class Location {
    public gps: firestore.GeoPoint;
    public geohash: string;

    constructor(
        public latitude: number,
        public longitude: number,
        geohash: string
    ) {
        this.gps = new firestore.GeoPoint(latitude, longitude);
        this.geohash = geohash;
    }

    parseToFirebaseDoc(): any {
        return {
            gps: new firestore.GeoPoint(this.latitude, this.longitude),
            geohash: this.geohash
        };
    }
}

export class Extras {
    constructor(
        public car_necessary: boolean,
        public prescription: boolean
    ) { }
}
