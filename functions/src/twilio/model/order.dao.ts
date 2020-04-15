import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { Order, OrderStatus, OrderMeta } from './order.model';

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

            console.log(`[findOrCreateOrder] Found matching Order for ${phone_number}`);
            console.log(orderSnap.size);
            console.log(orderSnap.size > 0 ? orderSnap.docs[ 0 ].data() : null);

            if (orderSnap.size > 0) {
                resolve(orderSnap.docs.map(snap => new OrderMeta(snap.id, snap.data() as Order)));
            } else {
                try {
                    console.log(`Save New Order to Firestore`, new Order(phone_number, call_sid).parseToFirebaseDoc())
                    const addedOrderRef: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData> = await this.db.collection(this.COLLECTION_NAME)
                        .add(new Order(phone_number, call_sid).parseToFirebaseDoc());

                    const addedOrder: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData> = await addedOrderRef.get();
                    resolve([ new OrderMeta(addedOrder.id, addedOrder.data() as Order) ]);
                } catch (e) {
                    console.error(`[findOrCreateOrder] Error saving Order to Firestore`, e);
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
