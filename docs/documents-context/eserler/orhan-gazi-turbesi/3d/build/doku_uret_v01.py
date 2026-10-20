# AKAR · Orhan Gazi Türbesi · v01 doku üreticisi (PIL). Çıktı: 3d/build/doku/*.png (build_v01.py bu dosyaları yükler)
# Desenler fotoğraftan sadeleştirildi (kaynakta olmayan süs eklenmedi):
#   sebeke_pencere.png : pencere demir şebekesi, beyaz (#F1EFEA), gerçek delik = alfa 0. Üstte yelpaze (ışınsal çubuklar, ok uçlu),
#                        altta sivri oval + halka kafes (pdf321 Levha 117, pdf323 Levha 121)
#   sebeke_kapi.png    : kapı üstü dilimli lünetin ok uçlu ışınsal şebekesi (pdf319 Levha 113)
#   hol_cam.png        : giriş holü pencereleri: koyu cam (#3E4A55) + koyu ahşap kayıt (#4E3427), sivri kemerde yelpaze (pdf320 Levha 114)
#   kursun_dikis.png   : kurşun kaplama (#C3C9CD) + dikiş çizgisi (#98A1A8), karo
#   doseme_tas.png     : çevre taş döşemesi (standart §1 avlu #B3A590 + derz #A69A86): 0,8 × 0,4 m şaşırtmalı plaka, karo 1,6 m (arsiv_dis_guneybati, Levha 120)
#   (ağaç dokuları: ../../../_kutuphane/agac_doku.py doku "#3F7A5C" → yaprak_*.png, agac_govde.png)
# Çalıştırma: python3 3d/build/doku_uret_v01.py
import os, math
from PIL import Image, ImageDraw

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "doku"); os.makedirs(OUT, exist_ok=True)
BEYAZ = (241, 239, 234, 255)
S = 4                                     # süper örnekleme

def kaydet(im, ad, boyut):
    im.resize(boyut, Image.LANCZOS).save(os.path.join(OUT, ad), optimize=True)

def ok(d, p0, p1, w, col, uc=True):
    d.line([p0, p1], fill=col, width=w)
    if uc:
        a = math.atan2(p1[1] - p0[1], p1[0] - p0[0]); L = 7 * S
        for s in (-1, 1):
            d.line([p1, (p1[0] - L * math.cos(a + s * 0.5), p1[1] - L * math.sin(a + s * 0.5))], fill=col, width=w)

# ---- pencere şebekesi: 256 × 482 (net açıklık 1,69 × 3,19 m) ----
W, H = 256, 482; im = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
r = W * S / 2; cx, cy = r, r; bw = 5 * S
d.arc([cx - r + bw / 2, cy - r + bw / 2, cx + r - bw / 2, cy + r - bw / 2], 180, 360, fill=BEYAZ, width=int(bw * 1.3))   # kemer çerçevesi
d.line([(bw / 2, cy), (bw / 2, H * S)], fill=BEYAZ, width=int(bw * 1.3)); d.line([(W * S - bw / 2, cy), (W * S - bw / 2, H * S)], fill=BEYAZ, width=int(bw * 1.3))
d.line([(0, H * S - bw / 2), (W * S, H * S - bw / 2)], fill=BEYAZ, width=int(bw * 1.3))
d.line([(0, cy), (W * S, cy)], fill=BEYAZ, width=bw)                                                                       # üzengi çubuğu
hub = 0.16 * r; d.arc([cx - hub, cy - hub, cx + hub, cy + hub], 180, 360, fill=BEYAZ, width=bw)
for k in range(1, 14):                                                                                                     # 13 ışın, ok uçlu
    a = math.pi + math.pi * k / 14
    ok(d, (cx + hub * math.cos(a), cy + hub * math.sin(a)), (cx + (r - 9 * S) * math.cos(a), cy + (r - 9 * S) * math.sin(a)), bw, BEYAZ)
rr = 0.62 * r; d.arc([cx - rr, cy - rr, cx + rr, cy + rr], 180, 360, fill=BEYAZ, width=int(bw * 0.8))
n_col = 8; cw = W * S / n_col; y0 = cy; y1 = H * S; rows = 5; rh = (y1 - y0) / rows
for j in range(rows):                                                                                                      # sivri ovaller (iki yay) + halkalar
    ya, yb = y0 + j * rh, y0 + (j + 1) * rh
    for i in range(n_col):
        xa, xb = i * cw, (i + 1) * cw; xm = (xa + xb) / 2
        pts_l = [(xm - (cw / 2) * math.sin(math.pi * t / 12), ya + (yb - ya) * t / 12) for t in range(13)]
        pts_r = [(xm + (cw / 2) * math.sin(math.pi * t / 12), ya + (yb - ya) * t / 12) for t in range(13)]
        d.line(pts_l, fill=BEYAZ, width=bw); d.line(pts_r, fill=BEYAZ, width=bw)
    for i in range(n_col + 1):
        hr = 0.24 * cw; x = i * cw; d.ellipse([x - hr, ya - hr, x + hr, ya + hr], outline=BEYAZ, width=bw)
