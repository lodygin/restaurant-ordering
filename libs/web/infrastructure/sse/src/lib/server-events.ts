import { inject, Injectable } from '@angular/core';
import { defer, Observable, retry, timer } from 'rxjs';

import { API_URL } from '@restaurant-ordering/web/infrastructure/http';

import { type ServerEvent } from './types';

const MAX_RETRY_DELAY_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class ServerEvents {
  private readonly apiUrl = inject(API_URL);

  // the browser retries a dropped stream itself; one it gave up on is reopened here from the last id
  connect(path: string, since: number): Observable<ServerEvent<unknown>> {
    return defer(() => {
      let lastId = since;
      let failures = 0;

      return new Observable<ServerEvent<unknown>>(subscriber => {
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
    });
  }
}
