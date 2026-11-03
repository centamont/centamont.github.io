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
const INK = '#14161A', IVORY = '#F4F0E8', BRONZE = '#B8976A', PATINA = '#8AA69B'; // patina-300, its shade on ink

// contracts signed, in percent, at month m: a quick first release to 28% by month 3, then the slow climb the
// instrument draws at par (the threshold met in month 14, 81% sold at completion in month 38, 84% at month 42)
const signed = (m) => m <= 3 ? 28 * Math.pow(m / 3, 0.9) : 28 + 87.2 * (1 - Math.exp(-(m - 3) / 38));
// the same release, eased into the climb (no corner at month 3), for the banners, where the corner reads as a glitch
const eased = (m) => m <= 3 ? 16.38 * m - 2.348 * m * m : signed(m);
const M = 42, HIT = 14, LIM = 50, SCHED = [[12, 'planned'], [14, 'ground'], [32, 'top'], [38, 'done']];
const WORDS = {
  en: { lim: 'Pre-sale threshold', hit: 'Month 14', note: 'Illustrative' },
  es: { lim: 'Umbral de preventa', hit: 'Mes 14', note: 'Ilustrativa' },
  pt: { lim: 'Patamar de pré-venda', hit: 'Mês 14', note: 'Ilustrativa' },
};

// the plate in a w × h box; words: false for the social banners (no labels at those sizes), or a language
export function plate(w, h, { lang = false, stroke = 1, font = 7, curve = signed, words = null } = {}) {
  const x = (m) => (m / M) * w, y = (p) => h - (p / 100) * h;
  const pts = []; for (let m = 0; m <= M; m += 0.5) pts.push([x(m), y(curve(m))]);
  const line = pts.map(([a, b], i) => (i ? 'L' : 'M') + a.toFixed(1) + ' ' + b.toFixed(1)).join('');
  const s = (v) => (v * stroke).toFixed(2);
  let g = '';
  for (const p of [25, 50, 75, 100]) if (p !== LIM) g += `<path d="M0 ${y(p).toFixed(1)}H${w}" stroke="${IVORY}" stroke-opacity=".09" stroke-width="${s(0.6)}"/>`;
  for (const [m, k] of SCHED) g += `<path d="M${x(m).toFixed(1)} 0V${h}" stroke="${IVORY}" stroke-opacity="${k === 'planned' ? .16 : .12}" stroke-width="${s(0.6)}"${k === 'planned' ? ` stroke-dasharray="${s(2)} ${s(2)}"` : ''}/>`;
  g += `<path d="M0 ${h}H${w}" stroke="${IVORY}" stroke-opacity=".35" stroke-width="${s(0.6)}"/>`;
  g += `<path d="${line}L${w} ${h}L0 ${h}Z" fill="${BRONZE}" fill-opacity=".13"/>`;
  g += `<path d="${line}" fill="none" stroke="${BRONZE}" stroke-width="${s(1.4)}" stroke-linecap="round"/>`;
  g += `<path d="M0 ${y(LIM)}H${w}" stroke="${IVORY}" stroke-opacity=".7" stroke-width="${s(0.7)}" stroke-dasharray="${s(5)} ${s(2.2)} ${s(1)} ${s(2.2)}"/>`;
  const hx = x(HIT).toFixed(1), hy = y(curve(HIT)).toFixed(1);
  g += `<circle cx="${hx}" cy="${hy}" r="${s(5.5)}" fill="${PATINA}" fill-opacity=".22"/><circle cx="${hx}" cy="${hy}" r="${s(2.4)}" fill="${PATINA}"/>`;
  if (lang) {
    const t = words || WORDS[lang], f = `font-family="Jost, sans-serif" font-size="${font}" letter-spacing="${(font * 0.18).toFixed(2)}"`;
    if (t.lim) g += `<text x="${w}" y="${(y(LIM) + font * 1.55).toFixed(1)}" text-anchor="end" fill="${IVORY}" fill-opacity=".72" ${f}>${t.lim.toUpperCase()}</text>`;
    if (t.below) g += `<text x="${(+hx + font * 0.9).toFixed(1)}" y="${(+hy + font * 1.9).toFixed(1)}" fill="${PATINA}" font-family="'Cormorant Garamond', serif" font-style="italic" font-size="${(font * 1.45).toFixed(1)}">${t.hit}</text>`;
    else g += `<text x="${(+hx - font * 0.9).toFixed(1)}" y="${(+hy - font * 0.8).toFixed(1)}" text-anchor="end" fill="${PATINA}" font-family="'Cormorant Garamond', serif" font-style="italic" font-size="${(font * 1.45).toFixed(1)}">${t.hit}</text>`;
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
  // name, size, the plate's box [x, y, w, h], stroke scale and label size, the line's [x, first baseline, size]. No lockup:
  // the avatar beside each banner is already the mark and the profile name sits under it, so the banner carries the line
  // and the curve, with two words on it: the month the threshold is met, and that the curve is illustrative.
  const LINE = ['New buildings,', 'sold with intent.'];
  const SAYS = { hit: 'Threshold met, month 14', note: 'Illustrative', below: true }; // the month under the line, clear of the words
  const SOCIAL = [
    ['x-header-1500x500', 1500, 500, [640, 150, 760, 220, 2.8, 26], [110, 205, 58]],      // the line above X's avatar (bottom left)
    ['linkedin-banner-1584x396', 1584, 396, [720, 100, 760, 190, 2.6, 24], [110, 140, 52]], // the line above LinkedIn's avatar
    ['youtube-banner-2560x1440', 2560, 1440, [1220, 590, 760, 250, 3, 26], [560, 680, 64]], // all inside the 1546 × 423 safe area
  ];
  const line = (lx, ly, size) => LINE.map((t, k) => `<text x="${lx}" y="${ly + k * size * 1.12}" fill="${IVORY}" font-family="'Cormorant Garamond', serif" font-size="${size}" letter-spacing="${(size * 0.005).toFixed(2)}">${t}</text>`).join('');
  // the plate's words in our own faces, from fonts/ (the PNGs carry them; the SVGs fall back to the viewer's)
  const face = (fam, style, file) => `@font-face{font-family:'${fam}';font-style:${style};src:url(data:font/woff2;base64,${readFileSync(resolve(ROOT, 'fonts', file)).toString('base64')})}`;
  const FACES = face('Jost', 'normal', 'jost-latin-400-normal.woff2') + face('Cormorant Garamond', 'italic', 'cormorant-garamond-latin-400-italic.woff2') + face('Cormorant Garamond', 'normal', 'cormorant-garamond-latin-400-normal.woff2');
  const { chromium } = await import('@playwright/test');
  const local = '/opt/pw-browsers/chromium';
  const browser = await chromium.launch(existsSync(local) ? { executablePath: local } : {});
  const page = await browser.newPage();
  for (const [name, W, H, [px, py, pw, ph, st, font], [lx, ly, size]] of SOCIAL) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}"><rect width="${W}" height="${H}" fill="${INK}"/>` +
      `<g transform="translate(${px} ${py})">${plate(pw, ph, { lang: 'en', stroke: st, font, curve: eased, words: SAYS })}</g>${line(lx, ly, size)}</svg>\n`;
    writeFileSync(resolve(DIR, name + '.svg'), svg);
    await page.setViewportSize({ width: W, height: H });
    await page.setContent(`<style>${FACES}html,body{margin:0}svg{display:block}</style>${svg}`);
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: resolve(DIR, name + '.png') });
    console.log(name);
  }
  await browser.close();
}
