# Stamps every page's links to site.css, site.js, model.js and instrument.js with one shared ?v= token, so a
# returning visitor never pairs new HTML with a stylesheet or script still in the browser's cache.
# The token is the first 8 hex digits of a sha256 over those four files, so it changes whenever any of them does.
# Run from the repo root after editing any of the four files, then python3 tools/csp.py:
#   python3 tools/version.py
# The "assets carry the current version" Playwright test fails if a page's token does not match the files on disk.
import re,hashlib,glob
assets=['site.css','site.js','model.js','instrument.js']
h=hashlib.sha256()
for a in assets: h.update(open(a,'rb').read())
token=h.hexdigest()[:8]
pages=['index.html','privacy.html','404.html','colophon.html','private-clients.html','report.html']+sorted(glob.glob('journal/*.html'))
ref=re.compile(r'((?:href|src)="[^"]*?(?:'+'|'.join(re.escape(a) for a in assets)+r'))(?:\?v=[0-9a-f]*)?"')
for f in pages:
    t=open(f).read()
    t,n=ref.subn(lambda m:m.group(1)+'?v='+token+'"',t)
    open(f,'w').write(t); print(f,n)
print('token',token)
