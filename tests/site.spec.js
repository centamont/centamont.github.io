// @ts-check
import { test, expect } from '@playwright/test';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';

// Every section of the one-page centamont.com and a phrase from its heading.
const sections = [
  ['services', 'One firm, from the first sketch to the last closing'],
  ['developers', 'Your building, sold as if it were the only one we have'],
  ['clients', 'Residences that never reach the open market'],
  ['markets', 'South Florida and New York first'],
  ['journal', 'Notes on new development'],
  ['people', 'A seat here is earned'],
  ['house', 'Centum, a hundred'],
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
    // (on a wide screen the bar carries five sections; the other two are the drawer's and the footer's)
    if (!isMobile && !(await page.locator(`nav.main a[href="#${id}"]`).isVisible())) continue;
    if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator(`nav.main a[href="#${id}"]`).click();
    await expect(page.locator(`#${id} h2`).first()).toBeInViewport();
  }
});

// A far jump never flies the page through its drawings: it lands at once, the address takes the section, the focus goes
// to the section's heading, and the story's drawing shows the stage of where the reader now is.
test('a far jump lands on its heading with the story in step', async ({ page, isMobile }) => {
  await page.goto('/');
  if (isMobile) await page.getByRole('button', { name: 'Menu' }).click();
  await page.locator('nav.main a[href="#contact"]').click();
  await expect(page.locator('#contact h2.display')).toBeFocused();
  await expect(page.locator('#contact h2.display')).toBeInViewport();
  expect(new URL(page.url()).hash).toBe('#contact');
  if (isMobile) await expect(page.locator('nav.main')).toBeHidden();
  // (the header's Developers is the developer page; on the home page the services' own link leads to the story, and it is
  // pressed where it stands, far above, so the jump is a far one)
  await page.locator('#services a[href="#developers"]').dispatchEvent('click');
  await expect(page.locator('#developers h2')).toBeFocused();
  await expect(page.locator('#stageName')).toHaveText('First sketch');
  await page.locator('a.totop').click();
  await expect(page.locator('.hero h1')).toBeFocused();
  await expect.poll(() => page.evaluate(() => scrollY)).toBe(0);
  expect(new URL(page.url()).hash).toBe('#top');
});

// A jump lands a place's top at the header's foot, and the header takes that place's ground: the private door's ink, and
// the sheet for the places after the door and the name.
test('the header lands on the ground of the place it lands on', async ({ page, isMobile }) => {
  await page.goto('/');
  // (the private door from the hero's button, the close from the header's Contact)
  for (const [id, ink, from] of [['clients', true, '.hero a[href="#clients"]'], ['contact', false, 'nav.main a[href="#contact"]']]) {
    if (isMobile && from.startsWith('nav')) await page.getByRole('button', { name: 'Menu' }).click();
    await page.locator(from).click();
    await expect.poll(() => page.evaluate((id) => Math.round(document.getElementById(id).getBoundingClientRect().top), id)).toBe(64);
    if (ink) await expect(page.locator('header.site')).toHaveClass(/\bover\b/);
    else await expect(page.locator('header.site')).not.toHaveClass(/\bover\b/);
  }
});

// Headlines rise only at the place and the close (the hero's own headline rises with the curtain); every other head stands.
test('only two section headlines rise on the home page', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.tx-rise')).toHaveCount(2);
  await expect(page.locator('#markets h2')).toHaveClass(/tx-rise/);
  await expect(page.locator('#contact h2.display')).toHaveClass(/tx-rise/);
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
  // Selling: the lender's 50% threshold is met (32 of 62 residences under contract), then ground breaks (the podium framed)
  await expect.poll(built).toBe(3);
  await expect.poll(sold).toBe(32);
  // and the gauge reads what the drawing shows once it settles
  await expect.poll(() => page.locator('#gS').textContent()).toBe('32');
  await expect.poll(() => page.locator('#gB').textContent()).toBe('03');
  await page.waitForTimeout(1200);
  await page.screenshot({ path: info.outputPath('rising.png') });

  await page.evaluate(() => {
    const s = document.querySelectorAll('#steps .step')[5];
    window.scrollTo(0, s.getBoundingClientRect().top + scrollY + s.offsetHeight / 2 - innerHeight / 2);
  });
  // every residence sold, the penthouses with them; the podium and crown levels are never for sale
  await expect.poll(sold).toBe(62);
  await expect.poll(() => page.locator('#gS').textContent()).toBe('62');
});

for (const [path, heading] of [
  ['/journal/buying-pre-construction-florida.html', /Buying pre.construction in Florida/],
  ['/journal/buying-pre-construction-new-york.html', /Buying pre.construction in New York/],
  ['/journal/buying-pre-construction-texas.html', /Buying pre.construction in Texas/],
  ['/journal/buying-new-construction-california.html', /Buying new construction in California/],
  ['/new-york.html', 'New York City'],
  ['/hamptons.html', 'The Hamptons'],
  ['/privacy.html', 'Privacy'],
  ['/terms.html', 'Terms of use'],
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

test('the open phone menu says close in the page language', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  for (const [path, open, shut] of [['/', 'Menu', 'Close'], ['/es/', 'Menú', 'Cerrar'], ['/pt/', 'Menu', 'Fechar']]) {
    await page.goto(path);
    const btn = page.locator('#menuBtn');
    await expect(btn).toHaveText(open);
    await btn.click();
    await expect(btn).toHaveText(shut);
    await btn.click();
    await expect(btn).toHaveText(open);
  }
});

test('first visit plays the intro, then reveals the page', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'the intro plays only on wide screens');
  await page.addInitScript(() => sessionStorage.removeItem('cm-intro'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/intro-on/);
  await expect(page.locator('html')).not.toHaveClass(/intro-on/, { timeout: 5000 });
  await expect(page.locator('#heroModel')).toHaveAttribute('data-built', '34');
});

