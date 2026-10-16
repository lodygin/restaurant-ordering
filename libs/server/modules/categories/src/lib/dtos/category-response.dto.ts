import { RevisionMetaDto } from '@restaurant-ordering/server/modules/menu-revision';

import { CategoryDto } from './category.dto';

export class CategoryResponseDto {
  data!: CategoryDto;

  meta!: RevisionMetaDto;
}
