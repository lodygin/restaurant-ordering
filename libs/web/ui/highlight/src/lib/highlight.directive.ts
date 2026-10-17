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
      // no closing keyframe: it fades back to whatever background the element has
      [
        { backgroundColor: 'var(--color-flag-soft)' },
        { backgroundColor: 'var(--color-flag-soft)', offset: 0.4 },
      ],
      { duration: 2400, easing: 'ease-out' },
    );
  }
}
