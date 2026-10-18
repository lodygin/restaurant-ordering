import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { defer, Subject, type Observable } from 'rxjs';

import { MenuStore, type MenuItem } from '@restaurant-ordering/web/core/menu';
import { OrdersApi, type Order, type OrderInput } from '@restaurant-ordering/web/core/orders';
import { ToastService } from '@restaurant-ordering/web/ui/toast';

import { CartStore } from './cart.store';

function item(name: string, changes: Partial<MenuItem> = {}): MenuItem {
  return {
    id: crypto.randomUUID(),
    categoryId: crypto.randomUUID(),
    name,
    price: 900,
    available: true,
    openPrice: false,
    ...changes,
  };
}

class FakeOrdersApi {
  readonly requests: { input: OrderInput; key: string; response: Subject<Order> }[] = [];

  // cold like HttpClient: every subscription (and so every retry) is a new request
  place(input: OrderInput, key: string): Observable<Order> {
    return defer(() => {
      const response = new Subject<Order>();

      this.requests.push({ input, key, response });

      return response;
    });
  }

  respond(number = 1001): void {
    const { response } = this.requests.at(-1) ?? {};

    response?.next({
      id: crypto.randomUUID(),
      number,
      createdAt: new Date().toISOString(),
      status: 'received',
      lines: [],
      subtotal: 0,
      discount: 0,
      total: 0,
    });
    response?.complete();
  }

  fail(status: number, error: unknown = null): void {
    this.requests.at(-1)?.response.error(new HttpErrorResponse({ status, error }));
  }
}

const pho = item('Pho');
const catch_ = item('Catch of the day', { price: null, openPrice: true });

