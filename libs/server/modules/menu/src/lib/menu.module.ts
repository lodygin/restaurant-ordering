import { Module } from '@nestjs/common';

import { CategoriesModule } from '@restaurant-ordering/server/modules/categories';
import { MenuItemsModule } from '@restaurant-ordering/server/modules/menu-items';

import { MenuRevisionService } from './menu-revision.service';
import { MenuController } from './menu.controller';

@Module({
  imports: [CategoriesModule, MenuItemsModule],
  controllers: [MenuController],
  providers: [MenuRevisionService],
})
export class MenuModule {}
