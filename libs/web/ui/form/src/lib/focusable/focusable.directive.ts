import { type FocusableOption } from '@angular/cdk/a11y';
import { Directive, ElementRef, inject } from '@angular/core';

@Directive({
  selector: '[appFocusable]',
  exportAs: 'appFocusable',
})
export class FocusableDirective<T extends HTMLElement = HTMLElement> implements FocusableOption {
  readonly element = inject<ElementRef<T>>(ElementRef).nativeElement;

  focus(): void {
    this.element.focus();
  }
}
