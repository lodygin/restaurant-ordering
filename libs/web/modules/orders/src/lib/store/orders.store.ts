import { computed, inject } from '@angular/core';

import { patchState, signalStore, type, withComputed, withFeature } from '@ngrx/signals';
import { setAllEntities, setEntity, withEntities } from '@ngrx/signals/entities';

import { withLiveSync } from '@restaurant-ordering/web/common/sync';
import { OrdersApi, type Order } from '@restaurant-ordering/web/core/orders';

export const OrdersStore = signalStore(
  withEntities({ entity: type<Order>() }),

  withComputed(({ entities }) => ({
    orders: computed(() => entities().toSorted((a, b) => b.number - a.number)),
    activeCount: computed(() => entities().filter(order => order.status !== 'collected').length),
  })),

  withFeature((store, api = inject(OrdersApi)) =>
    withLiveSync({
      snapshot: () => api.list(),
      events: since => api.events(since),
      applySnapshot: orders => patchState(store, setAllEntities(orders)),
      applyEvent: event => patchState(store, setEntity(event.order)),
    }),
  ),
);
