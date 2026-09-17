import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { demoProfile } from '../src/lib/profile';

test('six researched choices and comparison survive invalid saved selections', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('pathshift-comparison', JSON.stringify(['rit', 'rit', 'invalid', 'asu'])),
  );
  await page.goto('/?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  for (const name of ['UW–Madison', 'Waterloo', 'Georgia Tech', 'Purdue', 'RIT', 'Arizona State'])
    await expect(
      page.locator('.program-card').getByRole('heading', { name, exact: true }),
    ).toBeVisible();
  await page
    .locator('.sidebar')
    .getByRole('button', { name: 'Compare paths', exact: true })
    .click();
  await expect(page.locator('.compare-card')).toHaveCount(2);
  await expect(page.locator('.comparison-table')).toContainText('85,298');
  await expect(page.locator('.comparison-table')).toContainText('69,906');
  await expect(page.locator('.compare-picker button')).toHaveCount(6);
  await expect(page.locator('.comparison-table')).toContainText('The rule is known.');
  await page.getByRole('button', { name: 'Add profile details', exact: true }).first().click();
  await expect(page.getByLabel('School mathematics years', { exact: true })).toBeVisible();
});
for (const locale of ['ru', 'kk', 'en'])
  test(`${locale}: sourced comparison accessible on mobile without page overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/?view=compare');
    await expect(page.locator('.compare-card')).toHaveCount(2);
    await page.getByRole('combobox', { name: 'Interface language' }).selectOption(locale);
    const table = page.locator('.comparison-table');
    await expect(table).toContainText('90');
    await expect(table.locator('tbody tr')).toHaveCount(8);
    await expect(
      table.locator('a[href="https://uwaterloo.ca/campus-housing/fees-contracts/residence"]'),
    ).toHaveCount(1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1),
    ).toBe(true);
    const audit = await new AxeBuilder({ page })
      .include('.research-comparison')
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(audit.violations).toEqual([]);
  });

test('IB bonus and school input persist as profile data, without changing the original grading scale', async ({
  page,
}) => {
  await page.goto('/?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page.getByRole('button', { name: '2 Academics' }).click();
  await page.getByLabel('IB bonus points (TOK / EE)', { exact: true }).fill('2');
  await page.getByLabel('Chemistry or physics studied', { exact: true }).selectOption('true');
  await page.getByRole('button', { name: '4 Budget & readiness' }).click();
  await page.getByRole('button', { name: /Build my opportunity map/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.reload();
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page.getByRole('button', { name: '2 Academics' }).click();
  await expect(page.getByLabel('IB bonus points (TOK / EE)', { exact: true })).toHaveValue('2');
  await expect(page.getByLabel('Chemistry or physics studied', { exact: true })).toHaveValue(
    'true',
  );
  await expect(page.getByLabel('Original scale', { exact: true })).toHaveValue('45');
});

test('legacy synthetic demo gains new fields without losing its saved state', async ({ page }) => {
  const legacy = structuredClone(demoProfile);
  delete legacy.school;
  delete legacy.ib_core_points;
  await page.addInitScript(
    (p) => localStorage.setItem('pathshift-v1', JSON.stringify({ profile: p, demo: true })),
    legacy,
  );
  await page.goto('/?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page.getByRole('button', { name: '2 Academics' }).click();
  await expect(page.getByLabel('IB bonus points (TOK / EE)', { exact: true })).toHaveValue('3');
  await expect(page.getByLabel('School mathematics years', { exact: true })).toHaveValue('4');
});

test('real profiles never inherit synthetic school history or IB bonus points', async ({
  page,
}) => {
  const legacy = structuredClone(demoProfile);
  delete legacy.school;
  delete legacy.ib_core_points;
  await page.addInitScript(
    (p) => localStorage.setItem('pathshift-v1', JSON.stringify({ profile: p, demo: false })),
    legacy,
  );
  await page.goto('/?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  await page.getByRole('button', { name: 'Edit profile', exact: true }).click();
  await page.getByRole('button', { name: '2 Academics' }).click();
  await expect(page.getByLabel('IB bonus points (TOK / EE)', { exact: true })).toHaveValue('');
  await expect(page.getByLabel('School mathematics years', { exact: true })).toHaveValue('');
});
