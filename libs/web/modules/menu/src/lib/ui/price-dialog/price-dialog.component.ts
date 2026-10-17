import { Component, computed, effect, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';

import { ITEM_MAX_PRICE } from '@restaurant-ordering/shared/menu-items';
import { formatPrice, parsePrice } from '@restaurant-ordering/shared/money';
import { ORDER_LINE_MAX_QTY } from '@restaurant-ordering/shared/orders';
import {
  disableControl,
  priceValidator,
  WhenFormValid,
} from '@restaurant-ordering/web/common/form';
import { MoneyPipe } from '@restaurant-ordering/web/common/money';
import { MenuStore, type MenuItem } from '@restaurant-ordering/web/core/menu';
import { InputComponent, MoneyFieldComponent } from '@restaurant-ordering/web/ui/form';
import { ToastService } from '@restaurant-ordering/web/ui/toast';

import { CartStore } from '../../store/cart.store';

@Component({
  selector: 'app-price-dialog',
  imports: [
    ReactiveFormsModule,
    MatButton,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MoneyPipe,
    InputComponent,
    MoneyFieldComponent,
  ],
  styleUrl: './price-dialog.component.scss',
  template: `
    @let liveItem = item();

    <h2 mat-dialog-title>{{ liveItem?.name ?? opened.name }}</h2>

    <mat-dialog-content>
      @if (liveItem?.description; as description) {
        <p class="description">{{ description }}</p>
      }

      @if (!liveItem?.available) {
        <p class="notice error" role="status">This item is no longer available.</p>
      } @else if (liveItem?.price; as price) {
        <p class="notice" role="status">This item now has a fixed price of {{ price | money }}.</p>
      }

      <form id="price-form" [formGroup]="form" (ngSubmit)="add()">
        @if (liveItem?.openPrice) {
          <label>
            Price for this order
            <app-money-field>
              <input appInput inputmode="decimal" formControlName="price" />
            </app-money-field>
          </label>
        }

        <label>
          Quantity
          <input appInput type="number" formControlName="qty" />
        </label>

        @if (form.invalid && form.touched) {
          <p class="error">
            {{
              liveItem?.openPrice
                ? 'Enter a price above zero and a quantity from 1 to ' + maxQty + '.'
                : 'Enter a quantity from 1 to ' + maxQty + '.'
            }}
          </p>
        }
      </form>
    </mat-dialog-content>

    <mat-dialog-actions>
      <button matButton mat-dialog-close>Cancel</button>
      <button matButton="filled" type="submit" form="price-form" [disabled]="!liveItem?.available">
        {{ addLabel() }}
      </button>
    </mat-dialog-actions>
  `,
})
export class PriceDialogComponent {
  protected readonly opened = inject<MenuItem>(MAT_DIALOG_DATA);
  protected readonly maxQty = ORDER_LINE_MAX_QTY;

  // the item can change while the dialog is open, so it always reads the live one
  protected readonly item = computed(
    (): MenuItem | undefined => this.menu.itemEntityMap()[this.opened.id],
  );

  protected readonly addLabel = computed(() => {
    const item = this.item();

    return item?.available && item.price !== null
      ? `Add at $${formatPrice(item.price)}`
      : 'Add to order';
  });

  protected readonly form = new FormGroup(
    {
      price: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, priceValidator, Validators.max(ITEM_MAX_PRICE / 100)],
      }),
      qty: new FormControl(1, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(1),
          Validators.max(ORDER_LINE_MAX_QTY),
          Validators.pattern(/^\d+$/),
        ],
      }),
    },
    { updateOn: 'submit' },
  );

  private readonly menu = inject(MenuStore);
  private readonly cart = inject(CartStore);
  private readonly toast = inject(ToastService);
  private readonly dialogRef = inject(MatDialogRef<PriceDialogComponent>);

  constructor() {
    effect(() => disableControl(this.form.controls.price, !this.item()?.openPrice));
  }

  @WhenFormValid()
  protected add(): void {
    const item = this.item();

    if (!item?.available) {
      return;
    }

    const { price, qty } = this.form.getRawValue();
    const unitPrice = item.price ?? parsePrice(price);

    if (unitPrice === null) {
      return;
    }

    this.cart.add(item, qty, unitPrice);
    this.toast.show(`${item.name} added at $${formatPrice(unitPrice)}`);
    this.dialogRef.close();
  }
}
