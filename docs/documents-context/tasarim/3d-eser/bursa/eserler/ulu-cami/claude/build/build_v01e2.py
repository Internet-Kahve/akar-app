# Bursa Ulucami · v01e2 — plana oturtulmuş kütle (Ayverdi rölöve planı). Pencere, taç kapı, silme, kasnak penceresi YOK.
# Çalıştır: blender -b --python 3d-eser/bursa/ulu-cami/build/build_v01e2.py
# Eksenler: Z yukarı; kuzey = -Y; +X = batı. Orijin: zemin ortası. Bütün sayılar P'den okunur.
# Parçalar: Govde, Cati, Kubbeler_19, Sadirvan_Kubbe, Alemler, Minare_1, Minare_2, Zemin, Merkez
import sys, os, json, math
ESER = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # ulu-cami/ (betik build/ içinde)
sys.path.insert(0, os.path.join(ESER, "..", "..", "_kutuphane"))
import bpy, bmesh, akar3d as A
import numpy as np
from mathutils import Vector, Matrix

P = {
    # plan: Ayverdi rölöve planı, ölçek çubuğu 24,55 px/m (dış ölçü piksel ölçümü; yazı "68,85? × 55,25?")
    "W": 68.7, "D": 55.0, "DUVAR": 17.3,
    "KOLON_X": [-25.2, -12.85, 0.0, 12.85, 25.2],   # kubbe merkezleri doğu–batı (paye aksları ±6,5 / ±19,2 ortaları; uçlar duvar payesine göre)
    "SIRA_Y": [-19.2, -6.4, 6.4, 19.2],             # kubbe merkezleri kuzey–güney (paye aksları 0 / ±12,8 ortaları); -Y kuzey
    # kubbe: v01e maket oranları (A/C, A/B) yeni çapa ölçekli; tepe kotları v01e'den SABİT
    "TEPE": [25.2, 26.9, 29.1, 26.9, 25.2],         # alem hariç
    "A_C": [0.2428, 0.2639, 0.3112, 0.2639, 0.2428],
    "A_B": [1.314, 1.027, 0.978, 1.027, 1.314],
    "KASNAK_R": 6.0, "ETEK_R": 6.15, "KASNAK_N": 24, "KUBBE_SEG": 24,
    "KUBBE_PROFIL": [         # (r, z) kullanıcı profili (R = 6,5 için); r ve z P'den ölçeklenir
        (6.50, 0.00), (7.20, -0.12), (7.25, 0.10), (6.90, 0.35), (6.65, 0.70), (6.70, 1.20),
        (6.40, 2.40), (5.70, 3.60), (4.50, 4.70), (2.80, 5.60), (1.20, 6.05), (0.00, 6.20)],
    "KUBBE_PROFIL_R": 6.5, "KUBBE_PROFIL_A": 6.32,
    "ACIK": (2, 1),
    # çatı
    "CATI_EGIM": 30.0, "GECIS_W": 0.24, "BANT_EGIM": 65.0,
    "SACAK_TASMA": 0.35, "SACAK_KALINLIK": 0.15,
    "ALEM": [(0.12, -0.05), (0.12, 0.2), (0.25, 0.45), (0.1, 0.7), (0.0, 1.5)],
    # minare: gövde Ø = doğu kaide kenarı × 0,75 (plan dairesi merdiven boşluğu; Muhammed kararı). Kotlar v01e'den sabit
    "MIN_D": 4.3, "MIN_GOVDE_UST_K": 0.962, "MIN_KUSAK_ALT": 36.6,
    "MIN_KUSAK": [(1.08, 1.57), (1.14, 1.57), (1.20, 1.56)],
    "MIN_KORKULUK": (1.43, 1.5), "MIN_UST_GOVDE": (0.81, 6.4),
    "MIN_BASLIK": [(2.65, 0.0), (2.65, 0.5), (2.0, 1.2), (1.55, 2.0), (1.8, 2.6), (2.0, 3.4), (1.9, 4.2), (1.4, 4.8),
                   (0.8, 5.1), (0.8, 5.4), (1.2, 5.8), (1.35, 6.5), (1.2, 7.2), (0.7, 7.8),
                   (0.4, 8.1), (0.35, 9.1), (0.12, 10.2), (0.05, 11.5), (0.0, 11.7)],
    "MIN_BASLIK_D0": 5.3,     # başlık r değerleri bu gövdeye göre yazıldı; MIN_D/MIN_BASLIK_D0 ile ölçeklenir
    # batı çokgen kaide (plan: kuzey–güney 6,7 m; eksen batı duvarından 2,4 m içeride, cepheden 3,7 m önde)
    "MIN_BANTLI_YARIM": 3.35, "MIN_BANTLI_PABUC": 3.6, "MIN_BANTLI_H": 15.0,
    "MIN_BANTLI_BANT": [(7.2, 7.9), (8.8, 9.5)],
    "MIN_BANTLI_EKSEN": (2.4, 3.7),
    # doğu kare kaide (plan 5,7 × 5,9; dış kenar doğu duvarıyla hizalı; cepheden 0,9 m önde)
    "MIN_SADE_KAIDE": (5.7, 5.9, 4.6, 6.1), "MIN_SADE_ARALIK": 0.9,
    # karşılaştırma
    "MAKET_EGIM": 6.0, "MAKET_CEPHE_PX": 1500, "MAKET_TABAN": (1012, 1335), "MAKET_BOY": (2000, 1500),
    "PLAN_PX_M": 24.55, "PLAN_MERKEZ": (972, 825), "PLAN_BOY": (1985, 1942),
}

