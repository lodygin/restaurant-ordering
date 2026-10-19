import { MenuPage } from './pages/menu.page';
import { expect, test, unique } from './support/fixtures';

test.describe('live updates', () => {
  test('setup changes reach an open menu right away', async ({ context, api, setupPage }) => {
    const category = unique('Live');
    const ramen = await api.createItem(await api.createCategory(category), unique('Ramen'));
    const guestMenu = new MenuPage(await context.newPage());

    await guestMenu.open();
    const guestItem = await guestMenu.find(ramen.name);

    await expect(guestItem).toContainText('$10.00');

    await setupPage.open();
    await setupPage.selectCategory(category);
    await setupPage.editField(`Price of ${ramen.name}`, '12.50');

    await expect(guestItem).toContainText('$12.50');

    await setupPage.availability(ramen.name).click();

    await expect(guestItem.getByRole('button', { name: 'Sold out' })).toBeDisabled();

    const renamed = unique('Tonkotsu');

    await setupPage.editField(`Name of ${ramen.name}`, renamed);

    await expect(await guestMenu.find(renamed)).toBeVisible();
  });

  test('a remote edit does not wipe a name being typed', async ({ page, api, setupPage }) => {
    const category = unique('Typing');
    const ramen = await api.createItem(await api.createCategory(category), unique('Ramen'));
    const renamed = unique('Tonkotsu');

    await setupPage.open();
    await setupPage.selectCategory(category);

    const name = setupPage.field(`Name of ${ramen.name}`);

    await name.fill(renamed);
    await api.updateItem(ramen.id, { price: 1250, available: false });

    await expect(setupPage.availability(ramen.name)).not.toBeChecked();
    await expect(setupPage.field(`Price of ${ramen.name}`)).toHaveValue('12.50');
    await expect(name).toHaveValue(renamed);

    await name.blur();
    await page.reload();
    await setupPage.selectCategory(category);

    await expect(setupPage.field(`Name of ${renamed}`)).toHaveValue(renamed);
  });

  test('an order moves through the kitchen statuses without a reload', async ({
    api,
    ordersPage,
  }) => {
    // the kitchen runs fast only when Playwright starts the server itself
    test.slow();

    const ramen = await api.createItem(
      await api.createCategory(unique('Kitchen')),
      unique('Ramen'),
    );

    await ordersPage.open();

    const number = await api.placeOrder(ramen);

    await expect(ordersPage.ticket(number)).toContainText(ramen.name);

    for (const status of ['Preparing', 'Ready', 'Collected']) {
      await expect(ordersPage.stamp(number)).toHaveText(status, { timeout: 80_000 });
    }
  });

  test('a category with items cannot be deleted, and the setup says why', async ({
    page,
    api,
    setupPage,
  }) => {
    const category = unique('Busy');

    await api.createItem(await api.createCategory(category), unique('Ramen'));
    await setupPage.open();
    await setupPage.selectCategory(category);
    await setupPage.deleteCategoryButton.click();

    await expect(
      page.getByText('The category still has 1 item(s); delete them first.'),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: category })).toBeVisible();
  });
});
