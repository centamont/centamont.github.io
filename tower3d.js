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
  // the inverse of the shaders' tone(): the linear radiance a screen value comes from (exposure 0.9)
  const untone = (y) => {
    const t = Math.pow(clamp(y, 0, 0.98), 2.2), f = (x) => (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14);
    let a = 0, b = 16;
    for (let i = 0; i < 24; i++) { const mid = (a + b) / 2; if (f(mid) < t) a = mid; else b = mid; }
    return (a + b) / 2 / 0.9;
  };

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
// the air between the camera and the building: a faint veil of the sky's own haze, a little more over the far side
uniform vec3 uAirC; uniform float uAir, uAirD;
float gAir = 1.0;
float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float gCity = 1.0; // the city's lit windows in what is reflected (off for the unclad residences)
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0)), f.x), f.y); }
// the sky over Miami at this hour, with its cloud, and the city standing round the plaza in it (what the glass reflects)
vec3 heaven(vec3 d);
// Biscayne Bay round the site: the sky mirrored in water, strongly at a grazing look and hardly at all looking
// down into it, its surface broken by a little swell; the far shore's lamps after dark
vec3 bay(vec3 d) {
  float c = clamp(-d.y, 0.0, 1.0), F = 0.02 + 0.98 * pow(1.0 - c, 5.0);
  vec3 m = normalize(vec3(d.x, max(-d.y, 0.004) * (1.0 + 0.35 * (vn(d.xz / max(c, 0.02) * 3.0) - 0.5)), d.z));
  vec3 deep = uGrd * 0.3 + vec3(0.004, 0.012, 0.014) * (1.0 - uNight);
  return mix(deep, heaven(m), clamp(F * 1.3, 0.0, 1.0)) + uLamp * uNight * 0.02 * exp(-c * 30.0);
}
vec3 sky(vec3 d) {
  float y = d.y, az = atan(d.x, d.z), cell = floor(az * 14.0), hh = 0.012 + 0.075 * pow(h21(vec2(cell, 3.0)), 2.2);
  // the site stands on a point in the bay: the shore across is far off and its towers stand low, the water comes up
  // to the horizon, and only looking steeply down does the glass see the site's own ground
  hh *= 0.4;
  if (y < 0.0 && y > -0.42) return bay(d);
  // the ground below: the sun on it by day, its lamps after dark
  if (y < 0.0) return uGrd * (0.6 + 0.4 * exp(y * 6.0)) + uSunCol * max(uSun.y, 0.0) * 0.025 + uLamp * uNight * 0.035;
  if (y < hh) {
    // the neighbours' façades, their windows lit at random after dark; the sun on the faces turned to it
    // (the near ones, below the horizon, show only a faint glow: their windows would read as glitter on the glass)
    float w = fract(az * 260.0), f = fract(y * 420.0), lit = step(0.72, h21(vec2(floor(az * 260.0), floor(y * 420.0))));
    vec3 b = uHor * (0.32 + 0.18 * h21(vec2(cell, 9.0)));
    b += uSunCol * 0.05 * max(-dot(normalize(d.xz), normalize(uSun.xz + 1e-4)), 0.0) * h21(vec2(cell, 11.0));
    b += uLamp * uNight * (0.22 * gCity * lit * step(0.3, w) * step(0.35, f) * step(0.0, y) + 0.04);
    return b;
  }
  return heaven(d);
}
// the open sky, with its cloud
vec3 heaven(vec3 d) {
  float y = d.y;
  vec3 s = mix(uHor, uZen, pow(clamp(y, 0.0, 1.0), 0.55));
  float sd = max(dot(d, uSun), 0.0);
  s += uSunCol * (0.035 * pow(sd, 6.0) + 0.06 * pow(sd, 40.0));
  // after dark, the city's own glow low in the sky
  s += uLamp * uNight * 0.03 * exp(-y * 5.0);
  // drifting cloud on a plane overhead, thinning towards the horizon: lit white by day, by the sun's colour when it
  // is low, and from below by the city after dark
  vec2 q = d.xz / (y + 0.06);
  float cl = vn(q * vec2(0.9, 0.35)) * 0.65 + vn(q * 2.1 + 3.1) * 0.35;
  float cov = smoothstep(0.42, 0.7, cl) * smoothstep(0.02, 0.14, y) * (1.0 - 0.5 * smoothstep(0.3, 0.8, y));
  vec3 cc = vec3(dot(uHor, vec3(0.3, 0.59, 0.11))) * 1.5 + uSunCol * 0.09 * (0.4 + 0.6 * sd) + uLamp * uNight * 0.05;
  return mix(s, cc, cov * 0.8);
}
// the sun's own glint, kept apart so a shadow can take it away
vec3 glint(vec3 r) { float sd = max(dot(r, uSun), 0.0); return uSunCol * (6.0 * pow(sd, 900.0) + 0.25 * pow(sd, 90.0)); }
// (the sky is brighter, and warmer when the sun is low, on the sun's side: a face turned from it sees the cooler sky)
vec3 amb(vec3 n) {
  float sd = dot(normalize(n.xz + 1e-4), normalize(uSun.xz + 1e-4)) * (1.0 - abs(n.y));
  return mix(uGrd * 0.9, mix(uZen, uHor, 0.45 + 0.3 * sd), 0.5 + 0.5 * n.y) * (0.46 + 0.1 * max(sd, 0.0));
}
float shadow(vec3 p, vec3 n) {
  if (uShOn < 0.5) return 1.0;
  vec4 q = uLS * vec4(p + n * 0.04, 1.0);
  vec3 s = q.xyz / q.w * 0.5 + 0.5;
  if (s.x < 0.0 || s.x > 1.0 || s.y < 0.0 || s.y > 1.0 || s.z > 1.0) return 1.0;
  s.z -= 0.0015;
  // a soft edge: nine taps, the middle weighted, so a shadow's edge has a little penumbra
  float v = 0.0;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) v += texture(uShadow, s + vec3(float(i) * uTexel.x, float(j) * uTexel.y, 0.0)) * (i == 0 && j == 0 ? 2.0 : 1.0);
  return v / 10.0;
}
vec3 tone(vec3 c) {
  c = mix(c, uAirC, gAir * uAir * clamp(length(uEye - vPos) / uAirD, 0.75, 1.3));
  c *= uExp;
  c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
  return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
}
`;

  // Concrete, metal, water and leaves: a.y ambient occlusion, a.z a coordinate along the surface, a.w the material.
  const SOLID_FS = COMMON + `
