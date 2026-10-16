import { RevisionMetaDto } from '@restaurant-ordering/server/modules/menu-revision';

import { MenuItemDto } from './menu-item.dto';

export class MenuItemResponseDto {
  data!: MenuItemDto;

  meta!: RevisionMetaDto;
}
