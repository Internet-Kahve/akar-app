# AKAR · Orhan Bey Camii · v06 doku karoları (düz renkli, stilize; fotoğraf dokusu DEĞİL; ≤ 128 px, genel standart §3)
# Ref: ref/foto/IMG_8460, IMG_8484 (2020–23 restorasyonu sonrası), ts_17ekim_2, b_11, b_13, yurt2024_pdf277/281.
# Renkler genel standart §3 paletinden; karo ortalaması almasik*.png için "Almaşık düz renk" #CFA986 ±%8 (sonda doğrulanır).
# Çalıştırma: uv run --no-project --python 3.12 --with pillow python doku_uret.py   (çıktılar bu klasöre)
import os, math
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
def hx(s): return tuple(int(s[i:i + 2], 16) for i in (1, 3, 5))

TAS = [hx("#DAC8A4"), hx("#E3D3B2"), hx("#CBB790")]        # küfeki üçlüsü (standart §3: #D8C6A2 / #E6D8BA / #C4B08B; kontrast yumuşatıldı: dama tahtası görünümü olmasın)
TUGLA = [hx("#C0683F"), hx("#CF7F55"), hx("#A65535")]       # tuğla üçlüsü
KESME = [hx("#D3BE98"), hx("#DCC9A5"), hx("#C9B38C")]       # kesme taş (ayak, kaide, köşe payesi): standart §3 üçlüsü (#D3BE98 / #E2D1AF / #BFA982), kontrast yumuşatıldı
DERZ = hx("#E9DFCB")                                         # açık harç
KURSUN, KURSUN_EK = hx("#858E94"), hx("#6B747B")   # kullanıcı kararı: kubbe #C3C9CD çok açıktı → #858E94; ek çizgisi buna göre koyulaştırıldı
MERMER = hx("#ECEAE4")

def ort(path):
    im = Image.open(path).convert("RGB"); px = list(im.getdata()); n = len(px)
    return tuple(round(sum(p[i] for p in px) / n) for i in range(3))

def hucre(path, tw, th, per, tas_h, tugla_n, tugla_h, aralik, W=128, H=128, tonlar=TAS):
    """Hücre örgü: her periyotta (per m) bir taş sırası (tas_h) + tugla_n yatay tuğla sırası (tugla_h); taş sırasında `aralik` m
    aralıkla dikey tuğla; ardışık periyotlarda dikey tuğlalar yarım aralık kayar. Karo tw × th m, W × H piksel (eşit olmayan piksel
    yoğunluğu: yalnız UV ölçeği değişir)."""
    im = Image.new("RGB", (W, H), DERZ); d = ImageDraw.Draw(im)
    sx, sy = W / tw, H / th; nper = round(th / per); vt = 0.065
    for pi in range(nper):
        y0 = pi * per
        ys0, ys1 = round(y0 * sy), round((y0 + tas_h) * sy) - 1
        n_tas = max(1, round(tw / aralik)); off = (pi % 2) * aralik / 2
        for k in range(n_tas):
            x0 = k * aralik + off; xs0, xs1 = round((x0) * sx) + 1, round((x0 + aralik - vt) * sx) - 1
            ton = tonlar[(k + pi) % 3]
            for xs, xe in ((xs0, xs1), (xs0 - W, xs1 - W), (xs0 + W, xs1 + W)):   # sarma
                if xe >= 0 and xs < W: d.rectangle([max(xs, 0), ys0, min(xe, W - 1), ys1], fill=ton)
            xv0, xv1 = round((x0 + aralik - vt) * sx) + 1, round((x0 + aralik) * sx) - 1
            nb = 5; hb = (ys1 - ys0 + 1) / nb
            for j in range(nb):
                for xs, xe in ((xv0, xv1), (xv0 - W, xv1 - W), (xv0 + W, xv1 + W)):
                    if xe >= 0 and xs < W: d.rectangle([max(xs, 0), round(ys0 + j * hb), min(xe, W - 1), round(ys0 + (j + 1) * hb) - 2], fill=TUGLA[(j + k + pi) % 3])
        yb = y0 + tas_h
        for r in range(tugla_n):
            a, b = round((yb + r * tugla_h) * sy) + 1, round((yb + (r + 1) * tugla_h) * sy) - 1
            for k in range(round(tw / 0.3)):
                xs0, xs1 = round(k * 0.3 * sx) + 1, round((k + 1) * 0.3 * sx) - 1
                d.rectangle([xs0, a, xs1, b], fill=TUGLA[(k + r + pi) % 3])
    im.save(path, optimize=True)

