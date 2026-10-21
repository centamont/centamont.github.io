// Share cards (1200 × 630) for the market pages, drawn from each page's own skyline. A market page opens on its city seen
// from the water (the `svg.mk-el` elevation under the opening photograph); this lifts that drawing out of the page as it
// stands today and sets it on the ivory market card: the wordmark and "Market note" across the top, the city and its
// neighborhoods on the left, the elevation along the foot of the card. Nothing is copied by hand, so when a skyline is
// redrawn, running this again redraws its card. Run it from the repo root, then raise the ?v= on the pages' og:image
// (and twitter:image where a page has one):
//   node tools/og-markets.mjs            writes every card below
//   node tools/og-markets.mjs austin     writes only the cards whose page or file name holds one of the words given
//
// How the drawing is placed: the elevation is first drawn alone on white and read column by column for the top of its
// ink. The card then takes the largest scale (at most the page's own, 1:1 on a 1200-wide card) and the least trim of the
// water at its foot at which no column rises into the title and its line (with a clear margin), nor into the wordmark
// row, so the tallest tower and the ruler's top figure always stand whole inside the frame. Where the drawing has to be
// set smaller than the card is wide, its ground line and water are carried on to both edges.
//
// Beside the market cards it makes two journal cards that are built from the same sources: the Miami and New York note
// (the two elevations side by side, at one scale in feet, read from their rulers) and the Texas buyer guide, whose
// photograph panel is refilled from the page's current opening photograph (the ink half of that card is kept as it is).
//
// The Spanish and Portuguese cards are drawn here too, from their own pages, so their rulers
// and water names read in the page's language.
//
// It needs Playwright: from the repo's own node_modules (npm ci), or from a folder named in NODE_PATH. It serves the repo
// on a local port, since the es/ and pt/ pages link their sheets from the site root.
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, resolve, sep } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const W = 1200, H = 630;
const MAX_KB = 240; // the site's test allows 250 KB a card; WhatsApp drops a preview much past 300 KB

