import { ApiProperty } from '@nestjs/swagger';

import { CategoryDto } from '@restaurant-ordering/server/modules/categories';

export class CategorySavedEventDto {
  @ApiProperty({ enum: ['category.created', 'category.updated'] })
  type!: 'category.created' | 'category.updated';

  category!: CategoryDto;
}

export class CategoryDeletedEventDto {
  @ApiProperty({ enum: ['category.deleted'] })
  type!: 'category.deleted';

  @ApiProperty({ format: 'uuid' })
  categoryId!: string;
}
