# Bursa Ulucami · v01c KÜTLE düzeltmesi 2. Pencere, taç kapı, silme YOK.
# Çalıştır: blender -b --python 3d-eser/bursa/ulu-cami/build_v01c.py
# Eksenler: Z yukarı; kuzey = -Y (kuzey cephe -Y'ye bakar); +X = batı. Orijin: zemin ortası.
# Plan 70 × 56 (OSM + envanter), 5 × 4 bölme × 14 m. Parçalar: Govde, Cati, Kubbeler_19, Sadirvan_Kubbe, Alemler, Minare_1, Minare_2, Zemin, Merkez
import sys, os, json, math
ESER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ESER, "..", "..", "_kutuphane"))
import bpy, akar3d as A
from mathutils import Vector

KONTROL = os.path.join(ESER, "kontrol")
BLEND = os.path.join(ESER, "ulu-cami_v01c.blend")

# ---- ölçüler: plan OSM 70,5 × 60,3 + envanter 69 × 55 → 70 × 56. Fotoğraf: cephe 70 m = 1040 px → 14,9 px/m ----
W, D = 70.0, 56.0
NX, NY, BOLME = 5, 4, 14.0
CAP = 11.0                                      # kubbe Ø (envanter)
DUVAR = 16.1                                    # saçak altı: (940-700)/14,9
KASNAK_TEPE = [19.7, 20.5, 22.6, 20.5, 19.7]    # kasnak üst kotu (zemin = 0), kamera eğimi düzeltilmiş
KUBBE_R = [3.6, 4.0, 4.6, 4.0, 3.6]             # kubbe yükselişi (uç / ara / orta)
KASNAK_H = 2.6                                  # görünen kasnak yüksekliği: 5 sütunda aynı
ACIK = (2, 1)                                   # kuzeyden 2. sıra, orta sütun
EGIM = math.tan(math.radians(17.5))
PLATO = 5.0                                     # kırmanın düz tepesi (yarı genişlik); kasnağın içinde kalır
FARK = EGIM * (BOLME / 2 - 5.5)                 # kasnak halkasının (m=5,5) oluk üstü yüksekliği
ZGC = [t - KASNAK_H - FARK for t in KASNAK_TEPE]  # sütuna göre oluk kotu: uç en alçak, orta en yüksek
S = 17.3 / 14.9                                 # v01b minare ölçülerinin yeni ölçeğe katsayısı

A.temizle()
M = A.palet({"duvar": "#D4BE96", "kasnak": "#E2C77E", "kubbe": "#A9B4C2", "cati": "#9AA2AC",
             "mermer": "#ECE8DF", "minare_tugla": "#A65A43", "pencere": "#4A5A66", "alem": "#DCA320",
             "alem_kursun": "#6B7480"})
_b = next(n for n in M["alem_kursun"].node_tree.nodes if n.type == "BSDF_PRINCIPLED")
_b.inputs["Metallic"].default_value = 0.6; _b.inputs["Roughness"].default_value = 0.4
c0 = Vector((0, 0))

# Zemin (minareler kuzeyde cephenin önünde)
z = A.G("Zemin"); z.prism(A.rect(Vector((0, -4)), 94, 80), -1.0, 0.0, M["zemin"], M["zemin"]); z.obj()
# Govde
g = A.G("Govde"); g.prism(A.rect(c0, W, D), -0.2, DUVAR, M["duvar"], M["duvar"]); g.obj()

# ---- Cati: sütun başına farklı kot (basamaklı yükselen); her bölmede kırma; bölme kenarı = oluk ----
def cati_z(q, bc, zg):
    m = max(abs(q.x - bc.x), abs(q.y - bc.y), PLATO)
    return zg + EGIM * (BOLME / 2 - m)
xs = [-W / 2 + BOLME * i for i in range(NX + 1)]; ys = [-D / 2 + BOLME * j for j in range(NY + 1)]
c = A.G("Cati"); cache = {}
def V(x, y, zz):
    k = (round(x, 3), round(y, 3), round(zz, 3))
    if k not in cache: cache[k] = c.bm.verts.new((x, y, zz))
    return cache[k]
