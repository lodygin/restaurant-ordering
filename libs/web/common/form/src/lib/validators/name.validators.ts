import { Validators, type ValidatorFn } from '@angular/forms';

export function nameValidators(maxLength: number): ValidatorFn[] {
  return [Validators.required, Validators.pattern(/\S/), Validators.maxLength(maxLength)];
}
