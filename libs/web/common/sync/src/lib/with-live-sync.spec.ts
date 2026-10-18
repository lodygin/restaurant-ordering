import { inject, Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { defer, Subject, type Observable } from 'rxjs';

import { patchState, signalStore, withFeature, withState } from '@ngrx/signals';

import { type Revised, type ServerEvent } from './types';
import { withLiveSync } from './with-live-sync';

type NameEvent = { type: 'added'; name: string } | { type: 'resync' };

@Injectable({ providedIn: 'root' })
class FakeSource {
  readonly snapshots: Subject<Revised<string[]>>[] = [];
  readonly streams: { since: number; events: Subject<ServerEvent<NameEvent>> }[] = [];

  // cold like HttpClient: every subscription (and so every retry) is a new request
  snapshot(): Observable<Revised<string[]>> {
    return defer(() => {
      const snapshot = new Subject<Revised<string[]>>();

      this.snapshots.push(snapshot);

      return snapshot;
    });
  }

  events(since: number): Subject<ServerEvent<NameEvent>> {
    const events = new Subject<ServerEvent<NameEvent>>();

    this.streams.push({ since, events });

    return events;
  }

  respond(names: string[], revision = 10): void {
    const pending = this.snapshots.at(-1);

    pending?.next({ data: names, revision });
    pending?.complete();
  }

  push(event: ServerEvent<NameEvent>): void {
    this.streams.at(-1)?.events.next(event);
  }
}

const NamesStore = signalStore(
  withState({ names: [] as string[] }),
  withFeature((store, source = inject(FakeSource)) =>
    withLiveSync({
      snapshot: () => source.snapshot(),
      events: since => source.events(since),
      applySnapshot: names => patchState(store, { names }),
      applyEvent: event => patchState(store, { names: [...store.names(), event.name] }),
    }),
  ),
);

describe('withLiveSync', () => {
  let store: InstanceType<typeof NamesStore>;
  let source: FakeSource;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [NamesStore] });

    source = TestBed.inject(FakeSource);
    store = TestBed.inject(NamesStore);
  });

  afterEach(() => vi.useRealTimers());

  it('loads the snapshot, then follows the stream from its revision', () => {
    expect(store.status()).toBe('loading');
    expect(source.streams).toHaveLength(0);

    source.respond(['Pho']);

    expect(store.status()).toBe('loaded');
    expect(store.names()).toEqual(['Pho']);
    expect(store.revision()).toBe(10);
    expect(source.streams[0]?.since).toBe(10);
  });

  it('applies new events and moves the revision', () => {
    source.respond(['Pho']);
    source.push({ type: 'message', id: 11, data: { type: 'added', name: 'Ramen' } });

    expect(store.names()).toEqual(['Pho', 'Ramen']);
    expect(store.revision()).toBe(11);
  });

  it('skips events the snapshot already contains', () => {
    source.respond(['Pho']);
    source.push({ type: 'message', id: 10, data: { type: 'added', name: 'Pho' } });

    expect(store.names()).toEqual(['Pho']);
  });

  it('tracks the connection and since when the data is stale', () => {
    vi.setSystemTime(new Date('2026-10-18T10:05:00Z'));
    source.respond(['Pho']);

    expect(store.connection()).toBe('connecting');

    source.push({ type: 'open' });

    expect(store.connection()).toBe('online');
    expect(store.staleSince()).toBeNull();

    source.push({ type: 'reconnecting' });
    vi.advanceTimersByTime(60_000);
    source.push({ type: 'offline' });

    expect(store.connection()).toBe('offline');
    expect(store.staleSince()).toBe(new Date('2026-10-18T10:05:00Z').getTime());

    source.push({ type: 'open' });

    expect(store.staleSince()).toBeNull();
  });

  it('reloads the snapshot in the background and reconnects from it on resync', () => {
    source.respond(['Pho']);
    source.push({ type: 'message', id: 30, data: { type: 'resync' } });

    expect(store.status()).toBe('loaded');
    expect(source.snapshots).toHaveLength(2);
    expect(source.streams[0]?.events.observed).toBe(false);

    source.respond(['Pho', 'Ramen'], 30);

    expect(store.names()).toEqual(['Pho', 'Ramen']);
    expect(source.streams[1]?.since).toBe(30);
  });

  it('keeps retrying the snapshot while the server is unavailable', () => {
    source.snapshots[0]?.error(new Error('offline'));

    expect(store.status()).toBe('error');
    expect(store.connection()).toBe('reconnecting');

    vi.advanceTimersByTime(3000);
    source.respond(['Pho']);

    expect(store.status()).toBe('loaded');
    expect(source.snapshots).toHaveLength(2);
  });

  it('starts over from a fresh snapshot when the stream breaks', () => {
    source.respond(['Pho']);
    source.push({ type: 'open' });
    source.streams[0]?.events.error(new Error('unexpected event'));

    expect(store.connection()).toBe('reconnecting');
    expect(store.status()).toBe('loaded');

    vi.advanceTimersByTime(3000);
    source.respond(['Pho'], 50);
    source.push({ type: 'open' });

    expect(source.streams[1]?.since).toBe(50);
    expect(store.connection()).toBe('online');
  });
});
