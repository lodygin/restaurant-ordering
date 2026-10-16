import { Component, input, output } from '@angular/core';

import { type MenuSection } from '@restaurant-ordering/web/core/menu';

@Component({
  selector: 'app-category-list',
  styleUrl: './category-list.component.scss',
  template: `
    <ul>
      @for (section of sections(); track section.category.id) {
        <li>
          <button
            type="button"
            [attr.aria-current]="section === selected()"
            (click)="categorySelected.emit(section.category.id)"
          >
            {{ section.category.name }}
            <small>{{ section.items.length }}</small>
          </button>
        </li>
      }
    </ul>
  `,
})
export class CategoryListComponent {
  readonly sections = input.required<MenuSection[]>();
  readonly selected = input<MenuSection>();

  readonly categorySelected = output<string>();
}
