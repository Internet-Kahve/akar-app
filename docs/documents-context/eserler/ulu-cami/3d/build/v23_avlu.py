"""v23 Aşama B: avlu şadırvanları, mermer çeşme, iç şadırvan (plan §3–§5). build_v23.py içinden çağrılır.
Hepsi yerel (v16) çerçevede kurulur, nesne konumu OFS olur. z = platform üstü + ZP (şadırvan 0,30 m platform üstünde).
Kaynak harfleri: F foto 094/095/096/097/092/105, E envanter PDF 38-39, P plan, T tahmin.
"""
import bpy, bmesh, math
from mathutils import Vector
import akar3d as A

# ---------------- ortak yardımcılar ----------------
def oct_pts(c, R, a0=22.5):
    """Sekizgen köşeleri (yarıçap R, ilk köşe a0°)."""
    return [Vector((c.x + R * math.cos(math.radians(a0 + 45 * k)), c.y + R * math.sin(math.radians(a0 + 45 * k)))) for k in range(8)]
def rod(g, a, b, r, m, n=6, kisalt=0.0):
    a, b = Vector(a), Vector(b); ax = (b - a).normalized(); a, b = a + ax * kisalt, b - ax * kisalt; u = ax.cross(Vector((0, 0, 1)))
    if u.length < .01: u = ax.cross(Vector((0, 1, 0)))
    u.normalize(); v = ax.cross(u); rs = []
    for c in (a, b): rs.append([g.bm.verts.new(c + r * (u * math.cos(2 * math.pi * i / n) + v * math.sin(2 * math.pi * i / n))) for i in range(n)])
    g.F(rs[0][::-1], m); g.F(rs[1], m)
    for i in range(n): j = (i + 1) % n; g.F([rs[0][i], rs[0][j], rs[1][j], rs[1][i]], m)
def tup_poly(g, outer, inner, z0, z1, m):
    """İki çokgen arasında kapalı halka hacim (içi boş duvar). Aynı köşe sayısı."""
    n = len(outer); ob = [g.V(p, z0) for p in outer]; ib = [g.V(p, z0) for p in inner]; ot = [g.V(p, z1) for p in outer]; it = [g.V(p, z1) for p in inner]
    for k in range(n):
        j = (k + 1) % n
        g.F([ib[k], ob[k], ob[j], ib[j]], m); g.F([ob[k], ot[k], ot[j], ob[j]], m); g.F([ot[k], it[k], it[j], ot[j]], m); g.F([it[k], ib[k], ib[j], it[j]], m)
def sfer(g, c2, zc, r, m, seg=10, rings=6):
    prof = [(0.0 if k in (0, rings) else r * math.sin(math.pi * k / rings), zc - r * math.cos(math.pi * k / rings)) for k in range(rings + 1)]
    g.lathe(c2, prof, seg, [m] * rings)
def _p3(O, T, N, u, z, o): return Vector((O.x + T.x * u + N.x * o, O.y + T.y * u + N.y * o, z))
def plaka(g, O, T, N, poly, off, dep, m, m_yan=None):
    """Kapalı levha (u,z çokgeni), N yönünde off kadar önde dep kalınlığında. Çokgen konkav olabilir (üçgenlenir)."""
    a = [g.bm.verts.new(_p3(O, T, N, u, z, off)) for u, z in poly]; b = [g.bm.verts.new(_p3(O, T, N, u, z, off + dep)) for u, z in poly]
    for ring, mm in ((b, m), (a[::-1], m)):
        f = g.F(ring, mm)
        if f: bmesh.ops.triangulate(g.bm, faces=[f], quad_method='BEAUTY', ngon_method='EAR_CLIP')
    for i in range(len(poly)): j = (i + 1) % len(poly); g.F([a[i], a[j], b[j], b[i]], m_yan or m)
