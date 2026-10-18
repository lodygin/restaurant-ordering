import { TestBed } from '@angular/core/testing';
import { defer, Subject, type Observable } from 'rxjs';

import { type Revised, type ServerEvent } from '@restaurant-ordering/web/common/sync';

import { OrdersApi } from '../api/orders.api';
import { type Order, type OrderEvent } from '../models';
import { OrdersStore } from './orders.store';

function order(number: number, status: Order['status'] = 'received'): Order {
  return {
    id: crypto.randomUUID(),
    number,
    createdAt: '2026-10-18T10:00:00.000Z',
    status,
    lines: [],
    subtotal: 1000,
    discount: 0,
    total: 1000,
  };
}

const first = order(1001, 'collected');
const second = order(1002, 'preparing');

class FakeOrdersApi {
  readonly snapshots: Subject<Revised<Order[]>>[] = [];
  readonly streams: { since: number; events: Subject<ServerEvent<OrderEvent>> }[] = [];

  // cold like HttpClient: every subscription (and so every retry) is a new request
  list(): Observable<Revised<Order[]>> {
    return defer(() => {
      const snapshot = new Subject<Revised<Order[]>>();

      this.snapshots.push(snapshot);

      return snapshot;
    });
  }

  events(since: number): Subject<ServerEvent<OrderEvent>> {
    const events = new Subject<ServerEvent<OrderEvent>>();

    this.streams.push({ since, events });

    return events;
  }

  respond(orders: Order[], revision = 10): void {
    const pending = this.snapshots.at(-1);

    pending?.next({ data: orders, revision });
    pending?.complete();
  }

  push(event: ServerEvent<OrderEvent>): void {
    this.streams.at(-1)?.events.next(event);
  }
}

describe('OrdersStore', () => {
  let store: InstanceType<typeof OrdersStore>;
  let api: FakeOrdersApi;

  beforeEach(() => {
    vi.useFakeTimers();
    api = new FakeOrdersApi();

    TestBed.configureTestingModule({
      providers: [OrdersStore, { provide: OrdersApi, useValue: api }],
    });

    store = TestBed.inject(OrdersStore);
  });

  afterEach(() => vi.useRealTimers());

  it('loads the orders, then follows the stream from their revision', () => {
    expect(store.status()).toBe('loading');

    api.respond([second, first]);

    expect(store.status()).toBe('loaded');
    expect(store.orders().map(entry => entry.number)).toEqual([1002, 1001]);
    expect(store.activeCount()).toBe(1);
    expect(api.streams[0]?.since).toBe(10);
  });

  it('puts a placed order first and moves statuses forward', () => {
    api.respond([second, first]);

    const third = order(1003);

    api.push({ type: 'message', id: 11, data: { type: 'order.placed', order: third } });
    api.push({
      type: 'message',
      id: 12,
      data: { type: 'order.updated', order: { ...second, status: 'ready' } },
    });

    expect(store.orders().map(entry => [entry.number, entry.status])).toEqual([
      [1003, 'received'],
      [1002, 'ready'],
      [1001, 'collected'],
    ]);
    expect(store.revision()).toBe(12);
  });

  it('skips events the snapshot already contains', () => {
    api.respond([second, first]);
    api.push({
      type: 'message',
      id: 10,
      data: { type: 'order.updated', order: { ...second, status: 'received' } },
    });

    expect(store.entityMap()[second.id]?.status).toBe('preparing');
  });

  it('remembers since when the statuses are stale', () => {
    vi.setSystemTime(new Date('2026-10-18T10:05:00Z'));
    api.respond([second]);
    api.push({ type: 'open' });

    expect(store.staleSince()).toBeNull();

    api.push({ type: 'reconnecting' });
    vi.advanceTimersByTime(60_000);
    api.push({ type: 'offline' });

    expect(store.connection()).toBe('offline');
    expect(store.staleSince()).toBe(new Date('2026-10-18T10:05:00Z').getTime());

    api.push({ type: 'open' });

    expect(store.staleSince()).toBeNull();
  });

  it('reloads the orders and reconnects from them on resync', () => {
    api.respond([second]);
    api.push({ type: 'message', id: 30, data: { type: 'resync' } });
    api.respond([second, first], 30);

    expect(store.orders()).toHaveLength(2);
    expect(api.streams[1]?.since).toBe(30);
  });

  it('starts over from a fresh snapshot when the stream breaks', () => {
    api.respond([second]);
    api.streams[0]?.events.error(new Error('unexpected event'));

    expect(store.connection()).toBe('reconnecting');

    vi.advanceTimersByTime(3000);
    api.respond([second], 15);

    expect(api.streams[1]?.since).toBe(15);
  });
});
