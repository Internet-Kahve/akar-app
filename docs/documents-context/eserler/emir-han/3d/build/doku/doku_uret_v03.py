# AKAR · Emir Hanı · v03 doku karoları (genel sahne standardı §3; düz renkli, stilize; fotoğraf dokusu DEĞİL)
# Çalıştırma: uv run --no-project --with pillow python doku_uret_v03.py   (çıktılar bu klasöre yazılır)
# Kaynak: F 1578509543 / 1578509455 / Emir-Hani-1 (dış: moloz taş), F Emir-Hani-2/4/5 + Kqg5B5q (avlu: 2 tuğla + 1 küfeki almaşık,
# ayaklarda kesme taş + ince tuğla hatıl), E PDF 108 (iki sıra tuğla + bir sıra küfeki).
# Kopya karolar: parke.png, pencere_v04.png ← koza-han/3d/build/doku. kirpi_emir/baca_emir: Orhan kirpi.png ve Koza baca() düzeni, Emir tuğla tonuyla.
import os, random
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
TUGLA = [(176, 106, 74), (191, 124, 92), (152, 90, 62)]     # #B06A4A / #BF7C5C / #985A3E — K (19 Ekim, onay A): «görsellere göre uyarla»; F Emir-Hani-1/4, 685999…: mat kırmızı-kahve,
                                                             # plan §6 #C0683F ile Ulu Cami minare tuğlası #986B4D arası. Sapma renkler.json'da.
KUFEKI = [(216, 198, 162), (230, 216, 186), (196, 176, 139)]  # #D8C6A2 / #E6D8BA / #C4B08B
KESME = [(211, 190, 152), (226, 209, 175), (191, 169, 130)]   # #D3BE98 / #E2D1AF / #BFA982 (Ulu Cami cephesiyle aynı)
HARC = (233, 223, 203)                                        # #E9DFCB


def ort(im):
    px = list(im.convert("RGB").getdata()); n = len(px)
    return tuple(round(sum(p[i] for p in px) / n) for i in range(3))


def duvar_emir(path, W=128):
    """Dış cephe: moloz taş (düzensiz sıralar, taş 0,25–0,5 m) + seyrek tuğla parçası. Karo 2,0 × 2,0 m, dikişsiz. Hedef ortalama ≈ #C8B49A (plan §6)."""
    rnd = random.Random(7)
    im = Image.new("RGB", (W, W), (214, 203, 182)); d = ImageDraw.Draw(im)
    TON = [(196, 176, 146), (182, 164, 138), (206, 188, 156), (176, 160, 136), (190, 168, 132), (200, 186, 162)]
    satirlar = [20, 24, 18, 22, 22, 22]                       # 128 px = 2,0 m → sıra 0,28–0,38 m
    y = 0
    for k, h in enumerate(satirlar):
        x = -rnd.randint(0, 16)
        while x < W + 16:
            w = rnd.randint(16, 32); hh = h - rnd.randint(1, 4); oy = rnd.randint(0, 2)
            renk = TUGLA[rnd.randint(0, 2)] if rnd.random() < 0.03 else TON[rnd.randint(0, len(TON) - 1)]
            for ox in (0, -W, W):
                d.rounded_rectangle([x + ox + 1, y + oy + 1, x + ox + w - 2, y + oy + hh - 2], radius=3, fill=renk)
            x += w
        y += h
    im.save(path, optimize=True); return ort(im)


