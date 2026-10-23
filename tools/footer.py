# Writes every page's footer, the drawing's title block, from the one table below. Run from the repo root after changing
# any page, or after adding one (give it a row in PAGES first): python3 tools/footer.py
# python3 tools/footer.py --check writes nothing: it names each page whose footer is stale and exits 1 if there is one.
#
# Each page is a sheet in a set of ten. Its title block says which sheet it is, when it was last drawn and how many times
# it has been revised. The revisions are kept in tools/footer.json, one line a page: every run compares each page (all of
# it but its footer, with the stylesheet tokens and the security policy set aside) with what was recorded, and a page that
# has changed takes a new revision dated today, Miami time (a page changed twice in a day keeps that day's revision).
# The history it started from is the page's own: one revision for each day git shows a change to it.
#
# A new page: add a row to PAGES (its sheet, its part number within that sheet, its title in its own language), then run
# this. A Spanish or Portuguese page finds its English twin, and every link to an English page finds its Spanish or
# Portuguese twin, through the <link rel="alternate" hreflang> tags in the pages' heads; where there is none, the link
# goes to the English page and says so.
import re,json,sys,os,glob,hashlib,subprocess,datetime
from zoneinfo import ZoneInfo

check='--check' in sys.argv[1:]
TODAY=datetime.datetime.now(ZoneInfo('America/New_York')).date().isoformat()
STORE='tools/footer.json'

# The set: number, key, title in each language, the English page (its twins are found from it), and whether it is a
# specimen (an invented example, which the set's note names).
SET=[
  (1,'index',{'en':'Index','es':'Índice','pt':'Índice'},'/',False),
  (2,'developers',{'en':'Developers','es':'Desarrolladores','pt':'Incorporadoras'},'/developers.html',False),
  (3,'private-clients',{'en':'Private clients','es':'Clientes privados','pt':'Clientes privados'},'/private-clients.html',False),
  (4,'markets',{'en':'Markets','es':'Mercados','pt':'Mercados'},'/markets.html',False),
  (5,'journal',{'en':'Journal','es':'Notas','pt':'Notas'},'/journal/',False),
  (6,'planner',{'en':'Launch planner','es':'Planificador','pt':'Planejador'},'/planner.html',False),
  (7,'report',{'en':'Weekly report','es':'Informe semanal','pt':'Relatório semanal'},'/report.html',True),
  (8,'shortlist',{'en':'Short list','es':'Selección','pt':'Seleção'},'/shortlist.html',True),
  (9,'project-site',{'en':'Project site','es':'Sitio del proyecto','pt':'Site do projeto'},'/project-site.html',True),
  (10,'advisors',{'en':'Advisors','es':'Asesores','pt':'Consultores'},'/advisors.html',False),
]
NUM={k:n for n,k,*_ in SET}
# Sheets outside the set: the general notes (privacy, terms) and the vacant lot (the not-found page).
GENERAL={'privacy':'G.1','terms':'G.2','vacant':'00'}

