// Built from _src/site.js by tools/version.py: edit the source, not this file.
(function (init) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init(); })(function () {
document.body.classList.remove('no-js');
const root = document.documentElement;
root.classList.add('js');
const home = 'https://centamont.com', lang = (root.lang || 'en').slice(0, 2);
let framed = false;
try { framed = top !== self && top.location.origin !== location.origin; } catch (e) { framed = true; }
if (framed) {
try { top.location.replace(location.href); } catch (e) {}
const a = document.createElement('a');
a.href = location.href; a.target = '_top'; a.rel = 'noopener'; a.className = 'copy-note';
a.textContent = { es: 'Abrir centamont.com', pt: 'Abrir centamont.com' }[lang] || 'Open centamont.com';
document.body.replaceChildren(a);
return;
}
if (location.protocol !== 'file:' && !/^(centamont\.com|www\.centamont\.com|localhost|127\.0\.0\.1|\[::1\]|.+\.translate\.goog|web\.archive\.org|webcache\.googleusercontent\.com)$/.test(location.hostname)) {
const a = document.createElement('a');
a.href = home + location.pathname; a.rel = 'noopener'; a.className = 'copy-note';
a.textContent = { es: 'Esta página es una copia. La original está en centamont.com.', pt: 'Esta página é uma cópia. A original está em centamont.com.' }[lang] || 'This page is a copy. The original is at centamont.com.';
document.body.prepend(a);
}
const counting = /^(www\.)?centamont\.com$/.test(location.hostname) && !navigator.webdriver && !navigator.globalPrivacyControl && navigator.doNotTrack !== '1';
const count = (p, ev) => {
if (!counting) return;
const u = 'https://centamont.goatcounter.com/count?' + new URLSearchParams({ p, t: ev ? p : document.title, r: ev ? '' : document.referrer, e: ev ? 'true' : 'false', rnd: Math.random().toString(36).slice(2, 7) });
try { if (navigator.sendBeacon && navigator.sendBeacon(u)) return; } catch (e) {}
new Image().src = u;
};
window.cmCount = (name) => count(name, true);
count(location.pathname, false);
document.addEventListener('click', (e) => {
const a = e.target.closest && e.target.closest('a[href]');
if (!a) return;
if (/^https:\/\/(ig\.me|www\.instagram\.com)\//.test(a.href)) window.cmCount('instagram' + location.pathname);
else if (/\.pdf(\?|$)/.test(a.getAttribute('href'))) window.cmCount('brief' + location.pathname);
}, true);
const nav = document.getElementById('mainNav'), btn = document.getElementById('menuBtn');
if (nav && btn) {
const label = btn.querySelector('span') || btn, word = label.textContent, shut = { es: 'Cerrar', pt: 'Fechar' }[lang] || 'Close';
const behind = () => document.querySelectorAll('main, footer, .skip');
let still = 0;
const show = (o) => { nav.classList.toggle('open', o); btn.setAttribute('aria-expanded', String(o)); if (o) root.classList.toggle('sb', innerWidth > root.clientWidth); root.classList.toggle('menu-open', o); label.textContent = o ? shut : word;
cancelAnimationFrame(still); if (o) still = requestAnimationFrame(() => { still = requestAnimationFrame(() => { if (nav.classList.contains('open')) behind().forEach((el) => { el.inert = true; }); }); }); else behind().forEach((el) => { el.inert = false; }); };
nav.addEventListener('keydown', (e) => { const links = nav.querySelectorAll('a'); if (e.key === 'Tab' && e.shiftKey && nav.classList.contains('open') && document.activeElement === links[0]) { e.preventDefault(); btn.focus(); } });
btn.addEventListener('keydown', (e) => { if (e.key === 'Tab' && !e.shiftKey && nav.classList.contains('open')) { e.preventDefault(); nav.querySelector('a').focus(); } });
const close = () => show(false);
const wide = matchMedia('(max-width:1279px),(max-width:79.9375em)'), onWide = (e) => { if (!e.matches && nav.classList.contains('open')) close(); };
wide.addEventListener ? wide.addEventListener('change', onWide) : wide.addListener(onWide);
addEventListener('resize', () => { if (nav.classList.contains('open') && getComputedStyle(btn).display === 'none') close(); });
btn.addEventListener('click', () => show(!nav.classList.contains('open')));
nav.addEventListener('click', (e) => { if (e.target.closest('a')) close(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && nav.classList.contains('open')) { close(); btn.focus(); } });
document.addEventListener('click', (e) => { if (nav.classList.contains('open') && !e.target.closest('header.site')) close(); });
}
const mk = document.querySelector('.mk');
if (mk) {
const mb = mk.querySelector('.mk-btn'), inBar = () => getComputedStyle(mb).display !== 'none';
let hover = false, wait = 0;
const set = (o) => { mk.classList.toggle('open', o); mb.setAttribute('aria-expanded', String(o)); if (!o) hover = false; };
mb.addEventListener('click', () => { if (hover) { hover = false; set(true); } else set(!mk.classList.contains('open')); });
mb.addEventListener('keydown', (e) => { if (e.key === 'ArrowDown') { e.preventDefault(); set(true); mk.querySelector('.mk-panel a').focus(); } });
mk.addEventListener('keydown', (e) => {
if (e.key === 'Escape' && mk.classList.contains('open')) { e.stopPropagation(); set(false); mb.focus(); return; }
if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && e.target.closest('.mk-panel') && inBar()) {
const ls = [...mk.querySelectorAll('.mk-panel a')], i = ls.indexOf(e.target) + (e.key === 'ArrowDown' ? 1 : -1);
e.preventDefault(); (i < 0 ? mb : ls[Math.min(i, ls.length - 1)]).focus();
}
});
mk.addEventListener('focusout', (e) => { if (!mk.contains(e.relatedTarget)) set(false); });
document.addEventListener('click', (e) => { if (!e.target.closest('.mk')) set(false); });
mk.addEventListener('pointerenter', (e) => { if (e.pointerType !== 'mouse' || !inBar()) return; clearTimeout(wait); if (!mk.classList.contains('open')) { hover = true; set(true); } });
mk.addEventListener('pointerleave', (e) => { if (e.pointerType !== 'mouse' || !hover) return; wait = setTimeout(() => { if (hover) set(false); }, 240); });
const ms = document.getElementById('markets');
if (ms && 'IntersectionObserver' in window) new IntersectionObserver((es) => es.forEach((e) => mk.classList.toggle('here', e.isIntersecting)), { rootMargin: '-45% 0px -54% 0px' }).observe(ms);
}
const header = document.querySelector('header.site'), grounds = [...document.querySelectorAll('.hero, .band')];
let ground = () => {};
const tcs = [...document.querySelectorAll('meta[name="theme-color"]')], hex = (s) => '#' + (s.match(/\d+/g) || []).slice(0, 3).map((v) => (+v).toString(16).padStart(2, '0')).join('');
let tones = { ink: '', page: '' }, onInk = false;
const tone = () => { const cs = getComputedStyle(root); tones = { ink: hex(cs.getPropertyValue('--hero-rgb')), page: hex(getComputedStyle(document.body).backgroundColor) }; };
const chrome = (ink) => { onInk = ink; const v = ink ? tones.ink : tones.page; if (v.length === 7) tcs.forEach((tc) => { if (tc.content !== v) tc.content = v; }); };
tone(); chrome(false);
if (header && grounds.length) {
let raf = 0, key = '', lead = [];
const sym = header.querySelector('.mark .sym');
header.classList.add('lk');
const leads = () => { const F = header.offsetHeight + 1; lead = grounds.map((g) => g.getBoundingClientRect().top + scrollY <= F); };
leads();
const swap = (cls, on) => { if (header.classList.contains(cls) === on) return; header.classList.add('swap'); header.classList.toggle(cls, on); requestAnimationFrame(() => requestAnimationFrame(() => header.classList.remove('swap'))); };
ground = () => {
raf = 0;
if (root.classList.contains('menu-open') || (nav && nav.classList.contains('jump'))) return;
const y0 = header.getBoundingClientRect().top, H = header.clientHeight, F = header.offsetHeight, m = H / 2;
let a = H, b = 0, over = false, foot = false;
grounds.forEach((g, i) => {
const r = g.getBoundingClientRect(), t = lead[i] ? -1e9 : r.top - y0, u = r.bottom - y0;
if (!g.classList.contains('hero')) { if (t <= F && u > F) { a = 0; b = H; over = true; foot = true; } return; }
if (u > 0 && t < H) { a = Math.min(a, Math.max(0, t)); b = Math.max(b, Math.min(H, u)); }
if (t <= m && u > m) over = true;
if (t <= F && u > F) foot = true;
});
const s = sym && sym.getBoundingClientRect(), lo = Math.min(m - 12, s ? s.top - y0 - 2 : m), hi = Math.max(m + 12, s ? s.bottom - y0 + 2 : m);
if (b > lo && b < hi) b = over ? hi : lo;
if (a > lo && a < hi) a = over ? lo : hi;
const k = b > a ? Math.round(a) + 'px ' + Math.round(b) + 'px' : '0px 0px';
if (k !== key) { key = k; const [ka, kb] = k.split(' '); header.style.setProperty('--ka', ka); header.style.setProperty('--kb', kb); }
swap('over', over); swap('ink-foot', foot);
chrome(root.classList.contains('hdr-off') ? grounds.some((g) => { const r = g.getBoundingClientRect(); return r.top <= 0 && r.bottom > 0; }) : over);
};
const req = () => { if (!raf) raf = requestAnimationFrame(ground); };
let rz = 0;
addEventListener('scroll', req, { passive: true }); addEventListener('resize', () => { req(); clearTimeout(rz); rz = setTimeout(() => { leads(); req(); }, 120); });
new MutationObserver(req).observe(root, { attributes: true, attributeFilter: ['class'] });
ground();
let slide = 0;
new MutationObserver((ms) => { if (!ms.some((m) => /\bhdr-off\b/.test(m.oldValue || '') !== root.classList.contains('hdr-off'))) return; const t0 = performance.now(); cancelAnimationFrame(slide); const f = () => { ground(); if (performance.now() - t0 < 340) slide = requestAnimationFrame(f); }; slide = requestAnimationFrame(f); }).observe(root, { attributes: true, attributeFilter: ['class'], attributeOldValue: true });
}
let steady = () => {};
if (header) {
const narrow = matchMedia('(max-width:820px)'), calm = matchMedia('(prefers-reduced-motion: reduce)');
let lastY = -1, down = 0, hold = 0, hraf = 0;
const off = (o) => { if (root.classList.contains('hdr-off') !== o) root.classList.toggle('hdr-off', o); };
steady = () => { off(false); down = 0; hold = performance.now() + 1500; addEventListener('scrollend', () => { hold = performance.now() + 120; }, { once: true }); };
const step = () => {
hraf = 0;
const y = Math.max(0, scrollY), d = lastY < 0 ? 0 : y - lastY; lastY = y;
if (!narrow.matches || calm.matches || root.dataset.motion === 'off' || root.classList.contains('menu-open') || y <= header.offsetHeight || header.querySelector(':focus-visible') || d < 0) { down = 0; off(false); return; }
if (performance.now() < hold) { down = 0; return; }
down += d; if (down > 8) off(true);
};
addEventListener('scroll', () => { if (!hraf) hraf = requestAnimationFrame(step); }, { passive: true });
header.addEventListener('focusin', () => off(false));
addEventListener('hashchange', steady); addEventListener('popstate', steady);
if (location.hash.length > 1) { steady(); addEventListener('load', steady, { once: true }); }
addEventListener('pageshow', (e) => { if (e.persisted && location.hash.length > 1) steady(); });
(narrow.addEventListener ? narrow.addEventListener('change', step) : narrow.addListener(step));
}
const stillPage = matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.motion === 'off';
const motionBtn = document.getElementById('motionBtn');
if (motionBtn) {
const off = root.dataset.motion === 'off';
motionBtn.setAttribute('aria-pressed', String(off));
motionBtn.addEventListener('click', (e) => {
let kept = false;
try { if (off) localStorage.removeItem('cm-motion'); else localStorage.setItem('cm-motion', 'off'); kept = true; } catch (err) {}
const u = new URL(location.href);
if (!off && !kept) u.searchParams.set('motion', 'off'); else u.searchParams.delete('motion');
let moved = false;
try { history.replaceState(Object.assign({}, typeof history.state === 'object' ? history.state : null, { cmY: { p: location.pathname, y: Math.round(scrollY) }, cmFocus: e.detail === 0 }), '', u.href); moved = true; } catch (err) {}
if (moved || u.href === location.href) location.reload(); else location.replace(u.href);
});
}
try {
const hs = history.state && typeof history.state === 'object' ? history.state : null, k = hs && hs.cmY;
if (hs && ('cmY' in hs || 'cmFocus' in hs)) {
if (hs.cmFocus && motionBtn) motionBtn.focus({ preventScroll: true });
const rest = Object.assign({}, hs); delete rest.cmY; delete rest.cmFocus;
history.replaceState(rest, '');
}
if (k && k.p === location.pathname && k.y > 0) {
const put = () => { steady(); scrollTo({ top: k.y, behavior: 'instant' }); };
put(); addEventListener('load', () => { if (Math.abs(scrollY - k.y) > 2) put(); }, { once: true });
}
} catch (e) {}
const inUrl = () => { const q = new URLSearchParams(location.search), k = []; if (q.get('motion') === 'off') k.push(['motion', 'off']); if (/^(dark|light)$/.test(q.get('theme') || '')) k.push(['theme', q.get('theme')]); return k; };
const carry = (e) => {
const keep = inUrl(); if (!keep.length) return;
const a = e.target.closest && e.target.closest('a[href]');
if (!a || a.origin !== location.origin || a.hasAttribute('download')) return;
const u = new URL(a.href);
if (keep.some(([k, v]) => u.searchParams.get(k) !== v)) { keep.forEach(([k, v]) => u.searchParams.set(k, v)); a.href = u.href; }
};
document.addEventListener('click', carry, true); document.addEventListener('auxclick', carry, true);
const themeBtn = document.getElementById('themeBtn');
const scheme = matchMedia('(prefers-color-scheme: dark)');
const night = () => (root.dataset.theme ? root.dataset.theme === 'dark' : scheme.matches);
const pressed = () => { if (themeBtn) themeBtn.setAttribute('aria-pressed', String(night())); };
const changed = () => { tone(); chrome(onInk); document.dispatchEvent(new CustomEvent('cm-theme')); };
pressed();
const flip = () => {
root.dataset.theme = night() ? 'light' : 'dark';
root.classList.add('turned');
pressed();
let kept = false;
try { localStorage.setItem('cm-theme', root.dataset.theme); kept = true; } catch (e) {}
try {
const u = new URL(location.href);
if (kept) u.searchParams.delete('theme'); else u.searchParams.set('theme', root.dataset.theme);
if (u.href !== location.href) history.replaceState(history.state, '', u.href);
} catch (e) {}
changed();
};
let turns = 0;
if (themeBtn) themeBtn.addEventListener('click', () => {
const me = ++turns, done = () => { if (me === turns) root.classList.remove('theming', 'turned'); };
if (stillPage || matchMedia('(prefers-reduced-motion: reduce)').matches) { flip(); done(); return; }
root.classList.add('theming');
let vt = null;
try { if (document.startViewTransition) vt = document.startViewTransition(flip); } catch (e) { vt = null; }
if (vt) vt.finished.then(done, done); else { flip(); setTimeout(done, 300); }
});
const follow = () => { pressed(); changed(); };
if (scheme.addEventListener) scheme.addEventListener('change', follow); else scheme.addListener(follow);
const bar = document.querySelector('.progress i');
if (bar && !CSS.supports('animation-timeline: scroll()')) {
const set = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')'; };
addEventListener('scroll', set, { passive: true }); set();
}
const foot = document.querySelector('body > footer');
if (bar && foot) {
const line = bar.parentElement, end = () => line.classList.toggle('end', foot.getBoundingClientRect().top < line.getBoundingClientRect().bottom);
addEventListener('scroll', end, { passive: true }); addEventListener('resize', end); end();
}
const page = document.querySelector('main.page:not(.wide) > .wrap'), heads = page ? [...page.querySelectorAll('h2')] : [];
if (heads.length >= 3) {
const lang = (root.lang || 'en').slice(0, 2), slug = (t) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const toc = document.createElement('nav'), box = document.createElement('div'), list = document.createElement('ol'), links = new Map();
toc.className = 'toc';
toc.setAttribute('aria-label', { es: 'En esta página', pt: 'Nesta página' }[lang] || 'On this page');
const k = document.createElement('p');
k.className = 'toc-k'; k.setAttribute('aria-hidden', 'true'); k.textContent = toc.getAttribute('aria-label');
box.appendChild(k);
heads.forEach((h) => {
if (!h.id) { let id = slug(h.textContent), n = 2; while (document.getElementById(id)) id = slug(h.textContent) + '-' + n++; h.id = id; }
const li = document.createElement('li'), a = document.createElement('a');
a.href = '#' + h.id; a.textContent = h.textContent.replace(/\s+/g, ' ').trim();
li.appendChild(a); list.appendChild(li); links.set(h, a);
});
box.appendChild(list); toc.appendChild(box);
page.prepend(toc);
const place = () => toc.style.setProperty('--toc-top', Math.round(heads[0].getBoundingClientRect().top - page.getBoundingClientRect().top) + 'px');
place(); addEventListener('resize', place); addEventListener('load', place); if (document.fonts) document.fonts.ready.then(place);
const mark = () => {
let at = heads[0];
for (const h of heads) if (h.getBoundingClientRect().top < innerHeight / 3) at = h;
links.forEach((a, h) => { if (h === at) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
};
let queued = false;
addEventListener('scroll', () => { if (!queued) { queued = true; requestAnimationFrame(() => { queued = false; mark(); }); } }, { passive: true });
mark();
}
const ruler = document.getElementById('ruler'), seam = document.getElementById('seam');
if (ruler && seam) {
const ticks = [...ruler.querySelectorAll('line:not(.base)')];
const hit = new Array(ticks.length).fill(false);
let done = false, seamSeen = false, raf = 0;
const split = () => { if (done && (seamSeen || stillPage) && !seam.classList.contains('crack')) { seam.classList.add('crack'); setTimeout(() => { seam.classList.add('split'); ruler.classList.add('flash'); }, stillPage ? 0 : 650); } };
const strike = () => {
done = true; ticks.forEach((t) => t.classList.add('hit'));
ruler.classList.add('struck');
removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll);
split();
};
const frame = () => {
raf = 0;
const r = ruler.getBoundingClientRect(), vh = innerHeight;
const p = Math.max(0, Math.min(1, (vh * 0.85 - r.top) / (vh * 0.55)));
const n = Math.floor(p * 100);
if (n >= 100) { strike(); return; }
for (let i = 0; i < ticks.length; i++) { const on = i < n; if (on !== hit[i]) { hit[i] = on; ticks[i].classList.toggle('hit', on); } }
};
function onScroll() { if (!raf) raf = requestAnimationFrame(frame); }
new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { seamSeen = true; o.disconnect(); split(); } }), { threshold: 0.9 }).observe(seam);
if (stillPage) strike();
else { addEventListener('scroll', onScroll, { passive: true }); addEventListener('resize', onScroll); onScroll(); }
}
if (stillPage) document.querySelectorAll('.people .table').forEach((t) => t.classList.add('in'));
const sig = document.querySelector('footer .sig');
if (sig && !stillPage && 'IntersectionObserver' in window) {
sig.classList.add('eng');
new IntersectionObserver((es, o) => es.forEach((e) => { if (e.isIntersecting) { o.disconnect(); requestAnimationFrame(() => requestAnimationFrame(() => sig.classList.add('in'))); } }), { rootMargin: '0px 0px -30% 0px' }).observe(sig.parentNode);
}
const painted = performance.getEntriesByType && performance.getEntriesByType('paint').some((e) => e.name === 'first-contentful-paint');
const seen = (el) => { if (!painted) return false; const r = el.getBoundingClientRect(); return r.top < innerHeight && r.bottom > 0; };
const ruled = [...document.querySelectorAll('main .head .intro')].filter((p) => p.closest('section'));
const ruleIn = (p) => p.closest('section').classList.add('in');
if (stillPage || !('IntersectionObserver' in window)) ruled.forEach(ruleIn);
else {
const hio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { ruleIn(e.target); hio.unobserve(e.target); } }), { rootMargin: '0px 0px -15% 0px' });
ruled.forEach((p) => { if (seen(p)) ruleIn(p); else hio.observe(p); });
}
if (!stillPage) {
const split = (el) => {
const walk = (node) => {
[...node.childNodes].forEach((n) => {
if (n.nodeType === 3) {
const frag = document.createDocumentFragment();
n.textContent.split(/([ \t\n\r]+)/).forEach((part) => {
if (!part) return;
if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
const w = document.createElement('span'); w.className = 'w';
const inner = document.createElement('i'); inner.textContent = part;
w.appendChild(inner); frag.appendChild(w);
});
n.replaceWith(frag);
} else if (n.nodeType === 1 && !n.matches('svg, .w')) walk(n);
});
};
walk(el); el.classList.add('tx-rise');
};
const heads = [...document.querySelectorAll('#markets h2, .contact h2.display, .page h1')].filter((el) => !seen(el));
heads.forEach(split);
const lines = (el) => { let top = null, line = -1; [...el.querySelectorAll('.w > i')].map((w) => { const t = w.parentNode.offsetTop; if (top === null || Math.abs(t - top) > 4) { top = t; line++; } return [w, line]; }).forEach(([w, n]) => w.style.setProperty('--i', n)); };
const rio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { if (e.target.classList.contains('tx-rise')) lines(e.target); e.target.classList.add('in'); rio.unobserve(e.target); } }), { rootMargin: '0px 0px -12% 0px' });
document.querySelectorAll('.tx-rise').forEach((el) => rio.observe(el));
}
const doors = document.querySelectorAll('.doorway');
if (stillPage || !('IntersectionObserver' in window)) doors.forEach((d) => d.classList.add('in'));
else if (doors.length) {
const dio = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting && (e.intersectionRatio >= 0.33 || e.intersectionRect.height >= innerHeight * 0.33)) { e.target.classList.add('in'); dio.unobserve(e.target); } }), { threshold: [0, 0.1, 0.2, 0.25, 0.3, 0.34, 0.4, 0.5, 0.6, 0.8, 1] });
doors.forEach((d) => dio.observe(d));
}
const arch = document.querySelector('.door .arch');
if (arch) addEventListener('pageswap', (e) => {
const r = arch.getBoundingClientRect(), to = e.activation && e.activation.entry && e.activation.entry.url;
const go = !!(e.viewTransition && to && /private-clients\.html/.test(to) && r.bottom > 64 && r.top < innerHeight);
arch.style.viewTransitionName = go ? 'cm-door' : '';
try { if (go) sessionStorage.setItem('cm-door', '1'); else sessionStorage.removeItem('cm-door'); } catch (err) {}
});
const inkSpans = () => {
const sp = [];
document.querySelectorAll('.hero, .band').forEach((g) => { const r = g.getBoundingClientRect(), a = Math.max(0, r.top), b = Math.min(innerHeight, r.bottom); if (b > a) sp.push([a, b]); });
sp.sort((x, y) => x[0] - y[0]);
return sp.reduce((m, q) => { const l = m[m.length - 1]; if (l && q[0] <= l[1]) l[1] = Math.max(l[1], q[1]); else m.push(q.slice()); return m; }, []);
};
addEventListener('pageswap', (e) => {
const vt = e.viewTransition, to = vt && e.activation && e.activation.entry && e.activation.entry.url;
if (!to || night()) return;
let u; try { u = new URL(to); } catch (err) { return; }
const home = /\/(index\.html)?$/.test(u.pathname) && !/\/journal\/(index\.html)?$/.test(u.pathname);
const lands = (home || /private-clients\.html$/.test(u.pathname)) && (!u.hash || u.hash === '#top');
const sp = inkSpans(), ink = sp.reduce((t, q) => t + q[1] - q[0], 0) / innerHeight;
const over = !!(header && header.classList.contains('over'));
if (lands ? !over || ink < 0.85 : over || ink > 0.15) { vt.skipTransition(); return; }
const cover = (a, b) => { if (b - a < 1) return; const c = document.createElement('div'); c.className = 'vt-cover' + (lands ? ' ink' : ''); c.setAttribute('aria-hidden', 'true'); c.style.top = a + 'px'; c.style.height = b - a + 'px'; document.body.appendChild(c); };
if (lands) { let y = 0; sp.forEach((q) => { cover(y, q[0]); y = q[1]; }); cover(y, innerHeight); } else sp.forEach((q) => cover(q[0], q[1]));
});
addEventListener('pageshow', () => document.querySelectorAll('.vt-cover').forEach((c) => c.remove()));
const groundsNow = () => {
let y = 0; const st = [];
inkSpans().forEach((q) => { st.push('var(--bg) ' + y + 'px ' + q[0] + 'px', 'rgb(var(--hero-rgb)) ' + q[0] + 'px ' + q[1] + 'px'); y = q[1]; });
st.push('var(--bg) ' + y + 'px 100%');
return 'linear-gradient(' + st.join(', ') + ')';
};
const landing = () => root.style.setProperty('--vt-ground', groundsNow());
addEventListener('pagereveal', (e) => { if (e.viewTransition) landing(); });
try { if (root.matches(':active-view-transition')) landing(); } catch (err) {}
document.addEventListener('click', (e) => {
if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
const a = e.target.closest && e.target.closest('a[href*="#"]');
if (!a || a.classList.contains('skip') || a.target || a.hasAttribute('download') || a.origin !== location.origin || a.pathname !== location.pathname || a.search !== location.search) return;
let t = null; try { t = a.hash.length > 1 && document.getElementById(decodeURIComponent(a.hash.slice(1))); } catch (err) {}
if (!t) return;
e.preventDefault();
const h = t.matches('h1, h2, h3') ? t : t.querySelector('h1, h2, h3') || t;
const land = () => {
if (!h.matches('a[href], button, input, select, textarea, summary, [tabindex]')) { h.setAttribute('tabindex', '-1'); h.classList.add('jt'); h.addEventListener('blur', () => { h.removeAttribute('tabindex'); h.classList.remove('jt'); }, { once: true }); }
h.focus({ preventScroll: true });
};
const go = (behavior) => { steady(); t.scrollIntoView({ behavior, block: 'start' }); };
if (location.hash !== a.hash) history.pushState(history.state, '', a.hash);
const far = Math.abs(t.getBoundingClientRect().top - 64) > 1.5 * innerHeight, drawer = !!(nav && nav.classList.contains('open'));
if (stillPage || !far) { go(stillPage ? 'instant' : 'smooth'); requestAnimationFrame(land); return; }
if (drawer) { nav.classList.add('jump'); go('instant'); setTimeout(() => { nav.classList.remove('jump'); ground(); }, 340); requestAnimationFrame(land); return; }
document.querySelectorAll('.vt-veil').forEach((v) => v.remove());
const v = document.createElement('div');
v.className = 'vt-veil'; v.setAttribute('aria-hidden', 'true'); v.style.background = groundsNow();
document.body.appendChild(v); void v.offsetWidth; v.classList.add('on');
let turned = false;
const turn = () => {
if (turned) return; turned = true;
go('instant'); ground(); v.style.background = groundsNow(); land();
requestAnimationFrame(() => { v.classList.add('off'); setTimeout(() => v.remove(), 400); });
};
v.addEventListener('transitionend', turn, { once: true }); setTimeout(turn, 300);
}, true);
document.querySelectorAll('.btn').forEach((b) => {
if (b.querySelector(':scope > .fx')) return;
const fx = document.createElement('span'); fx.className = 'fx'; fx.setAttribute('aria-hidden', 'true');
let words = '';
b.childNodes.forEach((n) => { if (n.nodeType === 3) words += n.textContent; else if (n.nodeType === 1 && !n.classList.contains('vh')) { if (n.matches('svg')) fx.appendChild(n.cloneNode(true)); else words += n.textContent; } });
fx.dataset.label = words.replace(/\s+/g, ' ').trim();
b.appendChild(fx);
});
const NS = 'http://www.w3.org/2000/svg';
document.querySelectorAll('.notes-list a, .ji a').forEach((a) => {
const s = document.createElementNS(NS, 'svg'), p = document.createElementNS(NS, 'path');
s.setAttribute('class', 'ra'); s.setAttribute('viewBox', '0 0 18 8'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
p.setAttribute('d', 'M0 4H17L13 .5L17 4L13 7.5'); p.setAttribute('pathLength', '1');
s.appendChild(p); a.appendChild(s);
});
document.addEventListener('touchstart', () => {}, { passive: true });
const pressable = 'a[href], button, summary, label, [tabindex]:not([tabindex="-1"])';
let held = null;
const letGo = () => { if (held) { held.classList.remove('press'); held = null; } };
document.addEventListener('pointerdown', (e) => {
letGo();
if (e.pointerType === 'mouse' || !e.isPrimary) return;
const el = e.target.closest && e.target.closest(pressable);
if (el && !el.disabled) { held = el; el.classList.add('press'); }
}, { capture: true, passive: true });
['pointerup', 'pointercancel', 'dragstart'].forEach((t) => document.addEventListener(t, letGo, { capture: true, passive: true }));
addEventListener('pagehide', letGo); addEventListener('pageshow', letGo); addEventListener('blur', letGo);
const rows = document.querySelectorAll('.hoods');
if (rows.length) {
const stop = () => rows.forEach((r) => { if (r.scrollWidth > r.clientWidth + 1) r.tabIndex = 0; else r.removeAttribute('tabindex'); });
let st = 0; stop(); addEventListener('resize', () => { cancelAnimationFrame(st); st = requestAnimationFrame(stop); }); addEventListener('load', stop, { once: true });
}
const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { rootMargin: '0px 0px -10% 0px' });
document.querySelectorAll('[data-draw]').forEach((el) => io.observe(el));
const films = document.querySelectorAll('video.loop');
if (films.length && !stillPage) {
const fo = new IntersectionObserver((es) => es.forEach(({ target: v, isIntersecting: on }) => {
if (on) {
if (!v.dataset.ready) {
v.dataset.ready = '1';
[['webm', 'video/webm'], ['mp4', 'video/mp4']].forEach(([k, type]) => { if (!v.dataset[k]) return; const s = document.createElement('source'); s.src = v.dataset[k]; s.type = type; v.appendChild(s); });
v.addEventListener('playing', () => v.classList.add('on'), { once: true });
v.load();
}
v.play().catch(() => {});
} else v.pause();
}), { rootMargin: '120px 0px' });
films.forEach((v) => { v.muted = true; fo.observe(v); });
}
let opened = [];
addEventListener('beforeprint', () => {
document.querySelectorAll('img[loading="lazy"]').forEach((i) => { i.loading = 'eager'; });
document.querySelectorAll('.tx-rise, [data-draw], .cut, .doorway, main section').forEach((el) => el.classList.add('in'));
opened = [...document.querySelectorAll('.faq details:not([open])')];
opened.forEach((d) => { d.open = true; });
});
addEventListener('afterprint', () => { opened.forEach((d) => { d.open = false; }); opened = []; });
});