def delikli(g, O, T, N, dis, delikler, off, dep, m):
    """Delikli kabuk: dış çokgen − delikler; N yönünde dep kalınlığında kapalı hacim (delik boşluğu gerçek, iç yüzler dahil)."""
    kenar = []
    for loop in [dis] + delikler:
        vs = [g.bm.verts.new(_p3(O, T, N, u, z, off)) for u, z in loop]
        kenar += [g.bm.edges.new((vs[i], vs[(i + 1) % len(vs)])) for i in range(len(vs))]
    r = bmesh.ops.triangle_fill(g.bm, use_beauty=True, use_dissolve=False, edges=kenar, normal=Vector((N.x, N.y, 0)))
    yuz = [f for f in r["geom"] if isinstance(f, bmesh.types.BMFace)]
    for f in yuz: f.material_index = g.mi(m)
    ex = bmesh.ops.extrude_face_region(g.bm, geom=yuz, use_keep_orig=True)
    for v in [e for e in ex["geom"] if isinstance(e, bmesh.types.BMVert)]: v.co += Vector((N.x, N.y, 0)) * dep
    for f in [e for e in ex["geom"] if isinstance(e, bmesh.types.BMFace)]: f.material_index = g.mi(m)

# çok dilimli (yonca) sivri kemer: sağ yarı (u, z_göreli), hw=0,86 ve yükseklik H=1,15 için tasarlandı (F foto 095/097)
_LOB = [(0.86, 0.00), (0.86, 0.12), (0.76, 0.34), (0.56, 0.38), (0.46, 0.28),
        (0.43, 0.50), (0.30, 0.85), (0.0, 1.15)]
def lobed(hw, zspring, H, zbottom=None):
    """Yonca kemer açıklığı: (u,z) soldan sağa, alt uçlar zbottom'da (açık alt) ya da zspring."""
    sx, sz = hw / 0.86, H / 1.15; zb = zspring if zbottom is None else zbottom
    right = [(u * sx, zspring + z * sz) for u, z in _LOB]
    pts = [(-u, z) for u, z in right] + right[-2::-1]
    pts = [(-hw, zb)] + pts + [(hw, zb)] if zb < zspring - 1e-9 else pts
    return pts
def offset_open(pts, d, cen):
    out = []
    for i, p in enumerate(pts):
        a = Vector(pts[max(i - 1, 0)]); b = Vector(pts[min(i + 1, len(pts) - 1)]); t = (b - a).normalized(); n = Vector((-t.y, t.x))
        if n.dot(Vector(p) - Vector(cen)) < 0: n = -n
        out.append((p[0] + n.x * d, p[1] + n.y * d))
    return out

def malz():
    mk = A.mat
    return dict(mer=mk("Sad_Mermer", "#ECEAE4", 0.40), gol=mk("Sad_Mermer_Gol", "#D5D6D2", 0.45), ahs=mk("Sad_Ahsap", "#4E3427", 0.75),
                krem=mk("Sad_Krem", "#E8DFCB", 0.80), kur=mk("Sad_Kursun", "#7D858A", 0.60, 0.25), dik=mk("Sad_Dikis", "#98A1A8", 0.45, 0.20),
                pir=bpy.data.materials.get("Alem_kursun") or mk("Sad_Pirinc", "#C9A13B", 0.35, 0.60), su=mk("Sad_Su", "#8CC3C6", 0.10),
                fan=mk("Sad_Fanus", "#F4F1E8", 0.30), halı=mk("Ic_Hali", "#D9C9B4", 0.90), duv=mk("Ic_Duvar", "#E8DFCB", 0.80))

