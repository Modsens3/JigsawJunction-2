"""Κινούμενα εικονίδια εφευρέσεων.

Κάθε συνάρτηση icon_*(c, t) ζωγραφίζει μέσα σε ένα κουτί 200x200
(ο καμβάς c έχει ήδη μεταφερθεί/μικρύνει στη σωστή θέση με c.sub()).
Το t είναι ο χρόνος (δευτερόλεπτα) από τη στιγμή που εμφανίστηκε το εικονίδιο.
"""
import math
import random

from draw_utils import (CARD_BG, alpha, arc_pts, clamp, ease, ease_out, gear_pts, glow, lerp, ngon, qbez, rot,
                        shade)

CLEAR = CARD_BG           # «τρύπα» – ίδιο χρώμα με το φόντο της κάρτας
INK = (40, 30, 25)


# ------------------------------------------------------------ 1. Τροχός
def icon_wheel(c, t):
    cx, cy, r = 100, 96, 76
    a = t * 0.9
    c.ellipse(100, 186, 70, 7, fill=(0, 0, 0, 110))
    wood, dark = (164, 112, 62), (86, 54, 28)
    c.circle(cx, cy, r, fill=wood, outline=dark, width=4)
    # τρεις σανίδες – οι αρμοί τους
    for d in (-27, 27):
        h = math.sqrt(r * r - d * d) - 3
        c.line(rot([(cx + d, cy - h), (cx + d, cy + h)], cx, cy, a), dark, 2.5, cap=False)
    # νερά του ξύλου
    rnd = random.Random(5)
    for _ in range(14):
        d = rnd.uniform(-70, 70)
        if abs(abs(d) - 27) < 4:
            continue
        h = math.sqrt(max(0, (r - 6) ** 2 - d * d))
        y0 = rnd.uniform(-h, 0)
        c.line(rot([(cx + d, cy + y0), (cx + d + rnd.uniform(-2, 2), cy + y0 + rnd.uniform(20, h))], cx, cy, a),
               (140, 92, 48), 1.2, cap=False)
    # δύο εγκάρσιες τάβλες που δένουν τις σανίδες
    for yy in (-40, 40):
        hw = math.sqrt(r * r - (abs(yy) + 7) ** 2) - 4
        c.poly(rot([(cx - hw, cy + yy - 7), (cx + hw, cy + yy - 7), (cx + hw, cy + yy + 7), (cx - hw, cy + yy + 7)],
                   cx, cy, a), fill=(130, 84, 42), outline=dark, width=1.5)
        for xx in (-hw + 8, 0, hw - 8):
            px, py = rot([(cx + xx, cy + yy)], cx, cy, a)[0]
            c.circle(px, py, 2.6, fill=dark)
    c.circle(cx, cy, 17, fill=(120, 76, 38), outline=dark, width=2)
    c.circle(cx, cy, 7, fill=(40, 26, 14))
    c.circle(cx - 5, cy - 5, 5, fill=(190, 140, 90))


# ------------------------------------------------------------ 2. Σφηνοειδής γραφή
def _wedge(c, x, y, kind, col):
    if kind == 0:      # οριζόντια σφήνα
        c.poly([(x, y - 4), (x, y + 4), (x + 6, y)], fill=col)
        c.line([(x + 5, y), (x + 15, y)], col, 1.6)
    elif kind == 1:    # κάθετη
        c.poly([(x - 4, y), (x + 4, y), (x, y + 6)], fill=col)
        c.line([(x, y + 5), (x, y + 16)], col, 1.6)
    else:              # «γωνία» (Winkelhaken)
        c.poly([(x, y), (x + 8, y - 5), (x + 8, y + 5)], fill=col)


def icon_tablet(c, t):
    c.rect(41, 36, 171, 186, fill=(128, 84, 48), r=20)
    c.rect(34, 28, 164, 178, fill=(198, 144, 94), r=20)
    c.rect(34, 28, 164, 40, fill=(214, 164, 112), r=12)
    col = (104, 64, 34)
    rnd = random.Random(11)
    signs = []
    for row in range(5):
        y = 50 + row * 26
        c.line([(44, y + 20), (154, y + 20)], (176, 122, 76), 1, cap=False)
        for k in range(4):
            x = 48 + k * 27
            signs.append([(x + rnd.uniform(0, 6), y + rnd.uniform(0, 3), rnd.choice((0, 0, 1, 2)))
                          for _ in range(rnd.choice((1, 2, 3)))])
    n = min(len(signs), int(t * 4.5) + 1)
    for s in signs[:n]:
        for x, y, kind in s:
            _wedge(c, x, y, kind, col)
    # ο γραφέας – καλάμι που πιέζει τον πηλό
    tx, ty = signs[min(n, len(signs) - 1)][0][:2]
    bob = 3 * abs(math.sin(t * 9))
    tip = (tx + 8, ty - bob)
    c.line([tip, (tip[0] + 62, tip[1] - 72)], (222, 200, 140), 8)
    c.line([tip, (tip[0] + 62, tip[1] - 72)], (190, 166, 108), 3, cap=False)
    c.poly([(tip[0] - 3, tip[1] + 3), (tip[0] + 5, tip[1] - 5), (tip[0] + 2, tip[1] + 1)], fill=(150, 120, 70))


# ------------------------------------------------------------ 3. Αλφάβητο
def icon_alphabet(c, t):
    stone, side = (206, 200, 188), (160, 154, 142)
    c.poly([(48, 190), (48, 58)] + qbez((48, 58), (100, 14), (152, 58)) + [(152, 190)], fill=side)
    c.poly([(42, 190), (42, 58)] + qbez((42, 58), (94, 14), (146, 58)) + [(146, 190)], fill=stone)
    c.rect(34, 186, 162, 196, fill=(120, 116, 108))
    rows = ["ΑΒΓΔ", "ΕΖΗΘ", "ΙΚΛΜ", "ΝΞΟΠ", "ΡΣΤΥ", "ΦΧΨΩ"]
    vowels = set("ΑΕΗΙΟΥΩ")
    n = int(t * 7) + 1
    k = 0
    for ri, row in enumerate(rows):
        for ci, ch in enumerate(row):
            if k >= n:
                return
            x, y = 60 + ci * 23, 46 + ri * 23
            fresh = clamp((n - k) / 3)
            if ch in vowels:
                col = (170, 96, 20) if fresh < 1 else (190, 60, 30)
            else:
                col = (70, 62, 54)
            c.text(x + 1, y + 1, ch, 19, (240, 236, 226), "serif_b", "mm")
            c.text(x, y, ch, 19, col, "serif_b", "mm")
            k += 1


# ------------------------------------------------------------ 4. Πυθαγόρειο θεώρημα
def _grid(c, p0, ex, ey, n, col):
    for i in range(1, n):
        a = (p0[0] + ex[0] * i / n, p0[1] + ex[1] * i / n)
        c.line([a, (a[0] + ey[0], a[1] + ey[1])], col, 1, cap=False)
        b = (p0[0] + ey[0] * i / n, p0[1] + ey[1] * i / n)
        c.line([b, (b[0] + ex[0], b[1] + ex[1])], col, 1, cap=False)


