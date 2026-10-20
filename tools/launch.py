"""Draws "A launch, step by step" on the two open market pages and their Spanish and Portuguese twins, and writes it into
each page's <figure class="mk-lfig">. Run it after changing a drawing or a word here (the drawing is markup, not script,
so the page's security policy does not change).

The figure is five frames of one site, the same street behind it in each, numbered as the list under it. Pens and line
types follow DESIGN.md: "pr" profile, "ob" object, "dt" detail, "hat" hatch; "hid" hidden line for what is planned. Bronze
marks only what is committed, the floors sold, filled from the ground up whether or not they are built yet; what stands
is ink. Ticks on a frame's rule are weekly reports. Each frame is its own small drawing, so on a phone the five stack as
rows with their words beside them.

  New York        1 offering plan drafted, nothing sold; 2 plan accepted, sales gallery open; 3 fifteen percent sold, plan
                  effective, foundations in; 4 the building rising under a crane; 5 finished, closings begun, one floor
                  still the sponsor's.
  South Florida   1 pricing set, refundable reservations (not bronze: not committed); 2 documents filed, contracts signed;
                  3 the building rising under a crane; 4 finished, closings; 5 every floor sold, the owners' association.
"""
import math
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FLOOR = 5           # one floor, in drawing units
GROUND = 140
LEVELS = 18         # floors 1 and 2 are the podium
L, R = 49, 79       # the shaft
PL, PR = 43, 85     # the podium
MAST = 96           # the crane's mast, 4 wide, clear of the podium


def n(v):
    s = f'{v:.1f}'.rstrip('0').rstrip('.')
    return '0' if s == '-0' else s


def top(k):
    return GROUND - FLOOR * k


def outline(k):
    """The building's edge up to floor k, as one closed path (with the open crown once it is whole)."""
    y = top(min(k, LEVELS))
    if k <= 2:
        return f'M{PL} {GROUND}V{n(y)}H{PR}V{GROUND}'
    d = f'M{PL} {GROUND}V{top(2)}H{L}V{n(y)}'
    if k >= LEVELS:
        d += f'H53V42H55V34H73V42H75V{n(y)}'
    return d + f'H{R}V{top(2)}H{PR}V{GROUND}'


def block(k0, k1):
    """The area of floors k0+1..k1, for the bronze."""
    if k1 <= 2:
        return f'M{PL} {top(k0)}V{top(k1)}H{PR}V{top(k0)}Z'
    if k0 >= 2:
        return f'M{L} {top(k0)}V{top(k1)}H{R}V{top(k0)}Z'
    return f'M{PL} {top(k0)}V{top(2)}H{PR}V{top(k0)}Z' + block(2, k1)


def floors(k0, k1):
    d = ''
    for k in range(k0 + 1, k1):
        w = (PL, PR) if k <= 2 else (L, R)
        d += f'M{w[0]} {top(k)}H{w[1]}'
    return d


def balconies(k):
    """The balcony slabs of the enclosed floors, reaching out more or less floor by floor on each side, with their edges
    joined in one line, so the shaft carries the same slow wave as the tower on the home page."""
    if k < 3:
        return ''
    stubs, lt, rt = '', [], []
    for f in range(3, k + 1):
        y = top(f)
        wl = 2.2 + 2 * math.sin(f * .55)
        wr = 2.2 + 2 * math.sin(f * .55 + math.pi * .85)
        stubs += f'M{n(L - wl)} {y}H{L}M{R} {y}H{n(R + wr)}'
        lt.append(f'{n(L - wl)} {y}')
        rt.append(f'{n(R + wr)} {y}')
    return stubs, 'M' + 'L'.join(lt) + 'M' + 'L'.join(rt)


