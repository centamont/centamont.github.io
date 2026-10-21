# Checks that centamont.com is still what main says it is: every published page, script, stylesheet and text file
# matches main byte for byte, and the domain's records, headers and certificates are the ones expected.
# The "Site watch" workflow runs it daily; a failed run emails the account through GitHub's own notifications.
# Its log is public, so it prints only each check's name and ok or changed.
# Run from the repo root: python3 tools/watch.py (WATCH_REF names the tree to compare with, origin/main by default)
import ipaddress, json, os, re, subprocess, sys, time, http.client, urllib.request, urllib.parse
from datetime import datetime, timedelta, timezone

SITE, REF = 'https://centamont.com', os.environ.get('WATCH_REF', 'origin/main')

# Where the domain's records live. 'namecheap' is the zone at the registrar, with the site served straight from GitHub;
# 'cloudflare' is the zone at Cloudflare, with the site proxied behind it, which adds the headers checked below.
# While the move from one to the other is under way, HOSTS names both: either is accepted, the one seen is named in the
# log, and DNSSEC (off by design during a move) is noted rather than failed. Once the move is confirmed, set HOSTS to the
# one in use, so a change back, or to anything else, is caught.
HOSTS = ('namecheap', 'cloudflare')
EXPECT = {
    'namecheap': dict(ns='registrar-servers.com.', issuers={'letsencrypt.org'}, logs=("Let's Encrypt",), headers=False),
    'cloudflare': dict(ns='ns.cloudflare.com.', issuers={'letsencrypt.org', 'pki.goog', 'ssl.com'}, logs=("Let's Encrypt", 'Google Trust Services', 'SSL Corp'), headers=True),
}
GITHUB_A = {'185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'}
GITHUB_AAAA = {'2606:50c0:8000::153', '2606:50c0:8001::153', '2606:50c0:8002::153', '2606:50c0:8003::153'}
CLOUDFLARE = [ipaddress.ip_network(n) for n in (
    '173.245.48.0/20', '103.21.244.0/22', '103.22.200.0/22', '103.31.4.0/22', '141.101.64.0/18', '108.162.192.0/18', '190.93.240.0/20',
    '188.114.96.0/20', '197.234.240.0/22', '198.41.128.0/17', '162.158.0.0/15', '104.16.0.0/13', '104.24.0.0/14', '172.64.0.0/13', '131.0.72.0/22',
    '2400:cb00::/32', '2606:4700::/32', '2803:f800::/32', '2405:b500::/32', '2405:8100::/32', '2a06:98c0::/29', '2c0f:f248::/32')]
TEXT = ('.html', '.js', '.css', '.txt', '.xml', '.svg')
failed = []

def say(name, ok, note=''):
    print(('ok       ' if ok else 'changed  ') + name + (f' ({note})' if note else ''))
    if not ok: failed.append(name)

def get(url, tries=3):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'centamont-site-watch', 'Cache-Control': 'no-cache'})
            with urllib.request.urlopen(req, timeout=30) as r: return r.status, r.read(), r.headers
        except urllib.error.HTTPError as e: return e.code, b'', e.headers
        except Exception:
            if k == tries - 1: return None, b'', {}
            time.sleep(5 * (k + 1))

def behind_cloudflare(addrs):
    try: return bool(addrs) and all(any(ipaddress.ip_address(a) in n for n in CLOUDFLARE) for a in addrs)
    except ValueError: return False

# 1. Published files match main
def published():
    conf = open('_config.yml').read()
    excl = re.findall(r'^\s*-\s*(\S+)', conf.split('exclude:')[1], re.M) if 'exclude:' in conf else []
    incl = re.findall(r'^\s*-\s*(\S+)', conf.split('include:')[1].split('exclude:')[0], re.M) if 'include:' in conf else []
    files = subprocess.check_output(['git', 'ls-tree', '-r', '--name-only', REF], text=True).split()
    for f in files:
        top = f.split('/')[0]
        if not f.endswith(TEXT) or top in excl or f in excl: continue
        if top[0] in '._' and top not in incl: continue
        yield f

stamp = str(int(time.time()))
changed = []
for f in published():
    want = subprocess.check_output(['git', 'show', f'{REF}:{f}'])
    status, body, _ = get(f'{SITE}/{urllib.parse.quote(f)}?watch={stamp}')
    if status != 200 or body != want: changed.append(f)
if changed:  # a deploy can lag a merge by a few minutes: look once more before calling it
    time.sleep(300)
    changed = [f for f in changed if get(f'{SITE}/{urllib.parse.quote(f)}?watch={stamp}r')[:2] != (200, subprocess.check_output(['git', 'show', f'{REF}:{f}']))]
say('published files match main', not changed)
for f in changed: print('         ' + f)

