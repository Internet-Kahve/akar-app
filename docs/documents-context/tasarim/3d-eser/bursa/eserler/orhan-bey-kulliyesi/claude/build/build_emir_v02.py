# AKAR · Orhan Bey Külliyesi · Emir Hanı · v02 DETAY + RENK + ÇIKIŞ (B kademe, sade; kütle Emir Hanı v01'de donduruldu)
#   - Dış duvarlar almaşık doku (E PDF s.108: "iki sıra tuğla ve bir sıra küfeki taşı ... almaşık"; cami karosu: 2 tuğla + taş).
#   - Avlu cepheleri iki katlı revak: altta sivri kemerli dükkân açıklıkları, üstte yüksek sivri tuğla kemerler, beyaz tonoz
#     içi ve beyaz korkuluk bandı (F eserler/emir-han/Emir-Hani-2…5). Kenar başına 9 göz (E: alt 36, üst 38 oda → ≈ 9/kenar).
#   - Tuğla saçak bantları (E: "iki sıra kirpi saçak") dışta ve avluda; dış duvarda üst katta oda başına küçük pencere
#     (alt kat depoları penceresiz, E); çatıda oda başına baca (E "ocaklı oda"; F Emir-Hani-1).
#   - Kuzey cephe ortasında almaşık yuvarlak kemerli giriş (F Emir-Hani-1; yönü VARSAYIM).
#   - Avluda fıskiyeli şadırvan ve iki çınar (E PDF s.109).
# Çalıştırma:
#   blender -b --python docs/documents-context/tasarim/3d-eser/bursa/eserler/orhan-bey-kulliyesi/claude/build/build_emir_v02.py
# Eksenler: +X = doğu, +Y = kuzey, +Z = yukarı. Orijin = avlunun ortası.
import sys, os, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 5, "_kutuphane")))
import bpy
import akar3d as A
from mathutils import Vector

SURUM = "emir_v02"
AD = "emir-hani"
CLAUDE = os.path.dirname(HERE)
KONTROL = os.path.join(CLAUDE, "kontrol", SURUM)
BLEND = os.path.join(CLAUDE, "blend", f"{AD}_v02.blend")
EXPORT = os.path.join(CLAUDE, "export", f"{AD}_v02.glb")
DOKU = os.path.join(HERE, "doku")

P = {
    # ================= KÜTLE (Emir Hanı v01, donduruldu) =================
    "dis": 45.0, "avlu": 25.5, "sacak": 9.5, "mahya": 11.0, "zemin_pay": 6.0, "golge_pay": 1.06,
    # ================= v02 DETAY =================
    "D_goz": 9,                                   # E: alt 36 / üst 38 oda → kenar başına ≈ 9 göz
    "D_kat": 5.0,                                 # T: alt kat yüksekliği (v01 VARSAYIM'ı)
    "D_alt_w": 2.0, "D_alt_uzengi": 2.6, "D_alt_tepe": 3.7,      # F: avlu alt kat sivri kemerleri
    "D_ust_w": 2.2, "D_ust_uzengi": 7.4, "D_ust_tepe": 8.8,      # F: üst kat yüksek sivri kemerler
    "D_korkuluk_h": 1.0,                          # F: beyaz korkuluk
    "D_kat_bant_h": 0.25,                         # F: kat silmesi (taş)
    "D_kemer_bant": 0.3,
    "D_dis_pen": (0.6, 6.6, 7.6),                 # T: dış duvarda üst kat oda penceresi (gen., alt, üst)
    "D_portal_w": 3.4, "D_portal_h": 4.6,         # F Emir-Hani-1: yuvarlak kemerli giriş
    "D_sacak_h": 0.4, "D_sacak_d": 0.2,           # E: kirpi saçak (tek bant)
    "D_baca": (0.6, 1.4), "D_baca_r": 20.0,       # T: baca kesiti, çatıdan yükseklik; dış kenardan 2,5 m içeride
    "D_sadirvan_r": 2.0, "D_sadirvan_h": 0.6,     # T
    "D_agac": [(-7.0, 6.5), (6.5, -7.0)],         # T: iki çınar (E "tarihi çınar ağaçları")
    "D_karo_w": 2.0, "D_karo_h": 0.8,             # cami ile aynı almaşık karo ölçüsü
}
HD, HA = P["dis"] / 2, P["avlu"] / 2
HM = (HD + HA) / 2

