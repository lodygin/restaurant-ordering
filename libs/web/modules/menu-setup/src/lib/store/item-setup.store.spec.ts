import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

import {
  MenuApi,
  MenuStore,
  type MenuEntityChange,
  type MenuItem,
  type Revised,
} from '@restaurant-ordering/web/core/menu';

import { ItemSetupStore } from './item-setup.store';

const pho: MenuItem = {
  id: crypto.randomUUID(),
  categoryId: crypto.randomUUID(),
  name: 'Pho',
  description: '',
  price: 1100,
  available: false,
  openPrice: false,
};

describe('ItemSetupStore', () => {
  let store: InstanceType<typeof ItemSetupStore>;
  let update: Subject<Revised<MenuItem>>;
  let removal: Subject<number>;
  let creation: Subject<Revised<MenuItem>>;
  let applyEditResult: ReturnType<typeof vi.fn>;
  let menuChanges: Subject<Revised<MenuEntityChange>>;
  let open: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    update = new Subject();
    removal = new Subject();
    creation = new Subject();
    applyEditResult = vi.fn();
    menuChanges = new Subject();
    open = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        ItemSetupStore,
        {
          provide: MenuApi,
          useValue: {
            createItem: vi.fn(() => creation),
            updateItem: () => update,
            removeItem: () => removal,
          },
        },
        {
          provide: MenuStore,
          useValue: {
            applyEditResult,
            revision: () => 40,
            changes$: menuChanges,
            itemEntityMap: () => ({}),
          },
        },
        { provide: MatSnackBar, useValue: { open } },
      ],
    });

    store = TestBed.inject(ItemSetupStore);
  });

  it('shows the edit until the server answers, then applies the answer', () => {
    store.update({ id: pho.id, changes: { name: 'Pho bo' } });

    expect(store.edits()).toEqual({ [pho.id]: { name: 'Pho bo' } });

    update.next({ data: { ...pho, name: 'Pho bo' }, revision: 50 });
    update.complete();

    expect(applyEditResult).toHaveBeenCalledWith(50, {
      type: 'item.updated',
      item: { ...pho, name: 'Pho bo' },
    });
    expect(store.edits()).toEqual({});
    expect(open).toHaveBeenCalledWith('Saved', undefined, { duration: 3000 });
  });

  it('tells what an edit changed', () => {
    store.update({ id: pho.id, changes: { price: 1250 } });
    update.next({ data: { ...pho, price: 1250 }, revision: 50 });

    expect(open).toHaveBeenCalledWith('Pho is now $12.50', undefined, { duration: 3000 });
  });

  it('drops the edit and reports the error when the update fails', () => {
    store.update({ id: pho.id, changes: { available: true } });
    update.error(new HttpErrorResponse({ status: 500 }));

    expect(store.edits()).toEqual({});
    expect(applyEditResult).not.toHaveBeenCalled();
    expect(open).toHaveBeenCalledWith('Something went wrong. Try again.', 'Dismiss', {
      duration: 5000,
    });
  });

  it('applies a removal with its revision', () => {
    store.remove(pho.id);

    expect(store.removing()).toEqual([pho.id]);

    removal.next(51);
    removal.complete();

    expect(applyEditResult).toHaveBeenCalledWith(51, { type: 'item.deleted', itemId: pho.id });
    expect(store.removing()).toEqual([]);
  });

  it('sends one removal per item while it is in flight', () => {
    const removeItem = vi.spyOn(TestBed.inject(MenuApi), 'removeItem');

    store.remove(pho.id);
    store.remove(pho.id);

    expect(removeItem).toHaveBeenCalledTimes(1);
  });

  it('creates an unavailable item and announces it', () => {
    const createItem = vi.spyOn(TestBed.inject(MenuApi), 'createItem');
    const created = vi.fn();

    store.created$.subscribe(created);

    store.create(pho.categoryId);

    expect(createItem).toHaveBeenCalledWith({
      categoryId: pho.categoryId,
      name: 'New item',
      description: '',
      price: 1000,
      available: false,
      openPrice: false,
    });
    expect(store.creating()).toBe(true);

    creation.next({ data: pho, revision: 70 });
    creation.complete();

    expect(applyEditResult).toHaveBeenCalledWith(70, { type: 'item.created', item: pho });
    expect(created).toHaveBeenCalledWith(pho);
    expect(store.creating()).toBe(false);
  });

  describe('remote changes', () => {
    let remote: ReturnType<typeof vi.fn<(item: MenuItem) => void>>;

    beforeEach(() => {
      remote = vi.fn();
      store.remoteChanges$.subscribe(remote);
    });

    it('passes on an update made elsewhere', () => {
      menuChanges.next({ data: { type: 'item.updated', item: pho }, revision: 41 });

      expect(remote).toHaveBeenCalledWith(pho);
    });

    it('skips the echo of an edit made here', () => {
      store.update({ id: pho.id, changes: { name: 'Pho bo' } });
      update.next({ data: { ...pho, name: 'Pho bo' }, revision: 41 });
      update.complete();
      menuChanges.next({
        data: { type: 'item.updated', item: { ...pho, name: 'Pho bo' } },
        revision: 41,
      });

      expect(remote).not.toHaveBeenCalled();
    });

    it('passes on an item created elsewhere', () => {
      menuChanges.next({ data: { type: 'item.created', item: pho }, revision: 41 });

      expect(remote).toHaveBeenCalledWith(pho);
    });

    it('skips the echo of an item created here, before and after the answer', () => {
      store.create(pho.categoryId);
      menuChanges.next({ data: { type: 'item.created', item: pho }, revision: 41 });

      creation.next({ data: pho, revision: 42 });
      creation.complete();
      menuChanges.next({ data: { type: 'item.created', item: pho }, revision: 42 });

      expect(remote).not.toHaveBeenCalled();
    });

    it('skips an echo that arrives before the answer to the edit', () => {
      store.update({ id: pho.id, changes: { name: 'Pho bo' } });
      menuChanges.next({
        data: { type: 'item.updated', item: { ...pho, name: 'Pho bo' } },
        revision: 41,
      });

      expect(remote).not.toHaveBeenCalled();
    });
  });
});
