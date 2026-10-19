# AKAR · Orhan Bey Camii · ortografik render ↔ Ayverdi çizimi bindirmesi (aynı ölçek: 35 px/m, zemin hizalı).
# Çalıştırma (Pillow + numpy gerekli):  python yan_yana.py <surum>
# Render: 1400 × 900, orto 40 m → 35 px/m, zemin y = 870, bina ortası x = 700 (build_vNN.py ile aynı).
import sys, os
import numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); SURUM = sys.argv[1] if len(sys.argv) > 1 else "v01"
K = os.path.normpath(os.path.join(HERE, "..", "..", "kontrol", SURUM))   # 3d/build/araclar → 3d/kontrol
REF = os.path.normpath(os.path.join(HERE, "..", "..", "..", "ref", "plan"))
PPM, ZEMIN, ORTA = 35.0, 870, 700
# (render, çizim, çizim px/m (doğrulanmış), çizimde zemin y, çizimde bina ortası x, kırpma kutusu, başlık)
IS = [("bati_orto", "yurt2024_pdf217_kesit_on-cephe1_ayverdi.png", 33.2, 2001, 275 + 18.6 * 33.2, (260, 1150, 1560, 2030),
       "BATI orto ↔ Ayverdi yan cephe (33,2 px/m; uzunluk 33,4 m = plan)"),
      ("kuzey_orto", "yurt2024_pdf218_on-cephe2_kuzey_ayverdi.png", 40.0 * 26.9 / 25.7, 1289, 366 + 13.8 * 40.0, (270, 200, 1560, 1300),
       "KUZEY orto ↔ Ayverdi ön cephe (çubuk %4,7 hatalı; plan genişliği 25,7 m ile ölçeklendi)")]
for rnd, ref, ppm, zy, cx, box, baslik in IS:
    R = Image.open(os.path.join(K, rnd + ".png")).convert("RGB")
    C = Image.open(os.path.join(REF, ref)).convert("L").crop(box)
    s = PPM / ppm; C = C.resize((int(C.width * s), int(C.height * s)), Image.LANCZOS)
    ox, oy = int(ORTA - (cx - box[0]) * s), int(ZEMIN - (zy - box[1]) * s)
    L = Image.new("L", R.size, 255); L.paste(C, (ox, oy))
    r = np.asarray(R).astype(float); l = np.asarray(L).astype(float)[..., None] / 255.0
    ust = (r * (0.35 + 0.65 * l)); ust[(l[..., 0] < 0.5)] = [20, 20, 160]          # çizgiler lacivert
    B = Image.fromarray(ust.clip(0, 255).astype("uint8")); ImageDraw.Draw(B).text((12, 10), baslik, fill=(0, 0, 0))
    Y = Image.new("RGB", (R.width, R.height * 2), "white"); Y.paste(R, (0, 0)); Y.paste(Image.merge("RGB", [L] * 3), (0, R.height))
    B.save(os.path.join(K, f"bindirme_{rnd}.png")); Y.save(os.path.join(K, f"yan_yana_{rnd}.png")); print("ok", rnd)