// Each market card: the page it is drawn from, the file it writes, the line under the city (the city itself is the
// page's own h1), and, for the translated pages, the label in their language.
const MARKETS = [
  { page: 'south-florida.html', out: 'og-south-florida.jpg', sub: 'Miami, Fort Lauderdale and West Palm Beach' },
  { page: 'new-york.html', out: 'og-new-york.jpg', sub: 'Manhattan’s new condominiums' },
  { page: 'naples.html', out: 'og-naples.jpg', sub: 'Pelican Bay, Park Shore and the Old Town' },
  { page: 'tampa.html', out: 'og-tampa.jpg', sub: 'Water Street, Harbour Island and Bayshore' },
  { page: 'dallas.html', out: 'og-dallas.jpg', sub: 'Uptown, Turtle Creek and Downtown' },
  { page: 'houston.html', out: 'og-houston.jpg', sub: 'Uptown, River Oaks and the Museum District' },
  { page: 'austin.html', out: 'og-austin.jpg', sub: 'Rainey Street, Second Street and Downtown' },
  { page: 'los-angeles.html', out: 'og-los-angeles.jpg', sub: 'The Westside and Downtown' },
  { page: 'orange-county.html', out: 'og-orange-county.jpg', sub: 'Newport Beach, Irvine and Laguna Beach' },
  { page: 'san-francisco.html', out: 'og-san-francisco.jpg', sub: 'Rincon Hill, Mission Bay and Nob Hill' },
  { page: 'hamptons.html', out: 'og-hamptons.jpg', sub: 'Southampton, East Hampton and the South Fork' },
  { page: 'es/sur-de-florida.html', out: 'es/og-sur-de-florida.jpg', sub: 'Miami, Fort Lauderdale y West Palm Beach', label: 'Nota de mercado' },
  { page: 'pt/sul-da-florida.html', out: 'pt/og-sul-da-florida.jpg', sub: 'Miami, Fort Lauderdale e West Palm Beach', label: 'Nota de mercado' },
  { page: 'es/nueva-york.html', out: 'es/og-nueva-york.jpg', sub: 'Los condominios nuevos de Manhattan', label: 'Nota de mercado' },
  { page: 'pt/nova-york.html', out: 'pt/og-nova-york.jpg', sub: 'Os novos condomínios de Manhattan', label: 'Nota de mercado' },
  { page: 'es/hamptons.html', out: 'es/og-hamptons.jpg', sub: 'Southampton, East Hampton y el South Fork', label: 'Nota de mercado' },
  { page: 'pt/hamptons.html', out: 'pt/og-hamptons.jpg', sub: 'Southampton, East Hampton e o South Fork', label: 'Nota de mercado' },
  { page: 'es/los-angeles.html', out: 'es/og-los-angeles.jpg', sub: 'El Westside y Downtown', label: 'Nota de mercado' },
  { page: 'pt/los-angeles.html', out: 'pt/og-los-angeles.jpg', sub: 'O Westside e Downtown', label: 'Nota de mercado' },
  { page: 'es/san-francisco.html', out: 'es/og-san-francisco.jpg', sub: 'Rincon Hill, Mission Bay y Nob Hill', label: 'Nota de mercado' },
  { page: 'pt/san-francisco.html', out: 'pt/og-san-francisco.jpg', sub: 'Rincon Hill, Mission Bay e Nob Hill', label: 'Nota de mercado' },
  { page: 'es/orange-county.html', out: 'es/og-orange-county.jpg', sub: 'Newport Beach, Irvine y Laguna Beach', label: 'Nota de mercado' },
  { page: 'pt/orange-county.html', out: 'pt/og-orange-county.jpg', sub: 'Newport Beach, Irvine e Laguna Beach', label: 'Nota de mercado' },
  { page: 'es/dallas.html', out: 'es/og-dallas.jpg', sub: 'Uptown, Turtle Creek y Downtown', label: 'Nota de mercado' },
  { page: 'pt/dallas.html', out: 'pt/og-dallas.jpg', sub: 'Uptown, Turtle Creek e Downtown', label: 'Nota de mercado' },
  { page: 'es/austin.html', out: 'es/og-austin.jpg', sub: 'Rainey Street, Second Street y Downtown', label: 'Nota de mercado' },
  { page: 'pt/austin.html', out: 'pt/og-austin.jpg', sub: 'Rainey Street, Second Street e Downtown', label: 'Nota de mercado' },
  { page: 'es/houston.html', out: 'es/og-houston.jpg', sub: 'Uptown, River Oaks y el Museum District', label: 'Nota de mercado' },
  { page: 'pt/houston.html', out: 'pt/og-houston.jpg', sub: 'Uptown, River Oaks e o Museum District', label: 'Nota de mercado' },
  { page: 'es/tampa.html', out: 'es/og-tampa.jpg', sub: 'Water Street, Harbour Island y Bayshore', label: 'Nota de mercado' },
  { page: 'pt/tampa.html', out: 'pt/og-tampa.jpg', sub: 'Water Street, Harbour Island e Bayshore', label: 'Nota de mercado' },
  { page: 'es/naples.html', out: 'es/og-naples.jpg', sub: 'Pelican Bay, Park Shore y el casco antiguo', label: 'Nota de mercado' },
  { page: 'pt/naples.html', out: 'pt/og-naples.jpg', sub: 'Pelican Bay, Park Shore e o centro histórico', label: 'Nota de mercado' },
];

// The journal note that sets the two launch cities side by side.
const PAIR = {
  page: 'journal/launching-in-miami-and-new-york.html', out: 'og-journal-miami-new-york.jpg',
  title: 'Miami and New York', sub: 'Launching a new condominium in each city, side by side', label: 'Developer note',
  sides: [{ page: 'south-florida.html', city: 'Miami' }, { page: 'new-york.html', city: 'New York' }],
};

// Journal cards whose right-hand panel is the page's opening photograph: the card file is both the base and the output,
// and the panel (from x to the right edge) is refilled with the photograph, cropped to cover it about `focus`.
const PLATES = [
  { page: 'journal/buying-new-construction-texas.html', out: 'og-journal-new-construction-texas.jpg', x: 770, focus: '46% 50%' },
];