def crane(t):
    """A tower crane: lattice mast, jib out over the building, counter-jib and weight, tower head and ties, hook."""
    a, b = MAST, MAST + 4
    lat = ''
    y, s = GROUND, 0
    while y - 4 > t:
        lat += f'M{a if s else b} {y}L{b if s else a} {y - 4}'
        y -= 4
        s ^= 1
    jib = f'M38 {t}H{a}M38 {t - 2}H{a}M38 {t}V{t - 2}'
    x, s = 38, 0
    while x + 4 <= a:
        jib += f'M{x} {t if s else t - 2}L{x + 4} {t - 2 if s else t}'
        x += 4
        s ^= 1
    cj = f'M{b} {t}H114M{b} {t - 2}H114V{t}'
    head = f'M{a + 2} {t - 2}V{t - 11}L52 {t - 2}M{a + 2} {t - 11}L114 {t - 2}'
    hook = f'M60 {t}V{t + 11}M60 {t + 13.4}v1q0 2 -1.6 1.6'
    halo = f'<path class="halo" d="M38 {t - 1}H114{head}"/>'
    return (halo + f'<path class="dt" d="{lat}{jib}"/>'
            + f'<path class="ob" d="M{a} {GROUND}V{t}M{b} {GROUND}V{t}{cj}{head}"/>'
            + f'<path class="dt" d="{hook}"/><path class="cw" d="M108 {t}h6v5h-6ZM58.8 {t + 11}h2.4v2.4h-2.4Z"/>'
            + f'<path class="ob" d="M{b} {t}h4v4h-4"/>')


def gallery():
    """The sales gallery: a glass pavilion under a thin roof, left of the site."""
    mull = ''.join(f'M{n(x)} 131V{GROUND}' for x in (10.5, 15, 19.5, 24))
    return (f'<path class="ko" d="M6 131H28V{GROUND}H6Z"/>'
            f'<path class="ob" d="M4 129H30M4 131H30M6 131V{GROUND}M28 131V{GROUND}"/><path class="dt" d="{mull}"/>')


def tree(x, h, palm):
    if palm:
        tx, ty = x + 1.5, GROUND - h
        fr = ''.join(f'M{n(tx)} {n(ty)}q{dx} {dy} {ex} {ey}' for dx, dy, ex, ey in
                     ((-3, -2, -6, 2), (3, -2, 6, 2), (-2, -3, -4.5, -1), (2, -3, 4.5, -1), (-4, 0, -6, 4.5), (4, 0, 6, 4.5)))
        return f'<path class="dt" d="M{x} {GROUND}q1.5 {-h / 2} {1.5} {-h}{fr}"/>'
    r = h * .32
    cy = GROUND - h + r
    return (f'<path class="dt" d="M{x} {GROUND}V{n(cy + r * .6)}"/>'
            f'<ellipse class="tr" cx="{x}" cy="{n(cy)}" rx="{n(r * .85)}" ry="{n(r)}"/>')


BACK = {
    'ny': 'M4 118V100H8V80H10V72H14V66H16V72H20V80H22V100H28V90H35V108H46V114H82V104H90V112H103V74H105V64H106.5V56H108'
          'V64H110V74H112V96H119V104H124V118',
    'fl': 'M4 118V108H6V78Q9.5 72 13 78V108H18V92H26V112H44V116H84V100H91V110H101V70Q106 63 111 70V104H118V96H124V118',
}


def frame(m, s):
    """One frame: m is the market, s the step's state."""
    k, sold = s['built'], s['sold']
    o = [f'<path class="bk" d="{BACK[m]}"/>']
    o.append(f'<path class="ko" d="{outline(LEVELS)}Z"/>')
    o.append(f'<path class="hid" d="{outline(LEVELS)}M53 42H75M61 34V42M67 34V42"/>')
    if k:
        o.append(f'<path class="ko" d="{outline(k)}Z"/>')
    if sold:
        o.append(f'<path class="sold" d="{block(0, sold)}"/>')
        if sold > k:
            o.append(f'<path class="sl" d="{floors(k, sold)}"/>')
    if k:
        shell = s.get('shell', k)
        o.append(f'<path class="dt fl" d="{floors(0, shell)}"/>')
        if shell < k:   # the top floors still an open frame: slabs and columns, no facade yet
            cols = ''.join(f'M{x} {top(shell)}V{top(k)}' for x in (59, 69))
            o.append(f'<path class="dt" d="{floors(shell - 1, k)}{cols}"/>')
        if shell >= 3:
            stubs, edge = balconies(shell)
            o.append(f'<path class="dt" d="{stubs}"/><path class="ob" d="{edge}"/>')
        o.append(f'<path class="pr" d="{outline(k)}"/>')
        if k >= LEVELS:
            o.append('<path class="dt" d="M53 42H75M61 34V42M67 34V42"/>')
    if s.get('canopy'):
        o.append(f'<path class="dt" d="M57 133.5H71M58 133.5V140M70 133.5V140"/>')
    if s.get('crane'):
        o.append(crane(top(k) - 14))
    if s.get('gallery'):
        o.append(gallery())
    for x, h in s.get('trees', ()):
        o.append(tree(x, h, m == 'fl'))
    hat = ''.join(f'M{x} 149L{x + 9} {GROUND}' for x in range(2, 120, 12))
    o.append(f'<path class="hat" d="{hat}"/><path class="pr" d="M0 {GROUND}H128"/>')
    rule = 'M0 158H128M0.5 154V162M127.5 154V162'
    o.append(f'<path class="ob" d="{rule}"/>')
    if s.get('weeks'):
        o.append('<path class="wk" d="' + ''.join(f'M{x} 154V158' for x in range(4, 125, 4)) + '"/>')
    return f'<svg viewBox="0 16 128 150" aria-hidden="true" focusable="false">{"".join(o)}</svg>'


