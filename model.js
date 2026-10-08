// Centamont tower model: an architectural study of a generic waterfront tower, drawn on canvas.
// It is an illustration, never a real project. The structure rises floor by floor with its core
// leading and the glass following behind; sold floors glow bronze.
(function () {
  const FLOORS = 22, SLAB = 0.16, PODIUM = 3, CROWN = 20;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

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
      glass = rrect(6.2, 4.2, 1.1, 3, 3); off = () => 0.22;
    } else if (k < CROWN) {
      const t = (k - PODIUM) / (CROWN - PODIUM), s = 1 - 0.07 * t;
      glass = rrect(3.3 * s, 2.7 * s, 1.35, 3, 3);
      // Balconies swell and recede around the tower, a little further along on every floor.
      off = (p) => 0.22 + 0.4 * (0.5 + 0.5 * Math.sin(2 * Math.atan2(p.z, p.x) + k * 0.4));
    } else {
      glass = rrect(2.75, 2.25, 1.15, 3, 2); off = () => 0.3;
    }
    const rot = k < PODIUM ? 0 : 0.34 * (Math.min(k, FLOORS - 1) - PODIUM) / (FLOORS - 1 - PODIUM);
    const c = Math.cos(rot), s = Math.sin(rot);
    const R = (x, z) => [c * x - s * z, s * x + c * z];
    const g = glass.map((p) => { const [x, z] = R(p.x, p.z), [nx, nz] = R(p.nx, p.nz); return { x, z, nx, nz }; });
    const e = glass.map((p) => { const o = off(p), [x, z] = R(p.x + p.nx * o, p.z + p.nz * o), [nx, nz] = R(p.nx, p.nz); return { x, z, nx, nz }; });
    return { glass: g, slab: e, rot };
  }
  const PLANS = Array.from({ length: FLOORS }, (_, k) => floorPlan(k));
  // The slab under floor k is as wide as whatever it carries or roofs over.
  const slabPlan = (k) => (k === PODIUM || k === CROWN || k === FLOORS ? PLANS[k - 1] : PLANS[k]).slab;
  const CORE = (() => {
    const out = [];
    for (let k = 0; k < FLOORS; k++) {
      const r = PLANS[k].rot, c = Math.cos(r), s = Math.sin(r);
      out.push(rrect(1.5, 1.15, 0.12, 1, 0).map((p) => ({ x: c * p.x - s * p.z, z: s * p.x + c * p.z, nx: c * p.nx - s * p.nz, nz: s * p.nx + c * p.nz })));
    }
    return out;
  })();
  const MAST = [7.6, -5.6]; // tower crane, outside the podium's back corner
  // [x, z, height, lean, lean direction]
  const PALMS = [[-8.3, -6.1, 3.9, 0.5, 3.6], [-6.3, -7.1, 4.2, 0.45, 4.4], [5.0, -7.3, 3.6, 0.4, 5.2], [-8.6, 5.6, 3.5, 0.4, 2.4], [8.4, 5.8, 3.7, 0.5, 0.4], [-0.6, 6.7, 3.3, 0.35, 1.4], [9.0, 0.6, 3.1, 0.3, 0.1]];
  // People at the entrance, for scale: [x, z, height]
  const FIGS = [[-1.5, -6.6, 0.56], [-1.15, -6.75, 0.5], [1.2, -6.2, 0.55], [2.5, -7.25, 0.54], [-5.6, -7.25, 0.52], [6.1, -6.8, 0.56]];
  // A porte-cochère on the entrance side of the podium
  const CANOPY = rrect(2.6, 0.85, 0.4, 2, 2).map((p) => ({ x: p.x, z: p.z - 5.25, nx: p.nx, nz: p.nz }));
  const hash = (a, b, c = 0) => { const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return x - Math.floor(x); };

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
  function miamiSun(date = new Date()) {
    const { el, az } = solar(date);
    const night = el < -4 ? 1 : el < 4 ? 0.5 : 0;
    if (el < 0) return { v: [-0.55, 0.62, -0.5], night, el, az };
    const E = el * RAD, A = az * RAD;
    return { v: [Math.cos(E) * Math.sin(A), Math.sin(E), Math.cos(E) * Math.cos(A)], night, el, az };
  }
  window.CentamontSun = miamiSun;

  function rgb(hex) {
    const m = String(hex).trim().match(/^rgba?\(([^)]+)\)/);
    if (m) return m[1].split(',').slice(0, 3).map(Number);
    const h = String(hex).trim().replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];

  function hull(pts) {
    pts = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = pts.length - 1; i >= 0; i--) { const p = pts[i]; while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  class Model {
    constructor(canvas, opts) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = Object.assign({ orbit: 0, theta: -0.62, phi: 0.2, dist: 52, ty: 11.5, scale: 1.05, offsetX: 0, crane: true, grid: true, labels: false, labelSize: 12, envelope: true }, opts);
      this.theta = this.o.theta;
      this.phi = this.o.phi;
      this.L = 0; this.S = 0; this.C = 0; // animated: structure, sold, glass
      this.B = 0; this.Sold = 0; // targets
      this.crane = 0; this.craneT = 0;
      this.mx = 0; this.my = 0;
      this.visible = true;
      this.sunNow = miamiSun();
      setInterval(() => { this.sunNow = miamiSun(); this.touch(); }, 300000);
      this.colors();
      this.size();
      new ResizeObserver(() => { this.size(); this.touch(); }).observe(canvas);
      new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; if (this.visible) this.kick(); }).observe(canvas);
    }

    colors() {
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
      this.dark = lum(this.line) > lum(this.bg);
      this.touch();
    }

    size() {
      const r = this.c.getBoundingClientRect();
      // phones get 1.5x: sharp enough for hairlines at half the fill cost of 2x or more
      const d = Math.min(devicePixelRatio || 1, innerWidth < 820 ? 1.5 : 2);
      this.w = r.width; this.h = r.height;
      this.c.width = Math.max(1, Math.round(r.width * d));
      this.c.height = Math.max(1, Math.round(r.height * d));
      this.ctx.setTransform(d, 0, 0, d, 0, 0); this.dpr = d;
    }

    // Glass trails the structure by three floors until the building tops off.
    cladTarget() { return this.B >= FLOORS ? FLOORS : Math.max(0, this.B - 3); }

    set(built, sold, crane, instant) {
      if (built && !this.B && !this.drawnAt) this.drawnAt = performance.now();
      this.B = built; this.Sold = sold; this.craneT = crane ? 1 : 0;
      this.c.dataset.built = built; this.c.dataset.sold = sold;
      if (instant || reduce) { this.L = built; this.S = sold; this.C = this.cladTarget(); this.crane = this.craneT; this.G = built >= FLOORS ? 1 : 0; }
      this.kick();
    }

    // Start the draughtsman's construction lines ahead of the ink.
    sketch() { this.drawnAt = performance.now(); this.touch(); }

    pointer(x, y) { this.mx = x; this.my = y; this.kick(); }

    // Force a full redraw on the next frame (camera moves, colors, size).
    touch() { this.dirty = true; this.kick(); }

    kick() {
      if (this.raf || !this.w || this.visible === false) return;
      this.raf = requestAnimationFrame(() => { this.raf = 0; this.frame(); });
    }

    frame() {
      // Easing runs on the clock, not the frame count, so a slow phone builds as fast as a desktop.
      const t = performance.now(), dt = Math.min(100, this.t0 ? t - this.t0 : 16.7);
      this.t0 = t;
      const ease = (a, b, tau) => (Math.abs(b - a) < 0.002 ? b : a + (b - a) * (1 - Math.exp(-dt / tau)));
      // The hero's tower rises at a steady pace, a floor at a time, and slows for its last floors;
      // everything else eases.
      if (this.o.rise && this.B > this.L) this.L = Math.min(this.B, this.L + (dt / 1000) * 9 * (0.3 + 0.7 * Math.min(1, (this.B - this.L) / 3)) + 0.0005);
      else this.L = ease(this.L, this.B, 410);
      // the glass never overtakes the frame
      this.C = Math.min(ease(this.C, this.cladTarget(), 470), this.L);
      this.S = ease(this.S, this.Sold, 330);
      this.crane = ease(this.crane, this.craneT, 270);
      // the crown rises once the building has topped off
      const crownT = this.L >= FLOORS - 0.001 ? 1 : 0;
      this.G = ease(this.G || 0, crownT, 380);
      if (!reduce && this.o.orbit) this.theta += this.o.orbit * dt / 16.7;
      this.tx = ease(this.tx || 0, this.mx * 0.12, 330);
      this.tyy = ease(this.tyy || 0, this.my * 0.05, 330);
      // A slow idle orbit only needs a third of the frames; anything else draws every frame.
      const settled = this.L === this.B && this.S === this.Sold && this.C === this.cladTarget() && this.crane === this.craneT && this.G === crownT && Math.abs(this.tx - this.mx * 0.12) <= 0.001;
      this.tick = ((this.tick || 0) + 1) % 3;
      if (!(settled && this.o.orbit && this.tick) || this.dirty) this.draw();
      this.dirty = false;
      const moving = !settled || (!reduce && this.o.orbit);
      if (moving && this.visible) this.kick();
    }

    camera() {
      const th = this.theta + (this.tx || 0), ph = this.phi + (this.tyy || 0);
      // A shift lens, as architectural photographers use: the camera stays level so verticals stay
      // vertical, and the frame slides to put the target where a tilted camera would have put it.
      const d = this.o.dist, ey = Math.max(0.8, this.o.ty - d * Math.sin(ph)), f = Math.min(this.w * 1.15, this.h) * this.o.scale;
      this.k = { c: Math.cos(th), s: Math.sin(th), f, ey, cx: this.w / 2 + this.o.offsetX * this.w, cy: this.h / 2 + (f * (this.o.ty - ey)) / d };
      // camera position in world space, for shading and draw order
      const k = this.k;
      this.eye = [-d * k.s, ey, -d * k.c];
    }

    // world -> screen
    P(x, y, z) {
      const k = this.k;
      const X = k.c * x - k.s * z, Z = k.s * x + k.c * z + this.o.dist, Y = y - k.ey;
      return [k.cx + (k.f * X) / Z, k.cy - (k.f * Y) / Z, Z];
    }

    draw() {
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
      g.fillStyle = `rgba(${sr},${sg},${sb},0.95)`; g.font = '500 10px Jost, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'top';
      g.fillText('STRUCTURE  ×1.7', L.x, L.y + L.r + 16);
    }

    scene(inLens) {
      if (!inLens) this.camera();
      const g = this.ctx, w = this.w, h = this.h, dark = this.dark;
      if (!inLens) g.clearRect(0, 0, w, h);
      const [lr, lg, lb] = this.line, [sr, sg, sb] = this.sold, [br, bgg, bb] = this.bg;
      const ink = (a) => `rgba(${lr},${lg},${lb},${a})`;
      const bronze = (a, k = 1) => `rgba(${Math.round(sr * k)},${Math.round(sg * k)},${Math.round(sb * k)},${a})`;
      const Q = 96, cache = this._cc || (this._cc = new Map());
      const memo = (key, fn) => { let v = cache.get(key); if (!v) { v = fn(); cache.set(key, v); } return v; };
      const mix = (t) => { const q = Math.round(clamp(t, 0, 1) * Q); return memo(q, () => { t = q / Q; return `rgb(${Math.round(br + (lr - br) * t)},${Math.round(bgg + (lg - bgg) * t)},${Math.round(bb + (lb - bb) * t)})`; }); };
      const mixS = (t0, l0) => { const q = Math.round(clamp(t0, 0, 1) * Q), ql = Math.round(clamp(l0, 0, 1) * 32); return memo(1000 + q * 40 + ql, () => { const t = q / Q, lift = ql / 32; const r = br + (sr - br) * t, gg = bgg + (sg - bgg) * t, b = bb + (sb - bb) * t; return `rgb(${Math.round(r + (255 - r) * lift)},${Math.round(gg + (255 - gg) * lift)},${Math.round(b + (255 - b) * lift)})`; }); };
      const seg = (a, b) => { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); };
      let batch = null;
      const queue = (q, col) => { let a = batch.get(col); if (!a) batch.set(col, (a = [])); a.push(q); };
      const flush = () => { for (const [col, qs] of batch) { g.beginPath(); for (const q of qs) { g.moveTo(q[0][0], q[0][1]); for (let j = 1; j < q.length; j++) g.lineTo(q[j][0], q[j][1]); g.closePath(); } g.fillStyle = col; g.fill(); } batch.clear(); };
      batch = new Map();
      const poly = (ps) => { g.beginPath(); ps.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); };
      const eye = this.eye, L = this.L, C = this.C, S = this.S;
      const sun = this.o.sun || this.sunNow.v, sunH = Math.hypot(sun[0], sun[2]), night = dark ? (this.o.sun ? 0.5 : this.sunNow.night) : 0;
      const now = performance.now();

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
          for (const x of [-20, -15, 15, 20, 25, -25]) { const z = -9.2; for (let i = 0; i <= 20; i++) { const a = TAU * i / 20, q = this.P(x + Math.cos(a) * 0.9, 0, z + Math.sin(a) * 0.9); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); } }
          g.stroke();
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
        const sh = [], sy = Math.max(sun[1], 0.42), dx = -sun[0] / sy, dz = -sun[2] / sy;
        const add = (pl, y) => pl.forEach((p) => sh.push([p.x + dx * y, p.z + dz * y]));
        add(PLANS[0].slab, 0); add(PLANS[0].slab, Math.min(L, PODIUM));
        if (L > PODIUM) { add(PLANS[Math.min(FLOORS - 1, Math.floor(L))].slab, L); add(PLANS[PODIUM].slab, PODIUM); }
        poly(hull(sh).map(([x, z]) => this.P(x, 0, z)));
        g.fillStyle = dark ? 'rgba(0,0,0,0.32)' : ink(0.07); g.fill();
        // and hatched, the way a sun study is drawn: the shadow's length and bearing are this minute's
        if (this.sunNow.el > 0 && !this.o.sun) {
          g.save(); g.clip(); g.beginPath(); g.strokeStyle = dark ? bronze(0.22) : ink(0.16); g.lineWidth = 0.6;
          for (let x = -h; x < w; x += 5) { g.moveTo(x, h); g.lineTo(x + h, 0); }
          g.stroke(); g.restore();
        }
        // contact shadow: the ground darkens where the building meets it
        for (const o of [1.1, 0.6, 0.25]) {
          poly(PLANS[0].slab.map((p) => this.P(p.x + p.nx * o, 0, p.z + p.nz * o)));
          g.fillStyle = dark ? 'rgba(0,0,0,0.16)' : ink(0.035); g.fill();
        }
      }

      const towerZ = this.P(0, this.eye[1], 0)[2], palmsBack = [], palmsFront = [], figs = [];
      if (this.o.palms !== false && this.o.grid) PALMS.forEach((p) => (this.P(p[0], 2, p[1])[2] > towerZ ? palmsBack : palmsFront).push(p));
      if (this.o.palms !== false && this.o.grid && L > PODIUM) FIGS.forEach((f) => figs.push(f));
      palmsBack.forEach((p) => this.drawPalm(p));

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
      if (this.o.footprint && !this.o.envelope && L < 0.01) {
        g.setLineDash([3, 4]); g.lineWidth = 1; g.strokeStyle = ink(dark ? 0.6 : 0.62);
        for (const pl of [PLANS[0].slab, PLANS[PODIUM].glass]) { poly(pl.map((p) => this.P(p.x, 0.01, p.z))); g.stroke(); }
        g.setLineDash([]);
      }
      // Floors not yet built: the dashed first sketch
      if (this.o.envelope && L < FLOORS) {
        g.setLineDash([3, 4]); g.lineWidth = 0.8; g.strokeStyle = ink(dark ? 0.4 : 0.38); g.beginPath();
        const from = Math.ceil(L - 0.001);
        for (let k = from; k <= FLOORS; k++) {
          const pl = slabPlan(k), ps = pl.map((p) => this.P(p.x, k, p.z));
          ps.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
        }
        for (let k = Math.max(0, from - 1); k < FLOORS; k++) {
          const pl = PLANS[k].glass;
          for (let j = 0; j < pl.length; j += 4) seg(this.P(pl[j].x, Math.max(k, L), pl[j].z), this.P(pl[j].x, k + 1, pl[j].z));
        }
        g.stroke(); g.setLineDash([]);
      }

      // Everything that stands is drawn in horizontal layers, farthest from eye level first.
      const layers = [];
      const coreTop = L > 0.01 && C < FLOORS - 0.01 ? Math.min(FLOORS, L + 1.5) : 0;
      for (let k = 0; k <= FLOORS; k++) {
        if (L > 0.01 && k <= L + 0.001) layers.push({ lo: k, hi: k + SLAB, kind: 'slab', k });
        if (k < FLOORS && (k < L || k < coreTop)) layers.push({ lo: k + SLAB, hi: k + 1, kind: 'floor', k });
      }
      const crownH = SLAB + (2.2 - SLAB) * (this.G || 0);
      if (L >= FLOORS - 0.001 && this.G > 0.01) layers.push({ lo: FLOORS + SLAB, hi: FLOORS + crownH, kind: 'crown' });
      const ey = eye[1];
      const far = (l) => (l.lo > ey ? l.lo - ey : ey > l.hi ? ey - l.hi : 0);
      layers.forEach((l) => { l.f = far(l); });
      // Glass balustrades stand in front of their floor whichever way it is seen.
      if (this.o.rails !== false) for (let k = PODIUM; k < CROWN; k++) if (k <= L - 1) {
        const f = Math.min(far({ lo: k, hi: k + SLAB }), far({ lo: k + SLAB, hi: k + 1 })) - 0.0001;
        layers.push({ kind: 'rail', k, f });
      }
      if (L >= 1.2) layers.push({ kind: 'canopy', f: far({ lo: 1, hi: 1 + SLAB }) - 0.00005 });
      layers.sort((a, b) => b.f - a.f);

      // Crane sits behind or in front of the tower depending on the view.
      const craneOn = this.o.crane && this.crane > 0.01;
      const craneBehind = this.P(MAST[0], ey, MAST[1])[2] > this.P(0, ey, 0)[2];
      if (craneOn && craneBehind) this.drawCrane();

      const edge = dark ? `rgba(${br},${bgg},${bb},0.55)` : ink(0.72);
      const view = (x, y, z) => { const vx = eye[0] - x, vy = eye[1] - y, vz = eye[2] - z, n = Math.hypot(vx, vy, vz); return [vx / n, vy / n, vz / n]; };

      // a vertical band of quads between two rings at heights y0, y1
      const band = (pl, y0, y1, shade, strokeTop) => {
        const n = pl.length, bot = pl.map((p) => this.P(p.x, y0, p.z)), top = pl.map((p) => this.P(p.x, y1, p.z));
        const lines = [];
        for (let j = 0; j < n; j++) {
          const j2 = (j + 1) % n, q = [bot[j], bot[j2], top[j2], top[j]];
          const area = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
          if (area >= 0) continue;
          const a = pl[j], b = pl[j2], nx = (a.nx + b.nx) / 2, nz = (a.nz + b.nz) / 2;
          queue(q, shade(nx, nz, j, n, (a.x + b.x) / 2, (a.z + b.z) / 2));
          if (strokeTop) lines.push(j);
        }
        flush();
        return { bot, top, lines };
      };
      const cap = (pl, y) => pl.map((p) => this.P(p.x, y, p.z));

      for (const l of layers) {
        if (this.xray && l.kind !== 'floor') {
          // inside the loupe, slabs are drawn as their edge lines only, in the drawing set's bronze
          if (l.kind === 'slab') { g.strokeStyle = bronze(0.75); g.lineWidth = 0.7; poly(cap(slabPlan(l.k), l.k + SLAB)); g.stroke(); }
          continue;
        }
        if (l.kind === 'slab') {
          const k = l.k, pl = slabPlan(k), top = ey > l.hi;
          const y0 = k, y1 = k + SLAB;
          const shadeSlab = (nx, nz) => { const d = Math.max(0, (nx * sun[0] + nz * sun[2]) / sunH); return mix(dark ? (0.48 + 0.36 * d) * (1 - 0.3 * night) : 0.05 + 0.1 * (1 - d)); };
          const b = band(pl, y0, y1, shadeSlab, true);
          const capPts = cap(pl, top ? y1 : y0);
          poly(capPts); g.fillStyle = mix(dark ? (top ? 0.86 : 0.5) : (top ? 0.03 : 0.16)); g.fill();
          g.beginPath(); g.strokeStyle = edge; g.lineWidth = 0.7;
          for (const j of b.lines) { const j2 = (j + 1) % pl.length; seg(b.bot[j], b.bot[j2]); if (!dark) seg(b.top[j], b.top[j2]); }
          g.stroke();
          if (dark) { g.beginPath(); g.strokeStyle = ink(0.95); g.lineWidth = 0.6; for (const j of b.lines) { const j2 = (j + 1) % pl.length; seg(b.top[j], b.top[j2]); } g.stroke(); }
          // a pool on the podium terrace
          if (k === PODIUM && top) {
            poly([[4.7, -3.1], [6.0, -3.1], [6.0, 3.1], [4.7, 3.1]].map(([x, z]) => this.P(x, y1 + 0.001, z)));
            g.fillStyle = bronze(dark ? 0.3 : 0.22); g.fill(); g.strokeStyle = bronze(0.85); g.lineWidth = 0.7; g.stroke();
          }
        } else if (l.kind === 'floor') {
          const k = l.k, pl = PLANS[k].glass, y0 = l.lo, built = clamp(L - k, 0, 1), y1 = k + SLAB + (1 - SLAB) * built;
          const glassF = clamp(C - k, 0, 1), soldF = clamp(S - k, 0, 1), hgt = k / FLOORS;
          // the open frame: columns behind the core, the core, then columns in front
          const coreH = k < coreTop ? Math.min(k + 1, coreTop) : 0;
          if (glassF < 1) {
            const cols = [], core = CORE[k], cz = this.P(0, (y0 + y1) / 2, 0)[2];
            if (built > 0) for (let j = 0; j < pl.length; j += 2) { const p = pl[j], a = this.P(p.x * 0.97, y0, p.z * 0.97), b = this.P(p.x * 0.97, y1, p.z * 0.97); cols.push([a, b, a[2] > cz]); }
            const drawCols = (back) => { g.beginPath(); g.strokeStyle = this.xray ? bronze(0.9) : ink(dark ? 0.55 : 0.6); g.lineWidth = this.xray ? 0.8 : 1.1; cols.forEach(([a, b, bk]) => { if (bk === back) seg(a, b); }); g.stroke(); };
            drawCols(true);
            if (coreH > y0) {
              band(core, y0, coreH, (nx, nz) => mix(dark ? 0.32 + 0.22 * Math.max(0, (nx * sun[0] + nz * sun[2]) / sunH) : 0.22 - 0.1 * Math.max(0, (nx * sun[0] + nz * sun[2]) / sunH)), false);
              if (ey > coreH) { poly(cap(core, coreH)); g.fillStyle = mix(dark ? 0.5 : 0.12); g.fill(); }
            }
            drawCols(false);
          }
          if (glassF > 0 && built > 0) {
            // glass curtain wall, installed panel by panel around the floor
            const n = pl.length, lim = Math.round(glassF * n);
            const shade = (nx, nz, j, nn, mx, mz) => {
              if (j >= lim) return null;
              const v = view(mx, (y0 + y1) / 2, mz);
              const diff = Math.max(0, (nx * sun[0] + nz * sun[2]) / sunH);
              const fres = 1 - Math.abs(nx * v[0] + nz * v[2]);
              const hx = sun[0] + v[0], hz = sun[2] + v[2], hn = Math.hypot(hx, hz) || 1;
              // a tight highlight, and none at all once the sun is down
              const spec = Math.pow(Math.max(0, (nx * hx + nz * hz) / hn), 36) * (1 - night), day = 1 - 0.85 * night;
              if (j / nn < soldF) return mixS(dark ? 0.46 + 0.3 * diff * day : 0.62 + 0.3 * diff, 0.18 * spec + 0.06 * fres);
              // a few rooms lit from inside, warm, and more of them after dark
              if (dark && hash(k, j) < 0.05 + 0.07 * night) return night > 0.3 ? mixS(0.42 + 0.16 * hash(j, k, 3), 0.06) : mix(0.26 + 0.16 * hash(j, k, 3));
              return dark ? mix(0.06 + (0.1 * diff + 0.22 * spec) * day + 0.09 * fres + 0.07 * hgt) : mix(0.66 - 0.2 * diff - 0.08 * fres - 0.1 * hgt - 0.25 * spec);
            };
            const bot = pl.map((p) => this.P(p.x, y0, p.z)), top = pl.map((p) => this.P(p.x, y1, p.z));
            const mull = [], shadowed = [];
            for (let j = 0; j < n; j++) {
              const j2 = (j + 1) % n, q = [bot[j], bot[j2], top[j2], top[j]];
              const area = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
              if (area >= 0) continue;
              const a = pl[j], b = pl[j2], col = shade((a.nx + b.nx) / 2, (a.nz + b.nz) / 2, j, n, (a.x + b.x) / 2, (a.z + b.z) / 2);
              if (!col) continue;
              queue(q, col);
              if (built >= 1) shadowed.push(j);
              mull.push([bot[j], top[j]]);
              const len = Math.hypot(b.x - a.x, b.z - a.z);
              if (len > 1.6) { const m = Math.round(len / 1.1); for (let t = 1; t < m; t++) { const u = t / m; mull.push([[bot[j][0] + (bot[j2][0] - bot[j][0]) * u, bot[j][1] + (bot[j2][1] - bot[j][1]) * u], [top[j][0] + (top[j2][0] - top[j][0]) * u, top[j][1] + (top[j2][1] - top[j][1]) * u]]); } }
            }
            flush();
            g.beginPath(); g.strokeStyle = dark ? ink(0.16) : `rgba(${br},${bgg},${bb},0.22)`; g.lineWidth = 0.6;
            mull.forEach(([a, b]) => seg(a, b)); g.stroke();
            // the shadow each slab casts on the glass just below it
            if (shadowed.length) {
              const px = Math.abs(top[0][1] - bot[0][1]) * 0.16;
              g.beginPath(); g.strokeStyle = dark ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.2)'; g.lineWidth = px;
              for (const j of shadowed) { const j2 = (j + 1) % n; g.moveTo(top[j][0], top[j][1] + px / 2); g.lineTo(top[j2][0], top[j2][1] + px / 2); }
              g.stroke();
            }
          }
        } else if (l.kind === 'rail') {
          // a glass balustrade along the balcony edge
          const k = l.k, y0 = k + SLAB, y1 = y0 + 0.3;
          const pl = slabPlan(k).map((p) => ({ x: p.x - p.nx * 0.05, z: p.z - p.nz * 0.05, nx: p.nx, nz: p.nz }));
          const b = band(pl, y0, y1, () => (dark ? 'rgba(244,240,232,0.08)' : 'rgba(20,22,26,0.06)'), true);
          g.beginPath(); g.strokeStyle = ink(dark ? 0.42 : 0.42); g.lineWidth = 0.55;
          for (const j of b.lines) seg(b.top[j], b.top[(j + 1) % pl.length]);
          g.stroke();
        } else if (l.kind === 'canopy') {
          // porte-cochère: two slender columns and a thin floating roof
          g.beginPath(); g.strokeStyle = ink(dark ? 0.7 : 0.7); g.lineWidth = 1.2;
          for (const x of [-2.2, 2.2]) seg(this.P(x, 0, -5.85), this.P(x, 1, -5.85));
          g.stroke();
          const b = band(CANOPY, 1, 1.1, (nx, nz) => mix(dark ? 0.7 + 0.2 * Math.max(0, (nx * sun[0] + nz * sun[2]) / sunH) : 0.12), true);
          poly(cap(CANOPY, ey > 1.1 ? 1.1 : 1)); g.fillStyle = mix(dark ? (ey > 1.1 ? 0.88 : 0.45) : (ey > 1.1 ? 0.03 : 0.2)); g.fill();
          g.beginPath(); g.strokeStyle = edge; g.lineWidth = 0.6; for (const j of b.lines) { const j2 = (j + 1) % CANOPY.length; seg(b.bot[j], b.bot[j2]); } g.stroke();
        } else if (l.kind === 'crown') {
          // an open frame of fins over the roof
          const pl = PLANS[FLOORS - 1].glass, y0 = FLOORS + SLAB, y1 = FLOORS + crownH;
          g.beginPath(); g.strokeStyle = ink(dark ? 0.6 : 0.62); g.lineWidth = 0.8;
          pl.forEach((p) => seg(this.P(p.x, y0, p.z), this.P(p.x, y1, p.z)));
          const ring = pl.map((p) => this.P(p.x, y1, p.z)); ring.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
          g.stroke();
          if (this.G > 0.98) this.beacon(this.P(0, y1 + 0.5, 0), now, dark);
        }
      }

      // Profile line: the outline of the finished building, drawn heavier than anything inside it
      const clad = Math.min(Math.floor(C + 0.001), FLOORS);
      if (clad >= 1) {
        const left = [], right = [];
        const ext = (pl, y) => { let lo = null, hi = null; for (const p of pl) { const q = this.P(p.x, y, p.z); if (!lo || q[0] < lo[0]) lo = q; if (!hi || q[0] > hi[0]) hi = q; } left.push(lo); right.push(hi); };
        for (let k = 0; k < clad; k++) { ext(slabPlan(k), k); ext(slabPlan(k), k + SLAB); ext(PLANS[k].glass, k + SLAB); ext(PLANS[k].glass, k + 1); }
        ext(slabPlan(clad), clad); ext(slabPlan(clad), clad + SLAB);
        g.strokeStyle = dark ? ink(0.62) : ink(w < 600 ? 0.72 : 0.88); g.lineWidth = w < 600 ? 1 : 1.3; g.lineJoin = 'round'; g.beginPath();
        for (const side of [left, right]) side.forEach((q, j) => (j ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])));
        g.stroke(); g.lineJoin = 'miter';
      }

      if (craneOn && !craneBehind) this.drawCrane();
      palmsFront.forEach((p) => this.drawPalm(p));
      figs.forEach((f) => this.drawFigure(f));
      if (this.o.reflect && !inLens && L > 0.5) this.reflect(now);

      // Dimension line with level ticks
      if (!this.o.envelope && L < 0.01) return;
      // kept on the viewer's left of the tower whatever the angle
      const kc = this.k.c, ks = this.k.s, at = (X) => [kc * X, -ks * X];
      const [ax, az] = at(-10), [tx, tz] = at(-10.7), [lx, lz] = at(-11.9);
      const d0 = this.P(ax, 0, az), d1 = this.P(ax, FLOORS, az);
      g.strokeStyle = bronze(0.7); g.lineWidth = 0.8; g.beginPath(); seg(d0, d1);
      for (let i = 0; i <= FLOORS; i += 5) { const p = this.P(ax, i, az), q = this.P(tx, i, tz); seg(p, q); }
      seg(this.P(ax, FLOORS, az), this.P(tx, FLOORS, tz));
      g.stroke();
      // a short tick at every level between the numbered ones
      g.strokeStyle = bronze(0.4); g.lineWidth = 0.6; g.beginPath();
      for (let i = 1; i < FLOORS; i++) if (i % 5) { const p = this.P(ax, i, az), q = this.P(ax + (tx - ax) * 0.5, i, az + (tz - az) * 0.5); seg(p, q); }
      g.stroke();
      if (this.o.labels && w > 280) {
        g.fillStyle = this.dark ? 'rgb(201,168,119)' : 'rgb(122,95,58)'; g.font = '500 ' + this.o.labelSize + 'px Jost, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle';
        for (let i = 0; i <= FLOORS; i += 5) { const p = this.P(lx, i, lz), t = 'L' + String(i).padStart(2, '0'); g.fillText(t, Math.max(p[0], g.measureText(t).width + 4), p[1]); }
        const r = this.P(lx, FLOORS, lz), d20 = this.P(lx, 20, lz);
        if (Math.abs(r[1] - d20[1]) > this.o.labelSize * 1.4) g.fillText('ROOF', Math.max(r[0], g.measureText('ROOF').width + 4), r[1]);
      }
    }

    // The tower mirrored in the bay, broken into slow ripples; the water is ruled in faint lines.
    reflect(now) {
      const g = this.ctx, d = this.dpr || 1;
      let x0 = 1e9, x1 = -1e9, yb = -1e9, yt = 1e9;
      for (const p of PLANS[0].slab) { const a = this.P(p.x * 1.15, 0, p.z * 1.15), b = this.P(p.x, FLOORS + 2.6, p.z); x0 = Math.min(x0, a[0], b[0]); x1 = Math.max(x1, a[0], b[0]); yb = Math.max(yb, a[1]); yt = Math.min(yt, b[1]); }
      x0 = Math.max(0, Math.floor(x0 - 12)); x1 = Math.min(this.w, Math.ceil(x1 + 12));
      const H = Math.min(yb - yt, this.h - yb - 4), step = this.w < 600 ? 3 : 2;
      if (H < 20 || x1 <= x0) return;
      g.save();
      for (let r = 0; r < H; r += step) {
        const t = r / H, off = reduce ? 0 : Math.sin(r * 0.19 + now / 650) * (0.6 + t * 5) + Math.sin(r * 0.053 - now / 1300) * t * 3;
        g.globalAlpha = 0.38 * Math.pow(1 - t, 1.5);
        g.drawImage(this.c, x0 * d, (yb - r - step) * d, (x1 - x0) * d, step * d, x0 + off, yb + r, x1 - x0, step);
      }
      g.globalAlpha = 1;
      const [lr, lg, lb] = this.line;
      g.strokeStyle = `rgba(${lr},${lg},${lb},0.07)`; g.lineWidth = 0.6; g.beginPath();
      for (let i = 1; i < 9; i++) { const y = yb + i * i * 3.2, ph = reduce ? 0 : now / 3000 + i; for (let x = x0 - 40 + ((i * 37) % 23); x < x1 + 40; x += 34 + (i % 3) * 9) { const dx = Math.sin(ph + x * 0.01) * 4; g.moveTo(x + dx, y); g.lineTo(x + dx + 14 + (i % 4) * 4, y); } }
      g.stroke(); g.restore();
    }

    // The aviation light on the roof, breathing slowly.
    beacon(p, now, dark) {
      const g = this.ctx, [sr, sg, sb] = this.sold, a = reduce ? 0.8 : 0.55 + 0.45 * Math.sin(now / 900);
      const r = Math.max(2.5, this.k.f / this.o.dist * 0.35);
      if (!dark) { g.fillStyle = `rgba(${sr},${sg},${sb},0.9)`; g.beginPath(); g.arc(p[0], p[1], 1.5, 0, TAU); g.fill(); return; }
      const gr = g.createRadialGradient(p[0], p[1], 0, p[0], p[1], r * 3);
      gr.addColorStop(0, `rgba(${sr},${sg},${sb},${0.55 * a})`); gr.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
      g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], r * 3, 0, TAU); g.fill();
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

    // A luffing tower crane in bronze linework; the jib slews as the floors go up.
    drawCrane() {
      const g = this.ctx, [sr, sg, sb] = this.line, a = (this.dark ? 0.5 : 0.55) * this.crane;
      const seg = (p, q) => { g.moveTo(p[0], p[1]); g.lineTo(q[0], q[1]); };
      const [mx, mz] = MAST, s = 0.42, top = Math.max(7, this.L + 3.2);
      const P = (x, y, z) => this.P(mx + x, y, mz + z);
      g.strokeStyle = `rgba(${sr},${sg},${sb},${a})`; g.lineWidth = 0.6; g.beginPath();
      const cs = [[-s, -s], [s, -s], [s, s], [-s, s]];
      cs.forEach(([x, z]) => seg(P(x, 0, z), P(x, top, z)));
      for (let y = 0; y < top - 0.01; y += 1.1) {
        const y2 = Math.min(top, y + 1.1);
        for (let q = 0; q < 4; q++) { const [x0, z0] = cs[q], [x1, z1] = cs[(q + 1) % 4]; seg(P(x0, y, z0), P(x1, y2, z1)); seg(P(x0, y2, z0), P(x1, y2, z1)); }
      }
      g.stroke();
      // slewing jib, counter-jib, A-frame head and pendants
      const ang = Math.atan2(-mz, -mx) + 0.55 * Math.sin(this.L * 0.38), ca = Math.cos(ang), sa = Math.sin(ang);
      const J = (d, y, w = 0) => P(ca * d - sa * w, y, sa * d + ca * w);
      g.beginPath();
      const JL = 12;
      seg(J(-4.6, top, -0.3), J(JL, top, -0.3)); seg(J(-4.6, top, 0.3), J(JL, top, 0.3));
      seg(J(0, top + 0.7, 0), J(JL, top, 0));
      for (let d = 0; d < JL; d += 1.5) { seg(J(d, top, -0.3), J(d + 0.75, top + 0.7 * (1 - (d + 0.75) / JL), 0)); seg(J(d + 0.75, top + 0.7 * (1 - (d + 0.75) / JL), 0), J(d + 1.5, top, 0.3)); }
      seg(J(0, top, -0.35), J(0, top + 3, 0)); seg(J(0, top, 0.35), J(0, top + 3, 0));
      seg(J(0, top + 3, 0), J(8, top + 0.4, 0)); seg(J(0, top + 3, 0), J(-4.4, top, 0));
      // trolley, hook and a load on its way up
      const tr = 5.5 + 2.5 * Math.sin(this.L * 0.9), hy = Math.max(1, top - 5 - 2 * Math.cos(this.L * 0.7));
      seg(J(tr, top, 0), J(tr, hy, 0));
      g.stroke();
      g.fillStyle = `rgba(${sr},${sg},${sb},${a})`;
      const box = (d, y, w, hh, dd) => { const q = [J(d - dd, y, -w), J(d + dd, y, -w), J(d + dd, y + hh, -w), J(d - dd, y + hh, -w)]; g.beginPath(); q.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fill(); };
      box(-3.9, top - 0.7, 0.3, 0.7, 0.55); // counterweight
      box(tr, hy - 0.6, 0.3, 0.6, 0.6); // load
      box(0.9, top - 0.75, 0.3, 0.75, 0.45); // cab
    }
  }

  window.CentamontModel = Model;
})();
