import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('draft survives navigation and reload, geography locks follow changed selections', async ({
  page,
}) => {
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Edit your details', exact: true }).click();
  await page.getByLabel('Your name', { exact: true }).fill('Draft student');
  await page.getByLabel('Keep these countries as a hard constraint').check();
  await page.getByRole('checkbox', { name: 'United States', exact: true }).uncheck();
  await page.getByRole('checkbox', { name: 'United Kingdom', exact: true }).check();
  await page.getByRole('button', { name: '2 Academics' }).click();
  await page.reload();
  await expect(page.locator('.program-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Edit your details', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Your education, in its own terms.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Your direction', exact: true }).click();
  await expect(page.getByLabel('Your name', { exact: true })).toHaveValue('Draft student');
  await page.getByRole('button', { name: '4 Budget & readiness' }).click();
  const response = page.waitForResponse(
    (r) => r.url().endsWith('/evaluate') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Build my opportunity map' }).click();
  const value = await (await response).json();
  expect(value.profile.country_locks).toEqual(['Canada', 'UK']);
  expect(value.profile.countries).toEqual(['Canada', 'UK']);
  await page.getByRole('button', { name: 'Explore my paths' }).click();
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('.profile-button')).toContainText('Draft student');
  await page.getByRole('button', { name: 'Reset demo', exact: true }).click();
  await page.getByRole('button', { name: 'Back up and reset' }).click();
  await expect(page.locator('.profile-button')).toContainText('Aruzhan');
  await page.locator('.profile-tools > summary').click();
  await page.getByRole('button', { name: 'Undo demo reset' }).click();
  await expect(page.locator('.profile-button')).toContainText('Draft student');
});
test('comparison limit, reload and browser Back retain usable navigation', async ({ page }) => {
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  await page
    .locator('.sidebar')
    .getByRole('button', { name: 'Compare paths', exact: true })
    .click();
  await page.getByRole('button', { name: 'UW–Madison', exact: true }).click();
  await page.getByRole('button', { name: 'RIT', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Remove one');
  await expect(page.locator('.compare-card')).toHaveCount(3);
  await expect(page.locator('.compare-card').first()).toContainText('Waterloo');
  await page.reload();
  await expect(page.locator('.compare-card')).toHaveCount(3);
  await page
    .locator('.sidebar')
    .getByRole('button', { name: 'My application tasks', exact: true })
    .click();
  await page.goBack();
  await expect(page.locator('.compare-card')).toHaveCount(3);
});
test('saved scenario remains hypothetical across reload; calendar and verification draft work', async ({
  page,
}) => {
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  await page.getByRole('switch', { name: /Explore an English result/ }).check();
  await page.getByRole('button', { name: 'Explore this scenario', exact: true }).click();
  await expect(page.locator('.simulation-banner')).toBeVisible();
  await page.getByLabel('Scenario name', { exact: true }).fill('English target');
  await page.locator('.simulation-banner').getByRole('button', { name: 'Save scenario' }).click();
  await expect(page.getByRole('dialog')).toContainText('English target');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('.program-card')).toHaveCount(6);
  await expect(page.locator('.profile-chips')).toContainText('IELTS 6');
  await expect(page.locator('.profile-chips')).not.toContainText('IELTS 6.5');
  await page.getByRole('button', { name: /Saved scenarios/ }).click();
  await page.getByRole('button', { name: 'Compare with my current profile' }).click();
  await expect(page.locator('.causal-diff')).toContainText('requirement gaps removed');
  await page.getByRole('button', { name: 'Discard', exact: true }).click();
  await page
    .locator('.sidebar')
    .getByRole('button', { name: 'My application tasks', exact: true })
    .click();
  const downloaded = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export calendar', exact: true }).click();
  expect((await downloaded).suggestedFilename()).toBe('pathshift-deadlines.ics');
  await page.locator('.optional-tools > summary').click();
  await page.getByText('Turn an unknown into a next step', { exact: true }).click();
  await page.getByRole('button', { name: 'Prepare a question' }).first().click();
  await expect(
    page.getByRole('textbox', { name: 'Your question — review before sending' }),
  ).toContainText('University of British Columbia');
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) }))).toEqual(
    [],
  );
});
test('mobile navigation communicates state and closes by Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  const toggle = page.getByRole('button', { name: 'Toggle navigation' });
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(page.locator('.sidebar')).not.toBeVisible();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
});

test('focused entry separates incomplete research and keeps secondary tools closed', async ({
  page,
}) => {
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  await expect(page.locator('.program-grid')).toContainText('UW–Madison');
  await expect(page.locator('.program-grid')).toContainText('Waterloo');
  await expect(page.locator('.program-grid')).toContainText('Georgia Tech');
  await expect(page.getByRole('button', { name: 'Import profile', exact: true })).not.toBeVisible();
  await page.getByRole('checkbox', { name: 'Include programs with unverified rules' }).check();
  await expect(page.locator('.program-card')).toHaveCount(11);
  await page.getByRole('checkbox', { name: 'Include programs with unverified rules' }).uncheck();
  await expect(page.locator('.program-card')).toHaveCount(6);
});