// The hero's tower is rendered in WebGL2 (tower3d.js) where a real GPU can afford it; the test browser's GPU is emulated
// in software, which the renderer declines, so the test asks for it outright. It takes over from the drawing without an
// error, and the drawing alone still stands where it is not asked for. (In a window narrower than the one where the
// finished tower is a photograph, so the render stays in view.)
test('hero tower renders in 3D where it can, and is drawn where it cannot', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'one engine is enough');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.setViewportSize({ width: 1100, height: 720 });
  await page.addInitScript(() => { window.__cmForce3D = true; });
  await page.goto('/');
  await expect(page.locator('#heroModel')).toHaveAttribute('data-render', '3d', { timeout: 20000 });
  // once it has faded in, the sky stands behind it as the canvas's background
  await expect.poll(() => page.locator('#heroModel').evaluate((c) => c.style.backgroundImage), { timeout: 10000 }).toContain('linear-gradient');
  expect(errors).toEqual([]);
  const plain = await page.context().newPage();
  await plain.setViewportSize({ width: 1100, height: 720 });
  await plain.goto('/');
  await expect(plain.locator('#heroModel')).toHaveAttribute('data-built', '34');
  await plain.waitForTimeout(3000);
  await expect(plain.locator('#heroModel')).not.toHaveAttribute('data-render', '3d');
  expect(await plain.locator('#heroModel').evaluate((c) => c.style.backgroundImage)).toBe('');
  await plain.close();
});

// Once built, the finished tower is a photograph (hero/), one of four picked by the hour's sun and fetched only once the
// page has loaded, on a phone as on a desktop: one file, whichever the screen.
test('the hero shows a photograph of the tower, on a phone as on a desktop', async ({ page }) => {
  const asked = [];
  page.on('request', (r) => /\/hero\/[a-z0-9-]+\.webp$/.test(r.url()) && asked.push(r.url()));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const hero = page.locator('#heroModel');
  await expect(hero).toHaveAttribute('data-built', '34');
  await expect(hero).toHaveAttribute('data-still', /^(day|morning|gold|night)$/, { timeout: 20000 });
  expect(asked).toHaveLength(1);
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
  const pages = ['/', '/journal/', '/journal/buying-pre-construction-florida.html', '/report.html', '/private-clients.html', '/privacy.html', '/404.html'];
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

test('a click skips the intro', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'the intro plays only on wide screens');
  await page.addInitScript(() => sessionStorage.removeItem('cm-intro'));
  await page.goto('/');
  await expect(page.locator('html')).toHaveClass(/intro-on/);
  await page.mouse.click(10, 10);
  await expect(page.locator('html')).not.toHaveClass(/intro-on/, { timeout: 1500 });
});

// A phone, or a link that lands mid-page, opens straight onto the page.
test('the intro waits for no one on a phone or a deep link', async ({ page }, info) => {
  await page.addInitScript(() => sessionStorage.removeItem('cm-intro'));
  await page.goto(info.project.name === 'desktop' ? '/#markets' : '/');
  await expect(page.locator('html')).not.toHaveClass(/intro-on/);
  await expect(page.locator('#heroModel')).toHaveAttribute('data-built', '34');
});

// Both buttons stand above the fold of the first screen, in every language (the Spanish and Portuguese lines run longer),
// on phones and desktops alike, once the headline and its row have risen into place.
test('the hero buttons stand above the fold', async ({ browser }, info) => {
  test.skip(info.project.name !== 'desktop', 'each window size is opened here, so one project covers them all');
  test.setTimeout(120000);
  for (const [width, height] of [[390, 844], [412, 915], [1024, 768], [1180, 820], [1280, 720], [1440, 900]]) {
    const phone = width <= 820;
    const ctx = await browser.newContext({ viewport: { width, height }, isMobile: phone, hasTouch: phone, baseURL: info.project.use.baseURL });
    await ctx.addInitScript(() => sessionStorage.setItem('cm-intro', '1'));
    const page = await ctx.newPage();
    for (const path of ['/', '/es/', '/pt/']) {
      await page.goto(path);
      await expect(page.locator('#heroModel')).toHaveAttribute('data-built', '34');
      const row = page.locator('.hero .row');
      await row.evaluate((r) => Promise.all([r, ...r.parentElement.querySelectorAll('h1 .ln > span, .lede')].flatMap((e) => e.getAnimations()).map((a) => a.finished)));
      const bottom = await row.evaluate((r) => Math.max(...[...r.querySelectorAll('.btn')].map((b) => b.getBoundingClientRect().bottom), r.getBoundingClientRect().bottom));
      expect(bottom, `${path} at ${width}x${height}`).toBeLessThanOrEqual(height);
    }
    await ctx.close();
  }
});

test('the drawings arrive and say what they show', async ({ page }) => {
  await page.goto('/');
  for (const sel of ['.doorway', '#chart', '#ruler']) {
    await page.locator(sel).scrollIntoViewIfNeeded();
    await expect(page.locator(sel)).toHaveClass(/\bin\b/);
  }
  await page.goto('/advisors.html');
  await page.locator('.table').scrollIntoViewIfNeeded();
  await expect(page.locator('.table')).toHaveClass(/\bin\b/);
  await page.goto('/');
  await expect(page.locator('#chart figcaption')).toContainText('simplified');
  await page.goto('/journal/buying-pre-construction-florida.html');
  await page.locator('.deposit').scrollIntoViewIfNeeded();
  await expect(page.locator('.deposit')).toHaveClass(/\bin\b/);
  await expect(page.locator('.deposit figcaption')).toContainText(/illustrative/i);
});

