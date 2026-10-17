import { Component, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { filter, map } from 'rxjs';

import { formatPrice, parsePrice, PRICE_PATTERN } from '@restaurant-ordering/shared/money';
import { MoneyPipe } from '@restaurant-ordering/web/common/money';
import { InputComponent, MoneyFieldComponent } from '@restaurant-ordering/web/ui/form';

import { CartStore } from '../../store/cart.store';

@Component({
  selector: 'app-discount-field',
  imports: [ReactiveFormsModule, MoneyPipe, InputComponent, MoneyFieldComponent],
  styleUrl: './discount-field.component.scss',
  template: `
    <label for="discount">Discount</label>
    <app-money-field>
      <input
        id="discount"
        appInput
        inputmode="decimal"
        placeholder="0.00"
        title="Enter an amount like 5 or 5.50"
        [formControl]="amount"
      />
    </app-money-field>

    @if (amount.invalid) {
      <p class="hint error">Enter an amount like 5 or 5.50.</p>
    } @else if (cart.discount() > cart.subtotal()) {
      <p class="hint">Discount is capped at the order total, {{ cart.subtotal() | money }}.</p>
    }
  `,
})
export class DiscountFieldComponent {
  protected readonly cart = inject(CartStore);

  protected readonly amount = new FormControl('', {
    nonNullable: true,
    validators: [Validators.pattern(PRICE_PATTERN)],
    updateOn: 'blur',
  });

  constructor() {
    effect(() => {
      const discount = this.cart.discount();

      if (this.amount.valid) {
        this.amount.setValue(discount ? formatPrice(discount) : '', { emitEvent: false });
      }
    });

    this.amount.valueChanges
      .pipe(
        filter(() => this.amount.valid),
        map(value => parsePrice(value) ?? 0),
        takeUntilDestroyed(),
      )
      .subscribe(discount => this.cart.setDiscount(discount));
  }
}
