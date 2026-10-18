import { HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import * as z from 'zod/mini';

import { parse } from '@restaurant-ordering/web/common/zod';
import { ApiService } from '@restaurant-ordering/web/infrastructure/rest';

import { orderConflictSchema, orderSchema, type Order, type OrderChange } from '../models';
import { type OrderInput } from '../types';

@Injectable({ providedIn: 'root' })
export class OrdersApi {
  private readonly api = inject(ApiService);

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
