import { Injectable } from '@nestjs/common';

/** Version of the whole menu: every change to categories or items moves it forward by one. */
@Injectable()
export class MenuRevisionService {
  private revision = 1;

  current(): number {
    return this.revision;
  }

  bump(): number {
    this.revision += 1;

    return this.revision;
  }
}
