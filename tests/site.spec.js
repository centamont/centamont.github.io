// @ts-check
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

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
  // the reminder names the blank that is missing, and the field says it is invalid
  await expect(page.locator('#letterNote')).toContainText('Fill in your name first');
  await expect(page.locator('#letter input[name="name"]')).toBeFocused();
  await expect(page.locator('#letter input[name="name"]')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#letter input[name="name"]').fill('Ana Ruiz');
  await expect(page.locator('#letter input[name="name"]')).not.toHaveAttribute('aria-invalid', /.*/);
  await page.locator('#letter button[data-to="ig"]').click();
  await expect(page.locator('#letterNote')).toContainText('Instagram');
});

// No clipboard permission granted in advance, as for a first-time visitor. Chrome and Edge only allow the copy while
// the click still counts as the visitor's own, so the copy must start before the Instagram tab opens.
test('the letter copies and opens Instagram without a clipboard permission', async ({ page, context, browserName }) => {
  await context.route('https://ig.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>Instagram</title>' }));
  await page.goto('/');
  await page.locator('#letter').scrollIntoViewIfNeeded();
  await page.locator('#letter input[name="where"]').fill('Edgewater');
  await page.locator('#letter input[name="units"]').fill('60');
  await page.locator('#letter input[name="name"]').fill('Ana Ruiz');
  const popup = page.waitForEvent('popup');
  await page.locator('#letter button[data-to="ig"]').click();
  // the copy settles at once (copied, or the letter shown to copy by hand), never left waiting on a prompt
  await expect(page.locator('#letterNote')).toContainText('Instagram', { timeout: 2000 });
  // and the new tab goes straight to the message
  await (await popup).waitForURL(/^https:\/\/ig\.me\/m\/centamont/, { timeout: 2000 });
  if (browserName === 'chromium') {
    await expect(page.locator('#letterNote')).toContainText('Your letter is copied');
    await context.grantPermissions(['clipboard-read']);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Dear partners,\n\nWe are developing a building in Edgewater with about 60 residences. The project is still a sketch, and we hope to launch sales this year.\n\nWith regards,\nAna Ruiz');
  }
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

// The report sheet is about 3,000px tall, so on a short phone screen it can never be a quarter in view:
// each chart list draws its own bars as it arrives.
test('the report bars draw on a short phone screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 664 });
  await page.goto('/report.html');
  for (const sel of ['.rp-funnel', '.rp-src']) {
    await page.locator(sel).scrollIntoViewIfNeeded();
    await expect(page.locator(sel)).toHaveClass(/\bin\b/);
  }
  await expect.poll(() => page.evaluate(() => [...document.querySelectorAll('.rp-funnel .bar i, .rp-src .bar i')].every((i) => getComputedStyle(i).transform === 'none'))).toBe(true);
});

// Stylesheet and scripts are linked with one shared ?v= token taken from their contents (tools/version.py), so a
// returning visitor never pairs a new page with an old stylesheet. A change to any of them needs a new token.
test('assets carry the current version', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  const assets = ['site.css', 'site.js', 'model.js', 'instrument.js'];
  const h = createHash('sha256');
  for (const a of assets) h.update(readFileSync(a));
  const token = h.digest('hex').slice(0, 8);
  const pages = ['index.html', 'privacy.html', '404.html', 'colophon.html', 'private-clients.html', 'report.html', 'journal/index.html',
    'journal/buying-pre-construction-florida.html', 'journal/launch-price-and-the-pre-sale-threshold.html', 'journal/what-a-weekly-sales-report-should-measure.html'];
  let refs = 0;
  for (const p of pages) {
    for (const m of readFileSync(p, 'utf8').matchAll(/(?:href|src)="[^"]*?(site\.css|site\.js|model\.js|instrument\.js)(\?v=[0-9a-f]*)?"/g)) {
      refs++;
      expect(m[2], `${p} links ${m[1]} without the current token: run python3 tools/version.py`).toBe('?v=' + token);
    }
  }
  expect(refs).toBeGreaterThanOrEqual(23);
});

// Opening the menu on a tablet and then widening the window (or turning the tablet) must not leave the page frozen.
test('the menu lets go when the window widens past it', async ({ page, isMobile }) => {
  test.skip(isMobile, 'resizes a desktop window');
  await page.setViewportSize({ width: 1000, height: 1300 });
  await page.goto('/privacy.html');
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.locator('html')).toHaveClass(/menu-open/);
  await page.setViewportSize({ width: 1300, height: 1000 });
  await expect(page.locator('html')).not.toHaveClass(/menu-open/);
  expect(await page.evaluate(() => document.querySelector('main').inert)).toBe(false);
  await page.mouse.wheel(0, 600);
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
});

// WCAG 2.2.2: the hero tower orbits on its own, so phones need the pause switch too. It waits in the open menu.
test('phones can pause the motion from the menu', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  await page.goto('/');
  await expect(page.locator('#motionBtn')).toBeHidden();
  await page.getByRole('button', { name: 'Menu' }).click();
  await expect(page.getByRole('button', { name: 'Pause motion' })).toBeVisible();
  // it sits in the menu's keyboard loop: from the last link, Tab reaches it
  await page.locator('nav.main a').last().focus();
  await page.keyboard.press('Tab');
  await expect(page.locator('#motionBtn')).toBeFocused();
  await page.locator('#motionBtn').click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
  await expect(page.locator('#motionBtn')).toHaveAttribute('aria-pressed', 'true');
});

// Reduced motion: final states at once. Nothing on the page keeps animating (the scroll-linked reading bar aside).
test('reduced motion leaves nothing running', async ({ page, isMobile }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  for (const sel of ['.facade', '#chart']) {
    await page.locator(sel).scrollIntoViewIfNeeded();
    await expect(page.locator(sel)).toHaveClass(/\bin\b/);
  }
  // On a phone the motion switch fades in at the foot of the open menu, so open it too.
  if (isMobile) {
    await page.getByRole('button', { name: 'Menu' }).click();
    await expect(page.locator('#motionBtn')).toBeVisible();
  }
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').map((a) => a.animationName || a.constructor.name))).toEqual([]);
});