kaydet(im, "sebeke_pencere.png", (W, H))

# ---- kapı lüneti şebekesi: 256 × 140 ----
W, H = 256, 140; im = Image.new("RGBA", (W * S, H * S), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
cx, cy = W * S / 2, H * S; R = H * S * 1.0; hub = 0.22 * H * S; bw = 5 * S
d.arc([cx - hub, cy - hub, cx + hub, cy + hub], 180, 360, fill=BEYAZ, width=bw)
d.arc([cx - hub * 0.55 - hub * 0.45, cy - hub * 0.9, cx - hub * 0.55 + hub * 0.45, cy], 180, 360, fill=BEYAZ, width=bw)
d.arc([cx + hub * 0.55 - hub * 0.45, cy - hub * 0.9, cx + hub * 0.55 + hub * 0.45, cy], 180, 360, fill=BEYAZ, width=bw)
for k in range(1, 16):
    a = math.pi + math.pi * k / 16
    ok(d, (cx + hub * math.cos(a), cy + hub * math.sin(a)), (cx + (W * S / 2) * 0.96 * math.cos(a), cy + R * 0.95 * math.sin(a)), bw, BEYAZ)
rr = 0.60; d.arc([cx - W * S / 2 * rr, cy - R * rr, cx + W * S / 2 * rr, cy + R * rr], 180, 360, fill=BEYAZ, width=int(bw * 0.8))
d.line([(0, H * S - bw / 2), (W * S, H * S - bw / 2)], fill=BEYAZ, width=bw)
kaydet(im, "sebeke_kapi.png", (W, H))

# ---- hol camı: 128 × 320 (sivri kemerli, kemer içi 0–34 %) ----
W, H = 128, 320; CAM, AHS = (62, 74, 85), (78, 52, 39)
im = Image.new("RGB", (W * S, H * S), CAM); d = ImageDraw.Draw(im); bw = 6 * S
ys = int(H * S * 0.30)
for y in (ys, int(H * S * 0.55), int(H * S * 0.78)): d.line([(0, y), (W * S, y)], fill=AHS, width=bw)
d.line([(W * S / 2, ys), (W * S / 2, H * S)], fill=AHS, width=bw)
d.rectangle([0, 0, W * S - 1, H * S - 1], outline=AHS, width=int(bw * 1.6))
for k in range(1, 8):
    a = math.pi + math.pi * k / 8; L = W * S * 0.55
    d.line([(W * S / 2, ys), (W * S / 2 + L * math.cos(a), ys + L * 1.4 * math.sin(a))], fill=AHS, width=int(bw * 0.7))
d.arc([W * S / 2 - W * S * 0.18, ys - W * S * 0.18, W * S / 2 + W * S * 0.18, ys + W * S * 0.18], 180, 360, fill=AHS, width=int(bw * 0.7))
kaydet(im, "hol_cam.png", (W, H))

# ---- kurşun dikiş karosu: 64 × 64 (dikey dikiş belirgin, yatay ek hafif) ----
im = Image.new("RGB", (64 * S, 64 * S), (195, 201, 205)); d = ImageDraw.Draw(im)
d.rectangle([0, 0, 3 * S, 64 * S], fill=(152, 161, 168)); d.rectangle([3 * S, 0, 5 * S, 64 * S], fill=(214, 218, 221))
d.rectangle([0, 0, 64 * S, 1 * S], fill=(174, 182, 188))
kaydet(im, "kursun_dikis.png", (64, 64))
# ---- taş döşeme karosu: 128 × 128 = 1,6 × 1,6 m (80 px/m); 4 sıra × 0,4 m, plaka 0,8 m, sıralar yarım kaydırılır ----
import random
rnd = random.Random(7); TAS, DERZ = (179, 165, 144), (166, 154, 134)
im = Image.new("RGB", (128 * S, 128 * S), DERZ); d = ImageDraw.Draw(im); dz = 1 * S
for j in range(4):
    for i in range(-1, 2):
        x0 = (i * 64 + (32 if j % 2 else 0)) * S; y0 = j * 32 * S; f = rnd.choice((0.97, 0.99, 1.01, 1.03))
        d.rectangle([x0 + dz, y0 + dz, x0 + 64 * S - dz - 1, y0 + 32 * S - dz - 1], fill=tuple(round(c * f) for c in TAS))
kaydet(im, "doseme_tas.png", (128, 128))
print("doku tamam", sorted(os.listdir(OUT)))
