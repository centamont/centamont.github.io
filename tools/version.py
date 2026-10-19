# Builds the stylesheets and scripts pages load and stamps every page's links to them with one shared ?v= token, so a
# returning visitor never pairs new HTML with a stylesheet or script still in the browser's cache.
# The stylesheets are written and commented in _src/: site.css, which every page loads, and the sheets only some pages
# load after it: home.css (the three home pages), practice.css (the home pages, developers, private clients and its
# twins, advisors, the markets hub), market.css (the market pages), reading.css (the journal, the buyer guides, privacy,
# the not-found page) and sheet.css (the report, the planner, the short list, the project site). The shared scripts
# site.js, instrument.js and planner.js are written and commented there too (Jekyll never publishes an underscore
# folder). This tool writes each published copy from its source with the comments and blank lines taken out, so what
# the browser fetches carries no notes. Edit the sources, never the built files. model.js, tower3d.js and
# project-site.js are published as written.
# The token is the first 8 hex digits of a sha256 over the published files, so it changes whenever any of them does.
# Run from the repo root after editing any of them (or a source in _src/), then python3 tools/csp.py:
#   python3 tools/version.py
# python3 tools/version.py --check writes nothing: it names a stale built file or each page with a stale token and
# exits 1 if there is one. The "the stylesheet is built from its source" Playwright test runs it.
import re,hashlib,glob,sys
check='--check' in sys.argv[1:]
stale=[]
CSS=['site.css','home.css','practice.css','market.css','reading.css','sheet.css']
JS=['site.js','instrument.js','planner.js']

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

# A slash starts a regular expression, not a division, after one of these (or at the start).
REGEX_AFTER=set('( , = : [ ! & | ? { } ; + - * % < > ~ ^ => && || ?? == === != !== <= >= += -= *= /= return typeof case do else in instanceof new void delete throw yield await of'.split())
def strip_js(src,name):
    # Reads the script token by token, so a // or /* inside a string, a template literal or a regular expression is
    # never taken for a comment. Comments go; a block comment that spans lines still ends its line, so semicolon
    # insertion reads the script as before. Each line loses its indent and trailing spaces, and blank lines go. A
    # template literal that spans lines keeps them as written. Nothing else changes: no line is joined to another.
    lines=[];cur=[];i=0;n=len(src);prev='';tpl=[]  # tpl: brace depth inside each open ${ } of a template literal
    def end_line():
        s=''.join(cur).strip(' \t\r')
        if s: lines.append(s)
        cur.clear()
    def fail(what): sys.exit('_src/%s: %s at character %d'%(name,what,i))
    while i<n:
        c=src[i]
        if c=='\n': end_line();i+=1;continue
        if c in ' \t\r':
            j=i
            while j<n and src[j] in ' \t\r': j+=1
            cur.append(src[i:j]);i=j;continue
        if src.startswith('//',i):
            j=src.find('\n',i);i=n if j<0 else j;continue
        if src.startswith('/*',i):
            j=src.find('*/',i+2)
            if j<0: fail('unclosed comment')
            if '\n' in src[i:j]: end_line()
            else: cur.append(' ')
            i=j+2;continue
        if c in '"\'':
            j=i+1
            while j<n and src[j]!=c:
                if src[j]=='\n': fail('line break in a string')
                j+=2 if src[j]=='\\' else 1
            cur.append(src[i:j+1]);i=j+1;prev='"';continue
        if c=='`' or (c=='}' and tpl and tpl[-1]==0):
            if c=='}': tpl.pop()
            j=i+1
            while True:
                if j>=n: fail('unclosed template literal')
                if src[j]=='\\': j+=2;continue
                if src[j]=='`': j+=1;prev='"';break
                if src.startswith('${',j): j+=2;tpl.append(0);prev='(';break
                j+=1
            cur.append(src[i:j]);i=j;continue
        if c=='/' and (prev=='' or prev in REGEX_AFTER):
            j=i+1;cls=False
            while True:
                if j>=n or src[j]=='\n': fail('unclosed regular expression')
                if src[j]=='\\': j+=2;continue
                if src[j]=='[': cls=True
                elif src[j]==']': cls=False
                elif src[j]=='/' and not cls: break
                j+=1
            j+=1
            while j<n and src[j].isalnum(): j+=1
            cur.append(src[i:j]);i=j;prev='/x/';continue
        if tpl and c=='{': tpl[-1]+=1
        if tpl and c=='}': tpl[-1]-=1
        m=re.compile(r'[A-Za-z_$][\w$]*|\d[\w.]*|=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|[+\-*/]=|\.\.\.|.').match(src,i)
        cur.append(m.group(0));prev=m.group(0);i=m.end()
    end_line()
    return '// Built from _src/%s by tools/version.py: edit the source, not this file.\n'%name+'\n'.join(lines)+'\n'

built={}
for f in CSS+JS:
    src=open('_src/'+f).read()
    built[f]=strip_css(src,f) if f.endswith('.css') else strip_js(src,f)
    if check:
        if open(f).read()!=built[f]: stale.append(f); print(f,'stale: run python3 tools/version.py')
    else: open(f,'w').write(built[f])

assets=['site.css','site.js','model.js','instrument.js','tower3d.js','planner.js','home.css','project-site.js','practice.css','market.css','reading.css','sheet.css']
h=hashlib.sha256()
for a in assets: h.update(built[a].encode() if a in built else open(a,'rb').read())
token=h.hexdigest()[:8]
pages=['index.html','privacy.html','terms.html','404.html','private-clients.html','advisors.html','planner.html','shortlist.html','report.html','south-florida.html','new-york.html','hamptons.html','los-angeles.html','dallas.html','austin.html','houston.html','san-francisco.html','tampa.html','naples.html','orange-county.html','developers.html','markets.html','project-site.html']+sorted(glob.glob('journal/*.html'))+sorted(glob.glob('es/*.html'))+sorted(glob.glob('pt/*.html'))
ref=re.compile(r'((?:href|src)="[^"]*?(?<![\w-])(?:'+'|'.join(re.escape(a) for a in assets)+r'))(?:\?v=[0-9a-f]*)?"')
for f in pages:
    t=open(f).read()
    t,n=ref.subn(lambda m:m.group(1)+'?v='+token+'"',t)
    if check:
        if t!=open(f).read(): stale.append(f); print(f,'stale')
    else: open(f,'w').write(t); print(f,n)
print('token',token)
if check: sys.exit(1 if stale else 0)
