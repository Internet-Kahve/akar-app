# AKAR · Orhan Bey Külliyesi · Orhan Bey Camii · v02b KUSUR TURU (biçim değişmedi): saçak bandı dolu prizma yerine içi boş
#   halka; dolu prizmanın üst yüzü harim/mihrap damıyla aynı düzlemdeydi (10,2 m) → z-fighting (kırmızı-gri titreşim).
#   Bant damdan 2 cm yüksek biter (korniş kenarı). Başka hiçbir şey değişmedi.
# ---- v02 başlığı ----
# AKAR · Orhan Bey Külliyesi · Orhan Bey Camii · v02 DETAY + RENK + ÇIKIŞ (kütle v01'de donduruldu, ölçülerine dokunulmadı)
#   - Son cemaat yeri: kuzeyde 5 sivri kemer (ortada yüksek taç kemer + kapı), yanlarda ikiz sivri kemer (E: "yan cepheleri
#     ikiz sivri kemerlerle dışa açık"); tuğla kemer bandı (F). Kütle kapalı kalır, açıklıklar koyu levha.
#   - Kanat, mihrap bloğu ve güney cephelerinde sağır sivri kemerler; içlerinde üstte sivri kemerli, altta dikdörtgen
#     pencere (Ayverdi yan cephesi + F IMG_8460); kasnak pencereleri.
#   - Tuğla saçak bandı (E: testere dişi saçak), taş kaide bandı (Y: ≈ 0,8 m), doğu yan kapısı (Budak 2018 F.7, 1905).
#   - Kanat ve koridor üstünde kasnağa doğru yükselen basık kurşun kırma çatı (GEOMETRİ DONDURMA v01 kararı 7).
#   - Minare şerefe korkuluğu. Dokular: almaşık duvar, kubbe dilimleri, pencere (doku/doku_uret.py). AO + Draco .glb.
#   Eklenmeyenler: doğu cephesi baklava, batı cephesi dama motifleri (eser.md'de "nasıl" boş → soru), minare yıldız motifleri.
# Çalıştırma:
#   blender -b --python docs/documents-context/tasarim/3d-eser/bursa/eserler/orhan-bey-kulliyesi/claude/build/build_v02.py
# Eksenler: +X = doğu, +Y = kuzey, +Z = yukarı. Orijin = caminin ayak izi kutusunun ortası.
# Plan okuması (u, v): u = doğu kenarından batıya, v = kuzey kenarından güneye (m). X = 12,85 − u, Y = 16,75 − v.
# Kaynak kodları: P plan, Y yan cephe, O ön cephe (× 0,955), E envanter cilt-1, F fotoğraf, H hesap, T tahmin.
import sys, os, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 5, "_kutuphane")))
import bpy
import akar3d as A
from mathutils import Vector

SURUM = "v02b"
AD = "orhan-bey-camii"
CLAUDE = os.path.dirname(HERE)
KONTROL = os.path.join(CLAUDE, "kontrol", SURUM)
BLEND = os.path.join(CLAUDE, "blend", f"{AD}_{SURUM}.blend")
EXPORT = os.path.join(CLAUDE, "export", f"{AD}_{SURUM}.glb")
DOKU = os.path.join(HERE, "doku")

