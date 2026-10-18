import { inject, Injectable } from '@angular/core';
import { map, pipe, type Observable, type OperatorFunction } from 'rxjs';

import * as z from 'zod/mini';

import { parse } from '@restaurant-ordering/web/common/zod';
import { ApiService } from '@restaurant-ordering/web/infrastructure/rest';
import {
  parseEvents,
  ServerEvents,
  type Revised,
  type ServerEvent,
} from '@restaurant-ordering/web/infrastructure/sse';

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

const metaSchema = z.object({ revision: z.int() });

@Injectable({ providedIn: 'root' })
export class MenuApi {
  private readonly api = inject(ApiService);
  private readonly serverEvents = inject(ServerEvents);

  snapshot(): Observable<Revised<Menu>> {
    return this.api.menuSnapshot().pipe(this.revised(menuSchema));
  }

  changes(since: number): Observable<ServerEvent<MenuChange>> {
    return this.serverEvents
      .connect('/api/v1/menu/events', since)
      .pipe(parseEvents(menuChangeSchema));
  }

  createCategory(input: CategoryInput): Observable<Revised<Category>> {
    return this.api.categoriesCreate(input).pipe(this.revised(categorySchema));
  }

  updateCategory(id: string, input: Partial<CategoryInput>): Observable<Revised<Category>> {
    return this.api.categoriesUpdate(id, input).pipe(this.revised(categorySchema));
  }

  removeCategory(id: string): Observable<number> {
    return this.api.categoriesRemove(id).pipe(this.revision());
  }

  createItem(input: MenuItemInput): Observable<Revised<MenuItem>> {
    return this.api.menuItemsCreate(input).pipe(this.revised(menuItemSchema));
  }

  updateItem(id: string, input: Partial<MenuItemInput>): Observable<Revised<MenuItem>> {
    return this.api.menuItemsUpdate(id, input).pipe(this.revised(menuItemSchema));
  }

  removeItem(id: string): Observable<number> {
    return this.api.menuItemsRemove(id).pipe(this.revision());
  }

  private revised<T>(schema: z.ZodMiniType<T>): OperatorFunction<unknown, Revised<T>> {
    return pipe(
      parse(z.object({ data: schema, meta: metaSchema })),
      map(({ data, meta }) => ({ data, revision: meta.revision })),
    );
  }

  private revision(): OperatorFunction<unknown, number> {
    return pipe(
      parse(z.object({ meta: metaSchema })),
      map(({ meta }) => meta.revision),
    );
  }
}
