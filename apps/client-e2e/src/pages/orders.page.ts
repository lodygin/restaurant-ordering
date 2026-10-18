import { type Locator, type Page } from '@playwright/test';

export class OrdersPage {
  readonly staleNote: Locator;

  constructor(private readonly page: Page) {
    this.staleNote = page.getByRole('status').filter({ hasText: /^Statuses as of \d\d:\d\d\.$/ });
  }

  async open(): Promise<void> {
    await this.page.goto('/orders');
  }

  ticket(number: number): Locator {
    return this.page.getByRole('article', { name: new RegExp(`^Order ${number},`) });
  }

  stamp(number: number): Locator {
    return this.ticket(number).locator('app-stamp');
  }
}
