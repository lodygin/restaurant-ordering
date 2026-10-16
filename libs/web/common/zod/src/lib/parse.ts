import { map, type OperatorFunction } from 'rxjs';

import type * as z from 'zod/mini';

export function parse<TOutput>(schema: z.ZodMiniType<TOutput>): OperatorFunction<unknown, TOutput> {
  return map(value => schema.parse(value));
}
