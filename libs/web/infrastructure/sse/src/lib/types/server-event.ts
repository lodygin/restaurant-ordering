export type ServerEvent<T> =
  | { type: 'open' }
  | { type: 'reconnecting' }
  | { type: 'message'; id: number; data: T };
