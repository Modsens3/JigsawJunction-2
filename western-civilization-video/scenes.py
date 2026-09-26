"""Τα σκηνικά (φόντα και μνημεία) κάθε εποχής.

Κάθε συνάρτηση draw_*(c, t, T) ζωγραφίζει τη σκηνή τη χρονική στιγμή t
(δευτερόλεπτα από την αρχή της σκηνής, T = διάρκεια σκηνής).
Η πάνω-αριστερή γωνία (x<620, y<110) μένει ελεύθερη για τον τίτλο.
"""
import math
import random

from draw_utils import (H, W, alpha, arc_pts, bird, clamp, cloud, cypress, ease, ease_in, ease_out,
                        flag_wave, glow, hills, lerp, mix, ngon, qbez, rot, shade, stars, waves_poly)
from icons import wright_flyer


# ====================================================================== 0. Τίτλος
def _sil_skyline(c, col, rise):
    """Σιλουέτες μνημείων από όλες τις εποχές, που «φυτρώνουν» από το έδαφος."""
    g = 600
    def y(i):
        return (1 - ease_out(rise(i))) * 260
    # πυραμίδες
    o = y(0)
    c.poly([(40, g + o), (130, 505 + o), (220, g + o)], fill=col)
    c.poly([(170, g + o), (225, 548 + o), (280, g + o)], fill=col)
    # Παρθενώνας
    o = y(1)
    c.rect(300, 588 + o, 450, g + o, fill=col)
    for k in range(8):
        c.rect(308 + k * 18.5, 536 + o, 316 + k * 18.5, 588 + o, fill=col)
    c.rect(302, 526 + o, 448, 537 + o, fill=col)
    c.poly([(298, 527 + o), (375, 500 + o), (452, 527 + o)], fill=col)
    # Κολοσσαίο
    o = y(2)
    c.rect(470, 510 + o, 610, g + o, fill=col)
    for row in range(3):
        for k in range(7):
            cx = 482 + k * 19.5
            yy = 588 - row * 26 + o
            c.rect(cx - 5, yy - 14, cx + 5, yy, fill=(70, 45, 55))
            c.pieslice(cx, yy - 14, 5, 5, 180, 360, fill=(70, 45, 55))
    # Αγία Σοφία
    o = y(3)
    c.rect(630, 555 + o, 740, g + o, fill=col)
    c.pieslice(685, 556 + o, 46, 38, 180, 360, fill=col)
    c.pieslice(640, 572 + o, 22, 16, 180, 360, fill=col)
    c.pieslice(730, 572 + o, 22, 16, 180, 360, fill=col)
    c.rect(684, 506 + o, 686, 518 + o, fill=col)
    c.rect(680, 510 + o, 690, 512 + o, fill=col)
    # γοτθικός καθεδρικός
    o = y(4)
    c.rect(760, 540 + o, 850, g + o, fill=col)
    for x in (760, 830):
        c.rect(x, 500 + o, x + 20, 540 + o, fill=col)
        c.poly([(x, 500 + o), (x + 10, 455 + o), (x + 20, 500 + o)], fill=col)
    c.poly([(780, 540 + o), (805, 515 + o), (830, 540 + o)], fill=col)
    # Πύργος του Άιφελ
    o = y(5)
    c.poly([(870, g + o), (905, 520 + o), (912, 440 + o), (918, 520 + o), (953, g + o), (940, g + o),
            (912, 560 + o), (884, g + o)], fill=col)
    c.rect(884, 548 + o, 940, 553 + o, fill=col)
    # εργοστάσιο
    o = y(6)
    for k in range(3):
        c.poly([(970 + k * 30, 565 + o), (1000 + k * 30, 545 + o), (1000 + k * 30, 565 + o)], fill=col)
    c.rect(970, 565 + o, 1060, g + o, fill=col)
    c.rect(1040, 505 + o, 1050, 565 + o, fill=col)
    # ουρανοξύστες
    o = y(7)
    c.rect(1075, 480 + o, 1105, g + o, fill=col)
    c.rect(1082, 455 + o, 1098, 480 + o, fill=col)
    c.rect(1089, 425 + o, 1091, 455 + o, fill=col)
    c.rect(1110, 520 + o, 1140, g + o, fill=col)
    # πύραυλος
    o = y(8)
    c.rect(1175, 500 + o, 1189, g + o, fill=col)
    c.poly([(1175, 500 + o), (1182, 470 + o), (1189, 500 + o)], fill=col)
    c.poly([(1170, g + o), (1175, 575 + o), (1175, g + o)], fill=col)
    c.poly([(1194, g + o), (1189, 575 + o), (1189, g + o)], fill=col)


def draw_title(c, t, T):
    stars(c, t, 160, seed=1, ymax=380)
    sy = 640 - 110 * ease(t / 7)
    glow(c, 640, sy, 260, (255, 170, 90), 18, 0.55)
    c.circle(640, sy, 56, fill=(255, 214, 140))
    c.circle(640, sy, 50, fill=(255, 232, 170))
    _sil_skyline(c, (34, 22, 34), lambda i: (t - 0.6 - i * 0.28) / 1.2)
    c.rect(0, 600, W, H, fill=(34, 22, 34))
    a = ease((t - 1.4) / 1.3)
    if a > 0:
        c.text(640, 150, "Η Ιστορία του", 40, alpha((255, 240, 220), a), "serif", "mm",
               shadow=(2, 3, (0, 0, 0, int(160 * a))))
        c.text(640, 228, "Δυτικού Πολιτισμού", 76, alpha((255, 206, 110), a), "serif_b", "mm",
               shadow=(3, 4, (0, 0, 0, int(170 * a))))
    b = ease((t - 3.0) / 1.2)
    if b > 0:
        w = 300 * b
        c.line([(640 - w, 286), (640 + w, 286)], alpha((255, 206, 110), b), 2, cap=False)
        c.text(640, 318, "Από τους Σουμέριους μέχρι την ψηφιακή εποχή", 26, alpha((240, 230, 220), b),
               "sans", "mm", shadow=(2, 2, (0, 0, 0, int(150 * b))))
        c.text(640, 356, "…και οι εφευρέσεις που άλλαξαν τον κόσμο", 22, alpha((255, 206, 110), b),
               "serif", "mm", shadow=(2, 2, (0, 0, 0, int(150 * b))))


# ====================================================================== 1. Μεσοποταμία & Αίγυπτος
def palm(c, x, y, h, t, ph=0.0):
    sway = math.sin(t * 1.4 + ph) * 4
    top = (x + h * 0.18 + sway, y - h)
    trunk = qbez((x, y), (x + h * 0.02, y - h * 0.55), top, 14)
    for i in range(len(trunk) - 1):
        w = lerp(9, 5, i / len(trunk)) * h / 150
        c.line([trunk[i], trunk[i + 1]], (120, 86, 50), w * 2)
        c.line([(trunk[i][0] - w, trunk[i][1]), (trunk[i][0] + w * 0.6, trunk[i][1] - 2)], (90, 62, 34), 1.2,
               cap=False)
    for k in range(8):
        a = -math.pi / 2 + (k - 3.5) * 0.42 + math.sin(t * 1.6 + k + ph) * 0.04
        L = h * (0.42 + 0.06 * (k % 2))
        tip = (top[0] + L * math.cos(a) * 1.25, top[1] + L * math.sin(a) * 0.35 + L * 0.42)
        mid = (top[0] + L * 0.6 * math.cos(a) * 1.2, top[1] - L * 0.25)
        spine = qbez(top, mid, tip, 12)
        col = (46, 110, 52) if k % 2 else (62, 132, 60)
        for i in range(1, len(spine)):
            px, py = spine[i]
            ln = 11 * (1 - i / len(spine)) * h / 150 + 2
            c.line([(px, py), (px - ln * 0.5, py + ln)], col, 2.2, cap=False)
            c.line([(px, py), (px + ln * 0.5, py + ln)], col, 2.2, cap=False)
        c.line(spine, shade(col, 0.7), 2)
    for dx in (-5, 3, 9):
        c.circle(top[0] + dx, top[1] + 8, 4, fill=(110, 60, 30))


def pyramid(c, apex, base_l, base_m, base_r, lit=(234, 198, 138), dark=(186, 146, 92), courses=18):
    c.poly([base_l, apex, base_m], fill=dark)
    c.poly([base_m, apex, base_r], fill=lit)
    for i in range(1, courses):
        u = i / courses
        l = (lerp(base_l[0], apex[0], u), lerp(base_l[1], apex[1], u))
        m = (lerp(base_m[0], apex[0], u), lerp(base_m[1], apex[1], u))
        r = (lerp(base_r[0], apex[0], u), lerp(base_r[1], apex[1], u))
        c.line([l, m], shade(dark, 0.9), 1, cap=False)
        c.line([m, r], shade(lit, 0.93), 1, cap=False)
    c.line([base_m, apex], shade(lit, 1.05), 1.5, cap=False)


def ziggurat(c, cx, base):
    tiers = [(300, 42), (210, 38), (130, 34)]
    y = base
    brick, dark = (196, 150, 100), (150, 104, 64)
    for i, (w, h) in enumerate(tiers):
        c.poly([(cx - w / 2, y), (cx - w / 2 + 8, y - h), (cx + w / 2 - 8, y - h), (cx + w / 2, y)], fill=brick)
        c.poly([(cx + w / 2 - 8, y - h), (cx + w / 2, y), (cx + w / 2 - 24, y)], fill=dark)
        for k in range(1, 4):
            yy = y - h * k / 4
            c.line([(cx - w / 2 + 2 * k, yy), (cx + w / 2 - 2 * k, yy)], shade(brick, 0.88), 1, cap=False)
        for k in range(-int(w / 26), int(w / 26) + 1):
            c.line([(cx + k * 13, y - 4), (cx + k * 13, y - h + 4)], shade(brick, 0.9), 1.2, cap=False)
        y -= h
    c.rect(cx - 36, y - 26, cx + 36, y, fill=(210, 170, 116))
    c.rect(cx - 8, y - 18, cx + 8, y, fill=(110, 70, 40))
    c.rect(cx - 38, y - 30, cx + 38, y - 26, fill=(150, 90, 50))
    # κεντρική σκάλα
    c.poly([(cx - 20, base), (cx - 10, base - 114), (cx + 10, base - 114), (cx + 20, base)], fill=(214, 172, 122))
    for k in range(20):
        yy = base - k * 5.7
        ww = lerp(20, 10, k / 20)
        c.line([(cx - ww, yy), (cx + ww, yy)], (170, 126, 80), 1, cap=False)


def felucca(c, x, y, t):
    bob = math.sin(t * 2) * 1.5
    y += bob
    c.poly([(x - 40, y - 6)] + qbez((x - 40, y - 6), (x, y + 12), (x + 46, y - 10)) + [(x + 38, y - 4)],
           fill=(110, 70, 40))
    c.line([(x - 4, y - 4), (x + 2, y - 88)], (80, 50, 25), 2.5)
    sail = qbez((x - 36, y - 18), (x - 4, y - 60), (x + 30, y - 104), 12) + [(x + 4, y - 10)]
    c.poly(sail, fill=(246, 238, 220), outline=(170, 150, 120), width=1)
    c.line([(x - 38, y - 16), (x + 32, y - 106)], (90, 60, 30), 2)
    c.line([(x - 50, y + 3), (x + 50, y + 3)], (140, 180, 200), 1.2, cap=False)