# ---------------- avlu şadırvanı (plan §3) ----------------
def _n(g): return sum(max(len(f.verts) - 2, 0) for f in g.bm.faces)
def sadirvan(ad, c, M, ZP=0.30):
    _d = {}
    def _k(ad_, g_): _d[ad_] = _n(g_)
    g = A.G(ad); R_POST = 2.75; zp = ZP
    mer, ahs, krem, kur, dik, pir, su, fan, gol = (M[k] for k in ("mer", "ahs", "krem", "kur", "dik", "pir", "su", "fan", "gol"))
    # platform: 2 basamaklı sekizgen mermer (R 3,60 / 3,35)
    g.prism(oct_pts(c, 3.60), 0.0, 0.15, mer, mer); g.prism(oct_pts(c, 3.35), 0.14, zp, mer, mer)
    ang = [22.5 + 45 * k for k in range(8)]
    pc = [Vector((c.x + R_POST * math.cos(math.radians(a)), c.y + R_POST * math.sin(math.radians(a)))) for a in ang]
    # 8 direk: kesit 0,28 kare, köşe pahlı; altta mermer kaide, üstte torna halka başlık (z 2,85)
    for a, p in zip(ang, pc):
        r = math.radians(a); nn = Vector((math.cos(r), math.sin(r))); tt = Vector((-nn.y, nn.x)); h, ch = 0.14, 0.04
        poly = [p + nn * h + tt * (h - ch), p + nn * (h - ch) + tt * h, p - nn * (h - ch) + tt * h, p - nn * h + tt * (h - ch),
                p - nn * h - tt * (h - ch), p - nn * (h - ch) - tt * h, p + nn * (h - ch) - tt * h, p + nn * h - tt * (h - ch)]
        g.prism(poly, zp + 0.25, zp + 2.85, ahs, ahs)
        g.prism(A.rect(p, 0.35, 0.35, r), zp, zp + 0.25, mer, mer)
        g.lathe(p, [(0.18, zp + 2.85), (0.18, zp + 2.97)], 8, [ahs])
        # fanus: içe bakan kısa koyu kol + beyaz küre Ø 0,30 (z 2,95–3,25)
        pin = p - nn * 0.30
        rod(g, (p.x - nn.x * 0.12, p.y - nn.y * 0.12, zp + 3.28), (pin.x, pin.y, zp + 3.28), 0.02, ahs, 4); sfer(g, pin, zp + 3.10, 0.15, fan, 6, 3)
    _k("direk", g)
    # 8 kemer panosu: krem, altı açık yonca kemer; açıklık kenarında 0,06 koyu çerçeve 3 cm önde (F foto 095/097)
    w = 2 * R_POST * math.sin(math.radians(22.5)); hw = (w - 0.28 - 0.10) / 2
    for m_ in range(8):
        a = math.radians(45 * m_); nn = Vector((math.cos(a), math.sin(a))); tt = Vector((-nn.y, nn.x)); O = c + nn * (R_POST * math.cos(math.radians(22.5)) - 0.07)
        acik = lobed(hw, zp + 3.00, 1.15, zbottom=zp + 2.85)
        dis = [(-w / 2, zp + 2.85)] + acik + [(w / 2, zp + 2.85), (w / 2, zp + 4.45), (-w / 2, zp + 4.45)]
        delikli(g, O, tt, nn, dis, [], 0.0, 0.14, krem)
        for (u0, z0_), (u1, z1_) in zip(acik[:-1], acik[1:]):                  # açıklık kenarı boyunca koyu ahşap çerçeve (0,06), panodan 3 cm önde
            rod(g, _p3(O, tt, nn, u0, z0_, 0.165), _p3(O, tt, nn, u1, z1_, 0.165), 0.034, ahs, 3, kisalt=0.004)
    _k("panel", g)
    # friz, koyu bant, saçak kornişi (R 3,45), altı krem + 4 cm koyu şerit
    g.prism(oct_pts(c, 2.89), zp + 4.45, zp + 4.90, krem, krem)
    g.prism(oct_pts(c, 2.93), zp + 4.90, zp + 5.15, ahs, ahs)
    g.prism(oct_pts(c, 3.45), zp + 5.15, zp + 5.55, krem, krem)
    g.prism(oct_pts(c, 3.47), zp + 5.15, zp + 5.19, ahs, ahs)
    _k("friz", g)
    # kurşun etek: sekizgenden daireye kısa eğimli geçiş (z 5,55 → 5,80), sonra soğan kubbe
    from_geçiş(g, c, 3.40, 2.05, zp + 5.53, zp + 5.80, kur)
    SOGAN = [(2.05, 5.80), (2.14, 6.05), (2.20, 6.45), (2.12, 6.90), (1.85, 7.30), (1.45, 7.62), (1.00, 7.90), (0.62, 8.10), (0.40, 8.30),
             (0.33, 8.45), (0.22, 8.65), (0.12, 8.85), (0.07, 8.95)]
    g.lathe(c, [(r, zp + z - (0.02 if i == 0 else 0)) for i, (r, z) in enumerate(SOGAN)], 24, [kur] * (len(SOGAN) - 1))
    _k("kubbe", g)
    # 24 düşey kurşun dikiş (0,04 kabarık) ve 3 yatay levha dikişi
    for j in range(24):
        a = 2 * math.pi * (j + 0.5) / 24; d = Vector((math.cos(a), math.sin(a)))
        for (r0, z0), (r1, z1) in zip(SOGAN[0:4:2], SOGAN[2:6:2]):
            rod(g, (c.x + d.x * (r0 + 0.012), c.y + d.y * (r0 + 0.012), zp + z0), (c.x + d.x * (r1 + 0.012), c.y + d.y * (r1 + 0.012), zp + z1), 0.014, dik, 3, kisalt=0.003)
    for z in (6.15, 6.65, 7.15):
        for (r0, z0), (r1, z1) in zip(SOGAN[:-1], SOGAN[1:]):
            if z0 <= z <= z1: r = r0 + (r1 - r0) * (z - z0) / (z1 - z0); break
        g.lathe(c, [(r - 0.02, zp + z - 0.02), (r + 0.04, zp + z - 0.02), (r + 0.04, zp + z + 0.02), (r - 0.02, zp + z + 0.02)], 24, [dik] * 3)
    _k("dikis", g)
    # alem: küre + hilal halkası
    sfer(g, c, zp + 9.05, 0.09, pir, 8, 4); rod(g, (c.x, c.y, zp + 9.05), (c.x, c.y, zp + 9.25), 0.02, pir, 4)
    g.lathe(c, [(0.07, zp + 9.12), (0.13, zp + 9.12), (0.13, zp + 9.15), (0.07, zp + 9.15)], 12, [pir] * 3)
    _k("alem", g)
    # korkuluk: direkler arası, h 0,95; üst kayıt 0,08×0,06, alt kayıt z 0,15, X çapraz; kuzey/güney bölme açık (F foto 094; ikincisi T)
    for k in range(8):
        a, b = pc[k], pc[(k + 1) % 8]; mid_ang = (45 * (k + 1)) % 360
        if mid_ang in (90, 270): continue
        d = (b - a).normalized(); a2, b2 = a + d * 0.14, b - d * 0.14
        nn = Vector((d.y, -d.x))
        for z0_, z1_ in ((0.87, 0.95), (0.15, 0.22)):
            g.prism([a2 - nn * 0.03, b2 - nn * 0.03, b2 + nn * 0.03, a2 + nn * 0.03], zp + z0_, zp + z1_, ahs, ahs)
        rod(g, (a2.x, a2.y, zp + 0.22), (b2.x, b2.y, zp + 0.87), 0.024, ahs, 3); rod(g, (a2.x, a2.y, zp + 0.87), (b2.x, b2.y, zp + 0.22), 0.024, ahs, 3)
    _k("korkuluk", g)
    # iç havuz (F foto 097): sekizgen mermer, cidar 0,12, her yüzde çökertilmiş pano + pirinç musluk, ortada lotus çanaklı fıskiye
    seki_R = 2.20; g.prism(oct_pts(c, seki_R), zp, zp + 0.45, mer, mer)
    Rh = 1.35; dış = oct_pts(c, Rh); iç = oct_pts(c, Rh - 0.12 / math.cos(math.radians(22.5)))
    g.prism(dış, zp + 0.44, zp + 0.60, mer, mer); tup_poly(g, dış, iç, zp + 0.58, zp + 1.35, mer)
    g.prism([c + (q - c) * 0.97 for q in iç], zp + 0.58, zp + 1.25, su, su)
    for k in range(8):
        a = math.radians(45 * k); nn = Vector((math.cos(a), math.sin(a))); tt = Vector((-nn.y, nn.x)); ap = Rh * math.cos(math.radians(22.5))
        O = c + nn * ap
        delikli(g, O, tt, nn, [(-0.30, zp + 0.75), (0.30, zp + 0.75), (0.30, zp + 1.10), (-0.30, zp + 1.10)],
                [[(-0.27, zp + 0.78), (0.27, zp + 0.78), (0.27, zp + 1.07), (-0.27, zp + 1.07)]], 0.0, 0.02, mer)      # pano çerçevesi: çukur etkisi
        plaka(g, O, tt, nn, [(-0.262, zp + 0.782), (0.262, zp + 0.782), (0.262, zp + 1.068), (-0.262, zp + 1.068)], 0.0, 0.005, gol)
        p0 = c + nn * (ap + 0.005); p1 = c + nn * (ap + 0.13); rod(g, (p0.x, p0.y, zp + 1.0), (p1.x, p1.y, zp + 1.0), 0.015, pir, 6)
        # tabure: Ø 0,32, h 0,42 + 0,06 koyu oturak, musluğun karşısında
        s = c + nn * 2.32; g.lathe(s, [(0.16, zp), (0.16, zp + 0.42)], 6, [mer]); g.lathe(s, [(0.17, zp + 0.42), (0.17, zp + 0.48)], 6, [ahs])
    rod(g, (c.x, c.y, zp + 0.58), (c.x, c.y, zp + 1.52), 0.07, mer, 8)
    g.lathe(c, [(0.07, zp + 1.45), (0.10, zp + 1.50), (0.225, zp + 1.64), (0.20, zp + 1.665), (0.0, zp + 1.58)], 12, [mer] * 4)
    _k('havuz+tabure', g); import sys; sys.stderr.write('SADK %s\n' % {k: v for k, v in _d.items()}); o = g.obj(); return o

