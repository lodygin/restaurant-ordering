export type CartLine = {
  lineId: string;
  itemId: string;
  unitPrice: number;
  qty: number;
  openPrice: boolean;
};

export type PlaceOrderInput = {
  lines: CartLine[];
  discount: number;
};