CM = M["cati"]
for ix in range(NX):
    zg = ZGC[ix]
    for iy in range(NY):
        x0, x1, y0, y1 = xs[ix], xs[ix + 1], ys[iy], ys[iy + 1]
        xc, yc = (x0 + x1) / 2, (y0 + y1) / 2; zp = zg + EGIM * (BOLME / 2 - PLATO)
        k = [V(x0, y0, zg), V(x1, y0, zg), V(x1, y1, zg), V(x0, y1, zg)]
        p = [V(xc - PLATO, yc - PLATO, zp), V(xc + PLATO, yc - PLATO, zp), V(xc + PLATO, yc + PLATO, zp), V(xc - PLATO, yc + PLATO, zp)]
        for i in range(4):
            j = (i + 1) % 4; c.F([k[i], k[j], p[j], p[i]], CM)
        c.F(p, CM)
        # dış duvar (saçak altı = DUVAR kotuna kadar), komşu daha alçaksa ara köşe eklenir (T-birleşim olmasın)
        if ix == 0: c.F([V(x0, y1, DUVAR), V(x0, y0, DUVAR), V(x0, y0, zg), V(x0, y1, zg)], CM)
        if ix == NX - 1: c.F([V(x1, y0, DUVAR), V(x1, y1, DUVAR), V(x1, y1, zg), V(x1, y0, zg)], CM)
        for yy, sira in ((y0, iy == 0), (y1, iy == NY - 1)):
            if not sira: continue
            ys_ = yy
            poly = [V(x0, ys_, DUVAR), V(x1, ys_, DUVAR)]
            if ix < NX - 1 and ZGC[ix + 1] < zg: poly.append(V(x1, ys_, ZGC[ix + 1]))
            poly += [V(x1, ys_, zg), V(x0, ys_, zg)]
            if ix > 0 and ZGC[ix - 1] < zg: poly.append(V(x0, ys_, ZGC[ix - 1]))
            c.F(poly, CM)
# sütunlar arası kısa düşey geçiş (riser)
for ix in range(1, NX):
    zl, zh = sorted((ZGC[ix - 1], ZGC[ix]))
    for iy in range(NY):
        y0, y1 = ys[iy], ys[iy + 1]
        c.F([V(xs[ix], y0, zl), V(xs[ix], y1, zl), V(xs[ix], y1, zh), V(xs[ix], y0, zh)], CM)
per = [(x, ys[0]) for x in xs] + [(xs[-1], y) for y in ys[1:]] + [(x, ys[-1]) for x in xs[-2::-1]] + [(xs[0], y) for y in ys[-2:0:-1]]
c.F([V(p[0], p[1], DUVAR) for p in per][::-1], CM); c.obj()

# ---- Kubbe + kasnak: her bölmede TEK kapalı mesh (kasnak tabanı çatıyı izler, 5 cm gömülü) ----
def bolme(g_, ix, iy):
    bc = Vector(((ix - (NX - 1) / 2) * BOLME, (iy - (NY - 1) / 2) * BOLME))   # iy=0 en kuzey (-Y)
    ring = A.ccw(A.circle(bc, CAP / 2, 16, 0.0)); zt = KASNAK_TEPE[ix]
    b = [g_.V(q, cati_z(q, bc, ZGC[ix]) - 0.05) for q in ring]; t = [g_.V(q, zt) for q in ring]
    n = len(ring)
    for i in range(n):
        j = (i + 1) % n; g_.F([b[i], b[j], t[j], t[i]], M["kasnak"])
    g_.F(b[::-1], M["kasnak"])
    g_.dome(ring, zt, KUBBE_R[ix], M["kubbe"], rings=8, cap=False)           # aynı halka, taban kapağı yok
    return bc, zt + KUBBE_R[ix]
kub = A.G("Kubbeler_19"); sad = A.G("Sadirvan_Kubbe"); tepeler = []
for iy in range(NY):
    for ix in range(NX):
        tepeler.append(bolme(sad if (ix, iy) == ACIK else kub, ix, iy))
kub.obj(); sad.obj()