P = {
    # ================= KÜTLE (v01, donduruldu) =================
    "dis_x": 25.7, "dis_y": 33.5, "scy_v1": 6.5, "koridor_v1": 10.8, "kanat_v1": 22.2,
    "orta_u0": 7.2, "orta_u1": 18.5, "mihrap_v0": 21.0,
    "tab_d_c": (4.0, 16.6), "tab_b_c": (21.7, 16.6), "ana_c": (12.85, 15.9), "mih_c": (12.85, 27.4),
    "giris_c": (12.85, 8.8), "minare_c": (1.3, 8.3),
    "scy_sacak": 9.4, "scy_mahya": 11.8, "kanat_h": 7.6, "orta_h": 10.2,
    "tab_kasnak": 9.1, "tab_tepe": 10.5, "tab_kasnak_w": 6.2, "tab_kubbe_d": 5.8,
    "ana_kasnak": 13.5, "ana_tepe": 16.5, "ana_kasnak_w": 10.2, "ana_kubbe_d": 9.8,
    "mih_kasnak": 12.7, "mih_tepe": 14.4, "mih_kasnak_w": 10.4, "mih_kubbe_d": 9.6,
    "giris_kasnak": 9.0, "giris_tepe": 11.0, "giris_kasnak_w": 4.0, "giris_kubbe_d": 3.8,
    "pah": 0.30,
    "minare_r": 1.0, "minare_taban": 7.55, "serefe_z0": 18.8, "serefe_z1": 19.8, "serefe_r": 1.35,
    "petek_ust": 22.4, "petek_r": 0.85, "kulah_h": 3.8, "alem_h": 0.9,
    "zemin_pay": 6.0, "golge_pay": 1.06,
    # ================= v02 DETAY =================
    # son cemaat yeri kuzey revağı (P: ayak araları u; O: kotlar × 0,955)
    "D_scy_acik": [(1.2, 5.0), (6.0, 10.0), (10.8, 14.8), (15.8, 19.7), (20.7, 24.5)],   # P: 5 göz (u aralığı)
    "D_scy_uzengi": 4.5, "D_scy_tepe": 6.6,        # O: yan gözler üzengi / sivri kemer tepesi
    "D_tac_uzengi": 4.9, "D_tac_tepe": 8.0,        # O: orta (taç) göz
    "D_kemer_bant": 0.35,                          # F: tuğla kemer bandı genişliği
    "D_kapi_w": 1.8, "D_kapi_h": 3.4,              # O: ana kapı (orta gözün dibinde)
    # son cemaat yeri yan cepheleri: ikiz sivri kemer (E, F)
    "D_ikiz_w": 1.7, "D_ikiz_ara": 0.3,   # ikiz gözün dış kenarı iç kemer levhasının kenarına değmesin (manifold)
    "D_ikiz_uzengi": 3.6, "D_ikiz_tepe": 5.0,
    "D_ikiz_dis_w": 4.6, "D_ikiz_dis_tepe": 6.4,
    # yan cepheler (Y): sağır kemer v merkezleri, genişlik, üzengi, tepe; pencereler
    "D_kanat_nis_v": [14.1, 19.0], "D_kanat_nis_w": 2.6, "D_kanat_nis_uzengi": 5.4, "D_kanat_nis_tepe": 6.9,
    "D_koridor_pen_v": 9.8,                        # Y: koridor ucunda tek küçük üst pencere
    "D_mih_nis_v": [24.4, 29.8], "D_mih_nis_w": 3.2, "D_mih_nis_uzengi": 8.0, "D_mih_nis_tepe": 9.6,
    "D_mih_guney_x": [2.6, -2.6],                  # P: güney duvarında iki pencere (mihrap nişinin iki yanı)
    "D_kanat_guney_u": [4.2, 21.5],                # P: yan kanatların güney duvarında birer pencere
    "D_ust_pen_w": 1.0, "D_ust_pen_z0": 4.6, "D_ust_pen_tepe": 6.2,         # Y/F: kanat üst pencereleri (sivri, revzenli)
    "D_mih_ust_pen_w": 1.1, "D_mih_ust_pen_z0": 5.0, "D_mih_ust_pen_tepe": 7.0,
    "D_alt_pen_w": 1.15, "D_alt_pen_z0": 1.0, "D_alt_pen_z1": 2.6, "D_bosaltma_tepe": 3.3,  # Y: alt pencere + tuğla boşaltma kemeri
    "D_kucuk_pen_w": 0.6, "D_kucuk_pen_z0": 5.4, "D_kucuk_pen_tepe": 6.5,
    # kasnak pencereleri (Y)
    "D_ana_kpen": (2.4, 10.9, 12.7, 0.8),          # yan ofset, alt, tepe, genişlik (ana kubbe kasnağı, her ana yüzde 2)
    "D_mih_kpen": (0.0, 11.0, 12.3, 0.8),          # mihrap kasnağı, her ana yüzde 1
    "D_tab_kpen": (0.0, 7.9, 8.8, 0.6),            # tabhane kasnakları, her ana yüzde 1
    # doğu yan kapısı (Budak 2018 F.7: 1905'te açılan kapı; yeri T)
    "D_dogu_kapi_v": 9.6, "D_dogu_kapi_w": 1.6, "D_dogu_kapi_h": 2.8,
    # bantlar
    "D_kaide_h": 0.8, "D_kaide_d": 0.06,           # Y: subasman bandı
    "D_sacak_h": 0.35, "D_sacak_d": 0.18,          # E/F: tuğla testere dişi saçak, tek bant
    # kanat ve koridor kırma çatısı (kasnağa doğru yükselir)
    "D_cati_tasma": 0.25, "D_cati_ic_z": 8.3,
    # minare
    "D_korkuluk_h": 0.9,
    # doku ölçekleri
    "D_karo_w": 2.0, "D_karo_h": 0.8, "D_kubbe_sira": 6,   # F: taş sırası ≈ 0,55 m + iki tuğla sırası (IMG_8460); 1,2 × 0,6 ızgara gibi duruyordu
}
X0, Y0 = P["dis_x"] / 2, P["dis_y"] / 2
def XY(u, v): return Vector((X0 - u, Y0 - v))
def R_uv(u0, u1, v0, v1): return [XY(u0, v0), XY(u1, v0), XY(u1, v1), XY(u0, v1)]
def pahli_kare(c, w, pah):
    h, k = w / 2, w / 2 * (1 - pah)
    return [c + Vector(q) for q in ((k, -h), (h, -k), (h, k), (k, h), (-k, h), (-h, k), (-h, -k), (-k, -h))]

