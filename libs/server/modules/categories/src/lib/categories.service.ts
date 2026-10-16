import { randomUUID } from 'node:crypto';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Subject, type Observable } from 'rxjs';

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
  private readonly changes = new Subject<CategoryChange>();

  readonly changes$: Observable<CategoryChange> = this.changes.asObservable();

  constructor() {
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

  create(input: CreateCategoryInput): Category {
    const category: Category = { id: randomUUID(), name: input.name };

    this.categories.set(category.id, category);
    this.changes.next({ type: 'category.created', category });

    return category;
  }

  update(id: string, input: UpdateCategoryInput): Category {
    const category: Category = { ...this.get(id), ...input };

    this.categories.set(id, category);
    this.changes.next({ type: 'category.updated', category });

    return category;
  }

  remove(id: string): void {
    this.get(id);

    const itemCount = this.usages.reduce((sum, usage) => sum + usage.countIn(id), 0);

    if (itemCount > 0) {
      throw new ConflictException({
        message: `The category still has ${itemCount} item(s); move or delete them first.`,
        itemCount,
      });
    }

    this.categories.delete(id);
    this.changes.next({ type: 'category.deleted', categoryId: id });
  }

  private get(id: string): Category {
    const category = this.categories.get(id);

    if (!category) {
      throw new NotFoundException('Category not found.');
    }

    return category;
  }
}
