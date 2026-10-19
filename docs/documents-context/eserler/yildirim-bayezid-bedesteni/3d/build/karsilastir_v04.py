# Karşılaştırma görselleri (yan yana) — Pillow. Kullanım: python karsilastir_v04.py <kontrol_klasoru> <ref_klasoru>
import sys, os
from PIL import Image, ImageDraw, ImageFont
K, R = sys.argv[1], sys.argv[2]
GRI = (231, 231, 231)
try: FONT = ImageFont.load_default(size=26)
except TypeError: FONT = ImageFont.load_default()
def yuk(p):
    im = Image.open(p).convert("RGBA")
    if im.getchannel("A").getextrema()[0] < 255:
        bg = Image.new("RGBA", im.size, GRI + (255,)); bg.alpha_composite(im); im = bg
    return im.convert("RGB")
def etiket(im, t):
    d = ImageDraw.Draw(im); d.rectangle([0, 0, 7 * len(t) + 14, 22], fill=(0, 0, 0)); d.text((6, 4), t, fill=(255, 255, 255)); return im
def yan(a, b, ta, tb, hedef_w, yol):
    h = min(a.height, b.height); a = a.resize((round(a.width * h / a.height), h)); b = b.resize((round(b.width * h / b.height), h))
    c = Image.new("RGB", (a.width + b.width + 8, h), (255, 255, 255)); c.paste(etiket(a, ta), (0, 0)); c.paste(etiket(b, tb), (a.width + 8, 0))
    c = c.resize((hedef_w, round(c.height * hedef_w / c.width))); c.save(yol)
def var(n): return os.path.exists(os.path.join(K, n))
if var("tepeden.png"):
    yan(yuk(os.path.join(R, "foto/envanter_c2_s28_tepeden.png")), yuk(os.path.join(K, "tepeden.png")), "F: envanter_c2_s28_tepeden (kuzey ustte)", "render: tepeden ortografik", 2400, os.path.join(K, "yan_yana_tepeden.png"))
if var("foto2024.png"):
    yan(yuk(os.path.join(R, "foto/ekinci2025_pdf084_havadan_2024.png")), yuk(os.path.join(K, "foto2024.png")), "F: ekinci2025_pdf084_havadan_2024", "render: kuzeybati bakis (kamera NW)", 2400, os.path.join(K, "yan_yana_havadan_2024.png"))
if var("kuzey_orto.png"):   # dükkân sayımı için numaralı bindirme (kamera güneye bakıyor: görüntü sağı = batı)
    im = yuk(os.path.join(K, "kuzey_orto.png")); d = ImageDraw.Draw(im); ppm = im.width / 76.0
    OX = 35.35; adim = 2.75; kose = 4.6   # v04b
    xs = [-OX + kose + adim * (i + 0.5) for i in range(10)] + [3.25 + adim * (i + 0.5) for i in range(10)]
    ycen = im.height / 2 + (7 - 2.4) * ppm
    for n, x in enumerate(sorted(xs, reverse=True), 1):   # görüntüde soldan sağa: doğudan batıya
        px = im.width / 2 - x * ppm; d.text((px - 8, ycen - 70), str(n), fill=(255, 255, 255), font=FONT, stroke_width=2, stroke_fill=(0, 70, 170))
    im.save(os.path.join(K, "kuzey_orto_sayim.png"))
print("tamam")
