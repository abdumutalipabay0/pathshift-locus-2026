import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { translateText } from '../src/lib/i18n';
for (const locale of ['ru', 'kk'] as const) {
  test(`${locale}: complete interface, dialogs, form state, export and persistence`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const t = (text: string) => translateText(text, locale);
    await page.goto('/demo?view=map');
    await expect(page.locator('.program-card')).toHaveCount(6);
    await page.locator('.language-picker select').selectOption(locale);
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(
      page.getByRole('heading', { name: t('Get to know your future university.') }),
    ).toBeVisible();
    await page
      .locator('.program-card')
      .filter({ has: page.getByRole('heading', { name: 'Waterloo', exact: true }) })
      .getByRole('button', { name: t('See requirements and next steps') })
      .click();
    await expect(page.getByRole('dialog')).toContainText(t('IB academic prerequisites'));
    await expect(page.getByRole('dialog')).toContainText(t('Why this result?'));
    await page
      .getByRole('button', { name: t('Source proof'), exact: true })
      .first()
      .click();
    await expect(page.getByRole('dialog').last()).toContainText(t('Open official source'));
    await expect(page.getByRole('dialog').last()).not.toContainText('IB Diploma, six courses');
    await page.keyboard.press('Escape');
    await page.keyboard.press('Escape');
    await page
      .locator('.sidebar')
      .getByRole('button', { name: t('Grades, tests and budget'), exact: true })
      .click();
    await page.locator('.wizard-steps button').nth(1).click();
    const curriculum = page.locator('select[name="curriculum"]');
    await curriculum.selectOption('Kazakhstan national');
    await expect(page.locator('#curriculum-guidance')).toContainText(
      t(
        'For a regular Kazakhstan school, enter the grade exactly as it appears in your transcript, for example 4.8 out of 5. Do not convert it to GPA or IB.',
      ),
    );
    await expect(page.getByPlaceholder(t('e.g. 4.8'))).toBeVisible();
    await expect(page.getByPlaceholder(t('e.g. 4.8'))).toHaveValue('');
    await expect(page.getByLabel(t('Original scale'), { exact: true })).toHaveValue('');
    await curriculum.selectOption('IB');
    await expect(page.locator('#curriculum-guidance')).toContainText(
      t(
        'Choose IB only if your school officially teaches the IB Diploma Programme. Enter the official or predicted total out of 45.',
      ),
    );
    await page.locator('.wizard-steps button').nth(0).click();
    await page.getByLabel(t('Your name'), { exact: true }).fill('Әлихан');
    await page.locator('.language-picker select').selectOption(locale === 'kk' ? 'ru' : 'kk');
    await expect(page.locator('input[name="name"]')).toHaveValue('Әлихан');
    await page.locator('.language-picker select').selectOption(locale);
    await page.getByLabel(t('Field of study')).selectOption('Computer Science');
    await expect(page.getByLabel(t('Field of study'))).toHaveValue('Computer Science');
    await page.getByLabel(t('Age'), { exact: true }).fill('0');
    await page.locator('.wizard-steps button').nth(3).click();
    await page.getByRole('button', { name: t('Build my opportunity map') }).click();
    await expect(page.locator('.wizard').getByRole('alert')).toContainText(
      t('Age must be between 10 and 100.'),
    );
    await page.locator('.wizard-steps button').nth(0).click();
    await page.getByLabel(t('Age'), { exact: true }).fill('17');
    await page.locator('.wizard-steps button').nth(3).click();
    await page.getByRole('button', { name: t('Build my opportunity map') }).click();
    await page.getByRole('button', { name: t('Explore my paths') }).click();
    await page.getByRole('button', { name: t('Explore this scenario'), exact: true }).click();
    await page.getByRole('button', { name: t('Compare this scenario'), exact: true }).click();
    await expect(page.locator('.scenario-result')).toContainText(t('WHAT CHANGED'));
    const before = await page.locator('.scenario-result-counts strong').allTextContents();
    await page.locator('.language-picker select').selectOption('en');
    expect(await page.locator('.scenario-result-counts strong').allTextContents()).toEqual(before);
    await page.locator('.language-picker select').selectOption(locale);
    await page
      .locator('.scenario-result-actions')
      .getByRole('button', { name: t('Back to my profile'), exact: true })
      .click();
    await page
      .locator('.sidebar')
      .getByRole('button', { name: t('My application tasks'), exact: true })
      .click();
    await expect(page.locator('.task-list')).toContainText(t('Prepare your application records'));
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: t('Export my plan') }).click();
    const download = await downloadPromise;
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream!) chunks.push(chunk);
    const content = Buffer.concat(chunks).toString('utf8');
    expect(content).toContain(t('Prepare your application records'));
    expect(content).toContain('Әлихан');
    expect(content).not.toContain('Prepare your application records');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', locale);
    await expect(page.locator('.profile-button')).toContainText('Әлихан');
    const audit = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(
      audit.violations.map((v) => ({ id: v.id, targets: v.nodes.map((n) => n.target) })),
    ).toEqual([]);
    expect(errors).toEqual([]);
  });
  test(`${locale}: mobile layout and keyboard language selector`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/demo?view=map');
    await expect(page.locator('.program-card')).toHaveCount(6);
    await page.locator('.language-picker select').selectOption(locale);
    await expect(page.locator('.language-picker select')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.screenshot({ path: `test-results/${locale}-mobile.png` });
    for (const width of [320, 768]) {
      await page.setViewportSize({ width, height: 844 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.getByRole('button', { name: translateText('Toggle navigation', locale) }).click();
    await page
      .locator('.sidebar')
      .getByRole('button', { name: translateText('Grades, tests and budget', locale), exact: true })
      .click();
    for (let step = 0; step < 4; step++) {
      await page.locator('.wizard-steps button').nth(step).click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true,
      );
    }
    await page.locator('.language-picker select').focus();
    await page.keyboard.press('e');
    await page.keyboard.press('Enter');
    await expect(page.locator('.language-picker select')).toHaveValue('en');
  });
}
test('first response uses the requested language and safely rejects an invalid locale cookie', async ({
  request,
}) => {
  const kk = await request.get('/', { headers: { 'Accept-Language': 'kk-KZ,ru;q=0.9' } });
  expect(await kk.text()).toContain('<html lang="kk"');
  const invalid = await request.get('/', {
    headers: { Cookie: 'pathshift-locale=unknown', 'Accept-Language': 'ru-RU' },
  });
  expect(await invalid.text()).toContain('<html lang="ru"');
});
