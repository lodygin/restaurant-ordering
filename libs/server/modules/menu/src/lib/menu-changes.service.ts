import { Injectable, type MessageEvent } from '@nestjs/common';
import { merge, type Observable } from 'rxjs';

import { EventStream } from '@restaurant-ordering/server/infrastructure/sse';
import { CategoriesService } from '@restaurant-ordering/server/modules/categories';
import { MenuItemsService } from '@restaurant-ordering/server/modules/menu-items';
import { MenuRevisionService } from '@restaurant-ordering/server/modules/menu-revision';

import { type MenuChange } from './types';

@Injectable()
export class MenuChangesService {
  private readonly stream = new EventStream<MenuChange>();

  constructor(
    categories: CategoriesService,
    items: MenuItemsService,
    private readonly revision: MenuRevisionService,
  ) {
    merge(categories.changes$, items.changes$).subscribe(({ data, revision }) =>
      this.stream.publish(revision, data),
    );
  }

  events(lastRevision?: number): Observable<MessageEvent> {
    return this.stream.subscribe(lastRevision, this.revision.current());
  }
}
