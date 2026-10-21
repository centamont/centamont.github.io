"""Draws the home page's facade (#services) and writes it into index.html, es/index.html and pt/index.html, inside
<svg class="facade">. Run it after changing a drawing here, then tools/version.py and tools/csp.py (the drawing is markup,
not script, so the security policy itself does not change).

One building front of three bays under a shared cornice, on one ground line, and in the bays one building at three
stages, the firm's three practices in order:

  I   Development advisory: the typical floor of the tower, pinned to the drafting sheet before the design is final:
      the balcony's edge and the glass behind it, eight columns, a core of two lifts, a lobby and a stair, four
      residences, each with its door off the lobby and a bedroom in its corner, a dimension string on the column lines,
      a scale bar and a north point in the sheet's title strip. The south-east residence is priced, in bronze.
  II  Sales & marketing: the same tower in elevation, its balconies stepping round it floor by floor, a raked blade
      over the penthouse, the sales pavilion under its long canopy at the foot, and a level rule beside it whose bronze
      length is the floors already sold, which fill in bronze from the ground up.
  III Private clients: the same tower's front door at street level, drawn closer: the canopy on its one column, the
      pavilion's glass and screens, a pair of tall doors with the right leaf open, the light inside falling down the
      two steps to the pavement, and the tower going on up past the top of the bay, cut by a break line.

Each bay is one <g> (the page's CSS lights the bronze in the <g> of the practice in hand, by its position, so the three
stay the only <g> elements in the drawing). Pens, as DESIGN.md sets them: "pf" profile, plain object, "dt" detail,
"hatch" hatch; "w" is poche (cut wall, filled in ink), "k" a solid mark in ink, "b" bronze (what is priced or sold, and
the light), "br" a bronze line. Every stroked path draws itself in order of its --i, profile first; the fills carry the
--i of the last line of their bay, so they come in once their outlines stand.
"""
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
G = 296.5                                           # the bays' floor, where each drawing stands
E = 3.5                                             # how far a balcony stands out past the tower's glass


