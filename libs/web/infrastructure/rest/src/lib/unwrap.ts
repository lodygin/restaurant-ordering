import { map, type OperatorFunction } from 'rxjs';

export function unwrap<T>(): OperatorFunction<{ data: T }, T> {
  return map(response => response.data);
}
