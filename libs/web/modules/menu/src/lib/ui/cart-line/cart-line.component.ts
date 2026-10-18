import { Component, computed, inject, input } from '@angular/core';
import { MatButton } from '@angular/material/button';

import { type LineChange } from '@restaurant-ordering/shared/orders';
import { MoneyPipe } from '@restaurant-ordering/web/common/money';
import { QuantityStepperComponent } from '@restaurant-ordering/web/ui/form';

import { CartStore } from '../../store/cart.store';
import { type CartLine } from '../../types';

@Component({
  selector: 'li[appCartLine]',
  imports: [MatButton, MoneyPipe, QuantityStepperComponent],
  styleUrl: './cart-line.component.scss',
  template: `
    @let cartLine = line();

    <div>
      <div class="name">{{ cartLine.name }}</div>
      <div class="unit">
        {{ cartLine.unitPrice | money }} each{{ cartLine.openPrice ? ', price you entered' : '' }}
      </div>
    </div>
    <div class="total">{{ cartLine.unitPrice * cartLine.qty | money }}</div>

    @if (issue(); as issue) {
      @switch (issue.type) {
        @case ('unavailable') {
          <p class="issue gone">
            No longer available. It will be removed when you place the order.
          </p>
        }
        @case ('now-open') {
          <p class="issue gone">
            Now priced when ordering. It will be removed; add it again with a price.
          </p>
        }
        @case ('now-fixed') {
          <p class="issue">
            Now has a fixed price of {{ issue.price | money }} instead of the price you entered.
            You’ll confirm it before the order is placed.
          </p>
        }
        @case ('price') {
          <p class="issue">
            Price changed to {{ issue.price | money }}. You’ll confirm it before the order is
            placed.
          </p>
        }
      }
    }

    <div class="controls">
      <app-quantity-stepper
        [value]="cartLine.qty"
        [label]="cartLine.name"
        [disabled]="locked()"
        (decreased)="cart.changeQty(cartLine.lineId, -1)"
        (increased)="cart.changeQty(cartLine.lineId, 1)"
      />
      <button matButton class="quiet" (click)="cart.remove(cartLine.lineId)">Remove</button>
    </div>
  `,
})
export class CartLineComponent {
  readonly line = input.required<CartLine>();
  readonly issue = input<LineChange>();

  protected readonly cart = inject(CartStore);

  // the line goes away on checkout, so its quantity no longer matters
  protected readonly locked = computed(
    () => this.issue()?.type === 'unavailable' || this.issue()?.type === 'now-open',
  );
}
