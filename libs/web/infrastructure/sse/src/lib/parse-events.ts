import { map, type OperatorFunction } from 'rxjs';

import type * as z from 'zod/mini';

import { type ServerEvent } from './types';

export function parseEvents<T>(
  schema: z.ZodMiniType<T>,
): OperatorFunction<ServerEvent<unknown>, ServerEvent<T>> {
  return map(event =>
    event.type === 'message' ? { ...event, data: schema.parse(event.data) } : event,
  );
}
