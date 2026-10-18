# Writes each page's Content-Security-Policy, allowing its inline scripts by hash.
# Run from the repo root after editing any inline <script>: python3 tools/csp.py
# python3 tools/csp.py --check writes nothing: it names each page whose policy is stale and exits 1 if there is one.
# require-trusted-types-for: no script on the site writes HTML from a string (innerHTML and the like), and the browser holds it to that.
# trusted-types 'none': and no script may make a Trusted Types policy (none does), so nothing can open that door again.
# centamont.goatcounter.com: the cookie-free visit count (site.js), sent as a beacon or, failing that, as an image.
# style-src-elem 'self': style attributes may stay where a page needs them, but a <style> element only ever comes from the stylesheet.
import re,hashlib,base64,glob,sys
check='--check' in sys.argv[1:]
stale=[]
pages=['index.html','privacy.html','404.html','private-clients.html','advisors.html','planner.html','shortlist.html','report.html','south-florida.html','new-york.html','hamptons.html','los-angeles.html','dallas.html','austin.html','houston.html','san-francisco.html','tampa.html','naples.html','orange-county.html','developers.html','markets.html']+sorted(glob.glob('journal/*.html'))+sorted(glob.glob('es/*.html'))+sorted(glob.glob('pt/*.html'))
for f in pages:
    t=open(f).read()
    hs=[]
    for attrs,body in re.findall(r'<script([^>]*)>(.*?)</script>',t,re.S):
        if 'src=' in attrs or 'ld+json' in attrs: continue
        hs.append("'sha256-"+base64.b64encode(hashlib.sha256(body.encode()).digest()).decode()+"'")
    csp=("default-src 'self'; script-src 'self' "+' '.join(dict.fromkeys(hs))+"; style-src 'self' 'unsafe-inline'; style-src-elem 'self'; img-src 'self' data: https://centamont.goatcounter.com; media-src 'self'; font-src 'self'; connect-src 'self' https://centamont.goatcounter.com; "
         "frame-src 'none'; worker-src 'self'; manifest-src 'self'; "
         "object-src 'none'; base-uri 'self'; form-action 'none'; require-trusted-types-for 'script'; trusted-types 'none'; upgrade-insecure-requests")
    tag=f'<meta http-equiv="Content-Security-Policy" content="{csp}">\n<meta name="referrer" content="strict-origin-when-cross-origin">\n'
    t=re.sub(r'<meta http-equiv="Content-Security-Policy"[^>]*>\n<meta name="referrer"[^>]*>\n','',t)
    # styles from the stylesheet only, unless the page's markup carries style attributes (the home page's drawing
    # indices, the report's bar widths, the deposit schedule): those pages keep 'unsafe-inline' for them.
    # Scripts set styles through the CSSOM (el.style), which the policy does not govern.
    if not re.search(r'<[a-zA-Z][^>]*\sstyle=|<style[\s>]',t): tag=tag.replace(" 'unsafe-inline'",'')
    m=re.search(r'<meta charset="utf-8">\n',t,re.I); assert m,f
    t=t[:m.end()]+tag+t[m.end():]
    if check:
        if t!=open(f).read(): stale.append(f); print(f,'stale')
    else: open(f,'w').write(t); print(f,len(hs))
if check: sys.exit(1 if stale else 0)