def draw_egypt(c, t, T):
    glow(c, 700, 150, 160, (255, 230, 170), 14, 0.5)
    c.circle(700, 150, 34, fill=(255, 244, 205))
    cloud(c, 260 + t * 4, 150, 0.8, (255, 250, 240), (240, 226, 210))
    hills(c, 470, 10, 520, (224, 186, 128), 0.5)
    pyramid(c, (455, 300), (330, 475), (470, 480), (590, 470))
    pyramid(c, (650, 222), (480, 478), (668, 486), (850, 470), courses=24)
    ziggurat(c, 190, 480)
    hills(c, 488, 5, 300, (214, 174, 114), 1.2)
    # Νείλος
    c.rect(0, 500, W, 548, fill=(60, 120, 170))
    for i in range(14):
        x = (i * 97 + t * 18) % W
        c.line([(x, 512 + (i % 3) * 11), (x + 26, 512 + (i % 3) * 11)], (150, 200, 230), 1.5, cap=False)
    c.poly([(0, 498)] + [(x, 500 + 2 * math.sin(x / 40)) for x in range(0, W + 1, 40)] + [(W, 498)],
           fill=(90, 140, 70))
    felucca(c, 90 + t * 34, 524, t)
    # όχθη μπροστά
    c.poly([(0, H), (0, 548)] + [(x, 546 + 4 * math.sin(x / 60)) for x in range(0, W + 1, 20)] + [(W, H)],
           fill=(214, 174, 114))
    c.poly([(0, H), (0, 560)] + [(x, 560 + 3 * math.sin(x / 50 + 1)) for x in range(0, W + 1, 20)] + [(W, H)],
           fill=(90, 140, 70))
    c.rect(0, 572, W, H, fill=(206, 166, 106))
    palm(c, 40, 590, 150, t)
    palm(c, 790, 580, 120, t, 1.7)
    palm(c, 845, 592, 96, t, 3.1)
    rnd = random.Random(7)
    for _ in range(80):
        c.circle(rnd.uniform(0, W), rnd.uniform(578, H), rnd.uniform(0.8, 1.8), fill=(180, 140, 86))


# ====================================================================== 2. Αρχαία Ελλάδα
def olive(c, x, y, s, t, ph=0.0):
    c.poly([(x - 6 * s, y), (x - 3 * s, y - 40 * s), (x - 16 * s, y - 70 * s), (x - 8 * s, y - 72 * s),
            (x + 2 * s, y - 50 * s), (x + 12 * s, y - 76 * s), (x + 18 * s, y - 72 * s), (x + 7 * s, y - 38 * s),
            (x + 8 * s, y)], fill=(100, 84, 64))
    sw = math.sin(t * 1.2 + ph) * 2 * s
    for dx, dy, r, col in ((-30, -78, 30, (104, 130, 92)), (8, -94, 34, (116, 142, 100)),
                           (38, -72, 28, (100, 124, 88)), (-8, -70, 26, (128, 152, 110)),
                           (20, -100, 20, (138, 160, 120))):
        c.circle(x + dx * s + sw, y + dy * s, r * s, fill=col)
    rnd = random.Random(int(x))
    for _ in range(26):
        c.circle(x + rnd.uniform(-50, 55) * s + sw, y + rnd.uniform(-120, -55) * s, 2.2 * s, fill=(170, 186, 150))


def parthenon(c, x0, x1, base, marble=(240, 230, 208), shadow=(196, 184, 160)):
    """Δωρικός οκτάστυλος ναός – πρόσοψη με σωστή σειρά μελών."""
    Wd = x1 - x0
    u = Wd / 460.0
    # κρηπίδα: 3 βαθμίδες
    for k in range(3):
        c.rect(x0 + k * 8 * u, base - (k + 1) * 11 * u, x1 - k * 8 * u, base - k * 11 * u,
               fill=shade(marble, 0.95 - 0.03 * k), outline=shadow, width=0.8)
    styl = base - 33 * u
    col_h = 172 * u
    top = styl - col_h
    # σηκός (σκοτεινό εσωτερικό πίσω από τους κίονες)
    c.rect(x0 + 34 * u, top, x1 - 34 * u, styl, fill=(150, 132, 110))
    c.rect(x0 + 34 * u, top, x1 - 34 * u, top + 30 * u, fill=(122, 106, 90))
    c.rect(x0 + 34 * u, styl - 70 * u, x1 - 34 * u, styl, fill=(166, 148, 124))
    # 8 κίονες με ραβδώσεις, ένταση (entasis) και κιονόκρανα
    xs = [lerp(x0 + 44 * u, x1 - 44 * u, i / 7) for i in range(8)]
    for cx in xs:
        rb, rt = 16 * u, 12.5 * u
        n = 16
        pts_l = [(cx - lerp(rb, rt, i / n) - 1.2 * u * math.sin(math.pi * i / n), lerp(styl, top + 14 * u, i / n))
                 for i in range(n + 1)]
        pts_r = [(2 * cx - px, py) for px, py in reversed(pts_l)]
        c.poly(pts_l + pts_r, fill=marble)
        c.poly([(cx + rb * 0.25, styl), (cx + rt * 0.25, top + 14 * u), (cx + rt, top + 14 * u), (cx + rb, styl)],
               fill=shadow)
        for f in (-0.6, -0.2, 0.2, 0.6):
            c.line([(cx + f * rb, styl), (cx + f * rt, top + 14 * u)], shade(marble, 0.84), 1, cap=False)
        # εχίνος και άβακας
        c.poly([(cx - rt, top + 14 * u), (cx + rt, top + 14 * u), (cx + 19 * u, top + 6 * u),
                (cx - 19 * u, top + 6 * u)], fill=shade(marble, 0.96))
        c.rect(cx - 20 * u, top, cx + 20 * u, top + 6 * u, fill=marble, outline=shadow, width=0.6)
    # επιστύλιο
    arch_top = top - 22 * u
    c.rect(x0 + 22 * u, arch_top, x1 - 22 * u, top, fill=marble, outline=shadow, width=0.8)
    c.rect(x0 + 22 * u, arch_top, x1 - 22 * u, arch_top + 4 * u, fill=shade(marble, 0.93))
    # ζωφόρος: τρίγλυφα και μετόπες
    fr_top = arch_top - 24 * u
    c.rect(x0 + 22 * u, fr_top, x1 - 22 * u, arch_top, fill=shade(marble, 0.97))
    tri = []
    for i in range(8):
        tri.append(xs[i])
        if i < 7:
            tri.append((xs[i] + xs[i + 1]) / 2)
    tri[0] = x0 + 29 * u
    tri[-1] = x1 - 29 * u
    for i, tx in enumerate(tri):
        c.rect(tx - 7 * u, fr_top + 2 * u, tx + 7 * u, arch_top, fill=(150, 150, 160))
        for g in (-2.4, 2.4):
            c.line([(tx + g * u, fr_top + 4 * u), (tx + g * u, arch_top - 1)], (110, 110, 120), 1.2, cap=False)
        if i < len(tri) - 1:
            mx = (tx + tri[i + 1]) / 2
            c.rect(mx - 9 * u, fr_top + 5 * u, mx + 9 * u, arch_top - 3 * u, fill=(210, 190, 160))
            c.circle(mx - 2 * u, fr_top + 11 * u, 3 * u, fill=(176, 150, 120))
            c.line([(mx - 3 * u, fr_top + 14 * u), (mx + 4 * u, arch_top - 4 * u)], (176, 150, 120), 2 * u)
    # γείσο
    c.rect(x0 + 14 * u, fr_top - 8 * u, x1 - 14 * u, fr_top, fill=marble, outline=shadow, width=0.8)
    # αέτωμα
    apex = ((x0 + x1) / 2, fr_top - 8 * u - 58 * u)
    L, R = (x0 + 12 * u, fr_top - 8 * u), (x1 - 12 * u, fr_top - 8 * u)
    c.poly([L, apex, R], fill=marble, outline=shadow, width=1)
    inner = [(L[0] + 26 * u, L[1] - 3 * u), (apex[0], apex[1] + 10 * u), (R[0] - 26 * u, R[1] - 3 * u)]
    c.poly(inner, fill=(214, 198, 172))
    # γλυπτά του αετώματος (σιλουέτες μορφών που μικραίνουν προς τις γωνίες)
    for k in range(-6, 7):
        fx = apex[0] + k * 26 * u
        hh = (58 - abs(k) * 8.5) * u - 8 * u
        if hh > 6 * u:
            c.rect(fx - 4 * u, L[1] - 3 * u - hh, fx + 4 * u, L[1] - 3 * u, fill=(190, 172, 146))
            c.circle(fx, L[1] - 3 * u - hh, 4 * u, fill=(190, 172, 146))
    c.line([L, apex, R], shade(marble, 1.03), 2.5 * u)
    for p in (L, apex, R):
        c.circle(p[0], p[1] - 3 * u, 4 * u, fill=marble)


def trireme(c, x, y, t, s=1.0):
    bob = math.sin(t * 1.8) * 1.2
    y += bob
    hull = [(x - 70 * s, y - 12 * s)] + qbez((x - 70 * s, y - 12 * s), (x - 40 * s, y + 8 * s), (x + 50 * s, y + 2 * s)) + \
        [(x + 72 * s, y + 4 * s), (x + 58 * s, y - 10 * s), (x - 60 * s, y - 14 * s), (x - 80 * s, y - 30 * s)]
    c.poly(hull, fill=(70, 46, 30))
    c.line([(x - 60 * s, y - 8 * s), (x + 56 * s, y - 6 * s)], (170, 60, 40), 2 * s, cap=False)
    c.circle(x + 52 * s, y - 5 * s, 2.2 * s, fill=(240, 240, 240))
    for k in range(12):
        ox = x - 50 * s + k * 8.5 * s
        a = math.sin(t * 3 + k * 0.2) * 0.35
        c.line([(ox, y - 2 * s), (ox - 10 * s * math.cos(a) - 4 * s, y + 14 * s)], (110, 80, 50), 1.2 * s, cap=False)
    c.line([(x, y - 12 * s), (x, y - 70 * s)], (80, 50, 25), 2 * s)
    c.poly([(x - 26 * s, y - 64 * s), (x + 26 * s, y - 64 * s), (x + 22 * s, y - 26 * s), (x - 22 * s, y - 26 * s)],
           fill=(236, 226, 200))
    c.line([(x - 28 * s, y - 64 * s), (x + 28 * s, y - 64 * s)], (80, 50, 25), 1.6 * s)


def draw_greece(c, t, T):
    cloud(c, 690 - t * 3, 140, 0.9)
    cloud(c, 820 - t * 5, 210, 0.6)
    # θάλασσα
    c.rect(0, 440, W, 560, fill=(40, 100, 170))
    for i in range(24):
        x = (i * 61 + t * 10) % W
        c.line([(x, 452 + (i % 5) * 18), (x + 18, 452 + (i % 5) * 18)], (120, 170, 220), 1.4, cap=False)
    trireme(c, 690 + t * 10, 478, t, 0.8)
    hills(c, 442, 16, 700, (130, 150, 150), 0.3, 560, W, 450)
    # βράχος της Ακρόπολης
    rock = [(0, 600), (0, 468), (40, 452), (70, 432), (100, 424), (580, 420), (620, 432), (650, 452), (680, 490),
            (700, 540), (716, 600)]
    c.poly(rock, fill=(186, 160, 124))
    c.poly([(0, 600), (0, 500), (120, 470), (300, 474), (500, 470), (640, 490), (716, 600)], fill=(164, 138, 104))
    for i in range(10):
        y = 440 + i * 14
        c.line([(20 + i * 6, y), (630 - i * 6, y + 4)], (150, 124, 92), 1, cap=False)
    parthenon(c, 130, 570, 428)
    c.rect(0, 580, W, H, fill=(126, 136, 80))
    olive(c, 60, 600, 1.05, t)
    olive(c, 800, 606, 0.8, t, 2.0)
    for k in range(3):
        bird(c, (200 + k * 60 + t * 30) % 840, 150 + k * 18 + 6 * math.sin(t + k), 1, t + k)


