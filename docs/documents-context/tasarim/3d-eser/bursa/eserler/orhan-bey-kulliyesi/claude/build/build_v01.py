# AKAR · Orhan Bey Külliyesi · Orhan Bey Camii · v01 KÜTLE TURU (pencere, kemer ve süs yok)
#   Zaviyeli (ters T) plan: 5 gözlü son cemaat yeri (kurşun kırma çatı) + kuzey koridor bandı + iki yan kanat (tabhaneler)
#   + orta harim (kasnaklı ana kubbe) + güneye çıkan mihrap bloğu (kasnaklı kubbe) + kuzeydoğu minaresi (sivri külah).
#   Kaynak: Ayverdi planı (ref/orhan-camii_plan_ayverdi.png, 47,4 px/m, doğrulandı) ve yan cephesi
#   (ref/orhan-camii_kesit-yan-cephe_ayverdi.png alt, 33,2 px/m, doğrulandı); Yurt 2024 PDF s.213, 217.
#   Okuma görselleri: claude/kontrol/kaynak/cami_plan_1m_grid.png, cami_yan-cephe_1m_grid.png
#   Kararlar (tasarım sorumlusu, 17 Ekim): ayrı .glb, cami bugünkü (2020–23 restorasyonu sonrası) hâli, cami A kademe.
# Çalıştırma:
#   blender -b --python docs/documents-context/tasarim/3d-eser/bursa/eserler/orhan-bey-kulliyesi/claude/build/build_v01.py
# Eksenler: +X = doğu, +Y = kuzey, +Z = yukarı. Orijin = caminin ayak izi kutusunun ortası.
# Plan okuması (u, v): u = doğu kenarından batıya, v = kuzey kenarından güneye (m). X = 12,85 − u, Y = 16,75 − v.
# Kaynak kodları: P plan, Y yan cephe, E envanter cilt-1, F fotoğraf, H hesap, T tahmin (VARSAYIM, notlarda listeli).
import sys, os, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 5, "_kutuphane")))
import bpy
import akar3d as A
from mathutils import Vector

SURUM = "v01"
AD = "orhan-bey-camii"
CLAUDE = os.path.dirname(HERE)
KONTROL = os.path.join(CLAUDE, "kontrol", SURUM)
BLEND = os.path.join(CLAUDE, "blend", f"{AD}_{SURUM}.blend")

P = {
    # plan (P; u doğudan, v kuzeyden)
    "dis_x": 25.7,            # P: toplam doğu–batı (E son cemaat yeri 25,80)
    "dis_y": 33.5,            # P: toplam kuzey–güney (O 35,5)
    "scy_v1": 6.5,            # P: son cemaat yeri derinliği (E 6,30)
    "koridor_v1": 10.8,       # P: kuzey koridor bandı güney sınırı (harim bloğu buradan başlar)
    "kanat_v1": 22.2,         # P: yan kanatların güney duvarı dışı
    "orta_u0": 7.2,           # P: harim + mihrap bloğu doğu dışı
    "orta_u1": 18.5,          # P: harim + mihrap bloğu batı dışı (11,3 m)
    "mihrap_v0": 21.0,        # P: mihrap bloğunun başladığı çizgi (harim güney duvarı ekseni)
    "tab_d_c": (4.0, 16.6),   # P: doğu tabhane kubbe merkezi (u, v)
    "tab_b_c": (21.7, 16.6),  # P: batı tabhane kubbe merkezi
    "ana_c": (12.85, 15.9),   # P: harim orta kubbe merkezi
    "mih_c": (12.85, 27.4),   # P: mihrap kubbesi merkezi
    "giris_c": (12.85, 8.8),  # P: koridor ortasındaki giriş bölmesi (küçük kubbe)
    "minare_c": (1.3, 8.3),   # P (u) + Y (v): yan cephe bindirmesinde gövde ekseni kuzeyden 8,3 m (tur içi düzeltme 1; ilk okuma 7,6)
    # yükseklik (Y, yan cephe; zemin 0)
    "scy_sacak": 9.4,         # Y: son cemaat yeri saçağı (ön cephe × 0,955 ile 9,4)
    "scy_mahya": 11.8,        # Y: son cemaat yeri örtüsünün tepesi; bugün kurşun kırma çatı (F)
    "kanat_h": 7.6,           # Y: yan kanat ve koridor saçağı
    "orta_h": 10.2,           # Y: harim ve mihrap bloğu duvar üstü
    "tab_kasnak": 9.1, "tab_tepe": 10.5, "tab_kasnak_w": 6.2, "tab_kubbe_d": 5.8,   # Y, P (kasnak harim bloğuna taşmasın: tabhane iç 6,05)
    "ana_kasnak": 13.5, "ana_tepe": 16.5, "ana_kasnak_w": 10.2, "ana_kubbe_d": 9.8, # Y, P (dış kubbe basık, Y)
    "mih_kasnak": 12.7, "mih_tepe": 14.4, "mih_kasnak_w": 10.4, "mih_kubbe_d": 9.6, # Y
    "giris_kasnak": 9.0, "giris_tepe": 11.0, "giris_kasnak_w": 4.0, "giris_kubbe_d": 3.8,  # Y/ön cephe, ±0,5 (koridor bandına sığsın)
    "pah": 0.30,              # H: kasnak köşe pahı oranı (sekizgene yakın kasnak, F)
    # minare (P, Y, F)
    "minare_r": 1.0,          # P/Y: gövde Ø ≈ 2,0 m, çokgen
    "minare_taban": 7.55,     # H: yan kanat çatısının 5 cm altı
    "serefe_z0": 18.8, "serefe_z1": 19.8, "serefe_r": 1.35,  # Y
    "petek_ust": 22.4, "petek_r": 0.85,                      # Y
    "kulah_h": 3.8,           # F: bugünkü sivri kurşun külah ≈ 2,25 × petek genişliği (IMG_8460); Ayverdi'deki kısa külah değil
    "alem_h": 0.9,            # F
    # kaide
    "zemin_pay": 6.0, "golge_pay": 1.06,
}
X0, Y0 = P["dis_x"] / 2, P["dis_y"] / 2
def XY(u, v): return Vector((X0 - u, Y0 - v))
def R_uv(u0, u1, v0, v1):
    """Plan dikdörtgeni (u, v aralığı) → model köşeleri."""
    return [XY(u0, v0), XY(u1, v0), XY(u1, v1), XY(u0, v1)]
