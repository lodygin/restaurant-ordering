import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, type MessageEvent } from '@nestjs/common';
import { timer, type Observable } from 'rxjs';

import { ChangeLog } from '@restaurant-ordering/server/common/sync';
import { MenuItemsService } from '@restaurant-ordering/server/modules/menu-items';
import { detectLineChange, priceOrder, type LineChange } from '@restaurant-ordering/shared/orders';

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
  private readonly log = new ChangeLog<OrderEvent>();

  constructor(private readonly items: MenuItemsService) {}

  list(): Order[] {
    return [...this.orders.values()].reverse();
  }

  currentRevision(): number {
    return this.log.current();
  }

  events(lastRevision?: number): Observable<MessageEvent> {
    return this.log.events(lastRevision);
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
      const change = detectLineChange(line, item);

      if (change) {
        changes.push(toOrderChange(line, change));
      } else if (item) {
        lines.push({ itemId: item.id, name: item.name, unitPrice: line.unitPrice, qty: line.qty });
      }
    }

    if (changes.length) {
      throw new ConflictException({
        message: 'The menu changed while you were ordering.',
        changes,
      });
    }

    const order: Order = {
      id: randomUUID(),
      number: FIRST_ORDER_NUMBER + this.orders.size,
      createdAt: new Date().toISOString(),
      status: 'received',
      lines,
      ...priceOrder(lines, input.discount),
    };

    this.orders.set(order.id, order);
    this.orderIdByKey.set(idempotencyKey, order.id);
    this.log.commit({ type: 'order.placed', order });

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
    this.log.commit({ type: 'order.updated', order });
  }
}

function toOrderChange({ lineId, unitPrice }: CartLine, change: LineChange): OrderChange {
  return change.type === 'price' || change.type === 'now-fixed'
    ? { type: change.type, lineId, from: unitPrice, to: change.price }
    : { type: change.type, lineId };
}
