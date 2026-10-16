import { Module } from '@nestjs/common';

import { CategoriesModule } from '@restaurant-ordering/server/modules/categories';
import { MenuItemsModule } from '@restaurant-ordering/server/modules/menu-items';

import { MenuChangesService } from './menu-changes.service';
import { MenuController } from './menu.controller';

@Module({
  imports: [CategoriesModule, MenuItemsModule],
  controllers: [MenuController],
  providers: [MenuChangesService],
})
export class MenuModule {}
