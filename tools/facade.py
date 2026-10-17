"""Draws the three bays of the home page's facade (#services) and writes them into index.html, between the bay frames
and the end of the <svg class="facade">. Run it after changing a drawing here (the drawing is markup, not script, so
the page's security policy does not change).

Each bay is one <g> (the page's CSS lights the bronze in the <g> of the practice in hand, by its position, so the three
stay the only <g> elements in the drawing). Pens, as DESIGN.md sets them: "pf" profile, plain object, "dt" detail,
"hatch" hatch; "w" is poche (cut wall, filled in ink), "b" is bronze (what is priced or sold, and the light), "br" a
bronze line. Every stroked path draws itself in order of its --i.

  I   Development advisory: a typical floor of a residential building on the drafting sheet, before the design is
      final: cut walls, a core, five residences of three sizes, windows, balconies, door swings, a dimension string, a
      north point and a scale bar. The corner residence is priced, in bronze.
  II  Sales & marketing: the building in elevation, from its sales gallery on the ground to its crown, floor by floor,
      with a level rule beside it; the floors already sold fill in bronze from the ground up.
  III Private client advisory: a door in a rusticated stone front, under an arch of voussoirs and a keystone, between
      two clipped trees, with the right leaf ajar and the light inside falling across the steps.
"""
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def n(v):
    s = f'{v:.1f}'.rstrip('0').rstrip('.')
    return '0' if s == '-0' else s


class Pen:
    def __init__(self):
        self.out = []
        self.i = 0

    def path(self, d, cls='', i=None, step=True):
        if i is None:
            i = self.i
            if step:
                self.i += 1
        c = f' class="{cls}"' if cls else ''
        self.out.append(f'<path{c} style="--i:{i}" pathLength="1" d="{d}"/>')

    def fill(self, d, cls):
        self.out.append(f'<path class="{cls}" d="{d}"/>')


def rect(x, y, w, h):
    return f'M{n(x)} {n(y)}h{n(w)}v{n(h)}h{n(-w)}Z'


def line(x1, y1, x2, y2):
    return f'M{n(x1)} {n(y1)}L{n(x2)} {n(y2)}'


def hline(x1, x2, y):
    return f'M{n(x1)} {n(y)}H{n(x2)}'


def vline(x, y1, y2):
    return f'M{n(x)} {n(y1)}V{n(y2)}'


def circle(cx, cy, r):
    return f'M{n(cx - r)} {n(cy)}a{n(r)} {n(r)} 0 1 0 {n(2 * r)} 0a{n(r)} {n(r)} 0 1 0 {n(-2 * r)} 0'


def arc(cx, cy, r, a0, a1):
    """an arc from angle a0 to a1 (degrees, 0 = east, counter-clockwise on the page, so 90 = up)"""
    x0, y0 = cx + r * math.cos(math.radians(a0)), cy - r * math.sin(math.radians(a0))
    x1, y1 = cx + r * math.cos(math.radians(a1)), cy - r * math.sin(math.radians(a1))
    large = 1 if abs(a1 - a0) > 180 else 0
    sweep = 0 if a1 > a0 else 1
    return f'M{n(x0)} {n(y0)}A{n(r)} {n(r)} 0 {large} {sweep} {n(x1)} {n(y1)}'


