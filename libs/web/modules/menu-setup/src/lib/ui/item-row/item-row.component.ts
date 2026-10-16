import { Component, computed, effect, inject, input, viewChild } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { defer, filter, map, merge, type Observable } from 'rxjs';

import { formatPrice, parsePrice } from '@restaurant-ordering/shared/money';
import { disableControl, priceValidator } from '@restaurant-ordering/web/common/form';
import { type MenuItem, type MenuItemInput } from '@restaurant-ordering/web/core/menu';
import {
  FocusableDirective,
  InputComponent,
  MoneyFieldComponent,
} from '@restaurant-ordering/web/ui/form';

import { DEFAULT_ITEM_PRICE } from '../../constants';
import { ItemSetupStore } from '../../store/item-setup.store';

@Component({
  selector: 'tr[appItemRow]',
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatCheckbox,
    MatSlideToggle,
    InputComponent,
    MoneyFieldComponent,
    FocusableDirective,
  ],
  styleUrl: './item-row.component.scss',
  template: `
    <td>
      <input
        appInput
        appFocusable
        [formControl]="form.controls.name"
        [attr.aria-label]="'Name of ' + item().name"
        title="An item needs a name"
      />
    </td>

    <td>
      <app-money-field>
        <input
          appInput
          inputmode="decimal"
          [formControl]="form.controls.price"
          [placeholder]="form.controls.openPrice.value ? 'At order' : ''"
          [attr.aria-label]="'Price of ' + item().name"
          title="Enter a price above zero, like 12.50"
        />
      </app-money-field>
    </td>

    <td class="center">
      <mat-slide-toggle
        hideIcon
        [formControl]="form.controls.available"
        [aria-label]="item().name + ' is available'"
      />
    </td>

    <td class="center">
      <mat-checkbox
        [formControl]="form.controls.openPrice"
        [aria-label]="item().name + ' has an open price'"
      />
    </td>

    <td class="remove">
      <button
        matButton
        class="quiet"
        [disabled]="disabled() || items.removing().includes(item().id)"
        (click)="items.remove(item().id)"
      >
        Remove
      </button>
    </td>
  `,
})
export class ItemRowComponent {
  readonly item = input.required<MenuItem>();
  readonly disabled = input(false);

  protected readonly items = inject(ItemSetupStore);

  protected readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.pattern(/\S/)],
      updateOn: 'blur',
    }),
    price: new FormControl('', {
      nonNullable: true,
      validators: [priceValidator],
      updateOn: 'blur',
    }),
    available: new FormControl(false, { nonNullable: true }),
    openPrice: new FormControl(false, { nonNullable: true }),
  });

  // every committed field becomes the patch it stands for
  private readonly changes$: Observable<Partial<MenuItemInput>> = defer(() => {
    const { name, price, available, openPrice } = this.form.controls;

    return merge(
      name.valueChanges.pipe(
        filter(() => name.valid),
        map(value => ({ name: value.trim() })),
      ),
      price.valueChanges.pipe(
        filter(() => price.valid),
        map(value => ({ price: parsePrice(value) })),
      ),
      available.valueChanges.pipe(map(value => ({ available: value }))),
      openPrice.valueChanges.pipe(
        map(value => ({ openPrice: value, price: value ? null : DEFAULT_ITEM_PRICE })),
      ),
    );
  });

  private readonly nameField =
    viewChild.required<FocusableDirective<HTMLInputElement>>(FocusableDirective);

  private readonly editedItem = computed(() => ({
    ...this.item(),
    ...this.items.edits()[this.item().id],
  }));

  constructor() {
    // the menu and in-flight edits drive the form; a field the user is fixing is left alone
    effect(() => this.syncForm(this.editedItem(), this.disabled()));

    this.items.update(this.changes$.pipe(map(changes => ({ id: this.item().id, changes }))));
  }

  focusName(): void {
    this.nameField().focus();
    this.nameField().element.select();
  }

  private syncForm(item: MenuItem, locked: boolean): void {
    const { name, price, available, openPrice } = this.form.controls;

    if (!(name.dirty && name.invalid)) {
      name.setValue(item.name, { emitEvent: false });
    }

    if (!(price.dirty && price.invalid)) {
      price.setValue(item.price === null ? '' : formatPrice(item.price), {
        emitEvent: false,
      });
    }

    available.setValue(item.available, { emitEvent: false });
    openPrice.setValue(item.openPrice, { emitEvent: false });

    disableControl(this.form, locked, { emitEvent: false });
    disableControl(price, locked || item.openPrice, { emitEvent: false });
  }
}
