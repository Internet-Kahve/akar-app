# AKAR · Emir Hanı · tepeden render ↔ EHA 1967 çarşı planı (kırpıntı) yan yana ve bindirme; render ↔ fotoğraf yan yana.
# Çalıştırma (Pillow + numpy):  python yan_yana_emir.py [surum]   (varsayılan emir_v01)
# EHA taraması yatayda doğru (75 m = 305 px → 4,07 px/m), dikeyde basık: dikey ölçek Emir Hanı çekirdeğinin 45 m (E)
# olduğu kabulüyle 122 px / 45 m = 2,71 px/m alınır (bu yüzden K–G karşılaştırması döngüsel; yalnız D–B ve avlu oranı sınanır).
import sys, os
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); SURUM = sys.argv[1] if len(sys.argv) > 1 else "emir_v01"
K = os.path.normpath(os.path.join(HERE, "..", "..", "kontrol", SURUM))
REF = os.path.normpath(os.path.join(HERE, "..", "..", "..", "ref", "plan")); FOTO = os.path.normpath(os.path.join(HERE, "..", "..", "..", "ref", "foto"))
PPM = 1400 / 56.0
R = Image.open(os.path.join(K, "ust_orto.png")).convert("RGB")
# NOT (19 Ekim 2026): EHA 1967 vaziyet görseli (bedesten_carsi_eha1967.png) bu ağaçta yok; bindirme için ref/plan/yurt2024_pdf219_kulliye_vaziyet_ayverdi.png kullanılabilir (yeniden kalibre gerekir).
E = Image.open(os.path.join(REF, "bedesten_carsi_eha1967.png")).convert("L")
box = (240, 230, 520, 420); E = E.crop(box)
kx, ky = PPM / 4.07, PPM / 2.71
E = E.resize((int(E.width * kx), int(E.height * ky)), Image.LANCZOS)
cx, cy = ((150 + 705) / 2 / 3), ((70 + 435) / 2 / 3)          # çekirdek ortası (kırpıntıda, büyütmeden önce)
L = Image.new("L", R.size, 255); L.paste(E, (int(700 - cx * kx), int(700 - cy * ky)))
r = np.asarray(R).astype(float); l = np.asarray(L).astype(float)[..., None] / 255.0
u = r * (0.35 + 0.65 * l); u[l[..., 0] < 0.45] = [20, 20, 160]
B = Image.fromarray(u.clip(0, 255).astype("uint8")); ImageDraw.Draw(B).text((12, 10), "UST orto ↔ EHA 1967 (yatay 4,07 px/m; dikey çekirdek = 45 m kabulü)", fill=(0, 0, 0))
B.save(os.path.join(K, "bindirme_ust_orto.png"))
for foto, rnd, out in (("Emir-Hani-4.jpg", "avlu_ici.png", "yan_yana_avlu.png"),):
    a = Image.open(os.path.join(FOTO, foto)).convert("RGB"); b = Image.open(os.path.join(K, rnd)).convert("RGB")
    H = 600; a = a.resize((int(a.width * H / a.height), H)); b = b.resize((int(b.width * H / b.height), H))
    c = Image.new("RGB", (a.width + b.width + 10, H), "white"); c.paste(a, (0, 0)); c.paste(b, (a.width + 10, 0)); c.save(os.path.join(K, out))
print("ok")
