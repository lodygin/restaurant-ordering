import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';

import { MoneyPipe } from '@restaurant-ordering/web/common/money';
import { MenuStore } from '@restaurant-ordering/web/core/menu';

import { CartStore } from '../../store/cart.store';
import { CartLineComponent } from '../cart-line';
import { DiscountFieldComponent } from '../discount-field';

@Component({
  selector: 'app-cart',
  imports: [MatButton, RouterLink, MoneyPipe, CartLineComponent, DiscountFieldComponent],
  host: { 'aria-labelledby': 'cart-title' },
  styleUrl: './cart.component.scss',
  template: `
    <h2 id="cart-title">Your order</h2>

    @if (cart.lines().length) {
      <ul class="lines">
        @for (line of cart.lines(); track line.lineId) {
          <li appCartLine [line]="line" [issue]="cart.issues().get(line.lineId)"></li>
        }
      </ul>

      <div class="foot">
        <app-discount-field />

        <dl class="totals">
          <dt>Subtotal</dt>
          <dd>{{ cart.subtotal() | money }}</dd>
          <dt>Discount</dt>
          <dd>{{ cart.appliedDiscount() ? '−' : '' }}{{ cart.appliedDiscount() | money }}</dd>
          <dt class="grand">Total</dt>
          <dd class="grand">{{ cart.total() | money }}</dd>
        </dl>

        @if (menu.connection() === 'offline') {
          <p class="notice" role="status">
            You’re offline. Your order is kept here, place it once you’re back online.
          </p>
        }

        <button
          matButton="filled"
          [disabled]="cart.placing() || menu.connection() === 'offline'"
          (click)="cart.placeOrder()"
        >
          {{ cart.placing() ? 'Placing order…' : 'Place order, ' + (cart.total() | money) }}
        </button>
      </div>
    } @else {
      @if (cart.placedNumber(); as number) {
        <p class="notice placed" role="status">
          Order #{{ number }} is in. <a routerLink="/orders">Follow it on the Orders page</a>.
        </p>
      }
      <p class="empty">Nothing here yet. Add dishes from the menu.</p>
    }
  `,
})
export class CartComponent {
  protected readonly cart = inject(CartStore);
  protected readonly menu = inject(MenuStore);
}
