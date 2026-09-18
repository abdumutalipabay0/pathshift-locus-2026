import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const origin = 'https://pathshift-locus-2026.vercel.app';
const temp = resolve('../..', 'work', 'demo-video');
const output = resolve('..', 'PathShift-live-demo-draft.webm');
await mkdir(temp, { recursive: true });

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: temp, size: { width: 1440, height: 900 } },
  reducedMotion: 'reduce',
});
const page = await context.newPage();
page.setDefaultTimeout(20000);
const hold = (ms) => page.waitForTimeout(ms);

try {
  await page.goto(origin, { waitUntil: 'domcontentloaded' });
  await page.locator('.language-picker select').waitFor();
  await page.locator('.language-picker select').selectOption('en');
  await page.getByRole('link', { name: 'Explore the demo', exact: true }).first().waitFor();
  await hold(4500);
  await page.getByRole('link', { name: 'Explore the demo', exact: true }).first().click();
  await page.locator('.program-card').first().waitFor();
  await hold(3500);
  await page.locator('.context-navigation').getByRole('button', { name: 'My shortlist' }).click();
  await page.getByRole('button', { name: 'Remove UBC Vancouver from shortlist' }).click();
  await page.waitForFunction(
    () => !document.querySelector('.save-status')?.textContent?.includes('Recalculating'),
  );
  await hold(1800);
  await page
    .locator('.context-navigation')
    .getByRole('button', { name: 'Universities', exact: true })
    .click();

  await page.locator('.sidebar').getByRole('button', { name: 'My story and resume' }).click();
  await page.getByRole('button', { name: 'Building apps', exact: true }).click();
  await page.getByLabel('What do you enjoy doing?').fill('Building useful tools for students.');
  await page
    .locator('#experience-answer')
    .pressSequentially('I built a website for our school club and made the application form.', {
      delay: 45,
    });
  await hold(4500);
  await page.getByRole('button', { name: 'Save my story', exact: true }).click();
  await hold(2500);

  await page.locator('.sidebar').getByRole('button', { name: 'Universities', exact: true }).click();
  await page.locator('.program-card').first().waitFor();
  await hold(3500);
  await page.getByRole('button', { name: 'UW–Madison', exact: true }).click();
  const university = page.getByRole('dialog');
  await university
    .locator('.university-banner img')
    .first()
    .evaluate(async (image) => {
      if (!image.complete)
        await new Promise((resolve) => image.addEventListener('load', resolve, { once: true }));
    });
  await hold(4500);
  await university.getByRole('button', { name: 'Check my profile', exact: true }).click();
  await university.locator('.requirement-receipt').scrollIntoViewIfNeeded();
  await hold(6000);
  await page.keyboard.press('Escape');

  await page.locator('.context-navigation').getByRole('button', { name: 'Compare paths' }).click();
  await page.locator('.compare-card').first().waitFor();
  await page.getByRole('button', { name: 'Georgia Tech', exact: true }).click();
  await page.getByRole('button', { name: 'UW–Madison', exact: true }).click();
  await hold(6000);

  await page.locator('.sidebar').getByRole('button', { name: 'Universities', exact: true }).click();
  await page.getByRole('switch', { name: /Explore an English result/ }).check();
  await hold(2500);
  await page.getByRole('button', { name: 'Explore this scenario', exact: true }).click();
  await page.locator('.simulation-banner').waitFor();
  await page.locator('.causal-diff').scrollIntoViewIfNeeded();
  await hold(7000);
  await page.getByRole('button', { name: 'Discard', exact: true }).click();

  await page.locator('.sidebar').getByRole('button', { name: 'My application tasks' }).click();
  await page.locator('.next-action-hero').scrollIntoViewIfNeeded();
  await hold(7000);
  await page.close();
  await page.video().saveAs(output);
  console.log(output);
} finally {
  await context.close();
  await browser.close();
}
