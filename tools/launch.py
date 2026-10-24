"""Draws "A launch, step by step" on the two open market pages and their Spanish and Portuguese twins, and on the Austin
page, and writes it into each page's <figure class="mk-lfig">. Run it after changing a drawing or a word here (the
drawing is markup, not script, so the page's security policy does not change).

The figure is one site on one street, seen at the five steps of the list under it, numbered alike. The frames stand
edge to edge, so the ground, the street behind and the time rule run on unbroken from the first to the last; the long
step (construction) takes a double frame, as it takes the most time. Three pens, as DESIGN.md sets them: "pr" profile
(the ground and what stands), "ob" object (the planned building, the crane, the rule), "dt" detail (floors, mullions,
the street behind, the crane's lattice, the hatch). Hidden line is what is planned; continuous is what stands. Bronze
marks only what is committed: the residences under contract, each in its place in the stacking plan, sold off the plan
before they are built, upper floors first; the ones still ivory at the end are the sponsor's. Ticks on the rule are
weekly reports, in the step the list gives them. On a phone the street runs sideways under the finger, a frame at a time.

  New York        1 offering plan drafted; 2 accepted, sales open; 3 fifteen percent under contract, plan effective,
                  foundations in; 4 the building rising under a crane; 5 finished, closings begun, a few residences
                  still the sponsor's.
  South Florida   1 pricing set, refundable reservations (not bronze: not committed); 2 documents filed, contracts
                  signed; 3 the building rising under a crane; 4 finished, closings; 5 the owners take the association.
  Texas (Austin)  1 documents prepared, prices set; 2 the information statement delivered, contracts signed; 3 the
                  building rising under a crane, deposits in escrow; 4 finished, closings. Four steps, so five columns.
"""
import random
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

FLOOR = 5           # one floor, in drawing units
GROUND = 140
LEVELS = 18         # floors 1 and 2 are the podium (lobby and amenities, not sold); 3 to 18 hold three residences each
L, R = 49, 79       # the shaft, about x = 64
PL, PR = 43, 85     # the podium
W1 = 128            # a frame's width; a double frame is twice it
UNITS = [(f, u) for f in range(3, LEVELS + 1) for u in range(3)]


def n(v):
    s = f'{v:.2f}'.rstrip('0').rstrip('.')
    return '0' if s == '-0' else s


def top(k):
    return GROUND - FLOOR * k


def outline(k):
    """The building's edge up to floor k (with the crown once it is whole), as one path open at the ground."""
    y = top(min(k, LEVELS))
    if k <= 2:
        return f'M{PL} {GROUND}V{n(y)}H{PR}V{GROUND}'
    d = f'M{PL} {GROUND}V{top(2)}H{L}V{n(y)}'
    if k >= LEVELS:
        d += f'H53V42H55V34H73V42H75V{n(y)}'
    return d + f'H{R}V{top(2)}H{PR}V{GROUND}'


def floors(k0, k1):
    d = ''
    for k in range(k0 + 1, k1):
        w = (PL, PR) if k <= 2 else (L, R)
        d += f'M{w[0]} {top(k)}H{w[1]}'
    return d


def order(m):
    """The order the residences go under contract: upper floors and corners first, with some chance in it, the same
    order at every step, so a residence once sold stays sold."""
    rnd = random.Random(m)
    score = {fu: fu[0] / LEVELS * .7 + (.12 if fu[1] != 1 else 0) + rnd.random() * .45 for fu in UNITS}
    return sorted(UNITS, key=lambda fu: -score[fu])


def sold(m, share):
    d = ''
    for f, u in order(m)[:round(share * len(UNITS))]:
        x = L + u * 10
        d += f'M{n(x + .7)} {n(top(f) + .7)}h8.6v3.6h-8.6Z'
    return d


def crane(t):
    """A tower crane beside the building, climbed above its crown: lattice mast, jib out over the roof, counter-jib and
    its weight, tower head and ties. Its jib at t clears the planned crown, so nothing crosses the building."""
    a, b = 96, 100
    lat, y, s = '', GROUND, 0
    while y - 5 > t:
        lat += f'M{a if s else b} {y}L{b if s else a} {y - 5}'
        y -= 5
        s ^= 1
    jib = f'M38 {t}H{a}M38 {t - 2.5}H{a}M38 {t}V{t - 2.5}'
    x, s = 38, 0
    while x + 5 <= a:
        jib += f'M{x} {t if s else t - 2.5}L{x + 5} {t - 2.5 if s else t}'
        x += 5
        s ^= 1
    head = f'M98 {t - 2.5}V{t - 12}L52 {t - 2.5}M98 {t - 12}L114 {t - 2.5}'
    return (f'<path class="dt" d="{lat}{jib}"/>'
            f'<path class="ob" d="M{a} {GROUND}V{t}M{b} {GROUND}V{t}M{b} {t}H114M{b} {t - 2.5}H114V{t}{head}'
            f'M108 {t}v5h6v-5M{b} {t}v3.5h4v-3.5"/>')