def n(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s == '-0' else s


class Pen:
    def __init__(self):
        self.out = []
        self.i = 0

    def path(self, d, cls=''):
        c = f' class="{cls}"' if cls else ''
        self.out.append(f'<path{c} style="--i:{self.i}" pathLength="1" d="{d}"/>')
        self.i += 1

    def fill(self, d, cls):
        # a fill comes in with the last line drawn before it
        self.out.append(f'<path class="{cls}" style="--i:{max(self.i - 1, 0)}" d="{d}"/>')


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


def rrect(x0, y0, x1, y1, r):
    """a rectangle with round corners, drawn clockwise from the top edge"""
    return (f'M{n(x0 + r)} {n(y0)}H{n(x1 - r)}A{n(r)} {n(r)} 0 0 1 {n(x1)} {n(y0 + r)}V{n(y1 - r)}'
            f'A{n(r)} {n(r)} 0 0 1 {n(x1 - r)} {n(y1)}H{n(x0 + r)}A{n(r)} {n(r)} 0 0 1 {n(x0)} {n(y1 - r)}'
            f'V{n(y0 + r)}A{n(r)} {n(r)} 0 0 1 {n(x0 + r)} {n(y0)}Z')


# ------------------------------------------------------------------------------------------- the frame and the cornice
def frame():
    """The ground and the building's front: the plinth on its line of earth, the outer frame, the cornice, the attic
    and the pilasters, each with a plinth block and a cap, between the bays."""
    out = ['<rect class="lt" x="23" y="59" width="369" height="237"/><rect class="lt" x="408" y="59" width="384" height="237"/>'
           '<rect class="lt" x="808" y="59" width="369" height="237"/>']
    out.append('<path class="pf" style="--i:0" pathLength="1" d="M0 310.5H1200M8 296.5H1192"/>')
    # the earth, in two halves so a phone can keep one of them
    marks = [f'M{x} 311l-9 9' for x in range(12, 1200, 16)]
    out.append(f'<path class="hatch" style="--i:1" pathLength="1" d="{"".join(marks[0::2])}"/>')
    out.append(f'<path class="hatch alt" style="--i:1" pathLength="1" d="{"".join(marks[1::2])}"/>')
    out.append('<path class="pf" style="--i:1" pathLength="1" d="M8.5 310V46.5H1191.5V310M8 58.5H1192"/>')
    d = 'M8 44.5H1192M8 42.5H1192M0 34.5H1200V28.5H0ZM2 26.5H1198M40 26.5V16.5H1160V26.5M40 18.5H1160'
    out.append(f'<path class="ent" style="--i:2" pathLength="1" d="{d}"/>')
    attic = [f'M{x} 18.5V26.5' for x in (400, 800)] + [rect(x, 20.5, w, 4) for x, w in ((48, 344), (408, 384), (808, 344))]
    out.append(f'<path class="ent dt" style="--i:3" pathLength="1" d="{"".join(attic)}"/>')
    dent = ''.join(f'M{x} 40.5h4v-6h-4Z' for x in range(12, 1190, 8))
    out.append(f'<path class="ent dt dent" style="--i:3" pathLength="1" d="{dent}"/>')
    pil = []
    for a, b in ((8.5, 22.5), (392.5, 407.5), (792.5, 807.5), (1177.5, 1191.5)):
        pil += [vline(x, 58.5, G) for x in (a, b) if x not in (8.5, 1191.5)]
        # a plinth block at the foot and a cap under the architrave, a little wider than the shaft
        x0, x1 = max(a - 2, 8.5), min(b + 2, 1191.5)
        pil += [hline(x0, x1, 286.5), hline(x0, x1, 64.5), hline(x0, x1, 62.5)]
        pil += [vline(x0, 286.5, G) if x0 > 8.5 else '', vline(x1, 286.5, G) if x1 < 1191.5 else '']
    out.append(f'<path class="dt" style="--i:3" pathLength="1" d="{"".join(pil)}"/>')
    return '\n        '.join(out)


# ---------------------------------------------------------------------------------------- I: the typical floor, on paper
def plan():
    p = Pen()
    CX, CY = 207.5, 171.5                             # the plan's centre
    SX0, SY0, SX1, SY1 = 87.5, 78.5, 327.5, 284.5   # the sheet
    TS = 266.5                                      # the title strip's top
    # the sheet first, pinned at its two top corners, with its title strip along the foot
    p.path(rect(SX0, SY0, SX1 - SX0, SY1 - SY0) + hline(SX0, SX1, TS) + vline(287.5, TS, SY1), 'dt')
    # the floor plate: the balcony's edge in the profile pen, the glass a step inside it
    BX0, BY0, BX1, BY1, BR = 109.5, 105.5, 305.5, 237.5, 40
    GI = 7
    GX0, GY0, GX1, GY1 = BX0 + GI, BY0 + GI, BX1 - GI, BY1 - GI
    p.path(rrect(BX0, BY0, BX1, BY1, BR), 'pf')
    p.path(rrect(GX0, GY0, GX1, GY1, BR - GI))
    # the core: two lifts, the lobby between, the stair
    KX0, KX1, KY0, KY1 = 177.5, 237.5, 157.5, 185.5
    LX, SX = 195.5, 219.5
    core = [rect(KX0 + 3, KY0 + 3, LX - KX0 - 4.5, (KY1 - KY0) / 2 - 3.5),
            rect(KX0 + 3, CY + .5, LX - KX0 - 4.5, (KY1 - KY0) / 2 - 3.5)]
    for y0 in (KY0 + 3, CY + .5):
        y1 = y0 + (KY1 - KY0) / 2 - 3.5
        core += [line(KX0 + 3, y0, LX - 1.5, y1), line(LX - 1.5, y0, KX0 + 3, y1)]
    for k in range(10):
        core.append(vline(SX + 2 + k * 1.6, KY0 + 3, KY1 - 3))
    core.append(hline(SX + 1.5, KX1 - 2.5, CY))
    p.path(''.join(core), 'dt')
    # four residences, a door to each off the lobby, a bedroom in each corner with its own door
    rooms, doors = [], []
    for sx, sy in ((1, 1), (-1, 1), (1, -1), (-1, -1)):
        X = lambda x: CX + sx * (x - CX)
        Y = lambda y: CY + sy * (y - CY)
        sw = 0 if sx * sy > 0 else 1
        # the bedroom: its wall from the glass to a door, then along to the glass on the other side
        rooms.append(f'M{n(X(156.5))} {n(Y(GY0))}V{n(Y(130.5))}')
        rooms.append(f'M{n(X(GX0))} {n(Y(144.5))}H{n(X(156.5))}V{n(Y(142.5))}')
        doors.append(f'M{n(X(156.5))} {n(Y(130.5))}H{n(X(144.5))}'
                     f'A12 12 0 0 {1 - sw} {n(X(156.5))} {n(Y(142.5))}')
        # the entry, off the lobby's north or south wall
        doors.append(f'M{n(X(198.5))} {n(Y(KY0))}V{n(Y(KY0 - 7))}A7 7 0 0 {sw} {n(X(205.5))} {n(Y(KY0))}')
    p.path(''.join(rooms), 'dt')
    p.path(''.join(doors), 'dt')
    # the dimension string over the north front, on the column lines
    xs = [BX0, 140.5, CX, 274.5, BX1]
    dim = [hline(BX0 - 5, BX1 + 5, 97.5)] + [vline(x, 93.5, 102.5) for x in xs]
    dim += [line(x - 2.5, 100, x + 2.5, 95) for x in xs]
    # and over it the column grid, a bubble at the head of each line
    dim += [circle(x, 87.5, 3.5) + vline(x, 91, 93.5) for x in xs[1:-1]]
    p.path(''.join(dim), 'dt')
    # the title strip: a scale bar in four parts, and the north point
    p.path(rect(99.5, 273.5, 64, 4) + ''.join(vline(x, 273.5, 277.5) for x in (115.5, 131.5, 147.5)) + circle(307.5, 275.5, 5.5)
           + 'M307.5 268.5L310 279L307.5 277L305 279Z', 'dt')
    p.path(circle(SX0 + 6, SY0 + 6, 1.6) + circle(SX1 - 6, SY0 + 6, 1.6), 'dt')
    # the priced residence, the south-east, in bronze; then the cut: core walls, demising walls and the columns
    p.fill(f'M{n(CX + 1.25)} {n(KY1 + 1.25)}V{n(GY1)}H{n(GX1 - (BR - GI))}A{n(BR - GI)} {n(BR - GI)} 0 0 0 {n(GX1)} {n(GY1 - (BR - GI))}'
           f'V{n(CY + 1.25)}H{n(KX1 + 1.25)}V{n(KY1 + 1.25)}Z', 'b')
    # the lobby's doors are gaps in its north and south walls
    w = [rect(KX0, KY0, 21, 2.5), rect(205.5, KY0, 4, 2.5), rect(216.5, KY0, KX1 - 216.5, 2.5),
         rect(KX0, KY1 - 2.5, 21, 2.5), rect(205.5, KY1 - 2.5, 4, 2.5), rect(216.5, KY1 - 2.5, KX1 - 216.5, 2.5),
         rect(KX0, KY0, 2.5, KY1 - KY0), rect(KX1 - 2.5, KY0, 2.5, KY1 - KY0), rect(LX - 1.5, KY0, 1.5, KY1 - KY0),
         rect(SX, KY0, 1.5, KY1 - KY0), rect(KX0, CY - .75, LX - KX0, 1.5)]
    w += [rect(CX - 1.6, GY0, 3.2, KY0 - GY0), rect(CX - 1.6, KY1, 3.2, GY1 - KY1),
          rect(GX0, CY - 1.6, KX0 - GX0, 3.2), rect(KX1, CY - 1.6, GX1 - KX1, 3.2)]
    for x in (140.5, CX, 274.5):
        for y in (GY0 + 2.5, GY1 - 2.5):
            w.append(rect(x - 3, y - 3, 6, 6))
    for x in (GX0 + 2.5, GX1 - 2.5):
        w.append(rect(x - 3, CY - 3, 6, 6))
    p.fill(''.join(w), 'w')
    p.fill(rect(99.5, 273.5, 16, 4) + rect(131.5, 273.5, 16, 4) + 'M307.5 268.5L310 279L307.5 277Z', 'k')
    return p.out


# ----------------------------------------------------------------------------------------------------- II: the tower
FLOORS = 28                                         # the tower's floors, canopy to roof


def half(t):
    """the tower's half width at height t (0 at the canopy, 1 at the roof), at the tower bay's scale: it rises straight,
    then opens a little toward the crown"""
    return 28 + 3 * t ** 3


def side(cx, ys, dt, off, sign, scale=1, frac=1):
    """the points of one side of the tower, floor by floor (sign -1 the west, 1 the east), a distance off the glass,
    or a fraction of the way out to it"""
    return [(cx + sign * scale * (frac * half(k * dt) + off), y) for k, y in enumerate(ys)]


def poly(pts, close=False):
    return 'M' + 'L'.join(f'{n(x)} {n(y)}' for x, y in pts) + ('Z' if close else '')


def tower():
    p = Pen()
    CX = 600
    CT = 262.5                                      # the canopy's top, where the shaft starts
    FH = 6
    TOP = CT - FLOORS * FH                          # the roof
    floors = [CT - FH * k for k in range(FLOORS + 1)]
    dt = 1 / FLOORS
    sold = 16
    hw = lambda y: half((CT - y) / (CT - TOP))
    # the silhouette first: the balconies' edges, one band a floor, up to the roof
    p.path(poly(side(CX, floors, dt, E, -1) + side(CX, floors, dt, E, 1)[::-1]), 'pf')
    # the canopy, cantilevered past the pavilion, and the pavilion's glass under it
    p.path(rect(494, CT, 222, 4) + f'M516 {n(G)}V{n(CT + 4)}M684 {n(CT + 4)}V{n(G)}', '')
    # the slabs: a balcony's edge each floor; the glass a step behind it, and two mullions dividing it in thirds
    p.path(''.join(hline(CX - hw(y) - E, CX + hw(y) + E, y) for y in floors[1:-1]), 'dt')
    p.path(poly(side(CX, floors, dt, 0, -1)) + poly(side(CX, floors, dt, 0, 1))
           + poly(side(CX, floors[:-2], dt, 0, -1, frac=1 / 3)) + poly(side(CX, floors[:-2], dt, 0, 1, frac=1 / 3)), 'dt')
    # the crown: a penthouse of glass under a raked blade, which reaches out over the east side
    W = hw(TOP)
    BL, BR_ = (CX - W - 8, TOP - 8), (CX + W + 26, TOP - 30)
    def under(x):
        return BL[1] + (BR_[1] - BL[1]) * (x - BL[0]) / (BR_[0] - BL[0])
    p.path(f'M{n(BL[0])} {n(BL[1])}L{n(BR_[0])} {n(BR_[1])}'
           f'Q{n((BL[0] + BR_[0]) / 2 + 6)} {n((BL[1] + BR_[1]) / 2 - 9)} {n(BL[0])} {n(BL[1])}Z')
    p.path(''.join(vline(CX + f * (W - 4), TOP, under(CX + f * (W - 4))) for f in (-1, -.6, -.2, .2, .6, 1)), 'dt')
    # the pavilion: its mullions, a screen of slats on the west, the door in the middle
    pv = [vline(x, CT + 4, G) for x in range(532, 684, 16)] + [hline(516, 684, CT + 12)]
    pv += [vline(x, CT + 12, G) for x in range(519, 548, 4)]
    pv += [rect(CX - 9, CT + 14, 18, G - CT - 14), vline(CX, CT + 14, G)]
    p.path(''.join(pv), 'dt')
    # the level rule on the west: a tick a floor, longer every fifth; its bronze length is the floors sold
    RX = 532.5
    lr = [vline(RX, CT, TOP)] + [hline(RX - (6 if k % 5 == 0 else 3), RX, y) for k, y in enumerate(floors)]
    p.path(''.join(lr), 'dt')
    sy = CT - sold * FH
    p.path(f'M{n(RX + 2.5)} {n(CT)}V{n(sy)}M{n(RX)} {n(sy)}H{n(RX + 5)}M{n(RX)} {n(CT)}H{n(RX + 5)}', 'br')
    # the floors sold, in bronze, from the canopy up, between the glass on either side
    up = floors[:sold + 1]
    p.fill(poly(side(CX, up, dt, 0, -1) + side(CX, up, dt, 0, 1)[::-1], True), 'b')
    return p.out


# ------------------------------------------------------------------------------------------------ III: the front door
def door():
    p = Pen()
    CX = 992.5
    S = 2.2                                         # this bay is drawn 2.2 times closer than the tower's
    CT, CB = 150.5, 158.5                           # the canopy, top and soffit: a lobby two storeys high
    FL = 282.5                                      # the lobby's floor, two steps up from the pavement
    TOPB = 59                                       # the bay's top: the tower runs on past it, out of the picture
    dt = 1 / FLOORS
    ys = [CT - 6 * S * k for k in range(9) if CT - 6 * S * k > TOPB] + [TOPB]
    # the silhouette: the tower's balcony edges, up and out of the bay, then the canopy, its one column, the lobby's ends
    west, east = side(CX, ys, dt, E, -1, S), side(CX, ys, dt, E, 1, S)
    p.path(poly(west) + poly(east), 'pf')
    p.path(rect(836, CT, 312, CB - CT) + vline(1138.5, CB, G) + f'M862 {n(G)}V{n(CB)}M1123 {n(CB)}V{n(G)}', 'pf')
    # the tower's slabs, its glass and mullions
    p.path(''.join(hline(a[0], b[0], a[1]) for a, b in zip(west[1:-1], east[1:-1]))
           + ''.join(poly(side(CX, ys, dt, 0, sg, S, frac)) for sg in (-1, 1) for frac in (1, 1 / 3)), 'dt')
    # the lobby's front: a transom, mullions, a screen of slats either side, the canopy's soffit
    TR, DT = 176.5, 194.5                           # the transom, the doors' head
    pv = [hline(862, 1123, TR), hline(840, 1144, CB - 1), hline(862, 1123, FL)]
    pv += [vline(x, CB, FL) for x in (891, 920, 1065, 1094)]
    p.path(''.join(pv), 'dt')
    # the screens of slats either side (a phone leaves them out: at that size they close into a solid)
    p.path(''.join(vline(x, TR + 4, FL - 2) for a, b in ((864, 918), (1067, 1121)) for x in range(a, b, 4)), 'dt fine')
    # the doors in a stone portal, two tall leaves, the left one shut with its long pull, the right one open into the hall,
    # and a bronze sconce either side
    DL, DR = CX - 30, CX + 30
    dr = [rect(DL - 12, DT - 14, DR - DL + 24, FL - DT + 14), rect(DL - 3, DT - 4, DR - DL + 6, FL - DT + 4),
          vline(CX, DT, FL), rect(DL + 3, DT + 4, CX - DL - 6, FL - DT - 8), rect(CX - 8, DT + 30, 2, 36),
          f'M{n(DR)} {n(DT)}L{n(DR - 10)} {n(DT + 5)}V{n(FL - 5)}L{n(DR)} {n(FL)}']
    p.path(''.join(dr))
    sc = []
    for x in (DL - 21, DR + 21):
        sc += [rect(x - 3, DT + 14, 6, 14), vline(x, DT + 10, DT + 14)]
    p.path(''.join(sc), 'dt')
    # two steps down to the pavement, and a planter either side of them
    st = [f'M{n(CX - 58)} {n(G)}V{n(289.5)}H{n(CX + 58)}V{n(G)}', f'M{n(CX - 50)} {n(289.5)}V{n(FL)}H{n(CX + 50)}V{n(289.5)}']
    for x0 in (872, 1069):
        # a long stone planter, and the clipped hedge in it
        st += [rect(x0, 282.5, 44, 14), rrect(x0 + 2, 274.5, x0 + 42, 282.5, 4)]
    p.path(''.join(st), 'dt')
    # the light inside, through the open leaf, then down each step's face, spreading as it falls, stopping at the pavement
    p.fill(f'M{n(CX + 1)} {n(DT)}H{n(DR - 10)}V{n(FL)}H{n(CX + 1)}Z' + rect(DL - 23, DT + 15, 4, 12) + rect(DR + 19, DT + 15, 4, 12), 'b')
    p.fill(f'M{n(CX - 2)} {n(FL)}H{n(DR - 2)}L{n(DR + 4)} 289.5H{n(CX - 6)}Z'
           f'M{n(CX - 7)} 289.5H{n(DR + 5)}L{n(DR + 11)} {n(G)}H{n(CX - 11)}Z', 'b')
    return p.out


def build():
    groups = []
    start = 4
    for fn in (plan, tower, door):
        fixed = [re.sub(r'--i:(\d+)', lambda m: f'--i:{start + int(m.group(1))}', el) for el in fn()]
        groups.append('<g>' + ''.join(fixed) + '</g>')
        start += 2
    return '\n        '.join(groups)


if __name__ == '__main__':
    body = frame() + '\n        ' + build() + '\n      '
    for name in ('index.html', 'es/index.html', 'pt/index.html'):
        page = ROOT / name
        s = page.read_text()
        a = s.index('>', s.index('<svg class="facade"')) + 1
        b = s.index('</svg>', a)
        page.write_text(s[:a] + '\n        ' + body + s[b:])
        print(name, 'facade written')
