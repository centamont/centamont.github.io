"""Prints the drawn Roman numerals the pages use (I to IV), each a small portico: the numeral's strokes are its
columns, standing between an architrave and a base, with a cornice line above and a ground line below.
Paste the output in place of a numeral's <svg>; the styles are under ".nm" in _src/site.css."""
import sys

H = 64          # architrave top 5, base bottom 59
PITCH = 6       # clear space between serifs


def f(x):
    return f'{x:g}'


def stem(c, i):
    # a column-stem: thick, with bracketed serifs flaring into the architrave and the base
    w, s = 1.9, 5.6
    d = (f'M{f(c-s)} 8H{f(c+s)}Q{f(c+w)} 9 {f(c+w)} 14V50Q{f(c+w)} 55 {f(c+s)} 56'
         f'H{f(c-s)}Q{f(c-w)} 55 {f(c-w)} 50V14Q{f(c-w)} 9 {f(c-s)} 8Z')
    return f'<path class="st" style="--i:{i}" d="{d}"/>'


def vee(v, i):
    # V with the stonecutter's stress: a thick left arm, a hairline right arm, meeting at the base
    thick = f'M{f(v-10.5)} 8H{f(v-3.2)}Q{f(v-5)} 9.5 {f(v-4.6)} 12L{f(v+1.6)} 56H{f(v-1.4)}L{f(v-8.2)} 12Q{f(v-8.6)} 9.5 {f(v-10.5)} 8Z'
    thin = f'M{f(v+4.6)} 8H{f(v+10.5)}Q{f(v+8.6)} 9.5 {f(v+8.1)} 12L{f(v+.8)} 56H{f(v-.2)}L{f(v+7)} 12Q{f(v+6.8)} 9.5 {f(v+4.6)} 8Z'
    return f'<path class="st" style="--i:{i}" d="{thick}{thin}"/>'


def numeral(n, cls='nm'):
    parts, x, i = [], 5, 0
    for ch in n:
        half = 5.6 if ch == 'I' else 10.5
        c = x + half
        parts.append(stem(c, i) if ch == 'I' else vee(c, i))
        x = c + half + PITCH
        i += 1
    w = x - PITCH + 5
    lines = f'M0 1.5H{f(w)}M0 62.5H{f(w)}'
    bars = f'M2 5.6H{f(w-2)}V8H2ZM2 56H{f(w-2)}V58.4H2Z'
    return (f'<svg class="{cls}" viewBox="0 0 {f(w)} {H}" width="{f(w)}" height="{H}" data-draw aria-hidden="true" focusable="false">'
            f'<path class="ln" pathLength="1" d="{lines}"/><path class="bar" d="{bars}"/>{"".join(parts)}</svg>')


if __name__ == '__main__':
    for n in sys.argv[1:] or ['I', 'II', 'III', 'IV']:
        print(numeral(n))
