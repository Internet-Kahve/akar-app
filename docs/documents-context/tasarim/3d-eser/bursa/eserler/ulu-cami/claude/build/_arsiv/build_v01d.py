# Bursa Ulucami · v01d KUBBE ve MİNARE biçimi. Pencere, taç kapı, silme YOK.
# Çalıştır: blender -b --python 3d-eser/bursa/ulu-cami/build_v01d.py
# Eksenler: Z yukarı; kuzey = -Y (kuzey cephe -Y'ye bakar); +X = batı. Orijin: zemin ortası.
# Plan 70 × 56 (OSM + envanter), 5 × 4 bölme × 14 m. Parçalar: Govde, Cati, Kubbeler_19, Sadirvan_Kubbe, Alemler, Minare_1, Minare_2, Zemin, Merkez
import sys, os, json, math
ESER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ESER, "..", "..", "_kutuphane"))
import bpy, bmesh, akar3d as A
from mathutils import Vector, Matrix

KONTROL = os.path.join(ESER, "kontrol")
BLEND = os.path.join(ESER, "ulu-cami_v01d.blend")

# ---- ölçüler: plan 70 × 56, bölme 14 (değişmez). Kotlar Miniatürk maketinden: cephe 70 m = 1500 px → 21,4 px/m ----
W, D = 70.0, 56.0
NX, NY, BOLME = 5, 4, 14.0
R_KASNAK = 6.5                                  # kasnak dış Ø 13,0 (maket 13,1–13,8)
R_ETEK = 6.8                                    # kubbe eteği Ø 13,6; komşu etekler arası 0,4 m
DUVAR = 17.3                                    # saçak altı (maket)
KASNAK_TEPE = [21.6, 23.0, 24.3, 23.0, 21.6]    # kasnak üst kotu (kamera eğimi düzeltilmiş)
KUBBE_R = [3.1, 3.3, 4.1, 3.3, 3.1]             # kasnak üstünden tepeye
AYAK = [18.8, 19.0, 19.9, 19.0, 18.8]           # kasnağın çatıdan çıktığı kot (orta sütun daha yüksek)
ACIK = (2, 1)
EGIM = math.tan(math.radians(17.5))
PLATO = 5.0
FARK = EGIM * (BOLME / 2 - R_KASNAK)            # kasnak halkasının (eksende) oluk üstü yüksekliği
ZGC = [t - FARK for t in AYAK]                  # sütuna göre oluk kotu

A.temizle()
M = A.palet({"duvar": "#D4BE96", "kasnak": "#E2C77E", "kubbe": "#A9B4C2", "cati": "#9AA2AC",
             "mermer": "#ECE8DF", "minare_tugla": "#A65A43", "pencere": "#4A5A66", "alem": "#DCA320",
             "alem_kursun": "#6B7480", "mermer_koyu": "#5E6670"})
_b = next(n for n in M["alem_kursun"].node_tree.nodes if n.type == "BSDF_PRINCIPLED")
_b.inputs["Metallic"].default_value = 0.6; _b.inputs["Roughness"].default_value = 0.4
c0 = Vector((0, 0))

z = A.G("Zemin"); z.prism(A.rect(Vector((0, -6)), 86, 76), -1.0, 0.0, M["zemin"], M["zemin"]); z.obj()
g = A.G("Govde"); g.prism(A.rect(c0, W, D), -0.2, DUVAR, M["duvar"], M["duvar"]); g.obj()

# ---- Cati: sütun başına farklı kot (basamaklı), her bölmede kırma; bölme kenarı = oluk ----
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
        if ix == 0: c.F([V(x0, y1, DUVAR), V(x0, y0, DUVAR), V(x0, y0, zg), V(x0, y1, zg)], CM)
        if ix == NX - 1: c.F([V(x1, y0, DUVAR), V(x1, y1, DUVAR), V(x1, y1, zg), V(x1, y0, zg)], CM)
        for yy, sira in ((y0, iy == 0), (y1, iy == NY - 1)):
            if not sira: continue
            poly = [V(x0, yy, DUVAR), V(x1, yy, DUVAR)]
            if ix < NX - 1 and ZGC[ix + 1] < zg: poly.append(V(x1, yy, ZGC[ix + 1]))
            poly += [V(x1, yy, zg), V(x0, yy, zg)]
            if ix > 0 and ZGC[ix - 1] < zg: poly.append(V(x0, yy, ZGC[ix - 1]))
            c.F(poly, CM)
