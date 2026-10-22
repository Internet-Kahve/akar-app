# AKAR · Emir Hanı v05 · render seti (render_emir_v03.py'nin kopyası; kameralar blend'e kayıtlı CAM_* nesneleri) + önce/sonra
# Modele DOKUNMAZ: blend kaydedilmez, GLB dışa aktarılmaz, kontrol_rapor.json yazılmaz.
# Çalıştır: Blender -b ../blend/emir-hani_v05.blend --python render_emir_v05.py [-- grup,grup]
#   Gruplar: tek, sunum, dort_yon, yan, arka, once_sonra (varsayılan: hepsi). EMIR_ORNEK = Cycles örnek sayısı (24; sunum en az 48)
#   EMIR_SADECE = virgülle yalnız bu çıktı adları (uzantısız)
#   once_sonra: üst kat revak ayakları (v05 düzeltmesi) için v04 ve v05 aynı kameradan, üstte v04 altta v05.
#     Önce v04 blend'inde çalıştırılır (-- once_sonra; yalnız _tmp'ye v04 kareleri yazar), sonra v05 blend'inde (birleştirir).
# Çıktı: ../kontrol/emir_v05/ ; geçici: ../kontrol/_tmp/
import sys, os, math
import bpy
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 3, "_kutuphane")))
import akar3d as A

URETIM = os.path.dirname(HERE)
KONTROL = os.path.join(URETIM, "kontrol", "emir_v05")
TMP = os.path.join(URETIM, "kontrol", "_tmp")
FOTO = os.path.join(URETIM, "..", "ref", "foto")
sc = bpy.context.scene
GRUP = (sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "tek,sunum,dort_yon,yan,arka,once_sonra").split(",")
SURUM = "v05" if bpy.data.filepath.endswith("_v05.blend") else "v04" if bpy.data.filepath.endswith("_v04.blend") else "?"
ORNEK = int(os.environ.get("EMIR_ORNEK", "24"))
SADECE = [s for s in os.environ.get("EMIR_SADECE", "").split(",") if s]
os.makedirs(KONTROL, exist_ok=True); os.makedirs(TMP, exist_ok=True)

# build_emir_v05.py (= v03) P ve kaide değerleri (kontrol_ozeti.md: kaide R 37,39 = en küçük çember 34,39 + 3, merkez (0; 0))
OX, OY, AX, AY = 23.0, 25.0, 12.75, 12.75
KANAT_X, KANAT_Y, MAHYA, ZS = 10.25, 12.25, 11.0, 4.0
K_MERKEZ, K_R, K_R0 = Vector((0.0, 0.0, 0.0)), 37.39, 34.39


def cihaz():
    # Apple Silicon'da Metal GPU varsa onu kullan, yoksa CPU
    try:
        pr = bpy.context.preferences.addons["cycles"].preferences; pr.compute_device_type = 'METAL'; pr.get_devices()
        for d in pr.devices: d.use = True
        pr.kernel_optimization_level = 'OFF'   # arka planda özelleştirilmiş kernel derlemesi Blender 5.2.2'de çöküyor (MetalKernelPipeline::compile)
        sc.cycles.device = 'GPU' if any(d.type == 'METAL' for d in pr.devices) else 'CPU'
    except (KeyError, TypeError): sc.cycles.device = 'CPU'


def istenen(ad): return (not SADECE) or ad in SADECE


def render(kam, yol, res, ornek=None):
    sc.render.engine = 'CYCLES'; sc.cycles.samples = ornek or ORNEK; cihaz(); sc.render.film_transparent = False; sc.render.resolution_percentage = 100
    sc.camera = bpy.data.objects[kam]; sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.filepath = yol; bpy.ops.render.render(write_still=True)


# ölçü çizgileri (build_emir_v03.py olcu_cizgi / olculeri_kur ile aynı; yalnız render)
def olcu_cizgi(a, b, z, ad, metin, ofs_yazi, renk="#C01818", boy=1.5):
    m = A.mat("_olcu" + renk[1:], renk, 0.9); a, b = Vector(a), Vector(b); d = b - a; L = d.length
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=((a.x + b.x) / 2, (a.y + b.y) / 2, z)); o = bpy.context.active_object; o.name = "_olcu_" + ad
    o.scale = (L, 0.12, 0.05); o.rotation_euler = (0, 0, math.atan2(d.y, d.x)); o.data.materials.append(m)
    for p in (a, b):
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(p.x, p.y, z)); t_ = bpy.context.active_object; t_.name = "_olcu_" + ad + "_uc"
        t_.scale = (0.12, 1.4, 0.05); t_.rotation_euler = (0, 0, math.atan2(d.y, d.x)); t_.data.materials.append(m)
    cu = bpy.data.curves.new("_olcu_yazi_" + ad, 'FONT'); cu.body = metin; cu.size = boy; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    ty = bpy.data.objects.new("_olcu_yazi_" + ad, cu); sc.collection.objects.link(ty); ty.data.materials.append(m)
    ty.location = ((a.x + b.x) / 2 + ofs_yazi[0], (a.y + b.y) / 2 + ofs_yazi[1], z + 0.1)
    ang = math.atan2(d.y, d.x); ty.rotation_euler = (0, 0, ang if abs(ang) < 2 else ang - math.pi)


