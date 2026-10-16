import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { concatMap, exhaustMap, groupBy, mergeMap, pipe } from 'rxjs';

import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { MenuApi, MenuStore } from '@restaurant-ordering/web/core/menu';
import { apiErrorMessage } from '@restaurant-ordering/web/infrastructure/http';

import { type CategorySetupState } from '../types';

const initialState: CategorySetupState = { selectedId: null, creating: false, removing: [] };

export const CategorySetupStore = signalStore(
  withState(initialState),

  withMethods(
    (store, api = inject(MenuApi), menu = inject(MenuStore), snackBar = inject(MatSnackBar)) => {
      const report = (error: unknown): void => {
        snackBar.open(apiErrorMessage(error), 'Dismiss', { duration: 5000 });
      };

      return {
        select(id: string): void {
          patchState(store, { selectedId: id });
        },

        create: rxMethod<string>(
          pipe(
            exhaustMap(name => {
              patchState(store, { creating: true });

              return api.createCategory({ name }).pipe(
                tapResponse({
                  next: ({ data, revision }) => {
                    menu.applyEditResult(revision, { type: 'category.created', category: data });
                    patchState(store, { selectedId: data.id });
                  },
                  error: report,
                  finalize: () => patchState(store, { creating: false }),
                }),
              );
            }),
          ),
        ),

        // edits of one category run in order, different categories in parallel
        rename: rxMethod<{ id: string; name: string }>(
          pipe(
            groupBy(({ id }) => id),
            mergeMap(renames =>
              renames.pipe(
                concatMap(({ id, name }) =>
                  api.updateCategory(id, { name }).pipe(
                    tapResponse({
                      next: ({ data, revision }) =>
                        menu.applyEditResult(revision, {
                          type: 'category.updated',
                          category: data,
                        }),
                      error: report,
                    }),
                  ),
                ),
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

                  return api.removeCategory(id).pipe(
                    tapResponse({
                      next: revision =>
                        menu.applyEditResult(revision, {
                          type: 'category.deleted',
                          categoryId: id,
                        }),
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
