import { type CartLine } from './cart-line';

export type CartState = {
  lines: CartLine[];
  discount: number;
};
