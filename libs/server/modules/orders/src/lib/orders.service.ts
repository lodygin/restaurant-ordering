import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, type MessageEvent } from '@nestjs/common';
import { timer, type Observable } from 'rxjs';

import { EventStream, Revision } from '@restaurant-ordering/server/infrastructure/sse';
import { MenuItemsService, type MenuItem } from '@restaurant-ordering/server/modules/menu-items';

import { FIRST_ORDER_NUMBER, KITCHEN_TIMELINE_MS } from './constants';
import {
  type CartLine,
  type Order,
  type OrderChange,
  type OrderEvent,
  type OrderLine,
  type OrderStatus,
  type PlaceOrderInput,
} from './types';

@Injectable()
export class OrdersService {
  private readonly orders = new Map<string, Order>();
  private readonly orderIdByKey = new Map<string, string>();
  private readonly stream = new EventStream<OrderEvent>();
  private readonly revision = new Revision();

  constructor(private readonly items: MenuItemsService) {}

  list(): Order[] {
    return [...this.orders.values()].reverse();
  }

  currentRevision(): number {
    return this.revision.current();
  }

  events(lastRevision?: number): Observable<MessageEvent> {
    return this.stream.subscribe(lastRevision, this.revision.current());
  }

  place(idempotencyKey: string, input: PlaceOrderInput): Order {
    const placedId = this.orderIdByKey.get(idempotencyKey);

    if (placedId) {
      return this.orders.get(placedId) as Order;
    }

    const changes: OrderChange[] = [];
    const lines: OrderLine[] = [];

    for (const line of input.lines) {
      const item = this.items.find(line.itemId);

      if (!item) {
        changes.push({ type: 'unavailable', lineId: line.lineId });
        continue;
      }

      const change = changeOf(line, item);

      if (change) {
        changes.push(change);
        continue;
      }

      lines.push({ itemId: item.id, name: item.name, unitPrice: line.unitPrice, qty: line.qty });
    }

    if (changes.length) {
      throw new ConflictException({
        message: 'The menu changed while you were ordering.',
        changes,
      });
    }

    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);
    const discount = Math.min(input.discount, subtotal);
    const order: Order = {
      id: randomUUID(),
      number: FIRST_ORDER_NUMBER + this.orders.size,
      createdAt: new Date().toISOString(),
      status: 'received',
      lines,
      subtotal,
      discount,
      total: subtotal - discount,
    };

    this.orders.set(order.id, order);
    this.orderIdByKey.set(idempotencyKey, order.id);
    this.publish({ type: 'order.placed', order });

    for (const [status, delay] of KITCHEN_TIMELINE_MS) {
      timer(delay).subscribe(() => this.updateStatus(order.id, status));
    }

    return order;
  }

  private updateStatus(id: string, status: OrderStatus): void {
    const current = this.orders.get(id);

    if (!current) {
      return;
    }

    const order = { ...current, status };

    this.orders.set(id, order);
    this.publish({ type: 'order.updated', order });
  }

  private publish(event: OrderEvent): void {
    this.stream.publish(this.revision.next(), event);
  }
}

function changeOf({ lineId, unitPrice, openPrice }: CartLine, item: MenuItem): OrderChange | null {
  if (!item.available) {
    return { type: 'unavailable', lineId };
  }

  if (item.price === null) {
    return openPrice ? null : { type: 'now-open', lineId };
  }

  if (openPrice) {
    return { type: 'now-fixed', lineId, from: unitPrice, to: item.price };
  }

  return item.price === unitPrice
    ? null
    : { type: 'price', lineId, from: unitPrice, to: item.price };
}
