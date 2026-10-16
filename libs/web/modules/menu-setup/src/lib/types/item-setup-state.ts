import { type MenuItemInput } from '@restaurant-ordering/web/core/menu';

export type ItemSetupState = {
  edits: Record<string, Partial<MenuItemInput>>;
  removing: string[];
};
