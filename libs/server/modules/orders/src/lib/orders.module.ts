import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { MenuItemsModule } from '@restaurant-ordering/server/modules/menu-items';

import { KitchenSimulatorService } from './kitchen-simulator.service';
import kitchenConfig from './kitchen.config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [ConfigModule.forFeature(kitchenConfig), MenuItemsModule],
  controllers: [OrdersController],
  providers: [OrdersService, KitchenSimulatorService],
})
export class OrdersModule {}
