import { Injectable } from '@nestjs/common';
import { from, map, mergeMap, timer } from 'rxjs';

import { KITCHEN_TIMELINE_MS } from './constants';
import { OrdersService } from './orders.service';

@Injectable()
export class KitchenSimulatorService {
  constructor(orders: OrdersService) {
    orders.placed$
      .pipe(
        mergeMap(({ id }) =>
          from(KITCHEN_TIMELINE_MS).pipe(
            mergeMap(([status, delay]) => timer(delay).pipe(map(() => ({ id, status })))),
          ),
        ),
      )
      .subscribe(({ id, status }) => orders.updateStatus(id, status));
  }
}