uniform float uWork;
void main() {
  vec3 n = normalize(vNrm);
  if (!gl_FrontFacing) n = -n;
  vec3 p = vPos, v = normalize(uEye - p);
  float kind = vA.w, ao = vA.y;
  // white-painted slab edges, and the concrete of the soffits, slab tops and core a shade greyer, with the faint
  // unevenness of poured concrete from one bay to the next
  vec3 alb = mix(vec3(0.56, 0.55, 0.525), vec3(0.67, 0.655, 0.625), 1.0 - smoothstep(0.3, 0.7, abs(n.y)));
  alb *= 0.95 + 0.07 * h21(floor(vec2(vA.z * 0.9, p.y * 1.0 + 0.5)));
  // the podium's bands are honed travertine, warmer than the tower's white, with the stone's faint bedding
  if (kind < 0.5 && p.y < 3.3) alb = vec3(0.6, 0.54, 0.45) * (0.93 + 0.07 * vn(vec2(vA.z * 6.0, p.y * 60.0)));
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
    if (w > 0.12 && fract(t * 30.0 + w * 2.2) > 0.48 + 0.4 * (1.0 - w)) discard;
    alb = mix(vec3(0.025, 0.04, 0.02), vec3(0.055, 0.07, 0.032), t) * (0.8 + 0.4 * h21(vec2(floor(t * 30.0), sign(vB.x))));
    if (dot(n, v) < 0.0) n = -n;
  } else if (kind > 2.5) {
    // a palm's trunk, pale grey and faintly ringed, under its green crownshaft
    alb = vB.y > 0.5 ? vec3(0.09, 0.13, 0.06) : vec3(0.36, 0.34, 0.31) * (0.9 + 0.1 * step(0.5, fract(vA.z * 46.0)));
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
    // (open between the blades above a low sill, so the lounge and the sky show through)
    if (abs(f - 0.5) < 0.2 && p.y - vB.x > 0.1) discard;
    vec3 t = vec3(-n.z, 0.0, n.x);
    n = normalize(n + t * (f < 0.5 ? 0.9 : -0.9));
    alb = vec3(0.42, 0.41, 0.4);
    ao *= 0.75 + 0.25 * smoothstep(0.0, 0.25, abs(f - 0.5));
  }
  float ndl = max(dot(n, uSun), 0.0), sh = ndl > 0.0 ? shadow(p, n) : 0.0;
  vec3 c = alb * (uSunCol * ndl * sh + amb(n) * ao);
  // by day the sun comes back up off the terraces and the plaza, so the soffits glow warm rather than going grey
  c += alb * uSunCol * vec3(1.0, 0.9, 0.78) * 0.11 * max(-n.y, 0.0) * ao * max(uSun.y, 0.0);
  // the painted edges have a little sheen, so a grazing view catches the sky in them
  if (kind < 0.5) c += sky(reflect(-v, n)) * (0.03 + 0.5 * pow(1.0 - max(dot(n, v), 0.0), 5.0)) * 0.3 * (1.0 - smoothstep(0.3, 0.7, abs(n.y)));
  // while the frame rises, the crew's floodlights on the top deck light it and the levels just under it after dark
  if (uWork > 0.0) c += alb * vec3(1.0, 0.74, 0.46) * uNight * 0.55 * exp(-max(uWork - p.y, 0.0) * 1.1) * step(p.y, uWork + 0.4) * (0.4 + 0.6 * max(n.y, 0.0));
  // after dark the soffits and slab tops take a little of the rooms' light, and the crown is washed from below
  c += alb * uLamp * uNight * (kind > 0.5 && kind < 1.5 ? 0.35 * exp(-(p.y - vB.x) * 1.6) : 0.05 * ao);
  // and once the building is in use the crown is a lantern after dark: warm light from the roof behind the screen
  // showing between its fins, strongest at their middle height
  if (kind > 0.5 && kind < 1.5) {
    float f = fract(vA.z / 0.24), h = clamp((p.y - vB.x) / max(vB.y - vB.x, 0.01), 0.0, 1.0);
    float gap = 1.0 - smoothstep(0.03, 0.2, abs(f - 0.5)), mid = sin(3.14159 * h);
    c += uLamp * vec3(1.0, 0.82, 0.6) * uNight * uOcc * (0.24 * gap * mid * mid + 0.05 * mid);
  }
  // and the balconies' soffits carry small downlights, lit once the building is in use
  if (kind < 0.5 && n.y < -0.5 && ao > 0.7 && p.y < 34.0) {
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
  vec3 dayL = amb(vec3(0.0, 0.3, 0.0)) * (1.0 - uNight) * 0.3;
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
  // a sold home is lived in: its rooms warm-lit behind clear glass, some brighter than others, by day as well as after
  // dark; the bronze stays at its slab edge, where the frit runs
  float hr = h21(vec2(vB.z, k * 3.1));
  lamp = max(lamp, sold * mix(0.22, 0.75, uNight) * (hr < mix(0.3, 0.5, uNight) ? 0.08 : 0.45 + 0.55 * hr));
  gold = max(gold, sold);
  // panes: a mullion every 0.42 (some 1.6 m), each pane set very slightly out of true, as real glass is
  float MW = kind > 0.5 ? 0.62 : 0.42, cu = u / MW, cell = floor(cu), fu = fract(cu);
  vec3 t = vec3(-n.z, 0.0, n.x);
  vec3 pn = normalize(n + t * (h21(vec2(cell, k)) - 0.5) * 0.06 + vec3(0.0, (h21(vec2(k, cell)) - 0.5) * 0.05, 0.0));
  float aa = fwidth(u) * 0.8 + 0.002, du = min(fu, 1.0 - fu) * MW;
  float mull = 1.0 - smoothstep(0.016, 0.016 + aa, du);
  float ay = fwidth(p.y) * 0.8 + 0.002;
  float fh = mix(0.085, 0.17, sold), frit = smoothstep(y1 - fh - ay, y1 - fh, p.y) + (1.0 - smoothstep(y0 + 0.02, y0 + 0.02 + ay, p.y));
  if (kind > 0.5) frit = 1.0 - smoothstep(y0 + 0.03, y0 + 0.03 + ay, p.y);
  // the glass: what it reflects over what lies behind it
  vec3 r = reflect(-v, pn);
  float nv = max(dot(pn, v), 0.0);
  float F0 = 0.15, F = F0 + (1.0 - F0) * pow(1.0 - nv, 5.0);
  float sh = shadow(p, n);
  // (the bronze a little less saturated by day, as tinted glass reads in daylight; full after dark, round the lamps)
  vec3 bz = mix(vec3(dot(uBronze, vec3(0.3, 0.59, 0.11))), uBronze, 0.78 + 0.22 * uNight);
  vec3 reflT = vec3(0.8, 0.86, 0.9);
  vec3 refl = (sky(r) + glint(r) * sh) * reflT;
  // under each slab the glass sees the soffit, not the sky, and the room's ceiling is in shade
  float occl = mix(0.5, 1.0, smoothstep(0.0, 0.3, y1 - p.y)) * mix(0.75, 1.0, smoothstep(0.0, 0.12, p.y - y0));
  refl *= kind > 0.5 ? 1.0 : mix(occl, 1.0, 0.35 * step(r.y, 0.0));
  vec3 inside = room(p, n, -v, u, y0, y1, k * 13.0 + vB.z, lamp, gold, kind > 0.5 ? 1.0 : 0.0);
  // sunlight through the glass brightens a room, so the balconies' shadows lie across the façade
  inside += vec3(0.55, 0.5, 0.44) * uSunCol * max(dot(n, uSun), 0.0) * sh * 0.65;
  vec3 transT = mix(vec3(0.55, 0.62, 0.63), vec3(0.66, 0.64, 0.6), sold);
  vec3 c = inside * transT * (1.0 - F) + refl * F;
  // mullions and the frit at each ceiling: dark bronze aluminium in the same light
  vec3 metal = vec3(0.09, 0.085, 0.08) * (uSunCol * max(dot(n, uSun), 0.0) * sh + amb(n)) + refl * 0.08;
  vec3 fritC = vec3(0.1) * (uSunCol * max(dot(n, uSun), 0.0) * sh * 0.5 + amb(n)) + refl * F * 0.6;
  // (sold: the band at the slab is bronze metal, brushed, holding the sky's line and a little of the room's light)
  vec3 bzC = bz * (uSunCol * max(dot(n, uSun), 0.0) * sh * 0.8 + amb(n) * 1.6) + sky(r) * bz * (0.25 + 0.6 * F) + bz * uNight * 0.06 + bz * lamp * 0.12;
  fritC = mix(fritC, bzC, sold);
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
  float top = vB.z > 0.5 ? 0.0 : smoothstep(vB.y - 0.04 - fwidth(p.y), vB.y - 0.04, p.y);
  vec3 c = (sky(r) + glint(r) * sh) * F;
  float a = clamp(0.08 + F * 0.9, 0.0, 0.9);
  if (vB.z > 0.5) {
    // a frosted glass screen between two neighbours' terraces
    c = vec3(0.6, 0.6, 0.58) * (uSunCol * max(abs(dot(n, uSun)), 0.0) * sh * 0.35 + amb(n)) * 0.4 + c;
    a = 0.38 + 0.3 * F;
  }
  // (the handrail is a brushed metal cap holding a thin line of the sky along its top: dark bronze aluminium, as the
  // mullions are, and bronze itself along a sold home's terrace, the edge that tells the sales from the street)
  float sold = vB.w > 0.5 ? step(0.5, texelFetch(uRooms, ivec2(11 + int(vB.w + 0.5), int(vA.x + 0.5)), 0).r) : 0.0;
  vec3 mt = mix(vec3(0.16, 0.15, 0.14), uBronze, sold);
  vec3 rail = mt * mix(0.4, 0.6, sold) * (uSunCol * max(dot(n, uSun), 0.0) * sh + amb(n)) + sky(r) * mt * (0.12 + 0.5 * F) + uBronze * uNight * sold * 0.08;
  c = mix(c, rail, top); a = mix(a, 1.0, top);
  o = vec4(tone(c) * a, a);
}`;

  // The ground is not drawn: the hero's sheet is. What falls on it is: the sun on the plaza round the building (faded
  // out well before the edge of the box), the tower's shadow (where that light is missing), the contact shadow at the
  // podium's foot and, after dark, the light from the lobby. Composited premultiplied: light adds, shade darkens.
  const GROUND_FS = COMMON + `
