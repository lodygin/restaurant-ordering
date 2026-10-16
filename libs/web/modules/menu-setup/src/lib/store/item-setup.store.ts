import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { concatMap, exhaustMap, filter, groupBy, map, mergeMap, pipe, Subject } from 'rxjs';

import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withProps, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import {
  MenuApi,
  MenuStore,
  type MenuEntityChange,
  type MenuItem,
  type MenuItemInput,
} from '@restaurant-ordering/web/core/menu';
import { apiErrorMessage } from '@restaurant-ordering/web/infrastructure/http';

import { DEFAULT_ITEM_PRICE, NEW_ITEM_NAME } from '../constants';
import { type ItemSetupState } from '../types';

const initialState: ItemSetupState = { creating: false, edits: {}, removing: [] };

export const ItemSetupStore = signalStore(
  withState(initialState),

  withProps(() => ({
    _created$$: new Subject<MenuItem>(),
    _ownRevisions: new Set<number>(),
  })),
  withProps(({ _created$$ }) => ({ created$: _created$$.asObservable() })),

  withMethods(
    (store, api = inject(MenuApi), menu = inject(MenuStore), snackBar = inject(MatSnackBar)) => {
      const report = (error: unknown): void => {
        snackBar.open(apiErrorMessage(error), 'Dismiss', { duration: 5000 });
      };

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
                  description: '',
                  price: DEFAULT_ITEM_PRICE,
                  available: false,
                  openPrice: false,
                })
                .pipe(
                  tapResponse({
                    next: ({ data, revision }) => {
                      if (revision > (menu.revision() ?? 0)) {
                        store._ownRevisions.add(revision);
                      }

                      menu.applyEditResult(revision, { type: 'item.created', item: data });
                      store._created$$.next(data);
                    },
                    error: report,
                    finalize: () => patchState(store, { creating: false }),
                  }),
                );
            }),
          ),
        ),

        // edits of one item run in order, different items in parallel
        update: rxMethod<{ id: string; changes: Partial<MenuItemInput> }>(
          pipe(
            groupBy(({ id }) => id),
            mergeMap(edits =>
              edits.pipe(
                concatMap(({ id, changes }) => {
                  patchState(store, state => ({
                    edits: { ...state.edits, [id]: { ...state.edits[id], ...changes } },
                  }));

                  return api.updateItem(id, changes).pipe(
                    tapResponse({
                      next: ({ data, revision }) => {
                        // remembered until its echo arrives, unless the echo already did
                        if (revision > (menu.revision() ?? 0)) {
                          store._ownRevisions.add(revision);
                        }

                        menu.applyEditResult(revision, { type: 'item.updated', item: data });
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
                }),
              ),
            ),
          ),
        ),

        remove: rxMethod<string>(
          pipe(
            groupBy(id => id),
            mergeMap(ids =>
              ids.pipe(
                exhaustMap(id => {
                  patchState(store, state => ({ removing: [...state.removing, id] }));

                  return api.removeItem(id).pipe(
                    tapResponse({
                      next: revision =>
                        menu.applyEditResult(revision, { type: 'item.deleted', itemId: id }),
                      error: report,
                      finalize: () =>
                        patchState(store, state => ({
                          removing: state.removing.filter(removing => removing !== id),
                        })),
                    }),
                  );
                }),
              ),
            ),
          ),
        ),
      };
    },
  ),

  // an echo of an edit made here comes after its answer (own revision) or before it (in flight)
  withProps(({ _ownRevisions, edits, creating }) => ({
    remoteChanges$: inject(MenuStore).changes$.pipe(
      filter(({ revision }) => !_ownRevisions.delete(revision)),
      map(({ data }) => data),
      filter(
        (change): change is Extract<MenuEntityChange, { item: MenuItem }> =>
          (change.type === 'item.created' && !creating()) ||
          (change.type === 'item.updated' && edits()[change.item.id] === undefined),
      ),
      map(({ item }) => item),
    ),
  })),
);
