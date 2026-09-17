import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoProfile } from '../src/lib/profile';
test.use({ actionTimeout: 15000 });

test('Future Lab is the hero: conditional path, X-ray, receipt, saved future and actual-profile isolation', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Explore your possible futures.' })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator('.lab-path').first()).toBeVisible({ timeout: 15000 });
  await expect(page.locator('.lab-path')).toHaveCount(3);
  await page.locator('.lab-path').filter({ hasText: 'Retake IELTS' }).first().click();
  await expect(page.locator('.lab-future-summary')).toContainText(
    'Your saved profile has not changed.',
  );
  await page.getByLabel('Inspect an input').selectOption('input:ielts.overall');
  await expect(page.locator('.lab-rule-list')).not.toContainText('SAT or ACT required');
  await expect(
    page.locator('.lab-receipt').getByRole('link', { name: 'Open official source' }).first(),
  ).toHaveAttribute('href', /^https:\/\//);
  await page
    .locator('.lab-future-summary')
    .getByRole('button', { name: 'Save scenario', exact: true })
    .click();
  await expect(page.getByRole('status').filter({ hasText: 'Future saved.' })).toBeVisible({
    timeout: 15000,
  });
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('pathshift-scenarios')!),
  );
  expect(stored.length).toBe(1);
  expect(stored[0].mutation.ielts.overall).toBeGreaterThan(6);
  await expect(page.locator('.lab-topline')).toContainText('IELTS overall 6');
  expect(errors).toEqual([]);
});

test('answer updates actual profile, questions adapt and refusal removes retake paths', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.lab-answer')).toBeVisible({ timeout: 15000 });
  await page.getByLabel('Your actual answer').fill('3.5');
  await page.getByRole('button', { name: 'Save answer and update graph' }).click();
  await expect(page.locator('.lab-topline')).toBeVisible({ timeout: 15000 });
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem('pathshift-v1') || '{}').profile?.school?.asu_gpa,
      ),
    )
    .toBe(3.5);
  await expect(page.locator('.future-lab')).toHaveAttribute('aria-busy', 'false');
  await page.getByRole('checkbox', { name: 'Willing to take IELTS', exact: true }).uncheck();
  await expect(page.locator('.future-lab')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.lab-branches')).not.toContainText('Retake IELTS');
  await page.reload();
  await expect(
    page.getByRole('checkbox', { name: 'Willing to take IELTS', exact: true }),
  ).not.toBeChecked();
});

for (const locale of ['en', 'ru', 'kk'])
  test(`Future Lab ${locale}: mobile fit, sources, keyboard controls and accessibility`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.context().addCookies(
      [{ name: 'pathshift-locale', value: locale, url: 'http://localhost:3000' }].map((c) => ({
        ...c,
        url: process.env.PLAYWRIGHT_BASE_URL || c.url,
      })),
    );
    await page.goto('/');
    await expect(page.locator('.lab-path').first()).toBeVisible({ timeout: 15000 });
    await page.locator('.lab-path').first().focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.lab-path').first()).toHaveAttribute('aria-pressed', 'true');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    const a11y = await new AxeBuilder({ page })
      .include('.future-lab')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(a11y.violations).toEqual([]);
    await page.screenshot({ path: `test-results/future-lab-${locale}-mobile.png`, fullPage: true });
  });

test('composer preview needs confirmation, null bands stay unknown, invalid actions fail at API', async ({
  page,
  request,
}) => {
  await page.route('**/api/lab', async (route) => {
    const req = route.request();
    if (req.method() === 'POST' && req.postDataJSON()?.action === 'compose') {
      const operations = [
        {
          type: 'IELTS_SCORE',
          field: 'overall',
          number: 6.5,
          boolean: null,
          text: null,
          countries: [],
        },
      ];
      await route.fulfill({
        json: {
          draft: { operations, unresolved: [] },
          mutation: {
            ielts: {
              ...demoProfile.ielts,
              overall: 6.5,
              reading: null,
              writing: null,
              listening: null,
              speaking: null,
              date: demoProfile.expected_score_date,
            },
          },
          issue: '',
        },
      });
    } else if (req.method() === 'GET')
      await route.fulfill({ json: { composer: true, model: 'test-provider' } });
    else await route.continue();
  });
  await page.goto('/');
  await expect(page.locator('.lab-path').first()).toBeVisible({ timeout: 15000 });
  await page.getByLabel('Describe your scenario').fill('IELTS 6.5');
  await page.getByRole('button', { name: 'Preview changes' }).click();
  await expect(page.locator('.lab-draft').first()).toContainText(
    'Unspecified IELTS bands remain unknown',
  );
  await expect(page.getByRole('heading', { name: 'Scenario result', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Confirm and simulate' }).click();
  await expect(page.getByRole('heading', { name: 'Scenario result', exact: true })).toBeVisible({
    timeout: 15000,
  });
  await expect(page.locator('.lab-topline')).toContainText('IELTS overall 6');
  const res = await request.post('/api/lab', {
    data: { action: 'preview', profile: demoProfile, mutation: { ib_total: 45 } },
  });
  expect(res.status()).toBe(400);
});

test('desktop Future Lab board renders with no page errors or overflow', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('.lab-path').first()).toBeVisible({ timeout: 15000 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'test-results/future-lab-desktop.png', fullPage: true });
});
