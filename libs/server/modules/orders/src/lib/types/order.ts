import { type OrderStatus } from './order-status';

export type OrderLine = {
  itemId: string;
  name: string;
  unitPrice: number;
  qty: number;
};

export type Order = {
  id: string;
  number: number;
  createdAt: string;
  status: OrderStatus;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  total: number;
};
