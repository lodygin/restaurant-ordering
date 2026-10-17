import {
  CdkFixedSizeVirtualScroll,
  CdkVirtualForOf,
  CdkVirtualScrollableWindow,
  CdkVirtualScrollViewport,
} from '@angular/cdk/scrolling';
import { Component, input } from '@angular/core';

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

  protected trackRow(_: number, row: MenuRow): string {
    return row.id;
  }
}
