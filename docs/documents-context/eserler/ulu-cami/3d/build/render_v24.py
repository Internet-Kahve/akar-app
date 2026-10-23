"""Ulu Cami v24 son kontrol render'ları. Modele DOKUNMAZ: blend kaydedilmez, GLB dışa aktarılmaz.
Çalıştır: Blender -b ../blend/ulu-cami_v24.blend --python render_v24.py [-- grup,grup]
Gruplar: yan, sunum, genel, yakin (varsayılan: hepsi). Kamera konumları build_v23.py'den (orijin değişmedi, OFS = 0,55; 8,9 yalnız
şadırvan/çeşme çevresinde v23'teki gibi eklenir); v23'te karşılığı olmayanlar (üst 20 kubbe, dört yön, yakın çekimler) bu betikte tanımlıdır.
Çıktı: ../kontrol/v24/ ; geçici: ../kontrol/_tmp/
"""
import bpy, math, sys, os
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ESER = os.path.dirname(HERE)
KONTROL = os.path.join(ESER, "kontrol", "v24")
TMP = os.path.join(ESER, "kontrol", "_tmp")
FOTO = os.path.join(ESER, "..", "ref", "foto")
sc = bpy.context.scene
GRUP = (sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "yan,sunum,genel,yakin").split(",")
ORNEK = int(os.environ.get("RV24_ORNEK", "48"))
SADECE = os.environ.get("RV24_SADECE", "")                       # virgülle: yalnız bu çıktı adları (iterasyon için)
OFS = Vector((0.55, 8.9, 0.0))
os.makedirs(KONTROL, exist_ok=True); os.makedirs(TMP, exist_ok=True)