M = {k: A.mat(n, hx) for k, n, hx in [
    ("duvar", "Duvar", "#E2B7A4"),       # eser.md Palet: duvarlar; almaşık doku bağlanır
    ("kubbe", "Kubbe", "#A8AEC1"),       # eser.md Palet: kubbe (vurgu 1); dilim dokusu bağlanır
    ("cati", "Cati", "#B9C0CF"),         # düz/eğik kurşun çatı
    ("kulah", "Kulah", "#A8AEC1"),       # minare külahı (dokusuz kurşun)
    ("minare", "Minare", "#C9785A"),     # F: kırmızı tuğla minare gövdesi
    ("alem", "Alem", "#DCA320"),
    ("tugla", "Tugla", "#C6755B"),       # _ortak_stil tuğla kırmızı: kemer bantları, saçak
    ("tas", "Tas", "#F2F3E5"),           # _ortak_stil krem taş: kaide bandı, kapı çerçevesi, şerefe
    ("revak", "Revak", "#6B5A55"),       # T: son cemaat yeri açıklıklarının gölgeli içi
    ("kapi", "Kapi", "#6B4A3A"),         # eser.md: koyu kahve
    ("pencere", "Pencere", "#1E1F21"),   # parmaklıklı pencere dokusu
    ("cim", "Zemin_Cim", "#A0B46C"),
    ("golge", "Zemin_Golge", "#E29B87"),
]}
def doku_bagla(m, dosya):
    nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tx = nt.nodes.new("ShaderNodeTexImage"); tx.image = bpy.data.images.load(os.path.join(DOKU, dosya), check_existing=True)
    tx.name = "DOKU"; nt.links.new(tx.outputs["Color"], bsdf.inputs["Base Color"])
DOKULU = [M["kubbe"], M["pencere"], M["duvar"]]
doku_bagla(M["kubbe"], "kubbe_dilim.png"); doku_bagla(M["pencere"], "pencere.png"); doku_bagla(M["duvar"], "almasik.png")

A.temizle()

# ================= KÜTLE (v01, donduruldu; yalnız malzeme adları v02 paletine bağlı) =================
def kirma(g, p4, z0, z1, m):
    p4 = A.ccw(p4); c = A.centroid(p4)
    e0, e1 = p4[1] - p4[0], p4[2] - p4[1]
    uzun, kisa = (e0, e1) if e0.length >= e1.length else (e1, e0)
    d = uzun.normalized() * (uzun.length - kisa.length) / 2
    r0, r1 = g.V(c - d, z1), g.V(c + d, z1); b = [g.V(q, z0) for q in p4]
    for i in range(4):
        j = (i + 1) % 4; mid = (p4[i] + p4[j]) / 2
        ri, rj = (r0, r1) if (p4[i] - c).dot(d) < (p4[j] - c).dot(d) else (r1, r0)
        if abs((p4[j] - p4[i]).normalized().dot(d.normalized())) > 0.5: g.F([b[i], b[j], rj, ri], m)
        else: g.F([b[i], b[j], r0 if (mid - c).dot(d) < 0 else r1], m)

g = A.G("Cami_SonCemaat"); p = R_uv(0, P["dis_x"], 0, P["scy_v1"])
g.prism(p, 0.0, P["scy_sacak"], M["duvar"], top=False); kirma(g, p, P["scy_sacak"], P["scy_mahya"], M["cati"]); g.obj()
g = A.G("Cami_Koridor"); g.prism(R_uv(0, P["dis_x"], P["scy_v1"], P["koridor_v1"]), 0.0, P["kanat_h"], M["duvar"], M["cati"]); g.obj()
for ad, u0, u1 in (("Cami_Kanat_D", 0, P["orta_u0"]), ("Cami_Kanat_B", P["orta_u1"], P["dis_x"])):
    g = A.G(ad); g.prism(R_uv(u0, u1, P["koridor_v1"], P["kanat_v1"]), 0.0, P["kanat_h"], M["duvar"], M["cati"]); g.obj()
g = A.G("Cami_Harim"); g.prism(R_uv(P["orta_u0"], P["orta_u1"], P["koridor_v1"], P["mihrap_v0"]), 0.0, P["orta_h"], M["duvar"], M["cati"]); g.obj()
g = A.G("Cami_Mihrap"); g.prism(R_uv(P["orta_u0"], P["orta_u1"], P["mihrap_v0"], P["dis_y"]), 0.0, P["orta_h"], M["duvar"], M["cati"]); g.obj()

KUBBE = {}   # ad → (merkez, taban z, yükselme): kubbe dilim UV'si için
def kubbe(ad, uv, z0, zk, zt, kw, kd):
    g = A.G(ad); c = XY(*uv)
    g.prism(pahli_kare(c, kw, P["pah"]), z0 - 0.05, zk, M["duvar"], M["cati"])
    g.dome(A.circle(c, kd / 2, 24), zk - 0.05, zt - zk + 0.05, M["kubbe"], rings=8)
    KUBBE[ad] = (c, zk - 0.05, zt - zk + 0.05)
    return g.obj()
