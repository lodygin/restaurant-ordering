import { inject } from '@angular/core';
import { concatMap, exhaustMap, groupBy, mergeMap, pipe } from 'rxjs';

import { tapResponse } from '@ngrx/operators';
import { patchState, signalStore, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { MenuApi, MenuStore } from '@restaurant-ordering/web/core/menu';
import { apiErrorMessage } from '@restaurant-ordering/web/infrastructure/http';
import { ToastService } from '@restaurant-ordering/web/ui/toast';

type CategorySetupState = {
  selectedId: string | null;
  creating: boolean;
  removing: string[];
};

const initialState: CategorySetupState = { selectedId: null, creating: false, removing: [] };

export const CategorySetupStore = signalStore(
  withState(initialState),

  withMethods(
    (store, api = inject(MenuApi), menu = inject(MenuStore), toast = inject(ToastService)) => {
      const report = (error: unknown): void => toast.error(apiErrorMessage(error));

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
                    toast.show(`${data.name} added`);
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
                      next: ({ data, revision }) => {
                        menu.applyEditResult(revision, {
                          type: 'category.updated',
                          category: data,
                        });
                        toast.show('Category renamed');
                      },
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
                  const { name } = menu.categoryEntityMap()[id] ?? { name: 'Category' };

                  patchState(store, state => ({ removing: [...state.removing, id] }));

                  return api.removeCategory(id).pipe(
                    tapResponse({
                      next: revision => {
                        menu.applyEditResult(revision, {
                          type: 'category.deleted',
                          categoryId: id,
                        });
                        toast.show(`${name} deleted`);
                      },
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
