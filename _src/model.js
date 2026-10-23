// Centamont tower model: an architectural study of a generic waterfront tower, drawn on canvas.
// It is an illustration, never a real project. The structure rises floor by floor with its core
// leading and the glass following behind. Bronze is a pre-sale stacking plan: a residence turns
// bronze when it sells, and it can sell before the floor it sits on is built.
(function () {
  const FLOORS = 34, SLAB = 0.16, PODIUM = 3, CROWN = 32;
  // Two residences on every level above the podium, one on the bay (east) side and one on the city side: thirty-one
  // levels and sixty-two residences, the two penthouse levels at the crown (from CROWN) included.
  // The podium (lobby and amenities) and the crown (the plant screen and roof above the top floor) are never for sale.
  const RES0 = PODIUM, RES1 = FLOORS, LEVELS = RES1 - RES0;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion === 'off';
  const TAU = Math.PI * 2;
  // the drawing's few words, in the page's language (the Spanish and Portuguese pages set it on <html>)
  const LANG = document.documentElement.lang;
  const WORDS = ({
    es: { roof: 'CUBIERTA', release: 'PRIMERA ETAPA', rise: 'AMANECER', set: 'ATARDECER', noon: 'MEDIODÍA', frame: 'ESTRUCTURA', time: 'es-US', lv: 'N', site: 'TERRENO', street: 'CALLE', tower: 'TORRE' },
    'pt-BR': { roof: 'COBERTURA', release: 'PRIMEIRA ETAPA', rise: 'NASCER DO SOL', set: 'PÔR DO SOL', noon: 'MEIO-DIA', frame: 'ESTRUTURA', time: 'pt-BR', lv: 'P', site: 'TERRENO', street: 'RUA', tower: 'TORRE' },
  })[LANG] || { roof: 'ROOF', release: 'FIRST RELEASE', rise: 'SUNRISE', set: 'SUNSET', noon: 'NOON', frame: 'STRUCTURE', time: 'en-US', lv: 'L', site: 'SITE', street: 'STREET', tower: 'TOWER' };
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
  // (na: the chords to each rounded corner, 3 on a small drawing and 6 on a large one: see useSet below)
  function floorPlan(k, na) {
    let glass, off;
    const swell = (p) => { const a = Math.atan2(p.z, p.x); return Math.pow(clamp(0.5 + 0.34 * Math.sin(2 * a + k * 0.24) + 0.2 * Math.sin(a - k * 0.13), 0, 1), 2.2); };
    if (k < PODIUM) {
      // the lobby's glass comes down to a shallow plinth; the podium levels above carry eyebrow slabs that already
      // swell as the tower's terraces do, so the tide starts at the street
      glass = rrect(6.2, 4.2, 1.1, na, 3); off = (p) => (k === 0 ? 0.08 : 0.22 + 0.7 * swell(p));
    } else {
      // The tide: the terraces run round the tower as contour lines, two swells to a level, each a little further round
      // than the one below with a slower counter-swell over them, so their crests climb the façade on a long diagonal.
      // The plan slims as it rises and the swells deepen, from slim edges over the podium to deep terraces under the
      // crown, where the two penthouse levels draw in behind the deepest of them and the tide breaks into the crown.
      // (and over the last three levels the tide breaks: their terraces sweep out deeper, into the crown's brim)
      const t = Math.min(1, (k - PODIUM) / (CROWN - PODIUM)), sc = 1 - 0.12 * t, amp = 0.4 + 1.25 * Math.pow(t, 1.3) + 0.55 * Math.pow(clamp((k - CROWN + 3) / 3, 0, 1), 2);
      if (k < CROWN) { glass = rrect(3.1 * sc, 2.6 * sc, 1.7 * sc, na, 3); off = (p) => 0.15 + amp * swell(p); }
      else { glass = rrect(2.5, 2.05, 1.4, na, 3); off = (p) => 0.5 + 1.6 * swell(p); }
    }
    const rot = k < PODIUM ? 0 : 0.12 * Math.min(1, (k - PODIUM) / (CROWN - PODIUM));
    const c = Math.cos(rot), s = Math.sin(rot);
    const R = (x, z) => [c * x - s * z, s * x + c * z];
    const g = glass.map((p) => { const [x, z] = R(p.x, p.z), [nx, nz] = R(p.nx, p.nz); return { x, z, nx, nz, lx: p.x }; });
    const e = glass.map((p) => { const o = off(p), [x, z] = R(p.x + p.nx * o, p.z + p.nz * o), [nx, nz] = R(p.nx, p.nz); return { x, z, nx, nz }; });
    return { glass: g, slab: e, rot };
  }
  // The plan set in use: every plan, and everything traced from the plans, for one count of chords to a corner.
  // Every drawing chooses its own (Model.cs) and each scene and framing puts it in place first, so all the code below
  // reads the set of the drawing it is making. (Assigned by useSet, after everything a set is made from is defined.)
  let PLANS, SCREEN, RAILS, MULL, LOUVRE, SIDE, SPLIT, SIDEHULL, GALLERY, FAC, VMAP, RM, FALL, CS = 0;
  // (the plans with three chords to a corner, as every drawing had them before: the columns, the module counts and the
  // ruler's plane are found from these, so none of them moves when a drawing changes its set)
  const PLANS3 = Array.from({ length: FLOORS }, (_, k) => floorPlan(k, 3));
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
  // (the core's walls measured round it, for the hatch drawn on them)
  const CORE_S = CORE.reduce((a, p, j) => { const q = CORE[(j + 1) % CORE.length]; a.push(a[j] + Math.hypot(q.x - p.x, q.z - p.z)); return a; }, [0]);
  // The columns above the podium stand plumb, one above another from the podium roof to the roof, on a ring set at the
  // core's own turn and inside every floor's glass however the plates above them twist and taper: fourteen columns
  // evenly spaced round it, some 4.7 m apart. (Checked against every glass line, penthouses included; were a column ever
  // to fall outside one, the ring draws in until none does.) The podium below keeps its own grid on its glass line.
  const COLS = (() => {
    const ring = rrect(2.6, 2.05, 0.9, 12, 8), n = ring.length, acc = [0];
    for (let j = 0; j < n; j++) { const a = ring[j], b = ring[(j + 1) % n]; acc.push(acc[j] + Math.hypot(b.x - a.x, b.z - a.z)); }
    const c = Math.cos(CORE_ROT), s = Math.sin(CORE_ROT), N = 14, pts = [];
    for (let i = 0, j = 0; i < N; i++) {
      const d = ((i + 0.5) * acc[n]) / N;
      while (acc[j + 1] < d) j++;
      const a = ring[j], b = ring[(j + 1) % n], t = (d - acc[j]) / (acc[j + 1] - acc[j]), x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
      pts.push({ x: c * x - s * z, z: s * x + c * z });
    }
    // inside a convex ring traced counterclockwise, with a margin of a tenth of a unit
    const inside = (p, pl) => pl.every((a, j) => { const b = pl[(j + 1) % pl.length], ex = b.x - a.x, ez = b.z - a.z; return (ex * (p.z - a.z) - ez * (p.x - a.x)) / Math.hypot(ex, ez) > 0.1; });
    let k = 1;
    for (let i = 0; i < 20 && !pts.every((p) => PLANS3.every((pl, f) => f < PODIUM || inside({ x: p.x * k, z: p.z * k }, pl.glass))); i++) k *= 0.98;
    return pts.map((p) => ({ x: p.x * k, z: p.z * k }));
  })();
  // Glass balustrades just inside each terrace edge, the penthouse terraces and the roof terrace included.
  const RAIL_H = 0.3;
  // The crown: a louvred screen round the roof plant, set a little behind the top floor's glass line so the roof
  // reads as a cornice under it, with a terrace and its balustrade round the edge. Its blades rise and fall round the
  // tower as one swell, lowest on the city side and tallest over the bay (east), so the tide that runs up the terraces
  // breaks into the crown; SCREEN_H is the crest's height, CREST(p) the screen's height at a point of its line.
  const SCREEN_H = 2.6;
  const CREST = (p) => SCREEN_H * (0.4 + 0.6 * Math.pow(0.5 + 0.5 * Math.cos(Math.atan2(p.z, p.x) - 0.35), 1.4));
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
  // A hammerhead tower crane on the podium roof beside the tower's east face, tied into the slabs as the frame rises.
  // Its 14-unit jib reaches past the tower's far corner (about 9.5 units from the mast).
  const MAST = [4.4, 3.6], JIB = 14, MAST_W = 0.42;
  // The jib slews as the floors go up and comes to rest across the tower, west-south-west, as the frame tops off.
  // Once the frame tops off and the crown goes up (g, 0 to 1), it climbs once more, so its jib clears the crown's
  // coping by nearly two storeys. Seen from below, the jib passes behind the crown, which hides most of that height, so it
  // climbs a storey more, and a clear gap of about two thirds of a storey shows above the coping at any size; on a phone
  // (u px a level, under 12), where the jib's and the coping's lines would merge sooner, up to a storey and a third more
  // (all of it from 10 px a level down).
  const craneAt = (L, g = 0, u = 99) => ({ top: Math.max(7, L + 3.2) + (FLOORS + SLAB + SCREEN_H + 1.8 + Math.max(1, 1.3 * clamp((18 - u) / 8, 0, 1)) - FLOORS - 3.2) * g, ang: -2.75 + 0.45 * Math.sin((L - FLOORS) * 0.38) });
  // [x, z, height, lean, lean direction]
  // the sea wall round the point the site stands on (a rounded square in plan, 33 out from the tower), the bay beyond
  const SHORE = (() => { const o = [], A = 33, r = 9; for (let q = 0; q < 4; q++) for (let i = 0; i <= 6; i++) { const a = (q + i / 6) * Math.PI / 2, cx = (q === 0 || q === 3 ? 1 : -1) * (A - r), cz = (q < 2 ? 1 : -1) * (A - r); o.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); } return o; })();
  const PALMS = [[-8.3, -6.1, 3.9, 0.5, 3.6], [-6.3, -7.1, 4.2, 0.45, 4.4], [5.0, -7.3, 3.6, 0.4, 5.2], [-8.6, 5.6, 3.5, 0.4, 2.4], [8.4, 5.8, 3.7, 0.5, 0.4], [-0.6, 6.7, 3.3, 0.35, 1.4], [9.0, 0.6, 3.1, 0.3, 0.1]];
  // where the story names its plan: the site's name past its far line, the tower's on its footprint, the street's past its
  // far kerb, and the north point's ring, as [x, z, which] (which: 0 site, 1 tower, 2 street, 3 the north point's reach)
  const PLAN_NOTES = [[3.6, 8.6, 0], [0, 0, 1], [-3.5, -15.6, 2], [12.5, 11.6, 3], [13.6, 9.5, 3], [11.4, 9.5, 3]];
  // People at the entrance, for scale (a level is about 3.8 m): [x, z, height]. Two stand under the porte-cochère.
  const FIGS = [[-1.3, -5.5, 0.47], [-0.95, -5.6, 0.44], [1.5, -5.15, 0.46], [2.5, -7.2, 0.46], [-5.4, -7.25, 0.45], [6.1, -6.8, 0.47]];
  // A porte-cochère on the entrance side of the podium, its soffit high enough for a coach (about 5.9 m)
  const PORTE = 1.55;
  // (a long leaf of a roof with fully rounded ends, the terraces' curve brought down to the door)
  const CANOPY = rrect(3.3, 1.2, 1.15, 3, 2).map((p) => ({ x: p.x, z: p.z - 5.5, nx: p.nx, nz: p.nz }));
  // Lamp light after dark: the brand ivory warmed, as a lamp is. It is pale and high in value, under half as saturated
  // as the bronze of a sold residence and far lighter, so lamp light never reads as sold.
  const LAMP = [244, 225, 192];
  // A sold home's lamp seen through its bronze glass is gold, never ivory; its glow is tinted to match.
  const GOLD = [226, 196, 150];

  // True curves. Three chords to a rounded corner are invisible at a phone's size but show as kinks on a large drawing
  // (balcony ends, the podium, the crown), so a drawing at desktop size (12 px a level or more) takes six. A set holds
  // every plan and all that is traced from them; each is made once, when a drawing first needs it.
  // FAC maps each facet to the facet of the three-chord plan it lies on, and VMAP each point to the three-chord point
  // it stands on (or -1), so lit rooms, the lobby's sales gallery, the podium's columns and the sketch's verticals fall
  // where they did whatever the set.
  function idxMap(na) {
    const r = na / 3, fac = [], vm = [];
    for (let q = 0; q < 4; q++) {
      for (let i = 0; i <= na; i++) { vm.push(i % r ? -1 : q * 7 + i / r); fac.push(i < na ? q * 7 + Math.floor(i / r) : q * 7 + 3); }
      for (let t = 0; t < 3; t++) { vm.push(q * 7 + 4 + t); fac.push(q * 7 + 4 + t); }
    }
    return { FAC: Int16Array.from(fac), VMAP: Int16Array.from(vm) };
  }
  // Mullions and louvres keep the counts the three-chord plans give them, so the rhythm never shifts between sets.
  const MULLN = PLANS3.map((pl, k) => Math.round(perim((k < PODIUM ? PLANS3[0] : k < CROWN ? PLANS3[PODIUM] : PLANS3[CROWN]).glass) / (k < PODIUM ? 1.25 : 0.85)));
  const SCREEN3 = PLANS3[FLOORS - 1].glass.map((p) => ({ x: p.x - p.nx * 0.2, z: p.z - p.nz * 0.2 }));
  const LOUVREN = Math.round(perim(SCREEN3) / 0.24);
  // While the building is going up, the sales gallery is the only room in use: the two bays of the lobby behind the
  // porte-cochère (the facets of its glass nearest the canopy), through both storeys of the lobby.
  const GALLERY3 = (() => {
    const pl = PLANS3[0].glass, n = pl.length, d = (j) => { const a = pl[j], b = pl[(j + 1) % n]; return Math.hypot((a.x + b.x) / 2, (a.z + b.z) / 2 + 5.25); };
    const best = [...pl.keys()].sort((a, b) => d(a) - d(b))[0], next = d((best + 1) % n) < d((best + n - 1) % n) ? (best + 1) % n : (best + n - 1) % n;
    return new Set([best, next]);
  })();
  // Rooms, for the lamps after dark: each quarter of a floor's glass line holds three, the room round its rounded corner
  // (the three facets of the three-chord plan there) and two on its straight run (two facets each), so a lamp lights a
  // corner room or a pair of bays, never a lone panel. (f is a facet of the three-chord plan.)
  const ROOM = (f) => { const q = (f / 7) | 0, i = f - q * 7; return q * 3 + (i < 3 ? 0 : i < 5 ? 1 : 2); };
  // The model residence, kept lit after dark for viewings while homes are for sale: the lowest home on the city side,
  // the last to sell, in its two bays that face south-south-west, toward the hero's view of the tower at night.
  const MODEL_ROOM = (() => {
    const pl = PLANS3[RES0].glass, n = pl.length, ax = Math.sin(Math.PI * 200 / 180), az = Math.cos(Math.PI * 200 / 180);
    let best = -1, bd = -2;
    for (let r = 0; r < 12; r++) {
      if (r % 3 === 0) continue;
      let nx = 0, nz = 0, ok = true;
      for (let j = 0; j < n; j++) if (ROOM(j) === r) { const a = pl[j], b = pl[(j + 1) % n]; if (a.lx + b.lx > 0) ok = false; nx += a.nx + b.nx; nz += a.nz + b.nz; }
      const d = (nx * ax + nz * az) / (Math.hypot(nx, nz) || 1);
      if (ok && d > bd) { bd = d; best = r; }
    }
    return best;
  })();
  const SETS = {};
  function buildSet(na) {
    const plans = na === 3 ? PLANS3 : Array.from({ length: FLOORS }, (_, k) => floorPlan(k, na));
    const slabOf = (k) => (k === 1 ? MEZZ : (k === PODIUM || k === CROWN || k === FLOORS ? plans[k - 1] : plans[k]).slab);
    const { FAC: fac, VMAP: vm } = idxMap(na);
    // Glass balustrades just inside each terrace edge, the penthouse terraces and the roof terrace included.
    const rails = Array.from({ length: FLOORS + 1 }, (_, k) => (k >= PODIUM ? slabOf(k).map((p) => ({ x: p.x - p.nx * 0.05, z: p.z - p.nz * 0.05, nx: p.nx, nz: p.nz })) : null));
    // The crown: a louvred screen round the roof plant, set a little behind the top floor's glass line so the roof
    // reads as a cornice under it, with a terrace and its balustrade round the edge.
    const screen = plans[FLOORS - 1].glass.map((p) => ({ x: p.x - p.nx * 0.2, z: p.z - p.nz * 0.2, nx: p.nx, nz: p.nz }));
    // Which residence each glass panel belongs to: 0 on the bay side of the level, 1 on the city side.
    const side = plans.map((pl) => Int8Array.from(pl.glass, (p, j) => (p.lx + pl.glass[(j + 1) % pl.glass.length].lx > 0 ? 0 : 1)));
    // The line between them runs through the middle of the north and south faces, at the points of the glass line where
    // the side changes (found from a tower floor's ring; every residential floor is traced the same way).
    // Each facet's room (see ROOM), and how bright its lamp is at that place in the room: fullest in the middle, about
    // half as bright at the room's ends, as a ceiling light falls off across a room.
    const rm = Int8Array.from(fac, ROOM), fall = new Float32Array(fac.length);
    for (let j = 0; j < fac.length;) {
      let e = j;
      while (e + 1 < fac.length && rm[e + 1] === rm[j]) e++;
      const m = e - j + 1;
      for (let i = 0; i < m; i++) fall[j + i] = 0.45 + 0.35 * (1 - Math.pow(Math.abs((2 * (i + 0.5)) / m - 1), 1.5));
      j = e + 1;
    }
    const sr = side[RES0], split = [];
    for (let j = 0; j < sr.length; j++) if (sr[j] !== sr[(j + sr.length - 1) % sr.length]) split.push(j);
    return {
      PLANS: plans, RAILS: rails, SCREEN: screen, SIDE: side, SPLIT: split, FAC: fac, VMAP: vm, RM: rm, FALL: fall,
      MULL: plans.map((pl, k) => modules(pl.glass, MULLN[k])),
      // the crown's louvres, finer: about a quarter of a unit apart
      LOUVRE: modules(screen, LOUVREN),
      GALLERY: new Set([...fac.keys()].filter((j) => GALLERY3.has(fac[j]))),
      // Each residence's own outline in plan: the hull of its side's glass line, the party wall across it included (as
      // indices into the floor's glass line), so a sold residence can be drawn as the solid it is.
      SIDEHULL: plans.map((pl, k) => [0, 1].map((s) => {
        const n = pl.glass.length, on = new Set();
        for (let j = 0; j < n; j++) if (side[k][j] === s) { on.add(j); on.add((j + 1) % n); }
        return Int16Array.from(hull([...on].map((j) => [pl.glass[j].x, pl.glass[j].z, j])), (q) => q[2]);
      })),
    };
  }
  function useSet(na) {
    if (na === CS) return;
    const S = SETS[na] || (SETS[na] = buildSet(na));
    ({ PLANS, RAILS, SCREEN, SIDE, SPLIT, FAC, VMAP, RM, FALL, MULL, LOUVRE, GALLERY, SIDEHULL } = S);
    CS = na;
  }
  useSet(3);
  // A drawing's set for a level of u px: six chords from 12 px a level, three below, with a pixel's hysteresis.
  const pickSet = (cur, u) => (cur === 6 ? (u < 11.5 ? 3 : 6) : u >= 12.5 ? 6 : 3);
  // The order the residences sell in, as a stacking plan records it: the bay side ahead of the city side, with a little
  // of the scatter a real one shows. The city side runs some floors behind the bay side, by a lag that changes from floor
  // to floor, so the edge between sold and unsold reads as a record of sales rather than a rule. Within each run of levels
  // that sell together, each side keeps its own sale times but takes them from the top down, so neither side ever has an
  // unsold home above a sold one inside it. runs: [lowest level, highest level, the city side's least and greatest lag].
  const order = (runs) => {
    const r = new Float32Array((FLOORS + 1) * 2).fill(1e9);
    let n = 0;
    for (const [k0, k1, l0, l1] of runs) {
      const u = [];
      for (let k = k0; k <= k1; k++) for (let s = 0; s < 2; s++) u.push({ k, s, v: k1 - k + (s ? l0 + (l1 - l0) * hash(k, 1, 11) : 0) + (hash(k, s, 7) - 0.5) * 2.6 });
      for (const s of [0, 1]) {
        const q = u.filter((o) => o.s === s), vs = q.map((o) => o.v).sort((a, b) => a - b);
        q.sort((a, b) => b.k - a.k).forEach((o, i) => { o.v = vs[i]; });
      }
      u.sort((a, b) => a.v - b.v).forEach((q) => { r[q.k * 2 + q.s] = n++; });
    }
    return r;
  };
  // The firm's order, as the release note and the weekly report plan a launch: the first release is the middle of the
  // tower (levels 12 to 20, the eighteen residences the launch sells), priced to set the ladder, while the upper floors
  // are held back for the second release, once the first has proved the price, and the lower floors come last.
  const RANK = order([[11, 19, 1, 2.5], [19 + 1, RES1 - 1, 3.5, 6], [RES0, 10, 1, 2.5]]);
  // The hero's order, which its photographed stills record: the penthouses and the upper floors first, from the top down.
  const TOP = order([[RES0, RES1 - 1, 3.5, 6]]);

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
  // The instant of midnight in Miami that opens the calendar day holding t, so a drawing of the day's sun is the same
  // drawing whenever in the day it is made. (A browser that cannot tell time zones takes Miami's winter clock, UTC-5.)
  function miamiDay(t) {
    try {
      const f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: 'numeric' });
      const at = (ms) => { const p = {}; for (const x of f.formatToParts(new Date(ms))) p[x.type] = +x.value; return p; };
      // the zone's offset at a moment: its wall clock read as UTC, less the moment itself
      const off = (ms) => { const q = at(ms); return Date.UTC(q.year, q.month - 1, q.day, q.hour, q.minute) - Math.floor(ms / 6e4) * 6e4; };
      const p = at(t), d0 = Date.UTC(p.year, p.month - 1, p.day);
      // taken again at the midnight it gives, since a clock change (at 2 AM) can lie between that midnight and t
      return d0 - off(d0 - off(t));
    } catch (e) { return Math.floor((t - 5 * 36e5) / 864e5) * 864e5 + 5 * 36e5; }
  }
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
  // ms between drawings of a settled orbit: twelve a second, eight on a touch screen (a phone, where the tower is smaller
  // and turns under a quarter of a pixel between them)
  const IDLE = 1000 / (matchMedia('(pointer: coarse)').matches ? 8 : 12);
  // ms the lights-on cascade runs after the building is finished: the rooms over 1.6 s (the penthouses 0.4 s after),
  // the crown, then the aviation light last
  const CASCADE = 2400;
  // The desktop hero's photographs (hero/): path-traced stills of the finished tower on its site, all four from one
  // camera of that hero at 1440 x 900, standing 24 m up on the bay to the south-west (so the raked crown blade shows its
  // top face), each lit by its own sun (the morning's low in the east behind the tower, the evening's low in the west on
  // its face, the noon sun high in the south-east, the night by its own lights). Each
  // runs on past that hero's right and bottom edges, so a wider or taller window is still filled. For each: the crop's place
  // and size in that hero (x, y, w, h, CSS px) and its camera's bearing (th), lens (f) and centre (cx, cy), all from the
  // hero's eye height (EY) and pitch (PHI). From the same bearing, height and pitch, any other size or framing of the
  // hero is the same picture scaled about the centre (see camAt), so the still is placed by the lens and centre alone.
  // (sky, where the far city is a photographed skyline: how far its towers rise above the horizon behind the level
  // ruler, in the still's pixels, so the ruler's names stay clear of them)
  const STILLS = {
    day: { x: 681, y: 75, w: 1059, h: 975, th: 0.523599, f: 1687.08, cx: 1021.968, cy: 668.736, sky: 160 },
    morning: { x: 681, y: 75, w: 1059, h: 975, th: 0.523599, f: 1687.08, cx: 1021.968, cy: 668.736, sky: 160 },
    gold: { x: 681, y: 75, w: 1059, h: 975, th: 0.523599, f: 1687.08, cx: 1021.968, cy: 668.736, sky: 160 },
    night: { x: 681, y: 75, w: 1059, h: 975, th: 0.523599, f: 1687.08, cx: 1021.968, cy: 668.736, sky: 160 },
  };
  // (and from x 575, fully from 825, in the same hero, the photograph has its own far city: the sky's skyline goes)
  const STILL_EY = 6.7366, STILL_PHI = 0.13, STILL_CUT = [575, 825];
  // (an engine whose media queries take only the older addListener)
  const onMQ = (m, f) => (m.addEventListener ? m.addEventListener('change', f) : m.addListener(f)), offMQ = (m, f) => (m.removeEventListener ? m.removeEventListener('change', f) : m.removeListener(f));
  let GEN = 0; // camera generations, shared by every model: the plan rings are shared too

  // The shadows' hatch, drawn in world space. These run at module level, made once, so the engine optimises them: a
  // closure made afresh with each drawing and called once or twice in it is never hot enough to be.
  // (the lines across a convex outline in plan, pw [[x, z], ...], one every D along the normal (hnx, hnz) of the hatch's
  // bearing, as a flat list of their ends and their number on the ground [ax, az, bx, bz, i, ...]: from the outline's
  // nearest point to its farthest along that normal, each line crosses one edge of either chain, and the two chains are
  // walked once as the lines step across. A line's number i is fixed to the ground (it lies at i x D along the normal), so
  // the same lines are always the ones kept where the hatch has to thin out: see hatchProject)
  function hatchPlan(pw, hnx, hnz, D) {
    const n = pw.length, ls = [], cs = new Float64Array(n);
    let i0 = 0, i1 = 0;
    for (let i = 0; i < n; i++) { cs[i] = pw[i][0] * hnx + pw[i][1] * hnz; if (cs[i] < cs[i0]) i0 = i; if (cs[i] > cs[i1]) i1 = i; }
    let a = i0, b = i0;
    const at = (i, i2, c) => { const d = cs[i2] - cs[i], t = d > 0 ? (c - cs[i]) / d : 0, p = pw[i], q = pw[i2]; ls.push(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t); };
    for (let m = Math.ceil(cs[i0] / D); m * D < cs[i1]; m++) {
      const c = m * D;
      for (let s = 0; s < n && cs[(a + 1) % n] < c; s++) a = (a + 1) % n;
      for (let s = 0; s < n && cs[(b + n - 1) % n] < c; s++) b = (b + n - 1) % n;
      at(a, (a + 1) % n, c); at(b, (b + n - 1) % n, c); ls.push(m);
    }
    return ls;
  }
  // (a convex outline in plan at height y, cut where it passes behind the eye of camera K, so no part of it is ever
  // projected upside down: a long low sun can throw a shadow past the eye)
  function nearCut(pw, K, zn) {
    const ks = K.s, kc = K.c, kd = K.d, n = pw.length, Z = (p) => ks * p[0] + kc * p[1] + kd;
    let all = true;
    for (let i = 0; i < n; i++) if (Z(pw[i]) < zn) { all = false; break; }
    if (all) return pw;
    const out = [];
    for (let i = 0; i < n; i++) {
      const p = pw[i], q = pw[(i + 1) % n], zp = Z(p), zq = Z(q);
      if (zp >= zn) out.push(p);
      if ((zp >= zn) !== (zq >= zn)) { const t = (zn - zp) / (zq - zp); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
    return out;
  }
  // (the widest the lines stand apart on screen anywhere on the outline, taken at its corners, for camera K at height y;
  // 9 when a corner is behind the eye. A line projects to a line, so the next line's distance from one is that of a
  // point on it from the line through two of this one's points)
  function hatchWide(pw, K, y, hnx, hnz, D) {
    const kc = K.c, ks = K.s, kz = K.d, kf = K.f, kx = K.cx, fy = kf * (y - K.ey), ky = K.cy;
    let wide = 0;
    for (const v of pw) {
      const x = v[0], z = v[1], Za = ks * x + kc * z + kz;
      if (Za < 0.5) return 9;
      const nx = x + hnx * D, nz = z + hnz * D, tx = x - hnz * D, tz = z + hnx * D, Zn = ks * nx + kc * nz + kz, Zt = ks * tx + kc * tz + kz;
      const Ax = kx + kf * (kc * x - ks * z) / Za, Ay = ky - fy / Za, ex = kx + kf * (kc * tx - ks * tz) / Zt - Ax, ey = ky - fy / Zt - Ay;
      wide = Math.max(wide, Math.abs((kx + kf * (kc * nx - ks * nz) / Zn - Ax) * ey - (ky - fy / Zn - Ay) * ex) / (Math.hypot(ex, ey) || 1));
    }
    return wide;
  }
  // (the lines projected, as P projects a point but with no point made for each end, and sorted by how strongly they are
  // drawn into sets[1..kq], each a flat list [Ax, Ay, Bx, By, ...]. Seen across the low ground the lines close up toward the
  // vanishing point, so the hatch thins out there as a draughtsman's does, by whole lines fixed to the ground: every line
  // where they stand 3 px apart or more, every second where they close to 1.5, every fourth, eighth and sixteenth closer
  // still, each fading in over its last 1.5 px, so the hatch keeps one even tone from the foot of the building to the
  // horizon and nothing pops as the view turns. fade, when given, is [ox, oz, r0, r1, a1]: from r0 units from (ox, oz) to
  // r1 the lines fade to a1 of their strength, so a long shadow dies away rather than running off the sheet. A line that
  // passes behind the eye is cut there. The box the drawn lines span goes in box.)
  function hatchProject(ls, K, y, hnx, hnz, D, kq, sets, box, fade) {
    const kc = K.c, ks = K.s, kz = K.d, kf = K.f, kx = K.cx, fy = kf * (y - K.ey), ky = K.cy, zn = 1;
    let bx0 = 1e9, bx1 = -1e9, by0 = 1e9, by1 = -1e9, any = false;
    for (let i = 0; i < ls.length; i += 5) {
      let ax = ls[i], az = ls[i + 1], bx = ls[i + 2], bz = ls[i + 3], Za = ks * ax + kc * az + kz, Zb = ks * bx + kc * bz + kz;
      if (Za < zn && Zb < zn) continue;
      if (Za < zn) { const t = (zn - Za) / (Zb - Za); ax += (bx - ax) * t; az += (bz - az) * t; Za = zn; }
      else if (Zb < zn) { const t = (zn - Zb) / (Za - Zb); bx += (ax - bx) * t; bz += (az - bz) * t; Zb = zn; }
      const Ax = kx + kf * (kc * ax - ks * az) / Za, Ay = ky - fy / Za, Bx = kx + kf * (kc * bx - ks * bz) / Zb, By = ky - fy / Zb;
      const ex = Bx - Ax, ey = By - Ay, l = Math.hypot(ex, ey);
      if (l < 0.5) continue;
      const mx = (ax + bx) / 2, mz = (az + bz) / 2, nx = mx + hnx * D, nz = mz + hnz * D, Zn = ks * nx + kc * nz + kz;
      // (how far apart this line's neighbours in its own order stand: 1, 2, 4, 8 or 16 lines along)
      const m = Math.abs(ls[i + 4]), every = m & 1 ? 1 : m & 2 ? 2 : m & 4 ? 4 : m & 8 ? 8 : 16;
      let a = clamp((every * Math.abs((kx + kf * (kc * nx - ks * nz) / Zn - Ax) * ey - (ky - fy / Zn - Ay) * ex) / l - 1.5) / 1.5, 0, 1);
      if (fade && a > 0) { const r = Math.hypot(mx - fade[0], mz - fade[1]); if (r > fade[2]) a *= 1 - (1 - fade[4]) * smooth(clamp((r - fade[2]) / (fade[3] - fade[2]), 0, 1)); }
      const q = Math.round(a * kq);
      if (!q) continue;
      sets[q].push(Ax, Ay, Bx, By); any = true;
      if (Ax < bx0) bx0 = Ax; if (Bx < bx0) bx0 = Bx; if (Ax > bx1) bx1 = Ax; if (Bx > bx1) bx1 = Bx;
      if (Ay < by0) by0 = Ay; if (By < by0) by0 = By; if (Ay > by1) by1 = Ay; if (By > by1) by1 = By;
    }
    box[0] = bx0; box[1] = by0; box[2] = bx1; box[3] = by1;
    return any;
  }

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
      this.o = Object.assign({ orbit: 0, theta: -0.62, phi: 0.2, dist: 52, ty: 11.5, scale: 1.05, offsetX: 0, crane: true, grid: true, labels: false, labelSize: 13, envelope: true, rate: 9, slow: 3, soldRate: 6, presale: 0.5, rest: 45000, facadeLag: 3 }, opts);
      this.theta = this.o.theta;
      this.phi = this.o.phi;
      // the order its residences sell in: the firm's (RANK), or the hero's from the top down (o.order 'top')
      this.rank = this.o.order === 'top' ? TOP : RANK;
      this.L = 0; this.S = 0; this.C = 0; this.G = 0; // shown: levels framed, levels sold (in levels' worth of residences), levels glazed, crown
      this.B = 0; this.Sold = 0; // targets
      this.crane = 0; this.craneT = 0;
      this.Rd = 0; this.Ra = 0; // the first release's bracket: how far it is drawn, and how strongly
      this.gd = 0; // the story's datum lines, faded in at rest
      this.occ = 0; // the building in use: 1 once it is complete and the crane has gone (people, lit rooms, the lobby's light)
      this.E = this.o.envelope ? 1 : 0; // the dashed envelope, drawn in from the ground up
      this.camT = null; this.camV = [0, 0, 0, 0, 0]; // camera spring: target and velocity of theta, phi, ty, scale, offsetX
      this.cs = 3; // the plan set: chords to a rounded corner (pickSet)
      this.mx = 0; this.my = 0;
      this.visible = true;
      this.woke = performance.now();
      this._pj = new WeakMap(); this.gen = 0;
      // (every field the model keeps as it runs is made here, in one order, so every model has one shape from the start:
      // a field first added mid-build would send the engine's optimised drawing code back to be compiled again)
      this.k = null; this.eye = null; this.u = 0; this.w = 0; this.h = 0; this.dpr = 0; this.inView = undefined; this.lens = null;
      this.dirty = false; this.held = false; this.moved = false; this.slept = false; this.raf = 0; this.nap = 0; this.t0 = 0;
      this.orb = null; this.tx = 0; this.tyy = 0; this.xray = false; this.nd = 0;
      this.cost = null; this.slow = false; this.lowRes = false; this.drawnAt = 0; this.drawnLast = 0; this.doneAt = 0; this.nightNow = 0;
      this.sp = null; this.spAt = null; this.rb = null; this._glow = null; this._glowK = null; this._nf = null;
      this._gs = null; this._gsK = null; this._gsP = null; this._gsS = null; this._gsSK = null; this._rs = null; this._rsK = null; this._rsP = null; this._pool = null; this._poolK = null;
      this._hatch = new WeakMap(); this._frs = [];
      this.r3 = null; this.r3a = 0; this.r3f = null; // the rendered tower (tower3d.js), how far it has faded in, and its frame-time watch
      this.ph = null; this.sa = 0; // the photograph that stands in for the finished tower (see photo), and how far it has faded in
      // Without a 2D context (an old engine, a blocked or exhausted GPU) the model stands down quietly: every call
      // becomes a no-op and the page around it carries on.
      try { this.ctx = canvas && canvas.getContext ? canvas.getContext('2d') : null; } catch (e) { this.ctx = null; }
      if (!this.ctx) { this.dead = true; this.w = this.h = 0; return; }
      this.sunNow = miamiSun();
      // (sunT: the moment a visitor has moved the sun to along its path, or null for now; see scrub)
      this.sunT = null; this.sunBack = null; this.spG = null;
      // the sun moves on every five minutes; that redraws once and never wakes a resting orbit
      setInterval(() => { if (this.sunT == null) { this.sunNow = miamiSun(); this.dirty = true; this.kick(); } }, 300000);
      this.colors();
      if (this.o.real3d) this.load3d();
      // (sized by its resize observer in the first frame, where the page is laid out anyway, rather than now, while the
      // page starts; without an observer, now)
      if (!hasRO) this.size();
      // Resized, turned or zoomed: refit and redraw in the same frame, so the canvas never shows a blank frame.
      const resized = () => { this.size(); if (this.o.onResize) this.o.onResize(this); this.now(); };
      if (hasRO) new ResizeObserver(resized).observe(canvas);
      else addEventListener('resize', resized);
      // Moved to a screen of another pixel density (a laptop's own display from an external one), the canvas takes the
      // new density too, though its size on the page has not changed. (A zoom changes its size, which the observer sees.)
      const density = () => {
        const q = matchMedia(`(resolution: ${devicePixelRatio || 1}dppx)`), f = () => { offMQ(q, f); density(); if (this.backing() !== this.dpr) resized(); };
        onMQ(q, f);
      };
      if (window.matchMedia && window.devicePixelRatio) density();
      // Off screen nothing is drawn; on its way back (64px out) the drawing is brought up to date before it shows. The
      // slow idle orbit turns only while some of the canvas is actually on screen, below the 64px header that covers the
      // top of every page, and its 1px rule (a hero showing only under the header has nothing in view).
      if (hasIO) {
        new IntersectionObserver((es) => { this.visible = es[0].isIntersecting; if (this.visible) { if (this.dirty) this.now(); this.wake(); } }, { rootMargin: '64px 0px' }).observe(canvas);
        new IntersectionObserver((es) => { this.inView = es[0].isIntersecting; if (this.inView) this.wake(); }, { rootMargin: '-65px 0px 0px 0px' }).observe(canvas);
      }
      // a hidden tab draws nothing; coming back, the clock starts afresh
      document.addEventListener('visibilitychange', () => { if (!document.hidden) { this.t0 = 0; this.kick(); } });
    }

    // The hero's tower can be rendered in real light (tower3d.js, WebGL2) rather than drawn. The renderer starts only
    // once the page has loaded and gone quiet, so it never holds up the page, and only where it can run without
    // slowing anything: not with high contrast on, not to save data, not on a device short of memory or cores, not on
    // an engine without WebGL2 or one that would render it in software. Until it is ready, and wherever it is not,
    // the drawing stands in, and if it ever proves slow on a device it steps down its resolution, then gives the
    // tower back to the drawing.
    load3d() {
      const nav = navigator, force = window.__cmForce3D === true;
      if (!force && (this.forced || (nav.connection && nav.connection.saveData) || (nav.deviceMemory && nav.deviceMemory < 3) || (nav.hardwareConcurrency && nav.hardwareConcurrency < 4))) return;
      if (typeof WebGL2RenderingContext !== 'function') return;
      // (the renderer's script, tower3d.js, arrives on its own at low priority; it only defines what is used here)
      let tries = 0;
      // A phone held upright shows the photograph, never the rendered tower (only held sideways does it keep the live
      // drawing), and setting the renderer up cost it about a second of main thread for nothing: there the renderer
      // waits until the phone is turned sideways, and the drawn sky stands under the photograph meanwhile.
      const sideways = matchMedia('(orientation:landscape) and (max-height:500px)'), upright = () => !force && !!this.ph && matchMedia('(max-width:820px)').matches && !sideways.matches;
      const start = () => {
        if (this.dead || this.r3) return;
        if (upright()) { onMQ(sideways, function turn() { offMQ(sideways, turn); start(); }); return; }
        if (typeof window.CentamontTower3D !== 'function') { if (++tries < 40) setTimeout(start, 250); return; }
        let r = null;
        const phone = matchMedia('(max-width:820px)').matches;
        try { r = window.CentamontTower3D(Model.geo, { phone, force, q: Math.min(devicePixelRatio || 1, 2), onLost: () => { this.drop3d(); this.touch(); } }); } catch (e) { r = null; }
        if (!r) return;
        // (its programs link in the background; it takes over once they have)
        const wait = () => { if (r.lost) return; if (!r.poll()) { setTimeout(wait, 50); return; } this.r3 = r; this.r3a = this.drawnAt && !reduce ? 0 : 1; this.r3f = { n: 0, sum: 0, last: 0 }; this.c.dataset.render = '3d'; this.touch(); };
        wait();
      };
      const idle = () => (window.requestIdleCallback ? requestIdleCallback(start, { timeout: 2500 }) : setTimeout(start, 200));
      if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
    }

    // While it renders, the frames of a moving tower are timed: a device that keeps falling short of about 40 frames a
    // second steps the rendering down (1.5x, 1x, 0.75x of a CSS pixel), and past that hands the tower back to the drawing.
    watch3d(t) {
      const f = this.r3f;
      if (!f) return;
      if (f.last && t - f.last < 250) { f.sum += t - f.last; f.n++; }
      f.last = t;
      if (f.n < 40) return;
      const avg = f.sum / f.n; f.n = 0; f.sum = 0;
      if (avg <= 25) return;
      const r = this.r3, q = r.q > 1.5 ? 1.5 : r.q > 1 ? 1 : r.q > 0.75 ? 0.75 : 0;
      if (q) r.q = q; else this.drop3d();
      this.touch();
    }

    // The hero's photograph (key, one of STILLS, from the folder base), fetched once the page has loaded and gone quiet
    // (or at once, soon, when the tower stands finished from the start), at the density the screen and the framing call
    // for. It takes over from the tower, drawn or rendered, once that is built and lit, and only while the camera stands where the photograph was made from, the sun is the hour's
    // own (not moved along its path) and the sheet is ink; it fades in over 0.8 s (at once with motion off) and gives
    // the tower back the same way. The sky and the bay are tower3d.js's, drawn under it with or without WebGL.
    photo(key, base, soon) {
      const s = STILLS[key];
      if (this.dead || !s) return;
      this.ph = { key, s, img: null, fc: null, fk: '' };
      const get = () => {
        const img = new Image(), z = this.w ? (Math.min(this.w * 1.15, this.h) * this.o.scale) / s.f : 1;
        img.decoding = 'async'; img.fetchPriority = 'low';
        img.src = base + key + ((devicePixelRatio || 1) * z > 1.25 ? '-2x' : '-1x') + '.webp';
        img.decode().then(() => { if (this.ph && this.ph.s === s) { this.ph.img = img; this.touch(); } }, () => {});
      };
      const idle = () => (window.requestIdleCallback ? requestIdleCallback(get, { timeout: 2500 }) : setTimeout(get, 200));
      if (soon) get(); else if (document.readyState === 'complete') idle(); else addEventListener('load', idle, { once: true });
    }
    // whether the photograph may stand in for the tower now
    photoOn() {
      const p = this.ph;
      if (!p || !p.img || !this.dark || this.forced || this.sunT != null || this.sunBack || !((this.r3 && !this.r3.lost) || window.CentamontSky)) return false;
      if (this.L < FLOORS || this.G < 1 || this.occ < 1 || this.S !== this.Sold) return false;
      const ph = this.phi + (this.tyy || 0), d = Math.abs((((this.theta + (this.tx || 0) - p.s.th) % TAU) + TAU + Math.PI) % TAU - Math.PI);
      return d < 1e-4 && Math.abs(ph - STILL_PHI) < 1e-4 && Math.abs(Math.max(0.8, this.o.ty - this.o.dist * Math.sin(ph)) - STILL_EY) < 1e-3;
    }
    // The photograph, laid where the rendered tower is. Where it falls short of the canvas's right or bottom edge (a
    // window wider or shorter than the one it was made in), it fades out over its last 48 to 200px (twice the shortfall)
    // into the bay drawn under it rather than ending on a line (a copy faded once for each size, kept until it changes).
    // Its left and top edges, which lie inside the canvas, are softened too (56px at the left, where the drawn sky hands
    // its far city to the photograph's, and 16px at the top, just over the crown): the still's sky is never quite the drawn
    // sky's tone, and while the photograph fades in (or out) a hard edge there shows as a dark box round the tower.
    still(g, a) {
      const p = this.ph, s = p.s, k = this.k, z = k.f / s.f;
      const x = k.cx + (s.x - s.cx) * z, y = k.cy + (s.y - s.cy) * z, w = s.w * z, h = s.h * z, fr = x + w < this.w - 0.5, fb = y + h < this.h - 0.5, fl = x > 0.5, ft = y > 0.5;
      let src = p.img;
      if (fr || fb || fl || ft) {
        const d = this.dpr || 1, cw = Math.max(1, Math.round(w * d)), ch = Math.max(1, Math.round(h * d)), key = cw + 'x' + ch + (fr ? 'r' : '') + (fb ? 'b' : '') + (fl ? 'l' : '') + (ft ? 't' : '');
        if (p.fk !== key) {
          const c = p.fc || (p.fc = document.createElement('canvas')), e = clamp(2 * Math.max(this.w - x - w, this.h - y - h) + 24, 48, 200) * d, el = Math.min(56 * z * d, cw / 4), et = Math.min(16 * z * d, ch / 8);
          c.width = cw; c.height = ch;
          const q = c.getContext('2d');
          q.drawImage(p.img, 0, 0, cw, ch); q.globalCompositeOperation = 'destination-out';
          // (each fade fills only its own band: beyond the band's inner end the gradient clears nothing)
          const fade = (x0, y0, x1, y1) => { const lg = q.createLinearGradient(x0, y0, x1, y1); lg.addColorStop(0, 'rgba(0,0,0,0)'); lg.addColorStop(0.5, 'rgba(0,0,0,0.25)'); lg.addColorStop(1, 'rgba(0,0,0,1)'); q.fillStyle = lg; q.fillRect(Math.min(x0, x1), Math.min(y0, y1), x0 === x1 ? cw : Math.abs(x1 - x0), y0 === y1 ? ch : Math.abs(y1 - y0)); };
          if (fr) fade(cw - e, 0, cw, 0);
          if (fb) fade(0, ch - e, 0, ch);
          if (fl) fade(el, 0, 0, 0);
          if (ft) fade(0, et, 0, 0);
          p.fk = key;
        }
        src = p.fc;
      }
      g.globalAlpha = a; g.drawImage(src, x, y, w, h); g.globalAlpha = 1;
    }

    // back to the drawing: the rendered tower and its sky (a CSS background on the canvas, set by tower3d.js) go
    drop3d() {
      this.r3 = null; this.r3a = 0; this.r3f = null; delete this.c.dataset.render;
      this.c.style.backgroundImage = ''; this.skyCss = '';
    }

    // Redraw at once, in this frame, if there is anything to draw on.
    now() { if (this.dead) return; if (this.w && this.visible) { this.draw(); this.dirty = false; } else this.dirty = true; this.kick(); }

    // Someone is here: the orbit (if it rested) turns again.
    wake() { this.woke = performance.now(); this.kick(); }

    // Held (under the intro's curtain), the drawing is brought up to date when asked but runs no frames of its own;
    // let go, it carries on from there, its clock started afresh.
    hold(on) { this.held = !!on; if (!on) { this.t0 = 0; this.kick(); } }

    colors() {
      if (this.dead) return;
      this._cc = null;
      const cs = getComputedStyle(this.c);
      this.line = rgb(cs.getPropertyValue('--line') || '#14161A');
      this.sold = rgb(cs.getPropertyValue('--sold') || '#B8976A');
      this.b300 = rgb(cs.getPropertyValue('--bronze-300') || '#D5B382');
      this.b700 = rgb(cs.getPropertyValue('--bronze-700') || '#7A5F3A');
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

    // A phone (the same 820px line as the stylesheet) draws at its screen's own density, up to 3x and three million pixels,
    // so a hairline is one device pixel and the canvas's labels are as crisp as the text beside them; one too slow to
    // draw at that (see frame()) drops once to 1.5x. Wider windows draw at up to 2x.
    backing(w = this.w, h = this.h) {
      const dpr = devicePixelRatio || 1;
      if (!matchMedia('(max-width:820px)').matches) return Math.min(dpr, 2);
      let d = Math.min(dpr, this.lowRes ? 1.5 : 3);
      if (w > 0 && h > 0) d = Math.min(d, Math.sqrt(3e6 / (w * h)));
      return d;
    }

    size() {
      if (this.dead) return;
      const r = this.c.getBoundingClientRect();
      const d = this.backing(r.width, r.height);
      this.w = r.width; this.h = r.height;
      this.c.width = Math.max(1, Math.round(r.width * d));
      this.c.height = Math.max(1, Math.round(r.height * d));
      this.ctx.setTransform(d, 0, 0, d, 0, 0); this.dpr = d;
    }

    // Glass trails the frame (by three floors, o.facadeLag) until the building tops off, and closes over the top storeys
    // only as the crane leaves: a topped-off frame with its crane still up is a building site, not a finished tower.
    cladFor(L) { return L >= FLOORS - 0.001 && this.craneT === 0 && this.crane < 0.5 ? FLOORS : Math.max(0, L - this.o.facadeLag); }
    // The first release, marked beside the level ruler once the envelope is drawn: o.release is its size in levels' worth of
    // residences (the first that sell, in the drawing's order). The bracket stands until sales go past it or ground breaks.
    relFor() { return this.o.release > 0 && this.E > 0.999 && this.L < 0.01 && this.S <= this.o.release + 0.01 ? 1 : 0; }
    release(v, instant) { if (this.dead) return; this.o.release = v; if (instant || reduce) this.Rd = this.Ra = this.relFor(); this.touch(); }
    // in use only once it is finished: the crown set, the glass closed and the crane gone
    occFor() { return this.crane < 0.01 && this.G > 0.98 && this.C >= FLOORS - 0.01 ? 1 : 0; }

    // How much of residence s (0 bay side, 1 city side) on level k is sold, 0 to 1. S counts levels' worth (two
    // residences to a level), so 2S is the number of residences under contract.
    soldOf(k, s, S = this.S) { return clamp(S * 2 - this.rank[k * 2 + s], 0, 1); }

    set(built, sold, crane, instant) {
      if (this.dead) return;
      if (built && !this.B && !this.drawnAt) this.drawnAt = performance.now();
      this.B = built; this.Sold = sold; this.craneT = crane ? 1 : 0;
      this.c.dataset.built = built; this.c.dataset.sold = Math.round(sold * 2); // (residences)
      if (instant || reduce) this.snap();
      this.wake();
    }

    // Everything straight to where it is going.
    snap() { this.L = this.B; this.S = this.Sold; this.crane = this.craneT; this.C = this.cladFor(this.B); this.G = this.B >= FLOORS ? 1 : 0; this.occ = this.occFor(); this.doneAt = this.occ ? -Infinity : 0; this.E = this.o.envelope ? 1 : 0; this.Rd = this.Ra = this.relFor(); this.touch(); }

    // Start the draughtsman's construction lines ahead of the ink.
    sketch() { this.drawnAt = performance.now(); this.touch(); }

    // The camera moves on a critically damped spring: it can be sent somewhere new mid-move and keeps its velocity.
    // v: { theta, phi, ty, scale, offsetX }
    camTo(v, instant) {
      const T = [v.theta, v.phi, v.ty, v.scale, v.offsetX];
      // a move takes the plan set its end calls for, from its start, so nothing changes as it goes
      if (this.w) { const K = this.camAt(v.theta, v.phi, v.ty, v.scale, v.offsetX); this.cs = pickSet(this.cs, K.f / K.d); }
      if (instant || reduce) { [this.theta, this.phi, this.o.ty, this.o.scale, this.o.offsetX] = T; this.camT = null; this.camV = [0, 0, 0, 0, 0]; }
      else this.camT = T;
      this.touch();
    }

    pointer(x, y) { this.mx = x; this.my = y; this.wake(); }

    // The visitor moves the sun: t, a moment of today (ms) to light the drawing for, as it is found under a point of the
    // sun's path (sunAt); null lets it go, and it goes back to now over 0.8 s, through the hours between. It draws only
    // when the sun moves. Not with motion off.
    scrub(t) {
      if (reduce || this.dead) return;
      if (t != null) { if (t === this.sunT && !this.sunBack) return; this.sunT = t; this.sunBack = null; this.sunNow = miamiSun(new Date(t)); }
      else if (this.sunT != null && !this.sunBack) this.sunBack = { from: this.sunT, at: performance.now() };
      this.touch();
    }
    // The sun's path where it was last drawn (canvas px): the box of its arc and the sky under it, from a little over the
    // arc's top to just under its horizon line, its ends included, grown by pad; null where none is drawn.
    sunBox(pad = 0) { const s = this.spG; return s ? { x0: s.x0 - 10 - pad, y0: s.base - s.H - 22 - pad, x1: s.x1 + 10 + pad, y1: s.base + 10 + pad } : null; }
    // The moment of today under x on the sun's path, its ends held at sunrise and sunset.
    sunAt(x) { const s = this.spG; return s ? Math.round(s.t0 + clamp((x - s.x0) / (s.x1 - s.x0), 0, 1) * (s.t1 - s.t0)) : null; }

    // Force a full redraw on the next frame (camera moves, scroll, the loupe); it also wakes a resting orbit.
    touch() { this.dirty = true; this.wake(); }

    // Ask for a frame. An idle orbit sleeps on a timer between its frames; any request cuts the sleep short.
    kick() {
      if (this.nap) { clearTimeout(this.nap); this.nap = 0; }
      if (this.raf || !this.w || this.visible === false || this.held) return;
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
      // and only a finished building, its crane gone, is in use: its people and its lamps come in over a third of a second
      const occT = this.occFor();
      this.occ = reduce ? occT : toward(this.occ, occT, 1 / 0.3, 1 / 0.2);
      // After dark its lights then come on, room by room, over about two seconds (see casT in scene; o.cascadeK runs it
      // that many times faster): this is when it
      // was finished (-Infinity: always has been, all lit at once). The cascade draws every frame while it runs, but
      // it is not a change anyone made, so it never holds off the orbit's rest.
      if (occT && !this.doneAt) this.doneAt = reduce ? -Infinity : t;
      else if (!occT && this.doneAt) this.doneAt = 0;
      // the rendered tower fades in over the drawing's own tower in 0.6 s (at once with motion off, or before anything shows)
      const fading = !!this.r3 && this.r3a < 1;
      if (fading) { this.r3a = reduce ? 1 : Math.min(1, this.r3a + dt / 600); this.dirty = true; }
      const casting = this.doneAt > 0 && t - this.doneAt < CASCADE / (this.o.cascadeK || 1) && this.dark && !this.o.sun && this.sunNow.night > 0.05;
      // and the photograph over the tower, once it may (see photoOn; after dark, once its lights are on), in 0.8 s each way;
      // over a tower that stood finished from its first frame (a return visit, a phone) it comes in whole, in one frame, as
      // the page fades the canvas in round it (home.js), so no frames are spent crossfading a build nobody watched
      const saT = !casting && this.photoOn() ? 1 : 0, phading = this.sa !== saT;
      if (phading) {
        this.sa = reduce || this.doneAt === -Infinity ? saT : saT > this.sa ? Math.min(1, this.sa + dt / 800) : Math.max(0, this.sa - dt / 800); this.dirty = true;
        if (this.sa > 0) this.c.dataset.still = this.ph.key; else delete this.c.dataset.still;
      }
      // the sun, let go, going back to now (eased in and out over 0.8 s)
      const back = this.sunBack;
      if (back) {
        const p = clamp((t - back.at) / 800, 0, 1), e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
        if (p >= 1) { this.sunT = null; this.sunBack = null; this.sunNow = miamiSun(); }
        else { this.sunT = back.from + (Date.now() - back.from) * e; this.sunNow = miamiSun(new Date(this.sunT)); }
        this.dirty = true;
      }
      // the release bracket draws in over 0.4 s and fades out over 0.3 s
      const relT = this.relFor();
      if (reduce) this.Rd = this.Ra = relT;
      else if (relT) { this.Ra = 1; this.Rd = toward(this.Rd, 1, 1 / 0.4, 1); }
      else { this.Ra = toward(this.Ra, 0, 1, 1 / 0.3); if (!this.Ra) this.Rd = 0; }
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
      // the story's datum lines come in over half a second once the camera rests, and go at once when it moves
      const gdT = this.o.restGuides && !this.camT ? 1 : 0;
      this.gd = reduce || !gdT ? gdT : toward(this.gd || 0, 1, 1 / 0.5, 1);
      // The orbit turns briskly while the tower builds, then settles to about a degree a second beside the reading.
      // When nobody has moved, scrolled or changed anything for a while (45 s) it slows to rest, and the drawing
      // stands still until someone does.
      if (!reduce && this.o.orbit) {
        // (an empty lot, with nothing to build, rests the same way)
        const rest = (this.G > 0.98 || (!this.B && !this.Sold && !this.drawnAt)) && t - this.woke > this.o.rest;
        const want = rest ? 0 : this.G > 0.98 && this.o.orbitIdle != null ? this.o.orbitIdle : this.o.orbit;
        this.orb = this.orb == null ? want : this.orb + (want - this.orb) * (1 - Math.exp(-dt / 1500));
        if (rest && Math.abs(this.orb) < 1e-5) this.orb = 0;
        this.theta += this.orb * dt / 16.7;
      }
      this.tx = ease(this.tx || 0, this.mx * 0.12, 330);
      this.tyy = ease(this.tyy || 0, this.my * 0.05, 330);
      const settled = (reduce ? this.L === this.B && this.S === this.Sold && this.crane === this.craneT : this.L === bT && this.S === sT && this.crane === cT) && this.C === this.cladFor(this.L) && this.G === crownT && this.occ === occT && this.Ra === relT && this.Rd === relT && this.E === envT && this.gd === gdT && !casting && !fading && !phading && !back && !this.camT && Math.abs(this.tx - this.mx * 0.12) <= 0.001 && Math.abs(this.tyy - this.my * 0.05) <= 0.001;
      const orbiting = !reduce && !!this.o.orbit && this.orb !== 0;
      // Anything that moves draws every frame (and the frame after it stops). A settled tower on its slow orbit
      // turns about a tenth of a pixel between frames, so it is drawn twelve times a second whatever the display's
      // refresh rate, and sleeps on a timer in between instead of waking at every refresh.
      const idle = settled && orbiting && !this.dirty && !this.moved;
      // A device slow to draw (over 10 ms a drawing, on average) draws a moving tower at most thirty times a second, so the
      // page keeps time between drawings to answer a tap or a scroll. Everything runs on the clock, so the motion keeps its
      // pace; a frame left undrawn is owed, and the next one draws it.
      const owed = !idle && this.slow && t - (this.drawnLast || 0) < 28;
      if (owed) { this.dirty = true; this.moved = true; }
      else {
        if (!idle || t - (this.drawnLast || 0) >= IDLE - 12) {
          if (this.dirty || this.moved || !settled || orbiting) {
            const c0 = performance.now(); this.draw(); this.drawnLast = t;
            if (this.r3f) { if (!idle) this.watch3d(t); else this.r3f.last = 0; }
            // (the first two drawings warm up and are not counted)
            if ((this.nd = (this.nd || 0) + 1) > 2) {
              const c = performance.now() - c0; this.cost = this.cost == null ? c : this.cost * 0.85 + c * 0.15; this.slow = this.cost > (this.slow ? 7 : 10);
              // (a phone drawing at its full density that proves slow steps down to 1.5x, once, and redraws at once)
              if (this.slow && !this.lowRes && this.dpr > 1.5) { this.lowRes = true; if (this.backing() < this.dpr - 0.01) { this.size(); this.draw(); } }
            }
          }
        }
        this.dirty = false; this.moved = !settled;
      }
      if (this.o.onFrame) this.o.onFrame(this);
      // (the idle orbit also stops just off screen, inside the margin where a returning drawing is brought up to date)
      if (!(this.moved || orbiting) || !this.visible || document.hidden || (!this.moved && this.inView === false)) { this.t0 = 0; return; }
      if ((idle || settled) && !owed) {
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
      // the plan set follows the drawing's size, but never during a camera move (camTo chose it for the whole move)
      if (!this.camT) this.cs = pickSet(this.cs, this.u);
      this.gen = ++GEN;
    }

    // A plan ring at height y on screen. Each ring is projected once per camera: the slab band, its cap, the glass,
    // the outline, the ruler and the loupe all reuse the same points.
    // (y is a height, or a height for each point of the ring: the crown's top follows its crest)
    ring(pl, y) {
      let e = this._pj.get(pl);
      if (!e || e.g !== this.gen) this._pj.set(pl, (e = { g: this.gen, m: new Map() }));
      let r = e.m.get(y);
      if (!r) { const f = typeof y === 'function'; r = new Array(pl.length); for (let i = 0; i < pl.length; i++) r[i] = this.P(pl[i].x, f ? y(pl[i]) : y, pl[i].z); e.m.set(y, r); }
      return r;
    }
    // the crown's top as its screen stands h high at the crest (one function a height, so its projection is reused)
    crownTop(h) {
      if (!this._ct || this._ct.h !== h) this._ct = { h, f: (p) => FLOORS + SLAB + (h * CREST(p)) / SCREEN_H };
      return this._ct.f;
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
      for (let k = PODIUM; k < CROWN; k++) { let m = 1e9; for (const p of PLANS3[k].slab) m = Math.min(m, s * p.x + c * p.z); n += m; }
      return -n / (CROWN - PODIUM);
    }

    // A view of the tower that keeps everything that matters inside the canvas with a margin: the tower
    // to the top of its crown and beacon, the crane at the height it will stand, and the level ruler with
    // its labels. Returns the ty, scale and offsetX that frame it from (theta, phi), for camTo().
    // spec: { built, crane, plan, margin: [top, right, bottom, left] in px, ty, scale, offsetX (starting values),
    //        vOnly (fit the height only and keep offsetX), maxScale, measure (return the box in px at the starting values) }
    fit(theta, phi, spec = {}) {
      useSet(this.cs);
      const m = spec.margin || [24, 16, 16, 16], w = this.w, h = this.h;
      let ty = spec.ty != null ? spec.ty : this.o.ty, sc = spec.scale != null ? spec.scale : this.o.scale, ox = spec.offsetX != null ? spec.offsetX : this.o.offsetX;
      if (!w || !h) return { theta, phi, ty, scale: sc, offsetX: ox };
      const pts = [], pads = []; // world points, and points carrying a screen-space pad [x, y, z, padL, padR, padUp]
      // the plan: the site line and the canopies of the trees on it
      if (spec.plan) {
        for (const [x, z] of [[-9.5, -7.5], [9.5, -7.5], [9.5, 7.5], [-9.5, 7.5]]) pts.push([x, 0, z]);
        for (const [x, z, hh] of PALMS) { const r = 0.55 + hh * 0.18; pts.push([x - r, 0, z], [x + r, 0, z], [x, 0, z - r], [x, 0, z + r]); }
        // (and, where the plan is named, the street's name and the north point)
        if (this.o.planNotes) pts.push(...PLAN_NOTES.map(([x, z]) => [x, 0, z]));
      }
      else {
        for (const k of [0, 2, 3, ...Array.from({ length: Math.ceil((CROWN - 6) / 4) }, (_, i) => 6 + 4 * i), CROWN, FLOORS - 1, FLOORS]) for (const p of slabPlan(k)) pts.push([p.x, k, p.z], [p.x, k + SLAB, p.z]);
        for (const p of SCREEN) pts.push([p.x, FLOORS + SLAB + SCREEN_H, p.z]);
        pads.push([0, FLOORS + SLAB + SCREEN_H + BEACON, 0, 8, 8, 8]); // the beacon's glow
      }
      // the crane at the height it will stand for a drawing of this size (u px a level)
      const crane = (u) => {
        const [mx, mz] = MAST, { top, ang } = craneAt(spec.built || 0, (spec.built || 0) >= FLOORS ? 1 : 0, u), ca = Math.cos(ang), sa = Math.sin(ang);
        const J = (d, y, ww = 0) => [mx + ca * d - sa * ww, y, mz + sa * d + ca * ww];
        return [[mx, 0, mz], J(0, top + 3, 0), J(JIB, top, -0.3), J(JIB, top, 0.3), J(-4.6, top, -0.3), J(-4.6, top, 0.3), J(-3.9, top - 0.7, 0)];
      };
      const c = Math.cos(theta), s = Math.sin(theta), sd = this.o.dimSide === 1 ? -1 : 1;
      if (!spec.plan) {
        // the ruler and its labels
        const nr = this.nearFace(c, s), at = (X) => [c * X * sd - s * nr, -s * X * sd - c * nr];
        const [ax, az] = at(-10), [lx, lz] = at(-11.9), tw = this.o.labels ? this.o.labelSize * 3 : 0;
        pts.push([ax, 0, az], [ax, FLOORS + SLAB, az]);
        for (const y of [SLAB, FLOORS + SLAB]) pads.push([lx, y, lz, sd > 0 ? tw : 0, sd > 0 ? 0 : tw, this.o.labelSize * 0.6]);
      }
      // the first release's name, where it is set over its bracket (see scene), at the bracket's top
      const rel = !spec.plan && spec.release > 0 ? { k: this.relBand(spec.release), tw: this.relWidth(), nr: this.nearFace(c, s) } : null;
      const box = () => {
        const K = this.camAt(theta, phi, ty, sc, ox);
        let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
        const pr = (x, y, z) => { const X = K.c * x - K.s * z, Z = K.s * x + K.c * z + K.d; return [K.cx + (K.f * X) / Z, K.cy - (K.f * (y - K.ey)) / Z]; };
        if (rel) {
          // (each level's tick sits where its slab edge is nearest the eye, as drawn)
          const lv = (k) => { let y = 0, zn = Infinity; for (const q of edgePlan(k)) { const Z = K.s * q.x + K.c * q.z + K.d; if (Z < zn) { zn = Z; y = K.cy - (K.f * (k + SLAB - K.ey)) / Z; } } return y; };
          const yt = lv(rel.k[1] + 1), [bx] = pr(-c * 9.15 * sd - s * rel.nr, 0, s * 9.15 * sd - c * rel.nr), z = this.o.labelSize;
          if (!this.relAlong(w, K.f / K.d, Math.abs(lv(rel.k[0]) - yt), rel.tw)) {
            const r = sd > 0, lx0 = r ? bx - 1 : bx + 1 - rel.tw;
            x0 = Math.min(x0, lx0); x1 = Math.max(x1, lx0 + rel.tw); y0 = Math.min(y0, yt - 5 - z);
          }
        }
        for (const [x, y, z] of spec.crane && !spec.plan ? pts.concat(crane(K.f / K.d)) : pts) { const [u, v] = pr(x, y, z); x0 = Math.min(x0, u); x1 = Math.max(x1, u); y0 = Math.min(y0, v); y1 = Math.max(y1, v); }
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
      if (L && this.L >= 1) this.loupe(L);
      // Today's path of the sun over Miami, an arc laid over the drawing like a sundial: solid where it has been, dotted
      // where it is going (laid over the loupe, which never covers it)
      this.spG = null;
      if (this.o.sunPath && this.drawnAt && this.w >= 820) this.sunPath(performance.now(), this.dark);
    }

    loupe(L) {
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
      g.lineWidth = 4; g.strokeStyle = `rgb(${br},${bgg},${bb})`; g.lineJoin = 'round'; g.strokeText(WORDS.frame + '  ×1.7', L.x, ly); g.lineJoin = 'miter';
      g.fillStyle = `rgba(${sr},${sg},${sb},0.95)`; g.fillText(WORDS.frame + '  ×1.7', L.x, ly);
    }

    // (A few large parts of the scene are drawn by inner functions of their own, called where they stand: the site grid,
    // the tower's cast shadow, the envelope, the rails, a floor's lit rooms and lobby light, the soffit shade, the release
    // bracket and the ruler's halo. The scene itself has to stay under the size the script engine will optimise, or every
    // drawing runs unoptimised and costs a quarter more.)
    scene(inLens) {
      if (!inLens) this.camera();
      useSet(this.cs);
      const g = this.ctx, w = this.w, h = this.h, dark = this.dark;
      if (!inLens) g.clearRect(0, 0, w, h);
      // where the tower is rendered or photographed, the sky stands behind the whole scene (tower3d.js draws it, fading in
      // with the tower or the photograph; with no rendered tower it goes with the photograph)
      const sa = inLens ? 0 : this.sa, sky = inLens ? null : this.r3 && !this.r3.lost ? this.r3 : sa > 0 ? window.CentamontSky || null : null, skyA = sky === this.r3 ? Math.max(this.r3a, sa) : sa;
      // (under the photograph, laid on the canvas itself: the light of the sky behind the tower is added to it)
      if (sky) {
        const s = sa > 0 && this.ph.s, z = s && this.k.f / s.f;
        sky.backdrop(g, this, skyA, s ? { fill: sa >= 1, cut: [this.k.cx + (STILL_CUT[0] - s.cx) * z, this.k.cx + (STILL_CUT[1] - s.cx) * z, sa] } : null);
      }
      else if (!inLens && this.skyCss) { this.c.style.backgroundImage = ''; this.skyCss = ''; }
      const [lr, lg, lb] = this.line, [sr, sg, sb] = this.sold, [br, bgg, bb] = this.bg, [wr, wg, wb] = this.warm;
      const ink = (a) => `rgba(${lr},${lg},${lb},${a})`;
      const bronze = (a, k = 1) => `rgba(${Math.round(sr * k)},${Math.round(sg * k)},${Math.round(sb * k)},${a})`;
      const Q = 96, cache = this._cc || (this._cc = new Map());
      const memo = (key, fn) => { let v = cache.get(key); if (!v) { v = fn(); cache.set(key, v); } return v; };
      const mix = (t) => { const q = Math.round(clamp(t, 0, 1) * Q); return memo(q, () => { t = q / Q; return `rgb(${Math.round(br + (lr - br) * t)},${Math.round(bgg + (lg - bgg) * t)},${Math.round(bb + (lb - bb) * t)})`; }); };
      const mixS = (t0, l0) => { const q = Math.round(clamp(t0, 0, 1) * Q), ql = Math.round(clamp(l0, 0, 1) * 32); return memo(1000 + q * 40 + ql, () => { const t = q / Q, lift = ql / 32; const r = br + (sr - br) * t, gg = bgg + (sg - bgg) * t, b = bb + (sb - bb) * t; return `rgb(${Math.round(r + (255 - r) * lift)},${Math.round(gg + (255 - gg) * lift)},${Math.round(b + (255 - b) * lift)})`; }); };
      // a lit room: the ground toward the lamp light, never toward the bronze
      const mixL = (t0) => { const q = Math.round(clamp(t0, 0, 1) * Q); return memo(9000 + q, () => { const t = q / Q; return `rgb(${Math.round(br + (wr - br) * t)},${Math.round(bgg + (wg - bgg) * t)},${Math.round(bb + (wb - bb) * t)})`; }); };
      // a sold home's lit room: the ground toward the bronze by t0, then that toward the lamp light by l0, so it stays gold
      const mixH = (t0, l0) => { const q = Math.round(clamp(t0, 0, 1) * Q), ql = Math.round(clamp(l0, 0, 1) * 32); return memo(20000 + q * 40 + ql, () => { const t = q / Q, u = ql / 32, f = (b, s, w) => { const v = b + (s - b) * t; return Math.round(v + (w - v) * u); }; return `rgb(${f(br, sr, wr)},${f(bgg, sg, wg)},${f(bb, sb, wb)})`; }); };
      // a sold home's lit room, drawn as its panes: the ground toward the bronze by t0, then toward a lamp by l0 (a lamp a
      // little warmer or cooler by w0, from the lamp's ivory toward amber), so it reads gold, never cream
      const mixR = (t0, l0, w0) => { const q = Math.round(clamp(t0, 0, 1) * Q), ql = Math.round(clamp(l0, 0, 1) * 32), qw = Math.min(2, Math.floor(clamp(w0, 0, 0.999) * 3)); return memo(60000 + q * 400 + ql * 4 + qw, () => { const t = q / Q, u = ql / 32, wv = qw / 2, f = (b, s, wl, wa) => { const v = b + (s - b) * t, lw = wl + (wa - wl) * wv; return Math.round(v + (lw - v) * u); }; return `rgb(${f(br, sr, wr, 236)},${f(bgg, sg, wg, 196)},${f(bb, sb, wb, 142)})`; }); };
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
      const hair = 1 / (this.dpr || 1);
      // A small drawing (a phone) takes a lighter pen set: the slab lines thin (kpen) and the slab faces and lines quieten
      // (kt) as a level shrinks, so the rings never become the brightest band and the bronze carries the shaft. From 18 px
      // a level up (any desktop) both are 1 and nothing changes.
      const kpen = clamp(this.u / 18, 0.55, 1), kt = clamp((this.u - 4) / 14, 0.3, 1);
      // The light. On ink it is the real sun over Miami, fading out through dusk until, after dark, no sun reaches
      // the building at all; on the ivory sheet it is the sun while it is up and the draughtsman's light while it is down.
      // A drawing that keeps the draughtsman's light (o.draft, the developer story, whose views turn to the south) is lit
      // from it by day on both sheets, so its shade side and shadow always show; on ink its lamps still keep the hour.
      const real = this.o.sun ? { v: this.o.sun, night: 0, el: 45 } : this.sunNow, study = !this.o.sun && !this.o.draft && real.el > 0;
      const lit = this.o.draft ? { v: DRAFT.v, el: DRAFT.el, az: DRAFT.az, night: real.night } : dark || real.el > 0 ? real : DRAFT, sun = lit.v, sunH = Math.hypot(sun[0], sun[2]) || 1;
      const night = dark ? lit.night : 0, kd = 1 - night; // kd: how much direct sun the building gets
      // A high sun grazes a wall: its light on a façade falls with the sun's height (cosEl), so a June noon lights the walls
      // less than a December one, and a low sun full on.
      const sunN = Math.hypot(sun[0], sun[1], sun[2]) || 1, kel = 0.45 + 0.55 * (sunH / sunN);
      const dif = (nx, nz) => Math.max(0, (nx * sun[0] + nz * sun[2]) / sunH) * kd * kel;
      // Toward dusk the low sun's light is warm (gold: nothing above 18 degrees, full from 4 degrees down, gone with the
      // light): on ink, what it falls on (slab edges, the glass) is lit toward the lamp's warm ivory, never toward the
      // bronze, which keeps its meaning; the sold glass in it glows a little brighter.
      const gold = dark && !this.o.draft && !this.o.sun ? kd * clamp((18 - lit.el) / 14, 0, 1) : 0;
      const mixW = (t0, w0) => { const q = Math.round(clamp(t0, 0, 1) * Q), qw = Math.round(clamp(w0, 0, 1) * 16); if (!qw) return mix(t0); return memo(40000 + q * 20 + qw, () => { const t = q / Q, u = qw / 16, c = (b, l, wm) => Math.round(b + (l + (wm - l) * u - b) * t); return `rgb(${c(br, lr, wr)},${c(bgg, lg, wg)},${c(bb, lb, wb)})`; }); };
      const now = performance.now();
      // lamp glows after dark, gathered while the rooms are drawn and laid over everything once the tower stands
      // The rendered tower (tower3d.js), where it runs: while it fades in, it is laid over the whole drawing; once it has,
      // it stands in for the drawn tower, its shadow and its lamps' glow, and the drawing keeps the ground, the crane, the
      // sketch of the floors still to come, the people, the ruler and the labels.
      // (the photograph, once it has faded in, stands in for all of that too)
      const r3 = !inLens && this.r3 && !this.r3.lost ? this.r3 : null, solid = (!!r3 && this.r3a >= 1) || sa >= 1;
      const glows = dark && !inLens && !this.forced && night > 0.05 && !solid ? [] : null;
      // The lights-on cascade: seconds since the building was finished (99 once it long has been, -1 while it is not),
      // and how far on a lamp that comes on d seconds into it is (each takes 0.18 s)
      const casT = this.doneAt === -Infinity ? 99 : this.doneAt ? ((now - this.doneAt) / 1000) * (this.o.cascadeK || 1) : -1, cas = (d) => clamp((casT - d) / 0.18, 0, 1);
      this.nightNow = night;
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
      // A residence sold before its glass is in, inside the open frame among its slabs and columns: a bronze volume with
      // its edges drawn, solid to the eye (what stands behind it is hidden), so the count on the gauge can be read in the
      // drawing. On a small drawing it is drawn fuller, so it still reads as sold among the slabs.
      const fOpen = (dark ? 0.36 : 0.33) + 0.2 * (1 - fine);
      const ghost = (k, y0, y1, from) => {
        const fs = [this.soldOf(k, 0), this.soldOf(k, 1)];
        if (fs[0] <= 0 && fs[1] <= 0) return;
        const pl = PLANS[k].glass, sd = SIDE[k], n = pl.length, edges = [], bot = this.ring(pl, y0), top = this.ring(pl, y1);
        for (let j = from; j < n; j++) {
          const side = sd[j], f = fs[side]; if (f <= 0) continue;
          const j2 = (j + 1) % n, q = [bot[j], bot[j2], top[j2], top[j]];
          const area = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
          if (area >= 0) continue;
          const fq = Math.round(f * 10) / 10;
          queue(q, mixS(fOpen * fq, 0));
          edges.push([fq, bot[j], bot[j2]], [fq, top[j], top[j2]]);
          // the party wall between the two residences, and the open end of a residence on a part-glazed level
          if (sd[(j + n - 1) % n] !== side || (j === from && from > 0)) edges.push([fq * 0.8, bot[j], top[j]]);
          if (sd[j2] !== side) edges.push([fq * 0.8, bot[j2], top[j2]]);
        }
        flush();
        g.lineWidth = 0.8;
        const as = new Set(edges.map((e) => (e[0] = Math.round(e[0] * 20) / 20)));
        for (const a of as) { g.beginPath(); g.strokeStyle = bronze(a); for (const e of edges) if (e[0] === a) seg(e[1], e[2]); g.stroke(); }
      };
      // Residences sold off plan, before the frame reaches them. Each stands in the sketch as the solid it will be, its
      // party wall included, and hides the sketch behind it, so the sold floors read as one countable block: a floor line
      // at every level (where two sold homes meet, only the edge that shows), the party wall as one stepped line (the
      // plates turn from floor to floor), the edges firm where the block meets the sketch, and one line round the whole
      // block. Each drops the last few feet into place as it sells.
      const fOff = dark ? 0.36 : 0.33, fShade = dark ? 0.78 : 1.25, offAt = (k) => k >= RES0 && k < RES1 && k >= L - 0.001;
      const shape = (pl, hx, y0, y1) => { const up = chain(this.ring(pl, y1), hx, true), lo = chain(this.ring(pl, y0), hx, false); for (let i = lo.length - 1; i >= 0; i--) up.push(lo[i]); return up; };
      const front = (r0, r1, j, n) => { const j2 = (j + 1) % n, a = r0[j], b = r0[j2], c = r1[j2]; return (b[0] - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (b[1] - a[1]) < 0; };
      const offplan = (ks, outlined) => {
        const fills = new Map(), faces = [], lines = [], edges = [], hs = [], ey = eye[1];
        const full = (k, s) => offAt(k) && this.soldOf(k, s) >= 1;
        const add = (col, p) => { let a = fills.get(col); if (!a) fills.set(col, (a = [])); a.push(p); };
        for (const k of ks) {
          const fs = [this.soldOf(k, 0), this.soldOf(k, 1)];
          if (fs[0] <= 0 && fs[1] <= 0) continue;
          const pl = PLANS[k].glass, sd = SIDE[k], n = pl.length, both = fs[0] >= 1 && fs[1] >= 1;
          // (the solid in the shade of its underside and party wall, its faces lit over it)
          if (both) { const p = shape(pl, planHull(pl), k, k + 1); add(mixS(fOff * fShade, 0), p); hs.push(p); }
          for (const s of [0, 1]) {
            const f = fs[s]; if (f <= 0) continue;
            const fq = Math.round(f * 10) / 10, dy = (1 - smooth(f)) * 0.35, y0 = k + dy, y1 = k + 1 + dy;
            if (!both) { const p = shape(pl, SIDEHULL[k][s], y0, y1); add(mixS(fOff * fShade * fq, 0), p); if (f >= 1) hs.push(p); }
            const bot = this.ring(pl, y0), top = this.ring(pl, y1), upIn = f >= 1 && full(k + 1, s), dnIn = f >= 1 && full(k - 1, s);
            // (seen from below, the lower home's top edge shows and the upper's foot is hidden behind it; from above, the
            // other way round; at the penthouses' setback, from above, both)
            const topOn = !upIn || ey < k + 1 || k + 1 === CROWN, botOn = !dnIn || ey > k;
            for (let j = 0; j < n; j++) {
              if (sd[j] !== s || !front(bot, top, j, n)) continue;
              const j2 = (j + 1) % n;
              faces.push([mixS(fOff * fq, 0), [bot[j], bot[j2], top[j2], top[j]]]);
              if (topOn) (upIn ? lines : edges).push([fq, top[j], top[j2]]);
              if (botOn) (dnIn ? lines : edges).push([fq, bot[j], bot[j2]]);
            }
          }
        }
        for (const [col, ps] of fills) { g.beginPath(); for (const p of ps) { g.moveTo(p[0][0], p[0][1]); for (let i = 1; i < p.length; i++) g.lineTo(p[i][0], p[i][1]); g.closePath(); } g.fillStyle = col; g.fill(); }
        for (const [col, q] of faces) queue(q, col);
        flush();
        const strokeBy = (es, w, k) => { g.lineWidth = w; const as = new Set(es.map((e) => (e[0] = Math.round(e[0] * 20) / 20))); for (const a of as) { g.beginPath(); g.strokeStyle = bronze(k * a); for (const e of es) if (e[0] === a) seg(e[1], e[2]); g.stroke(); } };
        strokeBy(lines, 0.6 + 0.2 * fine, dark ? 0.85 : 0.8);
        strokeBy(edges, 1, 0.9);
        // the party wall: up each face it shows on, with a short jog along each floor line where the plate above has turned
        g.beginPath(); g.strokeStyle = bronze(0.9); g.lineWidth = 1;
        for (const i of SPLIT) {
          let prev = -9;
          for (const k of ks.slice().sort((a, b) => a - b)) {
            if (!(this.soldOf(k, 0) >= 1 || this.soldOf(k, 1) >= 1)) continue;
            const pl = PLANS[k].glass, n = pl.length, r0 = this.ring(pl, k), r1 = this.ring(pl, k + 1);
            if (!front(r0, r1, i, n) && !front(r0, r1, (i + n - 1) % n, n)) continue;
            if (k === CROWN && prev === k - 1 && eye[1] < k) {
              // (at the penthouses' setback, seen from below, their party wall rises from behind the top edge of the floor under them)
              const rb = this.ring(PLANS[k - 1].glass, k), x = r0[i][0];
              let y = r0[i][1];
              for (let j = 0; j < n; j++) { const a = rb[j], b = rb[(j + 1) % n]; if ((a[0] - x) * (b[0] - x) <= 0 && a[0] !== b[0]) { const yc = a[1] + ((b[1] - a[1]) * (x - a[0])) / (b[0] - a[0]); if (yc < y) y = yc; } }
              g.moveTo(x, y);
            } else if (prev === k - 1) g.lineTo(r0[i][0], r0[i][1]); else g.moveTo(r0[i][0], r0[i][1]);
            g.lineTo(r1[i][0], r1[i][1]); prev = k;
          }
        }
        g.stroke();
        // and one line round the block, once the drawing is large enough to carry it
        if (outlined && hs.length && fine > 0.3) this.outline(hs, bronze(0.95 * clamp((fine - 0.3) / 0.2, 0, 1)), 1.1, null);
      };

      // The level ruler stands on the plane of the near façade, and each tick is set at the height where the slab it
      // names is nearest the eye, so every tick meets its slab edge (the podium's for the lowest levels, the setback's
      // for the roof). It is on the viewer's left unless dimSide is 1. (Drawn last, over everything; found here, since the
      // construction lines run from its ticks.)
      const E0 = this.E, kc = this.k.c, ks = this.k.s, sd = this.o.dimSide === 1 ? -1 : 1, nr = this.nearFace(kc, ks), at = (X) => [kc * X * sd - ks * nr, -ks * X * sd - kc * nr];
      // a vertical line stays vertical through a shift lens, so the ruler, its tick ends and its labels each sit at one x
      const sx = (X) => { const [x, z] = at(X); return this.P(x, 0, z)[0]; }, xa = sx(-10), xt = sx(-10.7), xl = sx(-11.9);
      // a level is marked at its finished floor, the top of its slab (the lobby's upper level at its façade line)
      const lv = (i) => { let best = null; for (const q of this.ring(edgePlan(i), i + SLAB)) { if (!best || q[2] < best[2]) best = q; } return best[1]; };
      const ruler = !(E0 < 0.01 && L < 0.01), ys = ruler ? Array.from({ length: FLOORS + 1 }, (_, i) => lv(i)) : null;
      // Shadows are drawn as a sun study draws them, a light tone hatched with lines laid on the surface itself (pw a convex
      // outline in plan at height y), a quarter of a unit apart, so the hatch stays put on the ground as the view turns. The
      // lines run along the bearing o.hatch (degrees; south-east to north-west unless set): the hero sets the bearing its
      // camera looks along, so seen across the low, foreshortened ground they close up as little as they can; where they
      // still do (a long low sun's shadow running off to the side), the hatch thins out by whole lines (see hatchProject), so
      // the shadow keeps one language, hatched to its far end. The hatch is the line colour on both sheets: bronze only
      // ever means sold. The level ruler is drawn over it with a hairline of clear ground either side (see the ruler).
      const ha = (this.o.hatch != null ? this.o.hatch : 135) * RAD, hnx = Math.cos(ha), hnz = -Math.sin(ha);
      // (the lines in plan depend only on the outline, which is kept while the light and the building stay put: they are
      // found once for it, and only projected each drawing)
      const HATCH = this._hatch || (this._hatch = new WeakMap()), D = 0.25, shadowScr = [];
      const hatchOn = (pw, y, col, fade) => {
        let hc = HATCH.get(pw);
        if (!hc || hc.ha !== ha) HATCH.set(pw, (hc = { ha, ls: hatchPlan(pw, hnx, hnz, D) }));
        // (on a small drawing an outline whose lines would all close up even sixteen apart is not projected line by line:
        // the spacing is taken first at its corners, where it is widest)
        if (fine < 0.5 && hatchWide(pw, this.k, y, hnx, hnz, D) * 16 < 1.5) return;
        // (the lines fade in sixth steps, each a stroke of its own; on a small drawing in thirds)
        const kq = fine < 0.5 ? 3 : 6, sets = [[], [], [], [], [], [], []], box = [0, 0, 0, 0];
        if (!hatchProject(hc.ls, this.k, y, hnx, hnz, D, kq, sets, box, fade)) return;
        g.lineWidth = 0.75;
        for (let q = 1; q <= kq; q++) { const st = sets[q]; if (!st.length) continue; g.beginPath(); for (let i = 0; i < st.length; i += 4) { g.moveTo(st[i], st[i + 1]); g.lineTo(st[i + 2], st[i + 3]); } g.strokeStyle = col(q / kq); g.stroke(); }
      };
      // Ground: survey grid, site line, and the tower's shadow. Under the photograph (which has its own site) it goes, so
      // left of the photograph the open bay runs on rather than a drawn plane under the links (gA, the ground's alpha)
      const gA = 1 - sa;
      if (this.o.grid && gA > 0.001) (() => {
        g.globalAlpha = gA;
        // seen from above, as a plan, the ground drawing carries the picture, so it is drawn darker
        const bo = 1 + clamp(-(this.phi + (this.tyy || 0)) * 1.6, 0, 1);
        // a ground line is cut where it passes behind the eye (a close camera, as on the empty lot, can stand inside the
        // grid), so no part of it is ever projected upside down into the sky
        const gseg = (x0, z0, x1, z1) => {
          const k = this.k, n = 0.5, a = k.s * x0 + k.c * z0 + k.d, b = k.s * x1 + k.c * z1 + k.d;
          if (a < n && b < n) return;
          if (a < n) { const t = (n - a) / (b - a); x0 += (x1 - x0) * t; z0 += (z1 - z0) * t; }
          else if (b < n) { const t = (n - b) / (a - b); x1 += (x0 - x1) * t; z1 += (z0 - z1) * t; }
          seg(this.P(x0, 0, z0), this.P(x1, 0, z1));
        };
        // Where the tower is rendered, the site stands on a point in the bay: the land is laid over the water the
        // renderer has drawn to the horizon, out to a sea wall round it, and the survey grid stays on the land
        if (sky && dark && this.o.site !== false) {
          const pw = nearCut(SHORE, this.k, 1), sp = pw.map(([x, z]) => this.P(x, 0, z));
          g.save(); g.globalAlpha = skyA * gA; sky.land(g, this, sp); g.restore();
          g.lineWidth = 1; g.strokeStyle = ink(0.34 * (r3 ? 1 : skyA)); g.beginPath(); sp.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); if (pw === SHORE) g.closePath(); g.stroke();
        }
        // (o.gridK strengthens the grid where it is the whole drawing, as on the empty lot)
        g.lineWidth = 1;
        for (let i = 0; i <= 30; i += 3) {
          g.strokeStyle = ink(0.07 * bo * (this.o.gridK || 1) * (1 - i / 34)); g.beginPath();
          for (const v of i ? [i, -i] : [0]) { gseg(v, -30, v, 30); gseg(-30, v, 30, v); }
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
            g.globalAlpha = f * gA; g.beginPath(); q.forEach((p, i) => (i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]))); g.stroke();
          }
          g.globalAlpha = gA;
          // north point, only where the view looks down enough to read it
          // (on the story's plan it goes with the plan's names as the view lifts off it)
          const pn = this.o.planNotes ? clamp((-this.phi - 0.3) / 0.3, 0, 1) : 1;
          if (this.o.north && pn > 0.01) {
          g.globalAlpha = gA * pn;
          const nc = [12.5, 9.5];
          g.strokeStyle = bronze(0.7); g.lineWidth = 0.8; g.beginPath();
          for (let i = 0; i <= 28; i++) { const a = TAU * i / 28, q = this.P(nc[0] + Math.cos(a) * 1, 0, nc[1] + Math.sin(a) * 1); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }
          g.stroke(); poly([this.P(nc[0], 0, nc[1] + 1.35), this.P(nc[0] - 0.32, 0, nc[1] - 0.5), this.P(nc[0], 0, nc[1] - 0.2), this.P(nc[0] + 0.32, 0, nc[1] - 0.5)]); g.fillStyle = bronze(0.75); g.fill();
          if (this.o.labels && w > 280) { const t = this.P(nc[0], 0, nc[1] + 1.9); g.fillStyle = bronze(0.9); g.font = '500 ' + (this.o.planNotes ? this.o.labelSize : 10) + 'px Jost, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', t[0], t[1]); }
          g.globalAlpha = gA;
          }
        }
        g.setLineDash([4, 5]); g.strokeStyle = bronze(Math.min(0.9, 0.55 * bo));
        poly([[-9.5, -7.5], [9.5, -7.5], [9.5, 7.5], [-9.5, 7.5]].map(([x, z]) => this.P(x, 0, z))); g.stroke(); g.setLineDash([]);
        // The story's plan is lettered as a site plan is (o.planNotes): the site, the tower on its footprint, the street.
        // The names lie flat on the sheet and go as the view lifts off the plan.
        if (this.o.planNotes && this.o.labels && this.o.site !== false) {
          const f = clamp((-this.phi - 0.3) / 0.3, 0, 1);
          if (f > 0.01) {
            g.save(); g.globalAlpha = gA * f; g.font = '500 ' + this.o.labelSize + 'px Jost, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
            if ('letterSpacing' in g) g.letterSpacing = '0.14em';
            for (const [x, z, k] of PLAN_NOTES) {
              if (k > 2) continue;
              const p = this.P(x, 0, z); g.fillStyle = k ? ink(dark ? 0.62 : 0.56) : bronze(0.95); g.fillText([WORDS.site, WORDS.tower, WORDS.street][k], p[0], p[1]);
            }
            g.restore();
          }
        }
        if (L > 0.01) {
          // the drop-off drive under the canopy, and the walk to the street
          g.strokeStyle = ink(dark ? 0.26 : 0.24); g.lineWidth = 0.8; g.beginPath();
          for (const rr of [1.4, 2.9]) { for (let i = 0; i <= 18; i++) { const a = Math.PI * i / 18, p = this.P(Math.cos(a) * rr * 1.25, 0, -5.4 - Math.sin(a) * rr); i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); } }
          seg(this.P(-3.6, 0, -5.4), this.P(-3.6, 0, -7.5)); seg(this.P(3.6, 0, -5.4), this.P(3.6, 0, -7.5));
          g.stroke();
        }
        g.globalAlpha = 1;
      })();
      if (L > 0.01 && !solid) {
        // The tower's shadow. On ink it is the sun's, and goes with it: it fades through dusk (its bearing easing toward
        // the draughtsman's light over the left shoulder as it does) and is gone by the end of civil dusk, when the base
        // is seated by its contact shadow and the lobby's pool of light. The ivory sheet keeps the draughtsman's shadow.
        const sa = dark ? kd : 1, sv = dark && night > 0 ? [sun[0] * kd + DRAFT.v[0] * night, Math.max(0, sun[1]) * kd + DRAFT.v[1] * night, sun[2] * kd + DRAFT.v[2] * night] : sun;
        if (sa > 0.01) (() => {
          const sy = Math.max(sv[1], 0.3), dx = -sv[0] / sy, dz = -sv[2] / sy;
          // (in plan: the hull of the podium and the tower, thrown along the light, a share c of its full length)
          const castW = (c) => {
            const sh = [], add = (pl, y) => { for (const i of planHull(pl)) { const p = pl[i]; sh.push([p.x + dx * y * c, p.z + dz * y * c]); } };
            add(PLANS[0].slab, 0); add(PLANS[0].slab, Math.min(L, PODIUM));
            if (L > PODIUM) { add(PLANS[Math.min(FLOORS - 1, Math.floor(L))].slab, L); add(PLANS[PODIUM].slab, PODIUM); }
            return hull(sh);
          };
          const cast = (c) => castW(c).map(([x, z]) => this.P(x, 0, z));
          // (the full shadow in plan is kept while the light and the building stay put)
          const gk = dx + ',' + dz + ',' + L;
          if (this._gsK !== gk || this._gsP !== PLANS) { this._gsK = gk; this._gsP = PLANS; this._gs = castW(1); }
          let shw = this._gs, shp = shw.map(([x, z]) => this.P(x, 0, z));
          // On a drawing that stands still in its frame (the story's), a shadow that is not this minute's sun study is
          // drawn only as long as the sheet holds it, so its far end is never cut off by the canvas's edge.
          const inside = (ps) => ps.every((p) => p[0] >= 6 && p[0] <= w - 6 && p[1] >= 6 && p[1] <= h - 6);
          let share = 1;
          if (!this.o.orbit && !inLens && (!study || night > 0) && !inside(shp)) {
            let lo = 0, hi = 1;
            for (let i = 0; i < 6; i++) { const c = (lo + hi) / 2; if (inside(cast(c))) lo = c; else hi = c; }
            // (kept while it stays the same, so its hatch is found once for it)
            const sk = gk + ',' + lo;
            if (this._gsSK !== sk || this._gsP !== PLANS) { this._gsSK = sk; this._gsS = castW(lo); }
            share = lo; shw = this._gsS; shp = shw.map(([x, z]) => this.P(x, 0, z));
          }
          // (cut where it would pass behind the eye)
          const shc = nearCut(shw, this.k, 1);
          if (shc !== shw) shp = shc.map(([x, z]) => this.P(x, 0, z));
          // A long shadow (a low sun's) dies away along its length, to about a third of its strength at its far end, so it
          // never runs off the sheet as a solid band: its tone and its hatch alike, from about 9 units out (past the
          // podium's corners). A short one (a high sun's) keeps its strength to its end.
          const dl = Math.hypot(dx, dz), Lt = dl * Math.min(L, FLOORS) * share;
          const a1 = clamp(1 - (Lt - 14) / 30, 0.3, 1), fade = a1 < 0.999 ? [0, 0, 9, Math.max(Lt + 2, 12), a1] : null;
          if (shp.length > 2) {
            const fa = dark ? 0.3 * kd : 0.05;
            let fs = dark ? `rgba(0,0,0,${fa.toFixed(3)})` : ink(fa);
            if (fade && dl > 1e-3) {
              const ux = dx / dl, uz = dz / dl, A = this.P(ux * 9, 0, uz * 9), B = this.P(ux * fade[3], 0, uz * fade[3]);
              if (A[2] > 1 && B[2] > 1 && Math.hypot(B[0] - A[0], B[1] - A[1]) > 2) {
                const gr = g.createLinearGradient(A[0], A[1], B[0], B[1]), c0 = dark ? '0,0,0' : `${lr},${lg},${lb}`;
                gr.addColorStop(0, `rgba(${c0},${fa.toFixed(3)})`); gr.addColorStop(1, `rgba(${c0},${(fa * a1).toFixed(3)})`); fs = gr;
              }
            }
            poly(shp); g.fillStyle = fs; g.fill(); shadowScr.push(shp);
            // and hatched, the way a sun study is drawn: the shadow's length and bearing are this hour's
            if (sa > 0.02) hatchOn(shc, 0, (k) => ink((dark ? 0.24 * sa : 0.2) * k), fade);
          }
        })();
        // contact shadow: the ground darkens where the building meets it
        for (const o of [1.1, 0.6, 0.25]) {
          poly(PLANS[0].slab.map((p) => this.P(p.x + p.nx * o, 0, p.z + p.nz * o)));
          g.fillStyle = dark ? 'rgba(0,0,0,0.16)' : ink(0.035); g.fill();
        }
        // after dark the lobby's light falls out across the drive, once the building is open
        if (dark && night > 0.05 && this.occ > 0.01 && !inLens) {
          const c = this.P(0, 0, -5.6), e = this.P(3.4, 0, -5.6), f = this.P(0, 0, -8.2), rx = Math.abs(e[0] - c[0]), ry = Math.max(2, Math.abs(f[1] - c[1]));
          if (rx > 2) {
            g.save(); g.translate(c[0], c[1]); g.scale(1, ry / rx);
            const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
            gr.addColorStop(0, `rgba(${wr},${wg},${wb},${(0.3 * night * this.occ).toFixed(3)})`); gr.addColorStop(0.5, `rgba(${wr},${wg},${wb},${(0.1 * night * this.occ).toFixed(3)})`); gr.addColorStop(1, `rgba(${wr},${wg},${wb},0)`);
            g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, TAU); g.fill(); g.restore();
          }
        }
      }

      const towerZ = this.P(0, this.eye[1], 0)[2], palmsBack = [], palmsFront = [], figsBack = [], figsFront = [];
      if (this.o.palms !== false && this.o.grid) PALMS.forEach((p) => (this.P(p[0], 2, p[1])[2] > towerZ ? palmsBack : palmsFront).push(p));
      // people at the entrance once the building is open, so it reads at its true size
      if (this.o.figs !== false && this.o.grid && this.o.site !== false && this.occ > 0.01 && !inLens) FIGS.forEach((f) => (this.P(f[0], 0.3, f[1])[2] > towerZ ? figsBack : figsFront).push(f));
      palmsBack.forEach((p) => this.drawPalm(p));
      g.globalAlpha = this.occ; figsBack.forEach((f) => this.drawFigure(f)); g.globalAlpha = 1;

      // Construction lines: a draughtsman's pencil guides, laid down before the ink and left faintly behind it. The datum
      // lines run level from the ruler's numbered ticks (L05, L10, L15, L20 and the roof) across the drawing, so each
      // passes through its tick; the verticals mark the tower's width.
      // (Under the photograph, which is no drawing, they go as it comes in.)
      const DATUM = [...Array.from({ length: Math.floor(FLOORS / 5) }, (_, i) => 4 + 5 * i), FLOORS], xg = clamp(sx(8), 12, w - 12); // (ending inside the canvas on a narrow drawing)
      if (this.o.guides && this.drawnAt && !inLens && ruler && this.sa < 1) {
        const age = reduce ? 9 : (now - this.drawnAt) / 1000;
        const a = (1 - this.sa) * (dark ? 0.3 : 0.26) * (age < 2.5 ? 1 : Math.max(0.35, 1 - (age - 2.5) / 3));
        g.strokeStyle = ink(a); g.lineWidth = 0.5; g.beginPath();
        const lines = DATUM.map((i) => [[xt, ys[i]], [xg, ys[i]]]);
        for (const X of [-6.6, -3.7, 3.7, 6.6]) lines.push([this.P(kc * X, -1.5, -ks * X), this.P(kc * X, FLOORS + 4, -ks * X)]);
        lines.forEach(([A, B], i) => { const p = clamp((age - i * 0.07) / 0.9, 0, 1); if (!p) return; const e = 1 - Math.pow(1 - p, 3); g.moveTo(A[0], A[1]); g.lineTo(A[0] + (B[0] - A[0]) * e, A[1] + (B[1] - A[1]) * e); });
        g.stroke();
      }
      // In the developer story the same datum lines, faint and dotted, come in once the camera rests (o.restGuides), on a
      // drawing large enough to hold them; a camera move takes them away at once, so none is ever seen sliding.
      const gk = this.gd * clamp((fine - 0.5) / 0.2, 0, 1);
      if (this.o.restGuides && ruler && !inLens && gk > 0.005) {
        g.setLineDash([2, 4]); g.strokeStyle = ink(0.1 * gk); g.lineWidth = hair; g.beginPath();
        for (const i of DATUM) { g.moveTo(xt, ys[i]); g.lineTo(xg, ys[i]); }
        g.stroke(); g.setLineDash([]);
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
      if (E > 0.001 && L < FLOORS) (() => {
        const from = Math.ceil(L - 0.001), ex = eye[0], ez = eye[2];
        const near = (p, q) => (ex - (p.x + q.x) / 2) * (p.nx + q.nx) + (ez - (p.z + q.z) / 2) * (p.nz + q.nz) > 0;
        g.setLineDash([3, 4]); g.lineWidth = dark ? 0.8 : 0.9; g.strokeStyle = ink(dark ? 0.5 : 0.45); g.beginPath();
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
            const pl = PLANS[k].glass, r = this.ring(pl, y0), sd = k >= RES0 && k < RES1 ? SIDE[k] : null, sf = sd && [this.soldOf(k, 0) > 0.5, this.soldOf(k, 1) > 0.5];
            let jl = 0, jr = 0;
            for (let j = 1; j < m; j++) { if (r[j][0] < r[jl][0]) jl = j; if (r[j][0] > r[jr][0]) jr = j; }
            // (none where a sold residence stands: its own edges carry the line there)
            const add = (key, j) => { if (sf && (sf[sd[j]] || sf[sd[(j + m - 1) % m]])) return; let ln = lines.get(key); if (!ln) lines.set(key, (ln = [])); ln.push([k, this.P(pl[j].x, y0, pl[j].z), this.P(pl[j].x, y1, pl[j].z)]); };
            add('l', jl); add('r', jr);
            // (on a small drawing only the outline: near verticals would cross every floor line in a field of dashes)
            if (fine > 0) for (let j = 0; j < m; j++) if (VMAP[j] >= 0 && VMAP[j] % 4 === 0 && j !== jl && j !== jr && near(pl[j], pl[j])) add(j, j);
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
              if (y1 <= y0 || this.soldOf(k, 0) > 0.5 || this.soldOf(k, 1) > 0.5) { on = false; continue; }
              const a = this.P(p.x, y0, p.z), b = this.P(p.x, y1, p.z);
              if (!on) g.moveTo(a[0], a[1]); else g.lineTo(a[0], a[1]);
              g.lineTo(b[0], b[1]); on = true;
            }
          }
          g.stroke();
        }
        g.setLineDash([]);
      })();
      // Residences sold off plan: bronze in the sketch before the frame reaches them
      // (where the core already stands inside them, they are drawn with its storey, in front of it)
      // The core leads: once ground breaks the lift and stair core climbs ahead of the frame, up to four storeys ahead
      // once it is going, always a storey under the crane's jib, which slews over it; it is closed in by the glass at
      // top-off.
      const coreTop = L > 0.01 && C < FLOORS - 0.01 ? Math.min(FLOORS, L + Math.min(4, 1.5 + L), craneAt(L).top - 1) : 0;
      // The crane sits behind or in front of the tower depending on the view (behind it, it is drawn before anything that
      // stands, the sold residences in the sketch included).
      const craneOn = this.o.crane && this.crane > 0.01 && !inLens;
      const craneBehind = this.P(MAST[0], eye[1], MAST[1])[2] > this.P(0, eye[1], 0)[2];
      if (craneOn && craneBehind) this.drawCrane(false);
      if (!inLens && this.S > 0.001 && !solid) { const ks = []; for (let k = RES0; k < RES1; k++) if (k >= L - 0.001 && !(k < coreTop && k > L + 0.001)) ks.push(k); offplan(ks, true); }

      // (the storeys closed in by their glass, below the open frame)
      const clad = Math.min(Math.floor(C + 0.001), FLOORS);
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
      // They go in with the glass of the storey they stand on, so the open frame above it has none.
      const railK = (k) => (k < FLOORS ? k + 1 <= C + 0.001 : C >= FLOORS - 0.001 && this.G > 0.5);
      if (railsOn) for (let k = PODIUM; k < FLOORS; k++) if (railK(k)) {
        const f = Math.min(far({ lo: k, hi: k + SLAB }), far({ lo: k + SLAB, hi: k + 1 })) - 0.0001;
        layers.push({ kind: 'rail', k, f });
      }
      // and round the roof terrace once the crown stands, in front of the screen
      if (railsOn && railK(FLOORS)) layers.push({ kind: 'rail', k: FLOORS, f: Math.min(far({ lo: FLOORS, hi: FLOORS + SLAB }), far({ lo: FLOORS + SLAB, hi: FLOORS + SLAB + crownH })) - 0.0001 });
      // the porte-cochère stands clear of the lobby's two storeys of glass, so it is drawn after them
      if (L >= 2) layers.push({ kind: 'canopy', f: far({ lo: 2, hi: 2 + SLAB }) - 0.00005 });
      layers.sort((a, b) => b.f - a.f);


      const view = (x, y, z) => { const vx = eye[0] - x, vy = eye[1] - y, vz = eye[2] - z, n = Math.sqrt(vx * vx + vy * vy + vz * vz); return [vx / n, vy / n, vz / n]; };
      // The shade each slab throws on the glass below it: a band under the slab that follows its edge, as deep as the slab
      // reaches out times the sun's profile angle (tan el over the cosine of the sun's bearing off the face), so it deepens
      // as the sun climbs and as a face turns from it, and thins away to a hairline toward the shade side rather than
      // breaking off there. It reads the balconies' swell only lightly (three tenths of each balcony's reach beyond the
      // storey's mean), so the bands lie as shade under each slab, not as waves rising floor over floor; on a small drawing
      // (a phone) they take the storey's mean reach alone. Under its firm edge the band softens over a lighter skirt (how far
      // depends on the sun as the band does), the lower floors take it more quietly than the upper ones, and over unsold
      // glass it stays shallow and pale, so the bronze of a sold home always reads at once against clean glass.
      const tanEl = Math.max(0, sun[1]) / sunH, sliver = 0.04;
      // (those shares depend on the plan, the slab above and the light, never on the camera: they are kept for each storey
      // while the light stays within about a tenth of a degree, as this hour's sun does for a minute or so; and the bands'
      // tones are this drawing's, found once for every storey)
      const FRS = this._frs || (this._frs = []), frKey = sun.map((v) => Math.round(v * 500)).join() + ',' + kd + ',' + dark + ',' + (fine < 0.5);
      const sofT = new Map(), sofTone = (sold, th, skirt) => {
        const key = (sold ? 1 : 0) + (skirt ? 2 : 0) + Math.round(th * 8) * 4;
        let v = sofT.get(key);
        if (!v) {
          const a = (skirt ? 0.4 : 1) * Math.round(th * 8) / 8;
          v = dark ? `rgba(0,0,0,${((sold ? 0.27 : 0.22) * kd * a).toFixed(3)})` : sold ? bronze(0.32 * a, 0.5) : `rgba(0,0,0,${(0.075 * a).toFixed(3)})`;
          sofT.set(key, v);
        }
        return v;
      };

      if (!solid) for (const l of layers) {
        if (this.xray && l.kind !== 'floor') {
          // inside the loupe, slabs are drawn as their edge lines only, in the drawing set's bronze
          // (the podium roof is the transfer slab that carries the tower's columns onto the podium's grid: drawn heavier)
          if (l.kind === 'slab') { g.strokeStyle = bronze(0.75); g.lineWidth = l.k === PODIUM ? 1.1 : 0.7; poly(cap(slabPlan(l.k), l.k + SLAB)); g.stroke(); }
          continue;
        }
        if (l.kind === 'slab') {
          const k = l.k, pl = slabPlan(k), top = ey > l.hi, open = k > clad;
          const y0 = k, y1 = k + SLAB;
          // A slab of the open frame, framed but not closed in, keeps more of its pen on a small drawing (ko), so a frame of a
          // few levels still reads there beside the sold block; from 16 px a level up (fine 1) it is drawn as before.
          const ko = open ? 0.6 * (1 - fine) : 0, kto = kt + (1 - kt) * ko, kpo = kpen + (1 - kpen) * ko;
          // On ink a slab edge is concrete in the light: its face bright where the sun is on it, its top lit from the sky
          // above, under a firm ivory line; as the light goes, faces, tops and lines all dim, and the lamps carry the
          // night. On ivory the faces are paper in the light and toned on the shade side.
          const kf = kto * (dark ? 0.75 + 0.25 * fine : 1);
          // (on a small drawing the light on the slab edges is taken in thirds: finer steps than a phone shows each cost a fill)
          // After dark, while the frame climbs, the working deck (the top slab of the frame) is floodlit by the work lamps:
          // its edge takes the lamps' warm light, and a low glow rides on it (laid with the lamps' light, below), so the light
          // climbs with the build, floor by floor, crane or none (wk: how strongly; it comes up over the first storey and goes
          // out as the last is set). By day the deck is in the sun, so it takes no lamp.
          const wk = glows && dark && L > 0.01 && L < FLOORS - 0.01 && k === Math.floor(L + 0.001) ? clamp(night * Math.min(1, L / 0.6, (FLOORS - L) / 0.6), 0, 1) : 0;
          const shadeSlab = (nx, nz) => { const d = fine < 0.5 ? Math.round(dif(nx, nz) * 3) / 3 : dif(nx, nz); if (!dark) return mix(kf * (0.05 + 0.22 * (1 - d))); const t = kf * (0.06 + 0.55 * d) * (1 - 0.62 * night); return mixW(t + (0.6 - t) * wk, Math.max(gold * Math.min(1, 3 * d), wk)); };
          const b = band(pl, y0, y1, shadeSlab, true), n = pl.length;
          if (wk > 0.01 && b.lines.length) {
            // (the glow sits on the deck's near edge, as wide as the deck and about a storey high)
            let x0 = 1e9, x1 = -1e9, yf = -1e9, zf = 1e9;
            for (const j of b.lines) { const p = b.top[j]; if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[2] < zf) { zf = p[2]; yf = p[1]; } }
            glows.push([(x0 + x1) / 2, yf - 0.3 * this.u, 0.62 * (x1 - x0), 1.05 * this.u, 0.3 * wk, 0]);
          }
          poly(cap(pl, top ? y1 : y0)); g.fillStyle = mix(kf * (dark ? (top ? 0.26 + 0.32 * Math.max(0, sun[1]) * kd : 0.09) * (1 - 0.6 * night) : (top ? 0.03 : 0.16))); g.fill();
          // The arris away from the cap that shows stands in front of the glass: a contour, firm. The one where the face
          // meets that cap is a crease, a hairline.
          // A slab of the open frame, with no glass yet above or below it, is built but not closed in: it is drawn in a
          // tonal grey, its thickness shown by two fine lines and its ends, so the enclosed building keeps the firm line
          // and built against enclosed reads in value rather than weight.
          const cont = top ? b.bot : b.top, crs = top ? b.top : b.bot;
          // (a pen finer than a device pixel is drawn one pixel wide and lighter by as much, so it stays crisp)
          const cw = kpo * (open ? 0.75 : dark ? 0.75 : 0.8);
          g.beginPath(); g.strokeStyle = wk > 0.01 ? `rgba(${wr},${wg},${wb},${(0.5 + 0.4 * wk).toFixed(3)})` : ink(kto * (open ? (dark ? 0.52 - 0.16 * night : 0.55) : dark ? 0.74 - 0.26 * night : 0.78) * Math.min(1, cw / hair)); g.lineWidth = Math.max(cw, hair);
          for (const j of b.lines) seg(cont[j], cont[(j + 1) % n]);
          if (open) for (const j of b.lines) { const jp = (j + n - 1) % n, j2 = (j + 1) % n; if (!b.vis[jp]) seg(b.bot[j], b.top[j]); if (!b.vis[j2]) seg(b.bot[j2], b.top[j2]); }
          g.stroke();
          g.beginPath(); g.strokeStyle = ink((dark ? 0.44 - 0.16 * night : 0.42) * (0.5 + 0.5 * fine) * kpo); g.lineWidth = hair;
          for (const j of b.lines) seg(crs[j], crs[(j + 1) % n]);
          g.stroke();
          // After dark, while the frame climbs, the crane's work lamp throws a firm pool of light on the working deck, seen
          // where its top shows (drawn with the slab, so whatever stands in front of it covers it, and cut to its edge);
          // it comes and goes with the deck's lamp (wk).
          if (top && wk > 0.01 && g.getTransform) {
            const key = this.warm.join();
            if (this._poolK !== key) {
              const u = g.createRadialGradient(0, 0, 0, 0, 0, 1);
              u.addColorStop(0, `rgba(${key},1)`); u.addColorStop(0.55, `rgba(${key},0.8)`); u.addColorStop(0.85, `rgba(${key},0.25)`); u.addColorStop(1, `rgba(${key},0)`);
              this._pool = u; this._poolK = key;
            }
            const c = this.P(0, y1, 0), T = g.getTransform(), rx = 1.6 * this.u, ry = 0.7 * this.u;
            g.save(); poly(cap(pl, y1)); g.clip();
            g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.18 * wk; g.fillStyle = this._pool;
            g.setTransform(T.a * rx, T.b * rx, T.c * ry, T.d * ry, T.a * c[0] + T.c * c[1] + T.e, T.b * c[0] + T.d * c[1] + T.f);
            g.fillRect(-1, -1, 2, 2);
            g.restore();
          }
          // a pool on the podium terrace, in ink: the podium is never sold, and bronze only ever means sold
          if (k === PODIUM && top) {
            poly([[4.7, -3.1], [6.0, -3.1], [6.0, 3.1], [4.7, 3.1]].map(([x, z]) => this.P(x, y1 + 0.001, z)));
            g.fillStyle = ink(dark ? 0.1 : 0.07); g.fill(); g.strokeStyle = ink(dark ? 0.5 : 0.45); g.lineWidth = 0.7; g.stroke();
            // and by day the tower's shadow on it: the tower above the roof, its crown included, thrown along the light onto
            // the roof and cut to the roof's edge, toned and hatched as the shadow on the ground is (the tower, drawn after,
            // stands over its own foot)
            if (kd > 0.02 && L > PODIUM + 0.5 && !inLens && !this.xray) {
              // (kept while the light and the building stay put; while the frame climbs it is thrown from the last whole level,
              // and the crown's screen in eighths, so it is found again once a level rather than every frame)
              const Y0 = y1, tk = L >= FLOORS - 0.001 ? FLOORS : Math.floor(L + 0.001), gw = tk >= FLOORS ? Math.round(this.G * 8) / 8 : 0;
              const rk = sun.join() + ',' + tk + ',' + gw + ',' + Y0;
              let sh = this._rsK === rk && this._rsP === PLANS ? this._rs : null;
              if (!sh) {
              const sy = Math.max(sun[1] / sunN, 0.05), dx = -sun[0] / sunN / sy, dz = -sun[2] / sunN / sy, pts = [];
              const add = (pl, y) => { const o = y - Y0; for (const i of planHull(pl)) { const p = pl[i]; pts.push([p.x + dx * o, p.z + dz * o]); } };
              add(PLANS[PODIUM].glass, Y0);
              for (const lk of [...Array.from({ length: Math.ceil((CROWN - 6) / 3) }, (_, i) => 6 + 3 * i), CROWN - 1, CROWN, FLOORS]) if (lk <= tk + 0.001) add(edgePlan(lk), lk + SLAB);
              if (tk < FLOORS) add(PLANS[tk].slab, tk);
              if (gw) add(SCREEN, FLOORS + SLAB + SCREEN_H * (1 - Math.pow(1 - gw, 3)));
              // (both outlines convex and counterclockwise in plan: the shadow's hull is cut by each edge of the roof's in turn)
              sh = hull(pts);
              for (let i = 0, m = pl.length; i < m && sh.length > 2; i++) {
                const a = pl[i], b = pl[(i + 1) % m], ex = b.x - a.x, ez = b.z - a.z, inp = sh, side = (q) => ex * (q[1] - a.z) - ez * (q[0] - a.x);
                sh = [];
                for (let j = 0; j < inp.length; j++) {
                  const P0 = inp[j], P1 = inp[(j + 1) % inp.length], s0 = side(P0), s1 = side(P1);
                  if (s0 >= 0) sh.push(P0);
                  if ((s0 >= 0) !== (s1 >= 0)) { const t = s0 / (s0 - s1); sh.push([P0[0] + (P1[0] - P0[0]) * t, P0[1] + (P1[1] - P0[1]) * t]); }
                }
              }
              this._rs = sh; this._rsK = rk; this._rsP = PLANS;
              }
              if (sh.length > 2) {
                const sp = sh.map(([x, z]) => this.P(x, Y0 + 0.002, z));
                poly(sp); shadowScr.push(sp);
                g.fillStyle = dark ? `rgba(0,0,0,${(0.22 * kd).toFixed(3)})` : ink(0.05); g.fill();
                hatchOn(sh, Y0 + 0.002, (q) => ink((dark ? 0.24 * kd : 0.2) * q));
              }
            }
          }
        } else if (l.kind === 'floor') {
          // level 1 is the upper half of the double-height lobby: its glass runs down to the lobby's, with no slab between
          const k = l.k, pl = PLANS[k].glass, y0 = k === 1 ? 1 : l.lo, built = clamp(L - k, 0, 1), y1 = k + SLAB + (1 - SLAB) * built;
          const glassF = clamp(C - k, 0, 1), hgt = k / FLOORS, side = SIDE[k], sold = [this.soldOf(k, 0) > 0.5, this.soldOf(k, 1) > 0.5];
          // the open frame: columns behind the core, the core, then columns in front
          const coreH = k < coreTop ? Math.min(k + 1, coreTop) : 0;
          if (glassF < 1) {
            const cols = [], cz = this.P(0, (y0 + y1) / 2, 0)[2];
            if (built > 0) {
              if (k >= PODIUM) for (const p of COLS) { const a = this.P(p.x, y0, p.z), b = this.P(p.x, y1, p.z); cols.push([a, b, a[2] > cz]); }
              else for (let j = 0; j < pl.length; j++) if (VMAP[j] >= 0 && VMAP[j] % 2 === 0) { const p = pl[j], a = this.P(p.x * 0.97, y0, p.z * 0.97), b = this.P(p.x * 0.97, y1, p.z * 0.97); cols.push([a, b, a[2] > cz]); }
            }
            const drawCols = (back) => { g.beginPath(); g.strokeStyle = this.xray ? bronze(0.9) : ink(0.5 - 0.04 * (1 - fine)); g.lineWidth = 0.8; cols.forEach(([a, b, bk]) => { if (bk === back) seg(a, b); }); g.stroke(); };
            drawCols(true);
            // (above the frame there is no slab yet: the core's walls run on through the storey)
            const cy0 = k > L + 0.001 ? k : y0;
            if (coreH > cy0) {
              const cb = band(CORE, cy0, coreH, (nx, nz) => { const d = dif(nx, nz); return mix(dark ? (0.08 + 0.12 * d) * (1 - 0.4 * night) : 0.22 - 0.1 * d); }, false), nc = CORE.length, atTop = coreH >= coreTop - 1e-6;
              // a concrete shaft: on ivory its faces carry a light hatch, drawn on the walls themselves (45 degrees in the
              // plane of each wall, so it turns with the shaft)
              if (!dark && fine > 0 && !this.xray) {
                const hh = coreH - cy0, dC = 0.24;
                g.beginPath(); g.strokeStyle = ink(0.2 * fine); g.lineWidth = hair;
                for (let j = 0; j < nc; j++) {
                  if (!cb.vis[j]) continue;
                  const j2 = (j + 1) % nc, sa = CORE_S[j], sb = CORE_S[j + 1], at = (sv, yv) => { const u = (sv - sa) / (sb - sa), v = (yv - cy0) / hh, ya = cb.bot[j][1] + (cb.bot[j2][1] - cb.bot[j][1]) * u, yb = cb.top[j][1] + (cb.top[j2][1] - cb.top[j][1]) * u; return [cb.bot[j][0] + (cb.bot[j2][0] - cb.bot[j][0]) * u, ya + (yb - ya) * v]; };
                  for (let c = Math.ceil((sa + cy0) / dC) * dC; c < sb + coreH; c += dC) { const s0 = Math.max(sa, c - coreH), s1 = Math.min(sb, c - cy0); if (s1 - s0 > 1e-4) seg(at(s0, c - s0), at(s1, c - s1)); }
                }
                g.stroke();
              }
              // its arrises, hairlines: the silhouette at either side, and each corner turned between two walls that show
              // (at the middle of its small radius); and its top, firmer, once there is no more of it above
              g.beginPath(); g.strokeStyle = ink(dark ? 0.45 : 0.5); g.lineWidth = hair;
              for (let j = 0; j < nc; j++) {
                const jp = (j + nc - 1) % nc;
                if (cb.vis[j] !== cb.vis[jp]) seg(cb.bot[j], cb.top[j]);
                else if (j % 2 === 0 && cb.vis[j] && cb.vis[jp] && cb.vis[j + 1]) { const b0 = cb.bot[j], b1 = cb.bot[j + 1], t0 = cb.top[j], t1 = cb.top[j + 1]; seg([(b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2], [(t0[0] + t1[0]) / 2, (t0[1] + t1[1]) / 2]); }
              }
              if (atTop && ey <= coreH) for (let j = 0; j < nc; j++) if (cb.vis[j]) seg(cb.top[j], cb.top[(j + 1) % nc]);
              g.stroke();
              if (ey > coreH) {
                poly(cap(CORE, coreH)); g.fillStyle = mix(dark ? 0.3 * (1 - 0.4 * night) : 0.12); g.fill();
                if (atTop) { g.strokeStyle = ink(dark ? 0.55 : 0.6); g.lineWidth = 0.7; g.stroke(); }
              }
            }
            // residences already sold on this level, waiting for their glass (or for the frame, round the core); the columns
            // in front are drawn over them, crisp, so the storey reads as open structure with sold space inside it
            if (built > 0 && !this.xray) ghost(k, k + SLAB, k + 1, glassF > 0 ? Math.round(glassF * pl.length) : 0);
            else if (!this.xray && !inLens && this.S > 0.001 && k >= RES0 && k < RES1 && k > L + 0.001) offplan([k], false);
            drawCols(false);
          }
          if (glassF > 0 && built > 0) {
            // glass curtain wall, installed panel by panel around the floor
            const n = pl.length, lim = Math.round(glassF * n);
            // After dark the rooms are lit by the people who live in them, once the building is finished and in use (and
            // then in a cascade, room by room: see casT). A share of the sold homes have a room lit, the lamp gold through
            // their bronze glass, while some are dark, their owners away; the unsold homes stay dark but for the model
            // residence, lit for viewings; the lobby is the lantern, lit through both its storeys; the amenity level is lit
            // in part. Until then only the sales gallery in the lobby is lit, and dimly. A lamp lights a whole room (ROOM): above
            // the lobby a room is drawn as the panes it holds, from mullion to mullion and from floor to ceiling (see rooms
            // below), so it reads as a lit window; on a small drawing (a phone's hero), where a pane is a few pixels wide, the
            // room is simply its glass in the lamp's light, in the same colours.
            const lampOn = dark && night > 0.05 && !this.xray, kf = 0.8 + 0.2 * fine, nl = (0.55 + 0.45 * night) * kf;
            const homes = this.o.rooms !== false, modelK = homes && k === RES0 && !sold[1] ? RES0 : -1;
            // a facet's lamp: its brightness (0 if dark), and lampKind 1 for lamp light or 2 for a lamp seen through bronze
            let lampKind = 0;
            const lampAt = (j) => {
              let v = 0, kind = 1;
              const r = RM[j], sd = side[j];
              if (k < 2) { const c = cas(0); v = Math.max(0.8 * (0.7 + 0.3 * night) * c, GALLERY.has(j) ? 0.5 * (0.55 + 0.45 * night) * (1 - c) : 0) * kf; }
              else if (k < PODIUM) { if (hash(k, r, 21) < 0.5) v = 0.75 * (0.6 + 0.4 * hash(r, k, 3)) * nl * FALL[j] * cas(0.15 + 0.35 * hash(k, r, 4)); }
              else if (sold[sd]) { if (homes && hash(k, sd, 12) >= 0.12 && hash(k, r, 9) < 0.28 * night) { v = (0.6 + 0.4 * hash(r, k, 3)) * nl * FALL[j] * cas(1.6 * hash(k, r, 3) + (k >= CROWN ? 0.4 : 0)); kind = 2; } }
              else if (k === modelK && sd === 1 && r === MODEL_ROOM) v = nl * FALL[j] * cas(1.6 * hash(k, r, 3));
              lampKind = v > 0 ? kind : 0;
              return v;
            };
            // the lobby's glass is lit in a gradient, brightest under the slab of level 2 and at 70% at its floor
            const lobG = new Map(), lobby = (I) => {
              const q = Math.round(I * 48), hit = lobG.get(q);
              if (hit) return hit;
              const f0 = this.P(0, y0, 0)[1], f1 = this.P(0, y1, 0)[1], u = g.createLinearGradient(0, f0, 0, f1), Iq = q / 48;
              u.addColorStop(0, mixL(0.06 + 0.64 * Iq * (k ? 0.85 : 0.7))); u.addColorStop(1, mixL(0.06 + 0.64 * Iq * (k ? 1 : 0.85)));
              lobG.set(q, u);
              return u;
            };
            const lit = [], litI = [], litS = [];
            // The rooms lit on this floor above the lobby: each room's lamp (0 if dark) and whether it is a sold home's (gold
            // through the bronze), found once for the floor, not panel by panel.
            const roomI = k >= 2 && lampOn && fine > 0 ? new Float32Array(12) : null, roomS = roomI ? new Uint8Array(12) : null;
            if (roomI) for (let j = 0; j < n; j++) { const r = RM[j]; if (roomI[r] || (j && RM[j - 1] === r)) continue; const v = lampAt(j) / (FALL[j] || 1); if (v > 0) { roomI[r] = Math.min(1, v); roomS[r] = lampKind === 2 ? 1 : 0; } }
            const shade = (nx, nz, j, nn, mx, mz) => {
              if (j >= lim) return null;
              const v = view(mx, (y0 + y1) / 2, mz);
              const diff = dif(nx, nz);
              const fres = 1 - Math.abs(nx * v[0] + nz * v[2]);
              // (the half vector in three dimensions: a high sun glints only on glass seen from high up, never on a whole face)
              const hx = sun[0] / sunN + v[0], hy = sun[1] / sunN + v[1], hz = sun[2] / sunN + v[2], hn = Math.sqrt(hx * hx + hy * hy + hz * hz) || 1;
              // a tight highlight, and none at all once the sun is down
              const spec = Math.pow(Math.max(0, (nx * hx + nz * hz) / hn), 36) * kd;
              // (above the lobby a lit room keeps its unlit glass here, and the room is laid over it once the floor is drawn)
              let I = 0;
              if (roomI) { if (roomI[RM[j]] > 0) { lit.push(j); litI.push(roomI[RM[j]]); litS.push(roomS[RM[j]] === 1); } }
              else if (lampOn) { I = lampAt(j); if (I > 0) { lit.push(j); litI.push(I); litS.push(lampKind === 2); } }
              // (the sold key holds its value on ink by day and night alike, as near the gauge's bronze as the light allows;
              // after dark each home a shade lighter or darker than the next, and a lit room in it gold)
              if (sold[side[j]]) {
                if (!dark) return mixS(0.68 + 0.3 * diff, 0.18 * spec + 0.06 * fres * kd);
                const tS = 0.62 + 0.3 * diff + (night > 0 ? (0.05 * fres + 0.04 * (2 * hash(k, side[j], 13) - 1)) * night : 0);
                if (I > 0) return k >= 2 ? mixR(0.66 + 0.28 * I, (0.3 + 0.18 * hash(k, RM[j], 17)) * I, hash(RM[j], k, 23)) : mixH(Math.max(tS, 0.68) + 0.175 * I, 0.175 * I);
                // (after dark in steps of a 48th: finer steps than the eye sees there each cost the drawing a fill of their own)
                const tG = tS + 0.08 * gold * diff;
                return mixS(night > 0.5 ? Math.round(tG * 48) / 48 : tG, 0.1 * diff + 0.08 * spec + 0.05 * fres * kd);
              }
              if (I > 0) return k < 2 ? lobby(I) : mixL(0.1 + (0.62 + 0.12 * hash(k, RM[j], 17)) * I);
              // (on ink the drawing is led by its lines: the podium's glass stays dark, at most a tenth of the way to the line colour)
              if (dark) return mixW(k < PODIUM ? 0.03 + 0.03 * diff + 0.025 * fres + 0.015 * spec : 0.04 + 0.07 * diff + 0.12 * spec + (0.09 * fres + 0.07 * hgt) * (1 - 0.45 * night), gold * Math.min(1, 3 * diff + spec));
              // on the ivory sheet the glass is a light wash, as a drawing tones it; the shade is hatched over it (above the
              // podium an unsold home's glass stays pale on its shade side too, its modelling at half strength, so the bronze
              // reads at once)
              const tw = 0.3 - 0.1 * diff - 0.05 * fres - 0.05 * hgt - 0.14 * spec;
              return mix(k < PODIUM ? tw : 0.06 + 0.45 * Math.max(0, tw - 0.06));
            };
            const bot = this.ring(pl, y0), top = this.ring(pl, y1);
            const mull = [], mullLit = [], shadowed = [], hatch = [], arc = MULL[k].s, lerp2 = (j, j2, u, v) => { const x0 = bot[j][0] + (bot[j2][0] - bot[j][0]) * u, ya = bot[j][1] + (bot[j2][1] - bot[j][1]) * u, yb = top[j][1] + (top[j2][1] - top[j][1]) * u; return [x0, ya + (yb - ya) * v]; };
            // the hatch runs at 45 degrees on the façade itself, so it turns with the building rather than sliding over it
            const dH = 0.3, hatchOn = !dark && fine > 0 && !this.xray;
            // The lit rooms above the lobby as runs of whole panes: a pane (between two mullions) belongs to the room its middle
            // falls in, so a room starts and ends on a mullion and two rooms never share a pane. ivs: [from, to, room] along the
            // glass line (from may be under 0, where a room takes the pane that straddles the line's start).
            const ivs = [], Sn = arc[n], M = Sn / MULLN[k];
            if (roomI) for (let r = 0; r < 12; r++) {
              if (!(roomI[r] > 0)) continue;
              let j0 = -1, j1 = -1;
              for (let j = 0; j < n; j++) if (RM[j] === r) { if (j0 < 0) j0 = j; j1 = j; }
              if (j0 < 0) continue;
              const p0 = Math.ceil(arc[j0] / M - 1e-6), p1 = Math.ceil(arc[j1 + 1] / M - 1e-6) - 1;
              if (p1 >= p0) ivs.push([(p0 - 0.5) * M, (p1 + 0.5) * M, r]);
            }
            const litAt = (sv) => { for (const v of ivs) if ((sv >= v[0] - 1e-4 && sv <= v[1] + 1e-4) || (sv - Sn >= v[0] - 1e-4 && sv - Sn <= v[1] + 1e-4)) return true; return false; };
            // (a facet a lit room covers whole is left to the room: its glass would only be painted over)
            const vis = ivs.length ? new Uint8Array(n) : null, whole = (a, b) => { for (const v of ivs) for (const o of [0, -Sn, Sn]) if (a + o >= v[0] - 1e-6 && b + o <= v[1] + 1e-6) return true; return false; };
            for (let j = 0; j < n; j++) {
              const j2 = (j + 1) % n, q = [bot[j], bot[j2], top[j2], top[j]];
              const area = (q[1][0] - q[0][0]) * (q[2][1] - q[0][1]) - (q[2][0] - q[0][0]) * (q[1][1] - q[0][1]);
              if (area >= 0) continue;
              const a = pl[j], b = pl[j2], nx = (a.nx + b.nx) / 2, nz = (a.nz + b.nz) / 2, col = shade(nx, nz, j, n, (a.x + b.x) / 2, (a.z + b.z) / 2);
              if (!col) continue;
              if (!vis) queue(q, col);
              else { vis[j] = 1; if (!whole(arc[j], arc[j + 1])) queue(q, col); }
              const on = lit.length && lit[lit.length - 1] === j;
              if (built >= 1 && k !== 0 && !on) shadowed.push(sold[side[j]] ? -1 - j : j);
              if (fine > 0) for (const u of MULL[k].per[j]) ((ivs.length ? litAt(arc[j] + u * (arc[j + 1] - arc[j])) : on) ? mullLit : mull).push([lerp2(j, j2, u, 0), lerp2(j, j2, u, 1)]);
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
            // A lit room above the lobby: its panes, mullion to mullion and floor to ceiling, in the lamp's light (gold through
            // a sold home's bronze, lamp ivory in the model residence and the amenity rooms), each room a little warmer or
            // cooler than the next as lamps are, and lit from within by a glow near its ceiling, kept inside its own panes so
            // it never spills over a slab. Seen from below, the soffit over it catches its light.
            if (ivs.length) (() => {
              const pieces = [], sof = ey < k + 1 ? this.ring(slabPlan(k + 1), k + 1) : null, at = (sv, h) => { let v = sv % Sn; if (v < 0) v += Sn; let j = h > 0 && arc[h] <= v ? h : 0; while (j < n - 1 && arc[j + 1] <= v) j++; return [j, (v - arc[j]) / (arc[j + 1] - arc[j])]; };
              for (const [s0, s1, r] of ivs) {
                const I = roomI[r], sd = roomS[r], hr = hash(k, r, 17), qs = [], qm = [];
                // (the room's panes facet by facet, only where the facet faces the eye)
                for (let sv = s0, h = 0; sv < s1 - 1e-6;) {
                  const [j, u0] = at(sv, h), j2 = (j + 1) % n, se = Math.min(s1, sv + (arc[j + 1] - arc[j]) * (1 - u0));
                  h = j;
                  const u1 = u0 + (se - sv) / (arc[j + 1] - arc[j]);
                  if (vis[j]) { qs.push([lerp2(j, j2, u0, 0), lerp2(j, j2, u1, 0), lerp2(j, j2, u1, 1), lerp2(j, j2, u0, 1)]); qm.push(j, u0, u1); }
                  sv = se + 1e-7;
                }
                if (!qs.length) continue;
                const col = sd ? mixR(0.66 + 0.28 * I, (0.3 + 0.18 * hr) * I, hash(r, k, 23)) : mixL(0.1 + (0.62 + 0.12 * hr) * I);
                for (const q of qs) queue(q, col);
                pieces.push([qs, I, sd, hr, qm]);
              }
              flush();
              if (pieces.length && glows && g.getTransform) {
                const T = g.getTransform();
                g.save(); g.beginPath();
                for (const [qs] of pieces) for (const q of qs) { g.moveTo(q[0][0], q[0][1]); g.lineTo(q[1][0], q[1][1]); g.lineTo(q[2][0], q[2][1]); g.lineTo(q[3][0], q[3][1]); g.closePath(); }
                g.clip(); g.globalCompositeOperation = 'lighter';
                let tint = -1;
                for (const [qs, I, sd, hr] of pieces) {
                  const a = qs[0], b = qs[qs.length - 1], tx = (a[3][0] + b[2][0]) / 2, ty = (a[3][1] + b[2][1]) / 2, hh = Math.max(3, (a[0][1] + b[1][1]) / 2 - ty), wd = Math.hypot(b[2][0] - a[3][0], b[2][1] - a[3][1]);
                  const gi = sd ? 1 : 0, rx = Math.max(3, 0.55 * wd), ry = 0.7 * hh, cy = ty + 0.3 * hh;
                  if (gi !== tint) { g.fillStyle = this.glowSprite(gi); tint = gi; }
                  g.globalAlpha = clamp((sd ? 0.3 : 0.34) * I * (0.85 + 0.3 * hr), 0, 1);
                  g.setTransform(T.a * rx, T.b * rx, T.c * ry, T.d * ry, T.a * tx + T.c * cy + T.e, T.b * tx + T.d * cy + T.f);
                  g.fillRect(-1, -1, 2, 2);
                }
                g.restore();
              }
              if (sof && pieces.length) for (const gi of [0, 1]) {
                let any = false;
                g.beginPath();
                for (const [qs, , sd, , qm] of pieces) if (sd === gi) for (let i = 0; i < qs.length; i++) {
                  const q = qs[i], j = qm[3 * i], u0 = qm[3 * i + 1], u1 = qm[3 * i + 2], j2 = (j + 1) % n, sx = sof[j][0], sy = sof[j][1], dx = sof[j2][0] - sx, dy = sof[j2][1] - sy;
                  g.moveTo(q[3][0], q[3][1]); g.lineTo(q[2][0], q[2][1]); g.lineTo(sx + dx * u1, sy + dy * u1); g.lineTo(sx + dx * u0, sy + dy * u0); g.closePath(); any = true;
                }
                if (any) { const c = gi ? GOLD : this.warm; g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(0.16 * nl).toFixed(3)})`; g.fill(); }
              }
            })();
            // The lobby's light (and the sales gallery's, while the building goes up): its upper storey blooms; seen from
            // below, the soffit over it catches the light.
            else if (lit.length) (() => {
              const sof = glows && ey < k + 1 && k > 0 ? this.ring(slabPlan(k + 1), k + 1) : null, strips = [[], []];
              for (let i = 0; i < lit.length;) {
                const j = lit[i], r = RM[j], gold = litS[i];
                let e = i, sum = litI[i];
                while (e + 1 < lit.length && lit[e + 1] === lit[e] + 1 && RM[lit[e + 1]] === r) sum += litI[++e];
                const je = (lit[e] + 1) % n, I = Math.min(1, sum / (e - i + 1) / 0.65);
                if (sof) for (let f = i; f <= e; f++) strips[gold ? 1 : 0].push(lit[f]);
                i = e + 1;
                if (!glows || k === 0) continue;
                const ty = (top[j][1] + top[je][1]) / 2, hh = Math.max(3, (bot[j][1] + bot[je][1]) / 2 - ty);
                glows.push([(top[j][0] + top[je][0]) / 2, ty + 0.32 * hh, 0.62 * Math.max(4, Math.hypot(top[je][0] - top[j][0], top[je][1] - top[j][1])), 0.69 * hh, (k < 2 ? 0.2 : gold ? 0.24 : 0.32) * I, gold ? 1 : 0]);
              }
              if (sof) strips.forEach((js, gi) => {
                if (!js.length) return;
                const c = gi ? GOLD : this.warm;
                g.beginPath();
                for (const j of js) { const j2 = (j + 1) % n; g.moveTo(top[j][0], top[j][1]); g.lineTo(top[j2][0], top[j2][1]); g.lineTo(sof[j2][0], sof[j2][1]); g.lineTo(sof[j][0], sof[j][1]); g.closePath(); }
                g.fillStyle = `rgba(${c[0]},${c[1]},${c[2]},${(0.15 * nl).toFixed(3)})`; g.fill();
              });
            })();
            if (hatch.length) { g.beginPath(); g.strokeStyle = ink(0.18 * fine); g.lineWidth = hair; hatch.forEach(([a, b]) => seg(a, b)); g.stroke(); }
            // mullions, the finest lines on the drawing (dark against a lit room)
            // (after dark the unlit mullions all but go, so no pale grid crosses the bronze)
            if (mull.length) { g.beginPath(); g.strokeStyle = ink(0.2 * fine * (1 - 0.55 * night)); g.lineWidth = hair; mull.forEach(([a, b]) => seg(a, b)); g.stroke(); }
            if (mullLit.length) { g.beginPath(); g.strokeStyle = `rgba(${br},${bgg},${bb},${(0.5 * fine).toFixed(3)})`; g.lineWidth = hair; mullLit.forEach(([a, b]) => seg(a, b)); g.stroke(); }
            // the shadow each slab casts on the glass just below it (see tanEl), as a share of the storey at each point of the
            // glass line; on ivory the deep bands a shade darker than the thin ones
            // (on ink they go with the sun: none are drawn once it is down)
            if (shadowed.length && (!dark || kd > 0.002)) (() => {
              const sp = slabPlan(k + 1), hg = y1 - y0, one = fine < 0.5;
              let fe = FRS[k];
              if (!fe || fe.pl !== pl || fe.sp !== sp || fe.hg !== hg || fe.key !== frKey) {
                const fr = new Float32Array(n), ov = new Float32Array(n);
                let om = 0;
                for (let j = 0; j < n; j++) { const p = pl[j], q = sp[j]; ov[j] = q ? Math.max(0, (q.x - p.x) * p.nx + (q.z - p.z) * p.nz) : 0; om += ov[j] / n; }
                for (let j = 0; j < n; j++) {
                  const p = pl[j], cd = (p.nx * sun[0] + p.nz * sun[2]) / sunH, o = om + (one ? 0 : 0.3 * (ov[j] - om));
                  const d = cd > 0.02 && kd > 0 ? Math.min(0.75, (o * tanEl) / Math.max(0.5, cd) / hg) * kd * smooth(clamp((cd - 0.02) / 0.3, 0, 1)) : 0;
                  fr[j] = Math.max(sliver, d);
                }
                FRS[k] = fe = { pl, sp, hg, key: frKey, fr };
              }
              const fr = fe.fr;
              // (the lower floors take the shade more quietly: from about six tenths of its strength over the podium to all of it
              // at the top; on ink, the bronze a little lighter in its shade than the dark glass, as glass in shade still holds
              // the sky; on ivory the bronze is shaded in a deeper bronze, never grey, so a sold home reads as bronze in the shade
              // too. Unsold glass takes at most a third of the storey on ivory, under half on ink.)
              const th = 0.6 + 0.4 * clamp((k - PODIUM) / (CROWN - 1 - PODIUM), 0, 1), capU = dark ? 0.45 : 0.32, capS = 0.75;
              const dep = (v, j) => Math.min(v < 0 ? capS : capU, fr[j]);
              // (on a small drawing (a phone) one tone for every band of the storey and no skirt: shades the eye cannot tell
              // apart at that size are not worth a fill of their own)
              const sets = one ? [shadowed] : [[], []];
              if (!one) for (const v of shadowed) sets[v < 0 ? 1 : 0].push(v);
              for (let skirt = 0; skirt < (one ? 1 : 2); skirt++) for (let i = 0; i < sets.length; i++) {
                const js = sets[i]; if (!js.length) continue;
                g.beginPath();
                for (const v of js) {
                  const j = v < 0 ? -1 - v : v, j2 = (j + 1) % n, a = top[j], b = top[j2], da = dep(v, j), db = dep(v, j2);
                  if (!skirt) { g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineTo(b[0], b[1] + db * (bot[j2][1] - b[1])); g.lineTo(a[0], a[1] + da * (bot[j][1] - a[1])); }
                  else {
                    // (the skirt: from the band's edge on by a quarter of its depth more, at least a twentieth of the storey)
                    const ea = Math.min(0.9, da * 1.25 + 0.05), eb = Math.min(0.9, db * 1.25 + 0.05);
                    g.moveTo(a[0], a[1] + da * (bot[j][1] - a[1])); g.lineTo(b[0], b[1] + db * (bot[j2][1] - b[1])); g.lineTo(b[0], b[1] + eb * (bot[j2][1] - b[1])); g.lineTo(a[0], a[1] + ea * (bot[j][1] - a[1]));
                  }
                  g.closePath();
                }
                g.fillStyle = one ? (dark ? `rgba(0,0,0,${(0.2 * kd * th).toFixed(3)})` : 'rgba(0,0,0,0.075)') : sofTone(i === 1, th, skirt); g.fill();
              }
            })();
          }
        } else if (l.kind === 'rail') {
          // a glass balustrade along the terrace edge
          const k = l.k, y0 = k + SLAB, y1 = y0 + RAIL_H, pl = RAILS[k];
          const b = band(pl, y0, y1, () => (dark ? `rgba(244,240,232,${(0.08 * fine).toFixed(3)})` : `rgba(20,22,26,${(0.06 * fine).toFixed(3)})`), true);
          g.beginPath(); g.strokeStyle = ink(0.36 * fine); g.lineWidth = hair;
          for (const j of b.lines) seg(b.top[j], b.top[(j + 1) % pl.length]);
          g.stroke();
        } else if (l.kind === 'canopy') {
          // porte-cochère: two slender columns and a thin floating roof, high enough to drive under. Until the lobby's
          // glass is in (C from 1 to 2) it is drawn in the open frame's tone, so it never outweighs the building behind it.
          const ko = Math.max(0, Math.min(1, C - 1));
          g.beginPath(); g.strokeStyle = ink(0.5 + 0.2 * ko); g.lineWidth = 0.8 + 0.4 * ko;
          for (const x of [-2.2, 2.2]) seg(this.P(x, 0, -5.85), this.P(x, PORTE, -5.85));
          g.stroke();
          const t1 = PORTE + 0.1;
          const b = band(CANOPY, PORTE, t1, (nx, nz) => mix(dark ? (0.08 + 0.3 * dif(nx, nz)) * (1 - 0.5 * night) : 0.12), true);
          poly(cap(CANOPY, ey > t1 ? t1 : PORTE)); g.fillStyle = mix(dark ? (ey > t1 ? 0.25 : 0.1) * (1 - 0.5 * night) : (ey > t1 ? 0.03 : 0.2)); g.fill();
          // its edge drawn like a slab's: the arris against what lies behind it firm
          const ce = ey > t1 ? b.bot : b.top;
          g.beginPath(); g.strokeStyle = ink(dark ? 0.52 - 0.16 * night + (0.3 - 0.1 * night) * ko : 0.55 + 0.23 * ko); g.lineWidth = 0.75 + 0.05 * ko; for (const j of b.lines) { const j2 = (j + 1) % CANOPY.length; seg(ce[j], ce[j2]); } g.stroke();
        } else if (l.kind === 'crown') {
          // The crown: a louvred screen round the roof plant, solid to the eye like everything else on the drawing
          // (its far side hidden by its near one), with a coping along its top and the aviation light on its mast.
          const y0 = l.lo, y1 = l.hi, top = this.crownTop(y1 - y0), above = ey > y0 + 0.4 * (y1 - y0);
          // (seen from above, the plant's roof inside the screen, well below its crest)
          if (above) { poly(cap(SCREEN, y0 + 0.35 * (y1 - y0))); g.fillStyle = mix(dark ? 0.22 * (1 - 0.4 * night) : 0.2); g.fill(); }
          // the plant space shows dark between the blades; the blades catch the light
          const b = band(SCREEN, y0, top, (nx, nz) => { const d = dif(nx, nz); return mix(dark ? (0.17 + 0.13 * d) * (1 - 0.4 * night) : 0.07 + 0.07 * (1 - d)); }, true);
          const ns = SCREEN.length, lerp = (p, q, u) => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u];
          // after dark the plant screen is lit from within, brightest at its foot, and the blades stand dark against it
          // (it comes on near the end of the lights-on cascade, and glows brighter than the screen stands by day)
          const up = dark && !this.xray && night > 0.05 ? night * cas(1.7) : 0;
          if (up) {
            const f0 = this.P(0, y0, 0), f1 = this.P(0, y1, 0), gr = g.createLinearGradient(0, f0[1], 0, f1[1]);
            gr.addColorStop(0, `rgba(${wr},${wg},${wb},${(0.9 * up).toFixed(3)})`); gr.addColorStop(0.45, `rgba(${wr},${wg},${wb},${(0.5 * up).toFixed(3)})`); gr.addColorStop(1, `rgba(${wr},${wg},${wb},${(0.2 * up).toFixed(3)})`);
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
          // its foot on the roof, and the coping along its top, as firm as a slab edge and drawn with the same pen set, so on
          // a small drawing the crown is no heavier than the floors under it (a pen under a device pixel is drawn one pixel
          // wide and lighter by as much)
          const pw = (v) => (kpen < 1 ? Math.max(hair, v * kpen) : v), pa = (v) => (kpen < 1 ? kt * Math.min(1, (v * kpen) / hair) : 1);
          g.beginPath(); g.strokeStyle = ink((dark ? 0.5 : 0.45) * pa(0.6)); g.lineWidth = pw(0.6);
          for (const j of b.lines) seg(b.bot[j], b.bot[(j + 1) % ns]);
          g.stroke();
          g.beginPath(); g.strokeStyle = ink((dark ? 0.92 - 0.3 * night : 0.8) * pa(0.9)); g.lineWidth = pw(0.9);
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
            if (show > 0) { g.beginPath(); g.strokeStyle = ink(0.6); g.lineWidth = 0.8; seg(m0, m1); g.stroke(); this.beacon(m1, now, dark, show * (this.G - 0.85) / 0.15 * (1 - (glows ? night : 0) * (1 - clamp((casT - 1.95) / 0.3, 0, 1))), night); }
          }
        }
      }

      // The silhouette: one line round the building, the heaviest line in the drawing. Each storey's balcony (slab and
      // balustrade) and its glass are all but convex in plan, so each is outlined on screen by a convex hull, and the line
      // runs round the union of them all, in and out at every balcony and up over the crown.
      // Verticals stay plumb through the lens, so a band's hull is the top chain of its upper ring (merged with the
      // balustrade's, which stands inside the slab edge) and the bottom chain of its lower ring.
      // Once the glass is going in, the line runs on unbroken over the open frame above it, each storey wrapped at the line
      // its glass will take, and over the crown: one silhouette from the ground to the crown. How far the façade lags the
      // frame shows inside the line, in glass and mullions against open slabs and columns, never as a break in it.
      // On a small drawing (fine under 1) the balconies' share of the line, the slab tips beyond the glass, takes a lighter
      // pen: the glass carries the line up the shaft and every balcony still shows, with no heavy saw-tooth at each storey.
      // The pen comes up to full weight as the drawing grows, and nothing in the line moves as it does.
      const silCol = (a) => (dark ? ink((0.7 - 0.3 * night) * a) : ink(0.8 * a)), silW = dark ? 1.2 + 0.2 * fine : 1.3 + 0.26 * fine;
      const topK = L > 0.01 ? Math.min(Math.floor(L + 0.001), FLOORS) : -1;
      if (C > 0.01 && topK >= 0 && !this.xray && !solid) (() => {
        const hs = [], hide = [], tips = [];
        // (hid: 1 when the band's top chain always lies inside the band above, 2 when its bottom chain lies inside the one
        // below; tip: 1 for a balcony slab or the crown, whose share of the line is drawn with the lighter pen on a small
        // drawing)
        const H = (pl, y0, y1, rl, ry, hid = 0, tip = 0) => {
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
          hide.push(hid ? up.length * 4 + hid : 0); tips.push(tip);
          for (let i = lo.length - 1; i >= 0; i--) up.push(lo[i]);
          hs.push(up);
        };
        const railAt = (k) => railsOn && k >= PODIUM && railK(k);
        for (let k = 0; k <= topK; k++) {
          // (level 1's line is the lobby glass, which the mezzanine stands behind: until the glass below it is in, there is
          // no edge there to wrap, only the set-back mezzanine inside the open frame)
          if (k === 1 && clad < 1) continue;
          const sp = edgePlan(k), tip = k > PODIUM ? 1 : 0;
          // (the balustrade's share of the outline shrinks away as it fades out on a small drawing, so nothing jumps)
          if (railAt(k)) H(sp, k, k + SLAB, RAILS[k], k + SLAB + RAIL_H * fine, 0, tip); else H(sp, k, k + SLAB, null, 0, 0, tip);
          // a storey's glass, or the line it will take, stands inside the slabs above and below it (the lobby's two storeys
          // meet at level 1)
          if (k < topK) H(PLANS[k].glass, k === 1 ? 1 : k + SLAB, k + 1, null, 0, (k !== 0 ? 1 : 0) | (k !== 1 ? 2 : 0));
        }
        // (the crown takes the balconies' pen, so on a small drawing it is no heavier than the floors under it)
        if (topK >= FLOORS && this.G > 0.01) H(SCREEN, FLOORS + SLAB, this.crownTop(crownH), null, 0, 0, 1);
        // (the line comes in with the first glass, C 0 to 1, rather than appearing round the frame at once)
        const sw = silW * Math.max(0.75, kpen), ca = clamp(C, 0, 1);
        this.outline(hs, silCol(ca), sw, hide, fine < 1 ? { cls: tips, col: silCol(ca * (0.72 + 0.28 * fine)), v: Math.max(hair, sw * (0.5 + 0.5 * fine)) } : null);
      })();
      // The lamps' light, added to what lies under it: one radial falloff, made once, stretched over each glow
      // (an ellipse of radii rx, ry), which keeps a whole night of lit rooms about as cheap as flat ones.
      // (two tints: the lamp light, and the gold of a lamp seen through a sold home's bronze glass)
      if (glows && glows.length && g.getTransform) {
        const T = g.getTransform();
        g.save(); g.globalCompositeOperation = 'lighter';
        let tint = -1;
        for (const [x, y, rx, ry, a, gi = 0] of glows) {
          if (gi !== tint) { g.fillStyle = this.glowSprite(gi); tint = gi; }
          g.globalAlpha = clamp(a, 0, 1);
          g.setTransform(T.a * rx, T.b * rx, T.c * ry, T.d * ry, T.a * x + T.c * y + T.e, T.b * x + T.d * y + T.f);
          g.fillRect(-1, -1, 2, 2);
        }
        g.restore();
      }

      // (under a photograph that has faded in, the tower is not rendered at all)
      if (r3 && sa < 1) {
        const b = r3.render(this);
        if (b) { g.globalAlpha = this.r3a; g.drawImage(r3.canvas, 0, 0, b.sw, b.sh, b.x, b.y, b.w, b.h); g.globalAlpha = 1; }
        // the lit rooms' glow, as the drawing lays its own (one falloff stretched over each window, added to what is under it)
        if (b && this.r3a >= 1 && b.glows.length && g.getTransform && !this.forced) {
          const T = g.getTransform();
          g.save(); g.globalCompositeOperation = 'lighter';
          for (const [x, y, rx, ry, a, gi] of b.glows) {
            g.fillStyle = this.glowSprite(gi); g.globalAlpha = clamp(a, 0, 1);
            g.setTransform(T.a * rx, T.b * rx, T.c * ry, T.d * ry, T.a * x + T.c * y + T.e, T.b * x + T.d * y + T.f);
            g.fillRect(-1, -1, 2, 2);
          }
          g.restore();
        }
      }
      if (solid && (r3 || sa > 0)) {
        // the aviation light, as the drawing lights it: on the rendered (or photographed) crown it sits on the floating
        // roof's high edge over the bay, where an obstruction light would be fixed, rather than on a mast (it goes as the
        // photograph comes in: its glow would sit round the photographed crown as a halo)
        const tp = SCREEN.reduce((a, q) => (CREST(q) > CREST(a) ? q : a));
        if (this.G > 0.85 && sa < 1) this.beacon(this.P(tp.x + tp.nx * 0.14, FLOORS + SLAB + CREST(tp) * (crownH / SCREEN_H) + 0.16, tp.z + tp.nz * 0.14), now, dark, (1 - sa) * ((this.G - 0.85) / 0.15) * (1 - (dark && night > 0.05 ? night : 0) * (1 - clamp((casT - 1.95) / 0.3, 0, 1))), night);
      }
      // The photograph, over the tower, the drawing and the render alike, as it fades in (and over the aviation light, whose
      // glow shows round the crown it stands on), with the light of the sky behind it where the renderer is not drawing it
      if (sa > 0) {
        const cs = window.CentamontSky;
        if (cs && cs.glow && !(r3 && sa < 1)) cs.glow(g, this, sa);
        this.still(g, sa);
      }
      if (craneOn && !craneBehind) this.drawCrane(true);
      palmsFront.forEach((p) => this.drawPalm(p));
      // (the photograph has its own people)
      g.globalAlpha = this.occ * (1 - sa); figsFront.forEach((f) => this.drawFigure(f)); g.globalAlpha = 1;
      const tw = this.o.labels ? this.o.labelSize * 3 : 0;
      this.rb = ruler ? { x0: Math.min(xa, xl - (sd > 0 ? tw : 0)) - 6, x1: Math.max(xa, xl + (sd < 0 ? tw : 0)) + 6, y0: ys[FLOORS] - this.o.labelSize, y1: ys[0] } : null;

      // Dimension line with level ticks; it comes in with the sketch
      if (!ruler) return;
      // Levels are numbered as American drawings and the weekly report number them: the ground floor is L01, the top
      // floor L34, and the roof above it is named. Every fifth level is numbered, with a longer tick.
      const ra = L > 0.01 ? 1 : E0, named = (i) => i === 0 || i === FLOORS || (i + 1) % 5 === 0;
      // the levels' names: [name, x, y, strength]
      // (over the photograph, the line itself stops at the lowest numbered level above the horizon, rather than running on
      // down through its palms: yb is where it ends, and no tick is drawn below it)
      // (and where the photograph has a real skyline behind the ruler, a name never sits on its towers: hy is the line the
      // names stay above, the skyline's top under the ruler, from the still's own sky, in its pixels above the horizon)
      const ps_ = this.ph && this.ph.s, hy = this.k.cy - (ps_ && ps_.sky ? ps_.sky * this.k.f / ps_.f : 0);
      let iLo = 0;
      if (this.sa > 0) { iLo = FLOORS; for (let i = 0; i <= FLOORS; i++) if (named(i) && ys[i] <= hy - 6) { iLo = i; break; } }
      const yb = ys[0] + (ys[iLo] - ys[0]) * this.sa, on = (i) => ys[i] <= yb + 0.5;
      const labs = [];
      if (this.o.labels && w > 280) {
        g.font = '500 ' + this.o.labelSize + 'px Jost, sans-serif';
        const fx = (x, t) => sd < 0 ? Math.min(x, w - g.measureText(t).width - 4) : Math.max(x, g.measureText(t).width + 4), z = this.o.labelSize;
        // the roof is always named; on a small drawing, where the last numbered level would crowd it, that level gives way,
        // fading rather than blinking
        const lastN = Math.floor(FLOORS / 5) * 5 - 1, give = smooth(clamp((Math.abs(ys[FLOORS] - ys[lastN]) - z) / (0.5 * z), 0, 1));
        // where the names would stand closer than 24px, only every tenth level keeps its name (L10, L20, L30), the others
        // fading as the drawing shrinks
        const thin = smooth(clamp((24 - Math.abs(ys[9] - ys[4])) / 6, 0, 1));
        // (a drawing whose ground sinks into a veil the page lays over it leaves the ground level's tick unnamed, o.groundLabel false)
        for (let i = this.o.groundLabel === false ? 1 : 0; i < FLOORS; i++) {
          if (!named(i)) continue;
          // (over the photograph, a name below the horizon would sit on its palms: it gives way as the photograph comes in)
          const a = ra * (i === lastN ? give : 1) * ((i + 1) % 10 ? 1 - thin : 1) * (1 - this.sa * smooth(clamp((ys[i] - hy + 6) / 14, 0, 1)));
          if (a <= 0.01) continue;
          const t = WORDS.lv + String(i + 1).padStart(2, '0'); labs.push([t, fx(xl, t), ys[i], a]);
        }
        labs.push([WORDS.roof, fx(xl, WORDS.roof), ys[FLOORS], ra]);
      }
      // A shadow passes behind the ruler: where one runs under it, the ruler's line, its ticks and its names stand on a
      // hairline of clear ground, cut from the shadow alone (a halo, as a map clears the ground round its names), so no tick
      // or name is lost in the hatch and no box is cut out of the shadow.
      if (shadowScr.length && !inLens) (() => {
        const z = this.o.labelSize, tw = this.o.labels ? z * 3 : 0, X0 = Math.min(xa, xt, sd < 0 ? xl : xl - tw) - 6, X1 = Math.max(xa, xt, sd < 0 ? xl + tw : xl) + 6, Y0 = ys[FLOORS] - z, Y1 = ys[0] + z;
        // (only the shadows that reach the ruler are cut, and only the ticks and names they reach are haloed)
        const near = [], bx = [];
        for (const p of shadowScr) { let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const q of p) { if (q[0] < x0) x0 = q[0]; if (q[0] > x1) x1 = q[0]; if (q[1] < y0) y0 = q[1]; if (q[1] > y1) y1 = q[1]; } if (x0 < X1 && x1 > X0 && y0 < Y1 && y1 > Y0) { near.push(p); bx.push([x0, x1, y0, y1]); } }
        if (near.length) {
          const over = (x0, x1, y0, y1) => bx.some((b) => b[0] < x1 && b[1] > x0 && b[2] < y1 && b[3] > y0);
          g.save(); g.beginPath();
          for (const p of near) { g.moveTo(p[0][0], p[0][1]); for (let j = 1; j < p.length; j++) g.lineTo(p[j][0], p[j][1]); g.closePath(); }
          g.clip();
          g.strokeStyle = `rgb(${br},${bgg},${bb})`; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 4.5; g.beginPath(); g.moveTo(xa, yb); g.lineTo(xa, ys[FLOORS]);
          for (let i = 0; i <= FLOORS; i++) if (on(i)) { g.moveTo(xa, ys[i]); g.lineTo(named(i) ? xt : (xa + xt) / 2, ys[i]); }
          g.stroke();
          if (labs.length) {
            g.lineWidth = 5; g.textAlign = sd < 0 ? 'left' : 'right'; g.textBaseline = 'middle';
            for (const [t, x, y] of labs) if (over(sd < 0 ? x - 3 : x - tw - 3, sd < 0 ? x + tw + 3 : x + 3, y - z, y + z)) g.strokeText(t, x, y);
          }
          g.restore();
        }
      })();
      // Over the rendered sky, the far skyline and the horizon's haze are cleared round a name they run behind, the same
      // halo: the sky's own gradient is the canvas's CSS background, so clearing the canvas there shows the sky itself.
      if (labs.length && this.skyCss && !inLens) {
        const cy = this.k.cy, z = this.o.labelSize;
        g.save(); g.globalCompositeOperation = 'destination-out'; g.lineWidth = 5; g.lineJoin = 'round'; g.strokeStyle = '#000';
        g.textAlign = sd < 0 ? 'left' : 'right'; g.textBaseline = 'middle';
        // (not over the photograph, which has its own skyline: clearing it would cut a dark hole in its towers)
        for (const [t, x, y, a] of labs) if (y > cy - 3 * z && y < cy + 2 * z) { g.globalAlpha = a * (1 - this.sa); g.strokeText(t, x, y); }
        g.restore();
      }
      g.strokeStyle = bronze(0.7 * ra); g.lineWidth = 0.8 + 0.3 * this.sa; g.beginPath(); g.moveTo(xa, yb); g.lineTo(xa, ys[FLOORS]);
      for (let i = 0; i <= FLOORS; i++) if (named(i) && on(i)) { g.moveTo(xa, ys[i]); g.lineTo(xt, ys[i]); }
      g.stroke();
      // a short tick at every level between the numbered ones
      g.strokeStyle = bronze(0.4 * ra); g.lineWidth = 0.6; g.beginPath();
      for (let i = 1; i < FLOORS; i++) if (!named(i) && on(i)) { g.moveTo(xa, ys[i]); g.lineTo((xa + xt) / 2, ys[i]); }
      g.stroke();
      if (labs.length) {
        // (in high contrast, the system's text colour, as every other line of the drawing)
        g.fillStyle = this.forced ? `rgb(${this.line.join()})` : `rgb(${(this.dark ? this.b300 : this.b700).join()})`; g.textAlign = sd < 0 ? 'left' : 'right'; g.textBaseline = 'middle';
        // (over the photograph's bright haze, each name stands on a halo of the hero's ink: a thin, rounded outline under the
        // letters, as a map clears the ground round its names, then a soft, wide shadow, so the lowest names, over the
        // lawn and the palms at 11 AM, keep at least three to one against their own halo without reading as stickers)
        const halo = this.sa > 0 && this.dark && !this.forced, ink = (this.bg || [20, 22, 26]).join();
        if (halo) {
          g.save(); g.strokeStyle = `rgba(${ink},${(0.78 * this.sa).toFixed(3)})`; g.lineWidth = 2.6; g.lineJoin = 'round'; g.lineCap = 'round';
          for (const [t, x, y, a] of labs) { g.globalAlpha = a; g.strokeText(t, x, y); }
          g.restore();
          g.save(); g.shadowColor = `rgba(${ink},${(0.9 * this.sa).toFixed(3)})`; g.shadowBlur = 10;
        }
        for (const [t, x, y, a] of labs) { g.globalAlpha = a; g.fillText(t, x, y); }
        if (halo) g.restore();
        g.globalAlpha = 1;
      }
      // The first release: a bracket on the façade side of the ruler over the levels that hold it (the middle of the
      // tower, the upper floors held back above it), drawn in from the top, in ink rather than bronze, since nothing in it has sold yet
      // when it is drawn. It is always named, at the drawing's 13px: along the bracket where the name fits beside it, and
      // otherwise (a phone, or any drawing too small) just over its top, reading toward the tower, on a hairline of clear
      // ground where it crosses the envelope (a halo, as a map clears the ground round its names). A bracket without its
      // name says nothing.
      if (this.Ra > 0.005 && this.o.release > 0 && !inLens) (() => {
        const [k0, k1] = this.relBand(this.o.release);
        const xb = sx(-9.15), xk = sx(-8.8), yt = ys[k1 + 1], yb = ys[k0], e = smooth(this.Rd), ye = yt + (yb - yt) * e;
        const lab = WORDS.release, z = this.o.labelSize;
        g.save(); g.font = '500 ' + z + 'px Jost, sans-serif';
        if ('letterSpacing' in g) g.letterSpacing = '1.5px';
        const tw = g.measureText(lab).width, along = this.relAlong(w, this.u, Math.abs(yb - yt), tw);
        g.strokeStyle = ink(0.55 * this.Ra); g.lineWidth = 0.8; g.beginPath();
        g.moveTo(xk, yt); g.lineTo(xb, yt); g.lineTo(xb, ye);
        if (e > 0.98) g.lineTo(xk, yb);
        g.stroke();
        const la = this.Ra * clamp((this.Rd - 0.5) * 2, 0, 1);
        if (la > 0.01) {
          g.fillStyle = this.forced ? `rgb(${this.line.join()})` : dark ? `rgba(237,231,220,${(0.7 * la).toFixed(3)})` : `rgba(85,80,74,${la.toFixed(3)})`;
          if (along) {
            g.translate(xb + (xk > xb ? 1 : -1) * (z * 0.95), (yt + yb) / 2); g.rotate(-Math.PI / 2);
            g.textAlign = 'center'; g.textBaseline = 'middle';
            g.fillText(lab, 0, 0);
          } else {
            // (from the bracket's spine toward the tower, kept inside the canvas)
            const r = xk > xb, lx = r ? Math.min(xb - 1, w - 4 - tw) : Math.max(xb + 1, tw + 4), ly = Math.max(yt - 5, z + 2);
            g.textAlign = r ? 'left' : 'right'; g.textBaseline = 'alphabetic';
            if (!this.forced) { const [br, bg2, bb] = this.bg; g.save(); g.globalAlpha = la; g.lineWidth = 5; g.lineJoin = 'round'; g.strokeStyle = `rgb(${br},${bg2},${bb})`; g.strokeText(lab, lx, ly); g.restore(); }
            g.fillText(lab, lx, ly);
          }
        }
        g.restore();
      })();
    }

    // The lamps' light: one radial falloff, made once, stretched over each glow (an ellipse), which keeps a whole night of
    // lit rooms about as cheap as flat ones. Two tints: the lamp light (0), and the gold of a lamp seen through a sold
    // home's bronze glass (1).
    glowSprite(gi) {
      const key = this.warm.join();
      if (this._glowK !== key) {
        const g = this.ctx;
        this._glow = [key, GOLD.join()].map((c) => {
          const u = g.createRadialGradient(0, 0, 0, 0, 0, 1);
          u.addColorStop(0, `rgba(${c},1)`); u.addColorStop(0.3, `rgba(${c},0.55)`); u.addColorStop(0.65, `rgba(${c},0.16)`); u.addColorStop(1, `rgba(${c},0)`);
          return u;
        });
        this._glowK = key;
      }
      return this._glow[gi];
    }

    // The lowest and highest levels holding the first release of rel levels' worth of residences (the first that sell).
    relBand(rel) {
      let k0 = FLOORS - 1, k1 = RES0;
      for (let k = RES0; k < RES1; k++) if (this.rank[k * 2] < rel * 2 - 1e-6 || this.rank[k * 2 + 1] < rel * 2 - 1e-6) { k0 = Math.min(k0, k); k1 = Math.max(k1, k); }
      return [k0, k1];
    }
    // Whether the release's name (tw px long) can run along its bracket (span px long): on a drawing at least 480px wide
    // and 14 px a level, with the bracket long enough to hold it. Otherwise it is set over the bracket's top.
    relAlong(w, u, span, tw) { return w >= 480 && u >= 14 && tw + 16 < span; }
    // the release's name, as long as it is drawn
    relWidth() {
      const g = this.ctx, z = this.o.labelSize;
      g.save(); g.font = '500 ' + z + 'px Jost, sans-serif';
      if ('letterSpacing' in g) g.letterSpacing = '1.5px';
      const tw = g.measureText(WORDS.release).width;
      g.restore();
      return tw;
    }

    // A line of width v round the union of convex outlines hs (screen points): every edge of every outline, less the
    // parts that lie inside another, stroked as one path (so nothing is inked twice). Where two outlines share an edge,
    // the earlier one keeps it. hide[i], when set, is 4 * (points in outline i's top chain) + 1 if that chain is known to
    // be hidden + 2 if its bottom chain is: those edges are left out without testing. hide[i] of exactly 4 marks an outline
    // that only hides parts of the others and draws nothing itself. lite, when given, is { cls, col, v }: the share of
    // the line that belongs to an outline i with cls[i] set is stroked as its own path, in col at width v.
    outline(hs, col, v, hide, lite) {
      const g = this.ctx, n = hs.length, E = 0.02, box = new Float64Array(n * 4), hp = [], hi = [];
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
        // and up to eight of its corners as a smaller outline inside it, shrunk a hair: an edge within that one is hidden
        // whole, found in far fewer tests
        const K = Math.min(8, m), ip = new Float64Array(K * 3);
        k = 0;
        if (m > 2) for (let t = 0; t < K; t++) { const p = h[Math.floor((t * m) / K)], q = h[Math.floor(((t + 1) * m) / K) % m], dx = q[0] - p[0], dy = q[1] - p[1], l = Math.sqrt(dx * dx + dy * dy); if (l < 1e-9) continue; const nx = (sg * dy) / l, ny = (-sg * dx) / l; ip[k++] = nx; ip[k++] = ny; ip[k++] = nx * p[0] + ny * p[1] - E; }
        hi.push(k >= 9 ? ip.subarray(0, k) : null);
      }
      // (sep[j]: where in outline j's edges the last test found one that leaves the edge outside it, tried first next time,
      // since the next edge is most often outside by the same one)
      const c0 = new Float64Array(n), c1 = new Float64Array(n), near = new Int32Array(n), sep = new Int32Array(n), cls = lite ? lite.cls : null;
      g.lineJoin = 'round'; g.lineCap = 'round';
      for (let pass = 0; pass < (cls ? 2 : 1); pass++) {
        g.beginPath();
        for (let i = 0; i < n; i++) {
          if (cls && (cls[i] ? 1 : 0) !== pass) continue;
          const h = hs[i], m = h.length, bx0 = box[i * 4] - 1, by0 = box[i * 4 + 1] - 1, bx1 = box[i * 4 + 2] + 1, by1 = box[i * 4 + 3] + 1;
          // only the outlines whose boxes touch this one can hide any of it
          let nn = 0;
          for (let j = 0; j < n; j++) if (j !== i && hp[j] && box[j * 4] <= bx1 && box[j * 4 + 2] >= bx0 && box[j * 4 + 1] <= by1 && box[j * 4 + 3] >= by0) near[nn++] = j;
          // (gi: the one that hid the last edge whole, tried first, since the next edge is most often hidden by it too)
          let open = false, gi = 0;
          const hd = hide ? hide[i] : 0, nu = hd >> 2;
          if (hd === 4) continue; // an outline that only hides others
          for (let e = 0; e < m; e++) {
            if (((hd & 1) && e < nu - 1) || ((hd & 2) && e >= nu && e < m - 1)) { open = false; continue; }
            const P0 = h[e], P1 = h[(e + 1) % m], dx = P1[0] - P0[0], dy = P1[1] - P0[1];
            const ex0 = Math.min(P0[0], P1[0]), ex1 = Math.max(P0[0], P1[0]), ey0 = Math.min(P0[1], P1[1]), ey1 = Math.max(P0[1], P1[1]);
            let nc = 0, gone = false;
            for (let c = 0, ni = gi; c < nn; c++, ni = ni + 1 < nn ? ni + 1 : 0) {
              const j = near[ni];
              if (box[j * 4] > ex1 + 1 || box[j * 4 + 2] < ex0 - 1 || box[j * 4 + 1] > ey1 + 1 || box[j * 4 + 3] < ey0 - 1) continue;
              const ip = hi[j];
              if (ip) {
                let q = 0;
                for (; q < ip.length; q += 3) if (ip[q] * P0[0] + ip[q + 1] * P0[1] > ip[q + 2] || ip[q] * P1[0] + ip[q + 1] * P1[1] > ip[q + 2]) break;
                if (q >= ip.length) { gone = true; gi = ni; break; }
              }
              // the part of the edge inside outline j (grown a hair if j comes first, shrunk if it comes after)
              const pl = hp[j], np = pl.length, tol = j < i ? E : -E;
              let t0 = 0, t1 = 1;
              for (let c = 0, q = sep[j]; c < np; c += 3, q = q + 3 < np ? q + 3 : 0) {
                const f0 = pl[q] * P0[0] + pl[q + 1] * P0[1] - pl[q + 2] - tol, df = pl[q] * dx + pl[q + 1] * dy;
                if (df > 1e-12) { const t = -f0 / df; if (t < t1) t1 = t; } else if (df < -1e-12) { const t = -f0 / df; if (t > t0) t0 = t; } else if (f0 > 0) { t1 = -1; sep[j] = q; break; }
                if (t0 >= t1) { sep[j] = q; break; }
              }
              if (t1 > t0) {
                if (t0 <= 1e-6 && t1 >= 1 - 1e-6) { gone = true; gi = ni; break; }
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
        g.lineWidth = pass ? lite.v : v; g.strokeStyle = pass ? lite.col : col; g.stroke();
      }
      g.lineJoin = 'miter'; g.lineCap = 'butt';
    }

    sunPath(now, dark) {
      const g = this.ctx, t = Date.now(), H0 = -0.833;
      // Today's sun over Miami: the calendar day there, sampled every ten minutes from its midnight, so the arc and its
      // times hold still all day and read the same on every visit. Sunrise and sunset are found to the second where the
      // sun's upper edge meets the horizon (0.833° below it, with refraction) and stated to the minute, as an almanac
      // states them. After sunset the day's arc stays, all of it behind the sun, until midnight.
      if (!this.sp || t - this.sp.at > 60000) {
        const day = miamiDay(t);
        if (!this.sp || this.sp.day !== day) {
          const el = (ms) => solar(new Date(ms)).el, pts = [];
          for (let k = 0; k <= 144; k++) pts.push({ t: day + k * 6e5, el: el(day + k * 6e5) });
          // the crossing between two samples either side of the horizon, halved down to a few milliseconds
          const cross = (a, b) => { let lo = a.t, hi = b.t; const rising = b.el > a.el; for (let i = 0; i < 18; i++) { const mid = (lo + hi) / 2; if ((el(mid) > H0) === rising) hi = mid; else lo = mid; } return (lo + hi) / 2; };
          let rise = null, set = null;
          for (let k = 1; k < pts.length && set === null; k++) {
            const a = pts[k - 1], b = pts[k];
            if (rise === null && a.el <= H0 && b.el > H0) rise = cross(a, b);
            else if (rise !== null && a.el > H0 && b.el <= H0) set = cross(a, b);
          }
          const fmt = (ms) => { try { return new Date(Math.round(ms / 6e4) * 6e4).toLocaleTimeString(WORDS.time, { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }); } catch (e) { return ''; } };
          const arc = rise === null || set === null ? [] : [{ t: rise, el: H0 }].concat(pts.filter((q) => q.t > rise && q.t < set), [{ t: set, el: H0 }]);
          this.sp = { day, arc, rise: arc.length ? fmt(rise) : '', set: arc.length ? fmt(set) : '' };
        }
        this.sp.at = t;
      }
      const arc = this.sp.arc; if (arc.length < 3) return;
      // drawn as an architect's sun-path elevation in the open corner above the levels: time across, height up
      const w = this.w, H = 54, base = 100 + H;
      // it sits clear of the crown, between the tower and the right edge of the page's column (o.edge px in from the
      // canvas's edge, set by the page), or 20px in from the screen's edge. Where it goes is settled for the drawing's
      // size and framing, never for the moment of the orbit: it keeps clear of the furthest the crown and the level ruler
      // reach over a whole turn, so it neither slides nor comes and goes as the tower turns (a size that leaves no room
      // for it keeps the corner empty).
      const key = [w, this.h, this.o.ty, this.o.scale, this.o.offsetX, this.phi, this.o.dist, this.o.labels, this.o.labelSize].join();
      if (!this.spAt || this.spAt.key !== key) this.spAt = { key, ...this.reach() };
      const xr = this.spAt.xr;
      const xe = w - (this.o.edge != null ? this.o.edge : 20) - 8;
      let x0 = Math.max(xr + 48, w * 0.55), x1 = Math.min(xe, x0 + 230);
      // and clear of the level ruler and its labels: past them if there is room, otherwise not at all
      // (its labels reach dy below the horizon line: one line of them, or two)
      const rbs = this.rb ? this.spAt.rbs : [], hit = (dy) => rbs.filter((rb) => x0 - 8 < rb.x1 && x1 + 8 > rb.x0 && base - H - 20 < rb.y1 && base + dy > rb.y0), hits = (dy) => hit(dy).length > 0;
      if (hits(24)) { x0 = Math.max(x0, ...hit(24).map((rb) => rb.x1 + 16)); x1 = Math.min(xe, x0 + 230); }
      const W = x1 - x0;
      if (W < 150) return;
      const t0 = arc[0].t, t1 = arc[arc.length - 1].t, top = Math.max(...arc.map((q) => q.el)), [sr, sg, sb] = this.sold, [lr, lg, lb] = this.line;
      const X = (ms) => x0 + ((ms - t0) / (t1 - t0)) * W, Y = (el) => base - (Math.max(el, 0) / top) * H;
      // where the sun stands now: on the arc while it is up, at sunrise before it, at sunset after it
      // (or where a visitor has moved it to)
      const tn = this.sunT != null ? this.sunT : t, up = tn > t0 && tn < t1, cut = clamp(tn, t0, t1), nowQ = { t: cut, el: up ? solar(new Date(tn)).el : H0 };
      this.spG = { x0, x1, base, H, t0, t1 };
      g.save(); g.lineWidth = 1;
      g.strokeStyle = `rgba(${lr},${lg},${lb},0.22)`; g.beginPath(); g.moveTo(x0 - 8, base + 0.5); g.lineTo(x1 + 8, base + 0.5); g.stroke();
      for (const past of [true, false]) {
        const run = past ? arc.filter((q) => q.t < cut).concat([nowQ]) : [nowQ].concat(arc.filter((q) => q.t > cut));
        if (run.length < 2) continue;
        g.setLineDash(past ? [] : [1.5, 3.5]); g.strokeStyle = `rgba(${sr},${sg},${sb},${past ? 0.85 : 0.6})`; g.beginPath();
        run.forEach((q, j) => (j ? g.lineTo(X(q.t), Y(q.el)) : g.moveTo(X(q.t), Y(q.el))));
        g.stroke();
      }
      g.setLineDash([]);
      // hour ticks on the horizon line, at Miami's whole hours
      g.strokeStyle = `rgba(${lr},${lg},${lb},0.28)`; g.beginPath();
      for (let hr = this.sp.day + Math.ceil((t0 - this.sp.day) / 36e5) * 36e5; hr < t1; hr += 36e5) { const x = X(hr); g.moveTo(x, base); g.lineTo(x, base + 4); }
      g.stroke();
      if (up && nowQ.el > 0) {
        const x = X(tn), y = Y(nowQ.el), pulse = reduce ? 1 : 0.8 + 0.2 * Math.sin(now / 1200);
        const gr = g.createRadialGradient(x, y, 0, x, y, 14);
        gr.addColorStop(0, `rgba(${sr},${sg},${sb},${0.4 * pulse})`); gr.addColorStop(1, `rgba(${sr},${sg},${sb},0)`);
        g.fillStyle = gr; g.beginPath(); g.arc(x, y, 14, 0, TAU); g.fill();
        g.fillStyle = `rgb(${sr},${sg},${sb})`; g.beginPath(); g.arc(x, y, 3.2, 0, TAU); g.fill();
        g.strokeStyle = `rgba(${sr},${sg},${sb},0.35)`; g.setLineDash([1, 3]); g.beginPath(); g.moveTo(x, y + 5); g.lineTo(x, base); g.stroke(); g.setLineDash([]);
      }
      // sunrise and sunset under the horizon line, the peak height over the arc
      g.textBaseline = 'top'; g.fillStyle = `rgba(${lr},${lg},${lb},0.62)`;
      const rt = this.sp.rise.toUpperCase(), st = this.sp.set.toUpperCase();
      // both times under the ends of the arc they belong to, side by side without touching, always at the drawing's 13px:
      // on one line where there is room, in a tight corner each name over its time, and failing that the times alone
      g.font = '500 13px Jost, sans-serif';
      const fits = (a, b) => g.measureText(a).width + g.measureText(b).width + 16 < W + 16;
      const put = (a, b, y) => { g.textAlign = 'left'; g.fillText(a, x0 - 8, y); g.textAlign = 'right'; g.fillText(b, x1 + 8, y); };
      const SR = WORDS.rise, SS = WORDS.set;
      if (fits(SR + ' ' + rt, SS + ' ' + st)) put(SR + ' ' + rt, SS + ' ' + st, base + 9);
      else if (!hits(42) && fits(SR, SS) && fits(rt, st)) { put(SR, SS, base + 9); put(rt, st, base + 26); }
      else if (fits(rt, st)) put(rt, st, base + 9);
      const pk = arc.reduce((a, q) => (q.el > a.el ? q : a), arc[0]);
      g.textAlign = 'center'; g.textBaseline = 'bottom'; g.fillStyle = `rgba(${sr},${sg},${sb},0.9)`;
      // (named as noon's height, so it never reads as a second figure for the sun's height now that the survey note gives)
      g.fillText(WORDS.noon + ' ' + Math.round(pk.el) + '°', X(pk.t), base - H - 6);
      g.restore();
    }

    // The furthest right the crown reaches, and the box the level ruler and its labels take at each bearing, over a whole
    // turn of the camera at its present framing: where the sun's path may go. (The pointer's tilt is left out, so the
    // diagram holds still under the mouse; at a fortieth of a radian it stays well inside the 48px kept clear of the crown.)
    reach() {
      const sd = this.o.dimSide === 1 ? -1 : 1, tw = this.o.labels ? this.o.labelSize * 3 : 0, N = 36, top = PLANS3[FLOORS - 1].slab;
      // (the near façade's depth for each bearing depends on the bearing alone, so it is found once)
      const nf = this._nf || (this._nf = Array.from({ length: N }, (_, i) => this.nearFace(Math.cos((i * TAU) / N), Math.sin((i * TAU) / N))));
      let xr = -1e9; const rbs = [];
      for (let i = 0; i < N; i++) {
        const K = this.camAt((i * TAU) / N, this.phi, this.o.ty, this.o.scale, this.o.offsetX), c = K.c, s = K.s, nr = nf[i];
        const pr = (x, y, z) => { const Z = s * x + c * z + K.d; return [K.cx + (K.f * (c * x - s * z)) / Z, K.cy - (K.f * (y - K.ey)) / Z]; };
        for (const p of top) xr = Math.max(xr, pr(p.x * 1.1, FLOORS + 2.6, p.z * 1.1)[0]);
        const at = (X) => [c * X * sd - s * nr, -s * X * sd - c * nr], [ax, az] = at(-10), [lx, lz] = at(-11.9);
        // (the top and bottom ticks sit where the roof's and the first level's slab edges are nearest the eye, as drawn)
        const lv = (k) => { let y = 0, zn = Infinity; for (const q of edgePlan(k)) { const Z = s * q.x + c * q.z + K.d; if (Z < zn) { zn = Z; y = K.cy - (K.f * (k + SLAB - K.ey)) / Z; } } return y; };
        const xa = pr(ax, 0, az)[0], xl = pr(lx, 0, lz)[0];
        rbs.push({ x0: Math.min(xa, xl - (sd > 0 ? tw : 0)) - 6, x1: Math.max(xa, xl + (sd < 0 ? tw : 0)) + 6, y0: lv(FLOORS) - this.o.labelSize - 2, y1: lv(0) + 2 });
      }
      return { xr, rbs };
    }

    // The aviation light on the roof, breathing slowly.
    // By day it is a bronze point; as the light goes it becomes lamp light and its glow reaches further.
    // (k sizes it: the crane's obstruction light is a smaller one)
    beacon(p, now, dark, fade = 1, night = 0, k = 1) {
      const g = this.ctx, a = (reduce ? 0.8 : 0.55 + 0.45 * Math.sin(now / 900)) * clamp(fade, 0, 1);
      // (bronze only ever means sold: from early dusk the light is the lamp's colour, not the bronze it is by day)
      const tl = clamp(night / 0.15, 0, 1), [sr, sg, sb] = this.sold.map((v, i) => Math.round(v + (this.warm[i] - v) * tl)), R = 3 + 2.5 * night;
      const r = Math.max(2.5, this.k.f / this.o.dist * 0.35) * k;
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
      // (after dark, against the lit lobby and its pool of light, a figure is a silhouette)
      const nt = this.dark ? this.nightNow || 0 : 0, sc = (v, b) => Math.round(v + (b * 0.6 - v) * nt), [br, bgg, bb] = this.bg;
      g.strokeStyle = g.fillStyle = `rgba(${sc(lr, br)},${sc(lg, bgg)},${sc(lb, bb)},${this.dark ? 0.78 + 0.12 * nt : 0.72})`; g.lineCap = 'round';
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
      const [mx, mz] = MAST, s = MAST_W, { top, ang } = craneAt(this.L, this.G, this.u), L = this.L;
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
      // after dark, its work lamp at the mast head (the deck's pool of light is drawn with the slab) and the obstruction
      // light at the jib's tip, breathing as the roof's does: a smaller, quieter point in lamp light (the crane is never
      // sold, so its light never takes the bronze)
      const nt = this.dark && !this.forced ? this.nightNow || 0 : 0;
      if (nt > 0.05) {
        const [wr, wg, wb] = this.warm, m = P(0, top + 3, 0), r = Math.max(1, this.u * 0.09), rg = r * 4, gr = g.createRadialGradient(m[0], m[1], 0, m[0], m[1], rg);
        gr.addColorStop(0, `rgba(${wr},${wg},${wb},${(0.5 * nt * this.crane).toFixed(3)})`); gr.addColorStop(1, `rgba(${wr},${wg},${wb},0)`);
        g.fillStyle = gr; g.beginPath(); g.arc(m[0], m[1], rg, 0, TAU); g.fill();
        g.fillStyle = `rgba(${wr},${wg},${wb},${(0.9 * nt * this.crane).toFixed(3)})`; g.beginPath(); g.arc(m[0], m[1], r, 0, TAU); g.fill();
        this.beacon(J(JIB, top, 0), performance.now(), true, nt * this.crane * 0.6, 1, 0.45);
      }
    }
  }

  // What the rendered tower (tower3d.js) and the sales curve's small elevation (instrument.js) are built from: the same
  // plans, structure, site and stacking plan as the drawing.
  // Which photograph suits the hour (see STILLS): the night's once the sun is below the horizon (as the hero's camera
  // judges it), the early morning's or golden hour's while it stands under 15 degrees (east or west of south), the day's
  // above that; and their bearings.
  Model.still = (t) => { const s = miamiSun(t); return s.night >= 0.6 ? 'night' : s.el < 15 ? (s.az < 180 ? 'morning' : 'gold') : 'day'; };
  Model.stills = STILLS;
  Model.geo = { FLOORS, SLAB, PODIUM, CROWN, RES0, RES1, RAIL_H, SCREEN_H, CREST, BEACON, PORTE, CANOPY, CORE, COLS, PALMS, LAMP, GOLD, MODEL_ROOM, RANK, MEZZ, hash, craneAt, plan: floorPlan, set: (na) => SETS[na] || (SETS[na] = buildSet(na)) };
  window.CentamontModel = Model;
})();
