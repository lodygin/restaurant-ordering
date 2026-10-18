import * as z from 'zod/mini';

export const orderStatusSchema = z.enum(['received', 'preparing', 'ready', 'collected']);

export const orderSchema = z.object({
  id: z.uuid(),
  number: z.int(),
  createdAt: z.string(),
  status: orderStatusSchema,
  lines: z.array(
    z.object({ itemId: z.uuid(), name: z.string(), unitPrice: z.int(), qty: z.int() }),
  ),
  subtotal: z.int(),
  discount: z.int(),
  total: z.int(),
});

export type Order = z.infer<typeof orderSchema>;

export type OrderStatus = z.infer<typeof orderStatusSchema>;
