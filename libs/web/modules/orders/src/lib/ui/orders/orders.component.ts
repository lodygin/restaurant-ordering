import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { OrdersStore } from '../../store/orders.store';
import { TicketComponent } from '../ticket';

@Component({
  selector: 'app-orders',
  imports: [DatePipe, RouterLink, TicketComponent],
  providers: [OrdersStore],
  styleUrl: './orders.component.scss',
  template: `
    <header class="head">
      <h1>Your orders</h1>

      @if (store.ids().length) {
        <p>
          {{ store.activeCount() }} in progress,
          {{ store.ids().length - store.activeCount() }} collected
        </p>
      }
    </header>

    @if (store.staleSince(); as staleSince) {
      <p class="stale" role="status">Statuses as of {{ staleSince | date: 'HH:mm' }}.</p>
    }

    @if (store.ids().length) {
      <div class="rail" aria-live="polite">
        @for (order of store.orders(); track order.id) {
          <app-ticket [order]="order" />
        }
      </div>
    } @else if (store.status() === 'loaded') {
      <p class="empty">
        No orders yet. <a routerLink="/menu">Pick something from the menu</a> and it will show up
        here.
      </p>
    } @else {
      <p class="empty">Loading your orders…</p>
    }
  `,
})
export class OrdersComponent {
  protected readonly store = inject(OrdersStore);
}
