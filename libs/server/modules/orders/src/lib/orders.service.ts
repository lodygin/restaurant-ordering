import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, type MessageEvent } from '@nestjs/common';
import { Subject, type Observable } from 'rxjs';

import { ChangeLog } from '@restaurant-ordering/server/common/sync';
import { MenuItemsService } from '@restaurant-ordering/server/modules/menu-items';
import { detectLineChange, priceOrder, type LineChange } from '@restaurant-ordering/shared/orders';

import { FIRST_ORDER_NUMBER } from './constants';
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
  private readonly changes = new ChangeLog<OrderEvent>();
  private readonly placed$$ = new Subject<Order>();

  readonly placed$: Observable<Order> = this.placed$$.asObservable();

  constructor(private readonly items: MenuItemsService) {}

  list(): Order[] {
    return [...this.orders.values()].reverse();
  }

  currentRevision(): number {
    return this.changes.current();
  }

  events(lastRevision?: number): Observable<MessageEvent> {
    return this.changes.events(lastRevision);
  }

  place(idempotencyKey: string, input: PlaceOrderInput): Order {
    const placedId = this.orderIdByKey.get(idempotencyKey);

    if (placedId) {
      return this.orders.get(placedId) as Order;
    }

    const conflicts: OrderChange[] = [];
    const lines: OrderLine[] = [];

    for (const line of input.lines) {
      const item = this.items.find(line.itemId);
      const change = detectLineChange(line, item);

      if (change) {
        conflicts.push(toOrderChange(line, change));
      } else if (item) {
        lines.push({ itemId: item.id, name: item.name, unitPrice: line.unitPrice, qty: line.qty });
      }
    }

    if (conflicts.length) {
      throw new ConflictException({
        message: 'The menu changed while you were ordering.',
        changes: conflicts,
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
    this.changes.commit({ type: 'order.placed', order });
    this.placed$$.next(order);

    return order;
  }

  updateStatus(id: string, status: OrderStatus): void {
    const current = this.orders.get(id);

    if (!current) {
      return;
    }

    const order = { ...current, status };

    this.orders.set(id, order);
    this.changes.commit({ type: 'order.updated', order });
  }
}

function toOrderChange({ lineId, unitPrice }: CartLine, change: LineChange): OrderChange {
  return change.type === 'price' || change.type === 'now-fixed'
    ? { type: change.type, lineId, from: unitPrice, to: change.price }
    : { type: change.type, lineId };
}
