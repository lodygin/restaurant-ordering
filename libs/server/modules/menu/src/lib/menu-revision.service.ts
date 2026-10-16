import { Injectable } from '@nestjs/common';
import { merge } from 'rxjs';

import { CategoriesService } from '@restaurant-ordering/server/modules/categories';
import { MenuItemsService } from '@restaurant-ordering/server/modules/menu-items';

/** Version of the whole menu: every change to categories or items moves it forward by one. */
@Injectable()
export class MenuRevisionService {
  private revision = 1;

  constructor(categories: CategoriesService, items: MenuItemsService) {
    // changes$ emit synchronously, so the revision moves inside the request that made the change
    merge(categories.changes$, items.changes$).subscribe(() => {
      this.revision += 1;
    });
  }

  current(): number {
    return this.revision;
  }
}
