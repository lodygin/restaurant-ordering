import { Component, computed, input } from '@angular/core';

import { formatPrice } from '@restaurant-ordering/shared/money';
import { type MenuItem } from '@restaurant-ordering/web/core/menu';

@Component({
  selector: 'app-menu-item',
  host: { '[attr.data-sold-out]': '!item().available || null' },
  styleUrl: './menu-item.component.scss',
  template: `
    <div class="main">
      <span class="name">{{ item().name }}</span>
      @if (item().description) {
        <span class="description">{{ item().description }}</span>
      }
    </div>

    <span class="price" [class.open]="item().openPrice">{{ price() }}</span>
  `,
})
export class MenuItemComponent {
  readonly item = input.required<MenuItem>();

  protected readonly price = computed(() => {
    const { price } = this.item();

    return price === null ? 'Price set when ordering' : `$${formatPrice(price)}`;
  });
}
