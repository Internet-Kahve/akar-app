# Bursa Ulucami · v01e — son kütle turu. Pencere, taç kapı, silme, kasnak penceresi YOK.
# Çalıştır: blender -b --python 3d-eser/bursa/ulu-cami/build_v01e.py
# Eksenler: Z yukarı; kuzey = -Y; +X = batı. Orijin: zemin ortası. Bütün sayılar P'den okunur.
# Parçalar: Govde, Cati, Kubbeler_19, Sadirvan_Kubbe, Alemler, Minare_1, Minare_2, Zemin, Merkez
import sys, os, json, math
ESER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(ESER, "..", "..", "_kutuphane"))
import bpy, bmesh, akar3d as A
import numpy as np
from mathutils import Vector, Matrix

P = {
    # plan (DEĞİŞMEZ)
    "W": 70.0, "D": 56.0, "NX": 5, "NY": 4, "BOLME": 14.0,
    "DUVAR": 17.3,
    # kotlar: Miniatürk maketi (21,4 px/m; kamera ≈ 6° yukarıdan, derinlik düzeltmeli). Sütun: uç, ara, orta, ara, uç
    "AYAK": [19.3, 19.4, 20.1, 19.4, 19.3],         # çatı-kasnak birleşim kotu (kasnağın iç tarafında, eksende)
    "ETEK_ALT": [21.85, 23.1, 24.65, 23.1, 21.85],   # kubbe eteğinin alt kenarı
    "A": [3.35, 3.8, 4.45, 3.8, 3.35],               # kubbe yüksekliği: etek alt kenarından tepeye (alem hariç)
    # kasnak / kubbe
    "KASNAK_R": 6.5, "KASNAK_N": 24, "KUBBE_SEG": 24,
    "ETEK_TASMA_K": 0.6,      # profilde r > R kısmının katsayısı (0,7 m taşma → 0,42 m; 14 m bölmede komşu etekler kesişmesin)
    "KUBBE_PROFIL": [         # (r, z), orta sütun için; z = kasnak üstünden. Diğer sütunlarda z × A/6,32
        (6.50, 0.00), (7.20, -0.12), (7.25, 0.10), (6.90, 0.35), (6.65, 0.70), (6.70, 1.20),
        (6.40, 2.40), (5.70, 3.60), (4.50, 4.70), (2.80, 5.60), (1.20, 6.05), (0.00, 6.20)],
    "KUBBE_PROFIL_A": 6.32,   # profilin etek alt kenarından tepeye yüksekliği
    "ACIK": (2, 1),
    # çatı
    "CATI_EGIM": 30.0,        # bölme içi kırma eğimi (°)
    "GECIS_W": 0.6,           # sütunlar arası eğimli geçiş şeridi genişliği (m)
    "PLATO_ICERI": 1.6,       # kırma tepesindeki düz plato, kenardan içeri; köşeleri kasnak halkasının DIŞINDA kalmalı (çakışma)
    "BANT_EGIM": 65.0,        # dış kenar kurşun bandı eğimi (°)
    "SACAK_TASMA": 0.35, "SACAK_KALINLIK": 0.15,
    # alem (kubbe)
    "ALEM": [(0.12, -0.05), (0.12, 0.2), (0.25, 0.45), (0.1, 0.7), (0.0, 1.5)],
    # minare (maket; D = alt gövde Ø)
    "MIN_D": 5.3, "MIN_GOVDE_UST_R": 2.55, "MIN_KUSAK_ALT": 36.6,
    "MIN_KUSAK": [(1.08, 1.57), (1.14, 1.57), (1.20, 1.56)],    # 3 kademe: (r/(D/2), yükseklik) aşağıdan yukarı
    "MIN_KORKULUK": (1.43, 1.5),                                # (Ø/D, yükseklik)
    "MIN_UST_GOVDE": (0.81, 6.4),                               # (Ø/D, yükseklik), tuğla
    "MIN_BASLIK": [  # (r, dz) üst gövde bitişinden yukarı; açık taş; alem başlıkla aynı malzeme
        (2.65, 0.0), (2.65, 0.5), (2.0, 1.2), (1.55, 2.0),                 # ince halka + konik geçiş
        (1.8, 2.6), (2.0, 3.4), (1.9, 4.2), (1.4, 4.8),                    # büyük soğan (Ø 4,0)
        (0.8, 5.1), (0.8, 5.4),                                           # boyun (Ø 1,6)
        (1.2, 5.8), (1.35, 6.5), (1.2, 7.2), (0.7, 7.8),                  # küçük soğan (Ø 2,7)
        (0.4, 8.1), (0.35, 9.1), (0.12, 10.2), (0.05, 11.5), (0.0, 11.7)],  # ince uç + alem
    "MIN_BANTLI_KAIDE": [(3.98, -0.2, "B"), (3.9, 1.0, "B"), (3.9, 7.2, "B"), (3.9, 7.9, "K"),   # taban pabucu küçük: cepheye girmesin
                         (3.9, 8.8, "B"), (3.9, 9.5, "K"), (3.9, 15.0, "B")],
    # minare yerleşimi: Ayverdi rölöve planı (24,55 px/m)
    "MIN_BANTLI_EKSEN": (2.4, 3.7),   # batı minare ekseni: batı duvarından içeri, kuzey cepheden öne (m); kaide köşeden batıya ve kuzeye taşar
    "MIN_SADE_ARALIK": 0.9,           # doğu kare kaide ile kuzey cephe arası boşluk (m); dış kenar doğu duvarıyla hizalı
    "MIN_SADE_KAIDE": (7.4, 4.6, 3.7, 3.2, 6.1),   # kare kenar, kare h, geçiş alt r, geçiş üst r, geçiş üst z
    # karşılaştırma kamerası (maket fotoğrafı)
    "MAKET_EGIM": 6.0, "MAKET_PX_M": 1500 / 70.0, "MAKET_TABAN": (1012, 1335), "MAKET_BOY": (2000, 1500),
}

