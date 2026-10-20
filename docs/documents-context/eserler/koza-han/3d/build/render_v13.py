# AKAR · Koza Han v13 · render seti (build_v13.py render bölümünün varsayılan KOZA_RENDER listesi; v12 kontrol klasöründeki görsellerin aynısı)
# Modele DOKUNMAZ: blend kaydedilmez, GLB dışa aktarılmaz, kontrol_rapor.json yazılmaz.
# Çalıştır: Blender -b ../blend/koza-han_v13.blend --python render_v13.py [-- ad,ad]
#   Adlar: build_v13.py KOZA_RENDER adları + "arka" (kontrol_0…7). Boş = hepsi. KOZA_ORNEK = Cycles örnek sayısı (24)
# Kamera değerleri build_v13.py'den (KOZA_HIZLI=1 kuru çalıştırma, üçgen toplamı 45 854 = v13 raporu): blend'de yalnız CAM_Havadan, CAM_Avlu_Genel, CAM_Ic_Avlu kayıtlı.
# Çıktı: ../kontrol/v13/
import sys, os, math
import bpy, bmesh
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 3, "_kutuphane")))
import akar3d as A

URETIM = os.path.dirname(HERE)
KONTROL = os.path.join(URETIM, "kontrol", "v13")
sc = bpy.context.scene
TUM = "havadan,avlu_genel,ic_koza,ic_koza_avlu,ic_koza_dis,gecit,kapi,merdiven_ic,kitabe,portal,havadan_dik,mescit_kesit,mescit_foto,mescit_yakin,merdiven,cati,revak,arka"
RENDERLER = (sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv and sys.argv.index("--") + 1 < len(sys.argv) else TUM).split(",")
ORNEK = int(os.environ.get("KOZA_ORNEK", "24"))
os.makedirs(KONTROL, exist_ok=True)

# build_v13.py türetilmiş değerleri
OY, AY, RY = 36.0, 23.0, 28.0
IC_CY = 8.363636363636363                                          # bay_centers(11, AY)[0][7]
y2, HOL_E, ap = 41.25, 34.6, 3.39
dv = Vector((-math.sqrt(0.5), math.sqrt(0.5))); tv = Vector((-dv.y, dv.x))
KAIDE = bpy.data.objects["Zemin_Kaide"]


def cihaz():
    # Apple Silicon'da Metal GPU varsa onu kullan, yoksa CPU
    try:
        pr = bpy.context.preferences.addons["cycles"].preferences; pr.compute_device_type = 'METAL'; pr.get_devices()
        for d in pr.devices: d.use = True
        pr.kernel_optimization_level = 'OFF'   # arka planda özelleştirilmiş kernel derlemesi Blender 5.2.2'de çöküyor (MetalKernelPipeline::compile)
        sc.cycles.device = 'GPU' if any(d.type == 'METAL' for d in pr.devices) else 'CPU'
    except (KeyError, TypeError): sc.cycles.device = 'CPU'