AD = "v01e2"; KONTROL = os.path.join(ESER, "kontrol", AD); BLEND = os.path.join(ESER, "blend", "ulu-cami_" + AD + ".blend")
os.makedirs(KONTROL, exist_ok=True)
MAKET = os.path.join(ESER, "ref-maket", "Miniaturk_Bursa_Ulu_Cami_-_Bursa_Grand_Mosque.jpeg")
PLAN = os.path.join(ESER, "..", "ref", "ulu-cami_plan_ayverdi.png")
W, D = P["W"], P["D"]; CX, CY = P["KOLON_X"], P["SIRA_Y"]; NX, NY = len(CX), len(CY)
s = math.tan(math.radians(P["CATI_EGIM"])); tb = math.tan(math.radians(P["BANT_EGIM"]))
ZS = P["DUVAR"] + P["SACAK_KALINLIK"]; RK = P["KASNAK_R"]; C_ETEK = 2 * P["ETEK_R"]
XB = [-W / 2] + [(CX[i] + CX[i + 1]) / 2 for i in range(NX - 1)] + [W / 2]     # bölge sınırları (oluk çizgileri)
YB = [-D / 2] + [(CY[j] + CY[j + 1]) / 2 for j in range(NY - 1)] + [D / 2]
AA = [P["A_C"][i] * C_ETEK for i in range(NX)]                 # kubbe yüksekliği (etek alt kenarı → tepe)
BB = [AA[i] / P["A_B"][i] for i in range(NX)]                  # görünen kasnak (kuzeyden)
ETEK_ALT = [P["TEPE"][i] - AA[i] for i in range(NX)]
AYAK_ON = [ETEK_ALT[i] - BB[i] for i in range(NX)]             # kuzey sıra kasnağının ön yüzünde çatı kotu
g_on = (CY[0] - RK) - (-D / 2)                                 # kuzey sıra: kasnak önü ile duvar arası
ZO = [(AYAK_ON[i] - s * g_on - s * ZS / tb) / (1 - s / tb) for i in range(NX)]   # sütun oluk kotu
KS = [AA[i] / P["KUBBE_PROFIL_A"] for i in range(NX)]
KT = [ETEK_ALT[i] + 0.12 * KS[i] for i in range(NX)]           # kasnak üst kotu

