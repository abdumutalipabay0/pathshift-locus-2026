import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('opportunity map has no WCAG A/AA automated accessibility violations', async ({ page }) => {
  await page.goto('/demo?view=map');
  await expect(page.locator('.program-card')).toHaveCount(6);
  const audit = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(
    audit.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
    })),
  ).toEqual([]);
});
