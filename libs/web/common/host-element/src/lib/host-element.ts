import { ElementRef, inject } from '@angular/core';

export function injectHostElement<T extends Element = HTMLElement>(): T {
  return inject<ElementRef<T>>(ElementRef).nativeElement;
}
