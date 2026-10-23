# AKAR · Orhan Bey Hamamı · render ↔ kaynak bindirmeleri ve yan yana karşılaştırmalar (v03 kalibrasyonu, 19 Ekim 2026).
# Çalıştırma (Pillow + numpy):  python yan_yana_hamam.py [surum]   (varsayılan hamam_v03)
# Ölçekler build_hamam_v03.py ile aynı:
#   ust_orto   1100 × 1100, orto 44 m, merkez (−3, −1) → 25 px/m        ↔ Ayverdi planı (yurt2024_pdf220), 180° döndürülmüş, 40,1 px/m
#   dogu_kesit 1400 × 700, orto 44 m, merkez (Y −1, z 6) → 31,8 px/m    ↔ Ayverdi kesiti (yurt2024_pdf223, 46 px/m) ve Plan 13 (33,7 px/m; düşeyde basık)
#   yan yana   ust_orto ↔ envanter_c1_pdf105 tepeden fotoğraf (180°: kuzey yukarı); foto104_acisi ↔ envanter_c1_pdf104
# Model koordinatı = Ayverdi planı: X = (904,5 − x) / 40,1, Y = (y − 979,5) / 40,1. Plan 13: Y = 3,19 + (x − 797) / 33,7, z = (454 − y) / 33,7.
import sys, os
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); SURUM = sys.argv[1] if len(sys.argv) > 1 else "hamam_v03"
K = os.path.normpath(os.path.join(HERE, "..", "..", "kontrol", SURUM))
REF = os.path.normpath(os.path.join(HERE, "..", "..", "..", "ref"))

def bindir(R, L, baslik, ad, renk=(20, 20, 160)):
    """Render üstüne çizgi çizim: çizimin koyu pikselleri lacivert, render soluk."""
    rgba = R.convert("RGBA"); arka = Image.new("RGBA", R.size, (255, 255, 255, 255)); arka.alpha_composite(rgba)
    r = np.asarray(arka.convert("RGB")).astype(float); l = np.asarray(L).astype(float)[..., None] / 255.0
    ust = r * (0.45 + 0.55 * l); ust[l[..., 0] < 0.55] = renk
    B = Image.fromarray(ust.clip(0, 255).astype("uint8")); ImageDraw.Draw(B).text((12, 10), baslik, fill=(0, 0, 0))
    B.save(os.path.join(K, f"bindirme_{ad}.png")); print("ok bindirme", ad)

def yan_yana(sol, sag, ad, h=900):
    sol = sol.convert("RGB"); sg = Image.new("RGB", sag.size, (204, 204, 204)); sg.paste(sag, (0, 0), sag.convert("RGBA"))
    a = sol.resize((int(sol.width * h / sol.height), h)); b = sg.resize((int(sg.width * h / sg.height), h))
    out = Image.new("RGB", (a.width + b.width + 20, h), (255, 255, 255)); out.paste(a, (0, 0)); out.paste(b, (a.width + 20, 0))
    out.save(os.path.join(K, f"yan_yana_{ad}.png")); print("ok yan_yana", ad)

# --- üst orto ↔ Ayverdi planı ---
R = Image.open(os.path.join(K, "ust_orto.png"))
C = Image.open(os.path.join(REF, "plan", "yurt2024_pdf220_plan_ayverdi.png")).convert("L").rotate(180)
k = 25.0 / 40.1; ox, oy = C.width - 1 - 904.5, C.height - 1 - 979.5
C = C.resize((int(C.width * k), int(C.height * k)), Image.LANCZOS)
L = Image.new("L", R.size, 255); L.paste(C, (int(round(550 + 75 - ox * k)), int(round(525 - oy * k))))
bindir(R, L, "UST orto ↔ Ayverdi planı (40,1 px/m, kuzey yukarı); lacivert = çizim", "ust_orto_ayverdi")

# --- doğu kesit ↔ Plan 13 ---
R = Image.open(os.path.join(K, "dogu_kesit.png"))
C = Image.open(os.path.join(REF, "plan", "aydin2017_pdf098_plan13_kesit_kotlu.jpg")).convert("L")
k = (1400 / 44.0) / 33.7
C = C.resize((int(C.width * k), int(C.height * k)), Image.LANCZOS)
L = Image.new("L", R.size, 255); L.paste(C, (int(round(700 + (4.19 - 797 / 33.7) * 1400 / 44.0)), int(round(350 + (6 - 454 / 33.7) * 1400 / 44.0))))
bindir(R, L, "DOGU kesit (X = −3,5) ↔ Aydın 2017 Plan 13 kotlu kesit (sol güney, sağ kuzey)", "dogu_kesit_plan13", (160, 20, 20))