// A link can name a building and a neighborhood, but only in plain words: never a web address or a run of digits.
test('the planner takes only plain names from its link', async ({ page }) => {
  await page.goto('/planner.html?n=The%20Bayfront&w=Coconut%20Grove');
  await expect(page.locator('#plName')).toHaveValue('The Bayfront');
  await expect(page.locator('#plWhereIn')).toHaveValue('Coconut Grove');
  await page.goto('/planner.html?n=' + encodeURIComponent('Wire to 123456789') + '&w=' + encodeURIComponent('see example.com'));
  await expect(page.locator('#plName')).toHaveValue('');
  await expect(page.locator('#plWhereIn')).toHaveValue('');
});

// Inside another site's frame a page keeps nothing but a link to itself.
test('a page framed by another site shows only a link to itself', async ({ page, baseURL }) => {
  await page.setContent('<iframe src="' + baseURL + '/privacy.html" width="800" height="600"></iframe>');
  const frame = page.frameLocator('iframe');
  await expect(frame.locator('a.copy-note')).toHaveText('Open centamont.com');
  await expect(frame.locator('body > *')).toHaveCount(1);
});

// The launch planner draws a developer's own building, keeps the plan in its link, and hands its size to the letter.
test('the launch planner answers its inputs, keeps them in its link and says it is illustrative', async ({ page }) => {
  await page.goto('/planner.html?u=120&f=30&c=4');
  await expect(page.locator('#plUnitsOut')).toHaveText('120');
  await expect(page.locator('#plStack rect')).toHaveCount(120);
  const before = await page.locator('#plT').textContent();
  await page.locator('#plLoan').fill('70');
  await expect(page.locator('#plT')).not.toHaveText(before || '');
  await expect(page).toHaveURL(/[?&]l=70(&|$)/);
  await expect(page.locator('.lp-fine')).toContainText('illustrative');
  await page.locator('#plWhereIn').fill('Edgewater');
  await page.locator('#plWrite').click();
  await expect(page.locator('#letter input[name="units"]')).toHaveValue('120');
  await expect(page.locator('#letter input[name="where"]')).toHaveValue('Edgewater');
  // the planner's launch month, not a year, says when sales begin
  await expect(page.locator('#letter select[name="when"] option:checked')).toHaveText(/^in [A-Z][a-z]+ \d{4}$/);
  await expect(page).not.toHaveURL(/units=/);
});

// Each open market's sheet says when its figures hold and when they are next checked, and every figure points to a source on the page.
test('the market sheets are dated and every figure cites a source on its page', async ({ page }) => {
  for (const url of ['/south-florida.html', '/new-york.html', '/hamptons.html']) {
    await page.goto(url);
    const sheet = page.locator('aside.ms');
    await expect(sheet.locator('time')).toHaveCount(2);
    await expect(sheet.locator('dl > div')).toHaveCount(3);
    for (const href of await sheet.locator('sup a').evaluateAll(as => as.map(a => a.getAttribute('href')))) {
      await expect(page.locator(href)).toHaveCount(1);
    }
  }
});

// The header names the three languages; each translated page links to its own counterparts, and marks its own language.
test('the header switches between English, Spanish and Portuguese', async ({ page }) => {
  test.skip(test.info().project.name !== 'desktop', 'on a phone it waits inside the menu');
  await page.goto('/south-florida.html');
  await expect(page.locator('header .lang a[aria-current]')).toHaveAttribute('lang', 'en');
  await page.locator('header .lang a[hreflang="es"]').click({ force: true });
  await expect(page).toHaveURL(/\/es\/sur-de-florida\.html$/);
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.locator('header .lang a[hreflang="pt-BR"]')).toHaveAttribute('href', '/pt/sul-da-florida.html');
  await expect(page.locator('header .lang a[hreflang="en"]')).toHaveAttribute('href', '/south-florida.html');
});

// The home pages' own styles (home.css) load on the three home pages and nowhere else.
test('only the home pages load the home styles', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  const sitemap = [...readFileSync('sitemap.xml', 'utf8').matchAll(/<loc>https:\/\/centamont\.com\/([^<]*)<\/loc>/g)].map((m) => m[1] === '' || m[1].endsWith('/') ? m[1] + 'index.html' : m[1]);
  for (const p of [...sitemap, '404.html']) {
    const n = (readFileSync(p, 'utf8').match(/<link rel="stylesheet" href="[^"]*home\.css/g) || []).length;
    expect(n, p).toBe(['index.html', 'es/index.html', 'pt/index.html'].includes(p) ? 1 : 0);
  }
});

// Every page loads site.css, then only the sheets its template uses: the practice's pages (the home pages, developers,
// private clients, advisors, the markets hub, and their Spanish and Portuguese twins) practice.css, the market pages market.css, the reading pages (the journal,
// the buyer guides, privacy, terms, the not-found page) reading.css, and the specimen sheets sheet.css. A new page has to be
// placed in one of these, and every stylesheet a page names has to exist.
test('each page loads site.css and its own template sheet, and nothing else', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  const market = ['south-florida', 'new-york', 'hamptons', 'los-angeles', 'dallas', 'austin', 'houston', 'san-francisco', 'tampa', 'naples', 'orange-county', 'es/sur-de-florida', 'pt/sul-da-florida', 'es/nueva-york', 'pt/nova-york'].map((p) => p + '.html');
  const practice = ['developers', 'private-clients', 'es/clientes-privados', 'pt/clientes-privados', 'advisors', 'markets', 'es/desarrolladores', 'pt/incorporadoras', 'es/mercados', 'pt/mercados'].map((p) => p + '.html');
  const homes = ['index.html', 'es/index.html', 'pt/index.html'];
  const sheets = ['report', 'planner', 'shortlist', 'project-site'].map((p) => p + '.html');
  const reading = (p) => p.startsWith('journal/') || ['privacy.html', 'terms.html', '404.html'].includes(p) || /^(es|pt)\/comprar-/.test(p);
  const pages = ['', 'journal/', 'es/', 'pt/'].flatMap((d) => readdirSync(d || '.').filter((f) => f.endsWith('.html')).map((f) => d + f));
  for (const p of pages) {
    const want = homes.includes(p) ? ['site.css', 'practice.css', 'home.css'] : practice.includes(p) ? ['site.css', 'practice.css'] : market.includes(p) ? ['site.css', 'market.css']
      : sheets.includes(p) ? ['site.css', 'sheet.css'] : reading(p) ? ['site.css', 'reading.css'] : null;
    expect(want, `${p} belongs to no template: place it in this test and link its sheet`).not.toBeNull();
    const links = [...readFileSync(p, 'utf8').matchAll(/<link rel="stylesheet" href="([^"?]*)(?:\?[^"]*)?"/g)].map((m) => m[1]);
    expect(links.map((h) => h.split('/').pop()), p).toEqual(want);
    for (const h of links) expect(existsSync(h.startsWith('/') ? h.slice(1) : join(dirname(p), h)), `${p} links ${h}, which does not exist`).toBe(true);
  }
});