def olculeri_kur():
    zt = MAHYA + 0.5
    olcu_cizgi((-OX, -OY - 4), (OX, -OY - 4), zt, "dx", "46,00 m (D–B)  E Vakıf 1983", (0, -1.6))
    olcu_cizgi((OX + 4, -OY), (OX + 4, OY), zt, "dy", "50,00 m (K–G)  E Vakıf 1983", (1.6, 0))
    olcu_cizgi((-AX, -2.0), (AX, -2.0), 1.0, "ax", "avlu 25,50 m  H √650", (0, -1.4), "#1848C0", 1.2)
    olcu_cizgi((2.0, -AY), (2.0, AY), 1.0, "ay", "25,50 m", (1.3, 0), "#1848C0", 1.2)
    olcu_cizgi((OX - KANAT_X, 6.0), (OX, 6.0), zt, "kx", "10,25", (0, 1.0), "#1848C0", 1.1)
    olcu_cizgi((-6.0, OY - KANAT_Y), (-6.0, OY), zt, "ky", "12,25", (-1.2, 0), "#1848C0", 1.1)
    olcu_cizgi((K_MERKEZ.x - K_R, -OY - 9.5), (K_MERKEZ.x + K_R, -OY - 9.5), ZS + 0.3, "kaide", f"daire kaide Ø {2 * K_R:.2f} m (en küçük çember R {K_R0:.2f} + 3 m)".replace(".", ","), (0, 1.5), "#505050", 1.3)
    cu = bpy.data.curves.new("_olcu_yazi_K", 'FONT'); cu.body = "K ↑"; cu.size = 2.4
    ty = bpy.data.objects.new("_olcu_yazi_K", cu); sc.collection.objects.link(ty); ty.data.materials.append(A.mat("_olcuC01818", "#C01818", 0.9))
    ty.location = (OX + 2, OY + 4, MAHYA + 0.6)


def olculeri_sil():
    for o in [o for o in bpy.data.objects if o.name.startswith("_olcu")]: bpy.data.objects.remove(o, do_unlink=True)


