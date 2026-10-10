// @ts-check
import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';

// Every section of the one-page centamont.com and a phrase from its heading.
const sections = [
  ['services', 'One firm, from the first sketch to the last closing'],
  ['developers', 'Your building, sold like it is the only one we have'],
  ['clients', 'Residences that never reach the open market'],
  ['markets', 'South Florida first'],
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
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og\.png(\?v=\d+)?$/);

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
  // Selling: the lender's pre-sale threshold is met (9 of 17 residential levels sold), then ground breaks (the podium framed)
  await expect.poll(built).toBe(3);
  await expect.poll(sold).toBe(9);
  // and the gauge reads what the drawing shows once it settles
  await expect.poll(() => page.locator('#gS').textContent()).toBe('09');
  await expect.poll(() => page.locator('#gB').textContent()).toBe('03');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: info.outputPath('rising.png') });

  await page.evaluate(() => {
    const s = document.querySelectorAll('#steps .step')[5];
    window.scrollTo(0, s.getBoundingClientRect().top + scrollY + s.offsetHeight / 2 - innerHeight / 2);
  });
  // every residence sold; the podium and crown levels are never for sale
  await expect.poll(sold).toBe(17);
  await expect.poll(() => page.locator('#gS').textContent()).toBe('17');
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
  await page.getByRole('button', { name: 'Night mode' }).click();
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

// A note's dates are written in five places. They must agree: the date on the page, the share tags, the structured
// data and the feed say the same published and revised days, and the sitemap never claims an older change.
test('journal dates agree everywhere they are written', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  const feed = readFileSync('journal/feed.xml', 'utf8');
  const sitemap = readFileSync('sitemap.xml', 'utf8');
  const notes = ['buying-pre-construction-florida.html', 'launch-price-and-the-pre-sale-threshold.html', 'what-a-weekly-sales-report-should-measure.html'];
  for (const n of notes) {
    const html = readFileSync('journal/' + n, 'utf8');
    const url = 'https://centamont.com/journal/' + n;
    const og = (p) => (html.match(new RegExp(`<meta property="article:${p}" content="([^"]+)"`)) || [])[1];
    const ld = JSON.parse((html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/) || [])[1]);
    const article = ld['@graph'].find((x) => x['@type'] === 'Article');
    const meta = (html.match(/<div class="meta">([\s\S]*?)<\/div>/) || [])[1] || '';
    const times = [...meta.matchAll(/<time datetime="([^"]+)">/g)].map((m) => m[1]);
    const shownPublished = times[0];
    const shownRevised = /Revised <time/.test(meta) ? times[times.length - 1] : times[0];
    const entry = feed.split('<entry>').find((e) => e.includes(`<id>${url}</id>`)) || '';
    const feedPublished = (entry.match(/<published>(\d{4}-\d\d-\d\d)/) || [])[1];
    const feedUpdated = (entry.match(/<updated>(\d{4}-\d\d-\d\d)/) || [])[1];
    const lastmod = (sitemap.match(new RegExp(`<loc>${url.replace(/\./g, '\\.')}</loc><lastmod>([^<]+)</lastmod>`)) || [])[1];
    expect(shownPublished, `${n}: page date`).toBeTruthy();
    for (const [where, v] of [['article:published_time', og('published_time')], ['JSON-LD datePublished', article.datePublished], ['feed published', feedPublished]])
      expect(v, `${n}: ${where}`).toBe(shownPublished);
    for (const [where, v] of [['article:modified_time', og('modified_time')], ['JSON-LD dateModified', article.dateModified], ['feed updated', feedUpdated]])
      expect(v, `${n}: ${where}`).toBe(shownRevised);
    expect(lastmod, `${n}: sitemap lastmod`).toBeTruthy();
    expect(lastmod >= shownRevised, `${n}: sitemap lastmod ${lastmod} is older than the revision ${shownRevised}`).toBe(true);
  }
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

// Header switches, scrolling and the page's own script hygiene (batch 4 details).
test.describe('switches and script hygiene', () => {
  // The night-mode switch keeps one name and reports its state; with no choice stored it follows the system.
  test('night mode reports its state and follows the system', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    await page.goto('/privacy.html');
    const night = page.getByRole('button', { name: 'Night mode' });
    await expect(night).toHaveAttribute('aria-pressed', 'false');
    await page.emulateMedia({ colorScheme: 'dark' });
    await expect(night).toHaveAttribute('aria-pressed', 'true');
    await night.click();
    await expect(night).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  });

  // Pausing motion also stops smooth scrolling, and a keyboard press lands back on the switch after the reload.
  test('pausing motion makes scrolling instant and keeps focus', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the switch sits in the menu on phones; covered above');
    await page.goto('/privacy.html');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('smooth');
    await page.locator('#motionBtn').focus();
    await Promise.all([page.waitForEvent('load'), page.keyboard.press('Enter')]);
    await expect(page.locator('html')).toHaveAttribute('data-motion', 'off');
    await expect(page.locator('#motionBtn')).toBeFocused();
    await expect(page.locator('#motionBtn')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.locator('#motionBtn')).toHaveAttribute('aria-label', 'Pause motion');
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe('auto');
  });

  // Trusted Types are enforced: no page script may hand a string to the HTML parser.
  test('the HTML parser only takes markup from the page itself', async ({ page }) => {
    const violations = [];
    page.on('console', (m) => /Trusted Type|Content Security Policy/i.test(m.text()) && violations.push(m.text()));
    await page.goto('/');
    expect(await page.evaluate(() => { try { document.createElement('div').innerHTML = '<b>x</b>'; return 'parsed'; } catch (e) { return e.name; } })).toBe('TypeError');
    // the curve's sentence is set as text; moving the slider leaves no markup behind
    await page.locator('#cvPrice').scrollIntoViewIfNeeded();
    await page.locator('#cvPrice').focus();
    await page.keyboard.press('ArrowRight');
    await expect(page.locator('#cvSay')).toContainText('percent at par');
    expect(await page.locator('#cvSay *').count()).toBe(0);
    expect(violations).toEqual([]);
  });
});

