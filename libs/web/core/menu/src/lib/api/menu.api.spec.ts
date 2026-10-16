import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Subject, toArray } from 'rxjs';

import { ServerEvents, type ServerEvent } from '@restaurant-ordering/web/infrastructure/sse';

import { type Category, type Menu, type MenuItem } from '../models';
import { MenuApi } from './menu.api';

const menu: Menu = {
  revision: 7,
  categories: [{ id: crypto.randomUUID(), name: 'Soups' }],
  items: [],
};

describe('MenuApi', () => {
  let api: MenuApi;
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

    api = TestBed.inject(MenuApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('unwraps and parses the snapshot', async () => {
    const result = firstValueFrom(api.snapshot());

    http.expectOne('/api/v1/menu').flush({ data: menu });

    await expect(result).resolves.toEqual(menu);
  });

  it('rejects a snapshot that does not match the model', async () => {
    const result = firstValueFrom(api.snapshot());

    http.expectOne('/api/v1/menu').flush({ data: { ...menu, revision: 'latest' } });

    await expect(result).rejects.toThrow();
  });

  it('follows the menu stream and parses its messages', async () => {
    const itemId = crypto.randomUUID();
    const events = firstValueFrom(api.changes(7).pipe(toArray()));

    stream.next({ type: 'open' });
    stream.next({ type: 'message', id: 8, data: { type: 'item.deleted', itemId } });
    stream.complete();

    expect(connect).toHaveBeenCalledWith('/api/v1/menu/events', 7);
    await expect(events).resolves.toEqual([
      { type: 'open' },
      { type: 'message', id: 8, data: { type: 'item.deleted', itemId } },
    ]);
  });

  it('fails on a message it does not understand', async () => {
    const events = firstValueFrom(api.changes(7));

    stream.next({ type: 'message', id: 8, data: { type: 'item.renamed' } });

    await expect(events).rejects.toThrow();
  });

  it('creates a category and parses the result', async () => {
    const category: Category = { id: crypto.randomUUID(), name: 'Drinks' };
    const result = firstValueFrom(api.createCategory({ name: 'Drinks' }));
    const request = http.expectOne('/api/v1/menu/categories');

    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ name: 'Drinks' });

    request.flush({ data: category });

    await expect(result).resolves.toEqual(category);
  });

  it('patches only the changed fields of an item', async () => {
    const item: MenuItem = {
      id: crypto.randomUUID(),
      categoryId: crypto.randomUUID(),
      name: 'Pho',
      description: '',
      price: 1100,
      available: false,
      openPrice: false,
    };

    const result = firstValueFrom(api.updateItem(item.id, { available: false }));
    const request = http.expectOne(`/api/v1/menu/items/${item.id}`);

    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ available: false });

    request.flush({ data: item });

    await expect(result).resolves.toEqual(item);
  });

  it('passes a conflict on category removal through to the caller', async () => {
    const id = crypto.randomUUID();
    const result = firstValueFrom(api.removeCategory(id));
    const request = http.expectOne(`/api/v1/menu/categories/${id}`);

    expect(request.request.method).toBe('DELETE');

    request.flush(
      { message: 'The category still has 2 item(s); move or delete them first.', itemCount: 2 },
      { status: 409, statusText: 'Conflict' },
    );

    await expect(result).rejects.toMatchObject({ status: 409, error: { itemCount: 2 } });
  });
});