# One row a page: sheet, part (None for the sheet itself), title on the page's own sheet. A specimen sheet has no title
# block, only its number in the slim footer under each page of it.
PAGES={
  'index.html':('index',None,'Index'),
  'developers.html':('developers',None,'Developers'),
  'private-clients.html':('private-clients',None,'Private clients'),
  'markets.html':('markets',None,'Markets'),
  'south-florida.html':('markets',1,'South Florida'),
  'new-york.html':('markets',2,'New York City'),
  'hamptons.html':('markets',3,'The Hamptons'),
  'los-angeles.html':('markets',4,'Los Angeles'),
  'dallas.html':('markets',5,'Dallas'),
  'tampa.html':('markets',6,'Tampa Bay'),
  'naples.html':('markets',7,'Naples'),
  'austin.html':('markets',8,'Austin'),
  'houston.html':('markets',9,'Houston'),
  'san-francisco.html':('markets',10,'San Francisco'),
  'orange-county.html':('markets',11,'Orange County'),
  'journal/index.html':('journal',None,'Journal'),
  'journal/buying-pre-construction-florida.html':('journal',1,'Journal'),
  'journal/launch-price-and-the-pre-sale-threshold.html':('journal',2,'Journal'),
  'journal/what-a-weekly-sales-report-should-measure.html':('journal',3,'Journal'),
  'journal/buying-new-construction-florida.html':('journal',4,'Journal'),
  'journal/buying-pre-construction-new-york.html':('journal',5,'Journal'),
  'journal/buying-new-construction-new-york.html':('journal',6,'Journal'),
  'journal/launching-in-miami-and-new-york.html':('journal',7,'Journal'),
  'journal/buying-pre-construction-texas.html':('journal',8,'Journal'),
  'journal/buying-new-construction-texas.html':('journal',9,'Journal'),
  'journal/buying-pre-construction-california.html':('journal',10,'Journal'),
  'journal/buying-new-construction-california.html':('journal',11,'Journal'),
  'journal/deposit-escrow-for-new-condominiums.html':('journal',12,'Journal'),
  'journal/reading-the-pace-of-sales.html':('journal',13,'Journal'),
  'journal/working-with-outside-brokers.html':('journal',14,'Journal'),
  'journal/releasing-inventory-in-a-new-building.html':('journal',15,'Journal'),
  'planner.html':('planner',None,'Launch planner'),
  'report.html':('report',None,'Weekly report'),
  'shortlist.html':('shortlist',None,'Short list'),
  'project-site.html':('project-site',None,'Project site'),
  'advisors.html':('advisors',None,'Advisors'),
  'privacy.html':('privacy',None,'Privacy'),
  'terms.html':('terms',None,'Terms'),
  '404.html':('vacant',None,'Vacant lot'),
  'es/index.html':('index',None,'Índice'),
  'es/desarrolladores.html':('developers',None,'Desarro&shy;lladores'),
  'es/clientes-privados.html':('private-clients',None,'Clientes privados'),
  'es/mercados.html':('markets',None,'Mercados'),
  'es/sur-de-florida.html':('markets',1,'Sur de Florida'),
  'es/nueva-york.html':('markets',2,'Nueva York'),
  'es/hamptons.html':('markets',3,'Hamptons'),
  'es/los-angeles.html':('markets',4,'Los Angeles'),
  'es/san-francisco.html':('markets',10,'San Francisco'),
  'es/orange-county.html':('markets',11,'Orange County'),
  'es/dallas.html':('markets',5,'Dallas'),
  'es/austin.html':('markets',8,'Austin'),
  'es/houston.html':('markets',9,'Houston'),
  'es/tampa.html':('markets',6,'Bahía de Tampa'),
  'es/naples.html':('markets',7,'Naples'),
  'es/comprar-preconstruccion-florida.html':('journal',1,'Notas'),
  'es/comprar-obra-nueva-florida.html':('journal',4,'Notas'),
  'es/planificador.html':('planner',None,'Planificador'),
  'es/informe-semanal.html':('report',None,'Informe semanal'),
  'es/asesores.html':('advisors',None,'Asesores'),
  'es/privacidad.html':('privacy',None,'Privacidad'),
  'es/terminos.html':('terms',None,'Términos'),
  'es/seleccion.html':('shortlist',None,'Selección'),
  'es/sitio-del-proyecto.html':('project-site',None,'Sitio del proyecto'),
  'es/notas.html':('journal',None,'Notas'),
  'es/precio-de-lanzamiento-y-umbral-de-preventa.html':('journal',2,'Notas'),
  'es/que-debe-medir-un-informe-semanal.html':('journal',3,'Notas'),
  'es/comprar-preconstruccion-nueva-york.html':('journal',5,'Notas'),
  'es/comprar-obra-nueva-nueva-york.html':('journal',6,'Notas'),
  'es/lanzar-en-miami-y-nueva-york.html':('journal',7,'Notas'),
  'es/comprar-preconstruccion-texas.html':('journal',8,'Notas'),
  'es/comprar-obra-nueva-texas.html':('journal',9,'Notas'),
  'es/comprar-preconstruccion-california.html':('journal',10,'Notas'),
  'es/comprar-obra-nueva-california.html':('journal',11,'Notas'),
  'es/custodia-de-depositos-condominios-nuevos.html':('journal',12,'Notas'),
  'es/leer-el-ritmo-de-ventas.html':('journal',13,'Notas'),
  'es/trabajar-con-corredores-externos.html':('journal',14,'Notas'),
  'es/liberar-inventario-en-un-edificio-nuevo.html':('journal',15,'Notas'),
  'pt/index.html':('index',None,'Índice'),
  'pt/incorporadoras.html':('developers',None,'Incorpo&shy;radoras'),
  'pt/clientes-privados.html':('private-clients',None,'Clientes privados'),
  'pt/mercados.html':('markets',None,'Mercados'),
  'pt/sul-da-florida.html':('markets',1,'Sul da Flórida'),
  'pt/nova-york.html':('markets',2,'Nova York'),
  'pt/hamptons.html':('markets',3,'Hamptons'),
  'pt/los-angeles.html':('markets',4,'Los Angeles'),
  'pt/san-francisco.html':('markets',10,'San Francisco'),
  'pt/orange-county.html':('markets',11,'Orange County'),
  'pt/dallas.html':('markets',5,'Dallas'),
  'pt/austin.html':('markets',8,'Austin'),
  'pt/houston.html':('markets',9,'Houston'),
  'pt/tampa.html':('markets',6,'Baía de Tampa'),
  'pt/naples.html':('markets',7,'Naples'),
  'pt/comprar-na-planta-florida.html':('journal',1,'Notas'),
  'pt/comprar-imovel-novo-florida.html':('journal',4,'Notas'),
  'pt/planejador.html':('planner',None,'Planejador'),
  'pt/relatorio-semanal.html':('report',None,'Relatório semanal'),
  'pt/consultores.html':('advisors',None,'Consultores'),
  'pt/privacidade.html':('privacy',None,'Privacidade'),
  'pt/termos.html':('terms',None,'Termos'),
  'pt/selecao.html':('shortlist',None,'Seleção'),
  'pt/site-do-projeto.html':('project-site',None,'Site do projeto'),
  'pt/notas.html':('journal',None,'Notas'),
  'pt/preco-de-lancamento-e-patamar-de-pre-venda.html':('journal',2,'Notas'),
  'pt/o-que-um-relatorio-semanal-deve-medir.html':('journal',3,'Notas'),
  'pt/comprar-na-planta-nova-york.html':('journal',5,'Notas'),
  'pt/comprar-imovel-novo-nova-york.html':('journal',6,'Notas'),
  'pt/lancar-em-miami-e-nova-york.html':('journal',7,'Notas'),
  'pt/comprar-na-planta-texas.html':('journal',8,'Notas'),
  'pt/comprar-imovel-novo-texas.html':('journal',9,'Notas'),
  'pt/comprar-na-planta-california.html':('journal',10,'Notas'),
  'pt/comprar-imovel-novo-california.html':('journal',11,'Notas'),
  'pt/custodia-de-depositos-condominios-novos.html':('journal',12,'Notas'),
  'pt/ler-o-ritmo-de-vendas.html':('journal',13,'Notas'),
  'pt/trabalhar-com-corretores-externos.html':('journal',14,'Notas'),
  'pt/liberar-estoque-em-um-edificio-novo.html':('journal',15,'Notas'),
}
# The not-found page answers in Spanish and Portuguese from templates in the same file, each with its own footer.
VACANT={'es':'Lote vacío','pt':'Lote vago'}

