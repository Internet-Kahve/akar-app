# Bursa Ulucami · v01b KÜTLE düzeltmesi. Pencere, taç kapı, silme YOK.
# Çalıştır: blender -b --python 3d-eser/bursa/ulu-cami/build_v01b.py
# Eksenler: Z yukarı; kuzey = -Y (kuzey cephe -Y'ye bakar); +X = batı. Orijin: zemin ortası.
# Parçalar: Govde, Cati, Kubbeler_19, Sadirvan_Kubbe, Alemler, Minare_1, Minare_2, Zemin, Merkez
import sys, os, json, math
ESER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ESER, "..", "..", "_kutuphane"))
import bpy, akar3d as A
from mathutils import Vector

KONTROL = os.path.join(ESER, "kontrol")
BLEND = os.path.join(ESER, "ulu-cami_v01b.blend")

# ---- ölçüler (v01 ölçümü, ref-img3/unnamed.webp, 17,3 px/m) ----
W, D = 60.0, 48.0
NX, NY, BOLME = 5, 4, 12.0
CAP = 11.0
DUVAR = 14.0
KASNAK_TEPE = [17.1, 17.8, 19.7, 17.8, 17.1]   # kasnak üst kotu (zemin = 0); v01 ile aynı mutlak kot
KUBBE_R = [3.1, 3.6, 4.0, 3.6, 3.1]
ACIK = (2, 1)                                   # kuzeyden 2. sıra, orta sütun
ZG = 14.3                                       # oluk çizgisi (bölme kenarı) kotu
EGIM = math.tan(math.radians(17.5))             # çatı eğimi ≈ 17,5°
SACAK = 0.4
PLATO = 4.5                                     # kırmanın tepesi düz plato (yarı genişlik); kasnağın içinde kalır

A.temizle()
M = A.palet({"duvar": "#D4BE96", "kasnak": "#E2C77E", "kubbe": "#A9B4C2", "cati": "#9AA2AC",
             "mermer": "#ECE8DF", "minare_tugla": "#A65A43", "pencere": "#4A5A66", "alem": "#DCA320"})
c0 = Vector((0, 0))

# Zemin
z = A.G("Zemin"); z.prism(A.rect(c0, 84, 62), -1.0, 0.0, M["zemin"], M["zemin"]); z.obj()
# Govde
g = A.G("Govde"); g.prism(A.rect(c0, W, D), -0.2, DUVAR, M["duvar"], M["duvar"]); g.obj()

# ---- Cati: her bölmede kırma (alçak piramit), bölme kenarı = oluk; dış kenarda saçak ----
def cati_z(q, bc):                               # bölme merkezi bc'ye göre çatı kotu
    m = max(abs(q.x - bc.x), abs(q.y - bc.y), PLATO)
    return ZG + EGIM * (BOLME / 2 - m)
xs = [-W / 2 + BOLME * i for i in range(NX + 1)]; ys = [-D / 2 + BOLME * j for j in range(NY + 1)]
c = A.G("Cati"); cache = {}
def V(x, y, zz):
    k = (round(x, 3), round(y, 3), round(zz, 3))
    if k not in cache: cache[k] = c.bm.verts.new((x, y, zz))
    return cache[k]
for ix in range(NX):
    for iy in range(NY):
        x0, x1, y0, y1 = xs[ix], xs[ix + 1], ys[iy], ys[iy + 1]
        xc, yc = (x0 + x1) / 2, (y0 + y1) / 2; zp = ZG + EGIM * (BOLME / 2 - PLATO)
        k = [V(x0, y0, ZG), V(x1, y0, ZG), V(x1, y1, ZG), V(x0, y1, ZG)]
        p = [V(xc - PLATO, yc - PLATO, zp), V(xc + PLATO, yc - PLATO, zp), V(xc + PLATO, yc + PLATO, zp), V(xc - PLATO, yc + PLATO, zp)]
        for i in range(4):
            j = (i + 1) % 4; c.F([k[i], k[j], p[j], p[i]], M["cati"])
        c.F(p, M["cati"])
# çevre: iç halka (oluk kotu) → saçak halkası (aşağı eğimli) → alt halka (z = DUVAR)
per = [(x, ys[0]) for x in xs] + [(xs[-1], y) for y in ys[1:]] + [(x, ys[-1]) for x in xs[-2::-1]] + [(xs[0], y) for y in ys[-2:0:-1]]
def disari(p):
    return (p[0] + (SACAK if abs(p[0] - xs[-1]) < 1e-6 else -SACAK if abs(p[0] - xs[0]) < 1e-6 else 0),
            p[1] + (SACAK if abs(p[1] - ys[-1]) < 1e-6 else -SACAK if abs(p[1] - ys[0]) < 1e-6 else 0))
