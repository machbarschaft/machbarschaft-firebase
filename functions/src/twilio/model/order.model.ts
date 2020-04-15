import { firestore } from 'firebase-admin';


export class OrderMeta {
    constructor(
        public id: string,
        public data: Order
    ) { }
}
export class Order {
    constructor(
        public phone_number: string,
        public last_call_sid: string,
        public status: OrderStatus = OrderStatus.INCOMPLETE,
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
            last_call_sid: this.last_call_sid,
            status: this.status,
            type: this.type,
            extras: this.extras,
            urgency: this.urgency,
            name: this.name,
            address: new Address(
                this.address?.house_number,
                this.address?.street,
                this.address?.zip,
                this.address?.city,
                this.address?.confirmed
            ).parseToFirebaseDoc(),
            location: new Location(
                this.location?.gps,
                this.location?.geohash
            ).parseToFirebaseDoc(),
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

export enum OrderStatus {
    OPEN = "open",
    IN_PROGRESS = "in_progress",
    CLOSED = "closed",
    INCOMPLETE = "incomplete",
    INVALID = "invalid"
}

export class Address {
    constructor(
        public house_number: String | null = null,
        public street: String | null = null,
        public zip: String | null = null,
        public city: String | null = null,
        public confirmed: boolean = false
    ) { }

    parseToFirebaseDoc(): any {
        return {
            house_number: this.house_number,
            street: this.street,
            zip: this.zip,
            city: this.city,
            confirmed: this.confirmed
        };
    }
}

export class Location {
    constructor(
        public gps: firestore.GeoPoint | null = null,
        public geohash: string | null = null
    ) {
        this.gps = gps;
        this.geohash = geohash;
    }

    parseToFirebaseDoc(): any {
        return {
            gps: this.gps,
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
