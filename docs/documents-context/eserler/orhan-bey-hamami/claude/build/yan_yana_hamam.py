# AKAR · Orhan Bey Hamamı · ortografik render ↔ kalibre edilmiş çizim bindirmesi.
# Çalıştırma (Pillow + numpy gerekli):  python yan_yana_hamam.py [surum]   (varsayılan hamam_v01)
# Render: 1400 × 900, orto 46 m → PPM = 1400/46 px/m, orto merkez z = 8 (build_hamam_vNN.py ile aynı).
#   ust_orto  ↔ Çetintaş planı, 90° döndürülmüş (kuzey yukarı), gerçek ölçek 35,5 px/m (çubuk 49 × 1/1,38)
#   dogu_orto ↔ Ayverdi kesiti, saat yönünde 90° döndürülmüş (zemin altta), gerçek ölçek 46,6 / 1,16 px/m
import sys, os
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); SURUM = sys.argv[1] if len(sys.argv) > 1 else "hamam_v01"
K = os.path.join(os.path.dirname(HERE), "kontrol", SURUM)
REF = os.path.normpath(os.path.join(HERE, *[".."] * 4, "veri", "bursa"))
PPM = 1400 / 46.0; ZC = 8.0; S = 1.38
X0, Y0 = 27.3 * S / 2, 25.6 * S / 2          # build_hamam_v01.py ile aynı orijin

def bindir(R, L, baslik, ad):
    r = np.asarray(R).astype(float); l = np.asarray(L).astype(float)[..., None] / 255.0
    ust = r * (0.35 + 0.65 * l); ust[l[..., 0] < 0.5] = [20, 20, 160]
    B = Image.fromarray(ust.clip(0, 255).astype("uint8")); ImageDraw.Draw(B).text((12, 10), baslik, fill=(0, 0, 0))
    B.save(os.path.join(K, f"bindirme_{ad}.png")); print("ok", ad)

# --- plan: çizim (x, y) → döndür (90° saat yönü tersine): nx = y, ny = (W−1) − x ; ölçek k = PPM / 35,5
R = Image.open(os.path.join(K, "ust_orto.png")).convert("RGB")
C = Image.open(os.path.join(REF, "orhan-hamami_plan_cetintas.png")).convert("L"); W = C.width
C = C.rotate(90, expand=True); k = PPM / 35.5
C = C.resize((int(C.width * k), int(C.height * k)), Image.LANCZOS)
ox = 700 + X0 * PPM - 1572 * k                 # u, v → X = X0 − 1,38 v ; çizimde y = 1572 − 49 v
oy = 700 + Y0 * PPM - (W - 1 - 275) * k        # Y = 1,38 u − Y0 ; çizimde x = 275 + 49 u ; üst render kare (1400 × 1400)
L = Image.new("L", R.size, 255); L.paste(C, (int(ox), int(oy)))
bindir(R, L, "UST orto ↔ Çetintaş planı (×1,38 kalibre, kuzey yukarı)", "ust_orto")

# --- kesit: erkek soğukluğu ortası hizalanır (kesitte x = 416 + 28,25 · 46,6 px ; modelde Y = 1,38 · 20,3 − Y0)
R = Image.open(os.path.join(K, "dogu_orto.png")).convert("RGB")
C = Image.open(os.path.join(REF, "orhan-hamami_kesit_ayverdi.png")).convert("L").rotate(-90, expand=True)
kp = 46.6 / 1.16; k = PPM / kp
C = C.crop((380, 300, 2200, 1200)); C = C.resize((int(C.width * k), int(C.height * k)), Image.LANCZOS)
cx_ref, zemin_ref = 416 + 28.25 * 46.6 - 380, 1182 - 300
ox = 700 + (S * 20.3 - Y0) * PPM - cx_ref * k; oy = 450 + ZC * PPM - zemin_ref * k
L = Image.new("L", R.size, 255); L.paste(C, (int(ox), int(oy)))
bindir(R, L, "DOGU orto ↔ Ayverdi kesiti (× 1,16 kalibre; sol güney, sağ kuzey)", "dogu_orto")
