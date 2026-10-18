import { type CheckedItem, type CheckedLine, type LineChange } from './types';

export function detectLineChange(
  line: CheckedLine,
  item: CheckedItem | undefined,
): LineChange | null {
  if (!item?.available) {
    return { type: 'unavailable' };
  }

  if (item.price === null) {
    return line.openPrice ? null : { type: 'now-open' };
  }

  if (line.openPrice) {
    return { type: 'now-fixed', price: item.price };
  }

  return item.price === line.unitPrice ? null : { type: 'price', price: item.price };
}