// ---- the layout of the market card (the title block is measured on the card, so a long city name is allowed for)
const ROW_FLOOR = 122; // nothing of the drawing above this: the wordmark and the label sit in the row above it
const TEXT_GAP = 34; // the clear margin kept under and beside the title block
const CROP_MAX = 34; // at most this much of the water under the ground line is trimmed (in the drawing's units),
const WATER_MIN = 32; // and never so much that less than this many pixels of water stay under the ground line
const S_MIN = 0.6;

const CSS = `
html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden;background:var(--bg)}
.og{position:relative;width:${W}px;height:${H}px;overflow:hidden}
.og .top{position:absolute;left:64px;right:64px;top:52px;display:flex;justify-content:space-between;align-items:flex-end}
.og .mark{--sym:40px;--wm:24px;--cap:3px;translate:none;padding:0;margin:0;color:var(--fg)}
.og .mark::before{display:none}
.og .lab{font:500 17px/1 var(--body);letter-spacing:.2em;text-transform:uppercase;color:var(--faint)}
.og h1{position:absolute;left:60px;top:120px;margin:0;font:300 104px/1 var(--display);letter-spacing:-.01em;color:var(--fg);max-width:none;white-space:nowrap}
.og p.sub{position:absolute;left:66px;top:236px;margin:0;font:400 26px/1.3 var(--body);color:var(--muted);white-space:nowrap}
.og svg.mk-el{position:absolute;bottom:0;aspect-ratio:auto;max-width:none;overflow:hidden;--fu:calc(1.25 / var(--s,1))}
.og svg.mk-el text{font-size:calc(14px / var(--s,1));letter-spacing:.16em}
.og svg.mk-el .rl text{letter-spacing:.06em}
.og svg.mk-el text.wl{font-size:calc(12.5px / var(--s,1))}
.og .city{position:absolute;bottom:16px;font:500 15px/1 var(--body);letter-spacing:.2em;text-transform:uppercase;color:var(--faint);background:var(--bg);padding:2px 10px}
html.probe,html.probe body{background:#fff}
html.probe body::after{display:none}
html.probe .og>:not(svg){visibility:hidden}`;

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

// ---- a static server for the repo
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.avif': 'image/avif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
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

