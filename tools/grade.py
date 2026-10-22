# The one grade every city photograph and film on the market pages carries, so the set reads as one evening.
# Each frame is first brought part of the way toward the set (its exposure toward a middle grey of 0.36, its saturation
# down toward 0.24 and never up, a third of any strong colour cast taken back), then given the same light finish: a little
# contrast and the house warmth. It is natural on purpose: no tint, no gradient map.
#
# A new photograph, from its original (crop box optional, in source pixels; widths optional):
#   python3 tools/grade.py photo SRC.jpg media/NAME [--crop x0,y0,x1,y1] [--widths 960,1600,2400]
#   writes media/NAME-<w>.jpg|webp|avif at each width
# A new film: measure a frame of the original, write its cube, apply it with ffmpeg (-vf lut3d=OUT.cube) as you encode,
# and grade its poster from the same frame with `photo`:
#   python3 tools/grade.py cube FRAME.jpg OUT.cube
# Run from the repository root.
import sys
import numpy as np
from PIL import Image

W3 = np.array([.2126, .7152, .0722])


def params(a, TL=0.36, TS=0.24, CAST=0.35):
    s = a[::4, ::4]
    L = s @ W3
    mx, mn = s.max(2), s.min(2)
    sat = np.where(mx > 1e-3, (mx - mn) / np.maximum(mx, 1e-3), 0).mean()
    med = min(max(float(np.median(L)), 1e-3), .95)
    return dict(g=float(np.clip(np.log(TL) / np.log(med), 0.86, 1.16)),   # exposure part of the way to the set's middle
                sk=float(np.clip(TS / max(sat, 1e-3), 0.74, 1.0)),          # saturation down toward the set, never up
                cb=float(-CAST * (s[..., 0] - s[..., 2]).mean()))            # a third of a strong warm or cool cast back


def look(a, p):
    x = np.clip(a, 0, 1)
    mid = 4 * x * (1 - x)   # the cast is corrected in the mid-tones only
    x = np.clip(x + np.stack([p['cb'] / 2 * mid[..., 0], 0 * mid[..., 1], -p['cb'] / 2 * mid[..., 2]], -1), 0, 1) ** p['g']
    L = (x @ W3)[..., None]
    x = np.clip(L + (x - L) * p['sk'], 0, 1)
    x = 0.8 * x + 0.2 * (x * x * (3 - 2 * x))   # a little contrast
    return np.clip(x * np.array([1.012, 1.0, 0.978]), 0, 1)   # the house warmth


def grade(im):
    a = np.asarray(im.convert('RGB')).astype(np.float32) / 255
    p = params(a)
    return Image.fromarray((look(a, p) * 255 + .5).astype(np.uint8)), p


def photo(src, out, crop=None, widths=(960, 1600, 2400)):
    im = Image.open(src).convert('RGB')
    if crop: im = im.crop(crop)
    g, _ = grade(im)
    for w in widths:
        r = g.resize((w, round(w * g.height / g.width)), Image.LANCZOS)
        r.save(f'{out}-{w}.jpg', quality=78, optimize=True, progressive=True)
        r.save(f'{out}-{w}.webp', quality=80, method=6)
        r.save(f'{out}-{w}.avif', quality=58)


def cube(poster, out, n=33):
    p = params(np.asarray(Image.open(poster).convert('RGB')).astype(np.float32) / 255)
    g = np.linspace(0, 1, n)
    b, gg, r = np.meshgrid(g, g, g, indexing='ij')   # .cube order: red runs fastest
    rgb = look(np.stack([r, gg, b], -1).reshape(1, -1, 3).astype(np.float32), p).reshape(-1, 3)
    with open(out, 'w') as f:
        f.write(f'LUT_3D_SIZE {n}\n')
        f.writelines(f'{x:.6f} {y:.6f} {z:.6f}\n' for x, y, z in rgb)


if __name__ == '__main__':
    a = sys.argv[1:]
    opt = {a[i]: a[i + 1] for i in range(len(a)) if a[i].startswith('--')}
    if a[0] == 'photo':
        photo(a[1], a[2], tuple(int(v) for v in opt['--crop'].split(',')) if '--crop' in opt else None,
              tuple(int(v) for v in opt.get('--widths', '960,1600,2400').split(',')))
    elif a[0] == 'cube':
        cube(a[1], a[2])
