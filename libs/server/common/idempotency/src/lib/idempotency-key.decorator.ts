import { BadRequestException, createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { isUUID } from 'class-validator';

type HttpRequest = { headers: Record<string, string | string[] | undefined> };

export const IdempotencyKey = createParamDecorator((_: unknown, context: ExecutionContext) => {
  const key = context.switchToHttp().getRequest<HttpRequest>().headers['idempotency-key'];

  if (typeof key !== 'string' || !isUUID(key)) {
    throw new BadRequestException('Idempotency-Key header must be a UUID.');
  }

  return key;
});
