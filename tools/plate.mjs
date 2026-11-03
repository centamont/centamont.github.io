// The curve plate: the sales-curve instrument from the home page, drawn as a small, quiet brand device on ink. Bronze
// carries the contracts signed, the dash-dot line is the lender's pre-sale threshold, the faint verticals are the
// construction schedule, and Century Patina marks the one live state: the month the threshold is met. The curve is
// illustrative (the instrument's at par shape), never a forecast, and the plate always says so where it has words.
//
//   node tools/plate.mjs                  writes the plate into the three brief sources, between <!-- plate --> markers
//   node tools/plate.mjs --social DIR     also draws the X header, the LinkedIn banner and the YouTube banner into DIR
//                                         (they live in the brand kit, outside the repo)
//
// After writing the briefs, print them again: node tools/brief.mjs
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const INK = '#14161A', IVORY = '#F4F0E8', BRONZE = '#B8976A', BRONZE_300 = '#D5B382', PATINA = '#8AA69B'; // patina-300, its shade on ink

// contracts signed, in percent, at month m: a quick first release to 28% by month 3, then the slow climb the
// instrument draws at par (the threshold met in month 14, 81% sold at completion in month 38, 84% at month 42)
const signed = (m) => m <= 3 ? 28 * Math.pow(m / 3, 0.9) : 28 + 87.2 * (1 - Math.exp(-(m - 3) / 38));
// for the banners, one clean arc through the same threshold month (50% at month 14, 83% at month 42): at banner size the
// quick first release reads as a corner, so the banner draws the shape of the climb, not its detail
const eased = (m) => 92.4 * (1 - Math.exp(-m / 18));
const M = 42, HIT = 14, LIM = 50, SCHED = [[12, 'planned'], [14, 'ground'], [32, 'top'], [38, 'done']];
const WORDS = {
  en: { lim: 'Pre-sale threshold', hit: 'Month 14', note: 'Illustrative' },
  es: { lim: 'Umbral de preventa', hit: 'Mes 14', note: 'Ilustrativa' },
  pt: { lim: 'Patamar de pré-venda', hit: 'Mês 14', note: 'Ilustrativa' },
};

// the plate in a w × h box; lang: its words in that language (the briefs), or none; bare: no grid, schedule or ground line
export function plate(w, h, { lang = false, stroke = 1, font = 7, curve = signed, bare = false, fill = '.13', fade = false, dot = PATINA, limOpacity = '.7' } = {}) {
  const x = (m) => (m / M) * w, y = (p) => h - (p / 100) * h;
  const pts = []; for (let m = 0; m <= M; m += 0.5) pts.push([x(m), y(curve(m))]);
  const line = pts.map(([a, b], i) => (i ? 'L' : 'M') + a.toFixed(1) + ' ' + b.toFixed(1)).join('');
  const s = (v) => (v * stroke).toFixed(2);
  let g = '';
  if (!bare) for (const p of [25, 50, 75, 100]) if (p !== LIM) g += `<path d="M0 ${y(p).toFixed(1)}H${w}" stroke="${IVORY}" stroke-opacity=".09" stroke-width="${s(0.6)}"/>`;
  if (!bare) for (const [m, k] of SCHED) g += `<path d="M${x(m).toFixed(1)} 0V${h}" stroke="${IVORY}" stroke-opacity="${k === 'planned' ? .16 : .12}" stroke-width="${s(0.6)}"${k === 'planned' ? ` stroke-dasharray="${s(2)} ${s(2)}"` : ''}/>`;
  if (!bare) g += `<path d="M0 ${h}H${w}" stroke="${IVORY}" stroke-opacity=".35" stroke-width="${s(0.6)}"/>`;
  g += `<path d="${line}L${w} ${h}L0 ${h}Z" fill="${BRONZE}" fill-opacity="${fill}"/>`;
  // fade: the curve and the threshold rise out of the ink at the left instead of starting on a hard end
  if (fade) g += `<defs><linearGradient id="cm-in" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${(w * 0.22).toFixed(1)}" y2="0"><stop offset="0" stop-color="${BRONZE}" stop-opacity="0"/><stop offset="1" stop-color="${BRONZE}"/></linearGradient>` +
    `<linearGradient id="cm-in-lim" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${(w * 0.22).toFixed(1)}" y2="0"><stop offset="0" stop-color="${IVORY}" stop-opacity="0"/><stop offset="1" stop-color="${IVORY}"/></linearGradient></defs>`;
  g += `<path d="${line}" fill="none" stroke="${fade ? 'url(#cm-in)' : BRONZE}" stroke-width="${s(1.4)}" stroke-linecap="round"/>`;
  g += `<path d="M0 ${y(LIM)}H${w}" stroke="${fade ? 'url(#cm-in-lim)' : IVORY}" stroke-opacity="${limOpacity}" stroke-width="${s(0.7)}" stroke-dasharray="${s(5)} ${s(2.2)} ${s(1)} ${s(2.2)}"/>`;
  const hx = x(HIT).toFixed(1), hy = y(curve(HIT)).toFixed(1);
  g += `<circle cx="${hx}" cy="${hy}" r="${s(5.5)}" fill="${dot}" fill-opacity=".22"/><circle cx="${hx}" cy="${hy}" r="${s(2.4)}" fill="${dot}"/>`;
  if (lang) {
    const t = WORDS[lang], f = `font-family="Jost, sans-serif" font-size="${font}" letter-spacing="${(font * 0.18).toFixed(2)}"`;
    g += `<text x="${w}" y="${(y(LIM) + font * 1.55).toFixed(1)}" text-anchor="end" fill="${IVORY}" fill-opacity=".72" ${f}>${t.lim.toUpperCase()}</text>`;
    g += `<text x="${(+hx - font * 0.9).toFixed(1)}" y="${(+hy - font * 0.8).toFixed(1)}" text-anchor="end" fill="${PATINA}" font-family="'Cormorant Garamond', serif" font-style="italic" font-size="${(font * 1.45).toFixed(1)}">${t.hit}</text>`;
    g += `<text x="0" y="${(-font * 0.9).toFixed(1)}" fill="${IVORY}" fill-opacity=".5" ${f}>${t.note.toUpperCase()}</text>`;
  }
  return g;
}