M = {k: A.mat(n, hx) for k, n, hx in [
    ("duvar", "Duvar", "#E2B7A4"),       # eser.md Palet (3); almaşık doku bağlanır
    ("cati", "Cati", "#A8AEC1"),         # eser.md Palet: kurşun
    ("avlu", "Avlu_Zemin", "#E9E3D3"),
    ("tugla", "Tugla", "#C6755B"),
    ("tas", "Tas", "#F2F3E5"),
    ("siva", "Siva", "#F4F1EA"),         # F: üst revak tonoz içleri beyaz
    ("dukkan", "Dukkan", "#4A3F3A"),     # T: alt kat dükkân açıklıklarının gölgeli içi
    ("pencere", "Pencere", "#2A2D35"),
    ("su", "Su", "#7FB3C8"),
    ("agac", "Agac", "#416555"),         # _ortak_stil ağaç koyu
    ("govde", "Agac_Govde", "#6B4A3A"),
    ("cim", "Zemin_Cim", "#A0B46C"),
    ("golge", "Zemin_Golge", "#E29B87"),
]}
def doku_bagla(m, dosya):
    nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tx = nt.nodes.new("ShaderNodeTexImage"); tx.image = bpy.data.images.load(os.path.join(DOKU, dosya), check_existing=True)
    tx.name = "DOKU"; nt.links.new(tx.outputs["Color"], bsdf.inputs["Base Color"])
DOKULU = [M["duvar"]]
doku_bagla(M["duvar"], "almasik.png")

A.temizle()
c0 = Vector((0, 0))
def kare(h): return A.ccw(A.rect(c0, 2 * h, 2 * h))

# ================= KÜTLE (v01, donduruldu) =================
g = A.G("Emir_Hani")
dis, ic, mah = kare(HD), kare(HA), kare(HM)
ob = [g.V(q, 0.0) for q in dis]; ot = [g.V(q, P["sacak"]) for q in dis]
ib = [g.V(q, 0.0) for q in ic];  it = [g.V(q, P["sacak"]) for q in ic]
rm = [g.V(q, P["mahya"]) for q in mah]
for i in range(4):
    j = (i + 1) % 4
    g.F([ob[i], ob[j], ot[j], ot[i]], M["duvar"]); g.F([ib[j], ib[i], it[i], it[j]], M["duvar"])
    g.F([ob[j], ob[i], ib[i], ib[j]], M["duvar"])
    g.F([ot[i], ot[j], rm[j], rm[i]], M["cati"]); g.F([rm[i], rm[j], it[j], it[i]], M["cati"])
g.obj(recalc=False)
g = A.G("Han_Avlu"); g.prism(A.rect(c0, 2 * HA - 0.02, 2 * HA - 0.02), 0.0, 0.02, M["avlu"], M["avlu"]); g.obj()

# ================= v02 DETAY =================
def panel(g, O, T, N, poly, o0, o1, m, m_yan=None):
    Pt = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
    a = [g.bm.verts.new(Pt(s, z, o0)) for s, z in poly]; b = [g.bm.verts.new(Pt(s, z, o1)) for s, z in poly]
    g.F(b, m); g.F(a[::-1], m_yan or m)
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g.F([a[i], a[j], b[j], b[i]], m_yan or m)
def sivri(w, z0, zs, za, n=5):
    h = max(za - zs, 0.05); R = (h * h + w * w / 4) / w; cx = w / 2 - R; tm = math.atan2(h, -cx)
    sag = [(cx + R * math.cos(tm * k / n), zs + R * math.sin(tm * k / n)) for k in range(1, n + 1)]; sag[-1] = (0.0, za)
    sol = [(-s, z) for s, z in reversed(sag[:-1])]
    return [(-w / 2, z0), (w / 2, z0), (w / 2, zs)] + sag + sol + [(-w / 2, zs)]
def yuvarlak(w, z0, zs, n=8):
    return [(-w / 2, z0), (w / 2, z0)] + [((w / 2) * math.cos(math.pi * k / n), zs + (w / 2) * math.sin(math.pi * k / n)) for k in range(n)] + [(-w / 2, zs)]
def dik(w, z0, z1): return [(-w / 2, z0), (w / 2, z0), (w / 2, z1), (-w / 2, z1)]
def yuzler(h, ice):
    """Kare çevrenin 4 yüzü (O, T, N); ice=True: avluya bakan yüzler (normal merkeze doğru)."""
    out = []
    for nx, ny in ((0, 1), (0, -1), (1, 0), (-1, 0)):
        n = Vector((nx, ny)); O = n * h; T = Vector((-ny, nx))
        out.append((O, T, -n if ice else n, (nx, ny)))
    return out

