import * as z from 'zod/mini';

import { categorySchema } from './category';
import { menuItemSchema } from './menu-item';

export const menuChangeSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.enum(['category.created', 'category.updated']),
    category: categorySchema,
  }),
  z.object({ type: z.literal('category.deleted'), categoryId: z.uuid() }),
  z.object({ type: z.enum(['item.created', 'item.updated']), item: menuItemSchema }),
  z.object({ type: z.literal('item.deleted'), itemId: z.uuid() }),
  z.object({ type: z.literal('resync') }),
]);

export type MenuChange = z.infer<typeof menuChangeSchema>;
