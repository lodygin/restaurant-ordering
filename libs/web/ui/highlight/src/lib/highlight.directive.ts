import { Directive } from '@angular/core';

import { injectHostElement } from '@restaurant-ordering/web/common/host-element';

@Directive({
  selector: '[appHighlight]',
  exportAs: 'appHighlight',
})
export class HighlightDirective {
  private readonly element = injectHostElement();

  highlight(): void {
    this.element.animate(
      [
        { backgroundColor: 'var(--color-flag-soft)' },
        { backgroundColor: 'var(--color-flag-soft)', offset: 0.4 },
        { backgroundColor: 'transparent' },
      ],
      { duration: 2400, easing: 'ease-out' },
    );
  }
}
