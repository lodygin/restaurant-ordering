import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject } from 'rxjs';

import {
  MenuApi,
  MenuStore,
  type Category,
  type Revised,
} from '@restaurant-ordering/web/core/menu';

import { CategorySetupStore } from './category-setup.store';

const drinks: Category = { id: crypto.randomUUID(), name: 'Drinks' };

describe('CategorySetupStore', () => {
  let store: InstanceType<typeof CategorySetupStore>;
  let save: Subject<Revised<Category>>;
  let removal: Subject<number>;
  let applyEditResult: ReturnType<typeof vi.fn>;
  let open: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    save = new Subject();
    removal = new Subject();
    applyEditResult = vi.fn();
    open = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        CategorySetupStore,
        {
          provide: MenuApi,
          useValue: {
            createCategory: () => save,
            updateCategory: () => save,
            removeCategory: () => removal,
          },
        },
        { provide: MenuStore, useValue: { applyEditResult } },
        { provide: MatSnackBar, useValue: { open } },
      ],
    });

    store = TestBed.inject(CategorySetupStore);
  });

  it('selects a category once it is created', () => {
    store.create('Drinks');

    expect(store.creating()).toBe(true);

    save.next({ data: drinks, revision: 60 });
    save.complete();

    expect(applyEditResult).toHaveBeenCalledWith(60, {
      type: 'category.created',
      category: drinks,
    });
    expect(store.selectedId()).toBe(drinks.id);
    expect(store.creating()).toBe(false);
  });

  it('applies a rename', () => {
    store.rename({ id: drinks.id, name: 'Cold drinks' });
    save.next({ data: { ...drinks, name: 'Cold drinks' }, revision: 61 });

    expect(applyEditResult).toHaveBeenCalledWith(61, {
      type: 'category.updated',
      category: { ...drinks, name: 'Cold drinks' },
    });
  });

  it('shows why the server refused to remove a category', () => {
    store.remove(drinks.id);

    expect(store.removing()).toEqual([drinks.id]);

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
