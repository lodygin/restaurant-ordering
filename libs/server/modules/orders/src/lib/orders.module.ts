import { Module } from '@nestjs/common';

import { MenuItemsModule } from '@restaurant-ordering/server/modules/menu-items';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [MenuItemsModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