MARKETS=[('/south-florida.html',{'en':'South Florida','es':'Sur de Florida','pt':'Sul da Flórida'}),
         ('/new-york.html',{'en':'New York City','es':'Ciudad de Nueva York','pt':'Cidade de Nova York'}),
         ('/hamptons.html',{'en':'The Hamptons','es':'Hamptons','pt':'Hamptons'}),
         ('/markets.html',{'en':'All markets','es':'Todos los mercados','pt':'Todos os mercados'})]
FOLLOW=[('https://www.instagram.com/centamont','Instagram'),('https://www.youtube.com/@centamont','YouTube'),('https://x.com/centamont','X')]

W={
 'en':dict(pr='Practice',prd='New development and private client advisory in Miami and New York',of='Office',ofd='Miami, Florida',
   dr='Drawn',rev='Rev.',lt='Letters',ltd='Write to us',sh='Sheet',set='of 10',gen='General',mk='Markets',ss='Sheets',ssall='All ten sheets',fo='Follow',
   note='07 to 09 are specimens, with invented figures.',tab=' (opens in a new tab)',en='',
   copy='© 2026 Centamont.',priv='Privacy &amp; accessibility',terms='Terms',cred='Map data © OpenStreetMap contributors',credid='credits',eho='Equal Housing Opportunity',top='Back to top',
   home='/',name='English',hl='en'),
 'es':dict(pr='Especialidad',prd='Asesoría en nuevos desarrollos y a clientes privados en Miami y Nueva York',of='Oficina',ofd='Miami, Florida',
   dr='Dibujado',rev='Rev.',lt='Cartas',ltd='Escríbanos',sh='Lámina',set='de 10',gen='General',mk='Mercados',ss='Láminas',ssall='Las diez láminas',fo='Síganos',
   note='07 a 09 son muestras, con cifras inventadas.',tab=' (se abre en una pestaña nueva)',en=' (en inglés)',
   copy='© 2026 Centamont.',priv='Privacidad y accesibilidad',terms='Términos',cred='Datos del mapa © colaboradores de OpenStreetMap',credid='creditos',eho='Igualdad de Oportunidades en la Vivienda',top='Volver arriba',
   home='/es/',name='Español',hl='es'),
 'pt':dict(pr='Atuação',prd='Assessoria em lançamentos imobiliários e a clientes privados em Miami e Nova York',of='Escritório',ofd='Miami, Flórida',
   dr='Desenhado',rev='Rev.',lt='Cartas',ltd='Escreva-nos',sh='Prancha',set='de 10',gen='Geral',mk='Mercados',ss='Pranchas',ssall='As dez pranchas',fo='Siga-nos',
   note='07 a 09 são modelos, com números fictícios.',tab=' (abre em nova aba)',en=' (em inglês)',
   copy='© 2026 Centamont.',priv='Privacidade e acessibilidade',terms='Termos',cred='Dados do mapa © colaboradores do OpenStreetMap',credid='creditos',eho='Igualdade de Oportunidades na Habitação',top='Voltar ao topo',
   home='/pt/',name='Português',hl='pt-BR'),
}
EHO='<svg viewBox="0 0 32 32" width="18" height="18" aria-hidden="true" focusable="false"><path fill="currentColor" fill-rule="evenodd" d="M16 2 31 13.5h-4V30H5V13.5H1ZM10 16.5h12v3H10Zm0 6h12v3H10Z"/></svg>'

