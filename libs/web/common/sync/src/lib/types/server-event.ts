export type ServerEvent<T> =
  | { type: 'open' }
  | { type: 'reconnecting' }
  | { type: 'offline' }
  | { type: 'message'; id: number; data: T };
