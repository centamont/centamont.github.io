# Writes the firm's own facts into the pages from one file, tools/firm.json: how to reach the partners (the letter sent
# through a form, a booking page, a telephone, how soon a partner replies), who the partners are and what they have done
# (partner cards, a record band with its press line, a developer's own words on one engagement), the journal's byline,
# and the structured data that names them. Run from the repo root after changing tools/firm.json: python3 tools/firm.py,
# then tools/footer.py (which carries the telephone into every footer), tools/version.py and tools/csp.py (which allows
# the form's host).
# python3 tools/firm.py --check writes nothing: it names each page that is stale and exits 1 if there is one.
# python3 tools/firm.py --with FILE reads FILE in place of tools/firm.json: a trial set, to see the parts on the page
# before the real facts arrive. Never commit what a trial writes.
#
# Each part is written between a pair of markers in its pages, <!-- firm:NAME --> and <!-- /firm:NAME -->, and an entry
# left empty leaves its pair empty, so a page shows nothing it cannot yet back. Nothing here is invented: every name,
# figure and quotation comes from the file as given, in each of the three languages.
#
# tools/firm.json
#   contact.form          the address the letter is sent to, a form service's (https://formspree.io/f/...); left empty,
#                         the letter opens in the writer's own email, as it always has
#   contact.form_service  that service's name, and contact.form_privacy its privacy policy, for the privacy page
#   contact.booking       a page where a first call can be booked (a Google Calendar booking page, say)
#   contact.phone         the office's number in international form (+13055550123); phone_display, as it is written
#   contact.whatsapp      true: the Spanish and Portuguese pages offer the same number on WhatsApp
#   contact.reply         {en, es, pt}: one sentence on how soon a partner replies
#   partners              [{name, founder, role: {en, es, pt}, bio: {...}, before: {...}}]: "before" is the record the
#                         partner can show from earlier work, in one line
#   byline                the names that sign the journal's notes ([] keeps "The partners")
#   record                {figures: [{value, label: {en, es, pt}}], note: {...}}: what the partners can prove, and the
#                         line that says where the figures come from
#   press                 [{name, url}]: where the firm has been written about
#   case                  {quote: {en, es, pt}, by, role: {en, es, pt}}: a developer's or lender's own words, used with
#                         their written approval
import re,json,sys,glob,html
from urllib.parse import urlparse

args=sys.argv[1:]
check='--check' in args
F=json.load(open(args[args.index('--with')+1] if '--with' in args else 'tools/firm.json'))
C=F['contact']

LETTER=['index.html','developers.html','private-clients.html','advisors.html',
        'es/index.html','es/desarrolladores.html','es/clientes-privados.html','es/asesores.html',
        'pt/index.html','pt/incorporadoras.html','pt/clientes-privados.html','pt/consultores.html']
HOMES=['index.html','es/index.html','pt/index.html']
DEVS=['developers.html','es/desarrolladores.html','pt/incorporadoras.html']
PRIVACY=['privacy.html','es/privacidad.html','pt/privacidade.html']
ORG='https://centamont.com/#org'
ARROW='<svg viewBox="0 0 18 8" aria-hidden="true"><path d="M0 4h17M13 .5 17 4l-4 3.5" fill="none" stroke="currentColor"/></svg>'

