import { ApiProperty } from '@nestjs/swagger';

import { type OrderChangeType } from '../types';

export class OrderChangeDto {
  @ApiProperty({
    enum: ['unavailable', 'price', 'now-fixed', 'now-open'],
    description: [
      '`unavailable`: sold out or removed, drop the line.',
      '`price`: the fixed price changed, the line takes `to`.',
      '`now-fixed`: open-price item got a fixed price `to`, the line joins the item’s regular line.',
      '`now-open`: fixed item is now priced when ordering, drop the line.',
    ].join('\n'),
  })
  type!: OrderChangeType;

  lineId!: string;

  @ApiProperty({ type: 'integer', required: false, description: 'Integer cents the line had.' })
  from?: number;

  @ApiProperty({ type: 'integer', required: false, description: 'Integer cents it costs now.' })
  to?: number;
}

export class OrderConflictDto {
  message!: string;

  changes!: OrderChangeDto[];
}
