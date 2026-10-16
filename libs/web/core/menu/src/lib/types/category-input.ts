import { type Category } from '../models';

export type CategoryInput = Omit<Category, 'id'>;