A.temizle()
M = A.palet({"duvar": "#D4BE96", "kasnak": "#E2C77E", "kubbe": "#A9B4C2", "cati": "#9AA2AC",
             "mermer": "#ECE8DF", "minare_tugla": "#A65A43", "pencere": "#4A5A66", "alem": "#DCA320",
             "alem_kursun": "#6B7480", "mermer_koyu": "#5E6670"})
_b = next(n for n in M["alem_kursun"].node_tree.nodes if n.type == "BSDF_PRINCIPLED")
_b.inputs["Metallic"].default_value = 0.6; _b.inputs["Roughness"].default_value = 0.4
c0 = Vector((0, 0))
z = A.G("Zemin"); z.prism(A.rect(Vector((0, -6)), 86, 76), -1.0, 0.0, M["zemin"], M["zemin"]); z.obj()
g = A.G("Govde"); g.prism(A.rect(c0, W, D), -0.2, P["DUVAR"], M["duvar"], M["duvar"]); g.obj()

# ======================= Cati: bölge başına düzlemlerin alt zarfı, kapalı mesh =======================
gw = P["GECIS_W"] / 2
def kenar_duz(z0, yon, k, egim):
    if yon == "xL": return (egim, 0.0, z0 - egim * k)
    if yon == "xR": return (-egim, 0.0, z0 + egim * k)
    if yon == "yB": return (0.0, egim, z0 - egim * k)
    return (0.0, -egim, z0 + egim * k)
def bolge_bolme(ix, iy):
    xL = XB[ix] + (gw if ix > 0 else 0); xR = XB[ix + 1] - (gw if ix < NX - 1 else 0)
    yB, yT = YB[iy], YB[iy + 1]; zo = ZO[ix]; d0 = (zo - ZS) / tb; pl = []
    for yon, k, dis in (("xL", xL, ix == 0), ("xR", xR, ix == NX - 1), ("yB", yB, iy == 0), ("yT", yT, iy == NY - 1)):
        if dis: pl += [kenar_duz(ZS, yon, k, tb), kenar_duz(zo - s * d0, yon, k, s)]   # dış kurşun bant + üstünden kırma
        else: pl.append(kenar_duz(zo, yon, k, s))                                     # oluktan kırma
    return [(xL, yB), (xR, yB), (xR, yT), (xL, yT)], pl
def bolge_gecis(i, iy):
    x0, x1 = XB[i] - gw, XB[i] + gw; yB, yT = YB[iy], YB[iy + 1]
    a = (ZO[i] - ZO[i - 1]) / (x1 - x0); pl = [(a, 0.0, ZO[i - 1] - a * x0)]
    if iy == 0: pl.append(kenar_duz(ZS, "yB", yB, tb))
    if iy == NY - 1: pl.append(kenar_duz(ZS, "yT", yT, tb))
    return [(x0, yB), (x1, yB), (x1, yT), (x0, yT)], pl
def kirp(poly, a, b, c):          # a·x + b·y + c <= 0 tarafını tut
    out = []; n = len(poly)
    for i in range(n):
        p, q = poly[i], poly[(i + 1) % n]
        fp = a * p[0] + b * p[1] + c; fq = a * q[0] + b * q[1] + c
        if fp <= 1e-9: out.append(p)
        if (fp < -1e-9 and fq > 1e-9) or (fp > 1e-9 and fq < -1e-9):
            t = fp / (fp - fq); out.append((p[0] + t * (q[0] - p[0]), p[1] + t * (q[1] - p[1])))
    return out
def temizle_poly(poly):
    t = []
    for p in poly:
        if not t or math.dist(p, t[-1]) > 1e-7: t.append(p)
    if len(t) > 2 and math.dist(t[0], t[-1]) < 1e-7: t.pop()
    return t
