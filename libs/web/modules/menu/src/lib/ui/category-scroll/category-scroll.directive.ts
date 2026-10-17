import { Directive, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { animationFrameScheduler, auditTime, fromEvent, merge } from 'rxjs';

import { injectHostElement } from '@restaurant-ordering/web/common/host-element';

import { MENU_ROW_HEIGHT } from '../../constants';
import { type MenuRow } from '../../types';

@Directive({
  selector: '[appCategoryScroll]',
  exportAs: 'appCategoryScroll',
})
export class CategoryScrollDirective {
  readonly rows = input.required<MenuRow[]>();
  readonly stickyEdge = input.required<HTMLElement>();

  private readonly element = injectHostElement();
  private readonly activeId = signal<string | undefined>(undefined);

  readonly activeCategoryId = this.activeId.asReadonly();

  constructor() {
    merge(fromEvent(window, 'scroll'), toObservable(this.rows))
      .pipe(auditTime(0, animationFrameScheduler), takeUntilDestroyed())
      .subscribe(() => this.activeId.set(this.findCategoryUnderEdge()));
  }

  scrollTo(categoryId: string): void {
    const index = this.rows().findIndex(row => row.id === categoryId);

    window.scrollBy({ top: this.measureRowTop(index) - this.measureEdge() });
  }

  private findCategoryUnderEdge(): string | undefined {
    const rows = this.rows();
    const index = Math.floor((this.measureEdge() - this.measureRowTop(0)) / MENU_ROW_HEIGHT);
    const row = rows[Math.max(0, Math.min(index, rows.length - 1))];

    return row?.type === 'category' ? row.id : row?.item.categoryId;
  }

  private measureRowTop(index: number): number {
    return this.element.getBoundingClientRect().top + index * MENU_ROW_HEIGHT;
  }

  private measureEdge(): number {
    return this.stickyEdge().getBoundingClientRect().bottom;
  }
}
