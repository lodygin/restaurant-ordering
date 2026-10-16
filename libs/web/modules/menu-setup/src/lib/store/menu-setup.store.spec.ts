import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

import {
  MenuApi,
  MenuStore,
  type MenuItem,
  type Revised,
} from '@restaurant-ordering/web/core/menu';

import { MenuSetupStore } from './menu-setup.store';

const pho: MenuItem = {
  id: crypto.randomUUID(),
  categoryId: crypto.randomUUID(),
  name: 'Pho',
  description: '',
  price: 1100,
  available: false,
  openPrice: false,
};

describe('MenuSetupStore', () => {
  let store: InstanceType<typeof MenuSetupStore>;
  let update: Subject<Revised<MenuItem>>;
  let removal: Subject<number>;
  let applyEditResult: ReturnType<typeof vi.fn>;
  let open: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    update = new Subject();
    removal = new Subject();
    applyEditResult = vi.fn();
    open = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        MenuSetupStore,
        {
          provide: MenuApi,
          useValue: {
            updateItem: () => update,
            removeItem: () => removal,
            removeCategory: () => removal,
          },
        },
        { provide: MenuStore, useValue: { applyEditResult } },
        { provide: MatSnackBar, useValue: { open } },
      ],
    });

    store = TestBed.inject(MenuSetupStore);
  });

  it('shows the edit until the server answers, then applies the answer', () => {
    store.updateItem({ id: pho.id, changes: { name: 'Pho bo' } });

    expect(store.edits()).toEqual({ [pho.id]: { name: 'Pho bo' } });

    update.next({ data: { ...pho, name: 'Pho bo' }, revision: 50 });
    update.complete();

    expect(applyEditResult).toHaveBeenCalledWith(50, {
      type: 'item.updated',
      item: { ...pho, name: 'Pho bo' },
    });
    expect(store.edits()).toEqual({});
  });

  it('drops the edit and reports the error when the update fails', () => {
    store.updateItem({ id: pho.id, changes: { available: true } });
    update.error(new HttpErrorResponse({ status: 500 }));

    expect(store.edits()).toEqual({});
    expect(applyEditResult).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith('Something went wrong. Try again.', 'Dismiss', {
      duration: 5000,
    });
  });

  it('applies a removal with its revision', () => {
    store.removeItem(pho.id);

    expect(store.removing()).toEqual([pho.id]);

    removal.next(51);
    removal.complete();

    expect(applyEditResult).toHaveBeenCalledWith(51, { type: 'item.deleted', itemId: pho.id });
    expect(store.removing()).toEqual([]);
  });

  it('sends one removal per entity while it is in flight', () => {
    const removeItem = vi.spyOn(TestBed.inject(MenuApi), 'removeItem');

    store.removeItem(pho.id);
    store.removeItem(pho.id);

    expect(removeItem).toHaveBeenCalledTimes(1);
  });

  it('marks a category as removing and shows why the server refused', () => {
    store.removeCategory('soups');

    expect(store.removing()).toEqual(['soups']);

    removal.error(
      new HttpErrorResponse({
        status: 409,
        error: { message: 'The category still has 2 item(s); move or delete them first.' },
      }),
    );

    expect(store.removing()).toEqual([]);
    expect(open).toHaveBeenCalledWith(
      'The category still has 2 item(s); move or delete them first.',
      'Dismiss',
      { duration: 5000 },
    );
  });
});