# 2. The domain's records, read through Google's resolver with DNSSEC validation
KINDS = {'A': 1, 'NS': 2, 'CNAME': 5, 'MX': 15, 'TXT': 16, 'AAAA': 28, 'DS': 43, 'CAA': 257}
def dns(name, kind):
    status, body, _ = get(f'https://dns.google/resolve?name={name}&type={kind}&do=1')
    if status != 200: return None, False
    d = json.loads(body)
    return [a['data'] for a in d.get('Answer', []) if a.get('type') == KINDS[kind]], d.get('AD', False)

ns = dns('centamont.com', 'NS')[0] or []
host = next((h for h in HOSTS if ns and all(n.lower().endswith(EXPECT[h]['ns']) for n in ns)), None)
say('nameservers', host is not None, host or '')
ex = EXPECT[host or HOSTS[0]]

a, ad = dns('centamont.com', 'A')
aaaa = dns('centamont.com', 'AAAA')[0]
www = dns('www.centamont.com', 'CNAME')[0] or []
if host == 'cloudflare':
    say('address records', behind_cloudflare(a))
    say('ipv6 records', aaaa is not None and (not aaaa or behind_cloudflare(aaaa)))
    say('www record', behind_cloudflare(dns('www.centamont.com', 'A')[0] or []) or [w.rstrip('.').lower() for w in www] == ['centamont.github.io'])
else:
    say('address records', bool(a) and set(a) <= GITHUB_A)
    say('ipv6 records', aaaa is not None and set(aaaa) <= GITHUB_AAAA)
    say('www record', [w.rstrip('.').lower() for w in www] == ['centamont.github.io'])
signed = bool(ad) and bool(dns('centamont.com', 'DS')[0] or [])
if len(HOSTS) > 1 and not signed: print('noted    dnssec (off while the records move)')
else: say('dnssec', signed)
caa = dns('centamont.com', 'CAA')[0] or []
issue = {m.group(2).split(';')[0].strip().lower() for c in caa for m in [re.search(r'\b(issue|issuewild)\s+"?([^"]*)"?', c)] if m}
say('certificate authorities', bool(caa) and issue <= ex['issuers'])
say('pages domain claim', bool(dns('_github-pages-challenge-centamont.centamont.com', 'TXT')[0]))

# 3. The mail records: who may send as the domain, how mail is signed, and what happens to mail that fails
dmarc = ' '.join(dns('_dmarc.centamont.com', 'TXT')[0] or []).replace('"', '')
say('email policy', re.search(r'\bp=reject\b', dmarc) is not None)
mx = dns('centamont.com', 'MX')[0] or []
say('mail servers', [m.split()[-1].rstrip('.').lower() for m in mx] == ['smtp.google.com'])
txt = [t.replace('"', '') for t in dns('centamont.com', 'TXT')[0] or []]
spf = [t for t in txt if t.startswith('v=spf1')]
say('mail senders', len(spf) == 1 and 'include:_spf.google.com' in spf[0].split())
dkim = ''.join(dns('google._domainkey.centamont.com', 'TXT')[0] or []).replace('"', '').replace(' ', '')
say('mail signature', dkim.startswith('v=DKIM1;') and 'p=MIIB' in dkim)

# 4. Plain http still moves to https, security.txt answers, and the headers the edge adds are there
try:
    c = http.client.HTTPConnection('centamont.com', timeout=30); c.request('GET', '/'); r = c.getresponse()
    say('https redirect', r.status in (301, 308) and (r.getheader('Location') or '').startswith('https://centamont.com'))
except Exception: say('https redirect', False)
status, body, _ = get(f'{SITE}/.well-known/security.txt?watch={stamp}')
say('security.txt', status == 200 and b'Contact:' in body)
if ex['headers']:
    status, body, h = get(f'{SITE}/?watch={stamp}')
    hsts = re.search(r'max-age=(\d+)', h.get('Strict-Transport-Security', '') or '')
    say('strict transport security', bool(hsts) and int(hsts.group(1)) >= 31536000 and 'includesubdomains' in (h.get('Strict-Transport-Security') or '').lower())
    say('frame header', (h.get('X-Frame-Options') or '').upper() == 'DENY' or 'frame-ancestors' in (h.get('Content-Security-Policy') or ''))
    say('permissions header', bool(h.get('Permissions-Policy')))
else: print('skipped  edge headers (none expected from this host)')

# 5. No certificate for the domain from an unexpected issuer in the last week (crt.sh is often slow: skipped if down)
status, body, _ = get('https://crt.sh/?q=centamont.com&output=json&exclude=expired', tries=2)
if status == 200:
    week = datetime.now(timezone.utc) - timedelta(days=8)
    odd = [c for c in json.loads(body or b'[]')
           if datetime.fromisoformat(c['not_before']).replace(tzinfo=timezone.utc) > week and not any(l in c.get('issuer_name', '') for l in ex['logs'])]
    say('certificates', not odd)
else: print('skipped  certificates')

sys.exit(1 if failed else 0)
