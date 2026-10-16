# GPT: Projedeki v02c üretim geometrisi üzerine Bursa ortak stil ve portal detayları.
# Bursa Ulucami · v02c — duvar eski rengi; minarenin beyaz kısımları duvar renginde; kasnak pencereleri 2 kat (Muhammed). Kütle v01e2'de DONDURULDU (dokunulmaz); bu betik yalnız ekler.
# Çalıştır: blender -b --python 3d-eser/bursa/ulu-cami/build/build_v02c.py
# Eksenler: Z yukarı; kuzey = -Y; +X = batı. Orijin: zemin ortası. Bütün sayılar P'den okunur.
# Parçalar: Govde, Cati, Kubbeler_19, Sadirvan_Kubbe, Alemler, Minare_1, Minare_2, Zemin, Merkez +
#          Mermer_Bant, Silme_Ust, Cephe_Kuzey/Guney/Dogu/Bati, Tac_Kapi, Kapi_Dogu, Kapi_Bati, Kasnak_Pencereleri
import sys, os, json, math
ESER = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # ulu-cami/claude/ (betik build/ içinde)
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
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
    # ======== v02 DETAY (D_): maket 21,8 px/m, plan 24,55 px/m ========
    "D_BANT": (1.2, 0.08),            # mermer taban bandı: yükseklik, cephe yüzünden çıkıntı
    "D_SILME": (0.4, 0.15),           # saçak altı silme: yükseklik, cephe yüzünden çıkıntı
    "D_NIS_DERIN": 0.25,              # sağır niş derinliği (cephe kabuğu kalınlığı; Govde'ye dokunulmaz, kabuk önüne eklenir)
    "D_NIS_W": 4.8, "D_NIS_ALT": 1.4, "D_NIS_TEPE_PAY": 1.5,   # niş genişliği (maket 4,9–5,0), alt kot, tepe = duvar − pay
    "D_KEMER_K": 0.8,                 # sivri kemer yarıçapı = K × genişlik
    "D_UST_PEN": (2.2, 9.1, 13.2),    # üst pencere: genişlik, alt kot, tepe (maket; yönergede 1,6 × 3,2)
    "D_ALT_PEN": (1.7, 1.8, 4.3),     # alt pencere: genişlik, alt, üst (maket; yönergede 1,3 × 1,9)
    "D_SOVE": 0.18,                   # mermer söve payı
    "D_BOSALTMA": (1.9, 4.5, 5.65, 0.6),   # alt pencere üstü boşaltma kemeri: genişlik, alt, tepe, kemer K (basık)
    "D_TAC": {"w": 9.5, "cik": 1.8, "h": 16.5, "nis_w": 4.2, "nis_tepe": 12.0, "kapi": (2.8, 4.5), "mukarnas": 5,
              "basamak": 6, "basamak_h": 0.17, "basamak_w": 16.1, "basamak_d": 5.5, "basamak_adim": 0.5},   # plan: blok 9,5 × 1,8, merdiven 16,1 m
    "D_YAN_KAPI": {"dogu_y": -5.5, "bati_y": -6.4, "cerceve": (3.4, 5.4), "kanat": (2.4, 4.6)},       # plan konumları
    "D_BATI_NOTCH_X": 29.4,           # kuzey cephe: batı kaide + geçit önünde kabuk/bant yok
    "D_BATI_NIS_W": 11.2, "D_BATI_CIFT_ARALIK": 2.35, "D_BATI_UST_PEN": (1.85,9.5,12.8),
    "D_KUZEY_PEN_X": [-27.4,-22.2,-16.0,-10.8,10.8,16.0,24.2],
    "D_MUKARNAS": {"motif":18,"sira":6,"alt":36.65,"ust":41.28,"uc_r":2.40,"ust_r":2.98,"doluluk":0.94},
    "D_YIV": 0.06,
    "D_KASNAK_PEN": (1.4, 2.4, 0.25, 3),   # v02c: 0,7 × 1,2 → 2 kat;    # genişlik, yükseklik, kasnak üstünden pay, her N yüzde bir
    "D_BILEZIK": (0.25, 0.05, [0.25, 0.5, 0.75]),   # minare taş bilezik: yükseklik, çıkıntı, boy oranları
    "D_KORKULUK_SILME": (0.15, 0.10),
    "D_GECIT_W": 2.0,
    "D_KASNAK_PEN_MIN": 1.5,          # çatı nedeniyle kısalan kasnak penceresi en az bu boyda kalır, yoksa konmaz
    # v02b pencere dokuları (yöntem notu: doku yalnız pencere ızgarası gibi tekrar eden detayda, küçük karo)
    "D_KAFES": {"karo_m": 0.28, "px": 32, "zemin": "#F2F3E5", "delik": "#1F2328", "delik_r": 0.30},   # beyaz kafes, siyah yuvarlak delikler (üst + kasnak pencereleri)
    "D_IZGARA": {"karo_m": 0.30, "px": 32, "zemin": "#1F2328", "cizgi": "#31574D", "cizgi_px": 4},     # alt pencere: kırmızı ızgara, içi siyah
    "D_SOVE_CIK": 0.15,               # pencere sövesi (çerçeve) duvardan çıkıntısı; cam/kafes söve içinde geride → oyuk görünümü
    "D_AO_TABAN": {"varsayilan": 0.6, "Kubbeler_19": 0.85, "Sadirvan_Kubbe": 0.85, "Kasnak_Pencereleri": 0.85, "Alemler": 0.85},   # AO yumuşatma: c = taban + (1 − taban)·ao
}

AD = "gpt_v14"; KONTROL = os.path.join(ESER, "kontrol", AD); BLEND = os.path.join(ESER, "blend", "ulu-cami_" + AD + ".blend")
os.makedirs(KONTROL, exist_ok=True)
MAKET = os.path.join(ESER, "..", "ref-maket", "Miniaturk_Bursa_Ulu_Cami_-_Bursa_Grand_Mosque.jpeg")
PLAN = os.path.join(ESER, "..", "..", "..", "ref", "ulu-cami_plan_ayverdi.png")
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
M = A.palet({"duvar": "#C8BAA2", "nis": "#B9AC96", "mermer": "#E4E3DC", "pencere": "#415072", "ahsap": "#6B4A3A",
             "kasnak": "#E9DDA9", "kubbe": "#939FA8", "cati": "#7F8B94", "alem_kursun": "#C9A13B", "tugla": "#A87554",
             "bant_koyu": "#505955"})
