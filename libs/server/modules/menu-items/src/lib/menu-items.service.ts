import { randomUUID } from 'node:crypto';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Subject, type Observable } from 'rxjs';

import { CategoriesService } from '@restaurant-ordering/server/modules/categories';
import {
  MenuRevisionService,
  type Revised,
} from '@restaurant-ordering/server/modules/menu-revision';

import { seedMenuItems } from './seed/menu-items.seed';
import {
  type CreateMenuItemInput,
  type MenuItem,
  type MenuItemChange,
  type UpdateMenuItemInput,
} from './types';

type Pricing = Pick<MenuItem, 'openPrice' | 'price'>;

@Injectable()
export class MenuItemsService {
  private readonly items = new Map<string, MenuItem>();
  private readonly changes$$ = new Subject<Revised<MenuItemChange>>();

  readonly changes$: Observable<Revised<MenuItemChange>> = this.changes$$.asObservable();

  constructor(
    private readonly categories: CategoriesService,
    private readonly revision: MenuRevisionService,
  ) {
    seedMenuItems(categories.list()).forEach(item => this.items.set(item.id, item));
    categories.registerUsage({ countIn: categoryId => this.countIn(categoryId) });
  }

  list(): MenuItem[] {
    return [...this.items.values()];
  }

  find(id: string): MenuItem | undefined {
    return this.items.get(id);
  }

  create(input: CreateMenuItemInput): Revised<MenuItem> {
    this.assertCategoryExists(input.categoryId);

    const item: MenuItem = {
      id: randomUUID(),
      categoryId: input.categoryId,
      name: input.name,
      description: input.description ?? '',
      available: input.available ?? true,
      ...resolvePricing({ openPrice: false, price: null }, input),
    };

    this.items.set(item.id, item);

    return { data: item, revision: this.commit({ type: 'item.created', item }) };
  }

  update(id: string, input: UpdateMenuItemInput): Revised<MenuItem> {
    const current = this.get(id);

    if (input.categoryId !== undefined) {
      this.assertCategoryExists(input.categoryId);
    }

    const item: MenuItem = {
      id,
      categoryId: input.categoryId ?? current.categoryId,
      name: input.name ?? current.name,
      description: input.description ?? current.description,
      available: input.available ?? current.available,
      ...resolvePricing(current, input),
    };

    this.items.set(id, item);

    return { data: item, revision: this.commit({ type: 'item.updated', item }) };
  }

  remove(id: string): number {
    this.get(id);
    this.items.delete(id);

    return this.commit({ type: 'item.deleted', itemId: id });
  }

  private commit(change: MenuItemChange): number {
    const revision = this.revision.next();

    this.changes$$.next({ data: change, revision });

    return revision;
  }

  private countIn(categoryId: string): number {
    return this.list().filter(item => item.categoryId === categoryId).length;
  }

  private get(id: string): MenuItem {
    const item = this.find(id);

    if (!item) {
      throw new NotFoundException('Menu item not found.');
    }

    return item;
  }

  private assertCategoryExists(id: string): void {
    if (!this.categories.exists(id)) {
      throw new UnprocessableEntityException('Category not found.');
    }
  }
}

/** Turning open price off needs a new price in the same request. */
function resolvePricing(current: Pricing, patch: Partial<Pricing>): Pricing {
  const openPrice = patch.openPrice ?? current.openPrice;

  if (openPrice) {
    if (patch.price !== undefined && patch.price !== null) {
      throw new BadRequestException('An open-price item cannot have a fixed price.');
    }

    return { openPrice, price: null };
  }

  const price = patch.price !== undefined ? patch.price : current.price;

  if (price === null) {
    throw new BadRequestException('A fixed-price item needs a price.');
  }

  return { openPrice, price };
}
