import {
  concatMap,
  exhaustMap,
  groupBy,
  mergeMap,
  type ObservableInput,
  type ObservedValueOf,
  type OperatorFunction,
} from 'rxjs';

/** One key at a time in order, different keys in parallel. */
export function concatMapBy<T, K, O extends ObservableInput<unknown>>(
  key: (value: T) => K,
  project: (value: T) => O,
): OperatorFunction<T, ObservedValueOf<O>> {
  return source =>
    source.pipe(
      groupBy(key),
      mergeMap(group => group.pipe(concatMap(project))),
    );
}

/** One key at a time, ignoring that key while it is busy; different keys in parallel. */
export function exhaustMapBy<T, K, O extends ObservableInput<unknown>>(
  key: (value: T) => K,
  project: (value: T) => O,
): OperatorFunction<T, ObservedValueOf<O>> {
  return source =>
    source.pipe(
      groupBy(key),
      mergeMap(group => group.pipe(exhaustMap(project))),
    );
}