for ix in range(1, NX):
    zl, zh = sorted((ZGC[ix - 1], ZGC[ix]))
    for iy in range(NY):
        y0, y1 = ys[iy], ys[iy + 1]
        c.F([V(xs[ix], y0, zl), V(xs[ix], y1, zl), V(xs[ix], y1, zh), V(xs[ix], y0, zh)], CM)
per = [(x, ys[0]) for x in xs] + [(xs[-1], y) for y in ys[1:]] + [(x, ys[-1]) for x in xs[-2::-1]] + [(xs[0], y) for y in ys[-2:0:-1]]
c.F([V(p[0], p[1], DUVAR) for p in per][::-1], CM); c.obj()

# ---- Kubbe + kasnak: bölme başına TEK kapalı mesh; kubbe G.lathe profiliyle (etekte dışa kıvrım) ----
def kubbe_profil(zt, rise):
    """(r, z) aşağıdan yukarı: kasnak halkası → etek altı → dışa kıvrılan saçak → içe bel → yuvarlak gövde → tepe."""
    zb = zt + 0.55; a = 6.3; h = rise - 0.55
    Rs = (a * a + h * h) / (2 * h); am = math.asin(a / Rs)
    pts = [(R_KASNAK, zt), (R_ETEK, zt), (R_ETEK, zt + 0.12), (6.55, zt + 0.24), (6.4, zt + 0.38), (a, zb)]
    n = 8
    for k in range(1, n):
        al = am * (n - k) / n
        pts.append((Rs * math.sin(al), zb + Rs * (math.cos(al) - math.cos(am))))
    pts.append((0.0, zb + h))
    return pts
def bolme(g_, ix, iy):
    bc = Vector(((ix - (NX - 1) / 2) * BOLME, (iy - (NY - 1) / 2) * BOLME))   # iy=0 en kuzey (-Y)
    ring = A.ccw(A.circle(bc, R_KASNAK, 16, 0.0)); zt = KASNAK_TEPE[ix]
    b = [g_.V(q, cati_z(q, bc, ZGC[ix]) - 0.05) for q in ring]; t = [g_.V(q, zt) for q in ring]
    n = len(ring)
    for i in range(n):
        j = (i + 1) % n; g_.F([b[i], b[j], t[j], t[i]], M["kasnak"])
    g_.F(b[::-1], M["kasnak"])
    g_.lathe(bc, kubbe_profil(zt, KUBBE_R[ix]), 16, [M["kubbe"]] * 40)
    g_.bm.faces.ensure_lookup_table(); cap = g_.bm.faces[-1]       # lathe'in taban kapağı: kasnak üstüne oturduğu için silinir
    assert len(cap.verts) == 16 and all(abs(v.co.z - zt) < 1e-6 for v in cap.verts)
    bmesh.ops.delete(g_.bm, geom=[cap], context='FACES_ONLY')
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

# ---- Minareler: Miniatürk maketinden (21,4 px/m). Kuzey cephenin iki ucunda, kaide dış kenarı yan duvarla hizalı,
#      kuzey cepheden öne çıkık (duvara bitişik). Kaideler FARKLI.
def govde_basi(g_, c_, z0, ust_kaide_mat):
    T, TU = M["minare_tas"], M["minare_tugla"]
    prof = [  # (r, z, malzeme: bir önceki noktadan buraya aralık)
        (2.65, z0, TU), (2.55, 36.6, TU),
        (2.7, 36.7, TU), (3.0, 37.4, TU), (3.1, 38.5, TU), (3.1, 40.2, TU), (3.3, 40.8, TU),   # mukarnas/bilezik kuşağı
        (3.8, 41.3, T), (3.8, 42.8, T), (2.15, 42.8, T),                                      # şerefe (taş)
        (2.15, 49.2, TU),                                                                      # üst gövde (tuğla)
        (2.65, 49.2, T), (2.65, 49.7, T), (2.0, 50.4, T), (1.55, 51.2, T),                    # silme + konik geçiş
        (1.8, 51.8, T), (2.0, 52.6, T), (1.9, 53.4, T), (1.4, 54.0, T),                       # alt soğan (Ø 4,0)
        (1.15, 54.3, T), (1.1, 54.6, T),                                                       # boyun
        (1.35, 55.0, T), (1.5, 55.7, T), (1.35, 56.4, T), (0.9, 57.0, T),                     # üst soğan (Ø 3,0)
        (0.5, 57.3, T), (0.45, 58.3, T), (0.3, 58.9, T), (0.12, 59.4, T), (0.05, 60.7, T), (0.0, 60.9, T)]   # sivri uç + alem (başlıkla aynı)
    g_.lathe(c_, [(r, zz) for r, zz, _ in prof], 16, [m for _, _, m in prof[1:]])
