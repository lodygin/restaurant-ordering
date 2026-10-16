import { Injectable, type MessageEvent } from '@nestjs/common';
import { merge, type Observable } from 'rxjs';

import { EventStream } from '@restaurant-ordering/server/infrastructure/sse';
import { CategoriesService } from '@restaurant-ordering/server/modules/categories';
import { MenuItemsService } from '@restaurant-ordering/server/modules/menu-items';

import { type MenuChange } from './types';

@Injectable()
export class MenuChangesService {
  // boot time, so a revision from before a restart never matches a new one
  private revision = Date.now();
  private readonly stream = new EventStream<MenuChange>();

  constructor(categories: CategoriesService, items: MenuItemsService) {
    merge(categories.changes$, items.changes$).subscribe(change => {
      this.revision += 1;
      this.stream.publish(this.revision, change);
    });
  }

  current(): number {
    return this.revision;
  }

  events(lastRevision?: number): Observable<MessageEvent> {
    return this.stream.subscribe(lastRevision, this.revision);
  }
}
