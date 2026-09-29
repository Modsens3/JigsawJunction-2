"""Η Ιστορία του Δυτικού Πολιτισμού – ~3 λεπτά, 3D (three.js) + τίτλοι/κάρτες (Pillow) + μουσική.

Χρήση:
    python3 make_video.py                     # ολόκληρο το βίντεο -> western_civilization.mp4
    python3 make_video.py --only=greece       # μόνο μία σκηνή (segments/…mp4)
    python3 make_video.py --stills=folder     # ένα στιγμιότυπο ανά σκηνή για έλεγχο
    python3 make_video.py --fast              # χαμηλή ποιότητα (960x540) για γρήγορη δοκιμή
Οι σκηνές που έχουν ήδη αποδοθεί (segments/*.mp4) παραλείπονται, ώστε να μπορείς να ξαναρχίσεις.
"""
import os
import shutil
import subprocess
import sys
from multiprocessing import Pool

import imageio_ffmpeg
from PIL import Image, ImageChops, ImageDraw, ImageFilter

import music
import scenes_data as sd
from draw_utils import Canvas, alpha, back_out, clamp, ease, ease_out, lerp, wrap
from icons import ALL_ICONS

HERE = os.path.dirname(os.path.abspath(__file__))
FFMPEG = imageio_ffmpeg.get_ffmpeg_exe()
W, H, FPS, S = 1280, 720, 24, 2
GOLD = (240, 196, 96)
CARD_BG = (20, 24, 40)
FRAMES = os.path.join(HERE, "frames")
SEGS = os.path.join(HERE, "segments")


# ---------------------------------------------------------------- γυαλί / επίπεδα
def rmask(size, r, ss=3):
    m = Image.new("L", (size[0] * ss, size[1] * ss), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, size[0] * ss - 1, size[1] * ss - 1], radius=r * ss, fill=255)
    return m.resize(size, Image.LANCZOS)


def glass(base, box, r=18, blur=16, tint=(8, 12, 26), a=150, shadow=True):
    """«Γυάλινο» πάνελ: θολώνει ό,τι υπάρχει πίσω του και το σκουραίνει."""
    x0, y0, x1, y1 = [int(v) for v in box]
    x0, y0 = max(0, x0), max(0, y0)
    x1, y1 = min(W, x1), min(H, y1)
    if x1 - x0 < 4 or y1 - y0 < 4:
        return
    if shadow:
        sh = Image.new("L", (W, H), 0)
        sh.paste(rmask((x1 - x0, y1 - y0), r), (x0, y0 + 6))
        sh = sh.filter(ImageFilter.GaussianBlur(14)).point(lambda v: int(v * 0.5))
        base.paste((0, 0, 0), (0, 0), sh)
    crop = base.crop((x0, y0, x1, y1)).filter(ImageFilter.GaussianBlur(blur))
    crop = Image.blend(crop, Image.new("RGB", crop.size, tint), a / 255)
    # ελαφριά διαβάθμιση: πιο φωτεινό στην κορυφή
    grad = Image.linear_gradient("L").resize(crop.size).point(lambda v: int(255 - v * 0.12))
    crop = ImageChops.multiply(crop, Image.merge("RGB", (grad, grad, grad)))
    base.paste(crop, (x0, y0), rmask(crop.size, r))


def new_ui():
    return Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0))


def with_alpha(layer, a):
    if a >= 0.999:
        return layer
    al = layer.getchannel("A").point(lambda v: int(v * clamp(a)))
    out = layer.copy()
    out.putalpha(al)
    return out


# ---------------------------------------------------------------- στοιχεία διεπαφής
def ui_heading(c, t, s):
    a = ease(t / 0.9)
    dx = -34 * (1 - ease_out(t / 0.9))
    c.text(52 + dx, 40, s["title"], 42, alpha((255, 255, 255), a), "serif_b", "la", shadow=(2, 3, (0, 0, 0, int(190 * a))))
    w = 60 + 40 * ease(t / 1.2)
    c.line([(54 + dx, 98), (54 + dx + w, 98)], alpha(GOLD, a), 3, cap=False)
    c.text(54 + dx, 108, s["era"], 20, alpha(GOLD, a), "sans_b", "la", shadow=(1, 2, (0, 0, 0, int(190 * a))))


