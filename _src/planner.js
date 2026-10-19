// The launch planner (planner.html): a developer sets out their own building, and the page draws when the lender's
// pre-sale threshold is likely met, when ground can break, how much is under contract by completion and which floors go
// first. The same illustrative absorption model as the sales curve on the home page (instrument.js), with the building's
// size and schedule as inputs. Nothing leaves the page: the plan lives in its own address, so a link carries it.

// The words the planner writes, for the Spanish and Portuguese pages (es/planificador.html, pt/planejador.html), chosen by
// the page's lang, as in instrument.js. English stays in the code where each word is used, and is what a page in any other
// language reads, or a word missing here. An entry is a string, or a function given the same figures the English is built
// from. Spanish writes figures as the Spanish pages do ($2.4M, 3.5); Portuguese as the Portuguese pages do (US$ 2,4 mi, 3,5).
const plMonths = {
  es: ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
  pt: ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'],
};
// (a Portuguese decimal takes a comma)
const plComma = (t) => t.replace('.', ',');
const plWords = ({
  es: {
    // (the money the readouts show, short, and the same read out in full to a screen reader; a billion runs in millions)
    money: (v) => (v >= 1e9 ? '$' + Math.round(v / 1e6).toLocaleString('en-US') + 'M' : v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : '$' + Math.round(v / 1e3) + ' mil'),
    says: (v) => (v >= 1e9 ? (v / 1e9).toFixed(2) + ' mil millones de dólares' : (v / 1e6).toFixed(1) + ' millones de dólares'),
    residences: (v) => v + ' residencias', floors: (v) => v + ' pisos',
    par: 'A la par', above: (n) => n + '% por encima', below: (n) => n + '% por debajo',
    parTell: (n) => Math.abs(n) + ' por ciento ' + (n > 0 ? 'por encima' : 'por debajo'),
    pct: (v) => v + ' por ciento', month: (m) => 'Mes ' + m, months: (v) => v + ' meses',
    when: (m, y) => plMonths.es[m] + ' de ' + y,
    axis: 'Meses desde el lanzamiento', ground: 'Inicio de obra', done: 'Terminación', planned: 'Previsto',
    lim: 'Umbral de preventa', limShort: 'Umbral', forSale: (n) => n + '% en venta', line: 'Línea',
    stack: (F, c) => `Plano de inventario de ${F} pisos: ${c.pre} residencias pasan a estar bajo contrato antes del inicio de obra, ${c.mid} durante la construcción, ${c.post} en el año siguiente a la terminación, y ${c.open} siguen en venta entonces.`,
    notMet: 'No alcanzado', inFive: 'en cinco años', notYet: 'Todavía no', limNotMet: 'umbral no alcanzado',
    late: (n) => n + (n === 1 ? ' mes' : ' meses') + ' después de lo previsto', onPlan: (w) => 'según lo previsto, ' + w,
    of: (k, n, w) => k + ' de ' + n + ', ' + w, depOf: (d, m) => d + '% de ' + m + ' bajo contrato',
    yours: 'Su edificio', size: (n, f) => n + ' residencias en ' + f + ' pisos', launch: (w) => 'lanzamiento en ' + w,
    prepared: (d, m, y) => 'Preparado el ' + d + ' de ' + plMonths.es[m] + ' de ' + y,
    sayNot: (p, t) => 'Con precios ' + (p === 0 ? 'a la par de' : 'un ' + Math.abs(p) + ' por ciento ' + (p > 0 ? 'por encima de' : 'por debajo de')) +
      ' los edificios comparables, el umbral del ' + t + ' por ciento no se alcanza en cinco años. Un precio o un umbral más bajos ponen el inicio de obra a su alcance.',
    sayMet: (c) => 'El umbral se alcanza en el mes ' + c.T + (c.late > 0 ? ', así que la obra empieza ' + c.late + (c.late === 1 ? ' mes' : ' meses') + ' más tarde de lo previsto' : ', a tiempo para empezar la obra como estaba previsto') +
      '. Al terminar, en ' + c.C + ', alrededor del ' + c.pct + ' por ciento del edificio está bajo contrato, ' + c.v + ' en total.',
    copied: 'Enlace copiado. Abre este plan tal como está ahora.', copyIt: 'Copie la dirección de su navegador para compartir este plan.',
  },
  pt: {
    money: (v) => (v >= 1e9 ? 'US$ ' + plComma((v / 1e9).toFixed(2)) + ' bi' : v >= 1e6 ? 'US$ ' + plComma((v / 1e6).toFixed(1)) + ' mi' : 'US$ ' + Math.round(v / 1e3) + ' mil'),
    // (one million or one billion and a part is still singular in Portuguese: 1,5 milhão)
    says: (v) => (v >= 1e9 ? plComma((v / 1e9).toFixed(2)) + (v < 2e9 ? ' bilhão' : ' bilhões') : plComma((v / 1e6).toFixed(1)) + (v < 2e6 ? ' milhão' : ' milhões')) + ' de dólares',
    residences: (v) => v + ' residências', floors: (v) => v + ' andares',
    par: 'Em paridade', above: (n) => n + '% acima', below: (n) => n + '% abaixo',
    parTell: (n) => Math.abs(n) + ' por cento ' + (n > 0 ? 'acima' : 'abaixo'),
    pct: (v) => v + ' por cento', month: (m) => 'Mês ' + m, months: (v) => v + ' meses',
    when: (m, y) => plMonths.pt[m] + ' de ' + y,
    axis: 'Meses desde o lançamento', ground: 'Início da obra', done: 'Conclusão', planned: 'Previsto',
    // (a stacking plan is an espelho de vendas in Brazil, and its lines are finais)
    lim: 'Patamar de pré-venda', limShort: 'Patamar', forSale: (n) => n + '% à venda', line: 'Final',
    stack: (F, c) => `Espelho de vendas de ${F} andares: ${c.pre} residências ficam sob contrato antes do início da obra, ${c.mid} durante a construção, ${c.post} no ano seguinte à conclusão, e ${c.open} ainda estão à venda depois disso.`,
    notMet: 'Não atingido', inFive: 'em cinco anos', notYet: 'Ainda não', limNotMet: 'patamar não atingido',
    late: (n) => n + (n === 1 ? ' mês' : ' meses') + ' depois do previsto', onPlan: (w) => 'como previsto, ' + w,
    of: (k, n, w) => k + ' de ' + n + ', ' + w, depOf: (d, m) => d + '% de ' + m + ' sob contrato',
    yours: 'Seu edifício', size: (n, f) => n + ' residências em ' + f + ' andares', launch: (w) => 'lançamento em ' + w,
    prepared: (d, m, y) => 'Preparado em ' + d + ' de ' + plMonths.pt[m] + ' de ' + y,
    sayNot: (p, t) => 'Com preços ' + (p === 0 ? 'em paridade com os' : Math.abs(p) + ' por cento ' + (p > 0 ? 'acima dos' : 'abaixo dos')) +
      ' edifícios comparáveis, o patamar de ' + t + ' por cento não é atingido em cinco anos. Um preço ou um patamar mais baixo põe o início da obra ao alcance.',
    sayMet: (c) => 'O patamar é atingido no mês ' + c.T + (c.late > 0 ? ', então a obra começa ' + c.late + (c.late === 1 ? ' mês' : ' meses') + ' depois do previsto' : ', a tempo de a obra começar como previsto') +
      '. Na conclusão, em ' + c.C + ', cerca de ' + c.pct + ' por cento do edifício está sob contrato, ' + c.v + ' no total.',
    copied: 'Link copiado. Ele abre este plano como está agora.', copyIt: 'Copie o endereço no seu navegador para compartilhar este plano.',
  },
})[(document.documentElement.lang || 'en').slice(0, 2)] || {};
// a word in the page's language, or the English given: either may be a function, called with the figures that follow
const plSay = (k, en, ...a) => { const v = k in plWords ? plWords[k] : en; return typeof v === 'function' ? v(...a) : v; };