# yan yana (araclar/yan_yana_v03.py düzeni: solda fotoğraf, 16 px beyaz ara, sağda render, aynı yükseklik); PIL yerine bpy + numpy
def yukle(yol, h, kirp_sag=False, dondur=0):
    im = bpy.data.images.load(yol); w0, h0 = im.size
    a = np.array(im.pixels[:], dtype=np.float32).reshape(h0, w0, 4); bpy.data.images.remove(im)
    if kirp_sag: a = a[:, w0 // 2 + 5:]                                   # vakif_1983_pdf176: sayfanın sağ yarısı
    if dondur: a = np.ascontiguousarray(np.rot90(a, -dondur // 90))        # PIL rotate(-dondur) ile aynı yön (satırlar alttan başlar)
    h0, w0 = a.shape[:2]; w = round(w0 * h / h0)
    tmp = bpy.data.images.new("_yy", w0, h0, alpha=True); tmp.pixels = a.ravel(); tmp.scale(w, h)
    r = np.array(tmp.pixels[:], dtype=np.float32).reshape(h, w, 4); bpy.data.images.remove(tmp); r[..., 3] = 1; return r


def kaydet(a, yol):
    im = bpy.data.images.new("_o", a.shape[1], a.shape[0], alpha=True); im.pixels = a.ravel()
    im.filepath_raw = yol; im.file_format = 'PNG'; im.save(); bpy.data.images.remove(im)


# (çıktı, kamera, çözünürlük) — yalnız tek kare
TEK = [("havadan", "CAM_Havadan", (1800, 1600)), ("ust_orto", "CAM_Ust", (1600, 1600)),
       ("guney_revak", "CAM_GRevak", (1500, 1000)),
       ("yakin_sadirvan_taban", "CAM_SadYakin", (1300, 950)), ("yakin_figurler", "CAM_FigYakin", (1400, 1000)),
       ("yakin_giris_figur", "CAM_GirFig", (1400, 1000)), ("yakin_agac", "CAM_AgacYakin", (1300, 950))] + \
      [(ad, "CAM_" + ad, (1300, 950)) for ad in ("yakin_revak_kose", "yakin_korkuluk", "yakin_kapi_kuzey", "yakin_gecit_ic", "yakin_kapi_guney", "yakin_pencere_baca")]
SUNUM = ["sunum_01_guneybati", "sunum_02_kuzey_giris", "sunum_03_kuzeydogu", "sunum_04_avlu", "sunum_05_sadirvan"]
# (çıktı, foto, kamera, render çözünürlüğü, yükseklik, kırp_sağ, döndür) — foto eşleşmeleri build_emir_v03.py kamera yorumlarından
YAN = [("yan_yana_havadan_vakif", "vakif_1983_pdf176_havadan.png", "CAM_Vakif", (1460, 1000), 1000, True, -90),
       ("yan_yana_dis_cephe", "1578509543.jpg", "CAM_Dis", (1500, 1000), 900, False, 0),
       ("yan_yana_guney_ulucami", "1578509455.jpg", "CAM_Guney", (1500, 1000), 900, False, 0),
       ("yan_yana_kuzey_giris", "Emir-Hani-1.jpg", "CAM_Kuzey", (1500, 1000), 900, False, 0),
       ("yan_yana_avlu_ici", "Emir-Hani-4.jpg", "CAM_Avlu", (1500, 1000), 900, False, 0),
       ("yan_yana_avlu_genel", "emirhan-bursa-ulucami2.jpg.webp", "CAM_AvluGenel", (1600, 1200), 900, False, 0)]

if "tek" in GRUP:
    for ad, kam, res in TEK:
        if not istenen(ad): continue
        if ad == "ust_orto": olculeri_kur()
        render(kam, os.path.join(KONTROL, ad + ".png"), res)
        if ad == "ust_orto": olculeri_sil()
if "sunum" in GRUP:
    for ad in SUNUM:
        if istenen(ad): render("CAM_" + ad, os.path.join(KONTROL, ad + ".png"), (1800, 1200), ornek=max(ORNEK, 48))
if "dort_yon" in GRUP and istenen("dort_yon"):
    tum = {}
    for ad in ("Kuzey", "Dogu", "Guney", "Bati"):
        yol = os.path.join(TMP, f"_dy_{ad}.png"); render("CAM_Orto_" + ad, yol, (1000, 700)); tum[ad] = yukle(yol, 700)
    ara = np.ones((700, 16, 4), np.float32); sat = np.ones((16, 2016, 4), np.float32)
    kaydet(np.concatenate([np.concatenate([tum["Guney"], ara, tum["Bati"]], 1), sat, np.concatenate([tum["Kuzey"], ara, tum["Dogu"]], 1)], 0),
           os.path.join(KONTROL, "dort_yon.png"))   # Blender satırları alttan başlar: üst sıra kuzey, doğu
if "yan" in GRUP:
    for ad, foto, kam, res, h, kirp, don in YAN:
        if not istenen(ad): continue
        r = os.path.join(TMP, "_" + ad + ".png"); render(kam, r, res)
        f = yukle(os.path.join(FOTO, foto), h, kirp, don); rr = yukle(r, h)
        kaydet(np.concatenate([f, np.ones((h, 16, 4), np.float32), rr], axis=1), os.path.join(KONTROL, ad + ".png"))
if "arka" in GRUP and istenen("kontrol"):
    zemin = [o for o in bpy.data.objects if o.name.startswith("Zemin")]   # build'de kontrol kaide ve sokaktan önce alınır: aynı görüntü için gizle
    for o in zemin: o.hide_render = True
    oran = A.arka_yuz_render(KONTROL, "kontrol")                       # kontrol_0…7: arka yüzler kırmızı (akar3d)
    for o in zemin: o.hide_render = False
    print("ARKA_YUZ_KIRMIZI", [round(x, 5) for x in oran])
# önce/sonra (v05): üst kat revak ayakları; kameralar burada tanımlı (blend'e kaydedilmez)
OS_KAM = [("once_sonra_kuzey_revak_avludan", (-2.0, -4.0, 6.5), (-2.0, 13.0, 6.5), 24, (1400, 900)),     # avludan kuzey cepheye, üst kat hizası
          ("once_sonra_bati_revak_avludan", (4.0, 2.0, 6.5), (-13.0, 2.0, 6.5), 24, (1400, 900)),        # avludan batı cepheye
          ("once_sonra_dogu_revak_ici", (AX + 2.7, -AY - 1.6, 6.1), (AX + 2.2, AY, 5.6), 22, (1400, 900)),   # doğu üst revak içinden kuzeye
          ("once_sonra_avlu_genel", None, None, None, (1600, 1200))]                                     # CAM_AvluGenel (F emirhan-bursa-ulucami2)
if "once_sonra" in GRUP:
    for ad, l_, t_, ln_, res in OS_KAM:
        if not istenen(ad): continue
        if l_:
            cd = bpy.data.cameras.new("_os"); cd.lens = ln_; cd.clip_start = 0.1; cam = bpy.data.objects.new("_os_" + ad, cd); sc.collection.objects.link(cam)
            cam.location = Vector(l_); cam.rotation_euler = (Vector(t_) - cam.location).to_track_quat('-Z', 'Y').to_euler(); kam = cam.name
        else: kam = "CAM_AvluGenel"
        yol = os.path.join(TMP, f"_{ad}_{SURUM}.png"); render(kam, yol, res)
        on = os.path.join(TMP, f"_{ad}_v04.png")
        if SURUM == "v05" and os.path.exists(on):
            h = res[1]; a, b = yukle(on, h), yukle(yol, h)
            kaydet(np.concatenate([b, np.ones((16, b.shape[1], 4), np.float32), a], axis=0), os.path.join(KONTROL, ad + ".png"))   # satırlar alttan: üstte v04, altta v05
print("TAMAM", SURUM, GRUP)
