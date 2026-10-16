import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';

import { CategoriesService } from '@restaurant-ordering/server/modules/categories';
import { MenuItemsService } from '@restaurant-ordering/server/modules/menu-items';
import { MenuRevisionService } from '@restaurant-ordering/server/modules/menu-revision';

import { MenuResponseDto } from './dtos';

@ApiTags('menu')
@Controller('menu')
export class MenuController {
  constructor(
    private readonly categories: CategoriesService,
    private readonly items: MenuItemsService,
    private readonly revision: MenuRevisionService,
  ) {}

  @Get()
  @ApiOkResponse({
    type: MenuResponseDto,
    description: 'The whole menu with its current revision.',
  })
  snapshot(): MenuResponseDto {
    return {
      data: {
        revision: this.revision.current(),
        categories: this.categories.list(),
        items: this.items.list(),
      },
    };
  }
}
