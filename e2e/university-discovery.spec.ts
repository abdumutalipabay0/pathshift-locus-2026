import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { translateText } from '../src/lib/i18n';
for (const locale of ['en', 'ru', 'kk'] as const)
  test(`${locale}: discover a university, check fit and ask a contextual question at 320px`, async ({
    page,
  }) => {
    const t = (text: string) => translateText(text, locale);
    await page.goto('/demo?view=map');
    await expect(page.locator('.program-card')).toHaveCount(6);
    await page.locator('.language-picker select').selectOption(locale);
    await page.getByRole('button', { name: 'Waterloo', exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('.university-overview')).toBeVisible();
    await expect(dialog.locator('.university-highlights')).toContainText('Hack the North');
    await expect(
      dialog.getByRole('link', { name: t('University source'), exact: true }).first(),
    ).toHaveAttribute('href', /^https:\/\/uwaterloo.ca/);
    await page.setViewportSize({ width: 320, height: 900 });
    await expect.poll(() => dialog.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .include('.university-detail')
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await dialog.getByRole('button', { name: t('Check my profile'), exact: true }).click();
    await expect(
      dialog.getByRole('heading', { name: t('Why this result?'), exact: true }),
    ).toBeVisible();
    await dialog.getByRole('button', { name: t('See costs and next steps') }).click();
    await expect(dialog.getByRole('heading', { name: t('Your application route') })).toBeVisible();
    await dialog.getByRole('button', { name: t('About the university'), exact: true }).click();
    await dialog.getByRole('button', { name: t('Ask about this university') }).click();
    await expect(page).toHaveURL(/view=assistant/);
    await expect(page.locator('#assistant-question')).toHaveValue(/Waterloo/);
    await page.route('**/api/assistant', (route) =>
      route.fulfill({
        json: {
          answer: 'Waterloo has a co-op option.',
          points: [],
          next_step: 'Review Waterloo.',
          action: 'program',
          program_id: 'waterloo',
          program_ids: ['waterloo'],
          compare_ids: [],
          followups: [],
          sources: [],
          evaluated_at: '2026-09-19T00:00:00Z',
        },
      }),
    );
    await page.locator('.assistant-form button[type=submit]').click();
    await expect(page.locator('.assistant-answer')).toContainText('Waterloo has a co-op option.');
    await page.locator('.assistant-next button').click();
    await expect(page.getByRole('dialog').locator('.university-overview')).toBeVisible();
  });
test('six university stories and comparison action retain an already selected university', async ({
  page,
}) => {
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  for (const name of ['UW–Madison', 'Waterloo', 'Georgia Tech', 'Purdue', 'RIT', 'Arizona State']) {
    await page.getByRole('button', { name, exact: true }).click();
    await expect(page.getByRole('dialog').locator('.university-highlights article')).toHaveCount(2);
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Waterloo', exact: true }).click();
  await page.getByRole('button', { name: 'Compare this path', exact: true }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('pathshift-comparison') || '[]')),
  ).toContain('waterloo');
});

test('discovery leads to a real saved plan rather than an unrelated empty roadmap', async ({
  page,
}) => {
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Purdue', exact: true }).click();
  await page.getByRole('button', { name: 'Applying', exact: true }).click();
  await page.getByRole('button', { name: 'Save and open my plan', exact: true }).click();
  await expect(page).toHaveURL(/view=roadmap/);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('pathshift-v1') || '{}').profile.shortlist,
    ),
  ).toContain('purdue');
  await expect(page.locator('.roadmap-layout')).toContainText('Purdue');
});
