export type CartLineIssue =
  | { type: 'unavailable' | 'now-open' }
  | { type: 'price' | 'now-fixed'; price: number };
