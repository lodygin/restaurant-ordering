import { ApiProperty } from '@nestjs/swagger';

import { ORDER_STATUSES } from '../constants';
import { type OrderStatus } from '../types';

export class OrderLineDto {
  @ApiProperty({ format: 'uuid' })
  itemId!: string;

  name!: string;

  @ApiProperty({ type: 'integer', description: 'Integer cents.' })
  unitPrice!: number;

  @ApiProperty({ type: 'integer' })
  qty!: number;
}

export class OrderDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ type: 'integer', description: 'Short number the guest is called by.' })
  number!: number;

  @ApiProperty({ format: 'date-time' })
  createdAt!: string;

  @ApiProperty({
    enum: ORDER_STATUSES,
    description: 'Moves forward on its own as the kitchen works.',
  })
  status!: OrderStatus;

  lines!: OrderLineDto[];

  @ApiProperty({ type: 'integer', description: 'Integer cents.' })
  subtotal!: number;

  @ApiProperty({ type: 'integer', description: 'Integer cents, never above the subtotal.' })
  discount!: number;

  @ApiProperty({ type: 'integer', description: 'Integer cents.' })
  total!: number;
}

export class OrderResponseDto {
  data!: OrderDto;
}

export class OrdersMetaDto {
  @ApiProperty({
    type: 'integer',
    description: 'Revision of the orders right after this response; live updates resume from it.',
  })
  revision!: number;
}

export class OrdersResponseDto {
  @ApiProperty({ type: [OrderDto], description: 'Newest first.' })
  data!: OrderDto[];

  meta!: OrdersMetaDto;
}

export class OrderEventDto {
  @ApiProperty({ enum: ['order.placed', 'order.updated'] })
  type!: 'order.placed' | 'order.updated';

  order!: OrderDto;
}