M["minare_beyaz"] = M["mermer"]      # v02c: minarenin beyaz kısımları (kaide, şerefe, başlık, bilezik, geçit) duvar rengini alır
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
def zarf_z(pl, x, y): return min(a * x + b * y + c for a, b, c in pl)
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
    # D: kubbe yivleri — 24 segmentin tek sıra noktaları içeri (kasnak halkası ve tepe noktası yerinde kalır)
    da = 2 * math.pi / P["KUBBE_SEG"]
    for vv in g_.bm.verts:
        d2 = vv.co.xy - bc; r = d2.length
        if 0.05 < r <= P["ETEK_R"] + 0.02 and (vv.co.z > zt + 1e-4 or r > RK + 1e-3):
            if round(math.atan2(d2.y, d2.x) / da) % 2 == 1:
                vv.co.xy = bc + d2 * ((r - P["D_YIV"]) / r)
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
M["minare_ust_tas"] = A.mat("Minare_Ust_Tas_Tonu", "#C8BAA2")
def govde_basi(g_, c_, z0):
    T, TU = M["minare_ust_tas"], M["tugla"]
    prof = [(RG, z0, TU), (RG * P["MIN_GOVDE_UST_K"], P["MIN_KUSAK_ALT"], TU)]; zz = P["MIN_KUSAK_ALT"]
    for rk, h in P["MIN_KUSAK"]:
        prof += [(RG * rk, zz, TU), (RG * rk, zz + h, TU)]; zz += h
    rkor = P["MIN_KORKULUK"][0] * RG
    prof += [(rkor, zz, T), (rkor, zz + P["MIN_KORKULUK"][1], T)]; zz += P["MIN_KORKULUK"][1]
    ru = P["MIN_UST_GOVDE"][0] * RG
    prof += [(ru, zz, T), (ru, zz + P["MIN_UST_GOVDE"][1], TU)]; zz += P["MIN_UST_GOVDE"][1]
    prof += [(r * KB, zz + dz, T) for r, dz in P["MIN_BASLIK"]]
    g_.lathe(c_, [(r, h) for r, h, _ in prof], 16, [m for _, _, m in prof[1:]])
    # Üç şaşırtmalı kuşakta küçük, basamaklı ters üçgen mukarnaslar.
    mu=P["D_MUKARNAS"]; rows=6; count=18; bands=3
    pitch=2*math.pi/count; band_h=(mu["ust"]-mu["alt"])/bands
    for band in range(bands):
        for j in range(count):
            ang=(j+.5*(band%2))*pitch
            normal=Vector((math.cos(ang),math.sin(ang))); tangent=Vector((-normal.y,normal.x))
            for row in range(rows):
                z=mu["alt"]+band*band_h+row*band_h/rows
                core=RG*(1.08+.06*min(2,int((z-36.6)/1.57)))
                front=core+.07+.22*(row+1)/rows
                back=core-.035
                width=2*front*math.tan(pitch/2)*.94*(row+1)/rows
                poly=[c_+normal*back-tangent*width/2,c_+normal*front-tangent*width/2,
                      c_+normal*front+tangent*width/2,c_+normal*back+tangent*width/2]
                g_.prism(poly,z+.002,z+band_h/rows-.002,M["tugla"],M["tugla"])
    # Şerefe taş korkuluğundaki ince düşey bölmeler.
    for j in range(24):
        ang=2*math.pi*j/24; rr=P["MIN_KORKULUK"][0]*RG
        center=c_+Vector((math.cos(ang),math.sin(ang)))*(rr+0.025)
        g_.prism(A.rect(center,0.10,0.12,ang),41.45,42.65,T,T)
    return prof
def minare_bantli(ad, c_):
    g_ = A.G(ad); Bm, Km = M["minare_beyaz"], M["bant_koyu"]; cz = math.cos(math.pi / 8)
    R0, R1 = P["MIN_BANTLI_PABUC"] / cz, P["MIN_BANTLI_YARIM"] / cz
    kp = [(R0, -0.2, Bm), (R1, 1.0, Bm)]
    for z0, z1 in P["MIN_BANTLI_BANT"]: kp += [(R1, z0, Bm), (R1, z1, Km)]
    kp.append((R1, P["MIN_BANTLI_H"], Bm))
    g_.lathe(c_, [(r, zz) for r, zz, _ in kp], 8, [m for _, _, m in kp[1:]])
    bmesh.ops.rotate(g_.bm, cent=(c_.x, c_.y, 0), matrix=Matrix.Rotation(math.pi / 8, 3, 'Z'), verts=g_.bm.verts)
    for j in range(8):
        ang=2*math.pi*j/8; nn=Vector((math.cos(ang),math.sin(ang))); tt=Vector((-nn.y,nn.x))
        oo=c_+nn*P["MIN_BANTLI_YARIM"]
        if nn.y>0.3: continue  # geçit tarafında kapalı yüz
        outer=sivri(1.30,1.4,6.5,n=4); inner=sivri(1.12,1.5,6.36,n=4)
        levha(g_,oo,tt,nn,inner,0.008,0.012,Bm)
        kabuk_off(g_,oo,tt,nn,outer,[inner],0.025,0.055,Bm)
    pr = govde_basi(g_, c_, P["MIN_BANTLI_H"]); minare_detay(g_, c_, P["MIN_BANTLI_H"]); gecit(g_, c_); return g_.obj(), pr
def minare_sade(ad, c_):
    g_ = A.G(ad); T = M["minare_beyaz"]; kx, ky, kh, z1 = P["MIN_SADE_KAIDE"]
    g_.prism(A.rect(c_, kx, ky), -0.2, kh, T, T)
    g_.lathe(c_, [(min(kx, ky) / 2, kh), (RG * 1.1, z1)], 8, [T])
    pr = govde_basi(g_, c_, z1); minare_detay(g_, c_, z1); return g_.obj(), pr
# ======================= v02 detay yardımcıları =======================
def sivri(w, z0, tepe, k=None, n=4):
    """Sivri kemerli çokgen (u, z), saat yönü tersine: alt sol → alt sağ → sağ kenar → kemer → tepe → sol kenar."""
    k = k or P["D_KEMER_K"]; R = k * w; ta = math.acos((R - w / 2) / R); zs = tepe - R * math.sin(ta)
    assert zs >= z0 - 1e-9, ("kemer çok yüksek", w, z0, tepe)
    pts = [(-w / 2, z0), (w / 2, z0)]
    if zs > z0 + 1e-6: pts.append((w / 2, zs))
    for i in range(1, n + 1):
        t = ta * i / n; pts.append(((w / 2 - R) + R * math.cos(t), zs + R * math.sin(t)))
    for i in range(n - 1, 0, -1):
        t = ta * i / n; pts.append((-((w / 2 - R) + R * math.cos(t)), zs + R * math.sin(t)))
    if zs > z0 + 1e-6: pts.append((-w / 2, zs))
    return pts
def kemer_bas(w, tepe, k=None):
    k = k or P["D_KEMER_K"]; R = k * w; return tepe - R * math.sin(math.acos((R - w / 2) / R))
def kemer_yari(w, tepe, z, k=None):
    """Sivri kemerin z kotundaki yarı genişliği."""
    k = k or P["D_KEMER_K"]; R = k * w; zs = kemer_bas(w, tepe, k)
    if z <= zs: return w / 2
    return max(0.0, (w / 2 - R) + math.sqrt(max(0.0, R * R - (z - zs) ** 2)))
def kaydir(poly, du=0.0): return [(u + du, z) for u, z in poly]
def P3(O, T, N, u, z, o): return Vector((O.x + T.x * u + N.x * o, O.y + T.y * u + N.y * o, z))
def levha(g_, O, T, N, poly, off, dep, m):
    """Cephe düzleminden off kadar önde, dep kalınlığında KAPALI levha (duvarla aynı düzlemde değil)."""
    A_ = [g_.bm.verts.new(P3(O, T, N, u, z, off)) for u, z in poly]
    B_ = [g_.bm.verts.new(P3(O, T, N, u, z, off + dep)) for u, z in poly]
    g_.F(B_, m); g_.F(A_[::-1], m)
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g_.F([A_[i], A_[j], B_[j], B_[i]], m)
def kabuk(g_, O, T, N, dis, delikler, dep, m):
    """Delikli cephe kabuğu: dış çokgen − delikler, duvar düzleminden dep kalınlığında kapalı hacim."""
    kenar = []
    for loop in [dis] + delikler:
        vs = [g_.bm.verts.new(P3(O, T, N, u, z, 0.0)) for u, z in loop]
        kenar += [g_.bm.edges.new((vs[i], vs[(i + 1) % len(vs)])) for i in range(len(vs))]
    r = bmesh.ops.triangle_fill(g_.bm, use_beauty=True, use_dissolve=False, edges=kenar, normal=Vector((N.x, N.y, 0)))
    yuz = [f for f in r["geom"] if isinstance(f, bmesh.types.BMFace)]
    for f in yuz: f.material_index = g_.mi(m)
    alan_ = sum(f.calc_area() for f in yuz)
    ex = bmesh.ops.extrude_face_region(g_.bm, geom=yuz, use_keep_orig=True)
    for v in [e for e in ex["geom"] if isinstance(e, bmesh.types.BMVert)]: v.co += Vector((N.x, N.y, 0)) * dep
    return alan_
