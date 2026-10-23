"""Ulu Cami v23 aşama C: dikdörtgen kaide, ağaçlar (foto 009 / 094), tarh. Hepsi dünya koordinatında kurulur (nesne konumu 0).
Kaynak harfleri: F fotoğraf, T tahmin."""
import math
from mathutils import Vector
import akar3d as A


def _kose_poly(x0, x1, y0, y1, ch):
    """Köşeleri 45° pahlı dikdörtgen (saat yönü tersi, 8 nokta)."""
    return [Vector(p) for p in ((x0 + ch, y0), (x1 - ch, y0), (x1, y0 + ch), (x1, y1 - ch), (x1 - ch, y1), (x0 + ch, y1), (x0, y1 - ch), (x0, y0 + ch))]


def kaide(x0, x1, y0, y1, ch=1.5, kal=0.6, ztop=-0.02, pah=0.15, ust=None, yan=None):
    """Dikdörtgen kaide: kalınlık 0,6, üst kenarda 0,15 pah, köşeler 1,5 pahlı (standart §1)."""
    g = A.G("Zemin_Kaide")
    dis = _kose_poly(x0, x1, y0, y1, ch)
    ic = _kose_poly(x0 + pah, x1 - pah, y0 + pah, y1 - pah, ch - 0.586 * pah)
    n = len(dis)
    ti = [g.V(q, ztop) for q in ic]; tp = [g.V(q, ztop - pah) for q in dis]
    bt = [g.V(q, ztop - kal) for q in dis]
    g.F(ti, ust)                                               # üst yüz (z = 0'a yakın)
    for i in range(n):
        j = (i + 1) % n
        g.F([tp[i], tp[j], ti[j], ti[i]], yan)                 # üst pah
        g.F([bt[i], bt[j], tp[j], tp[i]], yan)                 # yan yüz
    g.F(bt[::-1], yan)
    return g.obj()


def _elips(g, c, rx, ry, rz, m, seg=7, rings=4):
    c = Vector(c); before = set(g.bm.verts)
    prof = [(0.0, -rz)] + [(math.sin(math.pi * k / (rings + 1)), -rz * math.cos(math.pi * k / (rings + 1))) for k in range(1, rings + 1)] + [(0.0, rz)]
    g.lathe(c.xy, [(max(r, 0.0), c.z + z) for r, z in prof], seg, [m])
    for v in set(g.bm.verts) - before:
        v.co.x = c.x + (v.co.x - c.x) * rx; v.co.y = c.y + (v.co.y - c.y) * ry


def _dal(g, a, b, r, m, n=4):
    """İnce silindirik dal (kapalı n-gen prizma, a → b)."""
    a, b = Vector(a), Vector(b); d = (b - a).normalized()
    u = d.cross(Vector((0, 0, 1)));
    if u.length < 1e-4: u = Vector((1, 0, 0))
    u.normalize(); w = d.cross(u).normalized()
    ra = [a + (u * math.cos(2 * math.pi * k / n) + w * math.sin(2 * math.pi * k / n)) * r for k in range(n)]
    rb = [b + (u * math.cos(2 * math.pi * k / n) + w * math.sin(2 * math.pi * k / n)) * r * 0.7 for k in range(n)]
    va = [g.bm.verts.new(p) for p in ra]; vb = [g.bm.verts.new(p) for p in rb]
    for k in range(n):
        j = (k + 1) % n; g.F([va[k], va[j], vb[j], vb[k]], m)
    g.F(va[::-1], m); g.F(vb, m)


def cinar(ad, c, boy=11.0):
    """Yuvarlak çınar (F foto 094/009: şadırvanın yanında tarhta, geniş yayvan taç). ≤ 300 üçgen, ayrı nesne."""
    g = A.G(ad)
    yap = [A.mat("Agac_Yaprak_" + str(i), h, 0.90) for i, h in enumerate(("#7FA35B", "#93B46A", "#6E9450"))]
    kab = A.mat("Agac_Govde", "#7A634B", 0.90)
    x, y = c.x, c.y; z0 = 0.38                                  # tarh toprağından çıkar
    _dal(g, (x, y, z0 - 0.05), (x, y, z0 + 3.4), 0.30, kab, 5)
    for (dx, dy, dz) in ((-1.6, 0.4, 5.2), (1.5, -0.5, 5.6), (0.2, 1.4, 6.6)):
        _dal(g, (x, y, z0 + 3.3), (x + dx, y + dy, z0 + dz), 0.13, kab, 3)
    for i, (dx, dy, dz, rx, rz) in enumerate(((-1.5, 0.4, 6.4, 2.7, 1.9), (1.5, -0.4, 6.9, 2.7, 2.0), (0.0, 1.0, 8.6, 2.4, 1.8))):
        _elips(g, (x + dx, y + dy, z0 + dz), rx, rx * 0.95, rz, yap[i % 3], 7, 3)
    return g.obj()


def servi(ad, c, boy=14.0):
    """Servi (F foto 009/094): dar, uzun, sivri; #3F7A5C, h ≈ 14 m. ≤ 300 üçgen."""
    g = A.G(ad)
    yes = A.mat("Agac_Servi", "#3F7A5C", 0.90); kab = A.mat("Agac_Govde", "#7A634B", 0.90)
    k = boy / 14.0
    g.lathe(c, [(0.22, 0.0), (0.22, 1.1 * k)], 6, [kab])
    g.lathe(c, [(0.60 * k, 0.9 * k), (1.25 * k, 2.4 * k), (1.75 * k, 4.8 * k), (1.65 * k, 7.2 * k), (1.20 * k, 9.9 * k), (0.62 * k, 12.2 * k), (0.0, boy)], 8, [yes])
    return g.obj()


def tarh(ad, c, R, h=0.48, kal=0.24, bordur=None, cim=None, ztaban=0.0):
    """Alçak taş bordürlü sekizgen tarh (F foto 094): bordür #D2C3A4, içi çim #9DB86A (bordürden 0,10 aşağıda)."""
    g = A.G(ad)
    oc = lambda r: [c + Vector((r * math.cos(math.radians(22.5 + 45 * k)), r * math.sin(math.radians(22.5 + 45 * k)))) for k in range(8)]
    dis, ic = oc(R), oc(R - kal / math.cos(math.radians(22.5)))
    n = 8
    bd = [g.V(q, ztaban) for q in dis]; bt = [g.V(q, ztaban + h) for q in dis]
    it = [g.V(q, ztaban + h) for q in ic]; ib = [g.V(q, ztaban + h - 0.10) for q in ic]
    for i in range(n):
        j = (i + 1) % n
        g.F([bd[i], bd[j], bt[j], bt[i]], bordur)               # dış yüz
        g.F([bt[i], bt[j], it[j], it[i]], bordur)               # bordür üstü
        g.F([it[i], it[j], ib[j], ib[i]], bordur)               # iç yüz
    g.F(bd[::-1], bordur)
    g.F(ib, cim)                                                # çim yüzeyi
    return g.obj()
