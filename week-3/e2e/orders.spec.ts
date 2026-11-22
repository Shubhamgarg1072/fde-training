import { expect, signIn, test, waitForOrdersTable } from './fixtures.ts';

function parseMoney(text: string | null) {
  return Number((text ?? '').replace(/[$,]/g, ''));
}

test.beforeEach(async ({ page }) => {
  await signIn(page);
});

test('sorts by total on the server', async ({ page }) => {
  const totalHeader = page.getByRole('columnheader', { name: /Total/ });
  await totalHeader.getByRole('button').click();

  await expect(page).toHaveURL(/sort=totalCents/);
  await expect(totalHeader).toHaveAttribute('aria-sort', 'descending');
  await waitForOrdersTable(page);
  const totals = await page.locator('tbody tr td:last-child').allTextContents();
  const amounts = totals.map(parseMoney);
  expect(amounts).toEqual(amounts.toSorted((a, b) => b - a));

  await totalHeader.getByRole('button').click();
  await expect(totalHeader).toHaveAttribute('aria-sort', 'ascending');
});

test('filters by status and keeps the filter in the URL', async ({ page }) => {
  await page.getByLabel('Status').selectOption('cancelled');

  await expect(page).toHaveURL(/status=cancelled/);
  await waitForOrdersTable(page);
  for (const badge of await page.locator('tbody tr td:nth-child(4)').allTextContents()) {
    expect(badge).toBe('Cancelled');
  }
});

test('pages through results', async ({ page }) => {
  const pagination = page.getByRole('navigation', { name: 'Pagination' });
  await expect(pagination).toContainText('1–20 of 137');

  await pagination.getByRole('button', { name: 'Next' }).click();
  await expect(pagination).toContainText('21–40 of 137');
  await expect(page).toHaveURL(/page=2/);

  await pagination.getByLabel('Rows per page').selectOption('50');
  await expect(pagination).toContainText('1–50 of 137');
});

test('updates an order status and returns to the same filtered list', async ({
  page,
}) => {
  await page.getByLabel('Status').selectOption('pending');
  await waitForOrdersTable(page);
  const firstOrder = page.locator('tbody tr').first().getByRole('link');
  const orderId = (await firstOrder.textContent()) ?? '';
  await firstOrder.click();

  await expect(page.getByRole('heading', { name: `Order ${orderId}` })).toBeFocused();
  await page.getByLabel('Change status to').selectOption('paid');
  await page.getByRole('button', { name: 'Update status' }).click();
  await expect(page.getByText('Marked as Paid.')).toBeVisible();

  await page.getByRole('link', { name: 'All orders' }).click();
  await expect(page).toHaveURL(/status=pending/);
  await expect(page.getByRole('link', { name: orderId })).toHaveCount(0);
});

test('shows a not found page for an unknown order', async ({ page }) => {
  await page.goto('/orders/SP-0001');
  await expect(page.getByRole('heading', { name: 'Order not found' })).toBeVisible();
});
