import { type Category, type MenuItem } from '@restaurant-ordering/web/core/menu';

export type MenuRow =
  | { type: 'category'; id: string; category: Category; count: number }
  | { type: 'item'; id: string; item: MenuItem; first: boolean; last: boolean };