def pahli_kare(c, w, pah):
    """Köşeleri pahlı kare (sekizgene yakın kasnak)."""
    h, k = w / 2, w / 2 * (1 - pah)
    return [c + Vector(q) for q in ((k, -h), (h, -k), (h, k), (k, h), (-k, h), (-h, k), (-h, -k), (-k, -h))]

M = {k: A.mat(n, hx) for k, n, hx in [
    ("duvar", "Duvar", "#E2B7A4"),       # eser.md Palet: duvarlar pembe-kahve
    ("kubbe", "Kubbe", "#A8AEC1"),       # eser.md Palet: kubbe ve çatılar (kurşun)
    ("cati", "Cati", "#B9C0CF"),         # T: düz/eğik kurşun çatı, kubbeden açık ton
    ("minare", "Minare", "#C9785A"),     # F: bugünkü kırmızı tuğla minare gövdesi
    ("alem", "Alem", "#DCA320"),
    ("cim", "Zemin_Cim", "#A0B46C"),     # _ortak_stil §2
    ("golge", "Zemin_Golge", "#E29B87"),
]}

A.temizle()

def kirma(g, p4, z0, z1, m):
    """Kırma çatı (hip): p4 dikdörtgen (ccw), mahya uzun kenara paralel, eğim 4 yönde eşit. Tabanı yok
    (altındaki prism top=False ile aynı köşelere oturur)."""
    p4 = A.ccw(p4); c = A.centroid(p4)
    e0, e1 = p4[1] - p4[0], p4[2] - p4[1]
    uzun, kisa = (e0, e1) if e0.length >= e1.length else (e1, e0)
    d = uzun.normalized() * (uzun.length - kisa.length) / 2
    r0, r1 = g.V(c - d, z1), g.V(c + d, z1); b = [g.V(q, z0) for q in p4]
    for i in range(4):
        j = (i + 1) % 4; mid = (p4[i] + p4[j]) / 2
        ri, rj = (r0, r1) if (p4[i] - c).dot(d) < (p4[j] - c).dot(d) else (r1, r0)
        if abs((p4[j] - p4[i]).normalized().dot(d.normalized())) > 0.5:   # uzun kenar → yamuk
            g.F([b[i], b[j], rj, ri], m)
        else:                                                               # kısa kenar → üçgen
            g.F([b[i], b[j], r0 if (mid - c).dot(d) < 0 else r1], m)

# --- Cami_SonCemaat: 5 gözlü revak kütlesi (v01'de kapalı), üstü kurşun kırma çatı ---
g = A.G("Cami_SonCemaat"); p = R_uv(0, P["dis_x"], 0, P["scy_v1"])
g.prism(p, 0.0, P["scy_sacak"], M["duvar"], top=False)
kirma(g, p, P["scy_sacak"], P["scy_mahya"], M["cati"]); g.obj()

# --- Cami_Koridor: son cemaat yeri arkasındaki kuzey bandı (giriş bölmesi, koridor, minare merdiveni) ---
g = A.G("Cami_Koridor"); g.prism(R_uv(0, P["dis_x"], P["scy_v1"], P["koridor_v1"]), 0.0, P["kanat_h"], M["duvar"], M["cati"]); g.obj()

