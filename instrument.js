// Two instruments on the home page: the sales curve for developers, and the letter to the partners. Each starts on its
// own, so a fault in one never stops the other.
document.addEventListener('DOMContentLoaded', function () {
  // ---- Sales against the schedule: an illustrative absorption model
  const svg = document.getElementById('cvSvg');
  if (svg) {
    const price = document.getElementById('cvPrice'), loan = document.getElementById('cvLoan');
    const out = (id) => document.getElementById(id);
    const M = 36, BREAK = 6, TOP = 24, DONE = 30;
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, parent, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; (parent || svg).appendChild(e); return e; };
    // Drawn at the figure's real width, one unit to one pixel, so labels keep their size on every screen.
    let W, H, X0, X1, Y0, Y1;
    const x = (m) => X0 + (X1 - X0) * m / M, y = (f) => Y1 - (Y1 - Y0) * f;

    // Share of residences under contract at the end of each month.
    function model(p) {
      const base = 0.035 * Math.exp(-0.05 * p), sold = [0];
      let left = 1;
      for (let m = 0; m < M; m++) {
        let a = base;
        if (m < 3) a *= 3; // launch
        else if (m >= TOP && m < TOP + 3) a *= 1.5; // topping off brings buyers back
        else if (m >= DONE) a *= 1.25; // a finished building sells
        left *= 1 - a; sold.push(1 - left);
      }
      return sold;
    }

    let build, area, par, line, lim, limT, dot, dotT;
    const keyRow = document.querySelector('.cv-key');
    function size() {
      W = Math.max(240, Math.round(svg.clientWidth || 640));
      H = Math.round(W >= 520 ? Math.min(500, W * 0.76) : Math.max(280, Math.min(380, W * 0.52)));
      // and never taller than the screen below the header allows, so on a phone held sideways the curve stays in view
      // beside its sliders (the figure is sticky there, 72px from the top)
      H = Math.min(H, Math.max(240, Math.round(innerHeight - 80)));
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      // a figure too narrow to name the threshold line in the drawing names it in the legend, from this same width
      if (keyRow) keyRow.classList.toggle('lim-key', W < 520);
    }
    function sheet() {
      size();
      X0 = 54; X1 = W - 14; // room for '100%' and a clear margin inside the frame
      svg.textContent = '';
      const g = el('g', { class: 'cv-grid' });
      // phase names along the top, each beside its line
      const phases = [[BREAK, 'Ground broken'], [TOP, 'Top-off'], [DONE, 'Completion']];
      const tl = [];
      phases.forEach(([m, t]) => { const e = el('text', { class: 'ph', 'text-anchor': 'start' }, g, t); tl.push([m, e, e.getComputedTextLength() || t.length * 8]); });
      // Where the last phase name fits to the right of its line, the plot stops short to leave it room; a narrow figure
      // instead runs the plot to its frame and lets that name sit left of its line, when that costs at most one more row.
      const wLast = tl[tl.length - 1][2];
      const plan = (X1p) => {
        // Every place a name could go: right or left of its line, on one of three rows. A line starts at its own
        // name's row, so a name may span another phase's line only when that line starts on a lower row.
        const opts = tl.map(([m, , w]) => {
          const sx = X0 + (X1p - X0) * m / M, o = [];
          for (let row = 0; row < 3; row++) for (const anchor of ['start', 'end']) {
            const a = anchor === 'start' ? sx + 6 : sx - 6, l = anchor === 'start' ? a : a - w, r = l + w;
            if (l >= 2 && r <= W - 4) o.push({ row, anchor, a, l, r, sx });
          }
          return o;
        });
        const clear = (o, c) => (c.row !== o.row || o.l >= c.r + 12 || o.r <= c.l - 12) &&
          !(o.l - 4 < c.sx && c.sx < o.r + 4 && c.row <= o.row) && !(c.l - 4 < o.sx && o.sx < c.r + 4 && o.row <= c.row);
        // the best set uses the fewest rows (the plot keeps its height), then keeps names to the right of their lines,
        // and never sets a later phase's name to the left of an earlier one's, so the names read in the order they happen
        let best = null, bestCost = Infinity;
        const place = (i, chosen) => {
          if (i === opts.length) {
            let order = 0;
            chosen.forEach((c, k) => { for (let j = k + 1; j < chosen.length; j++) if (c.l + c.r > chosen[j].l + chosen[j].r) order++; });
            const cost = 100 * Math.max(...chosen.map((c) => c.row)) + 120 * chosen.filter((c) => c.anchor === 'end').length + 5 * chosen.reduce((n, c) => n + c.row, 0) + 250 * order;
            if (cost < bestCost) { bestCost = cost; best = chosen.slice(); }
            return;
          }
          opts[i].forEach((o) => { if (chosen.every((c) => clear(o, c))) { chosen.push(o); place(i + 1, chosen); chosen.pop(); } });
        };
        place(0, []);
        if (!best) best = opts.map((o, i) => o.find((c) => c.row === Math.min(i, 2)) || o[0] || { row: 0, anchor: 'start', a: 0 });
        return { X1p, best, rows: Math.max(...best.map((c) => c.row)) };
      };
      let pl = plan(Math.min(W - 14, Math.floor(X0 + (W - 4 - X0 - 6 - wLast) * M / DONE)));
      if (W < 520 && pl.X1p < W - 14) { const full = plan(W - 14); if (full.rows <= pl.rows + 1) pl = full; }
      X1 = pl.X1p;
      const best = pl.best;
      let two = 0;
      tl.forEach(([, e], i) => { const c = best[i]; two = Math.max(two, c.row); e.dataset.row = c.row; e.setAttribute('x', c.a); e.setAttribute('text-anchor', c.anchor); });
      Y0 = 34 + 16 * two; Y1 = H - 52;
      tl.forEach(([m, e]) => e.setAttribute('y', 18 + 16 * +e.dataset.row));
      [0.25, 0.5, 0.75, 1].forEach((f) => { el('line', { x1: X0, x2: X1, y1: y(f), y2: y(f) }, g); el('text', { x: X0 - 8, y: y(f) + 4, 'text-anchor': 'end' }, g, Math.round(f * 100) + '%'); });
      tl.forEach(([m, e]) => { const l = el('line', { class: 'phase', x1: x(m), x2: x(m), y1: 6 + 16 * +e.dataset.row, y2: Y1 }, g); g.insertBefore(l, g.firstChild); });
      el('line', { class: 'axis', x1: X0, x2: X1, y1: Y1, y2: Y1 }, g);
      // month ticks, every six
      const step = W < 420 ? 12 : 6;
      for (let m = 0; m <= M; m += step) { el('line', { class: 'axis', x1: x(m), x2: x(m), y1: Y1, y2: Y1 + 5 }, g); el('text', { x: x(m), y: Y1 + 20, 'text-anchor': m === 0 ? 'start' : m === M ? 'end' : 'middle' }, g, String(m)); }
      el('text', { class: 'ph', x: X1, y: Y1 + 42, 'text-anchor': 'end' }, g, 'Months from launch');
      build = el('path', { class: 'cv-build', d: `M${x(BREAK)} ${Y1} L${x(DONE)} ${y(1)}` });
      area = el('path', { class: 'cv-area' }); par = el('path', { class: 'cv-par' }); line = el('path', { class: 'cv-line' });
      lim = el('line', { class: 'cv-lim' }); limT = el('text', { class: 'cv-limt', 'text-anchor': 'end' });
      dot = el('circle', { class: 'cv-dot', r: 4.5 }); dotT = el('text', { class: 'cv-dott' });
    }

    const path = (s) => s.map((f, m) => (m ? 'L' : 'M') + x(m).toFixed(1) + ' ' + y(f).toFixed(1)).join(' ');
    const fmt = (p) => (p === 0 ? 'At par' : (p > 0 ? p + '% above' : -p + '% below'));
    const list = (a) => a.slice(0, -1).join('; ') + '; and ' + a[a.length - 1];
    const key = document.querySelector('.cv-key .k-par');

    // a small elevation of the tower, as in the story above: three podium floors, seventeen tapering residential ones
    // and a two-floor crown. Only residences sell, from the top down, so the podium and the crown never fill.
    const tw = document.getElementById('cvTower'), reduceM = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
    const POD = 3, RES = 17;
    let lastN = 0;
    if (tw) for (let k = 0; k < 22; k++) {
      const wdt = k < POD ? 36 : k < POD + RES ? 20 - (k - POD) * 0.22 : 14, r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', (40 - wdt) / 2); r.setAttribute('y', 110 - (k + 1) * 4.9); r.setAttribute('width', wdt); r.setAttribute('height', 4.1); tw.appendChild(r);
    }
    function draw() {
      const p = +price.value, T = +loan.value / 100, s = model(p), base = model(0);
      out('cvPriceOut').textContent = fmt(p);
      out('cvLoanOut').textContent = loan.value + '%';
      price.setAttribute('aria-valuetext', fmt(p)); loan.setAttribute('aria-valuetext', loan.value + ' percent');
      if (key) key.parentNode.hidden = p === 0;
      par.setAttribute('d', p ? path(base) : '');
      line.setAttribute('d', path(s));
      area.setAttribute('d', path(s) + ` L${x(M)} ${Y1} L${x(0)} ${Y1} Z`);
      lim.setAttribute('x1', X0); lim.setAttribute('x2', X1); lim.setAttribute('y1', y(T)); lim.setAttribute('y2', y(T));
      limT.setAttribute('x', X1); limT.setAttribute('y', y(T) - 8); limT.textContent = 'Pre-sale threshold';
      const hit = s.findIndex((f) => f >= T), done = s[DONE], baseHit = base.findIndex((f) => f >= T);
      // the curves as points a few pixels apart, for keeping notes off them
      const pts = [];
      for (const c of p ? [s, base] : [s]) for (let i = 0; i < M; i++) for (let t = 0; t < 1; t += 0.25) pts.push([x(i + t), y(c[i] + (c[i + 1] - c[i]) * t)]);
      pts.push([x(M), y(s[M])]);
      const crosses = (b) => pts.some(([px, py]) => px > b.x - 4 && px < b.x + b.width + 4 && py > b.y - 3 && py < b.y + b.height + 3);
      if (hit > -1) {
        const right = x(hit) > X1 - 90; dot.setAttribute('cx', x(hit)); dot.setAttribute('cy', y(T)); dot.style.display = ''; dotT.textContent = 'Month ' + hit;
        // the month note takes the first spot beside the dot, nearest first and below before above, that no curve runs
        // through; failing one, the spot the curves cross least (its halo keeps it legible)
        const sides = right ? [[-10, 'end'], [10, 'start']] : [[10, 'start'], [-10, 'end']], spots = [];
        for (const dy of [22, -12, 38, -28]) for (const [dx, an] of sides) spots.push([dx, an, dy]);
        const hits = spots.map(([dx, an, dy]) => { dotT.setAttribute('x', x(hit) + dx); dotT.setAttribute('text-anchor', an); dotT.setAttribute('y', y(T) + dy); const b = dotT.getBBox(); return b.x < X0 + 2 || b.x + b.width > W - 2 || b.y < 2 || b.y + b.height > Y1 ? Infinity : pts.filter(([px, py]) => px > b.x - 4 && px < b.x + b.width + 4 && py > b.y - 3 && py < b.y + b.height + 3).length; });
        const [dx, an, dy] = spots[hits.indexOf(Math.min(...hits))];
        dotT.setAttribute('x', x(hit) + dx); dotT.setAttribute('text-anchor', an); dotT.setAttribute('y', y(T) + dy);
      }
      else { dot.style.display = 'none'; dotT.textContent = ''; }
      // The threshold label takes the first spot, right or left, above or below the line, that no curve or note runs through.
      const dotB = dotT.textContent ? dotT.getBBox() : null;
      // Failing a clear spot, the label may cross a curve (its halo keeps it legible) but never the month note.
      const spots = [[X1, 'end', -8], [X0 + 6, 'start', -8], [X1, 'end', 18], [X0 + 6, 'start', 18]].map(([lx, anchor, dy]) => {
        limT.setAttribute('x', lx); limT.setAttribute('text-anchor', anchor); limT.setAttribute('y', y(T) + dy);
        const b = limT.getBBox(), curve = crosses(b);
        const note = !!dotB && !(dotB.x > b.x + b.width || dotB.x + dotB.width < b.x || dotB.y > b.y + b.height || dotB.y + dotB.height < b.y);
        return { lx, anchor, dy, curve, note };
      });
      const pick = spots.find((o) => !o.curve && !o.note) || spots.find((o) => !o.note) || spots[0];
      limT.setAttribute('x', pick.lx); limT.setAttribute('text-anchor', pick.anchor); limT.setAttribute('y', y(T) + pick.dy);
      // On a phone the label is half the plot wide and would cross a curve; the legend names the line instead.
      if (W < 520) limT.textContent = '';
      out('cvMonth').textContent = hit > -1 ? 'Month ' + hit : 'Not met';
      out('cvDone').textContent = Math.round(done * 100) + '%';
      // the same share of the building, filled floor by floor in a small elevation beside the figure
      if (tw) { const n = Math.round(done * RES); tw.querySelectorAll('rect').forEach((r, k) => { const d = POD + RES - 1 - k; r.classList.toggle('on', k >= POD && d >= 0 && d < n); r.style.transitionDelay = (reduceM || k < POD || d < 0 ? 0 : Math.abs(d - lastN) * 22) + 'ms'; }); lastN = n; }
      let say;
      const unsold = Math.round((1 - done) * 100), unsoldPar = Math.round((1 - base[DONE]) * 100);
      if (p === 0) say = 'At par, about ' + Math.round(done * 100) + ' percent of the building is under contract by completion' + (hit > -1 ? '.' : ', and the threshold is not met within ' + M + ' months.');
      else {
        const d = hit - baseHit;
        const when = hit < 0 ? 'the threshold is not met within ' + M + ' months' : d === 0 ? 'the threshold arrives in the same month' : 'the threshold arrives ' + Math.abs(d) + (Math.abs(d) === 1 ? ' month ' : ' months ') + (d > 0 ? 'later' : 'sooner');
        // "but" only where the threshold pays for the higher price; otherwise the two clauses are simply set side by side
        const join = p > 0 && (hit < 0 || d > 0) ? ', but ' : '; ';
        say = 'Each residence sells for ' + Math.abs(p) + ' percent ' + (p > 0 ? 'more' : 'less') + join + when + ', and ' + unsold + ' percent of the building is still for sale at completion, against ' + unsoldPar + ' percent at par.';
      }
      out('cvSay').textContent = say;
      // the drawing's text alternative also reads the curve itself, every six months
      const marks = [];
      for (let m = 6; m <= M; m += 6) marks.push('month ' + m + ', ' + Math.round(s[m] * 100) + ' percent');
      svg.setAttribute('aria-label', 'Illustrative sales curve. ' + say + ' Under contract by ' + list(marks) + '.');
    }
    // a hairline that reads the curve under the pointer
    let hair, hairT, hdot, last = null;
    const read = (m) => {
      if (m === null) { if (hair) { hair.remove(); hairT.remove(); hdot.remove(); hair = null; } return; }
      const s = model(+price.value), f = s[m];
      if (!hair) { hair = el('line', { class: 'cv-hair' }); hdot = el('circle', { class: 'cv-hdot', r: 3.5 }); hairT = el('text', { class: 'cv-hairt' }); }
      hair.setAttribute('x1', x(m)); hair.setAttribute('x2', x(m)); hair.setAttribute('y1', y(1)); hair.setAttribute('y2', Y1);
      hdot.setAttribute('cx', x(m)); hdot.setAttribute('cy', y(f));
      const right = x(m) > (X0 + X1) / 2;
      hairT.setAttribute('x', right ? x(m) - 10 : x(m) + 10); hairT.setAttribute('text-anchor', right ? 'end' : 'start'); hairT.setAttribute('y', y(1) + 14);
      hairT.textContent = 'Month ' + m + ' \u00b7 ' + Math.round(f * 100) + '%';
    };
    const at = (e) => {
      const r = svg.getBoundingClientRect(), u = (e.clientX - r.left) * W / r.width;
      const m = Math.round((u - X0) / (X1 - X0) * M);
      last = m < 0 || m > M ? null : m; read(last);
    };
    svg.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse' && lastW) at(e); });
    svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { last = null; read(null); } });
    // a tap reads the month under the finger (a drag is the page scrolling, and reads nothing); the reading stays until
    // the next tap, and a tap anywhere off the figure clears it
    let down = null;
    svg.addEventListener('pointerdown', (e) => { down = e.pointerType === 'mouse' ? null : [e.clientX, e.clientY]; });
    svg.addEventListener('pointerup', (e) => { if (down && lastW && Math.hypot(e.clientX - down[0], e.clientY - down[1]) < 10) at(e); down = null; });
    document.addEventListener('pointerdown', (e) => { if (last !== null && e.pointerType !== 'mouse' && !svg.contains(e.target)) { last = null; read(null); } }, { passive: true });
    // and from the keyboard: the figure takes the focus, opens on the threshold month, and the arrow keys step through
    // the months (Page Up and Page Down by six, Home and End to either end)
    svg.setAttribute('tabindex', '0');
    // each step is spoken by a hidden line of its own, so the sentence under the figure keeps its place
    const heard = document.createElement('span');
    heard.className = 'vh'; heard.setAttribute('aria-live', 'polite'); svg.after(heard);
    svg.addEventListener('focus', () => {
      first();
      if (last !== null) return;
      const s = model(+price.value), hit = s.findIndex((f) => f >= +loan.value / 100);
      last = hit > -1 ? hit : DONE; read(last);
    });
    svg.addEventListener('blur', () => { last = null; read(null); heard.textContent = ''; });
    svg.addEventListener('keydown', (e) => {
      if (last === null) return;
      const step = { ArrowLeft: -1, ArrowDown: -1, ArrowRight: 1, ArrowUp: 1, PageDown: -6, PageUp: 6 }[e.key];
      const m = e.key === 'Home' ? 0 : e.key === 'End' ? M : step ? last + step : null;
      if (m === null) return;
      e.preventDefault(); last = Math.max(0, Math.min(M, m)); read(last);
      heard.textContent = 'Month ' + last + ', ' + Math.round(model(+price.value)[last] * 100) + ' percent under contract.';
    });
    const redraw = () => { hair = null; sheet(); draw(); if (last !== null) read(last); };
    // The figure sits well down the page, so it is drawn just after the page has loaded rather than while it loads
    // (measuring its labels lays the page out several times); a hand on the sliders before then draws it at once.
    // Its height is set now, though (one measure, no labels), so nothing below it moves when it draws: the page has
    // often finished loading before its first frame, and a link to a section further down is placed by then.
    // The legend's 'At par' row shows only when the price is off par; settle it now too, so the legend keeps its
    // height (and a link to a section further down still lands under the header) when the figure draws.
    let lastW = 0;
    size();
    if (key) key.parentNode.hidden = +price.value === 0;
    // The sentence below the figure is a live region: filled after load it would be read out away from its figure,
    // so the first draw fills it quietly, as the sliders do between steps.
    const first = () => { if (lastW) return; const s = out('cvSay'); s.setAttribute('aria-live', 'off'); redraw(); lastW = W; setTimeout(() => s.setAttribute('aria-live', 'polite'), 600); };
    if (window.requestIdleCallback) requestIdleCallback(first, { timeout: 1000 }); else setTimeout(first, 200);
    const resized = () => { if (!lastW) size(); else if (Math.abs((svg.clientWidth || 0) - lastW) > 2) { lastW = svg.clientWidth; redraw(); } };
    // (an engine without a resize observer measures it again whenever the window changes)
    if (window.ResizeObserver) new ResizeObserver(resized).observe(svg); else addEventListener('resize', resized);

    // the sentence is a live region; announce it once the slider settles, not on every step
    const sayEl = out('cvSay'); let quiet;
    const onInput = () => { first(); sayEl.setAttribute('aria-live', 'off'); draw(); if (last !== null) read(last); clearTimeout(quiet); quiet = setTimeout(() => { sayEl.setAttribute('aria-live', 'polite'); const t = sayEl.textContent; sayEl.textContent = ''; sayEl.textContent = t; }, 600); };
    price.addEventListener('input', onInput); loan.addEventListener('input', onInput);
  }
});

