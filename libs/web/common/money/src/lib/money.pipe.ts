import { Pipe, type PipeTransform } from '@angular/core';

import { formatPrice } from '@restaurant-ordering/shared/money';

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(cents: number): string {
    return `$${formatPrice(cents)}`;
  }
}
