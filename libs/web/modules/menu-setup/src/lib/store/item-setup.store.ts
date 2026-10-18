import { inject } from '@angular/core';
import { exhaustMap, filter, map, pipe, Subject } from 'rxjs';

import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { formatMoney } from '@restaurant-ordering/web/common/money';
import { concatMapBy, exhaustMapBy } from '@restaurant-ordering/web/common/rxjs';
import {
  MenuApi,
  MenuStore,
  type MenuEntityChange,
  type MenuItem,
  type MenuItemInput,
} from '@restaurant-ordering/web/core/menu';
import { apiErrorMessage } from '@restaurant-ordering/web/infrastructure/http';
import { ToastService } from '@restaurant-ordering/web/ui/toast';

import { DEFAULT_ITEM_PRICE, NEW_ITEM_NAME } from '../constants';

type ItemSetupState = {
  creating: boolean;
  edits: Record<string, Partial<MenuItemInput>>;
  removing: string[];
};

const initialState: ItemSetupState = { creating: false, edits: {}, removing: [] };

export const ItemSetupStore = signalStore(
  withState(initialState),

  withProps(() => ({ _created$$: new Subject<MenuItem>() })),
  withProps(({ _created$$ }) => ({ created$: _created$$.asObservable() })),

  withMethods(
    (store, api = inject(MenuApi), menu = inject(MenuStore), toast = inject(ToastService)) => {
      const report = (error: unknown): void => toast.error(apiErrorMessage(error));

      return {
        // new items start unavailable, so they never reach guests half-filled
        create: rxMethod<string>(
          pipe(
            exhaustMap(categoryId => {
              patchState(store, { creating: true });

              return api
                .createItem({
                  categoryId,
                  name: NEW_ITEM_NAME,
                  price: DEFAULT_ITEM_PRICE,
                  available: false,
                  openPrice: false,
                })
                .pipe(
                  tapResponse({
                    next: ({ data, revision }) => {
                      menu.applyEditResult(revision, { type: 'item.created', item: data });
                      store._created$$.next(data);
                      toast.show('New items start as unavailable, switch them on when ready');
                    },
                    error: report,
                    finalize: () => patchState(store, { creating: false }),
                  }),
                );
            }),
          ),
        ),

        update: rxMethod<{ id: string; changes: Partial<MenuItemInput> }>(
          concatMapBy(
            ({ id }) => id,
            ({ id, changes }) => {
              patchState(store, state => ({
                edits: { ...state.edits, [id]: { ...state.edits[id], ...changes } },
              }));

              return api.updateItem(id, changes).pipe(
                tapResponse({
                  next: ({ data, revision }) => {
                    menu.applyEditResult(revision, { type: 'item.updated', item: data });
                    toast.show(describeEdit(changes, data));
                  },
                  error: report,
                  finalize: () =>
                    patchState(store, state => ({
                      edits: Object.fromEntries(
                        Object.entries(state.edits).filter(([key]) => key !== id),
                      ),
                    })),
                }),
              );
            },
          ),
        ),

        remove: rxMethod<string>(
          exhaustMapBy(
            id => id,
            id => {
              const { name } = menu.itemEntityMap()[id] ?? { name: 'Item' };

              patchState(store, state => ({ removing: [...state.removing, id] }));

              return api.removeItem(id).pipe(
                tapResponse({
                  next: revision => {
                    menu.applyEditResult(revision, { type: 'item.deleted', itemId: id });
                    toast.show(`${name} removed`);
                  },
                  error: report,
                  finalize: () =>
                    patchState(store, state => ({
                      removing: state.removing.filter(removing => removing !== id),
                    })),
                }),
              );
            },
          ),
        ),
      };
    },
  ),

  // the echo of an edit still in flight comes before its answer, so the store can't tell it is own
  withProps(({ edits, creating }) => ({
    remoteChanges$: inject(MenuStore).remoteChanges$.pipe(
      filter(
        (change): change is Extract<MenuEntityChange, { item: MenuItem }> =>
          (change.type === 'item.created' && !creating()) ||
          (change.type === 'item.updated' && edits()[change.item.id] === undefined),
      ),
      map(({ item }) => item),
    ),
  })),
);

function describeEdit(changes: Partial<MenuItemInput>, item: MenuItem): string {
  if (changes.openPrice !== undefined) {
    return item.openPrice
      ? `${item.name}: price is now entered when ordering`
      : `${item.name}: fixed price ${formatMoney(DEFAULT_ITEM_PRICE)}, adjust it if needed`;
  }

  if (changes.price !== undefined && item.price !== null) {
    return `${item.name} is now ${formatMoney(item.price)}`;
  }

  if (changes.available !== undefined) {
    return `${item.name} is ${item.available ? 'back on' : 'off'} the menu`;
  }

  return 'Saved';
}
