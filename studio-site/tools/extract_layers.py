"""
Extracts the photographic layers of the four reference frames into
separate transparent WebP files (assets/layers/*.webp).

Typography is NOT extracted: it is rebuilt as live HTML text.
Run:  python3 tools/extract_layers.py   (needs: opencv-python-headless, numpy, pillow)
Polygons are in reference-pixel coordinates (same units as js/config.js).
"""
import os
import cv2
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
REF = os.path.join(HERE, "ref")
OUT = os.path.join(HERE, "..", "assets", "layers")
BOXES = {}
os.makedirs(OUT, exist_ok=True)


def load(name):
    return np.array(Image.open(os.path.join(REF, name)).convert("RGB"))


def poly_mask(shape, pts, aa=4):
    """Anti-aliased polygon mask (0..1 float)."""
    h, w = shape[:2]
    m = np.zeros((h * aa, w * aa), np.uint8)
    cv2.fillPoly(m, [np.array([(x * aa, y * aa) for x, y in pts], np.int32)], 255)
    m = cv2.resize(m, (w, h), interpolation=cv2.INTER_AREA)
    return m.astype(np.float32) / 255.0


def grabcut(img, pts, ring=14, sure=22, iters=6, bg_rects=()):
    """GrabCut seeded by a hand polygon. Returns soft alpha 0..1."""
    h, w = img.shape[:2]
    P = (poly_mask(img.shape, pts, 1) > 0.5).astype(np.uint8)
    k = lambda r: cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * r + 1, 2 * r + 1))
    outer = cv2.dilate(P, k(ring))
    inner = cv2.erode(P, k(sure))
    gc = np.full((h, w), cv2.GC_BGD, np.uint8)
    gc[outer > 0] = cv2.GC_PR_BGD
    gc[P > 0] = cv2.GC_PR_FGD
    gc[inner > 0] = cv2.GC_FGD
    for (x0, y0, x1, y1) in bg_rects:  # known background patches inside the polygon
        gc[y0:y1, x0:x1] = cv2.GC_BGD
    bgd = np.zeros((1, 65), np.float64)
    fgd = np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(img, cv2.COLOR_RGB2BGR), gc, None, bgd, fgd, iters, cv2.GC_INIT_WITH_MASK)
    fg = np.isin(gc, (cv2.GC_FGD, cv2.GC_PR_FGD)).astype(np.uint8)
    # keep largest components / fill holes
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, k(2))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
    if n > 1:
        keep = np.zeros_like(fg)
        for i in range(1, n):
            if stats[i, cv2.CC_STAT_AREA] > 400:
                keep[lab == i] = 1
        fg = keep
    a = cv2.GaussianBlur(fg.astype(np.float32), (0, 0), 0.9)
    return np.clip(a, 0, 1)


