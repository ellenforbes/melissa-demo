"""
Trace the "Love, Melissa xo" lettering out of the painted banner into SVG.

Pipeline per colour:
  colour mask -> morphological close -> connected components
  -> keep the components whose bbox lands in the lettering band
  -> walk the pixel boundary into closed rings (holes come out naturally,
     e.g. the heart inside the O)
  -> Ramer-Douglas-Peucker simplify
  -> corner-preserving Catmull-Rom smoothing into cubic beziers
"""
import math

import numpy as np
from PIL import Image

SRC = 'Art/banner.webp'
OUT = 'Art/wordmark.svg'

# colour, tolerance (sum |dRGB|), and the box the letters live in (relative)
GROUPS = [
    ('love',    '#4F152E', (0x4F, 0x15, 0x2E), 110, (0.24, 0.44, 0.78, 0.68)),
    ('melissa', '#B32251', (0xB3, 0x22, 0x51),  95, (0.18, 0.60, 0.80, 0.90)),
    ('xo',      '#E67B22', (0xE6, 0x7B, 0x22),  95, (0.76, 0.71, 0.88, 0.85)),
]
MIN_AREA = 2000
MIN_RING = 220        # px^2; anything smaller is texture, not a counter

# The painting puts a heart with a small teardrop blob above it inside the
# O of "Love", and a plain oval with a nub inside the o of "xo". Both should
# read as two hearts, so after tracing, the counters of the letters named
# here are thrown away and replaced with a pair. A point inside the letter
# identifies it; the hearts are then fitted to the counter it already had,
# so they land where the original hole was whatever the tracing does.
HEART_COUNTERS = {
    'love': (755, 620),     # the O
    'xo': (1420, 950),      # the o
}

# one heart in a unit box, tip at bottom centre, as (command, points)
HEART = [
    ('M', [(0.50, 1.00)]),
    ('C', [(0.14, 0.68), (0.00, 0.42), (0.13, 0.20)]),
    ('C', [(0.26, 0.01), (0.45, 0.06), (0.50, 0.26)]),
    ('C', [(0.55, 0.06), (0.74, 0.01), (0.87, 0.20)]),
    ('C', [(1.00, 0.42), (0.86, 0.68), (0.50, 1.00)]),
    ('Z', []),
]

HEART_ASPECT = 0.76        # width as a fraction of height; taller than wide
HEART_GAP = 0.05           # space between the pair, as a fraction of the counter


def heart_at(x, y, w, h):
    """The unit heart scaled to w x h and moved to (x, y)."""
    out = []
    for cmd, pts in HEART:
        out.append(cmd)
        out.append(' '.join('%.1f %.1f' % (x + px * w, y + py * h) for px, py in pts))
    return ''.join(out).replace('M ', 'M')


def ring_area(pts):
    a = 0.0
    for i in range(len(pts)):
        x0, y0 = pts[i]
        x1, y1 = pts[(i + 1) % len(pts)]
        a += x0 * y1 - x1 * y0
    return abs(a) / 2


def bbox(pts):
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    return min(xs), min(ys), max(xs), max(ys)


# ------------------------------------------------------------- morphology --
def shift(m, dy, dx):
    out = np.zeros_like(m)
    h, w = m.shape
    y0, y1 = max(0, dy), min(h, h + dy)
    x0, x1 = max(0, dx), min(w, w + dx)
    out[y0:y1, x0:x1] = m[y0 - dy:y1 - dy, x0 - dx:x1 - dx]
    return out


def dilate(m, r=1):
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            out |= shift(m, dy, dx)
    return out


def close(m, r=2):
    return ~dilate(~dilate(m, r), r)


def open_(m, r=2):
    return dilate(~dilate(~m, r), r)


def tidy(m):
    """Fill the speckles the painting's texture leaves inside a letter, then
       shave the nubs it leaves on the outside, so the outline that gets
       traced is already smooth before any curve fitting happens."""
    return open_(close(m, 3), 3)


# --------------------------------------------------------------- components -
def components(mask, min_area):
    h, w = mask.shape
    seen = np.zeros((h, w), bool)
    out = []
    for sy, sx in zip(*np.nonzero(mask)):
        if seen[sy, sx]:
            continue
        stack, pix = [(sy, sx)], []
        seen[sy, sx] = True
        while stack:
            y, x = stack.pop()
            pix.append((y, x))
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                ny, nx = y + dy, x + dx
                if 0 <= ny < h and 0 <= nx < w and mask[ny, nx] and not seen[ny, nx]:
                    seen[ny, nx] = True
                    stack.append((ny, nx))
        if len(pix) < min_area:
            continue
        p = np.array(pix)
        sub = np.zeros((h, w), bool)
        sub[p[:, 0], p[:, 1]] = True
        out.append(((p[:, 1].min(), p[:, 0].min(), p[:, 1].max(), p[:, 0].max()), sub))
    return out


