import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsBoolean,
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

import { ITEM_MAX_PRICE } from '@restaurant-ordering/shared/menu-items';
import { ORDER_LINE_MAX_QTY } from '@restaurant-ordering/shared/orders';

const MAX_LINES = 100;

export class CartLineDto {
  @ApiProperty({ description: 'The cart’s own id for the line; changes in a 409 refer to it.' })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lineId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  itemId!: string;

  @ApiProperty({
    type: 'integer',
    minimum: 1,
    maximum: ITEM_MAX_PRICE,
    description: 'Integer cents: the price the guest saw, or entered for an open-price item.',
  })
  @IsInt()
  @Min(1)
  @Max(ITEM_MAX_PRICE)
  unitPrice!: number;

  @ApiProperty({ type: 'integer', minimum: 1, maximum: ORDER_LINE_MAX_QTY })
  @IsInt()
  @Min(1)
  @Max(ORDER_LINE_MAX_QTY)
  qty!: number;

  @ApiProperty({ description: 'Whether the item was open-price when it was added.' })
  @IsBoolean()
  openPrice!: boolean;
}

export class PlaceOrderDto {
  @ApiProperty({ type: [CartLineDto], minItems: 1, maxItems: MAX_LINES })
  @ValidateNested({ each: true })
  @Type(() => CartLineDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_LINES)
  lines!: CartLineDto[];

  @ApiProperty({
    type: 'integer',
    minimum: 0,
    description: 'Integer cents; anything above the subtotal is capped at it.',
  })
  @IsInt()
  @Min(0)
  discount!: number;
}
