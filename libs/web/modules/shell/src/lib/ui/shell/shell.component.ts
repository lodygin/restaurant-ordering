import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { MenuStore } from '@restaurant-ordering/web/core/menu';

import { ConnectionBannerComponent } from '../connection-banner';
import { HeaderComponent } from '../header';
import { LiveStatusComponent } from '../live-status';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, HeaderComponent, LiveStatusComponent, ConnectionBannerComponent],
  template: `
    <app-header>
      <app-live-status [connection]="menu.connection()" />
    </app-header>

    <app-connection-banner [connection]="menu.connection()" />

    <main>
      <router-outlet />
    </main>
  `,
})
export class ShellComponent {
  protected readonly menu = inject(MenuStore);
}