W={
 'en':dict(send='Send the letter',open='Open in your email',
   fine_send='The letter goes straight to the partners. If it cannot be sent from here, it opens in your own email instead.',
   fine_mail='Nothing is sent from this page. The letter opens in your own email, and you send it yourself.',
   book='Or book twenty minutes with a partner',tab=' (opens in a new tab)',
   email_l='Email',email_aria='Your email',email_ph='your email',
   partners='The partners',record='The record',press='Written about in',by='The partners',join=' and ',
   p_mail='The letters on the home, developers, private clients and advisors pages are written in your browser, then opened in your own email app and copied to your clipboard. Nothing in them is sent or stored by this site; you send them yourself.',
   p_send='The letters on the home, developers, private clients and advisors pages are written in your browser. When you send one, its words, your name, your company where you give it and your email address go to the office through {service}, the form service that delivers them to our email{policy}. We keep a letter as correspondence and use it only to reply. If a letter cannot be sent from the page, it opens in your own email app instead and is copied to your clipboard, and you send it yourself.',
   p_policy=', under <a href="{url}">its own privacy policy</a>',
   p_book='The link to book a call opens {who} booking page in a new tab. What you enter there goes to {to} and to us, under {of} privacy policy, and is used only to arrange the call.',
   p_google=('Google’s','Google','Google’s'),p_other=('a scheduling service’s','that service','that service’s')),
 'es':dict(send='Enviar la carta',open='Abrir en su correo',
   fine_send='La carta llega directamente a los socios. Si no puede enviarse desde aquí, se abre en su propio correo.',
   fine_mail='Esta página no envía nada. La carta se abre en su propio correo y usted la envía personalmente.',
   book='O reserve veinte minutos con un socio',tab=' (se abre en una pestaña nueva)',
   email_l='Correo',email_aria='Su correo electrónico',email_ph='su correo',
   partners='Los socios',record='Trayectoria',press='Han escrito sobre nosotros',by='Los socios',join=' y ',
   p_mail='Las cartas de las páginas de inicio, de desarrolladores, de clientes privados y de asesores se escriben en su navegador y luego se abren en su propia aplicación de correo y se copian a su portapapeles. Este sitio no envía ni guarda nada de ellas; las envía usted mismo.',
   p_send='Las cartas de las páginas de inicio, de desarrolladores, de clientes privados y de asesores se escriben en su navegador. Cuando envía una, su texto, su nombre, su empresa si la indica y su correo electrónico llegan a la oficina a través de {service}, el servicio de formularios que las entrega a nuestro correo{policy}. Guardamos cada carta como correspondencia y solo la usamos para responder. Si una carta no puede enviarse desde la página, se abre en su propia aplicación de correo y se copia a su portapapeles, y la envía usted mismo.',
   p_policy=', según <a href="{url}">su propia política de privacidad</a>',
   p_book='El enlace para reservar una llamada abre en una pestaña nueva la página de reservas {who}. Lo que escriba allí llega {to} y a nosotros, según la política de privacidad {of}, y solo se usa para concertar la llamada.',
   p_google=('de Google','a Google','de Google'),p_other=('de un servicio de agenda','a ese servicio','de ese servicio')),
 'pt':dict(send='Enviar a carta',open='Abrir no seu e-mail',
   fine_send='A carta vai direto para os sócios. Se não puder ser enviada daqui, ela se abre no seu próprio e-mail.',
   fine_mail='Nada é enviado por esta página. A carta se abre no seu próprio e-mail e você a envia pessoalmente.',
   book='Ou reserve vinte minutos com um sócio',tab=' (abre em nova aba)',
   email_l='E-mail',email_aria='Seu e-mail',email_ph='seu e-mail',
   partners='Os sócios',record='Trajetória',press='Escreveram sobre nós',by='Os sócios',join=' e ',
   p_mail='As cartas das páginas inicial, de incorporadoras, de clientes privados e de consultores são escritas no seu navegador e depois abertas no seu próprio aplicativo de e-mail e copiadas para a sua área de transferência. Nada nelas é enviado ou guardado por este site; quem as envia é você.',
   p_send='As cartas das páginas inicial, de incorporadoras, de clientes privados e de consultores são escritas no seu navegador. Quando você envia uma, o texto, o seu nome, a sua empresa, se informada, e o seu e-mail chegam ao escritório por meio de {service}, o serviço de formulários que as entrega ao nosso e-mail{policy}. Guardamos cada carta como correspondência e só a usamos para responder. Se uma carta não puder ser enviada pela página, ela se abre no seu próprio aplicativo de e-mail e é copiada para a sua área de transferência, e quem a envia é você.',
   p_policy=', segundo <a href="{url}">a própria política de privacidade</a>',
   p_book='O link para marcar uma conversa abre em nova aba a página de agendamento {who}. O que você informar ali chega {to} e a nós, segundo a política de privacidade {of}, e só é usado para marcar a conversa.',
   p_google=('do Google','ao Google','do Google'),p_other=('de um serviço de agenda','a esse serviço','desse serviço')),
}

def lang_of(p): return p.split('/')[0] if p.split('/')[0] in ('es','pt') else 'en'
def esc(t): return html.escape(t or '',quote=True)
def tr(d,l): return (d or {}).get(l) or ''
def newtab(l,href,body,cls):
    return f'<a class="{cls}" href="{esc(href)}" target="_blank" rel="noopener">{body}<span class="vh">{W[l]["tab"]}</span>{ARROW}</a>'