# ====================================================================== 3. Ελληνιστική εποχή – Φάρος
def pharos(c, cx, base, t):
    stone, lit, dark = (226, 212, 184), (246, 234, 208), (178, 160, 130)
    # βάση-πλατφόρμα
    c.rect(cx - 130, base - 22, cx + 130, base, fill=dark)
    c.rect(cx - 124, base - 28, cx + 124, base - 22, fill=stone)
    # 1η βαθμίδα: τετράγωνη, κωνική
    b1, t1 = base - 28, base - 196
    c.poly([(cx - 88, b1), (cx - 70, t1), (cx + 70, t1), (cx + 88, b1)], fill=stone)
    c.poly([(cx + 20, b1), (cx + 16, t1), (cx + 70, t1), (cx + 88, b1)], fill=dark)
    for row in range(7):
        y = b1 - 16 - row * 23
        half = lerp(88, 70, (b1 - y) / (b1 - t1))
        for k in (-2, -1, 0, 1, 2):
            wx = cx + k * half * 0.34
            c.rect(wx - 3, y - 9, wx + 3, y, fill=(80, 64, 50))
            c.pieslice(wx, y - 9, 3, 3, 180, 360, fill=(80, 64, 50))
    c.rect(cx - 78, t1 - 10, cx + 78, t1, fill=lit)
    # τρίτωνες στις γωνίες
    for sx in (-1, 1):
        x = cx + sx * 70
        c.poly([(x - 5, t1 - 10), (x + 5, t1 - 10), (x + 3, t1 - 30), (x - 3, t1 - 30)], fill=(200, 176, 110))
        c.circle(x, t1 - 33, 4, fill=(200, 176, 110))
    # 2η βαθμίδα: οκταγωνική
    b2, t2 = t1 - 10, t1 - 88
    c.poly([(cx - 46, b2), (cx - 42, t2), (cx - 16, t2), (cx - 18, b2)], fill=lit)
    c.poly([(cx - 18, b2), (cx - 16, t2), (cx + 16, t2), (cx + 18, b2)], fill=stone)
    c.poly([(cx + 18, b2), (cx + 16, t2), (cx + 42, t2), (cx + 46, b2)], fill=dark)
    for y in range(int(t2) + 16, int(b2), 26):
        c.rect(cx - 4, y, cx + 4, y + 10, fill=(80, 64, 50))
    c.rect(cx - 50, t2 - 8, cx + 50, t2, fill=lit)
    # 3η βαθμίδα: κυλινδρική με κίονες και φωτιά
    b3, t3 = t2 - 8, t2 - 50
    c.rect(cx - 30, t3, cx + 30, b3, fill=(60, 40, 30))
    fl = 0.8 + 0.2 * math.sin(t * 13) * math.sin(t * 7.3)
    glow(c, cx, (b3 + t3) / 2, 120 * fl, (255, 180, 80), 14, 0.7)
    c.ellipse(cx, (b3 + t3) / 2 + 6, 22, 18, fill=(255, 150, 40))
    c.ellipse(cx, (b3 + t3) / 2 + 2, 12, 14 * fl, fill=(255, 230, 140))
    for k in range(-3, 4):
        x = cx + k * 9.2
        c.rect(x - 2.5, t3, x + 2.5, b3, fill=lit if k < 1 else stone)
    c.rect(cx - 34, t3 - 8, cx + 34, t3, fill=stone)
    c.pieslice(cx, t3 - 8, 26, 22, 180, 360, fill=dark)
    # άγαλμα (Δίας Σωτήρ)
    c.rect(cx - 3, t3 - 52, cx + 3, t3 - 28, fill=(200, 170, 90))
    c.circle(cx, t3 - 56, 4.5, fill=(200, 170, 90))
    c.line([(cx + 3, t3 - 46), (cx + 12, t3 - 66)], (200, 170, 90), 2)
    return cx, (b3 + t3) / 2


def merchant_ship(c, x, y, t, s=1.0):
    y += math.sin(t * 1.6) * 1.5
    c.poly([(x - 60 * s, y - 16 * s)] + qbez((x - 60 * s, y - 16 * s), (x, y + 14 * s), (x + 60 * s, y - 16 * s)) +
           [(x + 64 * s, y - 30 * s), (x + 56 * s, y - 20 * s), (x - 56 * s, y - 20 * s)], fill=(60, 36, 24))
    c.line([(x, y - 18 * s), (x, y - 86 * s)], (50, 30, 18), 2.2 * s)
    c.poly([(x - 36 * s, y - 80 * s)] + qbez((x - 36 * s, y - 80 * s), (x + 12 * s, y - 60 * s), (x - 32 * s, y - 30 * s))
           [1:] + [(x + 32 * s, y - 30 * s)] + qbez((x + 32 * s, y - 30 * s), (x + 50 * s, y - 60 * s), (x + 36 * s, y - 80 * s))[1:],
           fill=(234, 200, 150))
    c.line([(x - 40 * s, y - 80 * s), (x + 40 * s, y - 80 * s)], (50, 30, 18), 1.8 * s)


def draw_alexandria(c, t, T):
    stars(c, t, 60, seed=9, ymax=200)
    c.circle(760, 120, 26, fill=(250, 240, 210))
    c.circle(770, 114, 24, fill=(70, 70, 110))
    # θάλασσα
    c.rect(0, 470, W, H, fill=(34, 56, 100))
    c.poly([(0, H), (0, 540), (200, 510), (400, 500), (600, 506), (720, 530), (760, H)], fill=(120, 100, 80))
    c.poly([(0, H), (0, 570), (300, 540), (600, 546), (760, H)], fill=(100, 82, 64))
    fx, fy = pharos(c, 420, 504, t)
    # περιστρεφόμενη δέσμη φωτός
    a = math.sin(t * 0.7) * 1.2
    for sgn in (1, -1):
        d = sgn
        L = 900
        spread = 0.08
        p1 = (fx + d * L * math.cos(a * d * 0.3 + spread), fy + L * math.sin(a * 0.25 + spread) * 0.3)
        p2 = (fx + d * L * math.cos(a * d * 0.3 - spread), fy + L * math.sin(a * 0.25 - spread) * 0.3)
        c.poly([(fx, fy), p1, p2], fill=(255, 220, 140, 34 if d == 1 else 18))
    for i in range(30):
        x = (i * 47 + t * 16) % W
        y = 540 + (i % 6) * 26
        if not (x <= 740 and y < 560):
            c.line([(x, y), (x + 22, y)], (80, 110, 160), 1.3, cap=False)
    # αντανάκλαση
    for k in range(8):
        y = 545 + k * 18
        w = 16 + k * 5 + 4 * math.sin(t * 3 + k)
        c.line([(fx - w, y), (fx + w, y)], (255, 190, 100, 120 - k * 12), 2.5, cap=False)
    merchant_ship(c, 1000 - t * 28, 560, t, 1.0)
    merchant_ship(c, 700 - t * 10, 520, t + 1, 0.6)


# ====================================================================== 4. Ρώμη – Κολοσσαίο
def colosseum(c, cx, base, R, t):
    stone = (226, 206, 164)
    levels = [(66, "tuscan"), (62, "ionic"), (62, "corinth")]
    n = 13
    ths = [math.radians(lerp(-80, 80, i / n)) for i in range(n + 1)]
    xs = [cx + R * math.sin(a) for a in ths]
    y = base
    curve = lambda x: 12 * (1 - ((x - cx) / R) ** 2)
    total = sum(h for h, _ in levels) + 50
    # κύριο σώμα (ελαφρά καμπύλη για αίσθηση ελλείψεως)
    top_pts = [(x, base - total - curve(x)) for x in xs]
    c.poly([(xs[0], base)] + top_pts + [(xs[-1], base)], fill=stone)
    for li, (h, order) in enumerate(levels):
        y0 = y
        for i in range(n):
            xa, xb = xs[i], xs[i + 1]
            bw = xb - xa
            f = 0.62 + 0.38 * math.cos((ths[i] + ths[i + 1]) / 2)
            c.poly([(xa, y0 - curve(xa)), (xb, y0 - curve(xb)), (xb, y0 - h - curve(xb)), (xa, y0 - h - curve(xa))],
                   fill=shade(stone, f))
            mx = (xa + xb) / 2
            ow = bw * 0.62 / 2
            sp = y0 - curve(mx) - h * 0.42
            c.rect(mx - ow, sp, mx + ow, y0 - curve(mx) - 2, fill=shade((92, 70, 52), f))
            c.pieslice(mx, sp, ow, ow * 1.05, 180, 360, fill=shade((92, 70, 52), f))
            c.arc(mx, sp, ow + 2, ow * 1.05 + 2, 180, 360, shade(stone, f * 0.8), 1.4)
            # ημικίονες ανάμεσα στα τόξα
            c.rect(xa - bw * 0.07, y0 - h - curve(xa) + 6, xa + bw * 0.07, y0 - curve(xa), fill=shade(stone, f * 1.06))
            c.rect(xa - bw * 0.1, y0 - h - curve(xa) + 4, xa + bw * 0.1, y0 - h - curve(xa) + 9,
                   fill=shade(stone, f * 0.92))
        # κορνίζα
        ptsb = [(x, y0 - h - curve(x)) for x in xs]
        c.line(ptsb, shade(stone, 0.8), 4, cap=False)
        y = y0 - h
    # attic: τοίχος με μικρά παράθυρα και φουρούσια
    for i in range(n):
        xa, xb = xs[i], xs[i + 1]
        mx = (xa + xb) / 2
        f = 0.62 + 0.38 * math.cos((ths[i] + ths[i + 1]) / 2)
        c.poly([(xa, y - curve(xa)), (xb, y - curve(xb)), (xb, y - 50 - curve(xb)), (xa, y - 50 - curve(xa))],
               fill=shade(stone, f))
        c.rect(xa - (xb - xa) * 0.06, y - 50 - curve(xa), xa + (xb - xa) * 0.06, y - curve(xa), fill=shade(stone, f * 1.06))
        if i % 2 == 0:
            c.rect(mx - (xb - xa) * 0.14, y - 30 - curve(mx), mx + (xb - xa) * 0.14, y - 20 - curve(mx),
                   fill=shade((92, 70, 52), f))
        c.rect(mx - 2, y - 46 - curve(mx), mx + 2, y - 42 - curve(mx), fill=shade(stone, 0.7))
    c.line([(x, y - 50 - curve(x)) for x in xs], shade(stone, 0.85), 5, cap=False)
    # ιστοί για το velarium (τέντα)
    for i in range(0, n + 1, 2):
        x = xs[i]
        c.line([(x, y - 50 - curve(x)), (x, y - 66 - curve(x))], (120, 90, 60), 1.5)


