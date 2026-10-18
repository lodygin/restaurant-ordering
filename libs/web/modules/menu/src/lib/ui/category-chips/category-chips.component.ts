import {
  afterRenderEffect,
  Component,
  ElementRef,
  input,
  output,
  signal,
  viewChildren,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

import { injectHostElement } from '@restaurant-ordering/web/common/host-element';
import { type Category } from '@restaurant-ordering/web/core/menu';

@Component({
  selector: 'app-category-chips',
  imports: [MatButton, MatIconButton, MatIcon],
  host: {
    role: 'navigation',
    'aria-label': 'Categories',
    '(scroll)': 'syncArrows()',
    '(window:resize)': 'syncArrows()',
  },
  styleUrl: './category-chips.component.scss',
  template: `
    <div class="arrow back" [inert]="!canScrollBack()">
      <button matIconButton tabindex="-1" aria-label="Earlier categories" (click)="scrollPage(-1)">
        <mat-icon svgIcon="chevron_left" />
      </button>
    </div>

    @for (category of categories(); track category.id) {
      <button
        matButton="outlined"
        class="chip"
        [attr.aria-current]="category.id === activeId()"
        (click)="categorySelected.emit(category.id)"
      >
        {{ category.name }}
      </button>
    }

    <div class="arrow forward" [inert]="!canScrollForward()">
      <button matIconButton tabindex="-1" aria-label="More categories" (click)="scrollPage(1)">
        <mat-icon svgIcon="chevron_right" />
      </button>
    </div>
  `,
})
export class CategoryChipsComponent {
  readonly categories = input.required<Category[]>();
  readonly activeId = input<string>();

  readonly categorySelected = output<string>();

  protected readonly canScrollBack = signal(false);
  protected readonly canScrollForward = signal(false);

  private readonly element = injectHostElement();

  private readonly chips = viewChildren<MatButton, ElementRef<HTMLElement>>(MatButton, {
    read: ElementRef,
  });

  constructor() {
    afterRenderEffect(() => {
      this.revealActive();
      this.syncArrows();
    });
  }

  protected syncArrows(): void {
    const { scrollLeft, scrollWidth, clientWidth } = this.element;

    this.canScrollBack.set(scrollLeft > 1);
    this.canScrollForward.set(scrollLeft < scrollWidth - clientWidth - 1);
  }

  protected scrollPage(direction: 1 | -1): void {
    this.element.scrollBy({ left: direction * this.element.clientWidth * 0.8, behavior: 'smooth' });
  }

  // scrollIntoView would move the page as well
  private revealActive(): void {
    const index = this.categories().findIndex(category => category.id === this.activeId());
    const chip = this.chips()[index]?.nativeElement;

    if (!chip) {
      return;
    }

    const { scrollLeft, clientWidth } = this.element;
    const start = chip.offsetLeft;
    const end = start + chip.offsetWidth;

    if (start < scrollLeft || end > scrollLeft + clientWidth) {
      this.element.scrollTo({ left: start - (clientWidth - chip.offsetWidth) / 2 });
    }
  }
}