// Each translated page and its English original name one another: in the header's language switch and in the head.
test('translated pages and their originals link to one another', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  const sets = [['private-clients.html', 'es/clientes-privados.html', 'pt/clientes-privados.html'],
    ['south-florida.html', 'es/sur-de-florida.html', 'pt/sul-da-florida.html'],
    ['new-york.html', 'es/nueva-york.html', 'pt/nova-york.html'],
    ['journal/buying-pre-construction-florida.html', 'es/comprar-preconstruccion-florida.html', 'pt/comprar-na-planta-florida.html'],
    ['journal/buying-new-construction-florida.html', 'es/comprar-obra-nueva-florida.html', 'pt/comprar-imovel-novo-florida.html'],
    ['developers.html', 'es/desarrolladores.html', 'pt/incorporadoras.html'],
    ['markets.html', 'es/mercados.html', 'pt/mercados.html']];
  for (const set of sets) for (const p of set) {
    const html = readFileSync(p, 'utf8');
    const lang = (html.match(/<nav class="lang"[\s\S]*?<\/nav>/) || [''])[0];
    for (const q of set) expect(lang, `${p}: the language switch links /${q}`).toContain(`href="/${q}"`);
    for (const [hl, q] of [['en', set[0]], ['es', set[1]], ['pt-BR', set[2]], ['x-default', set[0]]])
      expect(html, `${p}: hreflang ${hl}`).toContain(`<link rel="alternate" hreflang="${hl}" href="https://centamont.com/${q}">`);
  }
});

// The specimen short list shows three residences and says its figures are invented.
test('the specimen short list shows three residences and says it is invented', async ({ page }) => {
  await page.goto('/shortlist.html');
  await expect(page.locator('.sl-res')).toHaveCount(3);
  await expect(page.locator('.rp-foot')).toContainText('invented');
  await expect(page.locator('.standfirst')).toContainText('invented');
});

// The specimen project site's register form is a demonstration: it checks its fields and confirms on the page, and
// nothing typed into it ever leaves the browser.
test('the specimen register form confirms on the page and sends nothing', async ({ page }) => {
  await page.goto('/project-site.html');
  await expect(page.locator('.rp-foot')).toContainText('invented');
  await expect(page.locator('.standfirst')).toContainText('invented');
  await page.waitForLoadState('networkidle');
  const sent = [];
  page.on('request', (r) => sent.push(r.method() + ' ' + r.url()));
  const form = page.locator('#psForm');
  await form.getByRole('button', { name: 'Register interest' }).click();
  await expect(page.locator('#psName')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#psEmailE')).not.toBeEmpty();
  await expect(page.locator('#psName')).toBeFocused();
  await page.locator('#psName').fill('Ana Ribeiro');
  await page.locator('#psEmail').fill('ana@example');
  await page.locator('#psWant').selectOption('Two bedrooms');
  await form.getByRole('button', { name: 'Register interest' }).click();
  await expect(page.locator('#psEmail')).toHaveAttribute('aria-invalid', 'true');
  await page.locator('#psEmail').fill('ana@example.com');
  await form.getByRole('button', { name: 'Register interest' }).click();
  await expect(page.locator('#psDone')).toBeVisible();
  await expect(page.locator('#psDone')).toBeFocused();
  await expect(page.locator('#psThanks')).toHaveText('Thank you, Ana.');
  await expect(page.locator('#psDone')).toContainText('sent nothing');
  await expect(form).toBeHidden();
  await page.locator('#psAgain').click();
  await expect(form).toBeVisible();
  await expect(page.locator('#psName')).toHaveValue('');
  await page.waitForTimeout(300);
  expect(sent).toEqual([]);
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

test('on a phone the price slider sits right under the sales curve', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'phone only');
  await page.goto('/');
  await page.locator('#curve').scrollIntoViewIfNeeded();
  const box = (s) => page.locator(s).boundingBox();
  const fig = await box('.cv-fig'), svg = await box('#cvSvg'), price = await box('#cvPrice'), read = await box('.cv-read'), loan = await box('#cvLoan');
  // chart, then the price slider (only its label between them), then the readings, then the lender's slider
  expect(svg.y + svg.height).toBeLessThanOrEqual(price.y);
  expect(price.y - (fig.y + fig.height)).toBeLessThan(140);
  expect(price.y + price.height).toBeLessThanOrEqual(read.y);
  expect(read.y + read.height).toBeLessThanOrEqual(loan.y);
});

test('the letter turns the fields into a message to copy', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']).catch(() => {});
  await page.goto('/');
  await page.locator('#letter').scrollIntoViewIfNeeded();
  await page.locator('#letter label', { hasText: 'A buyer' }).click();
  await expect(page.locator('#letter p[data-for="buy"]')).toBeVisible();
  await expect(page.locator('#letter p[data-for="dev"]')).toBeHidden();
  // a buyer signs with a name alone: the company blank goes with the developer's paragraph
  await expect(page.locator('#letter .sign [data-for="dev"]')).toBeHidden();
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
  await page.locator('#letter input[name="company"]').fill('Ruiz Development');
  const popup = page.waitForEvent('popup');
  await page.locator('#letter button[data-to="ig"]').click();
  // the copy settles at once (copied, or the letter shown to copy by hand), never left waiting on a prompt
  await expect(page.locator('#letterNote')).toContainText('Instagram', { timeout: 2000 });
  // and the new tab goes straight to the message
  await (await popup).waitForURL(/^https:\/\/ig\.me\/m\/centamont/, { timeout: 2000 });
  if (browserName === 'chromium') {
    await expect(page.locator('#letterNote')).toContainText('Your letter is copied');
    await context.grantPermissions(['clipboard-read']);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Dear partners,\n\nWe are developing a building in Edgewater with about 60 residences. The project is in schematic design, and we hope to launch sales next year.\n\nWith regards,\nAna Ruiz of Ruiz Development');
  }
});

