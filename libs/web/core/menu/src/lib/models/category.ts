import * as z from 'zod/mini';

export const categorySchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

export type Category = z.infer<typeof categorySchema>;
