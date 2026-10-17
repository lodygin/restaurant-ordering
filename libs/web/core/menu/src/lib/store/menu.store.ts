import { computed, inject } from '@angular/core';
import { pipe, repeat, retry, Subject, switchMap, takeWhile, tap, timer } from 'rxjs';

import {
  patchState,
  signalStore,
  type,
  withComputed,
  withHooks,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import { removeEntity, setAllEntities, setEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { MenuApi } from '../api/menu.api';
import { type Category, type MenuEntityChange, type MenuItem } from '../models';
import { type MenuConnection, type MenuSection, type MenuStatus, type Revised } from '../types';

type MenuState = {
  status: MenuStatus;
  connection: MenuConnection;
  revision: number | null;
};

const SNAPSHOT_RETRY_MS = 3000;

const initialState: MenuState = { status: 'idle', connection: 'connecting', revision: null };

export const MenuStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),

  withEntities({ entity: type<Category>(), collection: 'category' }),
  withEntities({ entity: type<MenuItem>(), collection: 'item' }),

  withComputed(({ categoryEntities, itemEntities }) => ({
    sections: computed(() => toSections(categoryEntities(), itemEntities())),
  })),

  withProps(() => ({ _changes$$: new Subject<Revised<MenuEntityChange>>() })),
  withProps(({ _changes$$ }) => ({ changes$: _changes$$.asObservable() })),

  withMethods((store, api = inject(MenuApi)) => {
    const applyChange = (change: MenuEntityChange): void => {
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
    };

    return {
      // the stream may already be past this edit; the revision itself stays the stream's
      applyEditResult(revision: number, change: MenuEntityChange): void {
        if (revision > (store.revision() ?? 0)) {
          applyChange(change);
        }
      },

      // snapshot first, then the stream from its revision; a resync completes it and repeat() starts over
      sync: rxMethod<void>(
        pipe(
          switchMap(() => {
            patchState(store, { status: 'loading' });

            return api.snapshot().pipe(
              retry({
                delay: () => {
                  patchState(store, { status: 'error', connection: 'reconnecting' });

                  return timer(SNAPSHOT_RETRY_MS);
                },
              }),
              tap(({ data, revision }) =>
                patchState(
                  store,
                  { status: 'loaded', revision },
                  setAllEntities(data.categories, { collection: 'category' }),
                  setAllEntities(data.items, { collection: 'item' }),
                ),
              ),
              switchMap(({ revision }) => api.changes(revision)),
              takeWhile(event => event.type !== 'message' || event.data.type !== 'resync'),
              repeat(),
              tap(event => {
                if (event.type !== 'message') {
                  patchState(store, {
                    connection: event.type === 'open' ? 'online' : event.type,
                  });

                  return;
                }

                const { id: revision, data: change } = event;

                // a reconnect replays what the snapshot already holds
                if (change.type === 'resync' || revision <= (store.revision() ?? 0)) {
                  return;
                }

                applyChange(change);
                patchState(store, { revision });
                store._changes$$.next({ data: change, revision });
              }),
              // a broken stream starts over from a fresh snapshot
              retry({
                delay: () => {
                  patchState(store, { connection: 'reconnecting' });

                  return timer(SNAPSHOT_RETRY_MS);
                },
              }),
            );
          }),
        ),
      ),
    };
  }),

  withHooks({ onInit: store => store.sync() }),
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
