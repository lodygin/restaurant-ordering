import { computed, inject } from '@angular/core';
import { pipe, repeat, retry, switchMap, takeWhile, tap, timer } from 'rxjs';

import {
  patchState,
  signalStore,
  type,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { setAllEntities, setEntity, withEntities } from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import { type StreamConnection } from '@restaurant-ordering/web/infrastructure/sse';

import { OrdersApi } from '../api/orders.api';
import { type Order } from '../models';
import { type OrdersStatus } from '../types';

type OrdersState = {
  status: OrdersStatus;
  connection: StreamConnection;
  revision: number | null;
  /** When the statuses stopped being live; null while the stream is open. */
  staleSince: number | null;
};

const SNAPSHOT_RETRY_MS = 3000;

const initialState: OrdersState = {
  status: 'idle',
  connection: 'connecting',
  revision: null,
  staleSince: null,
};

// lives with the orders page: the stream stays open only while someone looks at it
export const OrdersStore = signalStore(
  withState(initialState),

  withEntities({ entity: type<Order>() }),

  withComputed(({ entities }) => ({
    orders: computed(() => entities().toSorted((a, b) => b.number - a.number)),
    activeCount: computed(() => entities().filter(order => order.status !== 'collected').length),
  })),

  withMethods((store, api = inject(OrdersApi)) => {
    const setConnection = (connection: StreamConnection): void =>
      patchState(store, {
        connection,
        staleSince: connection === 'online' ? null : (store.staleSince() ?? Date.now()),
      });

    return {
      // snapshot first, then the stream from its revision; a resync completes it and repeat() starts over
      sync: rxMethod<void>(
        pipe(
          switchMap(() => {
            patchState(store, { status: 'loading' });

            return api.list().pipe(
              retry({
                delay: () => {
                  patchState(store, { status: 'error' });
                  setConnection('reconnecting');

                  return timer(SNAPSHOT_RETRY_MS);
                },
              }),
              tap(({ data, revision }) =>
                patchState(store, { status: 'loaded', revision }, setAllEntities(data)),
              ),
              switchMap(({ revision }) => api.events(revision)),
              takeWhile(event => event.type !== 'message' || event.data.type !== 'resync'),
              repeat(),
              tap(event => {
                if (event.type !== 'message') {
                  setConnection(event.type === 'open' ? 'online' : event.type);

                  return;
                }

                const { id: revision, data: change } = event;

                // a reconnect replays what the snapshot already holds
                if (change.type === 'resync' || revision <= (store.revision() ?? 0)) {
                  return;
                }

                patchState(store, { revision }, setEntity(change.order));
              }),
              // a broken stream starts over from a fresh snapshot
              retry({
                delay: () => {
                  setConnection('reconnecting');

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
