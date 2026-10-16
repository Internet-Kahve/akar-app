# AKAR · Yıldırım Bayezid Bedesteni · v01 KÜTLE TURU (pencere ve süs yok)
#   Almaşık gövde (salon + mahzen bandı, 60,0 × 24,4 × 8,5 m) + eğimli kurşun çatı (8,5 → 10,0) + 2 × 7 kubbe;
#   çevrede alçak dükkân halkası (70,4 × 32,8 m). Tur içi düzeltme 1: fotoğrafta almaşık duvar kubbelere yakın, dükkânlar alçak.
#   Kaynak: Gabriel planı ve kesiti (ref/bedesten_plan_gabriel.png, Alkan 2023 PDF s.12), envanter cilt-2 PDF s.29.
#   Kararlar (tasarım sorumlusu, B1 cevapları): Gabriel planı kullanılır (OSM değil), dükkân halkası dahil, düz kaide,
#   doku kararı v02'de.
# Çalıştırma:
#   blender -b --python docs/documents-context/tasarim/3d-eser/bursa/eserler/yildirim-bayezid-bedesteni/claude/build/build_v01.py
# Eksenler: +X = doğu, +Y = kuzey, +Z = yukarı. Orijin = ana salonun ortası.
# Kaynak kodları: P plan/kesit, E envanter, W Alkan 2023, H hesap, T tahmin (VARSAYIM, bedesten_notlar.md'de listeli).
import sys, os, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 5, "_kutuphane")))
import bpy
import akar3d as A
from mathutils import Vector

SURUM = "v01"
CLAUDE = os.path.dirname(HERE)
KONTROL = os.path.join(CLAUDE, "kontrol", SURUM)
BLEND = os.path.join(CLAUDE, "blend", f"bedesten_{SURUM}.blend")
EXPORT = os.path.join(CLAUDE, "export", f"bedesten_{SURUM}.glb")

P = {
    # plan
    "salon_ic_x": 56.50,      # E: iç mekân doğu–batı (P 56,8)
    "salon_ic_y": 15.00,      # E: iç mekân kuzey–güney (P 15,3)
    "salon_duvar": 1.50,      # P: salon duvarı (doğu–batı uçlarda okunan)
    "dis_x": 70.4,            # P: dükkânlar dahil toplam dış ölçü doğu–batı
    "dis_y": 32.8,            # P: dükkânlar dahil toplam dış ölçü kuzey–güney (kesit 33,0)
    "govde_x": 60.0,          # P: salon bloğu (mahzen bandı dahil) doğu–batı — fotoğraftaki almaşık kütle
    "govde_y": 24.4,          # P: salon bloğu kuzey–güney (OSM 21,4; plan seçildi)
    "dukkan_h": 5.0,          # T: dükkân halkası düz çatısı (fotoğrafta almaşık duvarın dibinde alçak damlar; Gabriel kesiti 8,7 gösteriyor)
    "kubbe_nx": 7, "kubbe_ny": 2,   # P, E: 2 × 7 = 14 kubbe
    # yükseklik (P kesit)
    "cati_h": 8.5,            # P: dükkân + mahzen bandı ortak düz çatı
    "salon_h": 10.0,          # P: salon duvarı üstü
    "kubbe_dis_d": 7.4,       # P kesit: kubbe dış çapı
    "kubbe_tepe": 12.8,       # P kesit 12,6–13,0 → tek değer (VARSAYIM)
    # kapılar
    "kapi_w": 3.0,            # P: kuzey kapısı geçit genişliği
    "kapi_h": 4.5,            # T: kaynakta yok (VARSAYIM)
    # kaide
    "zemin_pay": 6.0,         # T
    "golge_pay": 1.06,        # Koza Han ile aynı
}
DX, DY = P["dis_x"] / 2, P["dis_y"] / 2
SX = P["salon_ic_x"] / 2 + P["salon_duvar"]            # H: 29,75 → yükseltilmiş salon 59,5 m
SY = P["salon_ic_y"] / 2 + P["salon_duvar"]            # H: 9,0 → 18,0 m
GX, GY = P["salon_ic_x"] / P["kubbe_nx"], P["salon_ic_y"] / P["kubbe_ny"]   # H: göz 8,07 × 7,50
c0 = Vector((0, 0))

