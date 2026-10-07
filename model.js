// Centamont tower model: a line-drawn 3D massing study rendered on canvas.
// It is an illustration of a generic tower, never a real project.
(function () {
  const FLOORS = 22;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Massing: podium, shaft, setback, crown. [x0, x1, z0, z1] per floor.
  function plate(i) {
    if (i < 3) return [-6.4, 6.4, -4.4, 4.4];
    if (i < 19) return [-3.6, 3.6, -3, 3];
    return [-3, 3, -2.5, 2.5];
  }

  function rgb(hex) {
    const h = hex.trim().replace('#', '');
    const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  class Model {
    constructor(canvas, opts) {
      this.c = canvas;
      this.ctx = canvas.getContext('2d');
      this.o = Object.assign({ orbit: 0, theta: -0.62, phi: 0.2, dist: 52, ty: 11.5, scale: 1.05, offsetX: 0, crane: true, grid: true, labels: false, labelSize: 11, envelope: true }, opts);
      this.theta = this.o.theta;
      this.phi = this.o.phi;
      this.L = 0; this.S = 0; // animated built and sold levels
      this.B = 0; this.Sold = 0; // targets
      this.crane = 0; this.craneT = 0;
      this.mx = 0; this.my = 0;
      this.visible = true;
      this.colors();
      this.size();
      new ResizeObserver(() => { this.size(); this.touch(); }).observe(canvas);
      new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; if (this.visible) this.kick(); }).observe(canvas);
    }

    colors() {
      const cs = getComputedStyle(this.c);
      this.line = rgb(cs.getPropertyValue('--line') || '#14161A');
      this.sold = rgb(cs.getPropertyValue('--sold') || '#B8976A');
      this.touch();
    }

    size() {
      const r = this.c.getBoundingClientRect();
      const d = Math.min(devicePixelRatio || 1, 2);
      this.w = r.width; this.h = r.height;
      this.c.width = Math.max(1, Math.round(r.width * d));
      this.c.height = Math.max(1, Math.round(r.height * d));
      this.ctx.setTransform(d, 0, 0, d, 0, 0);
    }

    set(built, sold, crane, instant) {
      this.B = built; this.Sold = sold; this.craneT = crane ? 1 : 0;
      this.c.dataset.built = built; this.c.dataset.sold = sold;
      if (instant || reduce) { this.L = built; this.S = sold; this.crane = this.craneT; }
      this.kick();
    }

    pointer(x, y) { this.mx = x; this.my = y; this.kick(); }

    // Force a full redraw on the next frame (camera moves, colors, size).
    touch() { this.dirty = true; this.kick(); }

    kick() {
      if (this.raf || !this.w) return;
      this.raf = requestAnimationFrame(() => { this.raf = 0; this.frame(); });
    }

    frame() {
      const ease = (a, b, k) => (Math.abs(b - a) < 0.002 ? b : a + (b - a) * k);
      this.L = ease(this.L, this.B, 0.045);
      this.S = ease(this.S, this.Sold, 0.05);
      this.crane = ease(this.crane, this.craneT, 0.06);
      if (!reduce && this.o.orbit) this.theta += this.o.orbit;
      this.tx = ease(this.tx || 0, this.mx * 0.12, 0.05);
      this.tyy = ease(this.tyy || 0, this.my * 0.05, 0.05);
      // A slow idle orbit only needs half the frames; anything else draws every frame.
      const settled = this.L === this.B && this.S === this.Sold && this.crane === this.craneT && Math.abs(this.tx - this.mx * 0.12) <= 0.001;
      this.odd = !this.odd;
      if (!(settled && this.o.orbit && this.odd) || this.dirty) this.draw();
      this.dirty = false;
      const moving = !settled || (!reduce && this.o.orbit);
      if (moving && this.visible) this.kick();
    }

    // world -> screen
    P(x, y, z) {
      const th = this.theta + (this.tx || 0), ph = this.phi + (this.tyy || 0);
      y -= this.o.ty;
      const c = Math.cos(th), s = Math.sin(th);
      let X = c * x - s * z, Z = s * x + c * z;
      const cp = Math.cos(ph), sp = Math.sin(ph);
      const Y = cp * y - sp * Z; Z = sp * y + cp * Z + this.o.dist;
      const f = Math.min(this.w * 1.15, this.h) * this.o.scale;
      return [this.w / 2 + this.o.offsetX * this.w + (f * X) / Z, this.h / 2 - (f * Y) / Z, Z];
    }

    draw() {
      const g = this.ctx, w = this.w, h = this.h;
      g.clearRect(0, 0, w, h);
      const [lr, lg, lb] = this.line, [sr, sg, sb] = this.sold;
      const ink = (a) => `rgba(${lr},${lg},${lb},${a})`;
      const bronze = (a, k = 1) => `rgba(${Math.round(sr * k)},${Math.round(sg * k)},${Math.round(sb * k)},${a})`;
      const seg = (a, b) => { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); };

      // Site grid on the ground plane
      if (this.o.grid) {
        g.lineWidth = 1;
        for (let i = -30; i <= 30; i += 3) {
          const fade = 1 - Math.abs(i) / 34;
          g.strokeStyle = ink(0.07 * fade);
          g.beginPath(); seg(this.P(i, 0, -30), this.P(i, 0, 30)); seg(this.P(-30, 0, i), this.P(30, 0, i)); g.stroke();
        }
        g.setLineDash([4, 5]); g.strokeStyle = bronze(0.55);
        g.beginPath();
        const site = [[-9, -7], [9, -7], [9, 7], [-9, 7], [-9, -7]].map(([x, z]) => this.P(x, 0, z));
        site.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])));
        g.stroke(); g.setLineDash([]);
      }

      // Envelope of floors not yet built: a dashed first sketch
      g.setLineDash([3, 4]); g.lineWidth = 0.9; g.strokeStyle = ink(0.42);
      g.beginPath();
      for (let i = Math.floor(this.L); this.o.envelope && i < FLOORS; i++) {
        const [x0, x1, z0, z1] = plate(i), y0 = i, y1 = i + 1;
        const c = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
        for (let k = 0; k < 4; k++) {
          const a = c[k], b = c[(k + 1) % 4];
          seg(this.P(a[0], y1, a[1]), this.P(b[0], y1, b[1]));
          if (i === 0 || plate(i - 1)[0] !== x0) seg(this.P(a[0], y0, a[1]), this.P(b[0], y0, b[1]));
          seg(this.P(a[0], y0, a[1]), this.P(a[0], y1, a[1]));
        }
      }
      g.stroke(); g.setLineDash([]);

      // Built floors as shaded faces, drawn far to near
      const light = [-0.55, 0.45, -0.7];
      const faces = [];
      for (let i = 0; i < FLOORS; i++) {
        const b = Math.max(0, Math.min(1, this.L - i));
        if (!b) continue;
        const sold = Math.max(0, Math.min(1, this.S - i));
        const [x0, x1, z0, z1] = plate(i), y0 = i, y1 = i + b;
        const sides = [
          [[x0, z1], [x1, z1], [0, 1]], [[x1, z1], [x1, z0], [1, 0]],
          [[x1, z0], [x0, z0], [0, -1]], [[x0, z0], [x0, z1], [-1, 0]],
        ];
        for (const [a, c, n] of sides) {
          const q = [this.P(a[0], y0, a[1]), this.P(c[0], y0, c[1]), this.P(c[0], y1, c[1]), this.P(a[0], y1, a[1])];
          const area = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
          if (area <= 0) continue;
          const lam = Math.max(0, n[0] * light[0] + n[1] * light[2]);
          faces.push({ q, z: (q[0][2] + q[2][2]) / 2, lam, sold, b, a, c, y0, y1, i });
        }
        const nextBuilt = i + 1 < FLOORS && this.L - (i + 1) > 0;
        if (b < 1 || !nextBuilt || plate(i + 1)[0] !== x0) {
          const q = [this.P(x0, y1, z0), this.P(x1, y1, z0), this.P(x1, y1, z1), this.P(x0, y1, z1)];
          faces.push({ q, z: (q[0][2] + q[2][2]) / 2 + 0.01, lam: 1, sold, b: 1, top: true });
        }
      }
      faces.sort((m, n) => n.z - m.z);
      for (const f of faces) {
        const k = f.top ? 1.08 : 0.62 + 0.42 * f.lam;
        g.beginPath(); f.q.forEach((p, j) => (j ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath();
        g.fillStyle = f.sold ? bronze(0.25 + 0.65 * f.sold, k) : ink(f.top ? 0.05 : 0.03 + 0.03 * f.lam);
        g.fill();
        g.strokeStyle = ink(0.8); g.lineWidth = 0.8; g.stroke();
        if (!f.top && f.b > 0.6) {
          // mullions
          const len = Math.hypot(f.c[0] - f.a[0], f.c[1] - f.a[1]), n = Math.max(2, Math.round(len / 1.3));
          g.beginPath(); g.strokeStyle = ink(f.sold ? 0.28 : 0.2); g.lineWidth = 0.6;
          for (let m = 1; m < n; m++) {
            const t = m / n, x = f.a[0] + (f.c[0] - f.a[0]) * t, z = f.a[1] + (f.c[1] - f.a[1]) * t;
            seg(this.P(x, f.y0 + 0.12, z), this.P(x, f.y1 - 0.12, z));
          }
          g.stroke();
        }
      }

      // Crown, once the structure tops off
      if (this.L >= FLOORS - 0.02) {
        g.beginPath(); g.strokeStyle = ink(0.8); g.lineWidth = 0.8;
        const cr = [[-2, -1.6], [2, -1.6], [2, 1.6], [-2, 1.6]];
        for (let k = 0; k < 4; k++) {
          const a = cr[k], b = cr[(k + 1) % 4];
          seg(this.P(a[0], FLOORS + 1.8, a[1]), this.P(b[0], FLOORS + 1.8, b[1]));
          seg(this.P(a[0], FLOORS, a[1]), this.P(a[0], FLOORS + 1.8, a[1]));
        }
        g.stroke();
      }

      // Tower crane while the structure rises
      if (this.o.crane && this.crane > 0.01) {
        const top = Math.max(6, this.L + 4);
        g.strokeStyle = bronze(0.75 * this.crane); g.lineWidth = 0.9; g.beginPath();
        seg(this.P(7.6, 0, -0.5), this.P(7.6, top, -0.5)); seg(this.P(8.4, 0, -0.5), this.P(8.4, top, -0.5));
        for (let y = 0; y < top - 1; y += 1.4) seg(this.P(7.6, y, -0.5), this.P(8.4, y + 1.4, -0.5));
        seg(this.P(-5, top, -0.5), this.P(13, top, -0.5)); seg(this.P(8, top + 2.4, -0.5), this.P(-3, top, -0.5)); seg(this.P(8, top + 2.4, -0.5), this.P(13, top, -0.5));
        seg(this.P(8, top, -0.5), this.P(8, top + 2.4, -0.5)); seg(this.P(0, top, -0.5), this.P(0, top - 3, -0.5));
        g.stroke();
      }

      // Dimension line with level ticks
      if (!this.o.envelope && this.L < 0.01) return;
      const d0 = this.P(-11, 0, 6), d1 = this.P(-11, FLOORS, 6);
      g.strokeStyle = bronze(0.7); g.lineWidth = 0.8; g.beginPath(); seg(d0, d1);
      for (let i = 0; i <= FLOORS; i += 5) { const p = this.P(-11, i, 6), q = this.P(-11.7, i, 6); seg(p, q); }
      g.stroke();
      if (this.o.labels && w > 280) {
        g.fillStyle = bronze(0.95); g.font = '500 ' + this.o.labelSize + 'px Jost, sans-serif'; g.textAlign = 'right'; g.textBaseline = 'middle';
        for (let i = 0; i <= FLOORS; i += 5) { const p = this.P(-13.2, i, 6); g.fillText('L' + String(i).padStart(2, '0'), p[0], p[1]); }
      }
    }
  }

  window.CentamontModel = Model;
})();
