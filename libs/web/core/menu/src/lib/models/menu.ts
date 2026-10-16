import * as z from 'zod/mini';

import { categorySchema } from './category';
import { menuItemSchema } from './menu-item';

export const menuSchema = z.object({
  categories: z.array(categorySchema),
  items: z.array(menuItemSchema),
});

export type Menu = z.infer<typeof menuSchema>;
