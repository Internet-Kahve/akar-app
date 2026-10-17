# AKAR · Orhan Bey Külliyesi · Orhan Bey Hamamı · v02 DETAY + RENK + ÇIKIŞ (B kademe, sade; kütle hamam v01'de donduruldu)
#   - Kuzey girişi (erkekler soğukluğu kuzey yüzü, planda ortadaki açıklık): yuvarlak kemerli kapı, almaşık kemer
#     (E PDF s.106: "üç sıra kırmızı ve beyaz tuğla ile bir sıra küfeki taş"), üstünde yuvarlak pencere (E: "dikine tuğla
#     yuvarlak pencere"); yanlarda plandaki iki açıklık yuvarlak kemerli pencere.
#   - Tuğla saçak bantları; soğuklukların duvar üstünde tuğla kasnak bandı (E: "kasnaklar üç sıra tuğla ve bir sıra kesme taş").
#   - Fil gözleri: sıcaklık ve ılıklık kubbelerinde koyu küçük noktalar (_ortak_stil § 3 hamam; Ayverdi kesitinde kubbe delikleri).
#   - Kubbe dilim dokusu (cami ile aynı karo: doku/kubbe_dilim.png); duvarlar düz renk (kesme taş, B kademe). AO + Draco .glb.
#   Eklenmeyenler: külhan bacası (yeri kaynakta yok), küçük halvet kubbeleri (dondurma kararı), çarşı ekleri.
# Çalıştırma:
#   blender -b --python docs/documents-context/tasarim/3d-eser/bursa/eserler/orhan-bey-kulliyesi/claude/build/build_hamam_v02.py
# Eksenler: +X = doğu, +Y = kuzey, +Z = yukarı. Plan okuması (u güney→kuzey, v doğu→batı, Çetintaş ham birim):
#   Y = 1,38·u − 17,65 ; X = 18,85 − 1,38·v.
import sys, os, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 5, "_kutuphane")))
import bpy
import akar3d as A
from mathutils import Vector

SURUM = "hamam_v02"
AD = "orhan-bey-hamami"
CLAUDE = os.path.dirname(HERE)
KONTROL = os.path.join(CLAUDE, "kontrol", SURUM)
BLEND = os.path.join(CLAUDE, "blend", f"{AD}_v02.blend")
EXPORT = os.path.join(CLAUDE, "export", f"{AD}_v02.glb")
DOKU = os.path.join(HERE, "doku")

