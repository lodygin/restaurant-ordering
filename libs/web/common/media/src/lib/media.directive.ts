import { BreakpointObserver } from '@angular/cdk/layout';
import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { map, switchMap } from 'rxjs';

@Directive({ selector: '[appMedia]' })
export class MediaDirective {
  readonly appMedia = input.required<string>();
  readonly appMediaElse = input<TemplateRef<unknown>>();

  private readonly template = inject(TemplateRef);
  private readonly viewContainer = inject(ViewContainerRef);
  private readonly breakpoints = inject(BreakpointObserver);

  private readonly matches = toSignal(
    toObservable(this.appMedia).pipe(
      switchMap(query => this.breakpoints.observe(query)),
      map(({ matches }) => matches),
    ),
  );

  constructor() {
    effect(() => {
      const matches = this.matches();

      if (matches === undefined) {
        return;
      }

      const template = matches ? this.template : this.appMediaElse();

      this.viewContainer.clear();

      if (template) {
        this.viewContainer.createEmbeddedView(template);
      }
    });
  }
}
