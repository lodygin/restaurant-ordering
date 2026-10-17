import { Component, computed, inject, input } from '@angular/core';
import { MatButton } from '@angular/material/button';

import { MoneyPipe } from '@restaurant-ordering/web/common/money';
import { type MenuItem } from '@restaurant-ordering/web/core/menu';
import { QuantityStepperComponent } from '@restaurant-ordering/web/ui/form';

import { CartStore } from '../../store/cart.store';

@Component({
  selector: 'app-menu-item',
  imports: [MatButton, MoneyPipe, QuantityStepperComponent],
  host: { '[attr.data-sold-out]': '!item().available || null' },
  styleUrl: './menu-item.component.scss',
  template: `
    @let menuItem = item();

    <div class="main">
      <span class="name">{{ menuItem.name }}</span>
      @if (menuItem.description) {
        <span class="description">{{ menuItem.description }}</span>
      }
    </div>

    @if (menuItem.price === null) {
      <span class="price open">Price set when ordering</span>
    } @else {
      <span class="price">{{ menuItem.price | money }}</span>
    }

    <div class="action">
      @if (!menuItem.available) {
        <button matButton="outlined" disabled>Sold out</button>
      } @else if (menuItem.openPrice) {
        <button matButton="outlined" disabled>Add…</button>
      } @else if (qty()) {
        <app-quantity-stepper
          [value]="qty()"
          [label]="menuItem.name"
          (decreased)="cart.changeQty(menuItem.id, -1)"
          (increased)="cart.add(menuItem)"
        />
      } @else {
        <button matButton="outlined" (click)="cart.add(menuItem)">Add</button>
      }
    </div>
  `,
})
export class MenuItemComponent {
  readonly item = input.required<MenuItem>();

  protected readonly cart = inject(CartStore);

  protected readonly qty = computed(() => this.cart.qtyByItem().get(this.item().id) ?? 0);
}
