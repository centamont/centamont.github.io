// Share cards (1200 × 630) for the pages that are neither a market nor a note: the developer page, the markets hub, the
// advisors, the journal's index, the launch planner, the weekly report and the project site, with their Spanish and
// Portuguese twins. They follow the market cards: an ivory sheet with the lockup at the top left, the page's sheet
// at the top right, the page's own title, and the page's own drawing, lifted from the page as it stands today (drawn at
// twice the size, in its finished state, without the vellum, which the card lays back over the whole sheet). Nothing is
// copied by hand, so when a page's title or drawing changes, running this again redraws its card. Run it from the repo
// root, then raise the ?v= on the pages' og:image and twitter:image:
//   node tools/og-pages.mjs              writes every card below
//   node tools/og-pages.mjs planner      writes only the cards whose page or file name holds one of the words given
//
// Two layouts: `side`, the title on the left and the drawing on the right, standing on the foot of the card's margin;
// and `band`, the title across the top and the drawing in a band under it, centred. The title is set at the largest
// size, from 76px down, at which it fits its column in at most three lines (two in a band; one over the markets map,
// which needs the height).
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const W = 1200, H = 630, M = 64;
const MAX_KB = 240; // the site's test allows 250 KB a card

const SHEET = { en: 'Sheet', es: 'Lámina', pt: 'Prancha' };
const SPECIMEN = { en: 'A specimen, with invented figures', es: 'Un ejemplo, con cifras inventadas', pt: 'Um exemplo, com números inventados' };
// page, card, the drawing (a selector on the page), the layout, the sheet's number and name in the page's language,
// whether it is a specimen, and whether the drawing is a plate with a ground of its own (the map, the report's chart,
// the facade), which then sits between the four corner ticks every figure on the site has, 8px clear of it
const CARDS = [
  { page: 'developers.html', out: 'og-developers.jpg', sel: 'figure.dv-rise-f', lay: 'band', n: '02', name: 'Developers' },
  { page: 'es/desarrolladores.html', out: 'es/og-desarrolladores.jpg', sel: 'figure.dv-rise-f', lay: 'band', n: '02', name: 'Desarrolladores' },
  { page: 'pt/incorporadoras.html', out: 'pt/og-incorporadoras.jpg', sel: 'figure.dv-rise-f', lay: 'band', n: '02', name: 'Incorporadoras' },
  { page: 'markets.html', out: 'og-markets.jpg', sel: 'svg.ov', lay: 'band', ticks: true, lines: 1, n: '04', name: 'Markets' },
  { page: 'es/mercados.html', out: 'es/og-mercados.jpg', sel: 'svg.ov', lay: 'band', ticks: true, lines: 1, n: '04', name: 'Mercados' },
  { page: 'pt/mercados.html', out: 'pt/og-mercados.jpg', sel: 'svg.ov', lay: 'band', ticks: true, lines: 1, n: '04', name: 'Mercados' },
  { page: 'journal/index.html', out: 'og-journal.jpg', sel: 'svg.pl-hero', lay: 'side', n: '05', name: 'Journal' },
  { page: 'planner.html', out: 'og-planner.jpg', sel: '#plSvg', lay: 'side', n: '06', name: 'Launch planner' },
  { page: 'es/planificador.html', out: 'es/og-planificador.jpg', sel: '#plSvg', lay: 'side', n: '06', name: 'Planificador' },
  { page: 'pt/planejador.html', out: 'pt/og-planejador.jpg', sel: '#plSvg', lay: 'side', n: '06', name: 'Planejador' },
  { page: 'report.html', out: 'og-report.jpg', sel: 'svg.rp-pace', lay: 'side', ticks: true, n: '07', name: 'Weekly report', specimen: true },
  { page: 'es/informe-semanal.html', out: 'es/og-informe-semanal.jpg', sel: 'svg.rp-pace', lay: 'side', ticks: true, n: '07', name: 'Informe semanal', specimen: true },
  { page: 'pt/relatorio-semanal.html', out: 'pt/og-relatorio-semanal.jpg', sel: 'svg.rp-pace', lay: 'side', ticks: true, n: '07', name: 'Relatório semanal', specimen: true },
  { page: 'project-site.html', out: 'og-project-site.jpg', sel: 'svg.ps-fa', lay: 'side', ticks: true, n: '09', name: 'Project site', specimen: true },
  { page: 'advisors.html', out: 'og-advisors.jpg', sel: 'svg.full', lay: 'band', n: '10', name: 'Advisors' },
  { page: 'es/asesores.html', out: 'es/og-asesores.jpg', sel: 'svg.full', lay: 'band', n: '10', name: 'Asesores' },
  { page: 'pt/consultores.html', out: 'pt/og-consultores.jpg', sel: 'svg.full', lay: 'band', n: '10', name: 'Consultores' },
];

