// Centamont tower, rendered: the hero's tower in real light, drawn with WebGL2 into an offscreen canvas that the hero's
// drawing (model.js) lays into its own scene, between the ground it draws and the ruler and labels it draws over the
// tower. It is the same generic, illustrative tower as the drawing: the same plans, the same camera, the same sun over
// Miami, the same stacking plan (a sold residence's glass is bronze). Never a real project.
// model.js loads this file only once the page has loaded and gone quiet, and only where the device can afford it; until
// it is ready, and wherever it cannot run, the drawing stands in for it. It draws only when the drawing does (a change,
// a camera move, the slow orbit), only over the tower's own box, and redraws its shadows only when the sun or the
// building changes.
(function () {
  const TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (t) => t * t * (3 - 2 * t);
  const lin = (c) => c.map((v) => Math.pow(v / 255, 2.2));

  // ---------------------------------------------------------------- shaders
  // One vertex shader for every mesh. A vertex is shown while its threshold (a.x) is at or under the mesh's limit, so a
  // floor appears as the frame or the glass reaches it; uY lifts the crown as it goes up (base, scale, offset).
  const VS = `#version 300 es
layout(location=0) in vec3 aPos; layout(location=1) in vec3 aNrm; layout(location=2) in vec4 aA; layout(location=3) in vec4 aB;
uniform mat4 uVP; uniform float uLim; uniform vec3 uY;
out vec3 vPos; out vec3 vNrm; out vec4 vA; out vec4 vB;
void main() {
  vec3 p = aPos; p.y = uY.x + (p.y - uY.x) * uY.y + uY.z;
  vPos = p; vNrm = aNrm; vA = aA; vB = aB;
  gl_Position = aA.x <= uLim ? uVP * vec4(p, 1.0) : vec4(2.0, 2.0, 2.0, 1.0);
}`;
  const DEPTH_FS = `#version 300 es
precision mediump float; out vec4 o; void main() { o = vec4(1.0); }`;

  // Light, sky and tone, shared by every surface. Radiance is linear; tone() maps it for the screen.
  const COMMON = `#version 300 es
precision highp float; precision highp sampler2DShadow;
in vec3 vPos; in vec3 vNrm; in vec4 vA; in vec4 vB;
out vec4 o;
uniform vec3 uEye, uSun, uSunCol, uZen, uHor, uGrd, uLamp, uGold, uBronze;
uniform float uNight, uExp, uShOn, uOcc;
uniform mat4 uLS; uniform sampler2DShadow uShadow; uniform vec2 uTexel;
uniform sampler2D uRooms;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
// the sky over Miami at this hour, and the city's skyline standing round the horizon in it (what the glass reflects)
vec3 sky(vec3 d) {
  float y = d.y;
  if (y < 0.0) return uGrd * (0.6 + 0.4 * exp(y * 6.0));
  float az = atan(d.x, d.z), cell = floor(az * 14.0), hh = 0.012 + 0.075 * pow(h21(vec2(cell, 3.0)), 2.2);
  vec3 s = mix(uHor, uZen, pow(clamp(y, 0.0, 1.0), 0.55));
  float sd = max(dot(d, uSun), 0.0);
  s += uSunCol * (0.035 * pow(sd, 6.0) + 0.06 * pow(sd, 40.0));
  if (y < hh) {
    float w = fract(az * 260.0), f = fract(y * 420.0), lit = step(0.72, h21(vec2(floor(az * 260.0), floor(y * 420.0))));
    vec3 b = uHor * (0.32 + 0.18 * h21(vec2(cell, 9.0)));
    b += uLamp * uNight * 0.22 * lit * step(0.3, w) * step(0.35, f);
    return b;
  }
  return s;
}
// the sun's own glint, kept apart so a shadow can take it away
vec3 glint(vec3 r) { float sd = max(dot(r, uSun), 0.0); return uSunCol * (6.0 * pow(sd, 900.0) + 0.25 * pow(sd, 90.0)); }
vec3 amb(vec3 n) { return mix(uGrd * 0.9, mix(uHor, uZen, 0.55), 0.5 + 0.5 * n.y) * 0.62; }
float shadow(vec3 p, vec3 n) {
  if (uShOn < 0.5) return 1.0;
  vec4 q = uLS * vec4(p + n * 0.04, 1.0);
  vec3 s = q.xyz / q.w * 0.5 + 0.5;
  if (s.x < 0.0 || s.x > 1.0 || s.y < 0.0 || s.y > 1.0 || s.z > 1.0) return 1.0;
  s.z -= 0.0015;
  float v = texture(uShadow, s) * 2.0;
  v += texture(uShadow, s + vec3(uTexel.x, 0.0, 0.0)) + texture(uShadow, s - vec3(uTexel.x, 0.0, 0.0));
  v += texture(uShadow, s + vec3(0.0, uTexel.y, 0.0)) + texture(uShadow, s - vec3(0.0, uTexel.y, 0.0));
  return v / 6.0;
}
vec3 tone(vec3 c) {
  c *= uExp;
  c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
  return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
}
`;

  // Concrete, metal, water and leaves: a.y ambient occlusion, a.z a coordinate along the surface, a.w the material.
  const SOLID_FS = COMMON + `
void main() {
  vec3 n = normalize(vNrm);
  if (!gl_FrontFacing) n = -n;
  vec3 p = vPos, v = normalize(uEye - p);
  float kind = vA.w, ao = vA.y;
  vec3 alb = vec3(0.63, 0.62, 0.6);
  if (kind > 4.5) {
    // a car at the drop-off: lacquer (or its glass) over the sky's reflection
    vec3 r = reflect(-v, n);
    float F = 0.04 + 0.96 * pow(1.0 - max(dot(n, v), 0.0), 5.0), sh = shadow(p, n);
    vec3 paint = vB.y > 0.5 ? vec3(0.015) : vB.x > 0.5 ? vec3(0.42, 0.42, 0.43) : vec3(0.025, 0.027, 0.03);
    vec3 c = paint * (uSunCol * max(dot(n, uSun), 0.0) * sh + amb(n)) + (sky(r) + glint(r) * sh) * mix(F, 0.25 + 0.6 * F, vB.y);
    o = vec4(tone(c), 1.0); return;
  }
  if (kind > 3.5) {
    // a palm frond: leaflets either side of its rib, feathered at their tips
    float t = vA.z, w = abs(vB.x);
    if (w > 0.14 && fract(t * 16.0 + w * 1.6) > 0.5 + 0.35 * (1.0 - w)) discard;
    alb = mix(vec3(0.05, 0.085, 0.035), vec3(0.11, 0.14, 0.06), t);
    if (dot(n, v) < 0.0) n = -n;
  } else if (kind > 2.5) {
    alb = vec3(0.26, 0.23, 0.2); // a palm's trunk
  } else if (kind > 1.5) {
    // the pool on the amenity deck: deep water under the sky's reflection
    vec3 r = reflect(-v, vec3(0.0, 1.0, 0.0));
    float F = 0.02 + 0.98 * pow(1.0 - max(v.y, 0.0), 5.0), sh = shadow(p, vec3(0.0, 1.0, 0.0));
    vec3 deep = vec3(0.02, 0.12, 0.13) * (amb(vec3(0.0, 1.0, 0.0)) + uSunCol * max(uSun.y, 0.0) * sh * 0.5);
    vec3 c = mix(deep, sky(r) + glint(r) * sh, F) + uLamp * uNight * vec3(0.03, 0.14, 0.16) * 0.35;
    o = vec4(tone(c), 1.0); return;
  } else if (kind > 0.5) {
    // the crown's screen: fins round the roof plant, each catching the light on one face
    float f = fract(vA.z / 0.24);
    vec3 t = vec3(-n.z, 0.0, n.x);
    n = normalize(n + t * (f < 0.5 ? 0.9 : -0.9));
    alb = vec3(0.42, 0.41, 0.4);
    ao *= 0.75 + 0.25 * smoothstep(0.0, 0.25, abs(f - 0.5));
  }
  float ndl = max(dot(n, uSun), 0.0), sh = ndl > 0.0 ? shadow(p, n) : 0.0;
  vec3 c = alb * (uSunCol * ndl * sh + amb(n) * ao);
  // after dark the soffits and slab tops take a little of the rooms' light, and the crown is washed from below
  c += alb * uLamp * uNight * (kind > 0.5 && kind < 1.5 ? 0.35 * exp(-(p.y - vB.x) * 1.6) : 0.05 * ao);
  // and the balconies' soffits carry small downlights, lit once the building is in use
  if (kind < 0.5 && n.y < -0.5 && ao > 0.7) {
    vec2 g = fract(p.xz * 1.6) - 0.5;
    c += uLamp * uNight * uOcc * 2.5 * (1.0 - smoothstep(0.05, 0.11, length(g)));
  }
  o = vec4(tone(c), 1.0);
}`;

  // Glass: the curtain wall, its mullions and frit, the sky and the city reflected in it, and the rooms behind it.
  // a = (threshold, level, distance round the façade, 0 a home / 1 the lobby / 2 the amenity level),
  // b = (floor, ceiling, room, residence).
  const GLASS_FS = COMMON + `
vec3 room(vec3 p, vec3 n, vec3 d, float u, float y0, float y1, float seed, float lamp, float gold, float big) {
  vec3 t = vec3(-n.z, 0.0, n.x);
  vec3 rd = vec3(dot(d, t), d.y, -dot(d, n));
  rd.z = max(rd.z, 0.08);
  float W = mix(1.3, 2.6, big), H = y1 - y0, D = mix(1.25, 2.4, big);
  float cx = u / W, ci = floor(cx), lx = fract(cx) * W, ly = clamp(p.y - y0, 0.001, H - 0.001);
  float r1 = h21(vec2(ci, seed)), r2 = h21(vec2(seed, ci + 7.0)), r3 = h21(vec2(ci + 3.0, seed * 1.7));
  vec3 dayL = amb(vec3(0.0, 0.3, 0.0)) * (1.0 - uNight) * 0.45;
  vec3 lampC = mix(uLamp, uGold, gold);
  // blinds, lowered a little or a lot in about half the rooms
  float bf = r3 < 0.45 ? 0.0 : 0.15 + 0.6 * r2;
  if (big < 0.5 && ly > H * (1.0 - bf)) return vec3(0.62, 0.58, 0.52) * (dayL * 0.9 + lampC * lamp * 0.95);
  float tx = rd.x > 0.0 ? (W - lx) / rd.x : lx / max(-rd.x, 1e-4);
  float ty = rd.y > 0.0 ? (H - ly) / rd.y : ly / max(-rd.y, 1e-4);
  float tz = D / rd.z;
  float tt = min(tz, min(tx, ty));
  vec3 h = vec3(lx, ly, 0.0) + rd * tt;
  vec3 c;
  if (tt == tz) {
    c = mix(vec3(0.55, 0.52, 0.47), vec3(0.36, 0.33, 0.3), r1);
    // furniture against the back wall: a low dark shape in most rooms
    float fx = h.x / W;
    if (big < 0.5 && r2 > 0.25 && h.y < H * 0.3 && fx > 0.2 + 0.2 * r1 && fx < 0.75 + 0.2 * r2) c = vec3(0.12, 0.11, 0.1);
    if (big > 0.5) c = mix(vec3(0.7, 0.66, 0.6), vec3(0.45, 0.38, 0.3), step(0.5, fract(h.x * 0.8)));
  } else if (tt == ty) c = rd.y < 0.0 ? mix(vec3(0.32, 0.24, 0.17), vec3(0.5, 0.47, 0.43), r2) : vec3(0.78, 0.77, 0.75);
  else c = vec3(0.5, 0.48, 0.45);
  float depth = h.z / D;
  // daylight falls off away from the window; a lamp pools under the ceiling's middle
  vec3 L = dayL * (1.0 - 0.65 * depth);
  float pool = exp(-pow(h.x - W * 0.5, 2.0) * 1.5 - pow(h.z - D * 0.55, 2.0) * 2.0);
  L += lampC * lamp * (0.45 + 1.6 * pool * (tt == ty && rd.y > 0.0 ? 1.4 : 1.0));
  return c * L;
}
void main() {
  vec3 n = normalize(vNrm), p = vPos, v = normalize(uEye - p);
  float k = vA.y, u = vA.z, kind = vA.w, y0 = vB.x, y1 = vB.y;
  vec4 rm = texelFetch(uRooms, ivec2(int(vB.z + 0.5), int(k + 0.5)), 0);
  float sold = texelFetch(uRooms, ivec2(12 + int(vB.w + 0.5), int(k + 0.5)), 0).r;
  float lamp = rm.r * 1.6, gold = rm.g;
  if (kind > 0.5) sold = 0.0;
  // panes: a mullion every 0.42 (some 1.6 m), each pane set very slightly out of true, as real glass is
  float MW = kind > 0.5 ? 0.62 : 0.42, cu = u / MW, cell = floor(cu), fu = fract(cu);
  vec3 t = vec3(-n.z, 0.0, n.x);
  vec3 pn = normalize(n + t * (h21(vec2(cell, k)) - 0.5) * 0.035 + vec3(0.0, (h21(vec2(k, cell)) - 0.5) * 0.03, 0.0));
  float aa = fwidth(u) * 0.8 + 0.002, du = min(fu, 1.0 - fu) * MW;
  float mull = 1.0 - smoothstep(0.016, 0.016 + aa, du);
  float ay = fwidth(p.y) * 0.8 + 0.002;
  float frit = smoothstep(y1 - 0.085 - ay, y1 - 0.085, p.y) + (1.0 - smoothstep(y0 + 0.02, y0 + 0.02 + ay, p.y));
  if (kind > 0.5) frit = 1.0 - smoothstep(y0 + 0.03, y0 + 0.03 + ay, p.y);
  // the glass: what it reflects over what lies behind it
  vec3 r = reflect(-v, pn);
  float nv = max(dot(pn, v), 0.0);
  float F0 = mix(0.12, 0.2, sold), F = F0 + (1.0 - F0) * pow(1.0 - nv, 5.0);
  float sh = shadow(p, n);
  vec3 reflT = mix(vec3(0.8, 0.86, 0.9), uBronze * 1.9, sold);
  vec3 refl = (sky(r) + glint(r) * sh) * reflT;
  vec3 inside = room(p, n, -v, u, y0, y1, k * 13.0 + vB.z, lamp, gold, kind > 0.5 ? 1.0 : 0.0);
  // sunlight through the glass brightens a room, so the balconies' shadows lie across the façade
  inside += vec3(0.5, 0.47, 0.42) * uSunCol * max(dot(n, uSun), 0.0) * sh * 0.16;
  vec3 transT = mix(vec3(0.55, 0.62, 0.63), uBronze * 0.95, sold);
  vec3 c = inside * transT * (1.0 - F) + refl * F;
  // after dark a sold home's bronze glass still holds a little of the city's warm light
  c += uBronze * uNight * sold * 0.05;
  // mullions and the frit at each ceiling: dark bronze aluminium in the same light
  vec3 metal = vec3(0.09, 0.085, 0.08) * (uSunCol * max(dot(n, uSun), 0.0) * sh + amb(n)) + refl * 0.08;
  vec3 fritC = mix(vec3(0.1, 0.1, 0.1), uBronze * 0.5, sold) * (uSunCol * max(dot(n, uSun), 0.0) * sh * 0.5 + amb(n)) + refl * F * 0.6;
  c = mix(c, fritC, clamp(frit, 0.0, 1.0));
  c = mix(c, metal, mull);
  o = vec4(tone(c), 1.0);
}`;

  // The glass balustrades: clear glass, seen mostly where it catches the sky, with a metal handrail along the top.
  const RAIL_FS = COMMON + `
void main() {
  vec3 n = normalize(vNrm), p = vPos, v = normalize(uEye - p);
  if (dot(n, v) < 0.0) n = -n;
  float nv = max(dot(n, v), 0.0), F = 0.06 + 0.94 * pow(1.0 - nv, 5.0);
  vec3 r = reflect(-v, n);
  float sh = shadow(p, n);
  float top = smoothstep(vB.y - 0.03 - fwidth(p.y), vB.y - 0.03, p.y);
  vec3 c = (sky(r) + glint(r) * sh) * F;
  float a = clamp(0.08 + F * 0.9, 0.0, 0.9);
  vec3 rail = vec3(0.35) * (uSunCol * max(dot(n, uSun), 0.0) * sh + amb(n));
  c = mix(c, rail, top); a = mix(a, 1.0, top);
  o = vec4(tone(c) * a, a);
}`;

  // The ground is not drawn: the hero's sheet is. What falls on it is: the sun on the plaza round the building (faded
  // out well before the edge of the box), the tower's shadow (where that light is missing), the contact shadow at the
  // podium's foot and, after dark, the light from the lobby. Composited premultiplied: light adds, shade darkens.
  const GROUND_FS = COMMON + `
float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  vec3 p = vPos;
  float R = length(p.xz), fade = 1.0 - smoothstep(7.0, 16.5, R);
  float sh = shadow(p, vec3(0.0, 1.0, 0.0));
  vec3 lit = vec3(0.5, 0.48, 0.44) * (uSunCol * max(uSun.y, 0.0) * sh * 0.12 + amb(vec3(0.0, 1.0, 0.0)) * 0.03) * fade;
  float d = rbox(p.xz, vec2(6.45, 4.45), 1.3);
  float ao = (1.0 - smoothstep(0.0, 1.4, max(d, 0.0))) * step(-0.05, d);
  vec2 e = p.xz - vec2(0.0, -5.6);
  lit += uLamp * uNight * uOcc * 0.22 * exp(-dot(e, e * vec2(0.25, 0.6)));
  vec3 c = tone(lit) - tone(vec3(0.0));
  float a = ao * 0.5 * fade;
  o = vec4(c * (1.0 - a), a);
}`;

  // Residences sold before their glass is in: each stands where it will be, in the bronze of its glass, seen through,
  // so the sales can be read in the rising frame (the drawing draws them as bronze solids).
  const GHOST_FS = COMMON + `
void main() {
  vec3 n = normalize(vNrm), p = vPos, v = normalize(uEye - p);
  float sold = texelFetch(uRooms, ivec2(12 + int(vB.w + 0.5), int(vA.y + 0.5)), 0).r;
  if (sold < 0.02) discard;
  if (dot(n, v) < 0.0) n = -n;
  float F = 0.12 + 0.88 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  vec3 r = reflect(-v, n);
  vec3 c = uBronze * (uSunCol * max(dot(n, uSun), 0.0) * 0.35 + amb(n) * 0.9) + (sky(r) + glint(r)) * uBronze * 1.9 * F;
  float a = (0.42 + 0.45 * F) * sold;
  o = vec4(tone(c) * a, a);
}`;

  // ---------------------------------------------------------------- matrices
  function lookOrtho(dir, c, half, depth) {
    // a light looking along -dir at c, its box half wide and depth deep (column-major)
    const z = dir, up = Math.abs(z[1]) > 0.99 ? [1, 0, 0] : [0, 1, 0];
    let x = [up[1] * z[2] - up[2] * z[1], up[2] * z[0] - up[0] * z[2], up[0] * z[1] - up[1] * z[0]];
    const xl = Math.hypot(...x); x = x.map((q) => q / xl);
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    const e = [c[0] + z[0] * depth / 2, c[1] + z[1] * depth / 2, c[2] + z[2] * depth / 2];
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
    const s = 1 / half, sz = -2 / depth;
    const m = new Float32Array(16);
    // rows: x/half, y/half, z mapped so the eye plane is -1 and depth away is +1
    const rows = [[x, -dot(x, e), s], [y, -dot(y, e), s], [z, -dot(z, e), sz]];
    rows.forEach(([a, b, k], r) => { m[r] = a[0] * k; m[4 + r] = a[1] * k; m[8 + r] = a[2] * k; m[12 + r] = b * k + (r === 2 ? -1 : 0); });
    m[15] = 1;
    return m;
  }

  // ---------------------------------------------------------------- geometry
  function Mesh() { this.v = []; this.i = []; this.n = 0; }
  Mesh.prototype.vert = function (p, nr, a, b) { this.v.push(p[0], p[1], p[2], nr[0], nr[1], nr[2], a[0], a[1], a[2], a[3], b[0], b[1], b[2], b[3]); return this.n++; };
  Mesh.prototype.quad = function (a, b, c, d) { this.i.push(a, b, c, a, c, d); };
  Mesh.prototype.tri = function (a, b, c) { this.i.push(a, b, c); };

  // a vertical band round a ring of plan points (outward normals), from y0 to y1; at(j, s) gives (a, b) for point j
  function band(M, ring, y0, y1, at) {
    const n = ring.length;
    let s = 0;
    for (let j = 0; j < n; j++) {
      const p = ring[j], q = ring[(j + 1) % n], len = Math.hypot(q.x - p.x, q.z - p.z);
      const [a0, b0] = at(j, s), [a1, b1] = at(j, s + len);
      const v0 = M.vert([p.x, y0, p.z], [p.nx, 0, p.nz], a0, b0), v1 = M.vert([q.x, y0, q.z], [q.nx, 0, q.nz], a1, b1);
      const v2 = M.vert([q.x, y1, q.z], [q.nx, 0, q.nz], a1, b1), v3 = M.vert([p.x, y1, p.z], [p.nx, 0, p.nz], a0, b0);
      M.quad(v0, v3, v2, v1);
      s += len;
    }
  }
  // a flat cap over a ring at height y, facing up (or down): an annulus to an inner ring of as many points (ao falling
  // to aoIn there) and a fan inside it
  function cap(M, ring, inner, y, up, a, aoOut, aoIn) {
    const n = ring.length, ny = up ? 1 : -1, nr = [0, ny, 0];
    const A = (ao) => [a[0], ao, 0, a[3]], B = [y, y, 0, 0];
    const o = [], im = [];
    for (let j = 0; j < n; j++) { o.push(M.vert([ring[j].x, y, ring[j].z], nr, A(aoOut), B)); im.push(M.vert([inner[j].x, y, inner[j].z], nr, A(aoIn), B)); }
    let cx = 0, cz = 0; inner.forEach((p) => { cx += p.x / n; cz += p.z / n; });
    const c = M.vert([cx, y, cz], nr, A(aoIn * 0.8), B);
    for (let j = 0; j < n; j++) {
      const j2 = (j + 1) % n;
      if (up) { M.quad(o[j2], o[j], im[j], im[j2]); M.tri(c, im[j2], im[j]); }
      else { M.quad(o[j], o[j2], im[j2], im[j]); M.tri(c, im[j], im[j2]); }
    }
  }
  // a box standing on (x, z), w by w, from y0 to y1
  function post(M, x, z, w, y0, y1, a) {
    const b = [y0, y1, 0, 0];
    const sides = [[1, 0], [0, 1], [-1, 0], [0, -1]];
    for (const [nx, nz] of sides) {
      const tx = -nz, tz = nx, cx = x + nx * w, cz = z + nz * w;
      const v0 = M.vert([cx - tx * w, y0, cz - tz * w], [nx, 0, nz], a, b), v1 = M.vert([cx + tx * w, y0, cz + tz * w], [nx, 0, nz], a, b);
      const v2 = M.vert([cx + tx * w, y1, cz + tz * w], [nx, 0, nz], a, b), v3 = M.vert([cx - tx * w, y1, cz - tz * w], [nx, 0, nz], a, b);
      M.quad(v0, v3, v2, v1);
    }
    const t = [M.vert([x - w, y1, z - w], [0, 1, 0], a, b), M.vert([x + w, y1, z - w], [0, 1, 0], a, b), M.vert([x + w, y1, z + w], [0, 1, 0], a, b), M.vert([x - w, y1, z + w], [0, 1, 0], a, b)];
    M.quad(t[3], t[2], t[1], t[0]);
  }

  function build(G) {
    const { FLOORS, SLAB, PODIUM, CROWN, RAIL_H, SCREEN_H, BEACON, PORTE, CANOPY, CORE, COLS } = G;
    const S = G.set(6), PL = S.PLANS;
    const idx = (k) => (k === PODIUM || k === CROWN || k === FLOORS ? k - 1 : k);
    const slabs = new Mesh(), cols = new Mesh(), core = new Mesh(), glass = new Mesh(), rails = new Mesh(), crown = new Mesh(), mast = new Mesh(), canopy = new Mesh(), deck = new Mesh();
    // slabs: the edge band, the top and the soffit (k 1 is the mezzanine, hidden inside the lobby's glass)
    for (let k = 0; k <= FLOORS; k++) {
      if (k === 1) continue;
      const pl = PL[idx(k)], a = [k, 1, 0, 0];
      band(slabs, pl.slab, k, k + SLAB, () => [a, [k, k + SLAB, 0, 0]]);
      cap(slabs, pl.slab, pl.glass, k + SLAB, true, a, 0.95, 0.6);
      if (k > 0) cap(slabs, pl.slab, pl.glass, k, false, a, 0.8, 0.35);
    }
    // the columns of the open frame, and the core that leads it
    for (let k = PODIUM; k < FLOORS; k++) for (const c of COLS) post(cols, c.x, c.z, 0.09, k + SLAB, k + 1, [k, 0.8, 0, 0]);
    const coreR = CORE.map((p) => ({ x: p.x, z: p.z, nx: p.nx, nz: p.nz }));
    for (let k = 0; k < FLOORS; k++) {
      band(core, coreR, k, k + 1, () => [[k, 0.85, 0, 0], [k, k + 1, 0, 0]]);
      cap(core, coreR, coreR.map((p) => ({ x: p.x * 0.5, z: p.z * 0.5 })), k + 1, true, [k, 0, 0, 0], 0.8, 0.8);
    }
    // the curtain wall: one band a storey (the lobby's two storeys as one), each facet carrying its room and residence
    for (let k = 0; k < FLOORS; k++) {
      if (k === 1) continue;
      const pl = PL[k].glass, y0 = k + SLAB, y1 = k === 0 ? 2 : k + 1, kind = k < 2 ? 1 : k < PODIUM ? 2 : 0;
      band(glass, pl, y0, y1, (j, s) => [[k === 0 ? 1 : k, k, s, kind], [y0, y1, S.RM[j % pl.length], S.SIDE[k][j % pl.length]]]);
    }
    // the same bands, for the residences sold before their glass is in (shown from the frame's top down: threshold -k)
    const ghost = new Mesh();
    for (let k = G.RES0; k < FLOORS; k++) {
      const pl = PL[k].glass, y0 = k + SLAB, y1 = k + 1;
      band(ghost, pl, y0, y1, (j, s) => [[-k, k, s, 0], [y0, y1, 0, S.SIDE[k][j % pl.length]]]);
      for (const y of [y0, y1]) {
        let cx = 0, cz = 0; pl.forEach((q) => { cx += q.x / pl.length; cz += q.z / pl.length; });
        for (let j = 0; j < pl.length; j++) {
          const a = pl[j], b = pl[(j + 1) % pl.length], sd = S.SIDE[k][j], A = [-k, k, 0, 0], B = [y0, y1, 0, sd], nr = [0, y === y1 ? 1 : -1, 0];
          ghost.tri(ghost.vert([cx, y, cz], nr, A, B), ghost.vert([a.x, y, a.z], nr, A, B), ghost.vert([b.x, y, b.z], nr, A, B));
        }
      }
    }
    // glass balustrades on every terrace, the podium's roof and the roof included
    for (let k = PODIUM; k <= FLOORS; k++) {
      const r = S.RAILS[k];
      if (r) band(rails, r, k + SLAB, k + SLAB + RAIL_H, (j, s) => [[k, 0, s, 0], [k + SLAB, k + SLAB + RAIL_H, 0, 0]]);
    }
    // the crown: its screen of fins, and the roof inside it; the mast for the aviation light
    const y0 = FLOORS + SLAB, y1 = y0 + SCREEN_H;
    band(crown, S.SCREEN, y0, y1, (j, s) => [[0, 0.9, s, 1], [y0, y1, 0, 0]]);
    cap(crown, S.SCREEN, S.SCREEN.map((p) => ({ x: p.x * 0.6, z: p.z * 0.6 })), y1, true, [0, 0, 0, 0], 0.9, 0.85);
    post(mast, 0, 0, 0.035, 0, BEACON, [0, 0.9, 0, 3]);
    // the porte-cochère: a thin roof on two slender posts, its soffit high enough for a coach
    const cr = CANOPY.map((p) => ({ x: p.x * 0.75, z: (p.z + 5.25) * 0.75 - 5.25 }));
    band(canopy, CANOPY, PORTE, PORTE + 0.1, () => [[0, 1, 0, 0], [PORTE, PORTE + 0.1, 0, 0]]);
    cap(canopy, CANOPY, cr, PORTE + 0.1, true, [0, 0, 0, 0], 0.95, 0.9);
    cap(canopy, CANOPY, cr, PORTE, false, [0, 0, 0, 0], 0.75, 0.7);
    for (const x of [-2.1, 2.1]) post(canopy, x, -5.85, 0.05, 0, PORTE, [0, 0.9, 0, 0]);
    // the amenity deck's pool, beside the tower on the podium's roof
    {
      const y = PODIUM + SLAB + 0.006, x0 = -5.85, x1 = -4.45, z0 = -3.0, z1 = 2.2, a = [0, 1, 0, 2], b = [0, 0, 0, 0], nr = [0, 1, 0];
      const q = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => deck.vert([x, y, z], nr, a, b));
      deck.quad(q[3], q[2], q[1], q[0]);
    }
    // royal palms on the site, as the site plan places them
    for (const [x, z, hgt, lean, turn] of G.PALMS) {
      const tx = x + lean * Math.cos(turn), tz = z + lean * Math.sin(turn), ring = [];
      for (let i = 0; i <= 8; i++) {
        const t = i / 8, e = t * t, cx = x + (tx - x) * e, cz = z + (tz - z) * e, r = 0.1 - 0.035 * t, row = [];
        for (let m = 0; m < 6; m++) { const a = (m / 6) * TAU, nx = Math.cos(a), nz = Math.sin(a); row.push(deck.vert([cx + nx * r, hgt * t, cz + nz * r], [nx, 0, nz], [0, 0.9, t, 3], [0, 0, 0, 0])); }
        ring.push(row);
      }
      for (let i = 0; i < 8; i++) for (let m = 0; m < 6; m++) deck.quad(ring[i][m], ring[i][(m + 1) % 6], ring[i + 1][(m + 1) % 6], ring[i + 1][m]);
      for (let f = 0; f < 11; f++) {
        const a = turn + (f * TAU) / 11 + 0.4 * Math.sin(f * 2.3), len = 1.25 + (0.5 * ((f * 7) % 4)) / 3, up = f % 3 === 0 ? 0.9 : 0.5;
        const ca = Math.cos(a), sa = Math.sin(a), pt = (t) => [tx + ca * len * t, hgt + len * (up * t - 1.05 * t * t), tz + sa * len * t];
        let prev = null;
        for (let i = 0; i <= 7; i++) {
          const t = i / 7, p = pt(t), w = 0.34 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.15 + 0.05)), 0.7) + 0.02;
          const slope = up - 2.1 * t, nr = [-ca * slope, 1, -sa * slope], nl = Math.hypot(...nr);
          const n2 = nr.map((q) => q / nl);
          const l = deck.vert([p[0] - sa * w, p[1] - 0.04, p[2] + ca * w], n2, [0, 1, t, 4], [-1, 0, 0, 0]);
          const r = deck.vert([p[0] + sa * w, p[1] - 0.04, p[2] - ca * w], n2, [0, 1, t, 4], [1, 0, 0, 0]);
          const m = deck.vert(p, n2, [0, 1, t, 4], [0, 0, 0, 0]);
          if (prev) { deck.quad(prev[0], prev[2], m, l); deck.quad(prev[2], prev[1], r, m); }
          prev = [l, r, m];
        }
      }
    }
    // two cars at the drop-off under the porte-cochère, once the building is in use
    const cars = new Mesh();
    const box = (cx, cy, cz, hx, hy, hz, b) => {
      const a = [0, 1, 0, 5];
      for (const [nx, ny, nz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
        const u = ny ? [1, 0, 0] : [0, 1, 0], w = [ny * u[2] - nz * u[1], nz * u[0] - nx * u[2], nx * u[1] - ny * u[0]];
        const c = [cx + nx * hx, cy + ny * hy, cz + nz * hz], e = [u[0] * hx + u[1] * hy + u[2] * hz, w[0] * hx + w[1] * hy + w[2] * hz];
        const P = (s, t) => [c[0] + u[0] * e[0] * s + w[0] * e[1] * t, c[1] + u[1] * e[0] * s + w[1] * e[1] * t, c[2] + u[2] * e[0] * s + w[2] * e[1] * t];
        const q = [P(-1, -1), P(1, -1), P(1, 1), P(-1, 1)].map((pp) => cars.vert(pp, [nx, ny, nz], a, b));
        cars.quad(q[0], q[1], q[2], q[3]);
      }
    };
    for (const [x, z, col] of [[-1.15, -5.55, 0], [1.75, -5.7, 1]]) {
      box(x, 0.13, z, 0.64, 0.1, 0.25, [col, 0, 0, 0]);
      box(x - 0.06, 0.29, z, 0.36, 0.07, 0.21, [col, 1, 0, 0]);
      box(x - 0.06, 0.365, z, 0.33, 0.006, 0.19, [col, 0, 0, 0]);
    }
    const ground = new Mesh();
    { const R = 30, a = [0, 1, 0, 0], b = [0, 0, 0, 0], nr = [0, 1, 0]; const q = [[-R, -R], [R, -R], [R, R], [-R, R]].map(([x, z]) => ground.vert([x, 0, z], nr, a, b)); ground.quad(q[3], q[2], q[1], q[0]); }
    return { slabs, cols, core, glass, ghost, rails, crown, mast, canopy, deck, cars, ground };
  }

  // ---------------------------------------------------------------- renderer
  window.CentamontTower3D = function (G, opt) {
    const canvas = document.createElement('canvas');
    let gl = null;
    try { gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: true, antialias: true, depth: true, stencil: false, preserveDrawingBuffer: false, powerPreference: 'default', failIfMajorPerformanceCaveat: !opt.force }); } catch (e) { gl = null; }
    if (!gl) return null;
    // (a GPU emulated in software would render it, slowly, on the processor the page needs: the drawing is kinder there)
    if (!opt.force) {
      const dbg = gl.getExtension('WEBGL_debug_renderer_info'), name = String(gl.getParameter(dbg ? dbg.UNMASKED_RENDERER_WEBGL : gl.RENDERER));
      if (/swiftshader|llvmpipe|softpipe|software|basic render|microsoft basic/i.test(name)) { const x = gl.getExtension('WEBGL_lose_context'); if (x) x.loseContext(); return null; }
    }
    const { FLOORS, SLAB, PODIUM, CROWN, RES0, SCREEN_H } = G;
    const R = { canvas, ready: false, lost: false, q: opt.q || 1, cw: 0, ch: 0, box: null };
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); R.lost = true; if (opt.onLost) opt.onLost(); });

    // compile without stalling the page where the engine can (the programs link in the background)
    const par = gl.getExtension('KHR_parallel_shader_compile');
    const progs = {};
    const make = (name, fs) => {
      const p = gl.createProgram(), sh = [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]].map(([t, src]) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(p, s); return s; });
      gl.linkProgram(p);
      progs[name] = { p, sh, u: null };
    };
    make('depth', DEPTH_FS); make('solid', SOLID_FS); make('glass', GLASS_FS); make('rail', RAIL_FS); make('ground', GROUND_FS); make('ghost', GHOST_FS);
    const linked = () => Object.values(progs).every((q) => gl.getProgramParameter(q.p, par ? par.COMPLETION_STATUS_KHR : gl.LINK_STATUS));
    const finish = () => {
      for (const [name, q] of Object.entries(progs)) {
        if (!gl.getProgramParameter(q.p, gl.LINK_STATUS)) { if (opt.debug) console.warn(name, gl.getProgramInfoLog(q.p), q.sh.map((s) => gl.getShaderInfoLog(s))); return false; }
        const n = gl.getProgramParameter(q.p, gl.ACTIVE_UNIFORMS), u = {};
        for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(q.p, i), nm = info.name.replace(/\[0\]$/, ''); u[nm] = gl.getUniformLocation(q.p, info.name); }
        q.u = u;
      }
      return true;
    };

    // meshes
    const geo = build(G), meshes = {};
    for (const [name, M] of Object.entries(geo)) {
      const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
      const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(M.v), gl.STATIC_DRAW);
      const big = M.n > 65535, ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, big ? new Uint32Array(M.i) : new Uint16Array(M.i), gl.STATIC_DRAW);
      const st = 14 * 4;
      [[0, 3, 0], [1, 3, 12], [2, 4, 24], [3, 4, 40]].forEach(([l, sz, off]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, sz, gl.FLOAT, false, st, off); });
      meshes[name] = { vao, count: M.i.length, type: big ? gl.UNSIGNED_INT : gl.UNSIGNED_SHORT };
    }
    gl.bindVertexArray(null);

    // the shadow map, and the rooms' lamps and the residences' sales (12 rooms and 2 residences a level)
    const SM = opt.phone ? 1024 : 2048;
    const shTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, shTex);
    gl.texStorage2D(gl.TEXTURE_2D, 1, gl.DEPTH_COMPONENT24, SM, SM);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_MODE, gl.COMPARE_REF_TO_TEXTURE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_COMPARE_FUNC, gl.LEQUAL);
    const shFB = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, shFB); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, shTex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    const RW = 14, roomData = new Uint8Array(RW * FLOORS * 4);
    const roomTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, roomTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, RW, FLOORS, 0, gl.RGBA, gl.UNSIGNED_BYTE, roomData);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    const LAMP = lin(G.LAMP), GOLD = lin(G.GOLD);
    let shKey = '', LS = null;
    const hash = G.hash, roomSide = [];
    { const S = G.set(6); for (let k = 0; k < FLOORS; k++) { const row = []; for (let r = 0; r < 12; r++) { const j = S.RM.indexOf(r); row.push(j < 0 ? 0 : S.SIDE[k][j]); } roomSide.push(row); } }

    // the rooms lit after dark, as the drawing lights them: the lobby, part of the amenity level, a share of the sold
    // homes (gold through their bronze), the model residence while homes are for sale; each in its turn in the cascade
    function rooms(m, night, cas) {
      const sold = (k, s) => m.soldOf(k, s);
      const nl = 0.55 + 0.45 * night, on = night > 0.05;
      for (let k = 0; k < FLOORS; k++) {
        const modelK = k === RES0 && sold(k, 1) <= 0.5;
        for (let r = 0; r < 12; r++) {
          let v = 0, g = 0;
          const sd = roomSide[k][r];
          if (k < 2) v = Math.max(0.55 * (1 - night) + 0.8 * (0.7 + 0.3 * night) * cas(0), 0.3);
          else if (k < PODIUM) { if (hash(k, r, 21) < 0.5) v = (on ? 0.75 * (0.6 + 0.4 * hash(r, k, 3)) * nl * cas(0.15 + 0.35 * hash(k, r, 4)) : 0) + 0.12 * (1 - night); }
          else if (on && sold(k, sd) > 0.5) { if (hash(k, sd, 12) >= 0.12 && hash(k, r, 9) < 0.28 * night) { v = (0.6 + 0.4 * hash(r, k, 3)) * nl * cas(1.6 * hash(k, r, 3) + (k >= CROWN ? 0.4 : 0)); g = 1; } }
          else if (on && modelK && sd === 1 && r === G.MODEL_ROOM) v = nl * cas(1.6 * hash(k, r, 3));
          const i = (k * RW + r) * 4;
          roomData[i] = Math.round(clamp(v * (k < PODIUM ? 1 : m.occ || (k < 2 ? 1 : 0)), 0, 1) * 255); roomData[i + 1] = g * 255;
        }
        for (let s = 0; s < 2; s++) roomData[(k * RW + 12 + s) * 4] = k >= RES0 ? Math.round(clamp(sold(k, s), 0, 1) * 255) : 0;
      }
    }

    const draw = (q, name, lim, y) => {
      const M = meshes[name];
      gl.uniform1f(q.u.uLim, lim);
      gl.uniform3fv(q.u.uY, y || [0, 1, 0]);
      gl.bindVertexArray(M.vao);
      gl.drawElements(gl.TRIANGLES, M.count, M.type, 0);
    };

    R.poll = () => {
      if (R.ready || R.lost) return R.ready;
      if (!linked()) return false;
      if (!finish()) { R.lost = true; return false; }
      R.ready = true;
      return true;
    };

    // Draw the tower as model m sees it now; returns the box (CSS px) it drew into, or null.
    R.render = (m) => {
      if (!R.ready || R.lost || gl.isContextLost()) return null;
      const k = m.k, W = m.w, H = m.h;
      if (!k || !W || !H) return null;
      // the state of the building, as the drawing has it
      const L = m.L, C = m.C, Gc = m.G, Ge = 1 - Math.pow(1 - Gc, 3);
      const coreTop = L > 0.01 && C < FLOORS - 0.01 ? Math.min(FLOORS, L + Math.min(4, 1.5 + L), G.craneAt(L).top - 1) : 0;
      // the box it fills on screen: the tower to the beacon, and the plaza's light round its foot
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      const add = (x, y, z) => { const p = m.P(x, y, z); if (p[2] < 0.5) return; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); };
      for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; add(Math.cos(a) * 16.5, 0, Math.sin(a) * 16.5); add(Math.cos(a) * 7, FLOORS + SLAB + SCREEN_H + 1.2, Math.sin(a) * 7); add(Math.cos(a) * 9.5, 5, Math.sin(a) * 9.5); }
      const pad = 2;
      x0 = Math.max(0, Math.floor(x0 - pad)); y0 = Math.max(0, Math.floor(y0 - pad)); x1 = Math.min(W, Math.ceil(x1 + pad)); y1 = Math.min(H, Math.ceil(y1 + pad));
      if (x1 - x0 < 2 || y1 - y0 < 2) return null;
      const bw = x1 - x0, bh = y1 - y0, q = R.q, pw = Math.max(1, Math.round(bw * q)), ph = Math.max(1, Math.round(bh * q));
      // the canvas only grows (in steps of 128 px), so a turning view never reallocates it
      const need = (v, cur) => (v > cur || v < cur * 0.6 ? Math.ceil(v / 128) * 128 : cur);
      const cw = need(pw, R.cw), ch = need(ph, R.ch);
      if (cw !== R.cw || ch !== R.ch) { R.cw = canvas.width = cw; R.ch = canvas.height = ch; }

      // light: the sun's direction and colour, the sky's, by this hour (the drawing's sun, scrubbed or not)
      const sun = m.sunNow, sv = sun.v, el = sun.el, night = sun.night, kd = 1 - night;
      const day = smooth(clamp((el + 4) / 16, 0, 1)), gold = clamp((20 - el) / 16, 0, 1) * day;
      const sunCol = [1, 0.95, 0.88].map((c, i) => (c * (1 - gold) + [1, 0.6, 0.34][i] * gold) * (3.0 - 0.9 * gold) * kd);
      const mixv = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
      const zen = mixv([0.006, 0.008, 0.016], mixv([0.16, 0.3, 0.62], [0.2, 0.25, 0.42], gold), day);
      const hor = mixv([0.03, 0.026, 0.028], mixv([0.62, 0.7, 0.8], [0.95, 0.6, 0.42], gold), day);
      const grd = mixv([0.006, 0.006, 0.006], [0.1, 0.095, 0.085], day);
      const bronze = lin(m.sold || [184, 151, 106]);
      const cascT = m.doneAt === -Infinity ? 99 : m.doneAt ? (performance.now() - m.doneAt) / 1000 : -1, cas = (d) => clamp((cascT - d) / 0.18, 0, 1);
      rooms(m, night, cas);

      // camera: the drawing's own shift lens, as a matrix over this box
      const cs = k.c, sn = k.s, f = k.f, e = m.eye, fw = [sn, 0, cs], rt = [cs, 0, -sn];
      const fe = fw[0] * e[0] + fw[2] * e[2], re = rt[0] * e[0] + rt[2] * e[2];
      const kx = (2 * f) / bw, ox = (2 * (k.cx - x0)) / bw - 1, ky = (2 * f) / bh, oy = 1 - (2 * (k.cy - y0)) / bh, n0 = 1, F0 = 200, A = (F0 + n0) / (F0 - n0), B = (-2 * F0 * n0) / (F0 - n0);
      const VP = new Float32Array(16);
      const row = (r, v) => { VP[r] = v[0]; VP[4 + r] = v[1]; VP[8 + r] = v[2]; VP[12 + r] = v[3]; };
      const FW = [fw[0], 0, fw[2], -fe];
      row(0, [kx * rt[0] + ox * FW[0], 0, kx * rt[2] + ox * FW[2], -kx * re + ox * FW[3]]);
      row(1, [oy * FW[0], ky, oy * FW[2], -ky * e[1] + oy * FW[3]]);
      row(2, [A * FW[0], 0, A * FW[2], A * FW[3] + B]);
      row(3, FW);

      // shadows, only when the sun or the building has changed
      const shOn = kd > 0.02 && sv[1] > 0.01;
      const lims = { slabs: L + 0.001, cols: L - 0.999, core: coreTop - 0.999, glass: C - 0.999, crown: Gc > 0.01 ? 1 : -1, mast: Gc > 0.85 ? 1 : -1, canopy: L >= 2 ? 1 : -1, deck: L > PODIUM + 0.5 ? 1 : -1 };
      lims.ghost = -C + 0.001; lims.cars = (m.occ || 0) > 0.5 ? 1 : -1;
      lims.rails = C >= FLOORS - 0.001 && Gc > 0.5 ? FLOORS : C - 0.999;
      const crownY = [FLOORS + SLAB, Ge, 0], mastY = [0, 1, FLOORS + SLAB + SCREEN_H * Ge];
      if (shOn) {
        const key = sv.map((v) => v.toFixed(3)).join() + [L, C, Gc, coreTop, lims.cars].map((v) => v.toFixed(3)).join();
        if (key !== shKey) {
          shKey = key;
          const d = Math.hypot(...sv), dir = sv.map((v) => v / d);
          LS = lookOrtho(dir, [0, 9, 0], 24, 120);
          const qd = progs.depth;
          gl.bindFramebuffer(gl.FRAMEBUFFER, shFB); gl.viewport(0, 0, SM, SM);
          gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.clear(gl.DEPTH_BUFFER_BIT); gl.disable(gl.CULL_FACE);
          gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(2, 4);
          gl.useProgram(qd.p); gl.uniformMatrix4fv(qd.u.uVP, false, LS);
          for (const nm of ['slabs', 'cols', 'core', 'glass', 'canopy', 'deck', 'cars']) draw(qd, nm, lims[nm]);
          draw(qd, 'crown', lims.crown, crownY);
          gl.disable(gl.POLYGON_OFFSET_FILL);
          gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        }
      } else shKey = '';

      gl.viewport(0, ch - ph, pw, ph);
      gl.enable(gl.SCISSOR_TEST); gl.scissor(0, ch - ph, pw, ph);
      gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.depthMask(true);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.disable(gl.BLEND);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shTex);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, roomTex);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, RW, FLOORS, gl.RGBA, gl.UNSIGNED_BYTE, roomData);
      const occ = m.occ || 0;
      const common = (qq) => {
        const u = qq.u;
        gl.useProgram(qq.p);
        gl.uniformMatrix4fv(u.uVP, false, VP);
        gl.uniform3fv(u.uEye, e); gl.uniform3fv(u.uSun, sv.map((v) => v / Math.hypot(...sv)));
        gl.uniform3fv(u.uSunCol, sunCol); gl.uniform3fv(u.uZen, zen); gl.uniform3fv(u.uHor, hor); gl.uniform3fv(u.uGrd, grd);
        gl.uniform3fv(u.uLamp, LAMP.map((c) => c * 1.3)); if (u.uGold) gl.uniform3fv(u.uGold, GOLD.map((c) => c * 1.3)); if (u.uBronze) gl.uniform3fv(u.uBronze, bronze);
        gl.uniform1f(u.uNight, night); gl.uniform1f(u.uExp, 0.9); gl.uniform1f(u.uShOn, shOn ? 1 : 0);
        if (u.uLS) gl.uniformMatrix4fv(u.uLS, false, LS || VP);
        if (u.uShadow) gl.uniform1i(u.uShadow, 0); if (u.uRooms) gl.uniform1i(u.uRooms, 1);
        if (u.uTexel) gl.uniform2f(u.uTexel, 1.2 / SM, 1.2 / SM);
        if (u.uOcc) gl.uniform1f(u.uOcc, occ);
      };
      // (the drawing's camera looks along +z with y up, so a face turned to the eye winds clockwise on screen)
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.frontFace(gl.CW);
      const qs = progs.solid; common(qs);
      for (const nm of ['slabs', 'cols', 'core', 'canopy', 'cars']) draw(qs, nm, lims[nm]);
      gl.disable(gl.CULL_FACE);
      draw(qs, 'deck', lims.deck);
      draw(qs, 'crown', lims.crown, crownY);
      draw(qs, 'mast', lims.mast, mastY);
      gl.enable(gl.CULL_FACE);
      const qg = progs.glass; common(qg); draw(qg, 'glass', lims.glass);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      const qr = progs.ground; common(qr); draw(qr, 'ground', 1);
      const qh = progs.ghost; common(qh); draw(qh, 'ghost', lims.ghost);
      const ql = progs.rail; common(ql); draw(ql, 'rails', lims.rails);
      gl.depthMask(true); gl.disable(gl.BLEND); gl.disable(gl.SCISSOR_TEST);
      R.box = { x: x0, y: y0, w: bw, h: bh, sw: pw, sh: ph, sy: 0 };
      return R.box;
    };
    return R;
  };
})();