kubbe("Kubbe_Ana", P["ana_c"], P["orta_h"], P["ana_kasnak"], P["ana_tepe"], P["ana_kasnak_w"], P["ana_kubbe_d"])
kubbe("Kubbe_Mihrap", P["mih_c"], P["orta_h"], P["mih_kasnak"], P["mih_tepe"], P["mih_kasnak_w"], P["mih_kubbe_d"])
kubbe("Kubbe_Tabhane_D", P["tab_d_c"], P["kanat_h"], P["tab_kasnak"], P["tab_tepe"], P["tab_kasnak_w"], P["tab_kubbe_d"])
kubbe("Kubbe_Tabhane_B", P["tab_b_c"], P["kanat_h"], P["tab_kasnak"], P["tab_tepe"], P["tab_kasnak_w"], P["tab_kubbe_d"])
kubbe("Kubbe_Giris", P["giris_c"], P["kanat_h"], P["giris_kasnak"], P["giris_tepe"], P["giris_kasnak_w"], P["giris_kubbe_d"])

g = A.G("Minare_1"); c = XY(*P["minare_c"]); r, rs, rp = P["minare_r"], P["serefe_r"], P["petek_r"]
z0, s0, s1, zp = P["minare_taban"], P["serefe_z0"], P["serefe_z1"], P["petek_ust"]
g.lathe(c, [(r, z0), (r, s0 - 0.6), (rs, s0), (rs, s1), (rp, s1), (rp, zp)], 12, [M["minare"], M["tas"], M["tas"], M["tas"], M["minare"]])
zk = zp + P["kulah_h"]
g.lathe(c, [(rp * 1.08, zp - 0.02), (0, zk)], 12, [M["kulah"]])
za = zk - 0.05; ah = P["alem_h"]
g.lathe(c, [(0.08, za), (0.2, za + ah * 0.3), (0.08, za + ah * 0.55), (0.16, za + ah * 0.75), (0, za + ah)], 8, [M["alem"]] * 4)
# v02: şerefe korkuluğu (kapalı halka gövde, taş)
g.lathe(c, [(rs - 0.08, s1 - 0.02), (rs, s1 - 0.02), (rs, s1 + P["D_korkuluk_h"]), (rs - 0.08, s1 + P["D_korkuluk_h"])], 12, [M["tas"]] * 3)
g.obj()

# ================= v02 DETAY =================
def panel(g, O, T, N, poly, o0, o1, m, m_yan=None, uv=False):
    """Düşey düzlemde (O + T·s, z) kapalı levha; N yönünde o0 → o1 kalınlık. uv=True: ön yüze 0..1 UV (doku)."""
    Pt = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
    a = [g.bm.verts.new(Pt(s, z, o0)) for s, z in poly]; b = [g.bm.verts.new(Pt(s, z, o1)) for s, z in poly]
    on = g.F(b, m); g.F(a[::-1], m_yan or m)
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g.F([a[i], a[j], b[j], b[i]], m_yan or m)
    if uv and on:
        uvl = g.bm.loops.layers.uv.verify()
        s0_, s1_ = min(s for s, _ in poly), max(s for s, _ in poly); z0_, z1_ = min(z for _, z in poly), max(z for _, z in poly)
        for l in on.loops:
            s, z = poly[b.index(l.vert)]; l[uvl].uv = ((s - s0_) / (s1_ - s0_), (z - z0_) / (z1_ - z0_))

def sivri(w, z0, zs, za, n=5):
    """İki merkezli sivri kemerli açıklık (s, z), ccw. zs üzengi, za tepe. R = (h² + w²/4) / w."""
    h = max(za - zs, 0.05); R = (h * h + w * w / 4) / w; cx = w / 2 - R; tm = math.atan2(h, -cx)
    sag = [(cx + R * math.cos(tm * k / n), zs + R * math.sin(tm * k / n)) for k in range(1, n + 1)]
    sag[-1] = (0.0, za)
    sol = [(-s, z) for s, z in reversed(sag[:-1])]
    return [(-w / 2, z0), (w / 2, z0), (w / 2, zs)] + sag + sol + [(-w / 2, zs)]
def dik(w, z0, z1): return [(-w / 2, z0), (w / 2, z0), (w / 2, z1), (-w / 2, z1)]

# yüz tanımları: (O, T, N); s ekseni T boyunca (doğu/batı yüzlerinde s = Y, kuzey/güney yüzlerinde s = X)
def yuz_dogu(x): return (Vector((x, 0)), Vector((0, 1)), Vector((1, 0)))
def yuz_bati(x): return (Vector((x, 0)), Vector((0, 1)), Vector((-1, 0)))
def yuz_kuzey(y): return (Vector((0, y)), Vector((1, 0)), Vector((0, 1)))
def yuz_guney(y): return (Vector((0, y)), Vector((1, 0)), Vector((0, -1)))
def at(f, s): O, T, N = f; return (O + T * s, T, N)

