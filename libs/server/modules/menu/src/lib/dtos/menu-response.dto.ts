import { RevisionMetaDto } from '@restaurant-ordering/server/modules/menu-revision';

import { MenuDto } from './menu.dto';

export class MenuResponseDto {
  data!: MenuDto;

  meta!: RevisionMetaDto;
}