// ---- what a page gives the card: its elevation, its wordmark, its title, its ruler
function source(page) {
  const html = readFileSync(resolve(ROOT, page), 'utf8');
  const svg = (html.match(/<svg class="mk-el"[\s\S]*?<\/svg>/) || [])[0];
  if (!svg) throw new Error(`${page}: no svg.mk-el elevation`);
  const mark = html.match(/<a class="mark"[\s\S]*?<\/a>/)[0];
  const title = html.match(/<main[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/)[1].replace(/<[^>]+>/g, '').replace(/&nbsp;|\s+/g, ' ').trim();
  const align = (svg.match(/preserveAspectRatio="(x\w{2}\d?)/) || [, 'xMid'])[1].slice(0, 4);
  const [vw, vh] = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).slice(1).map(Number);
  const ground = +((svg.match(/class="pf"[^>]*d="M[-\d.]+ ([\d.]+)H/) || [, vh * 0.85])[1]);
  // the ruler: drawing units per foot, from its lowest and highest figures
  const rl = [...((svg.match(/<g class="rl">([\s\S]*?)<\/g>/) || [, ''])[1]).matchAll(/y="([\d.]+)"[^>]*>([^<]+)</g)].map((m) => [+m[1], +m[2].replace(/\D/g, '')]);
  const perFt = rl.length > 1 ? (rl[0][0] - rl.at(-1)[0]) / (rl.at(-1)[1] - rl[0][1]) : null;
  return { html, svg, mark, title, align, vw, vh, ground, perFt };
}

const chromium = await chromiumLib();
const browser = await launch(chromium);
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, colorScheme: 'light', reducedMotion: 'reduce', javaScriptEnabled: false, bypassCSP: true });
const scratch = await browser.newPage(); // a plain page with scripts on, for reading pixels

// Read a drawing's skyline: for each column of the drawing (1 unit = 1 px), the first row with ink in it.
async function skyline(page, sel, vw, vh) {
  await page.evaluate(([sel, vw, vh]) => {
    document.documentElement.classList.add('probe');
    const s = document.querySelector(sel);
    s.dataset.style = s.getAttribute('style') || '';
    s.dataset.vb = s.getAttribute('viewBox');
    s.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    s.setAttribute('style', `left:0;top:0;bottom:auto;width:${vw}px;height:${vh}px;--s:1`);
    document.querySelectorAll('.og svg.mk-el').forEach((o) => { if (o !== s) o.style.visibility = 'hidden'; });
  }, [sel, vw, vh]);
  const png = await page.screenshot({ clip: { x: 0, y: 0, width: Math.min(vw, W), height: Math.min(vh, H) } });
  await page.evaluate(([sel]) => {
    document.documentElement.classList.remove('probe');
    const s = document.querySelector(sel);
    s.setAttribute('style', s.dataset.style); s.setAttribute('viewBox', s.dataset.vb);
    document.querySelectorAll('.og svg.mk-el').forEach((o) => { o.style.visibility = ''; });
  }, [sel]);
  return scratch.evaluate(async (b64) => {
    const img = new Image();
    img.src = 'data:image/png;base64,' + b64;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width; c.height = img.height;
    const g = c.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data, top = [];
    for (let x = 0; x < c.width; x++) {
      let y = 0;
      for (; y < c.height; y++) { const i = (y * c.width + x) * 4; if (d[i] < 236 || d[i + 1] < 236 || d[i + 2] < 236) break; }
      top.push(y);
    }
    return top;
  }, png.toString('base64'));
}

// Lay the card's title block and the drawing's frame out; the page is the market page itself, so its sheets style both.
async function build(page, { svgs, mark, title, sub, label, cities = [] }) {
  await page.evaluate(([css, svgs, mark, title, sub, label, cities]) => {
    const style = document.createElement('style');
    style.textContent = css;
    document.head.append(style);
    const esc = (t) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    document.body.className = '';
    document.body.innerHTML = `<div class="og"><div class="top">${mark}<span class="lab">${esc(label)}</span></div><h1>${esc(title)}</h1><p class="sub">${esc(sub)}</p>${svgs.join('')}${cities.map((c) => `<span class="city" style="left:${c.x}px">${esc(c.t)}</span>`).join('')}</div>`;
    document.querySelectorAll('.og svg.mk-el').forEach((s, i) => { s.removeAttribute('data-draw'); s.id = 'el' + i; });
  }, [CSS, svgs, mark, title, sub, label, cities]);
  await page.evaluate(() => document.fonts.ready);
  // the title block: the h1 and its line, as the glyphs set them
  return page.evaluate(() => {
    const r = (el) => { const range = document.createRange(); range.selectNodeContents(el); return range.getBoundingClientRect(); };
    const a = r(document.querySelector('.og h1')), b = r(document.querySelector('.og p.sub'));
    return { x0: Math.min(a.left, b.left), x1: Math.max(a.right, b.right), y1: b.bottom };
  });
}

// Does the drawing, at scale s with its ground line at groundY on the card and its left edge at ox, stay clear of the
// text? (columns from..to of the drawing are the ones on the card)
function clear(top, { s, groundY, ground, ox, box, from = 0, to = top.length }) {
  for (let u = from; u < to; u++) {
    if (top[u] >= ground) continue;
    const X = ox + (u - from) * s, Y = groundY - (ground - top[u]) * s;
    const floor = X >= box.x0 - TEXT_GAP && X <= box.x1 + TEXT_GAP ? box.y1 + TEXT_GAP : ROW_FLOOR;
    if (Y < floor) return false;
  }
  return true;
}

async function save(page, out) {
  const path = resolve(ROOT, out);
  let q = 90, buf;
  for (; q >= 60; q -= 4) {
    buf = await page.screenshot({ type: 'jpeg', quality: q });
    if (buf.length <= MAX_KB * 1024) break;
  }
  writeFileSync(path, buf);
  console.log(`${out}  ${Math.round(buf.length / 1024)} KB  (quality ${q})`);
}

async function market(m) {
  const src = source(m.page);
  const page = await ctx.newPage();
  await page.goto(BASE + m.page);
  const box = await build(page, { svgs: [src.svg], mark: src.mark, title: src.title, sub: m.sub, label: m.label || 'Market note' });
  const top = await skyline(page, '#el0', src.vw, src.vh);
  const { vw, vh } = src;
  // the largest scale, then the least trim, at which the drawing clears the text
  let fit;
  for (let s = 1; s >= S_MIN && !fit; s = Math.round((s - 0.01) * 100) / 100) {
    const ox = src.align === 'xMin' ? 0 : src.align === 'xMax' ? W - vw * s : (W - vw * s) / 2;
    for (let c = 0; c <= CROP_MAX && (vh - c - src.ground) * s >= WATER_MIN; c += 2) if (clear(top, { s, groundY: H - (vh - c - src.ground) * s, ground: src.ground, ox, box })) { fit = { s, c, ox }; break; }
  }
  if (!fit) throw new Error(`${m.page}: the drawing does not clear the title even at ${S_MIN}`);
  const { s, c, ox } = fit;
  await page.evaluate(([s, c, ox, vw, vh, ground]) => {
    const svg = document.querySelector('#el0');
    svg.style.setProperty('--s', s);
    const h = (vh - c) * s;
    // the water's name stays inside the trimmed water, its baseline 10px above the foot of the card
    const wl = svg.querySelector('text.wl');
    if (wl) wl.setAttribute('y', Math.min(+wl.getAttribute('y'), vh - c - 10 / s));
    if (s === 1 && ox === 0) {
      svg.setAttribute('viewBox', `0 0 ${vw} ${vh - c}`);
      Object.assign(svg.style, { left: '0px', width: vw + 'px', height: h + 'px' });
      return;
    }
    // smaller than the card: the drawing keeps its own frame, and the ground line and water run on to both edges
    const x0 = -ox / s, x1 = (1200 - ox) / s, NS = 'http://www.w3.org/2000/svg';
    const inner = document.createElementNS(NS, 'svg');
    inner.setAttribute('viewBox', `0 0 ${vw} ${vh}`); inner.setAttribute('width', vw); inner.setAttribute('height', vh); inner.setAttribute('overflow', 'hidden');
    inner.append(...[...svg.childNodes].filter((n) => n.nodeName !== 'defs'));
    svg.append(inner);
    const hatch = svg.querySelector('.hatch');
    for (const dx of [-vw, vw]) if (hatch) { const h2 = hatch.cloneNode(); h2.setAttribute('transform', `translate(${dx} 0)`); svg.insertBefore(h2, inner); }
    const pf = document.createElementNS(NS, 'path');
    pf.setAttribute('class', 'pf'); pf.setAttribute('d', `M${x0} ${ground}H0M${vw} ${ground}H${x1}`);
    svg.insertBefore(pf, inner);
    svg.setAttribute('viewBox', `${x0} 0 ${x1 - x0} ${vh - c}`);
    Object.assign(svg.style, { left: '0px', width: '1200px', height: h + 'px' });
  }, [s, c, ox, vw, vh, src.ground]);
  await save(page, m.out);
  console.log(`   scale ${s}, water trimmed ${c}`);
  await page.close();
}

async function pair(p) {
  const [a, b] = p.sides.map((d) => ({ ...d, ...source(d.page) }));
  const page = await ctx.newPage();
  await page.goto(BASE + p.sides[0].page); // a market page, for the sheets that style its elevation
  const half = 560, lefts = [0, W - half];
  const box = await build(page, {
    svgs: [a.svg, b.svg], mark: a.mark, title: p.title, sub: p.sub, label: p.label,
    cities: [{ x: lefts[0] + 54, t: a.city }, { x: lefts[1] + 14, t: b.city }],
  });
  await page.evaluate(() => document.querySelectorAll('.og svg.mk-el :is(.rl,.wl)').forEach((e) => e.remove()));
  const tops = [await skyline(page, '#el0', a.vw, a.vh), await skyline(page, '#el1', b.vw, b.vh)];
  // one scale in feet for both: the side drawn finer per foot is set smaller; the two grounds share one line on the card,
  // `below` pixels above its foot
  const ratio = a.perFt && b.perFt ? [Math.min(1, b.perFt / a.perFt), Math.min(1, a.perFt / b.perFt)] : [1, 1];
  const sides = [a, b], span = (d, s) => half / s;
  const from = (d, s) => Math.max(0, Math.round(d.align === 'xMin' ? 0 : d.align === 'xMax' ? d.vw - span(d, s) : (d.vw - span(d, s)) / 2));
  let fit;
  for (let k = 1; k >= S_MIN && !fit; k = Math.round((k - 0.01) * 100) / 100) {
    for (let below = 48; below >= WATER_MIN && !fit; below -= 2) {
      const ok = sides.every((d, i) => {
        const s = k * ratio[i], f = from(d, s);
        return span(d, s) <= d.vw && below / s <= d.vh - d.ground && clear(tops[i], { s, groundY: H - below, ground: d.ground, ox: lefts[i], box, from: f, to: Math.min(d.vw, f + Math.ceil(span(d, s))) });
      });
      if (ok) fit = { k, below };
    }
  }
  if (!fit) throw new Error(`${p.page}: the two drawings do not fit`);
  await page.evaluate(([sides, ss, below, half, lefts, H]) => {
    sides.forEach((d, i) => {
      const s = ss[i], span = half / s, svg = document.querySelector('#el' + i);
      const x = d.align === 'xMin' ? 0 : d.align === 'xMax' ? d.vw - span : (d.vw - span) / 2;
      const vb = [Math.max(0, x), 0, span, d.ground + below / s];
      svg.setAttribute('viewBox', vb.join(' '));
      svg.style.setProperty('--s', s);
      Object.assign(svg.style, { left: lefts[i] + 'px', width: half + 'px', height: vb[3] * s + 'px' });
    });
  }, [sides.map(({ vw, vh, align, ground }) => ({ vw, vh, align, ground })), ratio.map((r) => fit.k * r), fit.below, half, lefts, H]);
  await save(page, p.out);
  console.log(`   scales ${ratio.map((r) => +(fit.k * r).toFixed(3)).join(' and ')}`);
  await page.close();
}

async function plate(p) {
  const html = readFileSync(resolve(ROOT, p.page), 'utf8');
  // the opening photograph: the first <img> with fetchpriority high, at its largest JPEG
  const tag = html.match(/<img\b[^>]*fetchpriority="high"[^>]*>/)[0];
  const set = [...(tag.match(/srcset="([^"]*)"/) || [, ''])[1].matchAll(/(\S+\.jpg) (\d+)w/g)].sort((x, y) => y[2] - x[2]);
  const photo = new URL(set.length ? set[0][1] : tag.match(/src="([^"]*)"/)[1], BASE + p.page).href;
  const card = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  await card.setContent(`<!doctype html><style>html,body{margin:0;width:${W}px;height:${H}px;overflow:hidden}
    .c{position:relative;width:${W}px;height:${H}px;background:url(${BASE + p.out}?t=${Date.now()}) 0 0/${W}px ${H}px}
    .ph{position:absolute;left:${p.x}px;top:0;right:0;bottom:0;background:url(${photo}) ${p.focus}/cover}</style><div class="c"><div class="ph"></div></div>`);
  await card.evaluate(() => Promise.all([...document.querySelectorAll('.c,.ph')].map((e) => new Promise((ok) => {
    const u = getComputedStyle(e).backgroundImage.slice(5, -2), i = new Image(); i.onload = i.onerror = ok; i.src = u;
  }))));
  await save(card, p.out);
  await card.close();
}

const only = process.argv.slice(2);
const pick = (x) => !only.length || only.some((w) => x.page.includes(w) || x.out.includes(w));
try {
  for (const m of MARKETS.filter(pick)) await market(m);
  if (pick(PAIR)) await pair(PAIR);
  for (const p of PLATES.filter(pick)) await plate(p);
} finally {
  await browser.close();
  server.close();
}
