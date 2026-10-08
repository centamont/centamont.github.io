// Two instruments on the home page: the sales curve for developers, and the letter to the partners.
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
    function sheet() {
      W = Math.max(300, Math.round(svg.clientWidth || 640));
      H = Math.round(W >= 520 ? Math.min(500, W * 0.76) : Math.max(280, Math.min(380, W * 0.52)));
      X0 = 46; X1 = W - 14;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      svg.textContent = '';
      const g = el('g', { class: 'cv-grid' });
      // phase names along the top, moved to a second row when they would touch
      const rows = [[], [], []];
      const phases = [[BREAK, 'Ground broken'], [TOP, 'Top-off'], [DONE, 'Completion']];
      const tl = [];
      phases.forEach(([m, t]) => { const e = el('text', { class: 'ph', 'text-anchor': 'start' }, g, t); tl.push([m, e, e.getComputedTextLength() || t.length * 8]); });
      let two = 0;
      // leave room past the plot for the last phase name, so every name sits to the right of its line
      const wLast = tl[tl.length - 1][2];
      X1 = Math.min(W - 14, Math.floor(X0 + (W - 4 - X0 - 6 - wLast) * M / DONE));
      const X1p = X1;
      tl.forEach(([m, e, w]) => {
        const sx = X0 + (X1p - X0) * m / M;
        let a = sx + 6, anchor = 'start';
        if (a + w > W - 4) { a = sx - 6; anchor = 'end'; }
        const l = anchor === 'start' ? a : a - w, r = anchor === 'start' ? a + w : a;
        let row = rows.findIndex((rw) => !rw.some(([pl, pr]) => l < pr + 12 && r > pl - 12));
        if (row < 0) row = rows.length - 1;
        if (row) two = Math.max(two, row);
        rows[row].push([l, r]);
        e.dataset.row = row; e.setAttribute('x', a); e.setAttribute('text-anchor', anchor);
      });
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
    const key = document.querySelector('.cv-key .k-par');

    // a small elevation of the tower: four podium floors, then eighteen tapering ones
    const tw = document.getElementById('cvTower'), reduceM = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
    let lastN = 0;
    if (tw) for (let k = 0; k < 22; k++) {
      const wdt = k < 4 ? 36 : 20 - (k - 4) * 0.22, r = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      r.setAttribute('x', (40 - wdt) / 2); r.setAttribute('y', 110 - (k + 1) * 4.9 - (k >= 4 ? 0 : 0)); r.setAttribute('width', wdt); r.setAttribute('height', 4.1); tw.appendChild(r);
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
      if (hit > -1) { const right = x(hit) > X1 - 90; dot.setAttribute('cx', x(hit)); dot.setAttribute('cy', y(T)); dot.style.display = ''; dotT.setAttribute('x', right ? x(hit) - 10 : x(hit) + 10); dotT.setAttribute('text-anchor', right ? 'end' : 'start'); dotT.setAttribute('y', y(T) + 22); dotT.textContent = 'Month ' + hit; }
      else { dot.style.display = 'none'; dotT.textContent = ''; }
      // The threshold label takes the first spot, right or left, above or below the line, that no curve or note runs through.
      const pts = s.map((f, i) => [x(i), y(f)]).concat(p ? base.map((f, i) => [x(i), y(f)]) : []);
      const dotB = dotT.textContent ? dotT.getBBox() : null;
      // Failing a clear spot, the label may cross a curve (its halo keeps it legible) but never the month note.
      const spots = [[X1, 'end', -8], [X0 + 6, 'start', -8], [X1, 'end', 18], [X0 + 6, 'start', 18]].map(([lx, anchor, dy]) => {
        limT.setAttribute('x', lx); limT.setAttribute('text-anchor', anchor); limT.setAttribute('y', y(T) + dy);
        const b = limT.getBBox(), curve = pts.some(([px, py]) => px > b.x - 4 && px < b.x + b.width + 4 && py > b.y - 3 && py < b.y + b.height + 3);
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
      if (tw) { const n = Math.round(done * 22); tw.querySelectorAll('rect').forEach((r, k) => { r.classList.toggle('on', k < n); r.style.transitionDelay = (reduceM ? 0 : Math.abs(k - lastN) * 22) + 'ms'; }); lastN = n; }
      let say;
      const unsold = Math.round((1 - done) * 100), unsoldPar = Math.round((1 - base[DONE]) * 100);
      if (p === 0) say = 'At par, about ' + Math.round(done * 100) + ' percent of the building is under contract by completion' + (hit > -1 ? '.' : ', and the threshold is not met within ' + M + ' months.');
      else {
        const d = hit - baseHit;
        const when = hit < 0 ? 'the threshold is not met within ' + M + ' months' : d === 0 ? 'the threshold arrives in the same month' : 'the threshold arrives ' + Math.abs(d) + (Math.abs(d) === 1 ? ' month ' : ' months ') + (d > 0 ? 'later' : 'sooner');
        say = 'Each residence earns ' + Math.abs(p) + (p > 0 ? ' percent more, but ' : ' percent less, ') + when + ', and ' + unsold + ' percent of the building is still for sale at completion, against ' + unsoldPar + ' at par.';
      }
      out('cvSay').textContent = say;
      svg.setAttribute('aria-label', 'Illustrative sales curve. ' + say);
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
    svg.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const r = svg.getBoundingClientRect(), u = (e.clientX - r.left) * W / r.width;
      const m = Math.round((u - X0) / (X1 - X0) * M);
      last = m < 0 || m > M ? null : m; read(last);
    });
    svg.addEventListener('pointerleave', () => { last = null; read(null); });
    const redraw = () => { hair = null; sheet(); draw(); if (last !== null) read(last); };
    redraw();
    let lastW = W;
    new ResizeObserver(() => { if (Math.abs((svg.clientWidth || 0) - lastW) > 2) { lastW = svg.clientWidth; redraw(); } }).observe(svg);

    // the sentence is a live region; announce it once the slider settles, not on every step
    const sayEl = out('cvSay'); let quiet;
    const onInput = () => { sayEl.setAttribute('aria-live', 'off'); draw(); if (last !== null) read(last); clearTimeout(quiet); quiet = setTimeout(() => { sayEl.setAttribute('aria-live', 'polite'); const t = sayEl.textContent; sayEl.textContent = ''; sayEl.textContent = t; }, 600); };
    price.addEventListener('input', onInput); loan.addEventListener('input', onInput);
  }

  // ---- The letter: composed here, copied, and sent by the writer through Instagram or LinkedIn
  const form = document.getElementById('letter');
  if (form) {
    const note = document.getElementById('letterNote');
    const paras = [...form.querySelectorAll('.body')];
    const show = () => { const v = form.querySelector('input[name="as"]:checked').value; paras.forEach((p) => { p.hidden = p.dataset.for !== v; }); };
    form.querySelectorAll('input[name="as"]').forEach((r) => r.addEventListener('change', show));
    show(); addEventListener('pageshow', show);
    // Enter in a blank should not send the letter
    form.querySelectorAll('.sheet input').forEach((i) => i.addEventListener('keydown', (e) => { if (e.key === 'Enter') e.preventDefault(); }));
    // inputs grow with what is typed, so the letter reads as prose
    // where the browser can size a field to its text, let it; otherwise estimate
    const native = window.CSS && CSS.supports('field-sizing', 'content');
    form.querySelectorAll('.sheet input').forEach((i) => { const fit = () => { i.classList.remove('miss'); if (native) return; i.style.width = Math.min(Math.max(i.placeholder.length, i.value.length, 3) + 1, 26) + 'ch'; }; i.addEventListener('input', fit); fit(); });
    form.querySelectorAll('.sheet select').forEach((s) => { const fit = () => { if (native) return; s.style.width = s.options[s.selectedIndex].text.length * 0.42 + 1.5 + 'em'; }; s.addEventListener('change', fit); fit(); });
    const text = () => {
      const p = paras.find((x) => !x.hidden), c = p.cloneNode(true);
      c.querySelectorAll('input, select').forEach((f, k) => { const src = p.querySelectorAll('input, select')[k]; f.replaceWith(document.createTextNode(src.value.trim() || '…')); });
      const name = form.querySelector('input[name="name"]').value.trim();
      return 'Dear partners,\n\n' + c.textContent.replace(/\s+/g, ' ').trim() + '\n\nWith regards,\n' + (name || '');
    };
    const box = document.getElementById('letterCopy'), area = document.getElementById('letterText');
    const say = (html) => { note.textContent = ''; requestAnimationFrame(() => { note.innerHTML = html; }); };
    let busy = false;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (busy) return;
      const p = paras.find((x) => !x.hidden);
      const empty = [...p.querySelectorAll('input'), form.querySelector('input[name="name"]')].filter((i) => !i.value.trim());
      if (empty.length) {
        empty.forEach((i) => i.classList.add('miss'));
        empty[0].focus();
        say('Fill in the underlined ' + (empty.length === 1 ? 'blank' : 'blanks') + ' first, so the partners know who is writing and why.');
        return;
      }
      const to = (e.submitter && e.submitter.dataset.to) || 'ig';
      const url = to === 'li' ? 'https://www.linkedin.com/company/centamont' : 'https://ig.me/m/centamont';
      const where = to === 'li' ? 'LinkedIn' : 'Instagram';
      const t = text();
      // open the tab inside the click, before anything asynchronous, so browsers do not block it
      const w = window.open('', '_blank');
      if (w) { try { w.opener = null; } catch (err) {} }
      busy = true; setTimeout(() => { busy = false; }, 1200);
      const link = '<a class="ul" href="' + url + '" target="_blank" rel="noopener">' + where + '</a>';
      const go = (copied) => {
        if (w) w.location.href = url;
        box.hidden = copied; if (!copied) { area.value = t; area.focus(); area.select(); }
        say(copied
          ? 'Your letter is copied. Paste it into the message on ' + link + ', and a partner will reply personally.'
          : 'Your browser did not allow copying. Copy the letter below and paste it into the message on ' + link + '.');
      };
      (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => go(true), () => go(false));
    });
  }
});