def nis(g, f, s, w, uzengi, tepe):
    """Sağır kemer: tuğla bant (dış) + içte duvar dokulu levha (bant izlenimi)."""
    O, T, N = at(f, s); b = P["D_kemer_bant"]
    panel(g, O, T, N, sivri(w + 2 * b, 0.9, uzengi, tepe + b * 0.8), 0.04, 0.07, M["tugla"])
    panel(g, O, T, N, sivri(w, 0.95, uzengi, tepe), 0.07, 0.09, M["duvar"])
def ust_pen(g, f, s, w, z0, tepe, off=0.09):
    O, T, N = at(f, s); zs = tepe - w * 0.55
    panel(g, O, T, N, sivri(w + 0.24, z0 - 0.12, zs, tepe + 0.14), off, off + 0.03, M["tas"])
    panel(g, O, T, N, sivri(w, z0, zs, tepe), off + 0.03, off + 0.06, M["pencere"], M["tas"], uv=True)
def alt_pen(g, f, s, off=0.09):
    O, T, N = at(f, s); w, z0, z1 = P["D_alt_pen_w"], P["D_alt_pen_z0"], P["D_alt_pen_z1"]
    panel(g, O, T, N, sivri(w + 0.5, z1 + 0.05, z1 + 0.15, P["D_bosaltma_tepe"]), off, off + 0.03, M["tugla"])
    panel(g, O, T, N, dik(w + 0.24, z0 - 0.12, z1 + 0.12), off, off + 0.03, M["tas"])
    panel(g, O, T, N, dik(w, z0, z1), off + 0.03, off + 0.06, M["pencere"], M["tas"], uv=True)

XE, XW = X0, -X0                                         # cami dış yüzleri (doğu, batı)
XME, XMW = X0 - P["orta_u1"], X0 - P["orta_u0"]          # mihrap bloğu batı ve doğu yüzü (X = −5,65 / +5,65)
YN, YS = Y0, Y0 - P["dis_y"]
Yv = lambda v: Y0 - v

# --- Revak_SonCemaat: kuzey 5 göz + yan ikiz kemerler + ana kapı ---
g = A.G("Revak_SonCemaat"); fK = yuz_kuzey(YN); b = P["D_kemer_bant"]
for i, (u0, u1) in enumerate(P["D_scy_acik"]):
    s = X0 - (u0 + u1) / 2; w = u1 - u0; tac = (i == 2)
    zs, za = (P["D_tac_uzengi"], P["D_tac_tepe"]) if tac else (P["D_scy_uzengi"], P["D_scy_tepe"])
    O, T, N = at(fK, s)
    panel(g, O, T, N, sivri(w + 2 * b, 0.0, zs, za + b * 0.8), 0.08, 0.11, M["tugla"])
    panel(g, O, T, N, sivri(w, 0.0, zs, za), 0.11, 0.14, M["revak"])
    if tac:
        panel(g, O, T, N, dik(P["D_kapi_w"] + 0.4, 0.0, P["D_kapi_h"] + 0.25), 0.14, 0.17, M["tas"])
        panel(g, O, T, N, dik(P["D_kapi_w"], 0.0, P["D_kapi_h"]), 0.17, 0.20, M["kapi"])
for f in (yuz_dogu(XE), yuz_bati(XW)):
    sc = Yv(P["scy_v1"] / 2); O, T, N = at(f, sc)
    panel(g, O, T, N, sivri(P["D_ikiz_dis_w"], 0.0, P["D_ikiz_uzengi"], P["D_ikiz_dis_tepe"]), 0.08, 0.11, M["tugla"])
    panel(g, O, T, N, sivri(P["D_ikiz_dis_w"] - 2 * b, 0.0, P["D_ikiz_uzengi"], P["D_ikiz_dis_tepe"] - b), 0.11, 0.13, M["duvar"])
    d = (P["D_ikiz_w"] + P["D_ikiz_ara"]) / 2
    for k in (-1, 1):
        O2, T2, N2 = at(f, sc + k * d)
        panel(g, O2, T2, N2, sivri(P["D_ikiz_w"], 0.0, P["D_ikiz_uzengi"], P["D_ikiz_tepe"]), 0.13, 0.16, M["revak"])
g.obj()

