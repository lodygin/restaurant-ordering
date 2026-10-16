import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class MenuEventsQueryDto {
  @ApiProperty({
    type: 'integer',
    required: false,
    description: 'Revision of the loaded snapshot.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  since?: number;
}
