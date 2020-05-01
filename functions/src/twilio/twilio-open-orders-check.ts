import { OrderDao } from './model/order.dao';
import { OrderMeta } from './model/order.model';

export const openOrdersCheck = async () => {
    const orderDao: OrderDao = OrderDao.init();
    const orders: OrderMeta[] = await orderDao.findOpenOrdersLastDay();

    console.log('openOrdersCheck', orders);
};