# --- Avlu_Revaklari: dört avlu cephesinde iki katlı revak (tek nesne) ---
g = A.G("Avlu_Revaklari"); L = 2 * HA; n = P["D_goz"]; adim = L / n; b = P["D_kemer_bant"]; zk = P["D_kat"]
for O, T, N, _ in yuzler(HA, True):
    # kat silmesi (taş) ve korkuluk bandı tüm cephe boyunca
    panel(g, O, T, N, dik(L - 0.1, zk, zk + P["D_kat_bant_h"]), 0.03, 0.18, M["tas"])
    for i in range(n):
        s = -L / 2 + adim * (i + 0.5); O2 = O + T * s
        panel(g, O2, T, N, sivri(P["D_alt_w"] + 2 * b, 0.0, P["D_alt_uzengi"], P["D_alt_tepe"] + b * 0.8), 0.03, 0.06, M["tugla"])
        panel(g, O2, T, N, sivri(P["D_alt_w"], 0.0, P["D_alt_uzengi"], P["D_alt_tepe"]), 0.06, 0.09, M["dukkan"])
        z1 = zk + P["D_kat_bant_h"]
        panel(g, O2, T, N, sivri(P["D_ust_w"] + 2 * b, z1, P["D_ust_uzengi"], P["D_ust_tepe"] + b * 0.8), 0.03, 0.06, M["tugla"])
        panel(g, O2, T, N, sivri(P["D_ust_w"], z1, P["D_ust_uzengi"], P["D_ust_tepe"]), 0.06, 0.09, M["siva"])
        panel(g, O2, T, N, dik(P["D_ust_w"] - 0.1, z1, z1 + P["D_korkuluk_h"]), 0.09, 0.14, M["tas"])
g.obj()

# --- Dis_Cephe: üst kat oda pencereleri + kuzey girişi ---
g = A.G("Dis_Cephe"); L = 2 * HD; n2 = round(L / adim); adim2 = L / n2; pw, pz0, pz1 = P["D_dis_pen"]
for O, T, N, (nx, ny) in yuzler(HD, False):
    for i in range(n2):
        s = -L / 2 + adim2 * (i + 0.5)
        if abs(s) > L / 2 - 2.0: continue                                  # köşe
        if ny == 1 and abs(s) < P["D_portal_w"]: continue                  # giriş
        O2 = O + T * s
        panel(g, O2, T, N, dik(pw + 0.2, pz0 - 0.1, pz1 + 0.1), 0.03, 0.06, M["tas"])
        panel(g, O2, T, N, dik(pw, pz0, pz1), 0.06, 0.09, M["pencere"])
    if ny == 1:                                                            # giriş: almaşık yuvarlak kemer (tuğla + küfeki)
        w, h = P["D_portal_w"], P["D_portal_h"]; zs = h - w / 2
        panel(g, O, T, N, yuvarlak(w + 1.0, 0.0, zs), 0.03, 0.06, M["tugla"])
        panel(g, O, T, N, yuvarlak(w + 0.5, 0.0, zs), 0.06, 0.08, M["tas"])
        panel(g, O, T, N, yuvarlak(w, 0.0, zs), 0.08, 0.11, M["dukkan"])
g.obj()

# --- Sacak: dışta ve avluda içi boş tuğla saçak halkaları (damla aynı düzlemde yüz yok) ---
def halka(g, dis4, ic4, z0, z1, m):
    o = [g.V(q, z0) for q in dis4]; ot_ = [g.V(q, z1) for q in dis4]; i_ = [g.V(q, z0) for q in ic4]; it_ = [g.V(q, z1) for q in ic4]
    for k in range(4):
        j = (k + 1) % 4
        g.F([o[k], o[j], ot_[j], ot_[k]], m); g.F([i_[j], i_[k], it_[k], it_[j]], m)
        g.F([ot_[k], ot_[j], it_[j], it_[k]], m); g.F([o[j], o[k], i_[k], i_[j]], m)
g = A.G("Sacak"); z0, z1, d = P["sacak"] - P["D_sacak_h"], P["sacak"] + 0.02, P["D_sacak_d"]
halka(g, kare(HD + d), kare(HD - 0.05), z0, z1, M["tugla"])
halka(g, kare(HA + 0.05), kare(HA - d), z0, z1, M["tugla"])
g.obj()

# --- Bacalar: dış çatı yüzünde oda başına bir baca ---
g = A.G("Bacalar"); bw, bh = P["D_baca"]; rb = P["D_baca_r"]
zc = P["sacak"] + (HD - rb) / (HD - HM) * (P["mahya"] - P["sacak"])     # çatı kotu (baca ekseninde)
for O, T, N, (nx, ny) in yuzler(rb, False):
    L3 = 2 * rb - 4.0; n3 = round(L3 / adim2)
    for i in range(n3):
        s = -L3 / 2 + L3 / n3 * (i + 0.5); c = O + T * s
        g.prism(A.rect(c, bw, bw), zc - 0.15, zc + bh, M["tugla"], M["tugla"])   # eğim 0,31 → 0,3 m yarı genişlikte 0,09 m; 0,15 gömme yeter
        g.roof_pyr(A.rect(c, bw + 0.15, bw + 0.15), zc + bh, zc + bh + 0.35, M["cati"])
