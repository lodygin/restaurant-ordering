import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { concatMap, exhaustMap, groupBy, mergeMap, pipe } from 'rxjs';

import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { MenuApi, MenuStore, type MenuItemInput } from '@restaurant-ordering/web/core/menu';
import { apiErrorMessage } from '@restaurant-ordering/web/infrastructure/http';

import { type ItemSetupState } from '../types';

const initialState: ItemSetupState = { edits: {}, removing: [] };

export const ItemSetupStore = signalStore(
  withState(initialState),

  withMethods(
    (store, api = inject(MenuApi), menu = inject(MenuStore), snackBar = inject(MatSnackBar)) => {
      const report = (error: unknown): void => {
        snackBar.open(apiErrorMessage(error), 'Dismiss', { duration: 5000 });
      };

      // edits of one item run in order, different items in parallel
      return {
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
                      next: ({ data, revision }) =>
                        menu.applyEditResult(revision, { type: 'item.updated', item: data }),
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
);