# ------------------------------------------------------------------- rings --
def rings(mask):
    """Chain the unit edges between set and unset pixels into closed loops."""
    ys, xs = np.nonzero(mask)
    h, w = mask.shape
    edges = {}

    def add(a, b):
        edges.setdefault(a, []).append(b)

    for y, x in zip(ys, xs):
        if y == 0 or not mask[y - 1, x]:
            add((x, y), (x + 1, y))
        if y == h - 1 or not mask[y + 1, x]:
            add((x + 1, y + 1), (x, y + 1))
        if x == 0 or not mask[y, x - 1]:
            add((x, y + 1), (x, y))
        if x == w - 1 or not mask[y, x + 1]:
            add((x + 1, y), (x + 1, y + 1))

    loops = []
    while edges:
        start = next(iter(edges))
        loop = [start]
        cur = start
        while True:
            nxts = edges.get(cur)
            if not nxts:
                break
            nxt = nxts.pop()
            if not nxts:
                del edges[cur]
            cur = nxt
            if cur == start:
                break
            loop.append(cur)
        if len(loop) > 8:
            loops.append(loop)
    return loops


# ------------------------------------------------------------------- simplify
def rdp(pts, eps):
    if len(pts) < 3:
        return pts
    a, b = np.array(pts[0], float), np.array(pts[-1], float)
    ab = b - a
    n = np.hypot(*ab)
    P = np.array(pts, float)
    if n == 0:
        d = np.hypot(*(P - a).T)
    else:
        rel = P - a
        d = np.abs(ab[0] * rel[:, 1] - ab[1] * rel[:, 0]) / n
    i = int(d.argmax())
    if d[i] > eps:
        return rdp(pts[:i + 1], eps)[:-1] + rdp(pts[i:], eps)
    return [pts[0], pts[-1]]


import sys
sys.setrecursionlimit(50000)


def despike(pts, max_edge=13.0, max_height=5.0):
    """Drop the tiny horns the canvas texture leaves on a letter's edge.

    A horn is a vertex that juts out on two short edges and barely leaves
    the line between its neighbours. Testing the edge lengths as well as
    the height is what keeps this from flattening real curves, whose
    vertices sit far apart after simplification.
    """
    pts = list(pts)
    while len(pts) > 8:
        n = len(pts)
        drop = [False] * n
        i = 0
        while i < n:
            a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
            e1 = math.hypot(b[0] - a[0], b[1] - a[1])
            e2 = math.hypot(c[0] - b[0], c[1] - b[1])
            dx, dy = c[0] - a[0], c[1] - a[1]
            span = math.hypot(dx, dy)
            if span and min(e1, e2) < max_edge:
                d = abs(dx * (b[1] - a[1]) - dy * (b[0] - a[0])) / span
                if d < max_height:
                    drop[i] = True
                    i += 1              # never drop two in a row in one pass
            i += 1
        if not any(drop):
            break
        pts = [p for p, d in zip(pts, drop) if not d]
    return pts


def relax(pts, rounds=2, weight=0.22, corner_deg=88):
    """Ease the residual waver out of an outline, leaving real corners be."""
    for _ in range(rounds):
        n = len(pts)
        out = []
        for i in range(n):
            a, b, c = pts[i - 1], pts[i], pts[(i + 1) % n]
            v1 = (b[0] - a[0], b[1] - a[1])
            v2 = (c[0] - b[0], c[1] - b[1])
            n1, n2 = math.hypot(*v1), math.hypot(*v2)
            if not n1 or not n2:
                out.append(b)
                continue
            cosv = max(-1.0, min(1.0, (v1[0] * v2[0] + v1[1] * v2[1]) / (n1 * n2)))
            if math.degrees(math.acos(cosv)) > corner_deg:
                out.append(b)
            else:
                out.append((b[0] * (1 - weight) + (a[0] + c[0]) / 2 * weight,
                            b[1] * (1 - weight) + (a[1] + c[1]) / 2 * weight))
        pts = out
    return pts


def simplify_ring(loop, eps):
    pts = rdp(loop + [loop[0]], eps)
    if pts[0] == pts[-1]:
        pts = pts[:-1]
    return relax(despike(pts))


