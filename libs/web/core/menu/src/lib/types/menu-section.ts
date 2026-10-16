import { type Category, type MenuItem } from '../models';

export type MenuSection = {
  category: Category;
  items: MenuItem[];
};
