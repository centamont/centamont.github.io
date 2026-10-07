// Two instruments on the home page: the sales curve for developers, and the letter to the partners.
document.addEventListener('DOMContentLoaded', function () {
  // ---- Sales against the schedule: an illustrative absorption model
  const svg = document.getElementById('cvSvg');
  if (svg) {
    const price = document.getElementById('cvPrice'), loan = document.getElementById('cvLoan');
    const out = (id) => document.getElementById(id);
    const M = 36, BREAK = 6, TOP = 24, DONE = 30;
    const X0 = 52, X1 = 616, Y0 = 26, Y1 = 262;
    const x = (m) => X0 + (X1 - X0) * m / M, y = (f) => Y1 - (Y1 - Y0) * f;
    const NS = 'http://www.w3.org/2000/svg';
    const el = (tag, attrs, parent, text) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (text != null) e.textContent = text; (parent || svg).appendChild(e); return e; };

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

    // Static sheet: grid, schedule and labels
    const g = el('g', { class: 'cv-grid' });
    [0.25, 0.5, 0.75, 1].forEach((f) => { el('line', { x1: X0, x2: X1, y1: y(f), y2: y(f) }, g); el('text', { x: X0 - 10, y: y(f) + 4, 'text-anchor': 'end' }, g, Math.round(f * 100) + '%'); });
    el('line', { class: 'axis', x1: X0, x2: X1, y1: Y1, y2: Y1 }, g);
    [[0, 'Launch'], [BREAK, 'Ground broken'], [TOP, 'Top-off'], [DONE, 'Completion']].forEach(([m, t]) => {
      el('line', { class: 'phase', x1: x(m), x2: x(m), y1: Y0, y2: Y1 + 8 }, g);
      el('text', { class: 'ph', x: x(m) + 6, y: m ? Y0 + 4 : Y1 + 26, 'text-anchor': 'start' }, g, t);
    });
    el('text', { class: 'ph', x: X1, y: Y1 + 44, 'text-anchor': 'end' }, g, 'Months from launch');
    const build = el('path', { class: 'cv-build' });
    const area = el('path', { class: 'cv-area' }), par = el('path', { class: 'cv-par' }), line = el('path', { class: 'cv-line' });
    const lim = el('line', { class: 'cv-lim' }), limT = el('text', { class: 'cv-limt', 'text-anchor': 'end' });
    const dot = el('circle', { class: 'cv-dot', r: 4.5 }), dotT = el('text', { class: 'cv-dott' });
    // construction progress, from ground broken to completion
    build.setAttribute('d', `M${x(BREAK)} ${Y1} L${x(DONE)} ${y(1)}`);

    const path = (s) => s.map((f, m) => (m ? 'L' : 'M') + x(m).toFixed(1) + ' ' + y(f).toFixed(1)).join(' ');
    const parPath = path(model(0));
    const fmt = (p) => (p === 0 ? 'At par' : (p > 0 ? p + '% above' : -p + '% below'));

    function draw() {
      const p = +price.value, T = +loan.value / 100, s = model(p);
      out('cvPriceOut').textContent = fmt(p);
      out('cvLoanOut').textContent = loan.value + '%';
      price.setAttribute('aria-valuetext', fmt(p)); loan.setAttribute('aria-valuetext', loan.value + ' percent');
      par.setAttribute('d', p ? parPath : '');
      line.setAttribute('d', path(s));
      area.setAttribute('d', path(s) + ` L${x(M)} ${Y1} L${x(0)} ${Y1} Z`);
      lim.setAttribute('x1', X0); lim.setAttribute('x2', X1); lim.setAttribute('y1', y(T)); lim.setAttribute('y2', y(T));
      limT.setAttribute('x', X1); limT.setAttribute('y', y(T) - 8); limT.textContent = 'Pre-sale threshold';
      const hit = s.findIndex((f) => f >= T), done = s[DONE], base = model(0), baseHit = base.findIndex((f) => f >= T);
      if (hit > -1) { const right = x(hit) > X1 - 90; dot.setAttribute('cx', x(hit)); dot.setAttribute('cy', y(T)); dot.style.display = ''; dotT.setAttribute('x', right ? x(hit) - 10 : x(hit) + 10); dotT.setAttribute('text-anchor', right ? 'end' : 'start'); dotT.setAttribute('y', y(T) + 22); dotT.textContent = 'Month ' + hit; }
      else { dot.style.display = 'none'; dotT.textContent = ''; }
      out('cvMonth').textContent = hit > -1 ? 'Month ' + hit : 'Not by month ' + M;
      out('cvDone').textContent = Math.round(done * 100) + '%';
      out('cvPer').textContent = p === 0 ? 'At par' : (p > 0 ? '+' : '−') + Math.abs(p) + '%';
      let say;
      const unsold = Math.round((1 - done) * 100), unsoldPar = Math.round((1 - base[DONE]) * 100);
      if (p === 0) say = 'At par, about ' + Math.round(done * 100) + ' percent of the building is under contract by completion.';
      else {
        const d = hit - baseHit;
        const when = hit < 0 ? 'the threshold is not met in this window' : d === 0 ? 'the threshold arrives in the same month' : 'the threshold arrives ' + Math.abs(d) + (Math.abs(d) === 1 ? ' month ' : ' months ') + (d > 0 ? 'later' : 'sooner');
        say = p > 0
          ? 'Each residence earns ' + p + ' percent more, but ' + when + ', and ' + unsold + ' percent of the building is still for sale at completion, against ' + unsoldPar + ' at par.'
          : 'Each residence earns ' + -p + ' percent less, ' + when + ', and ' + unsold + ' percent of the building is still for sale at completion, against ' + unsoldPar + ' at par.';
      }
      out('cvSay').textContent = say;
      svg.setAttribute('aria-label', 'Illustrative sales curve. ' + say);
    }
    // the sentence is a live region; announce it once the slider settles, not on every step
    const sayEl = out('cvSay'); let quiet;
    const onInput = () => { sayEl.setAttribute('aria-live', 'off'); draw(); clearTimeout(quiet); quiet = setTimeout(() => { sayEl.setAttribute('aria-live', 'polite'); const t = sayEl.textContent; sayEl.textContent = ''; sayEl.textContent = t; }, 600); };
    price.addEventListener('input', onInput); loan.addEventListener('input', onInput);
    draw();
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
    form.querySelectorAll('.sheet input').forEach((i) => { const fit = () => { i.style.width = Math.min(Math.max(i.placeholder.length, i.value.length, 3) + 1, 26) + 'ch'; i.classList.remove('miss'); }; i.addEventListener('input', fit); fit(); });
    form.querySelectorAll('.sheet select').forEach((s) => { const fit = () => { s.style.width = s.options[s.selectedIndex].text.length * 0.42 + 1.5 + 'em'; }; s.addEventListener('change', fit); fit(); });
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
