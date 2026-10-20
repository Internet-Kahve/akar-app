# AKAR · Orhan Gazi Türbesi · v01 kontrol görselleri (PIL; Blender gerekmez).
# build_v01.py'nin kontrol/_tmp/ altına yazdığı ham render'ları fotoğraflarla yan yana koyar ve plan bindirmesini çizer.
# Çalıştırma: python3 3d/build/kontrol_v01.py [grup,grup]   gruplar: A (kütle), B (detay), C (sunum)
# Girdi : ../ref/foto/*.jpg, ../ref/plan/yurt2024_pdf224_plan_yavas.png, kontrol/_tmp/*_ham.png · Çıktı: kontrol/v01/
import os, sys, json
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
URETIM = os.path.dirname(HERE); ESER = os.path.dirname(URETIM)
KONTROL = os.path.join(URETIM, "kontrol", "v01"); TMP = os.path.join(URETIM, "kontrol", "_tmp")
FOTO = os.path.join(ESER, "ref", "foto"); PLAN = os.path.join(ESER, "ref", "plan")
GRUP = (sys.argv[1] if len(sys.argv) > 1 else "A").split(",")
os.makedirs(KONTROL, exist_ok=True)
try:
    FONT = ImageFont.truetype("DejaVuSans.ttf", 22); FONT_K = ImageFont.truetype("DejaVuSans.ttf", 17)
except Exception:
    FONT = FONT_K = ImageFont.load_default()

def beyaz(im):
    im = im.convert("RGBA"); b = Image.new("RGBA", im.size, (255, 255, 255, 255)); b.alpha_composite(im); return b.convert("RGB")

def yan_yana(foto, ham, out, h=1000, crop=None, etiket=("Fotoğraf", "Model v01"), kaynak=None):
    f = Image.open(os.path.join(FOTO, foto)).convert("RGB")
    if crop: f = f.crop(crop)
    r = beyaz(Image.open(os.path.join(kaynak or TMP, ham)))
    f = f.resize((int(f.width * h / f.height), h)); r = r.resize((int(r.width * h / r.height), h))
    o = Image.new("RGB", (f.width + 16 + r.width, h + 40), "white"); o.paste(f, (0, 40)); o.paste(r, (f.width + 16, 40))
    d = ImageDraw.Draw(o); d.text((8, 8), f"{etiket[0]}: {foto}", fill="black", font=FONT_K); d.text((f.width + 24, 8), etiket[1], fill="black", font=FONT_K)
    o.save(os.path.join(KONTROL, out)); return out

# ---------------- plan bindirme ----------------
# pdf224 planında dış kenar: x 74–1077 px, y 24–1079 px (koyu çizgi sınırı). E 16,80 m'ye göre eksen başına ölçek:
PX0, PY0, SX, SY = 74, 24, 1003 / 16.80, 1055 / 16.80
def m2p(x, y): return (PX0 + (x + 8.40) * SX, PY0 + (8.40 - y) * SY)

