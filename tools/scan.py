# Reads what the open internet can see of centamont.com and prints it plainly: the domain's public records through a
# public resolver, the registry directories for the domain and for names that resemble it, the certificate logs, the
# responses and headers of the site's addresses, the TLS versions the host accepts, the archive record and the Pages
# settings the repository's own token may read. Every step is a plain read of public information that anyone can
# repeat, and the log repeats nothing a visitor could not look up. Run from the repo root: python3 tools/scan.py
import hashlib, json, os, socket, ssl, time, http.client, urllib.request, urllib.parse, urllib.error
from datetime import datetime, timezone

DOMAIN = 'centamont.com'
UA = 'centamont-scan'
OUT = {'when': datetime.now(timezone.utc).isoformat(), 'domain': DOMAIN}

def hop(url, timeout=30, headers=None, keep=300):
    """One request without following redirects: status, headers, and the body's size, hash and opening."""
    u = urllib.parse.urlsplit(url)
    C = http.client.HTTPSConnection if u.scheme == 'https' else http.client.HTTPConnection
    try:
        c = C(u.hostname, u.port, timeout=timeout)
        c.request('GET', (u.path or '/') + ('?' + u.query if u.query else ''), headers={'User-Agent': UA, **(headers or {})})
        r = c.getresponse(); body = r.read(2_000_000)
        return {'status': r.status, 'reason': r.reason, 'headers': r.getheaders(), 'length': len(body),
                'sha256': hashlib.sha256(body).hexdigest()[:16], 'head': body[:keep].decode('utf-8', 'replace')}
    except Exception as e:
        return {'error': repr(e)}

def follow(url, headers=None, tries=3):
    """A request that follows redirects: (status, body), or (None, the error)."""
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'application/json, */*', **(headers or {})})
            with urllib.request.urlopen(req, timeout=40) as r: return r.status, r.read()
        except urllib.error.HTTPError as e: return e.code, e.read()[:4000]
        except Exception as e:
            if k == tries - 1: return None, repr(e).encode()
            time.sleep(3 * (k + 1))

# 1. DNS, through Google's resolver with DNSSEC validation requested
TYPES = {'A': 1, 'NS': 2, 'CNAME': 5, 'SOA': 6, 'MX': 15, 'TXT': 16, 'AAAA': 28, 'DS': 43, 'CAA': 257}
def dns(name, kind):
    s, b = follow(f'https://dns.google/resolve?name={urllib.parse.quote(name)}&type={kind}&do=1')
    if s != 200: return {'error': s, 'body': b[:200].decode('utf-8', 'replace')}
    d = json.loads(b)
    return {'status': d.get('Status'), 'AD': d.get('AD'), 'answers': [a['data'] for a in d.get('Answer', []) if a.get('type') == TYPES[kind]],
            'cnames': [a['data'] for a in d.get('Answer', []) if a.get('type') == 5]}

apex = {k: dns(DOMAIN, k) for k in ('A', 'AAAA', 'NS', 'SOA', 'MX', 'TXT', 'CAA', 'DS')}
names = ['www', 'mail', 'mail2', 'smtp', 'imap', 'pop', 'webmail', 'mta-sts', 'autodiscover', 'autoconfig', 'calendar', 'docs',
         'drive', 'sites', 'ftp', 'blog', 'dev', 'staging', 'test', 'app', 'api', 'm', 'shop', 'admin', 'cdn', 'static', 'assets',
         'es', 'pt', 'en', 'portal', 'login', 'vpn', 'remote', 'git', 'status', 'help', 'support', 'news', 'media', 'img',
         'images', 'office', 'brief', 'planner', 'report', 'zz-wildcard-probe-7f3a']
subs = {n: {k: dns(f'{n}.{DOMAIN}', k) for k in ('A', 'AAAA', 'CNAME')} for n in names}
txts = {n: dns(f'{n}.{DOMAIN}', 'TXT') for n in ('_dmarc', '_mta-sts', '_smtp._tls', 'default._bimi', 'google._domainkey', 'selector1._domainkey',
                                                   'selector2._domainkey', 'k1._domainkey', '_github-pages-challenge-centamont', '_acme-challenge', '_domainconnect')}
OUT['dns'] = {'apex': apex, 'names': subs, 'txt': txts}

# 2. Registry directories: the domain itself, its registrar's record, and names that resemble it
def rdap(name):
    tld = name.rsplit('.', 1)[-1]
    url = f'https://rdap.verisign.com/{tld}/v1/domain/{name}' if tld in ('com', 'net') else f'https://rdap.org/domain/{name}'
    s, b = follow(url, tries=2)
    r = {'status': s}
    if s == 200:
        try:
            d = json.loads(b)
            r['statuses'] = d.get('status'); r['events'] = d.get('events'); r['nameservers'] = [n.get('ldhName') for n in d.get('nameservers', [])]
            r['secureDNS'] = d.get('secureDNS'); r['registrar'] = [e.get('vcardArray') for e in d.get('entities', []) if 'registrar' in (e.get('roles') or [])]
            r['links'] = [l.get('href') for l in d.get('links', [])]
        except Exception as e: r['error'] = repr(e)
    elif b: r['body'] = b[:200].decode('utf-8', 'replace')
    return r