document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('plan'); if (!form) return;
  const NS = 'http://www.w3.org/2000/svg';
  const $ = (id) => document.getElementById(id);
  const el = (tag, attrs, parent, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; if (parent) parent.appendChild(e); return e; };
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // the sliders, each with its key in the plan's address and how its value reads
  const money = (v) => plSay('money', (v) => (v >= 1e9 ? '$' + (v / 1e9).toFixed(2) + 'B' : v >= 1e6 ? '$' + (v / 1e6).toFixed(1) + 'M' : '$' + Math.round(v / 1e3) + 'K'), v);
  const says = (v) => plSay('says', (v) => (v >= 1e9 ? (v / 1e9).toFixed(2) + ' billion dollars' : (v / 1e6).toFixed(1) + ' million dollars'), v);
  const S = {
    units: { k: 'u', show: (v) => String(v), tell: (v) => plSay('residences', (v) => v + ' residences', v) },
    floors: { k: 'f', show: (v) => String(v), tell: (v) => plSay('floors', (v) => v + ' floors', v) },
    price: { k: 'p', show: (v) => money(v * 1e6), tell: (v) => says(v * 1e6) },
    par: { k: 'c', show: (v) => (+v === 0 ? plSay('par', 'At par') : v > 0 ? plSay('above', (n) => n + '% above', v) : plSay('below', (n) => n + '% below', -v)),
      tell: (v) => (+v === 0 ? plSay('par', 'At par') : plSay('parTell', (n) => Math.abs(n) + ' percent ' + (n > 0 ? 'above' : 'below'), +v)) },
    loan: { k: 'l', show: (v) => v + '%', tell: (v) => plSay('pct', (v) => v + ' percent', v) },
    dep: { k: 'd', show: (v) => v + '%', tell: (v) => plSay('pct', (v) => v + ' percent', v) },
    planned: { k: 'g', show: (v) => plSay('month', (m) => 'Month ' + m, v), tell: (v) => plSay('month', (m) => 'Month ' + m, v) },
    build: { k: 'b', show: (v) => plSay('months', (v) => v + ' months', v), tell: (v) => plSay('months', (v) => v + ' months', v) },
  };
  const R = {}; for (const n in S) R[n] = form.elements[n];
  const name = form.elements.name, where = form.elements.where, start = form.elements.start;

  // a plan opened from a link takes its values from the address
  const q = new URLSearchParams(location.search);
  for (const n in S) { const v = q.get(S[n].k); if (v != null && v !== '' && isFinite(v)) R[n].value = Math.min(+R[n].max, Math.max(+R[n].min, +v)); }
  // a name or a neighborhood from a link: plain words only, never an address, number or message someone else wrote
  const plain = (v) => /^[\p{L}\p{M}\p{N} .,'’&()/-]{1,60}$/u.test(v) && !/\d{5,}|(\D*\d){7}|[\p{L}\p{N}-]\.\p{L}{2,}/u.test(v);
  if (plain(q.get('n') || '')) name.value = q.get('n');
  if (plain(q.get('w') || '')) where.value = q.get('w');
  const now = new Date(), next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  start.value = /^\d{4}-\d{2}$/.test(q.get('s') || '') ? q.get('s') : iso(next);
  const launch = () => { const m = /^(\d{4})-(\d{2})$/.exec(start.value); return m ? new Date(+m[1], +m[2] - 1, 1) : next; };
  const when = (k) => { const d = launch(); d.setMonth(d.getMonth() + k); return plSay('when', (m, y) => MON[m] + ' ' + y, d.getMonth(), d.getFullYear()); };

  // Share of residences under contract at the end of each month, and the month ground breaks: the first month at or
  // after the planned one in which the lender's threshold is met. Topping off (six months before completion) and the
  // finished building bring buyers back, as on the home page's curve; so does ground breaking itself. The pace is
  // the home page's for its building of 62 residences, a little slower for a larger building and quicker for a smaller
  // one, so the planner's opening plan (that building, on that schedule) gives the same answer as the home page's curve.
  function model(o) {
    const base = 0.035 * Math.exp(-0.05 * o.par) * Math.pow(62 / o.units, 0.3), s = [0];
    let left = 1, G = -1, T = -1;
    for (let m = 0; m < 240; m++) {
      let a = base;
      if (m < 3) a *= 3;
      if (G > -1) {
        const top = G + o.build - 6;
        if (m >= G && m < G + 2) a *= 1.3;
        else if (m >= top && m < top + 3) a *= 1.5;
        else if (m >= G + o.build) a *= 1.25;
      }
      left *= 1 - a; s.push(1 - left);
      const k = m + 1;
      if (T < 0 && s[k] >= o.loan) T = k;
      if (G < 0 && k >= o.planned && s[k] >= o.loan) G = k;
      if (G > -1 && k >= G + o.build + 12) break;
      if (G < 0 && k >= 60) break;
    }
    // ground that cannot break within five years is drawn as never breaking
    if (G < 0 || G > 60) return { s: s.slice(0, 61), G: -1, T: T > 60 ? -1 : T, C: -1 };
    return { s, G, T, C: G + o.build };
  }

  const read = () => { const o = {}; for (const n in S) o[n] = +R[n].value; o.loan /= 100; o.floors = Math.min(o.floors, o.units); return o; };

  // ---- the curve, drawn at the figure's own width so its labels keep their size on every screen
  const svg = $('plSvg');
  let W, H, X0, X1, Y0, Y1, M;
  const x = (m) => X0 + (X1 - X0) * m / M, y = (f) => Y1 - (Y1 - Y0) * f;
  function curve(o, r) {
    W = Math.max(280, Math.round(svg.clientWidth || 640));
    const phone = W < 520;
    H = phone ? 300 : Math.round(Math.min(440, W * 0.6));
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    svg.textContent = '';
    M = r.s.length - 1; X0 = 48; X1 = W - 12; Y0 = 58; Y1 = H - 46;
    const g = el('g', { class: 'cv-grid' }, svg);
    [0.25, 0.5, 0.75, 1].forEach((f) => { el('line', { x1: X0, x2: X1, y1: y(f), y2: y(f) }, g); el('text', { x: X0 - 8, y: y(f) + 4, 'text-anchor': 'end' }, g, Math.round(f * 100) + '%'); });
    el('line', { class: 'axis', x1: X0, x2: X1, y1: Y1, y2: Y1 }, g);
    const step = M > 72 ? 24 : phone || M > 48 ? 12 : 6;
    for (let m = 0; m <= M; m += step) { el('line', { class: 'axis', x1: x(m), x2: x(m), y1: Y1, y2: Y1 + 5 }, g); el('text', { x: x(m), y: Y1 + 20, 'text-anchor': m ? 'middle' : 'start' }, g, String(m)); }
    el('text', { class: 'ph', x: X1, y: Y1 + 38, 'text-anchor': 'end' }, g, plSay('axis', 'Months from launch'));
    // construction as a band between ground breaking and completion, with each named above its line
    if (r.G > -1) {
      // (the band stops at the whole building, as the plot does)
      el('rect', { class: 'lp-band', x: x(r.G), y: y(1), width: x(r.C) - x(r.G), height: Y1 - y(1) }, g);
      const names = [[r.G, plSay('ground', 'Ground broken')], [r.C, plSay('done', 'Completion')]];
      if (r.G > o.planned) names.unshift([o.planned, plSay('planned', 'Planned')]);
      // each name beside its own line, right of it where it fits, on the first row where it clears every name already set
      // and never runs across another phase's line; a name with nowhere clear takes the next row down
      const rows = [], lines = names.map(([m]) => x(m));
      names.forEach(([m, t], i) => {
        const ln = el('line', { class: i === 0 && r.G > o.planned ? 'phase plan' : 'phase', x1: x(m), x2: x(m), y1: 6, y2: Y1 }, g);
        const e = el('text', { class: 'ph', x: x(m) + 6, y: 0 }, g, t);
        const w = e.getComputedTextLength() || t.length * 8;
        const sides = [[x(m) + 6, 'start', x(m) + 6], [x(m) - 6, 'end', x(m) - 6 - w]];
        for (let row = 0; ; row++) {
          rows[row] = rows[row] || [];
          const fit = sides.find(([, , l]) => l >= 2 && l + w <= W - 2 && rows[row].every(([a, b]) => l >= b + 10 || l + w <= a - 10) &&
            lines.every((lx, j) => j === i || lx < l - 4 || lx > l + w + 4));
          if (fit || row >= 2) { const [ax, an, l] = fit || sides[0]; e.setAttribute('x', ax); e.setAttribute('text-anchor', an); e.setAttribute('y', 16 + row * 18); ln.setAttribute('y1', 4 + row * 18); rows[row].push([l, l + w]); break; }
        }
      });
    }
    const pathD = r.s.map((f, m) => (m ? 'L' : 'M') + x(m).toFixed(1) + ' ' + y(f).toFixed(1)).join(' ');
    el('path', { class: 'cv-area', d: pathD + ` L${x(M)} ${Y1} L${x(0)} ${Y1} Z` }, svg);
    el('path', { class: 'cv-line', d: pathD }, svg);
    el('line', { class: 'cv-lim', x1: X0, x2: X1, y1: y(o.loan), y2: y(o.loan) }, svg);
    const lt = el('text', { class: 'cv-limt', x: X1, y: y(o.loan) - 8, 'text-anchor': 'end' }, svg, phone ? plSay('limShort', 'Threshold') : plSay('lim', 'Pre-sale threshold'));
    // the threshold's name moves under its line where the curve would run through it
    const b = lt.getBBox(), m0 = Math.floor((b.x - X0) / (X1 - X0) * M), m1 = Math.ceil((b.x + b.width - X0) / (X1 - X0) * M);
    if (r.s.slice(Math.max(0, m0), m1 + 1).some((f) => y(f) > b.y - 4 && y(f) < b.y + b.height + 4)) lt.setAttribute('y', y(o.loan) + 20);
    // the curve as points a few pixels apart, for keeping notes off it
    const pts = [];
    for (let i = 0; i < M; i++) for (let t = 0; t < 1; t += 0.25) pts.push([x(i + t), y(r.s[i] + (r.s[i + 1] - r.s[i]) * t)]);
    const crosses = (b) => pts.some(([px, py]) => px > b.x - 4 && px < b.x + b.width + 4 && py > b.y - 3 && py < b.y + b.height + 3);
    const meets = (a, b) => !(a.x > b.x + b.width || a.x + a.width < b.x || a.y > b.y + b.height || a.y + a.height < b.y);
    const taken = [lt.getBBox()];
    // a note takes the first of its spots that stays in the plot, clear of the curve and the notes already set
    const place = (t, spots) => {
      for (const [sx, an, sy] of spots) {
        t.setAttribute('x', sx); t.setAttribute('text-anchor', an); t.setAttribute('y', sy);
        const b = t.getBBox();
        if (b.x < 2 || b.x + b.width > W - 2 || b.y < Y0 - 4 || b.y + b.height > Y1 - 2 || crosses(b) || taken.some((q) => meets(q, b))) continue;
        taken.push(b); return true;
      }
      t.remove(); return false;
    };
    if (r.T > -1) {
      el('circle', { class: 'cv-dot', r: 4.5, cx: x(r.T), cy: y(o.loan) }, svg);
      const t = el('text', { class: 'cv-dott' }, svg, plSay('month', (m) => 'Month ' + m, r.T)), tx = x(r.T), ty = y(o.loan);
      place(t, [[tx + 10, 'start', ty + 22], [tx - 10, 'end', ty - 12], [tx + 10, 'start', ty + 38], [tx - 10, 'end', ty + 22], [tx + 10, 'start', ty - 12], [tx - 10, 'end', ty - 28]]);
    }
    // at completion, the share still for sale measured off as a dimension string, as on the home page's curve
    if (r.C > -1 && r.C <= M) {
      const done = r.s[r.C], xd = x(r.C), yd = y(done), yt = y(1);
      const sl = (yy) => `M${xd - 4} ${yy + 4} L${xd + 4} ${yy - 4}`, room = 1 - done >= 0.03 && yd - yt > 18;
      const dl = room ? el('path', { class: 'cv-dim', d: `M${xd} ${yd - 6} L${xd} ${yt} ${sl(yt)} ${sl(yd - 6)}` }, svg) : null;
      el('circle', { class: 'cv-dimr', r: 3.5, cx: xd, cy: yd }, svg);
      if (room) {
        const t = el('text', { class: 'cv-dimt' }, svg, plSay('forSale', (n) => n + '% for sale', Math.round((1 - done) * 100))), ym = (yd + yt) / 2 + 5;
        // (a dimension with no room for its figure is left out)
        if (!place(t, [[xd + 8, 'start', ym], [xd - 8, 'end', ym]])) dl.remove();
      }
    }
  }

  // ---- the stacking plan: every residence on its floor, filled by when it sells. The higher floors sell first, give or
  // take a few, as in the tower on the home page; a fixed scatter keeps the same plan for the same building.
  const plan = $('plStack');
  const jitter = (i) => { const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453; return (v - Math.floor(v)) * 5 - 2.5; };
  function stack(o, r) {
    const n = o.units, F = o.floors, per = Math.ceil(n / F);
    const units = [];
    for (let i = 0; i < n; i++) { const f = Math.floor(i / per); units.push({ f, c: i % per, w: 1 + 0.4 * (F > 1 ? f / (F - 1) - 0.5 : 0) }); }
    const mean = units.reduce((t, u) => t + u.w, 0) / n;
    units.forEach((u) => { u.v = o.price * 1e6 * (1 + o.par / 100) * u.w / mean; });
    const order = units.map((u, i) => [u.f + jitter(i), i]).sort((a, b) => b[0] - a[0]).map(([, i]) => i);
    const end = r.s.length - 1;
    // the month each residence goes under contract, in the order they sell
    let k = 1;
    order.forEach((i, rank) => { while (k <= end && Math.round(r.s[k] * n) <= rank) k++; units[i].m = k <= end ? k : -1; });
    const phase = (m) => (m < 0 ? 'open' : r.G < 0 || m <= r.G ? 'pre' : m <= r.C ? 'mid' : 'post');
    units.forEach((u) => { u.p = phase(u.m); });

    // drawn as a stacking plan is: every floor numbered up the left, the lines numbered along the foot, the building on its
    // ground line over a band of hatch, and set at one height, so a short building never swells to fill the page and a tall
    // one keeps to the screen. A building of few lines draws each residence wider (48 units for up to four lines, 32 for up
    // to eight), so the plan reads as a building, not a strip; its numbers are set to stand at 13px whatever the scale.
    const cw = per <= 4 ? 48 : per <= 8 ? 32 : 20, ch = 14, gap = 3, lw = 44, foot = per <= 12 ? 34 : 16, VW = lw + per * (cw + gap), base = F * (ch + gap) + 2, VH = base + foot;
    const sc = Math.min(1.25, 540 / VH);
    plan.setAttribute('viewBox', `-2 -2 ${VW + 4} ${VH + 4}`);
    plan.style.width = Math.round((VW + 4) * sc) + 'px';
    plan.style.setProperty('--fl', (13 / sc).toFixed(2) + 'px');
    plan.textContent = '';
    units.forEach((u) => el('rect', { class: 'lp-u ' + u.p, x: lw + u.c * (cw + gap), y: (F - 1 - u.f) * (ch + gap), width: cw, height: ch }, plan));
    const lab = F > 30 ? 5 : 1, pad = (n) => String(n).padStart(2, '0');
    for (let f = 0; f < F; f++) if ((f + 1) % lab === 0 || f === 0 || f === F - 1) el('text', { class: 'lp-fl', x: lw - 8, y: (F - 1 - f) * (ch + gap) + ch - 3, 'text-anchor': 'end' }, plan, pad(f + 1));
    const hatch = el('pattern', { id: 'plH', width: 5, height: 5, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' }, el('defs', {}, plan));
    el('line', { class: 'lp-h', x1: 0, y1: 0, x2: 0, y2: 5 }, hatch);
    el('path', { d: `M${lw - 4} ${base}H${VW}v6H${lw - 4}Z`, fill: 'url(#plH)' }, plan);
    el('line', { class: 'lp-gr', x1: lw - 4, x2: VW, y1: base, y2: base }, plan);
    if (per <= 12) {
      el('text', { class: 'lp-fl lp-ln', x: lw - 8, y: base + 24, 'text-anchor': 'end' }, plan, plSay('line', 'Line'));
      for (let c = 0; c < per; c++) el('text', { class: 'lp-fl', x: lw + c * (cw + gap) + cw / 2, y: base + 24, 'text-anchor': 'middle' }, plan, pad(c + 1));
    }
    const c = { pre: 0, mid: 0, post: 0, open: 0 }, v = { pre: 0, mid: 0, post: 0 };
    units.forEach((u) => { c[u.p]++; if (u.p !== 'open') v[u.p] += u.v; });
    ['pre', 'mid', 'post', 'open'].forEach((p) => { $('plK' + p).textContent = c[p]; });
    plan.setAttribute('aria-label', plSay('stack', (F, c) => `Stacking plan of ${F} floors: ${c.pre} residences go under contract before ground breaks, ${c.mid} during construction, ${c.post} in the year after completion, and ${c.open} are still for sale then.`, F, c));
    return { c, v, units };
  }

  // ---- the readings, the sentence that sums them up, and the address that carries the plan
  const say = $('plSay');
  let said = '', sayT = 0;
  function draw() {
    if (+R.floors.value > +R.units.value) R.floors.value = R.units.value;
    for (const n in S) { const v = R[n].value; $(R[n].id + 'Out').textContent = S[n].show(v); R[n].setAttribute('aria-valuetext', S[n].tell(v)); }
    const o = read(), r = model(o), st = stack(o, r);
    curve(o, r);
    const n = o.units, done = r.C > -1 ? r.s[r.C] : r.s[r.s.length - 1];
    const late = r.G - o.planned;
    const mo = (m) => plSay('month', (m) => 'Month ' + m, m);
    $('plT').textContent = r.T > -1 ? mo(r.T) : plSay('notMet', 'Not met');
    $('plTd').textContent = r.T > -1 ? when(r.T) : plSay('inFive', 'within five years');
    $('plG').textContent = r.G > -1 ? mo(r.G) : plSay('notYet', 'Not yet');
    $('plGd').textContent = r.G < 0 ? plSay('limNotMet', 'threshold not met') : late > 0 ? plSay('late', (late) => late + (late === 1 ? ' month' : ' months') + ' after plan', late) : plSay('onPlan', (w) => 'on plan, ' + w, when(r.G));
    $('plDone').textContent = r.C > -1 ? Math.round(done * 100) + '%' : '–';
    $('plDoned').textContent = r.C > -1 ? plSay('of', (k, n, w) => k + ' of ' + n + ', ' + w, Math.round(done * n), n, when(r.C)) : '';
    const atC = st.v.pre + st.v.mid, dep = st.v.pre * o.dep / 100;
    // (and the same three in the bar a phone keeps at the foot of the screen while the sliders are in view)
    $('plNowT').textContent = $('plT').textContent; $('plNowG').textContent = $('plG').textContent; $('plNowD').textContent = $('plDone').textContent;
    $('plV').textContent = r.C > -1 ? money(atC) : '–';
    $('plDep').textContent = r.G > -1 ? money(dep) : '–';
    $('plDepd').textContent = r.G > -1 ? plSay('depOf', (d, m) => d + '% of ' + m + ' under contract', o.dep, money(st.v.pre)) : '';
    const nm = name.value.trim();
    $('plTitle').textContent = nm || plSay('yours', 'Your building');
    $('plWhere').textContent = [where.value.trim(), plSay('size', (n, f) => n + ' residences on ' + f + ' floors', n, o.floors), plSay('launch', (w) => 'launch ' + w, when(0))].filter(Boolean).join(' · ');
    $('plOn').textContent = plSay('prepared', (d, m, y) => 'Prepared ' + MON[m] + ' ' + d + ', ' + y, now.getDate(), now.getMonth(), now.getFullYear());

    let s;
    // (a page in another language says each sentence whole, from the same figures)
    if (r.G < 0) s = plSay('sayNot', (p, t) => 'At ' + S.par.tell(p).toLowerCase() + ' comparable buildings, the threshold of ' + t + ' percent is not met within five years. A lower price or a lower threshold brings ground breaking within reach.', o.par, Math.round(o.loan * 100));
    else s = plSay('sayMet', (c) => 'The threshold is met in month ' + c.T + (c.late > 0 ? ', so ground breaks ' + c.late + (c.late === 1 ? ' month' : ' months') + ' later than planned' : ', in time for ground breaking as planned') + '. By completion in ' + c.C + ', about ' + c.pct + ' percent of the building is under contract, ' + c.v + ' in all.',
      { T: r.T, late, C: when(r.C), pct: Math.round(done * 100), v: money(atC) });
    // the sentence is read out once the sliders settle, not at every step
    clearTimeout(sayT); sayT = setTimeout(() => { if (s !== said) { say.textContent = s; said = s; } }, 600);
    if (!said) { say.textContent = s; said = s; }

    const p = new URLSearchParams();
    for (const k in S) p.set(S[k].k, R[k].value);
    p.set('s', start.value); if (nm) p.set('n', nm); if (where.value.trim()) p.set('w', where.value.trim());
    // (keeping a night or paused-motion choice the address already carries)
    ['theme', 'motion'].forEach((k) => { if (q.get(k)) p.set(k, q.get(k)); });
    try { history.replaceState(history.state, '', location.pathname + '?' + p + location.hash); } catch (e) {}
    const lt = new URLSearchParams({ as: 'dev', units: String(n) }); if (where.value.trim()) lt.set('where', where.value.trim());
    // (and the plan itself, so the letter can close with its link: "My plan: …")
    const pl = new URLSearchParams(p); pl.delete('theme'); pl.delete('motion'); lt.set('plan', pl.toString());
    // (the letter is on the home page in the page's own language: ./ is /es/ from the Spanish planner, /pt/ from the Portuguese)
    $('plWrite').href = './?' + lt + '#contact';
  }

  let raf = 0;
  const soon = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); };
  form.addEventListener('input', soon);
  // counted once a visit: the planner put to use, and the step from it to the letter (site.js: window.cmCount)
  form.addEventListener('input', () => { if (window.cmCount) window.cmCount('planner-used'); }, { once: true });
  $('plWrite').addEventListener('click', () => { if (window.cmCount) window.cmCount('planner-to-letter'); });
  form.addEventListener('submit', (e) => e.preventDefault());
  let w0 = 0;
  if (window.ResizeObserver) new ResizeObserver(() => { const w = svg.clientWidth; if (w && Math.abs(w - w0) > 2) { w0 = w; soon(); } }).observe(svg);
  if (document.fonts) document.fonts.ready.then(soon);
  form.classList.add('ready');
  draw();

  const note = $('plNote');
  const tell = (t) => { note.textContent = ''; setTimeout(() => { note.textContent = t; }, 50); };
  $('plPrint').addEventListener('click', () => window.print());
  $('plCopy').addEventListener('click', () => {
    const url = location.href.split('#')[0];
    const ok = () => tell(plSay('copied', 'Link copied. It opens this plan as it stands.')), no = () => tell(plSay('copyIt', 'Copy the address in your browser to share this plan.'));
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, no);
    else no();
  });
});
