export type OrderChangeType = 'unavailable' | 'price' | 'now-fixed' | 'now-open';

export type OrderChange =
  | { type: 'unavailable' | 'now-open'; lineId: string }
  | { type: 'price' | 'now-fixed'; lineId: string; from: number; to: number };
