import { type Observable } from 'rxjs';

import { type ResyncEvent } from './resync-event';
import { type Revised } from './revised';
import { type ServerEvent } from './server-event';

export type LiveSyncSource<TSnapshot, TEvent extends { type: string }> = {
  snapshot: () => Observable<Revised<TSnapshot>>;
  events: (since: number) => Observable<ServerEvent<TEvent>>;
  applySnapshot: (snapshot: TSnapshot) => void;
  applyEvent: (event: Exclude<TEvent, ResyncEvent>, revision: number) => void;
};