# ---------------------------------------------------------------------------------------------------- I: the floor plan
def plan():
    p = Pen()
    X0, X1, Y0, Y1 = 70.5, 330.5, 116.5, 250.5       # the slab edge
    T = 4                                           # exterior wall
    # windows on the long fronts: (x from, x to), in the outer wall
    top_w = [(84, 118), (128, 150), (172, 206), (216, 240), (262, 296), (306, 320)]
    bot_w = [(86, 130), (146, 186), (214, 254), (270, 314)]
    side_w = [(132, 160), (196, 230)]

    def wall_runs(a, b, gaps):
        runs, x = [], a
        for g0, g1 in gaps:
            runs.append((x, g0))
            x = g1
        runs.append((x, b))
        return runs

    # poche: the cut exterior walls, broken at the windows
    w = []
    for x0, x1 in wall_runs(X0, X1, top_w):
        w.append(rect(x0, Y0, x1 - x0, T))
    for x0, x1 in wall_runs(X0, X1, bot_w):
        w.append(rect(x0, Y1 - T, x1 - x0, T))
    for x in (X0, X1 - T):
        for y0, y1 in wall_runs(Y0, Y1, side_w):
            w.append(rect(x, y0, T, y1 - y0))
    # demising walls between residences, and the core's walls
    CY0, CY1 = 166.5, 196.5                         # the corridor
    for x in (160.5, 250.5):
        w.append(rect(x - 1.5, Y0 + T, 3, CY0 - Y0 - T))
    w.append(rect(199, CY1, 3, Y1 - T - CY1))
    w.append(rect(X0 + T, CY0 - 1.5, 112 - X0 - T, 3))
    w.append(rect(124, CY0 - 1.5, 172 - 124, 3))
    w.append(rect(184, CY0 - 1.5, 262 - 184, 3))
    w.append(rect(274, CY0 - 1.5, X1 - T - 274, 3))
    w.append(rect(X0 + T, CY1 - 1.5, 96 - X0 - T, 3))
    w.append(rect(108, CY1 - 1.5, 199 - 108, 3))
    w.append(rect(202, CY1 - 1.5, 296 - 202, 3))
    w.append(rect(308, CY1 - 1.5, X1 - T - 308, 3))
    # the core: lifts and stair, walled, in the middle of the corridor's run
    KX0, KX1, KY0, KY1 = 186.5, 236.5, 150.5, 166.5
    w.append(rect(KX0, KY0, KX1 - KX0, 2))
    w.append(rect(KX0, KY0, 2, KY1 - KY0))
    w.append(rect(KX1 - 2, KY0, 2, KY1 - KY0))
    w.append(rect(210.5, KY0, 1.5, KY1 - KY0))
    # the slab edge and the outer face of the building, in the profile pen
    p.path(rect(X0, Y0, X1 - X0, Y1 - Y0), 'pf')
    # windows: the glass as a line in the middle of the wall, with the sill line inside
    win = []
    for g0, g1 in top_w:
        win += [hline(g0, g1, Y0 + T / 2), hline(g0, g1, Y0 + T)]
    for g0, g1 in bot_w:
        win += [hline(g0, g1, Y1 - T / 2), hline(g0, g1, Y1 - T)]
    for g0, g1 in side_w:
        for x in (X0 + T / 2, X1 - T / 2):
            win.append(vline(x, g0, g1))
    p.path(''.join(win), 'dt')
    # balconies along the south front, a slab edge and a rail
    bal = [rect(84, Y1, 112, 9), rect(206, Y1, 112, 9), hline(86, 194, Y1 + 6), hline(208, 316, Y1 + 6)]
    p.path(''.join(bal), 'dt')
    # inner partitions (each residence's rooms), in the detail pen
    rooms = [
        vline(115.5, Y0 + T, 150), hline(X0 + T, 115.5, 140.5),            # A: bedroom, bath
        vline(205.5, Y0 + T, 140), hline(160.5 + 1.5, 205.5, 140.5),        # B
        vline(290.5, Y0 + T, 150), hline(290.5, X1 - T, 140.5),            # C
        vline(130.5, CY1 + 1.5, Y1 - T), hline(X0 + T, 130.5, 222.5),        # D
        vline(262.5, CY1 + 1.5, Y1 - T), hline(262.5, X1 - T, 222.5),        # E, the corner
        hline(150.5, 199, 222.5),
    ]
    p.path(''.join(rooms), 'dt')
    # doors: each residence's entry off the corridor, a leaf and its swing
    doors = []
    for hx, y, up in [(112, CY0, True), (172, CY0, True), (262, CY0, True), (96, CY1, False), (296, CY1, False)]:
        if up:
            doors.append(f'{vline(hx, y, y - 12)}{arc(hx, y, 12, 90, 0)}')
        else:
            doors.append(f'{vline(hx, y, y + 12)}{arc(hx, y, 12, -90, 0)}')
    # room doors inside the residences
    for hx, y in [(100, 140.5), (190, 140.5), (300, 140.5)]:
        doors.append(f'{vline(hx, y, y + 9)}{arc(hx, y, 9, 0, -90)}')
    p.path(''.join(doors), 'dt')
    # lifts (a box, its cross) and the stair's treads
    core = [rect(190.5, 154.5, 8, 9), line(190.5, 154.5, 198.5, 163.5), line(198.5, 154.5, 190.5, 163.5),
            rect(200.5, 154.5, 8, 9), line(200.5, 154.5, 208.5, 163.5), line(208.5, 154.5, 200.5, 163.5)]
    for x in range(214, 234, 3):
        core.append(vline(x + .5, 154.5, 163.5))
    core.append(line(214.5, 159, 233.5, 159))
    p.path(''.join(core), 'dt')
    # the corner residence, priced: its floor in bronze
    p.fill(rect(202, CY1 + 1.5, X1 - T - 202, Y1 - T - CY1 - 1.5), 'b')
    # poche last so it sits over the fills
    p.fill(''.join(w), 'w')
    # a dimension string over the north front: extension lines, the string, ticks at each residence
    xs = [X0, 160.5, 250.5, X1]
    dim = [hline(X0 - 6, X1 + 6, 98.5)] + [vline(x, 94.5, 110.5) for x in xs]
    dim += [line(x - 3, 101.5, x + 3, 95.5) for x in xs]
    p.path(''.join(dim), 'dt')
    # the column grid's bubbles on the west side
    grid = [circle(52.5, 150, 5.5), circle(52.5, 210, 5.5), hline(58, X0 - 2, 150), hline(58, X0 - 2, 210)]
    p.path(''.join(grid), 'dt')
    # a north point and a scale bar, off the south-east corner
    npt = [circle(360.5, 120.5, 9), f'M360.5 108.5L364.5 124.5L360.5 121.5L356.5 124.5Z']
    p.path(''.join(npt), 'dt')
    p.fill('M360.5 108.5L364.5 124.5L360.5 121.5Z', 'k')
    sb = [rect(70.5, 272.5, 64, 4), vline(86.5, 272.5, 276.5), vline(102.5, 272.5, 276.5), vline(118.5, 272.5, 276.5)]
    p.path(''.join(sb), 'dt')
    p.fill(rect(70.5, 272.5, 16, 4) + rect(102.5, 272.5, 16, 4), 'k')
    return p.out