KONTROL = os.path.join(ESER, "kontrol"); BLEND = os.path.join(ESER, "ulu-cami_v01e.blend")
MAKET = os.path.join(ESER, "ref-mg2", "Miniaturk_Bursa_Ulu_Cami_-_Bursa_Grand_Mosque.jpeg")
W, D, NX, NY, B_ = P["W"], P["D"], P["NX"], P["NY"], P["BOLME"]
s = math.tan(math.radians(P["CATI_EGIM"])); tb = math.tan(math.radians(P["BANT_EGIM"]))
ZS = P["DUVAR"] + P["SACAK_KALINLIK"]                     # saçak üstü = bandın başladığı kot
RK = P["KASNAK_R"]
ZO = [a - s * (B_ / 2 - RK) for a in P["AYAK"]]          # sütun oluk kotu
KS = [P["A"][i] / P["KUBBE_PROFIL_A"] for i in range(NX)]
KT = [P["ETEK_ALT"][i] + 0.12 * KS[i] for i in range(NX)]  # kasnak üst kotu (etek alt kenarı profilde -0,12)

A.temizle()
M = A.palet({"duvar": "#D4BE96", "kasnak": "#E2C77E", "kubbe": "#A9B4C2", "cati": "#9AA2AC",
             "mermer": "#ECE8DF", "minare_tugla": "#A65A43", "pencere": "#4A5A66", "alem": "#DCA320",
             "alem_kursun": "#6B7480", "mermer_koyu": "#5E6670"})
_b = next(n for n in M["alem_kursun"].node_tree.nodes if n.type == "BSDF_PRINCIPLED")
_b.inputs["Metallic"].default_value = 0.6; _b.inputs["Roughness"].default_value = 0.4
c0 = Vector((0, 0))

z = A.G("Zemin"); z.prism(A.rect(Vector((0, -6)), 86, 76), -1.0, 0.0, M["zemin"], M["zemin"]); z.obj()
g = A.G("Govde"); g.prism(A.rect(c0, W, D), -0.2, P["DUVAR"], M["duvar"], M["duvar"]); g.obj()

# ======================= Cati: düzlemlerin alt zarfı (bölge başına), kapalı mesh =======================
xs = [-W / 2 + B_ * i for i in range(NX + 1)]; ys = [-D / 2 + B_ * j for j in range(NY + 1)]
gw = P["GECIS_W"] / 2
def kenar_duz(z0, yon, k, egim):
    """Kenardan içeri doğru yükselen düzlem z = z0 + egim·d; yon: 'xL','xR','yB','yT', k = kenar koordinatı."""
    if yon == "xL": return (egim, 0.0, z0 - egim * k)
    if yon == "xR": return (-egim, 0.0, z0 + egim * k)
    if yon == "yB": return (0.0, egim, z0 - egim * k)
    return (0.0, -egim, z0 + egim * k)