def reach(l):
    rows=[]
    if tr(C.get('reply'),l): rows.append(f'<p class="reply">{esc(tr(C["reply"],l))}</p>')
    if C.get('phone'):
        tel=f'<a class="ul" href="tel:{esc(C["phone"])}">{esc(C.get("phone_display") or C["phone"])}</a>'
        if C.get('whatsapp') and l!='en':
            tel+=' <span aria-hidden="true">·</span> '+f'<a class="ul" href="https://wa.me/{re.sub(r"[^0-9]","",C["phone"])}" target="_blank" rel="noopener">WhatsApp<span class="vh">{W[l]["tab"]}</span></a>'
        rows.append(f'<p class="tel">{tel}</p>')
    return f'<div class="firm-reach">{"".join(rows)}</div>' if rows else ''

def partners(l):
    ps=F.get('partners') or []
    if not ps: return ''
    li=[]
    for p in ps:
        parts=[f'<h3>{esc(p["name"])}</h3>']
        if tr(p.get('role'),l): parts.append(f'<p class="role">{esc(tr(p["role"],l))}</p>')
        if tr(p.get('bio'),l): parts.append(f'<p class="bio">{esc(tr(p["bio"],l))}</p>')
        if tr(p.get('before'),l): parts.append(f'<p class="before">{esc(tr(p["before"],l))}</p>')
        li.append('<li>'+''.join(parts)+'</li>')
    return f'<ul class="firm-partners" aria-label="{W[l]["partners"]}">{"".join(li)}</ul>'

def record(l,home):
    R=F.get('record') or {}; figs=R.get('figures') or []; press=F.get('press') or []
    if not figs and not press: return ''
    hid='firmRecord'
    body=f'<h2 class="k" id="{hid}">{W[l]["record"]}</h2>'
    if figs: body+='<dl>'+''.join(f'<div><dt>{esc(tr(f.get("label"),l))}</dt><dd>{esc(f["value"])}</dd></div>' for f in figs)+'</dl>'
    if tr(R.get('note'),l): body+=f'<p class="note">{esc(tr(R["note"],l))}</p>'
    if press:
        names=' <span aria-hidden="true">·</span> '.join(f'<a class="ul" href="{esc(p["url"])}">{esc(p["name"])}</a>' if p.get('url') else esc(p['name']) for p in press)
        body+=f'<p class="outlets"><span class="k">{W[l]["press"]}</span> {names}</p>'
    if home: body=f'<div class="wrap">{body}</div>'
    return f'<section class="firm-record" aria-labelledby="{hid}">{body}</section>'

def case(l):
    K=F.get('case')
    if not K or not tr(K.get('quote'),l): return ''
    who=f'<cite>{esc(K.get("by"))}</cite>'
    if tr(K.get('role'),l): who+=f' <span class="role">{esc(tr(K["role"],l))}</span>'
    return f'<figure class="firm-case"><blockquote><p>{esc(tr(K["quote"],l))}</p></blockquote><figcaption>{who}</figcaption></figure>'

def privacy(l):
    w=W[l]
    if C.get('form'):
        pol=w['p_policy'].format(url=esc(C['form_privacy'])) if C.get('form_privacy') else ''
        t='<p>'+w['p_send'].format(service=esc(C.get('form_service') or urlparse(C['form']).netloc),policy=pol)+'</p>'
    else: t='<p>'+w['p_mail']+'</p>'
    if C.get('booking'):
        g='google' in urlparse(C['booking']).netloc
        who,to,of=w['p_google'] if g else w['p_other']
        t+='\n<p>'+w['p_book'].format(who=who,to=to,of=of)+'</p>'
    return t

def slot(t,name,body,f):
    n=len(re.findall(rf'<!-- firm:{name} -->.*?<!-- /firm:{name} -->',t,re.S))
    assert n==1,f'{f}: {n} firm:{name} slots'
    return re.sub(rf'(<!-- firm:{name} -->).*?(<!-- /firm:{name} -->)',lambda m:m.group(1)+body+m.group(2),t,flags=re.S)

