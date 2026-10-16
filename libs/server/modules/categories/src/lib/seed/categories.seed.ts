import { randomUUID } from 'node:crypto';

import { type Category } from '../types';

const CATEGORY_NAMES = [
  'Breakfast',
  'Soups',
  'Salads',
  'Noodles',
  'Rice bowls',
  'Dumplings',
  'Grill',
  'Burgers',
  'Pizza',
  'Pasta',
  'Sides',
  'Desserts',
  'Coffee',
  'Tea',
  'Lemonades',
  'Beer',
  'Wine by the glass',
];

export function seedCategories(): Category[] {
  return CATEGORY_NAMES.map(name => ({ id: randomUUID(), name }));
}
