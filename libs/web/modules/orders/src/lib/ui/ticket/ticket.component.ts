import { DatePipe } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { MoneyPipe } from '@restaurant-ordering/web/common/money';
import { type Order } from '@restaurant-ordering/web/core/orders';

import { ORDER_STEPS } from '../../constants';
import { StampComponent } from '../stamp';

@Component({
  selector: 'app-ticket',
  imports: [DatePipe, MoneyPipe, StampComponent],
  styleUrl: './ticket.component.scss',
  host: {
    role: 'article',
    '[attr.aria-label]': '"Order " + order().number + ", " + order().status',
    '[attr.data-done]': 'order().status === "collected" || null',
  },
  template: `
    <div class="head">
      <div>
        <span class="number">#{{ order().number }}</span>
        <span class="time">Placed {{ order().createdAt | date: 'HH:mm' }}</span>
      </div>
      <app-stamp [status]="order().status" />
    </div>

    <ul class="lines">
      @for (line of order().lines; track line.itemId) {
        <li>
          <span>{{ line.qty }}×</span>
          <span>{{ line.name }}</span>
          <span>{{ line.unitPrice * line.qty | money }}</span>
        </li>
      }
    </ul>

    <dl class="sums">
      @if (order().discount) {
        <dt>Discount</dt>
        <dd>−{{ order().discount | money }}</dd>
      }
      <dt class="total">Total</dt>
      <dd class="total">{{ order().total | money }}</dd>
    </dl>

    <ol class="progress">
      @for (step of steps; track step.status; let index = $index) {
        <li [attr.data-reached]="index <= stepIndex() || null">{{ step.label }}</li>
      }
    </ol>
  `,
})
export class TicketComponent {
  readonly order = input.required<Order>();

  protected readonly steps = ORDER_STEPS;

  protected readonly stepIndex = computed(() =>
    ORDER_STEPS.findIndex(step => step.status === this.order().status),
  );
}
