"""Βασικά εργαλεία σχεδίασης.

Όλα τα σχέδια γίνονται σε συντεταγμένες 1280x720, αλλά ζωγραφίζονται
σε διπλή ανάλυση (S=2) και μετά μικραίνουν, ώστε οι γραμμές να είναι λείες.
"""
import functools
import math
import random

import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H = 1280, 720      # τελική ανάλυση βίντεο
S = 2                 # supersampling (σχεδιάζουμε σε 2560x1440)
FPS = 30
CARD_BG = (20, 24, 40)   # φόντο της κάρτας εφευρέσεων

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"
FONT_FILES = {
    "serif": "DejaVuSerif.ttf",
    "serif_b": "DejaVuSerif-Bold.ttf",
    "sans": "DejaVuSans.ttf",
    "sans_b": "DejaVuSans-Bold.ttf",
    "mono": "DejaVuSansMono-Bold.ttf",
}


@functools.lru_cache(maxsize=None)
def _font(kind, px):
    return ImageFont.truetype(FONT_DIR + FONT_FILES[kind], max(1, int(round(px))))


# ---------------------------------------------------------------- μαθηματικά
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def lerp(a, b, t):
    return a + (b - a) * t


def ease(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_in(x):
    x = clamp(x)
    return x * x * x


def back_out(x):
    x = clamp(x)
    c = 1.70158
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


def window(t, t0, t1, fin=0.5, fout=0.5):
    """1 μέσα στο [t0, t1] με ομαλό σβήσιμο στις άκρες."""
    if t < t0 or t > t1:
        return 0.0
    return min(ease((t - t0) / fin) if fin > 0 else 1, ease((t1 - t) / fout) if fout > 0 else 1)


def mix(c1, c2, t):
    return tuple(int(round(lerp(a, b, t))) for a, b in zip(c1, c2))


def shade(c, f):
    return tuple(max(0, min(255, int(v * f))) for v in c[:3]) + tuple(c[3:])


def alpha(c, a):
    base = c[3] if len(c) > 3 else 255
    return tuple(c[:3]) + (int(clamp(a) * base),)


def rot(ps, cx, cy, a):
    ca, sa = math.cos(a), math.sin(a)
    return [(cx + (x - cx) * ca - (y - cy) * sa, cy + (x - cx) * sa + (y - cy) * ca) for x, y in ps]


def ngon(cx, cy, r, n, a0=0.0, ry=None):
    ry = r if ry is None else ry
    return [(cx + r * math.cos(a0 + 2 * math.pi * i / n), cy + ry * math.sin(a0 + 2 * math.pi * i / n))
            for i in range(n)]


def qbez(p0, p1, p2, n=16):
    out = []
    for i in range(n + 1):
        t = i / n
        out.append(((1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0],
                    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]))
    return out


def arc_pts(cx, cy, rx, ry, a0, a1, n=24):
    """Σημεία πάνω σε έλλειψη (γωνίες σε μοίρες, 0=δεξιά, 90=κάτω)."""
    return [(cx + rx * math.cos(math.radians(lerp(a0, a1, i / n))),
             cy + ry * math.sin(math.radians(lerp(a0, a1, i / n)))) for i in range(n + 1)]


def gear_pts(cx, cy, r, teeth, depth, ang=0.0):
    pts = []
    step = 2 * math.pi / teeth
    for i in range(teeth):
        a = ang + i * step
        for da, rr in ((-0.5, r - depth), (-0.28, r - depth), (-0.16, r), (0.16, r), (0.28, r - depth)):
            pts.append((cx + rr * math.cos(a + da * step), cy + rr * math.sin(a + da * step)))
    return pts


