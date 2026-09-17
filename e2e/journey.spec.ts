import { test, expect } from '@playwright/test';
import { demoProfile } from '../src/lib/profile';
test('golden journey: demo, evidence, scenario, compare, profile, roadmap, persistence', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your opportunity map.' })).toBeVisible();
  await expect(page.locator('.program-card')).toHaveCount(11);
  await page
    .locator('.program-card')
    .filter({ has: page.getByRole('heading', { name: 'Waterloo', exact: true }) })
    .getByRole('button', { name: 'Explore path' })
    .click();
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'University of Waterloo', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Source proof', exact: true }).first().click();
  await expect(
    page.getByRole('dialog').last().getByRole('link', { name: 'Open official source' }).first(),
  ).toHaveAttribute('href', /^https:\/\/uwaterloo.ca/);
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await page.getByRole('switch', { name: /Explore an English result/ }).check();
  await page.getByRole('button', { name: 'Explore this scenario', exact: true }).click();
  await expect(page.locator('.causal-diff')).toBeVisible();
  await expect(
    page.locator('.simulation-banner').getByText('Your saved profile has not changed.'),
  ).toBeVisible();
  await expect(page.locator('.causal-diff .diff-stat').first()).not.toHaveText(/^0/);
  await page.locator('.simulation-banner').getByRole('button', { name: 'Save scenario' }).click();
  await expect(page.getByRole('dialog')).toContainText('Compare with my current profile');
  await page.keyboard.press('Escape');
  await expect(page.locator('.simulation-banner')).toHaveCount(0);
  await expect(page.locator('.profile-chips')).toContainText('IELTS 6');
  await page.getByRole('button', { name: 'Save Georgia Tech to shortlist' }).click();
  await expect(page.locator('.save-status')).not.toContainText('Recalculating');
  await page
    .locator('.sidebar')
    .getByRole('button', { name: 'Compare paths', exact: true })
    .click();
  await expect(page.locator('.compare-card')).toHaveCount(2);
  await expect(page.locator('.compare-card').first()).toContainText('Waterloo');
  await expect(page.locator('.compare-card').last()).toContainText('Georgia Tech');
  await page.locator('.sidebar').getByRole('button', { name: 'My profile', exact: true }).click();
  await page.getByRole('button', { name: '3 Tests & language' }).click();
  await page.getByLabel('IELTS overall', { exact: true }).fill('6.5');
  await page.getByLabel('IELTS writing', { exact: true }).fill('6.5');
  await page.getByLabel('IELTS speaking', { exact: true }).fill('6.5');
  await page.getByRole('combobox', { name: 'SAT status', exact: true }).selectOption('VALID');
  await page.getByRole('spinbutton', { name: 'SAT score', exact: true }).fill('1450');
  await page.getByRole('textbox', { name: 'SAT test date', exact: true }).fill('2026-08-15');
  await page.getByRole('button', { name: '4 Budget & readiness' }).click();
  await page.getByRole('checkbox', { name: /I have checked the official document lists/ }).check();
  await page.getByRole('checkbox', { name: /I have submitted Waterloo/ }).check();
  await page.getByRole('button', { name: 'Build my opportunity map' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Explore my paths' }).click();
  await expect(page.locator('.stats-grid button').first()).toContainText('03');
  await page.locator('.sidebar').getByRole('button', { name: 'My roadmap', exact: true }).click();
  await expect(page.locator('.task-card')).not.toHaveCount(0);
  await page
    .locator('.next-action-hero')
    .getByRole('button', { name: 'Mark this step complete' })
    .click();
  await expect(page.locator('.task-card.completed')).toHaveCount(1);
  await page.reload();
  await expect(page.locator('.task-card.completed')).toHaveCount(1);
  await page
    .locator('.sidebar')
    .getByRole('button', { name: 'Opportunity map', exact: true })
    .click();
  await expect(page.locator('.program-card')).toHaveCount(11);
  await expect(page.locator('.profile-chips')).toContainText('IELTS 6.5');
  await expect(page.locator('.profile-button')).toContainText('Your admission journey');
  await page.locator('.sidebar').getByRole('button', { name: 'My roadmap', exact: true }).click();
  await expect(page.locator('.task-card.completed')).toHaveCount(1);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export my plan' }).click();
  expect((await download).suggestedFilename()).toBe('pathshift-roadmap.txt');
  expect(errors).toEqual([]);
});
test('budget-only scenario changes cost comparisons without changing academic rules', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('.program-card')).toHaveCount(11);
  await page.getByRole('switch', { name: /Explore an English result/ }).uncheck();
  await page.getByRole('switch', { name: /Explore a different budget/ }).check();
  const response = page.waitForResponse((r) => r.url().endsWith('/simulate'));
  await page.getByRole('button', { name: 'Explore this scenario' }).click();
  const simulation = await (await response).json();
  expect(simulation.diff.changed_rules).toHaveLength(0);
  expect(simulation.diff.changed_costs).toHaveLength(4);
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await expect(page.locator('.simulation-banner')).toHaveCount(0);
});
test('mobile layout, navigation and profile form remain usable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.locator('.program-card')).toHaveCount(11);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/mobile-map.png', fullPage: true });
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.locator('.sidebar').getByRole('button', { name: 'My roadmap', exact: true }).click();
  await expect(page.locator('.next-action-hero')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.getByRole('button', { name: 'Toggle navigation' }).click();
  await page.locator('.sidebar').getByRole('button', { name: 'My profile', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Start with where you are.' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
test('API validates input and forbids faking a score with task completion', async ({ request }) => {
  const bad = await request.post('/api/v1/evaluate', { data: { profile: { name: 'bad' } } });
  expect(bad.status()).toBe(400);
  const score = await request.patch('/api/v1/roadmap/tasks/english', {
    data: { profile: demoProfile, complete: true },
  });
  expect(score.status()).toBe(422);
  const dependencies = await request.patch('/api/v1/roadmap/tasks/application-uw', {
    data: { profile: demoProfile, complete: true },
  });
  expect(dependencies.status()).toBe(422);
  const list = await request.get('/api/v1/programs');
  expect((await list.json()).programs).toHaveLength(12);
});
test('desktop layout is captured after evaluation with no horizontal overflow', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/');
  await expect(page.locator('.program-card')).toHaveCount(11);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.screenshot({ path: 'test-results/desktop-map.png', fullPage: true });
});
test('unsupported field and empty filters explain how to recover', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.program-card')).toHaveCount(11);
  await page.getByRole('textbox', { name: 'Search programs' }).fill('NoSuchInstitution');
  await expect(
    page.getByRole('heading', { name: 'No exact paths under these filters.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Explore all 12 programs' }).click();
  await expect(page.locator('.program-card')).toHaveCount(12);
  await page.locator('.sidebar').getByRole('button', { name: 'My profile', exact: true }).click();
  await page.getByLabel('Field of study').selectOption('Medicine');
  await page.getByRole('button', { name: '4 Budget & readiness' }).click();
  await page.getByRole('button', { name: 'Build my opportunity map' }).click();
  await page.getByRole('button', { name: 'Explore my paths' }).click();
  await expect(page.locator('.stats-grid button').first()).toContainText('00');
  await page.getByRole('button', { name: 'Reset demo' }).click();
  await page.getByRole('button', { name: 'Back up and reset' }).click();
  await expect(page.locator('.profile-chips')).toContainText('IELTS 6');
});
