import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Order, Status } from './order.model';

export class OrderDao {
    db: FirebaseFirestore.Firestore;

    private static instance: OrderDao;
    private readonly COLLECTION_NAME: string = 'Order';

    constructor() {
        admin.initializeApp(functions.config().firebase);
        this.db = admin.firestore();
        this.db.settings({ timestampsInSnapshots: true });
    }

    public static init(): OrderDao {
        if (!OrderDao.instance) {
            OrderDao.instance = new OrderDao();
        }

        return OrderDao.instance;
    }

    public findOrCreateOrder = (phone_number: string): Promise<{ id: string, data: Order }> => {
        return new Promise<{ id: string, data: Order }>(async (resolve, reject) => {
            const orderSnap: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData> = await this.db.collection(this.COLLECTION_NAME)
                .where("phone_number", "==", phone_number)
                .where("status", "==", Status.INCOMPLETE)
                .orderBy("created")
                .get();

            console.log(`[findOrCreateOrder] Found matching Order for ${phone_number}`);
            console.log(orderSnap.size);
            console.log(orderSnap.size > 0 ? orderSnap.docs[ 0 ].data() : null);

            if (orderSnap.size > 0) {
                // There can be several open others at a time (e.g. hung up), so we take the latest one
                resolve({ id: orderSnap.docs[ 0 ].id, data: orderSnap.docs[ 0 ].data() as Order });
            } else {
                try {
                    console.log(`Save New Order to Firestore`, new Order(phone_number).parseToFirebaseDoc())
                    const addedOrderRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData> = await this.db.collection(this.COLLECTION_NAME)
                        .add(new Order(phone_number).parseToFirebaseDoc());

                    const addedOrder: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> = await addedOrderRef.get();
                    resolve({ id: addedOrder.id, data: addedOrder.data() as Order });
                } catch (e) {
                    console.error(`[findOrCreateOrder] Error saving Order to Firestore`, e);
                } finally {
                    reject();
                }
            }
        });
    }

    public changeOrderById = (id: string, fields: any): Promise<boolean> => {
        return new Promise<boolean>(async (resolve, reject) => {
            const result: FirebaseFirestore.WriteResult = await this.db.collection(this.COLLECTION_NAME).doc(id).update(fields);
            resolve(result && !!result.writeTime);
        });
    }

    public deleteOrderById = (id: string): Promise<boolean> => {
        return new Promise<boolean>(async (resolve, reject) => {
            const result: FirebaseFirestore.WriteResult = await this.db.collection(this.COLLECTION_NAME).doc(id).delete();
            resolve(result && !!result.writeTime);
        });
    }
};
