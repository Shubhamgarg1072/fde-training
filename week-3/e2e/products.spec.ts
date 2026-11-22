import { expect, signIn, test } from './fixtures.ts';

test.beforeEach(async ({ page }) => {
  await signIn(page, '/products/new');
});

test('validates on the client and maps server errors to fields', async ({ page }) => {
  await page.getByRole('button', { name: 'Create product' }).click();
  await expect(page.getByText('Name needs at least 2 characters')).toBeVisible();
  await expect(page.getByLabel('Name')).toBeFocused();
  await expect(page.getByLabel('Price (USD)')).toHaveAccessibleDescription(
    'Enter a price',
  );

  await page.getByLabel('Name').fill('Travel grinder');
  await page.getByLabel('SKU').fill('grd-hand');
  await page.getByLabel('Category').selectOption('grinders');
  await page.getByLabel('Price (USD)').fill('89.50');
  await page.getByRole('button', { name: 'Create product' }).click();

  await expect(page.getByText('Already used by Hand grinder')).toBeVisible();
  await expect(page.getByLabel('SKU')).toBeFocused();
});

test('creates a product and lists it', async ({ page }) => {
  await page.getByLabel('Name').fill('Travel grinder');
  await page.getByLabel('SKU').fill('grd-travel');
  await page.getByLabel('Category').selectOption('grinders');
  await page.getByLabel('Price (USD)').fill('89.50');
  await page.getByLabel('Stock').fill('5');
  await page.getByRole('button', { name: 'Create product' }).click();

  await expect(page).toHaveURL(/\/products$/);
  await expect(page.getByText('Saved Travel grinder.')).toBeVisible();
  const row = page.getByRole('row', { name: /Travel grinder/ });
  await expect(row).toContainText('GRD-TRAVEL');
  await expect(row).toContainText('$89.50');
});

test('asks before discarding unsaved changes', async ({ page }) => {
  await page.getByLabel('Name').fill('Half-finished product');
  await page.getByRole('link', { name: 'Orders' }).click();

  const dialog = page.getByRole('dialog', { name: 'Discard unsaved changes?' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Keep editing' })).toBeFocused();

  await dialog.getByRole('button', { name: 'Keep editing' }).click();
  await expect(page).toHaveURL(/\/products\/new$/);
  await expect(page.getByLabel('Name')).toHaveValue('Half-finished product');

  await page.getByRole('link', { name: 'Orders' }).click();
  await dialog.getByRole('button', { name: 'Discard changes' }).click();
  await expect(page).toHaveURL(/\/orders$/);
});
