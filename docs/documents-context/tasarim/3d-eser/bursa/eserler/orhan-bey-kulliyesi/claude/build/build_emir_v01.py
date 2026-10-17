# AKAR · Orhan Bey Külliyesi · Emir Hanı · v01 KÜTLE TURU (B kademe; revak, kapı, baca ve süs yok)
#   Kare avlulu iki katlı han: avluyu saran tek halka kütle (45 × 45 m, avlu ≈ 25,5 × 25,5 m) + kurşun kırma çatı
#   (iç ve dış saçaktan kanat ortasındaki mahyaya yükselir).
#   Kaynak: envanter cilt-1 PDF s.108–109 (≈ 45 × 45 m, ≈ 650 m² avlu, iki kat, 36 + 38 oda, kurşun örtü);
#   EHA 1967 çarşı planı (ref/bedesten_carsi_eha1967.png; yalnız yatay ölçek güvenilir); fotoğraflar eserler/emir-han/.
#   Kararlar (tasarım sorumlusu, 17 Ekim): 45 × 45 m (E), B kademe, çevredeki dükkân sıraları modelde yok.
#   ÖLÇÜLÜ PLAN VE KESİT YOK: yükseklikler Koza Han v01 varsayımlarıyla aynı (iki katlı Bursa hanı), VARSAYIM.
# Çalıştırma:
#   blender -b --python docs/documents-context/tasarim/3d-eser/bursa/eserler/orhan-bey-kulliyesi/claude/build/build_emir_v01.py
# Eksenler: +X = doğu, +Y = kuzey, +Z = yukarı. Orijin = avlunun ortası. Kenarlar ana yönlere paralel (OSM yönü 86°).
# Kaynak kodları: E envanter, P EHA planı (yatay), O OSM, F fotoğraf, H hesap, T tahmin (VARSAYIM, notlarda listeli).
import sys, os, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 5, "_kutuphane")))
import bpy
import akar3d as A
from mathutils import Vector

SURUM = "emir_v01"
AD = "emir-hani"
CLAUDE = os.path.dirname(HERE)
KONTROL = os.path.join(CLAUDE, "kontrol", SURUM)
BLEND = os.path.join(CLAUDE, "blend", f"{AD}_v01.blend")

P = {
    "dis": 45.0,           # E: "yaklaşık 45 × 45 m" (EHA yatay 45,5 m ✓; OSM 57,5 × 50,9 dükkân sıralarıyla)
    "avlu": 25.5,          # H: E "≈ 650 m²" → √650 ≈ 25,5 m (EHA yatay ≈ 27 m)
    "sacak": 9.5,          # T: alt kat 5,0 + üst kat 4,5 (Koza Han v01 VARSAYIM'ı; Emir Hanı için yükseklik kaynağı yok)
    "mahya": 11.0,         # T: kanat ortasında kurşun kırma çatı mahyası (F: Emir-Hani-1, giriş üstünde basık kırma çatı)
    "zemin_pay": 6.0, "golge_pay": 1.06,
}
HD, HA = P["dis"] / 2, P["avlu"] / 2
HM = (HD + HA) / 2       # H: mahya çizgisi kanadın ortasında (kanat derinliği (45 − 25,5) / 2 = 9,75 m)

M = {k: A.mat(n, hx) for k, n, hx in [
    ("duvar", "Duvar", "#E2B7A4"),       # eser.md Palet: Duvarlar (3) Emir Hanı, küfeki/moloz/tuğla almaşık
    ("cati", "Cati", "#A8AEC1"),         # eser.md Palet: Kubbeler ve çatılar (3), kurşun
    ("avlu", "Avlu_Zemin", "#E9E3D3"),   # eser.md Palet: ortak zemin, taş döşeli
    ("cim", "Zemin_Cim", "#A0B46C"),
    ("golge", "Zemin_Golge", "#E29B87"),
]}

A.temizle()
c0 = Vector((0, 0))
def kare(h): return A.ccw(A.rect(c0, 2 * h, 2 * h))

# --- Emir_Hani: halka kütle (dış duvar + avlu duvarı) ve kurşun kırma çatı, tek kapalı hacim ---
g = A.G("Emir_Hani")
dis, ic, mah = kare(HD), kare(HA), kare(HM)
ob = [g.V(q, 0.0) for q in dis]; ot = [g.V(q, P["sacak"]) for q in dis]
ib = [g.V(q, 0.0) for q in ic];  it = [g.V(q, P["sacak"]) for q in ic]
rm = [g.V(q, P["mahya"]) for q in mah]
for i in range(4):
    j = (i + 1) % 4
    g.F([ob[i], ob[j], ot[j], ot[i]], M["duvar"])        # dış cephe
    g.F([ib[j], ib[i], it[i], it[j]], M["duvar"])        # avlu cephesi
    g.F([ob[j], ob[i], ib[i], ib[j]], M["duvar"])        # taban
    g.F([ot[i], ot[j], rm[j], rm[i]], M["cati"])         # dış çatı yüzü
    g.F([rm[i], rm[j], it[j], it[i]], M["cati"])         # avluya bakan çatı yüzü
g.obj(recalc=False)

# --- Han_Avlu: avlu döşemesi (ince kapalı levha, zeminden 2 cm yukarıda) ---
g = A.G("Han_Avlu"); g.prism(A.rect(c0, 2 * HA - 0.02, 2 * HA - 0.02), 0.0, 0.02, M["avlu"], M["avlu"]); g.obj()

# --- Zemin (kaide diski + gölge; .glb'ye girmez) ---
zr = math.hypot(HD, HD) + P["zemin_pay"]
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
ORTO = 56.0
d = 120; el = math.radians(33); az = math.radians(45)
render(kamera("CAM_Havadan", (d * math.cos(el) * math.cos(az), d * math.cos(el) * math.sin(az), d * math.sin(el)), (0, 0, 4)), "havadan")
render(kamera("CAM_Avlu", (-8, -9, 7.5), (6, 8, 4.5), lens=18), "avlu_ici")          # ref Emir-Hani-4/5: üst kat revağından avluya
render(kamera("CAM_Kuzey_Orto", (0, 150, 8), (0, 0, 8), orto=ORTO), "kuzey_orto")
cam = kamera("CAM_Ust_Orto", (0, 0, 150), (0, 0, 0), orto=ORTO); cam.rotation_euler = (0, 0, 0)   # sağ = doğu, üst = kuzey
sc = bpy.context.scene; sc.render.resolution_y = 1400; render(cam, "ust_orto"); sc.render.resolution_y = 900

os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("BITTI", BLEND)
