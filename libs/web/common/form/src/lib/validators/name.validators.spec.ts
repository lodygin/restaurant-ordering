import { FormControl } from '@angular/forms';

import { nameValidators } from './name.validators';

function isValid(value: string): boolean {
  return new FormControl(value, { validators: nameValidators(5) }).valid;
}

describe('nameValidators', () => {
  it('accepts a name within the limit', () => {
    expect(isValid('Soups')).toBe(true);
  });

  it('rejects an empty, blank or too long name', () => {
    expect(isValid('')).toBe(false);
    expect(isValid('   ')).toBe(false);
    expect(isValid('Desserts')).toBe(false);
  });
});