# -------------------------------------------------------------------- smooth
def to_path(pts, corner_deg=72, tension=0.32):
    """Catmull-Rom style cubics, with sharp vertices left sharp."""
    n = len(pts)
    P = [np.array(p, float) for p in pts]
    sharp = []
    for i in range(n):
        a, b, c = P[i - 1], P[i], P[(i + 1) % n]
        v1, v2 = b - a, c - b
        n1, n2 = np.hypot(*v1), np.hypot(*v2)
        if n1 == 0 or n2 == 0:
            sharp.append(True)
            continue
        cosv = float(np.clip(np.dot(v1, v2) / (n1 * n2), -1, 1))
        sharp.append(np.degrees(np.arccos(cosv)) > corner_deg)

    tang = []
    for i in range(n):
        if sharp[i]:
            tang.append(np.zeros(2))
        else:
            tang.append((P[(i + 1) % n] - P[i - 1]) * tension)

    d = ['M%s' % fmt(P[0])]
    for i in range(n):
        j = (i + 1) % n
        c1, c2 = P[i] + tang[i], P[j] - tang[j]
        d.append('C%s %s %s' % (fmt(c1), fmt(c2), fmt(P[j])))
    d.append('Z')
    return ''.join(d)


def fmt(p):
    return '%.1f %.1f' % (p[0], p[1])


# ----------------------------------------------------------------------- run
im = Image.open(SRC).convert('RGB')
arr = np.asarray(im).astype(np.int16)
H, W = arr.shape[:2]

picked = []
for name, hexcol, rgb, tol, (rx0, ry0, rx1, ry1) in GROUPS:
    m = tidy(np.abs(arr - np.array(rgb, np.int16)).sum(axis=2) < tol)
    keep = []
    for (x0, y0, x1, y1), sub in components(m, MIN_AREA):
        cx, cy = (x0 + x1) / 2 / W, (y0 + y1) / 2 / H
        if rx0 <= cx <= rx1 and ry0 <= cy <= ry1 and (x1 - x0) < 0.30 * W:
            keep.append(((x0, y0, x1, y1), sub))
    print(name, len(keep), 'shapes', [b for b, _ in keep])
    picked.append((name, hexcol, keep))

# viewBox from everything kept
xs0 = min(b[0] for _, _, k in picked for b, _ in k)
ys0 = min(b[1] for _, _, k in picked for b, _ in k)
xs1 = max(b[2] for _, _, k in picked for b, _ in k)
ys1 = max(b[3] for _, _, k in picked for b, _ in k)
pad = 8
vb = (xs0 - pad, ys0 - pad, xs1 - xs0 + 2 * pad, ys1 - ys0 + 2 * pad)
print('viewBox', vb)

parts = []
for name, hexcol, keep in picked:
    ds = []
    swap = HEART_COUNTERS.get(name)
    for (bx0, by0, bx1, by1), sub in keep:
        loops = [simplify_ring(l, 1.7) for l in rings(sub)]
        loops = [l for l in loops if len(l) >= 3 and ring_area(l) >= MIN_RING]
        wants_hearts = swap and bx0 <= swap[0] <= bx1 and by0 <= swap[1] <= by1

        if not wants_hearts:
            ds.extend(to_path(l) for l in loops)
            continue

        # the biggest ring is the letter itself; the rest are its counter
        loops.sort(key=ring_area, reverse=True)
        outer, holes = loops[0], loops[1:]
        ds.append(to_path(outer))
        if not holes:
            continue

        boxes = [bbox(h) for h in holes]
        hx0 = min(b[0] for b in boxes)
        hy0 = min(b[1] for b in boxes)
        hx1 = max(b[2] for b in boxes)
        hy1 = max(b[3] for b in boxes)
        w, h = hx1 - hx0, hy1 - hy0
        cx = (hx0 + hx1) / 2

        big_h = min(.60 * h, .98 * w / HEART_ASPECT)
        small_h = big_h * .48
        gap = HEART_GAP * h
        # centre the pair in the counter rather than hanging it off the bottom
        top = hy0 + (h - (small_h + gap + big_h)) / 2
        for hy, hh in ((top, small_h), (top + small_h + gap, big_h)):
            hw = hh * HEART_ASPECT
            ds.append(heart_at(cx - hw / 2, hy, hw, hh))
        print('   %s: counter -> two hearts, %d holes replaced' % (name, len(holes)))

    parts.append('  <path class="wm-%s" fill="%s" fill-rule="evenodd" d="%s" />'
                 % (name, hexcol, ''.join(ds)))

svg = (
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="%d %d %d %d" '
    'role="img" aria-label="Love, Melissa xo">\n%s\n</svg>\n'
    % (vb[0], vb[1], vb[2], vb[3], '\n'.join(parts))
)
open(OUT, 'w', encoding='utf-8').write(svg)
print('wrote', OUT, len(svg), 'bytes')
