import { type CategoryChange } from '@restaurant-ordering/server/modules/categories';
import { type MenuItemChange } from '@restaurant-ordering/server/modules/menu-items';

export type MenuChange = CategoryChange | MenuItemChange;
