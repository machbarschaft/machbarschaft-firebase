import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Order, OrderStatus, OrderMeta } from './order.model';
import { logger, LogLevel } from '../helper/logger.helper';

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

    public findOrCreateActiveOrdersByPhoneNumber = (phone_number: string, call_sid: string): Promise<OrderMeta[]> => {
        return new Promise<OrderMeta[]>(async (resolve, reject) => {
            const orderSnap: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData> = await this.db.collection(this.COLLECTION_NAME)
                .where("phone_number", "==", phone_number)
                .where("status", "in", [ OrderStatus.OPEN, OrderStatus.INCOMPLETE, OrderStatus.IN_PROGRESS ])
                .orderBy("created")
                .get();

            logger(phone_number, '', `Found matching Order for ${phone_number} # Size ${orderSnap.size}`);

            if (orderSnap.size > 0) {
                resolve(orderSnap.docs.map(snap => new OrderMeta(snap.id, snap.data() as Order)));
            } else {
                try {
                    const addedOrderRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData> = await this.db.collection(this.COLLECTION_NAME)
                        .add(new Order(phone_number, call_sid).parseToFirebaseDoc());

                    const addedOrder: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> = await addedOrderRef.get();
                    logger(phone_number, addedOrder.id, `Saved New Order To DB`);
                    resolve([ new OrderMeta(addedOrder.id, addedOrder.data() as Order) ]);
                } catch (e) {
                    logger(phone_number, '', `Error saving Order to Firestore`, e, LogLevel.ERROR);
                } finally {
                    reject();
                }
            }
        });
    }

    public findOrderById = (id: string): Promise<Order> => {
        return new Promise<Order>(async (resolve, reject) => {
            const result: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> = await this.db.collection(this.COLLECTION_NAME).doc(id).get();
            if (result.exists) {
                resolve(result.data() as Order);
            } else {
                reject();
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
