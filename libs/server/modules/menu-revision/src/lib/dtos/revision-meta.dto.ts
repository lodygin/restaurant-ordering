import { ApiProperty } from '@nestjs/swagger';

export class RevisionMetaDto {
  @ApiProperty({
    type: 'integer',
    description: 'Menu revision right after this response; live updates resume from it.',
  })
  revision!: number;
}