CAP_BOX = (44, 566, 1236, 640)


def ui_caption(c, t, s):
    a = ease((t - 0.7) / 0.8)
    if a <= 0:
        return
    lines = wrap(s["caption"], 20, "sans", 1130)
    y0 = 603 - (len(lines) - 1) * 14
    for i, ln in enumerate(lines):
        c.text(W / 2, y0 + i * 28, ln, 20, alpha((246, 242, 234), a), "sans", "mm")


def ui_timeline(c, t, idx):
    import math
    n = len(sd.SCENES)
    xs = [80 + i * (W - 160) / (n - 1) for i in range(n)]
    y = 678
    c.line([(xs[0], y), (xs[-1], y)], (110, 114, 130, 200), 3, cap=False)
    prev = xs[idx - 1] if idx > 0 else xs[0]
    cur = lerp(prev, xs[idx], ease(t / 1.6))
    c.line([(xs[0], y), (cur, y)], GOLD, 3, cap=False)
    for i, x in enumerate(xs):
        lab = sd.SCENES[i]["label"]
        if i < idx or (i == idx and cur >= x - 0.5):
            r = 7 + 2.5 * (0.5 + 0.5 * math.sin(t * 4)) if i == idx else 5
            c.circle(x, y, r, fill=GOLD if i == idx else (206, 168, 88))
        else:
            c.circle(x, y, 5, fill=(30, 34, 50), outline=(140, 144, 160), width=1.5)
        if i == idx:
            c.text(x, 702, lab, 14, GOLD, "sans_b", "mm")
        else:
            c.text(x, 702, lab, 12, (170, 174, 190), "sans", "mm")


CARD = (890, 98, 1238, 556)


def card_slide(t):
    return (1 - ease_out((t - 0.6) / 0.8)) * 420


def ui_card(base, ui, t, T, s):
    x0, y0, x1, y1 = CARD
    if t < 0.6:
        return
    off = card_slide(t)
    glass(base, (x0 + off, y0, x1 + off, y1), r=20, blur=18, a=165)
    c = Canvas(ui)
    c.rect(x0 + off, y0, x1 + off, y1, outline=alpha(GOLD, 0.85), width=1.6, r=20)
    invs = s["inv"]
    starts = [1.1, 6.7]
    k = 0 if t < starts[1] else 1
    cx = (x0 + x1) / 2 + off
    # κεφαλίδα
    c.circle(x0 + off + 26, y0 + 28, 7, fill=GOLD)
    c.rect(x0 + off + 22.5, y0 + 34, x0 + off + 29.5, y0 + 39, fill=(210, 210, 210))
    c.text(x0 + off + 44, y0 + 29, "ΕΦΕΥΡΕΣΗ", 16, GOLD, "sans_b", "lm")
    c.text(x1 + off - 22, y0 + 29, f"{k + 1}/{len(invs)}", 15, (170, 174, 190), "sans_b", "rm")
    c.line([(x0 + off + 18, y0 + 52), (x1 + off - 18, y0 + 52)], (120, 124, 140, 160), 1, cap=False)
    ts = t - starts[k]
    end = starts[1] if k == 0 else T - 0.45
    op = min(ease(ts / 0.45), ease((end - t) / 0.4)) if k == 0 else ease(ts / 0.45)
    if op <= 0.01:
        return
    layer = new_ui()
    lc = Canvas(layer)
    key, name, year, desc = invs[k]
    pop = 0.86 + 0.14 * back_out(ts / 0.6)
    my = y0 + 160
    # μενταγιόν: σκιά, πλάκα, στεφάνι
    lc.circle(cx + 3, my + 8, 106 * pop, fill=(0, 0, 0, 110))
    for k in range(14):                       # μαλακή ακτινική διαβάθμιση στο μενταγιόν
        f = k / 13
        lc.circle(cx - 8 * (1 - f), my - 10 * (1 - f), 106 * pop * (1 - 0.66 * f), fill=(int(20 + 26 * f), int(24 + 30 * f), int(40 + 46 * f)))
    ALL_ICONS[key](lc.sub(cx, my, 196 * pop), max(0.0, ts))
    lc.circle(cx, my, 106 * pop, outline=alpha(GOLD, 0.9), width=2)
    lc.arc(cx, my, 100 * pop, 100 * pop, 200, 290, (255, 255, 255, 90), width=2.4)     # ανταύγεια
    y = y0 + 291
    for ln in wrap(name, 23, "serif_b", 316):
        lc.text(cx, y, ln, 23, (255, 255, 255), "serif_b", "mm")
        y += 29
    lc.text(cx, y + 2, year, 15, GOLD, "sans_b", "mm")
    y += 30
    for ln in wrap(desc, 16, "sans", 306):
        lc.text(x0 + off + 22, y, ln, 16, (226, 228, 236), "sans", "lm")
        y += 22
    ui.alpha_composite(with_alpha(layer, op))


