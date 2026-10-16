import { CurrencyPipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatSlideToggle } from '@angular/material/slide-toggle';

import { type MenuItem } from '@restaurant-ordering/web/core/menu';

import { MenuSetupStore } from '../../store/menu-setup.store';

@Component({
  selector: 'tr[appItemRow]',
  imports: [CurrencyPipe, MatButton, MatSlideToggle],
  styleUrl: './item-row.component.scss',
  template: `
    @let price = item().price;

    <td class="name">{{ item().name }}</td>

    <td class="price">
      @if (price === null) {
        <span class="muted">At order</span>
      } @else {
        {{ price / 100 | currency: 'USD' }}
      }
    </td>

    <td class="toggle">
      <mat-slide-toggle
        hideIcon
        [checked]="pendingAvailability() ?? item().available"
        [disabled]="disabled() || pendingAvailability() !== undefined"
        [aria-label]="item().name + ' is available'"
        (change)="setup.setAvailability({ id: item().id, available: $event.checked })"
      />
    </td>

    <td class="remove">
      <button
        matButton
        class="quiet"
        [disabled]="disabled() || setup.removing().includes(item().id)"
        (click)="setup.removeItem(item().id)"
      >
        Remove
      </button>
    </td>
  `,
})
export class ItemRowComponent {
  readonly item = input.required<MenuItem>();
  readonly disabled = input(false);

  protected readonly setup = inject(MenuSetupStore);

  protected readonly pendingAvailability = computed(
    () => this.setup.availability()[this.item().id],
  );
}
