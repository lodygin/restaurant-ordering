import { Component, computed, inject } from '@angular/core';

import { MenuStore } from '@restaurant-ordering/web/core/menu';

import { CategorySetupStore } from '../../store/category-setup.store';
import { ItemSetupStore } from '../../store/item-setup.store';
import { CategoryListComponent } from '../category-list';
import { CategoryPanelComponent } from '../category-panel';
import { NewCategoryFormComponent } from '../new-category-form';

@Component({
  selector: 'app-menu-setup',
  imports: [CategoryListComponent, CategoryPanelComponent, NewCategoryFormComponent],
  providers: [CategorySetupStore, ItemSetupStore],
  styleUrl: './menu-setup.component.scss',
  template: `
    <aside class="side">
      <h1>Menu setup</h1>
      <p>Changes go live on the menu as soon as you make them.</p>

      @if (menu.sections().length) {
        <app-category-list
          [sections]="menu.sections()"
          [selected]="selected()"
          (categorySelected)="categories.select($event)"
        />
      }

      <app-new-category-form [disabled]="menu.connection() !== 'online'" />
    </aside>

    @if (selected(); as section) {
      <app-category-panel [section]="section" [disabled]="menu.connection() !== 'online'" />
    } @else {
      <p class="empty">
        {{
          menu.status() === 'loaded' ? 'No categories yet. Add the first one.' : 'Loading the menu…'
        }}
      </p>
    }
  `,
})
export class MenuSetupComponent {
  protected readonly menu = inject(MenuStore);
  protected readonly categories = inject(CategorySetupStore);

  protected readonly selected = computed(() => {
    const sections = this.menu.sections();

    return (
      sections.find(section => section.category.id === this.categories.selectedId()) ?? sections[0]
    );
  });
}