def almasik_emir(path, W=128, Hh=76):
    """Avlu cepheleri (revak üstü ve oda duvarı): 2 sıra tuğla + 1 sıra küfeki (E PDF 108; F Emir-Hani-4/5). Karo 1,2 m × 0,71 m
    (tuğla sırası 0,12 + derz 0,03; taş sırası 0,22). Ortalama 'Almaşık düz renk' #CFA986 ±%8 (standart §3 doku kuralı)."""
    im = Image.new("RGB", (W, Hh), HARC); d = ImageDraw.Draw(im)
    tb, dz, tl = 13, 2, 40                                    # 128 px / 1,2 m ≈ 107 px/m
    for r in range(2):
        y0 = dz + r * (tb + dz); off = (r % 2) * tl // 2
        for k in range(-1, W // tl + 2):
            x0 = k * tl - off
            d.rectangle([x0 + 1, y0, x0 + tl - dz, y0 + tb - 1], fill=TUGLA[(k + r) % 3])
    ys = 2 * (tb + dz) + dz; ye = Hh - dz
    tw = 64
    for k in range(2):
        x0 = k * tw + 1
        d.rectangle([x0, ys, x0 + tw - dz, ye - 1], fill=KUFEKI[k % 3])
    im.save(path, optimize=True); return ort(im)


def ayak_emir(path, W=128, Hh=128):
    """Revak ayakları: muntazam kesme taş sıraları + her 0,6 m'de iki sıra ince tuğla hatıl (E Vakıf PDF 176 «muntazam kesme taş»;
    F Kqg5B5q, emirhan-bursa-ulucami3). Karo 1,2 × 1,2 m."""
    im = Image.new("RGB", (W, Hh), HARC); d = ImageDraw.Draw(im)
    blok = 64                                                 # 0,6 m: 2 tuğla (2×6 px) + kesme taş
    for b in range(2):
        y = b * blok
        for r in range(2):
            d.rectangle([0, y + 1 + r * 7, W - 1, y + 5 + r * 7], fill=TUGLA[(b + r) % 3])
        ys = y + 15; ye = y + blok - 2; tw = 42; off = (b % 2) * 21
        for k in range(-1, W // tw + 2):
            x0 = k * tw - off
            d.rectangle([x0 + 1, ys, x0 + tw - 2, ye], fill=KESME[(k + b) % 3])
    im.save(path, optimize=True); return ort(im)


def kirpi_emir(path, W=128, Hh=128):
    """İki sıra kirpi (testere dişi) tuğla saçak (E PDF 108; Orhan Bey kirpi.png düzeni, Emir tuğla tonları). Karo 0,4 × 0,4 m:
    her sıra 0,2 m; üstte ince harç, dişler aşağı bakar, diş arası gölge tonu."""
    im = Image.new("RGB", (W, Hh), HARC); d = ImageDraw.Draw(im)
    for r in range(2):
        y0 = r * Hh // 2 + 4; y1 = (r + 1) * Hh // 2 - 2
        d.rectangle([0, y0, W, y1], fill=TUGLA[2])
        n = 4; dw = W / n
        for k in range(n):
            x0 = k * dw; d.polygon([(x0 + 1, y0), (x0 + dw - 1, y0), (x0 + dw / 2, y1)], fill=TUGLA[(k + r) % 2])
    im.save(path, optimize=True); return ort(im)


def baca_emir(path, W=128, Hh=256):
    """Koza Han doku_uret_v04.baca() kopyası (yöntem aynı), Emir tuğla tonlarıyla; açıklıklar saf siyah değil #3E4A55 (standart §3).
    F Emir-Hani-1, 685999…: tuğla gövde, üstte iki sivri kemerli açıklık, dişli kuşak. Karo = bir yüzün tamamı."""
    im = Image.new("RGB", (W, Hh), HARC); d = ImageDraw.Draw(im)
    tb, dz, tl = 12, 3, 42
    for r in range(Hh // (tb + dz) + 1):
        y0 = Hh - (r + 1) * (tb + dz); off = (r % 2) * tl // 2
        for k in range(-1, W // tl + 2):
            x0 = k * tl - off
            d.rectangle([x0, y0, x0 + tl - dz, y0 + tb - 1], fill=TUGLA[(k + r) % 3])
    dk = int(Hh * 0.08)
    d.rectangle([0, 0, W, dk], fill=(110, 96, 86))
    for k in range(6):
        x = k * W // 6 + W // 24; d.rectangle([x, 2, x + W // 12, dk - 2], fill=(226, 218, 204))
    for cx in (0.3, 0.7):
        w2 = W * 0.11; x0, x1 = W * cx - w2, W * cx + w2
        yt, ys, yb = Hh * 0.13, Hh * 0.22, Hh * 0.47
        d.polygon([(x0, yb), (x0, ys), (W * cx, yt), (x1, ys), (x1, yb)], fill=(62, 74, 85))
    im.save(path, optimize=True); return ort(im)


def korkuluk_beyaz_alpha(path, W=128, Hh=128):
    """Üst kat revak korkuluğu, GERÇEK DELİKLİ (alpha kesme; Koza korkuluk_kesme_alpha yöntemi). F Emir-Hani-2/4/5, 1578509890:
    beyaz boyalı demir: üst küpeşte, alt kayıt, 0,125 m aralı dikmeler, ortada S kıvrımlı halka sırası. Karo 1,0 × 1,0 m."""
    BEYAZ = (237, 235, 230, 255)
    im = Image.new("RGBA", (W, Hh), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W - 1, 7], fill=BEYAZ); d.rectangle([0, Hh - 10, W - 1, Hh - 5], fill=BEYAZ)
    for k in range(8):
        x = k * W // 8 + 6; d.rectangle([x, 7, x + 2, Hh - 6], fill=BEYAZ)
    for k in range(8):
        cx = k * W // 8 + 6 + W // 16; d.ellipse([cx - 6, 30, cx + 6, 56], outline=BEYAZ, width=3)
    d.rectangle([0, 60, W - 1, 63], fill=BEYAZ)
    im.save(path, optimize=True); return ort(im)


def yaprak_notr(path, tohum=7, W=128, H=128):
    """Orhan Bey Külliyesi doku_uret.yaprak_nötr() kopyası: tek 'Agac' malzemesi için nötr yaprak dokusu (gri 0,86–1,00);
    renk köşe rengiyle (yaprak/gövde/tarh tonu) çarpılır. Sarmalı çizilir (dikiş yok)."""
    rnd = random.Random(tohum); im = Image.new("RGB", (W, H), (240, 240, 240)); d = ImageDraw.Draw(im)
    for _ in range(190):
        x, y = rnd.randrange(W), rnd.randrange(H); rx, ry = rnd.randint(3, 8), rnd.randint(2, 5); v = rnd.choice((220, 230, 250, 255)); c = (v, v, v)
        for ox in (-W, 0, W):
            for oy in (-H, 0, H): d.ellipse([x + ox - rx, y + oy - ry, x + ox + rx, y + oy + ry], fill=c)
    im.save(path, optimize=True); return ort(im)


if __name__ == "__main__":
    for fn, ad in ((duvar_emir, "duvar_emir.png"), (almasik_emir, "almasik_emir.png"), (ayak_emir, "ayak_emir.png"), (kirpi_emir, "kirpi_emir.png"),
                   (baca_emir, "baca_emir.png"), (korkuluk_beyaz_alpha, "korkuluk_beyaz_alpha.png"), (yaprak_notr, "yaprak_notr.png")):
        o = fn(os.path.join(HERE, ad)); print(ad, "ortalama #%02X%02X%02X" % o)