// the briefs: a 150 × 70 pt plate in the ink band, beside the headline
const BRIEFS = { 'developer-brief.html': 'en', 'desarrolladores.html': 'es', 'incorporadoras.html': 'pt' };
for (const [f, lang] of Object.entries(BRIEFS)) {
  const p = resolve(ROOT, '_src/brief', f);
  const src = readFileSync(p, 'utf8');
  const svg = `<svg class="plate" viewBox="-4 -12 158 86" aria-hidden="true">${plate(150, 70, { lang, font: 6 })}</svg>`;
  const out = src.replace(/<!-- plate -->[\s\S]*?<!-- \/plate -->/, `<!-- plate -->${svg}<!-- /plate -->`);
  if (out === src && !src.includes(svg)) throw new Error(f + ': no <!-- plate --> markers');
  writeFileSync(p, out);
  console.log('_src/brief/' + f);
}

// the social banners, each with the plate where the platform's crop and the avatar leave it whole
const i = process.argv.indexOf('--social');
if (i > 0) {
  const DIR = resolve(process.argv[i + 1]); if (!existsSync(DIR)) mkdirSync(DIR, { recursive: true });
  // name, size, the plate's box [x, y, w, h] (it runs off the right edge: the climb goes on), stroke scale, the label's
  // size, the line's [x, first baseline, size]. No lockup: the avatar beside each banner is already the mark and the
  // profile name sits under it. The line leads; the curve sits lower and quieter, bare of the grid and the schedule, with
  // one word at the patina dot (the month the threshold is met) and the note that the curve is illustrative.
  const SOCIAL = [
    ['x-header-1500x500', 1500, 500, [660, 150, 1000, 260, 2.6, 42], [110, 222, 74]],       // the line above X's avatar (bottom left)
    ['linkedin-banner-1584x396', 1584, 396, [700, 110, 1000, 210, 2.4, 38], [110, 165, 64]], // the line above LinkedIn's avatar
    ['youtube-banner-2560x1440', 2560, 1440, [1240, 590, 1100, 290, 3, 40], [560, 700, 84]],  // all inside the 1546 × 423 safe area
  ];
  const line = (lx, ly, size) => `<g font-family="'Cormorant Garamond', serif" font-size="${size}" fill="${IVORY}">` +
    `<text x="${lx}" y="${ly}">New buildings,</text>` +
    `<text x="${lx}" y="${(ly + size * 1.1).toFixed(1)}">sold <tspan fill="${BRONZE_300}" font-style="italic">with intent.</tspan></text></g>`;
  const label = (px, py, pw, ph, size) => { // under the threshold, right of the dot: the month, then the note
    const hx = px + (HIT / M) * pw + size * 0.55, hy = py + ph - (eased(HIT) / 100) * ph;
    return `<text x="${hx.toFixed(1)}" y="${(hy + size * 1.25).toFixed(1)}" fill="${PATINA}" font-family="'Cormorant Garamond', serif" font-style="italic" font-size="${size}">Month 14</text>` +
      `<text x="${(hx + 2).toFixed(1)}" y="${(hy + size * 1.25 + size * 0.75).toFixed(1)}" fill="${IVORY}" fill-opacity=".5" font-family="Jost, sans-serif" font-size="${(size * 0.5).toFixed(1)}" letter-spacing="${(size * 0.08).toFixed(1)}">ILLUSTRATIVE</text>`;
  };
  // the plate's words in our own faces, from fonts/ (the PNGs carry them; the SVGs fall back to the viewer's)
  const face = (fam, style, file) => `@font-face{font-family:'${fam}';font-style:${style};src:url(data:font/woff2;base64,${readFileSync(resolve(ROOT, 'fonts', file)).toString('base64')})}`;
  const FACES = face('Jost', 'normal', 'jost-latin-400-normal.woff2') + face('Cormorant Garamond', 'italic', 'cormorant-garamond-latin-400-italic.woff2') + face('Cormorant Garamond', 'normal', 'cormorant-garamond-latin-400-normal.woff2');
  const { chromium } = await import('@playwright/test');
  const local = '/opt/pw-browsers/chromium';
  const browser = await chromium.launch(existsSync(local) ? { executablePath: local } : {});
  const page = await browser.newPage();
  for (const [name, W, H, [px, py, pw, ph, st, font], [lx, ly, size]] of SOCIAL) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${INK}"/>` +
      `<g transform="translate(${px} ${py})">${plate(pw, ph, { stroke: st, curve: eased, bare: true, fill: '0', fade: true })}</g>${label(px, py, pw, ph, font)}${line(lx, ly, size)}</svg>\n`;
    writeFileSync(resolve(DIR, name + '.svg'), svg);
    await page.setViewportSize({ width: W, height: H });
    await page.setContent(`<style>${FACES}html,body{margin:0}svg{display:block}</style>${svg}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: resolve(DIR, name + '.png') });
    console.log(name);
  }
  await browser.close();
}
