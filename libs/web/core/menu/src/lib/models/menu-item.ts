import * as z from 'zod/mini';

export const menuItemSchema = z.object({
  id: z.uuid(),
  categoryId: z.uuid(),
  name: z.string(),
  description: z.string(),
  /** Cents; null for open-price items. */
  price: z.nullable(z.int()),
  available: z.boolean(),
  openPrice: z.boolean(),
});

export type MenuItem = z.infer<typeof menuItemSchema>;
