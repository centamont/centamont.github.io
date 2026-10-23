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
        'asof': '2026-09', 'next': '2027-01',
        'en': {'as': 'As of ', 'asof': 'September 2026', 'next': 'January 2027'},
        'es': {'as': 'Datos a ', 'asof': 'septiembre de 2026', 'next': 'enero de 2027'},
        'pt': {'as': 'Dados de ', 'asof': 'setembro de 2026', 'next': 'janeiro de 2027'},
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
             'trend': {'vals': (14.0, 13.0, 12.3, 12.3),
                       'en': ('Sep 2025', 'Mar 2026', 'Jun 2026', 'Sep 2026'), 'es': ('sep. 2025', 'mar. 2026', 'jun. 2026', 'sep. 2026'),
                       'pt': ('set. 2025', 'mar. 2026', 'jun. 2026', 'set. 2026'), 'fmt': {'en': '{:.1f}', 'es': '{:.1f}', 'pt': '{:.1f}'}},
             'en': ('Resale', '12.3', 'months of supply', 'Miami-Dade condominiums in September, with 11,706 for sale, against 14.0 months a year earlier; new construction excluded'),
             'es': ('Reventa', '12.3', 'meses de inventario', 'Condominios de Miami-Dade en septiembre, con 11,706 en venta, frente a 14.0 meses un año antes; se excluye la obra&nbsp;nueva'),
             'pt': ('Revenda', '12,3', 'meses de estoque', 'Apartamentos em condomínio em Miami-Dade em setembro, com 11.706 à venda, contra 14,0 meses um ano antes; exclui imóveis&nbsp;novos'),
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
            {'fn': 1, 'cmp': None,
             'trend': {'vals': (331, 387, 311, 240),
                       'en': ('Q3 2025', 'Q1 2026', 'Q2 2026', 'Q3 2026'), 'es': ('3T 2025', '1T 2026', '2T 2026', '3T 2026'),
                       'pt': ('3T 2025', '1T 2026', '2T 2026', '3T 2026'), 'fmt': {'en': '{:,}', 'es': '{:,}', 'pt': '{:,}'}},
             'en': ('Contracts', '240', 'in the quarter', 'Down 27 percent from a year earlier', '331'),
             'es': ('Contratos', '240', 'en el trimestre', 'Un 27&nbsp;por ciento menos que un año&nbsp;antes', '331'),
             'pt': ('Contratos', '240', 'no trimestre', 'Queda de 27&nbsp;por cento em relação a um ano&nbsp;antes', '331'),
            },
            {'fn': 1, 'cmp': None,
             'en': ('Closed prices', '$2,070', 'a square foot', 'On average, roughly flat on a year earlier'),
             'es': ('Precios de cierre', '$2,070', 'por pie cuadrado', 'En promedio, casi sin cambios frente a un año&nbsp;antes'),
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
    'dallas.html': {
        'twins': {'es': 'es/dallas.html', 'pt': 'pt/dallas.html'},
        'asof': '2026-09', 'next': '2027-01',
        'en': {'as': 'As of ', 'asof': 'September 2026', 'next': 'January 2027'},
        'es': {'as': 'Datos a ', 'asof': 'septiembre de 2026', 'next': 'enero de 2027'},
        'pt': {'as': 'Dados de ', 'asof': 'setembro de 2026', 'next': 'janeiro de 2027'},
        'figures': [
            {'fn': 4, 'cmp': (359460, 357000),
             'en': ('Median price', '$359K', 'in September', 'Every home sold in Dallas County: $359,460, against $357,000 a year earlier', '$357K'),
             'es': ('Precio mediano', '$359K', 'en septiembre', 'Todas las viviendas vendidas en el condado de Dallas: $359,460, frente a $357,000 un año&nbsp;antes', '$357K'),
             'pt': ('Preço mediano', 'US$&nbsp;359', 'mil, em setembro', 'Todos os imóveis vendidos no condado de Dallas: US$&nbsp;359.460, contra US$&nbsp;357.000 um ano&nbsp;antes', '357&nbsp;mil'),
            },
            {'fn': 4, 'cmp': None,
             'trend': {'vals': (3.53, 4.15, 4.54, 4.65),
                       'en': ('Dec 2025', 'Mar 2026', 'Jun 2026', 'Sep 2026'), 'es': ('dic. 2025', 'mar. 2026', 'jun. 2026', 'sep. 2026'),
                       'pt': ('dez. 2025', 'mar. 2026', 'jun. 2026', 'set. 2026'), 'fmt': {'en': '{:.1f}', 'es': '{:.1f}', 'pt': '{:.1f}'}},
             'en': ('Supply', '4.7', 'months of inventory', 'Up from 3.5 in December, with 7,594 homes for sale'),
             'es': ('Oferta', '4.7', 'meses de inventario', 'Frente a 3.5 en diciembre, con 7,594 viviendas en&nbsp;venta'),
             'pt': ('Oferta', '4,7', 'meses de estoque', 'Contra 3,5 em dezembro, com 7.594 imóveis à&nbsp;venda'),
            },
            {'fn': 4, 'cmp': (1533, 1612),
             'en': ('Sales', '1,533', 'homes sold in September', 'Down 4.9 percent from a year earlier', '1,612'),
             'es': ('Ventas', '1,533', 'viviendas vendidas en septiembre', 'Un 4.9&nbsp;por ciento menos que un año&nbsp;antes', '1,612'),
             'pt': ('Vendas', '1.533', 'imóveis vendidos em setembro', 'Queda de 4,9&nbsp;por cento em relação a um ano&nbsp;antes', '1.612'),
            },
        ]},
    'los-angeles.html': {
        'twins': {'es': 'es/los-angeles.html', 'pt': 'pt/los-angeles.html'},
        'asof': '2026-09', 'next': '2027-01',
        'en': {'as': 'As of ', 'asof': 'September 2026', 'next': 'January 2027'},
        'es': {'as': 'Datos a ', 'asof': 'septiembre de 2026', 'next': 'enero de 2027'},
        'pt': {'as': 'Dados de ', 'asof': 'setembro de 2026', 'next': 'janeiro de 2027'},
        'figures': [
            {'fn': 7, 'cmp': (994670, 983230),
             'en': ('Median price', '$995K', 'in September', 'Existing single-family homes in Los&nbsp;Angeles County: $994,670, against $983,230 a year earlier', '$983K'),
             'es': ('Precio mediano', '$995K', 'en septiembre', 'Viviendas unifamiliares de reventa en el condado: $994,670, frente a $983,230 un año&nbsp;antes', '$983K'),
             'pt': ('Preço mediano', 'US$&nbsp;995', 'mil, em setembro', 'Casas unifamiliares usadas no condado de Los&nbsp;Angeles: US$&nbsp;994.670, contra US$&nbsp;983.230 um ano&nbsp;antes', '983&nbsp;mil'),
            },
            {'fn': 7, 'cmp': None,
             'trend': {'vals': (2.8, 3.5, 3.5, 4.0),
                       'en': ('Dec 2025', 'Mar 2026', 'Jun 2026', 'Sep 2026'), 'es': ('dic. 2025', 'mar. 2026', 'jun. 2026', 'sep. 2026'),
                       'pt': ('dez. 2025', 'mar. 2026', 'jun. 2026', 'set. 2026'), 'fmt': {'en': '{:.1f}', 'es': '{:.1f}', 'pt': '{:.1f}'}},
             'en': ('Supply', '4.0', 'months of inventory', 'Up from 2.8 in December and 3.7 a year earlier'),
             'es': ('Oferta', '4.0', 'meses de inventario', 'Frente a 2.8 en diciembre y 3.7 un año&nbsp;antes'),
             'pt': ('Oferta', '4,0', 'meses de estoque', 'Contra 2,8 em dezembro e 3,7 um ano&nbsp;antes'),
            },
            {'fn': 7, 'cmp': None,
             'en': ('Sales', '10.9%', 'fewer than a year earlier', 'Single-family homes sold in September, though 5.4 percent more than in August'),
             'es': ('Ventas', '10.9%', 'menos que un año antes', 'Viviendas unifamiliares vendidas en septiembre, aunque un 5.4&nbsp;por ciento más que en&nbsp;agosto'),
             'pt': ('Vendas', '10,9%', 'a menos que um ano antes', 'Casas unifamiliares vendidas em setembro, embora 5,4&nbsp;por cento a mais que em&nbsp;agosto'),
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

TREND = {'en': ' Where lines are stacked, each is an earlier reading, drawn from zero, and the heavier line is the&nbsp;latest.',
         'es': ' Donde hay varias líneas, cada una es una lectura anterior, trazada desde cero, y la más gruesa es la más&nbsp;reciente.',
         'pt': ' Onde há várias linhas, cada uma é uma leitura anterior, traçada a partir do zero, e a mais grossa é a mais&nbsp;recente.'}

def trend(t, lang):
    # the quarters as a short list, each line drawn to scale from zero; the latest is drawn heavier
    top = max(t['vals'])
    num = lambda v: t['fmt'][lang].format(v).replace(',', '.') if lang == 'pt' and isinstance(v, int) else (
        t['fmt'][lang].format(v).replace('.', ',') if lang == 'pt' else t['fmt'][lang].format(v))
    return ('<ol class="ms-tr">' + ''.join(f'<li><span>{q}</span><i style="--w:{100 * v / top:.1f}%"></i><b>{num(v)}</b></li>'
                                          for q, v in zip(t[lang], t['vals'])) + '</ol>')

def sheet(s, lang):
    t, d = WORDS[lang], s[lang]
    out = ['<aside class="ms" aria-labelledby="msT">',
           f'<p class="ms-h dots"><span class="nw" id="msT">{t["title"]}</span> '
           f'<span class="nw">{d["as"]}<time datetime="{s["asof"]}">{d["asof"]}</time></span> '
           f'<span class="nw">{t["next"]} <time datetime="{s["next"]}">{d["next"]}</time></span></p>', '<dl>']
    for f in s['figures']:
        label, num, unit, note, *said = f[lang]
        out.append(f'<div><dt>{label}</dt><dd><span class="ms-n">{num}</span> <span class="ms-u">{unit}</span>'
                   + (bars(*f['cmp'], said[0]) if f['cmp'] else '') + (trend(f['trend'], lang) if 'trend' in f else '')
                   + f'<span class="ms-note">{nb(note)}<sup><a href="#s{f["fn"]}">{f["fn"]}</a></sup></span></dd></div>')
    key = t['key'] + (TREND[lang] if any('trend' in f for f in s['figures']) else '')
    out += ['</dl>', f'<p class="ms-k">{key}</p>', '</aside>']
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
