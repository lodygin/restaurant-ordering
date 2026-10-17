import { type CartLine } from './cart-line';

export type CartState = {
  lines: CartLine[];
  discount: number;
  requestKey: string | null;
  placing: boolean;
  placedNumber: number | null;
};
