import { type MenuItem } from '../models';

export type MenuItemInput = Omit<MenuItem, 'id'>;
