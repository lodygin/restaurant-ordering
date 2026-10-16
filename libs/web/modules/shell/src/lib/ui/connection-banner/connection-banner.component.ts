import { Component, computed, input } from '@angular/core';

import { type MenuConnection } from '@restaurant-ordering/web/core/menu';

const MESSAGES: Record<MenuConnection, string | null> = {
  connecting: null,
  online: null,
  reconnecting: 'Reconnecting… Catching up on what changed.',
  offline: 'Live updates stopped. Reload the page to get them back.',
};

@Component({
  selector: 'app-connection-banner',
  styleUrl: './connection-banner.component.scss',
  host: { role: 'status' },
  template: `
    @if (message(); as message) {
      <p class="banner" [attr.data-state]="connection()">{{ message }}</p>
    }
  `,
})
export class ConnectionBannerComponent {
  readonly connection = input.required<MenuConnection>();

  protected readonly message = computed(() => MESSAGES[this.connection()]);
}
