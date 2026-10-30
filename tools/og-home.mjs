// The share card (1200 × 630) of the home pages, which the privacy, terms and 404 pages share too, in
// English, Spanish and Portuguese. A preview is seen small (a chat bubble, a search result, a square crop in WhatsApp
// or Google's lens), so the card says one thing at any size: the stacked lockup, centred, on ink, over the words of the
// practice, with Brickell at night across Biscayne Bay rising from the foot of the card. Everything that matters stands
// inside the middle 630 × 630, so a square crop keeps it whole. The mark and wordmark are read from index.html, the
// photograph is the one the South Florida page carries (already through tools/grade.py), and nothing is copied by hand.
// Run it from the repo root, then raise the ?v= on the pages' og:image:
//   node tools/og-home.mjs        writes og.jpg and its es/ and pt/ twins, and the old og.png and og-site.png names as
//                                 small PNGs of the same card, for links shared before the change
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const W = 1200, H = 630;
const MAX_KB = 240; // the site's test allows 250 KB a card
const PHOTO = 'media/brickell-night-2400.jpg';

// the line under the lockup, in each language
const WORDS = {
  en: 'New development · Private clients',
  es: 'Nuevos desarrollos · Clientes privados',
  pt: 'Lançamentos · Clientes privados',
};
// each language's card goes beside its pages
const OUT = { en: '', es: 'es/', pt: 'pt/' };

// The photograph is set 1200 wide: its tallest towers stand 130px below its top edge and the bay begins at 345px, so
// set from y 185 the towers rise to y 315, clear of the line of words, and the lit water fills the last 100px. The
// sky above the towers is taken down to ink, so the photograph has no edge.
const CSS = `
@font-face{font-family:Jost;font-weight:500;src:url(/fonts/jost-latin-500-normal.woff2) format("woff2")}
*{margin:0;box-sizing:border-box}
html,body{width:${W}px;height:${H}px;overflow:hidden;background:#14161A}
.ph{position:absolute;left:0;right:0;top:185px;bottom:0;background:url(/${PHOTO}) 50% 0/1200px auto no-repeat;filter:saturate(.9)}
.ph::after{content:"";position:absolute;inset:0;background:linear-gradient(#14161A,#14161A 14%,rgba(20,22,26,.72) 30%,rgba(20,22,26,.12) 45%,rgba(20,22,26,0) 60%,rgba(20,22,26,0) 78%,rgba(20,22,26,.45))}
.vel{position:absolute;inset:0;background:url(/grain.png);opacity:.08}
.lk{position:absolute;left:0;right:0;top:44px;display:flex;flex-direction:column;align-items:center}
.lk .sym{width:146px;height:auto;color:#B8976A}
.lk .wm{width:410px;height:auto;margin-top:40px;color:#F4F0E8}
.rule{position:absolute;left:576px;width:48px;top:252px;height:1px;background:#B8976A}
.line{position:absolute;left:0;right:0;top:270px;text-align:center;font:500 14px/1 Jost;letter-spacing:.32em;text-transform:uppercase;color:#E4DCCB;padding-left:.32em}`;

// ---- Playwright, from the repo or from NODE_PATH, and a browser: Playwright's own, else a Chromium found on the machine
async function chromiumLib() {
  try { return (await import('@playwright/test')).chromium; } catch {}
  const dirs = [...(process.env.NODE_PATH || '').split(':').filter(Boolean), '/opt/node22/lib/node_modules', '/opt/node-tools/node_modules'];
  for (const d of dirs) for (const name of ['@playwright/test', 'playwright']) {
    try { return createRequire(join(d, 'noop.js'))(name).chromium; } catch {}
  }
  throw new Error('Playwright not found: run `npm ci`, or set NODE_PATH to a folder that holds playwright');
}
async function launch(chromium) {
  try { return await chromium.launch(); } catch (e) {
    for (const exe of ['/opt/pw-browsers/chromium-1194/chrome-linux/chrome', '/opt/pw-browsers/chromium']) {
      if (existsSync(exe) && statSync(exe).isFile()) { try { return await chromium.launch({ executablePath: exe }); } catch {} }
    }
    throw e;
  }
}

// ---- a static server for the repo, which also serves the card itself
const TYPES = { '.html': 'text/html; charset=utf-8', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg' };
let cardHtml = '';
const server = createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p === '/__card.html') { res.writeHead(200, { 'content-type': TYPES['.html'] }); res.end(cardHtml); return; }
  const f = resolve(ROOT, '.' + p);
  if (!f.startsWith(ROOT + sep) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

// the mark and the wordmark, as the header draws them
const home = readFileSync(resolve(ROOT, 'index.html'), 'utf8');
const sym = home.match(/<svg class="sym"[\s\S]*?<\/svg>/)[0];
const wm = home.match(/<svg class="wm"[\s\S]*?<\/svg>/)[0].replace(/ id="[^"]*"/g, '');

const browser = await launch(await chromiumLib());
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });

async function jpeg(out) {
  let q = 92, buf;
  for (; q >= 60; q -= 4) {
    buf = await page.screenshot({ type: 'jpeg', quality: q });
    if (buf.length <= MAX_KB * 1024) break;
  }
  writeFileSync(resolve(ROOT, out), buf);
  console.log(`${out}  ${Math.round(buf.length / 1024)} KB  (quality ${q})`);
}

for (const [lang, dir] of Object.entries(OUT)) {
  cardHtml = `<!doctype html><html lang="${lang}"><meta charset="utf-8"><style>${CSS}</style><div class="ph"></div><div class="vel"></div><div class="lk">${sym}${wm}</div><i class="rule"></i><p class="line">${WORDS[lang]}</p>`;
  await page.goto(BASE + '__card.html', { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await jpeg(`${dir}og.jpg`);
  // the old names, for previews cached before the change: the same card, as a PNG at half size
  const small = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 0.5 });
  await small.goto(BASE + '__card.html', { waitUntil: 'load' });
  await small.evaluate(() => document.fonts.ready);
  const png = await small.screenshot({ type: 'png' });
  await small.close();
  for (const name of ['og.png', 'og-site.png']) writeFileSync(resolve(ROOT, dir + name), png);
}
await browser.close();
server.close();
