import { Inject, Injectable } from '@nestjs/common';
import { type ConfigType } from '@nestjs/config';
import { from, map, mergeMap, timer } from 'rxjs';

import { KITCHEN_TIMELINE_MS } from './constants';
import kitchenConfig from './kitchen.config';
import { OrdersService } from './orders.service';

@Injectable()
export class KitchenSimulatorService {
  constructor(
    orders: OrdersService,
    @Inject(kitchenConfig.KEY) { KITCHEN_TIME_SCALE }: ConfigType<typeof kitchenConfig>,
  ) {
    orders.placed$
      .pipe(
        mergeMap(({ id }) =>
          from(KITCHEN_TIMELINE_MS).pipe(
            mergeMap(([status, delay]) =>
              timer(delay * KITCHEN_TIME_SCALE).pipe(map(() => ({ id, status }))),
            ),
          ),
        ),
      )
      .subscribe(({ id, status }) => orders.updateStatus(id, status));
  }
}
