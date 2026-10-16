import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { parse } from '@restaurant-ordering/web/common/zod';
import { ApiService, unwrap } from '@restaurant-ordering/web/infrastructure/rest';
import { ServerEvents, type ServerEvent } from '@restaurant-ordering/web/infrastructure/sse';

import { menuChangeSchema, menuSchema, type Menu, type MenuChange } from '../models';

@Injectable({ providedIn: 'root' })
export class MenuApi {
  private readonly api = inject(ApiService);
  private readonly serverEvents = inject(ServerEvents);

  snapshot(): Observable<Menu> {
    return this.api.menuSnapshot().pipe(unwrap(), parse(menuSchema));
  }

  changes(since: number): Observable<ServerEvent<MenuChange>> {
    return this.serverEvents
      .connect('/api/v1/menu/events', since)
      .pipe(
        map(event =>
          event.type === 'message' ? { ...event, data: menuChangeSchema.parse(event.data) } : event,
        ),
      );
  }
}
