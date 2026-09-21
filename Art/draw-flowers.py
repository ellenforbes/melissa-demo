"""
Redraw the flowers from Melissa's banner as clean vector art.

Cutting them out of the painting always left some ragged edge, so instead
each bloom is rebuilt from its own description: petal count, petal shape,
the radial pencil lines inside each petal, and the stack of rings and dots
that make up the centre. The measurements come from her painting, so the
flowers keep her shapes and her colours but have a clean edge at any size.

A small amount of jitter is baked in from a fixed seed - petals are never
exactly alike, and the outlines wobble slightly - so they read as drawn by
hand rather than stamped out.

Writes Art/blooms/<name>.svg for the site and Art/blooms/png/<name>.png
alongside, from the same geometry.

Run from the repo root:  python Art/draw-flowers.py
"""
import math
import os
import random

from PIL import Image, ImageDraw

SVG_DIR = 'Art/blooms'
PNG_DIR = 'Art/blooms/png'
PNG_SIZE = 512
SS = 4                      # supersampling for the PNG render

# ---------------------------------------------------------------- palette --
LIME        = '#B0A622'
LIME_LINE   = '#6F6A15'
LIME_VEIN   = '#8A8420'

ORANGE      = '#E67B22'
ORANGE_LINE = '#A8481E'
ORANGE_VEIN = '#C2551E'

MAGENTA     = '#BE2A62'
MAGENTA_LN  = '#7E1338'
MAGENTA_VN  = '#8E1A44'

BERRY       = '#8A1739'
BERRY_LINE  = '#5A0E25'

CRIMSON     = '#B02050'
CRIMSON_LN  = '#76102F'

BLUE        = '#316378'
BLUE_LINE   = '#1C3F4F'
BLUE_VEIN   = '#24505F'

TEAL        = '#2F7C91'
PEACH       = '#E9A24A'
PALE_PINK   = '#E491A9'
PALE_GREY   = '#CFC3B0'
CREAM       = '#F1DEB5'
LEAF        = '#5E6B43'
LEAF_LINE   = '#3F4A22'
INK         = '#4A3D1E'

# ---------------------------------------------------------------- geometry -
def petal(angle_deg, r0, r1, half_deg, cap, power, rng, n=9):
    """One petal as a closed ring of points, in a unit circle about (0, 0).

    The shaft swells to its widest about two thirds of the way out and is
    then closed off with a half-ellipse cap - that rounded tip is what her
    cosmos and daisy petals have, and what a plain taper cannot give you.
    `cap` is how much of the petal's length that tip takes up: around .22
    for a broad round petal, .10 for a narrow pointed one.
    """
    a = math.radians(angle_deg + rng.uniform(-2.4, 2.4))
    r1 = r1 * rng.uniform(.96, 1.04)
    half = math.radians(half_deg * rng.uniform(.95, 1.05))

    # one slow wobble per petal, rather than noise at every sample, or the
    # outline picks up a sawtooth instead of a hand-drawn waver
    amp = rng.uniform(.006, .016)
    freq = rng.uniform(1.1, 2.3)
    phase = rng.uniform(0, 2 * math.pi)
    u_tip = 1.0 - cap

    def width(u):
        return half * (math.sin(math.pi * .72 * min(u / u_tip, 1.0)) ** power)

    def point(u, v):
        r = (r0 + (r1 - r0) * u) * (1 + amp * math.sin(freq * math.pi * u + phase))
        th = a + v
        return (r * math.cos(th), r * math.sin(th))

    w_tip = width(u_tip)
    up, down, tip = [], [], []
    for i in range(n):
        u = u_tip * i / (n - 1)
        up.append(point(u, width(u)))
        down.append(point(u, -width(u)))
    for i in range(5):                       # the rounded tip
        phi = math.pi / 2 * i / 4
        tip.append(point(u_tip + cap * math.sin(phi), w_tip * math.cos(phi)))
    for i in range(3, -1, -1):
        phi = math.pi / 2 * i / 4
        tip.append(point(u_tip + cap * math.sin(phi), -w_tip * math.cos(phi)))

    return up + tip + down[::-1]


