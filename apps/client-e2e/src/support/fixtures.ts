import { test as base } from '@playwright/test';

import { MenuPage } from '../pages/menu.page';
import { OrdersPage } from '../pages/orders.page';
import { SetupPage } from '../pages/setup.page';
import { Api } from './api';

export const test = base.extend<{
  api: Api;
  menuPage: MenuPage;
  ordersPage: OrdersPage;
  setupPage: SetupPage;
}>({
  api: async ({ request }, use) => use(new Api(request)),
  menuPage: async ({ page }, use) => use(new MenuPage(page)),
  ordersPage: async ({ page }, use) => use(new OrdersPage(page)),
  setupPage: async ({ page }, use) => use(new SetupPage(page)),
});

export { expect } from '@playwright/test';

// the server outlives test runs, so names must not repeat between them either
export function unique(label: string): string {
  return `${label} ${crypto.randomUUID().slice(0, 8)}`;
}
