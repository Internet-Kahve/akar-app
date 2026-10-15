# Bursa Ulucami · v01 KÜTLE turu. Pencere, taç kapı, silme, alem YOK.
# Çalıştır: blender -b --python 3d-eser/bursa/ulu-cami/build_v01.py
# Eksenler: Z yukarı; kuzey = -Y (kuzey cephe -Y'ye bakar); +X = batı (sağ-el kuralı için). Orijin: zemin ortası.
import sys, os, json, math
ESER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ESER, "..", "..", "_kutuphane"))
import bpy, akar3d as A
from mathutils import Vector

KONTROL = os.path.join(ESER, "kontrol")
BLEND = os.path.join(ESER, "ulu-cami_v01.blend")

# ---- ölçüler (ref-img3/unnamed.webp'den ölçüldü; notlar §2'deki tahminlerin yerine) ----
W, D = 60.0, 48.0            # plan (ÜRGEN). OSM 70,5 × 60,3 çıktı: raporda çelişki olarak işaretli
NX, NY, BOLME = 5, 4, 12.0
CAP = 11.0                   # kubbe Ø (kasnak köşegen halkası)
DUVAR = 14.0
CATI = 1.5                   # çatı kalınlığı (duvar üstü → kasnak tabanı)
KASNAK_H = [1.6, 2.3, 4.2, 2.3, 1.6]    # doğu–batı 5 sütun: uç / ara / orta / ara / uç (çatıdan)
KUBBE_R = [3.1, 3.6, 4.0, 3.6, 3.1]     # kubbe yükselişi
MINARE_H = 50.0              # alem dahil
ACIK = (2, 1)                # açık kubbe: orta sütun, kuzeyden 2. sıra (kuzey = -Y → ikinci satır)

A.temizle()
M = A.palet({"duvar": "#D4BE96", "kasnak": "#E2C77E", "kubbe": "#A9B4C2", "cati": "#9AA2AC",
             "mermer": "#ECE8DF", "minare_tugla": "#A65A43", "pencere": "#4A5A66", "alem": "#DCA320"})
c0 = Vector((0, 0))
ztop = DUVAR + CATI

# Zemin
z = A.G("Zemin"); z.prism(A.rect(c0, 80, 62), -1.0, 0.0, M["zemin"], M["zemin"]); z.obj()

# Govde: dikdörtgen kütle (taban 20 cm gömülü; üstü kapalı, çatı üstüne oturur)
g = A.G("Govde"); g.prism(A.rect(c0, W, D), -0.2, DUVAR, M["duvar"], M["duvar"]); g.obj()

# Cati: alçak, kapalı kesik piramit (saçak 40 cm taşar → plato duvardan 0,5 m içeride)
c = A.G("Cati"); ob = A.rect(c0, W + 0.8, D + 0.8); ot = A.rect(c0, W - 1.0, D - 1.0)
b = [c.V(q, DUVAR) for q in ob]; t = [c.V(q, ztop) for q in ot]
for i in range(4):
    j = (i + 1) % 4; c.F([b[i], b[j], t[j], t[i]], M["cati"])
c.F(t, M["cati"]); c.F(b[::-1], M["cati"]); c.obj()

# Kasnaklar_20 + Kubbeler_20 (aynı halka: kasnak top=False, kubbe cap=False)
kas = A.G("Kasnaklar_20"); kub = A.G("Kubbeler_20"); merkezler = {}
for iy in range(NY):
    for ix in range(NX):
        cx = (ix - (NX - 1) / 2) * BOLME; cy = (iy - (NY - 1) / 2) * BOLME   # iy=0 en kuzey (-Y)
        c_ = Vector((cx, cy)); ring = A.circle(c_, CAP / 2, 8, math.pi / 8)
        zb = ztop + KASNAK_H[ix]
        kas.prism(ring, ztop - 0.1, zb, M["kasnak"], False)
        kub.dome(ring, zb, KUBBE_R[ix], M["kubbe"], rings=8, cap=False)
        merkezler[(ix, iy)] = (c_, zb + KUBBE_R[ix])
kas.obj(); kub.obj()

# Sadirvan_Fener: açık kubbenin tepesine oturan fener (kabuk kapalı, tepeye 20 cm gömülü)
c_, ztepe = merkezler[ACIK]
f = A.G("Sadirvan_Fener"); zf = ztepe - 0.2
f.lathe(c_, [(1.3, zf), (1.3, ztepe + 1.8), (1.7, ztepe + 1.8), (1.7, ztepe + 2.1), (1.1, ztepe + 2.1), (0, ztepe + 3.0)],
        12, [M["mermer"], M["mermer"], M["mermer"], M["mermer"], M["kubbe"]])
f.obj()

# Minareler: kuzeybatı ve kuzeydoğu köşe, duvara bitişik (içine girmez)
kw = 6.4; mx = W / 2 + kw / 2 + 0.05; my = -D / 2
A.minare("Minare_1", Vector((mx, my)), MINARE_H, M, govde_r=1.9, kaide_w=kw, kaide_h=11.0, malzeme="minare_tugla")
A.minare("Minare_2", Vector((-mx, my)), MINARE_H, M, govde_r=1.9, kaide_w=kw, kaide_h=11.0, malzeme="minare_tugla")

# Merkez: kamera hedefi (Empty)
e = bpy.data.objects.new("Merkez", None); bpy.context.scene.collection.objects.link(e); e.location = (0, 0, 0)

R = A.kontrol_hepsi(KONTROL, "v01")
print("RAPOR", json.dumps(R, ensure_ascii=False))

# Birleşik halka kontrolü: Kasnaklar_20 + Kubbeler_20 ayrı parça; halka ikisinde de açık kalır.
import bmesh
bm = bmesh.new()
for n in ("Kasnaklar_20", "Kubbeler_20"):
    tmp = bmesh.new(); tmp.from_mesh(bpy.data.objects[n].data); me = bpy.data.meshes.new("_t"); tmp.to_mesh(me); tmp.free(); bm.from_mesh(me)
    bpy.data.meshes.remove(me)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
print("BIRLESIK_KASNAK_KUBBE acik_kenar", sum(1 for e_ in bm.edges if e_.is_boundary),
      "manifold_degil", sum(1 for e_ in bm.edges if not e_.is_manifold and not e_.is_boundary)); bm.free()
print("UCGEN_TOPLAM", R["ucgen_toplam"])

bpy.ops.wm.save_as_mainfile(filepath=BLEND)

# ---- görünür renk render'ları (kuzeyden + kuzeybatıdan havadan) ----
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.device = 'CPU'
sc.render.resolution_x, sc.render.resolution_y = 1100, 800; sc.render.film_transparent = False
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.78, 0.82, 0.88, 1); bg.inputs[1].default_value = 1.0
sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = 3.0; sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
def render(ad, loc, tgt, lens):
    cd = bpy.data.cameras.new("_c"); cd.lens = lens; cd.clip_end = 1000
    cam = bpy.data.objects.new("_c", cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = loc
    cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    sc.render.filepath = os.path.join(KONTROL, ad); bpy.ops.render.render(write_still=True)
render("v01_kuzey.png", (0, -190, 38), (0, 0, 14), 70)
render("v01_hava_kuzeybati.png", (95, -105, 80), (0, 0, 10), 50)
