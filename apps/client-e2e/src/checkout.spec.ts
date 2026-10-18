import { type Page } from '@playwright/test';

import { expect, test, unique } from './support/fixtures';

async function addToCart(page: Page, itemName: string): Promise<void> {
  await page.goto('/menu');
  await page.getByRole('searchbox', { name: 'Search dishes' }).fill(itemName);
  await page
    .locator('app-menu-item', { hasText: itemName })
    .getByRole('button', { name: 'Add' })
    .click();
}

test.describe('checkout', () => {
  let itemName: string;

  test.beforeEach(async ({ api }) => {
    const categoryId = await api.createCategory(unique('Checkout'));

    itemName = unique('Ramen');
    await api.createItem(categoryId, itemName);
  });

  test('a double click places the order once', async ({ page, api }) => {
    const posts: string[] = [];

    page.on('request', request => {
      if (request.method() === 'POST' && request.url().endsWith('/api/v1/orders')) {
        posts.push(request.url());
      }
    });

    await addToCart(page, itemName);

    // both clicks land before the button re-renders as disabled
    await page
      .getByRole('button', { name: /^Place order/ })
      .evaluate((button: HTMLButtonElement) => {
        button.click();
        button.click();
      });

    await expect(page.getByRole('status').filter({ hasText: /Order #\d+ is in/ })).toBeVisible();
    expect(posts).toHaveLength(1);
    expect(await api.ordersWith(itemName)).toHaveLength(1);
  });

  test('a lost response is retried with the same key and still gives one order', async ({
    page,
    api,
  }) => {
    const keys: string[] = [];
    let lost = false;

    await page.route('**/api/v1/orders', async route => {
      if (route.request().method() !== 'POST') {
        return route.continue();
      }

      keys.push(route.request().headers()['idempotency-key'] ?? '');

      if (lost) {
        return route.continue();
      }

      // the server saves the order, but the answer never reaches the browser
      lost = true;
      await route.fetch();
      await route.abort('connectionreset');
    });

    await addToCart(page, itemName);
    await page.getByRole('button', { name: /^Place order/ }).click();

    await expect(page.getByRole('status').filter({ hasText: /Order #\d+ is in/ })).toBeVisible();
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
    expect(await api.ordersWith(itemName)).toHaveLength(1);
  });
});