P = {
    # ================= KÜTLE (hamam v01, donduruldu) =================
    "olcek": 1.38, "kesit_olcek": 1.16,
    "erkek": (14.96, 25.6, 8.4, 19.6), "kadin": (12.1, 21.4, 0.0, 8.4),
    "alcak": [(0, 9.1), (2.55, 9.1), (2.55, 5.2), (12.1, 5.2), (12.1, 8.4), (15.0, 8.4),
              (15.0, 19.6), (10.6, 19.6), (10.6, 27.3), (0, 27.3)],
    "erkek_c": (20.3, 14.0), "kadin_c": (16.7, 4.3), "sicaklik_c": (5.0, 14.9), "iliklik_c": (12.6, 16.2),
    "erkek_duvar": 8.6, "erkek_tepe": 16.2, "erkek_kubbe_d": 14.0, "fener_r": 0.9, "fener_h": 1.0,
    "kadin_duvar": 7.5, "kadin_tepe": 14.1, "kadin_kubbe_d": 11.2, "alcak_h": 5.6,
    "sicaklik_kasnak": 6.0, "sicaklik_tepe": 9.5, "sicaklik_kasnak_w": 6.4, "sicaklik_kubbe_d": 6.0,
    "iliklik_kasnak": 5.8, "iliklik_tepe": 9.2, "iliklik_kasnak_w": 6.4, "iliklik_kubbe_d": 6.0,
    "pah": 0.30, "zemin_pay": 6.0, "golge_pay": 1.06,
    # ================= v02 DETAY =================
    "D_giris_v": 13.9,                     # P: erkek soğukluğu kuzey duvarındaki orta açıklık (v 13,4–14,4)
    "D_yan_pen_v": [11.5, 16.3],           # P: aynı duvardaki iki yan açıklık
    "D_kapi_w": 1.6, "D_kapi_h": 3.2,      # T: açıklık 1,0 × 1,38 ≈ 1,4 m; yuvarlak kemerli
    "D_kemer_bant": 0.45,                  # E: almaşık kemer (tuğla + küfeki) bandı
    "D_yuvarlak_pen": (5.0, 0.55),         # E/T: kapı üstünde yuvarlak pencere (merkez z, yarıçap)
    "D_pen_w": 1.0, "D_pen_z0": 3.6, "D_pen_uzengi": 4.6,   # T: yan açıklıklar, yuvarlak kemerli pencere
    "D_sacak_h": 0.35, "D_sacak_d": 0.18,  # cami ile aynı tuğla saçak bandı
    "D_kasnak_bant_h": 1.0,                # E: soğuklukların duvar üstünde tuğla kasnak bandı (saçak altından)
    "D_filgozu_r": 0.14, "D_filgozu": [(30, 8), (55, 8)],   # (yükseklik açısı °, adet): iki halka
    "D_kubbe_sira": 6,
}
S = P["olcek"]; X0, Y0 = 27.3 * S / 2, 25.6 * S / 2
def XY(u, v): return Vector((X0 - S * v, S * u - Y0))
def R_uv(u0, u1, v0, v1): return [XY(u0, v0), XY(u1, v0), XY(u1, v1), XY(u0, v1)]
def pahli_kare(c, w, pah):
    h, k = w / 2, w / 2 * (1 - pah)
    return [c + Vector(q) for q in ((k, -h), (h, -k), (h, k), (k, h), (-k, h), (-h, k), (-h, -k), (-k, -h))]

M = {k: A.mat(n, hx) for k, n, hx in [
    ("duvar", "Duvar", "#E2B7A4"),       # eser.md Palet: Duvarlar (2) hamam, kesme taş (B kademe: düz renk)
    ("kubbe", "Kubbe", "#A8AEC1"),       # eser.md Palet (vurgu 2); dilim dokusu
    ("cati", "Cati", "#B9C0CF"),         # düz kurşun dam, fenerler
    ("tugla", "Tugla", "#C6755B"),       # _ortak_stil tuğla: saçak, kasnak bandı, kemer
    ("tas", "Tas", "#F2F3E5"),           # küfeki/kesme taş çerçeve
    ("kapi", "Kapi", "#6B4A3A"),
    ("pencere", "Pencere", "#2A2D35"),   # koyu pencere boşluğu
    ("filgozu", "Fil_Gozu", "#415072"),  # _ortak_stil lacivert (koyu nokta)
    ("cim", "Zemin_Cim", "#A0B46C"),
    ("golge", "Zemin_Golge", "#E29B87"),
]}
def doku_bagla(m, dosya):
    nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tx = nt.nodes.new("ShaderNodeTexImage"); tx.image = bpy.data.images.load(os.path.join(DOKU, dosya), check_existing=True)
    tx.name = "DOKU"; nt.links.new(tx.outputs["Color"], bsdf.inputs["Base Color"])
DOKULU = [M["kubbe"]]
doku_bagla(M["kubbe"], "kubbe_dilim.png")

A.temizle()

# ================= KÜTLE (hamam v01, donduruldu; fener malzemesi kubbe → çati: dilim dokusu fenere taşmasın) =================
KUBBE = {}   # ad → [(merkez, taban z, yükselme, taban yarıçapı)]
def kubbe(g, ad, uv, z0, zk, zt, kw, kd, kasnak=True):
    c = XY(*uv)
    if kasnak: g.prism(pahli_kare(c, kw, P["pah"]), z0 - 0.05, zk, M["duvar"], M["cati"])
    else: zk = z0
    g.dome(A.circle(c, kd / 2, 24), zk - 0.05, zt - zk + 0.05, M["kubbe"], rings=8)
    KUBBE.setdefault(ad, []).append((c, zk - 0.05, zt - zk + 0.05, kd / 2))
