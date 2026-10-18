import { Component, computed, input } from '@angular/core';

import { type StreamConnection } from '@restaurant-ordering/web/common/sync';

const MESSAGES: Record<StreamConnection, string | null> = {
  connecting: null,
  online: null,
  reconnecting: 'Reconnecting… Catching up on what changed.',
  offline: 'You’re offline. Showing what was last loaded; changes will appear once you’re back.',
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
  readonly connection = input.required<StreamConnection>();

  protected readonly message = computed(() => MESSAGES[this.connection()]);
}