def minare_bantli(ad, c_):          # çokgen (sekizgen) beyaz mermer kaide, koyu gri bantlı, yüksek
    g_ = A.G(ad); B, K = M["mermer"], M["mermer_koyu"]
    kp = [(5.2, -0.2, B), (4.6, 1.5, B), (3.9, 3.3, B), (3.9, 7.2, B), (3.9, 7.9, K), (3.9, 8.8, B), (3.9, 9.5, K), (3.9, 15.0, B)]
    g_.lathe(c_, [(r, zz) for r, zz, _ in kp], 8, [m for _, _, m in kp[1:]])
    bmesh.ops.rotate(g_.bm, cent=(c_.x, c_.y, 0), matrix=Matrix.Rotation(math.pi / 8, 3, 'Z'), verts=g_.bm.verts)   # yüzler eksenlere baksın
    govde_basi(g_, c_, 15.0, B)
    return g_.obj()
def minare_sade(ad, c_):            # kare, sade taş kaide + kısa geçiş
    g_ = A.G(ad); T = M["minare_tas"]
    g_.prism(A.rect(c_, 7.4, 7.4), -0.2, 4.6, T, T)
    g_.lathe(c_, [(3.7, 4.6), (3.2, 6.1)], 8, [T])
    govde_basi(g_, c_, 6.1, T)
    return g_.obj()
XB = W / 2 - 5.2 * math.cos(math.pi / 8)           # bantlı: etek dış kenarı batı duvarıyla hizalı
YB = -D / 2 - 5.2 * math.cos(math.pi / 8) - 0.02
XS = W / 2 - 3.7; YS = -D / 2 - 3.7 - 0.02
minare_bantli("Minare_1", Vector((XB, YB)))          # kuzeybatı (+X = batı): maket fotoğrafında sağdaki
minare_sade("Minare_2", Vector((-XS, YS)))           # kuzeydoğu (-X): maket fotoğrafında soldaki

# Merkez
e = bpy.data.objects.new("Merkez", None); bpy.context.scene.collection.objects.link(e); e.location = (0, 0, 0)

R = A.kontrol_hepsi(KONTROL, "v01d")
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
def ortho(ad, loc, rot, olcek, res):
    sc.render.resolution_x, sc.render.resolution_y = res
    cd = bpy.data.cameras.new("_o"); cd.type = 'ORTHO'; cd.ortho_scale = olcek; cd.clip_end = 1000
    cam = bpy.data.objects.new("_o", cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = loc; cam.rotation_euler = rot
    sc.render.filepath = os.path.join(KONTROL, ad); bpy.ops.render.render(write_still=True)
ortho("v01d_kuzey_orto.png", (0, -300, 30), (math.pi / 2, 0, 0), 120, (1400, 1000))
render("v01d_hava_kuzeybati.png", (110, -125, 95), (0, 0, 10), 50)
bc1 = tepeler[1][0]
render("v01d_kubbe_yakin.png", (bc1.x + 28, bc1.y - 42, 30), (bc1.x, bc1.y, 22.5), 60, res=(1100, 800))
ortho("v01d_minare_ikisi.png", (0, -150, 14), (math.pi / 2, 0, 0), 90, (1600, 700))
