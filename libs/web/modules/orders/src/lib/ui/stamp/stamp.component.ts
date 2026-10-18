import { Component, computed, effect, input } from '@angular/core';

import { injectHostElement } from '@restaurant-ordering/web/common/host-element';
import { type OrderStatus } from '@restaurant-ordering/web/core/orders';

import { ORDER_STEPS } from '../../constants';

@Component({
  selector: 'app-stamp',
  styleUrl: './stamp.component.scss',
  host: { '[attr.data-status]': 'status()' },
  template: `{{ label() }}`,
})
export class StampComponent {
  readonly status = input.required<OrderStatus>();

  protected readonly label = computed(
    () => ORDER_STEPS.find(step => step.status === this.status())?.label,
  );

  constructor() {
    const element = injectHostElement();
    let previous: OrderStatus | undefined;

    effect(() => {
      const status = this.status();

      if (previous && previous !== status) {
        // a lone keyframe counts as the last one
        element.animate([{ transform: 'rotate(-6deg) scale(1.6)', opacity: 0, offset: 0 }], {
          duration: 350,
          easing: 'ease-out',
        });
      }

      previous = status;
    });
  }
}
