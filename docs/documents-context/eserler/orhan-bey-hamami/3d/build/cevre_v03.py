# AKAR · Orhan Bey Hamamı · v03 çevre yardımcıları (Orhan Bey Camii v06 cevre_v06.py'den yerel kopya: çınar ve en küçük çember; halka_dik çıkarıldı)
import math
from mathutils import Vector
import akar3d as A

def _elips(g, c, rx, ry, rz, m, seg=7, rings=4):
    c = Vector(c); before = set(g.bm.verts)
    prof = [(0.0, -rz)] + [(math.sin(math.pi * k / (rings + 1)), -rz * math.cos(math.pi * k / (rings + 1))) for k in range(1, rings + 1)] + [(0.0, rz)]
    g.lathe(c.xy, [(max(r, 0.0), c.z + z) for r, z in prof], seg, [m])
    for v in set(g.bm.verts) - before:
        v.co.x = c.x + (v.co.x - c.x) * rx; v.co.y = c.y + (v.co.y - c.y) * ry

def _dal(g, a, b, r, m, n=4):
    """İnce silindirik dal (kapalı n-gen prizma, a → b)."""
    a, b = Vector(a), Vector(b); d = (b - a).normalized()
    u = d.cross(Vector((0, 0, 1)))
    if u.length < 1e-4: u = Vector((1, 0, 0))
    u.normalize(); w = d.cross(u).normalized()
    ra = [a + (u * math.cos(2 * math.pi * k / n) + w * math.sin(2 * math.pi * k / n)) * r for k in range(n)]
    rb = [b + (u * math.cos(2 * math.pi * k / n) + w * math.sin(2 * math.pi * k / n)) * r * 0.7 for k in range(n)]
    va = [g.bm.verts.new(p) for p in ra]; vb = [g.bm.verts.new(p) for p in rb]
    for k in range(n):
        j = (k + 1) % n; g.F([va[k], va[j], vb[j], vb[k]], m)
    g.F(va[::-1], m); g.F(vb, m)

def cinar(ad, c, yaprak_hex, z0=0.2):
    """Yuvarlak çınar (F ts_17ekim_3, b_19, IMG_8460: geniş yayvan taç). ≤ 300 üçgen, ayrı nesne; tek yaprak rengi + gövde (2 malzeme)."""
    g = A.G(ad); yap = A.mat("Agac_Yaprak_" + yaprak_hex[1:], yaprak_hex, 0.90); kab = A.mat("Agac_Govde", "#7A634B", 0.90)
    x, y = c.x, c.y
    _dal(g, (x, y, z0 - 0.002), (x, y, z0 + 3.4), 0.30, kab, 5)
    for (dx, dy, dz) in ((-1.6, 0.4, 5.2), (1.5, -0.5, 5.6), (0.2, 1.4, 6.6)):
        _dal(g, (x, y, z0 + 3.3), (x + dx, y + dy, z0 + dz), 0.13, kab, 3)
    for (dx, dy, dz, rx, rz) in ((-1.5, 0.4, 6.4, 2.7, 1.9), (1.5, -0.4, 6.9, 2.7, 2.0), (0.0, 1.0, 8.6, 2.4, 1.8)):
        _elips(g, (x + dx, y + dy, z0 + dz), rx, rx * 0.95, rz, yap, 7, 3)
    return g.obj()

def en_kucuk_cember(pts):
    """Noktaları saran en küçük çember (kaba kuvvet: ikili ve üçlü); (merkez Vector2, yarıçap)."""
    P = [Vector(p) for p in pts]; en = None
    def dahil(c, r): return all((p - c).length <= r + 1e-9 for p in P)
    for i in range(len(P)):
        for j in range(i + 1, len(P)):
            c = (P[i] + P[j]) / 2; r = (P[i] - P[j]).length / 2
            if (en is None or r < en[1]) and dahil(c, r): en = (c, r)
    for i in range(len(P)):
        for j in range(i + 1, len(P)):
            for k in range(j + 1, len(P)):
                a, b, c_ = P[i], P[j], P[k]; d = 2 * (a.x * (b.y - c_.y) + b.x * (c_.y - a.y) + c_.x * (a.y - b.y))
                if abs(d) < 1e-9: continue
                ux = ((a.length_squared) * (b.y - c_.y) + b.length_squared * (c_.y - a.y) + c_.length_squared * (a.y - b.y)) / d
                uy = ((a.length_squared) * (c_.x - b.x) + b.length_squared * (a.x - c_.x) + c_.length_squared * (b.x - a.x)) / d
                c = Vector((ux, uy)); r = (a - c).length
                if (en is None or r < en[1]) and dahil(c, r): en = (c, r)
    return en