# -------------------------------------------------------------------------------------------------- II: the tower
def tower():
    p = Pen()
    G = 296.5                                       # the facade's ground line
    PX0, PX1, PY = 510.5, 690.5, 254.5              # the podium, with the sales gallery
    SX0, SX1 = 566.5, 634.5                         # the shaft
    UX0, UX1, UY = 572.5, 628.5, 116.5              # the set-back upper floors, from UY up
    TOP = 98.5                                      # the roof of the floors
    FH = 6                                          # floor to floor
    floors = list(range(int(PY), int(TOP), -FH))    # the floor lines, ground up
    sold = 17                                       # floors sold
    # the silhouette in the profile pen
    sil = (f'M{n(PX0)} {n(G)}V{n(PY)}H{n(SX0)}V{n(UY)}H{n(UX0)}V{n(TOP)}H{n(UX1)}V{n(UY)}H{n(SX1)}'
           f'V{n(PY)}H{n(PX1)}V{n(G)}')
    p.path(sil, 'pf')
    # the floors sold, in bronze, from the ground up (the light under the lines)
    sy = PY - sold * FH
    p.fill(rect(SX0, sy, SX1 - SX0, PY - sy), 'b')
    # the floor lines
    fl = []
    for y in floors[1:]:
        x0, x1 = (SX0, SX1) if y > UY else (UX0, UX1)
        fl.append(hline(x0, x1, y + .5 - .5))
    p.path(''.join(fl), 'dt')
    # the mullions: the shaft's bays, closer on the set-back floors
    mu = []
    for k in range(1, 5):
        x = SX0 + k * (SX1 - SX0) / 5
        mu.append(vline(x, UY, PY))
    for k in range(1, 4):
        x = UX0 + k * (UX1 - UX0) / 4
        mu.append(vline(x, TOP, UY))
    p.path(''.join(mu), 'dt')
    # the crown: a mechanical screen, then a fin and its mast
    crown = [rect(582.5, 84.5, 36, 12)] + [vline(x + .5, 84.5, 96.5) for x in range(588, 616, 6)]
    crown += [rect(594.5, 74.5, 12, 10), vline(600.5, 63.5, 74.5)]
    p.path(''.join(crown))
    # a balcony edge on each corner of the shaft, every other floor
    bal = []
    for y in floors[1:]:
        if y > UY:
            bal += [hline(SX0 - 6, SX0, y), hline(SX1, SX1 + 6, y)]
    p.path(''.join(bal), 'dt')
    # the podium: the sales gallery's glass, its canopy and doors
    gal = [hline(PX0, PX1, 262.5), rect(502.5, 258.5, 196, 4)]
    for x in range(522, 684, 16):
        gal.append(vline(x + .5, 262.5, G))
    gal += [rect(588.5, 272.5, 24, 24), vline(600.5, 272.5, G)]
    p.path(''.join(gal))
    # the level rule beside the tower: a tick a floor, longer every fifth, a bronze bracket over the floors sold
    lr = [vline(664.5, TOP, PY - 2)]
    for k, y in enumerate(floors):
        if y < TOP:
            break
        lr.append(hline(664.5, 664.5 + (8 if k % 5 == 0 else 4), y))
    p.path(''.join(lr), 'dt')
    p.path(f'M655.5 {n(PY)}H659.5V{n(sy)}H655.5', 'br')
    # people and trees at the gallery, for scale
    fig = []
    for x in (548.5, 636.5, 644.5):
        fig += [circle(x, 285, 1.6), vline(x, 287, G - 1)]
    p.path(''.join(fig), 'dt')
    return p.out


