import { expect, test, unique } from './support/fixtures';
import { type SeededItem } from './support/types';

test.describe('checkout', () => {
  let categoryId: string;
  let ramen: SeededItem;

  test.beforeEach(async ({ api, menuPage }) => {
    categoryId = await api.createCategory(unique('Checkout'));
    ramen = await api.createItem(categoryId, unique('Ramen'));
    await menuPage.open();
  });

  test('a double click places the order once', async ({ page, api, menuPage }) => {
    const posts: string[] = [];

    page.on('request', request => {
      if (request.method() === 'POST' && request.url().endsWith('/api/v1/orders')) {
        posts.push(request.url());
      }
    });

    await menuPage.add(ramen.name);

    // both clicks land before the button re-renders as disabled
    await menuPage.placeOrderButton.evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });

    await expect(menuPage.placedNotice).toBeVisible();
    expect(posts).toHaveLength(1);
    expect(await api.ordersWith(ramen.name)).toHaveLength(1);
  });

  test('a lost response is retried with the same key and still gives one order', async ({
    page,
    api,
    menuPage,
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

    await menuPage.add(ramen.name);
    await menuPage.placeOrderButton.click();

    await expect(menuPage.placedNotice).toBeVisible();
    expect(keys).toHaveLength(2);
    expect(keys[1]).toBe(keys[0]);
    expect(await api.ordersWith(ramen.name)).toHaveLength(1);
  });

  test('menu changes show up in the cart and are confirmed before the order is placed', async ({
    api,
    menuPage,
  }) => {
    const gyoza = await api.createItem(categoryId, unique('Gyoza'));

    await menuPage.add(ramen.name);
    await menuPage.add(gyoza.name);

    await api.updateItem(ramen.id, { price: 1250 });
    await api.updateItem(gyoza.id, { available: false });

    await expect(menuPage.cartLine(ramen.name)).toContainText('Price changed to $12.50');
    await expect(menuPage.cartLine(gyoza.name)).toContainText('No longer available');

    await menuPage.placeOrderButton.click();

    await expect(menuPage.changesDialog).toContainText('Price changed from $10.00 to $12.50');
    await expect(menuPage.changesDialog).toContainText(
      'No longer available, removed from your order',
    );
    expect(await api.ordersWith(ramen.name)).toHaveLength(0);

    await menuPage.changesDialog.getByRole('button', { name: 'Place updated order' }).click();

    await expect(menuPage.placedNotice).toBeVisible();

    const [order] = await api.ordersWith(ramen.name);

    expect(order?.lines).toEqual([{ itemId: ramen.id, name: ramen.name, unitPrice: 1250, qty: 1 }]);
  });
});