def lang_of(p): return p.split('/')[0] if p.split('/')[0] in ('es','pt') else 'en'
def file_of(url):
    f=url.lstrip('/').split('#')[0]
    return f+'index.html' if f=='' or f.endswith('/') else f
def url_of(f):
    u='/'+f
    return u[:-len('index.html')] if u.endswith('/index.html') or u=='/index.html' else u
_alt={}
def alternates(f):
    if f not in _alt:
        try: src=open(f).read()
        except FileNotFoundError: src=''
        _alt[f]={('pt' if h=='pt-BR' else h):u for h,u in re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="https://centamont\.com([^"]*)"',src)}
    return _alt[f]
def twin(en_url,lang):
    "The page in this language for an English address, or None where there is only the English."
    if lang=='en': return en_url
    return alternates(file_of(en_url)).get(lang)

def link(en_url,lang,body,cur=False,cls=None):
    "A link to the page in the reader's language, or to the English page, marked as English."
    u=twin(en_url,lang); a=' aria-current="page"' if cur else ''
    if u: return '<a href="%s"%s>%s</a>'%(u,a,body)
    return '<a href="%s" hreflang="en"%s>%s<span class="vh">%s</span><span class="en-tag" aria-hidden="true">EN</span></a>'%(en_url,a,body,W[lang]['en'])