def fener(g, uv, ztepe):
    c = XY(*uv); g.prism(A.circle(c, P["fener_r"], 8, math.pi / 8), ztepe - 0.3, ztepe + P["fener_h"], M["cati"], M["cati"])

g = A.G("Hamam_Sogukluk_Erkek"); g.prism(R_uv(*P["erkek"]), 0.0, P["erkek_duvar"], M["duvar"], M["cati"])
kubbe(g, "Hamam_Sogukluk_Erkek", P["erkek_c"], P["erkek_duvar"], 0, P["erkek_tepe"], 0, P["erkek_kubbe_d"], kasnak=False)
fener(g, P["erkek_c"], P["erkek_tepe"]); g.obj()
g = A.G("Hamam_Sogukluk_Kadin"); g.prism(R_uv(*P["kadin"]), 0.0, P["kadin_duvar"], M["duvar"], M["cati"])
kubbe(g, "Hamam_Sogukluk_Kadin", P["kadin_c"], P["kadin_duvar"], 0, P["kadin_tepe"], 0, P["kadin_kubbe_d"], kasnak=False)
fener(g, P["kadin_c"], P["kadin_tepe"]); g.obj()
g = A.G("Hamam_Sicaklik"); g.prism([XY(u, v) for u, v in P["alcak"]], 0.0, P["alcak_h"], M["duvar"], M["cati"]); g.obj()
g = A.G("Kubbe_Sicaklik")
kubbe(g, "Kubbe_Sicaklik", P["sicaklik_c"], P["alcak_h"], P["sicaklik_kasnak"], P["sicaklik_tepe"], P["sicaklik_kasnak_w"], P["sicaklik_kubbe_d"]); g.obj()
g = A.G("Kubbe_Iliklik")
kubbe(g, "Kubbe_Iliklik", P["iliklik_c"], P["alcak_h"], P["iliklik_kasnak"], P["iliklik_tepe"], P["iliklik_kasnak_w"], P["iliklik_kubbe_d"]); g.obj()

# ================= v02 DETAY =================
def panel(g, O, T, N, poly, o0, o1, m, m_yan=None):
    Pt = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
    a = [g.bm.verts.new(Pt(s, z, o0)) for s, z in poly]; b = [g.bm.verts.new(Pt(s, z, o1)) for s, z in poly]
    g.F(b, m); g.F(a[::-1], m_yan or m)
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g.F([a[i], a[j], b[j], b[i]], m_yan or m)
def yuvarlak(w, z0, zs, n=8):
    return [(-w / 2, z0), (w / 2, z0)] + [((w / 2) * math.cos(math.pi * k / n), zs + (w / 2) * math.sin(math.pi * k / n)) for k in range(n + 1)]
def daire(cz, r, n=16): return [(r * math.cos(2 * math.pi * k / n), cz + r * math.sin(2 * math.pi * k / n)) for k in range(n)]

# --- Hamam_Giris: erkek soğukluğu kuzey yüzü ---
g = A.G("Hamam_Giris"); YN = Y0
O0, T, N = Vector((0, YN)), Vector((1, 0)), Vector((0, 1))
def at(s): return O0 + T * s
s = X0 - S * P["D_giris_v"]; w, h, b = P["D_kapi_w"], P["D_kapi_h"], P["D_kemer_bant"]; zs = h - w / 2
panel(g, at(s), T, N, yuvarlak(w + 2 * b, 0.0, zs), 0.04, 0.07, M["tugla"])
panel(g, at(s), T, N, yuvarlak(w + 2 * b - 0.3, 0.0, zs), 0.07, 0.09, M["tas"])     # iç küfeki halkası
panel(g, at(s), T, N, yuvarlak(w, 0.0, zs), 0.09, 0.12, M["kapi"])
cz, r = P["D_yuvarlak_pen"]
panel(g, at(s), T, N, daire(cz, r + 0.25), 0.04, 0.07, M["tugla"])
panel(g, at(s), T, N, daire(cz, r), 0.07, 0.10, M["pencere"])
for v in P["D_yan_pen_v"]:
    s = X0 - S * v; pw = P["D_pen_w"]
    panel(g, at(s), T, N, yuvarlak(pw + 0.4, P["D_pen_z0"] - 0.15, P["D_pen_uzengi"]), 0.04, 0.07, M["tugla"])
    panel(g, at(s), T, N, yuvarlak(pw, P["D_pen_z0"], P["D_pen_uzengi"]), 0.07, 0.10, M["pencere"])