OUT['rdap'] = {DOMAIN: rdap(DOMAIN)}
s, b = follow(f'https://rdap.namecheap.com/domain/{DOMAIN}', tries=1)
OUT['rdap']['registrar-record'] = {'status': s, 'body': b[:6000].decode('utf-8', 'replace')}
base = DOMAIN.split('.')[0]
endings = ['co', 'net', 'org', 'io', 'ai', 'us', 'info', 'biz', 'miami', 'nyc', 'realestate', 'homes', 'properties', 'estate', 'group',
           'capital', 'com.br', 'com.mx', 'mx', 'es', 'pt', 'uk', 'co.uk', 'ca', 'de', 'fr', 'it', 'ch', 'ae', 'sg', 'hk', 'app', 'xyz', 'online', 'site']
typos = ['centamount', 'centamonte', 'centamonts', 'centamontt', 'centamon', 'centamomt', 'centanont', 'cetamont', 'centamnot', 'ccentamont',
         'sentamont', 'kentamont', 'centarnont', 'centa-mont', 'centamontgroup', 'centamontrealty', 'centamontrealestate', 'centamont-realestate',
         'centamontre', 'centamontmiami', 'centamont-miami', 'centamontny', 'centamontnewyork', 'thecentamont', 'centamontllc', 'centamontinc',
         'centamontcapital', 'centamontadvisory', 'centamontpartners', 'centamontluxury', 'centamontresidences', 'centamontcondos']
look = {}
for n in [f'{base}.{e}' for e in endings] + [f'{t}.com' for t in typos]:
    look[n] = {'rdap': rdap(n), 'ns': dns(n, 'NS'), 'a': dns(n, 'A')}
    time.sleep(0.4)
OUT['lookalikes'] = look

# 3. The site's addresses: the first hop of each, with its headers
urls = [f'https://{DOMAIN}/', f'http://{DOMAIN}/', f'https://www.{DOMAIN}/', f'http://www.{DOMAIN}/', 'https://centamont.github.io/', 'http://centamont.github.io/',
        f'https://{DOMAIN}/index.html', f'https://{DOMAIN}/robots.txt', f'https://{DOMAIN}/sitemap.xml', f'https://{DOMAIN}/.well-known/security.txt',
        f'https://{DOMAIN}/site.webmanifest', f'https://{DOMAIN}/404.html', f'https://{DOMAIN}/no-such-page-probe-7f3a', f'https://{DOMAIN}/journal/',
        f'https://{DOMAIN}/feed.xml', f'https://{DOMAIN}/developer-brief.pdf', f'https://{DOMAIN}/email/signature-lockup.png',
        f'https://{DOMAIN}/CLAUDE.md', f'https://{DOMAIN}/README.md', f'https://{DOMAIN}/package.json', f'https://{DOMAIN}/package-lock.json',
        f'https://{DOMAIN}/playwright.config.js', f'https://{DOMAIN}/_config.yml', f'https://{DOMAIN}/tools/watch.py', f'https://{DOMAIN}/tools/csp.py',
        f'https://{DOMAIN}/tests/site.spec.js', f'https://{DOMAIN}/_src/site.css', f'https://{DOMAIN}/_src/site.js', f'https://{DOMAIN}/.github/workflows/watch.yml',
        f'https://{DOMAIN}/.gitignore', f'https://{DOMAIN}/.git/HEAD', f'https://{DOMAIN}/PRODUCT.md', f'https://{DOMAIN}/DESIGN.md', f'https://{DOMAIN}/.claude/skills/',
        f'https://{DOMAIN}/node_modules/@playwright/test/package.json', f'https://{DOMAIN}/playwright-report/index.html', f'https://{DOMAIN}/test-results/']
OUT['http'] = {u: hop(u, keep=1200 if u.endswith('.txt') else 300) for u in urls}
OUT['http-browser'] = hop(f'https://{DOMAIN}/', headers={'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/130 Safari/537.36'})

