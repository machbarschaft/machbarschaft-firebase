
import { OrderDao } from './model/order.dao';
import { OrderMeta } from './model/order.model';

export const closedOrdersCheck = async () => {

    const orderDao: OrderDao = OrderDao.init();
    const orders: OrderMeta[] = await orderDao.findClosedOrdersLastHour();

    console.log('closedOrdersCheck', orders);
};