g.obj()

# --- Sacak: tuğla saçak bantları + soğukluklarda tuğla kasnak bandı ---
def genis(p, d):
    """Çokgeni dışa d kadar ötele (açıortay; dik açılı çokgenler için)."""
    p = A.ccw(p); n = len(p); out = []
    for i in range(n):
        a, b_, c = p[i - 1], p[i], p[(i + 1) % n]
        e1 = (b_ - a).normalized(); e2 = (c - b_).normalized()
        n1 = Vector((e1.y, -e1.x)); n2 = Vector((e2.y, -e2.x)); bis = n1 + n2
        bis = bis / bis.length if bis.length > 1e-6 else n1
        out.append(b_ + bis * d / max(bis.dot(n1), 0.3))
    return out
def halka(g, poly, d_dis, d_ic, z0, z1, m):
    """İçi boş kapalı bant: dış kenar duvardan d_dis dışarıda, iç kenar d_ic içeride. Dolu prizma olursa üst yüzü damla
    aynı düzlemde kalır (z-fighting; hamam v02 ilk denemede alçak damda kırmızı-gri titreşim)."""
    o, i_ = genis(poly, d_dis), genis(poly, -d_ic); n = len(o)
    ob, ot = [g.V(q, z0) for q in o], [g.V(q, z1) for q in o]; ib, it = [g.V(q, z0) for q in i_], [g.V(q, z1) for q in i_]
    for k in range(n):
        j = (k + 1) % n
        g.F([ob[k], ob[j], ot[j], ot[k]], m); g.F([ib[j], ib[k], it[k], it[j]], m)
        g.F([ot[k], ot[j], it[j], it[k]], m); g.F([ob[j], ob[k], ib[k], ib[j]], m)
g = A.G("Sacak"); sh, sd = P["D_sacak_h"], P["D_sacak_d"]
for poly, z in ((R_uv(*P["erkek"]), P["erkek_duvar"]), (R_uv(*P["kadin"]), P["kadin_duvar"]),
                ([XY(u, v) for u, v in P["alcak"]], P["alcak_h"])):
    halka(g, poly, sd, 0.05, z - sh, z + 0.02, M["tugla"])          # damdan 2 cm yüksek: korniş kenarı
for poly, z in ((R_uv(*P["erkek"]), P["erkek_duvar"]), (R_uv(*P["kadin"]), P["kadin_duvar"])):
    halka(g, poly, 0.05, 0.05, z - sh - P["D_kasnak_bant_h"], z - sh - 0.01, M["tugla"])   # saçakla kenar paylaşmasın
g.obj()

# --- Fil_Gozleri: sıcaklık ve ılıklık kubbelerinde koyu küçük sekizgen levhalar (kubbe yüzeyine teğet, 3 cm dışarıda) ---
g = A.G("Fil_Gozleri"); rf = P["D_filgozu_r"]
for ad in ("Kubbe_Sicaklik", "Kubbe_Iliklik"):
    c, zb, rise, a = KUBBE[ad][0]
    Rs = (a * a + rise * rise) / (2 * rise); C = Vector((c.x, c.y, zb - (Rs - rise)))
    for el, adet in P["D_filgozu"]:
        th = math.radians(el)
        if Rs * math.sin(th) + C.z < zb + 0.3: continue
        for k in range(adet):
            ph = 2 * math.pi * (k + 0.5 * (el > 40)) / adet
            n = Vector((math.cos(th) * math.cos(ph), math.cos(th) * math.sin(ph), math.sin(th)))
            t1 = Vector((-math.sin(ph), math.cos(ph), 0)); t2 = n.cross(t1)
            p0 = C + n * (Rs + 0.03); p1 = C + n * (Rs + 0.06)
            ring0 = [g.bm.verts.new(p0 + (t1 * math.cos(2 * math.pi * j / 8) + t2 * math.sin(2 * math.pi * j / 8)) * rf) for j in range(8)]
            ring1 = [g.bm.verts.new(p1 + (t1 * math.cos(2 * math.pi * j / 8) + t2 * math.sin(2 * math.pi * j / 8)) * rf) for j in range(8)]
            g.F(ring1, M["filgozu"]); g.F(ring0[::-1], M["filgozu"])
            for j in range(8):
                j2 = (j + 1) % 8; g.F([ring0[j], ring0[j2], ring1[j2], ring1[j]], M["filgozu"])
