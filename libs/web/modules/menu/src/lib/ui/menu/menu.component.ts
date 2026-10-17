import { createNoopScrollStrategy } from '@angular/cdk/overlay';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialog } from '@angular/material/dialog';

import { MenuStore } from '@restaurant-ordering/web/core/menu';
import { InputComponent } from '@restaurant-ordering/web/ui/form';

import { GuestMenuStore } from '../../store/guest-menu.store';
import { CartComponent } from '../cart';
import { CategoryChipsComponent } from '../category-chips';
import { CategoryScrollDirective } from '../category-scroll';
import { MenuListComponent } from '../menu-list';

@Component({
  selector: 'app-menu',
  imports: [
    ReactiveFormsModule,
    InputComponent,
    CartComponent,
    CategoryChipsComponent,
    CategoryScrollDirective,
    MenuListComponent,
  ],
  providers: [
    GuestMenuStore,
    // blocking the page scroll resets the window to the top, and the virtual list renders the wrong rows
    MatDialog,
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { scrollStrategy: createNoopScrollStrategy() },
    },
  ],
  styleUrl: './menu.component.scss',
  template: `
    <section class="menu" aria-label="Menu">
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
    </section>

    <app-cart class="cart" />
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