# build_v13.py kamera / render / kamera_iso ile aynı (render saydam, kaide isteğe bağlı)
def kamera(ad, loc, hedef, orto=None, lens=35, clip0=0.1):
    cd = bpy.data.cameras.get(ad) or bpy.data.cameras.new(ad)
    if orto: cd.type = 'ORTHO'; cd.ortho_scale = orto
    else: cd.type = 'PERSP'; cd.lens = lens
    cd.clip_start = clip0; cd.clip_end = 2000
    cam = bpy.data.objects.get(ad) or bpy.data.objects.new(ad, cd)
    if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
    cam.location = Vector(loc); cam.rotation_euler = (Vector(hedef) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    return cam


def render(cam, ad, res=(1400, 900), saydam=True, kaide_goster=True):
    sc.render.engine = 'CYCLES'; sc.cycles.samples = ORNEK; cihaz()
    sc.camera = cam; sc.render.resolution_x, sc.render.resolution_y = res; sc.render.film_transparent = saydam
    KAIDE.hide_render = not kaide_goster
    sc.render.filepath = os.path.join(KONTROL, f"{ad}.png"); bpy.ops.render.render(write_still=True)


def hepsini_ac():
    for o in bpy.data.objects:
        if o.type == "MESH": o.hide_render = o.name.startswith(("_kes_", "Zemin_Kaide"))


if "havadan" in RENDERLER: render(bpy.data.objects["CAM_Havadan"], "havadan", (1800, 1600))       # kamera_iso(ORT, 280, 32, 45, 205), blend'de kayıtlı
if "havadan_dik" in RENDERLER: render(kamera("CAM_Dik", (22, 2.4, 300), (22, 2.4, 0), orto=150), "havadan_dik_ham", (1600, 1300), kaide_goster=False)
if "avlu_genel" in RENDERLER: render(kamera("CAM_Avlu_Genel", (-14, -14, 20), (6, 10, 3), lens=24), "avlu_genel", (1600, 1000))
if "ic_koza_avlu" in RENDERLER: render(kamera("CAM_Ic_Avlu", (41.0, -3.0, 2.0), (52.0, 15.0, 2.0), lens=22), "ic_koza_avlu", (1600, 1100), kaide_goster=False)
if "ic_koza_dis" in RENDERLER: render(kamera("CAM_Ic_Dis", (52.0, -27.0, 2.2), (68.0, 0.0, 2.6), lens=26), "ic_koza_dis", (1600, 1100), kaide_goster=False)
KAPI_KAM = {"kapi_gecit_dis": ((40.0, IC_CY, 1.8), (32.0, IC_CY, 2.6), 24), "kapi_gecit_ic": ((14.0, IC_CY, 1.8), (24.0, IC_CY, 2.4), 24), "kapi_gecit_orta": ((31.0, IC_CY, 1.6), (24.0, IC_CY, 2.4), 20),
            "kapi_portal_dis": ((0.0, y2 + 9.0, 2.2), (0.0, OY, 3.8), 28), "kapi_portal_ic": ((0.0, AY - 6.0, 1.8), (0.0, RY, 2.8), 24), "kapi_portal_orta": ((0.0, OY + 3.0, 1.7), (0.0, HOL_E, 3.4), 22)}
if "kapi" in RENDERLER:
    for _ad, (_l, _t, _ln) in KAPI_KAM.items(): render(kamera("CAM_" + _ad, _l, _t, lens=_ln), _ad, (1400, 1000), kaide_goster=False)
if "gecit" in RENDERLER: render(kamera("CAM_Gecit", (43.0, 3.5, 1.7), (32.0, 8.4, 2.7), lens=22), "gecit_ic_koza", (1400, 1100), kaide_goster=False)
if "merdiven_ic" in RENDERLER:
    for _o in bpy.data.objects:
        if _o.name.startswith("Olcek_Insan_07"): _o.hide_render = True
    render(kamera("CAM_Merdiven_Ic", (dv.x * 6.6 + tv.x * -0.5, dv.y * 6.6 + tv.y * -0.5, 2.9), (dv.x * 5.5 + tv.x * 1.1, dv.y * 5.5 + tv.y * 1.1, 3.3), lens=24), "merdiven_ic", (1400, 1000), kaide_goster=False)
    for _o in bpy.data.objects:
        if _o.name.startswith("Olcek_Insan_07"): _o.hide_render = False
if "kitabe" in RENDERLER: render(kamera("CAM_Kitabe", (-math.sqrt(0.5) * (ap + 3.0), math.sqrt(0.5) * (ap + 3.0), 4.9), (-math.sqrt(0.5) * ap, math.sqrt(0.5) * ap, 5.6), lens=35), "kitabe_yakin", (1000, 1500), kaide_goster=False)
if "ic_koza" in RENDERLER: render(kamera("CAM_Ic_Koza", (132, -42, 42), (62, 8, 3), lens=30), "ic_koza", (1600, 1000))
if "portal" in RENDERLER: render(kamera("CAM_Portal", (6, OY + 26, 7), (0, OY + 3.5, 5.5), lens=40), "portal", (1400, 1000))
if "mescit_kesit" in RENDERLER:
    # A–A kesiti: mescit y = 0 düzleminden kesilir (bisect), yalnız kesilmiş kopyalar çizilir (build_v13.py ile aynı)
    for ad in ("Avlu_Mescit", "Mescit_Kubbe", "Mescit_Dikis"):
        src = bpy.data.objects[ad]; me2 = src.data.copy(); ob = bpy.data.objects.new("_kes_" + ad, me2); sc.collection.objects.link(ob)
        bm = bmesh.new(); bm.from_mesh(me2)
        bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 1, 0), clear_inner=True)
        bm.to_mesh(me2); bm.free()
    for o in bpy.data.objects:
        if o.type == "MESH": o.hide_render = not o.name.startswith("_kes_")
    render(kamera("CAM_Mescit_Kesit", (0, -60, 5.0), (0, 0, 5.0), orto=14), "mescit_kesit_ham", (1500, 1100), kaide_goster=False)
    hepsini_ac()
    for o in [o for o in bpy.data.objects if o.name.startswith("_kes_")]: bpy.data.objects.remove(o, do_unlink=True)
if "mescit_foto" in RENDERLER: render(kamera("CAM_Mescit_Foto", (-15.5, -3.0, 6.5), (0.0, 0.5, 4.2), lens=32), "mescit_foto_ham", (1400, 1100))
if "mescit_yakin" in RENDERLER: render(kamera("CAM_Mescit_Yakin", (9, -12, 7), (0, 0, 4.5), lens=40), "mescit_yakin", (1400, 1000))
if "merdiven" in RENDERLER: render(kamera("CAM_Merdiven", (-14, 12, 5), (-5.5, 5.0, 2.2), lens=35), "mescit_merdiven", (1400, 1000))
if "cati" in RENDERLER: render(kamera("CAM_Cati", (-24, OY + 14, 30), (2, OY - 12, 8), lens=30), "cati", (1400, 1000))
if "revak" in RENDERLER: render(kamera("CAM_Revak", (-6, -12, 2.5), (2, AY, 4.5), lens=24), "avlu_revak", (1400, 1000))
if "arka" in RENDERLER:
    KAIDE.hide_render = True                                           # build'de kontrol kaideden önce alınır
    oran = A.arka_yuz_render(KONTROL, "kontrol")                       # kontrol_0…7: arka yüzler kırmızı (akar3d)
    print("ARKA_YUZ_KIRMIZI", [round(x, 5) for x in oran])
print("TAMAM", RENDERLER)
