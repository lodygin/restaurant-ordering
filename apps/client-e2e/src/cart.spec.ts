import { expect, test, unique } from './support/fixtures';

test.describe('cart', () => {
  let categoryId: string;

  test.beforeEach(async ({ api, menuPage }) => {
    categoryId = await api.createCategory(unique('Cart'));
    await menuPage.open();
  });

  test('an open-price item is added at the price the guest enters', async ({ api, menuPage }) => {
    const tasting = await api.createItem(categoryId, unique('Tasting'), { openPrice: true });
    const dialog = await menuPage.openPriceDialog(tasting.name);

    await dialog.getByLabel('Price for this order').fill('7.50');
    await dialog.getByLabel('Quantity').fill('2');
    await dialog.getByRole('button', { name: 'Add to order' }).click();

    await expect(menuPage.cartLine(tasting.name)).toContainText('$7.50 each, price you entered');
    await expect(menuPage.cartLine(tasting.name)).toContainText('$15.00');
  });

  test('the price dialog follows the item while it is open', async ({ api, menuPage }) => {
    const tasting = await api.createItem(categoryId, unique('Tasting'), { openPrice: true });
    const dialog = await menuPage.openPriceDialog(tasting.name);

    await expect(dialog.getByLabel('Price for this order')).toBeVisible();

    await api.updateItem(tasting.id, { openPrice: false, price: 900 });

    await expect(dialog).toContainText('This item now has a fixed price of $9.00.');
    await expect(dialog.getByLabel('Price for this order')).toBeHidden();

    await api.updateItem(tasting.id, { available: false });

    await expect(dialog).toContainText('This item is no longer available.');
    await expect(dialog.getByRole('button', { name: 'Add to order' })).toBeDisabled();

    await api.updateItem(tasting.id, { available: true });
    await dialog.getByRole('button', { name: 'Add at $9.00' }).click();

    await expect(menuPage.cartLine(tasting.name)).toContainText('$9.00 each');
    await expect(menuPage.cartLine(tasting.name)).not.toContainText('price you entered');
  });

  test('a discount comes off the total and is capped at the subtotal', async ({
    page,
    api,
    menuPage,
  }) => {
    const ramen = await api.createItem(categoryId, unique('Ramen'));

    await menuPage.add(ramen.name);
    await menuPage.setDiscount('3');

    await expect(menuPage.totals).toContainText('Discount−$3.00');
    await expect(menuPage.totals).toContainText('Total$7.00');

    await menuPage.setDiscount('50');

    await expect(page.getByText('Discount is capped at the order total, $10.00.')).toBeVisible();
    await expect(menuPage.totals).toContainText('Total$0.00');

    await menuPage.placeOrderButton.click();
    await expect(menuPage.placedNotice).toBeVisible();

    const [order] = await api.ordersWith(ramen.name);

    expect(order).toMatchObject({ discount: 1000, total: 0 });
  });
});