def vein(angle_deg, r0, r1, spread_deg, rng):
    """A pencil line running up the inside of a petal."""
    a = math.radians(angle_deg + spread_deg + rng.uniform(-1.2, 1.2))
    bend = rng.uniform(-0.04, 0.04)
    out = []
    for i in range(7):
        t = i / 6
        r = r0 + (r1 - r0) * t
        th = a + bend * math.sin(math.pi * t)
        out.append((r * math.cos(th), r * math.sin(th)))
    return out


# --------------------------------------------------------------- smoothing -
def beziers(pts, closed=True, tension=0.30):
    """Catmull-Rom through the points, as cubic bezier segments."""
    n = len(pts)
    segs = []
    rng_n = n if closed else n - 1
    for i in range(rng_n):
        p0 = pts[(i - 1) % n] if closed else pts[max(i - 1, 0)]
        p1, p2 = pts[i], pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if closed else pts[min(i + 2, n - 1)]
        c1 = (p1[0] + (p2[0] - p0[0]) * tension, p1[1] + (p2[1] - p0[1]) * tension)
        c2 = (p2[0] - (p3[0] - p1[0]) * tension, p2[1] - (p3[1] - p1[1]) * tension)
        segs.append((p1, c1, c2, p2))
    return segs


def to_d(pts, closed=True):
    segs = beziers(pts, closed)
    d = ['M%.1f %.1f' % segs[0][0]]
    for _, c1, c2, p in segs:
        d.append('C%.1f %.1f %.1f %.1f %.1f %.1f' % (c1[0], c1[1], c2[0], c2[1], p[0], p[1]))
    if closed:
        d.append('Z')
    return ''.join(d)


