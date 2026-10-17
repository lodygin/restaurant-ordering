import { computed, inject } from '@angular/core';

import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

import { MenuStore, type MenuItem } from '@restaurant-ordering/web/core/menu';

import { type CartLine, type CartLineIssue, type CartState } from '../types';

const initialState: CartState = { lines: [], discount: 0 };

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ lines, discount }, menu = inject(MenuStore)) => {
    const subtotal = computed(() =>
      lines().reduce((sum, line) => sum + line.unitPrice * line.qty, 0),
    );

    const appliedDiscount = computed(() => Math.min(discount(), subtotal()));

    return {
      subtotal,
      appliedDiscount,
      total: computed(() => subtotal() - appliedDiscount()),
      count: computed(() => lines().reduce((sum, line) => sum + line.qty, 0)),
      qtyByItem: computed(() =>
        lines().reduce<Record<string, number>>(
          (qty, line) => ({ ...qty, [line.itemId]: (qty[line.itemId] ?? 0) + line.qty }),
          {},
        ),
      ),
      issues: computed(() =>
        lines().reduce<Record<string, CartLineIssue>>((issues, line) => {
          const issue = findIssue(line, menu.itemEntityMap()[line.itemId]);

          return issue ? { ...issues, [line.lineId]: issue } : issues;
        }, {}),
      ),
    };
  }),

  withMethods(store => {
    const updateQty = (lineId: string, qty: (line: CartLine) => number): void =>
      patchState(store, ({ lines }) => ({
        lines: lines
          .map(line => (line.lineId === lineId ? { ...line, qty: qty(line) } : line))
          .filter(line => line.qty > 0),
      }));

    return {
      add(item: MenuItem, qty = 1, enteredPrice?: number): void {
        const unitPrice = item.openPrice ? enteredPrice : item.price;

        if (unitPrice === undefined || unitPrice === null) {
          return;
        }

        const lineId = item.openPrice ? `${item.id}@${unitPrice}` : item.id;

        patchState(store, ({ lines }) => ({
          lines: lines.some(line => line.lineId === lineId)
            ? lines.map(line => (line.lineId === lineId ? { ...line, qty: line.qty + qty } : line))
            : [
                ...lines,
                {
                  lineId,
                  itemId: item.id,
                  name: item.name,
                  unitPrice,
                  qty,
                  openPrice: item.openPrice,
                },
              ],
        }));
      },

      changeQty(lineId: string, delta: number): void {
        updateQty(lineId, line => line.qty + delta);
      },

      remove(lineId: string): void {
        updateQty(lineId, () => 0);
      },

      setDiscount(discount: number): void {
        patchState(store, { discount });
      },
    };
  }),
);

// mirrors the server's checkout check, so the guest sees a change before placing the order
function findIssue(line: CartLine, item: MenuItem | undefined): CartLineIssue | null {
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
