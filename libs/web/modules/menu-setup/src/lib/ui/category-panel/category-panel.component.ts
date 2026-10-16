import {
  afterNextRender,
  Component,
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
        (click)="categories.remove(category.id)"
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

    // the row of a just created item renders after the event, so focus it once it is there
    this.items.created$.pipe(takeUntilDestroyed()).subscribe(item =>
      afterNextRender(
        () =>
          this.rows()
            .find(row => row.item().id === item.id)
            ?.focusName(),
        { injector: this.injector },
      ),
    );

    this.categories.rename(
      this.name.valueChanges.pipe(
        filter(() => this.name.valid),
        map(name => ({ id: this.section().category.id, name: name.trim() })),
      ),
    );
  }
}