zs = ZG - EGIM * SACAK
ich = [V(p[0], p[1], ZG) for p in per]
ots = [V(*disari(p), zs) for p in per]; otb = [V(*disari(p), DUVAR) for p in per]
for i in range(len(per)):
    j = (i + 1) % len(per)
    c.F([ich[i], ich[j], ots[j], ots[i]], M["cati"])
    c.F([ots[i], ots[j], otb[j], otb[i]], M["cati"])
c.F(otb[::-1], M["cati"]); c.obj()

# ---- Kubbe + kasnak: her bölmede TEK kapalı mesh (kasnak tabanı çatıyı izler, 5 cm gömülü) ----
def bolme(g_, ix, iy):
    bc = Vector(((ix - (NX - 1) / 2) * BOLME, (iy - (NY - 1) / 2) * BOLME))   # iy=0 en kuzey (-Y)
    ring = A.ccw(A.circle(bc, CAP / 2, 16, 0.0)); zt = KASNAK_TEPE[ix]
    b = [g_.V(q, cati_z(q, bc) - 0.05) for q in ring]; t = [g_.V(q, zt) for q in ring]
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
    al.lathe(bc, [(0.12, zt - 0.05), (0.12, zt + 0.2), (0.25, zt + 0.45), (0.1, zt + 0.7), (0.0, zt + 1.5)], 8, [M["alem"]] * 4)
al.obj()

# ---- Minareler (ref-img3/unnamed.webp'den ölçülen profil; z = zeminden) ----
def minare(ad, c_):
    g_ = A.G(ad); T, TU, AL = M["minare_tas"], M["minare_tugla"], M["alem"]
    KW, KH = 8.0, 7.0
    g_.prism(A.rect(c_, KW, KW), -0.2, KH, T, T)                              # kaide (kare, açık taş)
    prof = [  # (r, z, malzeme: kendinden bir önceki noktaya giden aralık)
        (4.0, KH, T), (3.0, 9.5, T),                                          # geçiş
        (2.5, 30.0, TU),                                                      # alt gövde (tuğla, hafif daralır)
        (3.4, 30.6, T), (3.9, 31.2, T), (3.9, 33.9, T), (2.25, 33.9, T),      # şerefe: mukarnas + korkuluk
        (2.25, 40.8, TU),                                                     # üst gövde (tuğla)
        (2.7, 40.8, T), (2.7, 41.3, T), (1.9, 41.3, T), (1.9, 42.6, T),       # silme + boyun
        (2.0, 43.0, T), (2.1, 43.6, T), (2.0, 44.4, T), (1.5, 45.0, T),       # 1. soğan
        (1.3, 45.5, T), (1.25, 45.9, T),                                      # daralma
        (1.4, 46.2, T), (1.45, 46.6, T), (1.3, 47.1, T), (0.85, 47.4, T),     # 2. soğan
        (0.75, 47.6, T), (0.7, 48.5, T),                                      # boyun
        (0.85, 48.8, AL), (0.5, 49.2, AL), (0.25, 49.4, AL), (0.08, 51.0, AL), (0.0, 51.4, AL)]   # alem
    g_.lathe(c_, [(r, zz) for r, zz, _ in prof], 16, [m for _, _, m in prof[1:]])
    return g_.obj()
KW = 8.0; mx = W / 2 + KW / 2 + 0.02; my = -D / 2 + KW / 2         # kaide kuzey cepheyle aynı hizada, köşeye bitişik
minare("Minare_1", Vector((mx, my))); minare("Minare_2", Vector((-mx, my)))

# Merkez
e = bpy.data.objects.new("Merkez", None); bpy.context.scene.collection.objects.link(e); e.location = (0, 0, 0)

R = A.kontrol_hepsi(KONTROL, "v01b")
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
render("v01b_kuzey.png", (0, -190, 38), (0, 0, 14), 70)
render("v01b_hava_kuzeybati.png", (95, -105, 80), (0, 0, 10), 50)
render("v01b_minare.png", (mx + 45, -135, 30), (mx, my, 26), 85, res=(800, 1000))