# ---------------------------------------------------------------- καμβάς
class Canvas:
    """Ζωγραφίζει σε συντεταγμένες 1280x720 πάνω σε εικόνα διπλής ανάλυσης.

    Με το sub() φτιάχνουμε «υπο-καμβά» όπου ένα κουτί 200x200 αντιστοιχεί
    σε μια περιοχή της οθόνης (χρήσιμο για τα εικονίδια των εφευρέσεων).
    """

    def __init__(self, img, ox=0.0, oy=0.0, sc=1.0, tx=0.0, ty=0.0, draw=None):
        self.img = img
        self.d = draw or ImageDraw.Draw(img, "RGBA")
        self.ox, self.oy, self.sc, self.tx, self.ty = ox, oy, sc, tx, ty

    def sub(self, cx, cy, size, box=200.0):
        k = size / box
        return Canvas(self.img, self.ox, self.oy, self.sc * k,
                      self.sc * (cx - size / 2) + self.tx, self.sc * (cy - size / 2) + self.ty, self.d)

    def pt(self, x, y):
        return ((x * self.sc + self.tx - self.ox) * S, (y * self.sc + self.ty - self.oy) * S)

    def pts(self, ps):
        return [self.pt(x, y) for x, y in ps]

    def w(self, width):
        return max(1, int(round(width * self.sc * S)))

    def poly(self, ps, fill=None, outline=None, width=1):
        if len(ps) < 3:
            return
        if outline is None:
            self.d.polygon(self.pts(ps), fill=fill)
        else:
            self.d.polygon(self.pts(ps), fill=fill, outline=outline, width=self.w(width))

    def rect(self, x0, y0, x1, y1, fill=None, outline=None, width=1, r=0):
        a, b = self.pt(min(x0, x1), min(y0, y1))
        c, d = self.pt(max(x0, x1), max(y0, y1))
        kw = {"fill": fill}
        if outline is not None:
            kw.update(outline=outline, width=self.w(width))
        if r > 0:
            self.d.rounded_rectangle([a, b, c, d], radius=r * self.sc * S, **kw)
        else:
            self.d.rectangle([a, b, c, d], **kw)

    def _box(self, cx, cy, rx, ry):
        a, b = self.pt(cx - abs(rx), cy - abs(ry))
        c, d = self.pt(cx + abs(rx), cy + abs(ry))
        return [a, b, max(a, c), max(b, d)]

    def ellipse(self, cx, cy, rx, ry, fill=None, outline=None, width=1):
        kw = {"fill": fill}
        if outline is not None:
            kw.update(outline=outline, width=self.w(width))
        self.d.ellipse(self._box(cx, cy, rx, ry), **kw)

    def circle(self, cx, cy, r, fill=None, outline=None, width=1):
        self.ellipse(cx, cy, r, r, fill, outline, width)

    def pieslice(self, cx, cy, rx, ry, a0, a1, fill=None, outline=None, width=1):
        kw = {"fill": fill}
        if outline is not None:
            kw.update(outline=outline, width=self.w(width))
        self.d.pieslice(self._box(cx, cy, rx, ry), a0, a1, **kw)

    def chord(self, cx, cy, rx, ry, a0, a1, fill=None, outline=None, width=1):
        kw = {"fill": fill}
        if outline is not None:
            kw.update(outline=outline, width=self.w(width))
        self.d.chord(self._box(cx, cy, rx, ry), a0, a1, **kw)

    def arc(self, cx, cy, rx, ry, a0, a1, fill, width=1):
        self.d.arc(self._box(cx, cy, rx, ry), a0, a1, fill=fill, width=self.w(width))

    def line(self, ps, fill, width=1, cap=True):
        P = self.pts(ps)
        wd = self.w(width)
        self.d.line(P, fill=fill, width=wd, joint="curve")
        if cap and wd > 2:
            r = wd / 2 - 0.5
            for x, y in (P[0], P[-1]):
                self.d.ellipse([x - r, y - r, x + r, y + r], fill=fill)

    def text(self, x, y, s, size, fill, kind="sans", anchor="la", shadow=None):
        f = _font(kind, size * self.sc * S)
        if shadow:
            dx, dy, col = shadow
            self.d.text(self.pt(x + dx, y + dy), s, font=f, fill=col, anchor=anchor)
        self.d.text(self.pt(x, y), s, font=f, fill=fill, anchor=anchor)


def text_len(s, size, kind="sans"):
    return _font(kind, size * S).getlength(s) / S


def wrap(s, size, kind, maxw):
    lines, cur = [], ""
    for word in s.split():
        test = (cur + " " + word).strip()
        if text_len(test, size, kind) <= maxw or not cur:
            cur = test
        else:
            lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines


# ---------------------------------------------------------------- φόντα / εφέ
@functools.lru_cache(maxsize=24)
def vgrad(stops):
    """Κάθετο χρωματικό gradient. stops = ((θέση 0..1, (r,g,b)), ...)."""
    ys = np.linspace(0, 1, H * S)
    cols = np.zeros((H * S, 3))
    ps = [p for p, _ in stops]
    for ch in range(3):
        cols[:, ch] = np.interp(ys, ps, [c[ch] for _, c in stops])
    arr = np.ascontiguousarray(np.repeat(cols[:, None, :], W * S, axis=1).astype(np.uint8))
    return Image.fromarray(arr, "RGB")


def glow(c, cx, cy, r, col, steps=16, strength=0.6):
    for i in range(steps):
        f = 1 - i / steps
        c.circle(cx, cy, r * f, fill=alpha(col, strength * 1.6 / steps))


