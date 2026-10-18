# Builds the stylesheet pages load and stamps every page's links to site.css, site.js, model.js and instrument.js
# with one shared ?v= token (and tower3d.js, the hero's rendered tower, planner.js, the launch planner's, project-site.js, the
# specimen project site's form, and home.css, the home pages' own styles), so a returning visitor never pairs new HTML with a stylesheet or script still in the
# browser's cache.
# The styles are written and commented in _src/site.css, and the home pages' own in _src/home.css (Jekyll never
# publishes an underscore folder). This tool writes site.css and home.css from them with the comments and blank lines
# taken out, so the stylesheets that block first paint carry no notes. Edit the sources, never the built files.
# The token is the first 8 hex digits of a sha256 over the four published files, so it changes whenever any of them does.
# Run from the repo root after editing any of the four (or _src/site.css), then python3 tools/csp.py:
#   python3 tools/version.py
# python3 tools/version.py --check writes nothing: it names a stale site.css or each page with a stale token and
# exits 1 if there is one. The "stylesheet and tokens are built" Playwright test runs it.
import re,hashlib,glob,sys
check='--check' in sys.argv[1:]
stale=[]

def strip_css(src,name='site.css'):
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
            if j<0: sys.exit('_src/%s: unclosed comment at character %d'%(name,i))
            i=j+2
        elif src.startswith('url(',i) and not re.match(r'url\(\s*["\']',src[i:i+10]):
            j=src.find(')',i)
            out.append(src[i:j+1]);i=j+1
        else:
            out.append(c);i+=1
    lines=[l.rstrip() for l in ''.join(out).split('\n')]
    return '/* Built from _src/%s by tools/version.py: edit the source, not this file. */\n'%name+'\n'.join(l for l in lines if l.strip())+'\n'

built={}
for css in ('site.css','home.css'):
    built[css]=strip_css(open('_src/'+css).read(),css)
    if check:
        if open(css).read()!=built[css]: stale.append(css); print(css,'stale: run python3 tools/version.py')
    else: open(css,'w').write(built[css])

assets=['site.css','site.js','model.js','instrument.js','tower3d.js','planner.js','home.css','project-site.js']
h=hashlib.sha256()
for a in assets: h.update(built[a].encode() if a in built else open(a,'rb').read())
token=h.hexdigest()[:8]
pages=['index.html','privacy.html','404.html','private-clients.html','advisors.html','planner.html','shortlist.html','report.html','south-florida.html','new-york.html','hamptons.html','los-angeles.html','dallas.html','austin.html','houston.html','san-francisco.html','tampa.html','naples.html','orange-county.html','developers.html','markets.html','project-site.html']+sorted(glob.glob('journal/*.html'))+sorted(glob.glob('es/*.html'))+sorted(glob.glob('pt/*.html'))
ref=re.compile(r'((?:href|src)="[^"]*?(?:'+'|'.join(re.escape(a) for a in assets)+r'))(?:\?v=[0-9a-f]*)?"')
for f in pages:
    t=open(f).read()
    t,n=ref.subn(lambda m:m.group(1)+'?v='+token+'"',t)
    if check:
        if t!=open(f).read(): stale.append(f); print(f,'stale')
    else: open(f,'w').write(t); print(f,n)
print('token',token)
if check: sys.exit(1 if stale else 0)
