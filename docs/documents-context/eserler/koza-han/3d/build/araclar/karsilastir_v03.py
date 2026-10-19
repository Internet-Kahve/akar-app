# Koza Han v03 · kaynak görselle render'ı yan yana koyar (solda kaynak, sağda render); kesitte kotlar çizilir.
# Kullanım: uv run --no-project --python 3.12 --with pillow python karsilastir_v03.py   (3d/ klasöründen bağımsız)
import os
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); URETIM = os.path.normpath(os.path.join(HERE, "..", ".."))
K = os.path.join(URETIM, "kontrol", os.environ.get("KOZA_SURUM", "v03")); REF = os.path.normpath(os.path.join(URETIM, "..", "ref"))
def bg(im):                                           # saydam render'ı açık griye bas (standart dünya rengi)
    im = im.convert("RGBA"); z = Image.new("RGBA", im.size, (204, 204, 204, 255)); z.alpha_composite(im); return z.convert("RGB")
def birlestir(a, b, out, h=900, etiket=("kaynak", "render v03")):
    ims = [x.resize((int(x.width * h / x.height), h)) for x in (a, b)]
    c = Image.new("RGB", (sum(i.width for i in ims) + 20, h + 28), (255, 255, 255)); x = 0; d = ImageDraw.Draw(c)
    for im, t in zip(ims, etiket): c.paste(im, (x, 28)); d.text((x + 6, 8), t, fill=(0, 0, 0)); x += im.width + 20
    c.save(os.path.join(K, out)); print("yazildi", out)
# 1) dik hava: kozahan_arsiv_010 kuzeye göre çekilmemiş (portal fotoğrafın sağ kenarında) → 90° sola döndürülür, portal üste gelir.
#    Han dış ve avlu sınırları (döndürülmüş fotoğraf pikselleri, elle okundu) çizilir; oranlar modelle ±%5 içinde olmalı.
import json
foto = Image.open(os.path.join(REF, "foto", "kozahan_arsiv_010_havadan_dik_tum_yapi.jpg")).convert("RGB").rotate(90, expand=True)
HAN = (150, 408, 1602, 2046); AVLU = (420, 696, 1296, 1752)          # (x0, y0, x1, y1) döndürülmüş fotoğraf pikseli
fh = foto.crop((HAN[0] - 40, HAN[1] - 40, HAN[2] + 40, HAN[3] + 40)); dd = ImageDraw.Draw(fh)
for (a, b, c_, d_), col in ((HAN, (255, 0, 0)), (AVLU, (0, 200, 255))): dd.rectangle([a - HAN[0] + 40, b - HAN[1] + 40, c_ - HAN[0] + 40, d_ - HAN[1] + 40], outline=col, width=3)
r = bg(Image.open(os.path.join(K, "havadan_dik_ham.png")))
ppm = 1600 / float(os.environ.get('KOZA_DIK_OLCEK', '130')); px = lambda x, y: (800 + (x - 22) * ppm, 650 - (y - 2.4) * ppm)
x0, y1 = px(-32, 36); x1, y0 = px(32, -36)
rh = r.crop((int(x0 - 8), int(y1 - 8), int(x1 + 8), int(y0 + 8)))
birlestir(fh, rh, "yan_yana_havadan_dik.png", etiket=("kozahan_arsiv_010, 90° sola döndürüldü (F); kırmızı: han dışı, mavi: avlu", "v03 dik ortografik (kuzey üstte)"))
fw, fhh = HAN[2] - HAN[0], HAN[3] - HAN[1]; aw_, ah_ = AVLU[2] - AVLU[0], AVLU[3] - AVLU[1]
foto_o = {"avlu_dx/dis_dx": aw_ / fw, "avlu_dy/dis_dy": ah_ / fhh, "kanat_x/dis_dx": ((AVLU[0] - HAN[0]) + (HAN[2] - AVLU[2])) / 2 / fw, "kanat_y/dis_dy": ((AVLU[1] - HAN[1]) + (HAN[3] - AVLU[3])) / 2 / fhh, "dis_dx/dis_dy": fw / fhh}
model_o = {"avlu_dx/dis_dx": 38 / 64, "avlu_dy/dis_dy": 46 / 72, "kanat_x/dis_dx": 13 / 64, "kanat_y/dis_dy": 13 / 72, "dis_dx/dis_dy": 64 / 72}
rap = {k: {"foto": round(foto_o[k], 3), "model": round(model_o[k], 3), "sapma_yuzde": round(100 * (foto_o[k] / model_o[k] - 1), 1), "gecti_pm5": abs(foto_o[k] / model_o[k] - 1) <= 0.05} for k in model_o}
json.dump(rap, open(os.path.join(K, "oran_kontrolu.json"), "w"), ensure_ascii=False, indent=1); print(json.dumps(rap, ensure_ascii=False))
# 2) mescit kesiti: Güler 2020 A–A (96 px/m) ↔ render (y = 0 kesiti, 107,14 px/m); z = 0 aynı satırda, kotlar çizili
ref = Image.open(os.path.join(REF, "plan", "guler2020_pdf022_mescit_AA_kesiti.png")).convert("RGB")
ren = bg(Image.open(os.path.join(K, "mescit_kesit_ham.png"))); s = 96.7 / 107.14
ren = ren.resize((int(ren.width * s), int(ren.height * s))); Z0 = 1055
H = ref.height; W = ref.width + ren.width + 20
c = Image.new("RGB", (W, H), (255, 255, 255)); c.paste(ref, (0, 0))
zr0 = int((550 + 5 * 107.14) * s); c.paste(ren, (ref.width + 20, Z0 - zr0)); d = ImageDraw.Draw(c)
for z in (0, 0.78, 2.0, 3.5, 5.0, 5.27, 6.98, 9.6):
    y = Z0 - z * 96.7; d.line([(0, y), (W, y)], fill=(220, 40, 40), width=1); d.text((W - 60, y - 12), f"+{z:.2f}", fill=(220, 40, 40))
