import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import * as z from 'zod/mini';

import { type Revised, type ServerEvent } from '@restaurant-ordering/web/common/sync';
import { parse, parseEvents } from '@restaurant-ordering/web/common/zod';
import { ApiService } from '@restaurant-ordering/web/infrastructure/rest';
import { ServerEvents } from '@restaurant-ordering/web/infrastructure/sse';

import {
  orderConflictSchema,
  orderEventSchema,
  orderSchema,
  type Order,
  type OrderChange,
  type OrderEvent,
} from '../models';
import { type OrderInput } from '../types';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly api = inject(ApiService);
  private readonly serverEvents = inject(ServerEvents);

  list(): Observable<Revised<Order[]>> {
    return this.api.ordersList().pipe(
      parse(z.object({ data: z.array(orderSchema), meta: z.object({ revision: z.int() }) })),
      map(({ data, meta }) => ({ data, revision: meta.revision })),
    );
  }

  events(since: number): Observable<ServerEvent<OrderEvent>> {
    return this.serverEvents
      .connect('/api/v1/orders/events', since)
      .pipe(parseEvents(orderEventSchema));
  }

  place(input: OrderInput, idempotencyKey: string): Observable<Order> {
    return this.api.ordersPlace(input, { headers: { 'Idempotency-Key': idempotencyKey } }).pipe(
      parse(z.object({ data: orderSchema })),
      map(({ data }) => data),
    );
  }

  // what changed in the menu, when a 409 says the order was refused for it
  static readConflict(error: unknown): OrderChange[] | null {
    if (!(error instanceof HttpErrorResponse) || error.status !== 409) {
      return null;
    }

    return orderConflictSchema.safeParse(error.error).data?.changes ?? null;
  }
}
