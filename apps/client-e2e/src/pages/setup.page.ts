import { type Locator, type Page } from '@playwright/test';

export class SetupPage {
  readonly deleteCategoryButton: Locator;

  constructor(private readonly page: Page) {
    this.deleteCategoryButton = page.getByRole('button', { name: 'Delete category' });
  }

  async open(): Promise<void> {
    await this.page.goto('/menu-setup');
  }

  async selectCategory(name: string): Promise<void> {
    await this.page.getByRole('button', { name }).click();
  }

  // fields save on blur, like a person tabbing out of them
  async editField(label: string, value: string): Promise<void> {
    const field = this.page.getByLabel(label, { exact: true });

    await field.fill(value);
    await field.blur();
  }

  availability(itemName: string): Locator {
    return this.page.getByRole('switch', { name: `${itemName} is available` });
  }
}
