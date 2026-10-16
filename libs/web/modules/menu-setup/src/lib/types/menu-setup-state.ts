import { type MenuItemInput } from '@restaurant-ordering/web/core/menu';

export type MenuSetupState = {
  edits: Record<string, Partial<MenuItemInput>>;
  removing: string[];
};