document.addEventListener('DOMContentLoaded', function () {
  // ---- The letter: composed here, copied, and sent by the writer through Instagram. Until this script has set it up
  // (or if it never runs), the letter's button is a plain link to the same Instagram message (site.css, .letter.ready).
  const form = document.getElementById('letter');
  if (form) {
    const note = document.getElementById('letterNote');
    const paras = [...form.querySelectorAll('.body')];
    // (a reminder about the blanks of one letter means nothing once another is chosen: it goes, with its marks)
    const show = () => { const v = form.querySelector('input[name="as"]:checked').value; paras.forEach((p) => { p.hidden = p.dataset.for !== v; }); if (reminding) { reminding = ''; note.textContent = ''; form.querySelectorAll('.sheet input').forEach((i) => { i.classList.remove('miss'); i.removeAttribute('aria-invalid'); }); } };
    let reminding = '';
    form.querySelectorAll('input[name="as"]').forEach((r) => r.addEventListener('change', show));
    show(); addEventListener('pageshow', show);
    // A link can choose who is writing: ?as=buy from another page, data-as on a link within this one.
    const preset = (v) => { if (!['dev', 'buy', 'adv'].includes(v)) return; form.querySelector('input[name="as"][value="' + v + '"]').checked = true; show(); };
    try {
      const q = new URLSearchParams(location.search), v = q.get('as');
      if (v) { preset(v); q.delete('as'); history.replaceState(history.state, '', location.pathname + (q.toString() ? '?' + q : '') + location.hash); }
    } catch (e) {}
    document.querySelectorAll('a[data-as]').forEach((a) => a.addEventListener('click', () => preset(a.dataset.as)));
    // Enter in a blank should not send the letter
    form.querySelectorAll('.sheet input').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); }));
    // inputs grow with what is typed, so the letter reads as prose
    // where the browser can size a field to its text, let it; otherwise estimate
    const native = window.CSS && CSS.supports('field-sizing', 'content');
    // and a value too long for its line (a long name on a narrow phone) sets itself smaller, to three quarters at most,
    // rather than run out of sight
    const shrink = (i) => { i.style.fontSize = ''; for (let k = 1; k <= 5 && i.scrollWidth > i.clientWidth + 1; k++) i.style.fontSize = 1 - k * 0.05 + 'em'; };
    const fields = form.querySelectorAll('.sheet input');
    fields.forEach((i) => { const fit = () => { if (i.classList.contains('miss')) { i.classList.remove('miss'); i.removeAttribute('aria-invalid'); remind(); } if (!native) i.style.width = Math.min(Math.max(i.placeholder.length, i.value.length, 3) + 1, 26) + 'ch'; if (i.value) shrink(i); else i.style.fontSize = ''; }; i.addEventListener('input', fit); fit(); });
    let rz = 0; addEventListener('resize', () => { cancelAnimationFrame(rz); rz = requestAnimationFrame(() => fields.forEach((i) => { if (i.value) shrink(i); })); });
    form.querySelectorAll('.sheet select').forEach((s) => { const fit = () => { if (native) return; s.style.width = s.options[s.selectedIndex].text.length * 0.42 + 1.5 + 'em'; }; s.addEventListener('change', fit); fit(); });
    const text = () => {
      const p = paras.find((x) => !x.hidden), c = p.cloneNode(true), src = [...p.querySelectorAll('input, select')];
      // an optional clause left blank stays out of the letter
      p.querySelectorAll('[data-opt]').forEach((o, k) => { if (![...o.querySelectorAll('input')].some((i) => i.value.trim())) c.querySelectorAll('[data-opt]')[k].dataset.drop = ''; });
      c.querySelectorAll('input, select').forEach((f, k) => { f.replaceWith(document.createTextNode(src[k].value.trim() || '…')); });
      c.querySelectorAll('[data-drop]').forEach((o) => o.remove());
      const name = form.querySelector('input[name="name"]').value.trim();
      // a dropped clause takes its sentence's full stop with it, so put one back
      let body = c.textContent.replace(/\s+/g, ' ').trim();
      if (!/[.!?…]$/.test(body)) body += '.';
      return 'Dear partners,\n\n' + body + '\n\nWith regards,\n' + (name || '');
    };
    const box = document.getElementById('letterCopy'), area = document.getElementById('letterText');
    // The status note is built from text and, where it names Instagram, one link: nothing is ever parsed as HTML.
    // It is emptied first and filled on the next frame, so a screen reader announces a repeated message again.
    const say = (...parts) => { note.textContent = ''; requestAnimationFrame(() => { note.replaceChildren(...parts); }); };
    // what each blank asks for, so a reminder can name the ones left empty
    const asks = { where: 'the neighborhood', units: 'the number of residences', area: 'the area', mkt: 'your market', niche: 'your focus', prod: 'last year\u2019s sales', name: 'your name' };
    const list = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
    const ask = (empty) => 'Fill in ' + list(empty.map((i) => asks[i.name] || i.getAttribute('aria-label').toLowerCase())) + ' first, so the partners know who is writing and why.';
    // As each named blank is filled, the reminder names only the ones still empty, and goes once none is.
    function remind() {
      if (!reminding) return;
      const left = [...paras.find((x) => !x.hidden).querySelectorAll('input'), form.querySelector('input[name="name"]')].filter((i) => i.classList.contains('miss'));
      const t = left.length ? ask(left) : '';
      if (t !== reminding) { reminding = t; note.textContent = t; }
    }
    // Copy through a selected text field. It finishes inside the click, before anything else can take the focus,
    // in every browser. (16px type, so iOS does not zoom on the field.)
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
      const empty = [...p.querySelectorAll('input'), form.querySelector('input[name="name"]')].filter((i) => !i.value.trim() && !i.closest('[data-opt]'));
      if (empty.length) {
        empty.forEach((i) => { i.classList.add('miss'); i.setAttribute('aria-invalid', 'true'); });
        empty[0].focus();
        reminding = ask(empty); say(reminding);
        return;
      }
      reminding = '';
      const url = 'https://ig.me/m/centamont', where = 'Instagram';
      const t = text();
      // Copy first, while the click still counts as the writer's own and this tab still has the focus. Opening a tab
      // first spends that click in Chrome and Edge, and an asynchronous copy can lose the focus to the new tab before
      // it lands, so the synchronous copy goes first and the clipboard API is only the second try.
      let copying;
      if (syncCopy(t)) copying = Promise.resolve();
      else if (navigator.clipboard && navigator.clipboard.writeText) {
        try { copying = navigator.clipboard.writeText(t); } catch (err) { copying = Promise.reject(err); }
      } else copying = Promise.reject(new Error('copy'));
      // then open Instagram, still inside the same click, so browsers do not block the tab
      const w = window.open(url, '_blank');
      if (w) { try { w.opener = null; } catch (err) {} }
      busy = true; setTimeout(() => { busy = false; }, 1200);
      const link = () => { const a = document.createElement('a'); a.className = 'ul'; a.href = url; a.target = '_blank'; a.rel = 'noopener'; a.textContent = where; return a; };
      const go = (copied) => {
        box.hidden = copied; if (!copied) { area.value = t; area.focus(); area.select(); }
        if (copied) say('Your letter is copied. Paste it into the message on ', link(), ', and a partner will reply personally.');
        else say('Your browser did not allow copying. Copy the letter below and paste it into the message on ', link(), '.');
      };
      copying.then(() => go(true), () => go(false));
    });
    form.classList.add('ready');
  }
});
