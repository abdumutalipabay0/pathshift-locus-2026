import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
const response = {
  answer: 'Start with your missing application information.',
  points: [{ text: 'Review the published requirement.', source_ids: ['test-source'] }],
  next_step: 'Open your existing plan and review the first task.',
  action: 'roadmap',
  program_id: null,
  compare_ids: [],
  followups: ['Which document should I prepare?'],
  sources: [
    {
      id: 'test-source',
      title: 'Evidence fixture',
      statement: 'Test-only source record.',
      url: 'https://www.wisc.edu/',
      intake: 'FALL_2027',
      evidence: 'VERIFIED',
    },
  ],
  evaluated_at: '2026-09-18T12:00:00Z',
};
test('assistant comparison action opens the pair discussed and preserves it on reload', async ({
  page,
}) => {
  await page.goto('/demo?view=assistant');
  await page.route('**/api/assistant', (route) =>
    route.fulfill({ json: { ...response, action: 'compare', compare_ids: ['purdue', 'rit'] } }),
  );
  await page.locator('.assistant-starters button').first().click();
  await page.locator('.assistant-next button').click();
  await expect(page).toHaveURL(/view=compare/);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('pathshift-comparison') || '[]')),
  ).toEqual(['purdue', 'rit']);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Compare universities side by side' })).toBeVisible();
  await expect(page.locator('main')).toContainText('Purdue');
  await expect(page.locator('main')).toContainText('RIT');
});
for (const locale of ['en', 'ru', 'kk']) {
  test(`${locale}: assistant gives sourced actionable answers, remains accessible on mobile and resets on leaving`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto('/demo?view=assistant');
    await page.locator('.language-picker select').selectOption(locale);
    const assistant = page.locator('.admission-assistant');
    await expect(assistant).toBeVisible();
    await page.route('**/api/assistant', async (route) => {
      const body = route.request().postDataJSON();
      expect(body.locale).toBe(locale);
      expect(body.profile.ielts.overall).toBe(6);
      await route.fulfill({ json: response });
    });
    await assistant.locator('.assistant-starters button').first().click();
    await expect(assistant.locator('.assistant-answer')).toContainText(response.answer);
    await assistant.locator('.assistant-citations a').click();
    await expect(assistant.locator('.assistant-sources')).toHaveAttribute('open', '');
    await expect(assistant.locator('.assistant-sources a')).toHaveAttribute(
      'href',
      'https://www.wisc.edu/',
    );
    await page.setViewportSize({ width: 320, height: 800 });
    expect(await assistant.evaluate((el) => el.scrollWidth <= el.clientWidth + 1)).toBe(true);
    expect(
      (
        await new AxeBuilder({ page })
          .include('.admission-assistant')
          .withTags(['wcag2a', 'wcag2aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
    await assistant.locator('.assistant-next button').click();
    await expect(page).toHaveURL(/view=roadmap/);
    await page.goBack();
    await expect(page.locator('.assistant-starters')).toBeVisible();
    await expect(page.locator('.assistant-answer')).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
test('assistant recovers from provider failure, supports stop and does not show stale replies', async ({
  page,
  request,
  baseURL,
}) => {
  const invalid = await request.post('/api/assistant', {
    headers: { Origin: 'https://untrusted.example' },
    data: {},
  });
  expect(invalid.status()).toBe(403);
  const forged = await request.post('/api/assistant', {
    headers: { Origin: baseURL! },
    data: { question: 'Hello', profile: {}, locale: 'en' },
  });
  expect(forged.status()).toBe(400);
  await page.goto('/demo?view=assistant');
  await page.route('**/api/assistant', (route) =>
    route.fulfill({ status: 503, json: { error: 'ASSISTANT_UNAVAILABLE' } }),
  );
  await page.locator('.assistant-starters button').first().click();
  await expect(page.locator('.assistant-error')).toBeVisible();
  await expect(page.locator('#assistant-question')).toBeEnabled();
  await page.unroute('**/api/assistant');
  await page.route('**/api/assistant', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    await route.fulfill({ json: response }).catch(() => {});
  });
  await page.locator('.assistant-starters button').first().click();
  await page.locator('.assistant-pending button').click();
  await expect(page.locator('.assistant-error')).toContainText('The request stopped');
  await expect(page.locator('.assistant-answer')).toHaveCount(0);
});
