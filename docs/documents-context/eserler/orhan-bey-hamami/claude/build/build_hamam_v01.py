# AKAR · Orhan Bey Külliyesi · Orhan Bey Hamamı (Aynalı Çarşı) · v01 KÜTLE TURU (B kademe; pencere, kapı ve süs yok)
#   Çifte hamam, yalnız yığma kısım: erkekler soğukluğu (kuzeybatı) + kadınlar soğukluğu (kuzeydoğu, "doğudan bitişik")
#   + güneydeki alçak sıcaklık/halvet/ılıklık kompleksi; sıcaklık ve ılıklık kubbeleri, soğukluklarda aydınlık feneri.
#   Kaynak: Çetintaş 1946 planı (ref/orhan-hamami_plan_cetintas.png; Yurt 2024 PDF s.221) ve Ayverdi kesiti
#   (ref/orhan-hamami_kesit_ayverdi.png; PDF s.223). Kararlar (tasarım sorumlusu, 17 Ekim):
#   - Çetintaş ölçek çubuğu ≈ %38 hatalı → plan envanter oda ölçüleriyle kalibre: ×1,38 (35,5 px/m, H)
#   - yükseklikler Ayverdi kesitinden × 1,16 (E soğukluk genişliğiyle kalibre, H)
#   - sonradan eklenen çarşı bölümleri (planda ince çizgili alanlar) modele girmez
# Çalıştırma:
#   blender -b --python docs/documents-context/eserler/orhan-bey-hamami/claude/build/build_hamam_v01.py
# Eksenler: +X = doğu, +Y = kuzey, +Z = yukarı. Orijin = yığma kısmın ayak izi kutusunun ortası.
# Plan okuması (u, v) Çetintaş çizimindeki ham birim (çubukla 49 px/m): u = çizimde soldan sağa = GÜNEYDEN KUZEYE,
#   v = çizimde alttan üste = DOĞUDAN BATIYA (çizimde kuzey sağda). Model: Y = 1,38·u − 17,65 ; X = 18,85 − 1,38·v.
# Kaynak kodları: P plan, K kesit, E envanter cilt-1 PDF s.104–107, H hesap, T tahmin (VARSAYIM, notlarda listeli).
import sys, os, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 3, "_kutuphane")))
import bpy
import akar3d as A
from mathutils import Vector

SURUM = "hamam_v01"
AD = "orhan-bey-hamami"
CLAUDE = os.path.dirname(HERE)
KONTROL = os.path.join(CLAUDE, "kontrol", SURUM)
BLEND = os.path.join(CLAUDE, "blend", f"{AD}_v01.blend")

