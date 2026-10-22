#!/usr/bin/env python3
"""Sets each row of the markets hub (markets.html and its Spanish and Portuguese twins) from the market page it links.

Each row opens on a small crop of that page's opening photograph, and closes on the page's own date and reading time, in
the hub's language. The crops are cut here from the page's opener (media/hub-<page>-360.avif|webp|jpg), so a page whose
opener changes gets its new crop the next time this runs, and the dates are read from each page's own line, so a page
updated is a row updated. Run from the repository root after changing a market page's opener or its date:
    python3 tools/hub.py
A test fails when a row's date no longer matches its page.

Under the rows it writes the rules side by side, one row a market, in the hub's order and language: the review before any
sale, where the deposits sit, and the buyer's taxes at the top end. Its cells are the COMPARE table below, kept to the
facts each market page states in its own "market in brief" (and with sources at its foot): when a page's facts change,
change its cells here and rerun this script.
"""
import pathlib, re
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
HUBS = {'markets.html': 'en', 'es/mercados.html': 'es', 'pt/mercados.html': 'pt'}
MONTHS = {
    'en': 'January February March April May June July August September October November December'.split(),
    'es': 'enero febrero marzo abril mayo junio julio agosto septiembre octubre noviembre diciembre'.split(),
    'pt': 'janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro'.split(),
}


