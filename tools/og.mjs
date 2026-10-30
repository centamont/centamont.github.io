// Share cards (1200 × 630) for the Spanish and Portuguese pages, made from the English cards beside index.html.
// The English cards were drawn once and their sources were not kept, so this sets each one's words again in the page's
// language: the English words are covered with the card's own ground (a clear patch of the same card, so its grain runs
// on unbroken, or its flat ink), and the new words are set in the same faces, sizes, colours and places, with the
// drawing, the photograph and the wordmark left exactly as they are. Run it from the repo root after changing an
// English card or a translation here, then raise the ?v= on the pages' og:image and twitter:image. (The South Florida and
// New York market cards are not made here: tools/og-markets.mjs draws them from the es/ and pt/ pages themselves; nor
// is the home's card: tools/og-home.mjs draws it in all three languages.)
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
// A wide patch of grain, cut into strips no taller than the clear band it is copied from (rows sy to sy + sh of the
// same card), so a clear band at the top of a card can cover a block of words anywhere below it.
const strips = (x, y, w, h, sy, sh) => Array.from({ length: Math.ceil(h / sh) }, (_, i) => [x, y + i * sh, w, Math.min(sh, h - i * sh), [x, sy]]);
const GREY = '#A0A0A2';
// The notes' cards share three settings. A photograph card (Florida and New York): the title in two lines over the
// kicker, the photograph from x 770. The Texas and California cards: the same, a little smaller, on flat ink. A developer
// note: a larger title over the kicker, with the note's own diagram below; its labels are set in small grey capitals.
const photo = (w) => [
  ...w.head.map((t, i, a) => ({ t, x: 84, base: 209 - 70 * (a.length - 1 - i), size: w.size || 66, face: 'display', weight: 300, color: IVORY, ls: '-.005em' })),
  { t: w.kick, x: 86, base: 268, size: 17, face: 'body', weight: 500, color: BRONZE, ls: '.2em', upper: true },
];
const flat = (w) => [
  ...w.head.map((t, i, a) => ({ t, x: 86, base: 208 - 68 * (a.length - 1 - i), size: w.size || 60.5, face: 'display', weight: 300, color: IVORY, ls: '-.0075em' })),
  { t: w.kick, x: 86, base: 281, size: 16, face: 'body', weight: 500, color: BRONZE, ls: '.2em', upper: true },
];
// The developer notes were drawn in two settings: the launch price and weekly report cards, and the four after them.
const NOTE1 = { x: 84, base: 143, size: 84, ls: '-.01em', kick: { base: 294, size: 18, ls: '.22em' }, foot: { size: 14, ls: '.2em' } };
const NOTE2 = { x: 81.5, base: 146, size: 84.5, ls: '-.0075em', kick: { base: 295, size: 17.5, ls: '.2em' }, foot: { size: 13, ls: '.195em' } };
const note = (w, n) => [
  ...w.head.map((t, i) => ({ t, x: n.x, base: n.base + 86 * i, size: n.size, face: 'display', weight: 300, color: IVORY, ls: n.ls })),
  { t: w.kick, x: 84, ...n.kick, face: 'body', weight: 500, color: BRONZE, upper: true },
  { t: w.foot, right: 1116, base: 563, ...n.foot, face: 'body', weight: 500, color: GREY, upper: true },
];
const label = (t, at, base, o = {}) => ({ t, ...at, base, size: 14, face: 'body', weight: 500, color: GREY, ls: '.145em', upper: true, ...o });
// the kicker of each developer note, and the patches over the title and kicker (copied from the clear band at the top)
const NOTE = { es: 'Notas · Nota para desarrolladores', pt: 'Notas · Nota para incorporadoras', en: 'Journal · Developer note' };
const GUIDE = { es: 'Notas · Guía para compradores', pt: 'Notas · Guia para compradores', en: 'Journal · Buyer guide' };
const noteTop = (w = 830) => strips(60, 72, w, 233, 2, 66);

