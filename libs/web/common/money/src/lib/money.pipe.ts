import { Pipe, type PipeTransform } from '@angular/core';

import { formatMoney } from './format-money';

@Pipe({ name: 'money' })
export class MoneyPipe implements PipeTransform {
  transform(cents: number): string {
    return formatMoney(cents);
  }
}
