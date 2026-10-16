import { IsString, MaxLength, MinLength } from 'class-validator';

import { Trim } from '@restaurant-ordering/server/common/http';
import { CATEGORY_NAME_MAX_LENGTH } from '@restaurant-ordering/shared/categories';

export class CreateCategoryDto {
  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(CATEGORY_NAME_MAX_LENGTH)
  name!: string;
}
