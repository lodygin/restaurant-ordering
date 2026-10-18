import { BadRequestException, createParamDecorator, type ExecutionContext } from '@nestjs/common';

import { isInt, min } from 'class-validator';

import { type ResumableRequest } from './types';

// the browser sends Last-Event-ID when it reconnects by itself; a fresh EventSource passes ?since
export const ResumeFrom = createParamDecorator(
  (_: unknown, context: ExecutionContext): number | undefined => {
    const { headers, query } = context.switchToHttp().getRequest<ResumableRequest>();
    const raw = headers['last-event-id'] ?? query['since'];

    if (raw === undefined || raw === '') {
      return undefined;
    }

    const revision = Number(raw);

    if (!isInt(revision) || !min(revision, 0)) {
      throw new BadRequestException('The stream can only resume from a revision number.');
    }

    return revision;
  },
);
