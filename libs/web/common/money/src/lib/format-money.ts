import { formatPrice } from '@restaurant-ordering/shared/money';

export function formatMoney(cents: number): string {
  return `$${formatPrice(cents)}`;
}