// Print shows every answer from the stylesheet alone, before (or without) the script opening them.
test.describe('printing without the script', () => {
  test.use({ javaScriptEnabled: false });
  test('every question prints with its answer', async ({ page }) => {
    await page.goto('/');
    await page.emulateMedia({ media: 'print', reducedMotion: 'no-preference' });
    const rows = await page.$$eval('.faq details', (ds) => ds.map((d) => [d.getBoundingClientRect().height, d.querySelector('summary').getBoundingClientRect().height]));
    expect(rows.length).toBeGreaterThan(0);
    for (const [row, summary] of rows) expect(row).toBeGreaterThan(summary + 20);
  });
});

// Every published page, read from sitemap.xml so a new page is covered the day it is listed, plus the 404.
test.describe('every page in the sitemap', () => {
  const pages = [...readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>https:\/\/centamont\.com(\/[^<]*)<\/loc>/g)]
    .map((m) => m[1]).concat('/404.html');

  for (const path of pages) {
    test(`${path} renders cleanly`, async ({ page }) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
      await page.goto(path);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('h1')).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
      await expect(page.locator('body')).not.toContainText(/\[[A-Z][^\]]*\]/);
      expect(await page.evaluate(() => (document.body.innerText.match(/[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF\uE000-\uF8FF]|\uDB40[\uDC00-\uDC7F]/g) || []).length)).toBe(0);
      // a drawing of a building always says it is an illustration
      for (const cap of await page.locator('figure.elev figcaption').all()) await expect(cap).toContainText('Illustration, not a real project');
      await page.mouse.wheel(0, 4000);
      await page.waitForTimeout(300);
      expect(errors).toEqual([]);
    });
  }

  test('every internal link on every page lands on a real page and section', async ({ page, request }, info) => {
    test.skip(info.project.name !== 'desktop', 'the same links on every device, so once');
    const bodies = new Map();
    const get = async (p) => { if (!bodies.has(p)) { const r = await request.get(p); bodies.set(p, [r.status(), await r.text()]); } return bodies.get(p); };
    for (const path of pages) {
      await page.goto(path);
      const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.href).filter((h) => h.startsWith(location.origin)));
      for (const href of new Set(hrefs)) {
        const url = new URL(href);
        const [status, html] = await get(url.pathname);
        expect(status, `${path} -> ${href}`).toBe(200);
        if (url.hash.length > 1) expect(html, `${path} -> ${href}`).toContain(`id="${url.hash.slice(1)}"`);
      }
    }
  });

  // The smallest phones in use are 320 wide, and a short screen is where sticky drawings and bars run out of room.
  test('no page scrolls sideways on a 320 x 640 phone', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone only');
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of pages) {
      await page.goto(path);
      await page.mouse.wheel(0, 2000);
      await page.waitForTimeout(200);
      const r = await page.evaluate(() => ({ over: document.documentElement.scrollWidth - innerWidth, menu: document.querySelector('.menu-btn').getBoundingClientRect().right }));
      expect(r.over, path).toBeLessThanOrEqual(0);
      expect(r.menu, path).toBeLessThanOrEqual(320);
    }
  });

  // With motion reduced the story's drawing changes stage without animating; a jump from past the story back to
  // its start must still bring the first stage back, not leave the last one beside step 01.
  test('a jump back to the story shows its first stage with reduced motion', async ({ page, isMobile }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    const [y0, y1] = await page.evaluate(() => [document.getElementById('developers').offsetTop, document.getElementById('markets').offsetTop]);
    for (let y = y0; y <= y1; y += 160) { await page.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y); await page.waitForTimeout(25); }
    await expect(page.locator('#stageName')).not.toHaveText('First sketch');
    if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator('nav.main a[href="#developers"]').click();
    await expect(page.locator('#stageName')).toHaveText('First sketch');
  });

  test('the empty lot on the 404 stays inside its cell', async ({ page }) => {
    await page.goto('/404.html');
    const [fig, cell] = await page.evaluate(() => [document.querySelector('.vacant'), document.querySelector('.lot .wrap')].map((e) => { const r = e.getBoundingClientRect(); return { top: r.top + scrollY, bottom: r.bottom + scrollY }; }));
    expect(fig.top).toBeGreaterThanOrEqual(cell.top - 1);
    expect(fig.bottom).toBeLessThanOrEqual(cell.bottom + 1);
  });

  // A larger browser text size (and text-only zoom) folds the sections into the menu instead of pushing the header
  // controls off the screen, and the hidden skip link stays wholly above it.
  test('larger default text folds the nav into the menu', async ({ page, browserName }, info) => {
    test.skip(browserName !== 'chromium' || info.project.name !== 'desktop', 'sets the default text size through Chromium');
    await page.setViewportSize({ width: 1440, height: 900 });
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Page.enable');
    await cdp.send('Page.setFontSizes', { fontSizes: { standard: 32 } });
    await page.goto('/report.html');
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
    const [over, skipBottom] = await page.evaluate(() => [document.documentElement.scrollWidth - innerWidth, document.querySelector('.skip').getBoundingClientRect().bottom]);
    expect(over).toBe(0);
    expect(skipBottom).toBeLessThan(0);
  });
});