# ---------------------------------------------------------------- επίλογος (2D φόντο + μενταγιόν)
def epilogue_bg(t, T):
    import math, random
    img = Image.linear_gradient("L").resize((W, H))
    top, bot = (10, 14, 36), (44, 30, 78)
    g = Image.merge("RGB", [img.point(lambda v, a=a, b=b: int(a + (b - a) * v / 255)) for a, b in zip(top, bot)])
    lay = Image.new("RGBA", (W * 2, H * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(lay)
    rnd = random.Random(31)
    for i in range(260):
        x, y = rnd.uniform(0, W), rnd.uniform(0, H)
        z = rnd.choice((0.4, 0.7, 1.0, 1.4))
        x = (x - t * 6 * z) % W
        tw = 0.55 + 0.45 * math.sin(t * rnd.uniform(1, 3) + i)
        r = z * 1.3 * 2
        d.ellipse([x * 2 - r, y * 2 - r, x * 2 + r, y * 2 + r], fill=(255, 246, 225, int(230 * tw)))
    lay = lay.filter(ImageFilter.GaussianBlur(0.6)).resize((W, H), Image.LANCZOS)
    g = g.convert("RGBA")
    g.alpha_composite(lay)
    # μαλακή λάμψη πίσω από τους τίτλους
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(glow).ellipse([W / 2 - 420, H / 2 - 230, W / 2 + 420, H / 2 + 230], fill=(120, 90, 200, 60))
    g.alpha_composite(glow.filter(ImageFilter.GaussianBlur(90)))
    return g.convert("RGB")


def ui_epilogue(base, ui, t, T):
    c = Canvas(ui)
    a = ease((t - 0.2) / 0.8)
    c.text(W / 2, 66, "Οι εφευρέσεις που διαμόρφωσαν τη Δύση", 36, alpha(GOLD, a), "serif_b", "mm", shadow=(2, 3, (0, 0, 0, int(160 * a))))
    for i, (key, lab) in enumerate(sd.EPI_ICONS):
        tk = 0.6 + i * 0.32
        if t < tk:
            continue
        p = back_out((t - tk) / 0.55)
        cx = 140 + (i % 6) * 200
        cy = 196 + (i // 6) * 196
        r = 72 * p
        c.circle(cx + 3, cy + 8, r + 3, fill=(0, 0, 0, 110))
        c.circle(cx, cy, r + 3, fill=GOLD)
        c.circle(cx, cy, r, fill=CARD_BG)
        ALL_ICONS[key](c.sub(cx, cy, 118 * p), t - tk)
        c.circle(cx, cy, r, outline=(255, 255, 255, 40), width=1)
        la = ease((t - tk - 0.2) / 0.4)
        c.text(cx, cy + 92, lab, 16, alpha((240, 236, 226), la), "sans_b", "mm")
    b = ease((t - 5.4) / 1.0)
    if b > 0:
        c.text(W / 2, 556, "«Αν είδα πιο μακριά, είναι επειδή στάθηκα στους ώμους γιγάντων.»", 24, alpha((245, 240, 230), b), "serif", "mm")
        c.text(W / 2, 590, "— Ισαάκ Νεύτων", 17, alpha(GOLD, b), "sans", "mm")
    d = ease((t - 7.6) / 1.0)
    if d > 0:
        c.text(W / 2, 650, "Η ιστορία συνεχίζεται… και τη γράφουμε εμείς.", 28, alpha((255, 214, 130), d), "serif_b", "mm", shadow=(2, 3, (0, 0, 0, int(150 * d))))


def ui_title(ui, t, T):
    c = Canvas(ui)
    a = ease((t - 1.2) / 1.3)
    if a > 0:
        c.text(W / 2, 128, "Η Ιστορία του", 40, alpha((255, 244, 226), a), "serif", "mm", shadow=(2, 3, (0, 0, 0, int(190 * a))))
        c.text(W / 2, 206, "Δυτικού Πολιτισμού", 78, alpha((255, 208, 116), a), "serif_b", "mm", shadow=(3, 5, (0, 0, 0, int(200 * a))))
    b = ease((t - 2.8) / 1.2)
    if b > 0:
        w = 300 * b
        c.line([(W / 2 - w, 262), (W / 2 + w, 262)], alpha(GOLD, b), 2, cap=False)
        c.text(W / 2, 296, "Από τους Σουμέριους μέχρι την ψηφιακή εποχή", 26, alpha((246, 240, 230), b), "sans", "mm", shadow=(2, 2, (0, 0, 0, int(170 * b))))
        c.text(W / 2, 334, "…και οι εφευρέσεις που άλλαξαν τον κόσμο", 22, alpha(GOLD, b), "serif", "mm", shadow=(2, 2, (0, 0, 0, int(170 * b))))


# ---------------------------------------------------------------- σύνθεση καρέ
def bottom_shade(base, strength=0.62, h=200):
    g = Image.linear_gradient("L").resize((W, h))          # 0 πάνω -> 255 κάτω
    g = g.point(lambda v: int(v * strength))
    base.paste((4, 6, 14), (0, H - h), g)


def top_shade(base, strength=0.35, h=190):
    g = Image.linear_gradient("L").resize((W, h)).transpose(Image.FLIP_TOP_BOTTOM).point(lambda v: int(v * strength))
    base.paste((4, 6, 14), (0, 0), g)


def compose(args):
    idx, kind, key, T, t, path, fade = args
    if kind == "epilogue":
        base = epilogue_bg(t, T)
    else:
        base = Image.open(path).convert("RGB")
        if base.size != (W, H):
            base = base.resize((W, H), Image.LANCZOS)
    ui = new_ui()
    if kind == "title":
        top_shade(base, 0.30, 300)
        ui_title(ui, t, T)
    elif kind == "epilogue":
        ui_epilogue(base, ui, t, T)
    else:
        s = sd.BY_KEY[key]
        top_shade(base, 0.42, 200)
        bottom_shade(base, 0.60, 190)
        a = ease((t - 0.7) / 0.8)
        if a > 0.01:
            glass(base, CAP_BOX, r=16, blur=14, a=int(120 * a), shadow=False)
        c = Canvas(ui)
        ui_heading(c, t, s)
        ui_caption(c, t, s)
        ui_timeline(c, t, sd.SCENES.index(s))
        ui_card(base, ui, t, T, s)
    out = base.convert("RGBA")
    out.alpha_composite(ui.resize((W, H), Image.LANCZOS))
    out = out.convert("RGB")
    if fade < 0.999:
        out = Image.blend(Image.new("RGB", (W, H), (0, 0, 0)), out, max(0.0, fade))
    return out.tobytes()


def fade_of(kind, t, T):
    if kind == "title":
        return ease(t / 1.0) * ease((T - t) / 0.5)
    if kind == "epilogue":
        return ease(t / 0.5) * ease((T - t) / 1.8)
    return ease(t / 0.5) * ease((T - t) / 0.5)


# ---------------------------------------------------------------- απόδοση σκηνών
def render_frames(key, nframes, outdir, extra=()):
    shutil.rmtree(outdir, ignore_errors=True)
    os.makedirs(outdir, exist_ok=True)
    cmd = ["node", os.path.join(HERE, "render3d.js"), f"--scene={key}", "--from=0", f"--to={nframes}", f"--out={outdir}",
           f"--fps={FPS}", f"--w={W}", f"--h={H}", "--q=0.94", *extra]
    subprocess.run(cmd, check=True, cwd=HERE)


def make_segment(item, only=None, fast=False):
    i, (kind, T, s) = item
    key = "title" if kind == "title" else "epilogue" if kind == "epilogue" else s["key"]
    seg = os.path.join(SEGS, f"{i:02d}_{key}.mp4")
    if os.path.exists(seg) and only is None:
        print(f"[{i:02d}] {key}: έτοιμο ({seg})")
        return seg
    n = int(round(T * FPS))
    d = os.path.join(FRAMES, key)
    if kind != "epilogue":
        print(f"[{i:02d}] {key}: 3D απόδοση {n} καρέ…", flush=True)
        render_frames(key, n, d)
    os.makedirs(SEGS, exist_ok=True)
    tmp = seg + ".tmp.mp4"
    p = subprocess.Popen([FFMPEG, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
                          "-c:v", "libx264", "-preset", "medium", "-crf", "15", "-pix_fmt", "yuv420p", "-movflags", "+faststart", tmp], stdin=subprocess.PIPE)
    jobs = [(i, kind, key, T, f / FPS, os.path.join(d, f"{f:05d}.jpg"), fade_of(kind, f / FPS, T)) for f in range(n)]
    print(f"[{i:02d}] {key}: σύνθεση διεπαφής…", flush=True)
    with Pool(os.cpu_count()) as pool:
        for data in pool.imap(compose, jobs, chunksize=4):
            p.stdin.write(data)
    p.stdin.close()
    p.wait()
    os.replace(tmp, seg)
    shutil.rmtree(d, ignore_errors=True)
    return seg


def stills(outdir, keys=None):
    os.makedirs(outdir, exist_ok=True)
    for i, (kind, T, s) in enumerate(sd.TIMELINE):
        key = "title" if kind == "title" else "epilogue" if kind == "epilogue" else s["key"]
        if keys and key not in keys.split(","):
            continue
        t = T * (0.62 if kind != "scene" else 0.55)
        tmp = os.path.join(FRAMES, "_still", key)
        os.makedirs(tmp, exist_ok=True)
        path = os.path.join(tmp, "s.jpg")
        if kind != "epilogue":
            subprocess.run(["node", os.path.join(HERE, "render3d.js"), f"--scene={key}", f"--still={t}", f"--file={path}", f"--w={W}", f"--h={H}"], check=True, cwd=HERE)
        data = compose((i, kind, key, T, t, path, 1.0))
        Image.frombytes("RGB", (W, H), data).save(os.path.join(outdir, f"{i:02d}_{key}.png"))
        print("saved", key, flush=True)


def main():
    args = dict(a.lstrip("-").split("=", 1) if "=" in a else (a.lstrip("-"), True) for a in sys.argv[1:])
    if "stills" in args:
        return stills(args["stills"], args.get("keys"))
    only = args.get("only")
    items = list(enumerate(sd.TIMELINE))
    if only:
        items = [(i, it) for i, it in items if (it[2] and it[2]["key"] == only) or it[0] == only]
    segs = [make_segment(it, only=only) for it in items]
    if only:
        return
    total = sum(T for _, T, _ in sd.TIMELINE)
    wav = os.path.join(HERE, "music.wav")
    print(f"Μουσική ({total:.1f} δευτ.)…", flush=True)
    music.generate(total, wav, intro=sd.TITLE_T)
    lst = os.path.join(SEGS, "list.txt")
    with open(lst, "w") as f:
        for sgm in segs:
            f.write(f"file '{sgm}'\n")
    out = os.path.join(HERE, "western_civilization.mp4")
    subprocess.run([FFMPEG, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-i", wav, "-c:v", "libx264", "-preset", "slow", "-crf", "22", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", "-movflags", "+faststart", out], check=True)
    os.remove(wav)
    print("Έτοιμο:", out)


if __name__ == "__main__":
    main()
