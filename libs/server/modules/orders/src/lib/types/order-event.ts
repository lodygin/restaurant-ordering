import { type Order } from './order';

export type OrderEvent = { type: 'order.placed' | 'order.updated'; order: Order };