def from_geçiş(g, c, R0, rb, z0, z1, m):
    """Sekizgen (köşe yarıçapı R0, köşeler 22,5°+45k) → daire (rb) kapalı geçiş."""
    pts = []
    for k in range(8):
        a1 = math.radians(22.5 + 45 * k); a2 = math.radians(22.5 + 45 * (k + 1))
        c1 = Vector((R0 * math.cos(a1), R0 * math.sin(a1))); c2 = Vector((R0 * math.cos(a2), R0 * math.sin(a2))); pts += [c1, (c1 + c2) / 2]
    n = len(pts); a = [g.V(c + p, z0) for p in pts]; b = []
    for k in range(n):
        mid = pts[k] + pts[(k + 1) % n]; an = math.atan2(mid.y, mid.x); b.append(g.V(c + Vector((rb * math.cos(an), rb * math.sin(an))), z1))
    for k in range(n):
        j = (k + 1) % n; g.F([a[k], a[j], b[k]], m); g.F([a[j], b[j], b[k]], m)
    g.F(a[::-1], m); g.F(b, m)

# ---------------- mermer çeşme (plan §4) ----------------
def cesme(ad, c, M):
    g = A.G(ad); mer, gol, pir, su = M["mer"], M["gol"], M["pir"], M["su"]
    def kare(h): return A.rect(c, 2 * h, 2 * h)
    g.prism(kare(1.15), 0.0, 0.12, mer, mer); g.prism(kare(1.00), 0.11, 0.25, mer, mer)                   # iki kademeli taban 2,3 × 2,3
    # dört yanda kıvrımlı (dilimli) yalak: gövdeden 0,45 taşan lob
    out = []
    for q in range(4):
        rot = math.radians(90 * q); ca, sa = math.cos(rot), math.sin(rot)
        for i in range(7):
            th = math.radians(-90 + 180 * i / 6); x = 0.575 + 0.45 * math.cos(th); y = 0.62 * math.sin(th)
            out.append(Vector((x * ca - y * sa, x * sa + y * ca)))
    dış = [c + p for p in out]; iç = [c + p * 0.86 for p in out]
    g.prism(dış, 0.24, 0.36, mer, mer); tup_poly(g, dış, iç, 0.34, 0.60, mer)
    g.prism([c + p * 0.86 for p in out], 0.36, 0.54, su, su)
    # gövde: çekirdek 0,91 kare + 4 yüzde delikli 0,12'lik kabuk (niş gerçek oyuk, içi gölge tonu)
    hw = 0.30; nzt = 2.10
    niş = lobed(hw, 1.50, nzt - 1.50, zbottom=0.95)
    # çekirdek: x ekseninde delik gerçekten baştan başa geçer (F foto 096: nişten arka taraf görünür)
    delikli(g, c + Vector((-0.455, 0)), Vector((0, 1)), Vector((1, 0)), [(-0.455, 0.25), (0.455, 0.25), (0.455, 2.35), (-0.455, 2.35)], [niş], 0.0, 0.91, gol)
    for q in range(4):
        a = math.radians(90 * q); nn = Vector((math.cos(a), math.sin(a))); tt = Vector((-nn.y, nn.x)); O = c + nn * 0.445
        uzun = 0.575 if q in (0, 2) else 0.447
        dis = [(-uzun, 0.25), (uzun, 0.25), (uzun, 2.35), (-uzun, 2.35)]
        delikli(g, O, tt, nn, dis, [niş], 0.0, 0.13, mer)
        # musluk + ayna taşı (z 0,85) ve baklava kuşağı (z 2,10–2.35)
        p0 = c + nn * 0.575; plaka(g, c + nn * 0.575, tt, nn, [(-0.09, 0.76), (0.09, 0.76), (0.09, 0.93), (-0.09, 0.93)], 0.0, 0.025, gol)
        p1 = c + nn * 0.70; rod(g, (c.x + nn.x * 0.60, c.y + nn.y * 0.60, 0.85), (p1.x, p1.y, 0.85), 0.014, pir, 6)
        for i in range(5):
            u = -0.46 + 0.23 * i; plaka(g, O + nn * 0.13, tt, nn, [(u - 0.10, 2.225), (u, 2.31), (u + 0.10, 2.225), (u, 2.14)], 0.0, 0.015, gol)
    g.prism(kare(0.655), 2.35, 2.50, mer, mer)                                                           # korniş (0,08 taşar)
    for q in range(4):                                                                                    # taç: her kenarda 7 küçük mazgal/palmet dişi
        a = math.radians(90 * q); nn = Vector((math.cos(a), math.sin(a))); tt = Vector((-nn.y, nn.x)); O = c + nn * (0.655 - 0.03)
        for i in range(7):
            u = -0.55 + 1.10 * i / 6; plaka(g, O, tt, nn, [(u - 0.06, 2.50), (u + 0.06, 2.50), (u + 0.06, 2.62), (u, 2.70), (u - 0.06, 2.62)], 0.0, 0.05, mer)
    return g.obj()

