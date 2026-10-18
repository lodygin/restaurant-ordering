import { type OrderTotals, type PricedLine } from './types';

export function priceOrder(lines: PricedLine[], discount: number): OrderTotals {
  const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
  const applied = Math.min(discount, subtotal);

  return { subtotal, discount: applied, total: subtotal - applied };
}
