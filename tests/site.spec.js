// @ts-check
import { test, expect } from '@playwright/test';

// Every section of the one-page centamont.com and a phrase from its heading.
const sections = [
  ['services', 'One firm, from the first sketch to the last closing'],
  ['developers', 'Your building, sold like it is the only one we have'],
  ['clients', 'Residences that never reach the open market'],
  ['markets', 'Miami first'],
  ['journal', 'Notes on new development'],
  ['people', 'A seat here is earned'],
  ['house', 'Quiet by design'],
  ['contact', 'Write to the partners'],
];

test('home renders cleanly', async ({ page }, info) => {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));

  await page.goto('/');
  await expect(page.locator('h1')).toContainText('The finest new buildings');
  await expect(page.locator('h1')).toHaveCount(1);
  for (const [id, heading] of sections) {
    await expect(page.locator(`#${id} h2`).first()).toContainText(heading);
  }

  // No sideways scrolling at any width.
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);

  // No leftover placeholders reach the public site.
  await expect(page.locator('body')).not.toContainText(/\[[A-Z][^\]]*\]/);

  // No hidden characters (zero-width, bidi, tag or private-use) in the copy.
  const hidden = await page.evaluate(() => (document.body.innerText.match(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\uE000-\uF8FF]|\uDB40[\uDC00-\uDC7F]/g) || []).length);
  expect(hidden).toBe(0);

  // Link previews have a title, description and image.
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\.png$/);

  // The drawing says it is an illustration.
  await expect(page.locator('.elev figcaption')).toContainText('Illustration, not a real project');

  expect(errors).toEqual([]);
  await page.screenshot({ path: info.outputPath('first-view.png') });
  await page.screenshot({ path: info.outputPath('home.png'), fullPage: true });
});

test('old page links land on their section', async ({ page }) => {
  for (const [id, heading] of sections) {
    await page.goto("about:blank");
    await page.goto(`/#${id}`);
    await expect(page.locator(`#${id} h2`).first()).toBeInViewport();
    await expect(page.locator(`#${id} h2`).first()).toContainText(heading);
  }
});

test('menu reaches every section', async ({ page, isMobile }) => {
  await page.goto('/');
  for (const [id] of sections) {
    if (!(await page.locator(`nav.main a[href="#${id}"]`).count())) continue;
    if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator(`nav.main a[href="#${id}"]`).click();
    await expect(page.locator(`#${id} h2`).first()).toBeInViewport();
  }
});

test('the building rises as the story scrolls', async ({ page }, info) => {
  await page.goto('/');
  const built = () => page.locator('#tower .fl.built').count();
  const sold = () => page.locator('#tower .fl.sold').count();
  expect(await built()).toBe(0);

  const steps = page.locator('#steps .step');
  await steps.nth(3).scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const s = document.querySelectorAll('#steps .step')[3];
    window.scrollTo(0, s.getBoundingClientRect().top + scrollY + s.offsetHeight / 2 - innerHeight / 2);
  });
  await expect.poll(built).toBe(11);
  await expect.poll(sold).toBe(4);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: info.outputPath('rising.png') });

  await page.evaluate(() => {
    const s = document.querySelectorAll('#steps .step')[5];
    window.scrollTo(0, s.getBoundingClientRect().top + scrollY + s.offsetHeight / 2 - innerHeight / 2);
  });
  await expect.poll(sold).toBe(22);
});

for (const [path, heading] of [
  ['/journal/buying-pre-construction-florida.html', 'Buying pre-construction in Florida'],
  ['/privacy.html', 'Privacy'],
  ['/404.html', 'This page was never built'],
]) {
  test(`${path} renders cleanly`, async ({ page }, info) => {
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto(path);
    await expect(page.locator('h1')).toContainText(heading);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(0);
    expect(errors).toEqual([]);
    await page.screenshot({ path: info.outputPath('page.png'), fullPage: true });
  });
}

test('journal links to the guide', async ({ page }) => {
  await page.goto('/#journal');
  await page.getByRole('link', { name: 'Read the guide' }).click();
  await expect(page.locator('h1')).toContainText('Buying pre-construction in Florida');
});

test('Escape closes the phone menu', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  await page.goto('/');
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.locator('nav.main')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('nav.main')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Menu' })).toBeFocused();
});
