import * as z from 'zod/mini';

import { orderSchema } from './order';

export const orderEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.enum(['order.placed', 'order.updated']), order: orderSchema }),
  z.object({ type: z.literal('resync') }),
]);

export type OrderEvent = z.infer<typeof orderEventSchema>;
