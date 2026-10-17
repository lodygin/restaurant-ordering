import { ApiProperty } from '@nestjs/swagger';

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