g.obj()

# --- Sadirvan ve Agaclar (avlu) ---
g = A.G("Sadirvan"); r = P["D_sadirvan_r"]; h = P["D_sadirvan_h"]
g.prism(A.circle(c0, r, 8, math.pi / 8), 0.0, h, M["tas"], M["su"])
g.lathe(c0, [(0.35, h - 0.05), (0.25, h + 0.5), (0.5, h + 0.6), (0.0, h + 0.75)], 8, [M["tas"]] * 3)
g.obj()
g = A.G("Agaclar")
for x, y in P["D_agac"]:
    c = Vector((x, y))
    g.lathe(c, [(0.35, 0.0), (0.3, 4.5), (0.0, 4.5)], 8, [M["govde"]] * 2)
    g.lathe(c, [(0.0, 4.2)] + [(3.4 * math.sin(math.pi * k / 6), 7.6 - 3.4 * math.cos(math.pi * k / 6)) for k in range(1, 6)] + [(0.0, 11.0)], 10, [M["agac"]] * 6)
g.obj()

# --- Zemin (kaide diski + gölge; .glb'ye girmez) ---
zr = math.hypot(HD, HD) + P["zemin_pay"]
g = A.G("Zemin"); g.prism(A.circle(c0, zr, 48), -0.4, 0.0, M["cim"], M["cim"]); g.obj()
g = A.G("Zemin_Golge")
g.prism([Vector((q.x * P["golge_pay"], q.y * P["golge_pay"] * 0.97 - 1.5)) for q in A.circle(c0, zr, 48)], -0.9, -0.5, M["golge"], M["golge"]); g.obj()

# ================= UV: almaşık =================
def uv_almasik():
    kw_, kh_ = P["D_karo_w"], P["D_karo_h"]
    for o in [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin"))]:
        idx = [i for i, s_ in enumerate(o.material_slots) if s_.material is M["duvar"]]
        if not idx: continue
        me = o.data; uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
        for p_ in me.polygons:
            if p_.material_index not in idx: continue
            n_ = p_.normal; t_ = Vector((-n_.y, n_.x, 0)).normalized() if abs(n_.z) < 0.7 else None
            for li in p_.loop_indices:
                co = o.matrix_world @ me.vertices[me.loops[li].vertex_index].co
                uvl.data[li].uv = ((co.x * t_.x + co.y * t_.y) / kw_, co.z / kh_) if t_ is not None else (co.x / kw_, co.y / kh_)
uv_almasik()

# ================= kontrol =================
os.makedirs(KONTROL, exist_ok=True)
rapor = A.kontrol_hepsi(KONTROL, "kontrol")
mk = A.mesh_kontrol()
rapor["parcalar"] = {k: v["ucgen"] for k, v in mk.items()}
rapor["draw_call"] = sum(len(o.material_slots) for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin")))
print("RAPOR", json.dumps(rapor, ensure_ascii=False))

# ================= AO + .glb =================
A.ao_vertex(samples=32)
for m in DOKULU:
    nt = m.node_tree; tx = nt.nodes.get("DOKU"); mul = next((n for n in nt.nodes if n.type == "MIX" and n.blend_type == 'MULTIPLY'), None)
    if tx and mul: nt.links.new(tx.outputs["Color"], mul.inputs[6])
os.makedirs(os.path.dirname(EXPORT), exist_ok=True)
rapor["glb_bayt"] = A.disa_aktar(EXPORT, draco=True)
with open(os.path.join(KONTROL, "kontrol_rapor.json"), "w", encoding="utf-8") as fh: json.dump(rapor, fh, ensure_ascii=False, indent=1)
print("GLB", EXPORT, rapor["glb_bayt"])

# ================= render (Workbench, dokulu) =================
def kurulum_render():
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sh = sc.display.shading
    sh.light = 'STUDIO'; sh.color_type = 'TEXTURE'; sh.show_shadows = False
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
d = 120; el = math.radians(33); az = math.radians(45)
render(kamera("CAM_Havadan", (d * math.cos(el) * math.cos(az), d * math.cos(el) * math.sin(az), d * math.sin(el)), (0, 0, 4)), "havadan")
render(kamera("CAM_Avlu", (-8, -9, 7.5), (6, 8, 4.5), lens=18), "avlu_ici")              # ref Emir-Hani-4/5
render(kamera("CAM_Giris", (6, HD + 18, 3), (0, HD, 3.5), lens=30), "kuzey_giris")       # ref Emir-Hani-1
render(kamera("CAM_Kuzey_Orto", (0, 150, 8), (0, 0, 8), orto=56.0), "kuzey_orto")

os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("BITTI", BLEND)
