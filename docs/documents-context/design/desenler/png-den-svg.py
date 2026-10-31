"""PNG desen karesi -> tek renkli SVG (beyaz = desen). Kullanım: trace.py girdi.png cikti.svg [x y w h] [hedef_genislik]"""
import sys
import numpy as np
import potrace
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
im = Image.open(src).convert("L")
if len(sys.argv) >= 7:
    x, y, w, h = map(int, sys.argv[3:7])
    im = im.crop((x, y, x + w, y + h))
target = int(sys.argv[7]) if len(sys.argv) >= 8 else 0
W, H = im.size
if target and W > target:
    im = im.resize((target, round(H * target / W)), Image.LANCZOS)
W, H = im.size
# Kenar dikişsiz kalsın diye kareyi her yandan bir kopyasıyla sarıp izliyoruz, sonra kırpıyoruz (viewBox).
a = np.asarray(im) > 127
pad = 24
big = np.pad(a, pad, mode="wrap")
bm = potrace.Bitmap(~big)  # potracer koyu pikselleri izliyor: desen (beyaz) koyu olsun
path = bm.trace(turdsize=8, alphamax=0.75, opticurve=True, opttolerance=0.2)


def f(v):
    return f"{v:.1f}".rstrip("0").rstrip(".")


d = []
for curve in path:
    sp = curve.start_point
    d.append(f"M{f(sp.x - pad)} {f(sp.y - pad)}")
    for seg in curve.segments:
        if seg.is_corner:
            d.append(f"L{f(seg.c.x - pad)} {f(seg.c.y - pad)}L{f(seg.end_point.x - pad)} {f(seg.end_point.y - pad)}")
        else:
            d.append(
                f"C{f(seg.c1.x - pad)} {f(seg.c1.y - pad)} {f(seg.c2.x - pad)} {f(seg.c2.y - pad)} {f(seg.end_point.x - pad)} {f(seg.end_point.y - pad)}"
            )
    d.append("Z")
svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}">'
    f'<path fill="#000" fill-rule="evenodd" d="{"".join(d)}"/></svg>\n'
)
open(out, "w").write(svg)
print(out, W, H, len(svg) // 1024, "KB", len(path), "eğri")