def bolge_bolme(ix, iy):
    xL = xs[ix] + (gw if ix > 0 else 0); xR = xs[ix + 1] - (gw if ix < NX - 1 else 0)
    yB, yT = ys[iy], ys[iy + 1]; zo = ZO[ix]; d0 = (zo - ZS) / tb; pl = []
    for yon, k, dis in (("xL", xL, ix == 0), ("xR", xR, ix == NX - 1), ("yB", yB, iy == 0), ("yT", yT, iy == NY - 1)):
        if dis:
            pl.append(kenar_duz(ZS, yon, k, tb))                    # dış kurşun bant
            pl.append(kenar_duz(zo - s * d0, yon, k, s))            # bandın üstünden kırma
        else:
            pl.append(kenar_duz(zo, yon, k, s))                     # oluktan kırma
    pl.append((0.0, 0.0, zo + s * P["PLATO_ICERI"]))
    return [(xL, yB), (xR, yB), (xR, yT), (xL, yT)], pl
def bolge_gecis(i, iy):
    x0, x1 = xs[i] - gw, xs[i] + gw; yB, yT = ys[iy], ys[iy + 1]
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
def alan(p): return abs(sum(p[i][0] * p[(i + 1) % len(p)][1] - p[(i + 1) % len(p)][0] * p[i][1] for i in range(len(p)))) / 2
def zarf(rect, pl):
    uniq = []
    for q in pl:
        if not any(max(abs(q[i] - u[i]) for i in range(3)) < 1e-9 for u in uniq): uniq.append(q)
    yuz = []
    for k, (ak, bk, ck) in enumerate(uniq):
        poly = list(rect)
        for j, (aj, bj, cj) in enumerate(uniq):
            if j != k and poly: poly = kirp(poly, ak - aj, bk - bj, ck - cj)
        temiz = []
        for p in poly:
            if not temiz or math.dist(p, temiz[-1]) > 1e-7: temiz.append(p)
        if len(temiz) > 2 and math.dist(temiz[0], temiz[-1]) < 1e-7: temiz.pop()
        if len(temiz) >= 3 and alan(temiz) > 1e-6:
            yuz.append([(x, y, ak * x + bk * y + ck) for x, y in temiz])
    return yuz
def zarf_z(pl, x, y): return min(a * x + b * y + c for a, b, c in pl)

polys = []; bolme_pl = {}
for ix in range(NX):
    for iy in range(NY):
        r, pl = bolge_bolme(ix, iy); bolme_pl[(ix, iy)] = pl; polys += zarf(r, pl)
for i in range(1, NX):
    for iy in range(NY):
        r, pl = bolge_gecis(i, iy); polys += zarf(r, pl)
# saçak: duvarın dışına taşan düz levha (üst ZS), dik kenar, alt yüz DUVAR kotunda
t_ = P["SACAK_TASMA"]; ic = [(-W/2, -D/2), (W/2, -D/2), (W/2, D/2), (-W/2, D/2)]
dis = [(-W/2 - t_, -D/2 - t_), (W/2 + t_, -D/2 - t_), (W/2 + t_, D/2 + t_), (-W/2 - t_, D/2 + t_)]
for i in range(4):
    j = (i + 1) % 4
    polys.append([(*ic[i], ZS), (*dis[i], ZS), (*dis[j], ZS), (*ic[j], ZS)])
    polys.append([(*dis[i], ZS), (*dis[i], P["DUVAR"]), (*dis[j], P["DUVAR"]), (*dis[j], ZS)])
polys.append([(*p, P["DUVAR"]) for p in dis])
# T-birleşim düzeltme: her kenarın üstüne düşen başka köşeleri kenara ekle
tum = {}
for p in polys:
    for v in p: tum[(round(v[0], 5), round(v[1], 5), round(v[2], 5))] = v
izgara = {}
for v in tum.values(): izgara.setdefault((int(math.floor(v[0])), int(math.floor(v[1]))), []).append(v)
def kenar_ustu(a, b):
    xa, xb = sorted((a[0], b[0])); ya, yb = sorted((a[1], b[1])); L = math.dist(a, b); out = []
    for gx in range(int(math.floor(xa)) - 1, int(math.floor(xb)) + 2):
        for gy in range(int(math.floor(ya)) - 1, int(math.floor(yb)) + 2):
            for v in izgara.get((gx, gy), ()):
                t = sum((v[k] - a[k]) * (b[k] - a[k]) for k in range(3)) / (L * L)
                if 1e-6 < t < 1 - 1e-6:
                    pr = [a[k] + t * (b[k] - a[k]) for k in range(3)]
                    if math.dist(pr, v) < 1e-4: out.append((t, v))
    return [v for _, v in sorted(out)]