const CARDS = [
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
  ...[['preconstruction-new-york', 'comprar-preconstruccion-nueva-york', 'comprar-na-planta-nova-york', ['Buying pre-construction', 'in New York'], ['Comprar en preconstrucción', 'en Nueva York'], ['Comprar na planta', 'em Nova York'], 57],
      ['new-construction-new-york', 'comprar-obra-nueva-nueva-york', 'comprar-imovel-novo-nova-york', ['Buying new construction', 'in New York'], ['Comprar obra nueva', 'en Nueva York'], ['Comprar imóvel novo', 'em Nova York']],
  ].map(([en, es, pt, hen, hes, hpt, size]) => ({
    base: `og-journal-${en}.jpg`, out: { es: `es/og-${es}.jpg`, pt: `pt/og-${pt}.jpg` },
    // (as the Florida card: the ink panel's grain is clear from the kicker down to the wordmark)
    patches: [[60, 80, 705, 145, [60, 300]], [60, 246, 705, 34, [60, 460]]],
    words: { en: { head: hen, kick: GUIDE.en }, es: { head: hes, kick: GUIDE.es, size }, pt: { head: hpt, kick: GUIDE.pt } },
    lines: photo,
  })),
  ...[['preconstruction-texas', 'comprar-preconstruccion-texas', 'comprar-na-planta-texas', ['Buying pre-construction', 'in Texas'], ['Comprar en preconstrucción', 'en Texas'], ['Comprar na planta', 'no Texas'], 56],
      ['new-construction-texas', 'comprar-obra-nueva-texas', 'comprar-imovel-novo-texas', ['Buying new construction', 'in Texas'], ['Comprar obra nueva', 'en Texas'], ['Comprar imóvel novo', 'no Texas']],
      ['preconstruction-california', 'comprar-preconstruccion-california', 'comprar-na-planta-california', ['Buying pre-construction', 'in California'], ['Comprar en preconstrucción', 'en California'], ['Comprar na planta', 'na Califórnia'], 56],
      ['new-construction-california', 'comprar-obra-nueva-california', 'comprar-imovel-novo-california', ['Buying new construction', 'in California'], ['Comprar obra nueva', 'en California'], ['Comprar imóvel novo', 'na Califórnia']],
  ].map(([en, es, pt, hen, hes, hpt, size]) => ({
    base: `og-journal-${en}.jpg`, out: { es: `es/og-${es}.jpg`, pt: `pt/og-${pt}.jpg` },
    // (flat ink, clear from the kicker down to the wordmark)
    patches: [[60, 90, 705, 205, [60, 300]]],
    words: { en: { head: hen, kick: GUIDE.en }, es: { head: hes, kick: GUIDE.es, size }, pt: { head: hpt, kick: GUIDE.pt } },
    lines: flat,
  })),
  {
    base: 'og-journal-launch-price.jpg', out: { es: 'es/og-precio-de-lanzamiento-y-umbral-de-preventa.jpg', pt: 'pt/og-preco-de-lancamento-e-patamar-de-pre-venda.jpg' },
    patches: [...noteTop(), [922, 375, 198, 15, [922, 30]], [880, 546, 240, 22, [880, 30]]],
    words: {
      en: { head: ['Launch price and the', 'pre-sale threshold'], kick: NOTE.en, line: 'Pre-sale threshold', foot: 'Illustrative model' },
      es: { head: ['El precio de lanzamiento', 'y el umbral de preventa'], kick: NOTE.es, line: 'Umbral de preventa', foot: 'Modelo ilustrativo' },
      pt: { head: ['O preço de lançamento', 'e o patamar de pré-venda'], kick: NOTE.pt, line: 'Patamar de pré-venda', foot: 'Modelo ilustrativo' },
    },
    lines: (w) => [...note(w, NOTE1), label(w.line, { right: 1116 }, 388, { ls: '.14em' })],
  },
  {
    base: 'og-journal-weekly-report.jpg', out: { es: 'es/og-que-debe-medir-un-informe-semanal.jpg', pt: 'pt/og-o-que-um-relatorio-semanal-deve-medir.jpg' },
    patches: [...noteTop(), ...strips(76, 370, 222, 130, 2, 66), [880, 546, 240, 22, [880, 30]]],
    words: {
      en: { head: ['What a weekly sales', 'report should measure'], kick: NOTE.en, rows: ['Inquiries', 'Private tours', 'Reservations', 'Contracts'], foot: 'Illustrative figures' },
      es: { head: ['Qué debe medir un informe', 'semanal de ventas'], kick: NOTE.es, rows: ['Consultas', 'Visitas privadas', 'Reservas', 'Contratos'], foot: 'Cifras ilustrativas' },
      pt: { head: ['O que um relatório semanal', 'de vendas deve medir'], kick: NOTE.pt, rows: ['Consultas', 'Visitas privadas', 'Reservas', 'Contratos'], foot: 'Números ilustrativos' },
    },
    lines: (w) => [...note(w, NOTE1), ...w.rows.map((t, i) => label(t, { x: 84 }, 387 + 36 * i, { size: 15, ls: '.14em' }))],
  },
  {
    base: 'og-journal-deposit-escrow.jpg', out: { es: 'es/og-custodia-de-depositos-condominios-nuevos.jpg', pt: 'pt/og-custodia-de-depositos-condominios-novos.jpg' },
    patches: [...noteTop(), [76, 378, 262, 18, [76, 30]], [920, 378, 200, 18, [920, 30]], [190, 472, 330, 20, [190, 30]], [820, 546, 300, 22, [820, 30]]],
    words: {
      en: { head: ['Deposit escrow for', 'new condominiums'], kick: NOTE.en, a: 'First 10% · held in escrow', b: 'Balance at closing', c: 'Above 10% · may build, in Florida', foot: 'Illustrative deposit schedule' },
      es: { head: ['La custodia de los depósitos', 'en condominios nuevos'], kick: NOTE.es, a: 'Primer 10% · en custodia', b: 'Saldo al cierre', c: 'Más del 10% · puede construir, en Florida', foot: 'Calendario ilustrativo de depósitos' },
      pt: { head: ['A custódia dos depósitos', 'em condomínios novos'], kick: NOTE.pt, a: 'Primeiros 10% · em custódia', b: 'Saldo no fechamento', c: 'Acima de 10% · pode construir, na Flórida', foot: 'Cronograma ilustrativo de depósitos' },
    },
    lines: (w) => [...note(w, NOTE2), label(w.a, { x: 85 }, 392, { size: 13.5, weight: 400, ls: '.185em' }), label(w.b, { right: 1116 }, 392, { size: 13.5, ls: '.17em' }), label(w.c, { x: 197 }, 486, { size: 13.5, ls: '.165em', color: BRONZE })],
  },
  {
    base: 'og-journal-sales-pace.jpg', out: { es: 'es/og-leer-el-ritmo-de-ventas.jpg', pt: 'pt/og-ler-o-ritmo-de-vendas.jpg' },
    // (the labels stand between the dotted lines, which the patches leave alone)
    patches: [...noteTop(), [88, 308, 236, 18, [88, 30]], [334, 308, 300, 18, [334, 30]], [644, 308, 300, 18, [644, 30]], [960, 308, 152, 18, [960, 30]], [880, 546, 240, 22, [880, 30]]],
    words: {
      en: { head: ['Reading the pace', 'of sales'], kick: NOTE.en, steps: ['Launch', 'Ground breaks', 'Topping off', 'Completion'], foot: 'Illustrative pattern' },
      es: { head: ['Leer el ritmo', 'de ventas'], kick: NOTE.es, steps: ['Lanzamiento', 'Inicio de obra', 'Estructura terminada', 'Terminación'], foot: 'Patrón ilustrativo' },
      pt: { head: ['Ler o ritmo', 'de vendas'], kick: NOTE.pt, steps: ['Lançamento', 'Início da obra', 'Estrutura no topo', 'Conclusão'], foot: 'Padrão ilustrativo' },
    },
    lines: (w) => [...note(w, NOTE2), label(w.steps[0], { x: 92 }, 322), label(w.steps[1], { x: 338 }, 322), label(w.steps[2], { x: 648 }, 322), label(w.steps[3], { right: 1108 }, 322)],
  },
  {
    base: 'og-journal-releases.jpg', out: { es: 'es/og-liberar-inventario-en-un-edificio-nuevo.jpg', pt: 'pt/og-liberar-estoque-em-um-edificio-novo.jpg' },
    // (the floor plates stand from x 880; the legend's keys stay, only their words are set again)
    patches: [...noteTop(800), ...strips(136, 354, 200, 124, 2, 66), [860, 546, 260, 22, [860, 30]]],
    words: {
      en: { head: ['Releasing inventory', 'in a new building'], kick: NOTE.en, keys: ['First release', 'Second release', 'Third release', 'Held back'], foot: 'Illustrative release plan' },
      es: { head: ['Liberar el inventario', 'de un edificio nuevo'], kick: NOTE.es, keys: ['Primera etapa', 'Segunda etapa', 'Tercera etapa', 'Reservadas'], foot: 'Plan ilustrativo de etapas' },
      pt: { head: ['Liberar o estoque', 'de um edifício novo'], kick: NOTE.pt, keys: ['Primeira etapa', 'Segunda etapa', 'Terceira etapa', 'Retidas'], foot: 'Plano ilustrativo de etapas' },
    },
    lines: (w) => [...note(w, NOTE2), ...w.keys.map((t, i) => label(t, { x: 142 }, 370 + 34 * i))],
  },
  {
    base: 'og-journal-outside-brokers.jpg', out: { es: 'es/og-trabajar-con-corredores-externos.jpg', pt: 'pt/og-trabalhar-com-corretores-externos.jpg' },
    patches: [...noteTop(), [76, 384, 1044, 20, [76, 30]], [820, 546, 300, 22, [820, 30]]],
    words: {
      en: { head: ['Working with', 'outside brokers'], kick: NOTE.en, steps: ['Registration', 'First visit', 'Protection', 'Contract', 'Closing'], foot: 'Cooperating broker program' },
      es: { head: ['Trabajar con', 'corredores externos'], kick: NOTE.es, steps: ['Registro', 'Primera visita', 'Protección', 'Contrato', 'Cierre'], foot: 'Programa de colaboración con corredores' },
      pt: { head: ['Trabalhar com', 'corretores externos'], kick: NOTE.pt, steps: ['Cadastro', 'Primeira visita', 'Proteção', 'Contrato', 'Fechamento'], foot: 'Programa de cooperação com corretores' },
    },
    lines: (w) => [...note(w, NOTE2), label(w.steps[0], { x: 84 }, 400, { size: 13.5, ls: '.17em' }), label(w.steps[1], { center: 341.5 }, 400), label(w.steps[2], { x: 568 }, 400, { color: BRONZE }), label(w.steps[3], { center: 841.5 }, 400), label(w.steps[4], { right: 1116 }, 400)],
  },
  {
    // ivory: the sheet's label, the title and its line, and the New York label under its skyline (Miami reads the same)
    base: 'og-journal-miami-new-york.jpg', out: { es: 'es/og-lanzar-en-miami-y-nueva-york.jpg', pt: 'pt/og-lancar-em-miami-e-nova-york.jpg' },
    patches: [[930, 66, 210, 30, [930, 2]], ...strips(50, 112, 900, 170, 2, 44), [655, 594, 165, 18, [655, 2]]],
    words: {
      en: { lab: 'Developer note', head: 'Miami and New York', sub: 'Launching a new condominium in each city, side by side', ny: 'New York' },
      es: { lab: 'Nota para desarrolladores', head: 'Miami y Nueva York', sub: 'Lanzar un condominio nuevo en cada ciudad, lado a lado', ny: 'Nueva York' },
      pt: { lab: 'Nota para incorporadoras', head: 'Miami e Nova York', sub: 'Lançar um condomínio novo em cada cidade, lado a lado', ny: 'Nova York' },
    },
    lines: (w) => [
      { t: w.lab, right: 1136, base: 89, size: 17, face: 'body', weight: 500, color: '#6E675D', ls: '.2em', upper: true },
      { t: w.head, x: 60, base: 205, size: 104, face: 'display', weight: 300, color: INK, ls: '-.01em' },
      { t: w.sub, x: 66, base: 261, size: 26, face: 'body', weight: 400, color: '#4A463F', ls: '0' },
      { t: w.ny, x: 664, base: 609, size: 15, face: 'body', weight: 500, color: '#6E675D', ls: '.2em', upper: true },
    ],
  },
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
  const lines = c.lines(w).map((l) => `<p class="l" data-base="${l.base}" style="${l.right != null ? `right:${1200 - l.right}px` : l.center != null ? `left:${l.center}px;translate:-50% 0` : `left:${l.x}px`};top:${l.base}px;font:${l.weight} ${l.size}px ${l.face === 'display' ? 'D' : 'B'};letter-spacing:${l.ls || 0};color:${l.color};${l.upper ? 'text-transform:uppercase;' : ''}${l.num ? 'font-variant-numeric:tabular-nums;' : ''}${l.em ? `--em:${l.em};` : ''}${l.emw ? `--emw:${l.emw};` : ''}${l.emls ? `--emls:${l.emls};` : ''}${l.emml ? `--emml:${l.emml}` : ''}"><span>${l.t}</span></p>`).join('');
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
    // (a photograph card that runs over the site's 250 KB limit steps down in quality until it fits, with room to spare)
    let buf;
    for (let q = 92; ; q -= 4) {
      buf = await page.screenshot({ type: jpg ? 'jpeg' : 'png', quality: jpg ? q : undefined });
      if (!jpg || buf.length <= 240 * 1024 || q <= 60) break;
    }
    writeFileSync(out, buf);
    console.log(out);
  }
}
rmSync(tmp, { recursive: true, force: true });
await browser.close();