# ------------------------------------------------------------------------------------------------ III: the doorway
def door():
    p = Pen()
    G = 296.5
    CX = 992.5
    WX0, WX1, WY = 862.5, 1122.5, 104.5             # the stone front
    R, RO, SPR = 40, 58, 196.5                      # the opening's radius, the arch's outer radius, the springing
    STEP = [(276.5, 52), (283.5, 60), (290.5, 68)]  # the steps: top, half width
    OX0, OX1, OB = CX - R, CX + R, 276.5            # the opening, down to the top step
    # the front: a cornice over the stone, then the ground
    p.path(f'M{n(WX0)} {n(G)}V{n(WY)}H{n(WX1)}V{n(G)}', 'pf')
    p.path(hline(WX0 - 6, WX1 + 6, WY - .5) + rect(WX0 - 6, WY - 8, WX1 - WX0 + 12, 7.5) + hline(WX0 - 2, WX1 + 2, WY - 12.5), '')
    # rustication: the courses, cut back from the arch and the jambs
    cr = []
    course = 13
    jamb = R + 13
    for k, y in enumerate([WY + course * j for j in range(1, 15)]):
        if y >= G - 1:
            break
        if y < SPR:
            dy = SPR - y
            half = math.sqrt(max(RO ** 2 - dy ** 2, 0)) if dy < RO else 0
            half = max(half, 0) + (2 if half else 0)
        else:
            half = jamb + 1
        runs = [(WX0, CX - half), (CX + half, WX1)] if half else [(WX0, WX1)]
        for a, b in runs:
            cr.append(hline(a, b, y))
    # the joints, stone by stone, staggered a half stone on each course
    for j in range(14):
        y0 = WY + course * j
        y1 = y0 + course
        if y1 > G:
            y1 = G
        if y0 >= G:
            break
        off = 0 if j % 2 else 33
        x = WX0 + off + 33
        while x < WX1 - 4:
            ymid = (y0 + y1) / 2
            if ymid < SPR:
                dy = SPR - ymid
                inside = dy < RO + 3 and abs(x - CX) < math.sqrt(max((RO + 3) ** 2 - dy ** 2, 0))
            else:
                inside = abs(x - CX) < jamb + 3
            # keep the trees clear
            if ymid > 236 and (abs(x - 900.5) < 18 or abs(x - 1084.5) < 18):
                inside = True
            if not inside:
                cr.append(vline(x, y0, y1))
            x += 66
    p.path(''.join(cr), 'dt')
    # the arch: intrados, extrados, the voussoirs and a keystone that stands proud
    a = [arc(CX, SPR, R, 180, 0), arc(CX, SPR, RO, 180, 96), arc(CX, SPR, RO, 84, 0)]
    for k in range(1, 11):
        t = 180 - k * 180 / 11
        if 80 < t < 100:
            continue
        c, s = math.cos(math.radians(t)), math.sin(math.radians(t))
        a.append(line(CX + R * c, SPR - R * s, CX + RO * c, SPR - RO * s))
    ka, kb = math.radians(84), math.radians(96)
    a.append(f'M{n(CX + R * math.cos(ka))} {n(SPR - R * math.sin(ka))}L{n(CX + 7)} {n(SPR - RO - 8)}'
             f'H{n(CX - 7)}L{n(CX + R * math.cos(kb))} {n(SPR - R * math.sin(kb))}')
    p.path(''.join(a))
    # the jambs: dressed blocks either side, and the springing's impost
    jb = [vline(OX0, SPR, OB), vline(OX1, SPR, OB), vline(CX - jamb, SPR, G), vline(CX + jamb, SPR, G),
          rect(CX - jamb - 3, SPR - 4, 3, 4), rect(CX + jamb, SPR - 4, 3, 4), hline(CX - jamb - 3, OX0, SPR), hline(OX1, CX + jamb + 3, SPR)]
    for y in range(int(SPR) + 16, int(OB), 16):
        jb += [hline(CX - jamb, OX0, y + .5), hline(OX1, CX + jamb, y + .5)]
    p.path(''.join(jb))
    # the reveal: the door stands a little back in the opening
    rv = [arc(CX, SPR, R - 5, 180, 0), vline(OX0 + 5, SPR, OB), vline(OX1 - 5, SPR, OB)]
    p.path(''.join(rv), 'dt')
    # the fanlight: its glazing bars, radiating
    fan = [hline(OX0 + 5, OX1 - 5, SPR)]
    for t in (30, 60, 90, 120, 150):
        c, s = math.cos(math.radians(t)), math.sin(math.radians(t))
        fan.append(line(CX + 10 * c, SPR - 10 * s, CX + (R - 5) * c, SPR - (R - 5) * s))
    fan.append(arc(CX, SPR, 10, 180, 0))
    p.path(''.join(fan), 'dt')
    # the light inside: the gap where the right leaf stands open, and its fall across the steps
    DL, DR = OX0 + 5, OX1 - 5
    gx = CX + 6
    p.fill(f'M{n(gx)} {n(SPR)}H{n(DR - 9)}V{n(OB)}H{n(gx)}Z', 'b')
    p.fill(f'M{n(gx)} {n(OB)}H{n(DR - 9)}L{n(DR + 8)} {n(G)}H{n(gx - 4)}Z', 'b')
    # the leaves: the left one shut, with its panels; the right one open into the hall, seen edge-on
    lv = [vline(CX, SPR, OB), rect(DL + 5, SPR + 7, CX - DL - 10, 28), rect(DL + 5, SPR + 42, CX - DL - 10, 30),
          f'M{n(DR)} {n(SPR)}L{n(DR - 9)} {n(SPR + 4)}V{n(OB - 2)}L{n(DR)} {n(OB)}',
          vline(CX - 4, SPR + 38, SPR + 44)]
    p.path(''.join(lv), 'dt')
    # the steps
    st = []
    for top, hw in STEP:
        st.append(f'M{n(CX - hw)} {n(G)}V{n(top)}H{n(CX + hw)}V{n(G)}')
    p.path(''.join(st))
    # clipped trees in stone planters, either side of the door
    tr = []
    for cx in (900.5, 1084.5):
        tr += [rect(cx - 11, 278.5, 22, 18), hline(cx - 13, cx + 13, 278.5), vline(cx, 262.5, 278.5),
               circle(cx, 248.5, 14), arc(cx, 248.5, 9, 140, 60)]
    p.path(''.join(tr))
    # lanterns on the stone, either side of the arch
    ln = []
    for cx in (CX - 76, CX + 76):
        ln += [rect(cx - 4, 170.5, 8, 12), hline(cx - 5, cx + 5, 170.5), vline(cx, 164.5, 170.5), hline(cx - 2, cx + 2, 186.5), vline(cx, 182.5, 186.5)]
    p.path(''.join(ln), 'dt')
    p.fill(rect(CX - 79, 173.5, 6, 7) + rect(CX + 73, 173.5, 6, 7), 'b')
    return p.out


def build():
    groups = []
    start = 4
    for fn in (plan, tower, door):
        out = fn()
        # number each bay's strokes on from where the frame's leave off, a bay at a time
        fixed = []
        k = 0
        for el in out:
            if 'style="--i:' in el:
                fixed.append(re.sub(r'--i:(\d+)', lambda m: f'--i:{start + int(m.group(1))}', el))
                k = max(k, int(re.search(r'--i:(\d+)', el).group(1)))
            else:
                fixed.append(el)
        groups.append('<g>' + ''.join(fixed) + '</g>')
        start += 2
    return '\n        '.join(groups)


if __name__ == '__main__':
    page = ROOT / 'index.html'
    s = page.read_text()
    a = s.index('<svg class="facade"')
    b = s.index('</svg>', a)
    head = s[a:b]
    g = head.index('<g')
    s = s[:a] + head[:g] + build() + '\n      ' + s[b:]
    page.write_text(s)
    print('facade bays written')
