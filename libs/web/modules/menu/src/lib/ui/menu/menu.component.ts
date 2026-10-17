import { Component, inject } from '@angular/core';

import { MenuStore } from '@restaurant-ordering/web/core/menu';

import { MenuListComponent } from '../menu-list';

@Component({
  selector: 'app-menu',
  imports: [MenuListComponent],
  styleUrl: './menu.component.scss',
  template: `
    @if (menu.itemIds().length) {
      <app-menu-list [sections]="menu.sections()" />
    } @else {
      <p class="empty">
        {{ menu.status() === 'loaded' ? 'The menu is empty right now.' : 'Loading the menu…' }}
      </p>
    }
  `,
})
export class MenuComponent {
  protected readonly menu = inject(MenuStore);
}
