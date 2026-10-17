import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { MenuStore, type MenuItem } from '@restaurant-ordering/web/core/menu';

import { CartStore } from './cart.store';

function item(name: string, changes: Partial<MenuItem> = {}): MenuItem {
  return {
    id: crypto.randomUUID(),
    categoryId: crypto.randomUUID(),
    name,
    description: '',
    price: 900,
    available: true,
    openPrice: false,
    ...changes,
  };
}

const pho = item('Pho');
const catch_ = item('Catch of the day', { price: null, openPrice: true });

describe('CartStore', () => {
  let cart: InstanceType<typeof CartStore>;
  const items = signal<Record<string, MenuItem>>({});

  const updateMenu = (...changed: MenuItem[]): void =>
    items.update(map => ({
      ...map,
      ...Object.fromEntries(changed.map(entry => [entry.id, entry])),
    }));

  beforeEach(() => {
    items.set({ [pho.id]: pho, [catch_.id]: catch_ });

    TestBed.configureTestingModule({
      providers: [{ provide: MenuStore, useValue: { itemEntityMap: items } }],
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
});
