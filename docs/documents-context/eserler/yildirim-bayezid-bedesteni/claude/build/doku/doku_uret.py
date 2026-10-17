# AKAR · Bedesten · v02 doku karoları (düz renkli, stilize; fotoğraf dokusu DEĞİL)
# Ref: ref-img/685fff971922d.webp (havadan): kutu almaşık duvar (3 sıra tuğla + 1 sıra taş, W Alkan 2023 s.157),
#   tuğla kemerli pencereler, dilimli kurşun kubbeler.
# Almaşık ve pencere karoları Koza Han doku_uret.py ile aynı çizim (iki eser yan yana aynı dili konuşsun).
# Çalıştırma: uv run --no-project --python 3.12 --with pillow python doku_uret.py   (çıktılar bu klasöre)
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))

TAS = [(203, 191, 168), (196, 183, 159), (209, 198, 177)]   # kesme taş (bej-gri)
TUGLA = [(201, 124, 96), (190, 112, 84), (210, 137, 110)]   # tuğla
DERZ = (216, 207, 192)                                        # harç

def almasik(path, W=512, Hh=256):
    """1 karo = 1,2 m × 0,6 m. Üstte 3 sıra tuğla, altta taş sırası; taşların arasında dikey tuğla (kutu almaşık)."""
    im = Image.new("RGB", (W, Hh), DERZ); d = ImageDraw.Draw(im)
    tb, dz, tl = 26, 4, 107
    for r in range(3):
        y0 = dz + r * (tb + dz); off = (r % 2) * tl // 2
        for k in range(-1, W // tl + 2):
            x0 = k * tl - off + dz // 2
            d.rectangle([x0, y0, x0 + tl - dz, y0 + tb - 1], fill=TUGLA[(k + r) % 3])
    ys = 3 * (tb + dz) + dz; ye = Hh - dz // 2
    tw, dk = 210, 46
    for k in range(2):
        x0 = dz // 2 + k * (tw + dk)
        d.rectangle([x0, ys, x0 + tw - dz, ye - 1], fill=TAS[k % 3])
        xb = x0 + tw; h4 = (ye - ys) // 4
        for j in range(4):
            d.rectangle([xb, ys + j * h4, xb + dk - dz, ys + (j + 1) * h4 - dz], fill=TUGLA[(j + k) % 3])
    im.save(path, optimize=True)

def pencere(path, W=128, Hh=192):
    """Beyaz taş söve + siyah cam + kahverengi demir parmaklık (4 dikey × 6 yatay)."""
    im = Image.new("RGB", (W, Hh), (237, 235, 228)); d = ImageDraw.Draw(im)
    b = 16
    d.rectangle([b, b, W - b - 1, Hh - b - 1], fill=(30, 31, 33))
    iw, ih = W - 2 * b, Hh - 2 * b
    for k in range(1, 5):
        x = b + iw * k // 5; d.rectangle([x - 2, b, x + 2, Hh - b - 1], fill=(107, 63, 38))
    for k in range(1, 7):
        y = b + ih * k // 7; d.rectangle([b, y - 2, W - b - 1, y + 2], fill=(107, 63, 38))
    d.rectangle([b, b, W - b - 1, Hh - b - 1], outline=(90, 58, 40), width=3)
    im.save(path, optimize=True)

def kubbe_dilim(path, W=64, Hh=64):
    """1 karo = kubbenin bir dilimi (u: dilim genişliği 0..1) × bir kurşun levha sırası (v).
    Kurşun mavi-gri zemin (#95AEBA, eser.md Palet), dilim kenarlarında koyu ek çizgisi, üstte ince yatay ek."""
    im = Image.new("RGB", (W, Hh), (149, 174, 186)); d = ImageDraw.Draw(im)
    koyu, acik = (104, 126, 138), (128, 151, 163)
    d.rectangle([0, 0, 2, Hh - 1], fill=koyu); d.rectangle([W - 3, 0, W - 1, Hh - 1], fill=koyu)
    d.rectangle([0, Hh - 2, W - 1, Hh - 1], fill=acik)
    im.save(path, optimize=True)

if __name__ == "__main__":
    almasik(os.path.join(HERE, "almasik.png"))
    pencere(os.path.join(HERE, "pencere.png"))
    kubbe_dilim(os.path.join(HERE, "kubbe_dilim.png"))
    print("tamam")
