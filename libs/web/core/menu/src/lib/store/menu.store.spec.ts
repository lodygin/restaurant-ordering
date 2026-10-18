import { TestBed } from '@angular/core/testing';
import { defer, Subject, type Observable } from 'rxjs';

import { type Revised, type ServerEvent } from '@restaurant-ordering/web/common/sync';

import { MenuApi } from '../api/menu.api';
import { type Category, type Menu, type MenuChange, type MenuItem } from '../models';
import { MenuStore } from './menu.store';

const soups: Category = { id: crypto.randomUUID(), name: 'Soups' };
const desserts: Category = { id: crypto.randomUUID(), name: 'Desserts' };
const specials: Category = { id: crypto.randomUUID(), name: 'Specials' };

function item(name: string, category: Category): MenuItem {
  return {
    id: crypto.randomUUID(),
    categoryId: category.id,
    name,
    description: '',
    price: 900,
    available: true,
    openPrice: false,
  };
}

const tomYum = item('Tom yum', soups);
const tiramisu = item('Tiramisu', desserts);
const borscht = item('Borscht', soups);

const menu: Menu = {
  categories: [soups, desserts, specials],
  items: [tomYum, tiramisu, borscht],
};

class FakeMenuApi {
  readonly snapshots: Subject<Revised<Menu>>[] = [];
  readonly streams: { since: number; events: Subject<ServerEvent<MenuChange>> }[] = [];

  // cold like HttpClient: every subscription (and so every retry) is a new request
  snapshot(): Observable<Revised<Menu>> {
    return defer(() => {
      const snapshot = new Subject<Revised<Menu>>();

      this.snapshots.push(snapshot);

      return snapshot;
    });
  }

  changes(since: number): Subject<ServerEvent<MenuChange>> {
    const events = new Subject<ServerEvent<MenuChange>>();

    this.streams.push({ since, events });

    return events;
  }

  respond(snapshot: Menu, revision = 42): void {
    const pending = this.snapshots.at(-1);

    pending?.next({ data: snapshot, revision });
    pending?.complete();
  }

  push(event: ServerEvent<MenuChange>): void {
    this.streams.at(-1)?.events.next(event);
  }
}

describe('MenuStore', () => {
  let store: InstanceType<typeof MenuStore>;
  let api: FakeMenuApi;

  beforeEach(() => {
    api = new FakeMenuApi();

    TestBed.configureTestingModule({ providers: [{ provide: MenuApi, useValue: api }] });

    store = TestBed.inject(MenuStore);
  });

  it('loads the snapshot, then follows changes from its revision', () => {
    expect(store.status()).toBe('loading');
    expect(api.streams).toHaveLength(0);

    api.respond(menu);

    expect(store.status()).toBe('loaded');
    expect(store.revision()).toBe(42);
    expect(store.itemEntities().map(entry => entry.name)).toEqual([
      'Tom yum',
      'Tiramisu',
      'Borscht',
    ]);
    expect(api.streams[0]?.since).toBe(42);
  });

  it('groups items under their categories in menu order', () => {
    api.respond(menu);

    const [first, second, third] = store.sections();

    expect(first?.category.name).toBe('Soups');
    expect(first?.items.map(entry => entry.name)).toEqual(['Tom yum', 'Borscht']);
    expect(second?.items.map(entry => entry.name)).toEqual(['Tiramisu']);
    expect(third?.items).toEqual([]);
  });

  it('applies item changes and moves the revision', () => {
    api.respond(menu);

    const pho = item('Pho', soups);

    api.push({ type: 'message', id: 43, data: { type: 'item.created', item: pho } });
    api.push({
      type: 'message',
      id: 44,
      data: { type: 'item.updated', item: { ...tiramisu, price: 1200, available: false } },
    });
    api.push({ type: 'message', id: 45, data: { type: 'item.deleted', itemId: borscht.id } });

    expect(store.revision()).toBe(45);
    expect(store.itemEntityMap()[tiramisu.id]).toMatchObject({ price: 1200, available: false });
    expect(store.sections()[0]?.items.map(entry => entry.name)).toEqual(['Tom yum', 'Pho']);
  });

  it('moves an item to another category', () => {
    api.respond(menu);
    api.push({
      type: 'message',
      id: 43,
      data: { type: 'item.updated', item: { ...tiramisu, categoryId: specials.id } },
    });

    expect(store.sections()[1]?.items).toEqual([]);
    expect(store.sections()[2]?.items.map(entry => entry.name)).toEqual(['Tiramisu']);
  });

  it('applies category changes', () => {
    api.respond(menu);

    const drinks: Category = { id: crypto.randomUUID(), name: 'Drinks' };

    api.push({ type: 'message', id: 43, data: { type: 'category.created', category: drinks } });
    api.push({
      type: 'message',
      id: 44,
      data: { type: 'category.updated', category: { ...soups, name: 'Hot soups' } },
    });
    api.push({
      type: 'message',
      id: 45,
      data: { type: 'category.deleted', categoryId: specials.id },
    });

    expect(store.sections().map(section => section.category.name)).toEqual([
      'Hot soups',
      'Desserts',
      'Drinks',
    ]);
  });

  it('applies its own edit before the stream echoes it, leaving the revision to the stream', () => {
    api.respond(menu);
    store.applyEditResult(43, { type: 'item.updated', item: { ...tomYum, available: false } });

    expect(store.itemEntityMap()[tomYum.id]?.available).toBe(false);
    expect(store.revision()).toBe(42);
  });

  it('ignores its own edit when the stream has already moved past it', () => {
    api.respond(menu);
    api.push({
      type: 'message',
      id: 44,
      data: { type: 'item.updated', item: { ...tomYum, price: 1500 } },
    });
    store.applyEditResult(43, { type: 'item.updated', item: { ...tomYum, available: false } });

    expect(store.itemEntityMap()[tomYum.id]).toMatchObject({ price: 1500, available: true });
  });

  it('announces every change it applies from the stream', () => {
    const remote = vi.fn();

    store.remoteChanges$.subscribe(remote);
    api.respond(menu);
    api.push({ type: 'message', id: 42, data: { type: 'item.deleted', itemId: tomYum.id } });
    api.push({ type: 'message', id: 43, data: { type: 'item.deleted', itemId: borscht.id } });

    expect(remote).toHaveBeenCalledOnce();
    expect(remote).toHaveBeenCalledWith({ type: 'item.deleted', itemId: borscht.id });
  });

  it('keeps the echo of its own edit to itself', () => {
    const remote = vi.fn();

    store.remoteChanges$.subscribe(remote);
    api.respond(menu);
    store.applyEditResult(43, { type: 'item.deleted', itemId: tomYum.id });
    api.push({ type: 'message', id: 43, data: { type: 'item.deleted', itemId: tomYum.id } });

    expect(remote).not.toHaveBeenCalled();

    api.push({ type: 'message', id: 44, data: { type: 'item.deleted', itemId: borscht.id } });

    expect(remote).toHaveBeenCalledWith({ type: 'item.deleted', itemId: borscht.id });
  });
});