# --- Cami_Kanat_D / Cami_Kanat_B: tabhaneler ---
for ad, u0, u1 in (("Cami_Kanat_D", 0, P["orta_u0"]), ("Cami_Kanat_B", P["orta_u1"], P["dis_x"])):
    g = A.G(ad); g.prism(R_uv(u0, u1, P["koridor_v1"], P["kanat_v1"]), 0.0, P["kanat_h"], M["duvar"], M["cati"]); g.obj()

# --- Cami_Harim (orta mekân) ve Cami_Mihrap (güneye çıkıntı) ---
g = A.G("Cami_Harim"); g.prism(R_uv(P["orta_u0"], P["orta_u1"], P["koridor_v1"], P["mihrap_v0"]), 0.0, P["orta_h"], M["duvar"], M["cati"]); g.obj()
g = A.G("Cami_Mihrap"); g.prism(R_uv(P["orta_u0"], P["orta_u1"], P["mihrap_v0"], P["dis_y"]), 0.0, P["orta_h"], M["duvar"], M["cati"]); g.obj()

# --- Kubbeler: pahlı kare kasnak + basık kurşun kubbe (kubbe kasnağa 5 cm gömülü) ---
def kubbe(ad, uv, z0, zk, zt, kw, kd):
    g = A.G(ad); c = XY(*uv)
    g.prism(pahli_kare(c, kw, P["pah"]), z0 - 0.05, zk, M["duvar"], M["cati"])
    g.dome(A.circle(c, kd / 2, 24), zk - 0.05, zt - zk + 0.05, M["kubbe"], rings=8)
    return g.obj()
kubbe("Kubbe_Ana", P["ana_c"], P["orta_h"], P["ana_kasnak"], P["ana_tepe"], P["ana_kasnak_w"], P["ana_kubbe_d"])
kubbe("Kubbe_Mihrap", P["mih_c"], P["orta_h"], P["mih_kasnak"], P["mih_tepe"], P["mih_kasnak_w"], P["mih_kubbe_d"])
kubbe("Kubbe_Tabhane_D", P["tab_d_c"], P["kanat_h"], P["tab_kasnak"], P["tab_tepe"], P["tab_kasnak_w"], P["tab_kubbe_d"])
kubbe("Kubbe_Tabhane_B", P["tab_b_c"], P["kanat_h"], P["tab_kasnak"], P["tab_tepe"], P["tab_kasnak_w"], P["tab_kubbe_d"])
kubbe("Kubbe_Giris", P["giris_c"], P["kanat_h"], P["giris_kasnak"], P["giris_tepe"], P["giris_kasnak_w"], P["giris_kubbe_d"])

# --- Minare_1: kuzeydoğu, çokgen tuğla gövde, şerefe, petek, sivri kurşun külah, alem ---
g = A.G("Minare_1"); c = XY(*P["minare_c"]); r, rs, rp = P["minare_r"], P["serefe_r"], P["petek_r"]
z0, s0, s1, zp = P["minare_taban"], P["serefe_z0"], P["serefe_z1"], P["petek_ust"]
g.lathe(c, [(r, z0), (r, s0 - 0.6), (rs, s0), (rs, s1), (rp, s1), (rp, zp)], 12, [M["minare"]] * 5)
zk = zp + P["kulah_h"]
g.lathe(c, [(rp * 1.08, zp - 0.02), (0, zk)], 12, [M["kubbe"]])
za = zk - 0.05; ah = P["alem_h"]
g.lathe(c, [(0.08, za), (0.2, za + ah * 0.3), (0.08, za + ah * 0.55), (0.16, za + ah * 0.75), (0, za + ah)], 8, [M["alem"]] * 4)
g.obj()

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
ORTO = 40.0   # 1400 px / 40 m = 35 px/m; orto kamera merkezi z = 12 → zemin y = 870 px (yan yana görsel bu değerleri kullanır)
d = 95; el = math.radians(33); az = math.radians(45)          # kuzeydoğudan, izometriğe yakın
render(kamera("CAM_Havadan", (d * math.cos(el) * math.cos(az), d * math.cos(el) * math.sin(az), d * math.sin(el)), (0, 0, 6)), "havadan")
render(kamera("CAM_Foto", (32, 38, 6), (-2, 4, 9), lens=24), "foto_acisi")          # ref-img/1578396115: kuzeydoğudan, yerden
render(kamera("CAM_Foto2", (46, -12, 12), (0, 0, 8), lens=30), "foto_acisi_2")      # ref-img/IMG_8460: doğudan, biraz yukarıdan
render(kamera("CAM_Kuzey_Orto", (0, 120, 12), (0, 0, 12), orto=ORTO), "kuzey_orto")
render(kamera("CAM_Bati_Orto", (-120, 0, 12), (0, 0, 12), orto=ORTO), "bati_orto")
render(kamera("CAM_Ust_Orto", (0, 0.001, 150), (0, 0, 0), orto=ORTO), "ust_orto")
render(kamera("CAM_Kubbe", (-22, 22, 20), (0, -2, 12), lens=30), "kubbe_yakin")

os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("BITTI", BLEND)
