import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Subject, toArray } from 'rxjs';

import { type ServerEvent } from '@restaurant-ordering/web/common/sync';
import { ServerEvents } from '@restaurant-ordering/web/infrastructure/sse';

import { type Order } from '../models';
import { OrdersApi } from './orders.api';

const order: Order = {
  id: crypto.randomUUID(),
  number: 1001,
  createdAt: '2026-10-18T10:00:00.000Z',
  status: 'received',
  lines: [{ itemId: crypto.randomUUID(), name: 'Pho', unitPrice: 1100, qty: 2 }],
  subtotal: 2200,
  discount: 0,
  total: 2200,
};

describe('OrdersApi', () => {
  let api: OrdersApi;
  let http: HttpTestingController;
  let stream: Subject<ServerEvent<unknown>>;
  let connect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    stream = new Subject();
    connect = vi.fn(() => stream);

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ServerEvents, useValue: { connect } },
      ],
    });

    api = TestBed.inject(OrdersApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('parses the orders together with their revision', async () => {
    const result = firstValueFrom(api.list());

    http.expectOne('/api/v1/orders').flush({ data: [order], meta: { revision: 3 } });

    await expect(result).resolves.toEqual({ data: [order], revision: 3 });
  });

  it('rejects an order with a status it does not know', async () => {
    const result = firstValueFrom(api.list());

    http
      .expectOne('/api/v1/orders')
      .flush({ data: [{ ...order, status: 'lost' }], meta: { revision: 3 } });

    await expect(result).rejects.toThrow();
  });

  it('follows the orders stream and parses its messages', async () => {
    const events = firstValueFrom(api.events(3).pipe(toArray()));

    stream.next({ type: 'open' });
    stream.next({ type: 'message', id: 4, data: { type: 'order.updated', order } });
    stream.complete();

    expect(connect).toHaveBeenCalledWith('/api/v1/orders/events', 3);
    await expect(events).resolves.toEqual([
      { type: 'open' },
      { type: 'message', id: 4, data: { type: 'order.updated', order } },
    ]);
  });
});
