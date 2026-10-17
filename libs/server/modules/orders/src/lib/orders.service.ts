import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable } from '@nestjs/common';

import { MenuItemsService, type MenuItem } from '@restaurant-ordering/server/modules/menu-items';

import {
  type CartLine,
  type Order,
  type OrderChange,
  type OrderLine,
  type PlaceOrderInput,
} from './types';

const FIRST_ORDER_NUMBER = 1001;

@Injectable()
export class OrdersService {
  private readonly orders = new Map<string, Order>();
  private readonly byIdempotencyKey = new Map<string, Order>();

  constructor(private readonly items: MenuItemsService) {}

  place(idempotencyKey: string, input: PlaceOrderInput): Order {
    const placed = this.byIdempotencyKey.get(idempotencyKey);

    if (placed) {
      return placed;
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
      lines,
      subtotal,
      discount,
      total: subtotal - discount,
    };

    this.orders.set(order.id, order);
    this.byIdempotencyKey.set(idempotencyKey, order);

    return order;
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
