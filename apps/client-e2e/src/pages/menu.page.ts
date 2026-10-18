import { type Locator, type Page } from '@playwright/test';

export class MenuPage {
  readonly placeOrderButton: Locator;
  readonly placedNotice: Locator;
  readonly discount: Locator;
  readonly totals: Locator;
  readonly priceDialog: Locator;
  readonly changesDialog: Locator;

  constructor(private readonly page: Page) {
    this.placeOrderButton = page.getByRole('button', { name: /^Place order/ });
    this.placedNotice = page.getByRole('status').filter({ hasText: /Order #\d+ is in/ });
    this.discount = page.getByLabel('Discount');
    this.totals = page.locator('app-cart dl');
    this.priceDialog = page.getByRole('dialog');
    this.changesDialog = page.getByRole('dialog', {
      name: 'The menu changed while you were ordering',
    });
  }

  async open(): Promise<void> {
    await this.page.goto('/menu');
  }

  // the menu is a virtual list, so an item is reached by searching for it
  async find(itemName: string): Promise<Locator> {
    await this.page.getByRole('searchbox', { name: 'Search dishes' }).fill(itemName);

    return this.page.locator('app-menu-item', { hasText: itemName });
  }

  async add(itemName: string): Promise<void> {
    const item = await this.find(itemName);

    await item.getByRole('button', { name: 'Add', exact: true }).click();
  }

  async openPriceDialog(itemName: string): Promise<Locator> {
    const item = await this.find(itemName);

    await item.getByRole('button', { name: 'Add…' }).click();

    return this.priceDialog;
  }

  async setDiscount(amount: string): Promise<void> {
    await this.discount.fill(amount);
    await this.discount.blur();
  }

  cartLine(itemName: string): Locator {
    return this.page.locator('li[appCartLine]', { hasText: itemName });
  }
}
