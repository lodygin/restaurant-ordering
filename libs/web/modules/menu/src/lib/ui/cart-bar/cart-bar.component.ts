import { Component, inject } from '@angular/core';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { MatButton } from '@angular/material/button';

import { MoneyPipe } from '@restaurant-ordering/web/common/money';

import { CartStore } from '../../store/cart.store';
import { CartComponent } from '../cart';

@Component({
  selector: 'app-cart-bar',
  imports: [MatButton, MoneyPipe],
  styleUrl: './cart-bar.component.scss',
  template: `
    <span>
      @if (cart.count(); as count) {
        {{ count }} {{ count === 1 ? 'item' : 'items' }}, {{ cart.total() | money }}
      } @else {
        Your order is empty
      }
    </span>
    <button matButton="filled" (click)="openCart()">View order</button>
  `,
})
export class CartBarComponent {
  protected readonly cart = inject(CartStore);

  private readonly bottomSheet = inject(MatBottomSheet);

  protected openCart(): void {
    this.bottomSheet.open(CartComponent);
  }
}