M = {k: A.mat(n, hx) for k, n, hx in [
    ("govde", "Govde", "#E2B7A4"),       # eser.md Palet: gövde pembe-kahve
    ("cati", "Cati", "#B9C6CC"),         # T: düz kurşun çatı, kubbeden açık ton
    ("kubbe", "Kubbe", "#95AEBA"),       # eser.md Palet: kurşun mavi-gri (vurgu 1)
    ("kapi", "Kapi", "#6B4A3A"),         # eser.md Palet: koyu kahve
    ("cim", "Zemin_Cim", "#A0B46C"),     # _ortak_stil §2
    ("golge", "Zemin_Golge", "#E29B87"),
]}

def R4(hx, hy, cx=0.0, cy=0.0): return A.rect(Vector((cx, cy)), 2 * hx, 2 * hy)

A.temizle()

BX, BY = P["govde_x"] / 2, P["govde_y"] / 2

# --- Govde: salon + mahzen bandı (fotoğraftaki almaşık kütle), üstü Cati ile kapanır ---
g = A.G("Govde"); g.prism(R4(BX, BY), 0.0, P["cati_h"], M["govde"], M["cati"]); g.obj()

def ring(g, outer, inner, z0, z1, m_side, m_top):
    """Kapalı halka (dış ve iç çokgen aynı köşe sayısında, ikisi de ccw)."""
    n = len(outer)
    ob, ot = [g.V(q, z0) for q in outer], [g.V(q, z1) for q in outer]
    ib, it = [g.V(q, z0) for q in inner], [g.V(q, z1) for q in inner]
    for i in range(n):
        j = (i + 1) % n
        g.F([ob[i], ob[j], ot[j], ot[i]], m_side)          # dış yüz
        g.F([ib[j], ib[i], it[i], it[j]], m_side)          # iç yüz
        g.F([ot[i], ot[j], it[j], it[i]], m_top)           # üst
        g.F([ob[j], ob[i], ib[i], ib[j]], m_side)          # alt

# --- Dukkanlar: Govde'yi saran alçak dükkân halkası (68 dükkân), düz çatı ---
g = A.G("Dukkanlar")
ring(g, R4(DX, DY), R4(BX - 0.05, BY - 0.05), 0.0, P["dukkan_h"], M["govde"], M["cati"])
g.obj(recalc=False)

# --- Cati: mahzen bandı üstünde dış duvardan (8,5) salon duvarına (10,0) yükselen kurşun eğimli çatı, kapalı kesik piramit ---
g = A.G("Cati")
lo = [g.V(q, P["cati_h"] - 0.05) for q in R4(BX, BY)]
hi = [g.V(q, P["salon_h"]) for q in R4(SX, SY)]
for i in range(4):
    j = (i + 1) % 4; g.F([lo[i], lo[j], hi[j], hi[i]], M["cati"])
g.F(hi, M["cati"]); g.F(lo[::-1], M["cati"])
g.obj(recalc=False)

# --- Kubbeler: 2 × 7, salon üstünde (kasnak yok; v01) ---
g = A.G("Kubbeler"); r = P["kubbe_dis_d"] / 2; rise = P["kubbe_tepe"] - P["salon_h"]
for i in range(P["kubbe_nx"]):
    for j in range(P["kubbe_ny"]):
        c = Vector((-P["salon_ic_x"] / 2 + GX * (i + 0.5), -P["salon_ic_y"] / 2 + GY * (j + 0.5)))
        g.dome(A.circle(c, r, 24), P["salon_h"] - 0.05, rise + 0.05, M["kubbe"], rings=8)
g.obj()

