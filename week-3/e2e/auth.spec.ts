import { DEMO_EMAIL, expect, signIn, test } from './fixtures.ts';

test('redirects to sign in and returns to the requested page', async ({ page }) => {
  await page.goto('/orders?status=cancelled');
  await expect(page).toHaveURL(/\/login$/);

  await signIn(page, '/login');

  await expect(page).toHaveURL(/\/orders\?status=cancelled$/);
  await expect(page.getByLabel('Status')).toHaveValue('cancelled');
});

test('shows an error for a wrong password', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill(DEMO_EMAIL);
  await page.getByLabel('Password').fill('not-the-password');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toHaveText('Email or password is incorrect.');
});

test('keeps the session across a reload using the refresh cookie', async ({ page }) => {
  await signIn(page);
  await page.reload();

  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
});

test('refreshes an expired access token and retries the request', async ({ page }) => {
  await signIn(page);
  // Make the mock server forget every access token, as if they had all expired.
  await page.evaluate(() => {
    const sessions = JSON.parse(
      localStorage.getItem('mock-api:sessions') ?? '{}',
    ) as object;
    localStorage.setItem(
      'mock-api:sessions',
      JSON.stringify({ ...sessions, accessTokens: {} }),
    );
  });

  const refresh = page.waitForResponse('**/api/auth/refresh');
  await page.getByRole('link', { name: 'Products', exact: true }).click();

  expect((await refresh).status()).toBe(200);
  await expect(page.getByRole('link', { name: 'Hand grinder' })).toBeVisible();
});

test('signs everyone out when a rotated refresh token is reused', async ({ page }) => {
  // MSW keeps mocked cookies in its own localStorage-backed store, which is what the
  // mock API reads, so replaying an old cookie means restoring that store.
  const readCookieStore = () =>
    page.evaluate(() => localStorage.getItem('__msw-cookie-store__') ?? '');

  await signIn(page);
  const stolenCookies = await readCookieStore();
  expect(stolenCookies).toContain('refresh_token');

  // A reload rotates the refresh token, so the copied value is now spent.
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Orders' })).toBeVisible();
  expect(await readCookieStore()).not.toBe(stolenCookies);

  await page.evaluate((value) => {
    localStorage.setItem('__msw-cookie-store__', value);
  }, stolenCookies);
  await page.reload();

  await expect(page).toHaveURL(/\/login$/);
});

test('signing out ends the session', async ({ page }) => {
  await signIn(page);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page).toHaveURL(/\/login$/);

  await page.goto('/orders');
  await expect(page).toHaveURL(/\/login$/);
});
