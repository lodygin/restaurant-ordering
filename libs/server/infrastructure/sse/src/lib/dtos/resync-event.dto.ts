import { ApiProperty } from '@nestjs/swagger';

import { RESYNC_EVENT_TYPE } from '../event-stream';

/** The missed changes are no longer available: reload the snapshot. */
export class ResyncEventDto {
  @ApiProperty({ enum: [RESYNC_EVENT_TYPE] })
  type!: typeof RESYNC_EVENT_TYPE;
}
