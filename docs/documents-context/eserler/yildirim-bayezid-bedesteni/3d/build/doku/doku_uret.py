# AKAR · Bedesten · v04 doku karoları (düz renkli, stilize; fotoğraf dokusu DEĞİL)
# v04: renkler genel standarda (_GENEL_SAHNE_STANDARDI.md §3) ve SONNET_REVIZYON_PLANI.md §4–5 bağlandı.
#   almasik.png   : v04b kutu almaşık, 1 karo = 1,04 × 0,88 m (taş ≈ 0,43 × 0,28, 2 sıra yatay tuğla, dikey tuğla 0,09). F 2024 fotoğrafları, T ölçüler
#   kubbe_dilim.png: kurşun koyu ton #AEB6BC, dilim ekleri #8E979D (v04b); cati_ek.png aynı
#   pencere.png   : cam #3E4A55, demir şebeke #36413F, söve #ECEAE4
# Çalıştırma: python doku_uret.py   (Pillow gerekir; çıktılar bu klasöre ve doku_istatistik.json)
import os, json, random
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
def hx(s): return tuple(int(s[i:i + 2], 16) for i in (1, 3, 5))

TUGLA = [hx("#C0683F"), hx("#CF7F55"), hx("#A65535")]      # standart §3 tuğla (ana / açık / gölge)
TAS = [hx("#D8C6A2"), hx("#E6D8BA"), hx("#C4B08B")]        # standart §3 küfeki
DERZ = hx("#E9DFCB")                                       # standart §3 harç (açık)
HEDEF = hx("#CFA986")                                      # standart §3 almaşık düz renk ortalaması
W_TUGLA = (0.15, 0.70, 0.15)   # plan §4 (19 Ekim): tuğlada #CF7F55 ağırlıklı
W_TAS = (0.40, 0.50, 0.10)     # plan §4: taşta açık uç (#E6D8BA, #D8C6A2) ağırlıklı; #C4B08B az  [sıra: #D8C6A2, #E6D8BA, #C4B08B]