cati = A.G("Cati"); vc = {}
def CV(v):
    k = (round(v[0], 4), round(v[1], 4), round(v[2], 4))
    if k not in vc: vc[k] = cati.bm.verts.new(v)
    return vc[k]
for p in polys:
    yeni = []
    for i in range(len(p)):
        yeni.append(p[i]); yeni += kenar_ustu(p[i], p[(i + 1) % len(p)])
    vs = []
    for v in yeni:
        bv = CV(v)
        if not vs or vs[-1] is not bv: vs.append(bv)
    if len(vs) > 1 and vs[0] is vs[-1]: vs.pop()
    cati.F(vs, M["cati"])
cati.obj()

# ======================= Kubbe + kasnak: bölme başına TEK kapalı mesh =======================
def kubbe_profil(ix):
    k = KS[ix]; out = []
    for r, zz in P["KUBBE_PROFIL"]:
        if r > RK: r = RK + P["ETEK_TASMA_K"] * (r - RK)
        out.append((r, KT[ix] + k * zz))
    return out
def bolme(g_, ix, iy):
    bc = Vector(((ix - (NX - 1) / 2) * B_, (iy - (NY - 1) / 2) * B_))
    n = P["KASNAK_N"]; ring = A.ccw(A.circle(bc, RK, n, 0.0)); zt = KT[ix]; pl = bolme_pl[(ix, iy)]
    b = [g_.V(q, zarf_z(pl, q.x, q.y) - 0.05) for q in ring]; t = [g_.V(q, zt) for q in ring]
    for i in range(n):
        j = (i + 1) % n; g_.F([b[i], b[j], t[j], t[i]], M["kasnak"])
    g_.F(b[::-1], M["kasnak"])
    g_.lathe(bc, kubbe_profil(ix), P["KUBBE_SEG"], [M["kubbe"]] * 40)
    g_.bm.faces.ensure_lookup_table(); cap = g_.bm.faces[-1]      # lathe taban kapağı: kasnağın üstünde, silinir
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

# ======================= Minareler: biçim maketten, yerleşim Ayverdi rölöve planından =======================
def govde_basi(g_, c_, z0):
    T, TU = M["minare_tas"], M["minare_tugla"]; R = P["MIN_D"] / 2
    prof = [(R, z0, TU), (P["MIN_GOVDE_UST_R"], P["MIN_KUSAK_ALT"], TU)]
    zz = P["MIN_KUSAK_ALT"]
    for rk, h in P["MIN_KUSAK"]:                                   # ters basamak: her kademe biraz daha geniş
        prof += [(R * rk, zz, TU), (R * rk, zz + h, TU)]; zz += h
    rkor = P["MIN_KORKULUK"][0] * P["MIN_D"] / 2
    prof += [(rkor, zz, T), (rkor, zz + P["MIN_KORKULUK"][1], T)]; zz += P["MIN_KORKULUK"][1]
    ru = P["MIN_UST_GOVDE"][0] * P["MIN_D"] / 2
    prof += [(ru, zz, T), (ru, zz + P["MIN_UST_GOVDE"][1], TU)]; zz += P["MIN_UST_GOVDE"][1]
    for r, dz in P["MIN_BASLIK"]:
        prof.append((r, zz + dz, T))
    g_.lathe(c_, [(r, h) for r, h, _ in prof], 16, [m for _, _, m in prof[1:]])
    return prof
def minare_bantli(ad, c_):
    g_ = A.G(ad); mm = {"B": M["mermer"], "K": M["mermer_koyu"]}; kp = P["MIN_BANTLI_KAIDE"]
    g_.lathe(c_, [(r, zz) for r, zz, _ in kp], 8, [mm[m] for _, _, m in kp[1:]])
    bmesh.ops.rotate(g_.bm, cent=(c_.x, c_.y, 0), matrix=Matrix.Rotation(math.pi / 8, 3, 'Z'), verts=g_.bm.verts)
    pr = govde_basi(g_, c_, kp[-1][1]); return g_.obj(), pr
