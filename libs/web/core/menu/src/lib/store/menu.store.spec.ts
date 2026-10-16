import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { type Category, type Menu, type MenuItem } from '../models';
import { MenuStore } from './menu.store';

const MENU_URL = '/api/v1/menu';

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

const menu: Menu = {
  revision: 42,
  categories: [soups, desserts, specials],
  items: [item('Tom yum', soups), item('Tiramisu', desserts), item('Borscht', soups)],
};

describe('MenuStore', () => {
  let store: InstanceType<typeof MenuStore>;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    store = TestBed.inject(MenuStore);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('loads the snapshot as soon as it is created', () => {
    expect(store.status()).toBe('loading');

    http.expectOne(MENU_URL).flush({ data: menu });

    expect(store.status()).toBe('loaded');
    expect(store.revision()).toBe(42);
    expect(store.categoryEntities().map(category => category.name)).toEqual([
      'Soups',
      'Desserts',
      'Specials',
    ]);
    expect(store.itemEntities().map(entry => entry.name)).toEqual([
      'Tom yum',
      'Tiramisu',
      'Borscht',
    ]);
  });

  it('groups items under their categories in menu order', () => {
    http.expectOne(MENU_URL).flush({ data: menu });

    const [first, second, third] = store.sections();

    expect(first?.category.name).toBe('Soups');
    expect(first?.items.map(entry => entry.name)).toEqual(['Tom yum', 'Borscht']);
    expect(second?.items.map(entry => entry.name)).toEqual(['Tiramisu']);
    expect(third?.items).toEqual([]);
  });

  it('replaces the previous snapshot on reload instead of merging into it', () => {
    http.expectOne(MENU_URL).flush({ data: menu });

    store.load();
    http
      .expectOne(MENU_URL)
      .flush({ data: { revision: 50, categories: [soups], items: [] } satisfies Menu });

    expect(store.revision()).toBe(50);
    expect(store.categoryIds()).toEqual([soups.id]);
    expect(store.itemIds()).toEqual([]);
  });

  it('keeps the last snapshot when a reload fails', () => {
    http.expectOne(MENU_URL).flush({ data: menu });

    store.load();
    http.expectOne(MENU_URL).flush(null, { status: 503, statusText: 'Unavailable' });

    expect(store.status()).toBe('error');
    expect(store.itemIds()).toHaveLength(3);
  });

  it('treats a response that does not match the model as an error', () => {
    http.expectOne(MENU_URL).flush({ data: { ...menu, revision: 'latest' } });

    expect(store.status()).toBe('error');
    expect(store.itemIds()).toEqual([]);
  });

  it('ignores a load while one is already in flight', () => {
    store.load();

    http.expectOne(MENU_URL).flush({ data: menu });
  });
});
