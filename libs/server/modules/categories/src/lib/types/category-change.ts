import { type Category } from './category';

export type CategoryChange =
  | { type: 'category.created'; category: Category }
  | { type: 'category.updated'; category: Category }
  | { type: 'category.deleted'; categoryId: string };