def minare_sade(ad, c_):
    g_ = A.G(ad); T = M["minare_tas"]; kw, kh, r0, r1, z1 = P["MIN_SADE_KAIDE"]
    g_.prism(A.rect(c_, kw, kw), -0.2, kh, T, T)
    g_.lathe(c_, [(r0, kh), (r1, z1)], 8, [T])
    pr = govde_basi(g_, c_, z1); return g_.obj(), pr
XB = W / 2 - P["MIN_BANTLI_EKSEN"][0]; YB = -D / 2 - P["MIN_BANTLI_EKSEN"][1]
assert YB + P["MIN_BANTLI_KAIDE"][0][0] * math.cos(math.pi / 8) < -D / 2, "bantlı kaide cepheye giriyor"
kws = P["MIN_SADE_KAIDE"][0] / 2; XS = W / 2 - kws; YS = -D / 2 - P["MIN_SADE_ARALIK"] - kws
_, PR = minare_bantli("Minare_1", Vector((XB, YB)))      # kuzeybatı (+X = batı), maket fotoğrafında sağda
minare_sade("Minare_2", Vector((-XS, YS)))               # kuzeydoğu, maket fotoğrafında solda

e = bpy.data.objects.new("Merkez", None); bpy.context.scene.collection.objects.link(e)

R = A.kontrol_hepsi(KONTROL, "v01e")
print("RAPOR", json.dumps(R, ensure_ascii=False))
zserefe = [h for r, h, m in PR if m is M["minare_tas"]][0]
print("OLCU", json.dumps({"kasnak_ust": [round(x, 2) for x in KT], "tepe": [round(t, 2) for _, t in tepeler[:5]],
      "oluk": [round(x, 2) for x in ZO], "minare_tepe": round(PR[-1][1], 2), "serefe_alt": round(zserefe, 2),
      "serefe_oran": round(zserefe / PR[-1][1], 3)}))
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

# maketle aynı ölçek ve taban çizgisi: ortografik, maket kamerası gibi ≈6° yukarıdan
el = math.radians(P["MAKET_EGIM"]); k = P["MAKET_PX_M"]; (bx, by) = P["MAKET_TABAN"]; (iw, ih) = P["MAKET_BOY"]
v = Vector((0, math.cos(el), -math.sin(el))); u = Vector((0, math.sin(el), math.cos(el)))
p0 = Vector((0, -D / 2, 0))
C = p0 + Vector((-(bx - iw / 2) / k, 0, 0)) + u * ((by - ih / 2) / k) - v * 300
kamera(tuple(C), rot=(math.pi / 2 - el, 0, 0), ortho=iw / k)
render("v01e_orto_maket.png", (iw, ih), saydam=True)
def yukle(p, boy=None):
    im = bpy.data.images.load(p)
    if boy: im.scale(*boy)
    a = np.array(im.pixels[:], dtype=np.float32).reshape(im.size[1], im.size[0], 4); bpy.data.images.remove(im); return a
def yaz(a, p):
    im = bpy.data.images.new("_o", a.shape[1], a.shape[0], alpha=True); im.pixels = a.ravel()
    im.filepath_raw = p; im.file_format = 'PNG'; im.save(); bpy.data.images.remove(im)
mk = yukle(MAKET, (iw, ih)); rn = yukle(os.path.join(KONTROL, "v01e_orto_maket.png"))
al_ = rn[..., 3:4]
ov = mk.copy(); ov[..., :3] = mk[..., :3] * (1 - 0.55 * al_) + rn[..., :3] * 0.55 * al_; ov[..., 3] = 1
yaz(ov, os.path.join(KONTROL, "v01e_overlay.png"))
bgc = np.array([0.78, 0.82, 0.88], np.float32)
rnb = rn.copy(); rnb[..., :3] = rn[..., :3] * al_ + bgc * (1 - al_); rnb[..., 3] = 1
yaz(np.concatenate([mk, np.ones((ih, 16, 4), np.float32), rnb], axis=1), os.path.join(KONTROL, "v01e_yanyana_kuzey.png"))

kamera((110, -125, 95), tgt=(0, 0, 10), lens=50); render("v01e_hava_kuzeybati.png", (1100, 800))
bc1 = tepeler[1][0]
kamera((bc1.x + 5, bc1.y - 13, 20.8), tgt=(bc1.x, bc1.y, 23.4), lens=30); render("v01e_kubbe_yakin.png", (1100, 800))
kamera((XB + 14, YB - 38, 44), tgt=(XB, YB, 48.5), lens=45); render("v01e_minare_yakin.png", (800, 1100))
