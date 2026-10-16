import { Injectable } from '@nestjs/common';
import { merge } from 'rxjs';

import { CategoriesService } from '@restaurant-ordering/server/modules/categories';
import { MenuItemsService } from '@restaurant-ordering/server/modules/menu-items';

/**
 * Version of the whole menu: every change to categories or items moves it forward by one.
 *
 * It starts at the boot time instead of 1. The menu lives in memory, so a restart builds a new
 * one; a client still holding a revision from before the restart then holds a number below
 * anything this process ever issued and is told to reload, instead of matching a fresh counter
 * and applying changes to a menu that no longer exists.
 */
@Injectable()
export class MenuRevisionService {
  private revision = Date.now();

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
