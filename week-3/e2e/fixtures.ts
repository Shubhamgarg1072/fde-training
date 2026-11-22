import { test as base, expect, type Page } from '@playwright/test';
import { AxeBuilder } from '@axe-core/playwright';

export const DEMO_EMAIL = 'ops@slowpour.example';
export const DEMO_PASSWORD = 'brew-better';

export async function signIn(page: Page, path = '/orders') {
  await page.goto(path);
  await page.getByLabel('Email').fill(DEMO_EMAIL);
  await page.getByLabel('Password').fill(DEMO_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Sign in');
}

// The table keeps the previous page on screen (aria-busy) while the next one loads.
export async function waitForOrdersTable(page: Page) {
  await expect(page.getByRole('table')).toHaveAttribute('aria-busy', 'false');
}

export async function expectNoA11yViolations(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    results.violations.map((violation) => ({
      rule: violation.id,
      targets: violation.nodes.map((node) => node.target.join(' ')),
    })),
  ).toEqual([]);
}

export const test = base;
export { expect };
