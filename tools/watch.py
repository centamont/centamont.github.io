# Checks that centamont.com is still what main says it is: every published page, script, stylesheet and text file
# matches main byte for byte, and the domain's records and certificates are the ones expected.
# The "Site watch" workflow runs it daily; a failed run emails the account through GitHub's own notifications.
# Its log is public, so it prints only each check's name and ok or changed.
# Run from the repo root: python3 tools/watch.py (WATCH_REF names the tree to compare with, origin/main by default)
import json, os, re, subprocess, sys, time, http.client, urllib.request, urllib.parse
from datetime import datetime, timedelta, timezone

SITE, REF = 'https://centamont.com', os.environ.get('WATCH_REF', 'origin/main')
GITHUB_A = {'185.199.108.153', '185.199.109.153', '185.199.110.153', '185.199.111.153'}
GITHUB_AAAA = {'2606:50c0:8000::153', '2606:50c0:8001::153', '2606:50c0:8002::153', '2606:50c0:8003::153'}
NAMESERVERS = 'registrar-servers.com.'  # Namecheap; change it here if the domain moves to another DNS host
ISSUERS = {'letsencrypt.org'}           # the only CA the CAA record allows
TEXT = ('.html', '.js', '.css', '.txt', '.xml', '.svg')
failed = []

def say(name, ok):
    print(('ok       ' if ok else 'changed  ') + name)
    if not ok: failed.append(name)

def get(url, tries=3):
    for k in range(tries):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': 'centamont-site-watch', 'Cache-Control': 'no-cache'})
            with urllib.request.urlopen(req, timeout=30) as r: return r.status, r.read()
        except urllib.error.HTTPError as e: return e.code, b''
        except Exception:
            if k == tries - 1: return None, b''
            time.sleep(5 * (k + 1))

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
    status, body = get(f'{SITE}/{urllib.parse.quote(f)}?watch={stamp}')
    if status != 200 or body != want: changed.append(f)
if changed:  # a deploy can lag a merge by a few minutes: look once more before calling it
    time.sleep(300)
    changed = [f for f in changed if get(f'{SITE}/{urllib.parse.quote(f)}?watch={stamp}r') != (200, subprocess.check_output(['git', 'show', f'{REF}:{f}']))]
say('published files match main', not changed)
for f in changed: print('         ' + f)

# 2. The domain's records, read through Google's resolver with DNSSEC validation
def dns(name, kind):
    status, body = get(f'https://dns.google/resolve?name={name}&type={kind}&do=1')
    if status != 200: return None, False
    d = json.loads(body)
    return [a['data'] for a in d.get('Answer', []) if a.get('type') == {'A': 1, 'NS': 2, 'CNAME': 5, 'TXT': 16, 'AAAA': 28, 'DS': 43, 'CAA': 257}[kind]], d.get('AD', False)

a, ad = dns('centamont.com', 'A')
say('address records', bool(a) and set(a) <= GITHUB_A)
say('dnssec', bool(ad) and bool((dns('centamont.com', 'DS')[0] or [])))
aaaa = dns('centamont.com', 'AAAA')[0]
say('ipv6 records', aaaa is not None and set(aaaa) <= GITHUB_AAAA)
www = dns('www.centamont.com', 'CNAME')[0] or []
say('www record', [w.rstrip('.').lower() for w in www] == ['centamont.github.io'])
ns = dns('centamont.com', 'NS')[0] or []
say('nameservers', bool(ns) and all(n.lower().endswith(NAMESERVERS) for n in ns))
caa = dns('centamont.com', 'CAA')[0] or []
issue = {m.group(2).split(';')[0].strip().lower() for c in caa for m in [re.search(r'\b(issue|issuewild)\s+"?([^"]*)"?', c)] if m}
say('certificate authorities', bool(caa) and issue <= ISSUERS)
dmarc = ' '.join(dns('_dmarc.centamont.com', 'TXT')[0] or []).replace('"', '')
say('email policy', re.search(r'\bp=reject\b', dmarc) is not None)

# 3. Plain http still moves to https
try:
    c = http.client.HTTPConnection('centamont.com', timeout=30); c.request('GET', '/'); r = c.getresponse()
    say('https redirect', r.status in (301, 308) and (r.getheader('Location') or '').startswith('https://centamont.com'))
except Exception: say('https redirect', False)

# 4. No certificate for the domain from an unexpected issuer in the last week (crt.sh is often slow: skipped if down)
status, body = get('https://crt.sh/?q=centamont.com&output=json&exclude=expired', tries=2)
if status == 200:
    week = datetime.now(timezone.utc) - timedelta(days=8)
    odd = [c for c in json.loads(body or b'[]')
           if datetime.fromisoformat(c['not_before']).replace(tzinfo=timezone.utc) > week and "Let's Encrypt" not in c.get('issuer_name', '')]
    say('certificates', not odd)
else: print('skipped  certificates')

sys.exit(1 if failed else 0)