STEPS = {
    'ny': [
        dict(built=0, sold=0),
        dict(built=0, sold=1, gallery=True, weeks=True),
        dict(built=2, sold=3, gallery=True, crane=True, weeks=True),
        dict(built=12, shell=10, sold=11, gallery=True, crane=True, weeks=True),
        dict(built=18, sold=17, canopy=True, trees=((22, 15), (104, 16), (117, 13))),
    ],
    'fl': [
        dict(built=0, sold=0),
        dict(built=0, sold=3, gallery=True, weeks=True),
        dict(built=11, shell=9, sold=12, gallery=True, crane=True, weeks=True),
        dict(built=18, sold=16, canopy=True, weeks=True, trees=((24, 9), (104, 10))),
        dict(built=18, sold=18, canopy=True, trees=((24, 15), (104, 17), (116, 13))),
    ],
}

WORDS = {
    ('ny', 'en'): ['Offering plan drafted', 'Plan accepted, sales open', '15% sold, plan effective',
                   'Construction, weekly reports', 'Closings begin'],
    ('ny', 'es'): ['Plan de oferta redactado', 'Plan aceptado, ventas abiertas', '15% vendido, plan vigente',
                   'Construcción, informes semanales', 'Comienzan los cierres'],
    ('ny', 'pt'): ['Plano de oferta redigido', 'Plano aceito, vendas abertas', '15% vendido, plano em vigor',
                   'Obra, relatórios semanais', 'Começam os fechamentos'],
    ('fl', 'en'): ['Pricing set, reservations', 'Documents filed, contracts signed', 'Construction, weekly reports',
                   'Certificate of occupancy, closings', 'Owners take the association'],
    ('fl', 'es'): ['Precios definidos, reservas', 'Documentos registrados, contratos firmados',
                   'Construcción, informes semanales', 'Certificado de ocupación, cierres',
                   'Los propietarios reciben la asociación'],
    ('fl', 'pt'): ['Preços definidos, reservas', 'Documentos registrados, contratos assinados', 'Obra, relatórios semanais',
                   'Habite-se, fechamentos', 'Os proprietários assumem a associação'],
}