# ---------------- iç şadırvan (plan §5) ----------------
def ic_sadirvan(c, M):
    g = A.G("Ic_Sadirvan_Havuz"); mer, gol, pir, su, ahs = M["mer"], M["gol"], M["pir"], M["su"], M["ahs"]
    def poly16(R): return [Vector((c.x + R * math.cos(2 * math.pi * k / 16), c.y + R * math.sin(2 * math.pi * k / 16))) for k in range(16)]
    Rd = 3.25 / math.cos(math.pi / 16)                          # dış Ø 6,5 (yüz uzaklığı)
    dış = poly16(Rd); iç = poly16(Rd - 0.20 / math.cos(math.pi / 16))
    g.prism(dış, 0.0, 0.15, mer, mer); tup_poly(g, dış, iç, 0.10, 0.95, mer)
    g.prism([c + (q - c) * 0.985 for q in iç], 0.10, 0.83, su, su)                                      # su, kenardan 0,12 aşağıda
    ap = 3.25
    for k in range(16):
        a = 2 * math.pi * (k + 0.5) / 16; nn = Vector((math.cos(a), math.sin(a))); tt = Vector((-nn.y, nn.x)); O = c + nn * ap
        plaka(g, O, tt, nn, [(-0.45, 0.30), (0.45, 0.30), (0.45, 0.72), (-0.45, 0.72)], 0.0, 0.03, gol)       # kabartma pano (F foto 105)
        p1 = c + nn * (ap + 0.14); rod(g, (c.x + nn.x * ap, c.y + nn.y * ap, 0.52), (p1.x, p1.y, 0.52), 0.016, pir, 6)   # musluk
        s = c + nn * 4.10; g.lathe(s, [(0.16, 0.0), (0.16, 0.42)], 12, [mer]); g.lathe(s, [(0.17, 0.42), (0.17, 0.48)], 12, [ahs])   # 16 tabure
    g.prism(poly16(4.5 / math.cos(math.pi / 16)), 0.0, 0.03, mer, mer)                                    # döşeme halkası Ø 9,0
    rod(g, (c.x, c.y, 0.10), (c.x, c.y, 2.3), 0.12, mer, 8)
    for r_, z_ in ((0.80, 1.25), (0.55, 1.85), (0.30, 2.35)):                                              # üç kademeli çanak Ø 1,6 / 1,1 / 0,6
        g.lathe(c, [(0.12, z_ - 0.20), (r_, z_), (r_ - 0.04, z_ + 0.04), (0.0, z_ - 0.05)], 16, [mer] * 3)
    return g.obj()