// The Spanish and Portuguese developer pages write the developer's letter in their own language, reminder included.
test('the developer letter composes in Spanish and Portuguese', async ({ page, context, browserName }) => {
  await context.route('https://ig.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>Instagram</title>' }));
  page.on('popup', (p) => p.close().catch(() => {}));
  for (const [path, ask, copied, letter] of [
    ['/es/desarrolladores.html', 'Complete primero su nombre', 'Su carta está copiada', 'Estimados socios:\n\nEstamos desarrollando un edificio en Edgewater con unas 60 residencias. El proyecto está en diseño esquemático, y esperamos lanzar las ventas el próximo año.\n\nSaludos cordiales,\nAna Ruiz, de Ruiz Development'],
    ['/pt/incorporadoras.html', 'Preencha primeiro o seu nome', 'Sua carta foi copiada', 'Prezados sócios,\n\nEstamos incorporando um edifício em Edgewater com cerca de 60 residências. O projeto está em anteprojeto, e esperamos lançar as vendas no ano que vem.\n\nAtenciosamente,\nAna Ruiz, Ruiz Development']]) {
    await page.goto(path);
    await page.locator('#letter').scrollIntoViewIfNeeded();
    await expect(page.locator('#letter fieldset.as')).toBeHidden();
    await page.locator('#letter input[name="where"]').fill('Edgewater');
    await page.locator('#letter input[name="units"]').fill('60');
    await page.locator('#letter input[name="company"]').fill('Ruiz Development');
    await page.locator('#letter button[data-to="ig"]').click();
    await expect(page.locator('#letterNote')).toContainText(ask);
    await page.locator('#letter input[name="name"]').fill('Ana Ruiz');
    await page.locator('#letter button[data-to="ig"]').click();
    await expect(page.locator('#letterNote')).toContainText('Instagram');
    if (browserName === 'chromium') {
      await expect(page.locator('#letterNote')).toContainText(copied);
      await context.grantPermissions(['clipboard-read']);
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(letter);
    }
  }
});

// The private-clients page writes its own letter, already set to a buyer, without the sales curve beside it.
test('the buyer letter on private clients composes and copies', async ({ page, context, browserName }) => {
  await context.route('https://ig.me/**', (r) => r.fulfill({ status: 200, contentType: 'text/html', body: '<title>Instagram</title>' }));
  await page.goto('/private-clients.html');
  await page.locator('#letter').scrollIntoViewIfNeeded();
  await expect(page.locator('#letter fieldset.as')).toBeHidden();
  await expect(page.locator('#letter [data-for="buy"]')).toBeVisible();
  await page.locator('#letter input[name="area"]').fill('Palm Beach');
  await page.locator('#letter input[name="name"]').fill('Ana Ruiz');
  const popup = page.waitForEvent('popup');
  await page.locator('#letter button[data-to="ig"]').click();
  await expect(page.locator('#letterNote')).toContainText('Instagram', { timeout: 2000 });
  await (await popup).waitForURL(/^https:\/\/ig\.me\/m\/centamont/, { timeout: 2000 });
  if (browserName === 'chromium') {
    await expect(page.locator('#letterNote')).toContainText('Your letter is copied');
    await context.grantPermissions(['clipboard-read']);
    expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('Dear partners,\n\nI am looking for a residence in Palm Beach, with a budget of over $20 million, and hope to move within six months.\n\nWith regards,\nAna Ruiz');
  }
});

