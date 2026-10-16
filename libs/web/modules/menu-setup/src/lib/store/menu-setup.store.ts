import { inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { concatMap, exhaustMap, groupBy, mergeMap, pipe, type Observable } from 'rxjs';

import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { MenuApi, MenuStore, type MenuEntityChange } from '@restaurant-ordering/web/core/menu';
import { apiErrorMessage } from '@restaurant-ordering/web/infrastructure/http';

import { type MenuSetupState } from '../types';

const initialState: MenuSetupState = { availability: {}, removing: [] };

export const MenuSetupStore = signalStore(
  withState(initialState),

  withMethods(
    (store, api = inject(MenuApi), menu = inject(MenuStore), snackBar = inject(MatSnackBar)) => {
      const report = (error: unknown): void => {
        snackBar.open(apiErrorMessage(error), 'Dismiss', { duration: 5000 });
      };

      const remove = (
        id: string,
        request: Observable<number>,
        change: MenuEntityChange,
      ): Observable<number> => {
        patchState(store, state => ({ removing: [...state.removing, id] }));

        return request.pipe(
          tapResponse({
            next: revision => menu.applyEditResult(revision, change),
            error: report,
            finalize: () =>
              patchState(store, state => ({
                removing: state.removing.filter(removing => removing !== id),
              })),
          }),
        );
      };

      // edits of one entity run in order, different entities in parallel
      return {
        setAvailability: rxMethod<{ id: string; available: boolean }>(
          pipe(
            groupBy(({ id }) => id),
            mergeMap(edits =>
              edits.pipe(
                concatMap(({ id, available }) => {
                  patchState(store, state => ({
                    availability: { ...state.availability, [id]: available },
                  }));

                  return api.updateItem(id, { available }).pipe(
                    tapResponse({
                      next: ({ data, revision }) =>
                        menu.applyEditResult(revision, { type: 'item.updated', item: data }),
                      error: report,
                      finalize: () =>
                        patchState(store, state => ({
                          availability: Object.fromEntries(
                            Object.entries(state.availability).filter(([key]) => key !== id),
                          ),
                        })),
                    }),
                  );
                }),
              ),
            ),
          ),
        ),

        removeItem: rxMethod<string>(
          pipe(
            groupBy(id => id),
            mergeMap(ids =>
              ids.pipe(
                exhaustMap(id =>
                  remove(id, api.removeItem(id), { type: 'item.deleted', itemId: id }),
                ),
              ),
            ),
          ),
        ),

        removeCategory: rxMethod<string>(
          pipe(
            groupBy(id => id),
            mergeMap(ids =>
              ids.pipe(
                exhaustMap(id =>
                  remove(id, api.removeCategory(id), { type: 'category.deleted', categoryId: id }),
                ),
              ),
            ),
          ),
        ),
      };
    },
  ),
);