describe('CartStore', () => {
  let cart: InstanceType<typeof CartStore>;
  let api: FakeOrdersApi;
  let toast: { error: ReturnType<typeof vi.fn> };
  const items = signal<Record<string, MenuItem>>({});

  const updateMenu = (...changed: MenuItem[]): void =>
    items.update(map => ({
      ...map,
      ...Object.fromEntries(changed.map(entry => [entry.id, entry])),
    }));

  beforeEach(() => {
    items.set({ [pho.id]: pho, [catch_.id]: catch_ });

    api = new FakeOrdersApi();
    toast = { error: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        { provide: MenuStore, useValue: { itemEntityMap: items } },
        { provide: OrdersApi, useValue: api },
        { provide: ToastService, useValue: toast },
      ],
    });

    cart = TestBed.inject(CartStore);
  });

  it('adds a fixed-price item to one line', () => {
    cart.add(pho);
    cart.add(pho, 2);

    expect(cart.lines()).toEqual([
      { lineId: pho.id, itemId: pho.id, name: 'Pho', unitPrice: 900, qty: 3, openPrice: false },
    ]);
    expect(cart.qtyByItem()).toEqual(new Map([[pho.id, 3]]));
  });

  it('keeps an open-price item at different prices on separate lines', () => {
    cart.add(catch_, 1, 2400);
    cart.add(catch_, 1, 3100);
    cart.add(catch_, 1, 2400);

    expect(cart.lines().map(line => [line.lineId, line.qty])).toEqual([
      [`${catch_.id}@2400`, 2],
      [`${catch_.id}@3100`, 1],
    ]);
  });

  it('ignores an open-price item added without a price', () => {
    cart.add(catch_);

    expect(cart.lines()).toEqual([]);
  });

  it('drops a line when its quantity reaches zero', () => {
    cart.add(pho, 2);
    cart.changeQty(pho.id, -1);

    expect(cart.count()).toBe(1);

    cart.changeQty(pho.id, -1);

    expect(cart.lines()).toEqual([]);
  });

  it('caps the discount at the subtotal', () => {
    cart.add(pho, 2);
    cart.setDiscount(500);

    expect(cart.total()).toBe(1300);

    cart.setDiscount(5000);

    expect(cart.appliedDiscount()).toBe(1800);
    expect(cart.total()).toBe(0);
  });

  it('flags lines the menu has changed under', () => {
    const soup = item('Soup');
    const steak = item('Steak');

    updateMenu(soup, steak);
    cart.add(pho);
    cart.add(soup);
    cart.add(steak);
    cart.add(catch_, 1, 2400);

    expect(cart.issues().size).toBe(0);

    updateMenu(
      { ...pho, price: 1100 },
      { ...soup, available: false },
      { ...steak, price: null, openPrice: true },
      { ...catch_, price: 2800, openPrice: false },
    );

    expect(cart.issues()).toEqual(
      new Map([
        [pho.id, { type: 'price', price: 1100 }],
        [soup.id, { type: 'unavailable' }],
        [steak.id, { type: 'now-open' }],
        [`${catch_.id}@2400`, { type: 'now-fixed', price: 2800 }],
      ]),
    );
  });

  it('flags a line whose item was deleted', () => {
    cart.add(pho);
    items.set({});

    expect(cart.issues()).toEqual(new Map([[pho.id, { type: 'unavailable' }]]));
  });

  describe('placing the order', () => {
    afterEach(() => vi.useRealTimers());

    it('sends the cart under a request key and empties it once placed', () => {
      cart.add(pho, 2);
      cart.setDiscount(300);
      cart.placeOrder();

      const [request] = api.requests;

      expect(cart.placing()).toBe(true);
      expect(request?.input).toEqual({
        lines: [{ lineId: pho.id, itemId: pho.id, unitPrice: 900, qty: 2, openPrice: false }],
        discount: 300,
      });
      expect(request?.key).toMatch(/^[\da-f-]{36}$/);

      api.respond(1042);

      expect(cart.lines()).toEqual([]);
      expect(cart.discount()).toBe(0);
      expect(cart.placing()).toBe(false);
      expect(cart.placedNumber()).toBe(1042);
    });

    it('ignores another click while the order is on its way', () => {
      cart.add(pho);
      cart.placeOrder();
      cart.placeOrder();

      expect(api.requests).toHaveLength(1);
    });

    it('retries a lost response with the same key', () => {
      vi.useFakeTimers();
      cart.add(pho);
      cart.placeOrder();
      api.fail(0);
      vi.advanceTimersByTime(1000);

      const [first, second] = api.requests;

      expect(second?.key).toBe(first?.key);

      api.respond();

      expect(cart.placedNumber()).toBe(1001);
    });

    it('keeps the key after a failure until the cart changes', () => {
      cart.add(pho);
      cart.placeOrder();
      api.fail(500);

      expect(toast.error).toHaveBeenCalledWith(
        'The server ran into a problem. Try again in a moment.',
      );
      expect(cart.placing()).toBe(false);

      cart.placeOrder();

      expect(api.requests[1]?.key).toBe(api.requests[0]?.key);

      api.fail(500);
      cart.add(pho);
      cart.placeOrder();

      expect(api.requests[2]?.key).not.toBe(api.requests[0]?.key);
    });

    it('brings a refused cart in line with the menu and reports what changed', () => {
      const soup = item('Soup');
      const steak = item('Steak');
      const conflicts = vi.fn();

      updateMenu(soup, steak);
      cart.conflicts$.subscribe(conflicts);
      cart.add(pho);
      cart.add(soup);
      cart.add(steak);
      cart.add(catch_, 1, 2400);
      cart.add(catch_, 2, 3100);
      cart.placeOrder();
      api.fail(409, {
        changes: [
          { type: 'price', lineId: pho.id, from: 900, to: 1100 },
          { type: 'unavailable', lineId: soup.id },
          { type: 'now-open', lineId: steak.id },
          { type: 'now-fixed', lineId: `${catch_.id}@2400`, from: 2400, to: 2800 },
          { type: 'now-fixed', lineId: `${catch_.id}@3100`, from: 3100, to: 2800 },
        ],
      });

      expect(
        cart
          .lines()
          .map(({ lineId, unitPrice, qty, openPrice }) => [lineId, unitPrice, qty, openPrice]),
      ).toEqual([
        [pho.id, 1100, 1, false],
        [catch_.id, 2800, 3, false],
      ]);
      expect(cart.requestKey()).toBeNull();
      expect(conflicts).toHaveBeenCalledWith([
        { type: 'price', lineId: pho.id, from: 900, to: 1100, name: 'Pho' },
        { type: 'unavailable', lineId: soup.id, name: 'Soup' },
        { type: 'now-open', lineId: steak.id, name: 'Steak' },
        {
          type: 'now-fixed',
          lineId: `${catch_.id}@2400`,
          from: 2400,
          to: 2800,
          name: 'Catch of the day',
        },
        {
          type: 'now-fixed',
          lineId: `${catch_.id}@3100`,
          from: 3100,
          to: 2800,
          name: 'Catch of the day',
        },
      ]);
      expect(toast.error).not.toHaveBeenCalled();
    });
  });
});