def plan_bindirme(P):
    pl = Image.open(os.path.join(PLAN, "yurt2024_pdf224_plan_yavas.png")).convert("RGB")
    W, H = pl.width + 260, pl.height + 420
    o = Image.new("RGB", (W, H), "white"); o.paste(pl, (130, 40)); d = ImageDraw.Draw(o)
    q = lambda x, y: (m2p(x, y)[0] + 130, m2p(x, y)[1] + 40)
    red, blue = (220, 30, 30), (20, 90, 200)
    D2 = P["dis"] / 2; Di = D2 - P["duvar"]
    d.rectangle([q(-D2, D2), q(D2, -D2)], outline=red, width=3)                       # model dış yüz
    d.rectangle([q(-Di, Di), q(Di, -Di)], outline=red, width=2)                       # model iç yüz (duvar 1,30)
    # pencere ve kapı açıklıkları (model: net açıklık kırmızı, söve dışı mavi)
    e = P["pen_eksen"]; pw = P["pen_w"]; so = pw + 2 * P["pen_sove"]
    def acik(c, s, w, col, wd=4):
        if c in "KG":
            y = D2 if c == "K" else -D2; d.line([q(s - w / 2, y), q(s + w / 2, y)], fill=col, width=wd)
        else:
            x = D2 if c == "D" else -D2; d.line([q(x, s - w / 2), q(x, s + w / 2)], fill=col, width=wd)
    for c in "KDB":
        for s in (-e, 0, e): acik(c, s, so, blue, 8); acik(c, s, pw, red, 4)
    for s in (-e, e): acik("G", s, so, blue, 8); acik("G", s, pw, red, 4)
    acik("G", 0, P["kapi_plan_acik"], blue, 8); acik("G", 0, P["kapi_w"], red, 4)
    # giriş holü ve sundurma ayak izi (planda yok; fotoğraftan F)
    hw, hd, sd, sw = P["hol_w"] / 2, P["hol_d"], P["sun_d"], P["sun_w"] / 2
    d.rectangle([q(-hw, -D2), q(hw, -D2 - hd)], outline=red, width=3)
    d.rectangle([q(-sw, -D2 - hd), q(sw, -D2 - hd - sd)], outline=red, width=2)
    for sx in (-1, 1):
        cx, cy = q(sx * (sw - 0.11), -D2 - hd - sd + 0.11); d.ellipse([cx - 6, cy - 6, cx + 6, cy + 6], fill=red)
    # kasnak ve kubbe izdüşümü
    for r_, col in ((P["korn_k_r"], red), (P["kasnak_r"], (240, 120, 120))):
        a, b = q(-r_, r_), q(r_, -r_); d.ellipse([a, b], outline=col, width=2)
    # ölçü çizgileri
    def olcu(p1, p2, yazi, off, yatay=True):
        (x1, y1), (x2, y2) = p1, p2
        if yatay:
            y = y1 + off; d.line([(x1, y), (x2, y)], fill="black", width=2); d.line([(x1, y - 8), (x1, y + 8)], fill="black", width=2); d.line([(x2, y - 8), (x2, y + 8)], fill="black", width=2)
            tw = d.textlength(yazi, font=FONT_K); d.rectangle([((x1 + x2) / 2 - tw / 2 - 3, y - 22), ((x1 + x2) / 2 + tw / 2 + 3, y - 2)], fill="white"); d.text(((x1 + x2) / 2 - tw / 2, y - 22), yazi, fill="black", font=FONT_K)
        else:
            x = x1 + off; d.line([(x, y1), (x, y2)], fill="black", width=2); d.line([(x - 8, y1), (x + 8, y1)], fill="black", width=2); d.line([(x - 8, y2), (x + 8, y2)], fill="black", width=2)
            d.text((x + 6, (y1 + y2) / 2 - 10), yazi, fill="black", font=FONT_K)
    olcu(q(-D2, D2), q(D2, D2), "16,80 m (E)", -28)
    olcu(q(-D2, D2), q(-D2, -D2), "16,80 m (E)", -110, yatay=False)
    olcu(q(e, D2), q(0, D2), "4,15 (P)", -4)
    olcu(q(0, D2), q(-e, D2), "4,15 (P)", -4)
    olcu(q(D2, e), q(D2, 0), "4,15 (P)", 60, yatay=False)
    olcu(q(-D2, -D2 + 0.0), q(-Di, -D2), "1,30 (E)", 60)
    olcu(q(-hw, -D2 - hd - sd), q(hw, -D2 - hd - sd), f"hol {P['hol_w']:.2f} (F)".replace(".", ","), 90)
    olcu(q(-sw, -D2 - hd - sd), q(sw, -D2 - hd - sd), f"sundurma {P['sun_w']:.2f} (F)".replace(".", ","), 45)
    olcu(q(hw, -D2), q(hw, -D2 - hd), f"{P['hol_d']:.2f}".replace(".", ","), 40, yatay=False)
    olcu(q(sw, -D2 - hd), q(sw, -D2 - hd - sd), f"{P['sun_d']:.2f}".replace(".", ","), 120, yatay=False)
    t0 = pl.height + 40 + 200
    for i, s in enumerate(["Kırmızı: model v01 (dış/iç yüz, net açıklık, hol + sundurma, kasnak Ø 8,40 / korniş Ø 8,80). Mavi: söve dışı.",
                           "Ölçek: dış kenar = 16,80 m (E) → x 59,7 px/m, y 62,8 px/m. Çizim %5 dikdörtgen (1003 × 1055 px); iki eksen ayrı ölçeklendi.",
                           "Çizimdeki ölçek çubuğu (0–5 m, 49,6 px/m) dış ölçüyü 20,22 × 21,27 m gösteriyor: E'den %20,4 / %26,6 büyük.",
                           "Hol ve sundurma planda yok: fotoğraftan (F). Kapı ve pencere eksenleri plandan (P), net genişlikler fotoğraftan (F)."]):
        d.text((20, t0 + 26 * i), s, fill="black", font=FONT_K)
    o.save(os.path.join(KONTROL, "plan_bindirme.png"))

