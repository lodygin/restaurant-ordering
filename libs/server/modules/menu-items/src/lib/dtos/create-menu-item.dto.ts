import { ApiProperty } from '@nestjs/swagger';

import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

import { Trim } from '@restaurant-ordering/server/common/http';
import {
  ITEM_DESCRIPTION_MAX_LENGTH,
  ITEM_MAX_PRICE,
  ITEM_NAME_MAX_LENGTH,
} from '@restaurant-ordering/shared/menu-items';

export class CreateMenuItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId!: string;

  @Trim()
  @IsString()
  @MinLength(1)
  @MaxLength(ITEM_NAME_MAX_LENGTH)
  name!: string;

  @Trim()
  @IsOptional()
  @IsString()
  @MaxLength(ITEM_DESCRIPTION_MAX_LENGTH)
  description?: string;

  @ApiProperty({
    type: 'integer',
    nullable: true,
    required: false,
    minimum: 1,
    maximum: ITEM_MAX_PRICE,
    description:
      'Integer cents. Required for fixed-price items, must be null or absent for open-price ones.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(ITEM_MAX_PRICE)
  price?: number | null;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @ApiProperty({ required: false, description: 'The price is entered when ordering.' })
  @IsOptional()
  @IsBoolean()
  openPrice?: boolean;
}
