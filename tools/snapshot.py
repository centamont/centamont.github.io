# Asks the Internet Archive to keep a dated copy of the site's main pages, so there is always a third-party record of what
# centamont.com said and showed on a given day. The "Site snapshot" workflow runs it weekly and on request. It prints only
# each page and the archive's answer. Run from the repo root: python3 tools/snapshot.py
import time, urllib.request

PAGES = ['', 'markets.html', 'developers.html', 'private-clients.html', 'advisors.html', 'journal/', 'south-florida.html', 'new-york.html',
         'report.html', 'planner.html', 'terms.html', 'es/', 'pt/']
for p in PAGES:
    url = 'https://centamont.com/' + p
    try:
        req = urllib.request.Request('https://web.archive.org/save/' + url, headers={'User-Agent': 'centamont-site-snapshot'})
        with urllib.request.urlopen(req, timeout=120) as r: print('saved    ' + url + '  ->  ' + (r.headers.get('Content-Location') or r.url))
    except Exception as e: print('skipped  ' + url + '  (' + type(e).__name__ + ')')
    time.sleep(8)   # the archive asks for a gentle pace
