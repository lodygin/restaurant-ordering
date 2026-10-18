export type PlacedOrder = {
  number: number;
  lines: { itemId: string; name: string; unitPrice: number; qty: number }[];
  discount: number;
  total: number;
};
