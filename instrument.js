// © Centamont. Not open source: centamont.com/terms.html. Built from _src/instrument.js by tools/version.py: edit the source, not this file.
const cmWords = ({
es: {
planner: 'https://centamont.com/es/planificador.html?',
planned: 'Previsto', ground: 'Inicio de obra', top: 'Coronación', done: 'Terminación', axis: 'Meses desde el lanzamiento',
build: 'Construcción', par: 'A la par', signed: 'Contratos firmados', lim: 'Umbral de preventa', limShort: 'Umbral',
above: (n) => n + '% por encima', below: (n) => n + '% por debajo', month: (m) => 'Mes ' + m, pct: (n) => n + ' por ciento',
forSale: (n) => n + '% en venta', notMet: 'No alcanzado', limNotMet: 'Umbral no alcanzado', and: 'y',
sayPar: (c) => c.hit < 0 ? 'A la par, el umbral no se alcanza en ' + c.M + ' meses.' : 'A la par, el umbral se alcanza en el mes ' + c.hit +
(c.late > 0 ? ', y la obra empieza entonces, ' + c.late + (c.late === 1 ? ' mes' : ' meses') + ' más tarde de lo previsto' : ', a tiempo para empezar la obra como estaba previsto, en el mes ' + c.plan) +
'. Al terminar, en el mes ' + c.done + ', alrededor del ' + c.pct + ' por ciento del edificio está bajo contrato.',
sayOff: (c) => 'Cada residencia se vende un ' + Math.abs(c.p) + ' por ciento ' + (c.p > 0 ? 'más cara' : 'más barata') +
(c.p > 0 && (c.hit < 0 || c.d > 0) ? ', pero ' : '; ') +
(c.hit < 0 ? 'el umbral no se alcanza en ' + c.M + ' meses' : c.d === 0 ? 'el umbral llega el mismo mes' : 'el umbral llega ' + Math.abs(c.d) + (Math.abs(c.d) === 1 ? ' mes ' : ' meses ') + (c.d > 0 ? 'más tarde' : 'antes')) +
'. Al terminar la obra' + (c.moved ? ', en el mes ' + c.done + ',' : '') + ' el ' + c.unsold + ' por ciento sigue en venta, frente al ' + c.unsoldPar + ' por ciento a la par' + (c.moved ? ' en el mes ' + c.baseC : '') + '.',
mark: (m, n) => 'mes ' + m + ', ' + n + ' por ciento',
figure: (say, marks) => 'Curva de ventas ilustrativa. ' + say + ' Bajo contrato: ' + marks + '.',
heard: (m, n) => 'Mes ' + m + ', ' + n + ' por ciento bajo contrato.',
salute: 'Estimados socios:', sign: 'Saludos cordiales,',
asks: { where: 'el barrio', units: 'el número de residencias', area: 'la zona', mkt: 'su mercado', niche: 'su especialidad', name: 'su nombre', company: 'el nombre de su empresa', email: 'su correo electrónico' },
of: ', de ', plan: 'Mi plan: ',
ask: (l) => 'Complete primero ' + l + ', para que los socios sepan quién les escribe y por qué.',
subject: { dev: 'Desarrollador', buy: 'Cliente privado', adv: 'Asesor' },
residences: (n) => n + (n === '1' ? ' residencia' : ' residencias'),
copied: ['Su carta está abierta en su correo, dirigida a ', '. Si no se abrió nada, también está copiada: péguela en un mensaje nuevo a esa dirección. Un socio le responderá personalmente para concertar una primera conversación.'],
launchIn: (m, y) => 'en ' + ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'][m - 1] + ' de ' + y,
notCopied: ['Su carta está abierta en su correo, dirigida a ', '. Si no se abrió nada, copie la carta de abajo y envíela a esa dirección.'],
badEmail: 'Revise su correo electrónico, para que un socio pueda responderle.', sending: 'Enviando su carta…',
sent: 'Su carta ya está con los socios. Un socio le responderá personalmente para concertar una primera conversación.',
notSent: ['No se pudo enviar la carta desde aquí. ', 'Ábrala en su correo', ', dirigida a office@centamont.com, o cópiela de abajo.'],
},
pt: {
planner: 'https://centamont.com/pt/planejador.html?',
planned: 'Previsto', ground: 'Início da obra', top: 'Estrutura concluída', done: 'Conclusão', axis: 'Meses desde o lançamento',
build: 'Construção', par: 'Em paridade', signed: 'Contratos assinados', lim: 'Patamar de pré-venda', limShort: 'Patamar',
above: (n) => n + '% acima', below: (n) => n + '% abaixo', month: (m) => 'Mês ' + m, pct: (n) => n + ' por cento',
forSale: (n) => n + '% à venda', notMet: 'Não atingido', limNotMet: 'Patamar não atingido', and: 'e',
sayPar: (c) => c.hit < 0 ? 'Em paridade, o patamar não é atingido em ' + c.M + ' meses.' : 'Em paridade, o patamar é atingido no mês ' + c.hit +
(c.late > 0 ? ', e a obra começa então, ' + c.late + (c.late === 1 ? ' mês' : ' meses') + ' depois do previsto' : ', a tempo de a obra começar como previsto, no mês ' + c.plan) +
'. Na conclusão, no mês ' + c.done + ', cerca de ' + c.pct + ' por cento do edifício está sob contrato.',
sayOff: (c) => 'Cada residência é vendida ' + Math.abs(c.p) + ' por cento ' + (c.p > 0 ? 'mais cara' : 'mais barata') +
(c.p > 0 && (c.hit < 0 || c.d > 0) ? ', mas ' : '; ') +
(c.hit < 0 ? 'o patamar não é atingido em ' + c.M + ' meses' : c.d === 0 ? 'o patamar é atingido no mesmo mês' : 'o patamar é atingido ' + Math.abs(c.d) + (Math.abs(c.d) === 1 ? ' mês ' : ' meses ') + (c.d > 0 ? 'mais tarde' : 'mais cedo')) +
'. Na conclusão da obra' + (c.moved ? ', no mês ' + c.done + ',' : '') + ' ' + c.unsold + ' por cento ainda está à venda, contra ' + c.unsoldPar + ' por cento em paridade' + (c.moved ? ' no mês ' + c.baseC : '') + '.',
mark: (m, n) => 'mês ' + m + ', ' + n + ' por cento',
figure: (say, marks) => 'Curva de vendas ilustrativa. ' + say + ' Sob contrato: ' + marks + '.',
heard: (m, n) => 'Mês ' + m + ', ' + n + ' por cento sob contrato.',
salute: 'Prezados sócios,', sign: 'Atenciosamente,',
asks: { where: 'o bairro', units: 'o número de residências', area: 'a região', mkt: 'o seu mercado', niche: 'o seu foco', name: 'o seu nome', company: 'o nome da sua empresa', email: 'o seu e-mail' },
of: ', ', plan: 'Meu plano: ',
ask: (l) => 'Preencha primeiro ' + l + ', para que os sócios saibam quem está escrevendo e por quê.',
subject: { dev: 'Incorporadora', buy: 'Cliente privado', adv: 'Consultor' },
residences: (n) => n + (n === '1' ? ' residência' : ' residências'),
copied: ['Sua carta está aberta no seu e-mail, endereçada a ', '. Se nada abriu, ela também foi copiada: cole-a em uma nova mensagem para esse endereço. Um sócio responderá pessoalmente para marcar uma primeira conversa.'],
launchIn: (m, y) => 'em ' + ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'][m - 1] + ' de ' + y,
notCopied: ['Sua carta está aberta no seu e-mail, endereçada a ', '. Se nada abriu, copie a carta abaixo e envie-a para esse endereço.'],
badEmail: 'Confira o seu e-mail, para que um sócio possa responder.', sending: 'Enviando sua carta…',
sent: 'Sua carta já está com os sócios. Um sócio responderá pessoalmente para marcar uma primeira conversa.',
notSent: ['Não foi possível enviar a carta daqui. ', 'Abra-a no seu e-mail', ', endereçada a office@centamont.com, ou copie-a abaixo.'],
},
})[(document.documentElement.lang || 'en').slice(0, 2)] || {};
const cmSay = (k, en, ...a) => { const v = k in cmWords ? cmWords[k] : en; return typeof v === 'function' ? v(...a) : v; };
(function () {
const c = document.getElementById('curve'); if (!c) return;
c.classList.add('ready');
const f = c.querySelector('.cv-fig'), r = c.querySelector('.cv-read');
if (!f || !r || !window.ResizeObserver) return;
const ro = new ResizeObserver((es) => es.forEach((e) => c.style.setProperty(e.target === f ? '--cv-fh' : '--cv-rh', e.borderBoxSize[0].blockSize + 'px')));
ro.observe(f); ro.observe(r);
})();
document.addEventListener('DOMContentLoaded', function () {
const svg = document.getElementById('cvSvg');
if (svg) {
const price = document.getElementById('cvPrice'), loan = document.getElementById('cvLoan');
const out = (id) => document.getElementById(id);
const PLAN = 12, BUILD = 24;
let M = 36, BREAK = PLAN, TOP = PLAN + BUILD - 6, DONE = PLAN + BUILD;
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs, parent, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; (parent || svg).appendChild(e); return e; };
let W, H, X0, X1, Y0, Y1;
const x = (m) => X0 + (X1 - X0) * m / M, y = (f) => Y1 - (Y1 - Y0) * f;
function model(p, t = +loan.value / 100) {
const base = 0.035 * Math.exp(-0.05 * p), s = [0];
let left = 1, G = -1;
for (let m = 0; m < 120; m++) {
let a = base;
if (m < 3) a *= 3;
if (G > -1) {
const top = G + BUILD - 6;
if (m >= G && m < G + 2) a *= 1.3;
else if (m >= top && m < top + 3) a *= 1.5;
else if (m >= G + BUILD) a *= 1.25;
}
left *= 1 - a; s.push(1 - left);
if (G < 0 && m + 1 >= PLAN && s[m + 1] >= t) G = m + 1;
}
s.G = G; s.C = G + BUILD;
return s;
}
const fix = () => { const s = model(+price.value); BREAK = s.G; TOP = s.G + BUILD - 6; DONE = s.C; M = Math.max(36, Math.ceil((DONE + 3) / 6) * 6); return M + ' ' + BREAK; };
let drawn = '';
let build, area, par, line, lim, limT, dot, dotT, labC, labP, labB, dimL, dimT, ring;
const keyRow = document.querySelector('.cv-key'), fig = svg.closest('.cv-fig');
const narrow = matchMedia('(max-width:520px)');
const wide = matchMedia('(min-width:901px)');
let phone = false;
let measured = 0;
function size() {
measured = svg.clientWidth || 0;
W = Math.max(240, Math.round(measured || 640));
phone = narrow.matches;
H = Math.round(phone ? 260 : W >= 520 ? Math.min(500, W * (wide.matches ? 0.62 : 0.76)) : Math.max(280, Math.min(380, W * 0.52)));
H = Math.min(H, Math.max(240, Math.round(innerHeight - 80)));
svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
if (keyRow) keyRow.classList.toggle('lim-key', W < 520);
}
function sheet() {
size(); drawn = fix();
X0 = 54; X1 = W - 14;
const TC = 14 + 8;
svg.textContent = '';
const g = el('g', { class: 'cv-grid' });
const phases = phone ? [] : [...(BREAK > PLAN ? [[PLAN, cmSay('planned', 'Planned')]] : []), [BREAK, cmSay('ground', 'Ground broken')], [TOP, cmSay('top', 'Top-off')], [DONE, cmSay('done', 'Completion')]];
const tl = [];
phases.forEach(([m, t]) => { const e = el('text', { class: 'ph', 'text-anchor': 'start' }, g, t); tl.push([m, e, e.getComputedTextLength() || t.length * 8]); });
const wLast = tl.length ? tl[tl.length - 1][2] : 0;
const plan = (X1p) => {
const opts = tl.map(([m, , w]) => {
const sx = X0 + (X1p - X0) * m / M, o = [];
for (let row = 0; row < 3; row++) for (const anchor of ['start', 'end']) {
const a = anchor === 'start' ? sx + 6 : sx - 6, l = anchor === 'start' ? a : a - w, r = l + w;
if (l >= 2 && r <= W - (row ? 4 : TC)) o.push({ row, anchor, a, l, r, sx });
}
return o;
});
const clear = (o, c) => (c.row !== o.row || o.l >= c.r + 12 || o.r <= c.l - 12) &&
!(o.l - 4 < c.sx && c.sx < o.r + 4) && !(c.l - 4 < o.sx && o.sx < c.r + 4);
let best = null, bestCost = Infinity;
const place = (i, chosen) => {
if (i === opts.length) {
let order = 0, rise = 0;
chosen.forEach((c, k) => { for (let j = k + 1; j < chosen.length; j++) { if (c.l + c.r > chosen[j].l + chosen[j].r) order++; if (chosen[j].row < c.row) rise++; } });
const cost = 100 * Math.max(...chosen.map((c) => c.row)) + 120 * chosen.filter((c) => c.anchor === 'end').length + 5 * chosen.reduce((n, c) => n + c.row, 0) + 250 * order + 400 * rise;
if (cost < bestCost) { bestCost = cost; best = chosen.slice(); }
return;
}
opts[i].forEach((o) => { if (chosen.every((c) => clear(o, c))) { chosen.push(o); place(i + 1, chosen); chosen.pop(); } });
};
place(0, []);
return best ? { X1p, best, ok: true, rows: Math.max(0, ...best.map((c) => c.row)) } : { X1p, best: [], ok: false, rows: 9 };
};
let pl = phone ? { X1p: W - 14, best: [], ok: true, rows: 0 } : plan(Math.min(W - 14, Math.floor(X0 + (W - TC - X0 - 6 - wLast) * M / DONE)));
if (!phone && W < 520 && pl.X1p < W - 14) { const full = plan(W - 14); if (full.ok && (!pl.ok || full.rows <= pl.rows + 1)) pl = full; }
if (!pl.ok) { tl.forEach(([, e]) => e.remove()); tl.length = 0; pl.X1p = W - 14; }
if (fig) fig.classList.toggle('ph-row', !phone && !pl.ok);
X1 = pl.X1p;
const best = pl.best;
let two = 0;
tl.forEach(([, e], i) => { const c = best[i]; two = Math.max(two, c.row); e.dataset.row = c.row; e.setAttribute('x', c.a); e.setAttribute('text-anchor', c.anchor); });
const tight = matchMedia('(max-width:1040px)').matches;
const over = (a, b) => (tight ? a.l < b.r + 12 && b.l < a.r + 12 : a.l < b.r && b.l < a.r);
const P = best.some((a) => best.some((b) => b.row === a.row + 1 && over(a, b))) ? (tight ? 30 : 22) : 16;
Y0 = tl.length ? 34 + P * two : 30; Y1 = H - 52;
tl.forEach(([m, e]) => e.setAttribute('y', 18 + P * +e.dataset.row));
[0.25, 0.5, 0.75, 1].forEach((f) => { el('line', { x1: X0, x2: X1, y1: y(f), y2: y(f) }, g); el('text', { x: X0 - 8, y: y(f) + 4, 'text-anchor': 'end' }, g, Math.round(f * 100) + '%'); });
tl.forEach(([m, e]) => { const l = el('line', { class: m < BREAK ? 'phase plan' : 'phase', x1: x(m), x2: x(m), y1: 6 + P * +e.dataset.row, y2: Y1 }, g); g.insertBefore(l, g.firstChild); });
if (!tl.length) [BREAK, TOP, DONE].forEach((m) => { const l = el('line', { class: 'phase', x1: x(m), x2: x(m), y1: Y0 - 8, y2: Y1 }, g); g.insertBefore(l, g.firstChild); });
el('line', { class: 'axis', x1: X0, x2: X1, y1: Y1, y2: Y1 }, g);
const step = W < 420 ? 12 : 6;
for (let m = 0; m <= M; m += step) { el('line', { class: 'axis', x1: x(m), x2: x(m), y1: Y1, y2: Y1 + 5 }, g); el('text', { x: x(m), y: Y1 + 20, 'text-anchor': m === 0 ? 'start' : m === M ? 'end' : 'middle' }, g, String(m)); }
el('text', { class: 'ph cv-axt', x: X1, y: Y1 + 37, 'text-anchor': 'end' }, g, cmSay('axis', 'Months from launch'));
build = el('path', { class: 'cv-build', d: `M${x(BREAK)} ${Y1} L${x(DONE)} ${y(1)}` });
area = el('path', { class: 'cv-area' }); par = el('path', { class: 'cv-par' }); line = el('path', { class: 'cv-line' });
dimL = el('path', { class: 'cv-dim' }); ring = el('circle', { class: 'cv-dimr', r: 3.5 }); dimT = el('text', { class: 'cv-dimt' });
lim = el('line', { class: 'cv-lim' }); limT = el('text', { class: 'cv-limt', 'text-anchor': 'end' });
dot = el('circle', { class: 'cv-dot', r: 4.5 }); dotT = el('text', { class: 'cv-dott' });
labC = labP = labB = null;
if (phone) { labB = el('text', { class: 'cv-lab faint' }, null, cmSay('build', 'Construction')); labP = el('text', { class: 'cv-lab' }, null, cmSay('par', 'At par')); labC = el('text', { class: 'cv-lab' }, null, cmSay('signed', 'Contracts signed')); }
}
const path = (s) => s.slice(0, M + 1).map((f, m) => (m ? 'L' : 'M') + x(m).toFixed(1) + ' ' + y(f).toFixed(1)).join(' ');
const fmt = (p) => (p === 0 ? cmSay('par', 'At par') : (p > 0 ? cmSay('above', (n) => n + '% above', p) : cmSay('below', (n) => n + '% below', -p)));
const list = (a) => a.slice(0, -1).join('; ') + '; ' + cmSay('and', 'and') + ' ' + a[a.length - 1];
const key = document.querySelector('.cv-key .k-par');
const tw = document.getElementById('cvTower'), reduceM = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
const G = window.CentamontModel && window.CentamontModel.geo;
const RES = G ? (G.RES1 - G.RES0) * 2 : 38, homes = [];
let lastN = 0;
if (tw && G) {
const A = 0.32, ca = Math.cos(A), sa = Math.sin(A), E = 0.17, ce = Math.cos(E), se = Math.sin(E);
let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
const P = (p, y) => { const X = p.x * ca + p.z * sa, Y = -(y * ce + (-p.x * sa + p.z * ca) * se); x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); return X.toFixed(3) + ' ' + Y.toFixed(3); };
const poly = (pts, cls, g = tw) => el('path', { d: 'M' + pts.join('L') + 'Z', class: cls }, g);
const faces = (nx, nz) => -nx * sa + nz * ca < -0.02, lit = (nx, nz) => Math.max(0, -0.62 * nx - 0.78 * nz);
const runs = (ring, side) => {
const n = ring.length, seg = (j) => { const p = ring[j], q = ring[(j + 1) % n]; return { j, p, q, nx: (p.nx + q.nx) / 2, nz: (p.nz + q.nz) / 2, s: side ? side(p, q) : 0 }; };
let i0 = 0; while (i0 < n && faces(seg(i0).nx, seg(i0).nz)) i0++;
const out = []; let cur = null;
for (let t = 1; t <= n; t++) {
const g = seg((i0 + t) % n);
if (!faces(g.nx, g.nz)) { cur = null; continue; }
if (!cur || cur.s !== g.s) out.push(cur = { s: g.s, segs: [] });
cur.segs.push(g);
}
return out;
};
const ribbon = (segs, ya, yb, cls, g) => poly([...segs.map((o) => P(o.p, yb)), P(segs[segs.length - 1].q, yb), P(segs[segs.length - 1].q, ya), ...segs.slice().reverse().map((o) => P(o.p, ya))], cls, g);
const band = (ring, ya, yb, cls, side, shade) => runs(ring, side).map((r) => {
const path = ribbon(r.segs, ya, yb, cls);
if (shade) for (const o of r.segs) { const d = 1 - lit(o.nx, o.nz); if (d > 0.08) ribbon([o], ya, yb, 'tw-shade').style.opacity = (0.9 * d * d).toFixed(2); }
return { path, s: r.s };
});
const deck = (ring, y, cls) => poly(ring.map((p) => P(p, y)), cls);
const plans = Array.from({ length: G.FLOORS }, (_, k) => G.plan(k, 3));
const bay = (p, q) => (p.lx + q.lx > 0 ? 0 : 1);
const slabOf = (k) => (k === 1 ? null : k === G.RES0 || k === G.CROWN || k === G.FLOORS ? plans[k - 1].slab : plans[k].slab);
const plate = plans[0].glass.map((p) => ({ x: p.x + p.nx * 1.3, z: p.z + p.nz * 1.3, nx: p.nx, nz: p.nz }));
deck(plate, 0, 'tw-plate'); band(plate, -0.22, 0, 'tw-edge');
for (let k = 0; k <= G.FLOORS; k++) {
const ring = slabOf(k);
if (ring) { band(ring, k, k + G.SLAB, 'tw-edge'); deck(ring, k + G.SLAB, 'tw-deck'); if (k >= G.RES0) band(ring.map((p) => ({ ...p, x: p.x - p.nx * 0.05, z: p.z - p.nz * 0.05 })), k + G.SLAB, k + G.SLAB + G.RAIL_H, 'tw-rail'); }
if (k === 1 || k === G.FLOORS) continue;
const g = plans[k].glass, ya = k + G.SLAB, yb = k === 0 ? 2 : k + 1;
for (const r of band(g, ya, yb, k < G.RES0 ? 'tw-pod' : 'tw-res', k < G.RES0 ? null : bay, true)) if (k >= G.RES0) homes.push({ r: r.path, rank: G.RANK[k * 2 + r.s] });
if (k === 0) runs(g).forEach((r) => r.segs.forEach((o, i) => { if (i % 2 === 0) poly([P(o.p, ya), P(o.p, yb)], 'tw-mull'); }));
}
const top = G.FLOORS + G.SLAB, ht = top + G.SCREEN_H, scr = plans[G.FLOORS - 1].glass.map((p) => ({ x: p.x - p.nx * 0.2, z: p.z - p.nz * 0.2, nx: p.nx, nz: p.nz, lx: p.lx }));
band(scr, top, ht, 'tw-screen', null, true);
runs(scr).forEach((r) => r.segs.forEach((o, i) => { if (i % 2 === 0) poly([P(o.p, top), P(o.p, ht)], 'tw-fin'); }));
band(scr, ht - 0.1, ht, 'tw-edge'); deck(scr, ht, 'tw-lid');
const c = { x: 0, z: 0 };
poly([P(c, ht), P(c, ht + G.BEACON)], 'tw-fin');
const [bx, by] = P(c, ht + G.BEACON).split(' ');
el('circle', { cx: bx, cy: by, r: 0.17, class: 'tw-beacon' }, tw);
tw.setAttribute('viewBox', [x0 - 0.3, y0 - 0.4, x1 - x0 + 0.6, y1 - y0 + 0.6].map((v) => v.toFixed(2)).join(' '));
}
function draw() {
const p = +price.value, T = +loan.value / 100, s = model(p), base = model(0);
out('cvPriceOut').textContent = fmt(p);
out('cvLoanOut').textContent = loan.value + '%';
price.setAttribute('aria-valuetext', fmt(p)); loan.setAttribute('aria-valuetext', cmSay('pct', (n) => n + ' percent', loan.value));
if (key) key.parentNode.hidden = p === 0;
par.setAttribute('d', p ? path(base) : '');
line.setAttribute('d', path(s));
area.setAttribute('d', path(s) + ` L${x(M)} ${Y1} L${x(0)} ${Y1} Z`);
lim.setAttribute('x1', X0); lim.setAttribute('x2', X1); lim.setAttribute('y1', y(T)); lim.setAttribute('y2', y(T));
limT.setAttribute('x', X1); limT.setAttribute('y', y(T) - 8); limT.textContent = cmSay('lim', 'Pre-sale threshold');
const hit = s.findIndex((f) => f >= T), done = s[DONE], baseHit = base.findIndex((f) => f >= T), baseDone = base[base.C];
const pts = [];
for (const c of p ? [s, base] : [s]) for (let i = 0; i < M; i++) for (let t = 0; t < 1; t += 0.25) pts.push([x(i + t), y(c[i] + (c[i + 1] - c[i]) * t)]);
pts.push([x(M), y(s[M])]);
const crosses = (b) => pts.some(([px, py]) => px > b.x - 4 && px < b.x + b.width + 4 && py > b.y - 3 && py < b.y + b.height + 3);
if (hit > -1) {
const right = x(hit) > X1 - 90; dot.setAttribute('cx', x(hit)); dot.setAttribute('cy', y(T)); dot.style.display = ''; dotT.textContent = cmSay('month', (m) => 'Month ' + m, hit);
const sides = right ? [[-10, 'end'], [10, 'start']] : [[10, 'start'], [-10, 'end']], spots = [];
for (const dy of [22, -12, 38, -28]) for (const [dx, an] of sides) spots.push([dx, an, dy]);
const hits = spots.map(([dx, an, dy]) => { dotT.setAttribute('x', x(hit) + dx); dotT.setAttribute('text-anchor', an); dotT.setAttribute('y', y(T) + dy); const b = dotT.getBBox(); return b.x < X0 + 2 || b.x + b.width > W - 2 || b.y < 2 || b.y + b.height > Y1 ? Infinity : pts.filter(([px, py]) => px > b.x - 4 && px < b.x + b.width + 4 && py > b.y - 3 && py < b.y + b.height + 3).length; });
const [dx, an, dy] = spots[hits.indexOf(Math.min(...hits))];
dotT.setAttribute('x', x(hit) + dx); dotT.setAttribute('text-anchor', an); dotT.setAttribute('y', y(T) + dy);
}
else { dot.style.display = 'none'; dotT.textContent = ''; }
const left = 1 - done, xd = x(DONE), yd = y(done), yt = y(1);
ring.setAttribute('cx', xd); ring.setAttribute('cy', yd);
dimT.textContent = '';
if (left >= 0.03 && yd - yt > 18) {
const sl = (yy) => `M${xd - 4} ${yy + 4} L${xd + 4} ${yy - 4}`;
dimL.setAttribute('d', `M${xd} ${yd - 6} L${xd} ${yt} ${sl(yt)} ${sl(yd - 6)}`);
dimT.textContent = cmSay('forSale', (n) => n + '% for sale', Math.round(left * 100));
const lines = pts.concat(Array.from({ length: 49 }, (_, i) => [x(BREAK + (DONE - BREAK) * i / 48), Y1 - (Y1 - yt) * i / 48]));
const ym = (yd + yt) / 2 + 5, near = dotT.textContent ? dotT.getBBox() : null;
let ok = false;
for (const [dx, an] of [[8, 'start'], [-8, 'end']]) {
dimT.setAttribute('x', xd + dx); dimT.setAttribute('text-anchor', an); dimT.setAttribute('y', ym);
const b = dimT.getBBox();
if (b.x < X0 + 2 || b.x + b.width > W - 2) continue;
if (lines.some(([px, py]) => px > b.x - 3 && px < b.x + b.width + 3 && py > b.y - 2 && py < b.y + b.height + 2)) continue;
if (near && !(near.x > b.x + b.width || near.x + near.width < b.x || near.y > b.y + b.height || near.y + near.height < b.y)) continue;
ok = true; break;
}
if (!ok) { dimT.textContent = ''; dimL.setAttribute('d', ''); }
} else dimL.setAttribute('d', '');
const dotB0 = dotT.textContent ? dotT.getBBox() : null, dimB = dimT.textContent ? dimT.getBBox() : null;
const notes = [dotB0, dimB].filter(Boolean);
const spots = [[X1, 'end', -8], [X0 + 6, 'start', -8], [X1, 'end', 18], [X0 + 6, 'start', 18]].map(([lx, anchor, dy]) => {
limT.setAttribute('x', lx); limT.setAttribute('text-anchor', anchor); limT.setAttribute('y', y(T) + dy);
const b = limT.getBBox(), curve = crosses(b);
const note = notes.some((n) => !(n.x > b.x + b.width || n.x + n.width < b.x || n.y > b.y + b.height || n.y + n.height < b.y));
return { lx, anchor, dy, curve, note };
});
const pick = spots.find((o) => !o.curve && !o.note) || spots.find((o) => !o.note) || spots[0];
limT.setAttribute('x', pick.lx); limT.setAttribute('text-anchor', pick.anchor); limT.setAttribute('y', y(T) + pick.dy);
if (W < 520 && !phone) limT.textContent = '';
if (phone) {
const lines = pts.slice();
for (let i = 0; i <= 48; i++) lines.push([x(BREAK + (DONE - BREAK) * i / 48), Y1 - (Y1 - y(1)) * i / 48]);
for (let px = X0; px <= X1; px += 4) lines.push([px, y(T)]);
const taken = notes.slice();
const name = (t, text, at) => {
t.textContent = text; let pickN = null, least = Infinity;
for (const [lx, an, ly] of at) {
t.setAttribute('x', lx); t.setAttribute('text-anchor', an); t.setAttribute('y', ly);
const b = t.getBBox();
if (b.x < X0 + 2 || b.x + b.width > W - 2 || b.y < 2 || b.y + b.height > Y1 - 1) continue;
if (taken.some((q) => !(q.x > b.x + b.width + 4 || q.x + q.width < b.x - 4 || q.y > b.y + b.height + 2 || q.y + q.height < b.y - 2))) continue;
const n = lines.filter(([px, py]) => px > b.x - 3 && px < b.x + b.width + 3 && py > b.y - 2 && py < b.y + b.height + 2).length;
if (n < least) { least = n; pickN = [lx, an, ly]; if (!n) break; }
}
if (!pickN) { t.textContent = ''; return; }
t.setAttribute('x', pickN[0]); t.setAttribute('text-anchor', pickN[1]); t.setAttribute('y', pickN[2]); taken.push(t.getBBox());
};
const yT = y(T), pe = y(base[M]), mm = Math.round(M * 0.72), pm = y(base[mm]), se = y(s[M]);
name(limT, cmSay('limShort', 'Threshold'), [[X0 + 6, 'start', yT - 8], [X1, 'end', yT - 8], [X1, 'end', yT + 18], [X0 + 6, 'start', yT + 18]]);
name(labP, p ? cmSay('par', 'At par') : '', !p ? [] : p > 0 ? [[X1, 'end', pe - 8], [X1, 'end', pe - 22], [x(mm), 'end', pm - 8], [x(M / 2), 'end', y(base[M / 2]) - 8]] : [[x(mm), 'start', pm + 18], [x(M / 2), 'start', y(base[M / 2]) + 18], [X1, 'end', pe + 18], [X1, 'end', pe + 30]]);
name(labB, cmSay('build', 'Construction'), [[x(DONE) - 8, 'end', y(1) - 6], [x(BREAK) + 22, 'start', Y1 - 8]]);
name(labC, cmSay('signed', 'Contracts signed'), [[X1, 'end', Y1 - 8], [X1, 'end', Y1 - 24], [X1, 'end', se - 8], [X1, 'end', se + 18]]);
}
out('cvMonth').textContent = hit > -1 ? cmSay('month', (m) => 'Month ' + m, hit) : cmSay('notMet', 'Not met');
out('cvDone').textContent = Math.round(done * 100) + '%';
[['cvPhG', BREAK], ['cvPhT', TOP], ['cvPhC', DONE]].forEach(([id, m]) => { const e = out(id); if (e) e.textContent = m; });
out('cvNowM').textContent = hit > -1 ? cmSay('month', (m) => 'Month ' + m, hit) : cmSay('limNotMet', 'Threshold not met'); out('cvNowD').textContent = Math.round(done * 100) + '%';
if (homes.length) { const n = Math.round(done * RES); for (const h of homes) { h.r.classList.toggle('on', h.rank < n); h.r.style.transitionDelay = (reduceM ? 0 : Math.abs(h.rank - lastN) * 14) + 'ms'; } lastN = n; }
let say;
const pct = Math.round(done * 100), unsold = Math.round((1 - done) * 100), unsoldPar = Math.round((1 - baseDone) * 100), late = BREAK - PLAN;
if (hit < 0) say = 'At ' + (p ? fmt(p).toLowerCase() : 'par') + ', the threshold is not met within ' + M + ' months.';
else if (p === 0) say = 'At par, the threshold is met in month ' + hit + (late > 0 ? ', and ground breaks with it, ' + late + (late === 1 ? ' month' : ' months') + ' later than planned' : ', in time for ground breaking as planned, in month ' + PLAN) + '. By completion in month ' + DONE + ', about ' + pct + ' percent of the building is under contract.';
else {
const d = hit - baseHit;
const when = d === 0 ? 'the threshold arrives in the same month' : 'the threshold arrives ' + Math.abs(d) + (Math.abs(d) === 1 ? ' month ' : ' months ') + (d > 0 ? 'later' : 'sooner');
const join = p > 0 && d > 0 ? ', but ' : '; ';
const moved = DONE !== base.C;
say = 'Each residence sells for ' + Math.abs(p) + ' percent ' + (p > 0 ? 'more' : 'less') + join + when + '. At completion' + (moved ? ', in month ' + DONE + ',' : '') + ' ' + unsold + ' percent is still for sale, against ' + unsoldPar + ' percent at par' + (moved ? ' in month ' + base.C : '') + '.';
}
const c = { p, pct, hit, M, late, plan: PLAN, done: DONE, d: hit - baseHit, unsold, unsoldPar, moved: DONE !== base.C, baseC: base.C };
if (p === 0 && cmWords.sayPar) say = cmWords.sayPar(c);
else if (p !== 0 && cmWords.sayOff) say = cmWords.sayOff(c);
out('cvSay').textContent = say;
const marks = [];
for (let m = 6; m <= M; m += 6) marks.push(cmSay('mark', (k, n) => 'month ' + k + ', ' + n + ' percent', m, Math.round(s[m] * 100)));
svg.setAttribute('aria-label', cmSay('figure', (t, k) => 'Illustrative sales curve. ' + t + ' Under contract by ' + k + '.', say, list(marks)));
}
let hair, hairT, hdot, last = null;
const read = (m) => {
if (m === null) { if (hair) { hair.remove(); hairT.remove(); hdot.remove(); hair = null; } return; }
const s = model(+price.value), f = s[m];
if (!hair) { hair = el('line', { class: 'cv-hair' }); hdot = el('circle', { class: 'cv-hdot', r: 3.5 }); hairT = el('text', { class: 'cv-hairt' }); }
hair.setAttribute('x1', x(m)); hair.setAttribute('x2', x(m)); hair.setAttribute('y1', y(1)); hair.setAttribute('y2', Y1);
hdot.setAttribute('cx', x(m)); hdot.setAttribute('cy', y(f));
const right = x(m) > (X0 + X1) / 2;
hairT.setAttribute('x', right ? x(m) - 10 : x(m) + 10); hairT.setAttribute('text-anchor', right ? 'end' : 'start'); hairT.setAttribute('y', y(1) + 14);
hairT.textContent = cmSay('month', (k) => 'Month ' + k, m) + ' \u00b7 ' + Math.round(f * 100) + '%';
};
const at = (e) => {
const r = svg.getBoundingClientRect(), u = (e.clientX - r.left) * W / r.width;
const m = Math.round((u - X0) / (X1 - X0) * M);
last = m < 0 || m > M ? null : m; read(last);
};
let kb = null;
svg.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && lastW) at(e); });
svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { last = document.activeElement === svg ? kb : null; read(last); } });
let down = null;
svg.addEventListener('pointerdown', (e) => { down = e.pointerType === 'mouse' ? null : [e.clientX, e.clientY]; });
svg.addEventListener('pointerup', (e) => { if (down && lastW && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 10) at(e); down = null; });
document.addEventListener('pointerdown', (e) => { if (last !== null && e.pointerType !== 'mouse' && !svg.contains(e.target)) { last = null; read(null); } }, { passive: true });
svg.setAttribute('tabindex', '0');
const heard = document.createElement('span');
heard.className = 'vh'; heard.setAttribute('aria-live', 'polite'); svg.after(heard);
const kbd = out('cvKbd');
if (kbd) svg.setAttribute('aria-describedby', 'cvKbd');
const opening = () => { const s = model(+price.value), hit = s.findIndex((f) => f >= +loan.value / 100); return hit > -1 ? hit : DONE; };
svg.addEventListener('focus', () => {
first();
const axt = svg.querySelector('.cv-axt');
if (kbd && axt) { const f = fig.getBoundingClientRect(), t = axt.getBoundingClientRect(); kbd.style.top = ((t.top + t.bottom) / 2 - f.top - kbd.offsetHeight / 2) + 'px'; kbd.style.right = (f.right - t.right - 6) + 'px'; }
if (last === null) last = opening();
kb = last; read(last);
});
svg.addEventListener('blur', () => { last = kb = null; read(null); heard.textContent = ''; });
svg.addEventListener('keydown', (e) => {
if (e.altKey || e.metaKey || e.ctrlKey) return;
const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -6, PageUp: 6 }[e.key];
if (!step && e.key !== 'Home' && e.key !== 'End') return;
if (last === null) last = opening();
const m = e.key === 'Home' ? 0 : e.key === 'End' ? M : last + step;
e.preventDefault(); last = kb = Math.max(0, Math.min(M, m)); read(last);
heard.textContent = cmSay('heard', (m, n) => 'Month ' + m + ', ' + n + ' percent under contract.', last, Math.round(model(+price.value)[last] * 100));
});
const redraw = () => { hair = null; sheet(); draw(); if (last !== null) read(last); };
let lastW = 0;
size();
if (key) key.parentNode.hidden = +price.value === 0;
const first = () => { if (lastW) return; const s = out('cvSay'); s.setAttribute('aria-live', 'off'); redraw(); lastW = W; setTimeout(() => s.setAttribute('aria-live', 'polite'), 600); };
if ('IntersectionObserver' in window) new IntersectionObserver((es, o) => { if (es.some((e) => e.isIntersecting)) { o.disconnect(); first(); } }, { rootMargin: '150% 0px' }).observe(svg);
else setTimeout(first, 200);
const resized = (es) => {
if (!lastW) { const w = es && es[0] ? es[0].contentRect.width : (svg.clientWidth || 0); if (Math.abs(w - measured) > 2) size(); }
else if (Math.abs((svg.clientWidth || 0) - lastW) > 2) { lastW = svg.clientWidth; redraw(); }
};
if (window.ResizeObserver) new ResizeObserver(resized).observe(svg); else addEventListener('resize', resized);
const sayEl = out('cvSay'); let quiet;
const update = () => { if (fix() !== drawn) { hair = null; sheet(); } draw(); if (last !== null) { last = Math.min(last, M); if (kb !== null) kb = last; read(last); } };
const onInput = () => { first(); sayEl.setAttribute('aria-live', 'off'); update(); clearTimeout(quiet); quiet = setTimeout(() => { sayEl.setAttribute('aria-live', 'polite'); const t = sayEl.textContent; sayEl.textContent = ''; sayEl.textContent = t; }, 600); };
price.addEventListener('input', onInput); loan.addEventListener('input', onInput);
const held = document.querySelector('.cv-txt h3');
const clear = (e) => {
const s = e.target;
if (!held || !s.matches(':focus-visible') || getComputedStyle(held).position !== 'sticky') return;
const h = held.getBoundingClientRect(), b = s.getBoundingClientRect();
if (b.top < h.bottom + 32 && b.bottom > h.top) s.scrollIntoView({ block: 'start' });
};
price.addEventListener('focus', clear); loan.addEventListener('focus', clear);
const box = document.getElementById('curve');
let peeked = true;
try { peeked = sessionStorage.getItem('cm-cv-peek') === '1'; } catch (e) {}
if (box && fig && !reduceM && !peeked && 'IntersectionObserver' in window) {
let wait = 0, run = null, v0 = 0, seen = false;
const ring = document.createElement('span');
ring.className = 'cv-ring'; ring.setAttribute('aria-hidden', 'true'); price.parentNode.appendChild(ring);
const setP = (v) => { price.value = v; update(); };
const settle = () => { peeked = true; clearTimeout(wait); io.disconnect(); try { sessionStorage.setItem('cm-cv-peek', '1'); } catch (e) {} };
const play = () => {
if (peeked) return;
settle(); first();
v0 = +price.value; const d = v0 + 2 > +price.max ? -1 : 1, f = (v0 - price.min) / (price.max - price.min);
ring.style.left = (price.offsetLeft + 10.5 + (price.offsetWidth - 21) * f) + 'px';
ring.style.top = (price.offsetTop + price.offsetHeight / 2) + 'px';
ring.classList.add('go');
sayEl.setAttribute('aria-live', 'off');
run = [1, 2, 1, 0].map((k, i) => setTimeout(() => { setP(v0 + d * k); if (i === 3) { run = null; sayEl.setAttribute('aria-live', 'polite'); } }, 120 * (i + 1)));
};
const stop = () => { if (run) { run.forEach(clearTimeout); run = null; setP(v0); sayEl.setAttribute('aria-live', 'polite'); } };
const arm = () => { clearTimeout(wait); if (seen && !peeked) wait = setTimeout(play, 1000); };
const io = new IntersectionObserver((es) => es.forEach((e) => { seen = e.isIntersecting && e.intersectionRatio >= 0.6; arm(); }), { threshold: [0, 0.6] });
io.observe(fig);
ring.addEventListener('animationend', () => ring.classList.remove('go'));
const hand = () => { if (run) stop(); else if (!peeked) settle(); };
box.addEventListener('pointerdown', hand, true); box.addEventListener('keydown', hand, true);
box.addEventListener('wheel', () => { if (run) stop(); else arm(); }, { passive: true, capture: true });
}
}
});
document.addEventListener('DOMContentLoaded', function () {
const form = document.getElementById('letter');
if (form) {
const note = document.getElementById('letterNote');
const paras = [...form.querySelectorAll('.body')];
let mark = () => {};
const show = () => { const v = form.querySelector('input[name="as"]:checked').value; paras.forEach((p) => { p.hidden = p.dataset.for !== v; }); form.querySelectorAll('.sign [data-for]').forEach((e) => { e.hidden = e.dataset.for !== v; }); if (reminding) { reminding = ''; note.textContent = ''; form.querySelectorAll('.sheet input').forEach((i) => { i.classList.remove('miss'); i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); }); } mark(); };
let reminding = '';
const signed = () => [...form.querySelectorAll('.sign input')].filter((i) => !i.closest('[hidden]'));
let planUrl = '';
let launchAt = '';
const as = form.querySelector('fieldset.as'), first = paras[0];
let wrap = null, dim = null, placed = null, turn = 0;
if (first && paras.every((p) => p.parentNode === first.parentNode)) { wrap = document.createElement('div'); wrap.className = 'bodies'; first.before(wrap); paras.forEach((p) => wrap.appendChild(p)); }
const place = (still, force) => {
const c = dim && form.querySelector('input[name="as"]:checked'), lab = c && c.closest('label');
if (!lab || (lab === placed && !force)) return;
placed = lab;
const o = dim.getBoundingClientRect(), t = new DOMMatrixReadOnly(getComputedStyle(dim).transform), r = lab.getBoundingClientRect(), x = o.left - t.m41, y = o.top - t.m42;
if (still) dim.classList.add('still');
dim.style.setProperty('--dx', r.left - x + 'px'); dim.style.setProperty('--dy', r.bottom - y - 3 + 'px'); dim.style.setProperty('--dw', r.width + 'px');
if (still) { void dim.offsetWidth; dim.classList.remove('still'); }
};
if (as && !as.hidden) {
const line = () => {
dim = document.createElement('span'); dim.className = 'dim'; dim.setAttribute('aria-hidden', 'true'); as.appendChild(dim); as.classList.add('dimmed');
mark = () => place(true); place(true, true);
addEventListener('resize', () => place(true, true));
if (document.fonts) document.fonts.ready.then(() => place(true, true));
};
if ('IntersectionObserver' in window) new IntersectionObserver((es, o) => { if (es.some((e) => e.isIntersecting)) { o.disconnect(); line(); } }, { rootMargin: '100% 0px' }).observe(as); else line();
}
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
const then = (el, prop, ms, fn) => {
const t = turn, go = () => { if (t === turn) fn(); };
const a = el.getAnimations ? el.getAnimations().filter((x) => x.transitionProperty === prop) : null;
if (!a) setTimeout(go, ms); else if (!a.length) go(); else Promise.all(a.map((x) => x.finished)).then(go, go);
};
const soft = () => {
const v = form.querySelector('input[name="as"]:checked').value, from = paras.find((p) => !p.hidden), to = paras.find((p) => p.dataset.for === v);
if (!calm()) place(false);
turn++; paras.forEach((p) => p.classList.remove('out', 'pre'));
if (wrap) { wrap.classList.remove('moving'); wrap.style.height = ''; }
if (!wrap || !from || !to || from === to || calm()) { show(); return; }
wrap.style.height = wrap.offsetHeight + 'px'; wrap.classList.add('moving');
from.classList.add('out');
then(from, 'opacity', 120, () => {
from.classList.remove('out'); show();
to.classList.add('pre'); const h = to.offsetHeight;
wrap.style.height = h + 'px'; to.classList.remove('pre');
then(wrap, 'height', 260, () => { wrap.classList.remove('moving'); wrap.style.height = ''; });
});
};
form.querySelectorAll('input[name="as"]').forEach((r) => r.addEventListener('change', soft));
show(); addEventListener('pageshow', show);
const preset = (v) => { const r = ['dev', 'buy', 'adv'].includes(v) && form.querySelector('input[name="as"][value="' + v + '"]'); if (!r) return; r.checked = true; show(); };
try {
const q = new URLSearchParams(location.search), v = q.get('as');
if (v) {
preset(v); q.delete('as');
const word = /^(?!.*(\d{5,}|[\p{L}\p{N}-]\.\p{L}{2,}))(?!(\D*\d){7})[\p{L}\p{M}\p{N} .,'’&()/-]{1,60}$/u;
if (v === 'dev') [['units', /^\d{1,4}$/], ['where', word]].forEach(([k, ok]) => { const t = (q.get(k) || '').trim(), i = form.elements[k]; if (i && ok.test(t)) i.value = t; q.delete(k); });
if (v === 'dev' && q.get('plan')) {
const from = new URLSearchParams(q.get('plan')), keep = new URLSearchParams();
['u', 'f', 'p', 'c', 'l', 'd', 'g', 'b'].forEach((k) => { const t = from.get(k); if (t && /^-?\d{1,4}(\.\d{1,2})?$/.test(t)) keep.set(k, t); });
if (/^\d{4}-(0[1-9]|1[0-2])$/.test(from.get('s') || '')) { keep.set('s', from.get('s')); launchAt = from.get('s'); }
['n', 'w'].forEach((k) => { const t = (from.get(k) || '').trim(); if (t && word.test(t)) keep.set(k, t); });
if (keep.has('u')) planUrl = cmSay('planner', 'https://centamont.com/planner.html?') + keep;
}
q.delete('plan');
history.replaceState(history.state, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash);
}
} catch (e) {}
const devp = paras.find((x) => x.dataset.for === 'dev');
if (planUrl && devp) {
const r = document.createElement('span'), a = document.createElement('a');
r.className = 'plan-ref'; a.className = 'ul'; a.href = planUrl; a.textContent = planUrl.replace(/^https:\/\//, '');
r.append(cmSay('plan', 'My plan: '), a); devp.append(' ', r);
}
const whenSel = form.elements.when;
if (launchAt && whenSel) {
const [y, m] = launchAt.split('-').map(Number);
const o = new Option(cmSay('launchIn', (mm, yy) => 'in ' + ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][mm - 1] + ' ' + yy, m, y));
whenSel.add(o); o.selected = true;
}
document.querySelectorAll('a[data-as]').forEach((a) => a.addEventListener('click', () => preset(a.dataset.as)));
form.querySelectorAll('.sheet input').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); }));
const native = window.CSS && CSS.supports('field-sizing', 'content');
const shrink = (i) => { i.style.fontSize = ''; for (let k = 1; k <= 5 && i.scrollWidth > i.clientWidth + 1; k++) i.style.fontSize = 1 - k * 0.05 + 'em'; };
const fields = form.querySelectorAll('.sheet input');
fields.forEach((i) => { const fit = () => { if (i.classList.contains('miss')) { i.classList.remove('miss'); i.removeAttribute('aria-invalid'); i.removeAttribute('aria-describedby'); remind(); } if (!native) i.style.width = Math.min(Math.max(i.placeholder.length, i.value.length, 3) + 1, 26) + 'ch'; if (i.value) shrink(i); else i.style.fontSize = ''; }; i.addEventListener('input', fit); fit(); });
let rz = 0; addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => fields.forEach((i) => { if (i.value) shrink(i); })); });
form.querySelectorAll('.sheet select').forEach((s) => { const fit = () => { if (native) return; s.style.width = s.options[s.selectedIndex].text.length * 0.42 + 1.5 + 'em'; }; s.addEventListener('change', fit); fit(); });
const text = () => {
const p = paras.find((x) => !x.hidden), c = p.cloneNode(true), src = [...p.querySelectorAll('input, select')];
p.querySelectorAll('[data-opt]').forEach((o, k) => { if (![...o.querySelectorAll('input')].some((i) => i.value.trim())) c.querySelectorAll('[data-opt]')[k].dataset.drop = ''; });
c.querySelectorAll('input, select').forEach((f, k) => { f.replaceWith(document.createTextNode(src[k].value.trim() || '…')); });
const req = [...c.querySelectorAll('[data-req]')].map((o) => o.textContent.replace(/\s+/g, ' ').trim()).join(' ');
c.querySelectorAll('[data-drop], [data-req], .plan-ref').forEach((o) => o.remove());
const name = form.querySelector('input[name="name"]').value.trim(), co = signed().find((i) => i.name === 'company'), of = co && co.value.trim();
let body = c.textContent.replace(/\s+/g, ' ').trim();
if (!/[.!?…]$/.test(body)) body += '.';
if (req) body += ' ' + req;
const plan = p.querySelector('.plan-ref') ? '\n\n' + cmSay('plan', 'My plan: ') + planUrl : '';
return cmSay('salute', 'Dear partners,') + '\n\n' + body + plan + '\n\n' + cmSay('sign', 'With regards,') + '\n' + (name || '') + (of ? cmSay('of', ' of ') + of : '');
};
const box = document.getElementById('letterCopy'), area = document.getElementById('letterText');
const subject = () => {
const v = form.querySelector('input[name="as"]:checked').value, val = (k) => { const i = form.elements[k]; return i && i.value ? i.value.trim() : ''; };
const name = val('name'), co = signed().find((i) => i.name === 'company'), of = co && co.value.trim();
const role = (cmWords.subject || { dev: 'Developer', buy: 'Private client', adv: 'Advisor' })[v];
const units = val('units'), about = v === 'dev' ? [val('where'), units && cmSay('residences', (n) => n + (n === '1' ? ' residence' : ' residences'), units)].filter(Boolean).join(', ') : val(v === 'buy' ? 'area' : 'mkt');
return role + ': ' + name + (of ? cmSay('of', ' of ') + of : '') + (about ? ' · ' + about : '');
};
const say = (...parts) => { note.textContent = ''; requestAnimationFrame(() => { note.replaceChildren(...parts); }); };
const asks = cmWords.asks || { where: 'the neighborhood', units: 'the number of residences', area: 'the area', mkt: 'your market', niche: 'your focus', name: 'your name', company: 'your company', email: 'your email' };
const list = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' ' + cmSay('and', 'and') + ' ' + a[a.length - 1]);
const ask = (empty) => cmSay('ask', (l) => 'Fill in ' + l + ' first, so the partners know who is writing and why.', list(empty.map((i) => asks[i.name] || i.getAttribute('aria-label').toLowerCase())));
function remind() {
if (!reminding) return;
const left = [...paras.find((x) => !x.hidden).querySelectorAll('input'), ...signed()].filter((i) => i.classList.contains('miss'));
const t = left.length ? ask(left) : '';
if (t !== reminding) { reminding = t; note.textContent = t; }
}
const syncCopy = (t) => {
const a = document.createElement('textarea'), was = document.activeElement;
a.value = t; a.readOnly = true; a.style.position = 'fixed'; a.style.top = '0'; a.style.left = '0'; a.style.opacity = '0'; a.style.fontSize = '16px';
document.body.appendChild(a); a.select(); a.setSelectionRange(0, t.length);
let ok = false;
try { ok = document.execCommand('copy'); } catch (err) {}
a.remove(); if (was && was.focus) was.focus();
return ok;
};
let busy = false;
form.addEventListener('submit', (e) => {
e.preventDefault();
if (busy) return;
const p = paras.find((x) => !x.hidden);
const empty = [...p.querySelectorAll('input'), ...signed()].filter((i) => !i.value.trim() && !i.closest('[data-opt]'));
if (empty.length) {
empty.forEach((i) => { i.classList.add('miss'); i.setAttribute('aria-invalid', 'true'); i.setAttribute('aria-describedby', 'letterNote'); });
empty[0].focus({ preventScroll: true });
reminding = ask(empty); say(reminding);
requestAnimationFrame(() => { const lo = note.getBoundingClientRect().bottom + 16 - innerHeight, hi = empty[0].getBoundingClientRect().top - 76, d = Math.min(Math.max(0, lo), hi); if (d) scrollBy(0, d); });
return;
}
const mail = signed().find((i) => i.name === 'email');
if (mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(mail.value.trim())) {
mail.classList.add('miss'); mail.setAttribute('aria-invalid', 'true'); mail.setAttribute('aria-describedby', 'letterNote');
mail.focus(); reminding = cmSay('badEmail', 'Check your email address, so a partner can write back.'); say(reminding);
return;
}
reminding = '';
if (window.cmCount) window.cmCount('letter' + location.pathname);
const to = 'office@centamont.com', t = text();
const url = 'mailto:' + to + '?subject=' + encodeURIComponent(subject()) + '&body=' + encodeURIComponent(t);
const seen = () => requestAnimationFrame(() => { const d = note.getBoundingClientRect().bottom + 24 - innerHeight; if (d > 0) scrollBy({ top: d, behavior: calm() ? 'auto' : 'smooth' }); });
if (form.dataset.send && mail && window.fetch) {
busy = true; box.hidden = true; say(cmSay('sending', 'Sending your letter…'));
const field = (k) => { const i = signed().find((x) => x.name === k); return i ? i.value.trim() : ''; };
fetch(form.dataset.send, { method: 'POST', headers: { Accept: 'application/json', 'Content-Type': 'application/json' }, body: JSON.stringify({ email: mail.value.trim(), name: field('name'), company: field('company'), _subject: subject(), message: t, page: location.pathname }), signal: AbortSignal.timeout ? AbortSignal.timeout(15000) : undefined })
.then((r) => { if (!r.ok) throw new Error(r.status); })
.then(() => { say(cmSay('sent', 'Your letter is with the partners. A partner will reply personally to arrange a first conversation.')); seen(); setTimeout(() => { busy = false; }, 4000); },
() => {
busy = false; area.value = t; box.hidden = false;
const [a, l, b] = cmSay('notSent', ['The letter could not be sent from here. ', 'Open it in your email', ', addressed to office@centamont.com, or copy it below.']);
const link = document.createElement('a'); link.className = 'ul'; link.href = url; link.textContent = l;
say(a, link, b); seen();
});
return;
}
let copying;
if (syncCopy(t)) copying = Promise.resolve();
else if (navigator.clipboard && navigator.clipboard.writeText) {
try { copying = navigator.clipboard.writeText(t); } catch (err) { copying = Promise.reject(err); }
} else copying = Promise.reject(new Error('copy'));
location.href = url;
busy = true; setTimeout(() => { busy = false; }, 1200);
const link = () => { const a = document.createElement('a'); a.className = 'ul'; a.href = url; a.textContent = to; return a; };
const go = (copied) => {
box.hidden = copied; if (!copied) { area.value = t; area.focus(); area.select(); }
const [a, b] = copied ? cmSay('copied', ['Your letter is open in your email, addressed to ', '. If nothing opened, it is copied too: paste it into a new message to that address. A partner will reply personally to arrange a first conversation.']) : cmSay('notCopied', ['Your letter is open in your email, addressed to ', '. If nothing opened, copy the letter below and send it to that address.']);
say(a, link(), b);
if (copied) seen();
};
copying.then(() => go(true), () => go(false));
});
form.classList.add('ready');
}
});
