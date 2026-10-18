import { type OrderStatus } from '@restaurant-ordering/web/core/orders';

export const ORDER_STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'received', label: 'Received' },
  { status: 'preparing', label: 'Preparing' },
  { status: 'ready', label: 'Ready' },
  { status: 'collected', label: 'Collected' },
];
