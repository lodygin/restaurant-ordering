import { type FocusableOption } from '@angular/cdk/a11y';
import { Directive } from '@angular/core';

import { injectHostElement } from '@restaurant-ordering/web/common/host-element';

@Directive({
  selector: '[appFocusable]',
  exportAs: 'appFocusable',
})
export class FocusableDirective<T extends HTMLElement = HTMLElement> implements FocusableOption {
  readonly element = injectHostElement<T>();

  focus(): void {
    this.element.focus();
  }
}