def almasik(path, W=128, Hh=108, seed=4):
    """v04b (19 Ekim, A incelemesi): KUTU ALMAŞIK. F: ekinci2025_pdf084 / 685fff (2024): her taş tuğla ile çerçeveli; taş sıraları sık,
    aralarda ince tuğla sırası ve taşlar arasında dikey tuğla. 1 karo = 1,04 m (genişlik) × 0,88 m (yükseklik), iki sıra (şaşırtmalı).
    Taş ≈ 0,43 × 0,28 m; yatay tuğla bandı 2 sıra (2 × 0,055 + derz 1 cm); dikey tuğla 0,09 m. T: ölçüler fotoğraftan (çözünürlük düşük).
    Ortalama standart §3 #CFA986 ±%8 içinde kalacak biçimde tuğla payı ayarlandı."""
    rnd = random.Random(seed)
    im = Image.new("RGB", (W, Hh), DERZ); d = ImageDraw.Draw(im)
    ppm = W / 1.04
    dz = max(round(0.010 * ppm), 1)                     # 1 cm derz
    # taş yüksekliği satırdan kalan (≈ 0,30 m); taş boyu per_x − dikey tuğla
    bh = round(0.055 * ppm); vb = round(0.09 * ppm)      # tuğla sırası yüksekliği, dikey tuğla genişliği
    per_y = Hh // 2; per_x = W // 2
    for r in range(2):
        y0 = r * per_y
        # yatay tuğla bandı (2 sıra) satırın üstünde
        for k in range(2):
            yy = y0 + dz + k * (bh + dz)
            off = ((r * 2 + k) % 2) * round(0.12 * ppm)
            tl = round(0.24 * ppm)
            for x0 in range(-tl, W + tl, tl):
                d.rectangle([x0 + off + dz // 2, yy, x0 + off + tl - dz // 2 - 1, yy + bh - 1], fill=rnd.choices(TUGLA, W_TUGLA)[0])
        ys = y0 + dz + 2 * (bh + dz)                     # taş sırası başlangıcı
        ye = y0 + per_y - dz - 1                       # taş satırın kalanını doldurur (≈ 0,30 m)
        shift = (r % 2) * (per_x // 2)
        renk = [rnd.choices(TAS, W_TAS)[0] for _ in range(2)]        # karo kenarında bölünen taş iki yanda aynı tonu alsın (c ve c+2)
        for c in range(-1, 3):
            xb = c * per_x + shift
            # dikey tuğla (taşlar arasında, üst üste kısa tuğlalar)
            for yy in range(ys, ye + 1, bh + dz):
                d.rectangle([xb + dz // 2, yy, xb + vb - dz // 2 - 1, min(yy + bh - 1, ye)], fill=rnd.choices(TUGLA, W_TUGLA)[0])
            d.rectangle([xb + vb + dz // 2, ys, xb + per_x - dz // 2 - 1, ye], fill=renk[c % 2])
    im.save(path, optimize=True)
    px = list(im.get_flattened_data()) if hasattr(im, "get_flattened_data") else list(im.getdata()); n = len(px)
    if px and not isinstance(px[0], tuple): px = [tuple(px[i:i + 3]) for i in range(0, len(px), 3)]; n = len(px)
    return tuple(round(sum(p[i] for p in px) / n, 1) for i in range(3))

def pencere(path, W=128, Hh=192):
    """Beyaz taş söve #ECEAE4 + cam #3E4A55 + demir şebeke #36413F (4 dikey × 6 yatay)."""
    im = Image.new("RGB", (W, Hh), hx("#ECEAE4")); d = ImageDraw.Draw(im)
    b = 16; cam = hx("#3E4A55"); demir = hx("#36413F")
    d.rectangle([b, b, W - b - 1, Hh - b - 1], fill=cam)
    iw, ih = W - 2 * b, Hh - 2 * b
    for k in range(1, 5):
        x = b + iw * k // 5; d.rectangle([x - 2, b, x + 2, Hh - b - 1], fill=demir)
    for k in range(1, 7):
        y = b + ih * k // 7; d.rectangle([b, y - 2, W - b - 1, y + 2], fill=demir)
    d.rectangle([b, b, W - b - 1, Hh - b - 1], outline=demir, width=3)
    im.save(path, optimize=True)

def kubbe_dilim(path, W=64, Hh=64):
    """1 karo = bir dilim (u) × bir kurşun levha sırası (v). Zemin #AEB6BC, dilim kenarı ek çizgisi #8E979D, alt ek açık ton."""
    im = Image.new("RGB", (W, Hh), hx("#AEB6BC")); d = ImageDraw.Draw(im)      # v04b: palet kurşun koyu tonu (V 0,74 ≥ 0,72)
    koyu, acik = hx("#8E979D"), hx("#BCC3C8")
    d.rectangle([0, 0, 2, Hh - 1], fill=koyu); d.rectangle([W - 3, 0, W - 1, Hh - 1], fill=koyu)
    d.rectangle([0, Hh - 1, W - 1, Hh - 1], fill=acik)
    im.save(path, optimize=True)

def cati_ek(path, W=64, Hh=64):
    """Bant çatısı: kurşun #AEB6BC, ek çizgisi #8E979D. 1 karo = 0,6 m (u: ek aralığı), ek çizgisi eğim doğrultusunda."""
    im = Image.new("RGB", (W, Hh), hx("#AEB6BC")); d = ImageDraw.Draw(im)      # v04b: koyu kurşun tonu
    d.rectangle([0, 0, 2, Hh - 1], fill=hx("#8E979D"))
    im.save(path, optimize=True)

def vitrin(path, V=128, Hh=240):
    """3 varyant yan yana (atlas 3V × Hh). Her biri 1,90 m × 3,55 m (z −0,2 … 3,35). Koyu metal kayıt #36413F, cam #9FB8C0,
    arkada sıcak iç ışık #E8C99A; kemer tepesi (z > 2,40) yatay kayıtlı cam."""
    metal, cam, sicak = hx("#36413F"), hx("#9FB8C0"), hx("#E8C99A")
    im = Image.new("RGB", (3 * V, Hh), metal); d = ImageDraw.Draw(im)
    pz = Hh / 3.55; pw = V / 1.90
    Y = lambda z: Hh - (z + 0.2) * pz                      # z (m) → piksel y
    def pane(x0, x1, z0, z1):
        d.rectangle([x0, Y(z1), x1, Y(z0)], fill=cam)
        ys = Y(z0 + (z1 - z0) * 0.38)                      # alt kısım: içerideki sıcak ışık (raf/ürün bandı)
        d.rectangle([x0, ys, x1, Y(z0)], fill=sicak)
        d.rectangle([x0, ys, x1, ys + 1], fill=metal)
    kay = max(round(0.04 * pw), 2)
    for v in range(3):
        ox = v * V
        d.rectangle([ox, Y(0.35), ox + V - 1, Y(-0.2)], fill=metal)                    # alt dolgu paneli (kepenk kasası)
        # dikey vitrin alanı z 0,35–2,40
        if v == 0: bol = [0.0, 0.33, 0.67, 1.0]; tr = 1.75
        elif v == 1: bol = [0.0, 0.50, 1.0]; tr = 1.55
        else: bol = [0.0, 0.25, 0.50, 0.75, 1.0]; tr = 1.95
        for a, b_ in zip(bol[:-1], bol[1:]):
            x0 = ox + a * V + kay; x1 = ox + b_ * V - kay
            pane(x0, x1, 0.35 + 0.04, tr - 0.03); pane(x0, x1, tr + 0.03, 2.40 - 0.02)
        d.rectangle([ox, Y(tr + 0.03), ox + V - 1, Y(tr - 0.03)], fill=metal)          # kayıt: transom
        d.rectangle([ox, Y(2.40 + 0.02), ox + V - 1, Y(2.40 - 0.02)], fill=metal)      # üzengi kaydı
        if v == 1: d.rectangle([ox + 0.50 * V + 4, Y(1.3), ox + 0.50 * V + 7, Y(0.95)], fill=metal)   # kapı kolu
        # kemer tepesi: yatay kayıtlı cam
        d.rectangle([ox, Y(3.36), ox + V - 1, Y(2.42)], fill=cam)
        for z in (2.62, 2.84, 3.06, 3.26): d.rectangle([ox, Y(z + 0.015), ox + V - 1, Y(z - 0.015)], fill=metal)
        d.rectangle([ox, Y(3.36), ox + V - 1, Y(3.36) + 1], fill=metal)
        for x in (ox, ox + V - 2): d.rectangle([x, 0, x + 1, Hh - 1], fill=metal)      # yan çerçeve
    im.save(path, optimize=True)

if __name__ == "__main__":
    ort = almasik(os.path.join(HERE, "almasik.png"))
    pencere(os.path.join(HERE, "pencere.png"))
    kubbe_dilim(os.path.join(HERE, "kubbe_dilim.png"))
    cati_ek(os.path.join(HERE, "cati_ek.png"))
    vitrin(os.path.join(HERE, "dukkan_vitrin.png"))
    sapma = [round((o - h) / h * 100, 1) for o, h in zip(ort, HEDEF)]
    istat = {"almasik_ortalama_rgb": ort, "hedef_rgb": HEDEF, "kanal_sapma_yuzde": sapma}
    json.dump(istat, open(os.path.join(HERE, "doku_istatistik.json"), "w"), indent=1)
    print("tamam", istat)