def alan(p): return abs(sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))) / 2
def zarf2(rect, pl):
    """[(2B çokgen, düzlem)]: her düzlemin en alçak olduğu bölge."""
    uniq = []
    for q in pl:
        if not any(max(abs(q[i] - u[i]) for i in range(3)) < 1e-9 for u in uniq): uniq.append(q)
    out = []
    for k, (ak, bk, ck) in enumerate(uniq):
        poly = list(rect)
        for j, (aj, bj, cj) in enumerate(uniq):
            if j != k and poly: poly = kirp(poly, ak - aj, bk - bj, ck - cj)
        poly = temizle_poly(poly)
        if len(poly) >= 3 and alan(poly) > 1e-6: out.append((poly, (ak, bk, ck)))
    return out
def kaldir(poly, q, dz=0.0): return [(x, y, q[0] * x + q[1] * y + q[2] + dz) for x, y in poly]

polys = []; bolme_yuz = {}
for ix in range(NX):
    for iy in range(NY):
        r, pl = bolge_bolme(ix, iy); yz = zarf2(r, pl); bolme_yuz[(ix, iy)] = yz; polys += [kaldir(p, q) for p, q in yz]
for i in range(1, NX):
    for iy in range(NY):
        r, pl = bolge_gecis(i, iy); polys += [kaldir(p, q) for p, q in zarf2(r, pl)]
t_ = P["SACAK_TASMA"]; ic = [(-W/2, -D/2), (W/2, -D/2), (W/2, D/2), (-W/2, D/2)]
dis = [(-W/2 - t_, -D/2 - t_), (W/2 + t_, -D/2 - t_), (W/2 + t_, D/2 + t_), (-W/2 - t_, D/2 + t_)]
for i in range(4):
    j = (i + 1) % 4
    polys.append([(*ic[i], ZS), (*dis[i], ZS), (*dis[j], ZS), (*ic[j], ZS)])
    polys.append([(*dis[i], ZS), (*dis[i], P["DUVAR"]), (*dis[j], P["DUVAR"]), (*dis[j], ZS)])
polys.append([(*p, P["DUVAR"]) for p in dis])

def t_duzelt(polys):
    """T-birleşim: her kenarın üstüne düşen başka köşeleri o kenara ekle."""
    tum = {}
    for p in polys:
        for v in p: tum[(round(v[0], 5), round(v[1], 5), round(v[2], 5))] = v
    izg = {}
    for v in tum.values(): izg.setdefault((int(math.floor(v[0])), int(math.floor(v[1]))), []).append(v)
    def ustu(a, b):
        xa, xb = sorted((a[0], b[0])); ya, yb = sorted((a[1], b[1])); L2 = sum((b[k] - a[k]) ** 2 for k in range(3)); out = []
        for gx in range(int(math.floor(xa)) - 1, int(math.floor(xb)) + 2):
            for gy in range(int(math.floor(ya)) - 1, int(math.floor(yb)) + 2):
                for v in izg.get((gx, gy), ()):
                    t = sum((v[k] - a[k]) * (b[k] - a[k]) for k in range(3)) / L2
                    if 1e-6 < t < 1 - 1e-6 and math.dist([a[k] + t * (b[k] - a[k]) for k in range(3)], v) < 1e-4: out.append((t, v))
        return [v for _, v in sorted(out)]
    yeni = []
    for p in polys:
        q = []
        for i in range(len(p)): q.append(p[i]); q += ustu(p[i], p[(i + 1) % len(p)])
        yeni.append(q)
    return yeni
def yuz_ekle(g_, polys, mat, cache):
    def V(v):
        k = (round(v[0], 4), round(v[1], 4), round(v[2], 4))
        if k not in cache: cache[k] = g_.bm.verts.new(v)
        return cache[k]
    for p in polys:
        vs = []
        for v in p:
            bv = V(v)
            if not vs or vs[-1] is not bv: vs.append(bv)
        if len(vs) > 1 and vs[0] is vs[-1]: vs.pop()
        if len(vs) >= 3: g_.F(vs, mat)
    return V
cati = A.G("Cati"); yuz_ekle(cati, t_duzelt(polys), M["cati"], {}); cati.obj()

