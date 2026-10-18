import { expect, test, unique } from './support/fixtures';
import { type SeededItem } from './support/types';

test.describe('reliability', () => {
  let ramen: SeededItem;

  test.beforeEach(async ({ api }) => {
    ramen = await api.createItem(await api.createCategory(unique('Reliable')), unique('Ramen'));
  });

  test('offline keeps the cart and catches up on what changed meanwhile', async ({
    page,
    context,
    api,
    menuPage,
  }) => {
    await menuPage.open();
    await menuPage.add(ramen.name);

    await context.setOffline(true);

    await expect(page.getByText('You’re offline. Showing what was last loaded')).toBeVisible();
    await expect(menuPage.placeOrderButton).toBeDisabled();
    await expect(menuPage.cartLine(ramen.name)).toBeVisible();

    await api.updateItem(ramen.id, { price: 1250 });
    await context.setOffline(false);

    await expect(menuPage.cartLine(ramen.name)).toContainText('Price changed to $12.50');
    await expect(menuPage.placeOrderButton).toBeEnabled();
  });

  test('a server error keeps the cart so the order can be placed again', async ({
    page,
    api,
    menuPage,
  }) => {
    let failed = false;

    await page.route('**/api/v1/orders', async route => {
      if (route.request().method() !== 'POST' || failed) {
        return route.continue();
      }

      failed = true;
      await route.fulfill({ status: 500, json: { message: 'Internal server error' } });
    });

    await menuPage.open();
    await menuPage.add(ramen.name);
    await menuPage.placeOrderButton.click();

    await expect(
      page.getByText('The server ran into a problem. Try again in a moment.'),
    ).toBeVisible();
    await expect(menuPage.cartLine(ramen.name)).toBeVisible();

    await menuPage.placeOrderButton.click();

    await expect(menuPage.placedNotice).toBeVisible();
    expect(await api.ordersWith(ramen.name)).toHaveLength(1);
  });

  test('order statuses say how old they are while offline', async ({
    context,
    api,
    ordersPage,
  }) => {
    const number = await api.placeOrder(ramen);

    await ordersPage.open();
    await expect(ordersPage.ticket(number)).toBeVisible();

    await context.setOffline(true);

    await expect(ordersPage.staleNote).toBeVisible();

    await context.setOffline(false);

    await expect(ordersPage.staleNote).toBeHidden();
  });
});
