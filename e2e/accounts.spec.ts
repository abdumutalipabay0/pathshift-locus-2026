import { test, expect } from '@playwright/test';
import { randomBytes } from 'node:crypto';
import { loadEnvFile } from 'node:process';
import { neon } from '@neondatabase/serverless';

test.use({ trace: 'off', video: 'off', actionTimeout: 15000 });
test.describe('live account lifecycle', () => {
  test.skip(
    process.env.RUN_ACCOUNT_E2E !== '1',
    'Explicit opt-in: creates and removes reserved QA accounts',
  );

  const emails: string[] = [];
  test.afterAll(async () => {
    if (!emails.length) return;
    loadEnvFile('.env.local');
    const sql = neon(process.env.DATABASE_URL!);
    for (const email of emails) {
      await sql`DELETE FROM pathshift_profiles WHERE user_id IN (SELECT id::text FROM neon_auth."user" WHERE email = ${email})`;
      await sql`DELETE FROM neon_auth."user" WHERE email = ${email}`;
    }
  });
  test('registration → mandatory onboarding → server persistence → logout → fresh-browser login and account isolation', async ({
    page,
    browser,
    baseURL,
  }) => {
    test.setTimeout(120000);
    const email = `pathshift-qa-${Date.now()}@example.com`,
      password = randomBytes(24).toString('hex');
    emails.push(email);
    await page.goto('/auth/sign-up');
    await page.getByLabel('Your name', { exact: true }).fill('QA Applicant');
    await page.getByLabel('Email address').fill(email);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Create account', exact: true }).click();
    await expect(page).toHaveURL(/\/onboarding$/, { timeout: 20000 });
    await page.goto('/app?view=map');
    await expect(page).toHaveURL(/\/onboarding$/);
    await expect(page.getByLabel('Age', { exact: true })).toHaveValue('');
    await expect(page.locator('.wizard-steps')).toHaveCount(0);
    await page.getByLabel('Age', { exact: true }).fill('18');
    await page.getByLabel('Citizenship', { exact: true }).fill('Kazakhstan');
    await page.getByLabel('Canada', { exact: true }).check();
    await page.getByRole('button', { name: 'Show universities', exact: true }).click();
    await expect(page).toHaveURL(/\/app$/, { timeout: 20000 });
    await expect(page.locator('.profile-button')).toContainText('QA Applicant');
    await expect(page.locator('.entry-demo-banner')).toHaveCount(0);
    const persisted = await (await page.request.get('/api/account/profile')).json();
    expect(persisted.profile.name).toBe('QA Applicant');
    expect(persisted.profile.ielts.overall).toBeNull();
    expect(persisted.profile.ib_total).toBeNull();
    expect(persisted.profile.curriculum).toBe('');
    expect(persisted.profile.budgets.USD).toBeNull();
    await expect(page.locator('.program-card').first()).toBeVisible();
    await page.getByRole('button', { name: 'My profile', exact: true }).click();
    await page.getByLabel('Your name', { exact: true }).fill('QA Updated');
    await page.getByRole('button', { name: /Budget & readiness/ }).click();
    await page.getByRole('button', { name: 'Build my opportunity map', exact: true }).click();
    await expect(page.locator('.profile-button')).toContainText('QA Updated');
    await page.getByRole('button', { name: 'Close dialog', exact: true }).click();
    await page.getByRole('button', { name: 'Sign out', exact: true }).click();
    await expect(page).toHaveURL(baseURL! + '/');
    expect((await page.request.get('/api/account/profile')).status()).toBe(401);
    const fresh = await browser.newContext({ baseURL });
    try {
      const tab = await fresh.newPage();
      await tab.goto('/auth/sign-in');
      await tab.getByLabel('Email address').fill(email);
      await tab.getByLabel('Password', { exact: true }).fill(password);
      await tab.getByRole('button', { name: 'Sign in', exact: true }).click();
      await expect(tab).toHaveURL(/\/app$/, { timeout: 20000 });
      await expect(tab.locator('.profile-button')).toContainText('QA Updated');
      await tab.reload();
      await expect(tab.locator('.profile-button')).toContainText('QA Updated');
    } finally {
      await fresh.close();
    }
    const other = await browser.newContext({ baseURL });
    try {
      const second = `pathshift-qa-other-${Date.now()}@example.com`;
      emails.push(second);
      const response = await other.request.post('/api/auth/sign-up/email', {
        headers: { Origin: baseURL! },
        data: { name: 'Other QA', email: second, password },
      });
      expect(response.status()).toBe(200);
      const profile = await other.request.get('/api/account/profile');
      expect(profile.status()).toBe(200);
      expect((await profile.json()).profile).toBeNull();
    } finally {
      await other.close();
    }
  });
});
