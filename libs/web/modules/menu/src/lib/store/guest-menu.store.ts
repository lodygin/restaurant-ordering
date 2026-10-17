import { computed, inject } from '@angular/core';
import { map, pipe, tap } from 'rxjs';

import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { MenuStore, type MenuSection } from '@restaurant-ordering/web/core/menu';

import { type GuestMenuState, type MenuRow } from '../types';

const initialState: GuestMenuState = { query: '' };

export const GuestMenuStore = signalStore(
  withState(initialState),

  withComputed(({ query }, menu = inject(MenuStore)) => ({
    rows: computed(() => toRows(menu.sections(), query())),
    itemCount: computed(() => menu.itemIds().length),
  })),

  withComputed(({ rows }) => ({
    categories: computed(() =>
      rows().flatMap(row => (row.type === 'category' ? [row.category] : [])),
    ),
  })),

  withMethods(store => ({
    search: rxMethod<string>(
      pipe(
        map(query => query.trim()),
        tap(query => patchState(store, { query })),
      ),
    ),
  })),
);

function toRows(sections: MenuSection[], query: string): MenuRow[] {
  const needle = query.toLowerCase();

  return sections.flatMap<MenuRow>(({ category, items }) => {
    const shown = items.filter(item => item.name.toLowerCase().includes(needle));

    if (!shown.length) {
      return [];
    }

    return [
      { type: 'category', id: category.id, category, count: shown.length },
      ...shown.map(
        (item, index): MenuRow => ({
          type: 'item',
          id: item.id,
          item,
          first: index === 0,
          last: index === shown.length - 1,
        }),
      ),
    ];
  });
}
