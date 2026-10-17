import { type OrderStatus } from '../types';

export const FIRST_ORDER_NUMBER = 1001;

export const ORDER_STATUSES: OrderStatus[] = ['received', 'preparing', 'ready', 'collected'];

// the kitchen is simulated: time after placing the order
export const KITCHEN_TIMELINE_MS: [OrderStatus, number][] = [
  ['preparing', 12_000],
  ['ready', 40_000],
  ['collected', 70_000],
];