def flatten(pts, closed=True, steps=9):
    """The same curve as a dense polyline, for the PNG render."""
    out = []
    for p0, c1, c2, p1 in beziers(pts, closed):
        for i in range(steps):
            t = i / steps
            u = 1 - t
            out.append((
                u * u * u * p0[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p1[0],
                u * u * u * p0[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p1[1],
            ))
    return out


# ------------------------------------------------------------------ blooms -
# petals:  count, inner radius, tip radius, half width (deg), tip cap, power
# veins:   how many pencil lines per petal, and how far apart they fan
# centre:  rings and dot rings, drawn from the outside in
FLOWERS = {
    'daisy-lime': dict(
        seed=11,
        rings=[dict(count=13, r0=.17, r1=1.0, half=14.5, cap=.21, power=.55,
                    fill=LIME, line=LIME_LINE, veins=5, fan=4.6, vein=LIME_VEIN)],
        centre=[('disc', .31, PALE_PINK, INK),
                ('dots', .225, .038, 12, [ORANGE, BLUE, MAGENTA]),
                ('disc', .155, MAGENTA, INK),
                ('disc', .058, TEAL, None)],
    ),
    'cosmos-orange': dict(
        seed=23,
        rings=[dict(count=8, r0=.19, r1=1.0, half=25, cap=.25, power=.55,
                    fill=ORANGE, line=ORANGE_LINE, veins=6, fan=7.5, vein=ORANGE_VEIN)],
        centre=[('disc', .34, MAGENTA, MAGENTA_LN),
                ('dots', .255, .042, 13, [PALE_GREY]),
                ('disc', .175, PALE_GREY, MAGENTA_LN),
                ('disc', .085, PALE_PINK, None),
                ('disc', .035, MAGENTA, None)],
    ),
    'cosmos-magenta': dict(
        seed=37,
        rings=[dict(count=8, r0=.19, r1=1.0, half=24, cap=.23, power=.52,
                    fill=MAGENTA, line=MAGENTA_LN, veins=3, fan=6.5, vein=MAGENTA_VN)],
        centre=[('disc', .33, TEAL, BLUE_LINE),
                ('dots', .238, .042, 12, [ORANGE]),
                ('disc', .155, ORANGE, BLUE_LINE),
                ('disc', .055, TEAL, None)],
    ),
    'flower-blue': dict(
        seed=53,
        rings=[dict(count=8, r0=.19, r1=1.0, half=25, cap=.27, power=.50,
                    fill=BLUE, line=BLUE_LINE, veins=5, fan=7.0, vein=BLUE_VEIN)],
        centre=[('disc', .32, MAGENTA, BLUE_LINE),
                ('dots', .235, .040, 12, [PEACH]),
                ('disc', .16, ORANGE, BLUE_LINE),
                ('disc', .06, PEACH, None)],
    ),
    'dahlia-berry': dict(
        seed=67,
        rings=[dict(count=8, r0=.21, r1=1.0, half=23, cap=.23, power=.55,
                    fill=BERRY, line=BERRY_LINE, veins=0, fan=0, vein=BERRY_LINE),
               dict(count=11, r0=.15, r1=.58, half=7.5, cap=.12, power=.70,
                    fill=CRIMSON, line=BERRY_LINE, veins=0, fan=0, vein=BERRY_LINE)],
        centre=[('disc', .25, TEAL, BLUE_LINE),
                ('dots', .175, .032, 10, [ORANGE]),
                ('disc', .105, ORANGE, None),
                ('disc', .04, BERRY, None)],
    ),
    'dahlia-crimson': dict(
        seed=79,
        rings=[dict(count=15, r0=.19, r1=1.0, half=10, cap=.13, power=.62,
                    fill=CRIMSON, line=CRIMSON_LN, veins=3, fan=3.2, vein=BERRY)],
        centre=[('disc', .35, '#E8A8BC', CRIMSON_LN),
                ('disc', .21, '#5A1330', None),
                ('disc', .075, '#E8C0CE', None)],
    ),
    'marigold-orange': dict(
        seed=91,
        rings=[dict(count=20, r0=.20, r1=1.0, half=7.6, cap=.11, power=.62,
                    fill=ORANGE, line=ORANGE_LINE, veins=3, fan=2.4, vein='#C0431C')],
        centre=[('disc', .285, TEAL, BLUE_LINE),
                ('dots', .205, .030, 13, [PEACH]),
                ('disc', .125, '#A01349', None),
                ('disc', .048, ORANGE, None)],
    ),
}


# Simplified blooms for the places a flower is only 13-15px across - the
# nav separators, the FAQ markers, the little one on the buttons. At that
# size pencil veins and a ring of dots turn to mud, so these are six fat
# lobes, a heavier outline and a single contrasting centre: the silhouette
# and the middle are all that survive, so that is all they are made of.
MINIS = {
    'mini-orange':  (ORANGE,  ORANGE_LINE,  CREAM,   MAGENTA),
    'mini-magenta': (MAGENTA, MAGENTA_LN,   PEACH,   BERRY),
    'mini-lime':    (LIME,    LIME_LINE,    MAGENTA, CREAM),
}

for _n, (_fill, _line, _eye, _pip) in MINIS.items():
    FLOWERS[_n] = dict(
        seed=7,
        stroke=4.0,
        rings=[dict(count=6, r0=.24, r1=1.0, half=33, cap=.40, power=.42,
                    fill=_fill, line=_line, veins=0, fan=0, vein=_line)],
        centre=[('disc', .34, _eye, _line),
                ('disc', .13, _pip, None)],
    )


def leaf_shape(rng):
    """A pointed oval leaf with a midrib and a few side veins."""
    pts = []
    for i in range(13):
        t = i / 12
        y = -1 + 2 * t
        w = 0.46 * math.sin(math.pi * t) ** 0.72 * rng.uniform(.96, 1.04)
        pts.append((w, y))
    for i in range(12, -1, -1):
        t = i / 12
        y = -1 + 2 * t
        w = 0.46 * math.sin(math.pi * t) ** 0.72 * rng.uniform(.96, 1.04)
        pts.append((-w, y))
    veins = [[(0, -0.95), (0, 0.95)]]
    for k in range(4):
        y = -0.55 + k * 0.36
        s = 1 if k % 2 == 0 else -1
        veins.append([(0, y), (s * 0.30, y - 0.22)])
        veins.append([(0, y), (-s * 0.30, y - 0.22)])
    return pts, veins


# ------------------------------------------------------------------ output -
def to_vb(p, scale=46.0):
    return (50 + p[0] * scale, 50 + p[1] * scale)


def build(name, spec):
    """Everything the flower is made of, in viewBox coordinates."""
    rng = random.Random(spec['seed'])
    sw = spec.get('stroke', 1.05)
    fills, lines, circles = [], [], []

    for ring in spec['rings']:
        step = 360 / ring['count']
        for i in range(ring['count']):
            a = i * step
            pts = [to_vb(p) for p in petal(a, ring['r0'], ring['r1'],
                                           ring['half'], ring['cap'], ring['power'], rng)]
            fills.append((pts, ring['fill'], ring['line'], sw))
            for v in range(ring['veins']):
                off = (v - (ring['veins'] - 1) / 2) * ring['fan']
                pv = [to_vb(p) for p in vein(a, ring['r0'] + .06, ring['r1'] * .9, off, rng)]
                lines.append((pv, ring['vein']))

    for item in spec['centre']:
        if item[0] == 'disc':
            _, r, fill, stroke = item
            circles.append(('disc', 50, 50, r * 46, fill, stroke, sw))
        else:
            _, r, dr, count, cols = item
            for i in range(count):
                th = 2 * math.pi * i / count + rng.uniform(-.04, .04)
                circles.append(('disc',
                                50 + r * 46 * math.cos(th),
                                50 + r * 46 * math.sin(th),
                                dr * 46 * rng.uniform(.9, 1.1),
                                cols[i % len(cols)], None, sw))
    return fills, lines, circles


def build_leaf():
    rng = random.Random(5)
    pts, veins = leaf_shape(rng)
    fills = [([to_vb(p, 44) for p in pts], LEAF, LEAF_LINE, 1.05)]
    lines = [([to_vb(p, 44) for p in v], LEAF_LINE) for v in veins]
    return fills, lines, []


def write_svg(name, fills, lines, circles):
    out = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">']
    for pts, fill, line, sw in fills:
        out.append('<path fill="%s" stroke="%s" stroke-width="%.2f" '
                   'stroke-linejoin="round" d="%s"/>' % (fill, line, sw, to_d(pts)))
    for pts, col in lines:
        out.append('<path fill="none" stroke="%s" stroke-width="0.62" '
                   'stroke-linecap="round" d="%s"/>' % (col, to_d(pts, closed=False)))
    for _, cx, cy, r, fill, stroke, sw in circles:
        s = ' stroke="%s" stroke-width="%.2f"' % (stroke, sw) if stroke else ''
        out.append('<circle cx="%.1f" cy="%.1f" r="%.2f" fill="%s"%s/>' % (cx, cy, r, fill, s))
    out.append('</svg>')
    svg = '\n'.join(out) + '\n'
    path = os.path.join(SVG_DIR, name + '.svg')
    open(path, 'w', encoding='utf-8').write(svg)
    return len(svg)


def write_png(name, fills, lines, circles):
    """Same geometry, drawn big and scaled down so the edges are smooth."""
    S = PNG_SIZE * SS
    img = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    k = S / 100.0

    def sc(pts):
        return [(x * k, y * k) for x, y in pts]

    for pts, fill, line, sw in fills:
        poly = sc(flatten(pts))
        d.polygon(poly, fill=fill)
        d.line(poly + [poly[0]], fill=line, width=max(1, int(sw * k)), joint='curve')
    for pts, col in lines:
        d.line(sc(flatten(pts, closed=False)), fill=col, width=max(1, int(.62 * k)), joint='curve')
    for _, cx, cy, r, fill, stroke, sw in circles:
        box = [(cx - r) * k, (cy - r) * k, (cx + r) * k, (cy + r) * k]
        d.ellipse(box, fill=fill, outline=stroke, width=max(1, int(sw * k)) if stroke else 0)

    img = img.resize((PNG_SIZE, PNG_SIZE), Image.LANCZOS)
    path = os.path.join(PNG_DIR, name + '.png')
    img.save(path)
    return os.path.getsize(path)


if __name__ == '__main__':
    os.makedirs(SVG_DIR, exist_ok=True)
    os.makedirs(PNG_DIR, exist_ok=True)

    jobs = [(n, build(n, s)) for n, s in FLOWERS.items()]
    jobs.append(('leaf', build_leaf()))

    for name, parts in jobs:
        svg_n = write_svg(name, *parts)
        png_n = write_png(name, *parts)
        print('%-17s svg %5d b   png %6d b' % (name, svg_n, png_n))
