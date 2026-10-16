import { Component, computed, input } from '@angular/core';

import { type MenuConnection } from '@restaurant-ordering/web/core/menu';

const LABELS: Record<MenuConnection, string> = {
  connecting: 'Connecting',
  online: 'Live',
  reconnecting: 'Reconnecting',
  offline: 'Offline',
};

@Component({
  selector: 'app-live-status',
  styleUrl: './live-status.component.scss',
  host: { '[attr.data-state]': 'connection()' },
  template: `<span class="label">{{ label() }}</span>`,
})
export class LiveStatusComponent {
  readonly connection = input.required<MenuConnection>();

  protected readonly label = computed(() => LABELS[this.connection()]);
}
