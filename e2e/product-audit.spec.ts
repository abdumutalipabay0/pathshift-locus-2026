import AxeBuilder from '@axe-core/playwright';
import { translateText } from '../src/lib/i18n';
import { test, expect } from '@playwright/test';
import { demoProfile } from '../src/lib/profile';

test('saved universities survive country filters and inherited search', async ({ page }) => {
  await page.addInitScript(
    (profile) => localStorage.setItem('pathshift-v1', JSON.stringify({ profile, demo: false })),
    { ...demoProfile, countries: ['Canada'], shortlist: ['uw', 'waterloo'] },
  );
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(1);
  await page.getByRole('textbox', { name: 'Search programs' }).fill('no such university');
  await expect(page.locator('.program-card')).toHaveCount(0);
  await page
    .locator('.sidebar')
    .getByRole('button', { name: /My shortlist/ })
    .click();
  await expect(page.locator('.program-card')).toHaveCount(2);
  await expect(page.locator('.program-card').filter({ hasText: 'UW–Madison' })).toHaveCount(1);
});

test('header editing retains scores and a stale draft cannot undo saved universities', async ({
  page,
}) => {
  await page.addInitScript(
    (profile) => {
      localStorage.setItem('pathshift-v1', JSON.stringify({ profile, demo: false }));
      localStorage.setItem(
        'pathshift-draft',
        JSON.stringify({ profile: { ...profile, name: 'Resumed draft', shortlist: [] }, step: 0 }),
      );
    },
    { ...demoProfile, shortlist: ['waterloo', 'uw'] },
  );
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Edit your details', exact: true }).click();
  await expect(page.getByLabel('Your name', { exact: true })).toHaveValue('Resumed draft');
  await page.getByRole('button', { name: '3 Tests & language' }).click();
  await expect(page.getByLabel('IELTS overall', { exact: true })).toHaveValue(
    String(demoProfile.ielts.overall),
  );
  await page.getByRole('button', { name: '4 Budget & readiness' }).click();
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/evaluate') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Build my opportunity map' }).click();
  const result = await (await response).json();
  expect(result.profile.shortlist).toEqual(['waterloo', 'uw']);
  expect(result.profile.ielts.overall).toBe(demoProfile.ielts.overall);
});

test('each status counter matches the visible filtered results', async ({ page }) => {
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  for (let index = 0; index < 3; index++) {
    const button = page.locator('.stats-grid button').nth(index);
    const expected = Number(await button.locator('strong').innerText());
    await button.click();
    await expect(page.locator('.program-card')).toHaveCount(expected);
    await button.click();
  }
});

test('empty calendar export explains what is missing instead of downloading an empty file', async ({
  page,
}) => {
  await page.addInitScript(
    (profile) => localStorage.setItem('pathshift-v1', JSON.stringify({ profile, demo: false })),
    { ...demoProfile, shortlist: [] },
  );
  await page.goto('/demo?view=roadmap');
  const downloads: string[] = [];
  page.on('download', (d) => downloads.push(d.suggestedFilename()));
  await page.getByRole('button', { name: 'Export calendar', exact: true }).click();
  await expect(
    page.getByText(
      'No verified dates to export. Save a university with published deadlines first.',
      { exact: true },
    ),
  ).toBeVisible();
  expect(downloads).toEqual([]);
});

test('leaving a pending scenario cannot restore a stale hypothetical profile', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  let started!: () => void;
  const requestStarted = new Promise<void>((resolve) => {
    started = resolve;
  });
  await page.route('**/api/v1/simulate', async (route) => {
    const response = await route.fetch();
    started();
    await gate;
    await route.fulfill({ response });
  });
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  await page.getByRole('switch', { name: /Explore an English result/ }).check();
  await page.getByRole('button', { name: 'Explore this scenario', exact: true }).click();
  await requestStarted;
  await page.locator('.sidebar').getByRole('button', { name: 'My profile', exact: true }).click();
  const finished = page.waitForResponse((r) => r.url().endsWith('/simulate'));
  release();
  await finished;
  await expect(page.getByLabel('Your name', { exact: true })).toHaveValue(demoProfile.name);
  await expect(page.locator('.simulation-banner')).toHaveCount(0);
});

for (const locale of ['en', 'ru', 'kk'] as const)
  test(`${locale}: diagnosis explains candidates and remains usable at 320px`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/demo?view=map');
    await expect(page.locator('.program-card')).toHaveCount(6);
    await page.locator('.language-picker select').selectOption(locale);
    await page
      .getByRole('button', { name: translateText('View diagnosis', locale), exact: true })
      .click();
    const summary = page.getByRole('dialog').locator('.applicant-summary');
    await expect(summary.locator('.suggested-universities article')).toHaveCount(3);
    await expect(summary).toContainText('IELTS');
    for (const width of [1280, 320]) {
      await page.setViewportSize({ width, height: 900 });
      expect(await summary.evaluate((e) => e.scrollWidth <= e.clientWidth + 1)).toBe(true);
    }
    expect(
      (
        await new AxeBuilder({ page })
          .include('.applicant-summary')
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    expect(errors).toEqual([]);
  });
