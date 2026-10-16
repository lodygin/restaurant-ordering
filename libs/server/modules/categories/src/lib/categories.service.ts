import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Subject, type Observable } from 'rxjs';

import {
  MenuRevisionService,
  type Revised,
} from '@restaurant-ordering/server/modules/menu-revision';

import { type CategoryUsage } from './category-usage';
import { seedCategories } from './seed/categories.seed';
import {
  type Category,
  type CategoryChange,
  type CreateCategoryInput,
  type UpdateCategoryInput,
} from './types';

@Injectable()
export class CategoriesService {
  private readonly categories = new Map<string, Category>();
  private readonly usages: CategoryUsage[] = [];
  private readonly changes$$ = new Subject<Revised<CategoryChange>>();

  readonly changes$: Observable<Revised<CategoryChange>> = this.changes$$.asObservable();

  constructor(private readonly revision: MenuRevisionService) {
    seedCategories().forEach(category => this.categories.set(category.id, category));
  }

  registerUsage(usage: CategoryUsage): void {
    this.usages.push(usage);
  }

  list(): Category[] {
    return [...this.categories.values()];
  }

  exists(id: string): boolean {
    return this.categories.has(id);
  }

  create(input: CreateCategoryInput): Revised<Category> {
    const category: Category = { id: randomUUID(), name: input.name };

    this.categories.set(category.id, category);

    return { data: category, revision: this.commit({ type: 'category.created', category }) };
  }

  update(id: string, input: UpdateCategoryInput): Revised<Category> {
    const category: Category = { ...this.get(id), ...input };

    this.categories.set(id, category);

    return { data: category, revision: this.commit({ type: 'category.updated', category }) };
  }

  remove(id: string): number {
    this.get(id);

    const itemCount = this.usages.reduce((sum, usage) => sum + usage.countIn(id), 0);

    if (itemCount > 0) {
      throw new ConflictException({
        message: `The category still has ${itemCount} item(s); move or delete them first.`,
        itemCount,
      });
    }

    this.categories.delete(id);

    return this.commit({ type: 'category.deleted', categoryId: id });
  }

  private commit(change: CategoryChange): number {
    const revision = this.revision.next();

    this.changes$$.next({ data: change, revision });

    return revision;
  }

  private get(id: string): Category {
    const category = this.categories.get(id);

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    return category;
  }
}