def letter(t,l,f):
    w=W[l]; send=C.get('form') or ''
    t,n=re.subn(r'<form class="letter" id="letter"(?: data-send="[^"]*")? novalidate>',f'<form class="letter" id="letter"{" data-send="+chr(34)+esc(send)+chr(34) if send else ""} novalidate>',t); assert n==1,f
    t,n=re.subn(r'<button type="submit" class="btn solid" data-to="(?:mail|send)">[^<]*<svg',f'<button type="submit" class="btn solid" data-to="{"send" if send else "mail"}">{w["send"] if send else w["open"]}<svg',t); assert n==1,f
    t,n=re.subn(r'(<div class="fallback" id="letterCopy" hidden>.*?</div>\s*)<p class="fine">[^<]*</p>',lambda m:m.group(1)+f'<p class="fine">{w["fine_send"] if send else w["fine_mail"]}</p>',t,flags=re.S); assert n==1,f
    rt=f'<br><span class="blank" data-l="{w["email_l"]}"><input type="email" name="email" aria-label="{w["email_aria"]}" aria-required="true" placeholder="{w["email_ph"]}" autocomplete="email" size="20"></span>' if send else ''
    t=slot(t,'replyto',rt,f)
    t=slot(t,'book',newtab(l,C['booking'],w['book'],'more direct') if C.get('booking') else '',f)
    t=slot(t,'reach',reach(l),f)
    t=slot(t,'partners',partners(l),f)
    return t

# The structured data: the telephone on the firm wherever it is described in full, the partners as its founders and
# people, and the journal's notes signed by name.
def people(l):
    out={}
    for p in F.get('partners') or []:
        d={'@type':'Person','name':p['name'],'worksFor':{'@id':ORG}}
        if tr(p.get('role'),l): d['jobTitle']=tr(p['role'],l)
        out.setdefault('founder' if p.get('founder') else 'employee',[]).append(d)
    return out
def walk(o,fn):
    if isinstance(o,dict):
        fn(o)
        for v in o.values(): walk(v,fn)
    elif isinstance(o,list):
        for v in o: walk(v,fn)
def data(t,l,f):
    def one(m):
        raw=m.group(2); d=json.loads(raw)
        def art(o):
            if o.get('@type')=='Article':
                # (each partner who signs works for the firm as the page described it, which is what returns if the
                # byline is emptied again)
                names=F.get('byline') or []; a=o.get('author')
                firm=a[0]['worksFor'] if isinstance(a,list) else a
                o['author']=[{'@type':'Person','name':n,'worksFor':firm} for n in names] if names else firm
        def org(o):
            if o.get('@id')==ORG and 'email' in o:
                if C.get('phone'): o['telephone']=C['phone']
                else: o.pop('telephone',None)
                if 'logo' in o and 'description' in o:
                    for k in ('founder','employee'): o.pop(k,None)
                    o.update(people(l))
        walk(d,art); walk(d,org)
        if d==json.loads(raw): return m.group(0)
        return m.group(1)+json.dumps(d,ensure_ascii=False,separators=(',',':'))+m.group(3)
    return re.sub(r'(<script type="application/ld\+json">\s*)(.*?)(\s*</script>)',one,t,flags=re.S)

def byline(t,l):
    names=F.get('byline') or []
    by=esc(W[l]['join'].join(names) if len(names)<3 else ', '.join(names[:-1])+W[l]['join']+names[-1]) if names else W[l]['by']
    return re.sub(r'<span class="nw by">[^<]*</span>',f'<span class="nw by">{by}</span>',t)

pages=sorted(set(glob.glob('*.html')+glob.glob('journal/*.html')+glob.glob('es/*.html')+glob.glob('pt/*.html')))
stale=[]
for f in pages:
    old=open(f).read(); t=old; l=lang_of(f)
    if f in LETTER: t=letter(t,l,f)
    if f in HOMES: t=slot(t,'record',record(l,True),f)
    if f in DEVS: t=slot(t,'record',record(l,False),f); t=slot(t,'case',case(l),f)
    if f in PRIVACY: t=slot(t,'privacy',privacy(l),f)
    if 'class="nw by"' in t: t=byline(t,l)
    t=data(t,l,f)
    if t!=old:
        if check: stale.append(f); print(f,'stale')
        else: open(f,'w').write(t); print(f)
if check: sys.exit(1 if stale else 0)
