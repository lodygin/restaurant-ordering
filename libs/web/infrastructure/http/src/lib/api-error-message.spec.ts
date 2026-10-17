import { HttpErrorResponse } from '@angular/common/http';

import { apiErrorMessage } from './api-error-message';

describe('apiErrorMessage', () => {
  it('takes the message the server sent for a client error', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { message: 'The category still has 2 item(s); delete them first.' },
    });

    expect(apiErrorMessage(error)).toBe('The category still has 2 item(s); delete them first.');
  });

  it('says the server could not be reached when the request never got there', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 0 }))).toBe(
      'Couldn’t reach the server. Check your connection and try again.',
    );
  });

  it('hides the internals of a server error', () => {
    const error = new HttpErrorResponse({
      status: 500,
      error: { statusCode: 500, message: 'Internal server error' },
    });

    expect(apiErrorMessage(error)).toBe('The server ran into a problem. Try again in a moment.');
  });

  it('falls back when there is no message to show', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 400, error: null }))).toBe(
      'Something went wrong. Try again.',
    );
    expect(apiErrorMessage(new Error('parse failed'))).toBe('Something went wrong. Try again.');
  });
});