# --- doğu kesit ↔ Ayverdi kesiti (Yurt 2024 çizimi, saat yönünde 90°; kendi çubuğu 46 px/m doğru; erkek soğukluğu güney iç yüzü x = 1450, zemin y = 1180)
R = Image.open(os.path.join(K, "dogu_kesit.png"))
C = Image.open(os.path.join(REF, "plan", "yurt2024_pdf223_kesit_ayverdi.png")).convert("L").rotate(-90, expand=True)
k = (1400 / 44.0) / 46.0
C = C.resize((int(C.width * k), int(C.height * k)), Image.LANCZOS)
L = Image.new("L", R.size, 255); L.paste(C, (int(round(700 + (4.19 - 1450 / 46.0) * 1400 / 44.0)), int(round(350 + (6 - 1180 / 46.0) * 1400 / 44.0))))
bindir(R, L, "DOGU kesit (X = −3,5) ↔ Ayverdi kesiti (Yurt 2024, 46 px/m; sol güney, sağ kuzey)", "dogu_kesit_ayverdi")

# --- yan yana: tepeden fotoğraf (sayfanın sağ görseli) ve havadan fotoğraf ---
F = Image.open(os.path.join(REF, "foto", "envanter_c1_pdf105_ic_carsi_tepeden.png"))
s_ = F.width / 2000.0
F = F.crop((int(1543 * s_), int(107 * s_), int(1906 * s_), int(575 * s_))).rotate(180)
yan_yana(F, Image.open(os.path.join(K, "ust_orto.png")), "ust_orto_tepeden_foto")
F = Image.open(os.path.join(REF, "foto", "envanter_c1_pdf104_havadan_kubbeler.png")); s_ = F.width / 2000.0
F = F.crop((0, int(330 * s_), int(1490 * s_), int(1000 * s_)))
yan_yana(F, Image.open(os.path.join(K, "foto104_acisi.png")), "foto104")

# --- adım B–C: giriş cepheleri, kasnak, kadın tarafı damı (Yurt levha sayfalarının üst görselleri; sayfa 910 px genişliğe göre kırpma) ---
def levha_ust(dosya):
    F = Image.open(os.path.join(REF, "foto", dosya)); s_ = F.width / 910.0
    return F.crop((int(150 * s_), int(130 * s_), int(843 * s_), int(518 * s_)))
def levha_alt(dosya):
    F = Image.open(os.path.join(REF, "foto", dosya)); s_ = F.width / 910.0
    return F.crop((int(150 * s_), int(545 * s_), int(843 * s_), int(940 * s_)))
for kirp, dosya, render_, ad in ((levha_ust, "yurt2024_pdf306_giris_rozet_L90-91.jpg", "guney_giris.png", "guney_giris_L90"),     # alınlıklı giriş güneyde (v03 C)
                                 (levha_ust, "yurt2024_pdf309_kadin_girisi_L96-97.jpg", "dogu_avlu.png", "dogu_avlu_L96"),
                                 (levha_ust, "yurt2024_pdf310_testere_sacak_L98-99.jpg", "kubbe_yakin.png", "kubbe_yakin_L98"),
                                 (levha_alt, "yurt2024_pdf308_merdiven_dogu_L94-95.jpg", "kadin_dam.png", "kadin_dam_L95")):
    if os.path.exists(os.path.join(K, render_)): yan_yana(kirp(dosya), Image.open(os.path.join(K, render_)), ad)
# --- v04: güney kapısı ayrıntısı (Levha 91 rozet pencere; Aydın 2017 foto 33 kapı, sağdan aşağıdan) ---
for sol_, render_, ad in ((lambda: levha_alt("yurt2024_pdf306_giris_rozet_L90-91.jpg"), "guney_rozet_yakin.png", "guney_rozet_L91"),
                          (lambda: Image.open(os.path.join(REF, "foto", "aydin2017_pdf178_foto33_giris_yuvarlak_pencereli.jpg")), "guney_kapi_yakin.png", "guney_kapi_foto33")):
    if os.path.exists(os.path.join(K, render_)): yan_yana(sol_(), Image.open(os.path.join(K, render_)), ad)
