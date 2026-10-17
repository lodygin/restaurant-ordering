import { createNoopScrollStrategy } from '@angular/cdk/overlay';
import { Component, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MAT_BOTTOM_SHEET_DEFAULT_OPTIONS, MatBottomSheet } from '@angular/material/bottom-sheet';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialog } from '@angular/material/dialog';

import { MediaDirective } from '@restaurant-ordering/web/common/media';
import { MenuStore } from '@restaurant-ordering/web/core/menu';
import { InputComponent } from '@restaurant-ordering/web/ui/form';

import { CartStore } from '../../store/cart.store';
import { GuestMenuStore } from '../../store/guest-menu.store';
import { CartComponent } from '../cart';
import { CartBarComponent } from '../cart-bar';
import { CategoryChipsComponent } from '../category-chips';
import { CategoryScrollDirective } from '../category-scroll';
import { ChangesDialogComponent } from '../changes-dialog';
import { MenuListComponent } from '../menu-list';

@Component({
  selector: 'app-menu',
  imports: [
    ReactiveFormsModule,
    MediaDirective,
    InputComponent,
    CartComponent,
    CartBarComponent,
    CategoryChipsComponent,
    CategoryScrollDirective,
    MenuListComponent,
  ],
  providers: [
    GuestMenuStore,
    // blocking the page scroll resets the window to the top, and the virtual list renders the wrong rows
    MatDialog,
    MatBottomSheet,
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: { scrollStrategy: createNoopScrollStrategy() },
    },
    {
      provide: MAT_BOTTOM_SHEET_DEFAULT_OPTIONS,
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

    <app-cart-bar *appMedia="'(width <= 960px)'; else wide" />
    <ng-template #wide><app-cart class="cart" /></ng-template>
  `,
})
export class MenuComponent {
  protected readonly menu = inject(MenuStore);
  protected readonly guestMenu = inject(GuestMenuStore);

  protected readonly query = new FormControl('', { nonNullable: true });

  constructor() {
    const dialog = inject(MatDialog);

    this.guestMenu.search(this.query.valueChanges);

    inject(CartStore)
      .conflicts$.pipe(takeUntilDestroyed())
      .subscribe(changes => dialog.open(ChangesDialogComponent, { data: changes, width: '480px' }));
  }
}
