import { inject, Injectable } from '@angular/core';
import { type Observable } from 'rxjs';

import { parse } from '@restaurant-ordering/web/common/zod';
import { ApiService, unwrap } from '@restaurant-ordering/web/infrastructure/api';

import { menuSchema, type Menu } from '../models';

@Injectable({ providedIn: 'root' })
export class MenuApi {
  private readonly api = inject(ApiService);

  snapshot(): Observable<Menu> {
    return this.api.menuSnapshot().pipe(unwrap(), parse(menuSchema));
  }
}
