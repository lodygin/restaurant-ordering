import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollableWindow,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { Component, computed, input } from '@angular/core';

import { type MenuSection } from '@restaurant-ordering/web/core/menu';

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
  readonly sections = input.required<MenuSection[]>();

  protected readonly rowHeight = MENU_ROW_HEIGHT;
  protected readonly rows = computed(() => toRows(this.sections()));

  protected trackRow(_: number, row: MenuRow): string {
    return row.id;
  }
}

function toRows(sections: MenuSection[]): MenuRow[] {
  const rows: MenuRow[] = [];

  for (const { category, items } of sections) {
    if (!items.length) {
      continue;
    }

    rows.push({ type: 'category', id: category.id, category, count: items.length });

    items.forEach((item, index) =>
      rows.push({
        type: 'item',
        id: item.id,
        item,
        first: index === 0,
        last: index === items.length - 1,
      }),
    );
  }

  return rows;
}