def spqr_standard(c, x, y, t):
    c.line([(x, y), (x, y - 180)], (110, 80, 40), 4)
    c.circle(x, y - 186, 7, fill=(220, 180, 70))
    c.line([(x - 34, y - 172), (x + 34, y - 172)], (200, 160, 60), 3)
    def band(c, xa, xb, ya, yb, h, u0, u1, light):
        c.poly([(xa, ya), (xb, yb), (xb, yb + h), (xa, ya + h)], fill=shade((170, 30, 30), light))
    flag_wave(c, x - 32, y - 170, 64, 76, t, band, amp=2, n=10)
    c.text(x, y - 132 + 2 * math.sin(t * 5 - 3.5), "SPQR", 17, (240, 200, 90), "serif_b", "mm")
    for k in range(5):
        xx = x - 32 + k * 16
        c.line([(xx, y - 94), (xx, y - 86)], (220, 180, 70), 2)


def draw_rome(c, t, T):
    cloud(c, 150 + t * 5, 170, 0.8)
    cloud(c, 700 + t * 3, 130, 1.0)
    hills(c, 420, 20, 900, (140, 150, 120), 1.0)
    # υδραγωγείο στο βάθος
    ac = (196, 180, 150)
    c.rect(0, 360, 880, 368, fill=ac)
    for k in range(22):
        x = k * 40
        c.rect(x, 368, x + 8, 430, fill=ac)
        c.rect(x, 368, x + 40, 380, fill=ac)
        c.pieslice(x + 24, 382, 16, 14, 180, 360, fill=(140, 150, 120))
    c.rect(0, 350, 880, 360, fill=shade(ac, 0.9))
    hills(c, 460, 8, 500, (120, 140, 90), 2.0)
    colosseum(c, 420, 540, 330, t)
    # δρόμος
    c.poly([(0, H), (0, 540), (880, 540), (880, H)], fill=(116, 136, 76))
    c.poly([(250, 540), (590, 540), (820, H), (20, H)], fill=(150, 140, 126))
    rnd = random.Random(3)
    for row in range(10):
        yy = 546 + row * 13
        wl = lerp(340, 800, (yy - 540) / 180)
        xl = lerp(250, 20, (yy - 540) / 180)
        k = 0
        x = xl + (row % 2) * 10
        while x < xl + wl - 10:
            bw = rnd.uniform(16, 26) * (0.6 + 0.4 * (yy - 540) / 180)
            c.rect(x + 1, yy, x + bw - 1, yy + 10, fill=shade((150, 140, 126), rnd.uniform(0.85, 1.1)), r=3)
            x += bw
    cypress(c, 70, 560, 170)
    cypress(c, 120, 556, 130)
    cypress(c, 800, 556, 150)
    spqr_standard(c, 730, 600, t)


# ====================================================================== 5. Βυζάντιο – Αγία Σοφία
def hagia_sophia(c, cx, base):
    """Αγία Σοφία (537) – βόρεια όψη: κεντρικός τρούλος, τύμπανο με παράθυρα, ημιθόλια, αντηρίδες."""
    wall, wdark, lead = (222, 170, 126), (180, 128, 90), (150, 156, 170)
    win = (90, 70, 70)

    def window(x, y, w, h):
        c.rect(x - w, y, x + w, y + h, fill=win)
        c.pieslice(x, y, w, w, 180, 360, fill=win)
    # χαμηλό σώμα (κλίτη & νάρθηκας)
    c.rect(cx - 280, base - 110, cx + 280, base, fill=wall)
    c.rect(cx - 280, base - 114, cx + 280, base - 108, fill=wdark)
    for k in range(-6, 7):
        window(cx + k * 42, base - 84, 8, 30)
        c.rect(cx + k * 42 - 6, base - 36, cx + k * 42 + 6, base - 14, fill=win)
    # εξωτερικές αντηρίδες
    for sx in (-1, 1):
        x = cx + sx * 262
        c.poly([(x - 18, base), (x - 18, base - 150), (x + 18, base - 170), (x + 18, base)], fill=wdark)
    # ημιθόλια (ανατολή – δύση)
    for sx in (-1, 1):
        x = cx + sx * 182
        c.rect(x - 58, base - 168, x + 58, base - 110, fill=wall)
        c.pieslice(x, base - 168, 62, 34, 180, 360, fill=lead)
        c.arc(x, base - 168, 62, 34, 180, 360, shade(lead, 0.8), 1.5)
        for k in range(5):
            window(x - 36 + k * 18, base - 154, 4, 18)
        for k in range(1, 5):
            aa = math.radians(180 + k * 36)
            c.line([(x, base - 168), (x + 62 * math.cos(aa), base - 168 + 34 * math.sin(aa))], shade(lead, 0.85), 1,
                   cap=False)
    # κεντρικός όγκος με το μεγάλο τόξο (τύμπανο) γεμάτο παράθυρα
    c.rect(cx - 125, base - 252, cx + 125, base - 110, fill=wall)
    c.arc(cx, base - 150, 104, 96, 180, 360, wdark, 5)
    for k in range(-3, 4):
        window(cx + k * 24, base - 222, 6, 26)
    for k in range(-2, 3):
        window(cx + k * 30, base - 180, 7, 28)
    for k in range(-5, 6):
        window(cx + k * 20, base - 136, 5, 18)
    for sx in (-1, 1):
        x = cx + sx * 125
        c.rect(x - 11, base - 268, x + 11, base - 110, fill=wdark)
        c.poly([(x - 13, base - 268), (x, base - 282), (x + 13, base - 268)], fill=lead)
    c.rect(cx - 125, base - 256, cx + 125, base - 250, fill=wdark)
    # τρούλος: τύμπανο με 40 παράθυρα (φαίνονται ~17) και ρηχός θόλος
    dy = base - 256
    c.rect(cx - 116, dy - 22, cx + 116, dy, fill=wall)
    for k in range(17):
        a = math.radians(lerp(-80, 80, k / 16))
        x = cx + 108 * math.sin(a)
        w = 4 * math.cos(a) + 0.5
        c.rect(x - w, dy - 18, x + w, dy - 5, fill=(70, 56, 60))
        c.rect(x + w + 0.5, dy - 20, x + w + 3 * math.cos(a) + 1, dy, fill=wdark)
    c.pieslice(cx, dy - 22, 120, 58, 180, 360, fill=lead)
    c.pieslice(cx + 30, dy - 22, 90, 50, 270, 360, fill=shade(lead, 0.88))
    for k in range(1, 12):
        a = math.radians(lerp(-80, 80, k / 12))
        pts = [(cx + 120 * math.sin(a) * math.cos(math.radians(p)), dy - 22 - 58 * math.sin(math.radians(p)))
               for p in range(0, 91, 10)]
        c.line(pts, shade(lead, 0.8), 1.2, cap=False)
    top = dy - 80
    c.rect(cx - 2, top - 26, cx + 2, top, fill=(230, 190, 90))
    c.rect(cx - 10, top - 20, cx + 10, top - 16, fill=(230, 190, 90))


def draw_byzantium(c, t, T):
    glow(c, 440, 330, 360, (255, 220, 140), 16, 0.5)
    cloud(c, 700 - t * 4, 150, 0.9, (255, 236, 200), (236, 200, 160))
    hills(c, 470, 10, 800, (150, 120, 110), 0.7)
    hagia_sophia(c, 430, 530)
    for k in range(6):
        cypress(c, 80 + k * 20 + (k % 2) * 7, 530, 80 + (k % 3) * 20, (40, 70, 44))
    for k in range(3):
        cypress(c, 760 + k * 24, 530, 90 + k * 12, (40, 70, 44))
    # Θεοδοσιανά τείχη
    wall = (170, 150, 120)
    c.rect(0, 530, W, 590, fill=wall)
    for k in range(0, 900, 16):
        c.rect(k, 522, k + 9, 530, fill=wall)
    for k in range(6):
        x = 40 + k * 160
        c.rect(x, 504, x + 50, 590, fill=shade(wall, 0.92))
        for j in range(4):
            c.rect(x + j * 14, 496, x + j * 14 + 8, 504, fill=shade(wall, 0.92))
        c.rect(x + 20, 520, x + 30, 540, fill=(60, 50, 40))
    for y in (548, 566):
        c.line([(0, y), (W, y)], (196, 120, 90), 3, cap=False)
    # Βόσπορος
    c.rect(0, 590, W, H, fill=(46, 90, 140))
    for i in range(20):
        x = (i * 73 + t * 12) % W
        c.line([(x, 604 + (i % 4) * 14), (x + 22, 604 + (i % 4) * 14)], (120, 170, 210), 1.4, cap=False)


# ====================================================================== 6. Μεσαίωνας – Κάστρο
def castle(c, cx, base, t):
    st, dk, roof = (170, 164, 152), (130, 124, 114), (160, 60, 50)
    def crenel(x0, x1, y, col, m=10, g=7):
        x = x0
        while x < x1 - 2:
            c.rect(x, y - 9, min(x + m, x1), y, fill=col)
            x += m + g
    def bricks(x0, x1, y0, y1, col):
        for i, y in enumerate(range(int(y0) + 10, int(y1), 10)):
            c.line([(x0, y), (x1, y)], shade(col, 0.9), 0.8, cap=False)
            for x in range(int(x0) + (i % 2) * 9, int(x1), 18):
                c.line([(x, y), (x, y - 10)], shade(col, 0.9), 0.8, cap=False)
    # κεντρικός πύργος (donjon)
    kx0, kx1, ky = cx - 64, cx + 64, base - 250
    c.rect(kx0, ky, kx1, base - 80, fill=st)
    c.rect(kx1 - 22, ky, kx1, base - 80, fill=dk)
    bricks(kx0, kx1, ky, base - 80, st)
    crenel(kx0 - 4, kx1 + 4, ky, st)
    for wy in (ky + 40, ky + 90):
        c.rect(cx - 6, wy, cx + 6, wy + 22, fill=(50, 40, 40))
        c.pieslice(cx, wy, 6, 6, 180, 360, fill=(50, 40, 40))
    # πυργίσκος και σημαία
    c.rect(kx1 - 30, ky - 50, kx1 - 4, ky, fill=st)
    c.poly([(kx1 - 34, ky - 50), (kx1 - 17, ky - 86), (kx1, ky - 50)], fill=roof)
    fx, fy = kx1 - 17, ky - 86
    c.line([(fx, fy), (fx, fy - 40)], (70, 50, 30), 2)
    def band(c, xa, xb, ya, yb, h, u0, u1, light):
        col = (30, 60, 150) if (u0 < 0.5) else (230, 190, 40)
        c.poly([(xa, ya), (xb, yb), (xb, yb + h), (xa, ya + h)], fill=shade(col, light))
    flag_wave(c, fx, fy - 40, 46, 26, t, band, amp=4, n=12)
    # τείχος
    wx0, wx1, wy = cx - 190, cx + 190, base - 110
    c.rect(wx0, wy, wx1, base, fill=st)
    bricks(wx0, wx1, wy, base, st)
    crenel(wx0, wx1, wy, st)
    # πύλη με καταρράκτη (portcullis)
    c.rect(cx - 26, base - 60, cx + 26, base, fill=(50, 40, 36))
    c.pieslice(cx, base - 60, 26, 26, 180, 360, fill=(50, 40, 36))
    for x in range(int(cx) - 22, int(cx) + 24, 9):
        c.line([(x, base - 80), (x, base - 16)], (110, 100, 90), 2, cap=False)
    for y in range(int(base) - 76, int(base) - 16, 10):
        c.line([(cx - 24, y), (cx + 24, y)], (110, 100, 90), 2, cap=False)
    c.arc(cx, base - 60, 30, 30, 180, 360, dk, 4)
    # στρογγυλοί πύργοι με κωνικές στέγες
    for tx in (wx0, wx1):
        c.rect(tx - 34, base - 170, tx + 34, base, fill=st)
        c.rect(tx + 10, base - 170, tx + 34, base, fill=dk)
        bricks(tx - 34, tx + 34, base - 170, base, st)
        c.rect(tx - 38, base - 176, tx + 38, base - 168, fill=dk)
        c.poly([(tx - 42, base - 176), (tx, base - 262), (tx + 42, base - 176)], fill=roof)
        c.poly([(tx, base - 262), (tx + 42, base - 176), (tx + 14, base - 176)], fill=shade(roof, 0.8))
        for sy in (base - 140, base - 90):
            c.rect(tx - 2, sy, tx + 2, sy + 18, fill=(40, 30, 30))