if __name__ == "__main__":
    P = json.load(open(os.path.join(TMP, "P_v01.json"), encoding="utf-8"))
    if "A" in GRUP:
        yan_yana("arsiv_dis_guneybati_havadan.jpg", "kutle_havadan_ham.png", "kutle_havadan.png")
        yan_yana("arsiv_havadan_kuzey.jpg", "kuzey_havadan_ham.png", "kutle_kuzey.png")
        # tepeden fotoğraf: Orhan Gazi Türbesi (sağdaki kare yapı) çevresinde 30 × 30 m kesit (ölçek: saçak 17,5 m ↔ 484 px)
        yan_yana("arsiv_tepeden_osman-orhan.jpg", "ust_orto_ham.png", "ust_orto.png", crop=(1189, 539, 2020, 1370))
        plan_bindirme(P)
    if "B" in GRUP:
        # yurt2024 sayfalarındaki fotoğraf kesitleri (sayfa pikseli)
        yan_yana("yurt2024_pdf318_giris_sundurma.jpg", "guney_cephe_ham.png", "guney_cephe.png", crop=(151, 128, 844, 521))
        yan_yana("yurt2024_pdf321_pencere_kilit_tasi.jpg", "pencere_yakin_ham.png", "pencere_yakin.png", crop=(353, 757, 598, 1152))
        yan_yana("yurt2024_pdf324_kose_pilastr.jpg", "kose_yakin_ham.png", "kose_yakin.png", crop=(151, 128, 844, 604))
        yan_yana("yurt2024_pdf319_kapi_alinlik.jpg", "kapi_ic_ham.png", "kapi_yakin.png", crop=(151, 343, 809, 874))
        yan_yana("yurt2024_pdf320_giris_yan.jpg", "sundurma_yakin_ham.png", "sundurma_yakin.png", crop=(151, 128, 844, 521))
        yan_yana("arsiv_dis_guneybati_havadan.jpg", "kasnak_yakin_ham.png", "kasnak_yakin.png", crop=(880, 380, 1560, 900))
        yan_yana("arsiv_dis_guneybati_havadan.jpg", "kutle_havadan_ham.png", "detay_havadan.png")
        yan_yana("yurt2024_pdf318_giris_sundurma.jpg", "kapi_yakin_ham.png", "hol_kapi.png", crop=(151, 553, 844, 945))
    if "C" in GRUP:
        # onay C: sunum render'ları (kontrol/v01/sunum_*.png, kaideli) ve tepeden ortografik (kontrol/_tmp) fotoğraflarla yan yana
        yan_yana("arsiv_dis_guneybati_havadan.jpg", "sunum_havadan_kd.png", "yan_yana_havadan_kd.png", kaynak=KONTROL)      # iki arsiv fotoğrafı da doğudan
        yan_yana("arsiv_havadan_kuzey.jpg", "sunum_havadan_dogu.png", "yan_yana_havadan_dogu.png", kaynak=KONTROL)
        yan_yana("yurt2024_pdf318_giris_sundurma.jpg", "sunum_guney.png", "yan_yana_guney.png", crop=(151, 128, 844, 521), kaynak=KONTROL)
        yan_yana("yurt2024_pdf323_cephe_pencereler.jpg", "sunum_kd.png", "yan_yana_kuzeydogu.png", crop=(151, 128, 844, 521), kaynak=KONTROL)
        yan_yana("arsiv_tepeden_osman-orhan.jpg", "ust_orto_ham.png", "yan_yana_ust.png", crop=(1189, 539, 2020, 1370))
    print("tamam", GRUP)
