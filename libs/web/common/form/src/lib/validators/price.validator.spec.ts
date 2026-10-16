import { FormControl } from '@angular/forms';

import { priceValidator } from './price.validator';

describe('priceValidator', () => {
  it('accepts a price and flags anything else', () => {
    expect(priceValidator(new FormControl('12.50', { nonNullable: true }))).toBeNull();
    expect(priceValidator(new FormControl('free', { nonNullable: true }))).toEqual({
      price: true,
    });
  });
});