# 4. TLS: the certificate, and which protocol versions the host accepts
def tls(minv=None, maxv=None):
    ctx = ssl.create_default_context()
    try:
        if minv: ctx.minimum_version = minv
        if maxv: ctx.maximum_version = maxv
        if maxv and maxv < ssl.TLSVersion.TLSv1_2: ctx.set_ciphers('DEFAULT:@SECLEVEL=0')
    except Exception as e: return {'config-error': repr(e)}
    try:
        with socket.create_connection((DOMAIN, 443), timeout=20) as s, ctx.wrap_socket(s, server_hostname=DOMAIN) as w:
            c = w.getpeercert()
            return {'version': w.version(), 'cipher': w.cipher(), 'issuer': c.get('issuer'), 'subject': c.get('subject'), 'notBefore': c.get('notBefore'),
                    'notAfter': c.get('notAfter'), 'san': c.get('subjectAltName'), 'ocsp': c.get('OCSP'), 'caIssuers': c.get('caIssuers')}
    except Exception as e: return {'error': repr(e)}
V = ssl.TLSVersion
OUT['tls'] = {'default': tls(), 'tls1.0-only': tls(V.TLSv1, V.TLSv1), 'tls1.1-only': tls(V.TLSv1_1, V.TLSv1_1), 'tls1.2-only': tls(V.TLSv1_2, V.TLSv1_2), 'tls1.3-only': tls(V.TLSv1_3, V.TLSv1_3)}

# 5. Certificate logs, the archive record, the preload list, and the visit counter's public face
s, b = follow(f'https://crt.sh/?q=%25.{DOMAIN}&output=json', tries=2)
try: OUT['crt'] = {'status': s, 'entries': [{k: c.get(k) for k in ('issuer_name', 'common_name', 'name_value', 'not_before', 'not_after', 'entry_timestamp')} for c in json.loads(b)]} if s == 200 else {'status': s, 'body': b[:300].decode('utf-8', 'replace')}
except Exception as e: OUT['crt'] = {'status': s, 'error': repr(e)}
s, b = follow(f'https://archive.org/wayback/available?url={DOMAIN}', tries=2); OUT['wayback'] = {'status': s, 'body': b[:2000].decode('utf-8', 'replace')}
s, b = follow(f'https://web.archive.org/cdx/search/cdx?url={DOMAIN}*&output=json&limit=200&fl=timestamp,original,statuscode', tries=2); OUT['wayback-cdx'] = {'status': s, 'body': b[:20000].decode('utf-8', 'replace')}
s, b = follow(f'https://hstspreload.org/api/v2/status?domain={DOMAIN}', tries=2); OUT['hsts-preload'] = {'status': s, 'body': b[:1000].decode('utf-8', 'replace')}
OUT['counter'] = hop('https://centamont.goatcounter.com/', keep=2500)
OUT['counter-api'] = hop('https://centamont.goatcounter.com/api/v0/stats/total', keep=400)

# 6. Pages settings, when the workflow's token may read them
tok = os.environ.get('GH_TOKEN')
if tok:
    for path in ('pages', 'pages/health', ''):
        s, b = follow(f'https://api.github.com/repos/centamont/centamont.github.io/{path}'.rstrip('/'), headers={'Authorization': f'Bearer {tok}', 'Accept': 'application/vnd.github+json'}, tries=1)
        OUT['github-' + (path or 'repo')] = {'status': s, 'body': b[:6000].decode('utf-8', 'replace')}

def show(title, value):
    print('\n## ' + title); print(json.dumps(value, indent=1, default=str))

def answered(v): return any((x.get('answers') or x.get('cnames')) for x in v.values() if isinstance(x, dict))
show('dns apex', OUT['dns']['apex'])
show('dns names with an answer', {n: v for n, v in OUT['dns']['names'].items() if answered(v)})
show('dns names without an answer', sorted(n for n, v in OUT['dns']['names'].items() if not answered(v)))
show('dns txt', OUT['dns']['txt'])
show('rdap', OUT['rdap'])
show('lookalikes with a record', {n: {'rdap': v['rdap'].get('status'), 'statuses': v['rdap'].get('statuses'), 'registrar': v['rdap'].get('registrar'), 'events': v['rdap'].get('events'),
                                      'ns': v['ns'].get('answers'), 'a': v['a'].get('answers')} for n, v in OUT['lookalikes'].items() if v['rdap'].get('status') == 200 or v['ns'].get('answers')})
show('lookalikes without a record', sorted(n for n, v in OUT['lookalikes'].items() if v['rdap'].get('status') != 200 and not v['ns'].get('answers')))
KEEP = ('security.txt', 'robots.txt', 'no-such-page-probe-7f3a', 'CLAUDE.md', 'watch.py', 'site.webmanifest')
show('http', {u: {k: v for k, v in r.items() if k != 'head' or u.endswith(KEEP)} for u, r in OUT['http'].items()})
show('http browser agent', {k: v for k, v in OUT['http-browser'].items() if k != 'head'})
show('tls', OUT['tls'])
show('crt', OUT['crt'])
for k in ('wayback', 'wayback-cdx', 'hsts-preload', 'counter', 'counter-api'): show(k, OUT[k])
for k in [k for k in OUT if k.startswith('github-')]: show(k, OUT[k])
