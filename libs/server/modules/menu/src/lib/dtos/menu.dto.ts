import { ApiProperty } from '@nestjs/swagger';

import { CategoryDto } from '@restaurant-ordering/server/modules/categories';
import { MenuItemDto } from '@restaurant-ordering/server/modules/menu-items';

export class MenuDto {
  @ApiProperty({
    type: 'integer',
    description: 'Bumped by every menu change; live updates resume from it.',
  })
  revision!: number;

  @ApiProperty({ type: [CategoryDto], description: 'In the order they were created.' })
  categories!: CategoryDto[];

  @ApiProperty({ type: [MenuItemDto], description: 'In the order they were created.' })
  items!: MenuItemDto[];
}
