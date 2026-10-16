import { Module } from '@nestjs/common';

import { CategoriesModule } from '@restaurant-ordering/server/modules/categories';
import { MenuItemsModule } from '@restaurant-ordering/server/modules/menu-items';
import { MenuRevisionModule } from '@restaurant-ordering/server/modules/menu-revision';

import { MenuController } from './menu.controller';

@Module({
  imports: [MenuRevisionModule, CategoriesModule, MenuItemsModule],
  controllers: [MenuController],
})
export class MenuModule {}