# --- Kapilar: 4 kenarın ortasında kemerli kapı levhası (boşluk yerine; decal duvardan önde) ---
g = A.G("Kapilar"); kw, kh = P["kapi_w"], P["kapi_h"]; zs = kh - kw / 2
for O, T, N in ((Vector((0, DY)), Vector((-1, 0)), Vector((0, 1))), (Vector((0, -DY)), Vector((1, 0)), Vector((0, -1))),
                (Vector((DX, 0)), Vector((0, 1)), Vector((1, 0))), (Vector((-DX, 0)), Vector((0, -1)), Vector((-1, 0)))):
    A.pencere(g, O, T, N, kw, 0.0, zs, M["kapi"])
g.obj()

# --- Zemin (kaide diski + gölge elipsi; .glb'ye girmez) ---
zr = math.hypot(DX, DY) + P["zemin_pay"]
g = A.G("Zemin"); g.prism(A.circle(c0, zr, 48), -0.4, 0.0, M["cim"], M["cim"]); g.obj()
g = A.G("Zemin_Golge")
g.prism([Vector((q.x * P["golge_pay"], q.y * P["golge_pay"] * 0.97 - 1.5)) for q in A.circle(c0, zr, 48)], -0.9, -0.5, M["golge"], M["golge"]); g.obj()

# ---------------- kontrol ----------------
os.makedirs(KONTROL, exist_ok=True)
rapor = A.kontrol_hepsi(KONTROL, "kontrol")
mk = A.mesh_kontrol()
rapor["parcalar"] = {k: v["ucgen"] for k, v in mk.items()}
rapor["draw_call"] = sum(len(o.material_slots) for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin")))
with open(os.path.join(KONTROL, "kontrol_rapor.json"), "w", encoding="utf-8") as fh: json.dump(rapor, fh, ensure_ascii=False, indent=1)
print("RAPOR", json.dumps(rapor, ensure_ascii=False))

# ---------------- render (Workbench, düz renk) ----------------
def kurulum_render():
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sh = sc.display.shading
    sh.light = 'STUDIO'; sh.color_type = 'MATERIAL'; sh.show_shadows = False
    sh.show_cavity = True; sh.cavity_type = 'WORLD'; sh.show_backface_culling = True
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'Standard'
    sc.render.resolution_x, sc.render.resolution_y = 1400, 900
    sh.background_type = 'VIEWPORT'; sh.background_color = (0.96, 0.82, 0.67)

def kamera(ad, loc, hedef, orto=None, lens=35):
    cd = bpy.data.cameras.get(ad) or bpy.data.cameras.new(ad)
    if orto: cd.type = 'ORTHO'; cd.ortho_scale = orto
    else: cd.type = 'PERSP'; cd.lens = lens
    cd.clip_end = 2000
    cam = bpy.data.objects.get(ad) or bpy.data.objects.new(ad, cd)
    if cam.name not in bpy.context.scene.collection.objects: bpy.context.scene.collection.objects.link(cam)
    cam.location = Vector(loc); cam.rotation_euler = (Vector(hedef) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    return cam

def render(cam, ad):
    sc = bpy.context.scene; sc.camera = cam
    sc.render.filepath = os.path.join(KONTROL, f"{ad}.png"); bpy.ops.render.render(write_still=True)

kurulum_render()
d = 150; el = math.radians(33); az = math.radians(55)       # izometriğe yakın (stil §1.6)
render(kamera("CAM_Havadan", (d * math.cos(el) * math.cos(az), d * math.cos(el) * math.sin(az), d * math.sin(el)), (0, 0, 4)), "havadan")
render(kamera("CAM_Foto", (-48, 78, 30), (2, 0, 5), lens=32), "foto_acisi")        # ref-img: kuzeybatıdan, Ulucami minaresi sağda
render(kamera("CAM_Kuzey_Orto", (0, 120, 7), (0, 0, 7), orto=76), "kuzey_orto")
render(kamera("CAM_Bati_Orto", (-120, 0, 7), (0, 0, 7), orto=40), "bati_orto")
render(kamera("CAM_Ust_Orto", (0, 0.001, 150), (0, 0, 0), orto=76), "ust_orto")
render(kamera("CAM_Kubbe", (-14, 26, 17), (2, 0, 10.5), lens=30), "kubbe_yakin")

os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("BITTI", BLEND)