// Each page carries its own Content-Security-Policy, which allows its inline scripts by hash.
// Editing an inline script without updating that page's hash would silently switch it off.
test('every page runs under its security policy with nothing refused', async ({ page }) => {
  // some fifty pages, each loaded and scrolled, so the walk gets more than the default half minute
  test.setTimeout(120000);
  const pages = ['/', '/privacy.html', '/terms.html', '/404.html', '/private-clients.html', '/planner.html', '/shortlist.html', '/report.html', '/south-florida.html', '/new-york.html', '/hamptons.html', '/los-angeles.html', '/dallas.html', '/austin.html', '/houston.html', '/san-francisco.html', '/tampa.html', '/naples.html', '/orange-county.html', '/developers.html', '/markets.html', '/project-site.html', '/es/', '/es/clientes-privados.html', '/es/sur-de-florida.html', '/pt/', '/pt/clientes-privados.html', '/pt/sul-da-florida.html', '/es/nueva-york.html', '/pt/nova-york.html', '/es/comprar-preconstruccion-florida.html', '/es/comprar-obra-nueva-florida.html', '/pt/comprar-na-planta-florida.html', '/pt/comprar-imovel-novo-florida.html', '/es/desarrolladores.html', '/pt/incorporadoras.html', '/es/mercados.html', '/pt/mercados.html',
    '/journal/', '/journal/buying-pre-construction-florida.html', '/journal/buying-new-construction-florida.html', '/journal/buying-pre-construction-new-york.html', '/journal/buying-new-construction-new-york.html',
    '/journal/launch-price-and-the-pre-sale-threshold.html', '/journal/what-a-weekly-sales-report-should-measure.html', '/journal/launching-in-miami-and-new-york.html',
    '/journal/buying-pre-construction-texas.html', '/journal/buying-new-construction-texas.html', '/journal/buying-pre-construction-california.html', '/journal/buying-new-construction-california.html', '/journal/deposit-escrow-for-new-condominiums.html', '/journal/reading-the-pace-of-sales.html', '/journal/working-with-outside-brokers.html', '/journal/releasing-inventory-in-a-new-building.html'];
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

// Every page asks the browser to fetch the next page while a link is hovered or pressed, so the click lands at once.
// Prefetch only: a prerender would start the next page's scripts (the tower) unseen.
test('every page prefetches the page a visitor is about to open', async ({ page }) => {
  const pages = ['', 'journal/', 'es/', 'pt/'].flatMap((d) => readdirSync(d || '.').filter((f) => f.endsWith('.html')).map((f) => d + f));
  const missing = pages.filter((p) => {
    const m = readFileSync(p, 'utf8').match(/<script type="speculationrules">(.*?)<\/script>/s);
    return !m || !JSON.parse(m[1]).prefetch || JSON.parse(m[1]).prerender;
  });
  expect(missing).toEqual([]);
  await page.goto('/');
  expect(await page.evaluate(() => HTMLScriptElement.supports('speculationrules'))).toBe(true);
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

// The stylesheets and shared scripts are written, with their notes, in _src/; tools/version.py builds the copies pages load
// without them. A hand edit to a built file, or a source change without a rebuild, would ship what differs from the source.
test('the stylesheet is built from its source', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  let out = '';
  try { execFileSync('python3', ['tools/version.py', '--check'], { encoding: 'utf8' }); }
  catch (e) { out = String(e.stdout || e.message); }
  expect(out, 'a built stylesheet or script, or a ?v= token, is stale: run python3 tools/version.py').toBe('');
});

// Stylesheet and scripts are linked with one shared ?v= token taken from their contents (tools/version.py), so a
// returning visitor never pairs a new page with an old stylesheet. A change to any of them needs a new token.
test('assets carry the current version', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  const assets = ['site.css', 'site.js', 'model.js', 'instrument.js', 'tower3d.js', 'planner.js', 'home.css', 'project-site.js', 'practice.css', 'market.css', 'reading.css', 'sheet.css'];
  const h = createHash('sha256');
  for (const a of assets) h.update(readFileSync(a));
  const token = h.digest('hex').slice(0, 8);
  const pages = ['index.html', 'privacy.html', 'terms.html', '404.html', 'private-clients.html', 'planner.html', 'shortlist.html', 'report.html', 'south-florida.html', 'new-york.html', 'hamptons.html', 'los-angeles.html', 'dallas.html', 'austin.html', 'houston.html', 'san-francisco.html', 'tampa.html', 'naples.html', 'orange-county.html', 'developers.html', 'markets.html', 'project-site.html', 'es/index.html', 'es/clientes-privados.html', 'es/sur-de-florida.html', 'pt/index.html', 'pt/clientes-privados.html', 'pt/sul-da-florida.html', 'es/nueva-york.html', 'pt/nova-york.html', 'es/comprar-preconstruccion-florida.html', 'es/comprar-obra-nueva-florida.html', 'pt/comprar-na-planta-florida.html', 'pt/comprar-imovel-novo-florida.html', 'es/desarrolladores.html', 'pt/incorporadoras.html', 'es/mercados.html', 'pt/mercados.html', 'journal/index.html',
    'journal/buying-pre-construction-florida.html', 'journal/buying-new-construction-florida.html', 'journal/buying-pre-construction-new-york.html', 'journal/buying-new-construction-new-york.html', 'journal/launch-price-and-the-pre-sale-threshold.html', 'journal/what-a-weekly-sales-report-should-measure.html', 'journal/launching-in-miami-and-new-york.html', 'journal/buying-pre-construction-texas.html', 'journal/buying-new-construction-texas.html', 'journal/buying-pre-construction-california.html', 'journal/buying-new-construction-california.html', 'journal/deposit-escrow-for-new-condominiums.html', 'journal/reading-the-pace-of-sales.html', 'journal/working-with-outside-brokers.html', 'journal/releasing-inventory-in-a-new-building.html'];
  let refs = 0;
  for (const p of pages) {
    for (const m of readFileSync(p, 'utf8').matchAll(/(?:href|src)="[^"]*?(site\.css|home\.css|practice\.css|market\.css|reading\.css|sheet\.css|site\.js|model\.js|instrument\.js|planner\.js|project-site\.js)(\?v=[0-9a-f]*)?"/g)) {
      refs++;
      expect(m[2], `${p} links ${m[1]} without the current token: run python3 tools/version.py`).toBe('?v=' + token);
    }
  }
  expect(refs).toBeGreaterThanOrEqual(23);
});

// An id names one element on its page: a second one (a drawing's pattern, say) silently loses to the first, and whatever
// points at it by url(#id) takes the wrong one.
test('no page repeats an id', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  const pages = ['index.html', 'privacy.html', 'terms.html', '404.html', 'private-clients.html', 'planner.html', 'shortlist.html', 'report.html', 'south-florida.html', 'new-york.html', 'hamptons.html', 'los-angeles.html', 'dallas.html', 'austin.html', 'houston.html', 'san-francisco.html', 'tampa.html', 'naples.html', 'orange-county.html', 'developers.html', 'markets.html', 'project-site.html', 'es/index.html', 'es/clientes-privados.html', 'es/sur-de-florida.html', 'pt/index.html', 'pt/clientes-privados.html', 'pt/sul-da-florida.html', 'es/nueva-york.html', 'pt/nova-york.html', 'es/comprar-preconstruccion-florida.html', 'es/comprar-obra-nueva-florida.html', 'pt/comprar-na-planta-florida.html', 'pt/comprar-imovel-novo-florida.html', 'es/desarrolladores.html', 'pt/incorporadoras.html', 'es/mercados.html', 'pt/mercados.html', 'journal/index.html',
    'journal/buying-pre-construction-florida.html', 'journal/buying-new-construction-florida.html', 'journal/buying-pre-construction-new-york.html', 'journal/buying-new-construction-new-york.html', 'journal/launch-price-and-the-pre-sale-threshold.html', 'journal/what-a-weekly-sales-report-should-measure.html', 'journal/launching-in-miami-and-new-york.html', 'journal/buying-pre-construction-texas.html', 'journal/buying-new-construction-texas.html', 'journal/buying-pre-construction-california.html', 'journal/buying-new-construction-california.html', 'journal/deposit-escrow-for-new-condominiums.html', 'journal/reading-the-pace-of-sales.html', 'journal/working-with-outside-brokers.html', 'journal/releasing-inventory-in-a-new-building.html'];
  for (const p of pages) {
    // (a template's content is inert, apart from the page, so the not-found page's Spanish and Portuguese copies are left out)
    const ids = [...readFileSync(p, 'utf8').replace(/<template\b[\s\S]*?<\/template>/g, '').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    expect(ids.filter((v, i) => ids.indexOf(v) !== i), `${p} repeats an id`).toEqual([]);
  }
});

// A note's dates are written in five places. They must agree: the date on the page, the share tags, the structured
// data and the feed say the same published and revised days, and the sitemap never claims an older change.
test('journal dates agree everywhere they are written', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  const feed = readFileSync('journal/feed.xml', 'utf8');
  const sitemap = readFileSync('sitemap.xml', 'utf8');
  const notes = ['buying-pre-construction-florida.html', 'buying-new-construction-florida.html', 'buying-pre-construction-new-york.html', 'buying-new-construction-new-york.html', 'launch-price-and-the-pre-sale-threshold.html', 'what-a-weekly-sales-report-should-measure.html', 'launching-in-miami-and-new-york.html', 'buying-pre-construction-texas.html', 'buying-new-construction-texas.html', 'buying-pre-construction-california.html', 'buying-new-construction-california.html', 'deposit-escrow-for-new-condominiums.html', 'reading-the-pace-of-sales.html', 'working-with-outside-brokers.html', 'releasing-inventory-in-a-new-building.html'];
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
  // (past the three language links, which head the open menu)
  for (let i = 0; i < 4 && !(await page.locator('#motionBtn').evaluate((b) => b === document.activeElement)); i++) await page.keyboard.press('Tab');
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
      const label = { es: 'Ilustración, no un proyecto real', 'pt-BR': 'Ilustração, não um projeto real' }[await page.locator('html').getAttribute('lang')] || 'Illustration, not a real project';
      for (const cap of await page.locator('figure.elev figcaption').all()) await expect(cap).toContainText(label);
      await page.mouse.wheel(0, 4000);
      await page.waitForTimeout(300);
      expect(errors).toEqual([]);
    });
  }

  test('every internal link on every page lands on a real page and section', async ({ page, request }, info) => {
    test.skip(info.project.name !== 'desktop', 'the same links on every device, so once');
    test.setTimeout(90000);
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
    await page.locator('#services a[href="#developers"]').dispatchEvent('click');
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

// The developer and markets pages set their sections as ruled rows; a stylesheet change that drops those rules would
// leave them as bare stacked text, so the grid itself is checked.
test('the developer and markets pages keep their ruled rows', async ({ page }) => {
  for (const path of ['/developers.html', '/markets.html', '/es/desarrolladores.html', '/pt/incorporadoras.html', '/es/mercados.html', '/pt/mercados.html']) {
    await page.goto(path);
    await expect(page.locator('.co-row').first()).toHaveCSS('display', 'grid');
  }
});

// Every page's header names the same places: Developers and Private clients are the two pages of the practice (in the
// page's own language), and Contact is the page's own letter where it has one, the home page's letter everywhere else.
test('the header leads Developers and Private clients to their pages on every page', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  const pages = ['', 'journal/', 'es/', 'pt/'].flatMap((d) => readdirSync(d || '.').filter((f) => f.endsWith('.html')).map((f) => d + f));
  const own = { en: ['/developers.html', '/private-clients.html', '/'], es: ['/es/desarrolladores.html', '/es/clientes-privados.html', '/es/'], pt: ['/pt/incorporadoras.html', '/pt/clientes-privados.html', '/pt/'] };
  const letters = ['developers.html', 'private-clients.html', 'es/desarrolladores.html', 'es/clientes-privados.html', 'pt/incorporadoras.html', 'pt/clientes-privados.html'];
  for (const p of pages) {
    const html = readFileSync(p, 'utf8');
    const nav = html.match(/<nav class="main"[\s\S]*?<\/nav>/)[0];
    const links = [...nav.replace(/<div class="mk">[\s\S]*?<\/div><\/div>/, '').matchAll(/<a[^>]* href="([^"]*)"[^>]*>([^<]*)</g)];
    const at = (href) => new URL(href, 'https://centamont.com/' + p).pathname.replace(/index\.html$/, '');
    const [dev, pc, home] = own[p.startsWith('es/') ? 'es' : p.startsWith('pt/') ? 'pt' : 'en'];
    expect(at(links[1][1]), `${p}: ${links[1][2]}`).toBe(dev);
    expect(at(links[2][1]), `${p}: ${links[2][2]}`).toBe(pc);
    const contact = links[links.length - 1][1];
    expect(contact.endsWith('#contact'), p).toBe(true);
    expect(at(contact), `${p}: Contact`).toBe(letters.includes(p) ? '/' + p : home);
    if (letters.includes(p)) expect(html, p).toContain('id="contact"');
  }
});

// On a Spanish or Portuguese page, every link in the menu, the footer or the path that leads to a page only in English
// is marked, for the browser (hreflang) and for the reader (a small EN, and "in English" for a screen reader).
test('Spanish and Portuguese menus and footers mark their English-only links', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  const pages = ['es/', 'pt/'].flatMap((d) => readdirSync(d).filter((f) => f.endsWith('.html')).map((f) => d + f));
  for (const p of pages) {
    const html = readFileSync(p, 'utf8');
    const parts = [/<nav class="main"[\s\S]*?<\/nav>/, /<footer>[\s\S]*?<\/footer>/, /<nav class="crumbs"[\s\S]*?<\/nav>/].map((r) => (html.match(r) || [''])[0]).join('');
    for (const m of parts.matchAll(/<a href="(\/[^"]*)"([^>]*)>([\s\S]*?)<\/a>/g)) {
      const [, href, attrs, body] = m;
      if (href === '/' || /^\/(es|pt)\//.test(href) || / lang="/.test(attrs)) continue;
      expect(attrs, `${p}: ${href}`).toContain('hreflang="en"');
      expect(body, `${p}: ${href}`).toContain('class="en-tag"');
    }
  }
});

