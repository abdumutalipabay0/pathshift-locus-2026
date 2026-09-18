import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { translateText } from '../src/lib/i18n';
for (const locale of ['en', 'ru', 'kk'] as const)
  test(`${locale}: story, AI follow-up, reviewed resume and reload at 320px`, async ({ page }) => {
    const t = (s: string) => translateText(s, locale);
    await page.goto('/demo?view=portfolio');
    await expect(page.locator('.portfolio-page')).toBeVisible();
    await page.locator('.language-picker select').selectOption(locale);
    await page.getByRole('button', { name: t('Building apps'), exact: true }).click();
    await page.getByLabel(t('What do you enjoy doing?')).fill('I enjoy building useful things.');
    await page.locator('#experience-answer').fill('I built a website for our school club.');
    await page.route('**/api/profile-coach', (route) => {
      const req = route.request().postDataJSON();
      return route.fulfill({
        json:
          req.mode === 'interview'
            ? {
                message: 'Tell me about your part.',
                question: 'What did you build yourself?',
                bullets: [],
              }
            : {
                message: 'Review your draft.',
                question: '',
                bullets: [
                  {
                    text: 'Built a school club website.',
                    evidence: 'I built a website for our school club.',
                  },
                ],
              },
      });
    });
    await page.getByRole('button', { name: t('Help me remember and explain') }).click();
    await expect(page.locator('.coach-reply')).toContainText('What did you build yourself?');
    await page
      .locator('#experience-answer')
      .fill('I built a website for our school club. I wrote the form.');
    await expect(page.locator('.coach-reply')).toContainText('What did you build yourself?');
    await page.getByRole('button', { name: t('Draft with AI') }).click();
    await expect(page.locator('.resume-draft')).toBeVisible();
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('pathshift-v1') || '{}').profile?.background?.resume,
      ),
    ).toBeUndefined();
    await page.getByRole('button', { name: t('I checked it — save to my profile') }).click();
    await expect(page.locator('.resume-preview')).toContainText('Built a school club website.');
    await page.reload();
    await expect(page.locator('.resume-preview')).toContainText('Built a school club website.');
    await expect(page.locator('#experience-answer')).toContainText('I wrote the form.');
    const download = page.waitForEvent('download');
    await page.getByRole('button', { name: t('Download my resume') }).click();
    expect((await download).suggestedFilename()).toBe('pathshift-resume.txt');
    await page.emulateMedia({ media: 'print' });
    await expect(page.locator('.resume-paper')).toBeVisible();
    await expect(page.locator('.sidebar')).toBeHidden();
    await expect(page.locator('.portfolio-aside')).toBeHidden();
    await expect(page.locator('.topbar')).toBeHidden();
    await expect(page.locator('.resume-paper')).toContainText('Built a school club website.');
    await page.emulateMedia({ media: 'screen' });
    await page.setViewportSize({ width: 320, height: 900 });
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1))
      .toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .include('.portfolio-page')
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
  });
test('all catalogue university profiles show loaded official media and history', async ({
  page,
}) => {
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  await page.getByLabel('Include programs with unverified rules').check();
  await page.getByLabel('Include other countries').check();
  // Card headings are the university profile entry points.
  const names = await page.locator('.program-card h3').allTextContents();
  expect(names.length).toBe(12);
  for (const name of names) {
    await page.getByRole('button', { name: name.trim(), exact: true }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.locator('.university-history')).toBeVisible();
    await expect
      .poll(() =>
        dialog
          .locator('.university-banner img')
          .evaluateAll((imgs) =>
            imgs.every(
              (i) => (i as HTMLImageElement).complete && (i as HTMLImageElement).naturalWidth > 0,
            ),
          ),
      )
      .toBe(true);
    await page.keyboard.press('Escape');
  }
});
test('coach failure and cancellation preserve notes and never apply a stale resume', async ({
  page,
}) => {
  await page.goto('/demo?view=portfolio');
  await expect(page.locator('.portfolio-page')).toBeVisible();
  await page.locator('#experience-answer').fill('My own school website.');
  await page.route('**/api/profile-coach', (route) =>
    route.fulfill({ status: 503, json: { error: 'COACH_UNAVAILABLE' } }),
  );
  await page.getByRole('button', { name: 'Draft with AI', exact: true }).click();
  await expect(page.locator('.portfolio-page').getByRole('alert')).toContainText('notes are safe');
  await page.reload();
  await expect(page.locator('#experience-answer')).toHaveValue('My own school website.');
  await page.unroute('**/api/profile-coach');
  await page.route('**/api/profile-coach', async (route) => {
    await new Promise((r) => setTimeout(r, 1200));
    await route
      .fulfill({ json: { message: 'Late reply', question: '', bullets: [] } })
      .catch(() => {});
  });
  await page.getByRole('button', { name: 'Draft with AI', exact: true }).click();
  await page.getByRole('button', { name: 'Stop', exact: true }).click();
  await expect(page.locator('.coach-progress')).toHaveCount(0);
  await expect(page.locator('#experience-answer')).toHaveValue('My own school website.');
  await expect(page.locator('.resume-draft')).toHaveCount(0);
});
