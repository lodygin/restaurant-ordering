import { computed, inject } from '@angular/core';
import { Subject } from 'rxjs';

import {
  patchState,
  signalStore,
  type,
  withComputed,
  withFeature,
  withMethods,
  withProps,
  type WritableStateSource,
} from '@ngrx/signals';
import {
  removeEntity,
  setAllEntities,
  setEntity,
  withEntities,
  type NamedEntityState,
} from '@ngrx/signals/entities';

import { withLiveSync, type Revised } from '@restaurant-ordering/web/common/sync';

import { MenuApi } from '../api/menu.api';
import { type Category, type MenuEntityChange, type MenuItem } from '../models';
import { type MenuSection } from '../types';

type MenuEntitiesState = NamedEntityState<Category, 'category'> &
  NamedEntityState<MenuItem, 'item'>;

export const MenuStore = signalStore(
  { providedIn: 'root' },

  withEntities({ entity: type<Category>(), collection: 'category' }),
  withEntities({ entity: type<MenuItem>(), collection: 'item' }),

  withComputed(({ categoryEntities, itemEntities }) => ({
    sections: computed(() => toSections(categoryEntities(), itemEntities())),
  })),

  withProps(() => ({ _changes$$: new Subject<Revised<MenuEntityChange>>() })),
  withProps(({ _changes$$ }) => ({ changes$: _changes$$.asObservable() })),

  withFeature((store, api = inject(MenuApi)) =>
    withLiveSync({
      snapshot: () => api.snapshot(),
      events: since => api.changes(since),
      applySnapshot: menu =>
        patchState(
          store,
          setAllEntities(menu.categories, { collection: 'category' }),
          setAllEntities(menu.items, { collection: 'item' }),
        ),
      applyEvent: (change, revision) => {
        applyChange(store, change);
        store._changes$$.next({ data: change, revision });
      },
    }),
  ),

  withMethods(store => ({
    // the stream may already be past this edit; the revision itself stays the stream's
    applyEditResult(revision: number, change: MenuEntityChange): void {
      if (revision > (store.revision() ?? 0)) {
        applyChange(store, change);
      }
    },
  })),
);

function applyChange(
  store: WritableStateSource<MenuEntitiesState>,
  change: MenuEntityChange,
): void {
  switch (change.type) {
    case 'category.created':
    case 'category.updated':
      patchState(store, setEntity(change.category, { collection: 'category' }));

      break;
    case 'category.deleted':
      patchState(store, removeEntity(change.categoryId, { collection: 'category' }));

      break;
    case 'item.created':
    case 'item.updated':
      patchState(store, setEntity(change.item, { collection: 'item' }));

      break;
    case 'item.deleted':
      patchState(store, removeEntity(change.itemId, { collection: 'item' }));
  }
}

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
