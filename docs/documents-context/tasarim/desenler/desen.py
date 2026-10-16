"""AKAR geometrik desenleri · Hankin (temas eden çokgenler) yöntemi.
Geleneksel geometriden kodla üretilir; kitaptaki çizimlerin kopyası değildir.
Kullanım: python3 desen.py  → svg/ ve png/ klasörlerine yazar.
"""
import math, os

def rot(v, a):
    c, s = math.cos(a), math.sin(a)
    return (v[0]*c - v[1]*s, v[0]*s + v[1]*c)

def reg(c, R, n, a0):
    return [(c[0] + R*math.cos(a0 + 2*math.pi*k/n), c[1] + R*math.sin(a0 + 2*math.pi*k/n)) for k in range(n)]

def inter(p, a, q, b):
    d = a[0]*b[1] - a[1]*b[0]
    if abs(d) < 1e-12: return None
    t = ((q[0]-p[0])*b[1] - (q[1]-p[1])*b[0]) / d
    return (p[0] + t*a[0], p[1] + t*a[1])

def hankin(poly, theta):
    n = len(poly); c = (sum(v[0] for v in poly)/n, sum(v[1] for v in poly)/n)
    segs = []
    mids = [((poly[i][0]+poly[(i+1)%n][0])/2, (poly[i][1]+poly[(i+1)%n][1])/2) for i in range(n)]
    dirs = []
    for i in range(n):
        a, b = poly[i], poly[(i+1)%n]; L = math.hypot(b[0]-a[0], b[1]-a[1])
        dirs.append(((b[0]-a[0])/L, (b[1]-a[1])/L))
    def inward(m, d):
        return (d[0]*(c[0]-m[0]) + d[1]*(c[1]-m[1])) > 0
    for i in range(n):
        j = (i+1) % n
        A = rot(dirs[i], theta)
        if not inward(mids[i], A): A = rot(dirs[i], -theta)
        nb = (-dirs[j][0], -dirs[j][1])
        Bv = rot(nb, -theta)
        if not inward(mids[j], Bv): Bv = rot(nb, theta)
        p = inter(mids[i], A, mids[j], Bv)
        if p: segs += [(mids[i], p), (p, mids[j])]
    return segs

def t488(s, nx, ny):
    a = s/(1+math.sqrt(2)); R8 = a/(2*math.sin(math.pi/8)); R4 = a/math.sqrt(2)
    P = []
    for i in range(-1, nx+2):
        for j in range(-1, ny+2):
            P.append(reg((i*s, j*s), R8, 8, math.pi/8))
            P.append(reg(((i+.5)*s, (j+.5)*s), R4, 4, 0))
    return P

def t31212(D, nx, ny):
    a = D*math.tan(math.pi/12); R12 = a/(2*math.sin(math.pi/12)); R3 = a/math.sqrt(3)
    h = D*math.sqrt(3)/2; P = []
    pts = []
    for j in range(-2, 2*ny+3):
        for i in range(-2, nx+3):
            pts.append((i*D + (D/2 if j % 2 else 0), j*h))
    for p in pts: P.append(reg(p, R12, 12, math.pi/12))
    # üçgenleri doğrudan merkezlerden üret
    for j in range(-2, 2*ny+2):
        for i in range(-2, nx+3):
            x0 = i*D + (D/2 if j % 2 else 0)
            up = (x0 + D/2, j*h + h/3)        # alt kenarı j satırında
            dn = (x0 + D/2, j*h - h/3)        # üst kenarı j satırında
            P.append(reg(up, R3, 3, -math.pi/2))
            P.append(reg(dn, R3, 3, math.pi/2))
    return P

def prune(segs):
    """Kırpılan amblemde boşta kalan uçları temizler."""
    key = lambda p: (round(p[0], 1), round(p[1], 1))
    while True:
        deg = {}
        for p, q in segs:
            for k in (key(p), key(q)): deg[k] = deg.get(k, 0) + 1
        keep = [(p, q) for p, q in segs if deg[key(p)] > 1 and deg[key(q)] > 1]
        if len(keep) == len(segs): return keep
        segs = keep

def svg(segs, w, h, sw, name, clip=None, color="currentColor"):
    d = []
    if clip:
        segs = prune([(p, q) for p, q in segs if math.hypot(p[0]-clip[0], p[1]-clip[1]) <= clip[2] and math.hypot(q[0]-clip[0], q[1]-clip[1]) <= clip[2]])
    for p, q in segs:
        d.append(f"M{p[0]:.2f} {p[1]:.2f}L{q[0]:.2f} {q[1]:.2f}")
    vb = f"0 0 {w:.2f} {h:.2f}" if not clip else f"{clip[0]-clip[2]-sw:.2f} {clip[1]-clip[2]-sw:.2f} {2*(clip[2]+sw):.2f} {2*(clip[2]+sw):.2f}"
    s = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">'
         f'<title>{name}</title>'
         f'<path d="{"".join(d)}" fill="none" stroke="{color}" stroke-width="{sw:.2f}" stroke-linecap="round" stroke-linejoin="round"/></svg>')
    return s

if __name__ == "__main__":
    os.makedirs("svg", exist_ok=True)
    R = math.radians
    seg8 = [x for P in t488(100, 1, 1) for x in hankin(P, R(72))]
    open("svg/desen-bursa-sekiz-yildiz.svg", "w").write(svg(seg8, 100, 100, 4.5, "AKAR desen · Bursa · sekiz kollu yıldız"))
    seg12 = [x for P in t31212(100, 1, 1) for x in hankin(P, R(80))]
    open("svg/desen-konya-on-iki-gulbezek.svg", "w").write(svg(seg12, 100, 100*math.sqrt(3), 2.4, "AKAR desen · Konya · on iki kollu gülbezek"))
    segE = [x for P in t488(100, 1, 1) for x in hankin(P, R(67.5))]
    open("svg/amblem-akar-yildiz.svg", "w").write(svg(segE, 100, 100, 4, "AKAR amblem · yıldız", clip=(0, 0, 80)))
