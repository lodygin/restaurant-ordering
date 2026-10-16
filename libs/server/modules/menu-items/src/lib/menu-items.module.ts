import { Module } from '@nestjs/common';

import { CategoriesModule } from '@restaurant-ordering/server/modules/categories';

import { MenuItemsController } from './menu-items.controller';
import { MenuItemsService } from './menu-items.service';

@Module({
  imports: [CategoriesModule],
  controllers: [MenuItemsController],
  providers: [MenuItemsService],
  exports: [MenuItemsService],
})
export class MenuItemsModule {}
