import { ApiProperty } from '@nestjs/swagger';

import { RESYNC_EVENT_TYPE } from '@restaurant-ordering/server/infrastructure/sse';

/** The missed changes are no longer available: reload the menu snapshot. */
export class ResyncEventDto {
  @ApiProperty({ enum: [RESYNC_EVENT_TYPE] })
  type!: typeof RESYNC_EVENT_TYPE;
}
