export type LineChange =
  | { type: 'unavailable' | 'now-open' }
  | { type: 'price' | 'now-fixed'; price: number };
