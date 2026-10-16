import { Injectable } from '@nestjs/common';
import { merge } from 'rxjs';

import { CategoriesService } from '@restaurant-ordering/server/modules/categories';
import { MenuItemsService } from '@restaurant-ordering/server/modules/menu-items';

@Injectable()
export class MenuRevisionService {
  // boot time, so a revision from before a restart never matches a new one
  private revision = Date.now();

  constructor(categories: CategoriesService, items: MenuItemsService) {
    merge(categories.changes$, items.changes$).subscribe(() => {
      this.revision += 1;
    });
  }

  current(): number {
    return this.revision;
  }
}
