import { HttpErrorResponse } from '@angular/common/http';

import { apiErrorMessage } from './api-error-message';

describe('apiErrorMessage', () => {
  it('takes the message the server sent', () => {
    const error = new HttpErrorResponse({
      status: 409,
      error: { message: 'The category still has 2 item(s); delete them first.' },
    });

    expect(apiErrorMessage(error)).toBe('The category still has 2 item(s); delete them first.');
  });

  it('falls back when there is no message to show', () => {
    expect(apiErrorMessage(new HttpErrorResponse({ status: 0 }))).toBe(
      'Something went wrong. Try again.',
    );
    expect(apiErrorMessage(new Error('parse failed'))).toBe('Something went wrong. Try again.');
  });
});
