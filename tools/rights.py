# Writes the owner's rights notice inside the site's own images and drawings, so a copy carries the name of the owner and
# the address of the terms wherever it goes: share cards (og-*), the hero stills, the icons, the logo, the vellum texture,
# the favicon and the footer signature. Photographs under media/ belong to the photographers credited beside them and are
# never touched; nor is email/signature-lockup.png, which every sent email loads by its exact bytes.
# PNG gets a tEXt chunk, JPEG and WebP an XMP packet, SVG a <metadata> element; the pixels are never re-encoded.
# Run from the repo root: python3 tools/rights.py (safe to run again: stamped files are left alone)
import glob, struct, sys, zlib
from PIL import Image

NOTICE = '© 2026 Centamont. All rights reserved. Not licensed for reuse: https://centamont.com/terms.html'
XMP = ('<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?><x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">'
       '<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:xmpRights="http://ns.adobe.com/xap/1.0/rights/" xmlns:photoshop="http://ns.adobe.com/photoshop/1.0/">'
       '<dc:creator><rdf:Seq><rdf:li>Centamont</rdf:li></rdf:Seq></dc:creator><dc:rights><rdf:Alt><rdf:li xml:lang="x-default">' + NOTICE + '</rdf:li></rdf:Alt></dc:rights>'
       '<dc:source>https://centamont.com/</dc:source><xmpRights:Marked>True</xmpRights:Marked><xmpRights:WebStatement>https://centamont.com/terms.html</xmpRights:WebStatement>'
       '<photoshop:Credit>Centamont</photoshop:Credit></rdf:Description></rdf:RDF></x:xmpmeta><?xpacket end="w"?>').encode()
FILES = sorted(glob.glob('og*.png') + glob.glob('og-*.jpg') + glob.glob('es/og*') + glob.glob('pt/og*') + glob.glob('hero/*.webp')
               + ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'logo.png', 'grain.png', 'favicon.svg', 'media/sig.svg'])

def png(d):
    if b'tEXt' in d and b'Copyright' in d: return None
    body = b'Copyright\0' + NOTICE.encode('latin-1', 'replace')
    chunk = struct.pack('>I', len(body)) + b'tEXt' + body + struct.pack('>I', zlib.crc32(b'tEXt' + body) & 0xffffffff)
    end = 8 + 8 + struct.unpack('>I', d[8:12])[0] + 4   # after IHDR
    return d[:end] + chunk + d[end:]

def jpeg(d):
    if b'http://ns.adobe.com/xap/1.0/' in d: return None
    seg = b'http://ns.adobe.com/xap/1.0/\0' + XMP
    app1 = b'\xff\xe1' + struct.pack('>H', len(seg) + 2) + seg
    i = 2   # after SOI; keep a JFIF APP0 first if there is one
    if d[2:4] == b'\xff\xe0': i = 4 + struct.unpack('>H', d[4:6])[0]
    return d[:i] + app1 + d[i:]

def webp(d):
    if b'XMP ' in d[:64] or b'x:xmpmeta' in d: return None
    chunks, i = [], 12
    while i < len(d):
        tag, n = d[i:i+4], struct.unpack('<I', d[i+4:i+8])[0]
        chunks.append((tag, d[i+8:i+8+n])); i += 8 + n + (n & 1)
    if chunks[0][0] != b'VP8X':   # a simple file gets the extended header first
        w, h = Image.open(io.BytesIO(d)).size
        chunks.insert(0, (b'VP8X', bytes([0, 0, 0, 0]) + struct.pack('<I', w - 1)[:3] + struct.pack('<I', h - 1)[:3]))
    flags = bytearray(chunks[0][1]); flags[0] |= 0x04; chunks[0] = (b'VP8X', bytes(flags))
    chunks.append((b'XMP ', XMP))
    body = b''.join(t + struct.pack('<I', len(c)) + c + (b'\0' if len(c) & 1 else b'') for t, c in chunks)
    return b'RIFF' + struct.pack('<I', 4 + len(body)) + b'WEBP' + body

def svg(d):
    if b'<metadata' in d: return None
    i = d.index(b'>', d.index(b'<svg')) + 1
    meta = ('<metadata><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#" xmlns:dc="http://purl.org/dc/elements/1.1/"><rdf:Description>'
            '<dc:creator>Centamont</dc:creator><dc:rights>' + NOTICE.replace('&', '&amp;') + '</dc:rights><dc:source>https://centamont.com/</dc:source></rdf:Description></rdf:RDF></metadata>').encode()
    return d[:i] + meta + d[i:]

import io
done = []
for f in FILES:
    d = open(f, 'rb').read()
    kind = {'png': png, 'jpg': jpeg, 'webp': webp, 'svg': svg}[f.rsplit('.', 1)[1]]
    out = kind(d)
    if out is None: continue
    if kind is not svg:   # the pixels must be exactly what they were
        before, after = Image.open(io.BytesIO(d)), Image.open(io.BytesIO(out))
        if before.size != after.size or before.convert('RGBA').tobytes() != after.convert('RGBA').tobytes(): sys.exit(f'{f}: pixels changed, not written')
    open(f, 'wb').write(out); done.append(f)
print(f'{len(done)} files stamped' if done else 'nothing to stamp')