P = {
    "olcek": 1.38,             # H: E erkek soğukluğu 11,95 × 11,86 ↔ çizim 8,6 × 8,9 ; kadın 10,35 ↔ 7,3 × 7,5 (dört oran 1,34–1,42)
    "kesit_olcek": 1.16,       # H: E soğukluk 11,95 ↔ Ayverdi kesiti iç 10,3
    # plan, ham birim (u güney→kuzey, v doğu→batı)
    "erkek": (14.96, 25.6, 8.4, 19.6),       # P: erkekler soğukluğu dış (u0, u1, v0, v1) → 14,7 × 15,5 m
    "kadin": (12.1, 21.4, 0.0, 8.4),         # P: kadınlar soğukluğu dış → 12,8 × 11,6 m
    "alcak": [(0, 9.1), (2.55, 9.1), (2.55, 5.2), (12.1, 5.2), (12.1, 8.4), (15.0, 8.4),
              (15.0, 19.6), (10.6, 19.6), (10.6, 27.3), (0, 27.3)],   # P: sıcaklık, halvetler, ılıklık, kadın sıcaklığı, batıdaki iki tonozlu oda
    "erkek_c": (20.3, 14.0), "kadin_c": (16.7, 4.3),        # P: soğukluk kubbe merkezleri (fener sekizgeni)
    "sicaklik_c": (5.0, 14.9), "iliklik_c": (12.6, 16.2),   # P: sıcaklık sekizgeni, ılıklık odası
    # yükseklik (K × 1,16; zemin 0)
    "erkek_duvar": 8.6,  "erkek_tepe": 16.2, "erkek_kubbe_d": 14.0,   # K: 7,4 / 14,0 ; dış Ø 12,1 × 1,16
    "fener_r": 0.9, "fener_h": 1.0,                                    # P: fener sekizgeni Ø ≈ 1,8 ; K: fener üstü 17,2
    "kadin_duvar": 7.5,  "kadin_tepe": 14.1, "kadin_kubbe_d": 11.2,   # T: erkekten açıklık oranıyla (10,35 / 11,95) — kesit yok
    "alcak_h": 5.6,                                                    # K: halvet ve eyvan damları 4,6–4,8 × 1,16
    "sicaklik_kasnak": 6.0, "sicaklik_tepe": 9.5, "sicaklik_kasnak_w": 6.4, "sicaklik_kubbe_d": 6.0,  # K: 5,2 / 8,2
    "iliklik_kasnak": 5.8,  "iliklik_tepe": 9.2,  "iliklik_kasnak_w": 6.4, "iliklik_kubbe_d": 6.0,    # K: 5,0 / 7,9
    "pah": 0.30,
    "zemin_pay": 6.0, "golge_pay": 1.06,
}
S = P["olcek"]; X0, Y0 = 27.3 * S / 2, 25.6 * S / 2
def XY(u, v): return Vector((X0 - S * v, S * u - Y0))
def R_uv(u0, u1, v0, v1): return [XY(u0, v0), XY(u1, v0), XY(u1, v1), XY(u0, v1)]
def pahli_kare(c, w, pah):
    h, k = w / 2, w / 2 * (1 - pah)
    return [c + Vector(q) for q in ((k, -h), (h, -k), (h, k), (k, h), (-k, h), (-h, k), (-h, -k), (-k, -h))]

M = {k: A.mat(n, hx) for k, n, hx in [
    ("duvar", "Duvar", "#E2B7A4"),       # eser.md Palet: Duvarlar (2) hamam, kesme taş ve tuğla
    ("kubbe", "Kubbe", "#A8AEC1"),       # eser.md Palet: Kubbeler ve çatılar (2), kurşun (vurgu 2)
    ("cati", "Cati", "#B9C0CF"),         # T: düz kurşun dam
    ("cim", "Zemin_Cim", "#A0B46C"),
    ("golge", "Zemin_Golge", "#E29B87"),
]}

A.temizle()

def kubbe(g, uv, z0, zk, zt, kw, kd, kasnak=True):
    """kasnak=True: pahlı kare kasnak + kubbe (kubbe 5 cm gömülü). kasnak=False: kubbe doğrudan z0'dan."""
    c = XY(*uv)
    if kasnak: g.prism(pahli_kare(c, kw, P["pah"]), z0 - 0.05, zk, M["duvar"], M["cati"])
    else: zk = z0
    g.dome(A.circle(c, kd / 2, 24), zk - 0.05, zt - zk + 0.05, M["kubbe"], rings=8)
def fener(g, uv, ztepe):
    """Aydınlık feneri: sekizgen, kubbe tepesine 0,3 m gömülü (kubbe tepesi fenerin içinde kalır)."""
    c = XY(*uv); g.prism(A.circle(c, P["fener_r"], 8, math.pi / 8), ztepe - 0.3, ztepe + P["fener_h"], M["kubbe"], M["kubbe"])

# --- Hamam_Sogukluk_Erkek: kuzeybatı, en büyük kubbe (vurgu 2) ---
g = A.G("Hamam_Sogukluk_Erkek"); g.prism(R_uv(*P["erkek"]), 0.0, P["erkek_duvar"], M["duvar"], M["cati"])
kubbe(g, P["erkek_c"], P["erkek_duvar"], 0, P["erkek_tepe"], 0, P["erkek_kubbe_d"], kasnak=False)
fener(g, P["erkek_c"], P["erkek_tepe"]); g.obj()

