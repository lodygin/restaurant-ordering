import { TestBed } from '@angular/core/testing';
import { type Subscription } from 'rxjs';

import { type ServerEvent } from '@restaurant-ordering/web/common/sync';
import { API_URL } from '@restaurant-ordering/web/infrastructure/http';

import { ServerEvents } from './server-events';

class FakeEventSource {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSED = 2;
  static instances: FakeEventSource[] = [];

  readyState = FakeEventSource.CONNECTING;
  closed = false;
  onopen: (() => void) | null = null;
  onmessage: ((event: { lastEventId: string; data: string }) => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(readonly url: string) {
    FakeEventSource.instances.push(this);
  }

  open(): void {
    this.readyState = FakeEventSource.OPEN;
    this.onopen?.();
  }

  emit(id: number, data: unknown): void {
    this.onmessage?.({ lastEventId: String(id), data: JSON.stringify(data) });
  }

  fail(readyState: number): void {
    this.readyState = readyState;
    this.onerror?.();
  }

  close(): void {
    this.closed = true;
  }
}

function latest(): FakeEventSource {
  const source = FakeEventSource.instances.at(-1);

  if (!source) {
    throw new Error('No EventSource was opened');
  }

  return source;
}

describe('ServerEvents', () => {
  let events: ServerEvent<unknown>[];
  let subscription: Subscription;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('EventSource', FakeEventSource);
    FakeEventSource.instances = [];
    events = [];

    TestBed.configureTestingModule({
      providers: [{ provide: API_URL, useValue: 'http://api' }],
    });

    subscription = TestBed.inject(ServerEvents)
      .connect('/menu/events', 10)
      .subscribe(event => events.push(event));
  });

  afterEach(() => {
    subscription.unsubscribe();
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('opens the stream from the given point', () => {
    expect(latest().url).toBe('http://api/menu/events?since=10');
  });

  it('reports the connection and passes parsed messages with their ids', () => {
    latest().open();
    latest().emit(11, { type: 'item.deleted', itemId: 'a' });

    expect(events).toEqual([
      { type: 'open' },
      { type: 'message', id: 11, data: { type: 'item.deleted', itemId: 'a' } },
    ]);
  });

  it('leaves a transient drop to the browser and only reports it', () => {
    latest().open();
    latest().fail(FakeEventSource.CONNECTING);
    vi.advanceTimersByTime(10_000);

    expect(events.at(-1)).toEqual({ type: 'reconnecting' });
    expect(FakeEventSource.instances).toHaveLength(1);
  });

  it('reopens a closed stream from the last event it saw', () => {
    latest().open();
    latest().emit(12, {});
    latest().fail(FakeEventSource.CLOSED);

    expect(events.at(-1)).toEqual({ type: 'reconnecting' });
    expect(FakeEventSource.instances[0]?.closed).toBe(true);

    vi.advanceTimersByTime(500);

    expect(latest().url).toBe('http://api/menu/events?since=12');
  });

  it('backs off between attempts while the server stays down', () => {
    latest().fail(FakeEventSource.CLOSED);
    vi.advanceTimersByTime(500);
    latest().fail(FakeEventSource.CLOSED);
    vi.advanceTimersByTime(500);

    expect(FakeEventSource.instances).toHaveLength(2);

    vi.advanceTimersByTime(500);

    expect(FakeEventSource.instances).toHaveLength(3);
  });

  it('closes the stream while the browser is offline and resumes from the last event', () => {
    latest().open();
    latest().emit(12, {});
    window.dispatchEvent(new Event('offline'));

    expect(events.at(-1)).toEqual({ type: 'offline' });
    expect(latest().closed).toBe(true);

    window.dispatchEvent(new Event('online'));

    expect(FakeEventSource.instances).toHaveLength(2);
    expect(latest().url).toBe('http://api/menu/events?since=12');
  });

  it('closes the stream on unsubscribe', () => {
    subscription.unsubscribe();

    expect(latest().closed).toBe(true);
  });
});