def kamera(loc, tgt, lens=50, ortho=None, rot=None, ad="_c"):
    cd = bpy.data.cameras.new(ad); cd.lens = lens; cd.clip_end = 3000
    if ortho: cd.type = 'ORTHO'; cd.ortho_scale = ortho
    cam = bpy.data.objects.new(ad, cd); sc.collection.objects.link(cam); sc.camera = cam; cam.location = loc
    cam.rotation_euler = rot if rot else (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return cam


def render(yol, res, ornek=None):
    sc.render.engine = 'CYCLES'; sc.cycles.samples = ornek or ORNEK; sc.cycles.device = 'CPU'
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.film_transparent = False
    sc.render.filepath = yol; bpy.ops.render.render(write_still=True)


def istenen(ad): return (not SADECE) or ad in SADECE.split(",")


def yukle(yol, h):
    im = bpy.data.images.load(yol); w0, h0 = im.size
    a = np.array(im.pixels[:], dtype=np.float32).reshape(h0, w0, 4); bpy.data.images.remove(im)
    w = int(w0 * h / h0); ix = (np.arange(w) * (w0 / w)).astype(int); iy = (np.arange(h) * (h0 / h)).astype(int)
    r = a[iy][:, ix]; r[..., 3] = 1; return r


def kaydet(a, yol):
    im = bpy.data.images.new("_o", a.shape[1], a.shape[0], alpha=True); im.pixels = a.ravel()
    im.filepath_raw = yol; im.file_format = 'PNG'; im.save(); bpy.data.images.remove(im)


def yan_yana(foto, rnd, out, h=1100):
    f = yukle(os.path.join(FOTO, foto), h); r = yukle(os.path.join(TMP, rnd), h)
    kaydet(np.concatenate([f, np.ones((h, 16, 4), np.float32), r], axis=1), os.path.join(KONTROL, out))


def foto_res(foto, h=1100):
    im = bpy.data.images.load(os.path.join(FOTO, foto)); w0, h0 = im.size; bpy.data.images.remove(im); return (int(w0 * h / h0), h)


SD = Vector((-15.0, -39.0, 0)) + OFS; CC = Vector((0, -39.0, 0)) + OFS; IC3 = Vector((0.0, -6.4, 0)) + OFS
MERKEZ = (0.55, 4.61)
DAIRE = Vector((MERKEZ[0], MERKEZ[1], 0))

# (çıktı, foto, kamera kwargs, özel)
YAN = [
    ("yan_yana_kuzeybati.png", "ulucamii_009_havadan_kuzeybati.jpg", dict(loc=(70, -96, 60), tgt=(0, -2, 6), lens=36)),
    ("yan_yana_tac_kapi.png", "ulucamii_001_kuzey_tac_kapi.jpg", dict(loc=(0.5, -46.5, 6.5), tgt=(0.5, -20, 6.5), lens=45)),
    # foto 002: kuzey yukarıda, batı minare solda → tepeden bakış, görüntü yukarısı = −Y (kuzey), sağı = −X (doğu): z ekseninde 180°
    ("yan_yana_ust_20_kubbe.png", "ulucamii_002_havadan_ust_20_kubbe.jpg", dict(loc=(0.55, 4.0, 200), tgt=None, lens=50, ortho=118, rot=(0, 0, math.pi))),
    ("yan_yana_bati_minare.png", "ulucamii_016_bati_cephe_bati_minare_kaide.jpg", dict(loc=(47, -35, 11), tgt=(18, -21, 7), lens=24)),
    ("yan_yana_avlu_sadirvan.png", "ulucamii_095_avlu_sadirvan_ust_ortu.jpg", dict(loc=SD + Vector((0, 11.3, 1.5)), tgt=SD + Vector((0, 0, 3.7)), lens=26)),
    ("yan_yana_mermer_cesme.png", "ulucamii_096_avlu_mermer_cesme.jpg", dict(loc=CC + Vector((4.2, -1.8, 1.5)), tgt=CC + Vector((-5.0, 1.8, 1.9)), lens=20)),
    ("yan_yana_ic_sadirvan.png", "ulucamii_105_ic_sadirvan_havuz_yakin.jpg", dict(loc=IC3 + Vector((-5.1, -0.8, 2.0)), tgt=IC3 + Vector((0, 0.3, 0.8)), lens=20, isik=True)),
]
SUNUM = [("sunum_01_kuzeybati.png", (66, -92, 40), (0, -6, 12), 28),
         ("sunum_02_tac_kapi_avlu.png", (0.5, -58, 7.5), (0.5, -22, 7.5), 30),
         ("sunum_03_guneydogu.png", (-84, 82, 40), (0, -2, 10), 34),
         ("sunum_04_bati_cephe_minare.png", (78, -30, 13), (33, 0, 18), 30),
         ("sunum_05_sadirvan.png", (-3, -42, 3.4), (-14.5, -30, 4.5), 30)]
cx, cy = MERKEZ
# dört yön: kuzey = −Y, doğu = −X, güney = +Y, batı = +X (modelde batı minare +X)
DORT = [("Kuzey", (cx, cy - 300, 24), (cx, cy, 24)), ("Dogu", (cx - 300, cy, 24), (cx, cy, 24)),
        ("Guney", (cx, cy + 300, 24), (cx, cy, 24)), ("Bati", (cx + 300, cy, 24), (cx, cy, 24))]
# yakın kontrol (kamera, çıktı) — Kapi_Bati x≈35, açıkta duran Insan_06/07/08 ≈(1,−26)/(−1,−27,5)/(0,−27) (01/02 şadırvan içinde), Kubbeler_19 kuzeybatı kubbesi ≈(25.5,−11)
YAKIN = [("yakin_sebeke.png", dict(loc=(-24.5, -23.5, 7.0), tgt=(-26.85, -18.66, 6.9), lens=50), (1300, 1000)),
         ("yakin_bati_kapi.png", dict(loc=(43.5, 3.3, 3.2), tgt=(35.2, 2.45, 2.9), lens=40), (1300, 1000)),
         ("yakin_figurler.png", dict(loc=(4.5, -34.0, 1.9), tgt=(0.4, -27.0, 1.0), lens=40), (1400, 1000)),
         ("yakin_sadirvan_taban.png", dict(loc=(-11.5, -32.5, 2.0), tgt=(-15.4, -27.0, 1.0), lens=45), (1400, 1000)),   # Avlu_Sadirvan_Dogu havuz tabanı: siyah şerit kontrolü
         ("yakin_kubbe_etek.png", dict(loc=(45, -27, 21), tgt=(26, -12, 16.5), lens=45), (1400, 1000))]


def foto_ile(foto, ad, **k):
    pass


def kam(k):
    k = dict(k); isik = k.pop("isik", False); tgt = k.pop("tgt", None); loc = k.pop("loc"); return kamera(Vector(loc), tgt or loc, **k), isik


def temizle():
    for o in [o for o in bpy.data.objects if o.name.startswith("_c") or o.name == "_ic_isik"]: bpy.data.objects.remove(o, do_unlink=True)


if "yan" in GRUP:
    for out, foto, k in YAN:
        if not istenen(out): continue
        cam, isik = kam(k); li = None
        if isik:
            li = bpy.data.objects.new("_ic_isik", bpy.data.lights.new("_ic_isik", 'POINT')); sc.collection.objects.link(li)   # yalnız render: iç mekâna ışık (kaydedilmez)
            li.data.energy = 1200; li.data.shadow_soft_size = 2.0; li.location = IC3 + Vector((0, 0, 11.0))
        r = "_" + out; render(os.path.join(TMP, r), foto_res(foto)); yan_yana(foto, r, out)
        if li: bpy.data.objects.remove(li, do_unlink=True)
        temizle()
if "sunum" in GRUP:
    for ad, cl, tg, ln in SUNUM:
        if not istenen(ad): continue
        kamera(Vector(cl), Vector(tg), lens=ln); render(os.path.join(KONTROL, ad), (1800, 1200), ornek=max(ORNEK, 96)); temizle()
if "genel" in GRUP:
    if istenen("dort_yon.png"):
        tum = []
        for ad, cl, tg in DORT:
            kamera(Vector(cl), Vector(tg), ortho=124); render(os.path.join(TMP, "_dy_%s.png" % ad), (1000, 700)); temizle()
            tum.append(yukle(os.path.join(TMP, "_dy_%s.png" % ad), 700))
        ara = np.ones((700, 16, 4), np.float32); sat = np.ones((16, 2016, 4), np.float32)
        # Blender piksel satırları alttan başlar: üst sıra (kuzey, doğu) en sona yazılır
        kaydet(np.concatenate([np.concatenate([tum[2], ara, tum[3]], 1), sat, np.concatenate([tum[0], ara, tum[1]], 1)], 0), os.path.join(KONTROL, "dort_yon.png"))
    if istenen("ust_orto.png"):
        kamera(Vector((cx, cy, 300)), Vector((cx, cy, 0)), ortho=124, rot=(0, 0, math.pi)); render(os.path.join(KONTROL, "ust_orto.png"), (1400, 1400)); temizle()
if "yakin" in GRUP:
    for ad, k, res in YAKIN:
        if not istenen(ad): continue
        kam(k); render(os.path.join(KONTROL, ad), res); temizle()
print("TAMAM", GRUP)