# --- Hamam_Sogukluk_Kadin: kuzeydoğu ---
g = A.G("Hamam_Sogukluk_Kadin"); g.prism(R_uv(*P["kadin"]), 0.0, P["kadin_duvar"], M["duvar"], M["cati"])
kubbe(g, P["kadin_c"], P["kadin_duvar"], 0, P["kadin_tepe"], 0, P["kadin_kubbe_d"], kasnak=False)
fener(g, P["kadin_c"], P["kadin_tepe"]); g.obj()

# --- Hamam_Sicaklik: alçak kompleks (sıcaklık, 4 eyvan + 4 halvet, ılıklık, kadın sıcaklığı, tonozlu odalar) ---
g = A.G("Hamam_Sicaklik"); g.prism([XY(u, v) for u, v in P["alcak"]], 0.0, P["alcak_h"], M["duvar"], M["cati"]); g.obj()

# --- Kubbe_Sicaklik ve Kubbe_Iliklik ---
g = A.G("Kubbe_Sicaklik")
kubbe(g, P["sicaklik_c"], P["alcak_h"], P["sicaklik_kasnak"], P["sicaklik_tepe"], P["sicaklik_kasnak_w"], P["sicaklik_kubbe_d"]); g.obj()
g = A.G("Kubbe_Iliklik")
kubbe(g, P["iliklik_c"], P["alcak_h"], P["iliklik_kasnak"], P["iliklik_tepe"], P["iliklik_kasnak_w"], P["iliklik_kubbe_d"]); g.obj()

# --- Zemin (kaide diski + gölge; .glb'ye girmez) ---
c0 = Vector((0, 0)); zr = math.hypot(X0, Y0) + P["zemin_pay"]
g = A.G("Zemin"); g.prism(A.circle(c0, zr, 48), -0.4, 0.0, M["cim"], M["cim"]); g.obj()
g = A.G("Zemin_Golge")
g.prism([Vector((q.x * P["golge_pay"], q.y * P["golge_pay"] * 0.97 - 1.5)) for q in A.circle(c0, zr, 48)], -0.9, -0.5, M["golge"], M["golge"]); g.obj()

# ---------------- kontrol ----------------
os.makedirs(KONTROL, exist_ok=True)
rapor = A.kontrol_hepsi(KONTROL, "kontrol")
mk = A.mesh_kontrol()
rapor["parcalar"] = {k: v["ucgen"] for k, v in mk.items()}
rapor["draw_call"] = sum(len(o.material_slots) for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin")))
rapor["dis_olcu_m"] = [round(27.3 * S, 1), round(25.6 * S, 1)]
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
ORTO = 46.0   # 1400 px / 46 m ≈ 30,4 px/m; orto kamera merkezi z = 8 → zemin y = 450 + 8·30,4 (yan_yana_hamam.py ile aynı)
d = 100; el = math.radians(33); az = math.radians(45)          # kuzeydoğudan, izometriğe yakın
render(kamera("CAM_Havadan", (d * math.cos(el) * math.cos(az), d * math.cos(el) * math.sin(az), d * math.sin(el)), (0, 0, 5)), "havadan")
render(kamera("CAM_Havadan_GB", (-d * 0.6, -d * 0.6, d * 0.55), (0, 0, 5)), "havadan_guneybati")
render(kamera("CAM_Dogu_Orto", (120, 0, 8), (0, 0, 8), orto=ORTO), "dogu_orto")     # Ayverdi kesitiyle aynı yön: sağ = kuzey
render(kamera("CAM_Kuzey_Orto", (0, 120, 8), (0, 0, 8), orto=ORTO), "kuzey_orto")
cam = kamera("CAM_Ust_Orto", (0, 0, 150), (0, 0, 0), orto=ORTO); cam.rotation_euler = (0, 0, 0)   # tam tepeden: sağ = doğu, üst = kuzey (track_quat 180° çeviriyordu)
sc = bpy.context.scene; sc.render.resolution_y = 1400; render(cam, "ust_orto"); sc.render.resolution_y = 900   # kare: bütün ayak izi sığsın
render(kamera("CAM_Kubbe", (-26, 30, 22), (0, 4, 10), lens=30), "kubbe_yakin")

os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("BITTI", BLEND)
