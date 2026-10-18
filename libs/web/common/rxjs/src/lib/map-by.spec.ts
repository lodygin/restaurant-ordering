import { Subject, type OperatorFunction } from 'rxjs';

import { concatMapBy, exhaustMapBy } from './map-by';

type Write = { id: string; step: number };

class FakeWrites {
  readonly writes = new Subject<Write>();
  readonly requests: { write: Write; response: Subject<string> }[] = [];

  constructor(
    operator: (
      key: (write: Write) => string,
      project: (write: Write) => Subject<string>,
    ) => OperatorFunction<Write, string>,
  ) {
    this.writes
      .pipe(
        operator(
          ({ id }) => id,
          write => {
            const response = new Subject<string>();

            this.requests.push({ write, response });

            return response;
          },
        ),
      )
      .subscribe();
  }

  sent(): string[] {
    return this.requests.map(({ write }) => `${write.id}${write.step}`);
  }

  respond(index: number): void {
    this.requests[index]?.response.complete();
  }
}

describe('concatMapBy', () => {
  it('runs writes of one key in order and of different keys in parallel', () => {
    const fake = new FakeWrites(concatMapBy);

    fake.writes.next({ id: 'a', step: 1 });
    fake.writes.next({ id: 'a', step: 2 });
    fake.writes.next({ id: 'b', step: 1 });

    expect(fake.sent()).toEqual(['a1', 'b1']);

    fake.respond(0);

    expect(fake.sent()).toEqual(['a1', 'b1', 'a2']);
  });
});

describe('exhaustMapBy', () => {
  it('ignores a key while its write is running, other keys still go', () => {
    const fake = new FakeWrites(exhaustMapBy);

    fake.writes.next({ id: 'a', step: 1 });
    fake.writes.next({ id: 'a', step: 2 });
    fake.writes.next({ id: 'b', step: 1 });

    expect(fake.sent()).toEqual(['a1', 'b1']);

    fake.respond(0);
    fake.writes.next({ id: 'a', step: 3 });

    expect(fake.sent()).toEqual(['a1', 'b1', 'a3']);
  });
});
