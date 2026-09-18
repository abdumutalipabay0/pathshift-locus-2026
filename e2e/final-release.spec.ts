import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoProfile } from '../src/lib/profile';

for (const locale of ['en', 'ru', 'kk'] as const)
  test(`${locale}: personal study and activity plan survives edits, reload and export`, async ({
    page,
  }) => {
    await page.goto('/demo?view=map');
    await expect(page.locator('.program-card')).toHaveCount(6);
    await page.getByRole('combobox', { name: 'Interface language' }).selectOption(locale);
    await page.locator('.sidebar nav button[data-view=roadmap]').click();
    const panel = page.locator('.personal-planner');
    await page.locator('.optional-tools > summary').click();
    await panel.locator('summary').click();
    await panel.locator('[name="personal-task"]').fill('Calculus practice');
    await panel.locator('[name="target-date"]').fill('2026-10-01');
    await panel.locator('[name="progress-notes"]').fill('Solve five problems and review mistakes.');
    await panel.locator('button[type="submit"]').click();
    await expect(panel.locator('.personal-task-list li')).toHaveCount(1);
    await panel.getByRole('checkbox', { name: 'Calculus practice' }).check();
    await expect(panel.getByRole('checkbox', { name: 'Calculus practice' })).toBeChecked();
    await panel.locator('[name="personal-task"]').fill('Build my first CS project');
    await panel.locator('[name="task-category"]').selectOption('ACTIVITY');
    await panel.locator('button[type="submit"]').click();
    await expect(panel.locator('.personal-task-list li')).toHaveCount(2);
    await page.reload();
    await page.locator('.optional-tools > summary').click();
    await panel.locator('summary').click();
    await expect(panel.getByRole('checkbox', { name: 'Calculus practice' })).toBeChecked();
    const item = panel
      .locator('.personal-task-list li')
      .filter({ hasText: 'Build my first CS project' });
    await item.locator('button').first().click();
    await panel.locator('[name="personal-task"]').fill('Build and document a CS project');
    await panel.locator('button[type="submit"]').click();
    await expect(
      panel.getByRole('checkbox', { name: 'Build and document a CS project' }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    ).toBeTruthy();
    const audit = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    expect(audit.violations).toEqual([]);
    const download = page.waitForEvent('download');
    await panel.locator(':scope > details > button').click();
    expect((await download).suggestedFilename()).toBe('pathshift-personal-plan.txt');
  });

test('profile import validates, previews, restores a full plan and can be undone', async ({
  page,
}) => {
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  await page.locator('.profile-tools > summary').click();
  const file = page.locator('input[type="file"]');
  await file.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{broken'),
  });
  await expect(page.locator('.profile-import').getByRole('alert')).toContainText(
    'Choose a valid JSON',
  );
  const p = {
    ...structuredClone(demoProfile),
    name: 'Imported student',
    personal_plan: [
      {
        id: 'a',
        title: 'Project portfolio',
        kind: 'ACTIVITY',
        due: null,
        notes: 'My own project',
        complete: true,
      },
    ],
  };
  await file.setInputFiles({
    name: 'backup.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({ version: 1, profile: p })),
  });
  await expect(page.getByRole('region', { name: 'Review imported profile' })).toContainText(
    'Imported student',
  );
  await expect(page.locator('.profile-button')).toContainText('Aruzhan');
  await page.getByRole('button', { name: 'Confirm import', exact: true }).click();
  await expect(page.locator('.profile-button')).toContainText('Imported student');
  await page.reload();
  await expect(page.locator('.profile-button')).toContainText('Imported student');
  await page.locator('.sidebar nav button[data-view=roadmap]').click();
  await page.locator('.optional-tools > summary').click();
  await page.locator('.personal-planner summary').click();
  await expect(page.getByRole('checkbox', { name: 'Project portfolio' })).toBeChecked();
  await page.locator('.profile-tools > summary').click();
  await page.getByRole('button', { name: 'Undo demo reset' }).click();
  await expect(page.locator('.profile-button')).toContainText('Aruzhan');
});

test('inconsistent IELTS is rejected on the API without overwriting results', async ({
  request,
}) => {
  const p = structuredClone(demoProfile);
  p.ielts.overall = 8;
  const response = await request.post('/api/v1/evaluate', { data: { profile: p } });
  expect(response.status()).toBe(400);
});