c.save(os.path.join(K, "yan_yana_mescit_kesit.png")); print("yazildi yan_yana_mescit_kesit.png")
# 3) mescit görünüşü: kozahan_arsiv_043 ↔ render
f43 = Image.open(os.path.join(REF, "foto", "kozahan_arsiv_043_mescit_merdiven_avlu.jpg")).convert("RGB").crop((780, 576, 1500, 1392))
birlestir(f43, bg(Image.open(os.path.join(K, "mescit_foto_ham.png"))), "yan_yana_mescit_foto.png", etiket=("kozahan_arsiv_043 (F)", "v03"))
# 4) avlu: 2026 fotoğrafı ↔ avlu_genel
fa = os.path.join(REF, "foto", "avlu2026_images.jpeg")
birlestir(Image.open(fa).convert("RGB"), bg(Image.open(os.path.join(K, "avlu_genel.png"))), "yan_yana_avlu.png", etiket=("avlu2026 (F)", "v03"))

# 5) v06: İç Koza (Street View 04 ↔ avlu, ic-koza-hani_1 ↔ dış), geçit (Street View 01), kitabe (kullanıcı fotoğrafı), merdiven korkuluğu (mescit_2)
def varsa(f): return os.path.exists(os.path.join(K, f))
if varsa("ic_koza_avlu.png"):
    birlestir(Image.open(os.path.join(REF, "foto", "ic-koza_streetview2025_04.png")).convert("RGB"), bg(Image.open(os.path.join(K, "ic_koza_avlu.png"))), "yan_yana_ic_koza_avlu.png", etiket=("Street View 2025 (F)", "v06 avlu"))
    birlestir(Image.open(os.path.join(REF, "foto", "ic-koza-hani_1.jpg")).convert("RGB"), bg(Image.open(os.path.join(K, "ic_koza_dis.png"))), "yan_yana_ic_koza_dis.png", etiket=("ic-koza-hani_1 (F)", "v06 dış"))
    a_, b_ = Image.open(os.path.join(K, "yan_yana_ic_koza_avlu.png")), Image.open(os.path.join(K, "yan_yana_ic_koza_dis.png"))
    w_ = max(a_.width, b_.width); c_ = Image.new("RGB", (w_, a_.height + b_.height), (255, 255, 255)); c_.paste(a_, (0, 0)); c_.paste(b_, (0, a_.height)); c_.save(os.path.join(K, "yan_yana_ic_koza.png"))
