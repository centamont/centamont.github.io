// @ts-check
import { test, expect } from '@playwright/test';

// Every hash-routed page on centamont.com and a phrase from its heading.
const pages = [
  ['home', 'The finest new buildings'],
  ['developers', 'Your building, sold like it is the only one we have'],
  ['clients', 'Residences that never reach the open market'],
  ['markets', 'Miami first'],
  ['journal', 'Notes on new development'],
  ['people', 'A seat here is earned'],
  ['house', 'Quiet by design'],
  ['contact', 'Write to the partners'],
];

for (const [id, heading] of pages) {
  test(`${id} page renders cleanly`, async ({ page }, info) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

    await page.goto(`/#${id}`);
    const shown = page.locator(`[data-page="${id}"]`);
    await expect(shown).toBeVisible();
    await expect(shown.locator('h1')).toContainText(heading);
    await expect(page.locator('[data-page]:visible')).toHaveCount(1);

    // No sideways scrolling at any width.
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);

    // No leftover placeholders reach the public site.
    await expect(page.locator('body')).not.toContainText(/\[[A-Z][^\]]*\]/);

    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath(`${id}.png`), fullPage: true });
  });
}

test('menu reaches every page', async ({ page, isMobile }) => {
  await page.goto('/');
  for (const [id, heading] of pages.slice(1)) {
    if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator(`nav.main a[href="#${id}"]`).click();
    await expect(page.locator(`[data-page="${id}"] h1`)).toContainText(heading);
  }
});
