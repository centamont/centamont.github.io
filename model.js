// Centamont tower model: an architectural study of a generic waterfront tower, drawn on canvas.
// It is an illustration, never a real project. The structure rises floor by floor with its core
// leading and the glass following behind. Bronze is a pre-sale stacking plan: a residence turns
// bronze when it sells, and it can sell before the floor it sits on is built.
(function () {
  const FLOORS = 22, SLAB = 0.16, PODIUM = 3, CROWN = 20;
  // Two residences on every level from L03 to L19, one on the bay (east) side and one on the city side.
  // The podium (lobby, amenities) and the crown levels (club and plant) are never for sale.
  const RES0 = PODIUM, RES1 = CROWN, LEVELS = RES1 - RES0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const hash = (a, b, c = 0) => { const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return x - Math.floor(x); };
  const smooth = (t) => t * t * (3 - 2 * t);

  // A rounded rectangle traced counterclockwise in plan, with an outward normal at every point.
  function rrect(hx, hz, r, na, ns) {
    const pts = [], cx = [1, -1, -1, 1], cz = [1, 1, -1, -1];
    for (let q = 0; q < 4; q++) {
      const ox = cx[q] * (hx - r), oz = cz[q] * (hz - r), a0 = q * Math.PI / 2;
      for (let j = 0; j <= na; j++) {
        const a = a0 + (j / na) * Math.PI / 2;
        pts.push({ x: ox + r * Math.cos(a), z: oz + r * Math.sin(a), nx: Math.cos(a), nz: Math.sin(a) });
      }
      // straight side to the next corner, subdivided so balconies can undulate along it
      const a1 = a0 + Math.PI / 2, nq = (q + 1) % 4;
      const sx = ox + r * Math.cos(a1), sz = oz + r * Math.sin(a1);
      const ex = cx[nq] * (hx - r) + r * Math.cos(a1), ez = cz[nq] * (hz - r) + r * Math.sin(a1);
      for (let j = 1; j <= ns; j++) {
        const t = j / (ns + 1);
        pts.push({ x: sx + (ex - sx) * t, z: sz + (ez - sz) * t, nx: Math.cos(a1), nz: Math.sin(a1) });
      }
    }
    return pts;
  }

  // Plan of every floor: glass line, slab edge (with balconies), twist.
  function floorPlan(k) {
    let glass, off;
    if (k < PODIUM) {
      // the lobby's glass comes down to a shallow plinth; the podium levels above carry eyebrow slabs
      glass = rrect(6.2, 4.2, 1.1, 3, 3); off = () => (k === 0 ? 0.08 : 0.22);
    } else if (k < CROWN) {
      const t = (k - PODIUM) / (CROWN - PODIUM), s = 1 - 0.07 * t;
      glass = rrect(3.3 * s, 2.7 * s, 1.35, 3, 3);
      // Balconies swell and recede around the tower, a little further along on every floor.
      off = (p) => 0.22 + 0.4 * (0.5 + 0.5 * Math.sin(2 * Math.atan2(p.z, p.x) + k * 0.4));
    } else {
      // the two penthouse levels step back behind deep terraces, as deep as the balconies below at their fullest
      glass = rrect(2.75, 2.25, 1.15, 3, 2); off = () => 0.55;
    }
    const rot = k < PODIUM ? 0 : 0.34 * (Math.min(k, FLOORS - 1) - PODIUM) / (FLOORS - 1 - PODIUM);
    const c = Math.cos(rot), s = Math.sin(rot);
    const R = (x, z) => [c * x - s * z, s * x + c * z];
    const g = glass.map((p) => { const [x, z] = R(p.x, p.z), [nx, nz] = R(p.nx, p.nz); return { x, z, nx, nz, lx: p.x }; });
    const e = glass.map((p) => { const o = off(p), [x, z] = R(p.x + p.nx * o, p.z + p.nz * o), [nx, nz] = R(p.nx, p.nz); return { x, z, nx, nz }; });
    return { glass: g, slab: e, rot };
  }
  const PLANS = Array.from({ length: FLOORS }, (_, k) => floorPlan(k));
  // The lobby is two storeys of glass: level 1 is a mezzanine set well back inside it, not a slab on the façade.
  const MEZZ = rrect(5.0, 3.0, 0.6, 2, 2);
  // The slab under floor k is as wide as whatever it carries or roofs over.
  const slabPlan = (k) => (k === 1 ? MEZZ : (k === PODIUM || k === CROWN || k === FLOORS ? PLANS[k - 1] : PLANS[k]).slab);
  // The line the façade's outline follows at level k: the mezzanine hides behind the lobby glass.
  const edgePlan = (k) => (k === 1 ? PLANS[1].glass : slabPlan(k));
  // The floor plates turn around a plumb core: lift shafts and stairs run straight, set at the middle of the twist.
  const CORE_ROT = 0.17;
  const CORE = (() => {
    const c = Math.cos(CORE_ROT), s = Math.sin(CORE_ROT);
    return rrect(1.5, 1.15, 0.12, 1, 0).map((p) => ({ x: c * p.x - s * p.z, z: s * p.x + c * p.z, nx: c * p.nx - s * p.nz, nz: s * p.nx + c * p.nz }));
  })();
  // Glass balustrades just inside each terrace edge, the penthouse terraces and the roof terrace included.
  const RAILS = Array.from({ length: FLOORS + 1 }, (_, k) => (k >= PODIUM ? slabPlan(k).map((p) => ({ x: p.x - p.nx * 0.05, z: p.z - p.nz * 0.05, nx: p.nx, nz: p.nz })) : null)), RAIL_H = 0.3;
  // The crown: a louvred screen round the roof plant, set a little behind the top floor's glass line so the roof
  // reads as a cornice under it, with a terrace and its balustrade round the edge.
  const SCREEN = PLANS[FLOORS - 1].glass.map((p) => ({ x: p.x - p.nx * 0.2, z: p.z - p.nz * 0.2, nx: p.nx, nz: p.nz })), SCREEN_H = 1.85;
  // the aviation light stands on a mast at the middle of the roof, tall enough (about 4 m) to show over the screen
  const BEACON = 1.1;
  // Mullions and louvres keep a module measured along the façade line, so the rhythm runs evenly round the corners
  // whatever the facets: per[j] lists where (0 to 1) they fall on facet j. Every plan of a kind gets the same count,
  // so the mullions stand one above another from floor to floor.
  function modules(ring, m) {
    const n = ring.length, s = [0], per = Array.from({ length: n }, () => []);
    for (let j = 0; j < n; j++) { const a = ring[j], b = ring[(j + 1) % n]; s.push(s[j] + Math.hypot(b.x - a.x, b.z - a.z)); }
    for (let i = 0, j = 0; i < m; i++) { const si = ((i + 0.5) * s[n]) / m; while (j < n - 1 && s[j + 1] < si) j++; per[j].push((si - s[j]) / (s[j + 1] - s[j])); }
    return { per, s };
  }
  const perim = (ring) => ring.reduce((a, p, j) => { const q = ring[(j + 1) % ring.length]; return a + Math.hypot(q.x - p.x, q.z - p.z); }, 0);
  // about 1.25 units (some 4.7 m) on the podium, 0.85 (3.2 m) on the residential floors and penthouses
  const MULL = PLANS.map((pl, k) => { const ref = k < PODIUM ? PLANS[0] : k < CROWN ? PLANS[PODIUM] : PLANS[CROWN]; return modules(pl.glass, Math.round(perim(ref.glass) / (k < PODIUM ? 1.25 : 0.85))); });
  // the crown's louvres, finer: about a quarter of a unit apart
  const LOUVRE = modules(SCREEN, Math.round(perim(SCREEN) / 0.24));
  // A hammerhead tower crane on the podium roof beside the tower's east face, tied into the slabs as the frame rises.
  // Its 14-unit jib reaches past the tower's far corner (about 9.5 units from the mast).
  const MAST = [4.4, 3.6], JIB = 14, MAST_W = 0.42;
  // The jib slews as the floors go up and comes to rest across the tower, west-south-west, as the frame tops off.
  const craneAt = (L) => ({ top: Math.max(7, L + 3.2), ang: -2.75 + 0.45 * Math.sin((L - FLOORS) * 0.38) });
  // [x, z, height, lean, lean direction]
  const PALMS = [[-8.3, -6.1, 3.9, 0.5, 3.6], [-6.3, -7.1, 4.2, 0.45, 4.4], [5.0, -7.3, 3.6, 0.4, 5.2], [-8.6, 5.6, 3.5, 0.4, 2.4], [8.4, 5.8, 3.7, 0.5, 0.4], [-0.6, 6.7, 3.3, 0.35, 1.4], [9.0, 0.6, 3.1, 0.3, 0.1]];
  // People at the entrance, for scale (a level is about 3.8 m): [x, z, height]. Two stand under the porte-cochère.
  const FIGS = [[-1.3, -5.5, 0.47], [-0.95, -5.6, 0.44], [1.5, -5.15, 0.46], [2.5, -7.2, 0.46], [-5.4, -7.25, 0.45], [6.1, -6.8, 0.47]];
  // A porte-cochère on the entrance side of the podium, its soffit high enough for a coach (about 5.9 m)
  const PORTE = 1.55;
  const CANOPY = rrect(2.6, 0.85, 0.4, 2, 2).map((p) => ({ x: p.x, z: p.z - 5.25, nx: p.nx, nz: p.nz }));
  // Lamp light after dark: the brand ivory warmed a touch. It is pale and high in value, a third as saturated as
  // the bronze of a sold residence and far lighter, so a lit room never reads as sold.
  const LAMP = [247, 232, 204];
  // Which residence each glass panel belongs to: 0 on the bay side of the level, 1 on the city side.
  // The split runs through the middle of the north and south faces (points 5 and 19 of a tower plan).
  const SIDE = PLANS.map((pl) => Int8Array.from(pl.glass, (p, j) => (p.lx + pl.glass[(j + 1) % pl.glass.length].lx > 0 ? 0 : 1)));
  const SPLIT = [5, 19];
  // The order the residences sell in, as a Miami launch sells: the upper floors and the bay side first,
  // the city side about four floors behind, with a little of the scatter a real stacking plan shows.
  const RANK = (() => {
    const u = [];
    for (let k = RES0; k < RES1; k++) for (let s = 0; s < 2; s++) u.push({ k, s, v: RES1 - 1 - k + (s ? 4.5 : 0) + (hash(k, s, 7) - 0.5) * 2.2 });
    u.sort((a, b) => a.v - b.v);
    const r = new Float32Array(FLOORS * 2).fill(1e9);
    u.forEach((q, i) => { r[q.k * 2 + q.s] = i; });
    return r;
  })();

  // Sunlight is the real sun over Miami at this minute (a compact form of the NOAA solar position);
  // the tower's north is +z, east is +x. After dark the tower is lit from within.
  const LAT = 25.7617, LON = -80.1918, RAD = Math.PI / 180;
  function solar(date) {
    const d = date.getTime() / 864e5 - 10957.5; // days since J2000.0
    const g = (357.529 + 0.98560028 * d) * RAD, q = 280.459 + 0.98564736 * d;
    const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD, e = (23.439 - 3.6e-7 * d) * RAD;
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L)), dec = Math.asin(Math.sin(e) * Math.sin(L));
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    const ha = (gmst * 15 + LON) * RAD - ra, lat = LAT * RAD;
    const el = Math.asin(Math.sin(lat) * Math.sin(dec) + Math.cos(lat) * Math.cos(dec) * Math.cos(ha));
    let az = Math.atan2(-Math.sin(ha), Math.tan(dec) * Math.cos(lat) - Math.sin(lat) * Math.cos(ha));
    if (az < 0) az += 2 * Math.PI;
    return { el: el / RAD, az: az / RAD };
  }
  // The sun's true direction, below the horizon too, and how far into the night it is: 0 with the sun 6° up,
  // 1 at the end of civil twilight (6° below), easing through dusk and dawn rather than switching.
  function miamiSun(date = new Date()) {
    const { el, az } = solar(date), E = el * RAD, A = az * RAD;
    return { v: [Math.cos(E) * Math.sin(A), Math.sin(E), Math.cos(E) * Math.cos(A)], night: smooth(clamp((6 - el) / 12, 0, 1)), el, az };
  }
  window.CentamontSun = miamiSun;
  // The ivory sheet is a drawing, not a time of day: with the sun down it keeps the draughtsman's conventional
  // light from the south-west, high over the left shoulder. The ink drawings go dark instead.
  const DRAFT = { v: [-0.55, 0.62, -0.5], night: 0, el: 40, az: 228 };

  function rgb(hex) {
    const m = String(hex).trim().match(/^rgba?\(([^)]+)\)/);
    if (m) return m[1].split(',').slice(0, 3).map(Number);
    const h = String(hex).trim().replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const hasRO = typeof ResizeObserver === 'function', hasIO = typeof IntersectionObserver === 'function';
  const IDLE = 1000 / 12; // ms between drawings of a settled orbit
  let GEN = 0; // camera generations, shared by every model: the plan rings are shared too

  function hull(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // The convex hull of a plan, as indices round it. A perspective view keeps a plan's hull its hull, so the outline of
  // a band of floor is found from these points alone each drawing, with no sorting.
  const HULLS = new WeakMap();
  function planHull(pl) {
    let h = HULLS.get(pl);
    if (!h) { h = Int16Array.from(hull(pl.map((p, i) => [p.x, p.z, i])), (q) => q[2]); HULLS.set(pl, h); }
    return h;
  }
  // The top (or bottom) chain of a convex ring on screen (y down), left to right: r is the projected plan, hx its hull.
  function chain(r, hx, top) {
    const m = hx.length;
    let iL = 0, iR = 0, a = 0;
    for (let e = 0; e < m; e++) {
      const p = r[hx[e]], q = r[hx[e + 1 < m ? e + 1 : 0]], l = r[hx[iL]], rr = r[hx[iR]];
      a += p[0] * q[1] - q[0] * p[1];
      if (p[0] < l[0] || (p[0] === l[0] && (top ? p[1] < l[1] : p[1] > l[1]))) iL = e;
      if (p[0] > rr[0] || (p[0] === rr[0] && (top ? p[1] < rr[1] : p[1] > rr[1]))) iR = e;
    }
    // with y down, a positive area means the ring runs along its top going forward from its leftmost point
    const fwd = (a > 0) === top, out = [];
    for (let e = iL; ; e = fwd ? (e + 1 < m ? e + 1 : 0) : (e > 0 ? e - 1 : m - 1)) { out.push(r[hx[e]]); if (e === iR) break; }
    return out;
  }

  class Model {
    constructor(canvas, opts) {
      this.c = canvas;
      this.o = Object.assign({ orbit: 0, theta: -0.62, phi: 0.2, dist: 52, ty: 11.5, scale: 1.05, offsetX: 0, crane: true, grid: true, labels: false, labelSize: 12, envelope: true, rate: 9, slow: 3, soldRate: 6, presale: 0.5, rest: 45000 }, opts);
      this.theta = this.o.theta;
      this.phi = this.o.phi;
      this.L = 0; this.S = 0; this.C = 0; this.G = 0; // shown: levels framed, levels sold (in levels' worth of residences), levels glazed, crown
      this.B = 0; this.Sold = 0; // targets
      this.crane = 0; this.craneT = 0;
      this.E = this.o.envelope ? 1 : 0; // the dashed envelope, drawn in from the ground up
      this.camT = null; this.camV = [0, 0, 0, 0, 0]; // camera spring: target and velocity of theta, phi, ty, scale, offsetX
      this.mx = 0; this.my = 0;
      this.visible = true;
      this.woke = performance.now();
      this._pj = new WeakMap(); this.gen = 0;
      // Without a 2D context (an old engine, a blocked or exhausted GPU) the model stands down quietly: every call
      // becomes a no-op and the page around it carries on.
      try { this.ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null; } catch (e) { this.ctx = null; }
      if (!this.ctx) { this.dead = true; this.w = this.h = 0; return; }
      this.sunNow = miamiSun();
      // the sun moves on every five minutes; that redraws once and never wakes a resting orbit
      setInterval(() => { this.sunNow = miamiSun(); this.dirty = true; this.kick(); }, 300000);
      this.colors();
      this.size();
      // Resized, turned or zoomed: refit and redraw in the same frame, so the canvas never shows a blank frame.
      const resized = () => { this.size(); if (this.o.onResize) this.o.onResize(this); this.now(); };
      if (hasRO) new ResizeObserver(resized).observe(canvas);
      else addEventListener('resize', resized);
      // Off screen nothing is drawn; on its way back the drawing is brought up to date before it shows.
      if (hasIO) new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; if (this.visible) { if (this.dirty) this.now(); this.wake(); } }, { rootMargin: '64px 0px' }).observe(canvas);
      // a hidden tab draws nothing; coming back, the clock starts afresh
      document.addEventListener('visibilitychange', () => { if (!document.hidden) { this.t0 = 0; this.kick(); } });
    }

    // Redraw at once, in this frame, if there is anything to draw on.
    now() { if (this.dead) return; if (this.w && this.visible) { this.draw(); this.dirty = false; } else this.dirty = true; this.kick(); }

    // Someone is here: the orbit (if it rested) turns again.
    wake() { this.woke = performance.now(); this.kick(); }

    colors() {
      if (this.dead) return;
      this._cc = null;
      const cs = getComputedStyle(this.c);
      this.line = rgb(cs.getPropertyValue('--line') || '#14161A');
      this.sold = rgb(cs.getPropertyValue('--sold') || '#B8976A');
      let bg = null;
      for (let el = this.c; el && !bg; el = el.parentElement) {
        const b = getComputedStyle(el).backgroundColor, v = rgb(b);
        if (b && !/rgba\([^)]*,\s*0\)$/.test(b) && b !== 'transparent') bg = v;
      }
      this.bg = bg || [244, 240, 232];
      // Windows high contrast: draw in the system's text colour on its background, whatever the theme says
      this.warm = LAMP;
      this.forced = matchMedia('(forced-colors: active)').matches;
      if (this.forced) { const t = rgb(cs.color); this.line = t; this.sold = t; this.warm = t; }
      this.dark = lum(this.line) > lum(this.bg);
      // a theme switch repaints in the same frame as the page around it
      this.now();
    }

    size() {
      if (this.dead) return;
      const r = this.c.getBoundingClientRect();
      // phones get 1.5x: sharp enough for hairlines at half the fill cost of 2x or more (the same 820px line as the stylesheet)
      const d = Math.min(devicePixelRatio || 1, matchMedia('(max-width:820px)').matches ? 1.5 : 2);
      this.w = r.width; this.h = r.height;
      this.c.width = Math.max(1, Math.round(r.width * d));
      this.c.height = Math.max(1, Math.round(r.height * d));
      this.ctx.setTransform(d, 0, 0, d, 0, 0); this.dpr = d;
    }

    // Glass trails the frame by three floors until the building tops off.
    cladFor(L) { return L >= FLOORS - 0.001 ? FLOORS : Math.max(0, L - 3); }

    // How much of residence s (0 bay side, 1 city side) on level k is sold, 0 to 1. S counts levels' worth.
    soldOf(k, s, S = this.S) { return clamp(S * 2 - RANK[k * 2 + s], 0, 1); }

    set(built, sold, crane, instant) {
      if (this.dead) return;
      if (built && !this.B && !this.drawnAt) this.drawnAt = performance.now();
      this.B = built; this.Sold = sold; this.craneT = crane ? 1 : 0;
      this.c.dataset.built = built; this.c.dataset.sold = sold;
      if (instant || reduce) this.snap();
      this.wake();
    }

    // Everything straight to where it is going.
    snap() { this.L = this.B; this.S = this.Sold; this.C = this.cladFor(this.B); this.crane = this.craneT; this.G = this.B >= FLOORS ? 1 : 0; this.E = this.o.envelope ? 1 : 0; this.touch(); }

    // Start the draughtsman's construction lines ahead of the ink.
    sketch() { this.drawnAt = performance.now(); this.touch(); }

    // The camera moves on a critically damped spring: it can be sent somewhere new mid-move and keeps its velocity.
    // v: { theta, phi, ty, scale, offsetX }
    camTo(v, instant) {
      const T = [v.theta, v.phi, v.ty, v.scale, v.offsetX];
      if (instant || reduce) { [this.theta, this.phi, this.o.ty, this.o.scale, this.o.offsetX] = T; this.camT = null; this.camV = [0, 0, 0, 0, 0]; }
      else this.camT = T;
      this.touch();
    }

    pointer(x, y) { this.mx = x; this.my = y; this.wake(); }

    // Force a full redraw on the next frame (camera moves, scroll, the loupe); it also wakes a resting orbit.
    touch() { this.dirty = true; this.wake(); }

    // Ask for a frame. An idle orbit sleeps on a timer between its frames; any request cuts the sleep short.
    kick() {
      if (this.nap) { clearTimeout(this.nap); this.nap = 0; }
      if (this.raf || !this.w || this.visible === false) return;
      this.raf = requestAnimationFrame(() => { this.raf = 0; this.frame(); });
    }

    frame() {
      // Everything runs on the clock, not the frame count, so a slow phone builds as fast as a desktop.
      // After a pause the clock starts afresh: the first frame of a move is one frame long, never a jump.
      // (A frame after the idle orbit's sleep keeps its full step, so the orbit's pace never depends on the cadence.)
      const t = performance.now(), dt = this.t0 ? Math.min(this.slept ? 140 : 50, t - this.t0) : 16.7, s = dt / 1000;
      this.t0 = t; this.slept = false;
      const ease = (a, b, tau) => (Math.abs(b - a) < 0.002 ? b : a + (b - a) * (1 - Math.exp(-dt / tau)));
      const toward = (v, to, up, down) => (v === to ? to : to > v ? Math.min(to, v + s * up) : Math.max(to, v - s * down));
      const envT = this.o.envelope ? 1 : 0;
      // Sales lead construction: ground breaks (frame and crane) only once the pre-sale threshold is sold, and going
      // back the frame and the crane come down before the sales fall under it. Holds however fast the targets change.
      const lim = LEVELS * this.o.presale, open = this.L > 0.001 || this.S >= lim - 0.001, site = this.L > 0.001 || this.crane > 0.001;
      const bT = open ? this.B : 0, cT = open ? this.craneT : 0, sT = site && this.Sold < lim ? Math.max(this.Sold, Math.min(this.S, lim)) : this.Sold;
      if (reduce) { if (this.L !== this.B || this.S !== this.Sold || this.E !== envT || this.crane !== this.craneT) this.snap(); }
      else {
        // The frame rises at a steady pace, a floor at a time, slowing over its last floors; it comes down faster.
        const r = this.o.rate;
        if (bT > this.L) this.L = Math.min(bT, this.L + s * r * (0.3 + 0.7 * Math.min(1, (bT - this.L) / this.o.slow)) + 0.0005);
        else if (bT < this.L) this.L = Math.max(bT, this.L - s * r * 1.6);
        // the glass follows three floors behind at the same pace, and never overtakes the frame
        this.C = Math.min(toward(this.C, this.cladFor(this.L), r, r * 1.6), this.L);
        // residences sell one after another at a steady cadence, so the count can be read as it happens
        this.S = toward(this.S, sT, this.o.soldRate, this.o.soldRate * 1.6);
        this.crane = toward(this.crane, cT, 2.8, 2.8);
        this.E = toward(this.E, envT, 1 / 0.7, 1 / 0.3);
      }
      // the crown goes up as soon as the frame tops off, in under half a second
      const crownT = this.L >= FLOORS - 0.01 ? 1 : 0;
      this.G = reduce ? crownT : toward(this.G, crownT, 1 / 0.45, 1 / 0.25);
      if (this.camT) {
        // exact step of a critically damped spring for each axis (omega 4.2/s: 95% there in about a second)
        const w = this.o.camW || 4.2, e = Math.exp(-w * s), cur = [this.theta, this.phi, this.o.ty, this.o.scale, this.o.offsetX], eps = [2e-4, 2e-4, 2e-3, 2e-4, 2e-4];
        let still = true;
        for (let i = 0; i < 5; i++) {
          const x = cur[i] - this.camT[i], v = this.camV[i], nx = (x + (v + w * x) * s) * e, nv = (v - w * (v + w * x) * s) * e;
          cur[i] = this.camT[i] + nx; this.camV[i] = nv;
          if (Math.abs(nx) > eps[i] || Math.abs(nv) > eps[i]) still = false;
        }
        if (still) { cur.splice(0, 5, ...this.camT); this.camT = null; this.camV = [0, 0, 0, 0, 0]; }
        [this.theta, this.phi, this.o.ty, this.o.scale, this.o.offsetX] = cur; this.dirty = true;
      }
      // The orbit turns briskly while the tower builds, then settles to about a degree a second beside the reading.
      // When nobody has moved, scrolled or changed anything for a while (45 s) it slows to rest, and the drawing
      // stands still until someone does.
      if (!reduce && this.o.orbit) {
        // (an empty lot, with nothing to build, rests the same way)
        const rest = (this.G > 0.98 || (!this.B && !this.Sold && !this.drawnAt)) && t - this.woke > this.o.rest;
        const want = rest ? 0 : this.G > 0.98 && this.o.orbitIdle != null ? this.o.orbitIdle : this.o.orbit;
        this.orb = this.orb == null ? want : this.orb + (want - this.orb) * (1 - Math.exp(-dt / 1500));
        if (rest && this.orb < 1e-5) this.orb = 0;
        this.theta += this.orb * dt / 16.7;
      }
      this.tx = ease(this.tx || 0, this.mx * 0.12, 330);
      this.tyy = ease(this.tyy || 0, this.my * 0.05, 330);
      const settled = (reduce ? this.L === this.B && this.S === this.Sold && this.crane === this.craneT : this.L === bT && this.S === sT && this.crane === cT) && this.C === this.cladFor(this.L) && this.G === crownT && this.E === envT && !this.camT && Math.abs(this.tx - this.mx * 0.12) <= 0.001 && Math.abs(this.tyy - this.my * 0.05) <= 0.001;
      const orbiting = !reduce && !!this.o.orbit && this.orb !== 0;
      // Anything that moves draws every frame (and the frame after it stops). A settled tower on its slow orbit
      // turns about a tenth of a pixel between frames, so it is drawn twelve times a second whatever the display's
      // refresh rate, and sleeps on a timer in between instead of waking at every refresh.
      const idle = settled && orbiting && !this.dirty && !this.moved;
      if (!idle || t - (this.drawnLast || 0) >= IDLE - 12) { if (this.dirty || this.moved || !settled || orbiting) { this.draw(); this.drawnLast = t; } }
      this.dirty = false; this.moved = !settled;
      if (this.o.onFrame) this.o.onFrame(this);
      if (!(this.moved || orbiting) || !this.visible || document.hidden) { this.t0 = 0; return; }
      if (idle || settled) {
        // wake one refresh before the next drawing is due (half a 60 Hz refresh on average)
        const wait = Math.max(0, IDLE - (performance.now() - (this.drawnLast || 0)) - 8);
        this.nap = setTimeout(() => { this.nap = 0; this.slept = true; this.kick(); }, wait);
      } else this.kick();
    }

    // The camera: a shift lens, as architectural photographers use. It stays level so verticals stay vertical,
    // and the frame slides to put the target height ty at the centre of the canvas.
    camAt(th, ph, ty, scale, ox) {
      const d = this.o.dist, ey = Math.max(0.8, ty - d * Math.sin(ph)), f = Math.min(this.w * 1.15, this.h) * scale;
      return { c: Math.cos(th), s: Math.sin(th), f, d, ey, cx: this.w / 2 + ox * this.w, cy: this.h / 2 + (f * (ty - ey)) / d };
    }

    camera() {
      const k = this.k = this.camAt(this.theta + (this.tx || 0), this.phi + (this.tyy || 0), this.o.ty, this.o.scale, this.o.offsetX);
      // camera position in world space, for shading and draw order
      this.eye = [-k.d * k.s, k.ey, -k.d * k.c];
      // how many CSS px one unit (a level's height, about 3.8 m) spans at the tower's axis: the drawing's level of detail
      this.u = k.f / k.d;
      this.gen = ++GEN;
    }

    // A plan ring at height y on screen. Each ring is projected once per camera: the slab band, its cap, the glass,
    // the outline, the ruler and the loupe all reuse the same points.
    ring(pl, y) {
      let e = this._pj.get(pl);
      if (!e || e.g !== this.gen) this._pj.set(pl, (e = { g: this.gen, m: new Map() }));
      let r = e.m.get(y);
      if (!r) { r = new Array(pl.length); for (let i = 0; i < pl.length; i++) r[i] = this.P(pl[i].x, y, pl[i].z); e.m.set(y, r); }
      return r;
    }

    // world -> screen
    P(x, y, z) {
      const k = this.k;
      const X = k.c * x - k.s * z, Z = k.s * x + k.c * z + k.d, Y = y - k.ey;
      return [k.cx + (k.f * X) / Z, k.cy - (k.f * Y) / Z, Z];
    }

    // How far the near façade stands in front of the tower's axis, seen from this angle: the level ruler stands
    // on that plane, so every tick meets the slab edge it names.
    nearFace(c, s) {
      let n = 0;
      for (let k = RES0; k < RES1; k++) { let m = 1e9; for (const p of PLANS[k].slab) m = Math.min(m, s * p.x + c * p.z); n += m; }
      return -n / LEVELS;
    }

    // A view of the tower that keeps everything that matters inside the canvas with a margin: the tower
    // to the top of its crown and beacon, the crane at the height it will stand, and the level ruler with
    // its labels. Returns the ty, scale and offsetX that frame it from (theta, phi), for camTo().
    // spec: { built, crane, plan, margin: [top, right, bottom, left] in px, ty, scale, offsetX (starting values),
    //        vOnly (fit the height only and keep offsetX), maxScale, measure (return the box in px at the starting values) }
    fit(theta, phi, spec = {}) {
      const m = spec.margin || [24, 16, 16, 16], w = this.w, h = this.h;
      let ty = spec.ty != null ? spec.ty : this.o.ty, sc = spec.scale != null ? spec.scale : this.o.scale, ox = spec.offsetX != null ? spec.offsetX : this.o.offsetX;
      if (!w || !h) return { theta, phi, ty, scale: sc, offsetX: ox };
      const pts = [], pads = []; // world points, and points carrying a screen-space pad [x, y, z, padL, padR, padUp]
      // the plan: the site line and the canopies of the trees on it
      if (spec.plan) {
        for (const [x, z] of [[-9.5, -7.5], [9.5, -7.5], [9.5, 7.5], [-9.5, 7.5]]) pts.push([x, 0, z]);
        for (const [x, z, hh] of PALMS) { const r = 0.55 + hh * 0.18; pts.push([x - r, 0, z], [x + r, 0, z], [x, 0, z - r], [x, 0, z + r]); }
      }
      else {
        for (const k of [0, 2, 3, 6, 10, 14, 18, 20, 21, 22]) for (const p of slabPlan(k)) pts.push([p.x, k, p.z], [p.x, k + SLAB, p.z]);
        for (const p of SCREEN) pts.push([p.x, FLOORS + SLAB + SCREEN_H, p.z]);
        pads.push([0, FLOORS + SLAB + SCREEN_H + BEACON, 0, 8, 8, 8]); // the beacon's glow
        if (spec.crane) {
          const [mx, mz] = MAST, { top, ang } = craneAt(spec.built || 0), ca = Math.cos(ang), sa = Math.sin(ang);
          const J = (d, y, ww = 0) => [mx + ca * d - sa * ww, y, mz + sa * d + ca * ww];
          pts.push([mx, 0, mz], J(0, top + 3, 0), J(JIB, top, -0.3), J(JIB, top, 0.3), J(-4.6, top, -0.3), J(-4.6, top, 0.3), J(-3.9, top - 0.7, 0));
        }
      }
      const c = Math.cos(theta), s = Math.sin(theta), sd = this.o.dimSide === 1 ? -1 : 1;
      if (!spec.plan) {
        // the ruler and its labels
        const nr = this.nearFace(c, s), at = (X) => [c * X * sd - s * nr, -s * X * sd - c * nr];
        const [ax, az] = at(-10), [lx, lz] = at(-11.9), tw = this.o.labels ? this.o.labelSize * 3 : 0;
        pts.push([ax, 0, az], [ax, FLOORS + SLAB, az]);
        for (const y of [SLAB, FLOORS + SLAB]) pads.push([lx, y, lz, sd > 0 ? tw : 0, sd > 0 ? 0 : tw, this.o.labelSize * 0.6]);
      }
      const box = () => {
        const K = this.camAt(theta, phi, ty, sc, ox);
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        const pr = (x, y, z) => { const X = K.c * x - K.s * z, Z = K.s * x + K.c * z + K.d; return [K.cx + (K.f * X) / Z, K.cy - (K.f * (y - K.ey)) / Z]; };
        for (const [x, y, z] of pts) { const [u, v] = pr(x, y, z); x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v); }
        for (const [x, y, z, pl, pr2, pu] of pads) { const [u, v] = pr(x, y, z); x0 = Math.min(x0, u - pl); x1 = Math.max(x1, u + pr2); y0 = Math.min(y0, v - pu); y1 = Math.max(y1, v + pu); }
        return { x0, x1, y0, y1, f: K.f };
      };
      // measure only: where that framing puts it all, in px
      if (spec.measure) return box();
      const aw = w - m[1] - m[3], ah = h - m[0] - m[2];
      for (let i = 0; i < 6; i++) {
        let b = box();
        sc *= Math.min(spec.vOnly ? 9 : aw / (b.x1 - b.x0), ah / (b.y1 - b.y0), spec.maxScale ? spec.maxScale / sc : 9);
        b = box();
        if (!spec.vOnly) ox += (m[3] + aw / 2 - (b.x0 + b.x1) / 2) / w;
        ty += ((m[0] + ah / 2 - (b.y0 + b.y1) / 2) * this.o.dist) / b.f;
      }
      return { theta, phi, ty, scale: sc, offsetX: ox };
    }

    draw() {
      if (this.dead || !this.w) return;
      this.scene();
      const L = this.lens;
      if (!L || this.L < 1) return;
      // The loupe: a magnified look through the glass at the structure inside, as the drawing set has it
      const g = this.ctx, [br, bgg, bb] = this.bg, [sr, sg, sb] = this.sold, C0 = this.C, mag = 1.7;
      g.save(); g.beginPath(); g.arc(L.x, L.y, L.r, 0, TAU); g.clip();
      g.fillStyle = `rgb(${br},${bgg},${bb})`; g.fillRect(L.x - L.r, L.y - L.r, L.r * 2, L.r * 2);
      g.translate(L.x, L.y); g.scale(mag, mag); g.translate(-L.x, -L.y);
      this.C = 0; this.xray = true; this.scene(true); this.C = C0; this.xray = false;
      g.restore();
      // the bezel: a hairline bronze ring with a fine graduation
      g.strokeStyle = `rgba(${sr},${sg},${sb},0.9)`; g.lineWidth = 1.2; g.beginPath(); g.arc(L.x, L.y, L.r, 0, TAU); g.stroke();
      g.lineWidth = 0.8; g.beginPath();
      for (let i = 0; i < 60; i++) { const a = i * TAU / 60, t = i % 5 ? 4 : 8; g.moveTo(L.x + Math.cos(a) * (L.r + 2), L.y + Math.sin(a) * (L.r + 2)); g.lineTo(L.x + Math.cos(a) * (L.r + 2 + t), L.y + Math.sin(a) * (L.r + 2 + t)); }
      g.stroke();
      // the label sits clear of the drawing, with a halo of the ground colour
      const ly = L.y > this.h * 0.6 ? L.y - L.r - 26 : L.y + L.r + 16;
      g.font = '500 13px Jost, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
      g.lineWidth = 4; g.strokeStyle = `rgb(${br},${bgg},${bb})`; g.lineJoin = 'round'; g.strokeText('STRUCTURE  ×1.7', L.x, ly); g.lineJoin = 'miter';
      g.fillStyle = `rgba(${sr},${sg},${sb},0.95)`; g.fillText('STRUCTURE  ×1.7', L.x, ly);
    }

    scene(inLens) {
      if (!inLens) this.camera();
      const g = this.ctx, w = this.w, h = this.h, dark = this.dark;
      if (!inLens) g.clearRect(0, 0, w, h);
      const [lr, lg, lb] = this.line, [sr, sg, sb] = this.sold, [br, bgg, bb] = this.bg, [wr, wg, wb] = this.warm;
      const ink = (a) => `rgba(${lr},${lg},${lb},${a})`;
      const bronze = (a, k = 1) => `rgba(${Math.round(sr * k)},${Math.round(sg * k)},${Math.round(sb * k)},${a})`;
      const Q = 96, cache = this._cc || (this._cc = new Map());
      const memo = (key, fn) => { let v = cache.get(key); if (!v) { v = fn(); cache.set(key, v); } return v; };
      const mix = (t) => { const q = Math.round(clamp(t, 0, 1) * Q); return memo(q, () => { t = q / Q; return `rgb(${Math.round(br + (lr - br) * t)},${Math.round(bgg + (lg - bgg) * t)},${Math.round(bb + (lb - bb) * t)})`; }); };
      const mixS = (t0, l0) => { const q = Math.round(clamp(t0, 0, 1) * Q), ql = Math.round(clamp(l0, 0, 1) * 32); return memo(1000 + q * 40 + ql, () => { const t = q / Q, lift = ql / 32; const r = br + (sr - br) * t, gg = bgg + (sg - bgg) * t, b = bb + (sb - bb) * t; return `rgb(${Math.round(r + (255 - r) * lift)},${Math.round(gg + (255 - gg) * lift)},${Math.round(b + (255 - b) * lift)})`; }); };
      // a lit room: the ground toward the lamp light, never toward the bronze
      const mixL = (t0) => { const q = Math.round(clamp(t0, 0, 1) * Q); return memo(9000 + q, () => { const t = q / Q; return `rgb(${Math.round(br + (wr - br) * t)},${Math.round(bgg + (wg - bgg) * t)},${Math.round(bb + (wb - bb) * t)})`; }); };
      const seg = (a, b) => { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); };
      let batch = null;
      const queue = (q, col) => { let a = batch.get(col); if (!a) batch.set(col, (a = [])); a.push(q); };
      const flush = () => { for (const [col, qs] of batch) { g.beginPath(); for (const q of qs) { g.moveTo(q[0][0], q[0][1]); for (let j = 1; j < q.length; j++) g.lineTo(q[j][0], q[j][1]); g.closePath(); } g.fillStyle = col; g.fill(); } batch.clear(); };
      batch = new Map();
      const poly = (ps) => { g.beginPath(); ps.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
      const cap = (pl, y) => this.ring(pl, y);
      const eye = this.eye, L = this.L, C = this.C;
      // Level of detail: below about 12 px a level (a phone), the mullions, balustrades and louvres would be finer than
      // the pixels that draw them, so they fade out by 12 px and the drawing keeps its outline, slabs and bronze.
      const fine = clamp((this.u - 12) / 4, 0, 1), railsOn = this.o.rails !== false && fine > 0;
      const hair = Math.max(0.5, 1 / (this.dpr || 1));
      // The light. On ink it is the real sun over Miami, fading out through dusk until, after dark, no sun reaches
      // the building at all; on the ivory sheet it is the sun while it is up and the draughtsman's light while it is down.
      const real = this.o.sun ? { v: this.o.sun, night: 0, el: 45 } : this.sunNow, study = !this.o.sun && real.el > 0;
      const lit = dark || real.el > 0 ? real : DRAFT, sun = lit.v, sunH = Math.hypot(sun[0], sun[2]) || 1;
      const night = dark ? lit.night : 0, kd = 1 - night; // kd: how much direct sun the building gets
      const dif = (nx, nz) => Math.max(0, (nx * sun[0] + nz * sun[2]) / sunH) * kd;
      const now = performance.now();
      // lamp glows after dark, gathered while the rooms are drawn and laid over everything once the tower stands
      const glows = dark && !inLens && !this.forced && night > 0.05 ? [] : null;
      // a vertical band of quads between two rings at heights y0, y1
      const band = (pl, y0, y1, shade, strokeTop) => {
        const n = pl.length, bot = this.ring(pl, y0), top = this.ring(pl, y1);
        const lines = [], vis = new Uint8Array(n);
        for (let j = 0; j < n; j++) {
          const j2 = (j + 1) % n, q = [bot[j], bot[j2], top[j2], top[j]];
          const area = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
          if (area >= 0) continue;
          const a = pl[j], b = pl[j2], nx = (a.nx + b.nx) / 2, nz = (a.nz + b.nz) / 2;
          queue(q, shade(nx, nz, j, n, (a.x + b.x) / 2, (a.z + b.z) / 2));
          vis[j] = 1;
          if (strokeTop) lines.push(j);
        }
        flush();
        return { bot, top, lines, vis };
      };
      // A residence sold before its glass is in: a faint bronze volume with its edges drawn, standing in the sketch
      // (or inside the open frame). Unbuilt ones drop the last few feet into place as they sell.
      const ghost = (k, y0, y1, from, drop) => {
        const fs = [this.soldOf(k, 0), this.soldOf(k, 1)];
        if (fs[0] <= 0 && fs[1] <= 0) return;
        // Before its slab is poured, a sold residence fills its whole storey, so the sold floors stand as one block: a
        // floor line where it sits on another sold home, its outline firm where it meets the sketch.
        if (drop) y0 = k;
        const pl = PLANS[k].glass, sd = SIDE[k], n = pl.length, fa = dark ? 0.17 : 0.19, edges = [];
        const below = [this.soldOf(k - 1, 0) > 0.5, this.soldOf(k - 1, 1) > 0.5], above = [this.soldOf(k + 1, 0) > 0.5, this.soldOf(k + 1, 1) > 0.5];
        const ring = [0, 1].map((side) => { const f = fs[side], dy = drop ? (1 - smooth(f)) * 0.35 : 0; return f > 0 ? [this.ring(pl, y0 + dy), this.ring(pl, y1 + dy)] : null; });
        for (let j = from; j < n; j++) {
          const side = sd[j], f = fs[side]; if (f <= 0) continue;
          const [bot, top] = ring[side], j2 = (j + 1) % n, q = [bot[j], bot[j2], top[j2], top[j]];
          const area = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
          if (area >= 0) continue;
          const fq = Math.round(f * 10) / 10, low = drop && below[side] && f >= 1;
          queue(q, bronze(fa * fq));
          edges.push([fq * (low ? 0.45 : 1), bot[j], bot[j2]]);
          if (!drop || !above[side] || f < 1) edges.push([fq, top[j], top[j2]]);
          // the party wall between the two residences, and the open end of a residence on a part-glazed level
          if (sd[(j + n - 1) % n] !== side || (j === from && from > 0)) edges.push([fq * 0.8, bot[j], top[j]]);
          if (sd[j2] !== side) edges.push([fq * 0.8, bot[j2], top[j2]]);
        }
        flush();
        g.lineWidth = 0.8;
        const as = new Set(edges.map((e) => (e[0] = Math.round(e[0] * 20) / 20)));
        for (const a of as) { g.beginPath(); g.strokeStyle = bronze((dark ? 0.85 : 0.8) * a); for (const e of edges) if (e[0] === a) seg(e[1], e[2]); g.stroke(); }
      };

      // Ground: survey grid, site line, and the tower's shadow
      if (this.o.grid) {
        // seen from above, as a plan, the ground drawing carries the picture, so it is drawn darker
        const bo = 1 + clamp(-(this.phi + (this.tyy || 0)) * 1.6, 0, 1);
        g.lineWidth = 1;
        for (let i = 0; i <= 30; i += 3) {
          g.strokeStyle = ink(0.07 * bo * (1 - i / 34)); g.beginPath();
          for (const v of i ? [i, -i] : [0]) { seg(this.P(v, 0, -30), this.P(v, 0, 30)); seg(this.P(-30, 0, v), this.P(30, 0, v)); }
          g.stroke();
        }
        if (this.o.site !== false) {
          // the street in front of the entrance, with kerbs and a centre line
          g.strokeStyle = ink((dark ? 0.24 : 0.2) * bo); g.lineWidth = 0.8; g.beginPath();
          for (const z of [-10.2, -14.2]) seg(this.P(-28, 0, z), this.P(28, 0, z));
          g.stroke(); g.setLineDash([6, 7]); g.strokeStyle = ink(dark ? 0.16 : 0.13); g.beginPath(); seg(this.P(-28, 0, -12.2), this.P(28, 0, -12.2)); g.stroke(); g.setLineDash([]);
          // trees drawn the way a site plan draws them: a canopy circle and its trunk
          g.strokeStyle = ink((dark ? 0.3 : 0.26) * bo); g.lineWidth = 0.7; g.beginPath();
          for (const [x, z, hh] of PALMS) {
            const r = 0.55 + hh * 0.18;
            for (let i = 0; i <= 24; i++) { const a = TAU * i / 24, q = this.P(x + Math.cos(a) * r, 0, z + Math.sin(a) * r); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }
            seg(this.P(x - 0.18, 0, z), this.P(x + 0.18, 0, z)); seg(this.P(x, 0, z - 0.18), this.P(x, 0, z + 0.18));
          }
          g.stroke();
          // street trees on the verge, faded out toward the edge of the sheet rather than cut by it
          for (const x of [-20, -15, 15, 20, 25, -25]) {
            const z = -9.2, q = [];
            let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
            for (let i = 0; i <= 20; i++) { const a = TAU * i / 20, p = this.P(x + Math.cos(a) * 0.9, 0, z + Math.sin(a) * 0.9); q.push(p); x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
            const f = inLens ? 1 : clamp(Math.min(x0, w - x1, y0, h - y1) / 24, 0, 1);
            if (f <= 0) continue;
            g.globalAlpha = f; g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
          }
          g.globalAlpha = 1;
          // north point, only where the view looks down enough to read it
          if (this.o.north) {
          const nc = [12.5, 9.5];
          g.strokeStyle = bronze(0.7); g.lineWidth = 0.8; g.beginPath();
          for (let i = 0; i <= 28; i++) { const a = TAU * i / 28, q = this.P(nc[0] + Math.cos(a) * 1, 0, nc[1] + Math.sin(a) * 1); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }
          g.stroke(); poly([this.P(nc[0], 0, nc[1] + 1.35), this.P(nc[0] - 0.32, 0, nc[1] - 0.5), this.P(nc[0], 0, nc[1] - 0.2), this.P(nc[0] + 0.32, 0, nc[1] - 0.5)]); g.fillStyle = bronze(0.75); g.fill();
          if (this.o.labels && w > 280) { const t = this.P(nc[0], 0, nc[1] + 1.9); g.fillStyle = bronze(0.9); g.font = '500 10px Jost, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', t[0], t[1]); }
          }
        }
        g.setLineDash([4, 5]); g.strokeStyle = bronze(Math.min(0.9, 0.55 * bo));
        poly([[-9.5, -7.5], [9.5, -7.5], [9.5, 7.5], [-9.5, 7.5]].map(([x, z]) => this.P(x, 0, z))); g.stroke(); g.setLineDash([]);
        if (L > 0.01) {
          // the drop-off drive under the canopy, and the walk to the street
          g.strokeStyle = ink(dark ? 0.26 : 0.24); g.lineWidth = 0.8; g.beginPath();
          for (const rr of [1.4, 2.9]) { for (let i = 0; i <= 18; i++) { const a = Math.PI * i / 18, p = this.P(Math.cos(a) * rr * 1.25, 0, -5.4 - Math.sin(a) * rr); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } }
          seg(this.P(-3.6, 0, -5.4), this.P(-3.6, 0, -7.5)); seg(this.P(3.6, 0, -5.4), this.P(3.6, 0, -7.5));
          g.stroke();
        }
      }
      if (L > 0.01) {
        // The tower's shadow. On ink it stays after dark as the drawing's own: through dusk its bearing eases from the
        // low sun's (long, across the site) to the draughtsman's light over the left shoulder, and only the hatch, which
        // states this minute's sun, goes with the sun.
        const sa = dark ? kd : 1, sv = dark && night > 0 ? [sun[0] * kd + DRAFT.v[0] * night, Math.max(0, sun[1]) * kd + DRAFT.v[1] * night, sun[2] * kd + DRAFT.v[2] * night] : sun;
        {
          const sy = Math.max(sv[1], 0.3), dx = -sv[0] / sy, dz = -sv[2] / sy;
          const cast = (c) => {
            const sh = [], add = (pl, y) => pl.forEach((p) => sh.push([p.x + dx * y * c, p.z + dz * y * c]));
            add(PLANS[0].slab, 0); add(PLANS[0].slab, Math.min(L, PODIUM));
            if (L > PODIUM) { add(PLANS[Math.min(FLOORS - 1, Math.floor(L))].slab, L); add(PLANS[PODIUM].slab, PODIUM); }
            return hull(sh).map(([x, z]) => this.P(x, 0, z));
          };
          let shp = cast(1);
          // On a drawing that stands still in its frame (the story's), a shadow that is not this minute's sun study is
          // drawn only as long as the sheet holds it, so its far end is never cut off by the canvas's edge.
          const inside = (ps) => ps.every((p) => p[0] >= 6 && p[0] <= w - 6 && p[1] >= 6 && p[1] <= h - 6);
          if (!this.o.orbit && !inLens && (!study || night > 0) && !inside(shp)) {
            let lo = 0, hi = 1;
            for (let i = 0; i < 6; i++) { const c = (lo + hi) / 2; if (inside(cast(c))) lo = c; else hi = c; }
            shp = cast(lo);
          }
          poly(shp);
          g.fillStyle = dark ? `rgba(0,0,0,${(0.3 + 0.08 * night).toFixed(3)})` : ink(0.07); g.fill();
          // and hatched, the way a sun study is drawn: the shadow's length and bearing are this minute's
          if (study && sa > 0.02) {
            g.save(); g.clip(); g.beginPath(); g.strokeStyle = dark ? bronze(0.5 * sa) : ink(0.22); g.lineWidth = 0.75;
            // 45-degree lines x + y = c every 6 px, only across the shadow's own box
            let c0 = 1e9, c1 = -1e9, y0 = 1e9, y1 = -1e9;
            for (const p of shp) { c0 = Math.min(c0, p[0] + p[1]); c1 = Math.max(c1, p[0] + p[1]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); }
            y0 = Math.max(0, y0 - 1); y1 = Math.min(h, y1 + 1);
            for (let c = Math.max(0, Math.floor(c0 / 6) * 6); c <= Math.min(w + h, c1 + 6); c += 6) { g.moveTo(c - y1, y1); g.lineTo(c - y0, y0); }
            g.stroke(); g.restore();
          }
        }
        // contact shadow: the ground darkens where the building meets it
        for (const o of [1.1, 0.6, 0.25]) {
          poly(PLANS[0].slab.map((p) => this.P(p.x + p.nx * o, 0, p.z + p.nz * o)));
          g.fillStyle = dark ? 'rgba(0,0,0,0.16)' : ink(0.035); g.fill();
        }
        // after dark the lobby's light falls out across the drive
        if (dark && night > 0.05 && C >= 2 && !inLens) {
          const c = this.P(0, 0, -5.6), e = this.P(3.4, 0, -5.6), f = this.P(0, 0, -8.2), rx = Math.abs(e[0] - c[0]), ry = Math.max(2, Math.abs(f[1] - c[1]));
          if (rx > 2) {
            g.save(); g.translate(c[0], c[1]); g.scale(1, ry / rx);
            const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
            gr.addColorStop(0, `rgba(${wr},${wg},${wb},${(0.3 * night).toFixed(3)})`); gr.addColorStop(0.5, `rgba(${wr},${wg},${wb},${(0.1 * night).toFixed(3)})`); gr.addColorStop(1, `rgba(${wr},${wg},${wb},0)`);
            g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
          }
        }
      }

      const towerZ = this.P(0, this.eye[1], 0)[2], palmsBack = [], palmsFront = [], figsBack = [], figsFront = [];
      if (this.o.palms !== false && this.o.grid) PALMS.forEach((p) => (this.P(p[0], 2, p[1])[2] > towerZ ? palmsBack : palmsFront).push(p));
      // people at the entrance once the lobby is glazed, so the building reads at its true size
      if (this.o.figs !== false && this.o.grid && this.o.site !== false && C >= 2 && !inLens) FIGS.forEach((f) => (this.P(f[0], 0.3, f[1])[2] > towerZ ? figsBack : figsFront).push(f));
      palmsBack.forEach((p) => this.drawPalm(p));
      figsBack.forEach((f) => this.drawFigure(f));

      // Construction lines: a draughtsman's pencil guides, laid down before the ink and left faintly behind it
      if (this.o.guides && this.drawnAt && !inLens) {
        const age = reduce ? 9 : (now - this.drawnAt) / 1000, kc = this.k.c, ks = this.k.s, at = (X, y) => this.P(kc * X, y, -ks * X);
        const a = (dark ? 0.3 : 0.26) * (age < 2.5 ? 1 : Math.max(0.35, 1 - (age - 2.5) / 3));
        g.strokeStyle = ink(a); g.lineWidth = 0.5; g.beginPath();
        const lines = [];
        for (const y of [0, PODIUM, 10, 16, FLOORS, FLOORS + 2.2]) lines.push([-13, y, 13, y]);
        for (const X of [-6.6, -3.7, 3.7, 6.6]) lines.push([X, -1.5, X, FLOORS + 4]);
        lines.forEach(([xa, ya, xb, yb], i) => { const p = clamp((age - i * 0.07) / 0.9, 0, 1); if (!p) return; const e = 1 - Math.pow(1 - p, 3), A = at(xa, ya), B = at(xa + (xb - xa) * e, ya + (yb - ya) * e); g.moveTo(A[0], A[1]); g.lineTo(B[0], B[1]); });
        g.stroke();
      }
      // Before the envelope exists, only the footprint: podium and tower drawn on the ground
      const E = this.E, Ek = smooth(E) * (FLOORS + 1.001);
      if (this.o.footprint && E < 1 && L < 0.01) {
        g.setLineDash([3, 4]); g.lineWidth = 1; g.strokeStyle = ink((dark ? 0.6 : 0.62) * (1 - E));
        for (const pl of [PLANS[0].slab, PLANS[PODIUM].glass]) { poly(pl.map((p) => this.P(p.x, 0.01, p.z))); g.stroke(); }
        g.setLineDash([]);
      }
      // Floors not yet built: the dashed first sketch, drawn in from the ground up. It is drawn as a solid is drawn, its
      // hidden lines left out: each level's near edge, the verticals on the near faces and the outline at either side,
      // each an unbroken line so its dashes run evenly from floor to floor. Where a residence has sold, its bronze
      // carries the floor line instead.
      if (E > 0.001 && L < FLOORS) {
        const from = Math.ceil(L - 0.001), ex = eye[0], ez = eye[2];
        const near = (p, q) => (ex - (p.x + q.x) / 2) * (p.nx + q.nx) + (ez - (p.z + q.z) / 2) * (p.nz + q.nz) > 0;
        g.setLineDash([3, 4]); g.lineWidth = 0.8; g.strokeStyle = ink((dark ? 0.36 : 0.34) * (0.8 + 0.2 * fine)); g.beginPath();
        for (let k = from; k <= FLOORS && k < Ek; k++) {
          const pl = edgePlan(k), ps = this.ring(pl, k), n = pl.length, all = k === FLOORS && eye[1] > FLOORS;
          const sd = k >= RES0 && k < RES1 && pl === PLANS[k].slab ? SIDE[k] : null, sf = sd ? [this.soldOf(k, 0) > 0.5, this.soldOf(k, 1) > 0.5] : null;
          const on = new Uint8Array(n);
          for (let j = 0; j < n; j++) on[j] = (all || near(pl[j], pl[(j + 1) % n])) && !(sf && sf[sd[j]]) ? 1 : 0;
          const s0 = on.indexOf(0);
          if (s0 < 0) { ps.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); continue; }
          let open = false;
          for (let i = 1; i <= n; i++) {
            const j = (s0 + i) % n;
            if (!on[j]) { open = false; continue; }
            if (!open) { g.moveTo(ps[j][0], ps[j][1]); open = true; }
            const q = ps[(j + 1) % n]; g.lineTo(q[0], q[1]);
          }
        }
        // the verticals, storey by storey up each part of the building (podium, tower, penthouses)
        for (const [k0, k1] of [[0, PODIUM], [PODIUM, CROWN], [CROWN, FLOORS]]) {
          const lo = Math.max(k0, from - 1), hi = Math.min(k1, Math.ceil(Ek));
          if (hi <= lo) continue;
          const m = PLANS[lo].glass.length, lines = new Map();
          for (let k = lo; k < hi; k++) {
            const y0 = Math.max(k, L), y1 = Math.min(k + 1, Ek);
            if (y1 <= y0) continue;
            const pl = PLANS[k].glass, r = this.ring(pl, y0);
            let jl = 0, jr = 0;
            for (let j = 1; j < m; j++) { if (r[j][0] < r[jl][0]) jl = j; if (r[j][0] > r[jr][0]) jr = j; }
            const add = (key, j) => { let ln = lines.get(key); if (!ln) lines.set(key, (ln = [])); ln.push([k, this.P(pl[j].x, y0, pl[j].z), this.P(pl[j].x, y1, pl[j].z)]); };
            add('l', jl); add('r', jr);
            // (on a small drawing only the outline: near verticals would cross every floor line in a field of dashes)
            if (fine > 0) for (let j = 0; j < m; j += 4) if (j !== jl && j !== jr && near(pl[j], pl[j])) add(j, j);
          }
          for (const ln of lines.values()) ln.forEach(([k, a, b], i) => { if (i && ln[i - 1][0] === k - 1) g.lineTo(a[0], a[1]); else g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); });
        }
        g.stroke();
        // the line between each level's two residences, on the north and south faces: the unit mix is set
        if (!inLens) {
          g.strokeStyle = ink(dark ? 0.5 : 0.46); g.beginPath();
          for (const i of SPLIT) {
            let on = false;
            for (let k = Math.max(RES0, from - 1); k < RES1 && k < Ek; k++) {
              const p = PLANS[k].glass[i], y0 = Math.max(k + SLAB, L), y1 = Math.min(k + 1, Ek);
              if (y1 <= y0) { on = false; continue; }
              const a = this.P(p.x, y0, p.z), b = this.P(p.x, y1, p.z);
              if (!on) g.moveTo(a[0], a[1]); else g.lineTo(a[0], a[1]);
              g.lineTo(b[0], b[1]); on = true;
            }
          }
          g.stroke();
        }
        g.setLineDash([]);
      }
      // Residences sold off plan: bronze in the sketch before the frame reaches them
      // (where the core already stands inside them, they are drawn with its storey, in front of it)
      // The core leads: once ground breaks the lift and stair core climbs ahead of the frame, up to four storeys ahead
      // once it is going, always a storey under the crane's jib, which slews over it; it is closed in by the glass at
      // top-off.
      const coreTop = L > 0.01 && C < FLOORS - 0.01 ? Math.min(FLOORS, L + Math.min(4, 1.5 + L), craneAt(L).top - 1) : 0;
      if (!inLens && this.S > 0.001) for (let k = RES1 - 1; k >= RES0 && k >= L - 0.001; k--) if (!(k < coreTop && k > L + 0.001)) ghost(k, k + SLAB, k + 1, 0, true);

      // Everything that stands is drawn in horizontal layers, farthest from eye level first.
      const layers = [];
      for (let k = 0; k <= FLOORS; k++) {
        if (L > 0.01 && k <= L + 0.001) layers.push({ lo: k, hi: k + SLAB, kind: 'slab', k });
        if (k < FLOORS && (k < L || k < coreTop)) layers.push({ lo: k + SLAB, hi: k + 1, kind: 'floor', k });
      }
      const Ge = 1 - Math.pow(1 - this.G, 3), crownH = SCREEN_H * Ge;
      if (L >= FLOORS - 0.001 && this.G > 0.01) layers.push({ lo: FLOORS + SLAB, hi: FLOORS + SLAB + crownH, kind: 'crown' });
      const ey = eye[1];
      const far = (l) => (l.lo > ey ? l.lo - ey : ey > l.hi ? ey - l.hi : 0);
      layers.forEach((l) => { l.f = far(l); });
      // Glass balustrades stand in front of their floor whichever way it is seen, on every terrace up to the penthouses.
      if (railsOn) for (let k = PODIUM; k < FLOORS; k++) if (k <= L - 1) {
        const f = Math.min(far({ lo: k, hi: k + SLAB }), far({ lo: k + SLAB, hi: k + 1 })) - 0.0001;
        layers.push({ kind: 'rail', k, f });
      }
      // and round the roof terrace once the crown stands, in front of the screen
      if (railsOn && L >= FLOORS - 0.001 && this.G > 0.5) layers.push({ kind: 'rail', k: FLOORS, f: Math.min(far({ lo: FLOORS, hi: FLOORS + SLAB }), far({ lo: FLOORS + SLAB, hi: FLOORS + SLAB + crownH })) - 0.0001 });
      // the porte-cochère stands clear of the lobby's two storeys of glass, so it is drawn after them
      if (L >= 2) layers.push({ kind: 'canopy', f: far({ lo: 2, hi: 2 + SLAB }) - 0.00005 });
      layers.sort((a, b) => b.f - a.f);

      // The crane sits behind or in front of the tower depending on the view.
      const craneOn = this.o.crane && this.crane > 0.01 && !inLens;
      const craneBehind = this.P(MAST[0], ey, MAST[1])[2] > this.P(0, ey, 0)[2];
      if (craneOn && craneBehind) this.drawCrane(false);

      const view = (x, y, z) => { const vx = eye[0] - x, vy = eye[1] - y, vz = eye[2] - z, n = Math.sqrt(vx * vx + vy * vy + vz * vz); return [vx / n, vy / n, vz / n]; };
      // the shade under each slab on the glass below it: a hairline of shadow wherever the slab overhangs, deepening on
      // the faces the sun reaches as it climbs (a fraction of the storey's height)
      const soffit = lit.el > 0 ? kd * clamp(0.06 + 0.3 * Math.sin(lit.el * RAD), 0, 0.36) : 0, sliver = 0.07;
      const sunFace = (p) => clamp(3 * (p.nx * sun[0] + p.nz * sun[2]) / sunH, 0, 1);

      for (const l of layers) {
        if (this.xray && l.kind !== 'floor') {
          // inside the loupe, slabs are drawn as their edge lines only, in the drawing set's bronze
          if (l.kind === 'slab') { g.strokeStyle = bronze(0.75); g.lineWidth = 0.7; poly(cap(slabPlan(l.k), l.k + SLAB)); g.stroke(); }
          continue;
        }
        if (l.kind === 'slab') {
          const k = l.k, pl = slabPlan(k), top = ey > l.hi;
          const y0 = k, y1 = k + SLAB;
          // On ink a slab edge is concrete in the light: its face bright where the sun is on it, its top lit from the sky
          // above, under a firm ivory line; as the light goes, faces, tops and lines all dim, and the lamps carry the
          // night. On ivory the faces stay paper.
          const shadeSlab = (nx, nz) => { const d = dif(nx, nz); return mix(dark ? (0.16 + 0.5 * d) * (1 - 0.62 * night) : 0.05 + 0.1 * (1 - d)); };
          const b = band(pl, y0, y1, shadeSlab, true), n = pl.length;
          poly(cap(pl, top ? y1 : y0)); g.fillStyle = mix(dark ? (top ? 0.26 + 0.32 * Math.max(0, sun[1]) * kd : 0.09) * (1 - 0.6 * night) : (top ? 0.03 : 0.16)); g.fill();
          // The arris away from the cap that shows stands in front of the glass: a contour, firm. The one where the face
          // meets that cap is a crease, a hairline.
          const cont = top ? b.bot : b.top, crs = top ? b.top : b.bot;
          g.beginPath(); g.strokeStyle = ink(dark ? 0.74 - 0.26 * night : 0.78); g.lineWidth = dark ? 0.75 : 0.8;
          for (const j of b.lines) seg(cont[j], cont[(j + 1) % n]);
          g.stroke();
          g.beginPath(); g.strokeStyle = ink((dark ? 0.44 - 0.16 * night : 0.42) * (0.5 + 0.5 * fine)); g.lineWidth = hair;
          for (const j of b.lines) seg(crs[j], crs[(j + 1) % n]);
          g.stroke();
          // a pool on the podium terrace, in ink: the podium is never sold, and bronze only ever means sold
          if (k === PODIUM && top) {
            poly([[4.7, -3.1], [6.0, -3.1], [6.0, 3.1], [4.7, 3.1]].map(([x, z]) => this.P(x, y1 + 0.001, z)));
            g.fillStyle = ink(dark ? 0.1 : 0.07); g.fill(); g.strokeStyle = ink(dark ? 0.5 : 0.45); g.lineWidth = 0.7; g.stroke();
          }
        } else if (l.kind === 'floor') {
          // level 1 is the upper half of the double-height lobby: its glass runs down to the lobby's, with no slab between
          const k = l.k, pl = PLANS[k].glass, y0 = k === 1 ? 1 : l.lo, built = clamp(L - k, 0, 1), y1 = k + SLAB + (1 - SLAB) * built;
          const glassF = clamp(C - k, 0, 1), hgt = k / FLOORS, side = SIDE[k], sold = [this.soldOf(k, 0) > 0.5, this.soldOf(k, 1) > 0.5];
          // the open frame: columns behind the core, the core, then columns in front
          const coreH = k < coreTop ? Math.min(k + 1, coreTop) : 0;
          if (glassF < 1) {
            const cols = [], cz = this.P(0, (y0 + y1) / 2, 0)[2];
            if (built > 0) for (let j = 0; j < pl.length; j += 2) { const p = pl[j], a = this.P(p.x * 0.97, y0, p.z * 0.97), b = this.P(p.x * 0.97, y1, p.z * 0.97); cols.push([a, b, a[2] > cz]); }
            const drawCols = (back) => { g.beginPath(); g.strokeStyle = this.xray ? bronze(0.9) : ink(dark ? 0.55 : 0.6); g.lineWidth = 0.8; cols.forEach(([a, b, bk]) => { if (bk === back) seg(a, b); }); g.stroke(); };
            drawCols(true);
            // (above the frame there is no slab yet: the core's walls run on through the storey)
            const cy0 = k > L + 0.001 ? k : y0;
            if (coreH > cy0) {
              band(CORE, cy0, coreH, (nx, nz) => { const d = dif(nx, nz); return mix(dark ? (0.12 + 0.24 * d) * (1 - 0.4 * night) : 0.22 - 0.1 * d); }, false);
              if (ey > coreH) { poly(cap(CORE, coreH)); g.fillStyle = mix(dark ? 0.3 * (1 - 0.4 * night) : 0.12); g.fill(); }
            }
            drawCols(false);
            // residences already sold on this level, waiting for their glass (or for the frame, round the core)
            if (built > 0 && !this.xray) ghost(k, k + SLAB, k + 1, glassF > 0 ? Math.round(glassF * pl.length) : 0, false);
            else if (!this.xray && !inLens && this.S > 0.001 && k >= RES0 && k < RES1 && k > L + 0.001) ghost(k, k + SLAB, k + 1, 0, true);
          }
          if (glassF > 0 && built > 0) {
            // glass curtain wall, installed panel by panel around the floor
            const n = pl.length, lim = Math.round(glassF * n);
            // After dark, rooms are lit in lamp light, one or two bays wide: the lobby throughout, the amenity level and
            // the club levels at the top in part, and a scatter of homes that have not sold, more as the night deepens
            // (only in the hero; the developer story keeps its glass for the stacking plan). Sold glass stays bronze.
            const lamp = !dark || night < 0.05 || this.xray ? 0 : k < 2 ? 1 : k < PODIUM ? 0.5 : k >= CROWN ? 0.3 + 0.2 * night : this.o.rooms === false ? 0 : 0.07 + 0.2 * night;
            const litAt = (j) => lamp > 0 && (hash(k, j) < lamp || (hash(k, (j + n - 1) % n) < lamp && hash(k, j, 5) < 0.45));
            // each room a little brighter or dimmer than the next; the lobby's two storeys are one room, lit from above
            const lampI = (j) => (k === 0 ? 0.48 : k === 1 ? 0.58 : 0.6 + 0.4 * hash(j, k, 3)) * (0.55 + 0.45 * night);
            const lit = [];
            const shade = (nx, nz, j, nn, mx, mz) => {
              if (j >= lim) return null;
              const v = view(mx, (y0 + y1) / 2, mz);
              const diff = dif(nx, nz);
              const fres = 1 - Math.abs(nx * v[0] + nz * v[2]);
              const hx = sun[0] + v[0], hz = sun[2] + v[2], hn = Math.sqrt(hx * hx + hz * hz) || 1;
              // a tight highlight, and none at all once the sun is down
              const spec = Math.pow(Math.max(0, (nx * hx + nz * hz) / hn), 36) * kd;
              if (sold[side[j]]) return mixS(dark ? (0.46 + 0.3 * diff) * (1 - 0.08 * night) : 0.62 + 0.3 * diff, 0.18 * spec + 0.06 * fres * kd);
              if (dark && litAt(j)) { lit.push(j); return mixL(0.06 + 0.52 * lampI(j)); }
              if (dark) return mix(0.04 + 0.07 * diff + 0.12 * spec + (0.09 * fres + 0.07 * hgt) * (1 - 0.45 * night));
              // on the ivory sheet the glass is a light wash, as a drawing tones it; the shade is hatched over it
              return mix(0.3 - 0.1 * diff - 0.05 * fres - 0.05 * hgt - 0.14 * spec);
            };
            const bot = this.ring(pl, y0), top = this.ring(pl, y1);
            const mull = [], mullLit = [], shadowed = [], hatch = [], arc = MULL[k].s, lerp2 = (j, j2, u, v) => { const x0 = bot[j][0] + (bot[j2][0] - bot[j][0]) * u, ya = bot[j][1] + (bot[j2][1] - bot[j][1]) * u, yb = top[j][1] + (top[j2][1] - top[j][1]) * u; return [x0, ya + (yb - ya) * v]; };
            // the hatch runs at 45 degrees on the façade itself, so it turns with the building rather than sliding over it
            const dH = 0.3, hatchOn = !dark && fine > 0 && !this.xray;
            for (let j = 0; j < n; j++) {
              const j2 = (j + 1) % n, q = [bot[j], bot[j2], top[j2], top[j]];
              const area = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
              if (area >= 0) continue;
              const a = pl[j], b = pl[j2], nx = (a.nx + b.nx) / 2, nz = (a.nz + b.nz) / 2, col = shade(nx, nz, j, n, (a.x + b.x) / 2, (a.z + b.z) / 2);
              if (!col) continue;
              queue(q, col);
              const on = lit.length && lit[lit.length - 1] === j;
              if (built >= 1 && k !== 0 && !on) shadowed.push(j);
              if (fine > 0) for (const u of MULL[k].per[j]) (on ? mullLit : mull).push([lerp2(j, j2, u, 0), lerp2(j, j2, u, 1)]);
              // glass turned away from the light (unsold; the bronze keeps its own shading) is hatched
              if (hatchOn && (nx * sun[0] + nz * sun[2]) / sunH < 0.08 && !sold[side[j]]) {
                const sa = arc[j], sb = arc[j + 1], hh = y1 - y0;
                for (let c = Math.ceil((sa + y0) / dH) * dH; c < sb + y1; c += dH) {
                  // the line s + y = c inside the facet's rectangle [sa, sb] x [y0, y1]
                  const s0 = Math.max(sa, c - y1), s1 = Math.min(sb, c - y0);
                  if (s1 - s0 < 1e-4) continue;
                  hatch.push([lerp2(j, j2, (s0 - sa) / (sb - sa), (c - s0 - y0) / hh), lerp2(j, j2, (s1 - sa) / (sb - sa), (c - s1 - y0) / hh)]);
                }
              }
            }
            flush();
            // A lit room's light: a soft glow centred near its ceiling, brightest there and falling toward the floor, which
            // reaches a little onto the slab edge above, so a room reads as lamplight rather than a tile. Drawn last.
            // (two lit bays side by side are one room and share one glow; only the brighter rooms bloom, and the lobby from
            // its upper storey, which keeps a lit night about as cheap to draw as a dark one)
            if (glows) for (let i = 0; i < lit.length; i++) {
              const j = lit[i], two = lit[i + 1] === j + 1, j2 = (j + (two ? 2 : 1)) % n;
              if (two) i++;
              if (k === 0 || (k > 1 && (two ? (hash(j, k, 3) + hash(j + 1, k, 3)) / 2 : hash(j, k, 3)) < 0.45)) continue;
              const ty = (top[j][1] + top[j2][1]) / 2, hh = Math.max(3, (bot[j][1] + bot[j2][1]) / 2 - ty);
              glows.push([(top[j][0] + top[j2][0]) / 2, ty + 0.32 * hh, (two ? 0.62 : 0.85) * Math.max(4, Math.hypot(top[j2][0] - top[j][0], top[j2][1] - top[j][1])), 0.69 * hh, (two ? (lampI(j) + lampI(j + 1)) / 2 : lampI(j)) * (k < 2 ? 0.14 : 0.32)]);
            }
            if (hatch.length) { g.beginPath(); g.strokeStyle = ink(0.3 * fine); g.lineWidth = hair; hatch.forEach(([a, b]) => seg(a, b)); g.stroke(); }
            // mullions, the finest lines on the drawing (dark against a lit room)
            if (mull.length) { g.beginPath(); g.strokeStyle = ink(0.2 * fine); g.lineWidth = hair; mull.forEach(([a, b]) => seg(a, b)); g.stroke(); }
            if (mullLit.length) { g.beginPath(); g.strokeStyle = `rgba(${br},${bgg},${bb},${(0.5 * fine).toFixed(3)})`; g.lineWidth = hair; mullLit.forEach(([a, b]) => seg(a, b)); g.stroke(); }
            // the shadow each slab casts on the glass just below it, deeper where the sun falls on the face
            if (shadowed.length) {
              const dep = (j) => (sliver + Math.max(0, soffit - sliver) * sunFace(pl[j])) * (bot[j][1] - top[j][1]);
              g.beginPath();
              for (const j of shadowed) { const j2 = (j + 1) % n, d1 = dep(j), d2 = dep(j2); g.moveTo(top[j][0], top[j][1]); g.lineTo(top[j2][0], top[j2][1]); g.lineTo(top[j2][0], top[j2][1] + d2); g.lineTo(top[j][0], top[j][1] + d1); g.closePath(); }
              g.fillStyle = dark ? 'rgba(0,0,0,0.38)' : 'rgba(0,0,0,0.17)'; g.fill();
            }
          }
        } else if (l.kind === 'rail') {
          // a glass balustrade along the terrace edge
          const k = l.k, y0 = k + SLAB, y1 = y0 + RAIL_H, pl = RAILS[k];
          const b = band(pl, y0, y1, () => (dark ? `rgba(244,240,232,${(0.08 * fine).toFixed(3)})` : `rgba(20,22,26,${(0.06 * fine).toFixed(3)})`), true);
          g.beginPath(); g.strokeStyle = ink(0.36 * fine); g.lineWidth = hair;
          for (const j of b.lines) seg(b.top[j], b.top[(j + 1) % pl.length]);
          g.stroke();
        } else if (l.kind === 'canopy') {
          // porte-cochère: two slender columns and a thin floating roof, high enough to drive under
          g.beginPath(); g.strokeStyle = ink(0.7); g.lineWidth = 1.2;
          for (const x of [-2.2, 2.2]) seg(this.P(x, 0, -5.85), this.P(x, PORTE, -5.85));
          g.stroke();
          const t1 = PORTE + 0.1;
          const b = band(CANOPY, PORTE, t1, (nx, nz) => mix(dark ? (0.08 + 0.3 * dif(nx, nz)) * (1 - 0.5 * night) : 0.12), true);
          poly(cap(CANOPY, ey > t1 ? t1 : PORTE)); g.fillStyle = mix(dark ? (ey > t1 ? 0.25 : 0.1) * (1 - 0.5 * night) : (ey > t1 ? 0.03 : 0.2)); g.fill();
          // its edge drawn like a slab's: the arris against what lies behind it firm
          const ce = ey > t1 ? b.bot : b.top;
          g.beginPath(); g.strokeStyle = ink(dark ? 0.82 : 0.78); g.lineWidth = 0.8; for (const j of b.lines) { const j2 = (j + 1) % CANOPY.length; seg(ce[j], ce[j2]); } g.stroke();
        } else if (l.kind === 'crown') {
          // The crown: a louvred screen round the roof plant, solid to the eye like everything else on the drawing
          // (its far side hidden by its near one), with a coping along its top and the aviation light on its mast.
          const y0 = l.lo, y1 = l.hi, above = ey > y1;
          if (above) { poly(cap(SCREEN, y1)); g.fillStyle = mix(dark ? 0.22 * (1 - 0.4 * night) : 0.2); g.fill(); }
          // the plant space shows dark between the blades; the blades catch the light
          const b = band(SCREEN, y0, y1, (nx, nz) => { const d = dif(nx, nz); return mix(dark ? (0.17 + 0.13 * d) * (1 - 0.4 * night) : 0.07 + 0.07 * (1 - d)); }, true);
          const ns = SCREEN.length, lerp = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
          // after dark the plant screen is lit from within, brightest at its foot, and the blades stand dark against it
          const up = dark && !this.xray && night > 0.05 ? night : 0;
          if (up) {
            const f0 = this.P(0, y0, 0), f1 = this.P(0, y1, 0), gr = g.createLinearGradient(0, f0[1], 0, f1[1]);
            gr.addColorStop(0, `rgba(${wr},${wg},${wb},${(0.62 * up).toFixed(3)})`); gr.addColorStop(0.45, `rgba(${wr},${wg},${wb},${(0.28 * up).toFixed(3)})`); gr.addColorStop(1, `rgba(${wr},${wg},${wb},${(0.08 * up).toFixed(3)})`);
            g.beginPath();
            for (let j = 0; j < ns; j++) if (b.vis[j]) { const j2 = (j + 1) % ns; g.moveTo(b.bot[j][0], b.bot[j][1]); g.lineTo(b.bot[j2][0], b.bot[j2][1]); g.lineTo(b.top[j2][0], b.top[j2][1]); g.lineTo(b.top[j][0], b.top[j][1]); g.closePath(); }
            g.fillStyle = gr; g.fill();
          }
          const blade = up ? this.line.map((v, i) => Math.round(v + (this.bg[i] - v) * up)) : this.line;
          // louvres on their module, hairlines; on a small drawing only every third, so they stay clear of one another
          for (const every of [true, false]) {
            const a = (dark ? 0.42 + 0.2 * up : 0.32) * (every ? 1 : fine);
            if (a <= 0) continue;
            g.beginPath(); g.strokeStyle = `rgba(${blade[0]},${blade[1]},${blade[2]},${a.toFixed(3)})`; g.lineWidth = hair;
            let c = 0;
            for (let j = 0; j < ns; j++) for (const u of LOUVRE.per[j]) { if (!(c++ % 3) !== every || !b.vis[j]) continue; const j2 = (j + 1) % ns; seg(lerp(b.bot[j], b.bot[j2], u), lerp(b.top[j], b.top[j2], u)); }
            g.stroke();
          }
          // its foot on the roof, and the coping along its top, as firm as a slab edge
          g.beginPath(); g.strokeStyle = ink(dark ? 0.5 : 0.45); g.lineWidth = 0.6;
          for (const j of b.lines) seg(b.bot[j], b.bot[(j + 1) % ns]);
          g.stroke();
          g.beginPath(); g.strokeStyle = ink(dark ? 0.92 - 0.3 * night : 0.8); g.lineWidth = 0.9;
          for (const j of b.lines) seg(b.top[j], b.top[(j + 1) % ns]);
          g.stroke();
          if (this.G > 0.85) {
            // seen from below, the screen hides the mast's foot: it shows only above the coping in front of it
            const m1 = this.P(0, y1 + BEACON, 0);
            let m0 = this.P(0, y1, 0);
            if (!above) for (const j of b.lines) {
              const p = b.top[j], q = b.top[(j + 1) % ns];
              if ((p[0] - m1[0]) * (q[0] - m1[0]) <= 0 && p[0] !== q[0]) { const yc = p[1] + ((q[1] - p[1]) * (m1[0] - p[0])) / (q[0] - p[0]); if (yc < m0[1]) m0 = [m1[0], yc]; }
            }
            // (the light sinks out of sight behind it, rather than blinking out, as the view comes down)
            const show = clamp((m0[1] - m1[1]) / 4, 0, 1);
            if (show > 0) { g.beginPath(); g.strokeStyle = ink(0.6); g.lineWidth = 0.8; seg(m0, m1); g.stroke(); this.beacon(m1, now, dark, show * (this.G - 0.85) / 0.15, night); }
          }
        }
      }

      // The silhouette: one line round everything that stands finished, the heaviest line in the drawing. Each storey's
      // balcony (slab and balustrade) and its glass are all but convex in plan, so each is outlined on screen by a convex
      // hull, and the line runs round the union of them all, in and out at every balcony and up over the crown.
      // Verticals stay plumb through the lens, so a band's hull is the top chain of its upper ring (merged with the
      // balustrade's, which stands inside the slab edge) and the bottom chain of its lower ring.
      const clad = Math.min(Math.floor(C + 0.001), FLOORS);
      if (clad >= 1 && !this.xray) {
        const hs = [], hide = [];
        // (hid: 1 when the band's top chain always lies inside the band above, 2 when its bottom chain lies inside the one below)
        const H = (pl, y0, y1, rl, ry, hid = 0) => {
          const hx = planHull(pl), lo = chain(this.ring(pl, y0), hx, false);
          let up = chain(this.ring(pl, y1), hx, true);
          if (rl) {
            // the upper hull of both top chains, merged left to right
            const b = chain(this.ring(rl, ry), planHull(rl), true), a = up, pts = [];
            for (let i = 0, j = 0; i < a.length || j < b.length;) {
              const p = j >= b.length || (i < a.length && (a[i][0] < b[j][0] || (a[i][0] === b[j][0] && a[i][1] <= b[j][1]))) ? a[i++] : b[j++];
              while (pts.length >= 2) { const o = pts[pts.length - 2], q = pts[pts.length - 1]; if ((q[0] - o[0]) * (p[1] - o[1]) - (q[1] - o[1]) * (p[0] - o[0]) <= 0) pts.pop(); else break; }
              pts.push(p);
            }
            up = pts;
          }
          hide.push(hid ? up.length * 4 + hid : 0);
          for (let i = lo.length - 1; i >= 0; i--) up.push(lo[i]);
          hs.push(up);
        };
        const railAt = (k) => railsOn && k >= PODIUM && (k < FLOORS ? k <= L - 1 : this.G > 0.5);
        for (let k = 0; k <= clad; k++) {
          const sp = edgePlan(k);
          // (the balustrade's share of the outline shrinks away as it fades out on a small drawing, so nothing jumps)
          if (railAt(k)) H(sp, k, k + SLAB, RAILS[k], k + SLAB + RAIL_H * fine); else H(sp, k, k + SLAB);
          // a storey's glass stands inside the slabs above and below it (the lobby's two storeys meet at level 1)
          if (k < clad) H(PLANS[k].glass, k === 1 ? 1 : k + SLAB, k + 1, null, 0, (k !== 0 ? 1 : 0) | (k !== 1 ? 2 : 0));
        }
        if (clad >= FLOORS && this.G > 0.01) H(SCREEN, FLOORS + SLAB, FLOORS + SLAB + crownH);
        this.outline(hs, dark ? ink(0.7 - 0.22 * night) : ink(0.8), dark ? 1.15 + 0.2 * fine : 1.3 + 0.26 * fine, hide);
      }
      // after dark the working deck is floodlit while the frame climbs
      if (glows && L > 0.01 && L < FLOORS - 0.01) { const d = this.P(0, L + 0.25, 0); glows.push([d[0], d[1], 5.4 * this.u, 1.4 * this.u, 0.26 * night]); }
      // The lamps' light, added to what lies under it: one radial falloff, made once, stretched over each glow
      // (an ellipse of radii rx, ry), which keeps a whole night of lit rooms about as cheap as flat ones.
      if (glows && glows.length && g.getTransform) {
        const key = this.warm.join();
        if (this._glowK !== key) {
          const u = g.createRadialGradient(0, 0, 0, 0, 0, 1);
          u.addColorStop(0, `rgba(${key},1)`); u.addColorStop(0.3, `rgba(${key},0.55)`); u.addColorStop(0.65, `rgba(${key},0.16)`); u.addColorStop(1, `rgba(${key},0)`);
          this._glow = u; this._glowK = key;
        }
        const T = g.getTransform();
        g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = this._glow;
        for (const [x, y, rx, ry, a] of glows) {
          g.globalAlpha = clamp(a, 0, 1);
          g.setTransform(T.a * rx, T.b * rx, T.c * ry, T.d * ry, T.a * x + T.c * y + T.e, T.b * x + T.d * y + T.f);
          g.fillRect(-1, -1, 2, 2);
        }
        g.restore();
      }

      if (craneOn && !craneBehind) this.drawCrane(true);
      palmsFront.forEach((p) => this.drawPalm(p));
      figsFront.forEach((f) => this.drawFigure(f));
      // The level ruler stands on the plane of the near façade, and each tick is set at the height where the slab it
      // names is nearest the eye, so every tick meets its slab edge (the podium's for the lowest levels, the setback's
      // for the roof). It is on the viewer's left unless dimSide is 1.
      const E0 = this.E, kc = this.k.c, ks = this.k.s, sd = this.o.dimSide === 1 ? -1 : 1, nr = this.nearFace(kc, ks), at = (X) => [kc * X * sd - ks * nr, -ks * X * sd - kc * nr];
      // a vertical line stays vertical through a shift lens, so the ruler, its tick ends and its labels each sit at one x
      const sx = (X) => { const [x, z] = at(X); return this.P(x, 0, z)[0]; }, xa = sx(-10), xt = sx(-10.7), xl = sx(-11.9);
      // a level is marked at its finished floor, the top of its slab (the lobby's upper level at its façade line)
      const lv = (i) => { let best = null; for (const q of this.ring(edgePlan(i), i + SLAB)) { if (!best || q[2] < best[2]) best = q; } return best[1]; };
      const ruler = !(E0 < 0.01 && L < 0.01), ys = ruler ? Array.from({ length: FLOORS + 1 }, (_, i) => lv(i)) : null, tw = this.o.labels ? this.o.labelSize * 3 : 0;
      this.rb = ruler ? { x0: Math.min(xa, xl - (sd > 0 ? tw : 0)) - 6, x1: Math.max(xa, xl + (sd < 0 ? tw : 0)) + 6, y0: ys[FLOORS] - this.o.labelSize, y1: ys[0] } : null;
      // Today's path of the sun over Miami, an arc laid over the drawing like a sundial: solid where it has been, dotted where it is going
      if (this.o.sunPath && !inLens && this.drawnAt && w >= 820) this.sunPath(now, dark);

      // Dimension line with level ticks; it comes in with the sketch
      if (!ruler) return;
      const ra = L > 0.01 ? 1 : E0;
      g.strokeStyle = bronze(0.7 * ra); g.lineWidth = 0.8; g.beginPath(); g.moveTo(xa, ys[0]); g.lineTo(xa, ys[FLOORS]);
      for (let i = 0; i <= FLOORS; i += 5) { g.moveTo(xa, ys[i]); g.lineTo(xt, ys[i]); }
      g.moveTo(xa, ys[FLOORS]); g.lineTo(xt, ys[FLOORS]);
      g.stroke();
      // a short tick at every level between the numbered ones
      g.strokeStyle = bronze(0.4 * ra); g.lineWidth = 0.6; g.beginPath();
      for (let i = 1; i < FLOORS; i++) if (i % 5) { g.moveTo(xa, ys[i]); g.lineTo((xa + xt) / 2, ys[i]); }
      g.stroke();
      if (this.o.labels && w > 280) {
        g.globalAlpha = ra;
        g.fillStyle = this.dark ? 'rgb(201,168,119)' : 'rgb(122,95,58)'; g.font = '500 ' + this.o.labelSize + 'px Jost, sans-serif'; g.textAlign = sd < 0 ? 'left' : 'right'; g.textBaseline = 'middle';
        const fx = (x, t) => sd < 0 ? Math.min(x, w - g.measureText(t).width - 4) : Math.max(x, g.measureText(t).width + 4);
        for (let i = 0; i <= FLOORS; i += 5) { const t = 'L' + String(i).padStart(2, '0'); g.fillText(t, fx(xl, t), ys[i]); }
        if (Math.abs(ys[FLOORS] - ys[20]) > this.o.labelSize * 1.4) g.fillText('ROOF', fx(xl, 'ROOF'), ys[FLOORS]);
        g.globalAlpha = 1;
      }
    }

    // A line of width v round the union of convex outlines hs (screen points): every edge of every outline, less the
    // parts that lie inside another, stroked as one path (so nothing is inked twice). Where two outlines share an edge,
    // the earlier one keeps it. hide[i], when set, is 4 * (points in outline i's top chain) + 1 if that chain is known to
    // be hidden + 2 if its bottom chain is: those edges are left out without testing.
    outline(hs, col, v, hide) {
      const g = this.ctx, n = hs.length, E = 0.02, box = new Float64Array(n * 4), hp = [];
      for (let i = 0; i < n; i++) {
        const h = hs[i], m = h.length;
        let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, a = 0;
        for (let e = 0; e < m; e++) { const p = h[e], q = h[(e + 1) % m]; a += p[0] * q[1] - q[0] * p[1]; if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }
        box[i * 4] = x0; box[i * 4 + 1] = y0; box[i * 4 + 2] = x1; box[i * 4 + 3] = y1;
        // each edge as a half-plane nx*x + ny*y <= c, the normal pointing out whatever the winding
        const sg = a > 0 ? 1 : -1, pl = new Float64Array(m * 3);
        let k = 0;
        for (let e = 0; e < m; e++) { const p = h[e], q = h[(e + 1) % m], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.sqrt(dx * dx + dy * dy); if (l < 1e-9) continue; const nx = (sg * dy) / l, ny = (-sg * dx) / l; pl[k++] = nx; pl[k++] = ny; pl[k++] = nx * p[0] + ny * p[1]; }
        hp.push(m > 2 ? pl.subarray(0, k) : null);
      }
      const c0 = new Float64Array(n), c1 = new Float64Array(n);
      g.beginPath();
      for (let i = 0; i < n; i++) {
        const h = hs[i], m = h.length, bx0 = box[i * 4] - 1, by0 = box[i * 4 + 1] - 1, bx1 = box[i * 4 + 2] + 1, by1 = box[i * 4 + 3] + 1;
        // only the outlines whose boxes touch this one can hide any of it
        const near = [];
        for (let j = 0; j < n; j++) if (j !== i && hp[j] && box[j * 4] <= bx1 && box[j * 4 + 2] >= bx0 && box[j * 4 + 1] <= by1 && box[j * 4 + 3] >= by0) near.push(j);
        let open = false;
        const hd = hide ? hide[i] : 0, nu = hd >> 2;
        for (let e = 0; e < m; e++) {
          if (((hd & 1) && e < nu - 1) || ((hd & 2) && e >= nu && e < m - 1)) { open = false; continue; }
          const P0 = h[e], P1 = h[(e + 1) % m], dx = P1[0] - P0[0], dy = P1[1] - P0[1];
          const ex0 = Math.min(P0[0], P1[0]), ex1 = Math.max(P0[0], P1[0]), ey0 = Math.min(P0[1], P1[1]), ey1 = Math.max(P0[1], P1[1]);
          let nc = 0, gone = false;
          for (const j of near) {
            if (box[j * 4] > ex1 + 1 || box[j * 4 + 2] < ex0 - 1 || box[j * 4 + 1] > ey1 + 1 || box[j * 4 + 3] < ey0 - 1) continue;
            // the part of the edge inside outline j (grown a hair if j comes first, shrunk if it comes after)
            const pl = hp[j], tol = j < i ? E : -E;
            let t0 = 0, t1 = 1;
            for (let q = 0; q < pl.length; q += 3) {
              const f0 = pl[q] * P0[0] + pl[q + 1] * P0[1] - pl[q + 2] - tol, df = pl[q] * dx + pl[q + 1] * dy;
              if (df > 1e-12) { const t = -f0 / df; if (t < t1) t1 = t; } else if (df < -1e-12) { const t = -f0 / df; if (t > t0) t0 = t; } else if (f0 > 0) { t1 = -1; break; }
              if (t0 >= t1) break;
            }
            if (t1 > t0) {
              if (t0 <= 1e-6 && t1 >= 1 - 1e-6) { gone = true; break; }
              // keep the cuts sorted by their start
              let q = nc++;
              while (q > 0 && c0[q - 1] > t0) { c0[q] = c0[q - 1]; c1[q] = c1[q - 1]; q--; }
              c0[q] = t0; c1[q] = t1;
            }
          }
          const cont = open;
          open = false;
          if (gone) continue;
          // what is left of the edge, drawn on from the last edge where it carries straight on, so the corner is joined
          let t = 0, first = true;
          for (let q = 0; q <= nc; q++) {
            const a = t, b = q < nc ? Math.min(c0[q], 1) : 1;
            if (b - a > 1e-6) {
              if (first && cont && a < 1e-6) g.lineTo(P0[0] + dx * b, P0[1] + dy * b);
              else { g.moveTo(P0[0] + dx * a, P0[1] + dy * a); g.lineTo(P0[0] + dx * b, P0[1] + dy * b); }
              first = false; open = b > 1 - 1e-6;
            }
            if (q < nc) { t = Math.max(t, c1[q]); if (t >= 1) break; }
          }
        }
      }
      g.lineJoin = 'round'; g.lineCap = 'round'; g.lineWidth = v; g.strokeStyle = col; g.stroke(); g.lineJoin = 'miter'; g.lineCap = 'butt';
    }

    sunPath(now, dark) {
      const g = this.ctx, t = Date.now(), R = this.o.sunPath === true ? 15 : this.o.sunPath;
      if (!this.sp || t - this.sp.at > 300000) {
        // sample the next and last day in ten-minute steps; keep the daylight arc that holds now, or the next one
        const pts = [];
        for (let m = -24 * 60; m <= 24 * 60; m += 10) { const d = new Date(t + m * 6e4), { el, az } = solar(d); pts.push({ m, el, az, d }); }
        let seg = [], best = null;
        for (const q of pts) {
          if (q.el > -0.8) seg.push(q);
          else if (seg.length) { if (!best && seg[seg.length - 1].m >= 0) best = seg; seg = []; }
        }
        if (!best && seg.length) best = seg;
        const fmt = (d) => d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' });
        this.sp = { at: t, arc: best || [], rise: best ? fmt(best[0].d) : '', set: best ? fmt(best[best.length - 1].d) : '' };
      }
      const arc = this.sp.arc; if (arc.length < 3) return;
      // drawn as an architect's sun-path elevation in the open corner above the levels: time across, height up
      const w = this.w, H = 54, base = 100 + H;
      // it sits clear of the crown, between the tower and the edge of the page
      let xr = -1e9; for (const p of PLANS[PLANS.length - 1].slab) xr = Math.max(xr, this.P(p.x * 1.1, FLOORS + 2.6, p.z * 1.1)[0]);
      let x0 = Math.max(xr + 48, w * 0.55), x1 = Math.min(w - 28, x0 + 230);
      // and clear of the level ruler and its labels: past them if there is room, otherwise not at all
      const rb = this.rb;
      if (rb && x0 - 8 < rb.x1 && x1 + 8 > rb.x0 && base - H - 20 < rb.y1 && base + 24 > rb.y0) { x0 = Math.max(x0, rb.x1 + 16); x1 = Math.min(w - 28, x0 + 230); }
      const W = x1 - x0;
      if (W < 150) return;
      const m0 = arc[0].m, m1 = arc[arc.length - 1].m, top = Math.max(...arc.map((q) => q.el)), [sr, sg, sb] = this.sold, [lr, lg, lb] = this.line;
      const X = (m) => x0 + ((m - m0) / (m1 - m0)) * W, Y = (el) => base - (Math.max(el, 0) / top) * H;
      g.save(); g.lineWidth = 1;
      g.strokeStyle = `rgba(${lr},${lg},${lb},0.22)`; g.beginPath(); g.moveTo(x0 - 8, base + 0.5); g.lineTo(x1 + 8, base + 0.5); g.stroke();
      for (const past of [true, false]) {
        g.setLineDash(past ? [] : [1.5, 3.5]); g.strokeStyle = `rgba(${sr},${sg},${sb},${past ? 0.85 : 0.6})`; g.beginPath();
        let on = false; arc.forEach((q) => { if ((q.m <= 0) !== past && !(past === false && q.m === 0)) return; const x = X(q.m), y = Y(q.el); on ? g.lineTo(x, y) : g.moveTo(x, y); on = true; });
        g.stroke();
      }
      g.setLineDash([]);
      // hour ticks on the horizon line
      g.strokeStyle = `rgba(${lr},${lg},${lb},0.28)`; g.beginPath();
      arc.forEach((q) => { if (q.d.getUTCMinutes() < 10) { const x = X(q.m); g.moveTo(x, base); g.lineTo(x, base + 4); } });
      g.stroke();
      const nowQ = arc.find((q) => q.m === 0);
      if (nowQ && nowQ.el > 0) {
        const x = X(0), y = Y(nowQ.el), pulse = reduce ? 1 : 0.8 + 0.2 * Math.sin(now / 1200);
        const gr = g.createRadialGradient(x, y, 0, x, y, 14);
        gr.addColorStop(0, `rgba(${sr},${sg},${sb},${0.4 * pulse})`); gr.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, 14, 0, TAU); g.fill();
        g.fillStyle = `rgb(${sr},${sg},${sb})`; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill();
        g.strokeStyle = `rgba(${sr},${sg},${sb},0.35)`; g.setLineDash([1, 3]); g.beginPath(); g.moveTo(x, y + 5); g.lineTo(x, base); g.stroke(); g.setLineDash([]);
      }
      // sunrise and sunset under the horizon line, the peak height over the arc
      g.font = '500 12px Jost, sans-serif'; g.textBaseline = 'top'; g.fillStyle = `rgba(${lr},${lg},${lb},0.62)`;
      const tr = 'SUNRISE ' + this.sp.rise.toUpperCase(), ts = 'SUNSET ' + this.sp.set.toUpperCase();
      // both times, when they fit side by side without touching
      if (g.measureText(tr).width + g.measureText(ts).width + 16 < W + 16) {
        g.textAlign = 'left'; g.fillText(tr, x0 - 8, base + 9);
        g.textAlign = 'right'; g.fillText(ts, x1 + 8, base + 9);
      }
      const pk = arc.reduce((a, q) => (q.el > a.el ? q : a), arc[0]);
      g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillStyle = `rgba(${sr},${sg},${sb},0.9)`;
      g.fillText(Math.round(pk.el) + '°', X(pk.m), base - H - 6);
      g.restore();
    }

    // The aviation light on the roof, breathing slowly.
    // By day it is a bronze point; as the light goes it becomes lamp light and its glow reaches further.
    beacon(p, now, dark, fade = 1, night = 0) {
      const g = this.ctx, a = (reduce ? 0.8 : 0.55 + 0.45 * Math.sin(now / 900)) * clamp(fade, 0, 1);
      const [sr, sg, sb] = this.sold.map((v, i) => Math.round(v + (this.warm[i] - v) * night)), R = 3 + 2.5 * night;
      const r = Math.max(2.5, this.k.f / this.o.dist * 0.35);
      if (!dark) { g.fillStyle = `rgba(${sr},${sg},${sb},${0.9 * clamp(fade, 0, 1)})`; g.beginPath(); g.arc(p[0], p[1], 1.5, 0, TAU); g.fill(); return; }
      // (the glow fades out before the canvas's top edge, so it is never cut off by it)
      const rg = Math.max(r * 2, Math.min(r * R, p[1] - 1)), gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], rg);
      gr.addColorStop(0, `rgba(${sr},${sg},${sb},${((0.55 + 0.15 * night) * a).toFixed(3)})`); gr.addColorStop(0.35, `rgba(${sr},${sg},${sb},${((0.18 + 0.1 * night) * a).toFixed(3)})`); gr.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], rg, 0, TAU); g.fill();
      g.fillStyle = `rgba(${sr},${sg},${sb},${0.6 + 0.4 * a})`; g.beginPath(); g.arc(p[0], p[1], Math.max(1.2, r * 0.35), 0, TAU); g.fill();
    }

    // A person at architectural scale, so the building reads at its true size.
    drawFigure([x, z, hh]) {
      const g = this.ctx, [lr, lg, lb] = this.line, P = (dx, y) => this.P(x + dx, y, z);
      const f0 = P(-0.05, 0), f1 = P(0.05, 0), hip = P(0, hh * 0.46), neck = P(0, hh * 0.76), head = P(0, hh * 0.9);
      const px = Math.abs(head[1] - f0[1]);
      g.strokeStyle = g.fillStyle = `rgba(${lr},${lg},${lb},${this.dark ? 0.78 : 0.72})`; g.lineCap = 'round';
      g.lineWidth = Math.max(0.8, px * 0.1); g.beginPath(); g.moveTo(f0[0], f0[1]); g.lineTo(hip[0], hip[1]); g.lineTo(f1[0], f1[1]); g.stroke();
      g.lineWidth = Math.max(1.2, px * 0.2); g.beginPath(); g.moveTo(hip[0], hip[1]); g.lineTo(neck[0], neck[1]); g.stroke(); g.lineCap = 'butt';
      g.beginPath(); g.arc(head[0], head[1], Math.max(0.9, px * 0.085), 0, TAU); g.fill();
    }

    // A royal palm in a few strokes: a leaning trunk and drooping fronds.
    drawPalm([x, z, hgt, lean, turn]) {
      const g = this.ctx, [lr, lg, lb] = this.line, col = `rgba(${lr},${lg},${lb},${this.dark ? 0.5 : 0.55})`;
      const tx = x + lean * Math.cos(turn), tz = z + lean * Math.sin(turn);
      g.strokeStyle = col; g.lineWidth = 1.1; g.beginPath();
      for (let i = 0; i <= 8; i++) { const t = i / 8, e = t * t, p = this.P(x + (tx - x) * e, hgt * t, z + (tz - z) * e); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); }
      g.stroke(); g.lineWidth = 0.75; g.beginPath();
      const leaf = [];
      for (let f = 0; f < 11; f++) {
        const a = turn + f * TAU / 11 + 0.4 * Math.sin(f * 2.3), len = 1.25 + 0.5 * ((f * 7) % 4) / 3, up = f % 3 === 0 ? 0.9 : 0.5;
        const pt = (t) => this.P(tx + Math.cos(a) * len * t, hgt + len * (up * t - 1.05 * t * t), tz + Math.sin(a) * len * t);
        let prev = pt(0); g.moveTo(prev[0], prev[1]);
        for (let i = 1; i <= 7; i++) { const t = i / 7, p = pt(t); g.lineTo(p[0], p[1]); if (i > 1 && i < 7) leaf.push([p, t]); prev = p; }
        g.moveTo(prev[0], prev[1]);
      }
      g.stroke();
      // leaflets hang from each frond
      g.lineWidth = 0.5; g.beginPath();
      const sc = this.k.f / this.o.dist * 0.16;
      leaf.forEach(([p, t]) => { const l = sc * (1 - t * 0.6); g.moveTo(p[0], p[1]); g.lineTo(p[0] - l * 0.5, p[1] + l); g.moveTo(p[0], p[1]); g.lineTo(p[0] + l * 0.5, p[1] + l); });
      g.stroke();
    }

    // A hammerhead tower crane in fine linework, standing on the podium roof beside the tower's east face. It climbs
    // with the frame, tied back to the slab edge every six levels; the jib slews over the tower as the floors go up.
    // Its cab, counterweight and load are drawn in outline with a light wash, so it never outweighs the building.
    drawCrane(front) {
      const g = this.ctx, [lr, lg, lb] = this.line, a = (this.dark ? 0.5 : 0.42) * this.crane;
      const seg = (p, q) => { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); };
      const [mx, mz] = MAST, s = MAST_W, { top, ang } = craneAt(this.L), L = this.L;
      const P = (x, y, z) => this.P(mx + x, y, mz + z);
      // in front of the tower, the mast's foot is hidden inside the podium once the podium is glazed
      const foot = front && this.C >= PODIUM ? PODIUM + SLAB : 0;
      g.strokeStyle = `rgba(${lr},${lg},${lb},${a})`; g.lineWidth = 0.6; g.beginPath();
      const cs = [[-s, -s], [s, -s], [s, s], [-s, s]];
      cs.forEach(([x, z]) => seg(P(x, foot, z), P(x, top, z)));
      for (let y = 0; y < top - 0.01; y += 1.1) {
        if (y + 1.1 <= foot) continue;
        const y2 = Math.min(top, y + 1.1);
        for (let q = 0; q < 4; q++) { const [x0, z0] = cs[q], [x1, z1] = cs[(q + 1) % 4]; seg(P(x0, Math.max(y, foot), z0), P(x1, y2, z1)); seg(P(x0, y2, z0), P(x1, y2, z1)); }
      }
      // ties back to the frame: two struts from the mast's near corners to the nearest point of the slab edge
      for (let y = 6; y <= Math.min(top - 2, L - 0.5); y += 6) {
        let best = null, bd = 1e9;
        for (const p of slabPlan(Math.round(y))) { const d = (p.x - mx) ** 2 + (p.z - mz) ** 2; if (d < bd) { bd = d; best = p; } }
        const dx = best.x - mx, dz = best.z - mz, n = Math.hypot(dx, dz) || 1, ux = -dz / n, uz = dx / n;
        const near = cs.slice().sort((p, q) => (q[0] * dx + q[1] * dz) - (p[0] * dx + p[1] * dz)).slice(0, 2);
        for (const [cx, cz] of near) seg(P(cx, y, cz), this.P(best.x + ux * 0.35 * Math.sign(cx * ux + cz * uz || 1), y, best.z + uz * 0.35 * Math.sign(cx * ux + cz * uz || 1)));
      }
      g.stroke();
      // slewing jib, counter-jib, A-frame head and pendants
      const ca = Math.cos(ang), sa = Math.sin(ang);
      const J = (d, y, w = 0) => P(ca * d - sa * w, y, sa * d + ca * w);
      g.beginPath();
      seg(J(-4.6, top, -0.3), J(JIB, top, -0.3)); seg(J(-4.6, top, 0.3), J(JIB, top, 0.3));
      seg(J(0, top + 0.7, 0), J(JIB, top, 0));
      for (let d = 0; d < JIB; d += 1.5) { seg(J(d, top, -0.3), J(d + 0.75, top + 0.7 * (1 - (d + 0.75) / JIB), 0)); seg(J(d + 0.75, top + 0.7 * (1 - (d + 0.75) / JIB), 0), J(d + 1.5, top, 0.3)); }
      seg(J(0, top, -0.35), J(0, top + 3, 0)); seg(J(0, top, 0.35), J(0, top + 3, 0));
      seg(J(0, top + 3, 0), J(9, top + 0.4, 0)); seg(J(0, top + 3, 0), J(-4.4, top, 0));
      // trolley and hook: over the working floor while the frame rises, parked by the mast once it tops off
      const done = this.G, tr = (5.5 + 2.5 * Math.sin(L * 0.9)) * (1 - done) + 1.4 * done;
      const hy = (L + 1.4 + 0.6 * (1 + Math.sin(L * 0.7))) * (1 - done) + (top - 1.4) * done;
      seg(J(tr, top, 0), J(tr, hy, 0));
      g.stroke();
      const box = (d, y, w, hh, dd) => { const q = [J(d - dd, y, -w), J(d + dd, y, -w), J(d + dd, y + hh, -w), J(d - dd, y + hh, -w)]; g.beginPath(); q.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); g.stroke(); };
      g.fillStyle = `rgba(${lr},${lg},${lb},${(this.dark ? 0.22 : 0.12) * this.crane})`; g.lineWidth = 0.7;
      box(-3.9, top - 0.7, 0.3, 0.7, 0.55); // counterweight
      box(0.9, top - 0.75, 0.3, 0.75, 0.45); // cab
      if (done < 0.98) box(tr, hy - 0.6, 0.3, 0.6, 0.6); // a load on its way up
    }
  }

  window.CentamontModel = Model;
})();
