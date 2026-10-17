import { HttpErrorResponse } from '@angular/common/http';

const FALLBACK_MESSAGE = 'Something went wrong. Try again.';
const NETWORK_MESSAGE = 'Couldn’t reach the server. Check your connection and try again.';
const SERVER_MESSAGE = 'The server ran into a problem. Try again in a moment.';

// only a client error explains itself; a server error's message is not meant for users
export function apiErrorMessage(error: unknown): string {
  if (!(error instanceof HttpErrorResponse)) {
    return FALLBACK_MESSAGE;
  }

  if (error.status === 0) {
    return NETWORK_MESSAGE;
  }

  if (error.status >= 500) {
    return SERVER_MESSAGE;
  }

  const body: unknown = error.error;

  if (typeof body === 'object' && body !== null && 'message' in body) {
    if (typeof body.message === 'string') {
      return body.message;
    }
  }

  return FALLBACK_MESSAGE;
}
