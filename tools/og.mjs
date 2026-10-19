// Share cards (1200 × 630) for the Spanish and Portuguese pages, made from the English cards beside index.html.
// The English cards were drawn once and their sources were not kept, so this sets each one's words again in the page's
// language: the English words are covered with the card's own ground (a clear patch of the same card, so its grain runs
// on unbroken, or its flat ink), and the new words are set in the same faces, sizes, colours and places, with the
// drawing, the photograph and the wordmark left exactly as they are. Run it from the repo root after changing an
// English card or a translation here, then raise the ?v= on the pages' og:image and twitter:image:
//   node tools/og.mjs             writes es/og*.png|jpg and pt/og*.png|jpg
//   node tools/og.mjs --en DIR    sets the English words over the same patches into DIR, to check the setting against
//                                 the English cards (they should match to the pixel, give or take antialiasing)
import { chromium } from '@playwright/test';
import { existsSync, mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const ROOT = resolve(import.meta.dirname, '..');
const file = (p) => pathToFileURL(resolve(ROOT, p)).href;
const INK = '#14161A', IVORY = '#F4F0E8', BRONZE = '#B8976A';

// A patch [x, y, w, h, from]: the card's ground over x, y, w, h, copied from the clear patch whose top left is `from`
// ([sx, sy]), or filled with `from` when it is a colour.
// A line of type {x | right, base, size, face, ...}: `base` is its baseline, counted down from the top of the card.
const CARDS = [
  {
    base: 'og.png', out: { es: 'es/og.png', pt: 'pt/og.png' },
    patches: [[70, 200, 885, 300, INK], [70, 532, 880, 34, INK], [70, 598, 540, 24, INK]],
    words: {
      en: { head: ['The finest new buildings,', 'sold <em>with intent.</em>'], sub: 'New development and private client advisory', foot: 'Sheet 01 · Index' },
      es: { head: ['Los mejores', 'edificios nuevos,', 'vendidos <em>con propósito.</em>'], sub: 'Asesoría en nuevos desarrollos y a clientes privados', foot: 'Lámina 01 · Índice' },
      pt: { head: ['Os melhores', 'edifícios novos,', 'vendidos <em>com propósito.</em>'], sub: 'Assessoria em lançamentos e a clientes privados', foot: 'Prancha 01 · Índice' },
    },
    lines: (w) => [
      ...w.head.map((t, i, a) => ({ t, x: 77, base: 492 - 94 * (a.length - 1 - i), size: 92, face: 'display', weight: 300, color: IVORY, em: BRONZE, ls: '-.02em', emw: 400, emls: '.015em', emml: '7px' })),
      { t: w.sub, x: 80, base: 559, size: 22, face: 'body', weight: 400, color: '#CFC8BA', ls: '.14em', upper: true },
      { t: w.foot, x: 80, base: 617, size: 18, face: 'body', weight: 500, color: '#9E9D99', ls: '.14em', upper: true },
    ],
  },
  {
    // the card the developer and markets pages share: the index card without its sheet line
    base: 'og-site.png', out: { es: 'es/og-site.png', pt: 'pt/og-site.png' },
    patches: [[70, 200, 885, 300, INK], [70, 532, 880, 34, INK]],
    words: {
      en: { head: ['The finest new buildings,', 'sold <em>with intent.</em>'], sub: 'New development and private client advisory' },
      es: { head: ['Los mejores', 'edificios nuevos,', 'vendidos <em>con propósito.</em>'], sub: 'Asesoría en nuevos desarrollos y a clientes privados' },
      pt: { head: ['Os melhores', 'edifícios novos,', 'vendidos <em>com propósito.</em>'], sub: 'Assessoria em lançamentos e a clientes privados' },
    },
    lines: (w) => [
      ...w.head.map((t, i, a) => ({ t, x: 77, base: 492 - 94 * (a.length - 1 - i), size: 92, face: 'display', weight: 300, color: IVORY, em: BRONZE, ls: '-.02em', emw: 400, emls: '.015em', emml: '7px' })),
      { t: w.sub, x: 80, base: 559, size: 22, face: 'body', weight: 400, color: '#CFC8BA', ls: '.14em', upper: true },
    ],
  },
  {
    base: 'og-clients.jpg', out: { es: 'es/og-clientes-privados.jpg', pt: 'pt/og-clientes-privados.jpg' },
    patches: [[70, 180, 715, 316, INK], [70, 532, 715, 34, INK], [70, 598, 540, 24, INK]],
    words: {
      en: { head: ['A short list, made', 'for one buyer.'], sub: 'Private client advisory', foot: 'Sheet 05 · Private clients' },
      es: { head: ['Una selección breve,', 'hecha para un solo', 'comprador.'], sub: 'Asesoría a clientes privados', foot: 'Lámina 05 · Clientes privados' },
      pt: { head: ['Uma seleção breve,', 'feita para um único', 'comprador.'], sub: 'Assessoria a clientes privados', foot: 'Prancha 05 · Clientes privados' },
    },
    lines: (w) => [
      ...w.head.map((t, i, a) => ({ t, x: 80, base: 459 - 88 * (a.length - 1 - i), size: 87, face: 'display', weight: 300, color: IVORY, ls: '-.02em' })),
      { t: w.sub, x: 82, base: 557, size: 21, face: 'body', weight: 400, color: '#C9C8C4', ls: '.14em', upper: true },
      { t: w.foot, x: 80, base: 616, size: 17, face: 'body', weight: 500, color: '#AEADA9', ls: '.14em', upper: true },
    ],
  },
  {
    base: 'og-journal-preconstruction.jpg', out: { es: 'es/og-comprar-preconstruccion-florida.jpg', pt: 'pt/og-comprar-na-planta-florida.jpg' },
    // (the grain between the kicker and the schedule is clear from edge to edge)
    patches: [[0, 60, 1200, 95, [0, 318]], [0, 155, 1200, 95, [0, 320]], [0, 274, 640, 36, [300, 360]], [880, 477, 245, 24, [880, 330]], [600, 544, 530, 28, [600, 340]]],
    words: {
      en: { head: ['Buying pre-construction', 'in Florida'], kick: 'Journal · Buyer guide', end: '100% of price', note: 'Illustrative deposit schedule' },
      es: { head: ['Comprar en preconstrucción', 'en Florida'], kick: 'Notas · Guía para compradores', end: '100% del precio', note: 'Calendario ilustrativo de depósitos' },
      pt: { head: ['Comprar na planta', 'na Flórida'], kick: 'Notas · Guia para compradores', end: '100% do preço', note: 'Cronograma ilustrativo de depósitos' },
    },
    lines: (w) => [
      ...w.head.map((t, i, a) => ({ t, x: 84, base: 235 - 92 * (a.length - 1 - i), size: 94, face: 'display', weight: 300, color: IVORY, ls: '-.02em' })),
      { t: w.kick, x: 84, base: 301, size: 20, face: 'body', weight: 500, color: BRONZE, ls: '.14em', upper: true },
      { t: w.end, right: 1116, base: 493, size: 14, face: 'body', weight: 500, color: '#A0A0A2', ls: '.14em', upper: true },
      { t: w.note, right: 1116, base: 563, size: 15, face: 'body', weight: 500, color: '#A0A0A2', ls: '.14em', upper: true },
    ],
  },
  {
    base: 'og-journal-new-construction-florida.jpg', out: { es: 'es/og-comprar-obra-nueva-florida.jpg', pt: 'pt/og-comprar-imovel-novo-florida.jpg' },
    // (the photograph starts at x 770; the ink panel's grain is clear from the kicker down to the wordmark)
    patches: [[60, 80, 705, 145, [60, 300]], [60, 246, 705, 34, [60, 460]]],
    words: {
      en: { head: ['Buying new', 'construction in Florida'], kick: 'Journal · Buyer guide' },
      es: { head: ['Comprar obra nueva', 'en Florida'], kick: 'Notas · Guía para compradores' },
      pt: { head: ['Comprar imóvel novo', 'na Flórida'], kick: 'Notas · Guia para compradores' },
    },
    lines: (w) => [
      ...w.head.map((t, i, a) => ({ t, x: 84, base: 209 - 70 * (a.length - 1 - i), size: 65, face: 'display', weight: 300, color: IVORY, ls: '0' })),
      { t: w.kick, x: 86, base: 271, size: 18, face: 'body', weight: 500, color: BRONZE, ls: '.16em', upper: true },
    ],
  },
  ...[
    // the market notes: a drawn elevation of the city, its height scale in the page's own numbers (Portuguese writes
    // 1.500 pés, as pt/sul-da-florida.html does)
    {
      base: 'og-south-florida.png', out: { es: 'es/og-sur-de-florida.jpg', pt: 'pt/og-sul-da-florida.jpg' },
      patches: [[50, 108, 580, 86, [0, 296]], [50, 194, 580, 82, [480, 300]]],
      words: {
        en: { h1: 'South Florida', p: 'Miami, Fort Lauderdale and West Palm Beach' },
        es: { h1: 'Sur de Florida', p: 'Miami, Fort Lauderdale y West Palm Beach' },
        pt: { h1: 'Sul da Flórida', p: 'Miami, Fort Lauderdale e West Palm Beach' },
      },
    },
    {
      base: 'og-new-york.jpg', out: { es: 'es/og-nueva-york.jpg', pt: 'pt/og-nova-york.jpg' },
      patches: [[50, 108, 400, 168, [680, 104]], [450, 108, 230, 168, [700, 104]]],
      words: {
        en: { h1: 'New York City', p: 'Manhattan’s new condominiums' },
        es: { h1: 'Ciudad de Nueva York', p: 'Los condominios nuevos de Manhattan' },
        pt: { h1: 'Cidade de Nova York', p: 'Os novos condomínios de Manhattan' },
      },
    },
  ].map((c) => ({
    ...c,
    patches: [...c.patches, [970, 68, 172, 28, [970, 140]], [1090, 279, 72, 21, [990, 279]], [1090, 380, 72, 21, [990, 380]]],
    words: Object.fromEntries(Object.entries(c.words).map(([k, v]) => [k, { ...v, lab: { en: 'Market note', es: 'Nota de mercado', pt: 'Nota de mercado' }[k], top: k === 'pt' ? '1.500 pés' : '1,500 ft', mid: k === 'pt' ? '1.000' : '1,000' }])),
    lines: (w) => [
      { t: w.h1, x: 60, base: 205, size: 104, face: 'display', weight: 300, color: INK, ls: '-.01em' },
      { t: w.p, x: 66, base: 261, size: 26, face: 'body', weight: 400, color: '#4A463F' },
      { t: w.lab, right: 1136, base: 89, size: 17, face: 'body', weight: 500, color: '#6E675D', ls: '.2em', upper: true },
      { t: w.top, right: 1162, base: 294, size: 13.75, face: 'body', weight: 500, color: '#6E675D', ls: '.06em', num: true },
      { t: w.mid, right: 1162, base: 394, size: 13.75, face: 'body', weight: 500, color: '#6E675D', ls: '.06em', num: true },
    ],
  })),
];

const css = (root) => `
@font-face{font-family:D;font-style:normal;font-weight:300;src:url(${file('fonts/cormorant-garamond-latin-300-normal.woff2')})}
@font-face{font-family:D;font-style:italic;font-weight:300;src:url(${file('fonts/cormorant-garamond-latin-300-italic.woff2')})}
@font-face{font-family:D;font-style:normal;font-weight:400;src:url(${file('fonts/cormorant-garamond-latin-400-normal.woff2')})}
@font-face{font-family:D;font-style:italic;font-weight:400;src:url(${file('fonts/cormorant-garamond-latin-400-italic.woff2')})}
@font-face{font-family:B;font-style:normal;font-weight:400;src:url(${file('fonts/jost-latin-400-normal.woff2')})}
@font-face{font-family:B;font-style:normal;font-weight:500;src:url(${file('fonts/jost-latin-500-normal.woff2')})}
html,body{margin:0;width:1200px;height:630px;overflow:hidden;background:#000}
.c{position:relative;width:1200px;height:630px;background:url(${root}) 0 0/1200px 630px}
.p{position:absolute;background:url(${root}) 0 0/1200px 630px}
.l{position:absolute;white-space:nowrap;line-height:0;margin:0}
.l>span{display:inline-block;line-height:0}
.l em{font-style:italic;color:var(--em);font-weight:var(--emw,inherit);letter-spacing:var(--emls,inherit);margin-left:var(--emml,0)}`;

function card(c, w) {
  const root = file(c.base);
  const patches = c.patches.map(([x, y, pw, ph, from]) => typeof from === 'string'
    ? `<i class="p" style="left:${x}px;top:${y}px;width:${pw}px;height:${ph}px;background:${from}"></i>`
    : `<i class="p" style="left:${x}px;top:${y}px;width:${pw}px;height:${ph}px;background-position:${-from[0]}px ${-from[1]}px"></i>`).join('');
  // each line sits on its baseline: a zero line height puts the baseline where the box's top is, give or take the face's
  // own centring, which the page measures and takes off below
  const lines = c.lines(w).map((l) => `<p class="l" data-base="${l.base}" style="${l.right != null ? `right:${1200 - l.right}px` : `left:${l.x}px`};top:${l.base}px;font:${l.weight} ${l.size}px ${l.face === 'display' ? 'D' : 'B'};letter-spacing:${l.ls || 0};color:${l.color};${l.upper ? 'text-transform:uppercase;' : ''}${l.num ? 'font-variant-numeric:tabular-nums;' : ''}${l.em ? `--em:${l.em};` : ''}${l.emw ? `--emw:${l.emw};` : ''}${l.emls ? `--emls:${l.emls};` : ''}${l.emml ? `--emml:${l.emml}` : ''}"><span>${l.t}</span></p>`).join('');
  return `<!doctype html><meta charset="utf-8"><style>${css(root)}</style><div class="c">${patches}${lines}</div>`;
}

const en = process.argv.indexOf('--en'), outDir = en > -1 ? resolve(process.argv[en + 1]) : null;
const exe = '/opt/pw-browsers/chromium';
const browser = await chromium.launch(existsSync(exe) && !process.env.CI ? { executablePath: exe } : {});
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
const tmp = mkdtempSync(join(tmpdir(), 'og-'));
for (const c of CARDS) {
  for (const lang of outDir ? ['en'] : ['es', 'pt']) {
    const html = join(tmp, `${lang}.html`);
    writeFileSync(html, card(c, c.words[lang]));
    await page.goto(pathToFileURL(html).href);
    await page.evaluate(() => document.fonts.ready);
    // move each line so its baseline lands on data-base: an inline-block's baseline is its last line's
    await page.evaluate(() => document.querySelectorAll('.l').forEach((p) => {
      const s = p.firstElementChild, probe = document.createElement('i');
      probe.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
      s.appendChild(probe);
      const off = probe.getBoundingClientRect().top - p.getBoundingClientRect().top;
      probe.remove();
      p.style.top = (+p.dataset.base - off) + 'px';
    }));
    const out = outDir ? join(outDir, c.base) : resolve(ROOT, c.out[lang]);
    const jpg = out.endsWith('.jpg');
    await page.screenshot({ path: out, type: jpg ? 'jpeg' : 'png', quality: jpg ? 92 : undefined });
    console.log(out);
  }
}
rmSync(tmp, { recursive: true, force: true });
await browser.close();