def street(m, width):
    """The street behind, as one roofline along the whole figure: low blocks, taller ones with setbacks (New York) or
    slender towers with rounded tops (Miami). Kept low behind each tower's frame."""
    rnd = random.Random('street-' + m)
    d, x = [], 0
    while x < width:
        w = rnd.choice((8, 10, 12, 14))
        h = rnd.choice((16, 22, 30, 40)) if rnd.random() > .35 else rnd.choice((6, 10))
        d.append((x, x + w, h))
        x += w + rnd.choice((0, 1, 3))
    return d


def roofline(m, blocks, x0, x1):
    path = ''
    for a, b, h in blocks:
        if b <= x0 or a >= x1:
            continue
        a2, b2, ty, foot = max(a, x0) - x0, min(b, x1) - x0, GROUND - 22 - h, GROUND - 22
        whole = a >= x0 and b <= x1
        if whole and m == 'ny' and h >= 30:
            # a setback: the upper part steps in
            s = (b - a) * .25
            path += f'M{n(a2)} {foot}V{ty + 10}H{n(a2 + s)}V{ty}H{n(b2 - s)}V{ty + 10}H{n(b2)}V{foot}'
        elif whole and m == 'fl' and h >= 30:
            r = (b - a) / 2
            path += f'M{n(a2)} {foot}V{ty + r}Q{n(a2)} {ty} {n((a2 + b2) / 2)} {ty}Q{n(b2)} {ty} {n(b2)} {ty + r}V{foot}'
        else:
            # a block cut by the frame's edge keeps no wall there, so the roofline runs on into the next frame
            path += (f'M{n(a2)} {foot}V{ty}' if a >= x0 else f'M0 {ty}') + f'H{n(b2)}' + (f'V{foot}' if b <= x1 else '')
    return path


def frame(m, s, x0, width, blocks):
    """One frame: m the market, s the step's state, x0 its place along the street."""
    k, cx = s['built'], width * s.get('at', .5)
    dx = cx - 64
    o = [f'<path class="bk" d="{roofline(m, blocks, x0, x0 + width)}"/>']
    g = [crane(24)] if s.get('crane') else []
    g += [f'<path class="ko" d="{outline(LEVELS)}Z"/>', f'<path class="hid" d="{outline(LEVELS)}"/>']
    shell = s.get('shell', k)
    if s['share']:   # the planned floors, faint, so a residence under contract stands in its place
        g.append(f'<path class="dt plan" d="{floors(max(shell, 2), LEVELS + 1)}M59 {top(max(shell, 2))}V{top(LEVELS)}M69 {top(max(shell, 2))}V{top(LEVELS)}"/>')
    if k:
        g.append(f'<path class="ko" d="{outline(k)}Z"/>')
        g.append(f'<path class="dt" d="{floors(0, shell)}M59 {top(2)}V{top(shell)}M69 {top(2)}V{top(shell)}"/>')
        if shell < k:   # the top floors still an open frame: slabs and columns, no facade yet
            g.append(f'<path class="dt" d="{floors(shell - 1, k)}M59 {top(shell)}V{top(k)}M69 {top(shell)}V{top(k)}"/>')
        if k >= LEVELS:
            g.append('<path class="dt" d="M53 42H75M61 34V42M67 34V42M57 133.5H71M58 133.5V140M70 133.5V140"/>')
    if s['share']:
        g.append(f'<path class="sold" d="{sold(m, s["share"])}"/>')
    if k:
        g.append(f'<path class="pr" d="{outline(k)}"/>')
    if s.get('found'):   # the foundations, poured below grade
        g.append(f'<path class="ko" d="M{PL} {GROUND}V148H{PR}V{GROUND}Z"/><path class="pr" d="M{PL} {GROUND}V148H{PR}V{GROUND}"/>')
        g.append(f'<path class="dt" d="M{PL} 144H{PR}M{L} {GROUND}V148M{R} {GROUND}V148"/>')
    if s.get('mark'):
        low = top(min(f for f, u in order(m)[:round(s['share'] * len(UNITS))]))
        g.append(f'<path class="dt" d="M{R + 1} {low}H{R + 5}V{top(LEVELS)}H{R + 8}"/>'
                 f'<text class="thr" x="{R + 10}" y="{top(LEVELS) + 4}">{s["mark"]}</text>')
    o.append(f'<g transform="translate({n(dx)} 0)">{"".join(g)}</g>')
    hat = ''
    for x in range(-((x0 + 4) % 12) + 2 - 12, width + 12, 12):
        a, b = max(x, 0), min(x + 9, width)
        if b > a:
            hat += f'M{n(a)} {n(149 - (a - x))}L{n(b)} {n(149 - (b - x))}'
    o.append(f'<path class="dt hat" d="{hat}"/><path class="pr" d="M-1 {GROUND}H{width + 1}"/>')
    o.append(f'<path class="ob" d="M-1 158H{width + 1}M0.5 153V163"/>')
    if s.get('last'):
        o.append(f'<path class="ob" d="M{width - .5} 153V163"/>')
    if s.get('weeks'):
        o.append('<path class="dt" d="' + ''.join(f'M{x} 154.5V158' for x in range(4, width, 4)) + '"/>')
    return f'<svg viewBox="0 6 {width} 160" aria-hidden="true" focusable="false">{"".join(o)}</svg>'


