import { ApiProperty } from '@nestjs/swagger';

export class MenuItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  categoryId!: string;

  name!: string;

  description!: string;

  @ApiProperty({
    type: 'integer',
    nullable: true,
    description: 'Integer cents; null for open-price items, priced when ordering.',
  })
  price!: number | null;

  available!: boolean;

  openPrice!: boolean;
}
