import { Component, computed, inject, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

import { MoneyPipe } from '@restaurant-ordering/web/common/money';
import { type MenuItem } from '@restaurant-ordering/web/core/menu';
import { QuantityStepperComponent } from '@restaurant-ordering/web/ui/form';
import { HighlightDirective } from '@restaurant-ordering/web/ui/highlight';

import { CartStore } from '../../store/cart.store';
import { PriceDialogComponent } from '../price-dialog';

@Component({
  selector: 'app-menu-item',
  hostDirectives: [HighlightDirective],
  imports: [MatButton, MoneyPipe, QuantityStepperComponent],
  host: { '[attr.data-sold-out]': '!item().available || null' },
  styleUrl: './menu-item.component.scss',
  template: `
    @let menuItem = item();

    <span class="name">{{ menuItem.name }}</span>

    @if (menuItem.price === null) {
      <span class="price open">Price set when ordering</span>
    } @else {
      <span class="price">{{ menuItem.price | money }}</span>
    }

    <div class="action">
      @if (!menuItem.available) {
        <button matButton="outlined" disabled>Sold out</button>
      } @else if (menuItem.openPrice) {
        <button matButton="outlined" (click)="openPriceDialog()">Add…</button>
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

  private readonly dialog = inject(MatDialog);
  private readonly highlighter = inject(HighlightDirective);

  highlight(): void {
    this.highlighter.highlight();
  }

  protected openPriceDialog(): void {
    this.dialog.open(PriceDialogComponent, { data: this.item(), width: '440px' });
  }
}