float rbox(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
void main() {
  gAir = 0.0;
  vec3 p = vPos;
  // (a soft, bell-shaped falloff, so the lit ground reads as light thinning out, never as the rim of a pool of light)
  float R = length(p.xz), fade = 1.4 * exp(-R * R / 60.0) * (1.0 - smoothstep(12.0, 16.5, R));
  float sh = shadow(p, vec3(0.0, 1.0, 0.0));
  vec3 lit = vec3(0.5, 0.48, 0.44) * (uSunCol * max(uSun.y, 0.0) * sh * 0.09 + amb(vec3(0.0, 1.0, 0.0)) * 0.03) * fade;
  float d = rbox(p.xz, vec2(6.45, 4.45), 1.3);
  float ao = (1.0 - smoothstep(0.0, 1.4, max(d, 0.0))) * step(-0.05, d);
  vec2 e = p.xz - vec2(0.0, -5.6);
  lit += uLamp * uNight * uOcc * 0.22 * exp(-dot(e, e * vec2(0.25, 0.6)));
  vec3 c = tone(lit) - tone(vec3(0.0));
  float a = ao * 0.5 * min(fade, 1.0);
  // the grounds, laid over the survey sheet and thinning into it: honed stone paving round the podium in a grid of
  // joints, the drive's dark loop to the porte-cochère, and lawn beyond, each lit by the sun (in the tower's shadow)
  // and by the sky; the sheet's grid and site lines show through them faintly
  float pv = rbox(p.xz, vec2(9.4, 7.8), 3.0), dv = abs(rbox(p.xz - vec2(0.0, -6.4), vec2(4.6, 1.15), 1.1)) - 0.5;
  vec2 jt = abs(fract(p.xz / 0.75) - 0.5);
  float joint = smoothstep(0.465, 0.5, max(jt.x, jt.y));
  vec3 alb = mix(vec3(0.022, 0.03, 0.02) * (0.8 + 0.4 * vn(p.xz * 0.7)), vec3(0.36, 0.335, 0.3) * (1.0 - 0.22 * joint), step(pv, 0.0));
  alb = mix(alb, vec3(0.055, 0.055, 0.058), step(dv, 0.0));
  vec3 lt = uSunCol * max(uSun.y, 0.0) * sh + amb(vec3(0.0, 1.0, 0.0)) * 0.8 + uLamp * uNight * uOcc * 0.3 * exp(-dot(e, e * vec2(0.12, 0.3)));
  float am = 0.82 * (1.0 - smoothstep(9.0, 15.5, R)) * (1.0 - 0.5 * uNight);
  vec3 mc = tone(alb * lt);
  o = vec4(mix(c, mc, am) * (1.0 - a), 1.0 - (1.0 - am) * (1.0 - a));
}`;

  // Residences sold before their glass is in: each stands where it will be, in the bronze of its glass, seen through,
  // so the sales can be read in the rising frame (the drawing draws them as bronze solids).
  const GHOST_FS = COMMON + `
void main() {
  vec3 n = normalize(vNrm), p = vPos, v = normalize(uEye - p);
  float sold = texelFetch(uRooms, ivec2(12 + int(vB.w + 0.5), int(vA.y + 0.5)), 0).r;
  if (sold < 0.02) discard;
  if (dot(n, v) < 0.0) n = -n;
  float side = 1.0 - step(0.5, abs(n.y));
  float F = 0.12 + 0.88 * pow(1.0 - max(dot(n, v), 0.0), 5.0);
  vec3 r = reflect(-v, n);
  gCity = 0.0;
  vec3 c = uBronze * (uSunCol * max(dot(n, uSun), 0.0) * 0.35 + amb(n) * 0.9) + (sky(r) + glint(r)) * uBronze * 1.9 * F;
  // after dark the bronze keeps a little of the city's light, more where it is seen edge on, and the volumes thin out
  c += uBronze * uNight * (0.05 + 0.14 * F);
  // seen through, the floors read as lines, not as a stack of solid plates
  float a = (0.42 + 0.45 * F) * mix(1.0, 0.72, uNight) * mix(0.45, 1.0, side);
  // the panes to come: a faint mullion every 0.42 round the sides
  float fu = fract(vA.z / 0.42), du = min(fu, 1.0 - fu) * 0.42, aa = fwidth(vA.z) * 0.8 + 0.002;
  float mull = side * (1.0 - smoothstep(0.012, 0.012 + aa, du));
  c = mix(c, uBronze * (0.3 * amb(n) + uSunCol * max(dot(n, uSun), 0.0) * 0.12 + 0.04 * uNight), mull * 0.7);
  a = mix(a, min(1.0, a + 0.2), mull) * sold;
  o = vec4(tone(c) * a, a);
}`;

  // The light of the sky behind the tower: a soft band of the horizon's colour, strongest low down and fading out
  // well inside the tower's box, so the building stands in air rather than on the bare sheet. It only adds light.
  const SKY_FS = COMMON + `
uniform float uGlow;
void main() {
  gAir = 0.0;
  float u = vB.x, y = vB.y;
  float g = exp(-u * u * 5.0) * (1.0 - smoothstep(0.7, 0.95, abs(u))) * exp(-pow((y - 0.16) / 0.2, 2.0)) * smoothstep(0.0, 0.06, y);
  vec3 c = tone(uHor * uGlow * g);
  o = vec4(c, 0.0);
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
    const { FLOORS, SLAB, PODIUM, CROWN, RAIL_H, SCREEN_H, CREST, PORTE, CANOPY, CORE, COLS } = G;
    const S = G.set(6), PL = S.PLANS;
    const idx = (k) => (k === PODIUM || k === CROWN || k === FLOORS ? k - 1 : k);
    const slabs = new Mesh(), cols = new Mesh(), core = new Mesh(), glass = new Mesh(), rails = new Mesh(), crown = new Mesh(), canopy = new Mesh(), deck = new Mesh();
    // slabs: the edge band, the top and the soffit (k 1 is the mezzanine, hidden inside the lobby's glass)
    // From the podium's roof up, each slab ends in a thin nose: a short white face over an underside that rounds back
    // and up from the soffit, so the edge reads as a blade (the plinth and the lobby's eyebrow keep a square edge).
    const NOSE = 0.075, TUCK = 0.15;
    for (let k = 0; k <= FLOORS; k++) {
      if (k === 1) continue;
      const pl = PL[idx(k)], a = [k, 1, 0, 0], b = [k, k + SLAB, 0, 0];
      if (k < PODIUM) {
        band(slabs, pl.slab, k, k + SLAB, () => [a, b]);
        cap(slabs, pl.slab, pl.glass, k + SLAB, true, a, 0.95, 0.6);
        if (k > 0) cap(slabs, pl.slab, pl.glass, k, false, a, 0.8, 0.35);
        continue;
      }
      const tuck = pl.slab.map((p) => ({ x: p.x - p.nx * TUCK, z: p.z - p.nz * TUCK, nx: p.nx, nz: p.nz }));
      band(slabs, pl.slab, k + NOSE, k + SLAB, () => [a, b]);
      cap(slabs, pl.slab, pl.glass, k + SLAB, true, a, 0.95, 0.6);
      // (the underside: normals turning from out-and-down at the nose to straight down at the soffit, so it shades round)
      const n = pl.slab.length, ao = [k, 0.68, 0, 0], o = [], i = [], r = Math.SQRT1_2;
      for (let j = 0; j < n; j++) {
        const p = pl.slab[j], q = tuck[j];
        o.push(slabs.vert([p.x, k + NOSE, p.z], [p.nx * r, -r, p.nz * r], ao, b));
        i.push(slabs.vert([q.x, k, q.z], [p.nx * 0.15, -0.99, p.nz * 0.15], ao, b));
      }
      for (let j = 0; j < n; j++) { const j2 = (j + 1) % n; slabs.quad(o[j], o[j2], i[j2], i[j]); }
      cap(slabs, tuck, pl.glass, k, false, a, 0.8, 0.35);
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
      // (each point carries the residence whose terrace it edges, one more than its side, found by the nearest stretch
      // of that level's glass, so a sold home's handrail can turn bronze; 0 off the residential levels)
      const gl = PL[idx(k)].glass, sd = (q) => {
        if (k < G.RES0 || k >= FLOORS) return 0;
        let best = 1e9, side = 0;
        for (let j = 0; j < gl.length; j++) { const a = gl[j], b = gl[(j + 1) % gl.length], d = Math.hypot((a.x + b.x) / 2 - q.x, (a.z + b.z) / 2 - q.z); if (d < best) { best = d; side = S.SIDE[k][j] + 1; } }
        return side;
      };
      if (r) band(rails, r, k + SLAB, k + SLAB + RAIL_H, (j, s) => [[k, 0, s, 0], [k + SLAB, k + SLAB + RAIL_H, 0, sd(r[j])]]);
    }
    // frosted screens between neighbours' terraces, where the two residences of a level meet
    for (let k = G.RES0; k < CROWN; k++) {
      const pl = PL[k];
      for (const j of S.SPLIT) {
        const g = pl.glass[j], e = pl.slab[j], nx = -(e.z - g.z), nz = e.x - g.x, nl = Math.hypot(nx, nz) || 1, nr = [nx / nl, 0, nz / nl];
        const A = [k, 0, 0, 0], B = [k + SLAB, k + 1, 1, 0];
        const q = [[g.x, k + SLAB, g.z], [e.x, k + SLAB, e.z], [e.x, k + 0.92, e.z], [g.x, k + 0.92, g.z]].map((pp) => rails.vert(pp, nr, A, B));
        rails.quad(q[0], q[1], q[2], q[3]);
      }
    }
    // the crown: its screen of fins, rising to its crest over the bay (each fin's own height is its top, so the
    // lantern's glow fills it to the top whatever it is)
    const y0 = FLOORS + SLAB, sc = S.SCREEN, ns = sc.length;
    const CH = sc.reduce((v, p) => v + CREST(p), 0) / ns;
    {
      let s = 0;
      for (let j = 0; j < ns; j++) {
        const p = sc[j], q = sc[(j + 1) % ns], len = Math.hypot(q.x - p.x, q.z - p.z), tp = y0 + CREST(p), tq = y0 + CREST(q);
        const a0 = [0, 0.9, s, 1], a1 = [0, 0.9, s + len, 1], b0 = [y0, tp, 0, 0], b1 = [y0, tq, 0, 0];
        const v0 = crown.vert([p.x, y0, p.z], [p.nx, 0, p.nz], a0, b0), v1 = crown.vert([q.x, y0, q.z], [q.nx, 0, q.nz], a1, b1);
        const v2 = crown.vert([q.x, tq, q.z], [q.nx, 0, q.nz], a1, b1), v3 = crown.vert([p.x, tp, p.z], [p.nx, 0, p.nz], a0, b0);
        crown.quad(v0, v3, v2, v1);
        // (and its inner face, so the screen reads as a thin open crown from above rather than a box)
        const w0 = crown.vert([p.x, y0, p.z], [-p.nx, 0, -p.nz], a0, b0), w1 = crown.vert([q.x, y0, q.z], [-q.nx, 0, -q.nz], a1, b1);
        const w2 = crown.vert([q.x, tq, q.z], [-q.nx, 0, -q.nz], a1, b1), w3 = crown.vert([p.x, tp, p.z], [-p.nx, 0, -p.nz], a0, b0);
        crown.quad(w0, w1, w2, w3);
        s += len;
      }
    }
    // Inside the screen, the sky lounge: a storey of glass set back on the roof (lit as the lobby is), the terrace
    // round it open to the sky between the fins, and over both a thin roof that floats on the fins' tops, sloping with
    // the crest and reaching a little past them, so the tide ends in a lantern rather than a drum
    {
      const lr = sc.map((p) => ({ x: p.x * 0.78, z: p.z * 0.78, nx: p.nx, nz: p.nz })), LH = 0.92;
      band(glass, lr, y0, y0 + LH, (j, s) => [[FLOORS - 1, 0, s, 1], [y0, y0 + LH, j % 12, 0]]);
      const br = sc.map((p) => ({ x: p.x + p.nx * 0.45, z: p.z + p.nz * 0.45 })), hb = sc.map((p) => y0 + CREST(p)), T = 0.15;
      const top = [], bot = [], eT = [], eB = [], a = [0, 0.92, 0, 0], b = [0, 0, 0, 0];
      const cT = crown.vert([0, y0 + CH + T, 0], [0, 1, 0], a, b), cB = crown.vert([0, y0 + CH, 0], [0, -1, 0], a, b);
      let s = 0;
      for (let j = 0; j < ns; j++) {
        const q = br[j], p = sc[j], sj = [0, 0.92, s, 0];
        top.push(crown.vert([q.x, hb[j] + T, q.z], [0, 1, 0], a, b));
        bot.push(crown.vert([q.x, hb[j], q.z], [0, -1, 0], a, b));
        eT.push(crown.vert([q.x, hb[j] + T, q.z], [p.nx, 0, p.nz], sj, b));
        eB.push(crown.vert([q.x, hb[j], q.z], [p.nx, 0, p.nz], sj, b));
        s += Math.hypot(sc[(j + 1) % ns].x - p.x, sc[(j + 1) % ns].z - p.z);
      }
      for (let j = 0; j < ns; j++) {
        const j2 = (j + 1) % ns;
        crown.tri(cT, top[j2], top[j]); crown.tri(cB, bot[j], bot[j2]);
        crown.quad(eB[j], eT[j], eT[j2], eB[j2]);
      }
    }
    // the porte-cochère: a leaf of a roof on two slender posts, its soffit high enough for a coach, its edge the
    // terraces' blade (a thin face over an underside that rounds back and up), so the tower's line comes down to the door
    const cr = CANOPY.map((p) => ({ x: p.x * 0.6, z: (p.z + 5.5) * 0.6 - 5.5 }));
    {
      const CT = 0.34, tuck = CANOPY.map((p) => ({ x: p.x - p.nx * CT, z: p.z - p.nz * CT })), n = CANOPY.length, r = Math.SQRT1_2;
      const a = [0, 1, 0, 0], b = [PORTE, PORTE + 0.2, 0, 0], ao = [0, 0.8, 0, 0];
      band(canopy, CANOPY, PORTE + 0.12, PORTE + 0.2, () => [a, b]);
      cap(canopy, CANOPY, cr, PORTE + 0.2, true, [0, 0, 0, 0], 0.95, 0.9);
      const o = [], i = [];
      for (let j = 0; j < n; j++) {
        const p = CANOPY[j], q = tuck[j];
        o.push(canopy.vert([p.x, PORTE + 0.12, p.z], [p.nx * r, -r, p.nz * r], ao, b));
        i.push(canopy.vert([q.x, PORTE - 0.02, q.z], [p.nx * 0.15, -0.99, p.nz * 0.15], ao, b));
      }
      for (let j = 0; j < n; j++) { const j2 = (j + 1) % n; canopy.quad(o[j], o[j2], i[j2], i[j]); }
      cap(canopy, tuck, cr, PORTE - 0.02, false, [0, 0, 0, 0], 0.75, 0.7);
    }
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
        // (a royal palm: a smooth grey trunk swelling a little low down, under the green crownshaft at its top)
        const cs = t > 0.8 ? 1 : 0, rr = cs ? 0.085 : r * (1 + 0.25 * Math.exp(-t * 6));
        for (let m = 0; m < 6; m++) { const a = (m / 6) * TAU, nx = Math.cos(a), nz = Math.sin(a); row.push(deck.vert([cx + nx * rr, hgt * (cs && i === 8 ? 1.02 : t), cz + nz * rr], [nx, 0, nz], [0, 0.9, t, 3], [0, cs, 0, 0])); }
        ring.push(row);
      }
      for (let i = 0; i < 8; i++) for (let m = 0; m < 6; m++) deck.quad(ring[i][m], ring[i][(m + 1) % 6], ring[i + 1][(m + 1) % 6], ring[i + 1][m]);
      // its fronds in two tiers, the upper rising and arching over, the lower spreading and hanging down
      for (let f = 0; f < 16; f++) {
        const hi = f % 2 === 0, a = turn + (f * TAU) / 16 + 0.3 * Math.sin(f * 2.3), len = (hi ? 1.45 : 1.7) + 0.35 * hash(f + x * 3.1), up = hi ? 1.1 : 0.35, dr = hi ? 1.25 : 1.05;
        const ca = Math.cos(a), sa = Math.sin(a), pt = (t) => [tx + ca * len * t, hgt + len * (up * t - dr * t * t), tz + sa * len * t];
        let prev = null;
        for (let i = 0; i <= 10; i++) {
          const t = i / 10, p = pt(t), w = 0.3 * Math.pow(Math.sin(Math.PI * Math.min(1, t * 1.1 + 0.05)), 0.6) + 0.02;
          const slope = up - 2 * dr * t, nr = [-ca * slope, 1, -sa * slope], nl = Math.hypot(...nr);
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
    return { slabs, cols, core, glass, ghost, rails, crown, canopy, deck, cars, ground };
  }

  // ---------------------------------------------------------------- the sky behind
  // Drawn by the hero's drawing on its own canvas, under everything (model.js calls it while the rendered tower is
  // shown): the sky over Miami at this hour, kept low in key so the ink page and its type still hold, a haze along the
  // horizon, thin cloud, the sun's warmth on the side it stands, and a distant, generic skyline round the horizon, lit
  // after dark. Directions are the drawing's own, so the sky turns with the camera as a real one would.
  const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const css = (c, a) => `rgba(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])},${a == null ? 1 : a})`;
  const hash = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  // thin cloud: a strip of soft noise that wraps round the whole horizon (built once, 512 x 64)
  let cloudMask = null;
  function clouds() {
    if (cloudMask) return cloudMask;
    const W = 512, H = 64, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), img = g.createImageData(W, H), d = img.data;
    const vn = (x, y, px) => {
      const xi = Math.floor(x), yi = Math.floor(y), fx = x - xi, fy = y - yi, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
      const r = (i, j) => hash(((i % px) + px) % px + j * 57.13);
      return (r(xi, yi) * (1 - u) + r(xi + 1, yi) * u) * (1 - v) + (r(xi, yi + 1) * (1 - u) + r(xi + 1, yi + 1) * u) * v;
    };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      let n = 0, a = 0.5, fq = 1;
      for (let o = 0; o < 5; o++) { n += a * vn((x / W) * 12 * fq, (y / H) * 3 * fq + o * 7.1, 12 * fq); a *= 0.5; fq *= 2; }
      const band = Math.sin(Math.PI * y / (H - 1)), v = clamp((n - 0.5) / 0.28, 0, 1) * band;
      const i = (y * W + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(255 * v * v * (3 - 2 * v));
    }
    g.putImageData(img, 0, 0);
    return (cloudMask = c);
  }
  let cloudTint = null, cloudKey = '';
  function sky(m) {
    const sun = m.sunNow, el = sun.el, night = sun.night;
    const day = smooth(clamp((el + 4) / 16, 0, 1)), gold = clamp((20 - el) / 16, 0, 1) * day, dusk = smooth(clamp(1 - Math.abs(el + 3) / 6, 0, 1)) * (1 - day * 0.6);
    const ink = m.bg || [20, 22, 26];
    // (sRGB, in key with the page: a clear day is a deep slate blue over a pale haze, dusk a bronze horizon under indigo)
    let zen = mixc([24, 42, 70], [24, 30, 50], gold), hor = mixc([134, 150, 166], [168, 120, 84], gold);
    zen = mixc(mixc(ink, [12, 16, 30], 0.7), zen, day); hor = mixc([56, 46, 42], hor, day);
    hor = mixc(hor, [104, 74, 62], dusk * 0.8); zen = mixc(zen, [16, 20, 38], dusk * 0.6);
    return { zen, hor, ink, day, gold, night, dusk, mid: mixc(mixc(zen, hor, 0.42), [74, 62, 78], gold * 0.5 + dusk * 0.3) };
  }
  // (drawn straight onto the drawing, each time it draws: a few broad fills, which a graphics chip lays down in a blink,
  // and none of them over the whole canvas twice)
  // (o, under the hero's photograph: o.fill lays the broad fills on the canvas even once faded in, rather than as its
  // CSS background, so light can be added over them (see glow); o.cut [x0, x1, k] lifts the skyline out by k (0 to 1)
  // from x0 on, fully from x1, where the photograph has its own far city)
  function backdrop(g, m, alpha, o) {
    g.save(); g.globalAlpha = alpha; paint(g, m, m.w, m.h, o || {}); g.restore();
  }
  function paint(g, m, w, h, o) {
    const fill = !!o.fill, cut = o.cut;
    const k = m.k, S = sky(m), f = k.f, cy = k.cy, { zen, hor, mid, ink } = S, alpha = g.globalAlpha;
    // The sky, from about 40 degrees up down to the horizon at cy (elevation e as the tangent), then the ground beyond
    // the site under the haze, going down to the page's ink. Once the tower is in, these broad fills are the canvas's
    // own CSS background, which costs the page nothing as the drawing redraws; while it fades in they are drawn here.
    const ys = (e) => cy - e * f, G = Math.max(40, 0.32 * h);
    // (below the horizon, the bay: see water)
    const D = Math.max(1, h - cy), wc = waterStops(S);
    const st = [[ys(0.9), mixc(zen, ink, 0.25)], [ys(0.45), zen], [ys(0.16), mid], [ys(0.05), mixc(mid, hor, 0.7)], [cy, hor], ...wc.map(([t, c]) => [cy + t * D, c])];
    if (alpha < 1 || !m.c || fill) {
      const y0 = st[0][0], y1 = st[st.length - 1][0], gr = g.createLinearGradient(0, y0, 0, y1);
      for (const [y, c] of st) gr.addColorStop(clamp((y - y0) / (y1 - y0), 0, 1), css(c));
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }
    if (m.c) {
      const v = alpha < 1 || fill ? '' : 'linear-gradient(180deg,' + st.map(([y, c]) => css(c) + ' ' + y.toFixed(1) + 'px').join() + ')';
      if (m.skyCss !== v) { m.skyCss = v; m.c.style.backgroundImage = v; }
    }
    // a direction's place on screen (or null behind the camera)
    const scr = (x, y, z) => { const X = k.c * x - k.s * z, Z = k.s * x + k.c * z; return Z > 0.05 ? [k.cx + f * X / Z, cy - f * y / Z, Z] : null; };
    // the sun's warmth in the sky on its side, once it is low and gold
    const sv = m.sunNow.v, sl = Math.hypot(sv[0], sv[1], sv[2]) || 1, sp = scr(sv[0] / sl, Math.max(sv[1] / sl, -0.02), sv[2] / sl);
    const warm = 0.34 * S.gold * (1 - S.night);
    if (sp && warm > 0.02) {
      const r = Math.max(w, h) * 0.55, rg = g.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], r);
      const c = mixc([255, 226, 186], [236, 150, 92], S.gold);
      rg.addColorStop(0, css(c, warm)); rg.addColorStop(0.25, css(c, warm * 0.35)); rg.addColorStop(1, css(c, 0));
      const gx = Math.max(0, sp[0] - r), gy = Math.max(0, sp[1] - r);
      g.fillStyle = rg; g.fillRect(gx, gy, Math.min(w, sp[0] + r) - gx, Math.min(h, cy + 0.05 * f, sp[1] + r) - gy);
    }
    // thin cloud in two layers, the nearer lower and wider, turning with the view (one turn of the strip is one round
    // of the horizon), lit from below by a low sun and by the city at night
    const az = Math.atan2(k.s, k.c), cc = mixc(mixc(hor, [236, 228, 214], 0.18 * S.day), [220, 150, 104], S.gold * 0.5);
    const key = cc.map(Math.round).join();
    if (key !== cloudKey) {
      const mk = clouds(); cloudKey = key;
      cloudTint = cloudTint || document.createElement('canvas'); cloudTint.width = mk.width; cloudTint.height = mk.height;
      const t = cloudTint.getContext('2d'); t.globalCompositeOperation = 'copy'; t.fillStyle = css(cc); t.fillRect(0, 0, mk.width, mk.height);
      t.globalCompositeOperation = 'destination-in'; t.drawImage(mk, 0, 0);
    }
    const ca = 0.42 + 0.1 * S.gold - 0.22 * S.night;
    for (const [e0, e1, sx, a, off] of [[0.2, 0.42, 1, 0.55, 0.37], [0.035, 0.16, 1.6, 1, 0]]) {
      const tw = TAU * f * sx, y0 = ys(e1), hh = ys(e0) - y0;
      let x = k.cx - ((az / TAU + off) % 1 + 1) % 1 * tw - tw;
      g.globalAlpha = alpha * ca * a;
      for (; x < w; x += tw) if (x + tw > 0) g.drawImage(cloudTint, x, y0, tw, hh);
    }
    g.globalAlpha = alpha;
    // haze along the horizon
    const hz = g.createLinearGradient(0, cy - 0.06 * f, 0, cy + 0.02 * f);
    hz.addColorStop(0, css(hor, 0)); hz.addColorStop(0.75, css(hor, 0.45)); hz.addColorStop(1, css(hor, 0));
    g.fillStyle = hz; g.fillRect(0, cy - 0.06 * f, w, 0.08 * f);
    // under the hero's photograph, from the cut on, the haze just over the horizon a little brighter, as the stills were
    // judged against: a band about 2% of the lens high, coming in over its top 40% and gone just under the horizon
    if (cut && cut[2] > 0) {
      const y0 = cy - 0.0207 * f, y1 = cy + 0.0018 * f, lg = g.createLinearGradient(0, y0, 0, y1);
      lg.addColorStop(0, css(hor.map((v) => v + 60), 0)); lg.addColorStop(0.4, css(hor.map((v) => v + 60), 0.16)); lg.addColorStop(1, css(hor.map((v) => v + 60), 0.16));
      g.fillStyle = lg;
      for (let i = 0; i < 8; i++) { const x0 = cut[0] + ((cut[1] - cut[0]) * i) / 8; g.globalAlpha = alpha * cut[2] * smooth((i + 0.5) / 8); g.fillRect(x0, y0, i < 7 ? (cut[1] - cut[0]) / 8 : w - x0, y1 - y0); }
      g.globalAlpha = alpha;
    }
    // a distant, generic skyline round the horizon, in towns: lighter than the ground, darker than the haze behind it
    const N = 720, sil = mixc(mixc(hor, ink, 0.4), zen, 0.15), lamps = [];
    skyl.length = 0; skyl.sil = sil; skyl.lamps = lamps;
    // (in aerial perspective: the towers fade into the haze toward their feet)
    const sg = g.createLinearGradient(0, cy - 0.04 * f, 0, cy);
    sg.addColorStop(0, css(sil)); sg.addColorStop(1, css(mixc(sil, hor, 0.45)));
    g.fillStyle = sg; g.beginPath();
    let open = false;
    for (let i = 0; i < N; i++) {
      const a0 = (i / N) * TAU, town = Math.pow(0.5 + 0.5 * Math.sin(a0 * 3 + 1.3) * Math.sin(a0 * 2 + 0.4), 3);
      // (mostly low and broken, with a slender tower here and there standing well clear of the rest, and gaps between)
      // (the low city runs on in clusters that rise and fall together, with a slender tower here and there above it)
      const r = hash(i), tall = r > 0.94 ? 1 : 0, cl = 0.5 + 0.5 * Math.sin(i * 0.37 + 2 * Math.sin(i * 0.11));
      const hgt = town * (tall ? 0.02 + 0.016 * hash(i + 3) : 0.003 + 0.009 * cl * cl + 0.004 * r * r) + 0.001 * hash(i + 9);
      const a1 = ((i + (tall ? 0.5 : hash(i + 5) > 0.85 ? 0.7 : 1.02)) / N) * TAU, p0 = scr(Math.sin(a0), 0, Math.cos(a0)), p1 = scr(Math.sin(a1), 0, Math.cos(a1));
      if (!p0 || !p1 || p1[0] < -2 || p0[0] > w + 2) { open = false; continue; }
      // (on a wide hero the left half carries the headline: the towns sink away under it)
      const yh = cy - f * hgt * (w > 820 ? smooth(clamp((p0[0] - 0.42 * w) / (0.2 * w), 0, 1)) : 1) * (cut ? 1 - cut[2] * smooth(clamp((p0[0] - cut[0]) / (cut[1] - cut[0]), 0, 1)) : 1) / p0[2];
      if (!open) { g.moveTo(p0[0], cy + 1); open = true; }
      g.lineTo(p0[0], cy + 1); g.lineTo(p0[0], yh); g.lineTo(p1[0], yh); g.lineTo(p1[0], cy + 1);
      if (cy - yh > 0.5) skyl.push(p0[0], p1[0], cy - yh);
      if (S.night > 0.1 && cy - yh > 3) for (let j = 0; j < 3; j++) if (hash(i * 3 + j) > 0.45) lamps.push([p0[0] + (p1[0] - p0[0]) * (0.25 + 0.25 * j), cy - (cy - yh) * (0.2 + 0.7 * hash(i + j * 5))]);
    }
    g.fill();
    if (lamps.length) { g.fillStyle = `rgba(236,196,142,${0.5 * S.night})`; for (const [x, y] of lamps) g.fillRect(x - 0.5, y - 0.5, 1, 1); }
    water(g, m, S, w, h, fill);
  }

  // The bay: drawn by the hero's drawing over the ground east of the site (pts, its outline on screen), after the sky.
  // The water mirrors the sky over it, brightest at the horizon where it is seen at a graze and deepening toward the
  // page's ink below; a fine swell breaks it into lines that close up toward the horizon, turning with the view as the
  // cloud does; the far shore stands in it upside down and fainter; under a low sun a path of light runs to the eye.
  const skyl = [];
  let ripMask = null, ripTint = null, ripKey = '';
  function ripples() {
    if (ripMask) return ripMask;
    const W = 1024, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.fillStyle = '#fff';
    // rows a little further apart as they come nearer (the strip is laid from the horizon down), each a string of
    // short dashes, longer and fainter far off
    for (let r = 0, y = 0.6; y < H; r++) {
      const t = y / H, n = Math.round(60 + 140 * (1 - t));
      for (let i = 0; i < n; i++) {
        const x = hash(r * 31.7 + i * 1.3) * W, len = (4 + 26 * hash(r + i * 7.1)) * (1.6 - t);
        g.globalAlpha = 0.25 + 0.75 * hash(i * 3.3 + r);
        g.fillRect(x, y, len, Math.max(0.6, 1.4 * t)); if (x + len > W) g.fillRect(x - W, y, len, Math.max(0.6, 1.4 * t));
      }
      y += 0.7 + 5.5 * t * t;
    }
    return (ripMask = c);
  }
  // the water's own colour from the horizon down (t, a share of the height below it): the sky it mirrors
  const waterStops = (S) => {
    const { zen, hor, ink } = S;
    return [[0, mixc(hor, ink, 0.06)], [0.035, mixc(mixc(hor, zen, 0.45), ink, 0.18)], [0.16, mixc(zen, ink, 0.35)], [0.5, mixc(zen, ink, 0.62)], [1, mixc(zen, ink, 0.85)]];
  };
  function water(g, m, S, w, h, fill) {
    const k = m.k, f = k.f, cy = k.cy, { hor, ink } = S, alpha = g.globalAlpha, D = Math.max(1, h - cy);
    if (alpha < 1 || !m.c || fill) {
      const gr = g.createLinearGradient(0, cy, 0, h);
      for (const [t, c] of waterStops(S)) gr.addColorStop(t, css(c));
      g.fillStyle = gr; g.fillRect(0, cy, w, D);
    }
    g.save();
    // the far shore upside down in it, and its lamps drawn out into streaks after dark
    const rg = g.createLinearGradient(0, cy, 0, cy + 0.03 * f);
    rg.addColorStop(0, css(mixc(skyl.sil || hor, ink, 0.25), 0.4)); rg.addColorStop(1, css(mixc(skyl.sil || hor, ink, 0.25), 0));
    g.fillStyle = rg;
    for (let i = 0; i < skyl.length; i += 3) g.fillRect(skyl[i], cy, skyl[i + 1] - skyl[i], skyl[i + 2] * 0.6);
    if (skyl.lamps && skyl.lamps.length) { g.fillStyle = `rgba(236,196,142,${0.22 * S.night})`; for (const [x, y] of skyl.lamps) g.fillRect(x - 0.5, cy + (cy - y) * 0.8, 1, 2 + (cy - y) * 0.9); }
    // the swell, tinted with the light it carries
    const rc = mixc(mixc(hor, [236, 228, 214], 0.25 * S.day), [220, 160, 110], S.gold * 0.6), key = rc.map(Math.round).join();
    if (key !== ripKey) {
      const mk = ripples(); ripKey = key;
      ripTint = ripTint || document.createElement('canvas'); ripTint.width = mk.width; ripTint.height = mk.height;
      const t = ripTint.getContext('2d'); t.globalCompositeOperation = 'copy'; t.fillStyle = css(rc); t.fillRect(0, 0, mk.width, mk.height);
      t.globalCompositeOperation = 'destination-in'; t.drawImage(mk, 0, 0);
    }
    const az = Math.atan2(k.s, k.c), tw = TAU * f * 0.9, rh = Math.min(D, 0.55 * f);
    let x0 = k.cx - ((az / TAU) % 1 + 1) % 1 * tw - tw;
    // (on a wide hero the left half carries the headline and its lede: the swell stays out from under them; under the
    // photograph, whose own bay carries its swell, the drawn water beside it lies still, sa being how far it has come in)
    const still = 1 - (m.sa || 0), ra = alpha * still * (0.24 + 0.12 * S.day - 0.1 * S.night), xl = w > 820 ? 0.46 * w : 0;
    const bands = xl ? Array.from({ length: 9 }, (_, i) => [(i + 1) / 9, xl + (i * 0.14 * w) / 8, i < 8 ? xl + ((i + 1) * 0.14 * w) / 8 : w]) : [[1, 0, w]];
    for (const [a0, xa, xb] of bands) {
      g.save(); g.beginPath(); g.rect(xa, cy, xb - xa, rh); g.clip(); g.globalAlpha = ra * a0;
      for (let x = x0; x < w; x += tw) if (x + tw > 0) g.drawImage(ripTint, x, cy, tw, rh);
      g.restore();
    }
    // the sun's path on the water, under a sun in front of the eye
    const sv = m.sunNow.v, sl = Math.hypot(sv[0], sv[1], sv[2]) || 1, X = k.c * sv[0] - k.s * sv[2], Z = k.s * sv[0] + k.c * sv[2];
    const glow = (0.25 * S.day + 0.6 * S.gold) * (1 - S.night);
    if (Z > 0.05 && glow > 0.02) {
      const sx = k.cx + (f * X) / Z, cw = (0.03 + 0.08 * (1 - sv[1] / sl)) * f;
      g.save(); g.beginPath(); g.rect(sx - cw, cy, 2 * cw, rh); g.clip();
      g.globalAlpha = alpha * still * glow;
      for (let x = x0; x < w; x += tw) if (x + tw > 0) g.drawImage(ripTint, x, cy, tw, rh);
      g.restore();
      const cg = g.createRadialGradient(sx, cy, 0, sx, cy, cw * 2.2);
      cg.addColorStop(0, css(rc, 0.18 * glow)); cg.addColorStop(1, css(rc, 0));
      g.globalAlpha = alpha; g.fillStyle = cg; g.fillRect(sx - cw * 2.2, cy, cw * 4.4, cw * 2.2);
    }
    // and the haze where the water meets the sky
    g.globalAlpha = alpha;
    const hz = g.createLinearGradient(0, cy, 0, cy + 0.02 * f);
    hz.addColorStop(0, css(hor, 0.35)); hz.addColorStop(1, css(hor, 0));
    g.fillStyle = hz; g.fillRect(0, cy, w, 0.02 * f);
    g.restore();
  }

  // the ground of the site and the land round it, drawn over the bay by the hero's drawing (pts, its outline on screen)
  function land(g, m, pts) {
    if (pts.length < 3) return;
    const S = sky(m), k = m.k, cy = k.cy, h = m.h, near = mixc(S.ink, [46, 48, 51], S.day), far = mixc(mixc(S.hor, S.ink, 0.6), near, 0.5);
    const gr = g.createLinearGradient(0, cy, 0, h);
    gr.addColorStop(0, css(far)); gr.addColorStop(0.25, css(near)); gr.addColorStop(1, css(mixc(near, S.ink, 0.5)));
    g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.closePath(); g.fillStyle = gr; g.fill();
  }

  // The sky's light behind the tower (SKY_FS, as the renderer draws it with the tower), drawn without WebGL: the same
  // soft band of the horizon's colour on the same plane, 11 units beyond the tower's axis, 14 either side of it across
  // the view and from just under the ground to 25.7 up, added to what is under it. It needs the sky laid on the canvas
  // under it (backdrop with fill): over the canvas's CSS background, added light would only grey it. The band is made
  // once for each light, at 128 x 64, and stretched over the plane on screen (it faces the eye, so it is a rectangle).
  let glowTex = null, glowKey = '';
  function glow(g, m, alpha) {
    const k = m.k, sun = m.sunNow, el = sun.el, night = sun.night;
    const day = smooth(clamp((el + 4) / 16, 0, 1)), gold = clamp((20 - el) / 16, 0, 1) * day;
    const hor = mixc([0.03, 0.026, 0.028], mixc([0.62, 0.7, 0.8], [0.95, 0.6, 0.42], gold), day), G = 0.05 + 0.1 * gold + 0.04 * night;
    const key = hor.map((v) => v.toFixed(4)).join() + G.toFixed(4);
    if (key !== glowKey) {
      glowKey = key;
      const W = 128, H = 64, c = glowTex || (glowTex = document.createElement('canvas')); c.width = W; c.height = H;
      const q = c.getContext('2d'), img = q.createImageData(W, H), d = img.data;
      const tone = (x) => { x *= 0.9; x = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); return Math.round(255 * Math.pow(clamp(x, 0, 1), 1 / 2.2)); };
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
        const u = -1 + (2 * (i + 0.5)) / W, y = 1 - (j + 0.5) / H, t = clamp(y / 0.06, 0, 1), a = clamp((Math.abs(u) - 0.7) / 0.25, 0, 1);
        const v = Math.exp(-u * u * 5) * (1 - a * a * (3 - 2 * a)) * Math.exp(-Math.pow((y - 0.16) / 0.2, 2)) * t * t * (3 - 2 * t) * G, o = (j * W + i) * 4;
        d[o] = tone(hor[0] * v); d[o + 1] = tone(hor[1] * v); d[o + 2] = tone(hor[2] * v); d[o + 3] = 255;
      }
      q.putImageData(img, 0, 0);
    }
    const s = k.f / (k.d + 11), y0 = k.cy - (25.7 - k.ey) * s, y1 = k.cy + (0.3 + k.ey) * s;
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = alpha; g.drawImage(glowTex, k.cx - 14 * s, y0, 28 * s, y1 - y0); g.restore();
  }

  // (the sky, its light behind the tower and the land stand on their own too: under the desktop hero's photograph,
  // which stands in for the rendered tower, and where WebGL is not to hand)
  window.CentamontSky = { backdrop, land, glow };

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
    const R = { canvas, ready: false, lost: false, q: opt.q || 1, cw: 0, ch: 0, box: null, backdrop: (g, m, a, o) => backdrop(g, m, a, o), land: (g, m, p) => land(g, m, p) };
    canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); R.lost = true; if (opt.onLost) opt.onLost(); });

    // compile without stalling the page where the engine can (the programs link in the background)
    const par = gl.getExtension('KHR_parallel_shader_compile');
    const progs = {};
    const make = (name, fs) => {
      const p = gl.createProgram(), sh = [[gl.VERTEX_SHADER, VS], [gl.FRAGMENT_SHADER, fs]].map(([t, src]) => { const s = gl.createShader(t); gl.shaderSource(s, src); gl.compileShader(s); gl.attachShader(p, s); return s; });
      gl.linkProgram(p);
      progs[name] = { p, sh, u: null };
    };
    make('depth', DEPTH_FS); make('solid', SOLID_FS); make('glass', GLASS_FS); make('rail', RAIL_FS); make('ground', GROUND_FS); make('ghost', GHOST_FS); make('sky', SKY_FS);
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
    // the sky's quad, set facing the eye at each drawing (four vertices, rewritten in place)
    const skyBuf = gl.createBuffer(), skyVao = gl.createVertexArray(), skyV = new Float32Array(4 * 14);
    gl.bindVertexArray(skyVao); gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf); gl.bufferData(gl.ARRAY_BUFFER, skyV.byteLength, gl.DYNAMIC_DRAW);
    [[0, 3, 0], [1, 3, 12], [2, 4, 24], [3, 4, 40]].forEach(([l, sz, off]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, sz, gl.FLOAT, false, 56, off); });
    const skyIb = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, skyIb); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
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
    // each room's window, for its glow after dark: the middle of its glass, its outward direction and its width
    const ROOMS = [];
    { const S = G.set(6); for (let k = 2; k < FLOORS; k++) { const pl = S.PLANS[k].glass, n = pl.length; for (let r = 0; r < 12; r++) { let x = 0, z = 0, nx = 0, nz = 0, w = 0, c = 0; for (let j = 0; j < n; j++) if (S.RM[j] === r) { const a = pl[j], b = pl[(j + 1) % n], l = Math.hypot(b.x - a.x, b.z - a.z); x += (a.x + b.x) / 2 * l; z += (a.z + b.z) / 2 * l; nx += a.nx + b.nx; nz += a.nz + b.nz; w += l; c++; } if (!c) continue; const nl = Math.hypot(nx, nz) || 1; ROOMS.push({ k, r, x: x / w + nx / nl * 0.05, z: z / w + nz / nl * 0.05, nx: nx / nl, nz: nz / nl, w }); } } }
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
          if (k < 2) v = Math.max(0.3 * (1 - night) + 0.8 * (0.3 + 0.7 * night) * cas(0), 0.2); // (by day the lobby is lit, but under the daylight)
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
      const sunCol = [1, 0.95, 0.88].map((c, i) => (c * (1 - gold) + [1, 0.6, 0.34][i] * gold) * (4.0 - 1.5 * gold) * kd);
      const mixv = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
      const zen = mixv([0.006, 0.008, 0.016], mixv([0.16, 0.3, 0.62], [0.2, 0.25, 0.42], gold), day);
      const hor = mixv([0.03, 0.026, 0.028], mixv([0.62, 0.7, 0.8], [0.95, 0.6, 0.42], gold), day);
      const grd = mixv([0.006, 0.006, 0.006], [0.1, 0.095, 0.085], day);
      const bronze = lin(m.sold || [184, 151, 106]);
      // the veil's colour: the radiance that the tone curve takes to the backdrop's haze behind the tower
      const sp = sky(m), air = { c: mixc(sp.hor, sp.mid, 0.5).map((v) => untone(v / 255)), f: 0.08 * sp.day + 0.05 * (1 - sp.day) };
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
      const lims = { slabs: L + 0.001, cols: L - 0.999, core: coreTop - 0.999, glass: C - 0.999, crown: Gc > 0.01 ? 1 : -1, canopy: L >= 2 ? 1 : -1, deck: L > PODIUM + 0.5 ? 1 : -1 };
      lims.ghost = -C + 0.001; lims.cars = (m.occ || 0) > 0.5 ? 1 : -1;
      lims.rails = C >= FLOORS - 0.001 && Gc > 0.5 ? FLOORS : C - 0.999;
      const crownY = [FLOORS + SLAB, Ge, 0];
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
        if (u.uAirC) { gl.uniform3fv(u.uAirC, air.c); gl.uniform1f(u.uAir, air.f); gl.uniform1f(u.uAirD, k.d); }
        if (u.uLS) gl.uniformMatrix4fv(u.uLS, false, LS || VP);
        if (u.uShadow) gl.uniform1i(u.uShadow, 0); if (u.uRooms) gl.uniform1i(u.uRooms, 1);
        if (u.uTexel) gl.uniform2f(u.uTexel, 0.8 / SM, 0.8 / SM);
        if (u.uOcc) gl.uniform1f(u.uOcc, occ);
      };
      // (the drawing's camera looks along +z with y up, so a face turned to the eye winds clockwise on screen)
      gl.enable(gl.CULL_FACE); gl.cullFace(gl.BACK); gl.frontFace(gl.CW);
      // the sky's light behind it all (added light only, so nothing it touches darkens)
      {
        const D = 11, cxw = fw[0] * D, czw = fw[2] * D, Wd = 14, Ht = 26;
        const cor = [[-1, 0], [1, 0], [1, 1], [-1, 1]];
        cor.forEach(([u, v], i) => { const o = i * 14; skyV.set([cxw + rt[0] * Wd * u, v * Ht - 0.3, czw + rt[2] * Wd * u, -fw[0], 0, -fw[2], 0, 0, 0, 0, u, v, 0, 0], o); });
        gl.bindBuffer(gl.ARRAY_BUFFER, skyBuf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, skyV);
        const qk = progs.sky; common(qk); gl.uniform1f(qk.u.uGlow, 0.05 + 0.1 * gold + 0.04 * night);
        gl.uniform1f(qk.u.uLim, 1); gl.uniform3fv(qk.u.uY, [0, 1, 0]);
        gl.depthMask(false); gl.disable(gl.CULL_FACE); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
        gl.bindVertexArray(skyVao); gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
        gl.disable(gl.BLEND); gl.depthMask(true);
      }
      const qs = progs.solid; common(qs); gl.uniform1f(qs.u.uWork, L > 0.5 && L < FLOORS - 0.01 ? L + SLAB : -1);
      for (const nm of ['slabs', 'cols', 'core', 'canopy', 'cars']) draw(qs, nm, lims[nm]);
      gl.disable(gl.CULL_FACE);
      draw(qs, 'deck', lims.deck);
      draw(qs, 'crown', lims.crown, crownY);
      gl.enable(gl.CULL_FACE);
      const qg = progs.glass; common(qg); draw(qg, 'glass', lims.glass);
      gl.disable(gl.CULL_FACE);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
      const qr = progs.ground; common(qr); draw(qr, 'ground', 1);
      const qh = progs.ghost; common(qh); draw(qh, 'ghost', lims.ghost);
      const ql = progs.rail; common(ql); draw(ql, 'rails', lims.rails);
      gl.depthMask(true); gl.disable(gl.BLEND); gl.disable(gl.SCISSOR_TEST);
      // the lit rooms' glow, for the drawing to lay over the render (it spreads past the glass, as light does)
      const glows = [];
      if (night > 0.05) for (const q of ROOMS) {
        const v = roomData[(q.k * RW + q.r) * 4] / 255;
        if (v < 0.02 || q.k > C - 1) continue;
        const ex = e[0] - q.x, ey = e[1] - (q.k + 0.58), ez = e[2] - q.z, el = Math.hypot(ex, ey, ez), face = (q.nx * ex + q.nz * ez) / el;
        if (face < 0.12) continue;
        const pp = m.P(q.x, q.k + 0.58, q.z), sc = f / pp[2];
        glows.push([pp[0], pp[1], q.w * sc * 0.7, sc * 0.75, v * 0.32 * night * Math.sqrt(face), roomData[(q.k * RW + q.r) * 4 + 1] ? 1 : 0]);
      }
      R.box = { x: x0, y: y0, w: bw, h: bh, sw: pw, sh: ph, sy: 0, glows };
      return R.box;
    };
    return R;
  };
})();
