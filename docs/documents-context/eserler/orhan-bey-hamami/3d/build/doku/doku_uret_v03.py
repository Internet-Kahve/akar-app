# AKAR · Orhan Bey Hamamı · v03 doku karoları (düz renkli, stilize; fotoğraf dokusu DEĞİL; ≤ 128 px, genel standart §3)
# Ref: Yurt 2024 Levha 94–110 (kaba yontu taş beden + seyrek tuğla hatıl, pembe horasan derz; kasnakta 1 taş + 3 tuğla, taşlar arasında
#   dikey tuğla), E cilt-1 PDF 106 «kasnaklar üç sıra tuğla ve bir sıra kesme taş». Kirpi, kubbe dilimi, şebeke, avlu ve yaprak
#   karoları Orhan Bey Camii v06 doku_uret.py ile aynı çizim (yerel kopya).
# Ortalama denetimi: kasnak_almasik.png #CFA986 ±%8 (standart §3), duvar_moloz.png ≈ #C8B49A ±%8 (plan §5).
# Çalıştırma: uv run --no-project --python 3.12 --with pillow python doku_uret_v03.py   (çıktılar bu klasöre)
#   agac_govde_notr.png: python ../../../../_kutuphane/agac_doku.py <bu klasör> --notr
import os, random
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
def hx(s): return tuple(int(s[i:i + 2], 16) for i in (1, 3, 5))

TAS = [hx("#DAC8A4"), hx("#E3D3B2"), hx("#CBB790")]        # küfeki üçlüsü (standart §3, cami v06 ile aynı)
TUGLA = [hx("#C0683F"), hx("#CF7F55"), hx("#A65535")]       # tuğla üçlüsü
DERZ = hx("#E9DFCB")                                         # açık harç
MOLOZ = [hx("#BDB4A4"), hx("#ACA493"), hx("#CFC5B2"), hx("#B8A893"), hx("#C6B9A2")]   # kaba yontu taş (F: gri-mavi ve bej); V ≥ 0,67, ortalama V ≥ 0,72 (derzle)
HORASAN = hx("#E6C8B2")                                      # F: pembemsi horasan derz
KURSUN, KURSUN_EK = hx("#858E94"), hx("#6B747B")             # kullanıcı kararı (cami v06): kurşun #858E94
MERMER = hx("#ECEAE4")

def ort(path):
    im = Image.open(path).convert("RGB"); px = list(im.getdata()); n = len(px)
    return tuple(round(sum(p[i] for p in px) / n) for i in range(3))

def hucre(path, tw, th, per, tas_h, tugla_n, tugla_h, aralik, W=128, H=128, tonlar=TAS):
    """Cami v06 ile aynı: her periyotta bir taş sırası + tugla_n tuğla sırası; taş sırasında dikey tuğla (kutu almaşık)."""
    im = Image.new("RGB", (W, H), DERZ); d = ImageDraw.Draw(im)
    sx, sy = W / tw, H / th; nper = round(th / per); vt = 0.065
    for pi in range(nper):
        y0 = pi * per
        ys0, ys1 = round(y0 * sy), round((y0 + tas_h) * sy) - 1
        n_tas = max(1, round(tw / aralik)); off = (pi % 2) * aralik / 2
        for k in range(n_tas):
            x0 = k * aralik + off; xs0, xs1 = round(x0 * sx) + 1, round((x0 + aralik - vt) * sx) - 1
            ton = tonlar[(k + pi) % 3]
            for xs, xe in ((xs0, xs1), (xs0 - W, xs1 - W), (xs0 + W, xs1 + W)):
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

def moloz(path, tw=1.2, th=1.2, W=128, H=128, tohum=5):
    """Kaba yontu taş (F Levha 95, 98, 104): 0,16–0,28 m'lik düzensiz sıralar, taş boyu 0,16–0,42 m, gri-bej taş, pembemsi horasan derz.
    Beden duvarlarında tuğla hatıl YOK (fotoğraflarda yalnız saçak ve kemerlerde tuğla). Yatayda sarmalı; düşeyde son sıra karo sınırına uyar."""
    rnd = random.Random(tohum); im = Image.new("RGB", (W, H), HORASAN); d = ImageDraw.Draw(im)
    sx, sy = W / tw, H / th
    y = 0.0
    while y < th - 0.05:
        h = min(rnd.uniform(0.16, 0.28), th - y); x = rnd.uniform(0, 0.2)
        while x < tw + 0.2:
            w = rnd.uniform(0.16, 0.42); ton = MOLOZ[rnd.randrange(len(MOLOZ))]
            jx, jy = rnd.uniform(0, 0.02), rnd.uniform(0, 0.02)
            a0, a1 = round((x + 0.018 + jx) * sx), round((x + w - 0.018) * sx); b0, b1 = round((y + 0.018 + jy) * sy), round((y + h - 0.018) * sy)
            for ox in (-W, 0, W):
                if a1 + ox >= 0 and a0 + ox < W: d.rounded_rectangle([a0 + ox, b0, a1 + ox, b1], radius=2, fill=ton)
            x += w
        y += h
    im.save(path, optimize=True)

