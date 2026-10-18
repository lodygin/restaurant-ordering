import { type MessageEvent } from '@nestjs/common';
import {
  concat,
  defer,
  EMPTY,
  from,
  interval,
  map,
  merge,
  of,
  Subject,
  type Observable,
} from 'rxjs';

import { type EventEntry, type EventStreamOptions } from './types';

export const RESYNC_EVENT_TYPE = 'resync';

const DEFAULT_OPTIONS: EventStreamOptions = { capacity: 1000, heartbeatMs: 15_000 };

export class EventStream<T extends object> {
  private readonly buffer: EventEntry<T>[] = [];
  private readonly live$$ = new Subject<EventEntry<T>>();
  private readonly options: EventStreamOptions;

  constructor(options: Partial<EventStreamOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  publish(id: number, event: T): void {
    const entry = { id, event };

    this.buffer.push(entry);

    if (this.buffer.length > this.options.capacity) {
      this.buffer.shift();
    }

    this.live$$.next(entry);
  }

  /** Missed events after `lastId` (or a resync if they are gone), then live ones. */
  subscribe(lastId: number | undefined, latestId: number): Observable<MessageEvent> {
    const heartbeat = interval(this.options.heartbeatMs).pipe(
      map((): MessageEvent => ({ comment: 'heartbeat' })),
    );

    return defer(() =>
      merge(concat(this.backlog(lastId, latestId), this.live$$.pipe(map(toMessage))), heartbeat),
    );
  }

  private backlog(lastId: number | undefined, latestId: number): Observable<MessageEvent> {
    if (lastId === undefined || lastId === latestId) {
      return EMPTY;
    }

    const oldest = this.buffer[0];
    const covered = oldest !== undefined && lastId < latestId && lastId >= oldest.id - 1;

    if (!covered) {
      return of({ id: String(latestId), data: { type: RESYNC_EVENT_TYPE } });
    }

    return from(this.buffer.filter(entry => entry.id > lastId).map(toMessage));
  }
}

function toMessage<T extends object>(entry: EventEntry<T>): MessageEvent {
  return { id: String(entry.id), data: entry.event };
}