# --- Cepheler (tek nesne, draw call): doğu ve batı yüzleri (kanat sağır kemerleri, koridor küçük penceresi, mihrap bloğu
#     yan yüzleri), güney yüzleri ve kasnak pencereleri ---
g = A.G("Cepheler")
for ad, fk, fm in (("Cephe_Dogu", yuz_dogu(XE), yuz_dogu(XMW)), ("Cephe_Bati", yuz_bati(XW), yuz_bati(XME))):
    for v in P["D_kanat_nis_v"]:
        s = Yv(v); nis(g, fk, s, P["D_kanat_nis_w"], P["D_kanat_nis_uzengi"], P["D_kanat_nis_tepe"])
        ust_pen(g, fk, s, P["D_ust_pen_w"], P["D_ust_pen_z0"], P["D_ust_pen_tepe"]); alt_pen(g, fk, s)
    ust_pen(g, fk, Yv(P["D_koridor_pen_v"]), P["D_kucuk_pen_w"], P["D_kucuk_pen_z0"], P["D_kucuk_pen_tepe"], off=0.04)
    for v in P["D_mih_nis_v"]:
        s = Yv(v); nis(g, fm, s, P["D_mih_nis_w"], P["D_mih_nis_uzengi"], P["D_mih_nis_tepe"])
        ust_pen(g, fm, s, P["D_mih_ust_pen_w"], P["D_mih_ust_pen_z0"], P["D_mih_ust_pen_tepe"]); alt_pen(g, fm, s)
    if ad == "Cephe_Dogu":   # doğu yan kapısı (1905): taş çerçeve + koyu kahve kapı
        O, T, N = at(fk, Yv(P["D_dogu_kapi_v"])); w, h = P["D_dogu_kapi_w"], P["D_dogu_kapi_h"]
        panel(g, O, T, N, dik(w + 0.4, 0.0, h + 0.25), 0.08, 0.11, M["tas"])
        panel(g, O, T, N, dik(w, 0.0, h), 0.11, 0.14, M["kapi"])

# güney: mihrap bloğu güney yüzü + yan kanatların güney yüzleri
fG = yuz_guney(YS); fGk = yuz_guney(Yv(P["kanat_v1"]))
for x in P["D_mih_guney_x"]:
    nis(g, fG, x, P["D_mih_nis_w"], P["D_mih_nis_uzengi"], P["D_mih_nis_tepe"])
    ust_pen(g, fG, x, P["D_mih_ust_pen_w"], P["D_mih_ust_pen_z0"], P["D_mih_ust_pen_tepe"]); alt_pen(g, fG, x)
for u in P["D_kanat_guney_u"]:
    x = X0 - u; nis(g, fGk, x, P["D_kanat_nis_w"], P["D_kanat_nis_uzengi"], P["D_kanat_nis_tepe"])
    ust_pen(g, fGk, x, P["D_ust_pen_w"], P["D_ust_pen_z0"], P["D_ust_pen_tepe"]); alt_pen(g, fGk, x)
# kasnak pencereleri: pahlı kare kasnağın ana yüzlerinde
for ad, w, (ofs, zlo, ztp, pw), yuzler_ in (("Kubbe_Ana", P["ana_kasnak_w"], P["D_ana_kpen"], "KGDB"),
                                            ("Kubbe_Mihrap", P["mih_kasnak_w"], P["D_mih_kpen"], "GDB"),
                                            ("Kubbe_Tabhane_D", P["tab_kasnak_w"], P["D_tab_kpen"], "KGD"),
                                            ("Kubbe_Tabhane_B", P["tab_kasnak_w"], P["D_tab_kpen"], "KGB")):
    c = KUBBE[ad][0]; h = w / 2
    for k in yuzler_:
        f = {"K": yuz_kuzey(c.y + h), "G": yuz_guney(c.y - h), "D": yuz_dogu(c.x + h), "B": yuz_bati(c.x - h)}[k]
        base = c.x if k in "KG" else c.y
        for s in ([base - ofs, base + ofs] if ofs else [base]):
            ust_pen(g, f, s, pw, zlo, ztp, off=0.04)
g.obj()

# --- Kaide_Bant ve Sacak: kütlelerin çevresinde dışa taşan kapalı bantlar ---
def genis(p4, d):
    """Dikdörtgeni her yönde d kadar büyüt."""
    c = A.centroid(p4); return [Vector((q.x + (d if q.x > c.x else -d), q.y + (d if q.y > c.y else -d))) for q in p4]
def bant(g, p4, z0, z1, d, m): g.prism(genis(p4, d), z0, z1, m, m)
def halka(g, p4, d_dis, d_ic, z0, z1, m):
    """v02b: içi boş kapalı bant (dolu prizmanın üstü damla aynı düzlemde kalıyordu)."""
    o, i_ = A.ccw(genis(p4, d_dis)), A.ccw(genis(p4, -d_ic))
    ob, ot = [g.V(q, z0) for q in o], [g.V(q, z1) for q in o]; ib, it = [g.V(q, z0) for q in i_], [g.V(q, z1) for q in i_]
    for k in range(4):
        j = (k + 1) % 4
        g.F([ob[k], ob[j], ot[j], ot[k]], m); g.F([ib[j], ib[k], it[k], it[j]], m)
        g.F([ot[k], ot[j], it[j], it[k]], m); g.F([ob[j], ob[k], ib[k], ib[j]], m)
