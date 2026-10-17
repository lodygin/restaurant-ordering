export type OrderInput = {
  lines: { lineId: string; itemId: string; unitPrice: number; qty: number; openPrice: boolean }[];
  discount: number;
};