const CSS = `
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:var(--bg)}
.og{position:relative;width:${W}px;height:${H}px;overflow:hidden}
.og .top{position:absolute;left:${M}px;right:${M}px;top:52px;display:flex;justify-content:space-between;align-items:flex-end}
.og .mark{--sym:40px;--wm:24px;--cap:3px;translate:none;padding:0;margin:0;color:var(--fg)}
.og .mark::before{display:none}
.og .lab{font:500 17px/1 var(--body);letter-spacing:.2em;text-transform:uppercase;color:var(--faint)}
.og .tt{position:absolute;left:${M - 4}px;top:128px}
.og h1{margin:0;font:300 76px/1.04 var(--display);letter-spacing:-.01em;color:var(--fg);text-wrap:balance}
.og p.sub{margin:22px 0 0 4px;font:500 17px/1 var(--body);letter-spacing:.16em;text-transform:uppercase;color:var(--muted)}
.og img.dr{position:absolute;object-fit:contain}
.og i.tk{position:absolute;width:14px;height:14px;border:0 solid var(--faint)}`;

// ---- Playwright, from the repo or from NODE_PATH, and a browser: Playwright's own, else a Chromium found on the machine
async function chromiumLib() {
  try { return (await import('@playwright/test')).chromium; } catch {}
  const dirs = [...(process.env.NODE_PATH || '').split(':').filter(Boolean), '/opt/node22/lib/node_modules'];
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

// ---- a static server for the repo (the es/ and pt/ pages link their sheets from the site root)
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.avif': 'image/avif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json' };
const server = createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  const f = resolve(ROOT, '.' + p);
  if (!f.startsWith(ROOT + sep) || !existsSync(f) || statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream' });
  res.end(readFileSync(f));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const BASE = `http://127.0.0.1:${server.address().port}/`;

const chromium = await chromiumLib();
const browser = await launch(chromium);
// the drawing is read from the page at 1440 wide, twice over, with motion reduced so every drawing stands finished
const big = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light', reducedMotion: 'reduce', bypassCSP: true });
const card = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce', bypassCSP: true });
for (const c of [big, card]) await c.route('**/tower3d.js', (r) => r.abort());

async function drawing(c) {
  const page = await big.newPage();
  await page.goto(BASE + c.page, { waitUntil: 'load' });
  const el = page.locator(c.sel).first();
  await el.scrollIntoViewIfNeeded();
  // no vellum (the card lays its own over the whole sheet) and no header over the drawing
  await page.addStyleTag({ content: 'body::after,header.site::after{display:none!important}header.site{visibility:hidden!important}' });
  await page.waitForTimeout(1200);
  const box = await el.boundingBox();
  const png = await el.screenshot();
  const title = await page.evaluate(() => document.querySelector('main h1').textContent.replace(/\s+/g, ' ').trim());
  const mark = await page.evaluate(() => document.querySelector('a.mark').outerHTML);
  await page.close();
  return { png, w: box.width, h: box.height, title, mark };
}

async function save(page, out) {
  let q = 90, buf;
  for (; q >= 60; q -= 4) {
    buf = await page.screenshot({ type: 'jpeg', quality: q });
    if (buf.length <= MAX_KB * 1024) break;
  }
  writeFileSync(resolve(ROOT, out), buf);
  console.log(`${out}  ${Math.round(buf.length / 1024)} KB  (quality ${q})`);
}

const only = process.argv.slice(2);
for (const c of CARDS.filter((c) => !only.length || only.some((w) => c.page.includes(w) || c.out.includes(w)))) {
  const lang = c.page.startsWith('es/') ? 'es' : c.page.startsWith('pt/') ? 'pt' : 'en';
  const d = await drawing(c);
  const page = await card.newPage();
  await page.goto(BASE + c.page, { waitUntil: 'load' });
  const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  await page.evaluate(([css, html]) => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
    document.body.className = '';
    document.body.innerHTML = html;
  }, [CSS, `<div class="og"><div class="top">${d.mark}<span class="lab">${SHEET[lang]} ${c.n} · ${esc(c.name)}</span></div><div class="tt"><h1>${esc(d.title)}</h1>${c.specimen ? `<p class="sub">${SPECIMEN[lang]}</p>` : ''}</div><img class="dr" alt="" src="data:image/png;base64,${d.png.toString('base64')}"></div>`]);
  await page.evaluate(() => document.fonts.ready);
  // the title: the largest size that keeps it to its lines in its column
  const col = c.lay === 'side' ? 560 : W - 2 * M;
  const lines = c.lines || (c.lay === 'side' ? 3 : 2);
  const tb = await page.evaluate(([col, lines]) => {
    const h = document.querySelector('.og h1'), tt = document.querySelector('.og .tt');
    tt.style.width = col + 'px';
    let s = 76;
    for (; s > 44; s -= 2) { h.style.fontSize = s + 'px'; if (h.getBoundingClientRect().height <= s * 1.04 * lines + 2) break; }
    const r = tt.getBoundingClientRect();
    return { bottom: r.bottom, size: s };
  }, [col, lines]);
  // the drawing: as large as its box allows, never larger than it stands on the page
  const box = c.lay === 'side'
    ? { x: 640, y: 128, w: W - M - 640, h: H - 40 - 128 }
    : { x: M, y: Math.ceil(tb.bottom) + 40, w: W - 2 * M, h: H - 40 - Math.ceil(tb.bottom) - 40 };
  if (c.ticks) { box.x += 8; box.y += 8; box.w -= 16; box.h -= 16; }
  const s = Math.min(box.w / d.w, box.h / d.h, 1);
  const w = d.w * s, h = d.h * s;
  const x = c.lay === 'side' ? box.x + box.w - w : box.x + (box.w - w) / 2;
  const y = box.y + box.h - h;
  await page.evaluate(([x, y, w, h, ticks]) => {
    Object.assign(document.querySelector('.og img.dr').style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
    if (!ticks) return;
    const og = document.querySelector('.og'), g = 8;
    for (const [l, t, side] of [[x - g, y - g, 'top left'], [x + w + g - 14, y - g, 'top right'], [x - g, y + h + g - 14, 'bottom left'], [x + w + g - 14, y + h + g - 14, 'bottom right']]) {
      const i = document.createElement('i');
      i.className = 'tk';
      i.style.left = l + 'px'; i.style.top = t + 'px';
      for (const s of side.split(' ')) i.style['border' + s[0].toUpperCase() + s.slice(1) + 'Width'] = '1px';
      og.append(i);
    }
  }, [x, y, w, h, !!c.ticks]);
  await page.evaluate(() => document.querySelector('.og img.dr').decode());
  await save(page, c.out);
  console.log(`   title ${tb.size}px, drawing at ${Math.round(s * 100)}%`);
  await page.close();
}
await browser.close();
server.close();
