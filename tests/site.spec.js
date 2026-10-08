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

// Skip the one-time intro so every test starts on the page itself.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => sessionStorage.setItem('cm-intro', '1'));
});

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

  // Every section introduction is on screen, not hidden by a stray style.
  for (const p of await page.locator('.head p.intro').all()) await expect(p).toBeVisible();

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
    // The section's top lands at the top of the screen.
    await expect.poll(() => page.evaluate((s) => Math.round(document.getElementById(s).getBoundingClientRect().top), id)).toBeLessThan(120);
    await expect(page.locator(`#${id}`)).toBeInViewport();
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
  const built = async () => +(await page.locator('#tower').getAttribute('data-built'));
  const sold = async () => +(await page.locator('#tower').getAttribute('data-sold'));
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
  ['/journal/buying-pre-construction-florida.html', /Buying pre.construction in Florida/],
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
  await expect(page.locator('h1')).toContainText(/Buying pre.construction in Florida/);
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

test('first visit plays the intro, then reveals the page', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.removeItem('cm-intro'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/intro-on/);
  await expect(page.locator('html')).not.toHaveClass(/intro-on/, { timeout: 5000 });
  await expect(page.locator('#heroModel')).toHaveAttribute('data-built', '22');
});

test('day and night toggle remembers the choice', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto('/');
  await page.getByRole('button', { name: 'Switch between day and night' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('every internal link lands on a real page and section', async ({ page, request }) => {
  const pages = ['/', '/journal/', '/journal/buying-pre-construction-florida.html', '/report.html', '/private-clients.html', '/colophon.html', '/privacy.html', '/404.html'];
  for (const path of pages) {
    await page.goto(path);
    const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.href).filter((h) => h.startsWith(location.origin)));
    for (const href of new Set(hrefs)) {
      const url = new URL(href);
      expect((await request.get(url.pathname)).status(), `${path} -> ${href}`).toBe(200);
      if (url.hash.length > 1) {
        const ids = await (await request.get(url.pathname)).text();
        expect(ids, `${path} -> ${href}`).toContain(`id="${url.hash.slice(1)}"`);
      }
    }
  }
});

test('fonts are served from the site', async ({ page }) => {
  const outside = [];
  page.on('request', (r) => { if (!r.url().startsWith('http://127.0.0.1')) outside.push(r.url()); });
  await page.goto('/');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('300 40px "Cormorant Garamond"'))).toBe(true);
  expect(outside).toEqual([]);
});

test('a click skips the intro', async ({ page }) => {
  await page.addInitScript(() => sessionStorage.removeItem('cm-intro'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/intro-on/);
  await page.mouse.click(10, 10);
  await expect(page.locator('html')).not.toHaveClass(/intro-on/, { timeout: 1500 });
});

test('the drawings arrive and say what they show', async ({ page }) => {
  await page.goto('/');
  for (const sel of ['.doorway', '#chart', '.deposit', '.table', '#ruler']) {
    await page.locator(sel).scrollIntoViewIfNeeded();
    await expect(page.locator(sel)).toHaveClass(/\bin\b/);
  }
  await expect(page.locator('.deposit figcaption')).toContainText('illustrative');
  await expect(page.locator('#chart figcaption')).toContainText('simplified');
});

test('the sales curve answers the launch price, and says it is illustrative', async ({ page }) => {
  await page.goto('/');
  await page.locator('#curve').scrollIntoViewIfNeeded();
  const before = await page.locator('#cvMonth').textContent();
  await page.locator('#cvPrice').fill('8');
  await expect(page.locator('#cvPriceOut')).toHaveText('8% above');
  await expect(page.locator('#cvMonth')).not.toHaveText(before || '');
  await expect(page.locator('#cvSay')).toContainText('8 percent more');
  await expect(page.locator('.cv-fig figcaption')).toContainText('illustrative');
});

test('the letter turns the fields into a message to copy', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await page.goto('/');
  await page.locator('#letter').scrollIntoViewIfNeeded();
  await page.locator('#letter label', { hasText: 'A buyer' }).click();
  await expect(page.locator('#letter [data-for="buy"]')).toBeVisible();
  await expect(page.locator('#letter [data-for="dev"]')).toBeHidden();
  await page.locator('#letter input[name="area"]').fill('Miami Beach');
  page.on('popup', (p) => p.close().catch(() => {}));
  await page.locator('#letter button[data-to="ig"]').click();
  await expect(page.locator('#letterNote')).toContainText('Fill in the underlined blank');
  await expect(page.locator('#letter input[name="name"]')).toBeFocused();
  await page.locator('#letter input[name="name"]').fill('Ana Ruiz');
  await page.locator('#letter button[data-to="ig"]').click();
  await expect(page.locator('#letterNote')).toContainText('Instagram');
});

// Each page carries its own Content-Security-Policy, which allows its inline scripts by hash.
// Editing an inline script without updating that page's hash would silently switch it off.
test('every page runs under its security policy with nothing refused', async ({ page }) => {
  const pages = ['/', '/privacy.html', '/404.html', '/colophon.html', '/private-clients.html', '/report.html',
    '/journal/', '/journal/buying-pre-construction-florida.html',
    '/journal/launch-price-and-the-pre-sale-threshold.html', '/journal/what-a-weekly-sales-report-should-measure.html'];
  const refused = [];
  await page.addInitScript(() => document.addEventListener('securitypolicyviolation', (e) => console.error('CSP refused ' + e.violatedDirective + ' ' + e.blockedURI)));
  page.on('console', (m) => m.text().startsWith('CSP refused') && refused.push(page.url() + ' ' + m.text()));
  for (const path of pages) {
    await page.goto(path);
    await expect(page.locator('meta[http-equiv="Content-Security-Policy"]')).toHaveCount(1);
    await page.mouse.wheel(0, 3000);
    await page.waitForTimeout(300);
  }
  expect(refused).toEqual([]);
});
