# AKAR · Koza Han · v02e doku karoları (düz renkli, stilize; fotoğraf dokusu DEĞİL)
# Ref: ref img/pencere_ref.webp (cephe yakın fotoğrafı): almaşık duvar ve demir parmaklıklı pencere.
# Çalıştırma: uv run --with pillow python doku_uret.py   (çıktılar bu klasöre yazılır)
import os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))

TAS = [(203, 191, 168), (196, 183, 159), (209, 198, 177)]   # kesme taş (bej-gri)
TUGLA = [(201, 124, 96), (190, 112, 84), (210, 137, 110)]   # tuğla (v02f: kızıl ton açıldı; v02e: 180,85,58 …)
DERZ = (216, 207, 192)                                        # harç

def almasik(path, W=512, Hh=256):
    """1 karo = 1,2 m × 0,6 m. Üstte 3 sıra tuğla, altta taş sırası; taşların arasında dikey tuğla (kloisonné)."""
    im = Image.new("RGB", (W, Hh), DERZ); d = ImageDraw.Draw(im)
    tb, dz, tl = 26, 4, 107                                   # tuğla yüksekliği, harç, tuğla boyu (px); fotoğrafta tuğla baskın
    for r in range(3):                                        # 3 sıra tuğla, şaşırtmalı
        y0 = dz + r * (tb + dz); off = (r % 2) * tl // 2
        for k in range(-1, W // tl + 2):
            x0 = k * tl - off + dz // 2
            d.rectangle([x0, y0, x0 + tl - dz, y0 + tb - 1], fill=TUGLA[(k + r) % 3])
    ys = 3 * (tb + dz) + dz; ye = Hh - dz // 2                # taş sırası
    tw, dk = 210, 46                                           # taş genişliği, dikey tuğla şeridi
    for k in range(2):
        x0 = dz // 2 + k * (tw + dk)
        d.rectangle([x0, ys, x0 + tw - dz, ye - 1], fill=TAS[k % 3])
        xb = x0 + tw                                           # dikey tuğlalar (üst üste 4 adet)
        h4 = (ye - ys) // 4
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
    d.rectangle([b, b, W - b - 1, Hh - b - 1], outline=(90, 58, 40), width=3)   # ahşap kasa
    im.save(path, optimize=True)

def kesme_tas(path, W=512, Hh=256):
    """v02f: avlu üst katı — kesme taş, şaşırtmalı sıralar, iki ton (ref: avlu fotoğrafları). 1 karo = 1,2 × 0,6 m; 2 sıra × 0,3 m."""
    TON = [(216, 210, 198), (204, 197, 183), (222, 217, 207)]
    im = Image.new("RGB", (W, Hh), (230, 226, 218)); d = ImageDraw.Draw(im)
    rh, bl, dz = Hh // 2, W // 2, 4                           # sıra yüksekliği, blok boyu (0,6 m), derz
    for r in range(2):
        off = (r % 2) * bl // 2
        for k in range(-1, 3):
            x0 = k * bl - off + dz // 2
            d.rectangle([x0, r * rh + dz // 2, x0 + bl - dz, (r + 1) * rh - dz // 2 - 1], fill=TON[(k * 2 + r) % 3])
    im.save(path, optimize=True)

def korkuluk(path, W=256, Hh=384):
    """v02f: üst kat beyaz korkuluk — üst ve alt küpeşte, arada 4 baba (aralar koyu). 1 karo = 0,6 × 0,9 m."""
    BEYAZ, ARA = (241, 239, 234), (58, 61, 64)
    im = Image.new("RGB", (W, Hh), ARA); d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, int(Hh * 0.14)], fill=BEYAZ)                     # üst küpeşte
    d.rectangle([0, int(Hh * 0.88), W, Hh], fill=BEYAZ)                    # alt kuşak
    bw = W // 8
    for k in range(4):                                                     # babalar
        x = k * W // 4 + W // 8 - bw // 2
        d.rectangle([x, int(Hh * 0.14), x + bw, int(Hh * 0.88)], fill=BEYAZ)
    im.save(path, optimize=True)

def portal_on(path, W_M=10.4, H_M=10.6, px=2048, kapi_w=5.0, kzs=4.5, r_ip=0.24, kose=None, orgu=False):
    """v02h: portal ön yüzü (ref img/portal_on_1.webp, portal_on_2.webp). Halatlar geometri; bu karo aradaki düz yüz:
    kesme taş zemin, kahverengi kakma çizgiler (yan ve üst bantta altıgen zincir), kemer köşeliklerinde mavi
    sekiz köşeli yıldız örgüsü. Koordinatlar metre: x ∈ [−W/2, W/2], z ∈ [0, H] (0 = zemin); 2× çizilip küçültülür."""
    from PIL import ImageFilter
    S = 2                                                     # süper örnekleme
    k = px * S / W_M; Wp, Hp = int(W_M * k), int(H_M * k)
    X = lambda x: (x + W_M / 2) * k; Y = lambda z: (H_M - z) * k
    P_ = lambda x, z: (X(x), Y(z))
    TAS, KAHVE, MAVI = (217, 205, 182), (160, 96, 63), (64, 170, 214)
    im = Image.new("RGB", (Wp, Hp), TAS); d = ImageDraw.Draw(im)
    lk, lm = int(0.04 * k), int(0.055 * k)                    # kahve ve mavi çizgi kalınlığı
    def cizgi(pts, c, w): d.line([P_(*p) for p in pts], fill=c, width=w, joint="curve")
    xo, xi, zt, zb_ = W_M / 2 - 0.6, W_M / 2 - 1.6, H_M - 0.6, H_M - 1.6   # bant sınırları (dış halatın içi)
    if kose:                                                  # v02l: mavi kemer çizgisi tepede üst mavi çizgiye değer (sivri köşe),
        r_b = kapi_w / 2 + 2 * r_ip + 0.4                     #   iç kahverengi çerçevenin üstü onun hemen üstüne iner
        zb_ = kzs + r_b + 0.15
    if orgu:
        # v02m: kiremit renkli örgü (ref img/portal_orgu.png, tasarım sorumlusunun çizimi; altı fotoğrafa göre tamamlandı):
        #   dış tek çizgi → iki iplikli örgü bandı (XX çiftleri + aralarında uzun altıgen) → iç tek çizgi. İplikler köşelerde
        #   bant kenarında döner; her bantta XX çifti sayısı tam olduğundan iplikler bandın sonunda kendi kenarına döner.
        KIREMIT = (178, 84, 54); lo = int(0.045 * k)
        z_t = kzs + r_b; xL, zL = W_M / 2 - 0.7, H_M - 0.74      # dış çizgi (halatın hemen içi)
        xB1, zB1 = xL - 0.18, zL - 0.16                          # bandın dış kenarı
        xI, zI = xi, z_t + 0.15                                  # iç çizgi (mavi köşeliğin hemen üstü)
        xB2, zB2 = xI + 0.18, zI + 0.18                          # bandın iç kenarı
        def kir(pts): d.line([P_(*p) for p in pts], fill=KIREMIT, width=lo, joint="curve")
        kir([(-xL, 0.3), (-xL, zL), (xL, zL), (xL, 0.3)]); kir([(-xI, 0.3), (-xI, zI), (xI, zI), (xI, 0.3)])
        def bant(t0, t1, e_dis, e_ic, eksen):
            """t boyunca örgü: iki iplik; e_dis/e_ic bant kenarlarının sabit koordinatı; eksen 'z' (dikey bant) ya da 'x' (yatay)."""
            c_, s_ = 0.27, 0.12; L_ = abs(t1 - t0); n = max(round((L_ - 1.0) / (1.0 + 2 * c_ + s_)), 1)
            Lg = (L_ - n * (2 * c_ + s_)) / (n + 1); sg = 1 if t1 > t0 else -1
            olay = []; t = t0 + sg * Lg
            for _ in range(n):
                olay += [(t, t + sg * c_), (t + sg * (c_ + s_), t + sg * (2 * c_ + s_))]; t += sg * (2 * c_ + s_ + Lg)
            for ilk, son in ((e_dis, e_ic), (e_ic, e_dis)):
                kenar = ilk; yol = [(t0, kenar)]
                for a, b in olay:
                    yol += [(a, kenar)]; kenar = son if kenar == ilk else ilk; yol += [(b, kenar)]
                yol += [(t1, kenar)]
                kir([(e, tt) if eksen == "z" else (tt, e) for tt, e in yol])
        for s in (-1, 1):
            bant(0.3, zB2 - 0.25, s * xB1, s * xB2, "z")                                   # yan bantlar (alttan yukarı)
            kir([(s * xB1, zB2 - 0.25), (s * xB1, zB1), (s * (xB2 - 0.25), zB1)])          # köşe: dış kenar döner
            kir([(s * xB2, zB2 - 0.25), (s * xB2, zB2), (s * (xB2 - 0.25), zB2)])          # köşe: iç kenar döner
        bant(-(xB2 - 0.25), xB2 - 0.25, zB1, zB2, "x")                                     # üst bant
        zb_ = zI
    else:
        # kahverengi çerçeve çizgileri
        cizgi([(-xo, 0.3), (-xo, zt), (xo, zt), (xo, 0.3)], KAHVE, lk)
        cizgi([(-xi, 0.3), (-xi, zb_), (xi, zb_), (xi, 0.3)], KAHVE, lk)
    def zincir(c0, c1, sabit, dikey):
        """Bant boyunca altıgen zincir: uzun altıgenler + aralarında çapraz (X) bağlar."""
        L = abs(c1 - c0); n = max(int(L / 1.55), 1); p = L / n; bw = (xo - xi)
        hw, hh, ht = bw * 0.3, p * 0.28, p * 0.42             # altıgen yarı genişlik, omuz, uç
        for i in range(n):
            m = min(c0, c1) + p * (i + 0.5)
            hx = [(0, ht), (hw, hh), (hw, -hh), (0, -ht), (-hw, -hh), (-hw, hh), (0, ht)]
            to = (lambda a, b: (sabit + a, m + b)) if dikey else (lambda a, b: (m + b, sabit + a))
            cizgi([to(a, b) for a, b in hx], KAHVE, lk)
            if i < n - 1:                                     # sonraki altıgene çapraz bağ
                m2 = m + p
                to2 = (lambda a, b: (sabit + a, m2 + b)) if dikey else (lambda a, b: (m2 + b, sabit + a))
                cizgi([to(hw, hh), to2(-hw, -hh)], KAHVE, lk); cizgi([to(-hw, hh), to2(hw, -hh)], KAHVE, lk)
    if not orgu:
        for s in (-1, 1): zincir(0.3, zb_, s * (xo + xi) / 2, True)
        zincir(-xo, xo, (zt + zb_) / 2, False)
    if kose:
        # v02l: mavi köşelik = tasarım sorumlusunun çizimi (ref img/portal_kose.png) birebir: mavi pikseller ayıklanıp
        #   sağ köşeliğin kutusuna (orta eksen → yan mavi çizgi, kemerin yan çizgiye değdiği kot → üst mavi çizgi) oturtulur,
        #   sol köşeliğe aynalanır. Çizimde üst çizgi, yan çizgi ve kemer çizgisi sivri uçlarda buluşur.
        from PIL import ImageOps
        xs_ = xi - 0.12; z_t = kzs + r_b; z_a = kzs + math.sqrt(max(r_b ** 2 - xs_ ** 2, 0.01))
        src = Image.open(kose).convert("RGB")
        m = Image.new("L", src.size, 0)                      # mavi piksel maskesi
        px_ = src.load(); mp = m.load()
        for yy in range(src.height):
            for xx in range(src.width):
                r, g_, b = px_[xx, yy]
                if b > 140 and b - r > 60: mp[xx, yy] = 255
        m = m.crop(m.getbbox())
        bw_, bh_ = int(X(xs_) - X(0)), int(Y(z_a) - Y(z_t))
        m = m.resize((bw_, bh_), Image.LANCZOS)
        renk = Image.new("RGB", (bw_, bh_), MAVI)
        im.paste(renk, (int(X(0)), int(Y(z_t))), m)
        im.paste(renk, (int(X(-xs_)), int(Y(z_t))), ImageOps.mirror(m))
        im = im.resize((Wp // S, Hp // S), Image.LANCZOS)
        im.save(path, optimize=True)
        return
    # mavi köşelik: üst çizgi, yan çizgiler, kemer çizgisi; içi sekiz köşeli yıldız örgüsü
    r_b = kapi_w / 2 + 2 * r_ip + 0.35; xs_, zs0, zs1 = xi - 0.12, kzs + 1.6, zb_ - 0.12
    maske = Image.new("L", (Wp, Hp), 0); dm = ImageDraw.Draw(maske)
    dm.rectangle([X(-xs_), Y(zs1), X(xs_), Y(zs0)], fill=255)
    dm.ellipse([X(-r_b), Y(kzs + r_b), X(r_b), Y(kzs - r_b)], fill=0)
    desen = Image.new("RGB", (Wp, Hp), TAS); dd = ImageDraw.Draw(desen)
    s_, ro = 0.95, 0.3; ri = ro * 0.62                        # düzgün ızgara; yıldız uçları 0°, 45°, 90° … yönünde
    for i in range(-7, 8):
        for j in range(0, 8):
            cx, cz = i * s_, kzs + 0.4 + j * s_
            yil = [(cx + (ro if q % 2 == 0 else ri) * math.cos(math.pi * q / 8),
                    cz + (ro if q % 2 == 0 else ri) * math.sin(math.pi * q / 8)) for q in range(17)]
            dd.line([P_(*p) for p in yil], fill=MAVI, width=lm, joint="curve")
            for dx, dz in ((s_, 0), (0, s_), (s_, s_), (-s_, s_)):     # komşu yıldızların uçlarını birleştiren örgü çizgileri
                L_ = math.hypot(dx, dz); ux, uz = dx / L_, dz / L_
                dd.line([P_(cx + ux * ro, cz + uz * ro), P_(cx + dx - ux * ro, cz + dz - uz * ro)], fill=MAVI, width=lm)
    im.paste(desen, (0, 0), maske)
    cizgi([(-xs_, zs0), (-xs_, zs1), (xs_, zs1), (xs_, zs0)], MAVI, lm)
    for s in (-1, 1):
        x_k = math.sqrt(max(r_b ** 2 - (zs0 - kzs) ** 2, 0))   # yan çizginin alt ucundan kemer çizgisine
        cizgi([(s * xs_, zs0), (s * x_k, zs0)], MAVI, lm)
    a0 = math.degrees(math.asin(min((zs0 - kzs) / r_b, 1)))
    d.arc([X(-r_b), Y(kzs + r_b), X(r_b), Y(kzs - r_b)], start=-180 + a0, end=-a0, fill=MAVI, width=lm)
    im = im.resize((Wp // S, Hp // S), Image.LANCZOS)
    im.save(path, optimize=True)

def petek_korkuluk(path, W=132, Hh=232):
    """v02l: mescit merdiven korkuluğu, pencere alınlığındaki petek şebekeyle aynı dil: beyaz mermer, siyah altıgen delikler;
    üst küpeşte ve alt kuşak dolu. Karo = 0,42 m (eğim boyunca) × 0,9 m; yatayda dikişsiz (6 × 22 px)."""
    BEYAZ, DELIK = (244, 242, 236), (26, 26, 28)
    im = Image.new("RGB", (W, Hh), BEYAZ); d = ImageDraw.Draw(im)
    r, dx, dy = 9, 22, 19
    y0, y1 = int(Hh * 0.14), int(Hh * 0.88)
    j = 0; cy = y1 - 12
    while cy > y0 + 10:
        for i in range(-1, W // dx + 2):
            cx = i * dx + (j % 2) * dx / 2
            d.polygon([(cx + r * math.cos(math.pi / 3 * q + math.pi / 6), cy + r * math.sin(math.pi / 3 * q + math.pi / 6)) for q in range(6)], fill=DELIK)
        j += 1; cy -= dy
    im.save(path, optimize=True)

def baca(path, W=128, Hh=256):
    """v02i: baca gövdesinin bir yüzü (ref img/baca_ref.webp): tuğla örgü, üstte iki sivri kemerli açıklık,
    en üstte dişli (konsollu) kuşak. Karo = bir yüzün tamamı (u: yüz eni, v: tabandan tepeye)."""
    im = Image.new("RGB", (W, Hh), DERZ); d = ImageDraw.Draw(im)
    tb, dz, tl = 12, 3, 42
    for r in range(Hh // (tb + dz) + 1):                      # tuğla sıraları, şaşırtmalı
        y0 = Hh - (r + 1) * (tb + dz); off = (r % 2) * tl // 2
        for k in range(-1, W // tl + 2):
            x0 = k * tl - off
            d.rectangle([x0, y0, x0 + tl - dz, y0 + tb - 1], fill=TUGLA[(k + r) % 3])
    dk = int(Hh * 0.08)                                       # üst dişli kuşak: açık taş konsollar + koyu aralar
    d.rectangle([0, 0, W, dk], fill=(70, 62, 58))
    for k in range(6):
        x = k * W // 6 + W // 24; d.rectangle([x, 2, x + W // 12, dk - 2], fill=(226, 218, 204))
    for cx in (0.3, 0.7):                                     # iki sivri kemerli açıklık (koyu)
        w2 = W * 0.11; x0, x1 = W * cx - w2, W * cx + w2
        yt, ys, yb = Hh * 0.13, Hh * 0.22, Hh * 0.47
        d.polygon([(x0, yb), (x0, ys), (W * cx, yt), (x1, ys), (x1, yb)], fill=(28, 26, 26))
    im.save(path, optimize=True)

def petek(path, W=256, Hh=128):
    """v02j: mescit pencere alınlığı (ref img/mescit_2.webp): beyaz alçı şebeke, içi siyah altıgen delikler.
    Karo = yarım daire alınlığın sınır kutusu (u: en, v: üzengiden tepeye)."""
    im = Image.new("RGB", (W, Hh), (244, 242, 236)); d = ImageDraw.Draw(im)
    r = 9; dx = 22; dy = 19                                    # delik yarıçapı < adım/√3 → aralarda beyaz şebeke kalır
    for j in range(-1, int(Hh / dy) + 2):
        for i in range(-1, int(W / dx) + 2):
            cx = i * dx + (j % 2) * dx / 2; cy = Hh - j * dy
            d.polygon([(cx + r * math.cos(math.pi / 3 * k + math.pi / 6), cy + r * math.sin(math.pi / 3 * k + math.pi / 6)) for k in range(6)],
                      fill=(26, 26, 28))
    d.rectangle([0, Hh - 6, W, Hh], fill=(244, 242, 236))               # alt kenar (üzengi çizgisi)
    im.save(path, optimize=True)

def sekizgen_korkuluk(path, W=128, Hh=232):
    """v02k: mescit merdiven korkuluğu (ref img/mescit_4.webp): beyaz mermer levha, büyük sekizgen delikler,
    aralarda küçük kare delikler; üst küpeşte ve alt kuşak dolu. Karo = 0,5 m (eğim boyunca) × 0,9 m."""
    BEYAZ, DELIK = (244, 242, 236), (60, 62, 64)
    im = Image.new("RGB", (W, Hh), BEYAZ); d = ImageDraw.Draw(im)
    cy = Hh * 0.52; r = W * 0.45                                       # fotoğrafta delikler iri, aralar dar
    d.polygon([(W / 2 + r * math.cos(math.pi / 8 + math.pi / 4 * k), cy + r * math.sin(math.pi / 8 + math.pi / 4 * k)) for k in range(8)], fill=DELIK)
    s = W * 0.09                                                       # karo kenarında (komşu karoyla birleşip) küçük kare delik
    for x in (0, W):
        d.polygon([(x, cy - s), (x + s, cy), (x, cy + s), (x - s, cy)], fill=DELIK)
    im.save(path, optimize=True)

import math
sekizgen_korkuluk(os.path.join(HERE, "sekizgen_korkuluk.png"))
petek_korkuluk(os.path.join(HERE, "petek_korkuluk.png"))
baca(os.path.join(HERE, "baca.png"))
petek(os.path.join(HERE, "petek.png"))
almasik(os.path.join(HERE, "almasik.png"))
portal_on(os.path.join(HERE, "portal_on.png"))                       # v02h–v02k (yıldız örgüsü)
portal_on(os.path.join(HERE, "portal_on_v02l.png"), r_ip=0.32,      # v02l: tasarım sorumlusunun köşelik çizimi
          kose=os.path.join(HERE, "..", "..", "..", "ref img", "portal_kose.png"))
portal_on(os.path.join(HERE, "portal_on_v02m.png"), r_ip=0.32, kzs=7.8 - 5.0 / 2, orgu=True,   # v02m: kiremit örgü, kemer 7,8 m
          kose=os.path.join(HERE, "..", "..", "..", "ref img", "portal_kose.png"))
pencere(os.path.join(HERE, "pencere.png"))
kesme_tas(os.path.join(HERE, "kesme_tas.png"))
korkuluk(os.path.join(HERE, "korkuluk.png"))
print("ok", [(f, os.path.getsize(os.path.join(HERE, f))) for f in ("almasik.png", "pencere.png", "kesme_tas.png", "korkuluk.png")])
