// Shared by every page: the menu, day and night, and link underlines that know where they are.
document.addEventListener('DOMContentLoaded', function () {
  document.body.classList.remove('no-js');
  const root = document.documentElement;
  root.classList.add('js');

  // Menu
  const nav = document.getElementById('mainNav'), btn = document.getElementById('menuBtn');
  if (nav && btn) {
    const label = btn.querySelector('span') || btn, word = label.textContent;
    // While the menu is open the page behind it is inert, and Tab cycles between the links and Close.
    const behind = () => document.querySelectorAll('main, footer, .skip');
    const show = (o) => { nav.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); root.classList.toggle('menu-open', o); label.textContent = o ? 'Close' : word; behind().forEach((el) => { el.inert = o; }); };
    nav.addEventListener('keydown', (e) => { const links = nav.querySelectorAll('a'); if (e.key === 'Tab' && e.shiftKey && nav.classList.contains('open') && document.activeElement === links[0]) { e.preventDefault(); btn.focus(); } });
    btn.addEventListener('keydown', (e) => { if (e.key === 'Tab' && !e.shiftKey && nav.classList.contains('open')) { e.preventDefault(); nav.querySelector('a').focus(); } });
    const close = () => show(false);
    btn.addEventListener('click', () => show(!nav.classList.contains('open')));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { close(); btn.focus(); } });
    document.addEventListener('click', (e) => { if (nav.classList.contains('open') && !e.target.closest('header.site')) close(); });
  }

  // Motion on or off, remembered per visitor, on top of the system's reduced-motion setting.
  // The page reloads so every drawing starts again in the chosen mode.
  const stillPage = matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.motion === 'off';
  const motionBtn = document.getElementById('motionBtn');
  if (motionBtn) {
    const off = root.dataset.motion === 'off';
    motionBtn.setAttribute('aria-pressed', String(off)); motionBtn.setAttribute('aria-label', off ? 'Play motion' : 'Pause motion');
    motionBtn.addEventListener('click', () => { try { if (off) localStorage.removeItem('cm-motion'); else localStorage.setItem('cm-motion', 'off'); } catch (e) {} location.reload(); });
  }

  // Day and night, remembered per visitor. Pages listen for 'cm-theme' to recolor drawings.
  const themeBtn = document.getElementById('themeBtn');
  const changed = () => document.dispatchEvent(new CustomEvent('cm-theme'));
  if (themeBtn) themeBtn.setAttribute('aria-pressed', String(root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches));
  if (themeBtn) themeBtn.addEventListener('click', () => {
    const dark = root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    root.dataset.theme = dark ? 'light' : 'dark';
    themeBtn.setAttribute('aria-pressed', String(!dark));
    try { localStorage.setItem('cm-theme', root.dataset.theme); } catch (e) {}
    changed();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', changed);

  // Reading progress on journal notes, where the browser cannot draw it with CSS alone.
  const bar = document.querySelector('.progress i');
  if (bar && !CSS.supports('animation-timeline: scroll()')) {
    const set = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; };
    addEventListener('scroll', set, { passive: true }); set();
  }

  // Headlines rise word by word, and the paragraph after them lifts in. Words keep their spaces, so text reads and copies normally.
  if (!stillPage) {
    const split = (el) => {
      let i = 0;
      const walk = (node) => {
        [...node.childNodes].forEach((n) => {
          if (n.nodeType === 3) {
            const frag = document.createDocumentFragment();
            n.textContent.split(/([ \t\n\r]+)/).forEach((part) => {
              if (!part) return;
              if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              const w = document.createElement('span'); w.className = 'w';
              const inner = document.createElement('i'); inner.textContent = part; inner.style.setProperty('--i', i++);
              w.appendChild(inner); frag.appendChild(w);
            });
            n.replaceWith(frag);
          } else if (n.nodeType === 1 && !n.matches('svg, .w')) walk(n);
        });
      };
      walk(el); el.classList.add('tx-rise');
      // stagger by line rather than by word: words on the same line rise together
      let top = null, line = -1;
      el.querySelectorAll('.w > i').forEach((w) => { const t = w.parentNode.offsetTop; if (top === null || Math.abs(t - top) > 4) { top = t; line++; } w.style.setProperty('--i', line); });
    };
    document.querySelectorAll('main h2, .page h1, .feature h3, .cv-txt h3').forEach(split);
    document.querySelectorAll('main .head .intro, main .head + p, .page .lead-in').forEach((p) => p.classList.add('lift'));
    const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
    document.querySelectorAll('.tx-rise, .lift').forEach((el) => rio.observe(el));
  }

  // Weighted scrolling for mouse wheels: the page eases to rest instead of stepping. Touch, keys, anchors and the scrollbar stay native.
  if (matchMedia('(pointer: fine)').matches && !stillPage) {
    let target = scrollY, cur = scrollY, raf = 0;
    const max = () => document.documentElement.scrollHeight - innerHeight;
    const tick = () => {
      cur += (target - cur) * 0.12;
      if (Math.abs(target - cur) < 0.5) cur = target;
      scrollTo({ top: cur, behavior: 'instant' });
      raf = cur === target ? 0 : requestAnimationFrame(tick);
    };
    addEventListener('wheel', (e) => {
      if (e.ctrlKey || Math.abs(e.deltaX) > Math.abs(e.deltaY) || root.classList.contains('menu-open')) return;
      for (let n = e.target; n && n !== document.body; n = n.parentElement) {
        if (n.nodeType === 1 && n.scrollHeight > n.clientHeight + 1 && /auto|scroll/.test(getComputedStyle(n).overflowY)) return;
      }
      e.preventDefault();
      if (!raf) cur = target = scrollY;
      const d = e.deltaY * (e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? innerHeight : 1);
      target = Math.max(0, Math.min(max(), target + d));
      if (!raf) raf = requestAnimationFrame(tick);
    }, { passive: false });
    // anything else that moves the page (keys, anchors, the scrollbar) takes over from the easing
    addEventListener('scroll', () => { if (!raf) cur = target = scrollY; }, { passive: true });
    addEventListener('keydown', () => { if (raf) { cancelAnimationFrame(raf); raf = 0; } });
    document.addEventListener('click', (e) => { if (raf && e.target.closest('a[href^="#"]')) { cancelAnimationFrame(raf); raf = 0; } });
  }

  // Drawings that draw themselves once they arrive.
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.25 });
  document.querySelectorAll('[data-draw]').forEach((el) => io.observe(el));
});
