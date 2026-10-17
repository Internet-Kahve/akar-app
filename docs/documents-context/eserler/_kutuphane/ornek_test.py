import sys, os, json; KUT = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, KUT); KLASOR = os.path.join(KUT, "test_cikti")
import bpy, akar3d as A
from mathutils import Vector
A.temizle(); M = A.palet()
c = Vector((0, 0))
g = A.G("Harim"); g.prism(A.rect(c, 20, 20), 0, 14, M["duvar"], M["cati"])
for k in (-5, 0, 5):
    A.pencere(g, Vector((k, -10)), Vector((1, 0)), Vector((0, -1)), 1.8, 3, 7, M["pencere"])
A.silme(g, A.rect(c, 20, 20), 13.4, 14, 0.4, M["tas"]); g.obj()
k = A.G("Kubbe_Ana"); k.prism(A.circle(c, 8, 24), 14, 17, M["duvar"], False); k.dome(A.circle(c, 8, 24), 17, 6, M["kubbe"], rings=8, cap=False); k.obj()
y = A.G("Kubbe_Yarim"); y.half_dome(Vector((0, -10)), 4, 14, 3.5, (0, -1), M["kubbe"], M["duvar"]); y.obj()
A.minare("Minare_1", Vector((12, 12)), 38, M)
R=A.kontrol_hepsi(KLASOR, "ornek"); print("RAPOR", json.dumps(R, ensure_ascii=False))
A.ao_vertex(samples=8)
print("glb", A.disa_aktar("" + KLASOR + "/ornek.glb", draco=False))
# kasıtlı hata: kapaksız yarım küre kabuk (Ayasofya'daki gibi) → kırmızı görünmeli
h = A.G("HATA_acik"); h.dome(A.circle(Vector((-14, -14)), 5, 16), 0, 5, M["kubbe"], cap=False)
for f in [f for f in h.bm.faces if f.calc_center_median().z > 3.6]: h.bm.faces.remove(f)
h.obj(recalc=False)
R2=A.kontrol_hepsi(KLASOR, "hatali"); print("RAPOR2", json.dumps({k:R2[k] for k in ("acik_ya_da_manifold_degil","kirmizi_oran_8_yon","GECTI")}, ensure_ascii=False))