def icon_pythagoras(c, t):
    A, B, C = (80, 120), (144, 120), (80, 72)       # ορθή γωνία στο A, πλευρές 3-4-5
    ph = (t * 1.2) % 3
    def pulse(i):
        return 1.0 + 0.25 * max(0, 1 - abs(ph - i) * 2)
    sq_a = [(32, 72), (80, 72), (80, 120), (32, 120)]
    sq_b = [(80, 120), (144, 120), (144, 184), (80, 184)]
    sq_c = [C, B, (192, 56), (128, 8)]
    c.poly(sq_a, fill=shade((70, 130, 210), pulse(0)), outline=(220, 235, 255), width=2)
    c.poly(sq_b, fill=shade((60, 160, 100), pulse(1)), outline=(220, 255, 230), width=2)
    c.poly(sq_c, fill=shade((200, 80, 70), pulse(2)), outline=(255, 225, 220), width=2)
    _grid(c, (32, 72), (48, 0), (0, 48), 3, (255, 255, 255, 110))
    _grid(c, (80, 120), (64, 0), (0, 64), 4, (255, 255, 255, 110))
    _grid(c, C, (64, 48), (48, -64), 5, (255, 255, 255, 110))
    c.poly([A, B, C], fill=(245, 225, 160), outline=(90, 70, 30), width=2)
    c.line([(80, 110), (90, 110), (90, 120)], (90, 70, 30), 1.5, cap=False)
    c.text(56, 96, "a²", 15, "white", "serif_b", "mm")
    c.text(112, 152, "b²", 17, "white", "serif_b", "mm")
    c.text(136, 64, "c²", 19, "white", "serif_b", "mm")
    c.text(8, 22, "a²+b²=c²", 14, (255, 215, 120), "serif_b", "lm")


# ------------------------------------------------------------ 5. Μηχανισμός Αντικυθήρων
def _gear(c, cx, cy, r, teeth, ang, spokes=4, col=(186, 138, 72)):
    dark = (112, 78, 38)
    c.poly(gear_pts(cx, cy, r, teeth, r * 0.09 + 2, ang), fill=col, outline=dark, width=1.5)
    if spokes:
        c.circle(cx, cy, r * 0.78, fill=CLEAR)
        c.circle(cx, cy, r * 0.78, outline=dark, width=1.5)
        for i in range(spokes):
            a = ang + i * 2 * math.pi / spokes
            p = [(cx - 5, cy), (cx + 5, cy), (cx + 5, cy + r * 0.8), (cx - 5, cy + r * 0.8)]
            c.poly(rot(p, cx, cy, a), fill=col)
    c.circle(cx, cy, r * 0.2 + 3, fill=col, outline=dark, width=1.5)
    c.circle(cx, cy, 3, fill=dark)


def icon_antikythera(c, t):
    a = t * 0.45
    _gear(c, 84, 104, 60, 40, a, 4)
    _gear(c, 84 + 60 + 26 - 5, 104 - 44, 32, 20, -a * 2 + 0.08, 3, (176, 130, 70))
    _gear(c, 84 + 50, 104 + 56, 22, 14, -a * 40 / 14 + 0.12, 0, (196, 150, 82))
    # πατίνα – πρασινωπά σημάδια χαλκού
    rnd = random.Random(2)
    for _ in range(26):
        ang, rr = rnd.uniform(0, 6.28), rnd.uniform(48, 58)
        x, y = rot([(84 + rr, 104)], 84, 104, ang + a)[0]
        c.circle(x, y, rnd.uniform(1.5, 3.5), fill=(90, 140, 112))
    # δείκτης
    px, py = rot([(84, 104 - 50)], 84, 104, a * 3)[0]
    c.line([(84, 104), (px, py)], (240, 220, 160), 3)
    c.circle(84, 104, 5, fill=(240, 220, 160))


