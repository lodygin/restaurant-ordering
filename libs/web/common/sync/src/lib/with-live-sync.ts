import { pipe, repeat, retry, switchMap, takeWhile, tap, timer } from 'rxjs';

import {
  patchState,
  signalStoreFeature,
  withHooks,
  withState,
  type EmptyFeatureResult,
  type SignalStoreFeature,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';

import {
  type LiveSyncSource,
  type ResyncEvent,
  type StreamConnection,
  type SyncStatus,
} from './types';

type LiveSyncState = {
  status: SyncStatus;
  connection: StreamConnection;
  revision: number | null;
  staleSince: number | null;
};

const SNAPSHOT_RETRY_MS = 3000;

const initialState: LiveSyncState = {
  status: 'idle',
  connection: 'connecting',
  revision: null,
  staleSince: null,
};

// snapshot first, then the stream from its revision; a resync completes it and repeat() starts over
export function withLiveSync<TSnapshot, TEvent extends { type: string }>(
  source: LiveSyncSource<TSnapshot, TEvent>,
): SignalStoreFeature<EmptyFeatureResult, EmptyFeatureResult & { state: LiveSyncState }> {
  return signalStoreFeature(
    withState(initialState),

    withHooks(store => {
      const setConnection = (connection: StreamConnection): void =>
        patchState(store, {
          connection,
          staleSince: connection === 'online' ? null : (store.staleSince() ?? Date.now()),
        });

      const sync = rxMethod<void>(
        pipe(
          switchMap(() => {
            patchState(store, { status: 'loading' });

            return source.snapshot().pipe(
              retry({
                delay: () => {
                  patchState(store, { status: 'error' });
                  setConnection('reconnecting');

                  return timer(SNAPSHOT_RETRY_MS);
                },
              }),
              tap(({ data, revision }) => {
                source.applySnapshot(data);
                patchState(store, { status: 'loaded', revision });
              }),
              switchMap(({ revision }) => source.events(revision)),
              takeWhile(event => event.type !== 'message' || event.data.type !== 'resync'),
              repeat(),
              tap(event => {
                if (event.type !== 'message') {
                  setConnection(event.type === 'open' ? 'online' : event.type);

                  return;
                }

                // a reconnect replays what the snapshot already holds
                if (event.data.type === 'resync' || event.id <= (store.revision() ?? 0)) {
                  return;
                }

                patchState(store, { revision: event.id });
                source.applyEvent(event.data as Exclude<TEvent, ResyncEvent>, event.id);
              }),
              // a broken stream starts over from a fresh snapshot
              retry({
                delay: () => {
                  setConnection('reconnecting');

                  return timer(SNAPSHOT_RETRY_MS);
                },
              }),
            );
          }),
        ),
      );

      return { onInit: () => sync() };
    }),
  );
}
