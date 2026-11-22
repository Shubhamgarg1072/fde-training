import { expect, expectNoA11yViolations, signIn, test } from './fixtures.ts';

test('sign in page', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
  await expectNoA11yViolations(page);
});

test('orders list', async ({ page }) => {
  await signIn(page);
  await expect(page.locator('tbody tr').first()).toBeVisible();
  await expectNoA11yViolations(page);
});

test('order detail', async ({ page }) => {
  await signIn(page, '/orders/SP-1137');
  await expect(page.getByRole('heading', { name: /Order SP-1137/ })).toBeVisible();
  await expectNoA11yViolations(page);
});

test('product form with errors and the discard dialog', async ({ page }) => {
  await signIn(page, '/products/new');
  await page.getByRole('button', { name: 'Create product' }).click();
  await expect(page.getByText('Pick a category')).toBeVisible();
  await expectNoA11yViolations(page);

  await page.getByLabel('Name').fill('Draft');
  await page.getByRole('link', { name: 'Orders' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expectNoA11yViolations(page);
});

test('products list on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await signIn(page, '/products');
  await expect(page.getByRole('link', { name: 'Hand grinder' })).toBeVisible();
  await expectNoA11yViolations(page);
});
