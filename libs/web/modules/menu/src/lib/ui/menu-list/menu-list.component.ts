import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollableWindow,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { afterNextRender, Component, inject, Injector, input, viewChildren } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';

import { MenuStore } from '@restaurant-ordering/web/core/menu';

import { MENU_ROW_HEIGHT } from '../../constants';
import { type MenuRow } from '../../types';
import { MenuItemComponent } from '../menu-item';

@Component({
  selector: 'app-menu-list',
  imports: [
    CdkVirtualScrollViewport,
    CdkFixedSizeVirtualScroll,
    CdkVirtualScrollableWindow,
    CdkVirtualForOf,
    MenuItemComponent,
  ],
  host: { '[style.--row-height.px]': 'rowHeight' },
  styleUrl: './menu-list.component.scss',
  template: `
    <cdk-virtual-scroll-viewport scrollWindow [itemSize]="rowHeight">
      <div *cdkVirtualFor="let row of rows(); trackBy: trackRow" class="row">
        @if (row.type === 'category') {
          <h2>
            {{ row.category.name }}
            <small>{{ row.count }}</small>
          </h2>
        } @else {
          <app-menu-item [item]="row.item" [class.first]="row.first" [class.last]="row.last" />
        }
      </div>
    </cdk-virtual-scroll-viewport>
  `,
})
export class MenuListComponent {
  readonly rows = input.required<MenuRow[]>();

  protected readonly rowHeight = MENU_ROW_HEIGHT;

  private readonly items = viewChildren(MenuItemComponent);
  private readonly injector = inject(Injector);

  constructor() {
    inject(MenuStore)
      .changes$.pipe(
        map(({ data }) =>
          data.type === 'item.created' || data.type === 'item.updated' ? data.item.id : null,
        ),
        filter(id => id !== null),
        takeUntilDestroyed(),
      )
      .subscribe(id => this.highlightRow(id));
  }

  protected trackRow(_: number, row: MenuRow): string {
    return row.id;
  }

  // a new item's row renders after the change that brought it, and an off-screen row never does
  private highlightRow(itemId: string): void {
    afterNextRender(
      () =>
        this.items()
          .find(row => row.item().id === itemId)
          ?.highlight(),
      { injector: this.injector },
    );
  }
}