LABEL = {
    ('ny', 'en'): 'The launch in five frames of one site. 1, the offering plan drafted, nothing sold. 2, the plan accepted '
                  'and sales open in a sales gallery. 3, 15 percent sold, the plan effective and the foundations in. '
                  '4, the building rising under a crane, most floors sold. 5, the building finished and closings begun, '
                  'all but one floor sold. A weekly report runs from the opening of sales through construction.',
    ('ny', 'es'): 'El lanzamiento en cinco escenas de un mismo solar. 1, el plan de oferta redactado, nada vendido. 2, el '
                  'plan aceptado y las ventas abiertas en una galería de ventas. 3, el 15 por ciento vendido, el plan '
                  'vigente y los cimientos hechos. 4, el edificio se levanta bajo una grúa, con la mayoría de los pisos '
                  'vendidos. 5, el edificio terminado y los cierres comenzados, todos los pisos vendidos menos uno. Un '
                  'informe semanal acompaña desde la apertura de ventas hasta el final de la obra.',
    ('ny', 'pt'): 'O lançamento em cinco cenas de um mesmo terreno. 1, o plano de oferta redigido, nada vendido. 2, o '
                  'plano aceito e as vendas abertas num stand de vendas. 3, 15 por cento vendido, o plano em vigor e as '
                  'fundações prontas. 4, o edifício sobe sob uma grua, com a maioria dos andares vendidos. 5, o edifício '
                  'pronto e os fechamentos começados, todos os andares vendidos menos um. Um relatório semanal acompanha '
                  'da abertura das vendas até o fim da obra.',
    ('fl', 'en'): 'The launch in five frames of one site. 1, pricing set and refundable reservations taken, nothing sold. '
                  '2, documents filed and the first contracts signed in a sales gallery. 3, the building rising under a '
                  'crane, most floors sold. 4, the building finished, closings under way. 5, every floor sold and the '
                  'owners running the association. A weekly report runs from the opening of sales to completion.',
    ('fl', 'es'): 'El lanzamiento en cinco escenas de un mismo solar. 1, precios definidos y reservas reembolsables, nada '
                  'vendido. 2, documentos registrados y los primeros contratos firmados en una galería de ventas. 3, el '
                  'edificio se levanta bajo una grúa, con la mayoría de los pisos vendidos. 4, el edificio terminado, con '
                  'los cierres en curso. 5, todos los pisos vendidos y la asociación en manos de los propietarios. Un '
                  'informe semanal acompaña desde la apertura de ventas hasta la terminación.',
    ('fl', 'pt'): 'O lançamento em cinco cenas de um mesmo terreno. 1, preços definidos e reservas reembolsáveis, nada '
                  'vendido. 2, documentos registrados e os primeiros contratos assinados num stand de vendas. 3, o '
                  'edifício sobe sob uma grua, com a maioria dos andares vendidos. 4, o edifício pronto, com os '
                  'fechamentos em andamento. 5, todos os andares vendidos e a associação nas mãos dos proprietários. Um '
                  'relatório semanal acompanha da abertura das vendas até a conclusão.',
}

KEY = {
    'en': ('Each step matches the list below. Illustrative, not to scale.',
           ['Planned', 'Built', 'Floors sold', 'Weekly report']),
    'es': ('Cada paso corresponde a la lista de abajo. Ilustrativo, sin escala.',
           ['Previsto', 'Construido', 'Pisos vendidos', 'Informe semanal']),
    'pt': ('Cada passo corresponde à lista abaixo. Ilustrativo, fora de escala.',
           ['Previsto', 'Construído', 'Andares vendidos', 'Relatório semanal']),
}

SWATCH = ['<path class="hid" d="M0 3h28"/>', '<path class="pr" d="M0 3h28"/>',
          '<path class="sold" d="M0 0h28v6H0Z"/>', '<path class="wk" d="M2 1v4M8 1v4M14 1v4M20 1v4M26 1v4"/>']

PAGES = {
    'new-york.html': ('ny', 'en'), 'es/nueva-york.html': ('ny', 'es'), 'pt/nova-york.html': ('ny', 'pt'),
    'south-florida.html': ('fl', 'en'), 'es/sur-de-florida.html': ('fl', 'es'), 'pt/sul-da-florida.html': ('fl', 'pt'),
}


def figure(m, lang):
    cap, keys = KEY[lang]
    steps = ''.join(f'<div>{frame(m, s)}<p><span class="n">{i}</span><span class="f">{w}</span></p></div>'
                    for i, (s, w) in enumerate(zip(STEPS[m], WORDS[(m, lang)]), 1))
    key = ''.join(f'<span><svg viewBox="0 0 28 6">{sw}</svg>{k}</span>' for sw, k in zip(SWATCH, keys))
    return (f'<figure class="mk-lfig"><div class="lsq" role="img" aria-label="{LABEL[(m, lang)]}">{steps}</div>'
            f'<figcaption class="cap"><span>{cap}</span><span class="key" aria-hidden="true">{key}</span></figcaption></figure>')


def main():
    for page, (m, lang) in PAGES.items():
        p = ROOT / page
        s = p.read_text()
        s2, c = re.subn(r'<figure class="mk-lfig">.*?</figure>', lambda _: figure(m, lang), s, count=1, flags=re.S)
        if not c:
            raise SystemExit(f'{page}: no <figure class="mk-lfig">')
        if s2 != s:
            p.write_text(s2)
            print('wrote', page)


if __name__ == '__main__':
    main()
