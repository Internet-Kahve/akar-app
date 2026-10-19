# AKAR · Orhan Bey Camii · v02 doku karoları (düz renkli, stilize; fotoğraf dokusu DEĞİL)
# Ref: ref/foto/IMG_8460, IMG_8484 (2020–23 restorasyonu sonrası): moloz/kesme taş sıraları arasında İKİ sıra kırmızı tuğla,
#   taşların arasında dikey tuğla (kutu almaşık; E cilt-1 PDF s.98 "moloz taş ve aralarına yatay ve dikey tuğla").
# Pencere ve kubbe dilimi Bedesten doku_uret.py ile aynı çizim; kubbe rengi eser.md Paleti (#A8AEC1).
# Çalıştırma: uv run --no-project --python 3.12 --with pillow python doku_uret.py   (çıktılar bu klasöre)
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))

TAS = [(196, 186, 168), (186, 175, 157), (204, 195, 178)]   # moloz/kesme taş (bej-gri, fotoğrafta grimsi)
TUGLA = [(196, 104, 78), (184, 94, 70), (205, 118, 92)]      # kırmızı tuğla (fotoğrafta belirgin kırmızı)
DERZ = (222, 214, 200)                                        # açık harç

def almasik(path, W=512, Hh=256):
    """1 karo = 1,2 m × 0,6 m. Üstte 2 sıra tuğla, altta taş sırası; taşların arasında dikey tuğla (kutu almaşık)."""
    im = Image.new("RGB", (W, Hh), DERZ); d = ImageDraw.Draw(im)
    tb, dz, tl = 24, 5, 107
    for r in range(2):
        y0 = dz + r * (tb + dz); off = (r % 2) * tl // 2
        for k in range(-1, W // tl + 2):
            x0 = k * tl - off + dz // 2
            d.rectangle([x0, y0, x0 + tl - dz, y0 + tb - 1], fill=TUGLA[(k + r) % 3])
    ys = 2 * (tb + dz) + dz; ye = Hh - dz // 2
    tw, dk = 206, 50
    for k in range(2):
        x0 = dz // 2 + k * (tw + dk)
        d.rectangle([x0, ys, x0 + tw - dz, ye - 1], fill=TAS[k % 3])
        xb = x0 + tw; h4 = (ye - ys) // 5
        for j in range(5):
            d.rectangle([xb, ys + j * h4, xb + dk - dz, ys + (j + 1) * h4 - dz], fill=TUGLA[(j + k) % 3])
    im.save(path, optimize=True)

def pencere(path, W=128, Hh=192):
    """Beyaz taş söve + koyu cam + kahverengi demir parmaklık (4 dikey × 6 yatay)."""
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
    """1 karo = kubbenin bir dilimi × bir kurşun levha sırası. Zemin #A8AEC1 (eser.md Palet), dilim kenarında koyu ek."""
    im = Image.new("RGB", (W, Hh), (168, 174, 193)); d = ImageDraw.Draw(im)
    koyu, acik = (124, 130, 150), (150, 156, 175)
    d.rectangle([0, 0, 2, Hh - 1], fill=koyu); d.rectangle([W - 3, 0, W - 1, Hh - 1], fill=koyu)
    d.rectangle([0, Hh - 2, W - 1, Hh - 1], fill=acik)
    im.save(path, optimize=True)

def pencere_sebeke(path, W=128, Hh=192):
    """Üst pencere ve kasnak pencereleri: beyaz alçı şebeke, koyu altıgen-yuvarlak delikler (E PDF s.101 "alçı şebekeli";
    F ts_17ekim_b_13, _18). Kemer biçimi geometride; karo dikdörtgen."""
    im = Image.new("RGB", (W, Hh), (240, 238, 232)); d = ImageDraw.Draw(im)
    r, dx, dy = 7, 20, 17
    for j in range(-1, Hh // dy + 2):
        for i in range(-1, W // dx + 2):
            x = i * dx + (dx // 2 if j % 2 else 0) + 4; y = j * dy + 6
            d.ellipse([x - r, y - r, x + r, y + r], fill=(58, 62, 70))
    d.rectangle([0, 0, W - 1, Hh - 1], outline=(214, 208, 196), width=6)
    im.save(path, optimize=True)

def pencere_izgara(path, W=128, Hh=192):
    """Alt pencereler: koyu cam + çapraz (baklava) demir ızgara (F ts_17ekim_b_13, _15)."""
    im = Image.new("RGB", (W, Hh), (26, 28, 30)); d = ImageDraw.Draw(im)
    g = (62, 74, 66); a = 32
    for k in range(-Hh, W + Hh, a):
        d.line([(k, 0), (k + Hh, Hh)], fill=g, width=3); d.line([(k, Hh), (k + Hh, 0)], fill=g, width=3)
    d.rectangle([0, 0, W - 1, Hh - 1], outline=(70, 80, 72), width=5)
    im.save(path, optimize=True)

if __name__ == "__main__":
    pencere_sebeke(os.path.join(HERE, "pencere_sebeke.png"))
    pencere_izgara(os.path.join(HERE, "pencere_izgara.png"))
    almasik(os.path.join(HERE, "almasik.png"))
    pencere(os.path.join(HERE, "pencere.png"))
    kubbe_dilim(os.path.join(HERE, "kubbe_dilim.png"))
    print("tamam")