def kirpi(path, W=128, H=128):
    """Cami v06 ile aynı: karo 0,4 × 0,4 m = iki 0,2 m'lik bant; her bantta 4 diş."""
    im = Image.new("RGB", (W, H), DERZ); d = ImageDraw.Draw(im); hh = H // 2; dw = W // 4
    for b in range(2):
        y0 = b * hh
        d.rectangle([0, y0 + 2, W - 1, y0 + hh - 3], fill=TUGLA[2])
        for k in range(4):
            x0 = k * dw
            d.polygon([(x0 + 2, y0 + 2), (x0 + dw - 3, y0 + 2), (x0 + dw // 2, y0 + hh - 3)], fill=TUGLA[1])
            d.polygon([(x0 + dw // 2 + 2, y0 + hh - 3), (x0 + dw - 3, y0 + 2), (x0 + dw + 2, y0 + hh - 3)], fill=TUGLA[0])
    im.save(path, optimize=True)

def kubbe_dilim(path, W=64, Hh=64):
    """Cami v06 ile aynı: bir dilim × bir kurşun levha sırası; zemin #858E94, dilim kenarında ek çizgisi."""
    im = Image.new("RGB", (W, Hh), KURSUN); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, 2, Hh - 1], fill=KURSUN_EK); d.rectangle([W - 3, 0, W - 1, Hh - 1], fill=KURSUN_EK)
    d.rectangle([0, Hh - 2, W - 1, Hh - 1], fill=hx("#757E85"))
    im.save(path, optimize=True)

def sebeke_alfa(path, W=128, Hh=192):
    """Cami v06 ile aynı: beyaz alçı şebeke, yuvarlak delikler şeffaf (F Levha 96, 98: kasnak pencerelerinde delikli alçı şebeke)."""
    im = Image.new("RGBA", (W, Hh), MERMER + (255,)); d = ImageDraw.Draw(im)
    r, dx, dy = 7, 20, 17
    for j in range(-1, Hh // dy + 2):
        for i in range(-1, W // dx + 2):
            x = i * dx + (dx // 2 if j % 2 else 0) + 4; y = j * dy + 6
            d.ellipse([x - r, y - r, x + r, y + r], fill=(0, 0, 0, 0))
    d.rectangle([0, 0, W - 1, Hh - 1], outline=hx("#D6CBB3") + (255,), width=6)
    im.save(path, optimize=True)

def avlu(path, W=128, H=128):
    """Cami v06 ile aynı: #B3A590 plakalar, derz #A69A86; karo 1,5 × 1,5 m."""
    im = Image.new("RGB", (W, H), hx("#A69A86")); d = ImageDraw.Draw(im); h = W // 2
    for i in range(2):
        for j in range(2): d.rectangle([i * h + 1, j * h + 1, (i + 1) * h - 2, (j + 1) * h - 2], fill=hx("#B3A590"))
    im.save(path, optimize=True)

def yaprak_notr(path, tohum=7, W=128, H=128):
    """Cami v06 ile aynı: nötr yaprak dokusu; renk köşe rengiyle çarpılır."""
    rnd = random.Random(tohum); im = Image.new("RGB", (W, H), (240, 240, 240)); d = ImageDraw.Draw(im)
    for _ in range(190):
        x, y = rnd.randrange(W), rnd.randrange(H); rx, ry = rnd.randint(3, 8), rnd.randint(2, 5); v = rnd.choice((220, 230, 250, 255)); c = (v, v, v)
        for ox in (-W, 0, W):
            for oy in (-H, 0, H): d.ellipse([x + ox - rx, y + oy - ry, x + ox + rx, y + oy + ry], fill=c)
    im.save(path, optimize=True)

if __name__ == "__main__":
    P = lambda n: os.path.join(HERE, n)
    hucre(P("kasnak_almasik.png"), 1.53, 1.02, 0.51, 0.30, 3, 0.07, 0.765)     # E: 1 kesme taş 0,30 + 3 tuğla; periyot 0,51 m (F: 6 periyot ≈ 3 m)
    moloz(P("duvar_moloz.png")); kirpi(P("kirpi.png")); kubbe_dilim(P("kubbe_dilim_v03.png"))
    sebeke_alfa(P("sebeke_alfa.png")); avlu(P("avlu.png")); yaprak_notr(P("yaprak_notr.png"))
    def fark(a, b): return max(abs(x - y) / y for x, y in zip(a, b))
    for n, hedef in (("kasnak_almasik", "#CFA986"), ("duvar_moloz", "#C8B49A")):
        o = ort(P(n + ".png")); print(n, "ortalama #%02X%02X%02X" % o, "hedef", hedef, "fark %.1f%%" % (100 * fark(o, hx(hedef))))