# The rules side by side: each market's row is its state's review and deposits, and its own taxes at the top end.
COMPARE = {
    'south-florida.html': ('fl', 'fl', 'fl'), 'new-york.html': ('ny', 'ny', 'nyc'), 'hamptons.html': ('hm', 'ny', 'hm'),
    'los-angeles.html': ('ca', 'ca', 'la'), 'dallas.html': ('tx', 'tx', 'tx'), 'tampa.html': ('fl', 'fl', 'fl'),
    'naples.html': ('fl', 'fl', 'fl'), 'austin.html': ('tx', 'tx', 'tx'), 'houston.html': ('tx', 'tx', 'tx'),
    'san-francisco.html': ('ca', 'ca', 'sf'), 'orange-county.html': ('ca', 'ca', 'oc'),
}
CELLS = {
    'en': {
        'head': ('The rules, side by&nbsp;side', 'What a buyer of a new residence meets in each market, as each market’s page sets out with its&nbsp;sources.',
                 'The rules for buyers of new residences in each market: the review before any sale, the deposits and the buyer’s taxes at the top end.',
                 ('Market', 'Before any sale', 'Deposits', 'Buyer’s taxes at the top end')),
        'review': {'fl': 'The developer’s documents filed with the state; 15 days to&nbsp;cancel',
                   'ny': 'An offering plan the Attorney General has&nbsp;accepted',
                   'hm': 'For a condominium, an offering plan, as in the&nbsp;city',
                   'ca': 'A public report from the Department of Real&nbsp;Estate',
                   'tx': 'No state review; an information statement, with five days to cancel if it arrives after&nbsp;signing'},
        'deposit': {'fl': 'The first 10&nbsp;percent in escrow; more may fund&nbsp;construction',
                    'ny': 'All of it in escrow until&nbsp;closing',
                    'ca': 'Reservations held in escrow and refundable in&nbsp;full',
                    'tx': 'In escrow until closing, default or&nbsp;refund'},
        'tax': {'fl': 'Deed stamp tax, a seller’s cost often passed to the&nbsp;buyer',
                'nyc': 'Mansion tax from $1&nbsp;million; transfer taxes often passed to the&nbsp;buyer',
                'hm': 'Peconic Bay taxes of 2.5&nbsp;percent in Southampton and East Hampton, and the mansion&nbsp;tax',
                'la': 'Inside the city, 4&nbsp;to 5.5&nbsp;percent of the whole price above $5.4&nbsp;million',
                'tx': 'No transfer tax and no state income&nbsp;tax',
                'sf': '5.5&nbsp;percent of the whole price from $10&nbsp;million, 6&nbsp;percent from $25&nbsp;million',
                'oc': '$1.10 per $1,000 of the price, to the county&nbsp;alone'},
    },
    'es': {
        'head': ('Las reglas, lado a&nbsp;lado', 'Lo que encuentra quien compra una residencia nueva en cada mercado, tal como lo expone la página de cada mercado con sus&nbsp;fuentes.',
                 'Las reglas para compradores de residencias nuevas en cada mercado: la revisión antes de cualquier venta, los depósitos y los impuestos del comprador en el segmento más alto.',
                 ('Mercado', 'Antes de cualquier venta', 'Depósitos', 'Impuestos del comprador en lo más alto')),
        'review': {'fl': 'Los documentos del desarrollador registrados ante el estado; 15 días para&nbsp;cancelar',
                   'ny': 'Un plan de oferta aceptado por la Fiscalía&nbsp;General',
                   'hm': 'Para un condominio, un plan de oferta, como en la&nbsp;ciudad',
                   'ca': 'Un informe público del Departamento de Bienes&nbsp;Raíces',
                   'tx': 'Sin revisión estatal; una declaración informativa, con cinco días para cancelar si llega después de la&nbsp;firma'},
        'deposit': {'fl': 'El primer 10&nbsp;por ciento en custodia; el resto puede financiar la&nbsp;obra',
                    'ny': 'Todo en custodia hasta el&nbsp;cierre',
                    'ca': 'Reservas en custodia y reembolsables en su&nbsp;totalidad',
                    'tx': 'En custodia hasta el cierre, un incumplimiento o un&nbsp;reembolso'},
        'tax': {'fl': 'Impuesto de timbre, un costo del vendedor que a menudo pasa al&nbsp;comprador',
                'nyc': 'Impuesto de lujo desde $1&nbsp;millón; los impuestos de transferencia, a menudo a cargo del&nbsp;comprador',
                'hm': 'Impuestos de Peconic Bay del 2,5&nbsp;por ciento en Southampton y East Hampton, y el impuesto de&nbsp;lujo',
                'la': 'Dentro de la ciudad, del 4 al 5,5&nbsp;por ciento del precio total por encima de $5,4&nbsp;millones',
                'tx': 'Sin impuesto de transferencia y sin impuesto estatal sobre la&nbsp;renta',
                'sf': '5,5&nbsp;por ciento del precio total desde $10&nbsp;millones, 6&nbsp;por ciento desde $25&nbsp;millones',
                'oc': '$1,10 por cada $1.000 del precio, solo para el&nbsp;condado'},
    },
    'pt': {
        'head': ('As regras, lado a&nbsp;lado', 'O que encontra quem compra um imóvel novo em cada mercado, como a página de cada mercado expõe com suas&nbsp;fontes.',
                 'As regras para compradores de imóveis novos em cada mercado: a análise antes de qualquer venda, os depósitos e os impostos do comprador no topo do mercado.',
                 ('Mercado', 'Antes de qualquer venda', 'Depósitos', 'Impostos do comprador no topo')),
        'review': {'fl': 'Os documentos da incorporadora registrados no estado; 15 dias para&nbsp;cancelar',
                   'ny': 'Um plano de oferta aceito pela Procuradoria-Geral',
                   'hm': 'Para um condomínio, um plano de oferta, como na&nbsp;cidade',
                   'ca': 'Um relatório público do Departamento de Imóveis do&nbsp;estado',
                   'tx': 'Sem análise estadual; uma declaração informativa, com cinco dias para cancelar se chegar depois da&nbsp;assinatura'},
        'deposit': {'fl': 'Os primeiros 10&nbsp;por cento em custódia; o restante pode financiar a&nbsp;obra',
                    'ny': 'Tudo em custódia até o&nbsp;fechamento',
                    'ca': 'Reservas em custódia e reembolsáveis por&nbsp;inteiro',
                    'tx': 'Em custódia até o fechamento, uma inadimplência ou um&nbsp;reembolso'},
        'tax': {'fl': 'Imposto de selo, um custo do vendedor muitas vezes repassado ao&nbsp;comprador',
                'nyc': 'Imposto sobre imóveis de alto valor a partir de US$&nbsp;1&nbsp;milhão; impostos de transferência muitas vezes repassados ao&nbsp;comprador',
                'hm': 'Impostos de Peconic Bay de 2,5&nbsp;por cento em Southampton e East Hampton, e o imposto sobre imóveis de alto&nbsp;valor',
                'la': 'Dentro da cidade, de 4 a 5,5&nbsp;por cento do preço total acima de US$&nbsp;5,4&nbsp;milhões',
                'tx': 'Sem imposto de transferência e sem imposto de renda&nbsp;estadual',
                'sf': '5,5&nbsp;por cento do preço total a partir de US$&nbsp;10&nbsp;milhões, 6&nbsp;por cento a partir de US$&nbsp;25&nbsp;milhões',
                'oc': 'US$&nbsp;1,10 por US$&nbsp;1.000 do preço, só para o&nbsp;condado'},
    },
}


def compare(lang, html):
    """The rules side by side, from the hub's own rows (their links and names, in its order) and COMPARE."""
    c = CELLS[lang]
    h2, lead, cap, cols = c['head']
    rows = []
    for sec in re.finditer(r'<section class="co-row">\s*<h2>(.*?)</h2>(.*?)</section>', html, re.S):
        status = sec.group(1)
        for href, hreflang, name in re.findall(r'<li><a href="([^"]+\.html)"((?: hreflang="en")?)>.*?<span class="t">(.*?)</span>', sec.group(2), re.S):
            r, d, t = COMPARE[english(href.lstrip('/'))]
            rows.append(f'<tr><th scope="row"><a href="{href}"{hreflang}>{name}</a><span>{status}</span></th>'
                        f'<td data-l="{cols[1]}">{c["review"][r]}</td><td data-l="{cols[2]}">{c["deposit"][d]}</td><td data-l="{cols[3]}">{c["tax"][t]}</td></tr>')
    head = ''.join(f'<th scope="col">{x}</th>' for x in cols)
    return ('<section class="mk-cmp" aria-labelledby="mkCmp">\n'
            f'<h2 id="mkCmp">{h2}</h2>\n<p>{lead}</p>\n'
            f'<table>\n<caption class="vh">{cap}</caption>\n<thead><tr>{head}</tr></thead>\n<tbody>\n' + '\n'.join(rows) + '\n</tbody>\n</table>\n</section>\n')