# ======================= Kubbe + kasnak: bölme başına TEK kapalı mesh; kasnak tabanı çatı yüzünü birebir izler =======================
def kubbe_profil(ix):
    f = RK / P["KUBBE_PROFIL_R"]; rmax = max(r for r, _ in P["KUBBE_PROFIL"]) * f
    kt = (P["ETEK_R"] - RK) / (rmax - RK); k = KS[ix]; out = []
    for r, zz in P["KUBBE_PROFIL"]:
        r *= f
        if r > RK: r = RK + kt * (r - RK)
        out.append((r, KT[ix] + k * zz))
    return out
def bolme(g_, ix, iy):
    bc = Vector((CX[ix], CY[iy])); n = P["KASNAK_N"]
    ring = [(q.x, q.y) for q in A.ccw(A.circle(bc, RK, n, 0.0))]; zt = KT[ix]
    # taban: çatı yüzlerinin halka içinde kalan parçaları, 5 cm aşağıda
    parca = []
    for poly, q in bolme_yuz[(ix, iy)]:
        p2 = list(poly)
        for i in range(n):
            a, b = ring[i], ring[(i + 1) % n]
            if p2: p2 = kirp(p2, b[1] - a[1], -(b[0] - a[0]), -(b[1] - a[1]) * a[0] + (b[0] - a[0]) * a[1])
        p2 = temizle_poly(p2)
        if len(p2) >= 3 and alan(p2) > 1e-6: parca.append(kaldir(p2, q, -0.05))
    parca = t_duzelt(parca)
    cache = {}; V = yuz_ekle(g_, parca, M["kasnak"], cache)
    tumv = {k: v for p in parca for v in p for k in [(round(v[0], 4), round(v[1], 4), round(v[2], 4))]}.values()
    top = [g_.V(Vector(p), zt) for p in ring]
    for i in range(n):
        a, b = ring[i], ring[(i + 1) % n]; L = math.dist(a, b); zin = []
        for v in tumv:
            t = ((v[0] - a[0]) * (b[0] - a[0]) + (v[1] - a[1]) * (b[1] - a[1])) / (L * L)
            if -1e-6 <= t <= 1 + 1e-6 and abs((b[0] - a[0]) * (v[1] - a[1]) - (b[1] - a[1]) * (v[0] - a[0])) / L < 1e-5: zin.append((t, v))
        zin.sort(key=lambda x: x[0])
        vs = []
        for _, v in zin:
            bv = V(v)
            if not vs or vs[-1] is not bv: vs.append(bv)
        assert math.dist(vs[0].co.xy, a) < 1e-4 and math.dist(vs[-1].co.xy, b) < 1e-4, ("halka köşesi tabanda yok", ix, iy, i)
        g_.F(vs + [top[(i + 1) % n], top[i]], M["kasnak"])
    g_.lathe(bc, kubbe_profil(ix), P["KUBBE_SEG"], [M["kubbe"]] * 40)
    g_.bm.faces.ensure_lookup_table(); cap = g_.bm.faces[-1]
    assert len(cap.verts) == P["KUBBE_SEG"] and all(abs(v.co.z - zt) < 1e-6 for v in cap.verts)
    bmesh.ops.delete(g_.bm, geom=[cap], context='FACES_ONLY')
    return bc, zt + KS[ix] * P["KUBBE_PROFIL"][-1][1]
kub = A.G("Kubbeler_19"); sad = A.G("Sadirvan_Kubbe"); tepeler = []
for iy in range(NY):
    for ix in range(NX):
        tepeler.append(bolme(sad if (ix, iy) == P["ACIK"] else kub, ix, iy))
kub.obj(); sad.obj()
al = A.G("Alemler")
for bc, zt in tepeler:
    al.lathe(bc, [(r, zt + dz) for r, dz in P["ALEM"]], 8, [M["alem_kursun"]] * 4)
al.obj()

