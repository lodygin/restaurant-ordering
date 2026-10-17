import * as z from 'zod/mini';

export const orderChangeSchema = z.discriminatedUnion('type', [
  z.object({ type: z.enum(['unavailable', 'now-open']), lineId: z.string() }),
  z.object({
    type: z.enum(['price', 'now-fixed']),
    lineId: z.string(),
    from: z.int(),
    to: z.int(),
  }),
]);

export const orderConflictSchema = z.object({ changes: z.array(orderChangeSchema) });

export type OrderChange = z.infer<typeof orderChangeSchema>;
