import { HttpErrorResponse } from '@angular/common/http';
import { computed, inject } from '@angular/core';
import { exhaustMap, filter, pipe, retry, Subject, throwError, timer } from 'rxjs';

import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { detectLineChange, priceOrder, type LineChange } from '@restaurant-ordering/shared/orders';
import { MenuStore, type MenuItem } from '@restaurant-ordering/web/core/menu';
import { OrdersApi, type OrderChange } from '@restaurant-ordering/web/core/orders';
import { apiErrorMessage } from '@restaurant-ordering/web/infrastructure/http';
import { ToastService } from '@restaurant-ordering/web/ui/toast';

import { type CartChange, type CartLine } from '../types';

const LOST_RESPONSE_RETRIES = 3;
const LOST_RESPONSE_RETRY_MS = 1000;

type CartState = {
  lines: CartLine[];
  discount: number;
  requestKey: string | null;
  placing: boolean;
  placedNumber: number | null;
};

const initialState: CartState = {
  lines: [],
  discount: 0,
  requestKey: null,
  placing: false,
  placedNumber: null,
};

export const CartStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withComputed(({ lines, discount }, menu = inject(MenuStore)) => {
    const totals = computed(() => priceOrder(lines(), discount()));

    return {
      subtotal: computed(() => totals().subtotal),
      appliedDiscount: computed(() => totals().discount),
      total: computed(() => totals().total),
      count: computed(() => lines().reduce((sum, line) => sum + line.qty, 0)),
      qtyByItem: computed(() => {
        const qtyByItem = new Map<string, number>();

        for (const { itemId, qty } of lines()) {
          qtyByItem.set(itemId, (qtyByItem.get(itemId) ?? 0) + qty);
        }

        return qtyByItem;
      }),
      issues: computed(() => {
        const items = menu.itemEntityMap();
        const issues = new Map<string, LineChange>();

        for (const line of lines()) {
          const issue = detectLineChange(line, items[line.itemId]);

          if (issue) {
            issues.set(line.lineId, issue);
          }
        }

        return issues;
      }),
    };
  }),

  withProps(() => ({ _conflicts$$: new Subject<CartChange[]>() })),
  withProps(({ _conflicts$$ }) => ({ conflicts$: _conflicts$$.asObservable() })),

  withMethods((store, api = inject(OrdersApi), toast = inject(ToastService)) => {
    // a different payload is a different request, so any change to the cart drops the key
    const updateLines = (update: (lines: CartLine[]) => CartLine[]): void =>
      patchState(store, ({ lines }) => ({ lines: update(lines), requestKey: null }));

    const updateQty = (lineId: string, qty: (line: CartLine) => number): void =>
      updateLines(lines =>
        lines
          .map(line => (line.lineId === lineId ? { ...line, qty: qty(line) } : line))
          .filter(line => line.qty > 0),
      );

    const applyConflict = (changes: OrderChange[]): void => {
      const names = new Map(store.lines().map(line => [line.lineId, line.name]));

      updateLines(lines => reconcile(lines, changes));
      store._conflicts$$.next(
        changes.map(change => ({ ...change, name: names.get(change.lineId) ?? '' })),
      );
    };

    return {
      add(item: MenuItem, qty = 1, enteredPrice?: number): void {
        const unitPrice = item.openPrice ? enteredPrice : item.price;

        if (unitPrice === undefined || unitPrice === null) {
          return;
        }

        const lineId = item.openPrice ? `${item.id}@${unitPrice}` : item.id;

        updateLines(lines =>
          lines.some(line => line.lineId === lineId)
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
        );
      },

      changeQty(lineId: string, delta: number): void {
        updateQty(lineId, line => line.qty + delta);
      },

      remove(lineId: string): void {
        updateQty(lineId, () => 0);
      },

      setDiscount(discount: number): void {
        patchState(store, { discount, requestKey: null });
      },

      placeOrder: rxMethod<void>(
        pipe(
          filter(() => store.lines().length > 0),
          exhaustMap(() => {
            const requestKey = store.requestKey() ?? crypto.randomUUID();
            const lines = store.lines().map(({ lineId, itemId, unitPrice, qty, openPrice }) => ({
              lineId,
              itemId,
              unitPrice,
              qty,
              openPrice,
            }));

            patchState(store, { requestKey, placing: true, placedNumber: null });

            return api.place({ lines, discount: store.discount() }, requestKey).pipe(
              // the order may have been placed before the response got lost; the same key returns it
              retry({
                count: LOST_RESPONSE_RETRIES,
                delay: (error: unknown, attempt) =>
                  error instanceof HttpErrorResponse && error.status === 0
                    ? timer(LOST_RESPONSE_RETRY_MS * attempt)
                    : throwError(() => error),
              }),
              tapResponse({
                next: ({ number }) => patchState(store, { ...initialState, placedNumber: number }),
                error: (error: unknown) => {
                  const changes = OrdersApi.readConflict(error);

                  if (changes) {
                    applyConflict(changes);

                    return;
                  }

                  toast.error(apiErrorMessage(error));
                },
                finalize: () => patchState(store, { placing: false }),
              }),
            );
          }),
        ),
      ),
    };
  }),
);

function reconcile(lines: CartLine[], changes: OrderChange[]): CartLine[] {
  const changeByLine = new Map(changes.map(change => [change.lineId, change]));
  const reconciled = new Map<string, CartLine>();

  for (const line of lines) {
    const change = changeByLine.get(line.lineId);

    if (change?.type === 'unavailable' || change?.type === 'now-open') {
      continue;
    }

    const next =
      change?.type === 'now-fixed'
        ? { ...line, lineId: line.itemId, unitPrice: change.to, openPrice: false }
        : change?.type === 'price'
          ? { ...line, unitPrice: change.to }
          : line;

    const existing = reconciled.get(next.lineId);

    reconciled.set(next.lineId, existing ? { ...existing, qty: existing.qty + next.qty } : next);
  }

  return [...reconciled.values()];
}
