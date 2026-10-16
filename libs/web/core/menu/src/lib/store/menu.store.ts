import { computed, inject } from '@angular/core';
import { exhaustMap, pipe, tap } from 'rxjs';

import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  type,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { MenuApi } from '../api/menu.api';
import { type Category, type MenuItem } from '../models';
import { type MenuSection, type MenuState } from '../types';

const initialState: MenuState = { status: 'idle', revision: null };

export const MenuStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withEntities({ entity: type<Category>(), collection: 'category' }),
  withEntities({ entity: type<MenuItem>(), collection: 'item' }),

  withComputed(({ categoryEntities, itemEntities }) => ({
    sections: computed(() => toSections(categoryEntities(), itemEntities())),
  })),

  withMethods((store, api = inject(MenuApi)) => ({
    load: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { status: 'loading' })),
        exhaustMap(() =>
          api.snapshot().pipe(
            tapResponse({
              next: menu =>
                patchState(
                  store,
                  { status: 'loaded', revision: menu.revision },
                  setAllEntities(menu.categories, { collection: 'category' }),
                  setAllEntities(menu.items, { collection: 'item' }),
                ),
              error: () => patchState(store, { status: 'error' }),
            }),
          ),
        ),
      ),
    ),
  })),

  withHooks({ onInit: store => store.load() }),
);

function toSections(categories: Category[], items: MenuItem[]): MenuSection[] {
  const itemsByCategory = new Map<string, MenuItem[]>();

  for (const item of items) {
    const sectionItems = itemsByCategory.get(item.categoryId);

    if (sectionItems) {
      sectionItems.push(item);
    } else {
      itemsByCategory.set(item.categoryId, [item]);
    }
  }

  return categories.map(category => ({ category, items: itemsByCategory.get(category.id) ?? [] }));
}