# ======================= Minareler: biçim maketten, yerleşim ve kaideler Ayverdi planından =======================
RG = P["MIN_D"] / 2; KB = P["MIN_D"] / P["MIN_BASLIK_D0"]
def govde_basi(g_, c_, z0):
    T, TU = M["minare_tas"], M["minare_tugla"]
    prof = [(RG, z0, TU), (RG * P["MIN_GOVDE_UST_K"], P["MIN_KUSAK_ALT"], TU)]; zz = P["MIN_KUSAK_ALT"]
    for rk, h in P["MIN_KUSAK"]:
        prof += [(RG * rk, zz, TU), (RG * rk, zz + h, TU)]; zz += h
    rkor = P["MIN_KORKULUK"][0] * RG
    prof += [(rkor, zz, T), (rkor, zz + P["MIN_KORKULUK"][1], T)]; zz += P["MIN_KORKULUK"][1]
    ru = P["MIN_UST_GOVDE"][0] * RG
    prof += [(ru, zz, T), (ru, zz + P["MIN_UST_GOVDE"][1], TU)]; zz += P["MIN_UST_GOVDE"][1]
    prof += [(r * KB, zz + dz, T) for r, dz in P["MIN_BASLIK"]]
    g_.lathe(c_, [(r, h) for r, h, _ in prof], 16, [m for _, _, m in prof[1:]])
    return prof
def minare_bantli(ad, c_):
    g_ = A.G(ad); Bm, Km = M["mermer"], M["mermer_koyu"]; cz = math.cos(math.pi / 8)
    R0, R1 = P["MIN_BANTLI_PABUC"] / cz, P["MIN_BANTLI_YARIM"] / cz
    kp = [(R0, -0.2, Bm), (R1, 1.0, Bm)]
    for z0, z1 in P["MIN_BANTLI_BANT"]: kp += [(R1, z0, Bm), (R1, z1, Km)]
    kp.append((R1, P["MIN_BANTLI_H"], Bm))
    g_.lathe(c_, [(r, zz) for r, zz, _ in kp], 8, [m for _, _, m in kp[1:]])
    bmesh.ops.rotate(g_.bm, cent=(c_.x, c_.y, 0), matrix=Matrix.Rotation(math.pi / 8, 3, 'Z'), verts=g_.bm.verts)
    pr = govde_basi(g_, c_, P["MIN_BANTLI_H"]); return g_.obj(), pr
def minare_sade(ad, c_):
    g_ = A.G(ad); T = M["minare_tas"]; kx, ky, kh, z1 = P["MIN_SADE_KAIDE"]
    g_.prism(A.rect(c_, kx, ky), -0.2, kh, T, T)
    g_.lathe(c_, [(min(kx, ky) / 2, kh), (RG * 1.1, z1)], 8, [T])
    pr = govde_basi(g_, c_, z1); return g_.obj(), pr
XM1 = W / 2 - P["MIN_BANTLI_EKSEN"][0]; YM1 = -D / 2 - P["MIN_BANTLI_EKSEN"][1]
assert YM1 + P["MIN_BANTLI_PABUC"] < -D / 2, "bantlı kaide cepheye giriyor"
kx, ky = P["MIN_SADE_KAIDE"][:2]; XM2 = -(W / 2 - kx / 2); YM2 = -D / 2 - P["MIN_SADE_ARALIK"] - ky / 2
_, PR = minare_bantli("Minare_1", Vector((XM1, YM1)))     # kuzeybatı (+X = batı)
minare_sade("Minare_2", Vector((XM2, YM2)))              # kuzeydoğu
e = bpy.data.objects.new("Merkez", None); bpy.context.scene.collection.objects.link(e)

R = A.kontrol_hepsi(KONTROL, AD)
print("RAPOR", json.dumps(R, ensure_ascii=False))
r2 = lambda L: [round(x, 2) for x in L]
print("OLCU", json.dumps({"A": r2(AA), "B": r2(BB), "etek_alt": r2(ETEK_ALT), "kasnak_ust": r2(KT), "ayak_on": r2(AYAK_ON),
      "oluk": r2(ZO), "tepe": r2([t for _, t in tepeler[:5]]), "minare_tepe": round(PR[-1][1], 2)}))
bpy.ops.wm.save_as_mainfile(filepath=BLEND)

