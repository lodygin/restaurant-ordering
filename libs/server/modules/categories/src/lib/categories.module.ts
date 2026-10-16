import { Module } from '@nestjs/common';

import { MenuRevisionModule } from '@restaurant-ordering/server/modules/menu-revision';

import { CategoriesController } from './categories.controller';
import { CategoriesService } from './categories.service';

@Module({
  imports: [MenuRevisionModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
