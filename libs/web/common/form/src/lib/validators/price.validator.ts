import { type AbstractControl, type ValidationErrors } from '@angular/forms';

import { parsePrice } from '@restaurant-ordering/shared/money';

export function priceValidator(control: AbstractControl<string>): ValidationErrors | null {
  return parsePrice(control.value) === null ? { price: true } : null;
}
