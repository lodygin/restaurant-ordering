import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

import { MenuStore } from '@restaurant-ordering/web/core/menu';
import { InputComponent } from '@restaurant-ordering/web/ui/form';

import { GuestMenuStore } from '../../store/guest-menu.store';
import { CategoryChipsComponent } from '../category-chips';
import { CategoryScrollDirective } from '../category-scroll';
import { MenuListComponent } from '../menu-list';

@Component({
  selector: 'app-menu',
  imports: [
    ReactiveFormsModule,
    InputComponent,
    CategoryChipsComponent,
    CategoryScrollDirective,
    MenuListComponent,
  ],
  providers: [GuestMenuStore],
  styleUrl: './menu.component.scss',
  template: `
    @if (menu.itemIds().length) {
      <div #tools class="tools">
        <input
          appInput
          type="search"
          autocomplete="off"
          aria-label="Search dishes"
          [placeholder]="'Search ' + guestMenu.itemCount() + ' dishes'"
          [formControl]="query"
        />
        <app-category-chips
          [categories]="guestMenu.categories()"
          [activeId]="scroll.activeCategoryId()"
          (categorySelected)="scroll.scrollTo($event)"
        />
      </div>

      <app-menu-list
        appCategoryScroll
        #scroll="appCategoryScroll"
        [rows]="guestMenu.rows()"
        [stickyEdge]="tools"
      />

      @if (!guestMenu.rows().length) {
        <p class="empty">No dishes match “{{ guestMenu.query() }}”.</p>
      }
    } @else {
      <p class="empty">
        {{ menu.status() === 'loaded' ? 'The menu is empty right now.' : 'Loading the menu…' }}
      </p>
    }
  `,
})
export class MenuComponent {
  protected readonly menu = inject(MenuStore);
  protected readonly guestMenu = inject(GuestMenuStore);

  protected readonly query = new FormControl('', { nonNullable: true });

  constructor() {
    this.guestMenu.search(this.query.valueChanges);
  }
}
