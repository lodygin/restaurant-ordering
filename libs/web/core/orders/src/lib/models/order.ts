import * as z from 'zod/mini';

export const orderSchema = z.object({
  id: z.uuid(),
  number: z.int(),
  createdAt: z.string(),
  lines: z.array(
    z.object({ itemId: z.uuid(), name: z.string(), unitPrice: z.int(), qty: z.int() }),
  ),
  subtotal: z.int(),
  discount: z.int(),
  total: z.int(),
});

export type Order = z.infer<typeof orderSchema>;
