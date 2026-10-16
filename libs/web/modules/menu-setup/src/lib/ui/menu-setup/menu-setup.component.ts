import { Component, computed, inject, signal } from '@angular/core';

import { MenuStore } from '@restaurant-ordering/web/core/menu';

import { MenuSetupStore } from '../../store/menu-setup.store';
import { CategoryListComponent } from '../category-list';
import { CategoryPanelComponent } from '../category-panel';

@Component({
  selector: 'app-menu-setup',
  imports: [CategoryListComponent, CategoryPanelComponent],
  providers: [MenuSetupStore],
  styleUrl: './menu-setup.component.scss',
  template: `
    <aside class="side">
      <h1>Menu setup</h1>
      <p>Changes go live on the menu as soon as you make them.</p>

      @if (menu.sections().length) {
        <app-category-list
          [sections]="menu.sections()"
          [selected]="selected()"
          (categorySelected)="selectedId.set($event)"
        />
      }
    </aside>

    @if (selected(); as section) {
      <app-category-panel [section]="section" [disabled]="menu.connection() !== 'online'" />
    } @else {
      <p class="empty">
        {{ menu.status() === 'loaded' ? 'No categories yet.' : 'Loading the menu…' }}
      </p>
    }
  `,
})
export class MenuSetupComponent {
  protected readonly menu = inject(MenuStore);

  protected readonly selectedId = signal<string | null>(null);

  protected readonly selected = computed(() => {
    const sections = this.menu.sections();

    return sections.find(section => section.category.id === this.selectedId()) ?? sections[0];
  });
}