def words(lang, iso, minutes):
    y, m, d = (int(x) for x in iso.split('-'))
    month = MONTHS[lang][m - 1]
    if lang == 'en':
        return f'Updated <time datetime="{iso}">{month} {d}, {y}</time>', f'{minutes}-minute read'
    if lang == 'es':
        return f'Actualizada el <time datetime="{iso}">{d} de {month} de {y}</time>', f'Lectura de {minutes} minutos'
    return f'Atualizada em <time datetime="{iso}">{d} de {month} de {y}</time>', f'Leitura de {minutes} minutos'


def crop(page):
    """The page's opening photograph, cut to 3:2 at 360 x 240 (shown at up to 180 px wide, twice over for sharp screens)."""
    html = (ROOT / page).read_text()
    base = re.search(r'<figure class="photo[^"]*opener[^"]*".{0,1200}?media/([a-z0-9-]+)-960\.jpg', html, re.S).group(1)
    src = next(p for p in (ROOT / f'media/{base}-1600.jpg', ROOT / f'media/{base}-960.jpg') if p.exists())
    im = Image.open(src).convert('RGB')
    w, h = im.size
    if h * 3 // 2 <= w:
        x = (w - h * 3 // 2) // 2; box = (x, 0, x + h * 3 // 2, h)
    else:
        y = (h - w * 2 // 3) // 2; box = (0, y, w, y + w * 2 // 3)
    t = im.crop(box).resize((360, 240), Image.LANCZOS)
    name = 'hub-' + page.removesuffix('.html').replace('/', '-')
    t.save(ROOT / f'media/{name}-360.jpg', quality=82, optimize=True, progressive=True)
    t.save(ROOT / f'media/{name}-360.webp', quality=80)
    t.save(ROOT / f'media/{name}-360.avif', quality=60)
    return name


def english(page):
    """The English page a translation stands for, from its own alternate link (the photograph is the English page's)."""
    html = (ROOT / page).read_text()
    m = re.search(r'<link rel="alternate" hreflang="en" href="https://centamont\.com/([^"]*)">', html)
    return m.group(1) if m and '/' in page else page


def main():
    cut = {}
    for hub, lang in HUBS.items():
        path = ROOT / hub
        pre = '' if lang == 'en' else '/'

        def row(m):
            href, hreflang, inner = m.groups()
            page = href.lstrip('/')
            meta = re.search(r'<div class="meta">.*?<time datetime="(\d{4}-\d\d-\d\d)">.*?(\d+)(?:-minute read| minutos)', (ROOT / page).read_text())
            en = english(page)
            if en not in cut:
                cut[en] = crop(en)
            inner = re.sub(r'^<picture class="mk-v">.*?</picture>', '', inner)
            inner = re.sub(r'<span class="m dots">.*$', '', inner)
            upd, read = words(lang, meta.group(1), meta.group(2))
            pic = (f'<picture class="mk-v"><source type="image/avif" srcset="{pre}media/{cut[en]}-360.avif">'
                   f'<source type="image/webp" srcset="{pre}media/{cut[en]}-360.webp">'
                   f'<img src="{pre}media/{cut[en]}-360.jpg" width="360" height="240" alt="" loading="lazy" decoding="async"></picture>')
            return (f'<li><a href="{href}"{hreflang}>{pic}{inner}'
                    f'<span class="m dots"><span class="nw">{upd}</span> <span class="nw">{read}</span></span></a></li>')

        # (only the hub's own lists: the header and footer link the same pages)
        html = re.sub(r'<ol class="notes-list mk-list">.*?</ol>',
                      lambda ol: re.sub(r'<li><a href="([^"]+\.html)"((?: hreflang="en")?)>(.*?)</a></li>', row, ol.group(0), flags=re.S),
                      path.read_text(), flags=re.S)
        # (the rules side by side, under the rows and before the closing question)
        html = re.sub(r'<section class="mk-cmp".*?</section>\n', '', html, flags=re.S)
        html, n = re.subn(r'(?=<p class="mk-ask">)', lambda m: compare(lang, html), html, count=1)
        assert n == 1, hub
        path.write_text(html)
        print('wrote', hub)


if __name__ == '__main__':
    main()