def dot(d): return ' · '.join(d.split('-'))
def number(key,part):
    n=GENERAL.get(key) or '%02d'%NUM[key]
    if '.' in n: a,b=n.split('.'); return a+'<small>.'+b+'</small>'
    return n+('<small>.%d</small>'%part if part else '')

def block(page,lang,key,part,title,revs,letter):
    w=W[lang]; me=url_of(page) if page!='404.html' else None
    sheet_item=lambda n,k,t,u: '        <li>%s</li>'%link(u,lang,'<span class="n">%02d</span><span class="t">%s</span>'%(n,t[lang]),cur=(k==key and part is None and twin(u,lang)==me))
    ss='\n'.join(sheet_item(n,k,t,u) for n,k,t,u,_ in SET)
    mk=''.join('<li>%s</li>'%link(u,lang,t[lang],cur=(twin(u,lang)==me)) for u,t in MARKETS)
    fo='\n'.join('        <li><a href="%s" target="_blank" rel="noopener">%s<span class="vh">%s</span></a></li>'%(u,n,w['tab']) for u,n in FOLLOW)
    of=w['gen'] if key in ('privacy','terms') else w['set']
    last=revs[-1]
    # the revisions before this one, newest first, in the sheet's own cell where it stands two rows tall
    rv=''.join('<li><span>%s %d</span><time datetime="%s">%s</time></li>'%(w['rev'],i+1,d,dot(d)) for i,d in list(reversed(list(enumerate(revs[:-1]))))[:3])
    rv='<ol class="rv">%s</ol>'%rv if rv else ''
    sib=[(l,twin(url_of(page) if lang=='en' else (alternates(page).get('en') or ''),l)) for l in ('en','es','pt') if l!=lang] if page!='404.html' else []
    sib=[(l,u) for l,u in sib if u]
    langs=('<span class="nw"><i class="sep"> · </i>'+' · '.join('<a href="%s" hreflang="%s" lang="%s">%s</a>'%(u,W[l]['hl'],W[l]['hl'],W[l]['name']) for l,u in sib)+'</span>') if sib else ''
    return f'''
  <div class="wrap">
    <svg class="sig" viewBox="0 0 1000 130" aria-hidden="true"><use href="/media/sig.svg#sig"/></svg>
    <dl class="tb">
      <div class="t-pr"><dt>{w['pr']}</dt><dd>{w['prd']}</dd></div>
      <div class="t-of"><dt>{w['of']}</dt><dd>{w['ofd']}<br><a href="mailto:office@centamont.com">office@<wbr>centamont.com</a></dd></div>
      <div class="t-dr"><dt>{w['dr']}</dt><dd class="num"><time datetime="{last}">{dot(last)}</time><small>{w['rev']} {len(revs)}</small></dd></div>
      <div class="t-lt"><dt>{w['lt']}</dt><dd><a href="{letter}">{w['ltd']}</a></dd></div>
      <div class="t-sh"><dt>{w['sh']}</dt><dd><span class="st">{title}</span>{rv}<span class="no"><span class="sn">{number(key,part)}</span><span class="of">{of}</span></span></dd></div>
      <div class="t-mk"><dt>{w['mk']}</dt><dd><ul>{mk}</ul></dd></div>
      <div class="t-ss"><dt>{w['ss']}</dt><dd><details class="ss-d"><summary>{w['ssall']}</summary><ul class="ss">
{ss}
      </ul><p class="ss-note">{w['note']}</p></details></dd></div>
      <div class="t-fo"><dt>{w['fo']}</dt><dd><ul>
{fo}
      </ul></dd></div>
    </dl>
    <div class="legal"><span>{w['copy']} <a class="cred" href="{twin('/terms.html',lang)}#{w['credid']}">{w['cred']}</a></span><span><span class="nw">{link('/privacy.html',lang,w['priv'])}<i class="sep"> ·</i></span> <span class="nw">{link('/terms.html',lang,w['terms'])}<i class="sep"> ·</i></span> <span class="nw eho">{EHO}{w['eho']}</span><span class="nw"><i class="sep"> · </i><a href="#top" class="totop">{w['top']}</a></span>{langs}</span></div>
  </div>
'''

