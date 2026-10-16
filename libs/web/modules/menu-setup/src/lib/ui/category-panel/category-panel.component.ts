import { Component, inject, input } from '@angular/core';
import { MatButton } from '@angular/material/button';

import { type MenuSection } from '@restaurant-ordering/web/core/menu';

import { MenuSetupStore } from '../../store/menu-setup.store';
import { ItemRowComponent } from '../item-row';

@Component({
  selector: 'app-category-panel',
  imports: [MatButton, ItemRowComponent],
  styleUrl: './category-panel.component.scss',
  template: `
    @let category = section().category;

    <header class="head">
      <h2>{{ category.name }}</h2>
      <button
        matButton
        class="quiet"
        [disabled]="disabled() || setup.removing().includes(category.id)"
        (click)="setup.removeCategory(category.id)"
      >
        Delete category
      </button>
    </header>

    @if (section().items.length) {
      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th class="price">Price</th>
              <th class="toggle">Available</th>
              <th class="toggle">Open price</th>
              <th class="remove"><span class="visually-hidden">Remove</span></th>
            </tr>
          </thead>
          <tbody>
            @for (item of section().items; track item.id) {
              <tr appItemRow [item]="item" [disabled]="disabled()"></tr>
            }
          </tbody>
        </table>
      </div>
    } @else {
      <p class="empty">No items in this category yet.</p>
    }
  `,
})
export class CategoryPanelComponent {
  readonly section = input.required<MenuSection>();
  readonly disabled = input(false);

  protected readonly setup = inject(MenuSetupStore);
}