# ======================= görüntüler =======================
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.78, 0.82, 0.88, 1); bg.inputs[1].default_value = 1.0
sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = 3.0; sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
def kamera(loc, rot=None, tgt=None, lens=50, ortho=None):
    cd = bpy.data.cameras.new("_c"); cd.lens = lens; cd.clip_end = 2000
    if ortho: cd.type = 'ORTHO'; cd.ortho_scale = ortho
    cam = bpy.data.objects.new("_c", cd); sc.collection.objects.link(cam); sc.camera = cam; cam.location = loc
    cam.rotation_euler = rot if rot else (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
def render(ad, res, saydam=False):
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.film_transparent = saydam
    sc.render.filepath = os.path.join(KONTROL, ad); bpy.ops.render.render(write_still=True)
def yukle(p, boy=None):
    im = bpy.data.images.load(p)
    if boy: im.scale(*boy)
    a = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], 4); bpy.data.images.remove(im); return a
def yaz(a, p):
    im = bpy.data.images.new("_o", a.shape[1], a.shape[0], alpha=True); im.pixels = a.ravel()
    im.filepath_raw = p; im.file_format = 'PNG'; im.save(); bpy.data.images.remove(im)
bgc = np.array([0.78, 0.82, 0.88], np.float32)

# 1) kuzey: maketle aynı ölçek (cephe genişliği aynı piksel) ve taban çizgisi
el = math.radians(P["MAKET_EGIM"]); k = P["MAKET_CEPHE_PX"] / W; (bx, by) = P["MAKET_TABAN"]; (iw, ih) = P["MAKET_BOY"]
v = Vector((0, math.cos(el), -math.sin(el))); u = Vector((0, math.sin(el), math.cos(el)))
C = Vector((0, -D / 2, 0)) + Vector((-(bx - iw / 2) / k, 0, 0)) + u * ((by - ih / 2) / k) - v * 300
kamera(tuple(C), rot=(math.pi / 2 - el, 0, 0), ortho=iw / k); render(AD + "_orto_maket.png", (iw, ih), saydam=True)
mk = yukle(MAKET, (iw, ih)); rn = yukle(os.path.join(KONTROL, AD + "_orto_maket.png")); al_ = rn[..., 3:4]
ov = mk.copy(); ov[..., :3] = mk[..., :3] * (1 - 0.55 * al_) + rn[..., :3] * 0.55 * al_; ov[..., 3] = 1
yaz(ov, os.path.join(KONTROL, AD + "_overlay.png"))
rnb = rn.copy(); rnb[..., :3] = rn[..., :3] * al_ + bgc * (1 - al_); rnb[..., 3] = 1
yaz(np.concatenate([mk, np.ones((ih, 16, 4), np.float32), rnb], axis=1), os.path.join(KONTROL, AD + "_yanyana_kuzey.png"))
# 2) havadan kuzeybatı
kamera((110, -125, 95), tgt=(0, 0, 10), lens=50); render(AD + "_hava_kuzeybati.png", (1100, 800))
# 3) plan bindirmesi: üstten ortografik, plan ölçeğinde (kuzey aşağıda = görüntü üstü +Y), zemin gizli
pk = P["PLAN_PX_M"]; (pcx, pcy) = P["PLAN_MERKEZ"]; (pw, ph) = P["PLAN_BOY"]
bpy.data.objects["Zemin"].hide_render = True
kamera(((pw / 2 - pcx) / pk, -(ph / 2 - pcy) / pk, 200), rot=(0, 0, 0), ortho=max(pw, ph) / pk)
render(AD + "_plan_ust.png", (pw, ph), saydam=True)
pl_ = yukle(PLAN); ru_ = yukle(os.path.join(KONTROL, AD + "_plan_ust.png")); a2 = ru_[..., 3:4] * 0.5
po = pl_.copy(); po[..., :3] = pl_[..., :3] * (1 - a2) + ru_[..., :3] * a2; po[..., 3] = 1
yaz(po, os.path.join(KONTROL, AD + "_plan_overlay.png"))