BLOK = {"scy": R_uv(0, P["dis_x"], 0, P["scy_v1"]), "kor": R_uv(0, P["dis_x"], P["scy_v1"], P["koridor_v1"]),
        "kd": R_uv(0, P["orta_u0"], P["koridor_v1"], P["kanat_v1"]), "kb": R_uv(P["orta_u1"], P["dis_x"], P["koridor_v1"], P["kanat_v1"]),
        "har": R_uv(P["orta_u0"], P["orta_u1"], P["koridor_v1"], P["mihrap_v0"]), "mih": R_uv(P["orta_u0"], P["orta_u1"], P["mihrap_v0"], P["dis_y"])}
g = A.G("Kaide_Bant")
for k in ("kor", "kd", "kb", "mih"):   # son cemaat yeri revak olduğu için bantsız
    bant(g, BLOK[k], 0.0, P["D_kaide_h"], P["D_kaide_d"], M["tas"])
g.obj()
g = A.G("Sacak"); sh, sd = P["D_sacak_h"], P["D_sacak_d"]
for k, z in (("scy", P["scy_sacak"]), ("kor", P["kanat_h"]), ("kd", P["kanat_h"]), ("kb", P["kanat_h"]), ("har", P["orta_h"]), ("mih", P["orta_h"])):
    halka(g, BLOK[k], sd, 0.05, z - sh, z + 0.02, M["tugla"])
g.obj()

# --- Cati_Kanatlar: yan kanat ve koridor üstünde kasnağa doğru yükselen basık kurşun çatı (kapalı halka) ---
def cati_halka(g, dis4, ic_c, ic_w, z0, z1, m):
    """Dış saçak dikdörtgeni (z0) → kasnak çevresindeki kare (z1); alt yüz düz; iç kenar kasnağın içinde kalır."""
    dis4 = A.ccw(dis4); h = ic_w / 2; dc = A.centroid(dis4)
    ic4 = [ic_c + Vector((h if q.x > dc.x else -h, h if q.y > dc.y else -h)) for q in dis4]   # aynı çeyrekteki iç köşe
    ob = [g.V(q, z0) for q in dis4]; it = [g.V(q, z1) for q in ic4]; ib = [g.V(q, z0) for q in ic4]
    for i in range(4):
        j = (i + 1) % 4
        g.F([ob[i], ob[j], it[j], it[i]], m)       # eğik çatı
        g.F([ob[j], ob[i], ib[i], ib[j]], m)       # alt
        g.F([ib[i], ib[j], it[j], it[i]], m)       # iç düşey (kasnağın içinde)
t = P["D_cati_tasma"]; zc0 = P["kanat_h"] - 0.05
g = A.G("Cati_Kanatlar")
cati_halka(g, genis(BLOK["kd"], t), XY(*P["tab_d_c"]), P["tab_kasnak_w"] - 0.2, zc0, P["D_cati_ic_z"], M["cati"])
cati_halka(g, genis(BLOK["kb"], t), XY(*P["tab_b_c"]), P["tab_kasnak_w"] - 0.2, zc0, P["D_cati_ic_z"], M["cati"])
cati_halka(g, genis(BLOK["kor"], t), XY(*P["giris_c"]), P["giris_kasnak_w"] - 0.2, zc0, P["D_cati_ic_z"], M["cati"])
g.obj()

# --- Zemin (kaide diski + gölge; .glb'ye girmez) ---
c0 = Vector((0, 0)); zr = math.hypot(X0, Y0) + P["zemin_pay"]
g = A.G("Zemin"); g.prism(A.circle(c0, zr, 48), -0.4, 0.0, M["cim"], M["cim"]); g.obj()
g = A.G("Zemin_Golge")
g.prism([Vector((q.x * P["golge_pay"], q.y * P["golge_pay"] * 0.97 - 1.5)) for q in A.circle(c0, zr, 48)], -0.9, -0.5, M["golge"], M["golge"]); g.obj()

# ================= UV =================
def uv_kubbe():
    """Her dilim bir karo (u 0..1, kenarlarda ek), v = kurşun levha sırası. Yalnız kubbe malzemeli yüzler."""
    seg = 2 * math.pi / 24
    for ad, (c, zb, rise) in KUBBE.items():
        o = bpy.data.objects[ad]; me = o.data; uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
        ki = [i for i, s in enumerate(o.material_slots) if s.material is M["kubbe"]]
        for p in me.polygons:
            if p.material_index not in ki: continue
            pc = p.center; af = math.atan2(pc.y - c.y, pc.x - c.x)
            for li in p.loop_indices:
                co = me.vertices[me.loops[li].vertex_index].co
                if math.hypot(co.x - c.x, co.y - c.y) < 1e-3: u = 0.5
                else:
                    da = (math.atan2(co.y - c.y, co.x - c.x) - af + math.pi) % (2 * math.pi) - math.pi; u = 0.5 + da / seg
                uvl.data[li].uv = (u, (co.z - zb) / rise * P["D_kubbe_sira"])
