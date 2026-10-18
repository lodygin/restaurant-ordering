import { type MessageEvent } from '@nestjs/common';
import { type Observable } from 'rxjs';

import { EventStream } from './event-stream';
import { Revision } from './revision';

export class ChangeLog<T extends object> {
  private readonly revision = new Revision();
  private readonly stream = new EventStream<T>();

  current(): number {
    return this.revision.current();
  }

  commit<E extends T>(event: E): number {
    const revision = this.revision.next();

    this.stream.publish(revision, event);

    return revision;
  }

  events(lastRevision?: number): Observable<MessageEvent> {
    return this.stream.subscribe(lastRevision, this.revision.current());
  }
}
