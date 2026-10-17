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
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  total: number;
};