STEPS = {
    'ny': [
        dict(built=0, share=0),
        dict(built=0, share=.06),
        dict(built=0, share=.15, found=True, mark='15%'),
        dict(built=12, shell=10, share=.6, crane=True, weeks=True, wide=True),
        dict(built=18, share=.92, last=True),
    ],
    'fl': [
        dict(built=0, share=0),
        dict(built=0, share=.3),
        dict(built=11, shell=9, share=.7, crane=True, weeks=True, wide=True),
        dict(built=18, share=.9),
        dict(built=18, share=1, last=True),
    ],
    'tx': [
        dict(built=0, share=0),
        dict(built=0, share=.2),
        dict(built=11, shell=9, share=.65, crane=True, weeks=True, wide=True),
        dict(built=18, share=.9, last=True),
    ],
}

WORDS = {
    ('ny', 'en'): ['Offering plan drafted', 'Plan accepted, sales open', '15% under contract, plan effective',
                   'Construction, weekly reports', 'Closings; the sponsor holds the rest'],
    ('ny', 'es'): ['Plan de oferta redactado', 'Plan aceptado, ventas abiertas', '15% bajo contrato, plan vigente',
                   'Construcción, informes semanales', 'Cierres; el promotor retiene el resto'],
    ('ny', 'pt'): ['Plano de oferta redigido', 'Plano aceito, vendas abertas', '15% sob contrato, plano em vigor',
                   'Obra, relatórios semanais', 'Fechamentos; a incorporadora retém o restante'],
    ('fl', 'en'): ['Pricing set, reservations', 'Documents filed, contracts signed', 'Construction, weekly reports',
                   'Certificate of occupancy, closings', 'Owners take the association'],
    ('fl', 'es'): ['Precios definidos, reservas', 'Documentos registrados, contratos firmados',
                   'Construcción, informes semanales', 'Certificado de ocupación, cierres',
                   'Los propietarios reciben la asociación'],
    ('fl', 'pt'): ['Preços definidos, reservas', 'Documentos registrados, contratos assinados', 'Obra, relatórios semanais',
                   'Habite-se, fechamentos', 'Os proprietários assumem a associação'],
    ('tx', 'en'): ['Documents prepared, prices set', 'Statement first, then contracts', 'Construction, weekly reports',
                   'Closings, no transfer tax'],
}

