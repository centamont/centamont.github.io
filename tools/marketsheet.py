#!/usr/bin/env python3
"""Writes the dated market sheet under the title of each open market's page.

The figures live here, one entry per page, each carrying its as-of date and the
footnote it rests on; the quarterly refresh edits this table, reruns the script
and the page's own "market in brief" facts, then opens a pull request for review.
Run from the repository root: python3 tools/marketsheet.py
"""
import pathlib, re

ROOT = pathlib.Path(__file__).resolve().parent.parent

# asof: (machine date, words); next: (machine date, words)
# each figure: (label, number, unit, note, footnote, (now, then, then as written) or None)
SHEETS = {
    'south-florida.html': {
        'asof': ('2026-07', 'July 2026'), 'next': ('2027-01', 'January 2027'),
        'figures': [
            ('New towers', '$1,983', 'a square foot', 'Average luxury asking price, against about $800 five years earlier', 2, (1983, 800, '$800')),
            ('Projects', '26', 'or more in pre-construction', 'Branded and ultra-luxury projects across the three counties', 2, None),
            ('Resale', '12', 'months of supply', 'Miami-Dade condominiums, at a median price of $400,000; new construction excluded', 1, None),
        ]},
    'new-york.html': {
        'asof': ('2026-09', 'the third quarter of 2026'), 'next': ('2027-01', 'January 2027'),
        'figures': [
            ('Manhattan supply', '3,027', 'new development units', 'On the market, against a ten&#8209;year average of 4,209', 1, (3027, 4209, '4,209')),
            ('Contracts', '240', 'in the quarter', 'Down 27 percent from a year earlier', 1, (240, 331, '331')),
            ('Closed prices', '$2,070', 'a square foot', 'On average, roughly flat on a year earlier', 1, None),
        ]},
    'hamptons.html': {
        'asof': ('2026-09', 'the third quarter of 2026'), 'next': ('2027-01', 'January 2027'),
        'figures': [
            ('Median price', '$1.875M', 'in the quarter', 'Down 6.3 percent from a year earlier', 1, (1875, 2001, '$2.0M')),
            ('Listings', '970', 'homes for sale', 'Down from about 1,260 a year earlier', 2, (970, 1260, '1,260')),
            ('Sales', '4', 'quarters of decline', 'Fewer sales than a year earlier, held back by falling supply', 1, None),
        ]},
}

def nb(s):
    # keep the last two words of a note together, as the hand-set copy does
    return re.sub(r' (\S+)$', r'&nbsp;\1', s)

def bars(now, then, said):
    # drawn to scale from zero: an ink line runs to the figure now, a tick stands at the figure it is measured against,
    # with that figure under it, and where the figure then was the greater, a dotted line carries on out to its tick
    top = max(now, then)
    w = lambda v: f'{100 * v / top:.1f}%'
    return (f'<span class="ms-sc" style="--now:{w(now)};--then:{w(then)}" aria-hidden="true">'
            + ('<i class="ref"></i>' if then > now else '')
            + f'<i class="now"></i><i class="then"><b>{said}</b></i></span>')

def sheet(s):
    (ad, aw), (nd, nw) = s['asof'], s['next']
    out = ['<aside class="ms" aria-labelledby="msT">',
           '<p class="ms-h dots"><span class="nw" id="msT">Market sheet</span> '
           f'<span class="nw">As of <time datetime="{ad}">{aw}</time></span> '
           f'<span class="nw">Next review <time datetime="{nd}">{nw}</time></span></p>', '<dl>']
    for label, num, unit, note, fn, cmp in s['figures']:
        out.append(f'<div><dt>{label}</dt><dd><span class="ms-n">{num}</span> <span class="ms-u">{unit}</span>'
                   + (bars(*cmp) if cmp else '')
                   + f'<span class="ms-note">{nb(note)}<sup><a href="#s{fn}">{fn}</a></sup></span></dd></div>')
    out += ['</dl>', '<p class="ms-k">The line runs to the figure now; the tick marks the figure it is measured against. Reviewed each quarter against the sources at the foot of the&nbsp;page.</p>', '</aside>']
    return '\n'.join(out)

for name, s in SHEETS.items():
    p = ROOT / name
    html = p.read_text()
    html = re.sub(r'\n<aside class="ms".*?</aside>', '', html, flags=re.S)
    html, n = re.subn(r'(<div class="meta">.*?</div>)', lambda m: m.group(1) + '\n' + sheet(s), html, count=1)
    assert n == 1, name
    p.write_text(html)
    print('market sheet', name)