# ---- Alemler: 20 kubbenin tepesine ince sivri alem (5 cm gömülü), tek nesne ----
al = A.G("Alemler")
for bc, zt in tepeler:
    al.lathe(bc, [(0.12, zt - 0.05), (0.12, zt + 0.2), (0.25, zt + 0.45), (0.1, zt + 0.7), (0.0, zt + 1.5)], 8, [M["alem_kursun"]] * 4)
al.obj()

# ---- Minareler (v01b profili × S; alem başlıkla aynı malzeme) — KUZEY cephenin iki ucunda, cephenin önünde ----
def minare(ad, c_):
    g_ = A.G(ad); T, TU = M["minare_tas"], M["minare_tugla"]
    KW_, KH = 8.0 * S, 7.0 * S
    g_.prism(A.rect(c_, KW_, KW_), -0.2, KH, T, T)
    prof = [
        (4.0, 7.0, T), (3.0, 9.5, T), (2.5, 30.0, TU),
        (3.4, 30.6, T), (3.9, 31.2, T), (3.9, 33.9, T), (2.25, 33.9, T),
        (2.25, 40.8, TU),
        (2.7, 40.8, T), (2.7, 41.3, T), (1.9, 41.3, T), (1.9, 42.6, T),
        (2.0, 43.0, T), (2.1, 43.6, T), (2.0, 44.4, T), (1.5, 45.0, T),
        (1.3, 45.5, T), (1.25, 45.9, T),
        (1.4, 46.2, T), (1.45, 46.6, T), (1.3, 47.1, T), (0.85, 47.4, T),
        (0.75, 47.6, T), (0.7, 48.5, T),
        (0.85, 48.8, T), (0.5, 49.2, T), (0.25, 49.4, T), (0.08, 51.0, T), (0.0, 51.4, T)]
    g_.lathe(c_, [(r * S, zz * S) for r, zz, _ in prof], 16, [m for _, _, m in prof[1:]])
    return g_.obj()
KW = 8.0 * S
mx = W / 2 + 2.65                                  # kaide, cephe köşesinin ~2,6 m dışında ortalı (fotoğraf: iç kenar ~2,5 m cepheye taşar)
my = -D / 2 - KW / 2 - 0.02                        # cephenin ÖNÜNDE (kuzey), duvara bitişik
minare("Minare_1", Vector((mx, my))); minare("Minare_2", Vector((-mx, my)))

# Merkez
e = bpy.data.objects.new("Merkez", None); bpy.context.scene.collection.objects.link(e); e.location = (0, 0, 0)

R = A.kontrol_hepsi(KONTROL, "v01c")
print("RAPOR", json.dumps(R, ensure_ascii=False))
bpy.ops.wm.save_as_mainfile(filepath=BLEND)

# ---- görünür renk render'ları ----
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.device = 'CPU'
sc.render.film_transparent = False
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.78, 0.82, 0.88, 1); bg.inputs[1].default_value = 1.0
sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = 3.0; sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
def render(ad, loc, tgt, lens, res=(1100, 800)):
    sc.render.resolution_x, sc.render.resolution_y = res
    cd = bpy.data.cameras.new("_c"); cd.lens = lens; cd.clip_end = 1000
    cam = bpy.data.objects.new("_c", cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = loc
    cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(KONTROL, ad); bpy.ops.render.render(write_still=True)
render("v01c_kuzey.png", (0, -230, 42), (0, 0, 16), 70)
render("v01c_hava_kuzeybati.png", (110, -125, 95), (0, 0, 10), 50)
# kuzey cepheye tam karşıdan: ortografik, göz hizası
sc.render.resolution_x, sc.render.resolution_y = 1400, 1000
cd = bpy.data.cameras.new("_o"); cd.type = 'ORTHO'; cd.ortho_scale = 120; cd.clip_end = 1000
cam = bpy.data.objects.new("_o", cd); sc.collection.objects.link(cam); sc.camera = cam
cam.location = (0, -300, 30); cam.rotation_euler = (math.pi / 2, 0, 0)
sc.render.filepath = os.path.join(KONTROL, "v01c_kuzey_orto.png"); bpy.ops.render.render(write_still=True)