def kabuk_off(g_, O, T, N, dis, delikler, off, dep, m):
    """kabuk() gibi ama duvar düzleminden off kadar önde başlar (çerçeve/söve halkası)."""
    kenar = []
    for loop in [dis] + delikler:
        vs = [g_.bm.verts.new(P3(O, T, N, u, z, off)) for u, z in loop]
        kenar += [g_.bm.edges.new((vs[i], vs[(i + 1) % len(vs)])) for i in range(len(vs))]
    r = bmesh.ops.triangle_fill(g_.bm, use_beauty=True, use_dissolve=False, edges=kenar, normal=Vector((N.x, N.y, 0)))
    yuz = [f for f in r["geom"] if isinstance(f, bmesh.types.BMFace)]
    for f in yuz: f.material_index = g_.mi(m)
    ex = bmesh.ops.extrude_face_region(g_.bm, geom=yuz, use_keep_orig=True)
    for v in [e for e in ex["geom"] if isinstance(e, bmesh.types.BMVert)]: v.co += Vector((N.x, N.y, 0)) * dep
def levha2(g_, O, T, N, poly, off, dep, m_on, m_yan):
    """levha(); ön/arka yüz m_on (dokulu), yan yüzler m_yan."""
    A_ = [g_.bm.verts.new(P3(O, T, N, u, z, off)) for u, z in poly]
    B_ = [g_.bm.verts.new(P3(O, T, N, u, z, off + dep)) for u, z in poly]
    g_.F(B_, m_on); g_.F(A_[::-1], m_on)
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g_.F([A_[i], A_[j], B_[j], B_[i]], m_yan)
def _hex(h): return [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
def doku_mat(ad, px, ciz):
    """Küçük karo doku (px × px) üretir, build/doku/ altına PNG kaydeder, Principled'e bağlar (en yakın örnekleme: keskin)."""
    img = bpy.data.images.new(ad, px, px, alpha=False); a = np.ones((px, px, 4), np.float32)
    for y in range(px):
        for x in range(px): a[y, x, :3] = ciz(x, y, px)
    img.pixels = a.ravel(); d = os.path.join(ESER, "build", "doku"); os.makedirs(d, exist_ok=True)
    img.filepath_raw = os.path.join(d, ad + ".png"); img.file_format = 'PNG'; img.save(); img.pack()
    m = bpy.data.materials.get(ad) or bpy.data.materials.new(ad); m.use_nodes = True; nt = m.node_tree
    bs = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED"); bs.inputs["Roughness"].default_value = 0.85
    tx = nt.nodes.new("ShaderNodeTexImage"); tx.image = img; tx.interpolation = 'Closest'
    nt.links.new(tx.outputs["Color"], bs.inputs["Base Color"])
    nt.nodes.new("ShaderNodeVertexColor")      # A.ao_vertex bu malzemeyi atlasın (dokuyu RGB ile ezmesin)
    m.use_backface_culling = True; return m
def _kafes(x, y, px):
    k = P["D_KAFES"]; cx = cy = (px - 1) / 2; r = k["delik_r"] * px
    return _hex(k["delik"]) if (x - cx) ** 2 + (y - cy) ** 2 <= r * r else _hex(k["zemin"])
def _izgara(x, y, px):
    k = P["D_IZGARA"]; return _hex(k["cizgi"]) if (x < k["cizgi_px"] or y < k["cizgi_px"]) else _hex(k["zemin"])
M["kafes"] = doku_mat("Kafes_Beyaz", P["D_KAFES"]["px"], _kafes)
M["demir"] = A.mat("Demir_Yesil", "#31574D")
M["kapi_ahsap"] = A.mat("Kapi_Kahverengi", "#795036")
M["izgara"] = doku_mat("Izgara_Yesil", P["D_IZGARA"]["px"], _izgara)
def uv_ata(ob):
    """Dokulu yüzlere düzlemsel UV: u = yatay teğet boyunca, v = z; karo boyu malzemeye göre."""
    olc = {M["kafes"].name: P["D_KAFES"]["karo_m"], M["izgara"].name: P["D_IZGARA"]["karo_m"]}
    idx = {i: olc[m.name] for i, m in enumerate(ob.data.materials) if m and m.name in olc}
    if not idx: return
    bm_ = bmesh.new(); bm_.from_mesh(ob.data); uvl = bm_.loops.layers.uv.verify()
    for f in bm_.faces:
        if f.material_index not in idx: continue
        n = f.normal; t = Vector((-n.y, n.x, 0))
        if t.length < 1e-6: continue
        t.normalize(); k_ = idx[f.material_index]
        for l in f.loops: l[uvl].uv = (l.vert.co.dot(t) / k_, l.vert.co.z / k_)
    bm_.to_mesh(ob.data); bm_.free()
def kutu(g_, x0, x1, y0, y1, z0, z1, m): g_.prism([Vector((x0, y0)), Vector((x1, y0)), Vector((x1, y1)), Vector((x0, y1))], z0, z1, m, m)
def halka(g_, c_, ri, ro, z0, z1, m, n=16): g_.lathe(c_, [(ri, z0), (ro, z0), (ro, z1), (ri, z1)], n, [m] * 3)
def minare_detay(g_, c_, z0):
    """D: 3 taş bilezik + şerefe korkuluğuna alt/üst silme (donmuş gövde kotlarına göre)."""
    h, cik, oran = P["D_BILEZIK"]; ztop_g = P["MIN_KUSAK_ALT"]; R0, R1 = RG, RG * P["MIN_GOVDE_UST_K"]
    zk = P["MIN_KUSAK_ALT"] + sum(hh for _, hh in P["MIN_KUSAK"]); zk2 = zk + P["MIN_KORKULUK"][1]
    Htop = zk2 + P["MIN_UST_GOVDE"][1] + P["MIN_BASLIK"][-1][1]
    for o in oran:
        zb = Htop * o
        if z0 + 0.3 < zb < ztop_g - 0.3: r = R0 + (R1 - R0) * (zb - z0) / (ztop_g - z0)
        elif zk2 + 0.3 < zb < zk2 + P["MIN_UST_GOVDE"][1] - 0.3: r = P["MIN_UST_GOVDE"][0] * RG
        else: continue
        halka(g_, c_, r - 0.02, r + cik, zb, zb + h, M["tugla"])
    sh, sc_ = P["D_KORKULUK_SILME"]; rk = P["MIN_KORKULUK"][0] * RG
    halka(g_, c_, rk - 0.02, rk + sc_, zk + 0.02, zk + 0.02 + sh, M["minare_ust_tas"])
    halka(g_, c_, rk - 0.02, rk + sc_, zk2 - 0.02 - sh, zk2 - 0.02, M["minare_ust_tas"])
def gecit(g_, c_):
    """D: batı minare kaidesini kuzey cepheye bağlayan çapraz merdiven geçidi (plan): kaidenin cepheye bakan çapraz yüzünden duvara."""
    hw = P["D_GECIT_W"] / 2; ap = P["MIN_BANTLI_YARIM"]; dvec = Vector((-1, 1)).normalized(); t = Vector((1, 1)).normalized()
    fc = c_ + dvec * ap; a, b = fc + t * hw, fc - t * hw; yw = -D / 2
    a2 = a + dvec * ((yw - a.y) / dvec.y); b2 = b + dvec * ((yw - b.y) / dvec.y)
    g_.prism([a, b, b2, a2], -0.2, P["MIN_BANTLI_H"], M["minare_beyaz"], M["minare_beyaz"])

XM1 = W / 2 - P["MIN_BANTLI_EKSEN"][0]; YM1 = -D / 2 - P["MIN_BANTLI_EKSEN"][1]
assert YM1 + P["MIN_BANTLI_PABUC"] < -D / 2, "bantlı kaide cepheye giriyor"
kx, ky = P["MIN_SADE_KAIDE"][:2]; XM2 = -(W / 2 - kx / 2); YM2 = -D / 2 - P["MIN_SADE_ARALIK"] - ky / 2
_, PR = minare_bantli("Minare_1", Vector((XM1, YM1)))     # kuzeybatı (+X = batı)
minare_sade("Minare_2", Vector((XM2, YM2)))              # kuzeydoğu

# ======================= v02 CEPHELER: kabuk + nişler + pencereler (cephe başına tek nesne) =======================
dn = P["D_NIS_DERIN"]; NW = P["D_NIS_W"]; Z_TEPE = P["DUVAR"] - P["D_NIS_TEPE_PAY"]; Z_KAB = P["DUVAR"] - P["D_SILME"][0]
tac = P["D_TAC"]; yk = P["D_YAN_KAPI"]; XN = P["D_BATI_NOTCH_X"]
def bolme_nisleri(sinir):
    return [(a + b) / 2 + sgn * (b - a) / 4 for a, b in zip(sinir[:-1], sinir[1:]) for sgn in (-1, 1)]
def yan_kapi_u(u, nisler):
    """Yan kapı: plan konumu; kalan nişlere 0,3 m'den fazla yaklaşmasın."""
    hw = yk["cerceve"][0] / 2
    for c in nisler:
        if c - NW / 2 - 0.3 < u + hw and u - hw < c + NW / 2 + 0.3:
            u = (c - NW / 2 - 0.3 - hw) if u < c else (c + NW / 2 + 0.3 + hw)
    return u
CEPHE = {   # ad: (O, T, N, u yarı uzunluk, niş merkezleri u)
    "Kuzey": (Vector((0, -D / 2)), Vector((1, 0)), Vector((0, -1)), W / 2 + P["D_NIS_DERIN"], P["D_KUZEY_PEN_X"]),
    "Guney": (Vector((0, D / 2)), Vector((-1, 0)), Vector((0, 1)), W / 2 + P["D_NIS_DERIN"], [c+sg*P["D_BATI_CIFT_ARALIK"] for c in CX for sg in (-1,1)]),
    "Dogu": (Vector((-W / 2, 0)), Vector((0, 1)), Vector((-1, 0)), D / 2 - 0.002, [cy+sg*P["D_BATI_CIFT_ARALIK"] for cy in CY for sg in (-1,1)]),
    "Bati": (Vector((W / 2, 0)), Vector((0, -1)), Vector((1, 0)), D / 2 - 0.002, [-cy+sg*P["D_BATI_CIFT_ARALIK"] for cy in CY for sg in (-1,1)]),
}
# Çıkıntı-pencere örtüşmesi: niş çokgenine göre söve dış sınırını denetle.
def inside_poly(pt,poly):
    x,y=pt; inside=False
    for (ax,ay),(bx,by) in zip(poly,poly[1:]+poly[:1]):
        if (ay>y)!=(by>y) and x<(bx-ax)*(y-ay)/(by-ay)+ax: inside=not inside
    return inside
boundary=sivri(P["D_BATI_NIS_W"],P["D_NIS_ALT"],Z_TEPE,n=8)
w,z0,zt=P["D_BATI_UST_PEN"];sv=P["D_SOVE"]
checks=[]
for sg in (-1,1):
    outline=kaydir(sivri(w+2*sv,z0-sv,zt+sv),sg*P["D_BATI_CIFT_ARALIK"])
    # Vertex and edge midpoint checks against actual polygonal arch.
    samples=outline+[((a[0]+b[0])/2,(a[1]+b[1])/2) for a,b in zip(outline,outline[1:]+outline[:1])]
    assert all(inside_poly(pt,boundary) for pt in samples),"Ust pencere sovesi kemer disina tasiyor"
    lower=kaydir(sivri(3.2,1.65,7.06,n=6),sg*P["D_BATI_CIFT_ARALIK"])
    assert all(inside_poly(pt,boundary) for pt in lower),"Alt pencere tasiyor"
    checks.append({"side":sg,"upper_outline_inside":True,"lower_outline_inside":True})
with open(os.path.join(KONTROL,"pencere_yerlesim_kontrol.json"),'w') as f:json.dump(checks,f,indent=2)

recess_cut=A.G("_Pencere_Oyuk_Kesici"); recess=A.G("Pencere_Girintileri")
sayac = {"nis": 0, "ust": 0, "alt": 0}; KAPI_U = {}; tw = tac["w"] / 2
for ad, (O, T, N, L, nisler) in CEPHE.items():
    g_ = A.G("Cephe_" + ad); dis_ = [(-L, 0.0), (L, 0.0), (L, Z_KAB), (-L, Z_KAB)]; atla_pen = set(); atla_nis = set()
    if ad == "Kuzey":
        zn = P["MIN_BANTLI_H"] + 0.3
        dis_ = [(-L, 0.0), (-tw, 0.0), (-tw, tac["h"]), (tw, tac["h"]), (tw, 0.0), (XN, 0.0), (XN, zn), (L, zn), (L, Z_KAB), (-L, Z_KAB)]
        for c in nisler:
            if abs(c) < tw + NW / 2: atla_nis.add(c)                    # taç kapı
            if c + NW / 2 > XN: atla_nis.add(c)                          # batı kaide + geçit önü
            if c - NW / 2 < XM2 + kx / 2 + 0.5: atla_pen.add(c)          # doğu minare önü: niş var, pencere yok
    if ad == "Kuzey": atla_nis.clear(); atla_pen.clear()
    if ad in ("Dogu","Bati"):
        KAPI_U[ad]=-6.4 if ad=="Dogu" else 6.4
        yan_merkezler=[cy if ad=="Dogu" else -cy for cy in CY]
    if ad=="Guney": yan_merkezler=list(CX)
    grup_genisligi=P["D_BATI_NIS_W"]
    delik = [kaydir(sivri(NW, P["D_NIS_ALT"], Z_TEPE), c) for c in nisler if c not in atla_nis]
    if ad=="Kuzey":
        # İkili üst kemerler tek, tabana kadar devam eden ortak girinti sınırıdır.
        def cift_nis(cl,cr,inset=0):
            width=4.5-2*inset; bottom=1.30+inset; top=15.8-inset
            left=kaydir(sivri(width,bottom,top,k=.55,n=8),cl)
            right=kaydir(sivri(width,bottom,top,k=.55,n=8),cr)
            mid=(cl+cr)/2
            return [left[0],right[1]]+right[2:]+[(mid+.18,10.9+inset),(mid-.18,10.9+inset)]+left[2:]
        groups=[(-27.4,-22.2),(-16.,-10.8),(10.8,16.)]
        delik=[cift_nis(a,b) for a,b in groups]
        delik.append(kaydir(sivri(6.2,1.30,13.5,k=.55,n=8),24.0))
    if ad in ("Bati","Dogu","Guney"):
        # Fotoğraf: dört geniş sağır kemer, her birinde iki üst pencere.
        delik=[kaydir(sivri(grup_genisligi,P["D_NIS_ALT"],Z_TEPE,n=8),c) for c in yan_merkezler]

    a_ = kabuk(g_, O, T, N, dis_, delik, dn, M["duvar"])
    if ad in ("Bati","Dogu","Guney"):
        for c in yan_merkezler:
            levha(g_,O,T,N,kaydir(sivri(grup_genisligi-0.06,P["D_NIS_ALT"]+0.03,Z_TEPE-0.03,n=8),c),0.005,0.015,M["nis"])
    if ad=="Kuzey":
        for ca,cb in groups: levha(g_,O,T,N,cift_nis(ca,cb,.03),.005,.015,M["nis"])
        levha(g_,O,T,N,kaydir(sivri(6.14,1.33,13.47,k=.55,n=8),24.0),.005,.015,M["nis"])
    sv = P["D_SOVE"]
    for c in nisler:
        if c in atla_nis: continue
        sayac["nis"] += 1
        if ad not in ("Bati","Dogu","Guney","Kuzey"): levha(g_, O, T, N, kaydir(sivri(NW - 0.06, P["D_NIS_ALT"] + 0.03, Z_TEPE - 0.03), c), 0.005, 0.015, M["nis"])
        if c in atla_pen: continue
        w, z0, zt_ = P["D_BATI_UST_PEN"] if ad in ("Bati","Dogu","Guney") else P["D_UST_PEN"]
        if ad=="Kuzey" and c>23: w,z0,zt_=1.85,8.65,11.95
        if ad=="Kuzey":
            outline=kaydir(sivri(w+2*sv,z0-sv,zt_+sv),c)
            assert any(all(inside_poly(pt,bound) for pt in outline) for bound in delik),"Kuzey pencere cercevesi ortak nis disinda"
        sc_ = P["D_SOVE_CIK"]
        kabuk_off(g_, O, T, N, kaydir(sivri(w + 2 * sv, z0 - sv, zt_ + sv), c), [kaydir(sivri(w, z0, zt_), c)], 0.03, sc_ - 0.03, M["mermer"])
        levha2(g_, O, T, N, kaydir(sivri(w - 0.02, z0 + 0.01, zt_ - 0.01), c), 0.04, 0.02, M["kafes"], M["mermer"]); sayac["ust"] += 1
        if ad=="Kuzey" and c < -25: continue
        if ad=="Guney" and abs(c)<5.5: continue
        if ad in ("Bati","Dogu") and abs(c-KAPI_U[ad])<5.5: continue
        w,z0,z1=P["D_ALT_PEN"]
        def rect2(hw,lo,hi): return [(c-hw,lo),(c+hw,lo),(c+hw,hi),(c-hw,hi)]
        # Dış duvardan geriye doğru gerçek dikdörtgen oyuk.
        outer=rect2(1.85,1.40,7.65)
        levha(recess_cut,O,T,N,outer,-0.72,1.10,M["duvar"])
        # En dış düz çerçeve yalnız mevcut niş yüzü kotuna kadar gelir.
        inner_rect=rect2(1.67,1.44,7.44)
        kabuk_off(recess,O,T,N,outer,[inner_rect],-0.69,0.705,M["duvar"])
        arch1=kaydir(sivri(3.10,1.46,7.08,n=8),c)
        kabuk_off(recess,O,T,N,inner_rect,[arch1],-0.68,0.54,M["duvar"])
        arch2=kaydir(sivri(2.84,1.48,6.91,n=8),c)
        kabuk_off(recess,O,T,N,arch1,[arch2],-0.67,0.42,M["duvar"])
        arch3=kaydir(sivri(2.60,1.50,6.75,n=8),c)
        kabuk_off(recess,O,T,N,arch2,[arch3],-0.66,0.30,M["duvar"])
        win_outer=rect2(w/2+sv,z0-sv,z1+sv)
        win_inner=rect2(w/2,z0,z1)
        kabuk_off(recess,O,T,N,arch3,[win_outer],-0.65,0.20,M["nis"])
        kabuk_off(recess,O,T,N,win_outer,[win_inner],-0.64,0.23,M["mermer"])
        levha(recess,O,T,N,win_inner,-0.49,0.06,M["pencere"])
        # Menfez ve doğramalar da yüzeyin gerisinde.
        levha(recess,O,T,N,kaydir(sivri(0.18,5.25,5.70,n=3),c),-0.44,0.025,M["pencere"])
        for k in range(1,6):
            u=c-w/2+k*w/6
            levha(recess,O,T,N,[(u-.021,z0),(u+.021,z0),(u+.021,z1),(u-.021,z1)],-.30,.045,M["demir"])
        for k in range(1,8):
            z=z0+k*(z1-z0)/8
            levha(recess,O,T,N,[(c-w/2,z-.021),(c+w/2,z-.021),(c+w/2,z+.021),(c-w/2,z+.021)],-.30,.045,M["demir"])
        for u in (c-w/2+.07,c,c+w/2-.07):
            levha(recess,O,T,N,[(u-.045,z0),(u+.045,z0),(u+.045,z1),(u-.045,z1)],-.39,.035,M["ahsap"])
        levha(recess,O,T,N,rect2(w/2+sv+.05,z0-sv-.10,z0-sv),-.63,.34,M["mermer"])
        sayac["alt"]+=1
    if ad in KAPI_U:   # yan kapı: kabuk yüzünün önünde
        cw, ch = yk["cerceve"]; kw, kh = yk["kanat"]; u = KAPI_U[ad]; gk = A.G("Kapi_" + ad)
        if ad in ("Bati","Dogu"):
            cw,ch,kw,kh=4.7,9.0,2.7,5.1
            outer=[(u-cw/2,0),(u+cw/2,0),(u+cw/2,ch),(u-cw/2,ch)]
            hole=kaydir(sivri(3.5,0.2,7.8,n=6),u)
            kabuk_off(gk,O,T,N,outer,[hole],0.04,0.65,M["mermer"])
            levha(gk,O,T,N,hole,0.025,0.04,M["nis"])
            for j in range(3):
                wi=3.1-j*0.28; top=7.55-j*0.28
                kabuk_off(gk,O,T,N,kaydir(sivri(wi,0.2,top,n=5),u),[kaydir(sivri(wi-0.15,0.27,top-0.12,n=5),u)],0.13+j*0.12,0.07,M["mermer"])
        else: levha(gk, O, T, N, kaydir(sivri(cw, 0.0, ch), u), dn, 0.12, M["mermer"])
        levha(gk, O, T, N, kaydir(sivri(kw, 0.0, kh), u), dn + 0.12, 0.04, M["kapi_ahsap"]); gk.obj()
    if ad=="Kuzey":
        for u in (-24.8,-13.4,13.4):
            levha(g_,O,T,N,[(u-.24,10.9),(u+.24,10.9),(u+.24,13.5),(u-.24,13.5)],dn,0.14,M["duvar"])
            levha(g_,O,T,N,[(u-.38,10.75),(u+.38,10.75),(u+.38,11.05),(u-.38,11.05)],dn,0.20,M["duvar"])
    print("KABUK", ad, "alan", round(a_, 1), "nis", len(delik))
    uv_ata(g_.obj())

# Kesiciler hem ana duvarı hem eski sığ niş dolgularını oyar.
cut=recess_cut.obj()
for ob in [bpy.data.objects["Govde"]]+[bpy.data.objects["Cephe_"+n] for n in CEPHE]:
    bpy.context.view_layer.objects.active=ob
    mod=ob.modifiers.new("Gercek_Pencere_Oyuklari",'BOOLEAN');mod.operation='DIFFERENCE';mod.solver='EXACT';mod.object=cut
    bpy.ops.object.modifier_apply(modifier=mod.name)
bpy.data.objects.remove(cut,do_unlink=True)
recess_obj=recess.obj(recalc=True)

# ======================= Mermer_Bant (kabuğun önünde) ve Silme_Ust (duvardan) =======================
bh, bc_ = P["D_BANT"]; sh_, sc2 = P["D_SILME"]
def seritler(bas, son, atla):
    out = [(bas, son)]
    for a, b in atla:
        yeni = []
        for x0, x1 in out:
            if b <= x0 or a >= x1: yeni.append((x0, x1)); continue
            if a > x0: yeni.append((x0, a))
            if b < x1: yeni.append((b, x1))
        out = yeni
    return [(a, b) for a, b in out if b - a > 0.05]
gb = A.G("Mermer_Bant"); Lx = W / 2 + dn + bc_; hk = yk["cerceve"][0] / 2
for a, b in seritler(-Lx, Lx, [(-tw, tw), (XN, Lx)]): kutu(gb, a, b, -D / 2 - dn - bc_, -D / 2 - dn, 0.0, bh, M["mermer"])
for a, b in seritler(-Lx, Lx, []): kutu(gb, a, b, D / 2 + dn, D / 2 + dn + bc_, 0.0, bh, M["mermer"])
Ly = D / 2 + dn - 0.002
for a, b in seritler(-Ly, Ly, [(KAPI_U["Dogu"] - hk, KAPI_U["Dogu"] + hk)]): kutu(gb, -W / 2 - dn - bc_, -W / 2 - dn, a, b, 0.0, bh, M["mermer"])
for a, b in seritler(-Ly, Ly, [(-KAPI_U["Bati"] - hk, -KAPI_U["Bati"] + hk)]): kutu(gb, W / 2 + dn, W / 2 + dn + bc_, a, b, 0.0, bh, M["mermer"])
gb.obj()
gs = A.G("Silme_Ust"); e_ = dn + sc2; Lx2 = W / 2 + e_
kutu(gs, -Lx2, Lx2, -D / 2 - e_, -D / 2, Z_KAB, P["DUVAR"], M["mermer"]); kutu(gs, -Lx2, Lx2, D / 2, D / 2 + e_, Z_KAB, P["DUVAR"], M["mermer"])
kutu(gs, -W / 2 - e_, -W / 2, -D / 2 + 0.002, D / 2 - 0.002, Z_KAB, P["DUVAR"], M["mermer"])
kutu(gs, W / 2, W / 2 + e_, -D / 2 + 0.002, D / 2 - 0.002, Z_KAB, P["DUVAR"], M["mermer"])
gs.obj()

# Giriş risaliti: merkezi mermer portalın iki yanında öne çıkan taş/mermer kütle.
giris=A.G("Giris_Cikintili_Blok")
for side in (-1,1):
    xa,xb=sorted((side*tw,side*8.3))
    kutu(giris,xa,xb,-D/2-1.45,-D/2-.27,0.02,8.5,M["mermer"])
    kutu(giris,xa,xb,-D/2-1.45,-D/2-.27,8.502,16.85,M["duvar"])
# Üstte tüm bloğu birleştiren yatay taç silmesi.
kutu(giris,-8.6,8.6,-D/2-1.65,-D/2-.27,16.852,17.08,M["mermer"])
giris.obj()

# ======================= Tac_Kapi (kuzey ortası): blok + derin sivri niş + mukarnas taklidi + kapı + merdiven =======================
gt = A.G("Tac_Kapi"); O, T, N = CEPHE["Kuzey"][:3]; nw = tac["nis_w"]; zb0 = tac["basamak"] * tac["basamak_h"]
nis = sivri(nw, zb0, tac["nis_tepe"])                     # [sol alt, sağ alt, sağ kenar ..., kemer, sol kenar]
nis_yol = [nis[0]] + nis[::-1][:-1]                       # sol alt → sol kenar yukarı → kemer → sağ kenar aşağı → sağ alt
dis_ = [(-tw, zb0)] + nis_yol + [(tw, zb0), (tw, tac["h"]), (-tw, tac["h"])]
levha(gt, O, T, N, dis_, 0.0, tac["cik"], M["mermer"])
# İçbükey kavsara: kenarlar dış ağızda (1.77), merkez geride (0.12).
# Pozitif ofset dışarıdır; merkezde ofset AZALMALI. Üstte oyuk sığlaşır.
zs_ = kemer_bas(nw, tac["nis_tepe"])
rows=8
for row in range(rows):
    z0=zs_+row*(tac["nis_tepe"]-zs_-.12)/rows
    z1=zs_+(row+1)*(tac["nis_tepe"]-zs_-.12)/rows
    rx0=max(.08,kemer_yari(nw,tac["nis_tepe"],z0)-.035)
    rx1=max(.04,kemer_yari(nw,tac["nis_tepe"],z1)-.035)
    dep0=1.65*(1-row/rows)**.65
    dep1=1.65*(1-(row+1)/rows)**.65
    count=max(3,13-row)
    for j in range(count):
        a0=math.pi*j/count+.009; a1=math.pi*(j+1)/count-.009
        am=(a0+a1)/2
        # Cepheye bakan oyuk yüzeyin ortası sarkıt biçiminde aşağı iner.
        xyz=[(rx0*math.cos(a0),1.77-dep0*math.sin(a0),z0),
             (rx0*math.cos(am),1.77-dep0*math.sin(am),z0-.14),
             (rx0*math.cos(a1),1.77-dep0*math.sin(a1),z0),
             (rx1*math.cos(a1),1.77-dep1*math.sin(a1),z1-.008),
             (rx1*math.cos(am),1.77-dep1*math.sin(am),z1-.008),
             (rx1*math.cos(a0),1.77-dep1*math.sin(a0),z1-.008)]
        front=[gt.bm.verts.new(P3(O,T,N,x,z,d)) for x,d,z in xyz]
        back=[gt.bm.verts.new(P3(O,T,N,x,z,d-.20)) for x,d,z in xyz]
        # Hücre içinde üçgen yüzeyler ışığı farklı açılarda yakalar.
        center=gt.bm.verts.new(P3(O,T,N,sum(p[0] for p in xyz)/6,
                         sum(p[2] for p in xyz)/6,sum(p[1] for p in xyz)/6-.10))
        for k in range(6):
            gt.F([front[k],front[(k+1)%6],center],M["mermer"])
            gt.F([front[k],back[k],back[(k+1)%6],front[(k+1)%6]],M["mermer"])
        gt.F(back[::-1],M["mermer"])
levha(gt, O, T, N, [(-nw / 2 + 0.03, zb0), (nw / 2 - 0.03, zb0), (nw / 2 - 0.03, zs_ - 0.02), (-nw / 2 + 0.03, zs_ - 0.02)], 0.005, 0.015, M["mermer"])
kw_, kh_ = tac["kapi"]
levha(gt, O, T, N, [(-kw_ / 2, zb0), (kw_ / 2, zb0), (kw_ / 2, zb0 + kh_), (-kw_ / 2, zb0 + kh_)], 0.03, 0.05, M["kapi_ahsap"])
yb = -D / 2 - dn - bc_                                    # merdiven arkası: mermer bandın önü
kutu(gt, -tw, tw, yb, -D / 2, 0.0, zb0, M["mermer"])       # eşik dolgusu (taç kapı altında duvar ile merdiven arası)
for i in range(tac["basamak"]):                           # basamaklar: her biri bir öncekinden dar ve sığ (kenarlar kademeli)
    hw_ = tac["basamak_w"] / 2 - i * tac["basamak_adim"]; dd = tac["basamak_d"] - i * tac["basamak_adim"] * 1.2
    kutu(gt, -hw_, hw_, yb - dd, yb, i * tac["basamak_h"], (i + 1) * tac["basamak_h"], M["mermer"])
for u in (-kw_/4,kw_/4):
    for zz in (zb0+0.30,zb0+kh_/2+0.1):
        ww=kw_/2-0.24; hh=kh_/2-0.38
        outer=[(u-ww/2,zz),(u+ww/2,zz),(u+ww/2,zz+hh),(u-ww/2,zz+hh)]
        inner=[(u-ww/2+0.06,zz+0.06),(u+ww/2-0.06,zz+0.06),(u+ww/2-0.06,zz+hh-0.06),(u-ww/2+0.06,zz+hh-0.06)]
        kabuk_off(gt,O,T,N,outer,[inner],0.085,0.04,M["kapi_ahsap"])
gt.obj()

# ======================= Kasnak_Pencereleri: her kasnakta 8 sivri pencere (her 3 yüzde bir), kasnaktan 3 cm önde =======================
kp_atla = []; kp_kisa = []; gk = A.G("Kasnak_Pencereleri"); pw_, ph_, pay, her = P["D_KASNAK_PEN"]; nK = P["KASNAK_N"]; apo = RK * math.cos(math.pi / nK)
for iy in range(NY):
    for ix in range(NX):
        bc = Vector((CX[ix], CY[iy])); ztp = KT[ix] - pay
        for j in range(0, nK, her):
            f = (j + 0.5) * 2 * math.pi / nK; Nn = Vector((math.cos(f), math.sin(f))); Tt = Vector((-Nn.y, Nn.x))
            pl_b = [q for _, q in bolme_yuz[(ix, iy)]]
            cati_alt = max(zarf_z(pl_b, *(bc + Nn * (apo + 0.06) + Tt * sg * pw_ / 2)) for sg in (-1, 0, 1))
            z_alt = max(ztp - ph_, cati_alt + 0.15)                                     # çatı yükseldiği yerde pencere alttan kısalır
            if ztp - z_alt < P["D_KASNAK_PEN_MIN"]: kp_atla.append((ix, iy, j)); continue   # çok kısalırsa yok
            if z_alt > ztp - ph_ + 1e-6: kp_kisa.append((ix, iy, j))
            levha2(gk, bc + Nn * apo, Tt, Nn, sivri(pw_, z_alt, ztp, n=2), 0.03, 0.03, M["kafes"], M["mermer"])
uv_ata(gk.obj())
print("KASNAK_PEN_ATLANAN", len(kp_atla), kp_atla, "KISALAN", len(kp_kisa))
print("SAYAC", json.dumps(sayac), "KAPI_U", json.dumps({k: round(v, 2) for k, v in KAPI_U.items()}))

# Maket referansındaki iç içe portal silmeleri; bağımsız kapalı hacimler.
gp = A.G("Portal_Silmeleri")
for inset in (0.20, 0.48, 0.76):
    half=tac["w"]/2-inset; top=tac["h"]-inset
    depth=tac["cik"]+0.07+(0.76-inset)*0.12
    for sign in (-1,1):
        x=sign*half
        kutu(gp,x-0.06,x+0.06,-D/2-depth,-D/2-tac["cik"]+0.015,zb0,top,M["mermer"])
    kutu(gp,-half,half,-D/2-depth,-D/2-tac["cik"]+0.015,top-0.12,top,M["mermer"])
gp.obj()
# Yeni fotoğraflar: cam şadırvan kubbesi ve metal kaburgaları.
cam_mat=A.mat("Sadirvan_Cam", "#52636A", rough=0.22,metal=0.32)
metal_mat=A.mat("Kubbe_Metal_Iskelet", "#B6B4A7",rough=0.48,metal=0.35)
ob=bpy.data.objects["Sadirvan_Kubbe"]
for slot in ob.material_slots:
    if slot.material==M["kubbe"]: slot.material=cam_mat
rib=A.G("Sadirvan_Iskeleti")
def cubuk(g,a,b,r,m):
    a,b=Vector(a),Vector(b); axis=(b-a).normalized()
    u=axis.cross(Vector((0,0,1)))
    if u.length<0.01: u=axis.cross(Vector((0,1,0)))
    u.normalize(); v=axis.cross(u)
    rings=[]
    for c0 in (a,b): rings.append([g.bm.verts.new(c0+r*(u*math.cos(k*math.pi/2)+v*math.sin(k*math.pi/2))) for k in range(4)])
    g.F(rings[0][::-1],m);g.F(rings[1],m)
    for k in range(4):g.F([rings[0][k],rings[0][(k+1)%4],rings[1][(k+1)%4],rings[1][k]],m)
ix,iy=P["ACIK"]; cx,cy=CX[ix],CY[iy]
profile=kubbe_profil(ix)
for j in range(24):
    a=j*2*math.pi/24
    pts=[(cx+(r+0.035)*math.cos(a),cy+(r+0.035)*math.sin(a),z+0.04) for r,z in profile[3:]]
    for a0,b0 in zip(pts[:-1],pts[1:]): cubuk(rib,a0,b0,0.045,metal_mat)
for r,z in profile[5:-1:2]:
    pts=[(cx+(r+0.04)*math.cos(j*2*math.pi/48),cy+(r+0.04)*math.sin(j*2*math.pi/48),z+0.04) for j in range(48)]
    for j in range(48): cubuk(rib,pts[j],pts[(j+1)%48],0.035,metal_mat)
rib.obj()
# İnce tuğla deseni yalnız minare gövdesinde. Fotoğraf dokusu kullanılmaz.
def brick(x,y,n):
    row=y//32; xx=(x+(32 if row%2 else 0))%64
    if y%32<2 or xx<2: return _hex("#B8A78E")
    return _hex("#986B4D")
bm=doku_mat("Minare_Tugla_Derzi",128,brick)
for name,center in [("Minare_1",(XM1,YM1)),("Minare_2",(XM2,YM2))]:
    ob=bpy.data.objects[name]
    ids=[i for i,m in enumerate(ob.data.materials) if m==M["tugla"]]
    for i in ids: ob.data.materials[i]=bm
    uv=ob.data.uv_layers.active or ob.data.uv_layers.new(name="UVMap")
    for face in ob.data.polygons:
        if face.material_index not in ids: continue
        angles=[math.atan2(ob.data.vertices[ob.data.loops[li].vertex_index].co.y-center[1],ob.data.vertices[ob.data.loops[li].vertex_index].co.x-center[0]) for li in face.loop_indices]
        if max(angles)-min(angles)>math.pi: angles=[a+2*math.pi if a<0 else a for a in angles]
        for li,a in zip(face.loop_indices,angles):
            co=ob.data.vertices[ob.data.loops[li].vertex_index].co
            uv.data[li].uv=(a*RG/1.28,co.z/0.64)

# Kullanıcı referansı: düşük kontrastlı, şaşırtmalı dikdörtgen taş örgüsü.
# Tonlar ana taş rengine %24 karıştırılır; duvar opak kalır.
def stone_shader(name,base_hex):
    base=np.array(_hex(base_hex)); palette=["#B8B8AE","#CDAE9A","#D8CDB8","#AFA795","#C2B5A2","#D5C4A8"]
    def tile(x,y,n):
        row=y//32; shift=32*(row%2); col=((x+shift)%n)//64
        seed=(row*97+col*53+row*col*19)%len(palette)
        mix=base*.76+np.array(_hex(palette[seed]))*.24
        # Çok ince, yumuşak derz; fotoğraf dokusu ve belirgin kabartma yok.
        if y%32<1 or (x+shift)%64<1: mix=base*.93
        return [float(c) for c in mix]
    return doku_mat(name,512,tile)
stone_wall=stone_shader("Tas_Orgusu_Hafif","#C8BAA2")
stone_niche=stone_shader("Tas_Orgusu_Nis","#B9AC96")
for ob in bpy.data.objects:
    if ob.type!='MESH': continue
    idx={i for i,m in enumerate(ob.data.materials) if m in (M["duvar"],M["nis"])}
    if not idx: continue
    for i in idx: ob.data.materials[i]=stone_wall if ob.data.materials[i]==M["duvar"] else stone_niche
    uv=ob.data.uv_layers.active or ob.data.uv_layers.new(name="UVMap")
    for face in ob.data.polygons:
        if face.material_index not in idx: continue
        n=face.normal
        for li in face.loop_indices:
            co=ob.matrix_world@ob.data.vertices[ob.data.loops[li].vertex_index].co
            # Baskın eksene göre dünya ölçekli UV, bitişik yüzlerde tutarlı derzler.
            if abs(n.z)>.8: u,v=co.x,co.y
            elif abs(n.y)>=abs(n.x): u,v=co.x,co.z
            else: u,v=co.y,co.z
            uv.data[li].uv=(u/8.0,v/8.0)

e = bpy.data.objects.new("Merkez", None); bpy.context.scene.collection.objects.link(e)
R = A.kontrol_hepsi(KONTROL, AD)
print("RAPOR", json.dumps(R, ensure_ascii=False))
mesh_objs = [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin"))]
dc = sum(len({p.material_index for p in o.data.polygons}) for o in mesh_objs)
print("DRAWCALL", dc, "NESNE", len(mesh_objs))
bpy.ops.wm.save_as_mainfile(filepath=BLEND)

# ======================= AO + görüntüler + dışa aktarım =======================
A.ao_vertex(samples=32)
for o in [o for o in bpy.data.objects if o.type == "MESH" and o.data.color_attributes.get("AO")]:
    tb_ = P["D_AO_TABAN"].get(o.name, P["D_AO_TABAN"]["varsayilan"])     # seyrek köşeli büyük yüzlerde (kasnak) AO tüm yüze yayılmasın
    for d_ in o.data.color_attributes["AO"].data:
        c_ = tb_ + (1 - tb_) * d_.color[0]; d_.color = (c_, c_, c_, 1.0)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.80, 0.80, 0.80, 1); bg.inputs[1].default_value = 1.0
sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = 1.25; sun.data.angle = math.radians(35); sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
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
# Stil kaidesi, bina GLB dosyasından ayrı tutulur.
for ob in list(bpy.data.objects):
    if ob.name.startswith("Zemin"): bpy.data.objects.remove(ob,do_unlink=True)
def disk(name, sx, sy, depth, z, color):
    bpy.ops.mesh.primitive_cylinder_add(vertices=96,radius=1,depth=depth,location=(0,0,z))
    ob=bpy.context.object; ob.name=name; ob.scale=(sx,sy,1)
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    ob.data.materials.append(A.mat(name,color))
    bevel=ob.modifiers.new("Yumusak_Kenar",'BEVEL'); bevel.width=0.18; bevel.segments=3
    ob.modifiers.new("Agirlikli_Normal",'WEIGHTED_NORMAL')
disk("Zemin_Golge",53,48,0.18,-1.15,"#E29B87")
disk("Zemin_Kaide",51,46,0.85,-0.65,"#E9E3D3")
disk("Zemin_Cim",49.8,44.8,0.12,-0.16,"#A0B46C")
bgc = np.array([0.80, 0.80, 0.80], np.float32)
el = math.radians(P["MAKET_EGIM"]); k = P["MAKET_CEPHE_PX"] / W; (bx, by) = P["MAKET_TABAN"]; (iw, ih) = P["MAKET_BOY"]
v = Vector((0, math.cos(el), -math.sin(el))); u = Vector((0, math.sin(el), math.cos(el)))
C = Vector((0, -D / 2, 0)) + Vector((-(bx - iw / 2) / k, 0, 0)) + u * ((by - ih / 2) / k) - v * 300
kamera(tuple(C), rot=(math.pi / 2 - el, 0, 0), ortho=iw / k); render(AD + "_orto_render.png", (iw, ih), saydam=True)
mk = yukle(MAKET, (iw, ih)); rn = yukle(os.path.join(KONTROL, AD + "_orto_render.png")); al_ = rn[..., 3:4]
rnb = rn.copy(); rnb[..., :3] = rn[..., :3] * al_ + bgc * (1 - al_); rnb[..., 3] = 1
yaz(np.concatenate([mk, np.ones((ih, 16, 4), np.float32), rnb], axis=1), os.path.join(KONTROL, AD + "_kuzey_orto.png"))
kamera((110, -145, 118), tgt=(0, 0, 20), ortho=130); render(AD + "_hava_kuzeybati.png", (1800, 1600), saydam=True)
kamera((6, -58, 7.5), tgt=(0, -D / 2, 8.5), lens=35); render(AD + "_tac_kapi.png", (1000, 1100))
kamera((2.8,-39,7.7),tgt=(0,-28.3,9.5),lens=52); render(AD+"_kavsara_yakin.png",(1200,1400))
bc1 = tepeler[1][0]
kamera((bc1.x + 5, bc1.y - 13, KT[1] - 2.3), tgt=(bc1.x, bc1.y, KT[1] + 0.8), lens=30); render(AD + "_kubbe_yakin.png", (1100, 800))
kamera((W/2+68,-47,23),tgt=(W/2,0,10),lens=45); render(AD+"_bati_cephe.png",(1800,1200))
kamera((23,-62,19),tgt=(0,-D/2,8),lens=48); render(AD+"_giris_yan.png",(1400,1400))
kamera((5,-D/2-16,6),tgt=(9,-D/2,5.5),lens=48); render(AD+"_pencere_detay.png",(1400,1200))
kamera((XM1+10,YM1-18,38.8),tgt=(XM1,YM1,39.2),lens=68); render(AD+"_serefe_yakin.png",(1600,1400))
kamera((XM1+15,YM1-22,26),tgt=(XM1,YM1,37),lens=42); render(AD+"_minare_detay.png",(1100,1400))
kamera((0,D/2+95,20),tgt=(0,D/2,9),ortho=77); render(AD+"_arka_cephe.png",(1800,950))
kamera((-W / 2 - 62, -16, 16), tgt=(-W / 2, -4, 10), lens=35); render(AD + "_dogu.png", (1400, 800))
os.makedirs(os.path.join(ESER, "export"), exist_ok=True)
GLB = os.path.join(ESER, "export", "ulu-cami_gpt_v14.glb")

boy = A.disa_aktar(GLB, draco=True)
print("GLB", GLB, boy)
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.data.objects:
    if ob.type=='MESH' and not ob.name.startswith(('_','REF')): ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=os.path.join(ESER,"export","ulu-cami_gpt_v14_sunum.glb"),export_format='GLB',use_selection=True,export_apply=True,export_yup=True)
kamera((110,-145,118),tgt=(0,0,20),ortho=130)
sc.render.resolution_x=1800; sc.render.resolution_y=1600; sc.render.film_transparent=True
R["draw_calls"]=dc; R["glb_bytes"]=boy; R["source_geometry"]="GPT v01 + kullanıcının 9 fotoğrafı"
with open(os.path.join(KONTROL,"teslim_raporu.json"),'w') as f: json.dump(R,f,ensure_ascii=False,indent=2)
bpy.ops.file.pack_all()
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
