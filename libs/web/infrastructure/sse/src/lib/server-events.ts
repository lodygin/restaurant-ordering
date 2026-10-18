import { inject, Injectable } from '@angular/core';
import {
  defer,
  distinctUntilChanged,
  fromEvent,
  map,
  merge,
  Observable,
  of,
  retry,
  startWith,
  switchMap,
  timer,
} from 'rxjs';

import { type ServerEvent } from '@restaurant-ordering/web/common/sync';
import { API_URL } from '@restaurant-ordering/web/infrastructure/http';

const MAX_RETRY_DELAY_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class ServerEvents {
  private readonly apiUrl = inject(API_URL);

  // a stream the browser gave up on reopens from the last id; offline it stays closed
  connect(path: string, since: number): Observable<ServerEvent<unknown>> {
    return defer(() => {
      let lastId = since;
      let failures = 0;

      const stream$ = new Observable<ServerEvent<unknown>>(subscriber => {
        const source = new EventSource(`${this.apiUrl}${path}?since=${lastId}`);

        source.onopen = () => {
          failures = 0;
          subscriber.next({ type: 'open' });
        };

        source.onmessage = ({ lastEventId, data }: MessageEvent<string>) => {
          lastId = Number(lastEventId);
          subscriber.next({ type: 'message', id: lastId, data: JSON.parse(data) as unknown });
        };

        source.onerror = () => {
          subscriber.next({ type: 'reconnecting' });

          if (source.readyState === EventSource.CLOSED) {
            subscriber.error(new Error(`Event stream ${path} closed`));
          }
        };

        return () => source.close();
      }).pipe(retry({ delay: () => timer(Math.min(500 * 2 ** failures++, MAX_RETRY_DELAY_MS)) }));

      return merge(
        fromEvent(window, 'online').pipe(map(() => true)),
        fromEvent(window, 'offline').pipe(map(() => false)),
      ).pipe(
        startWith(navigator.onLine),
        distinctUntilChanged(),
        switchMap(online => (online ? stream$ : of<ServerEvent<unknown>>({ type: 'offline' }))),
      );
    });
  }
}
