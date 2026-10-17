import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';

import { MoneyPipe } from '@restaurant-ordering/web/common/money';
import { QuantityStepperComponent } from '@restaurant-ordering/web/ui/form';

import { CartStore } from '../../store/cart.store';

@Component({
  selector: 'app-cart',
  imports: [MatButton, MoneyPipe, QuantityStepperComponent],
  host: { 'aria-labelledby': 'cart-title' },
  styleUrl: './cart.component.scss',
  template: `
    <h2 id="cart-title">Your order</h2>

    @if (cart.lines().length) {
      <ul class="lines">
        @for (line of cart.lines(); track line.lineId) {
          <li class="line">
            <div>
              <div class="name">{{ line.name }}</div>
              <div class="unit">
                {{ line.unitPrice | money }} each{{ line.openPrice ? ', price you entered' : '' }}
              </div>
            </div>
            <div class="total">{{ line.unitPrice * line.qty | money }}</div>

            @if (cart.issues().get(line.lineId); as issue) {
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
                    Now has a fixed price of {{ issue.price | money }} instead of the price you
                    entered. You’ll confirm it before the order is placed.
                  </p>
                }
                @case ('price') {
                  <p class="issue">
                    Price changed to {{ issue.price | money }}. You’ll confirm it before the order
                    is placed.
                  </p>
                }
              }
            }

            <div class="controls">
              <app-quantity-stepper
                [value]="line.qty"
                [label]="line.name"
                (decreased)="cart.changeQty(line.lineId, -1)"
                (increased)="cart.changeQty(line.lineId, 1)"
              />
              <button matButton class="quiet" (click)="cart.remove(line.lineId)">Remove</button>
            </div>
          </li>
        }
      </ul>

      <dl class="totals">
        <dt>Subtotal</dt>
        <dd>{{ cart.subtotal() | money }}</dd>
        <dt class="grand">Total</dt>
        <dd class="grand">{{ cart.total() | money }}</dd>
      </dl>
    } @else {
      <p class="empty">Nothing here yet. Add dishes from the menu.</p>
    }
  `,
})
export class CartComponent {
  protected readonly cart = inject(CartStore);
}