# ------------------------------------------------------------ 6. Κοχλίας του Αρχιμήδη
def icon_screw(c, t):
    p0, p1 = (44, 168), (160, 58)
    L = math.hypot(p1[0] - p0[0], p1[1] - p0[1])
    ux, uy = (p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L
    nx, ny = -uy, ux
    R = 22
    # νερό κάτω
    c.ellipse(46, 178, 44, 14, fill=(50, 110, 190))
    c.ellipse(46, 175, 40, 10, fill=(90, 160, 230))
    # πίσω μισό του κελύφους
    def P(s, k):
        return (p0[0] + ux * s + nx * k, p0[1] + uy * s + ny * k)
    c.poly([P(0, -R), P(L, -R), P(L, R), P(0, R)], fill=(96, 64, 36))
    # έλικα
    spin = t * 4.0
    pitch = 26
    pts_back, pts_front = [], []
    for i in range(0, 161):
        s = L * i / 160
        th = 2 * math.pi * s / pitch - spin
        pnt = P(s, R * math.sin(th))
        (pts_front if math.cos(th) > 0 else pts_back).append((s, pnt, math.cos(th)))
    for s, pnt, cs in pts_back:
        c.circle(pnt[0], pnt[1], 1.8, fill=(150, 110, 60))
    # νερό που ανεβαίνει στις «τσέπες»
    for k in range(6):
        s = ((k + (spin / (2 * math.pi))) * pitch) % L
        q = P(s, R * 0.45)
        c.ellipse(q[0], q[1], 7, 4, fill=(80, 150, 230))
    c.line([P(0, 0), P(L + 8, 0)], (120, 90, 50), 5)
    for s, pnt, cs in pts_front:
        c.circle(pnt[0], pnt[1], 2.4, fill=(214, 170, 104))
    # εμπρός σανίδες κελύφους
    c.line([P(0, -R), P(L, -R)], (70, 46, 24), 3)
    c.line([P(0, R), P(L, R)], (70, 46, 24), 3)
    for s in (8, L / 2, L - 8):
        c.line([P(s, -R - 2), P(s, R + 2)], (60, 40, 20), 3)
    # νερό που χύνεται πάνω
    top = P(L, -4)
    fl = [(top[0] + 4 + i * 2.2, top[1] + (i * 1.7) ** 1.6) for i in range(10)]
    c.line(fl, (90, 165, 235), 5)
    c.rect(150, 118, 196, 128, fill=(110, 76, 40))
    # μανιβέλα
    hx, hy = P(L + 8, 0)
    c.circle(hx, hy, 5, fill=(90, 60, 30))
    kx, ky = hx + 12 * math.cos(spin), hy + 12 * math.sin(spin)
    c.line([(hx, hy), (kx, ky)], (90, 60, 30), 3)
    c.circle(kx, ky, 3.5, fill=(200, 160, 100))


# ------------------------------------------------------------ 7. Υδραγωγείο
def _arch_row(c, x0, y_spring, n, bay, pier, stone, dark, top_y):
    r = (bay - pier) / 2
    for i in range(n):
        cx = x0 + i * bay + bay / 2
        c.pieslice(cx, y_spring, r, r, 180, 360, fill=CLEAR)
        c.rect(cx - r, y_spring, cx + r, top_y, fill=CLEAR)
        for k in range(9):
            a = math.radians(180 + k * 22.5)
            c.line([(cx + r * math.cos(a), y_spring + r * math.sin(a)),
                    (cx + (r + 7) * math.cos(a), y_spring + (r + 7) * math.sin(a))], dark, 1, cap=False)
        c.arc(cx, y_spring, r, r, 180, 360, dark, 1.5)


def icon_aqueduct(c, t):
    stone, dark = (218, 192, 142), (150, 122, 80)
    c.rect(4, 184, 196, 190, fill=(110, 140, 70))
    c.rect(10, 104, 190, 184, fill=stone)
    _arch_row(c, 10, 142, 3, 60, 14, stone, dark, 184)
    c.rect(6, 98, 194, 106, fill=shade(stone, 0.9))
    c.rect(10, 56, 190, 98, fill=stone)
    _arch_row(c, 10, 80, 6, 30, 8, stone, dark, 98)
    c.rect(6, 50, 194, 57, fill=shade(stone, 0.9))
    # κανάλι (specus) με νερό που κυλάει
    c.rect(10, 34, 190, 50, fill=stone)
    c.rect(16, 38, 184, 46, fill=(50, 120, 200))
    for i in range(10):
        x = 16 + ((i * 20 + t * 40) % 168)
        c.line([(x, 42), (min(184, x + 9), 42)], (180, 225, 255), 1.5, cap=False)
    c.rect(10, 30, 190, 34, fill=shade(stone, 0.8))
    # τούβλα/λιθοδομή
    for y in (118, 130, 166, 176, 66, 90):
        c.line([(10, y), (190, y)], (190, 162, 112), 0.8, cap=False)


# ------------------------------------------------------------ 8. Ζυγαριά της δικαιοσύνης
def icon_scales(c, t):
    gold, dark = (226, 186, 84), (140, 104, 36)
    c.poly([(70, 190), (130, 190), (116, 176), (84, 176)], fill=gold, outline=dark, width=1.5)
    c.rect(96, 42, 104, 178, fill=gold, outline=dark, width=1)
    c.circle(100, 36, 8, fill=gold, outline=dark, width=1.5)
    b = 0.13 * math.sin(t * 1.6)
    ends = rot([(34, 46), (166, 46)], 100, 46, b)
    c.line(ends, gold, 6)
    c.line(ends, dark, 1.2, cap=False)
    for i, (ex, ey) in enumerate(ends):
        py = ey + 78
        for dx in (-26, 0, 26):
            c.line([(ex, ey), (ex + dx, py)], (200, 170, 90), 1.3, cap=False)
        c.chord(ex, py - 2, 30, 14, 0, 180, fill=gold, outline=dark, width=1.5)
        if i == 0:
            c.rect(ex - 12, py - 16, ex + 12, py - 2, fill=(236, 226, 196), r=3)
            c.text(ex, py - 9, "LEX", 9, (90, 60, 30), "serif_b", "mm")
        else:
            c.circle(ex - 7, py - 7, 6, fill=(170, 170, 180))
            c.circle(ex + 7, py - 7, 6, fill=(170, 170, 180))
    c.circle(100, 46, 5, fill=dark)


# ------------------------------------------------------------ 9. Υγρό πυρ
def icon_greekfire(c, t):
    c.rect(0, 150, 200, 200, fill=(30, 70, 130))
    for i in range(6):
        y = 158 + i * 7
        c.line([(x, y + 2 * math.sin(x / 9 + t * 3 + i)) for x in range(0, 201, 10)], (70, 120, 180), 1.5)
    # δρόμων (βυζαντινό πλοίο) – πλώρη
    hull = [(0, 108), (100, 108), (128, 92), (116, 132)] + qbez((116, 132), (80, 162), (0, 160))
    c.poly(hull, fill=(110, 66, 36), outline=(60, 34, 16), width=2)
    c.line([(0, 118), (112, 118)], (160, 110, 60), 3, cap=False)
    for x in range(10, 100, 16):
        c.line([(x, 138), (x - 14, 176)], (140, 100, 60), 2.2)
    c.rect(0, 70, 60, 108, fill=(150, 40, 40))
    c.line([(40, 108), (40, 30)], (80, 50, 25), 4)
    # σίφωνας
    c.line([(92, 104), (130, 86)], (200, 160, 70), 8)
    c.circle(131, 86, 5.5, fill=(230, 190, 90))
    # φλόγα
    for i in range(18):
        u = i / 17
        x = 134 + u * 62
        y = 86 + 64 * u * u - 4 * math.sin(t * 17 + i * 1.3)
        r = 4 + 12 * u
        col = (255, int(lerp(240, 90, u)), int(lerp(150, 20, u)))
        c.circle(x, y, r, fill=col)
    for i in range(4):
        fx = 150 + i * 13
        h = 18 + 8 * math.sin(t * 13 + i * 2)
        c.poly([(fx - 7, 152), (fx + math.sin(t * 9 + i) * 3, 152 - h), (fx + 7, 152)], fill=(255, 150, 40))
        c.poly([(fx - 3, 152), (fx, 152 - h * 0.55), (fx + 3, 152)], fill=(255, 235, 140))


# ------------------------------------------------------------ 10. Κώδικας (βιβλίο)
def _page_lines(c, x0, x1, y0, y1, gap=9, col=(120, 100, 80)):
    y = y0
    while y < y1:
        c.line([(x0, y), (x1, y)], col, 1.3, cap=False)
        y += gap


def icon_codex(c, t):
    cover = (120, 40, 30)
    c.poly([(8, 60), (100, 70), (192, 60), (192, 168), (100, 178), (8, 168)], fill=cover)
    parch = (242, 228, 192)
    c.poly([(16, 56), (98, 66), (98, 168), (16, 158)], fill=parch, outline=(190, 170, 130), width=1)
    c.poly([(102, 66), (184, 56), (184, 158), (102, 168)], fill=parch, outline=(190, 170, 130), width=1)
    # επίχρυση αρχιγράμματος
    c.rect(24, 70, 50, 96, fill=(170, 30, 40))
    c.rect(26, 72, 48, 94, outline=(230, 190, 80), width=1.5)
    c.text(37, 84, "Α", 18, (240, 200, 90), "serif_b", "mm")
    for k in range(9):
        y = 74 + k * 9 + 0.4 * k
        c.line([(54 if k < 3 else 24, y), (90, y + 2)], (110, 90, 70), 1.3, cap=False)
    for k in range(10):
        y = 72 + k * 9 - 0.4 * k
        c.line([(110, y + 2), (176, y)], (110, 90, 70), 1.3, cap=False)
    # σελίδα που γυρίζει
    ph = (t % 3.0) / 3.0
    if ph < 0.6:
        u = ease(ph / 0.6)
        wx = 84 * math.cos(math.pi * u)
        lift = 26 * math.sin(math.pi * u)
        pg = [(100, 66), (100 + wx, 60 - lift), (100 + wx, 160 - lift * 0.6), (100, 168)]
        c.poly(pg, fill=shade(parch, 0.9 if wx > 0 else 0.97), outline=(180, 160, 120), width=1)
    c.line([(100, 64), (100, 170)], (150, 120, 90), 2, cap=False)


# ------------------------------------------------------------ 11. Μηχανικό ρολόι
def icon_clock(c, t):
    stone = (180, 170, 150)
    c.poly([(30, 190), (30, 60), (100, 20), (170, 60), (170, 190)], fill=stone, outline=(110, 100, 90), width=2)
    # καμπάνα
    sw = 0.25 * math.sin(t * 3.2)
    bell = [(-12, 0), (-10, -14), (-5, -18), (5, -18), (10, -14), (12, 0), (15, 5), (-15, 5)]
    bell = [(100 + x, 50 + y) for x, y in bell]
    c.line([(100, 30), (100, 32)], (80, 70, 60), 2)
    c.poly(rot(bell, 100, 32, sw), fill=(200, 160, 70), outline=(120, 90, 30), width=1.5)
    # καντράν
    cx, cy, r = 100, 122, 58
    c.circle(cx, cy, r + 5, fill=(214, 176, 80))
    c.circle(cx, cy, r, fill=(34, 52, 120))
    for i in range(40):
        a = i / 40 * 2 * math.pi
        c.circle(cx + (r - 30) * math.cos(a) * 0.5, cy + (r - 30) * math.sin(a) * 0.5, 0.6,
                 fill=(230, 200, 120))
    nums = ["XII", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI"]
    for i, n in enumerate(nums):
        a = math.radians(i * 30 - 90)
        c.text(cx + 45 * math.cos(a), cy + 45 * math.sin(a), n, 9, (240, 210, 120), "serif_b", "mm")
    c.circle(cx, cy, r - 16, outline=(214, 176, 80), width=1)
    # μόνο ένας δείκτης (ώρας), όπως στα πρώτα ρολόγια
    a = t * 0.9 - math.pi / 2
    tip = (cx + 36 * math.cos(a), cy + 36 * math.sin(a))
    tail = (cx - 10 * math.cos(a), cy - 10 * math.sin(a))
    c.line([tail, tip], (240, 210, 120), 3.5)
    c.poly(ngon(tip[0], tip[1], 6, 3, a), fill=(240, 210, 120))
    c.circle(cx, cy, 7, fill=(240, 210, 120))
    for k in range(8):
        aa = k * math.pi / 4 + t
        c.line([(cx, cy), (cx + 9 * math.cos(aa), cy + 9 * math.sin(aa))], (240, 210, 120), 1.5)


# ------------------------------------------------------------ 12. Γυαλιά
def icon_glasses(c, t):
    parch = (240, 226, 188)
    c.rect(10, 118, 190, 196, fill=parch, r=4)
    for k in range(7):
        y = 128 + k * 10
        c.line([(20, y), (180, y)], (120, 100, 80), 1.2, cap=False)
    frame = (126, 84, 46)
    L, R = (58, 132), (142, 132)
    r = 34
    rv = (100, 48 + 2 * math.sin(t * 2))
    c.line([(L[0] + 20, L[1] - 26), rv], frame, 9)
    c.line([(R[0] - 20, R[1] - 26), rv], frame, 9)
    c.circle(rv[0], rv[1], 7, fill=(170, 150, 110), outline=frame, width=2)
    for cx, cy in (L, R):
        c.circle(cx, cy, r + 7, fill=frame)
        c.circle(cx, cy, r, fill=(214, 232, 240))
        # μεγεθυμένα γράμματα μέσα στον φακό
        for k in range(-3, 4):
            y = cy + k * 13 + 4
            dy = y - cy
            if abs(dy) < r - 5:
                hw = math.sqrt(r * r - dy * dy) - 5
                c.line([(cx - hw, y), (cx + hw, y)], (80, 70, 60), 2.6, cap=False)
        c.arc(cx - 6, cy - 6, r - 10, r - 10, 200, 250, (255, 255, 255), 3)


# ------------------------------------------------------------ 13. Τυπογραφία
def icon_press(c, t):
    wood, dark = (150, 100, 55), (80, 50, 25)
    ph = (t % 3.0) / 3.0
    press = math.sin(math.pi * clamp((ph - 0.1) / 0.5)) if ph < 0.6 else 0.0
    # στοίβα με τυπωμένες σελίδες δεξιά
    pages = int(t / 3.0)
    for k in range(min(pages, 6)):
        c.rect(150 - k, 170 - k * 3, 196 - k, 176 - k * 3, fill=(245, 240, 225), outline=(170, 160, 140), width=0.8)
    c.rect(22, 14, 36, 190, fill=wood, outline=dark, width=1.5)
    c.rect(122, 14, 136, 190, fill=wood, outline=dark, width=1.5)
    c.rect(14, 14, 144, 30, fill=wood, outline=dark, width=1.5)
    c.rect(14, 58, 144, 72, fill=wood, outline=dark, width=1.5)
    c.rect(10, 176, 148, 190, fill=wood, outline=dark, width=1.5)
    # βίδα
    c.rect(72, 30, 86, 110 + press * 10, fill=(170, 150, 110), outline=dark, width=1)
    for k in range(9):
        y = 34 + k * 8 + (t * 6 % 8)
        if y < 104 + press * 10:
            c.line([(72, y), (86, y - 5)], dark, 1.2, cap=False)
    # μοχλός που γυρίζει
    ang = press * 2.2
    hx = 79 + 58 * math.cos(ang)
    c.line([(79, 92), (hx, 92 + 6 * math.sin(ang))], (120, 80, 40), 5)
    c.circle(hx, 92 + 6 * math.sin(ang), 4, fill=dark)
    # πλάκα πίεσης
    py = 112 + press * 12
    c.rect(44, py, 114, py + 10, fill=(130, 90, 50), outline=dark, width=1.5)
    # κλίνη με κινητά στοιχεία και χαρτί
    c.rect(38, 138, 120, 150, fill=(110, 110, 120), outline=(60, 60, 70), width=1)
    for i in range(12):
        for j in range(2):
            c.rect(42 + i * 6.4, 140 + j * 5, 46 + i * 6.4, 143 + j * 5, fill=(170, 170, 180))
    c.rect(42, 134, 116, 138, fill=(248, 244, 230))
    c.text(79, 160, "A·B·C", 10, (230, 200, 120), "serif_b", "mm")


# ------------------------------------------------------------ 14. Σχέδιο του Λεονάρντο
def icon_leonardo(c, t):
    parch = (236, 214, 166)
    edge = [(8, 14), (60, 8), (120, 16), (192, 8), (188, 90), (194, 190), (120, 184), (50, 192), (10, 186), (14, 100)]
    c.poly(edge, fill=parch, outline=(190, 160, 110), width=2)
    ink = (110, 70, 36)
    # γραφή-καθρέφτης (σκαριφήματα)
    rnd = random.Random(4)
    for k in range(4):
        y = 26 + k * 8
        c.line([(20 + i * 4, y + rnd.uniform(-1.5, 1.5)) for i in range(14)], (150, 110, 70), 1, cap=False)
    # «εναέρια βίδα»
    cx = 108
    c.ellipse(cx, 164, 52, 11, outline=ink, width=2)
    c.line([(cx - 52, 164), (cx - 52, 172)], ink, 1.5)
    c.line([(cx + 52, 164), (cx + 52, 172)], ink, 1.5)
    c.ellipse(cx, 172, 52, 11, outline=ink, width=1)
    c.line([(cx, 172), (cx, 46)], ink, 3)
    spin = t * 1.6
    Rr = 58
    prev = None
    for i in range(0, 121):
        u = i / 120
        th = u * 2 * math.pi * 1.05 + spin
        y = 60 + u * 86
        x = cx + Rr * math.cos(th)
        yy = y + 13 * math.sin(th)
        front = math.sin(th) > 0
        if prev:
            c.line([prev, (x, yy)], ink, 2.4 if front else 1.0, cap=False)
        if i % 12 == 0:
            c.line([(cx, y), (x, yy)], (150, 110, 70), 1, cap=False)
        prev = (x, yy)
    # σκιάσεις με πενάκι
    for k in range(8):
        x = 30 + k * 3
        c.line([(x, 120), (x + 10, 106)], (170, 130, 90), 0.8, cap=False)


# ------------------------------------------------------------ 15. Πυξίδα
def icon_compass(c, t):
    cx, cy = 100, 100
    c.circle(cx + 3, cy + 5, 88, fill=(0, 0, 0, 110))
    c.circle(cx, cy, 88, fill=(126, 82, 42))
    c.circle(cx, cy, 80, fill=(170, 116, 64))
    c.circle(cx, cy, 72, fill=(214, 176, 90))
    c.circle(cx, cy, 68, fill=(244, 234, 206))
    wob = 0.22 * math.sin(t * 2.1) * math.exp(-((t % 6) / 3)) + 0.05 * math.sin(t * 0.7)
    for k in range(32):
        a = k / 32 * 2 * math.pi + wob
        c.line([(cx + 60 * math.cos(a), cy + 60 * math.sin(a)), (cx + 66 * math.cos(a), cy + 66 * math.sin(a))],
               (120, 90, 50), 1, cap=False)
    def point(a, L, w, c1, c2):
        tip = (cx + L * math.cos(a), cy + L * math.sin(a))
        l = (cx + w * math.cos(a - math.pi / 2), cy + w * math.sin(a - math.pi / 2))
        r = (cx + w * math.cos(a + math.pi / 2), cy + w * math.sin(a + math.pi / 2))
        c.poly([(cx, cy), l, tip], fill=c1)
        c.poly([(cx, cy), r, tip], fill=c2)
    for k in range(8):
        point(k * math.pi / 4 + math.pi / 8 - math.pi / 2 + wob, 36, 5, (170, 140, 90), (120, 90, 50))
    for k in range(4):
        point(k * math.pi / 2 + math.pi / 4 - math.pi / 2 + wob, 46, 8, (60, 90, 150), (30, 50, 100))
    for k in range(4):
        col = ((200, 40, 40), (130, 20, 20)) if k == 0 else ((40, 40, 40), (160, 150, 130))
        point(k * math.pi / 2 - math.pi / 2 + wob, 58, 10, *col)
    for k, ch in enumerate("ΒΑΝΔ"):
        a = k * math.pi / 2 - math.pi / 2 + wob
        c.text(cx + 76 * math.cos(a), cy + 76 * math.sin(a), ch, 12, (60, 30, 10), "serif_b", "mm")
    c.circle(cx, cy, 5, fill=(214, 176, 90), outline=(90, 60, 30), width=1)
    c.arc(cx, cy, 62, 62, 200, 250, (255, 255, 255, 180), 3)


# ------------------------------------------------------------ 16. Υδρόγειος 1492
_CONTINENTS = [
    [(-17, 21), (-10, 35), (10, 37), (32, 31), (43, 12), (51, 11), (40, -15), (35, -25), (20, -35), (12, -17),
     (9, 4), (-8, 4), (-17, 14)],
    [(-9, 43), (-9, 37), (3, 43), (15, 38), (28, 41), (40, 45), (40, 60), (30, 70), (20, 70), (5, 62), (-5, 58),
     (0, 50), (-5, 48)],
    [(40, 45), (60, 55), (80, 72), (140, 72), (170, 65), (140, 50), (122, 30), (110, 20), (105, 10), (95, 15),
     (80, 8), (72, 20), (58, 25), (45, 30)],
]


def _sphere_pt(cx, cy, r, lon, lat, rotl):
    lo = math.radians(lon) - rotl
    la = math.radians(lat)
    vis = math.cos(la) * math.cos(lo)
    if vis < 0:
        lo = math.copysign(math.pi / 2, math.sin(lo))
    return (cx + r * math.cos(la) * math.sin(lo), cy - r * math.sin(la)), vis >= 0


def icon_globe(c, t, americas=False, cx=100, cy=92, r=64, stand=True, rotl=None):
    rotl = t * 0.6 + 0.3 if rotl is None else rotl
    if stand:
        c.poly([(70, 194), (130, 194), (112, 178), (88, 178)], fill=(150, 110, 50))
        c.rect(96, 160, 104, 180, fill=(170, 130, 60))
        c.arc(cx, cy, r + 10, r + 10, 110, 290, (200, 160, 80), 4)
    c.circle(cx, cy, r, fill=(50, 105, 170) if americas else (196, 170, 118))
    ocean = (50, 105, 170) if americas else (196, 170, 118)
    land = (80, 150, 80) if americas else (150, 96, 50)
    conts = _CONTINENTS + (_AMERICAS if americas else [])
    for poly in conts:
        pts, anyvis = [], False
        for lon, lat in poly:
            p, v = _sphere_pt(cx, cy, r, lon, lat, rotl)
            pts.append(p)
            anyvis |= v
        if anyvis:
            c.poly(rot(pts, cx, cy, -0.2) if not americas else pts, fill=land)
    grid = (255, 255, 255, 70) if americas else (120, 80, 40)
    for lat in (-60, -30, 0, 30, 60):
        y = cy - r * math.sin(math.radians(lat))
        rx = r * math.cos(math.radians(lat))
        c.line([(cx - rx, y), (cx + rx, y)], grid, 1, cap=False)
    for k in range(6):
        lo = k * math.pi / 6 - (rotl % (math.pi / 6))
        rx = r * math.sin(lo - math.pi / 2)
        c.ellipse(cx, cy, abs(rx), r, outline=grid, width=1)
    c.circle(cx, cy, r, outline=(90, 60, 30) if not americas else (160, 200, 240), width=2)
    c.arc(cx - 16, cy - 18, r * 0.6, r * 0.6, 200, 260, (255, 255, 255, 120), 4)


_AMERICAS = [
    [(-80, 8), (-60, 10), (-35, -7), (-40, -22), (-58, -38), (-70, -53), (-75, -45), (-72, -18), (-81, -5)],
    [(-165, 65), (-140, 70), (-95, 72), (-65, 60), (-55, 50), (-70, 43), (-80, 30), (-82, 25), (-97, 20),
     (-90, 15), (-83, 9), (-105, 22), (-118, 33), (-125, 48), (-150, 60)],
]


# ------------------------------------------------------------ 17. Τηλεσκόπιο
def icon_telescope(c, t):
    vx, vy, vr = 146, 52, 44
    c.circle(vx, vy, vr + 4, fill=(200, 170, 90))
    c.circle(vx, vy, vr, fill=(6, 10, 30))
    c.ellipse(vx, vy, 13, 12, fill=(220, 190, 150))
    for dy, col in ((-6, (180, 130, 90)), (-1, (230, 210, 170)), (4, (170, 120, 80))):
        c.line([(vx - 12, vy + dy), (vx + 12, vy + dy)], col, 2, cap=False)
    # οι 4 δορυφόροι του Δία (Ιώ, Ευρώπη, Γανυμήδης, Καλλιστώ)
    for R, per, ph in ((17, 1.8, 0), (24, 3.6, 1), (31, 7.2, 2), (39, 16.7, 4)):
        x = vx + R * math.sin(t * 2 * math.pi / per * 2.5 + ph)
        c.circle(x, vy + 0.5, 1.8, fill=(255, 255, 240))
    # τηλεσκόπιο
    a0, a1 = (18, 168), (116, 96)
    L = math.hypot(a1[0] - a0[0], a1[1] - a0[1])
    ux, uy = (a1[0] - a0[0]) / L, (a1[1] - a0[1]) / L
    nx, ny = -uy, ux
    def P(s, k):
        return (a0[0] + ux * s + nx * k, a0[1] + uy * s + ny * k)
    c.poly([P(0, -6), P(L, -10), P(L, 10), P(0, 6)], fill=(120, 60, 34), outline=(60, 30, 14), width=1.5)
    for s in (10, 40, 70, L - 6):
        c.line([P(s, -8), P(s, 8)], (220, 180, 90), 3, cap=False)
    c.poly([P(L - 2, -11), P(L + 5, -11), P(L + 5, 11), P(L - 2, 11)], fill=(200, 160, 80))
    c.line([P(L + 5, -9), P(L + 5, 9)], (170, 220, 255), 2, cap=False)
    # τρίποδο
    m = P(L * 0.52, 8)
    for fx in (60, 88, 112):
        c.line([m, (fx, 192)], (100, 70, 40), 3)
    c.circle(m[0], m[1], 5, fill=(200, 160, 80))


# ------------------------------------------------------------ 18. Μικροσκόπιο
def icon_microscope(c, t):
    vx, vy, vr = 52, 56, 46
    c.circle(vx, vy, vr + 4, fill=(200, 200, 210))
    c.circle(vx, vy, vr, fill=(240, 222, 170))
    # τα «κύτταρα» του φελλού του Χουκ
    zoom = 1 + 0.08 * math.sin(t * 1.3)
    for i in range(-4, 5):
        for j in range(-4, 5):
            x = vx + (i * 15 + (j % 2) * 7.5) * zoom
            y = vy + j * 12 * zoom
            if (x - vx) ** 2 + (y - vy) ** 2 < (vr - 7) ** 2:
                c.poly(ngon(x, y, 7.5 * zoom, 6, math.pi / 6), outline=(150, 100, 50), width=1.5)
    brass, dark = (210, 170, 80), (120, 90, 30)
    c.poly([(100, 194), (190, 194), (180, 180), (110, 180)], fill=(60, 40, 30))
    c.rect(160, 110, 170, 182, fill=(90, 60, 40))
    c.line([(165, 120), (138, 80)], (90, 60, 40), 8)
    # σωλήνας (λοξός)
    body = rot([(118, 30), (138, 30), (136, 132), (120, 132)], 128, 90, -0.28)
    c.poly(body, fill=(40, 60, 110), outline=dark, width=1.5)
    for y in (48, 80, 112):
        c.line(rot([(118, y), (138, y)], 128, 90, -0.28), brass, 3, cap=False)
    ep = rot([(121, 18), (135, 18), (135, 32), (121, 32)], 128, 90, -0.28)
    c.poly(ep, fill=brass)
    ob = rot([(123, 132), (133, 132), (131, 146), (125, 146)], 128, 90, -0.28)
    c.poly(ob, fill=brass)
    # τράπεζα και λάμπα
    c.rect(110, 158, 176, 164, fill=(80, 80, 90))
    c.rect(122, 155, 150, 158, fill=(200, 230, 255))
    glow(c, 96, 150, 20, (255, 220, 120), 8, 0.5)
    c.circle(96, 150, 9, fill=(255, 220, 120))


# ------------------------------------------------------------ 19. Αλεξικέραυνο
def icon_rod(c, t):
    c.rect(0, 186, 200, 200, fill=(70, 100, 50))
    # σύννεφο καταιγίδας
    for dx, dy, r in ((-30, 4, 18), (-8, -6, 24), (20, -4, 22), (42, 6, 16)):
        c.circle(56 + dx, 30 + dy, r, fill=(90, 96, 112))
    c.rect(22, 30, 104, 48, fill=(90, 96, 112), r=8)
    ph = t % 2.6
    flash = ph < 0.35 and int(ph * 20) % 2 == 0
    # σπίτι
    c.rect(56, 110, 160, 186, fill=(196, 150, 110), outline=(120, 80, 50), width=1.5)
    c.poly([(48, 112), (108, 66), (168, 112)], fill=(150, 60, 40), outline=(90, 30, 20), width=1.5)
    c.rect(130, 70, 144, 96, fill=(150, 90, 70))
    c.rect(94, 146, 118, 186, fill=(110, 70, 40))
    for wx in (68, 132):
        c.rect(wx, 124, wx + 18, 142, fill=(255, 230, 150) if flash else (120, 150, 180))
    # ράβδος και αγωγός γείωσης
    wire = (230, 230, 255) if flash else (140, 100, 60)
    c.line([(108, 66), (108, 20)], (180, 180, 190), 3)
    c.poly([(104, 22), (108, 10), (112, 22)], fill=(200, 200, 210))
    c.line([(108, 66), (166, 110), (170, 110), (170, 190)], wire, 2)
    c.rect(164, 188, 176, 196, fill=(100, 90, 80))
    if ph < 0.35:
        bolt = [(66, 46), (82, 30), (74, 28), (96, 12), (90, 12), (108, 10)]
        glow(c, 108, 10, 26, (255, 255, 200), 8, 0.7)
        c.line(bolt, (255, 255, 200), 4)
        c.line(bolt, (255, 255, 255), 1.5, cap=False)


# ------------------------------------------------------------ 20. Εμβόλιο
def icon_vaccine(c, t):
    # ασπίδα προστασίας
    sh = [(100, 22), (164, 44), (158, 118)] + qbez((158, 118), (140, 168), (100, 190)) + \
        qbez((100, 190), (60, 168), (42, 118)) + [(36, 44)]
    k = 0.5 + 0.5 * math.sin(t * 2)
    c.poly(sh, fill=(40, 120 + int(30 * k), 90), outline=(170, 230, 190), width=3)
    c.line([(72, 104), (94, 128), (132, 80)], (230, 255, 235), 9)
    # σύριγγα
    a = -0.62
    push = 14 * ease((t % 3) / 2.2)
    def R(ps):
        return rot(ps, 100, 110, a)
    c.poly(R([(40, 102), (140, 102), (140, 118), (40, 118)]), fill=(225, 240, 250), outline=(120, 150, 170), width=1.5)
    c.poly(R([(58 + push, 104), (138, 104), (138, 116), (58 + push, 116)]), fill=(250, 210, 90))
    for x in range(60, 138, 10):
        c.line(R([(x, 102), (x, 107)]), (100, 120, 140), 1, cap=False)
    c.poly(R([(20 + push, 106), (58 + push, 106), (58 + push, 114), (20 + push, 114)]), fill=(200, 200, 210))
    c.poly(R([(16 + push, 98), (22 + push, 98), (22 + push, 122), (16 + push, 122)]), fill=(170, 170, 180))
    c.poly(R([(36, 96), (42, 96), (42, 124), (36, 124)]), fill=(170, 170, 180))
    c.poly(R([(140, 106), (150, 108), (150, 112), (140, 114)]), fill=(170, 170, 180))
    c.line(R([(150, 110), (186, 110)]), (210, 210, 220), 2)
    tip = R([(188, 110)])[0]
    d = ((t % 3) / 3)
    c.ellipse(tip[0], tip[1] + 4 + d * 10, 3, 4, fill=(250, 210, 90))


# ------------------------------------------------------------ 21. Ατμομηχανή (Watt)
def icon_steam(c, t):
    a = t * 2.4
    c.rect(4, 184, 196, 194, fill=(90, 80, 70))
    # πέτρινη βάση και κολόνα άξονα
    c.poly([(84, 184), (94, 58), (106, 58), (116, 184)], fill=(150, 120, 90), outline=(90, 70, 50), width=1.5)
    # κύλινδρος
    c.rect(24, 108, 58, 184, fill=(100, 110, 120), outline=(50, 55, 60), width=2)
    for y in (116, 176):
        c.rect(20, y - 4, 62, y + 4, fill=(80, 88, 96))
    # δοκός
    b = 0.22 * math.sin(a)
    pv = (100, 56)
    L, Rr = rot([(26, 56)], *pv, b)[0], rot([(174, 56)], *pv, b)[0]
    # βάκτρο εμβόλου
    c.line([L, (L[0], 106)], (180, 180, 190), 4)
    # σφόνδυλος (βολάν)
    fx, fy, fr = 158, 136, 42
    c.circle(fx, fy, fr, fill=(60, 64, 72))
    c.circle(fx, fy, fr - 7, fill=CLEAR)
    for k in range(6):
        aa = a + k * math.pi / 3
        c.line([(fx, fy), (fx + (fr - 5) * math.cos(aa), fy + (fr - 5) * math.sin(aa))], (60, 64, 72), 4)
    c.circle(fx, fy, 8, fill=(90, 96, 104))
    pin = (fx + 17 * math.cos(a), fy + 17 * math.sin(a))
    c.line([(fx, fy), pin], (130, 130, 140), 5)
    c.line([Rr, pin], (170, 150, 110), 4)
    c.circle(pin[0], pin[1], 3.5, fill=(220, 200, 150))
    corners = rot([(22, 50), (178, 50), (178, 62), (22, 62)], *pv, b)
    c.poly(corners, fill=(64, 64, 74), outline=(30, 30, 36), width=1.5)
    c.circle(pv[0], pv[1], 5, fill=(200, 180, 120))
    for P in (L, Rr):
        c.circle(P[0], P[1], 4, fill=(200, 180, 120))
    # ατμός
    for k in range(4):
        u = ((t * 0.8 + k * 0.25) % 1.0)
        c.circle(30 - u * 20, 104 - u * 50, 5 + u * 12, fill=(235, 235, 240, int(200 * (1 - u))))


# ------------------------------------------------------------ 22. Λαμπτήρας
def icon_bulb(c, t):
    fl = 1.0 if t > 1.4 else (1.0 if int(t * 11) % 3 else 0.2) * ease(t / 1.4)
    if fl > 0.3:
        for i in range(10):
            r = 96 - i * 7
            c.circle(100, 78, r, fill=(255, 220, 120, int(fl * (10 + i * 9))))
    c.poly(arc_pts(100, 78, 54, 54, 140, 400, 40) + [(126, 132), (74, 132)],
           fill=(255, 244, 200, int(80 + 170 * fl)), outline=(230, 230, 230), width=2)
    # σύρματα και ίνα άνθρακα (πέταλο)
    c.line([(90, 132), (90, 84)], (150, 150, 150), 1.6)
    c.line([(110, 132), (110, 84)], (150, 150, 150), 1.6)
    fil = qbez((90, 84), (100, 36), (110, 84), 20)
    fcol = (255, int(160 + 90 * fl), int(80 + 120 * fl)) if fl > 0.3 else (70, 50, 40)
    c.line(fil, fcol, 2.6)
    if fl > 0.3:
        c.line(fil, (255, 255, 235), 1.2, cap=False)
    # βάση με σπείρωμα
    c.rect(74, 132, 126, 140, fill=(80, 80, 80))
    for k in range(4):
        y = 140 + k * 9
        c.rect(76 + k, y, 124 - k, y + 9, fill=(196, 160, 80), outline=(130, 100, 40), width=1)
    c.poly([(86, 176), (114, 176), (106, 190), (94, 190)], fill=(70, 60, 50))


# ------------------------------------------------------------ 23. Αεροπλάνο αδελφών Ράιτ
def wright_flyer(c, cx, cy, k, t, cloth=(236, 226, 200), wood=(90, 60, 35)):
    """Wright Flyer (1903) σε πλάγια αξονομετρική προβολή. k = pixels ανά μέτρο."""
    def P(x, y, z):
        return (cx + k * (x + 0.42 * y), cy + k * (-z - 0.26 * y))
    def surf(x0, x1, y0, y1, z, col):
        c.poly([P(x0, y0, z), P(x1, y0, z), P(x1, y1, z), P(x0, y1, z)], fill=col, outline=shade(col, 0.7),
               width=0.8)
    # πηδάλια (δίδυμα) πίσω
    for y in (-0.35, 0.35):
        c.poly([P(-3.9, y, 0.3), P(-3.3, y, 0.3), P(-3.3, y, 1.9), P(-3.9, y, 1.9)], fill=shade(cloth, 0.9),
               outline=wood, width=0.8)
    c.line([P(-1.0, 0, 0.9), P(-3.3, 0, 1.1)], wood, 1.2, cap=False)
    # έλικες (ωθητικές) – θαμποί δίσκοι
    for y in (-1.7, 1.7):
        px, py = P(-1.2, y, 0.95)
        c.ellipse(px, py, k * 0.35, k * 1.3, fill=(170, 170, 170, 90))
        a = t * 30
        c.line([P(-1.2, y + 0.3 * math.cos(a) * 1.3, 0.95 + 1.2 * math.sin(a)),
                P(-1.2, y - 0.3 * math.cos(a) * 1.3, 0.95 - 1.2 * math.sin(a))], wood, 1.8)
    surf(-1.0, 1.0, -6.1, 6.1, 0.0, cloth)
    # πιλότος ξαπλωμένος στην κάτω πτέρυγα
    px, py = P(0.1, -0.5, 0.18)
    c.ellipse(px, py, k * 0.6, k * 0.18, fill=(60, 50, 45))
    c.circle(px + k * 0.55, py - k * 0.12, k * 0.16, fill=(70, 60, 55))
    # ορθοστάτες
    for y in (-6.0, -4.6, -3.2, -1.8, -0.4, 0.4, 1.8, 3.2, 4.6, 6.0):
        for x in (-0.9, 0.9):
            c.line([P(x, y, 0), P(x, y, 1.8)], wood, 1, cap=False)
    surf(-1.0, 1.0, -6.1, 6.1, 1.8, cloth)
    # πρόσθιο πηδάλιο ανόδου (canard) σε βραχίονες
    for y in (-0.5, 0.5):
        c.line([P(0.9, y, 0.0), P(3.1, y, 0.7)], wood, 1, cap=False)
        c.line([P(0.9, y, 1.8), P(3.1, y, 1.1)], wood, 1, cap=False)
    surf(2.8, 3.6, -2.3, 2.3, 0.7, shade(cloth, 0.95))
    surf(2.8, 3.6, -2.3, 2.3, 1.2, cloth)
    # πέδιλα προσγείωσης
    c.line([P(-0.8, -0.4, -0.35), P(3.4, -0.4, -0.2)], wood, 1.2)


def icon_plane(c, t):
    c.ellipse(100, 180, 70, 6, fill=(0, 0, 0, 90))
    for i in range(5):
        x = 190 - ((t * 60 + i * 44) % 220)
        c.line([(x, 40 + i * 28), (x + 20, 40 + i * 28)], (140, 170, 210), 1.5)
    wright_flyer(c, 97, 112 + 3 * math.sin(t * 2), 14, t)


# ------------------------------------------------------------ 24. Πενικιλίνη
def icon_penicillin(c, t):
    cx, cy = 100, 100
    c.circle(cx + 3, cy + 6, 84, fill=(0, 0, 0, 100))
    c.circle(cx, cy, 84, fill=(200, 215, 225))
    c.circle(cx, cy, 78, fill=(230, 205, 130))
    mx, my = 76, 86
    kill = 26 + 34 * ease(t / 4.0)
    c.circle(mx, my, kill, fill=(242, 222, 160))
    rnd = random.Random(8)
    for _ in range(70):
        a, rr = rnd.uniform(0, 6.28), 74 * math.sqrt(rnd.random())
        x, y = cx + rr * math.cos(a), cy + rr * math.sin(a)
        d = math.hypot(x - mx, y - my)
        if d < 22:
            continue
        s = rnd.uniform(2.4, 4.2) * (clamp((d - kill) / 10 + 1) if d < kill + 10 else 1)
        if s > 0.4:
            c.circle(x, y, s, fill=(250, 248, 230), outline=(190, 170, 110), width=0.8)
    # αποικία μύκητα Penicillium
    for i in range(16):
        a = i / 16 * 6.28
        c.circle(mx + 12 * math.cos(a), my + 12 * math.sin(a), 8, fill=(236, 242, 230))
    c.circle(mx, my, 13, fill=(110, 160, 130))
    c.circle(mx, my, 6, fill=(70, 120, 100))
    c.circle(cx, cy, 78, outline=(255, 255, 255, 150), width=2)
    c.arc(cx, cy, 72, 72, 200, 250, (255, 255, 255), 3)


# ------------------------------------------------------------ 25. Μικροτσίπ
def icon_chip(c, t):
    traces = []
    for k in range(6):
        off = 62 + k * 15.2
        traces += [[(off, 50), (off, 30), (off + (k - 2.5) * 6, 12)],
                   [(off, 150), (off, 170), (off - (k - 2.5) * 6, 188)],
                   [(50, off), (30, off), (12, off + (k - 2.5) * 6)],
                   [(150, off), (170, off), (188, off - (k - 2.5) * 6)]]
    for tr in traces:
        c.line(tr, (40, 150, 120), 2)
        c.circle(tr[-1][0], tr[-1][1], 3, fill=(60, 200, 160))
    for i, tr in enumerate(traces):
        u = (t * 0.9 + i * 0.137) % 1.0
        seg = 0 if u < 0.5 else 1
        v = (u % 0.5) * 2
        a, b = tr[seg], tr[seg + 1]
        p = (lerp(a[0], b[0], v), lerp(a[1], b[1], v)) if seg == 0 else (lerp(a[0], b[0], v), lerp(a[1], b[1], v))
        c.circle(p[0], p[1], 2.8, fill=(160, 255, 240))
    for k in range(6):
        off = 62 + k * 15.2
        for rect in ((off - 3, 42, off + 3, 52), (off - 3, 148, off + 3, 158),
                     (42, off - 3, 52, off + 3), (148, off - 3, 158, off + 3)):
            c.rect(*rect, fill=(200, 200, 210))
    c.rect(50, 50, 150, 150, fill=(30, 32, 38), outline=(90, 90, 100), width=2, r=6)
    c.rect(78, 78, 122, 122, fill=(200, 160, 70), r=3)
    for k in range(4):
        c.line([(82, 86 + k * 9), (118, 86 + k * 9)], (150, 110, 40), 1, cap=False)
    c.circle(62, 62, 3, fill=(90, 90, 100))


# ------------------------------------------------------------ 26. Παγκόσμιος Ιστός
def icon_web(c, t):
    icon_globe(c, t, americas=True, cx=86, cy=90, r=70, stand=False, rotl=t * 0.4 + 1.0)
    rnd = random.Random(21)
    nodes = []
    for _ in range(9):
        a, rr = rnd.uniform(0, 6.28), 60 * math.sqrt(rnd.random())
        nodes.append((86 + rr * math.cos(a), 90 + rr * math.sin(a)))
    links = [(0, 1), (1, 2), (2, 3), (3, 4), (4, 0), (5, 1), (6, 3), (7, 5), (8, 6), (7, 2), (8, 4)]
    for i, (a, b) in enumerate(links):
        A, B = nodes[a], nodes[b]
        mid = ((A[0] + B[0]) / 2, (A[1] + B[1]) / 2 - 24)
        pts = qbez(A, mid, B, 14)
        c.line(pts, (255, 220, 110), 1.6, cap=False)
        u = (t * 0.7 + i * 0.19) % 1.0
        p = pts[int(u * 14)]
        c.circle(p[0], p[1], 2.8, fill=(255, 255, 255))
    for x, y in nodes:
        c.circle(x, y, 4, fill=(255, 200, 60), outline=(120, 80, 10), width=1)
    # κινητό τηλέφωνο
    c.rect(132, 92, 190, 194, fill=(20, 20, 26), outline=(120, 120, 130), width=2, r=9)
    c.rect(137, 102, 185, 184, fill=(40, 90, 170), r=3)
    cols = [(240, 90, 80), (90, 200, 120), (250, 200, 70), (120, 170, 250)]
    for i in range(3):
        for j in range(4):
            c.rect(141 + i * 15, 108 + j * 18, 151 + i * 15, 118 + j * 18, fill=cols[(i + j) % 4], r=2)
    c.rect(152, 95, 170, 98, fill=(60, 60, 70), r=1)


ALL_ICONS = {
    "wheel": icon_wheel, "tablet": icon_tablet, "alphabet": icon_alphabet, "pythagoras": icon_pythagoras,
    "antikythera": icon_antikythera, "screw": icon_screw, "aqueduct": icon_aqueduct, "scales": icon_scales,
    "greekfire": icon_greekfire, "codex": icon_codex, "clock": icon_clock, "glasses": icon_glasses,
    "press": icon_press, "leonardo": icon_leonardo, "compass": icon_compass, "globe": icon_globe,
    "telescope": icon_telescope, "microscope": icon_microscope, "rod": icon_rod, "vaccine": icon_vaccine,
    "steam": icon_steam, "bulb": icon_bulb, "plane": icon_plane, "penicillin": icon_penicillin,
    "chip": icon_chip, "web": icon_web,
}