def windmill(c, x, y, t):
    c.poly([(x - 30, y), (x - 10, y - 40), (x + 10, y - 40), (x + 30, y)], fill=(110, 80, 50))
    c.rect(x - 24, y - 110, x + 24, y - 40, fill=(170, 120, 70))
    c.rect(x + 8, y - 110, x + 24, y - 40, fill=(140, 96, 56))
    c.poly([(x - 28, y - 110), (x, y - 132), (x + 28, y - 110)], fill=(120, 70, 40))
    c.rect(x - 6, y - 78, x + 6, y - 60, fill=(80, 50, 30))
    hx, hy = x - 20, y - 100
    a = t * 1.2
    for k in range(4):
        th = a + k * math.pi / 2
        ux, uy = math.cos(th), math.sin(th)
        nx, ny = -uy, ux
        c.line([(hx, hy), (hx + ux * 90, hy + uy * 90)], (90, 60, 30), 3)
        p = [(hx + ux * 18, hy + uy * 18), (hx + ux * 88, hy + uy * 88),
             (hx + ux * 88 + nx * 18, hy + uy * 88 + ny * 18), (hx + ux * 18 + nx * 18, hy + uy * 18 + ny * 18)]
        c.poly(p, fill=(236, 226, 206), outline=(120, 90, 60), width=1)
        for j in range(1, 7):
            s = 18 + j * 10
            c.line([(hx + ux * s, hy + uy * s), (hx + ux * s + nx * 18, hy + uy * s + ny * 18)], (150, 120, 90), 0.8,
                   cap=False)
    c.circle(hx, hy, 5, fill=(70, 50, 30))


def draw_medieval(c, t, T):
    cloud(c, 120 + t * 6, 150, 0.9)
    cloud(c, 640 + t * 4, 120, 0.7)
    hills(c, 400, 20, 700, (120, 150, 110), 0.2)
    # καθεδρικός στο βάθος
    cc = (140, 150, 160)
    c.rect(630, 330, 720, 420, fill=cc)
    for x in (630, 700):
        c.rect(x, 300, x + 20, 420, fill=cc)
        c.poly([(x, 300), (x + 10, 250), (x + 20, 300)], fill=cc)
    c.circle(675, 360, 12, fill=(110, 120, 130))
    hills(c, 470, 26, 900, (98, 150, 80), 1.6)
    # λόφος του κάστρου
    c.poly([(80, 600), (150, 500), (220, 470), (500, 466), (590, 490), (660, 600)], fill=(90, 130, 70))
    castle(c, 360, 480, t)
    # χωράφια
    for k in range(6):
        col = [(180, 170, 90), (120, 160, 80), (160, 140, 80)][k % 3]
        x = 560 + k * 60
        c.poly([(x, 540), (x + 60, 540), (x + 90, 600), (x + 20, 600)], fill=col)
    windmill(c, 760, 540, t)
    c.rect(0, 596, W, H, fill=(84, 124, 64))
    for k in range(2):
        bird(c, (100 + k * 50 + t * 40) % 860, 200 + k * 22, 1, t + k)


# ====================================================================== 7. Αναγέννηση – Φλωρεντία
def duomo(c, cx, base):
    white, green, pink = (240, 234, 220), (70, 120, 90), (220, 170, 160)
    terr, rib = (190, 84, 56), (246, 240, 228)
    # ναός (πλάγια όψη) με πολύχρωμα μάρμαρα
    c.rect(cx - 240, base - 110, cx + 180, base, fill=white)
    for k in range(-12, 9):
        x = cx + k * 20
        c.rect(x + 3, base - 96, x + 17, base - 14, outline=green, width=2)
        c.rect(x + 7, base - 84, x + 13, base - 54, fill=(70, 70, 80))
        c.pieslice(x + 10, base - 84, 3, 3, 180, 360, fill=(70, 70, 80))
    c.rect(cx - 240, base - 116, cx + 180, base - 108, fill=green)
    c.poly([(cx - 244, base - 116), (cx - 230, base - 134), (cx + 170, base - 134), (cx + 184, base - 116)],
           fill=terr)
    # οκταγωνικό τύμπανο με οφθαλμούς (στρογγυλά παράθυρα)
    c.poly([(cx - 110, base - 110), (cx - 100, base - 200), (cx + 100, base - 200), (cx + 110, base - 110)],
           fill=white)
    for k, (x0, x1) in enumerate(((-100, -40), (-40, 40), (40, 100))):
        f = (0.92, 1.0, 0.86)[k]
        c.rect(cx + x0, base - 200, cx + x1, base - 110, fill=shade(white, f), outline=green, width=2)
        c.circle(cx + (x0 + x1) / 2, base - 158, 11, fill=(70, 70, 80), outline=green, width=3)
    c.rect(cx - 104, base - 208, cx + 104, base - 200, fill=green)
    # ο τρούλος του Μπρουνελέσκι – οξυκόρυφος, με 8 λευκές νευρώσεις
    b = base - 208
    top = b - 150
    L = qbez((cx - 104, b), (cx - 100, top + 20), (cx - 18, top), 20)
    Rr = qbez((cx + 18, top), (cx + 100, top + 20), (cx + 104, b), 20)
    c.poly(L + Rr, fill=terr)
    c.poly(qbez((cx + 40, b), (cx + 40, top + 30), (cx + 18, top), 12) + Rr, fill=shade(terr, 0.82))
    for f in (-1, -0.42, 0.42, 1):
        pts = qbez((cx + 104 * f, b), (cx + 100 * f, top + 20), (cx + 18 * f, top), 20)
        c.line(pts, rib, 4 if abs(f) < 1 else 3)
    c.line(qbez((cx, b), (cx, top + 20), (cx, top), 10), rib, 4)
    # φανός (lantern)
    c.rect(cx - 22, top - 6, cx + 22, top + 2, fill=rib)
    c.rect(cx - 16, top - 40, cx + 16, top - 6, fill=rib)
    for k in (-10, 0, 10):
        c.rect(cx + k - 2.5, top - 36, cx + k + 2.5, top - 10, fill=(80, 80, 90))
    c.poly([(cx - 18, top - 40), (cx, top - 70), (cx + 18, top - 40)], fill=rib)
    c.circle(cx, top - 74, 5, fill=(230, 190, 70))
    c.line([(cx, top - 79), (cx, top - 90)], (230, 190, 70), 2)
    c.line([(cx - 4, top - 86), (cx + 4, top - 86)], (230, 190, 70), 2)


def campanile(c, x, base, top):
    white, green, pink = (240, 234, 220), (70, 120, 90), (216, 160, 150)
    w = 56
    c.rect(x, top, x + w, base, fill=white)
    c.rect(x + w - 12, top, x + w, base, fill=(214, 206, 190))
    sec = (base - top) / 5
    for k in range(5):
        y0 = top + k * sec
        c.rect(x, y0, x + w, y0 + 5, fill=green)
        c.rect(x + 6, y0 + 10, x + w - 6, y0 + sec - 6, outline=pink, width=2)
        if k < 3:
            c.rect(x + 20, y0 + 18, x + 36, y0 + sec - 14, fill=(80, 80, 90))
            c.pieslice(x + 28, y0 + 18, 8, 8, 180, 360, fill=(80, 80, 90))
            c.line([(x + 28, y0 + 14), (x + 28, y0 + sec - 14)], white, 2, cap=False)
    c.rect(x - 4, top - 10, x + w + 4, top, fill=white)
    for k in range(7):
        c.rect(x - 4 + k * 9, top - 16, x + 2 + k * 9, top - 10, fill=white)


