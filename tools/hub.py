#!/usr/bin/env python3
"""Sets each row of the markets hub (markets.html and its Spanish and Portuguese twins) from the market page it links.

Each row opens on a small crop of that page's opening photograph, and closes on the page's own date and reading time, in
the hub's language. The crops are cut here from the page's opener (media/hub-<page>-360.avif|webp|jpg), so a page whose
opener changes gets its new crop the next time this runs, and the dates are read from each page's own line, so a page
updated is a row updated. Run from the repository root after changing a market page's opener or its date:
    python3 tools/hub.py
A test fails when a row's date no longer matches its page.
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
        path.write_text(html)
        print('wrote', hub)


if __name__ == '__main__':
    main()
