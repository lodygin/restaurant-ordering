import { inject, Injectable } from '@angular/core';
import { map, type Observable } from 'rxjs';

import { parse } from '@restaurant-ordering/web/common/zod';
import { ApiService, unwrap } from '@restaurant-ordering/web/infrastructure/rest';
import { ServerEvents, type ServerEvent } from '@restaurant-ordering/web/infrastructure/sse';

import {
  categorySchema,
  menuChangeSchema,
  menuItemSchema,
  menuSchema,
  type Category,
  type Menu,
  type MenuChange,
  type MenuItem,
} from '../models';
import { type CategoryInput, type MenuItemInput } from '../types';

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

  createCategory(input: CategoryInput): Observable<Category> {
    return this.api.categoriesCreate(input).pipe(unwrap(), parse(categorySchema));
  }

  updateCategory(id: string, input: Partial<CategoryInput>): Observable<Category> {
    return this.api.categoriesUpdate(id, input).pipe(unwrap(), parse(categorySchema));
  }

  removeCategory(id: string): Observable<void> {
    return this.api.categoriesRemove(id);
  }

  createItem(input: MenuItemInput): Observable<MenuItem> {
    return this.api.menuItemsCreate(input).pipe(unwrap(), parse(menuItemSchema));
  }

  updateItem(id: string, input: Partial<MenuItemInput>): Observable<MenuItem> {
    return this.api.menuItemsUpdate(id, input).pipe(unwrap(), parse(menuItemSchema));
  }

  removeItem(id: string): Observable<void> {
    return this.api.menuItemsRemove(id);
  }
}