def stars(c, t, n=140, seed=3, ymax=420, xmax=W):
    rnd = random.Random(seed)
    for _ in range(n):
        x, y = rnd.uniform(0, xmax), rnd.uniform(0, ymax)
        r = rnd.choice((0.7, 0.9, 1.1, 1.5))
        ph = rnd.uniform(0, 6.28)
        a = 0.55 + 0.45 * math.sin(t * rnd.uniform(1.5, 3.5) + ph)
        c.circle(x, y, r, fill=(255, 250, 235, int(255 * a)))


def cloud(c, x, y, s=1.0, col=(255, 255, 255), shadow=(215, 222, 235)):
    parts = [(-48, 6, 20), (-22, -8, 28), (8, -18, 34), (40, -4, 26), (62, 8, 18), (0, 8, 26)]
    for dx, dy, r in parts:
        c.circle(x + dx * s, y + (dy + 5) * s, r * s, fill=shadow)
    for dx, dy, r in parts:
        c.circle(x + dx * s, y + dy * s, r * s, fill=col)
    c.rect(x - 50 * s, y + 4 * s, x + 64 * s, y + 20 * s, fill=col, r=8 * s)


def bird(c, x, y, s, t, col=(40, 40, 50)):
    f = math.sin(t * 9) * 5 * s
    c.line([(x - 12 * s, y - f), (x - 5 * s, y - 3 * s), (x, y + 1 * s),
            (x + 5 * s, y - 3 * s), (x + 12 * s, y - f)], fill=col, width=2 * s)


def waves_poly(y0, t, amp, wl, speed, x0=0, x1=W, bottom=H, phase=0.0):
    pts = [(x0, bottom)]
    n = int((x1 - x0) / 8) + 1
    for i in range(n + 1):
        x = x0 + (x1 - x0) * i / n
        y = y0 + amp * math.sin(2 * math.pi * x / wl + t * speed + phase) \
            + amp * 0.4 * math.sin(2 * math.pi * x / (wl * 0.43) - t * speed * 1.3 + phase)
        pts.append((x, y))
    pts.append((x1, bottom))
    return pts


def hills(c, y0, amp, wl, col, phase=0.0, x0=0, x1=W, bottom=H):
    pts = [(x0, bottom)]
    for i in range(81):
        x = x0 + (x1 - x0) * i / 80
        pts.append((x, y0 - amp * (0.6 * math.sin(2 * math.pi * x / wl + phase)
                                   + 0.4 * math.sin(2 * math.pi * x / (wl * 0.47) + phase * 2.1))))
    pts.append((x1, bottom))
    c.poly(pts, fill=col)


def cypress(c, x, y, h, col=(38, 72, 45)):
    w = h * 0.16
    pts = qbez((x, y - h), (x + w * 1.4, y - h * 0.45), (x + w * 0.5, y)) + \
        qbez((x - w * 0.5, y), (x - w * 1.4, y - h * 0.45), (x, y - h))
    c.poly(pts, fill=col)
    c.poly(qbez((x, y - h), (x + w * 1.2, y - h * 0.45), (x + w * 0.45, y)) + [(x, y)],
           fill=shade(col, 0.75))


def flag_wave(c, x, y, w, h, t, draw_fn, amp=5, n=16):
    """Σημαία που κυματίζει: χωρίζει σε κάθετες λωρίδες και τις μετατοπίζει."""
    for i in range(n):
        u0, u1 = i / n, (i + 1) / n
        d0 = amp * u0 * math.sin(t * 5 - u0 * 7)
        d1 = amp * u1 * math.sin(t * 5 - u1 * 7)
        light = 1 + 0.12 * math.cos(t * 5 - (u0 + u1) * 3.5)
        draw_fn(c, x + w * u0, x + w * u1, y + d0, y + d1, h, u0, u1, light)


def figure(c, x, y, h, col, pose=0.0):
    """Απλή ανθρώπινη σιλουέτα (όρθια), ύψος h, πόδια στο y."""
    u = h / 100
    c.circle(x, y - 90 * u, 8 * u, fill=col)
    c.poly([(x - 9 * u, y - 80 * u), (x + 9 * u, y - 80 * u), (x + 13 * u, y - 5 * u), (x - 13 * u, y - 5 * u)],
           fill=col)
    c.line([(x - 6 * u, y - 5 * u), (x - 7 * u, y)], col, 5 * u)
    c.line([(x + 6 * u, y - 5 * u), (x + 7 * u, y)], col, 5 * u)
