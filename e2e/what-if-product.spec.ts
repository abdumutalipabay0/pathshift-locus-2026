import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { translateText } from '../src/lib/i18n';

test('what-if blocks inconsistent IELTS, preserves unknown bands and keeps the profile unchanged', async ({
  page,
}) => {
  await page.goto('/demo?view=scenario');
  await expect(page.locator('.scenario-explorer')).toBeVisible();

  const overall = page.getByLabel('Overall score', { exact: true });
  await overall.fill('9');
  await expect(page.locator('.scenario-validation')).toContainText(
    'IELTS overall does not match the four bands',
  );
  await expect(page.getByRole('button', { name: 'Compare this scenario' })).toBeDisabled();

  await page.getByLabel('Scenario reading', { exact: true }).fill('');
  await expect(page.locator('.scenario-validation')).toHaveCount(0);
  const request = page.waitForRequest((item) => item.url().endsWith('/api/v1/simulate'));
  await page.getByRole('button', { name: 'Compare this scenario' }).click();
  const body = (await request).postDataJSON();
  expect(body.profile.ielts.overall).toBe(6);
  expect(body.mutation.ielts.overall).toBe(9);
  expect(body.mutation.ielts.reading).toBeNull();
  await expect(page.locator('.scenario-result')).toBeVisible();
  await expect(page.locator('.scenario-snapshot-compare')).toContainText('IELTS 6');
  await page
    .locator('.scenario-result-actions')
    .getByRole('button', { name: 'Back to my profile' })
    .click();
  await expect(page.locator('.profile-chips')).toContainText('IELTS 6');
});

test('what-if gives a source-linked diff and respects reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/demo?view=scenario');
  await page.getByRole('button', { name: 'Compare this scenario' }).click();
  const result = page.locator('.scenario-result');
  await expect(result).toBeVisible();
  await expect(page.locator('.scenario-change-card').first()).toContainText('Changed');
  expect(await result.evaluate((node) => getComputedStyle(node).animationName)).toBe('none');
  expect(
    await page
      .locator('.scenario-change-card')
      .first()
      .evaluate((node) => getComputedStyle(node).animationName),
  ).toBe('none');
  await page.getByRole('button', { name: 'Open rule source' }).first().click();
  await expect(page.getByRole('dialog').last()).toContainText('Official source');
  await expect(
    page.getByRole('dialog').last().getByRole('link', { name: 'Open official source' }).first(),
  ).toHaveAttribute('href', /^https:\/\//);
});

for (const locale of ['en', 'ru', 'kk'] as const)
  test(`${locale}: what-if is localized, keyboard reachable and usable at 390px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/demo?view=scenario');
    await page.locator('.language-picker select').selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(
      page.getByRole('heading', {
        name: translateText('Test one change. Keep your real profile intact.', locale),
      }),
    ).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.getByRole('spinbutton', { name: translateText('Overall score', locale) }).focus();
    await page.keyboard.press('Tab');
    await expect(page.getByLabel(translateText('Scenario reading', locale))).toBeFocused();
    expect(
      (
        await new AxeBuilder({ page })
          .include('.scenario-explorer')
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
  });
