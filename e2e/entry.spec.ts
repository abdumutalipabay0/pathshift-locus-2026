import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('new visitors see landing, enter registration or explicitly choose demo', async ({ page }) => {
  await page.goto('/?view=lab');
  await expect(
    page.getByRole('heading', { name: 'A university goal. More than one way forward.' }),
  ).toBeVisible();
  await expect(page.locator('.future-lab')).toHaveCount(0);
  await page.getByRole('link', { name: 'Create my profile' }).first().click();
  await expect(page).toHaveURL(/auth\/sign-up/);
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('link', { name: 'Explore the demo', exact: true }).click();
  await expect(page).toHaveURL(/\/demo/);
  await expect(page.locator('.entry-demo-banner')).toContainText('example data');
  await expect(page.locator('.lab-path')).toHaveCount(3);
});

test('private routes and profile storage cannot be reached anonymously or with a forged cookie', async ({
  page,
  context,
  request,
  baseURL,
}) => {
  await context.addCookies([{ name: 'pathshift-account', value: 'forged', url: baseURL! }]);
  for (const route of ['/app?view=map', '/onboarding']) {
    await page.goto(route);
    await expect(page).toHaveURL(/auth\/sign-in/);
    await expect(page.locator('.future-lab')).toHaveCount(0);
  }
  expect((await request.get('/api/account/profile')).status()).toBe(401);
  expect(
    (
      await request.put('/api/account/profile', {
        headers: { Origin: baseURL! },
        data: { profile: {} },
      })
    ).status(),
  ).toBe(401);
  expect(
    (
      await request.put('/api/account/profile', {
        headers: { Origin: 'https://unrelated.example' },
        data: { profile: {} },
      })
    ).status(),
  ).toBe(403);
  expect(
    (
      await request.put('/api/account/profile', { headers: { Origin: 'invalid-origin' }, data: {} })
    ).status(),
  ).toBe(403);
});

for (const locale of ['en', 'ru', 'kk'])
  test(`landing and entry forms are accessible and fit mobile in ${locale}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    await page.locator('.language-picker select').selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    for (const path of ['/', '/auth/sign-up', '/auth/sign-in', '/privacy']) {
      await page.goto(path);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
      const audit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      ).toEqual([]);
    }
  });