uv_kubbe()
def uv_almasik():
    kw_, kh_ = P["D_karo_w"], P["D_karo_h"]
    for o in [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin"))]:
        idx = [i for i, s in enumerate(o.material_slots) if s.material is M["duvar"]]
        if not idx: continue
        me = o.data; uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
        for p in me.polygons:
            if p.material_index not in idx: continue
            n = p.normal; t_ = Vector((-n.y, n.x, 0)).normalized() if abs(n.z) < 0.7 else None
            for li in p.loop_indices:
                co = o.matrix_world @ me.vertices[me.loops[li].vertex_index].co
                uvl.data[li].uv = ((co.x * t_.x + co.y * t_.y) / kw_, co.z / kh_) if t_ is not None else (co.x / kw_, co.y / kh_)
uv_almasik()

# ================= kontrol =================
os.makedirs(KONTROL, exist_ok=True)
rapor = A.kontrol_hepsi(KONTROL, "kontrol")
mk = A.mesh_kontrol()
rapor["parcalar"] = {k: v["ucgen"] for k, v in mk.items()}
rapor["draw_call"] = sum(len(o.material_slots) for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin")))
print("RAPOR", json.dumps(rapor, ensure_ascii=False))

# ================= AO + .glb =================
A.ao_vertex(samples=32)
for m in DOKULU:
    nt = m.node_tree; tx = nt.nodes.get("DOKU"); mul = next((n for n in nt.nodes if n.type == "MIX" and n.blend_type == 'MULTIPLY'), None)
    if tx and mul: nt.links.new(tx.outputs["Color"], mul.inputs[6])
os.makedirs(os.path.dirname(EXPORT), exist_ok=True)
rapor["glb_bayt"] = A.disa_aktar(EXPORT, draco=True)
with open(os.path.join(KONTROL, "kontrol_rapor.json"), "w", encoding="utf-8") as fh: json.dump(rapor, fh, ensure_ascii=False, indent=1)
print("GLB", EXPORT, rapor["glb_bayt"])

# ================= render (Workbench, dokulu) =================
def kurulum_render():
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sh = sc.display.shading
    sh.light = 'STUDIO'; sh.color_type = 'TEXTURE'; sh.show_shadows = False
    sh.show_cavity = True; sh.cavity_type = 'WORLD'; sh.show_backface_culling = True
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'Standard'
    sc.render.resolution_x, sc.render.resolution_y = 1400, 900
    sh.background_type = 'VIEWPORT'; sh.background_color = (0.96, 0.82, 0.67)

def kamera(ad, loc, hedef, orto=None, lens=35):
    cd = bpy.data.cameras.get(ad) or bpy.data.cameras.new(ad)
    if orto: cd.type = 'ORTHO'; cd.ortho_scale = orto
    else: cd.type = 'PERSP'; cd.lens = lens
    cd.clip_end = 2000
    cam = bpy.data.objects.get(ad) or bpy.data.objects.new(ad, cd)
    if cam.name not in bpy.context.scene.collection.objects: bpy.context.scene.collection.objects.link(cam)
    cam.location = Vector(loc); cam.rotation_euler = (Vector(hedef) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    return cam

def render(cam, ad):
    sc = bpy.context.scene; sc.camera = cam
    sc.render.filepath = os.path.join(KONTROL, f"{ad}.png"); bpy.ops.render.render(write_still=True)

kurulum_render()
ORTO = 40.0   # v01 ile aynı: 35 px/m, orto merkez z = 12 → yan_yana.py v02 ile bindirme
d = 95; el = math.radians(33); az = math.radians(45)
render(kamera("CAM_Havadan", (d * math.cos(el) * math.cos(az), d * math.cos(el) * math.sin(az), d * math.sin(el)), (0, 0, 6)), "havadan")
render(kamera("CAM_Havadan_GB", (-d * 0.62, -d * 0.62, d * 0.55), (0, 0, 6)), "havadan_guneybati")
render(kamera("CAM_Foto", (32, 38, 6), (-2, 4, 9), lens=24), "foto_acisi")          # ref-img/1578396115
render(kamera("CAM_Foto2", (46, -12, 12), (0, 0, 8), lens=30), "foto_acisi_2")      # ref-img/IMG_8460
render(kamera("CAM_Kuzey_Orto", (0, 120, 12), (0, 0, 12), orto=ORTO), "kuzey_orto")
render(kamera("CAM_Bati_Orto", (-120, 0, 12), (0, 0, 12), orto=ORTO), "bati_orto")
render(kamera("CAM_Revak", (8, 34, 5), (0, 16, 5), lens=30), "revak_yakin")
render(kamera("CAM_Kubbe", (-22, 22, 20), (0, -2, 12), lens=30), "kubbe_yakin")

os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("BITTI", BLEND)