if varsa("gecit_ic_koza.png"):
    birlestir(Image.open(os.path.join(REF, "foto", "ic-koza_streetview2025_01.png")).convert("RGB"), bg(Image.open(os.path.join(K, "gecit_ic_koza.png"))), "yan_yana_gecit.png", etiket=("Street View 2025 (F)", "v06 geçit"))
if varsa("kitabe_yakin.png"):
    kit = Image.open(os.path.join(REF, "foto", "mescit_kapi_kitabe_1948.png")).convert("RGB").crop((0, 0, 335, 340)); kr = bg(Image.open(os.path.join(K, "kitabe_yakin.png"))); kr = kr.crop((0, 300, kr.width, 1250))
    birlestir(kit, kr, "yan_yana_kitabe.png", etiket=("kullanıcı fotoğrafı (F)", "v06"))
if varsa("merdiven_ic.png"):
    m2 = Image.open(os.path.join(REF, "foto", "mescit_2.webp")).convert("RGB")
    birlestir(m2, bg(Image.open(os.path.join(K, "merdiven_ic.png"))), "yan_yana_merdiven_ic.png", etiket=("mescit_2 (F)", "v06 merdiven iç yüz"))

# 6) v08: iki kapı açıklığı, önce (v07) / sonra (v08) yan yana
for kapi in ("gecit", "portal"):
    sat = []
    for yer in ("dis", "ic", "orta"):
        a_, b_ = os.path.join(K, f"_once_kapi_{kapi}_{yer}.png"), os.path.join(K, f"kapi_{kapi}_{yer}.png")
        if os.path.exists(a_) and os.path.exists(b_): sat.append((bg(Image.open(a_)), bg(Image.open(b_))))
    if sat:
        h = 520; rows = []
        for a_, b_ in sat:
            a2, b2 = a_.resize((int(a_.width * h / a_.height), h)), b_.resize((int(b_.width * h / b_.height), h)); r_ = Image.new("RGB", (a2.width + b2.width + 20, h), (255, 255, 255)); r_.paste(a2, (0, 0)); r_.paste(b2, (a2.width + 20, 0)); rows.append(r_)
        c_ = Image.new("RGB", (rows[0].width, sum(r_.height + 24 for r_ in rows)), (255, 255, 255)); d_ = ImageDraw.Draw(c_); y_ = 0
        for yer, r_ in zip(("dış", "iç (avlu tarafı)", "orta (geçidin içi)"), rows): d_.text((6, y_ + 6), f"{kapi}: {yer} · solda önce (v07), sağda sonra (v08)", fill=(0, 0, 0)); c_.paste(r_, (0, y_ + 24)); y_ += r_.height + 24
        c_.save(os.path.join(K, f"yan_yana_kapi_{kapi}.png")); print("yazildi", f"yan_yana_kapi_{kapi}.png")

# 7) v09: çevre — drone (90° sola döndürülmüş) ↔ dik render
if varsa("havadan_dik_ham.png"):
    fo = Image.open(os.path.join(REF, "foto", "kozahan_arsiv_010_havadan_dik_tum_yapi.jpg")).convert("RGB").rotate(90, expand=True)
    birlestir(fo, bg(Image.open(os.path.join(K, "havadan_dik_ham.png"))), "yan_yana_cevre.png", etiket=("kozahan_arsiv_010, 90° sola döndürüldü (F)", "v09 dik ortografik (çevre dahil)"))