// GitHub Pages answers every missing address with /404.html; under /es/ or /pt/ the page reads in that language, and
// in any language it offers the practice's four ways in.
test('the not-found page answers in the language of the address', async ({ page }) => {
  const body = readFileSync('404.html');
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  for (const [path, lang, h1, dev] of [['/es/no-existe', 'es', 'Esta página nunca se construyó.', '/es/desarrolladores.html'], ['/pt/nao-existe', 'pt-BR', 'Esta página nunca foi construída.', '/pt/incorporadoras.html'], ['/no-such-page', 'en', 'This page was never built.', '/developers.html']]) {
    await page.route('**' + path, (r) => r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body }));
    await page.goto(path);
    await expect(page.locator('html')).toHaveAttribute('lang', lang);
    await expect(page.locator('h1')).toHaveText(h1);
    await expect(page.locator('.ways a')).toHaveCount(4);
    await expect(page.locator('.ways a').first()).toHaveAttribute('href', dev);
    await expect(page.locator('header nav.main > a').nth(1)).toHaveAttribute('href', dev);
    expect(await page.locator('[id]').evaluateAll((els) => els.map((e) => e.id).filter((v, i, a) => a.indexOf(v) !== i))).toEqual([]);
  }
  expect(errors).toEqual([]);
});