def tas_kesme(path, W=128, H=128):
    """Kesme taş blokları 0,9 × 0,45 m; karo 0,9 × 0,9 m (2 sıra, ikinci sıra yarım kayık), ince açık derz."""
    im = Image.new("RGB", (W, H), DERZ); d = ImageDraw.Draw(im); h2 = H // 2
    for r in range(2):
        y0, y1 = r * h2 + 1, (r + 1) * h2 - 2
        if r == 0: d.rectangle([1, y0, W - 2, y1], fill=KESME[0])
        else:
            d.rectangle([1, y0, W // 2 - 2, y1], fill=KESME[1]); d.rectangle([W // 2 + 1, y0, W - 2, y1], fill=KESME[2])
    im.save(path, optimize=True)

def kasnak(path, W=128, H=128):
    """Kasnak: kesme taş blokları 0,6 × 0,35, 2 sıra yatay + 1 sıra dikey tuğla kaset. Karo 1,2 × 0,7 m (iki blok boyu × iki taş sırası)."""
    im = Image.new("RGB", (W, H), DERZ); d = ImageDraw.Draw(im); hh = H // 2
    for r in range(2):
        y0, y1 = r * hh + 1, (r + 1) * hh - 2; n = 2; w = W // n
        for k in range(n):
            xo = ((r % 2) * w // 2 + k * w)
            for xs, xe in ((xo + 1, xo + w - 3), (xo + 1 - W, xo + w - 3 - W)):
                if xe >= 0 and xs < W: d.rectangle([max(xs, 0), y0, min(xe, W - 1), y1], fill=KESME[(k + r) % 3])
    im.save(path, optimize=True)

def kirpi(path, W=128, H=128):
    """Kirpi (testere dişi) saçak: karo 0,4 × 0,4 m = iki 0,2 m'lik bant; her bantta 4 diş (0,1 m), tuğla ve gölge dişleri."""
    im = Image.new("RGB", (W, H), DERZ); d = ImageDraw.Draw(im); hh = H // 2; dw = W // 4
    for b in range(2):
        y0 = b * hh
        d.rectangle([0, y0 + 2, W - 1, y0 + hh - 3], fill=TUGLA[2])
        for k in range(4):
            x0 = k * dw
            d.polygon([(x0 + 2, y0 + 2), (x0 + dw - 3, y0 + 2), (x0 + dw // 2, y0 + hh - 3)], fill=TUGLA[1])
            d.polygon([(x0 + dw // 2 + 2, y0 + hh - 3), (x0 + dw - 3, y0 + 2), (x0 + dw + 2, y0 + hh - 3)], fill=TUGLA[0])
    im.save(path, optimize=True)

def kurs(path, W=128, H=128):
    """Tuğla güneş kursu (radyal tuğla–taş rozet): dışta dişli halka, 24 radyal taş/tuğla dilimi, ortada tuğla disk."""
    S = 4; im = Image.new("RGB", (W * S, H * S), DERZ); d = ImageDraw.Draw(im); c = W * S / 2; R = c - 2 * S
    d.ellipse([c - R, c - R, c + R, c + R], fill=TUGLA[2])
    n = 24
    for k in range(n):
        a0, a1 = 2 * math.pi * k / n, 2 * math.pi * (k + 1) / n
        d.polygon([(c + R * 0.98 * math.cos(a0), c + R * 0.98 * math.sin(a0)), (c + R * 0.98 * math.cos((a0 + a1) / 2), c + R * 0.98 * math.sin((a0 + a1) / 2)),
                   (c + R * 0.84 * math.cos((a0 + a1) / 2), c + R * 0.84 * math.sin((a0 + a1) / 2))], fill=TUGLA[0])
    for k in range(n):
        a0, a1 = 2 * math.pi * (k + 0.1) / n, 2 * math.pi * (k + 0.9) / n
        for rr0, rr1, col in ((0.40, 0.66, KESME[1 if k % 2 else 0]), (0.68, 0.82, TUGLA[k % 2])):
            d.polygon([(c + R * rr0 * math.cos(a0), c + R * rr0 * math.sin(a0)), (c + R * rr1 * math.cos(a0), c + R * rr1 * math.sin(a0)),
                       (c + R * rr1 * math.cos(a1), c + R * rr1 * math.sin(a1)), (c + R * rr0 * math.cos(a1), c + R * rr0 * math.sin(a1))], fill=col)
    d.ellipse([c - R * 0.36, c - R * 0.36, c + R * 0.36, c + R * 0.36], fill=TUGLA[1])
    im.resize((W, H), Image.LANCZOS).save(path, optimize=True)

def kemer(path, W=128, H=64):
    """Kemer taşı: 1 açık taş dilimi + 2 tuğla dilimi radyal sırayla. u = kemer yayı boyunca (karo 0,5 m = 2 tekrar), v = bant genişliği."""
    im = Image.new("RGB", (W, H), DERZ); d = ImageDraw.Draw(im); p = W // 2
    for t in range(2):
        x0 = t * p
        d.rectangle([x0 + 1, 0, x0 + int(p * 0.52), H - 1], fill=KESME[1 - t % 2 * 0])
        d.rectangle([x0 + int(p * 0.56), 0, x0 + int(p * 0.76), H - 1], fill=TUGLA[0])
        d.rectangle([x0 + int(p * 0.80), 0, x0 + p - 2, H - 1], fill=TUGLA[1])
    im.save(path, optimize=True)

def alinlik_baklava(path, W=128, H=128):
    """Baklava (iki renkli eşkenar dörtgen kafes): tuğla #C0683F + mermer #ECEAE4. Karo 0,8 × 0,8 m (2 × 2 baklava)."""
    S = 4; im = Image.new("RGB", (W * S, H * S), MERMER); d = ImageDraw.Draw(im); w, h = W * S / 2, H * S / 2
    for i in range(-1, 3):
        for j in range(-1, 3):
            cx, cy = i * w + w / 2 * (1 if j % 2 else 0), j * h / 1.0 * 0.5 + h / 2
    for j in range(-1, 5):
        for i in range(-1, 3):
            cx = (i + (0.5 if j % 2 else 0.0)) * w + w / 2; cy = j * h / 2 + h / 2
            d.polygon([(cx, cy - h / 2 * 0.9), (cx + w / 2 * 0.9, cy), (cx, cy + h / 2 * 0.9), (cx - w / 2 * 0.9, cy)], fill=TUGLA[0])
    im.resize((W, H), Image.LANCZOS).save(path, optimize=True)

def alinlik_dama(path, W=128, H=128):
    """Dama (dama tahtası): tuğla #C0683F + mermer #ECEAE4. Karo 0,8 × 0,8 m (4 × 4 kare, 0,2 m)."""
    im = Image.new("RGB", (W, H), MERMER); d = ImageDraw.Draw(im); s = W // 4
    for i in range(4):
        for j in range(4):
            if (i + j) % 2 == 0: d.rectangle([i * s, j * s, (i + 1) * s - 1, (j + 1) * s - 1], fill=TUGLA[0])
    im.save(path, optimize=True)

def kubbe_dilim(path, W=64, Hh=64):
    """1 karo = kubbenin bir dilimi × bir kurşun levha sırası. Zemin #C3C9CD (standart §3), dilim kenarında ek çizgisi #98A1A8."""
    im = Image.new("RGB", (W, Hh), KURSUN); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 2, Hh - 1], fill=KURSUN_EK); d.rectangle([W - 3, 0, W - 1, Hh - 1], fill=KURSUN_EK)
    d.rectangle([0, Hh - 2, W - 1, Hh - 1], fill=hx("#757E85"))
    im.save(path, optimize=True)

def sebeke_alfa(path, W=128, Hh=192):
    """Alçı şebeke, alpha-cutout: beyaz alçı levha, yuvarlak delikler ŞEFFAF (gerçek delik). Arkada koyu cam levha."""
    im = Image.new("RGBA", (W, Hh), MERMER + (255,)); d = ImageDraw.Draw(im)
    r, dx, dy = 7, 20, 17
    for j in range(-1, Hh // dy + 2):
        for i in range(-1, W // dx + 2):
            x = i * dx + (dx // 2 if j % 2 else 0) + 4; y = j * dy + 6
            d.ellipse([x - r, y - r, x + r, y + r], fill=(0, 0, 0, 0))
    d.rectangle([0, 0, W - 1, Hh - 1], outline=hx("#D6CBB3") + (255,), width=6)
    im.save(path, optimize=True)

def izgara_alfa(path, W=128, Hh=192):
    """Alt pencere demir ızgara, alpha-cutout: çapraz (baklava) demir çubuklar #36413F opak, aralar şeffaf. Arkada koyu cam levha."""
    im = Image.new("RGBA", (W, Hh), (0, 0, 0, 0)); d = ImageDraw.Draw(im); g = hx("#36413F") + (255,); a = 32
    for k in range(-Hh, W + Hh, a):
        d.line([(k, 0), (k + Hh, Hh)], fill=g, width=4); d.line([(k, Hh), (k + Hh, 0)], fill=g, width=4)
    d.rectangle([0, 0, W - 1, Hh - 1], outline=g, width=6)
    im.save(path, optimize=True)

def parmaklik_alfa(path, W=128, H=64):
    """Sofa parmaklığı, alpha-cutout: karo 0,6 × 0,9 m. Dikey çubuklar (0,12 m aralık, 2 cm), alt/üst yatay çubuk, mızrak uçları."""
    im = Image.new("RGBA", (W, H * 2), (0, 0, 0, 0)); d = ImageDraw.Draw(im); g = hx("#36413F") + (255,); HH = H * 2
    n = 5; step = W / n
    for k in range(n):
        x = round(k * step + step / 2); d.rectangle([x - 2, 14, x + 1, HH - 1], fill=g)
        d.polygon([(x - 4, 14), (x + 3, 14), (x, 2)], fill=g)
    d.rectangle([0, 28, W - 1, 33], fill=g); d.rectangle([0, HH - 18, W - 1, HH - 13], fill=g)
    im.save(path, optimize=True)

def minare_tugla(path, W=128, H=128):
    """Minare gövdesi (Ulu Cami Minare_Tugla_Derzi gibi): sıralı (yarım kaymalı) tuğla, açık derz #E9DFCB. Karo 0,96 × 0,64 m (4 tuğla × 8 sıra; tuğla 0,24 × 0,08 m)."""
    im = Image.new("RGB", (W, H), DERZ); d = ImageDraw.Draw(im); bw, bh = W // 4, H // 8
    tonlar = [hx("#CF7F55"), hx("#C77A50"), hx("#D6875D")]
    for r in range(8):
        off = (r % 2) * bw // 2
        for k in range(-1, 5):
            x0 = k * bw + off
            d.rectangle([x0 + 1, r * bh + 1, x0 + bw - 2, (r + 1) * bh - 2], fill=tonlar[(k + r) % 3])
    im.save(path, optimize=True)

def avlu(path, W=128, H=128):
    """Avlu taş döşeme: #B3A590 plakalar, ince derz #A69A86 (genel standart §1). Karo 1,5 × 1,5 m, 2 × 2 plaka."""
    im = Image.new("RGB", (W, H), hx("#A69A86")); d = ImageDraw.Draw(im); h = W // 2
    for i in range(2):
        for j in range(2): d.rectangle([i * h + 1, j * h + 1, (i + 1) * h - 2, (j + 1) * h - 2], fill=hx("#B3A590"))
    im.save(path, optimize=True)

def yaprak(path, hexrenk, tohum, W=128, H=128):
    """Ağaç yaprağı: ana ton `hexrenk` zemin, üstünde küçük yaprak öbekleri (ana tonun ±%12 açık/koyu). Sarmalı çizilir (karo tekrarında dikiş yok)."""
    import random
    rnd = random.Random(tohum); taban = hx(hexrenk); im = Image.new("RGB", (W, H), taban); d = ImageDraw.Draw(im)
    def ton(f): return tuple(max(0, min(255, round(c * f))) for c in taban)
    for _ in range(190):
        x, y = rnd.randrange(W), rnd.randrange(H); rx, ry = rnd.randint(3, 8), rnd.randint(2, 5); f = rnd.choice((0.88, 0.93, 1.06, 1.12))
        for ox in (-W, 0, W):
            for oy in (-H, 0, H): d.ellipse([x + ox - rx, y + oy - ry, x + ox + rx, y + oy + ry], fill=ton(f))
    im.save(path, optimize=True)

def yaprak_nötr(path, tohum=7, W=128, H=128):
    """Tek 'Agac' malzemesi için nötr yaprak dokusu (gri, 0,86–1,00): renk köşe rengiyle (yaprak/gövde tonu) çarpılır. Sarmalı çizilir."""
    import random
    rnd = random.Random(tohum); im = Image.new("RGB", (W, H), (240, 240, 240)); d = ImageDraw.Draw(im)
    for _ in range(190):
        x, y = rnd.randrange(W), rnd.randrange(H); rx, ry = rnd.randint(3, 8), rnd.randint(2, 5); v = rnd.choice((220, 230, 250, 255)); c = (v, v, v)
        for ox in (-W, 0, W):
            for oy in (-H, 0, H): d.ellipse([x + ox - rx, y + oy - ry, x + ox + rx, y + oy + ry], fill=c)
    im.save(path, optimize=True)

def pencere_cam(path, W=32, H=32):
    im = Image.new("RGB", (W, H), hx("#3E4A55")); im.save(path, optimize=True)

if __name__ == "__main__":
    P = lambda n: os.path.join(HERE, n)
    hucre(P("almasik.png"), 1.47, 0.98, 0.49, 0.35, 2, 0.07, 0.735, tonlar=TAS)                  # ana gövde (§2): periyot 0,49 m
    hucre(P("almasik_revak.png"), 1.53, 1.02, 0.51, 0.30, 3, 0.07, 0.765, tonlar=TAS)            # revak üst duvar (§1): 1 taş 0,30 + 3 tuğla, periyot 0,51 m
    tas_kesme(P("tas_kesme.png")); kasnak(P("kasnak.png")); kirpi(P("kirpi.png")); kurs(P("kurs.png")); kemer(P("kemer.png"))
    alinlik_baklava(P("alinlik_baklava.png")); alinlik_dama(P("alinlik_dama.png")); kubbe_dilim(P("kubbe_dilim.png"))
    minare_tugla(P("minare_tugla.png")); avlu(P("avlu.png")); yaprak_nötr(P("yaprak_notr.png")); yaprak(P("yaprak_7FA35B.png"), "#7FA35B", 1); yaprak(P("yaprak_93B46A.png"), "#93B46A", 2); yaprak(P("yaprak_6E9450.png"), "#6E9450", 3); sebeke_alfa(P("sebeke_alfa.png")); izgara_alfa(P("izgara_alfa.png")); parmaklik_alfa(P("parmaklik_alfa.png")); pencere_cam(P("pencere_cam.png"))
    for n in ("almasik", "almasik_revak"):
        o = ort(P(n + ".png")); hedef = hx("#CFA986")
        print(n, "ortalama", "#%02X%02X%02X" % o, "sapma %", [round((o[i] - hedef[i]) / hedef[i] * 100, 1) for i in range(3)])
    print("tamam")
