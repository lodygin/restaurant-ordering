import { Injectable } from '@nestjs/common';

@Injectable()
export class MenuRevisionService {
  // boot time, so a revision from before a restart never matches a new one
  private revision = Date.now();

  current(): number {
    return this.revision;
  }

  next(): number {
    this.revision += 1;

    return this.revision;
  }
}
