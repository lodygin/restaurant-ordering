import { HttpErrorResponse } from '@angular/common/http';

const FALLBACK_MESSAGE = 'Something went wrong. Try again.';

export function apiErrorMessage(error: unknown): string {
  const body: unknown = error instanceof HttpErrorResponse ? error.error : null;

  if (typeof body === 'object' && body !== null && 'message' in body) {
    if (typeof body.message === 'string') {
      return body.message;
    }
  }

  return FALLBACK_MESSAGE;
}
