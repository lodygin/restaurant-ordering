import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  inject,
  Injector,
  input,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { filter, map } from 'rxjs';

import { CATEGORY_NAME_MAX_LENGTH } from '@restaurant-ordering/shared/categories';
import { disableControl } from '@restaurant-ordering/web/common/form';
import { type MenuSection } from '@restaurant-ordering/web/core/menu';
import { ConfirmService } from '@restaurant-ordering/web/ui/confirm';
import { InputComponent } from '@restaurant-ordering/web/ui/form';

import { CategorySetupStore } from '../../store/category-setup.store';
import { ItemSetupStore } from '../../store/item-setup.store';
import { ItemRowComponent } from '../item-row';

@Component({
  selector: 'app-category-panel',
  imports: [ReactiveFormsModule, MatButton, InputComponent, ItemRowComponent],
  styleUrl: './category-panel.component.scss',
  template: `
    @let category = section().category;

    <header class="head">
      <input
        appInput
        class="name"
        aria-label="Category name"
        title="A category needs a name"
        [formControl]="name"
      />
      <button
        matButton="outlined"
        [disabled]="disabled() || items.creating()"
        (click)="items.create(category.id)"
      >
        Add item
      </button>
      <button
        matButton
        class="quiet"
        [disabled]="disabled() || categories.removing().includes(category.id)"
        (click)="remove()"
      >
        Delete category
      </button>
    </header>

    @if (section().items.length) {
      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="price">Price</th>
              <th class="toggle">Available</th>
              <th class="toggle">Open price</th>
              <th class="remove"><span class="visually-hidden">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            @for (item of section().items; track item.id) {
              <tr appItemRow [item]="item" [disabled]="disabled()"></tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <p class="empty">No items in this category yet. Add the first one.</p>
    }
  `,
})
export class CategoryPanelComponent {
  readonly section = input.required<MenuSection>();
  readonly disabled = input(false);

  protected readonly categories = inject(CategorySetupStore);
  protected readonly items = inject(ItemSetupStore);

  private readonly injector = inject(Injector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly confirm = inject(ConfirmService);
  private readonly rows = viewChildren(ItemRowComponent);

  protected readonly name = new FormControl('', {
    nonNullable: true,
    validators: [
      Validators.required,
      Validators.pattern(/\S/),
      Validators.maxLength(CATEGORY_NAME_MAX_LENGTH),
    ],
    updateOn: 'blur',
  });

  constructor() {
    effect(() => {
      this.name.setValue(this.section().category.name, { emitEvent: false });
      disableControl(this.name, this.disabled(), { emitEvent: false });
    });

    this.items.created$
      .pipe(takeUntilDestroyed())
      .subscribe(({ id }) => this.withRow(id, row => row.focusName()));

    this.items.remoteChanges$
      .pipe(takeUntilDestroyed())
      .subscribe(({ id }) => this.withRow(id, row => row.highlight()));

    this.categories.rename(
      this.name.valueChanges.pipe(
        filter(() => this.name.valid),
        map(name => ({ id: this.section().category.id, name: name.trim() })),
      ),
    );
  }

  // a category with items can't be deleted; the server says so, there is nothing to confirm
  protected remove(): void {
    const { category, items } = this.section();

    if (items.length) {
      this.categories.remove(category.id);

      return;
    }

    this.confirm
      .ask({
        title: `Delete ${category.name}?`,
        message: 'The category disappears from the menu for guests right away.',
        action: 'Delete',
      })
      .pipe(filter(Boolean), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.categories.remove(category.id));
  }

  // a new item's row renders after the event about it, so wait for the render
  private withRow(id: string, action: (row: ItemRowComponent) => void): void {
    afterNextRender(
      () => {
        const row = this.rows().find(candidate => candidate.item().id === id);

        if (row) {
          action(row);
        }
      },
      { injector: this.injector },
    );
  }
}