FOOT=re.compile(r'(<footer>)(.*?)(</footer>)',re.S)
TPL=re.compile(r'(<template id="nf-(es|pt)">.*?<div data-p="footer">)(.*?)(</div></template>)',re.S)
RP=re.compile(r'(<footer class="rp-foot">.*?<span class="num">)\d\d( · )')
def body(t):
    "The page as its revisions are counted: all of it but its footers, its stylesheet tokens and its security policy."
    t=FOOT.sub('',t); t=TPL.sub(lambda m:m.group(1),t); t=RP.sub(lambda m:m.group(1)+m.group(2),t)
    t=re.sub(r'\?v=[0-9a-f]+','',t); t=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>','',t)
    return hashlib.sha256(t.encode()).hexdigest()[:16]

def history(f):
    "One revision for each day, Miami time, on which git shows a change to the page."
    out=subprocess.run(['git','log','--format=%cI','--',f],capture_output=True,text=True).stdout.split()
    days=sorted({datetime.datetime.fromisoformat(s).astimezone(ZoneInfo('America/New_York')).date().isoformat() for s in out})
    return days or [TODAY]

store=json.load(open(STORE)) if os.path.exists(STORE) else {}
stale=[]
for f in sorted(glob.glob('*.html')+glob.glob('*/*.html')):
    t=open(f).read()
    if ('<dl class="tb">' in t or 'class="rp-foot"' in t) and f not in PAGES: stale.append(f); print(f,'has no row in PAGES in tools/footer.py'); continue
for f,(key,part,title) in PAGES.items():
    t=open(f).read(); lang=lang_of(f); h=body(t)
    rec=store.get(f) or {'revs':history(f),'hash':h}
    if rec['hash']!=h:
        if check: stale.append(f); print(f,'changed since its footer was drawn: run python3 tools/footer.py'); continue
        if rec['revs'][-1]!=TODAY: rec['revs'].append(TODAY)
        rec['hash']=h
    store[f]=rec
    new=RP.sub(lambda m:m.group(1)+'%02d'%NUM[key]+m.group(2),t) if key in NUM else t
    if '<dl class="tb">' in t:
        letter='#letter' if 'id="letter"' in t else W[lang]['home']+'#letter'
        tok=re.search(r'site\.css\?v=([0-9a-f]+)',t); tok='?v='+tok.group(1) if tok else ''
        fix=lambda s:s.replace('/media/sig.svg#','/media/sig.svg'+tok+'#')
        new=FOOT.sub(lambda m:m.group(1)+fix(block(f,lang,key,part,title,rec['revs'],letter))+m.group(3),new,count=1)
        if f=='404.html':
            new=TPL.sub(lambda m:m.group(1)+fix(block(f,m.group(2),key,part,VACANT[m.group(2)],rec['revs'],W[m.group(2)]['home']+'#letter'))+m.group(4),new)
    if new!=t:
        if check: stale.append(f); print(f,'footer stale: run python3 tools/footer.py')
        else: open(f,'w').write(new)
if not check:
    with open(STORE,'w') as o:
        o.write('{\n'+',\n'.join('  %s: %s'%(json.dumps(k),json.dumps(store[k],ensure_ascii=False)) for k in sorted(store))+'\n}\n')
if check: sys.exit(1 if stale else 0)
