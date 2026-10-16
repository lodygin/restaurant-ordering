import { type MenuItem } from './menu-item';

export type MenuItemChange =
  | { type: 'item.created'; item: MenuItem }
  | { type: 'item.updated'; item: MenuItem }
  | { type: 'item.deleted'; itemId: string };
