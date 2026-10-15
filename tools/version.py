# Builds the stylesheet pages load and stamps every page's links to site.css, site.js, model.js and instrument.js
# with one shared ?v= token, so a returning visitor never pairs new HTML with a stylesheet or script still in the
# browser's cache.
# The styles are written and commented in _src/site.css (Jekyll never publishes an underscore folder). This tool
# writes site.css from it with the comments and blank lines taken out, so the stylesheet that blocks every page's
# first paint carries no notes. Edit _src/site.css, never site.css.
# The token is the first 8 hex digits of a sha256 over the four published files, so it changes whenever any of them does.
# Run from the repo root after editing any of the four (or _src/site.css), then python3 tools/csp.py:
#   python3 tools/version.py
# python3 tools/version.py --check writes nothing: it names a stale site.css or each page with a stale token and
# exits 1 if there is one. The "stylesheet and tokens are built" Playwright test runs it.
import re,hashlib,glob,sys
check='--check' in sys.argv[1:]
stale=[]

def strip_css(src):
    # Drops /* comments */ outside strings and unquoted url(), then trailing spaces and blank lines.
    out=[];i=0;n=len(src)
    while i<n:
        c=src[i]
        if c in '"\'':
            j=i+1
            while j<n and src[j]!=c:
                j+=2 if src[j]=='\\' else 1
            out.append(src[i:j+1]);i=j+1
        elif src.startswith('/*',i):
            j=src.find('*/',i+2)
            if j<0: sys.exit('_src/site.css: unclosed comment at character %d'%i)
            i=j+2
        elif src.startswith('url(',i) and not re.match(r'url\(\s*["\']',src[i:i+10]):
            j=src.find(')',i)
            out.append(src[i:j+1]);i=j+1
        else:
            out.append(c);i+=1
    lines=[l.rstrip() for l in ''.join(out).split('\n')]
    return '/* Built from _src/site.css by tools/version.py: edit the source, not this file. */\n'+'\n'.join(l for l in lines if l.strip())+'\n'

built=strip_css(open('_src/site.css').read())
if check:
    if open('site.css').read()!=built: stale.append('site.css'); print('site.css stale: run python3 tools/version.py')
else: open('site.css','w').write(built)

assets=['site.css','site.js','model.js','instrument.js']
h=hashlib.sha256()
for a in assets: h.update(built.encode() if a=='site.css' else open(a,'rb').read())
token=h.hexdigest()[:8]
pages=['index.html','privacy.html','404.html','colophon.html','private-clients.html','report.html','south-florida.html','new-york.html','los-angeles.html','dallas.html']+sorted(glob.glob('journal/*.html'))
ref=re.compile(r'((?:href|src)="[^"]*?(?:'+'|'.join(re.escape(a) for a in assets)+r'))(?:\?v=[0-9a-f]*)?"')
for f in pages:
    t=open(f).read()
    t,n=ref.subn(lambda m:m.group(1)+'?v='+token+'"',t)
    if check:
        if t!=open(f).read(): stale.append(f); print(f,'stale')
    else: open(f,'w').write(t); print(f,n)
print('token',token)
if check: sys.exit(1 if stale else 0)