g.obj()

# --- Zemin (kaide diski + gölge; .glb'ye girmez) ---
c0 = Vector((0, 0)); zr = math.hypot(X0, Y0) + P["zemin_pay"]
g = A.G("Zemin"); g.prism(A.circle(c0, zr, 48), -0.4, 0.0, M["cim"], M["cim"]); g.obj()
g = A.G("Zemin_Golge")
g.prism([Vector((q.x * P["golge_pay"], q.y * P["golge_pay"] * 0.97 - 1.5)) for q in A.circle(c0, zr, 48)], -0.9, -0.5, M["golge"], M["golge"]); g.obj()

# ================= UV: kubbe dilimleri =================
def uv_kubbe():
    seg = 2 * math.pi / 24
    for ad, liste in KUBBE.items():
        o = bpy.data.objects[ad]; me = o.data; uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
        ki = [i for i, s_ in enumerate(o.material_slots) if s_.material is M["kubbe"]]
        for p in me.polygons:
            if p.material_index not in ki: continue
            pc = p.center; c, zb, rise, _ = min(liste, key=lambda q: (q[0].x - pc.x) ** 2 + (q[0].y - pc.y) ** 2)
            af = math.atan2(pc.y - c.y, pc.x - c.x)
            for li in p.loop_indices:
                co = me.vertices[me.loops[li].vertex_index].co
                if math.hypot(co.x - c.x, co.y - c.y) < 1e-3: u = 0.5
                else:
                    da = (math.atan2(co.y - c.y, co.x - c.x) - af + math.pi) % (2 * math.pi) - math.pi; u = 0.5 + da / seg
                uvl.data[li].uv = (u, (co.z - zb) / rise * P["D_kubbe_sira"])
uv_kubbe()

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
    sh_ = sc.display.shading
    sh_.light = 'STUDIO'; sh_.color_type = 'TEXTURE'; sh_.show_shadows = False
    sh_.show_cavity = True; sh_.cavity_type = 'WORLD'; sh_.show_backface_culling = True
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'Standard'
    sc.render.resolution_x, sc.render.resolution_y = 1400, 900
    sh_.background_type = 'VIEWPORT'; sh_.background_color = (0.96, 0.82, 0.67)

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
ORTO = 46.0
d = 100; el = math.radians(33); az = math.radians(45)
render(kamera("CAM_Havadan", (d * math.cos(el) * math.cos(az), d * math.cos(el) * math.sin(az), d * math.sin(el)), (0, 0, 5)), "havadan")
render(kamera("CAM_Havadan_GB", (-d * 0.6, -d * 0.6, d * 0.55), (0, 0, 5)), "havadan_guneybati")
render(kamera("CAM_Dogu_Orto", (120, 0, 8), (0, 0, 8), orto=ORTO), "dogu_orto")
render(kamera("CAM_Kuzey_Orto", (0, 120, 8), (0, 0, 8), orto=ORTO), "kuzey_orto")
render(kamera("CAM_Giris", (-2, 36, 5), (-1, Y0, 4), lens=30), "kuzey_giris")
render(kamera("CAM_Filgozu", (-30, -26, 16), (-8, -4, 8), lens=40), "sicaklik_yakin")

os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("BITTI", BLEND)
