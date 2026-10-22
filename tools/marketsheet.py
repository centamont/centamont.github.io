#!/usr/bin/env python3
"""Writes the dated market sheet of each open market's page, under its view and elevation, in English, Spanish and
Portuguese.

The figures live here, one entry per market, each carrying its as-of date and the footnote it rests on, with its
words in each language (the Spanish page writes $4,209 and 12.1 as the English does; the Portuguese page writes
US$ 4.209 and 12,1); the quarterly refresh edits this table, reruns the script and the page's own "market in brief"
facts, then opens a pull request for review.
Run from the repository root: python3 tools/marketsheet.py
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent

# asof and next: machine dates, with the words in each language; each figure: its footnote, the pair it is drawn
# against (now, then) or None, and in each language (label, number, unit, note, then as written when it is drawn)
SHEETS = {
    'south-florida.html': {
        'twins': {'es': 'es/sur-de-florida.html', 'pt': 'pt/sul-da-florida.html'},
        'asof': '2026-08', 'next': '2027-01',
        'en': {'as': 'As of ', 'asof': 'August 2026', 'next': 'January 2027'},
        'es': {'as': 'Datos a ', 'asof': 'agosto de 2026', 'next': 'enero de 2027'},
        'pt': {'as': 'Dados de ', 'asof': 'agosto de 2026', 'next': 'janeiro de 2027'},
        'figures': [
            {'fn': 2, 'cmp': (1983, 800),
             'en': ('New towers', '$1,983', 'a square foot', 'Average luxury asking price in July, against about $800 five years earlier', '$800'),
             'es': ('Torres nuevas', '$1,983', 'por pie cuadrado', 'Precio de oferta promedio en el segmento de lujo en julio, frente a unos $800 cinco años&nbsp;antes', '$800'),
             'pt': ('Torres novas', 'US$&nbsp;1.983', 'por pé quadrado', 'Preço médio pedido no segmento de luxo em julho, contra cerca de US$ 800 cinco anos&nbsp;antes', 'US$&nbsp;800'),
            },
            {'fn': 2, 'cmp': None,
             'en': ('Projects', '26', 'or more in pre-construction', 'Branded and ultra-luxury projects across the three counties, in July'),
             'es': ('Proyectos', '26', 'o más en preconstrucción', 'Proyectos de marca y de ultralujo en los tres condados, en&nbsp;julio'),
             'pt': ('Projetos', '26', 'ou mais na planta', 'Projetos de marca e de ultraluxo nos três condados, em&nbsp;julho'),
            },
            {'fn': 1, 'cmp': None,
             'en': ('Resale', '12.1', 'months of supply', 'Miami-Dade condominiums in August, at a median price of $408,000; new construction excluded'),
             'es': ('Reventa', '12.1', 'meses de inventario', 'Condominios de Miami-Dade en agosto, con un precio mediano de $408,000; se excluye la obra&nbsp;nueva'),
             'pt': ('Revenda', '12,1', 'meses de estoque', 'Apartamentos em condomínio em Miami-Dade em agosto, com preço mediano de US$ 408.000; exclui imóveis&nbsp;novos'),
            },
        ]},
    'new-york.html': {
        'twins': {'es': 'es/nueva-york.html', 'pt': 'pt/nova-york.html'},
        'asof': '2026-09', 'next': '2027-01',
        'en': {'as': 'As of ', 'asof': 'the third quarter of 2026', 'next': 'January 2027'},
        'es': {'as': 'Datos al ', 'asof': 'tercer trimestre de 2026', 'next': 'enero de 2027'},
        'pt': {'as': 'Dados do ', 'asof': 'terceiro trimestre de 2026', 'next': 'janeiro de 2027'},
        'figures': [
            {'fn': 1, 'cmp': (3027, 4209),
             'en': ('Manhattan supply', '3,027', 'new development units', 'On the market, against a ten&#8209;year average of 4,209', '4,209'),
             'es': ('Inventario en Manhattan', '3,027', 'unidades de obra nueva', 'En el mercado, frente a un promedio de diez&nbsp;años de&nbsp;4,209', '4,209'),
             'pt': ('Oferta em Manhattan', '3.027', 'unidades novas', 'À venda, contra uma média de dez&nbsp;anos de&nbsp;4.209', '4.209'),
            },
            {'fn': 1, 'cmp': (240, 331),
             'en': ('Contracts', '240', 'in the quarter', 'Down 27 percent from a year earlier', '331'),
             'es': ('Contratos', '240', 'en el trimestre', 'Un 27&nbsp;por ciento menos que un año&nbsp;antes', '331'),
             'pt': ('Contratos', '240', 'no trimestre', 'Queda de 27&nbsp;por cento em relação a um ano&nbsp;antes', '331'),
            },
            {'fn': 1, 'cmp': None,
             'en': ('Closed prices', '$2,070', 'a square foot', 'On average, roughly flat on a year earlier'),
             'es': ('Precios de cierre', '$2,070', 'por pie cuadrado', 'En promedio, prácticamente sin cambios frente a un año&nbsp;antes'),
             'pt': ('Vendas concluídas', 'US$&nbsp;2.070', 'por pé quadrado', 'Em média, praticamente estável em relação a um ano&nbsp;antes'),
            },
        ]},
    'hamptons.html': {
        'twins': {'es': 'es/hamptons.html', 'pt': 'pt/hamptons.html'},
        'asof': '2026-09', 'next': '2027-01',
        'en': {'as': 'As of ', 'asof': 'the third quarter of 2026', 'next': 'January 2027'},
        'es': {'as': 'Datos al ', 'asof': 'tercer trimestre de 2026', 'next': 'enero de 2027'},
        'pt': {'as': 'Dados do ', 'asof': 'terceiro trimestre de 2026', 'next': 'janeiro de 2027'},
        'figures': [
            {'fn': 1, 'cmp': (1875, 2001),
             'en': ('Median price', '$1.875M', 'in the quarter', 'Down 6.3 percent from a year earlier', '$2.0M'),
             'es': ('Precio mediano', '$1.875M', 'en el trimestre', 'Un 6.3&nbsp;por ciento menos que un año&nbsp;antes', '$2.0M'),
             'pt': ('Preço mediano', 'US$&nbsp;1,875&nbsp;mi', 'no trimestre', 'Queda de 6,3&nbsp;por cento em um&nbsp;ano', 'US$&nbsp;2,0&nbsp;mi'),
            },
            {'fn': 2, 'cmp': (970, 1260),
             'en': ('Listings', '970', 'homes for sale', 'Down from about 1,260 a year earlier', '1,260'),
             'es': ('Oferta', '970', 'casas en venta', 'Frente a unas 1,260 un año&nbsp;antes', '1,260'),
             'pt': ('Oferta', '970', 'casas à venda', 'Contra cerca de 1.260 um ano&nbsp;antes', '1.260'),
            },
            {'fn': 1, 'cmp': None,
             'en': ('Sales', '4', 'quarters of decline', 'Fewer sales than a year earlier, held back by falling supply'),
             'es': ('Ventas', '4', 'trimestres a la baja', 'Menos ventas que un año antes, frenadas por la falta de&nbsp;oferta'),
             'pt': ('Vendas', '4', 'trimestres em queda', 'Menos vendas que um ano antes, contidas pela falta de&nbsp;oferta'),
            },
        ]},
}

WORDS = {
    'en': {'title': 'Market sheet', 'next': 'Next review',
           'key': 'The line runs to the figure now; the tick marks the figure it is measured against. Reviewed each quarter against the sources at the foot of the&nbsp;page.'},
    'es': {'title': 'Ficha de mercado', 'next': 'Próxima revisión',
           'key': 'La línea llega a la cifra actual; la marca señala la cifra con la que se compara. Se revisa cada trimestre con las fuentes que figuran al pie de la&nbsp;página.'},
    'pt': {'title': 'Ficha de mercado', 'next': 'Próxima revisão',
           'key': 'A linha vai até o número atual; a marca indica o número com que ele é comparado. Revisado a cada trimestre com as fontes indicadas ao pé da&nbsp;página.'},
}

def nb(s):
    # keep the last two words of a note together, as the hand-set copy does (unless the note already binds them)
    return s if re.search(r'&nbsp;\S+$', s) else re.sub(r' (\S+)$', r'&nbsp;\1', s)

def bars(now, then, said):
    # drawn to scale from zero: an ink line runs to the figure now, a tick stands at the figure it is measured against,
    # with that figure under it, and where the figure then was the greater, a dotted line carries on out to its tick
    top = max(now, then)
    w = lambda v: f'{100 * v / top:.1f}%'
    return (f'<span class="ms-sc" style="--now:{w(now)};--then:{w(then)}" aria-hidden="true">'
            + ('<i class="ref"></i>' if then > now else '')
            + f'<i class="now"></i><i class="then"><b>{said}</b></i></span>')

def sheet(s, lang):
    t, d = WORDS[lang], s[lang]
    out = ['<aside class="ms" aria-labelledby="msT">',
           f'<p class="ms-h dots"><span class="nw" id="msT">{t["title"]}</span> '
           f'<span class="nw">{d["as"]}<time datetime="{s["asof"]}">{d["asof"]}</time></span> '
           f'<span class="nw">{t["next"]} <time datetime="{s["next"]}">{d["next"]}</time></span></p>', '<dl>']
    for f in s['figures']:
        label, num, unit, note, *said = f[lang]
        out.append(f'<div><dt>{label}</dt><dd><span class="ms-n">{num}</span> <span class="ms-u">{unit}</span>'
                   + (bars(*f['cmp'], said[0]) if f['cmp'] else '')
                   + f'<span class="ms-note">{nb(note)}<sup><a href="#s{f["fn"]}">{f["fn"]}</a></sup></span></dd></div>')
    out += ['</dl>', f'<p class="ms-k">{t["key"]}</p>', '</aside>']
    return '\n'.join(out)

for name, s in SHEETS.items():
    for lang, page in (('en', name), *s['twins'].items()):
        p = ROOT / page
        html = p.read_text()
        html = re.sub(r'\n<aside class="ms".*?</aside>', '', html, flags=re.S)
        # the sheet follows the page's view and its elevation, so a phone opens on the place before the figures
        html, n = re.subn(r'(<figure class="mk-el-fig">.*?</figure>)', lambda m: m.group(1) + '\n' + sheet(s, lang), html, count=1, flags=re.S)
        assert n == 1, page
        p.write_text(html)
        print('market sheet', page)
