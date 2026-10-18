import { Module } from '@nestjs/common';

import { MenuItemsModule } from '@restaurant-ordering/server/modules/menu-items';

import { KitchenSimulatorService } from './kitchen-simulator.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [MenuItemsModule],
  controllers: [OrdersController],
  providers: [OrdersService, KitchenSimulatorService],
})
export class OrdersModule {}
