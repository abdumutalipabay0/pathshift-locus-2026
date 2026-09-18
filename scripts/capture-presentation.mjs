import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'https://pathshift-locus-2026.vercel.app';
const destination = resolve('docs/presentation/screenshots');
await mkdir(destination, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(20000);

async function capture(name, selector) {
  if (selector) await page.locator(selector).first().scrollIntoViewIfNeeded();
  await page.screenshot({ path: resolve(destination, `${name}.png`), animations: 'disabled' });
  console.log(name, page.url());
}

try {
  await page.goto(origin, { waitUntil: 'networkidle' });
  await page.locator('.language-picker select').selectOption('en');
  await capture('01-landing');

  await page.goto(`${origin}/demo?view=portfolio`, { waitUntil: 'networkidle' });
  await page.locator('.portfolio-page').waitFor();
  await page.getByRole('button', { name: 'Building apps', exact: true }).click();
  await page.getByLabel('What do you enjoy doing?').fill('Building useful tools for students.');
  await page
    .locator('#experience-answer')
    .fill('I built a website for our school club and worked on its application form.');
  await capture('02-student-story', '.portfolio-page');

  await page.goto(`${origin}/demo?view=map`, { waitUntil: 'networkidle' });
  await page.locator('.program-card').first().waitFor();
  await capture('03-university-discovery', '.program-card');
  await page.getByRole('button', { name: 'UW–Madison', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('.university-overview').waitFor();
  await dialog
    .locator('.university-banner img')
    .first()
    .evaluate(async (image) => {
      if (!image.complete)
        await new Promise((resolve) => image.addEventListener('load', resolve, { once: true }));
      if (!image.naturalWidth) throw new Error('University photo did not load');
    });
  await capture('04-university-profile', '.university-banner');
  await dialog.getByRole('button', { name: 'Check my profile', exact: true }).click();
  await dialog.getByRole('heading', { name: 'Why this result?', exact: true }).waitFor();
  await capture('05-personal-requirements', '.requirement-receipt');
  await page.keyboard.press('Escape');

  await page
    .locator('.context-navigation')
    .getByRole('button', { name: 'Compare paths', exact: true })
    .click();
  await page.locator('.compare-card').first().waitFor();
  await page.getByRole('button', { name: 'Georgia Tech', exact: true }).click();
  await page.getByRole('button', { name: 'UW–Madison', exact: true }).click();
  await capture('06-compare', '.compare-card');

  await page.goto(`${origin}/demo?view=lab`, { waitUntil: 'networkidle' });
  await page.locator('.lab-path').first().waitFor();
  await page.locator('.lab-path').filter({ hasText: 'Retake IELTS' }).first().click();
  await page.locator('.lab-future-summary').waitFor();
  await page.evaluate(() => window.scrollTo(0, 400));
  await capture('07-what-if');

  await page.goto(`${origin}/demo?view=roadmap`, { waitUntil: 'networkidle' });
  await page.locator('.next-action-hero').waitFor();
  await capture('08-next-step', '.next-action-hero');
} finally {
  await browser.close();
}
