import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { firstValueFrom, Subject, toArray } from 'rxjs';

import { ServerEvents, type ServerEvent } from '@restaurant-ordering/web/infrastructure/sse';

import { type Menu } from '../models';
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
});