LABEL = {
    ('ny', 'en'): 'The launch on one site, in five steps along one street. 1, the offering plan drafted, nothing under '
                  'contract. 2, the plan accepted and sales open, the first residences under contract. 3, 15 percent '
                  'under contract, the plan effective and the foundations in. 4, the building rising under a crane, '
                  'more than half the residences under contract, the longest step. 5, the building finished and '
                  'closings begun, with a few residences still the sponsor’s. A weekly report runs through '
                  'construction.',
    ('ny', 'es'): 'El lanzamiento en un mismo solar, en cinco pasos a lo largo de una calle. 1, el plan de oferta '
                  'redactado, nada bajo contrato. 2, el plan aceptado y las ventas abiertas, las primeras residencias '
                  'bajo contrato. 3, el 15 por ciento bajo contrato, el plan vigente y los cimientos hechos. 4, el '
                  'edificio se levanta bajo una grúa, con más de la mitad de las residencias bajo contrato, el paso más '
                  'largo. 5, el edificio terminado y los cierres comenzados, con algunas residencias aún del promotor. '
                  'Un informe semanal acompaña la obra.',
    ('ny', 'pt'): 'O lançamento num mesmo terreno, em cinco passos ao longo de uma rua. 1, o plano de oferta redigido, '
                  'nada sob contrato. 2, o plano aceito e as vendas abertas, as primeiras unidades sob contrato. 3, 15 '
                  'por cento sob contrato, o plano em vigor e as fundações prontas. 4, o edifício sobe sob uma grua, '
                  'com mais da metade das unidades sob contrato, o passo mais longo. 5, o edifício pronto e os '
                  'fechamentos começados, com algumas unidades ainda da incorporadora. Um relatório semanal acompanha '
                  'a obra.',
    ('fl', 'en'): 'The launch on one site, in five steps along one street. 1, pricing set and refundable reservations '
                  'taken, nothing under contract. 2, documents filed and the first contracts signed. 3, the building '
                  'rising under a crane, most residences under contract, the longest step. 4, the building finished and '
                  'closings under way. 5, every residence sold and the owners running the association. A weekly report '
                  'runs through construction.',
    ('fl', 'es'): 'El lanzamiento en un mismo solar, en cinco pasos a lo largo de una calle. 1, precios definidos y '
                  'reservas reembolsables, nada bajo contrato. 2, documentos registrados y los primeros contratos '
                  'firmados. 3, el edificio se levanta bajo una grúa, con la mayoría de las residencias bajo contrato, '
                  'el paso más largo. 4, el edificio terminado, con los cierres en curso. 5, todas las residencias '
                  'vendidas y la asociación en manos de los propietarios. Un informe semanal acompaña la '
                  'obra.',
    ('fl', 'pt'): 'O lançamento num mesmo terreno, em cinco passos ao longo de uma rua. 1, preços definidos e reservas '
                  'reembolsáveis, nada sob contrato. 2, documentos registrados e os primeiros contratos assinados. 3, o '
                  'edifício sobe sob uma grua, com a maioria das unidades sob contrato, o passo mais longo. 4, o '
                  'edifício pronto, com os fechamentos em andamento. 5, todas as unidades vendidas e a associação nas '
                  'mãos dos proprietários. Um relatório semanal acompanha a obra.',
    ('tx', 'en'): 'The launch on one site, in four steps along one street. 1, the documents prepared and prices set, '
                  'nothing under contract. 2, each buyer given the information statement, then the first contracts '
                  'signed. 3, the building rising under a crane, deposits in escrow and most residences under contract, '
                  'the longest step. 4, the building finished and closings under way, with no transfer tax due. A '
                  'weekly report runs through construction.',
}

KEY = {
    'en': ('Each step matches the list below. Illustrative, not to scale.',
           ['Planned', 'Built', 'Under contract', 'Weekly report']),
    'es': ('Cada paso corresponde a la lista de abajo. Ilustrativo, sin escala.',
           ['Previsto', 'Construido', 'Bajo contrato', 'Informe semanal']),
    'pt': ('Cada passo corresponde à lista abaixo. Ilustrativo, fora de escala.',
           ['Previsto', 'Construído', 'Sob contrato', 'Relatório semanal']),
}

SWATCH = ['<path class="hid" d="M0 5h22"/>', '<path class="pr" d="M0 5h22"/>',
          '<path class="sold" d="M3 1h7v8H3ZM12 1h7v8h-7Z"/>', '<path class="dt" d="M1 2v5M6 2v5M11 2v5M16 2v5M21 2v5"/>']

# on a phone the strip pans a frame at a time, and says so in the voice every drawing that pans uses
HINT = {'en': 'Swipe for every step', 'es': 'Desliza para ver cada paso', 'pt': 'Deslize para ver cada etapa'}

PAGES = {
    'new-york.html': ('ny', 'en'), 'es/nueva-york.html': ('ny', 'es'), 'pt/nova-york.html': ('ny', 'pt'),
    'south-florida.html': ('fl', 'en'), 'es/sur-de-florida.html': ('fl', 'es'), 'pt/sul-da-florida.html': ('fl', 'pt'),
    'austin.html': ('tx', 'en'),
}


def figure(m, lang):
    cap, keys = KEY[lang]
    total = sum(W1 * (2 if s.get('wide') else 1) for s in STEPS[m])
    blocks = street(m, total)
    steps, x0 = '', 0
    for i, (s, w) in enumerate(zip(STEPS[m], WORDS[(m, lang)]), 1):
        width = W1 * (2 if s.get('wide') else 1)
        cls = ' class="w2"' if s.get('wide') else ''
        steps += f'<div{cls}>{frame(m, s, x0, width, blocks)}<p><span class="n">{i}</span><span class="f">{w}</span></p></div>'
        x0 += width
    key = ''.join(f'<span><svg viewBox="0 0 22 10">{sw}</svg>{k}</span>' for sw, k in zip(SWATCH, keys))
    cols = ' c5' if len(STEPS[m]) == 4 else ''   # four steps, one of them double, fill five columns
    return (f'<figure class="mk-lfig"><div class="lsq{cols}" role="img" tabindex="0" aria-label="{LABEL[(m, lang)]}">{steps}</div>'
            f'<figcaption class="cap"><span class="pan-hint" aria-hidden="true">{HINT[lang]}</span><span class="key" aria-hidden="true">{key}</span><span>{cap}</span></figcaption></figure>')


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