// The share cards stay small enough for a messaging app to show them, the descriptions short enough for a search result,
// and no image is both lazy and first in line (lazy loading hides it from the preload scanner, so the priority does nothing).
test('share cards, descriptions and the first image stay within their limits', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  const pages = ['', 'journal/', 'es/', 'pt/'].flatMap((d) => readdirSync(d || '.').filter((f) => f.endsWith('.html')).map((f) => d + f));
  for (const p of pages) {
    const html = readFileSync(p, 'utf8');
    const img = (html.match(/<meta property="og:image" content="https:\/\/centamont\.com\/([^"?]*)/) || [])[1];
    if (img) expect(statSync(img).size, `${p}: ${img}`).toBeLessThanOrEqual(250 * 1024);
    const d = (html.match(/<meta name="description" content="([^"]*)"/) || [])[1];
    if (d) expect(d.replace(/&[a-z#0-9]+;/g, '.').length, `${p}: description`).toBeLessThanOrEqual(160);
    for (const tag of html.matchAll(/<img\b[^>]*>/g)) expect(/fetchpriority="high"/.test(tag[0]) && /loading="lazy"/.test(tag[0]), `${p}: ${tag[0].slice(0, 80)}`).toBe(false);
  }
});

// The developer notes read in sequence: from the newest, each one's Next note leads on until every note is read.
test('every developer note is reached by following Next from the newest', async ({}, info) => {
  test.skip(info.project.name !== 'desktop', 'file check, once');
  const index = readFileSync('journal/index.html', 'utf8');
  const list = index.slice(index.indexOf('id="developer-notes"'), index.indexOf('id="buyer-guides"'));
  const notes = [...list.matchAll(/<li><a href="([^"]+\.html)"/g)].map((m) => m[1]);
  expect(notes.length).toBeGreaterThan(3);
  const seen = [];
  for (let n = notes[0]; n && notes.includes(n) && !seen.includes(n);) {
    seen.push(n);
    n = (readFileSync('journal/' + n, 'utf8').match(/<a class="next" href="([^"]+)"/) || [])[1];
  }
  expect([...seen].sort()).toEqual([...notes].sort());
});

// On a wide screen a market's neighborhoods stand in a column whose captions hang into the margin: nothing scrolls, so
// it is no tab stop. On a phone the row scrolls sideways and takes the focus.
test('the neighborhoods are a tab stop only where they scroll', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop', 'sets its own widths');
  for (const [w, stop] of [[1440, false], [390, true]]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.goto('/new-york.html');
    await page.waitForLoadState('load');
    expect(await page.locator('.hoods').first().getAttribute('tabindex'), `${w}px`).toBe(stop ? '0' : null);
  }
});