def house(c, x, y, w, h, col, t=0):
    c.rect(x, y - h, x + w, y, fill=col)
    c.poly([(x - 5, y - h), (x + w / 2, y - h - w * 0.28), (x + w + 5, y - h)], fill=(176, 80, 50))
    for i in range(int(w // 22)):
        for j in range(int(h // 26)):
            wx, wy = x + 8 + i * 22, y - h + 8 + j * 26
            if wx + 10 < x + w:
                c.rect(wx, wy, wx + 9, wy + 14, fill=(80, 60, 50))
                c.rect(wx - 2, wy, wx, wy + 14, fill=(80, 120, 80))


def draw_renaissance(c, t, T):
    cloud(c, 700 + t * 3, 150, 0.8, (255, 248, 236), (240, 220, 200))
    hills(c, 420, 30, 800, (130, 150, 110), 0.4)
    for k in range(5):
        cypress(c, 40 + k * 190, 430, 60 + (k % 2) * 20, (60, 90, 60))
    campanile(c, 90, 520, 180)
    duomo(c, 480, 520)
    cols = [(230, 196, 140), (220, 170, 110), (236, 210, 160), (210, 160, 120), (226, 186, 130)]
    x = 0
    k = 0
    while x < 900:
        w = 60 + (k * 37) % 50
        house(c, x, 600, w, 56 + (k * 23) % 40, cols[k % 5])
        x += w + 6
        k += 1
    c.rect(0, 596, W, H, fill=(150, 130, 100))
    cypress(c, 20, 610, 140)
    cypress(c, 850, 610, 120)


# ====================================================================== 8. Ανακαλύψεις – Καραβέλα
def carrack(c, x, y, t, s=1.0):
    y += math.sin(t * 1.5) * 3 * s
    tilt = math.sin(t * 1.5 + 0.8) * 0.03
    hull_c, trim = (110, 64, 34), (210, 170, 80)
    def R(ps):
        return rot(ps, x, y, tilt)
    def P(dx, dy):
        return (x + dx * s, y + dy * s)
    # κύτος με ψηλό πρυμναίο και πρωραίο κάστρο
    hull = [P(-120, -58), P(-96, -58), P(-90, -30), P(70, -30), P(84, -46), P(118, -48)] + \
        qbez(P(118, -48), P(100, 10), P(40, 18)) + qbez(P(40, 18), P(-60, 22), P(-112, 0))
    c.poly(R(hull), fill=hull_c, outline=(60, 34, 16), width=1.5)
    c.poly(R([P(-120, -58), P(-96, -58), P(-92, -40), P(-116, -40)]), fill=shade(hull_c, 1.2))
    for yy in (-22, -10, 2):
        c.line(R(qbez(P(-114, yy - 4), P(0, yy + 8), P(110, yy - 16))), trim, 2 * s, cap=False)
    for k in range(6):
        c.rect(*R([P(-60 + k * 22, -22)])[0], *R([P(-54 + k * 22, -16)])[0], fill=(40, 24, 12))
    # κατάρτια
    masts = [(-80, 120), (-10, 160), (60, 130)]
    for mx, mh in masts:
        c.line(R([P(mx, -30), P(mx, -30 - mh)]), (80, 50, 25), 3 * s)
    # ξάρτια
    for mx, mh in masts:
        for dx in (-30, 30):
            c.line(R([P(mx, -30 - mh * 0.95), P(mx + dx, -32)]), (70, 50, 30, 200), 0.8 * s, cap=False)
    c.line(R([P(60, -30 - 130), P(130, -50)]), (70, 50, 30), 1 * s, cap=False)
    # λατίνι στο πρυμναίο κατάρτι
    c.poly(R([P(-80, -150), P(-80, -40), P(-130, -44)]), fill=(240, 232, 212), outline=(170, 150, 120), width=1)
    c.line(R([P(-40, -165), P(-134, -40)]), (80, 50, 25), 2 * s)
    # τετράγωνα πανιά με φούσκωμα και σταυρό
    bil = 8 + 3 * math.sin(t * 1.2)
    for mx, mh, sw, sh, cross in ((-10, 160, 58, 84, True), (60, 130, 44, 64, True), (-10, 160, 40, 30, False)):
        top = -30 - mh + (8 if cross else 0)
        if not cross:
            top = -30 - mh - 4
            sh = 26
        yT, yB = top, top + sh
        sail = [P(mx - sw, yT)] + qbez(P(mx - sw, yT), P(mx + bil * 0.3, yT - 3), P(mx + sw, yT))[1:] + \
            qbez(P(mx + sw, yT), P(mx + sw + bil, (yT + yB) / 2), P(mx + sw - 4, yB))[1:] + \
            qbez(P(mx + sw - 4, yB), P(mx, yB + bil), P(mx - sw + 4, yB))[1:] + \
            qbez(P(mx - sw + 4, yB), P(mx - sw + bil * 0.6, (yT + yB) / 2), P(mx - sw, yT))[1:]
        c.poly(R(sail), fill=(242, 234, 214), outline=(170, 150, 120), width=1)
        c.line(R([P(mx - sw - 4, yT), P(mx + sw + 4, yT)]), (80, 50, 25), 2.2 * s)
        if cross:
            cx_, cy_ = mx + bil * 0.4, (yT + yB) / 2
            cw = sw * 0.26
            c.poly(R([P(cx_ - cw * 0.35, cy_ - sh * 0.36), P(cx_ + cw * 0.35, cy_ - sh * 0.36),
                      P(cx_ + cw * 0.35, cy_ + sh * 0.36), P(cx_ - cw * 0.35, cy_ + sh * 0.36)]), fill=(190, 30, 30))
            c.poly(R([P(cx_ - sw * 0.5, cy_ - cw * 0.35), P(cx_ + sw * 0.5, cy_ - cw * 0.35),
                      P(cx_ + sw * 0.5, cy_ + cw * 0.35), P(cx_ - sw * 0.5, cy_ + cw * 0.35)]), fill=(190, 30, 30))
    # σημαίες
    for mx, mh in masts:
        def band(c, xa, xb, ya, yb, h, u0, u1, light):
            c.poly([(xa, ya), (xb, yb), (xb, yb + h), (xa, ya + h)], fill=shade((200, 40, 40), light))
        fx, fy = R([P(mx, -30 - mh)])[0]
        flag_wave(c, fx, fy - 2, 22 * s, 8 * s, t, band, amp=2, n=6)


def draw_discovery(c, t, T):
    glow(c, 180, 130, 160, (255, 250, 220), 12, 0.5)
    c.circle(180, 130, 30, fill=(255, 250, 225))
    cloud(c, 520 + t * 5, 150, 0.9)
    cloud(c, 800 + t * 3, 220, 0.6)
    # νησί του Νέου Κόσμου στον ορίζοντα
    c.poly([(700, 420)] + qbez((700, 420), (790, 380), (900, 420)), fill=(90, 130, 90))
    for px in (760, 790):
        c.line([(px, 404), (px + 4, 378)], (80, 60, 40), 2)
        for k in range(5):
            a = -math.pi / 2 + (k - 2) * 0.6
            c.line([(px + 4, 378), (px + 4 + 14 * math.cos(a), 378 + 14 * math.sin(a) + 6)], (40, 100, 50), 2)
    layers = [((40, 110, 170), 420, 3, 160, 0.8), ((34, 96, 156), 460, 5, 220, 1.0),
              ((28, 84, 140), 520, 7, 260, 1.2)]
    for i, (col, y0, amp, wl, sp) in enumerate(layers[:2]):
        c.poly(waves_poly(y0, t, amp, wl, sp, phase=i), fill=col)
    carrack(c, 60 + t * 36, 500, t, 1.15)
    col, y0, amp, wl, sp = layers[2]
    c.poly(waves_poly(y0 + 30, t, amp, wl, sp, phase=2), fill=col)
    for i in range(26):
        x = (i * 53 + t * 20) % W
        y = 470 + (i % 7) * 34
        c.line([(x, y), (x + 14, y - 2), (x + 26, y)], (200, 230, 250, 160), 1.5, cap=False)
    for k in range(3):
        bird(c, (300 + k * 70 + t * 22) % 880, 200 + k * 26, 1.1, t * 1.2 + k, (250, 250, 250))


# ====================================================================== 9. Επιστημονική επανάσταση
def draw_science(c, t, T):
    stars(c, t, 200, seed=4, ymax=520)
    # Γαλαξίας
    rnd = random.Random(17)
    for _ in range(700):
        x = rnd.uniform(0, 900)
        y = 480 - x * 0.45 + rnd.gauss(0, 26)
        c.circle(x, y, rnd.uniform(0.5, 1.1), fill=(210, 200, 255, rnd.randint(40, 150)))
    # ηλιοκεντρικό σύστημα (Κοπέρνικος)
    sx, sy = 300, 300
    glow(c, sx, sy, 80, (255, 200, 90), 12, 0.7)
    c.circle(sx, sy, 22, fill=(255, 214, 110))
    c.circle(sx, sy, 15, fill=(255, 240, 180))
    planets = [(52, 0.24, 4, (190, 170, 160)), (78, 0.62, 6, (230, 200, 140)), (108, 1.0, 6.5, (80, 140, 220)),
               (140, 1.88, 5, (210, 100, 70)), (190, 11.9, 12, (220, 180, 130)), (240, 29.5, 10, (230, 210, 150))]
    for R, per, r, col in planets:
        c.ellipse(sx, sy, R, R * 0.36, outline=(200, 200, 255, 80), width=1)
    for i, (R, per, r, col) in enumerate(planets):
        a = t * 2 * math.pi / (per * 3.2) + i * 1.3
        px, py = sx + R * math.cos(a), sy + R * 0.36 * math.sin(a)
        if i == 5:
            c.ellipse(px, py, r * 2.1, r * 0.6, outline=(230, 210, 170), width=2)
        c.circle(px, py, r, fill=col)
        if i == 2:
            ma = t * 3
            c.circle(px + 11 * math.cos(ma), py + 5 * math.sin(ma), 2, fill=(220, 220, 220))
    # σελήνη με κρατήρες (όπως τους είδε ο Γαλιλαίος)
    c.circle(770, 150, 44, fill=(236, 232, 214))
    for dx, dy, r in ((-12, -10, 8), (14, 8, 10), (-4, 18, 6), (18, -16, 5), (-22, 10, 4)):
        c.circle(770 + dx, 150 + dy, r, fill=(206, 200, 184))
    # λόφος, μηλιά του Νεύτωνα, αστρονόμος με τηλεσκόπιο
    c.poly([(380, H), (380, 600)] + qbez((380, 600), (620, 470), (900, 520)) + [(900, H)], fill=(24, 34, 44))
    tx, ty = 560, 535
    c.poly([(tx - 8, ty + 10), (tx - 5, ty - 60), (tx + 5, ty - 60), (tx + 8, ty + 10)], fill=(50, 40, 34))
    for dx, dy, r in ((-36, -80, 30), (0, -104, 36), (38, -80, 30), (0, -70, 30), (-20, -110, 22), (24, -112, 22)):
        c.circle(tx + dx, ty + dy, r, fill=(34, 64, 44))
    for dx, dy in ((-30, -86), (16, -118), (34, -70), (-6, -62), (-18, -110)):
        c.circle(tx + dx, ty + dy, 4, fill=(190, 40, 40))
    ph = (t % 4.0) / 4.0
    ay = ty - 70 + (ease_in(clamp(ph / 0.35)) * 96 if ph < 0.35 else 96)
    c.circle(tx + 20, ay, 5, fill=(210, 50, 40))
    c.line([(tx + 20, ay - 5), (tx + 22, ay - 9)], (60, 40, 20), 1.2)
    # αστρονόμος
    ox, oy = 740, 508
    col = (14, 18, 26)
    c.poly([(ox - 14, oy), (ox - 9, oy - 44), (ox + 9, oy - 44), (ox + 16, oy)], fill=col)
    c.circle(ox + 2, oy - 52, 8, fill=col)
    c.line([(ox + 4, oy - 38), (ox + 22, oy - 52)], col, 5)
    c.line([(ox + 10, oy - 46), (ox + 56, oy - 90)], (120, 80, 40), 6)
    c.line([(ox + 30, oy - 64), (ox + 18, oy), (ox + 30, oy - 64), (ox + 42, oy)], (70, 50, 30), 2)


# ====================================================================== 10. Διαφωτισμός & Επαναστάσεις
def pantheon_paris(c, cx, base):
    st, dk = (236, 226, 204), (196, 184, 160)
    # τρούλος με κιονοστοιχία
    c.rect(cx - 170, base - 200, cx + 170, base, fill=dk)
    c.rect(cx - 84, base - 256, cx + 84, base - 196, fill=shade(st, 0.93))
    c.rect(cx - 88, base - 260, cx + 88, base - 252, fill=st)
    c.rect(cx - 70, base - 330, cx + 70, base - 250, fill=st)
    for k in range(-6, 7):
        x = cx + k * 11
        c.rect(x - 2.5, base - 326, x + 2.5, base - 254, fill=dk if k > 2 else shade(st, 1.02))
    c.rect(cx - 76, base - 338, cx + 76, base - 326, fill=st)
    c.rect(cx - 56, base - 360, cx + 56, base - 338, fill=shade(st, 0.95))
    c.pieslice(cx, base - 360, 58, 58, 180, 360, fill=(150, 160, 170))
    for f in (-0.6, -0.2, 0.2, 0.6):
        c.line(qbez((cx + 58 * f, base - 360), (cx + 58 * f, base - 405), (cx, base - 416)), (180, 190, 200), 1.5,
               cap=False)
    c.rect(cx - 8, base - 442, cx + 8, base - 416, fill=st)
    c.pieslice(cx, base - 442, 9, 12, 180, 360, fill=(150, 160, 170))
    c.line([(cx, base - 454), (cx, base - 464)], (200, 170, 80), 2)
    # πρόναος με 6 κορινθιακούς κίονες και αέτωμα
    c.rect(cx - 150, base - 14, cx + 150, base, fill=dk)
    c.rect(cx - 144, base - 24, cx + 144, base - 14, fill=st)
    for k in range(6):
        x = cx - 115 + k * 46
        c.rect(x - 9, base - 160, x + 9, base - 24, fill=st)
        c.rect(x + 3, base - 160, x + 9, base - 24, fill=dk)
        for f in (-5, 0, 5):
            c.line([(x + f, base - 158), (x + f, base - 26)], shade(st, 0.88), 0.8, cap=False)
        c.poly([(x - 9, base - 160), (x - 13, base - 176), (x + 13, base - 176), (x + 9, base - 160)],
               fill=(222, 208, 176))
        for j in range(3):
            c.circle(x - 8 + j * 8, base - 170, 3, fill=(200, 184, 150))
    c.rect(cx - 140, base - 196, cx + 140, base - 176, fill=st, outline=dk, width=1)
    c.poly([(cx - 146, base - 196), (cx, base - 244), (cx + 146, base - 196)], fill=st, outline=dk, width=1.5)
    c.poly([(cx - 120, base - 200), (cx, base - 236), (cx + 120, base - 200)], fill=(222, 210, 186))
    for k in range(-5, 6):
        h = 30 - abs(k) * 5
        if h > 4:
            c.rect(cx + k * 16 - 3, base - 200 - h, cx + k * 16 + 3, base - 200, fill=(196, 180, 150))
    c.rect(cx - 100, base - 192, cx + 100, base - 180, fill=(222, 210, 186))
    c.text(cx, base - 186, "AUX GRANDS HOMMES", 8, (120, 100, 70), "serif_b", "mm")


def draw_revolution(c, t, T):
    cloud(c, 620 + t * 4, 160, 1.0, (255, 236, 220), (220, 190, 180))
    cloud(c, 200 + t * 6, 150, 0.6, (255, 236, 220), (220, 190, 180))
    hills(c, 520, 6, 400, (110, 110, 110), 0.3)
    pantheon_paris(c, 430, 560)
    c.rect(0, 560, W, H, fill=(150, 140, 120))
    for k in range(0, 900, 36):
        c.line([(k, 560), (k - 60, H)], (130, 120, 100), 1, cap=False)
    # σημαίες: ΗΠΑ 1776 (13 αστέρια σε κύκλο) και Γαλλία 1789
    def usa(c, xa, xb, ya, yb, h, u0, u1, light):
        for k in range(13):
            col = (190, 30, 40) if k % 2 == 0 else (245, 245, 245)
            y0a, y0b = ya + h * k / 13, yb + h * k / 13
            c.poly([(xa, y0a), (xb, y0b), (xb, y0b + h / 13 + 0.5), (xa, y0a + h / 13 + 0.5)], fill=shade(col, light))
        if u1 <= 0.41:
            c.poly([(xa, ya), (xb, yb), (xb, yb + h * 7 / 13), (xa, ya + h * 7 / 13)], fill=shade((40, 50, 120), light))
    def fra(c, xa, xb, ya, yb, h, u0, u1, light):
        col = (30, 60, 150) if u0 < 1 / 3 - 1e-6 else ((245, 245, 245) if u0 < 2 / 3 - 1e-6 else (210, 40, 50))
        c.poly([(xa, ya), (xb, yb), (xb, yb + h), (xa, ya + h)], fill=shade(col, light))
    for x, fn, lab in ((110, usa, "1776"), (740, fra, "1789")):
        c.line([(x, 600), (x, 330)], (120, 100, 70), 4)
        c.circle(x, 326, 5, fill=(220, 180, 70))
        flag_wave(c, x + 2, 336, 110, 66, t, fn, amp=6, n=22)
        if fn is usa:
            w = 110 * 0.41
            for k in range(13):
                a = k / 13 * 2 * math.pi
                u = (w * 0.5 + 12 * math.cos(a)) / 110
                d = 6 * u * math.sin(t * 5 - u * 7)
                c.circle(x + 2 + w * 0.5 + 12 * math.cos(a), 336 + 17.8 + 12 * math.sin(a) + d, 1.8, fill=(255, 255, 255))
        c.text(x + 56, 430, lab, 20, (60, 40, 30), "serif_b", "mm")


# ====================================================================== 11. Βιομηχανική επανάσταση
def locomotive(c, x, y, t, speed):
    """Ατμάμαξα του 19ου αι. με σωστή κίνηση διωστήρων. y = ύψος σιδηροτροχιάς."""
    body, dark, brass, red = (40, 70, 50), (24, 24, 28), (210, 170, 70), (170, 40, 30)
    wheel_a = -x / 30.0
    # τέντερ (κάρβουνο)
    c.rect(x - 150, y - 70, x - 70, y - 20, fill=body)
    c.poly([(x - 146, y - 70), (x - 130, y - 84), (x - 90, y - 86), (x - 74, y - 70)], fill=(30, 30, 30))
    c.rect(x - 150, y - 24, x - 70, y - 18, fill=dark)
    for wx in (x - 130, x - 90):
        _wheel(c, wx, y - 14, 14, wheel_a * 30 / 14, dark)
    # καμπίνα
    c.rect(x - 64, y - 110, x - 10, y - 30, fill=body)
    c.rect(x - 70, y - 118, x - 4, y - 108, fill=dark)
    c.rect(x - 54, y - 100, x - 26, y - 76, fill=(230, 210, 150))
    # λέβητας
    c.rect(x - 10, y - 90, x + 120, y - 44, fill=body, r=6)
    for bx in (20, 60, 100):
        c.rect(x + bx - 2, y - 90, x + bx + 2, y - 44, fill=brass)
    c.rect(x + 110, y - 94, x + 132, y - 40, fill=dark)
    c.circle(x + 134, y - 66, 6, fill=(255, 240, 180))
    c.pieslice(x + 50, y - 90, 12, 16, 180, 360, fill=brass)
    # καμινάδα με διχαλωτή κορυφή
    c.poly([(x + 110, y - 94), (x + 106, y - 144), (x + 128, y - 144), (x + 124, y - 94)], fill=dark)
    c.poly([(x + 100, y - 144), (x + 134, y - 144), (x + 128, y - 152), (x + 106, y - 152)], fill=dark)
    c.rect(x - 14, y - 44, x + 140, y - 36, fill=red)
    # κύλινδρος
    c.rect(x + 96, y - 42, x + 138, y - 24, fill=dark)
    # τροχοί: 1 κινητήριος μεγάλος + 2 μικροί
    big = (x + 30, y - 32, 32)
    _wheel(c, big[0], big[1], big[2], wheel_a * 30 / 32, (20, 20, 24), red)
    _wheel(c, x - 30, y - 18, 18, wheel_a * 30 / 18, (20, 20, 24), red)
    _wheel(c, x + 110, y - 18, 18, wheel_a * 30 / 18, (20, 20, 24), red)
    # διωστήρας: από το έμβολο στον στρόφαλο
    ang = wheel_a * 30 / 32
    pin = (big[0] + 20 * math.cos(ang), big[1] + 20 * math.sin(ang))
    cross = (x + 96 - 8 + 20 * math.cos(ang) * 0.3, y - 33)
    c.line([pin, cross], (200, 200, 210), 4)
    c.line([cross, (x + 100, y - 33)], (200, 200, 210), 3)
    c.circle(pin[0], pin[1], 4, fill=brass)
    # εμπρόσθιος προφυλακτήρας
    c.poly([(x + 140, y - 36), (x + 160, y - 4), (x + 140, y - 4)], fill=red)


def _wheel(c, x, y, r, a, col, hub=(150, 40, 30)):
    c.circle(x, y, r, fill=col)
    c.circle(x, y, r - 3.5, fill=(60, 60, 64))
    n = 10 if r > 20 else 7
    for k in range(n):
        th = a + k * 2 * math.pi / n
        c.line([(x, y), (x + (r - 3) * math.cos(th), y + (r - 3) * math.sin(th))], col, 2.4, cap=False)
    c.circle(x, y, r * 0.22 + 2, fill=hub)


def factory(c, x, base, w, h, col):
    c.rect(x, base - h, x + w, base, fill=col)
    n = int(w // 34)
    for k in range(n):
        xx = x + k * (w / n)
        c.poly([(xx, base - h), (xx + w / n * 0.7, base - h - 20), (xx + w / n * 0.7, base - h)], fill=shade(col, 0.8))
        c.poly([(xx + w / n * 0.7, base - h - 20), (xx + w / n, base - h), (xx + w / n * 0.7, base - h)],
               fill=(150, 170, 180))
    for k in range(int(w // 22)):
        for j in range(int((h - 20) // 30)):
            c.rect(x + 8 + k * 22, base - h + 14 + j * 30, x + 20 + k * 22, base - h + 32 + j * 30,
                   fill=(250, 200, 110))


def smoke(c, x, y, t, n=7, col=(90, 86, 84), drift=18):
    for k in range(n):
        u = ((t * 0.35 + k / n) % 1.0)
        a = 1 - u
        c.circle(x + u * drift * 5 + math.sin(u * 6 + k) * 6, y - u * 160, 10 + u * 34, fill=alpha(col, 0.75 * a))


def draw_industry(c, t, T):
    glow(c, 640, 320, 220, (255, 170, 90), 12, 0.35)
    for x, h, col in ((20, 90, (120, 70, 50)), (300, 120, (140, 80, 56)), (590, 100, (120, 70, 50))):
        factory(c, x, 470, 260, h, col)
    for cx_, top in ((120, 250), (240, 280), (420, 230), (560, 260), (700, 250), (820, 290)):
        c.poly([(cx_ - 12, 470), (cx_ - 8, top), (cx_ + 8, top), (cx_ + 12, 470)], fill=(110, 56, 40))
        c.rect(cx_ - 10, top - 6, cx_ + 10, top, fill=(70, 36, 26))
        for yy in range(int(top) + 20, 470, 20):
            c.line([(cx_ - 10, yy), (cx_ + 10, yy)], (90, 46, 32), 1, cap=False)
        smoke(c, cx_, top - 6, t + cx_ * 0.01)
    c.rect(0, 470, W, 560, fill=(110, 96, 80))
    for k in range(0, W, 60):
        c.rect(k, 486, k + 40, 500, fill=(126, 110, 92))
    # σιδηροδρομική γραμμή
    c.rect(0, 560, W, H, fill=(90, 80, 70))
    for k in range(0, W + 20, 22):
        c.rect(k, 572, k + 12, 584, fill=(90, 60, 40))
    c.rect(0, 568, W, 572, fill=(170, 170, 176))
    # τρένο με βαγόνι
    x = -220 + t * 88
    for k in range(2):
        wx = x - 260 - k * 120
        c.rect(wx - 50, 516, wx + 50, 558, fill=(120, 40, 40))
        c.rect(wx - 54, 510, wx + 54, 518, fill=(40, 30, 30))
        for j in range(3):
            c.rect(wx - 42 + j * 30, 524, wx - 22 + j * 30, 540, fill=(240, 220, 160))
        _wheel(c, wx - 30, 556, 12, -wx / 12, (20, 20, 24))
        _wheel(c, wx + 30, 556, 12, -wx / 12, (20, 20, 24))
    locomotive(c, x, 570, t, 88)
    for k in range(8):
        u = ((t * 1.2 + k / 8) % 1.0)
        px = x + 118 - u * 160
        c.circle(px, 420 - u * 60 + 10 * math.sin(k), 10 + u * 26, fill=(230, 230, 236, int(200 * (1 - u))))


# ====================================================================== 12. 20ός αιώνας
def skyscraper(c, x, base, w, h, col, t, crown=None):
    c.rect(x, base - h, x + w, base, fill=col)
    c.rect(x + w * 0.7, base - h, x + w, base, fill=shade(col, 0.85))
    rnd = random.Random(int(x))
    for j in range(int(h // 14) - 1):
        for i in range(int(w // 10)):
            if rnd.random() < 0.6:
                c.rect(x + 3 + i * 10, base - h + 8 + j * 14, x + 8 + i * 10, base - h + 16 + j * 14,
                       fill=(250, 226, 150) if rnd.random() < 0.3 else shade(col, 0.7))
    if crown == "empire":
        c.rect(x + w * 0.15, base - h - 40, x + w * 0.85, base - h, fill=col)
        c.rect(x + w * 0.3, base - h - 72, x + w * 0.7, base - h - 40, fill=col)
        c.rect(x + w * 0.42, base - h - 100, x + w * 0.58, base - h - 72, fill=shade(col, 1.1))
        c.line([(x + w / 2, base - h - 100), (x + w / 2, base - h - 150)], (200, 200, 210), 2)
    elif crown == "chrysler":
        cx = x + w / 2
        for k in range(6):
            r = w * 0.5 - k * 5
            c.pieslice(cx, base - h - k * 12, r, 22, 180, 360, fill=(210, 210, 220) if k % 2 == 0 else (170, 170, 180))
            for j in range(-2, 3):
                c.poly([(cx + j * r * 0.35 - 3, base - h - k * 12 - 4), (cx + j * r * 0.35, base - h - k * 12 - 14),
                        (cx + j * r * 0.35 + 3, base - h - k * 12 - 4)], fill=(60, 60, 70))
        c.poly([(cx - 3, base - h - 70), (cx, base - h - 130), (cx + 3, base - h - 70)], fill=(210, 210, 220))


def eiffel(c, x, base, h, col=(120, 90, 70)):
    top = base - h
    L = [(x - h * 0.28, base), (x - h * 0.13, base - h * 0.28), (x - h * 0.06, base - h * 0.6), (x - 3, top + 20)]
    Rr = [(2 * x - px, py) for px, py in L]
    c.line(L, col, 5)
    c.line(Rr, col, 5)
    c.line([(x, top + 20), (x, top)], col, 2)
    for yy, ww in ((base - h * 0.28, h * 0.15), (base - h * 0.6, h * 0.07)):
        c.rect(x - ww, yy - 4, x + ww, yy + 2, fill=col)
    c.chord(x, base, h * 0.18, h * 0.2, 180, 360, outline=col, width=3)
    for k in range(10):
        u = k / 10
        y = lerp(base, base - h * 0.28, u)
        xl = lerp(L[0][0], L[1][0], u)
        c.line([(xl, y), (xl + 10, y - 10)], col, 1, cap=False)
    for k in range(8):
        u = k / 8
        y0 = lerp(base - h * 0.28, base - h * 0.6, u)
        y1 = lerp(base - h * 0.28, base - h * 0.6, u + 1 / 8)
        xl0 = lerp(L[1][0], L[2][0], u)
        xl1 = lerp(L[1][0], L[2][0], u + 1 / 8)
        c.line([(xl0, y0), (2 * x - xl1, y1)], col, 1, cap=False)
        c.line([(2 * x - xl0, y0), (xl1, y1)], col, 1, cap=False)
    for k in range(10):
        u = k / 10
        y0 = lerp(base - h * 0.6, top + 20, u)
        y1 = lerp(base - h * 0.6, top + 20, u + 0.1)
        xl0 = lerp(L[2][0], L[3][0], u)
        xl1 = lerp(L[2][0], L[3][0], u + 0.1)
        c.line([(xl0, y0), (2 * x - xl1, y1)], col, 0.8, cap=False)
        c.line([(2 * x - xl0, y0), (xl1, y1)], col, 0.8, cap=False)


def draw_modern(c, t, T):
    cloud(c, 200 + t * 4, 150, 1.0)
    cloud(c, 700 + t * 6, 200, 0.7)
    eiffel(c, 110, 560, 300)
    skyscraper(c, 220, 560, 70, 220, (120, 130, 150), t)
    skyscraper(c, 300, 560, 80, 300, (150, 146, 140), t, "empire")
    skyscraper(c, 390, 560, 60, 180, (110, 120, 140), t)
    skyscraper(c, 460, 560, 66, 270, (140, 140, 150), t, "chrysler")
    skyscraper(c, 536, 560, 90, 150, (120, 110, 110), t)
    skyscraper(c, 636, 560, 60, 210, (100, 110, 130), t)
    c.rect(0, 560, W, H, fill=(80, 90, 90))
    c.rect(0, 580, W, 600, fill=(60, 64, 70))
    for k in range(0, W, 50):
        c.rect(k + (t * 40 % 50), 588, k + 24 + (t * 40 % 50), 591, fill=(230, 220, 160))
    # σημαία της ΕΕ: 12 χρυσά αστέρια σε κύκλο
    fx = 740
    c.line([(fx, 600), (fx, 360)], (160, 160, 170), 4)
    def eu(c, xa, xb, ya, yb, h, u0, u1, light):
        c.poly([(xa, ya), (xb, yb), (xb, yb + h), (xa, ya + h)], fill=shade((0, 51, 153), light))
    flag_wave(c, fx + 2, 366, 120, 80, t, eu, amp=6, n=20)
    for k in range(12):
        a = k / 12 * 2 * math.pi
        px = fx + 2 + 60 + 26 * math.cos(a)
        u = (px - fx - 2) / 120
        d = 6 * u * math.sin(t * 5 - u * 7)
        py = 366 + 40 + 26 * math.sin(a) + d
        c.poly([(px + 5 * math.cos(-math.pi / 2 + j * math.pi / 5) * (1 if j % 2 == 0 else 0.42),
                 py + 5 * math.sin(-math.pi / 2 + j * math.pi / 5) * (1 if j % 2 == 0 else 0.42)) for j in range(10)],
               fill=(255, 204, 0))
    # το αεροπλάνο των αδελφών Ράιτ περνάει από τον ουρανό
    px = -120 + t * 80
    wright_flyer(c, px, 250 + 10 * math.sin(t * 1.3), 7.5, t)


# ====================================================================== 13. Διάστημα & ψηφιακή εποχή
def saturn_v(c, x, base, s=1.0):
    white, black = (244, 244, 246), (30, 30, 34)
    def R(x0, y0, x1, y1, col):
        c.rect(x + x0 * s, base - y1 * s, x + x1 * s, base - y0 * s, fill=col)
    # S-IC (1ο στάδιο) με μαύρο «μοτίβο κύλισης»
    R(-17, 12, 17, 138, white)
    R(-17, 12, -6, 40, black)
    R(6, 40, 17, 70, black)
    R(-17, 100, 17, 108, black)
    R(-17, 108, -6, 138, black)
    # πτερύγια και ακροφύσια F-1
    for sx in (-1, 1):
        c.poly([(x + sx * 17 * s, base - 40 * s), (x + sx * 28 * s, base - 4 * s), (x + sx * 17 * s, base - 4 * s)],
               fill=black)
    for k in (-10, 0, 10):
        c.poly([(x + (k - 4) * s, base - 12 * s), (x + (k + 4) * s, base - 12 * s), (x + (k + 6) * s, base),
                (x + (k - 6) * s, base)], fill=(60, 60, 64))
    # διαστάδιο και S-II
    c.poly([(x - 17 * s, base - 138 * s), (x + 17 * s, base - 138 * s), (x + 17 * s, base - 146 * s),
            (x - 17 * s, base - 146 * s)], fill=white)
    R(-17, 146, 17, 228, white)
    R(-17, 146, 17, 152, black)
    R(-17, 222, 17, 228, black)
    # S-IVB
    c.poly([(x - 17 * s, base - 228 * s), (x + 17 * s, base - 228 * s), (x + 11 * s, base - 240 * s),
            (x - 11 * s, base - 240 * s)], fill=white)
    R(-11, 240, 11, 288, white)
    R(-11, 256, -3, 270, black)
    R(-11, 288, 11, 292, (180, 180, 186))
    # Apollo: SM, CM, πύργος διαφυγής
    R(-11, 292, 11, 312, white)
    c.poly([(x - 11 * s, base - 312 * s), (x + 11 * s, base - 312 * s), (x + 3 * s, base - 330 * s),
            (x - 3 * s, base - 330 * s)], fill=(210, 210, 214))
    c.line([(x, base - 330 * s), (x, base - 352 * s)], (180, 60, 40), 2 * s)
    c.poly([(x - 2 * s, base - 342 * s), (x + 2 * s, base - 342 * s), (x, base - 356 * s)], fill=(180, 60, 40))
    c.rect(x + 8 * s, base - 118 * s, x + 13 * s, base - 50 * s, fill=(200, 60, 50))
    c.text(x + 10.5 * s, base - 84 * s, "USA", 5 * s, "white", "sans_b", "mm")


def draw_space(c, t, T):
    stars(c, t, 220, seed=12, ymax=560)
    # η Γη από μακριά και η Σελήνη
    c.circle(760, 120, 36, fill=(230, 228, 214))
    for dx, dy, r in ((-10, -8, 7), (12, 6, 8), (-4, 14, 5)):
        c.circle(760 + dx, 120 + dy, r, fill=(200, 196, 182))
    # δορυφόρος Sputnik (1957)
    sx = (t * 70) % 1100 - 100
    sy = 200 + 40 * math.sin(sx / 300)
    c.circle(sx, sy, 6, fill=(220, 220, 226))
    for k in range(4):
        c.line([(sx, sy), (sx - 26 - k * 3, sy + 8 + k * 5)], (200, 200, 206), 1, cap=False)
    # έδαφος και εξέδρα εκτόξευσης
    c.rect(0, 580, W, H, fill=(40, 44, 52))
    c.rect(300, 562, 560, 584, fill=(70, 70, 76))
    lift = ease_in(clamp((t - 3.0) / (T - 3.5))) * 760
    shake = math.sin(t * 60) * 1.2 if t > 2.2 else 0
    rx, rb = 440 + shake, 562 - lift
    # πύργος (Launch Umbilical Tower)
    tx0, tx1 = 360, 390
    c.rect(tx0, 170, tx1, 562, outline=(190, 70, 50), width=3)
    for y in range(180, 562, 22):
        c.line([(tx0, y), (tx1, y + 22)], (190, 70, 50), 1.5, cap=False)
        c.line([(tx1, y), (tx0, y + 22)], (190, 70, 50), 1.5, cap=False)
    c.rect(356, 160, 394, 172, fill=(190, 70, 50))
    for yy in (260, 340, 420, 500):
        arm = 1.0 if t < 2.6 else max(0, 1 - (t - 2.6) * 2)
        c.rect(tx1, yy, tx1 + (rx - 18 - tx1) * arm + 1, yy + 5, fill=(190, 70, 50))
    # φλόγα και καπνός
    if t > 2.2:
        k = clamp((t - 2.2) / 0.8)
        fl = 1 + 0.12 * math.sin(t * 40)
        L = (120 + 60 * clamp(lift / 200)) * k * fl
        c.poly([(rx - 18, rb), (rx + 18, rb), (rx + 30, rb + L * 0.6), (rx, rb + L), (rx - 30, rb + L * 0.6)],
               fill=(255, 140, 40))
        c.poly([(rx - 12, rb), (rx + 12, rb), (rx + 16, rb + L * 0.45), (rx, rb + L * 0.75), (rx - 16, rb + L * 0.45)],
               fill=(255, 220, 110))
        c.poly([(rx - 6, rb), (rx + 6, rb), (rx, rb + L * 0.4)], fill=(255, 255, 230))
        glow(c, rx, rb + 40, 180, (255, 170, 80), 12, 0.5 * k)
        rnd = random.Random(5)
        for i in range(26):
            u = ((t - 2.2) * 0.6 + rnd.random()) % 1.0
            side = rnd.choice((-1, 1))
            px = rx + side * (40 + u * rnd.uniform(160, 340))
            py = 574 - u * rnd.uniform(10, 80)
            c.circle(px, py, 18 + u * 40, fill=(210, 206, 204, int(200 * (1 - u) * k)))
    saturn_v(c, rx, rb, 1.12)


# ====================================================================== 14. Επίλογος (φόντο)
def draw_epilogue_bg(c, t, T):
    stars(c, t, 120, seed=31, ymax=H)
