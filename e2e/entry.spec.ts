import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('new visitors see landing, enter registration or explicitly choose demo', async ({ page }) => {
  await page.goto('/?view=lab');
  await expect(
    page.getByRole('heading', { name: 'Which universities fit your grades and budget?' }),
  ).toBeVisible();
  await expect(page.locator('.future-lab')).toHaveCount(0);
  await page.getByRole('link', { name: 'Find universities' }).first().click();
  await expect(page).toHaveURL(/auth\/sign-up/);
  await expect(page.getByLabel('Email address')).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Show password' }).click();
  await expect(page.getByLabel('Password', { exact: true })).toHaveAttribute('type', 'text');
  await page.getByRole('link', { name: 'Explore the demo', exact: true }).click();
  await expect(page).toHaveURL(/\/demo/);
  await expect(page.locator('.entry-demo-banner')).toContainText('example data');
  await expect(page.locator('.program-card')).toHaveCount(6);
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
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      const audit = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(
        audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
      ).toEqual([]);
    }
  });

test('route atlas responds to keyboard, links to real tools and respects reduced motion', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await page.locator('.language-picker select').selectOption('en');
  const atlas = page.locator('.route-atlas');
  await atlas.getByRole('button', { name: 'Compare', exact: true }).press('Enter');
  await expect(atlas.getByRole('button', { name: 'Compare', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(atlas.getByRole('heading')).toHaveText('Compare paths');
  await expect(atlas.getByRole('link')).toHaveAttribute('href', '/demo?view=compare');
  expect(
    await atlas
      .locator('.atlas-detail-content')
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');
  await atlas.getByRole('button', { name: 'Plan', exact: true }).press('Space');
  await expect(atlas.getByRole('heading')).toHaveText('Get an application checklist');
  await atlas.getByRole('link').click();
  await expect(page).toHaveURL(/demo\?view=roadmap/);
});

test('landing keeps primary actions above the fold across languages and narrow breakpoints', async ({
  page,
}) => {
  for (const locale of ['en', 'ru', 'kk']) {
    await page.goto('/');
    await page.locator('.language-picker select').selectOption(locale);
    for (const width of [320, 768, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      const action = await page.locator('.landing-actions a').first().boundingBox();
      expect(action).not.toBeNull();
      expect(action!.y + action!.height).toBeLessThan(900);
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await expect(page.locator('.atlas-campus')).toBeVisible();
    }
  }
  await page.locator('.atlas-branches button').nth(1).click();
  await page.locator('.atlas-detail a').click();
  await expect(page).toHaveURL(/demo\?view=compare/);
});
