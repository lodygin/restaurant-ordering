import { Module } from '@nestjs/common';

import { MenuRevisionService } from './menu-revision.service';

@Module({
  providers: [MenuRevisionService],
  exports: [MenuRevisionService],
})
export class MenuRevisionModule {}