def estimate_bg(img, fgmask, scale=8):
    """Smooth background estimate: inpaint objects on a downscaled copy."""
    h, w = img.shape[:2]
    small = cv2.resize(img, (w // scale, h // scale), interpolation=cv2.INTER_AREA)
    m = cv2.resize((fgmask > 0.02).astype(np.uint8) * 255, (w // scale, h // scale))
    m = cv2.dilate(m, np.ones((5, 5), np.uint8))
    bg = cv2.inpaint(small, m, 6, cv2.INPAINT_TELEA)
    bg = cv2.GaussianBlur(bg, (0, 0), 3)
    return cv2.resize(bg, (w, h), interpolation=cv2.INTER_CUBIC).astype(np.float32)


def unmix_shadow(img, bg, region, gain=1.0):
    """Alpha + colour of soft shadows/reflections that are darker than the background."""
    c = img.astype(np.float32)
    d = (bg - c) / np.maximum(bg, 1)
    a = np.clip(d.max(axis=2) * gain, 0, 1) * region
    a[a < 0.015] = 0
    col = (c - (1 - a[..., None]) * bg) / np.maximum(a[..., None], 1e-3)
    return a, np.clip(col, 0, 255)


def save(name, rgb, alpha, box=None, q=92):
    if box is None:
        ys, xs = np.where(alpha > 0.01)
        pad = 2
        box = (max(xs.min() - pad, 0), max(ys.min() - pad, 0),
               min(xs.max() + pad + 1, alpha.shape[1]), min(ys.max() + pad + 1, alpha.shape[0]))
    x0, y0, x1, y1 = box
    rgba = np.dstack([rgb[y0:y1, x0:x1], (alpha[y0:y1, x0:x1] * 255).round()]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(os.path.join(OUT, name + ".webp"), "WEBP", quality=q, method=6)
    print(f"{name:18s} x={x0} y={y0} w={x1 - x0} h={y1 - y0}")
    BOXES[name] = dict(x=int(x0), y=int(y0), w=int(x1 - x0), h=int(y1 - y0))
    return box


# ---------------------------------------------------------------- scene 02
def scene2():
    img = load("02-process.png")
    swatch_pts = [(80, 1258), (118, 1214), (150, 1203), (178, 1190), (205, 1189), (240, 1197), (266, 1212),
                  (292, 1238), (326, 1290), (332, 1334), (320, 1352), (225, 1355), (198, 1346), (168, 1322), (84, 1278)]
    note_pts = [(624, 1130), (742, 1105), (757, 1108), (764, 1118), (798, 1205), (826, 1247), (824, 1262),
                (692, 1288), (676, 1282)]
    screen_q = [(280, 964), (580, 931), (591, 1116), (305, 1161)]

    sw = grabcut(img, swatch_pts, ring=10, sure=18)
    nb = grabcut(img, note_pts, ring=10, sure=16)
    scr = poly_mask(img.shape, screen_q)

    save("s2-swatches", img, sw)
    save("s2-notebook", img, nb)
    save("s2-screen", img, scr)

    # desk plate: remove movable objects (inpaint) and switch the screen "off"
    base = img.copy()
    hole = ((sw > 0.02) | (nb > 0.02)).astype(np.uint8) * 255
    hole = cv2.dilate(hole, np.ones((7, 7), np.uint8))
    base = cv2.inpaint(base, hole, 7, cv2.INPAINT_TELEA)
    off = np.zeros_like(base, np.float32)
    yy = np.linspace(0, 1, base.shape[0])[:, None]
    off[...] = np.dstack([18 + 10 * yy, 19 + 10 * yy, 26 + 12 * yy])
    s = scr[..., None]
    base = (base * (1 - s) + off * s).astype(np.uint8)
    full = np.ones(img.shape[:2], np.float32)
    save("s2-desk", base, full, box=(0, 826, img.shape[1], img.shape[0]), q=90)


# ---------------------------------------------------------------- scene 03
def scene3():
    img = load("03-product.png")
    laptop_pts = [(236, 690), (793, 655), (809, 664), (814, 760), (812, 1084), (960, 1090), (1022, 1116),
                  (1020, 1136), (840, 1190), (800, 1208), (560, 1240), (470, 1248), (395, 1232), (330, 1182),
                  (298, 1140), (292, 1110), (282, 1050)]
    phone_pts = [(806, 772), (832, 765), (966, 780), (983, 796), (985, 822), (942, 1160), (925, 1172),
                 (776, 1152), (760, 1138), (761, 1098)]
    star_pts = [(196, 926), (238, 1006), (300, 1030), (326, 1040), (326, 1060), (250, 1082), (212, 1212), (188, 1212), (150, 1112), (82, 1090), (150, 1062), (180, 966)]
    lap = grabcut(img, laptop_pts, ring=10, sure=26)
    ph = grabcut(img, phone_pts, ring=8, sure=20)
    # glass star: colour key on the cobalt tint (GrabCut keeps background inside the glass)
    c = img.astype(np.float32)
    sp = cv2.dilate(poly_mask(img.shape, star_pts), np.ones((7, 7), np.uint8))
    st = np.clip((c[..., 2] - c[..., 0] - 28) / 70.0, 0, 1) * sp
    st = cv2.GaussianBlur(st, (0, 0), 0.6)

    # hinge line splits lid / base
    h, w = img.shape[:2]
    X, Y = np.meshgrid(np.arange(w), np.arange(h))
    (hx0, hy0), (hx1, hy1) = (300, 1127), (840, 1083)
    side = (X - hx0) * (hy1 - hy0) - (Y - hy0) * (hx1 - hx0)  # >0 : above the line
    above = np.clip(side / 600.0 + 0.5, 0, 1)
    lid = lap * above * (1 - ph)
    base = lap * (1 - above) * (1 - ph)

    fg = np.maximum.reduce([lap, ph, st])
    bg = estimate_bg(img, fg)
    region = poly_mask(img.shape, [(60, 1080), (1060, 1080), (1080, 1330), (40, 1330)])
    region = cv2.GaussianBlur(region, (0, 0), 14) * (1 - fg)
    sha, shc = unmix_shadow(img, bg, region, gain=1.6)
    base_rgb = np.where(base[..., None] > 0.01, img, shc).astype(np.uint8)
    base_a = np.maximum(base, sha * (1 - lap) * (1 - ph) * (1 - st))

    # screen of the lid: content layer + "off" lid (content revealed later)
    scr_q = [(253, 709), (782, 682), (789, 1064), (303, 1098)]
    scr = poly_mask(img.shape, scr_q) * lid
    off = img.astype(np.float32).copy()
    yy = np.linspace(0, 1, h)[:, None]
    dark = np.dstack([16 + 12 * yy + 0 * X, 17 + 12 * yy + 0 * X, 24 + 14 * yy + 0 * X]).astype(np.float32)
    off = off * (1 - scr[..., None]) + dark * scr[..., None]
    lid_box = save("s3-lid", off.astype(np.uint8), lid)
    save("s3-lid-screen", img, scr, box=lid_box)
    save("s3-base", base_rgb, base_a)
    save("s3-phone", img, ph)
    save("s3-star", img, st)


# ---------------------------------------------------------------- scene 04
def scene4():
    img = load("04-result.png")
    ppl_pts = [(330, 440), (400, 428), (448, 478), (530, 520), (595, 560), (605, 650), (575, 700), (565, 760),
               (600, 780), (650, 806), (705, 860), (728, 930), (732, 1010), (722, 1090), (690, 1140), (600, 1158),
               (470, 1158), (408, 1135), (392, 1050), (400, 960), (425, 905), (455, 870), (455, 820), (420, 770),
               (360, 720), (310, 680), (295, 620), (300, 560), (318, 480)]
    ppl = grabcut(img, ppl_pts, ring=12, sure=24, iters=10, bg_rects=[
        (545, 700, 595, 790), (420, 850, 455, 950), (728, 900, 748, 1150), (470, 1146, 700, 1168),
        (600, 600, 640, 690), (300, 1050, 380, 1150), (458, 840, 525, 895), (548, 655, 590, 700),
        (705, 1040, 730, 1140), (560, 790, 600, 815)])
    # drop any band-blue that GrabCut kept at the edges
    c = img.astype(np.int32)
    blueish = np.clip(((c[..., 2] - c[..., 0]) - 70) / 40.0, 0, 1)
    ppl = ppl * (1 - blueish)
    # remove floor GrabCut kept: anything within a few levels of the floor colour
    bg = estimate_bg(img, ppl)
    dist = np.abs(img.astype(np.float32) - bg).max(axis=2)
    m = ppl * np.clip((dist - 5) / 7.0, 0, 1)
    # give back small holes inside the figures (white shirt highlights etc.)
    solid = (m > 0.5).astype(np.uint8)
    inv = 1 - solid
    n, lab, stats, _ = cv2.connectedComponentsWithStats(inv, connectivity=4)
    holes = np.zeros_like(solid)
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        if area < 900 and x > 0 and y > 0 and x + w < solid.shape[1] and y + h < solid.shape[0]:
            holes[lab == i] = 1
    solid = np.maximum(solid, holes)
    solid = cv2.morphologyEx(solid, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(solid)
    big = np.zeros_like(solid)
    for i in range(1, n):
        if stats[i, cv2.CC_STAT_AREA] > 1500:
            big[lab == i] = 1
    soft = cv2.GaussianBlur(big.astype(np.float32), (0, 0), 0.8)
    ppl = np.minimum(ppl, np.maximum(soft, m * big))
    # leftover floor in known open areas becomes a true soft shadow (unmixed
    # against the open floor colour) instead of an opaque patch
    f = img.astype(np.float32)
    L = f.mean(axis=2)
    sat = (f.max(axis=2) - f.min(axis=2)) / np.maximum(f.max(axis=2), 1)
    mu = cv2.blur(L, (5, 5)); sd = np.sqrt(np.maximum(cv2.blur(L * L, (5, 5)) - mu * mu, 0))
    floorish = ((L > 200) & (L < 237) & (sat < 0.14) & (sd < 9)).astype(np.float32)
    zone = np.zeros_like(L)
    for (x0, y0, x1, y1) in [(440, 700, 490, 790), (518, 640, 605, 820), (520, 1010, 740, 1170),
                             (452, 830, 568, 912), (448, 860, 480, 975), (600, 790, 640, 830), (700, 880, 750, 1170)]:
        zone[y0:y1, x0:x1] = 1
    floor = cv2.GaussianBlur(cv2.morphologyEx(floorish * zone, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8)), (0, 0), 1.2)
    floor = np.clip(floor * 1.3, 0, 1)
    open_floor = np.array([235, 238, 254], np.float32)
    bgc = np.broadcast_to(open_floor, f.shape)
    sha, shc = unmix_shadow(img, bgc, np.ones_like(L), gain=1.0)
    rgb = (img * (1 - floor[..., None]) + shc * floor[..., None]).astype(np.uint8)
    ppl = ppl * (1 - floor) + np.minimum(sha, ppl) * floor
    img = rgb
    save("s4-people", img, ppl)


if __name__ == "__main__":
    scene2()
    scene3()
    scene4()
    import json
    with open(os.path.join(HERE, "..", "js", "layers.generated.js"), "w") as f:
        f.write("// Generated by tools/extract_layers.py: position of each photo layer in reference pixels.\n")
        f.write("export const LAYERS = " + json.dumps(BOXES, indent=2) + ";\n")
