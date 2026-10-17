import { type OrderChange } from '@restaurant-ordering/web/core/orders';

export type CartChange = OrderChange & { name: string };
