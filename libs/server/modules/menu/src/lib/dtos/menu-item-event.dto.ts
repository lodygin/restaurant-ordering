import { ApiProperty } from '@nestjs/swagger';

import { MenuItemDto } from '@restaurant-ordering/server/modules/menu-items';

export class MenuItemSavedEventDto {
  @ApiProperty({ enum: ['item.created', 'item.updated'] })
  type!: 'item.created' | 'item.updated';

  item!: MenuItemDto;
}

export class MenuItemDeletedEventDto {
  @ApiProperty({ enum: ['item.deleted'] })
  type!: 'item.deleted';

  @ApiProperty({ format: 'uuid' })
  itemId!: string;
}
