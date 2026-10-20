# AKAR · Yıldırım Bayezid Bedesteni · v05 = v04 + OVAL kaide (Koza Han v12 / Ulu Cami v22 gibi; kullanıcı kararı 19 Ekim) + koyu kurşun kubbe ve gövde çatısı (F 2024 havadan fotoğrafı)
# v04 BİTİŞİK BANT + 56 DÜKKÂN + KUBBELİ GİRİŞ MEKÂNLARI + STANDART PALET
#   İş emri: SONNET_REVIZYON_PLANI.md (ana) + ../_GENEL_SAHNE_STANDARDI.md. build_v03.py'den türetildi; v03 dosyalarına dokunulmaz.
#   - Açık "İç Bedesten Sokağı", ayrı dış halka, Gecitler, beşik çatılı Girisler SİLİNDİ. Gövdeye bitişik bant (71,70 × 35,50, çatı +5,0).
#   - 56 dükkân = 2 × 20 (kuzey/güney: 10 + giriş + 10) + 2 × 8 (doğu/batı: 4 + giriş + 4). Dükkân açıklıkları GERÇEK oyuk (boolean).
#   - 19 Ekim düzeltmesi: giriş kasnakları ve giriş kubbeleri SİLİNDİ (dışarıdan görünmüyor). Giriş modülü bant çatısının devamı;
#     bant çatısı tek yöne, dışa düşen kurşun çatı (gövdede +5,40, dış saçakta +4,70, köşelerde kırma, saçak taşması 0,30).
#   - Dükkân açıklıkları vitrin dokulu (dukkan_vitrin.png, 3 varyant, sırayla). Gövde pencereleri 7 + 7 + 4 + 4 (hepsi geri geldi).
#   - Ana kubbe tepesi +14,20 (alem ve kubbe penceresi yok). Gövde 59,5 × 18,0, saçak +10,0, 2 × 7 kubbe korunur.
#   - 19 Ekim A incelemesi (v04b, kullanıcı onayı): bant K/G 8,75 → 7,75, D/B 6,10 → 5,60 (Gabriel plan + kesit, Ayverdi 1966; dış 70,70 × 33,50),
#     saçak taşması 0,15; kutu almaşık doku; gövde saçağı ince taş; pencereler 1,0 × 2,05 yuvarlak kemerli, ince tuğla kemer;
#     kubbe ve bant çatısı kurşun koyu tonu #AEB6BC; dükkân kemerleri sade taş; dış kapı sade kesme taş, çatı hattının altında.
# Aşama: AKAR_ASAMA = A (kütle) | AB (+giriş, kapı, doku) | ABC (+kaide, döşeme, figür; teslim). Varsayılan ABC.
# Çalıştırma: python build_v04.py   (bpy modülü ile)  ya da  blender -b --python build_v04.py
#   Çıktılar (aşama C): blend/bedesten_v04.blend, export/bedesten_v04.glb (zeminsiz, figürlü), export/bedesten_v04_sunum.glb (kaideli),
#   kontrol/v04/ (render, kontrol_rapor.json, renkler.json, olcu_dogrulama.json). Draco yoksa AKAR_GLTF_TRANSFORM=<gltf-transform yolu>.
# Eksenler: +X doğu, +Y kuzey, +Z yukarı; orijin salonun ortası. Kaynak harfleri: P rölöve, E envanter, W makale/tez, F fotoğraf, H hesap, T tahmin.
import sys, os, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 3, "_kutuphane")))
import bpy
import akar3d as A
from mathutils import Vector

SURUM = "v05"
ASAMA = os.environ.get("AKAR_ASAMA", "ABC")
HIZLI = os.environ.get("AKAR_HIZLI") == "1"
URETIM = os.path.dirname(HERE)
DOKU = os.path.join(HERE, "doku")
KONTROL = os.environ.get("AKAR_CIKTI") or os.path.join(URETIM, "kontrol", SURUM)
BLEND = os.path.join(URETIM, "blend", f"bedesten_{SURUM}.blend")
EXPORT = os.path.join(URETIM, "export", f"bedesten_{SURUM}.glb")
EXPORT_SUNUM = os.path.join(URETIM, "export", f"bedesten_{SURUM}_sunum.glb")

P = {
    # ---- gövde (v02b'den beri DOĞRU, korunur) ----
    "salon_ic_x": 56.50,      # E: iç mekân doğu–batı (C2 PDF 29)
    "salon_ic_y": 15.00,      # E: iç mekân kuzey–güney
    "salon_duvar": 1.50,      # P: Gabriel kesiti
    "govde_x": 59.5,          # H: iç + 2 × duvar
    "govde_y": 18.0,          # H
    "cati_h": 10.0,           # P: gövde saçağı
    "salon_h": 10.25,         # T (v02b): kurşun kırma çatı iç kenarı = kubbe tabanı
    "kubbe_nx": 7, "kubbe_ny": 2,   # E: 2 × 7 = 14
    "kubbe_dis_d": 7.4,       # P kesit: kubbe dış çapı
    "kubbe_tepe": 14.20,      # W: Ekinci PDF 96 «zeminden en yüksek kubbesinin hizasına kadar ... 14,20 metredir» (v03: 13,5)
    "kubbe_etek": 0.25,       # H: +10,25 → +10,50 dik silindirik etek (plan §3); üstünde yarım küre r 3,70 → 14,20
    # ---- bant (plan §1) ----
    "toplam_x": 70.70,        # P: bant D/B 5,60 = Gabriel planı ≈ 5,4 ile Ayverdi 1966 ≈ 5,7 ortası (v04 A: W Ekinci 71,70; 19 Ekim incelemesinde bırakıldı)
    "toplam_y": 33.50,        # P: bant K/G 7,75 = Gabriel planı ≈ 7,4, kesiti ≈ 7,7–8,0, Ayverdi ≈ 7,8 (W Ekinci 35,5 bandın dışındaki bir çizgiye ölçülmüş olabilir)
    "bant_cati_ic": 5.40,     # F/T: bant çatısı gövde duvarına dayandığı kenar (19 Ekim: tek yöne dışa düşen eğimli kurşun çatı)
    "bant_cati_sacak": 4.70,  # F/T: dış saçak kotu
    "bant_cati_tasma": 0.15,  # T: saçak taşması (19 Ekim A incelemesi: 0,30 → 0,15)
    "bant_cati_kalin": 0.12,  # T: kurşun çatı levha kalınlığı
    "bant_gomme": 0.10,       # T: bant iç yüzünün gövde duvarına gömülme payı (boşluksuz bitişiklik)
    "bant_sacak_h": 0.20, "bant_sacak_d": 0.06,   # T: ince taş saçak silmesi (v04b: tuğla 0,30 → taş 0,20), çatı saçağının altında. Giriş modüllerinde kesilir
    # ---- dükkân (plan §1.3) ----
    "dukkan_n_uzun": 10, "dukkan_n_kisa": 4,      # P-oran: Ayverdi 1966 sayımı; 56 = 2×20 + 2×8
    "dukkan_adim": 2.75,      # H; W genişlik 2,30 + 0,45 duvar
    "giris_modul": 6.5,       # H
    "dukkan_cerceve_w": 2.30, "dukkan_acik_w": 1.90, "dukkan_uzengi": 2.40,   # T (kemer tepesi +3,55)
    "dukkan_oyuk_d": 1.00,    # T: dükkân açıklığı oyuk derinliği (tonoz modellenmez, plan §1.3)
    "cerceve_aralik": 0.03,   # T: kemer çerçevesi ile açıklık arası boşluk (aynı düzlemde çakışma olmasın)
    # ---- giriş kapısı (plan §2, 19 Ekim: kasnak ve kubbe YOK) ----
    "kapi_w": 3.0, "kapi_uzengi": 2.2, "kapi_h": 3.7,      # P: Gabriel geçit 3,0; T yükseklik (v04b: kapı ve kitabe çatı hattının altında kalsın diye üzengi 3,0 → 2,2, tepe 3,7)
    "kapi_oyuk_d": 1.2,       # T: kapı geçidi derinliği; dibinde kapı kanadı (#7A5134); iç mekân modellenmez
    "kapi_bant_k": 0.30,      # T (v04b): sade kesme taş kemer bandı 0,30 (F: kitabe fotoğrafında kapı üstü düz kesme taş; dönüşümlü tuğla yok)
    "kapi_cerceve_w": 4.4,    # T: kesme taş çerçeve genişliği
    "kapi_cerceve_h": 4.36,   # T (v04b): çerçeve saçak silmesinin (+4,40) altında biter; silme ve çatı kapının üstünden kesintisiz geçer
    "esik": 0.45,             # W: 3 basamak × 0,15 → eşik +0,45
    "basamak_n": 3, "basamak_h": 0.15, "basamak_d": 0.30, "basamak_w": 3.6,   # W: Ekinci PDF 103 (rıht 0,15); d, w T
    "kitabe_w": 0.70, "kitabe_h": 0.28, "kitabe_z": 4.05, "kitabe_kabartma": 0.03, "kitabe_cerceve_h": 4.36,   # E/W: Ekinci PDF 84–85; v04b boyut F (pdf085: bir taş sırası yüksekliğinde, T), z kemer tepesinin üstü. Yazı YOK
    # ---- gövde pencereleri (v02) ----
    "D_pen_alt": 5.55, "D_pen_w": 1.0, "D_pen_kemer_z": 7.10, "D_pen_kemer_k": 0.15,   # P: alt +5,55, üst ≈ +7,6 (Gabriel kesit); F: yuvarlak kemer, tek sıra tuğla kemer (v04b)
    "D_pen_kisa_y": (-5.0, -3.2, 3.2, 5.0),
    "D_sacak_h": 0.20, "D_sacak_d": 0.08,   # F (v04b): ince açık renk saçak silmesi (tuğla şerit kaldırıldı)
    "D_kubbe_dilim": 32, "D_kubbe_sira": 5,
    # ---- zemin (standart §1; plan §5.2) ----
    "serit_w": 3.5,           # plan §5.2: İç Bedesten Sokağı taş döşeme şerit
    "kaide_pay": 5.0, "kaide_n": float(os.environ.get("AKAR_KAIDE_N", "3.0")), "kaide_seg": 128,   # v05 (kullanıcı kararı 19 Ekim): OVAL kaide; taş şeridin köşelerinden 5 m pay, n = 3 yumuşak köşeli oval (süperelips üssü; kullanıcı n = 2 elips yerine bunu seçti)
    "kaide_r": 10.0,   # v04b yuvarlatılmış dikdörtgen kaide (v05te kullanılmıyor)
    "kaide_pah": 1.5, "kaide_kalin": 0.6, "kaide_ust_pah": 0.15,
    "bordur_h": 0.15, "bordur_k": 0.25,
}
BX, BY = P["govde_x"] / 2, P["govde_y"] / 2
OX, OY = P["toplam_x"] / 2, P["toplam_y"] / 2
GX, GY = P["salon_ic_x"] / P["kubbe_nx"], P["salon_ic_y"] / P["kubbe_ny"]
c0 = Vector((0, 0))
A_ = "A" in ASAMA; B_ = "B" in ASAMA; C_ = "C" in ASAMA

def hexv(h): return tuple(int(h[i:i + 2], 16) / 255 for i in (1, 3, 5))
MALZ = [  # anahtar, ad, hex, rough, metal
    ("duvar", "Duvar", "#CFA986", 0.70, 0.0),        # almaşık doku ortalaması (plan §5.1)
    ("cati", "Cati", "#9AA2A8", 0.55, 0.20),         # v05: kubbe arası gövde çatısı kubbeye yakın koyu kurşun (F 2024 havadan); v04 #C3C9CD neredeyse beyazdı
    ("kubbe", "Kubbe", "#858D93", 0.55, 0.20),       # v05: eskimiş kurşun (V 0,58; F 2024 havadan, kubbeler koyu gri). Standart §3 «eskimiş kurşun» satırı; V < 0,72 kullanıcı kararı
    ("kapi", "Kapi", "#7A5134", 0.75, 0.0),
    ("tugla", "Tugla", "#C0683F", 0.70, 0.0),
    ("tas", "Tas", "#D3BE98", 0.70, 0.0),            # kesme taş (kapı çerçeveleri, pencere alınlığı)
    ("kitabe", "Kitabe", "#ECEAE4", 0.40, 0.0),      # mermer (kitabe paneli)
    ("pencere", "Pencere", "#3E4A55", 0.30, 0.0),
    ("aciklik", "Dukkan_Aciklik", "#3E4A55", 0.30, 0.0),   # dükkân açıklıkları (plan §5.1: #3E4A55)
    ("ic", "Giris_Ic", "#E8DFCB", 0.80, 0.0),        # T: kapı geçidi içi, krem sıva (standart §3)
    ("bant_cati", "Bant_Cati", "#AEB6BC", 0.55, 0.20),  # v04b: kurşun koyu tonu #AEB6BC, ek çizgisi #8E979D (cati_ek.png)
    ("vitrin", "Dukkan_Vitrin", "#9FB8C0", 0.30, 0.0),  # plan §1.3: dukkan_vitrin.png
    ("zemin", "Zemin", "#C4BDAF", 0.90, 0.0),
    ("kaide_yan", "Kaide_Yan", "#A39A8B", 0.90, 0.0),
    ("serit", "Serit_Tas", "#B3A590", 0.85, 0.0),
    ("derz", "Serit_Derz", "#A69A86", 0.90, 0.0),
    ("bordur", "Serit_Bordur", "#D2C3A4", 0.80, 0.0),
]
M = {k: A.mat(n, h, r, m_) for k, n, h, r, m_ in MALZ}

def doku_bagla(m, dosya):
    nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tx = nt.nodes.new("ShaderNodeTexImage"); tx.image = bpy.data.images.load(os.path.join(DOKU, dosya), check_existing=True)
    tx.name = "DOKU"; nt.links.new(tx.outputs["Color"], bsdf.inputs["Base Color"])
DOKULU = [M["kubbe"], M["pencere"], M["duvar"], M["bant_cati"], M["vitrin"]]
doku_bagla(M["kubbe"], "kubbe_dilim.png"); doku_bagla(M["pencere"], "pencere.png"); doku_bagla(M["duvar"], "almasik.png")
doku_bagla(M["bant_cati"], "cati_ek.png"); doku_bagla(M["vitrin"], "dukkan_vitrin.png")

def R4(hx, hy, cx=0.0, cy=0.0): return A.rect(Vector((cx, cy)), 2 * hx, 2 * hy)

def ring(g, outer, inner, z0, z1, m_side, m_top):
    n = len(outer)
    ob, ot = [g.V(q, z0) for q in outer], [g.V(q, z1) for q in outer]
    ib, it = [g.V(q, z0) for q in inner], [g.V(q, z1) for q in inner]
    for i in range(n):
        j = (i + 1) % n
        g.F([ob[i], ob[j], ot[j], ot[i]], m_side); g.F([ib[j], ib[i], it[i], it[j]], m_side)
        g.F([ot[i], ot[j], it[j], it[i]], m_top); g.F([ob[j], ob[i], ib[i], ib[j]], m_side)

def kemerli(w, z0, zs, n=8):
    arc = [((w / 2) * math.cos(math.pi * k / n), zs + (w / 2) * math.sin(math.pi * k / n)) for k in range(n + 1)]
    return [(-w / 2, z0), (w / 2, z0)] + arc

def u_halka(w_dis, w_ic, zs, n=8):
    """Kemerli U şeklinde halka (alt kenarı açık): dış kemer w_dis, iç kemer w_ic, ikisi de zs üzengili, z = 0'dan başlar. Tek basit çokgen."""
    ro, ri = w_dis / 2, w_ic / 2
    dis = [(ro * math.cos(math.pi * k / n), zs + ro * math.sin(math.pi * k / n)) for k in range(n + 1)]   # sağ → sol
    ic = [(ri * math.cos(math.pi * k / n), zs + ri * math.sin(math.pi * k / n)) for k in range(n + 1)]
    return [(ro, 0)] + dis + [(-ro, 0), (-ri, 0)] + ic[::-1] + [(ri, 0)]

def kemer_halka(r_ic, r_dis, zs, n=10):
    """Yalnız kemer kısmı (yarım halka), üzengi zs'de; bacak yok. Tek basit çokgen."""
    dis = [(r_dis * math.cos(math.pi * k / n), zs + r_dis * math.sin(math.pi * k / n)) for k in range(n + 1)]   # sağ → sol
    ic = [(r_ic * math.cos(math.pi * k / n), zs + r_ic * math.sin(math.pi * k / n)) for k in range(n + 1)]
    return dis + ic[::-1]

def u_cukur(w_cukur, zs, w_dis, h_dis, n=8):
    """Dikdörtgen levha (w_dis × h_dis) içinde alttan kemerli çukur (tek basit çokgen): taş çerçeve."""
    r = w_cukur / 2
    arc = [(r * math.cos(math.pi * k / n), zs + r * math.sin(math.pi * k / n)) for k in range(n + 1)]   # sağ → sol
    return [(-w_dis / 2, 0), (-r, 0)] + arc[::-1] + [(r, 0), (w_dis / 2, 0), (w_dis / 2, h_dis), (-w_dis / 2, h_dis)]

def panel(g, O, T, N, poly, o0, o1, m, m_yan=None, uv=False):
    Pt = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
    a = [g.bm.verts.new(Pt(s, z, o0)) for s, z in poly]; b = [g.bm.verts.new(Pt(s, z, o1)) for s, z in poly]
    on = g.F(b, m); g.F(a[::-1], m_yan or m)
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g.F([a[i], a[j], b[j], b[i]], m_yan or m)
    if uv and on:
        uvl = g.bm.loops.layers.uv.verify()
        s0, s1 = min(s for s, _ in poly), max(s for s, _ in poly); z0, z1 = min(z for _, z in poly), max(z for _, z in poly)
        for l in on.loops:
            s, z = poly[b.index(l.vert)]; l[uvl].uv = ((s - s0) / (s1 - s0), (z - z0) / (z1 - z0))

def yuzler(hx, hy):
    return {"K": (Vector((0, hy)), Vector((1, 0)), Vector((0, 1))), "G": (Vector((0, -hy)), Vector((1, 0)), Vector((0, -1))),
            "D": (Vector((hx, 0)), Vector((0, 1)), Vector((1, 0))), "B": (Vector((-hx, 0)), Vector((0, 1)), Vector((-1, 0)))}
YB = yuzler(OX, OY)                                    # bandın dış yüzü
def uzunluk(k): return P["toplam_x"] if k in "KG" else P["toplam_y"]
def derinlik(k): return OY - BY if k in "KG" else OX - BX     # bant derinliği (v04b: K/G 7,75; D/B 5,60)
def wpt(k, s, d):
    """Cephe k'de s (teğet) ve d (içeri doğru derinlik) → dünya (x, y)."""
    O, T, N = YB[k]; q = O + T * s - N * d; return Vector((q.x, q.y))
def wdik(k, s0, s1, d0, d1): return [wpt(k, s0, d0), wpt(k, s1, d0), wpt(k, s1, d1), wpt(k, s0, d1)]

def dukkan_merkezleri(k):
    L = uzunluk(k); n = P["dukkan_n_uzun"] if k in "KG" else P["dukkan_n_kisa"]
    kose = (L - P["giris_modul"] - 2 * n * P["dukkan_adim"]) / 2          # köşe kör bölüm (v04b: uzun 4,6; kısa 2,5)
    bati = [-L / 2 + kose + P["dukkan_adim"] * (i + 0.5) for i in range(n)]
    dogu = [P["giris_modul"] / 2 + P["dukkan_adim"] * (i + 0.5) for i in range(n)]
    return bati + dogu, kose

def cutter(ad, m):
    return A.G(ad, [m])

def bool_fark(hedef, cut_ob):
    md = hedef.modifiers.new("kes", 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = cut_ob; md.solver = 'EXACT'
    try: md.material_mode = 'TRANSFER'
    except Exception: pass
    bpy.ops.object.select_all(action='DESELECT'); hedef.select_set(True); bpy.context.view_layer.objects.active = hedef
    bpy.ops.object.modifier_apply(modifier=md.name)
    bpy.data.objects.remove(cut_ob, do_unlink=True)

A.temizle()

# ================= GÖVDE (korunur) =================
g = A.G("Govde"); g.prism(R4(BX, BY), 0.0, P["cati_h"], M["duvar"], M["cati"]); g.obj()
g = A.G("Cati")
lo = [g.V(q, P["cati_h"] - 0.05) for q in R4(BX, BY)]
hi = [g.V(q, P["salon_h"]) for q in R4(P["salon_ic_x"] / 2, P["salon_ic_y"] / 2)]
for i in range(4):
    j = (i + 1) % 4; g.F([lo[i], lo[j], hi[j], hi[i]], M["cati"])
g.F(hi, M["cati"]); g.F(lo[::-1], M["cati"])
g.obj(recalc=False)

# ---- Kubbeler: +10,25 → +10,50 dik etek, üstünde yarım küre r 3,70 → tepe +14,20 (plan §3) ----
g = A.G("Kubbeler"); r = P["kubbe_dis_d"] / 2; zet = P["salon_h"] + P["kubbe_etek"]
rise = P["kubbe_tepe"] - P["salon_h"]; KUBBE_MERKEZ = []
for i in range(P["kubbe_nx"]):
    for j in range(P["kubbe_ny"]):
        c = Vector((-P["salon_ic_x"] / 2 + GX * (i + 0.5), -P["salon_ic_y"] / 2 + GY * (j + 0.5))); KUBBE_MERKEZ.append(c)
        pc = A.circle(c, r, P["D_kubbe_dilim"])
        g.prism(pc, P["salon_h"] - 0.05, zet, M["kubbe"], False)
        g.dome(pc, zet, P["kubbe_tepe"] - zet, M["kubbe"], rings=8, cap=False)
kubbe_ob = g.obj()

# ================= BANT: gövdeye bitişik, 71,70 × 35,50; duvar → eğimli kurşun çatı =================
gm = P["bant_gomme"]; ZC_IC, ZC_SAC, TAS_, KAL = P["bant_cati_ic"], P["bant_cati_sacak"], P["bant_cati_tasma"], P["bant_cati_kalin"]
RIX, RIY = BX - gm, BY - gm                      # çatı iç kenarı (gövdeye gömülü)
ROX, ROY = OX + TAS_, OY + TAS_                  # çatı dış kenarı (saçak ucu)
ZC_IC2 = ZC_IC + 0.005                           # gömülü iç kenar: eğim uzantısı yok sayılabilir (5 mm)
def cati_ust_alt():
    """Çatı: iç dikdörtgen (z ZC_IC2) → dış dikdörtgen (z ZC_SAC), dört yamuk + köşegen kırma. Döner: (iç, dış) köşe çiftleri."""
    return R4(RIX, RIY), R4(ROX, ROY)

g = A.G("Dukkanlar")
ring(g, R4(OX, OY), R4(BX - 2 * gm, BY - 2 * gm), 0.0, 5.7, M["duvar"], M["duvar"])    # yüksek duvar halkası; çatı altı kesilir
dukkan_ob = g.obj()

# (1) 56 dükkân açıklığı: gerçek oyuk; arka yüzde vitrin dokusu (3 varyant sırayla). Çerçeve çıtası açıklık hacmine girmez.
def oyuk_kesici(g_, O, T, N, w, z0, zs, d, var):
    poly = kemerli(w, z0, zs, 8); zt = zs + w / 2
    Pt = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
    a_ = [g_.bm.verts.new(Pt(s, z, -d)) for s, z in poly]; b_ = [g_.bm.verts.new(Pt(s, z, 0.3)) for s, z in poly]
    fa = g_.F(a_[::-1], M["vitrin"]); g_.F(b_, M["tas"])
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g_.F([a_[i], a_[j], b_[j], b_[i]], M["tas"])      # v04b: açıklık içi sade taş (1960 fotoğrafı)
    uvl = g_.bm.loops.layers.uv.verify()
    for l in fa.loops:
        s, z = poly[a_.index(l.vert)]; l[uvl].uv = ((var + (s + w / 2) / w) / 3.0, (z - z0) / (zt - z0))
cg = cutter("_kes_dukkan", M["vitrin"]); SAYIM = {}; VARYANT = {}; sira = 0
for k in "KGDB":
    O, T, N = YB[k]; mer, kose = dukkan_merkezleri(k); SAYIM[k] = len(mer); VARYANT[k] = []
    for s in mer:
        v = sira % 3; sira += 1; VARYANT[k].append(v)
        oyuk_kesici(cg, O + T * s, T, N, P["dukkan_acik_w"], -0.2, P["dukkan_uzengi"], P["dukkan_oyuk_d"], v)
bool_fark(dukkan_ob, cg.obj())

# (2) giriş kapısı geçidi (yarım daire kemer: açıklık 3,0, üzengi 3,0, tepe 4,5; eşik +0,45); geçit arkası kapalı
cg = cutter("_kes_kapi", M["tas"])
for k in "KGDB":
    O, T, N = YB[k]
    poly = kemerli(P["kapi_w"], P["esik"], P["kapi_uzengi"], 12); Pt = lambda s_, z, o: (O.x + T.x * s_ + N.x * o, O.y + T.y * s_ + N.y * o, z)
    a_ = [cg.bm.verts.new(Pt(s_, z, -P["kapi_oyuk_d"])) for s_, z in poly]; b_ = [cg.bm.verts.new(Pt(s_, z, 0.3)) for s_, z in poly]
    cg.F(a_[::-1], M["kapi"]); cg.F(b_, M["tas"])                  # arka yüz: koyu kahve kapı kanadı (geçidin dibinde, oyuk yüzeyi)
    for i in range(len(poly)):
        j = (i + 1) % len(poly); cg.F([a_[i], a_[j], b_[j], b_[i]], M["tas"])    # geçit yan yüzleri: kesme taş
bool_fark(dukkan_ob, cg.obj())

# (3) çatı altı yüzeyi: duvar halkası çatı altına kadar kesilir (üstteki hacim silinir)
zalt = lambda z: z - KAL
ri, ro = cati_ust_alt()
g = A.G("_kes_cati")
fi = [g.V(q, zalt(ZC_IC2)) for q in ri]; fo = [g.V(q, zalt(ZC_SAC)) for q in ro]
top_o = [g.V(q, 9.0) for q in ro]
for i in range(4):
    j = (i + 1) % 4
    g.F([fo[i], fo[j], fi[j], fi[i]], M["duvar"])                   # alt yüzey: dışarıdan içeriye yükselen yamuklar
    g.F([fo[i], top_o[i], top_o[j], fo[j]], M["duvar"])             # dış dik yüzler
g.F(fi[::-1], M["duvar"]); g.F(top_o[::-1], M["duvar"])            # iç düz taban ve üst kapak
bool_fark(dukkan_ob, g.obj())

# ---- Bant çatısı: tek yöne dışa düşen kurşun çatı (üst: iç +5,40 → dış saçak +4,70), köşelerde kırma, giriş modülünde saçak taşması kesik ----
g = A.G("_bant_cati")
ui = [g.V(q, ZC_IC2) for q in ri]; uo = [g.V(q, ZC_SAC) for q in ro]
li = [g.V(q, zalt(ZC_IC2)) for q in ri]; lo_ = [g.V(q, zalt(ZC_SAC)) for q in ro]
for i in range(4):
    j = (i + 1) % 4
    g.F([uo[i], uo[j], ui[j], ui[i]], M["bant_cati"])               # üst
    g.F([lo_[j], lo_[i], li[i], li[j]], M["cati"])                  # alt
    g.F([lo_[i], lo_[j], uo[j], uo[i]], M["cati"])                  # dış saçak yüzü
    g.F([li[j], li[i], ui[i], ui[j]], M["cati"])                    # iç uç (gövdeye gömülü)
bant_cati_ob = g.obj()
# v04b: giriş modülünde çatı kesilmez; kapı çerçevesi çatı hattının altında kalır, çatı kesintisiz geçer
# Cati (gövde alçak kırma kurşun çatı) ile aynı nesne
bpy.ops.object.select_all(action='DESELECT'); bant_cati_ob.select_set(True); bpy.data.objects["Cati"].select_set(True)
bpy.context.view_layer.objects.active = bpy.data.objects["Cati"]; bpy.ops.object.join(); cati_ob = bpy.data.objects["Cati"]

# ---- Sacak: gövde saçağı (v02) + bant saçağı (çatı saçağının altında; giriş modüllerinde kesik, kapı kemerinin üstünden geçmez) ----
g = A.G("Sacak"); sd = P["D_sacak_d"]
ring(g, R4(BX + sd, BY + sd), R4(BX - 0.05, BY - 0.05), P["cati_h"] - P["D_sacak_h"], P["cati_h"], M["tas"], M["cati"])
bsd, bsh = P["bant_sacak_d"], P["bant_sacak_h"]; zt = 4.60
for k in "KGDB":      # v04b: silme kesintisiz (kapı çerçevesi altında kalır)
    L = uzunluk(k) / 2; e = bsd if k in "KG" else 0
    g.prism(wdik(k, -L - e, L + e, -bsd, 0.25), zt - bsh, zt, M["tas"], M["tas"])
g.obj(recalc=True)

# ---- Pencereler (v02; giriş kasnağının örttüğü pencereler kaldırılır) ----
g = A.G("Pencereler")
def pencere(O, T, N, s):
    """v04b (F 2024): yuvarlak kemerli açıklık 1,0 × 2,05 (+5,55 → +7,60), üstünde tek sıra tuğla kemer (0,15), altta ince taş denizlik."""
    O2 = O + T * s; pw, kk = P["D_pen_w"], P["D_pen_kemer_k"]; z0, zk = P["D_pen_alt"], P["D_pen_kemer_z"]
    panel(g, O2, T, N, kemer_halka(pw / 2, pw / 2 + kk, zk, 10), 0.0, 0.07, M["tugla"])
    panel(g, O2, T, N, [(-pw / 2 - 0.08, z0 - 0.07), (pw / 2 + 0.08, z0 - 0.07), (pw / 2 + 0.08, z0), (-pw / 2 - 0.08, z0)], 0.0, 0.09, M["tas"])
    panel(g, O2, T, N, kemerli(pw, z0, zk, 10), 0.02, 0.04, M["pencere"], M["tas"], uv=True)
Y = yuzler(BX, BY); PEN_SAYI = {"K": 0, "G": 0, "D": 0, "B": 0}
xs = [-P["salon_ic_x"] / 2 + GX * (i + 0.5) for i in range(P["kubbe_nx"])]
for k in "KG":
    for x in xs: pencere(*Y[k], x); PEN_SAYI[k] += 1          # uzun cephe 7
for k in "DB":
    for y in P["D_pen_kisa_y"]: pencere(*Y[k], y); PEN_SAYI[k] += 1   # kısa cephe 4
g.obj()

# ---- Dukkan_Kapilari: v04b sade taş kemer (yalnız kemer, ince; 1960 fotoğrafında dükkân kemerleri çerçevesiz) ----
g = A.G("Dukkan_Kapilari"); ca = P["cerceve_aralik"]
for k in "KGDB":
    O, T, N = YB[k]; mer, _ = dukkan_merkezleri(k)
    for s in mer:
        r_ic = P["dukkan_acik_w"] / 2 + ca
        panel(g, O + T * s, T, N, kemer_halka(r_ic, r_ic + 0.15, P["dukkan_uzengi"], 10), -0.02, 0.03, M["tas"])
g.obj()

# ================= KAPILAR: yarım daire kemerli dış kapı, 0,5 tuğla–taş almaşık kemer bandı, taş çerçeve, basamak, güney kitabesi =================
def kemer_bandi(g_, O, T, N, r_ic, kal, zs, n, o0, o1):
    """Yarım daire kemer bandı: n dilim (voussoir) dönüşümlü tuğla/taş; iki bacakta üçer blok. Parçalar arası 1 cm derz boşluğu."""
    r_dis = r_ic + kal; gap = 0.005; par = 0
    for i in range(n):
        a0 = math.pi * i / n; a1 = math.pi * (i + 1) / n; da = gap / r_ic
        pa = [(r_ic * math.cos(a0 + da), zs + r_ic * math.sin(a0 + da)), (r_dis * math.cos(a0 + da), zs + r_dis * math.sin(a0 + da)),
              (r_dis * math.cos(a1 - da), zs + r_dis * math.sin(a1 - da)), (r_ic * math.cos(a1 - da), zs + r_ic * math.sin(a1 - da))]
        panel(g_, O, T, N, pa, o0, o1, M["tas"]); par += 1      # v04b: sade kesme taş (dönüşümlü tuğla kaldırıldı)
    nb = 3; hb = zs / nb
    for sg in (1, -1):
        for i in range(nb):
            z0 = i * hb + gap; z1 = (i + 1) * hb - gap
            x0, x1 = (r_ic + gap, r_dis) if sg == 1 else (-r_dis, -r_ic - gap)
            panel(g_, O, T, N, [(x0, z0), (x1, z0), (x1, z1), (x0, z1)], o0, o1, M["tas"])
def merdiven(g_, O, T, N):
    """Basamaklar tek kapalı profil olarak: (d dışa doğru, z). Kapıya en yakın basamak en yüksek (eşik +0,45)."""
    n, rh, td, w = P["basamak_n"], P["basamak_h"], P["basamak_d"], P["basamak_w"]; emb = 0.05
    prof = [(-emb, 0.0), (n * td, 0.0)]
    for i in range(n):                                  # dıştan içe: yükselen basamaklar
        prof += [(n * td - i * td, rh * (i + 1)), (n * td - (i + 1) * td, rh * (i + 1))]
    prof += [(-emb, n * rh)]
    Pt = lambda sg, d, z: (O.x + T.x * sg * w / 2 + N.x * d, O.y + T.y * sg * w / 2 + N.y * d, z)
    a_ = [g_.bm.verts.new(Pt(-1, d, z)) for d, z in prof]; b_ = [g_.bm.verts.new(Pt(1, d, z)) for d, z in prof]
    g_.F(a_, M["tas"]); g_.F(b_[::-1], M["tas"])
    for i in range(len(prof)):
        j = (i + 1) % len(prof); g_.F([a_[i], b_[i], b_[j], a_[j]], M["tas"])
g = A.G("Kapilar"); fw = P["kapi_cerceve_w"]; zs = P["kapi_uzengi"]; rk = P["kapi_w"] / 2; kb = P["kapi_bant_k"]; kg = 0.02
for k in "KGDB":
    O, T, N = YB[k]
    fh = P["kitabe_cerceve_h"] if k == "G" else P["kapi_cerceve_h"]
    panel(g, O, T, N, u_cukur(2 * (rk + kg + kb) + 0.03, zs, fw, fh, 12), -0.03, 0.05, M["tas"])      # taş çerçeve (tuğla–taş kemer bandını çevreler)
    kemer_bandi(g, O, T, N, rk + kg, kb, zs, 12, -0.03, 0.08)
    if k == "G":                                                                                    # kûfi kitabe: yazısız taş panel (çerçeve yüzünün önünde 3 cm kabartma)
        kz = P["kitabe_z"]; kw_, kh_ = P["kitabe_w"], P["kitabe_h"]
        panel(g, O, T, N, [(-kw_ / 2, kz), (kw_ / 2, kz), (kw_ / 2, kz + kh_), (-kw_ / 2, kz + kh_)], 0.04, 0.05 + P["kitabe_kabartma"], M["kitabe"])
    merdiven(g, O, T, N)                                                                            # 3 basamak (tek profil, kapıya en yakını en yüksek)
g.obj()

# ================= C: ZEMİN (yalnız sunum), ŞERİT, FİGÜRLER =================
def yuvarlak_dik(hx, hy, r, n):
    """Köşeleri r yarıçaplı çeyrek dairelerle yuvarlatılmış dikdörtgen (saat yönü tersine)."""
    pts = []
    for cx, cy, a0 in ((hx - r, hy - r, 0.0), (-hx + r, hy - r, 90.0), (-hx + r, -hy + r, 180.0), (hx - r, -hy + r, 270.0)):
        for k in range(n + 1):
            a = math.radians(a0 + 90.0 * k / n); pts.append(Vector((cx + r * math.cos(a), cy + r * math.sin(a))))
    return pts
if C_:
    # v05: oval (süperelips |x/a|^n + |y/b|^n = 1) taş şeridin köşesinden (OX + şerit + pay, OY + şerit + pay) geçer
    kn = P["kaide_n"]; kt = P["kaide_kalin"]; up = P["kaide_ust_pah"]; ks = P["kaide_seg"]
    ka = (OX + P["serit_w"] + P["kaide_pay"]) * 2 ** (1 / kn); kb = (OY + P["serit_w"] + P["kaide_pay"]) * 2 ** (1 / kn)
    def oval(da):
        out = []
        for k in range(ks):
            t = 2 * math.pi * k / ks; c, s_ = math.cos(t), math.sin(t)
            out.append(Vector(((ka - da) * math.copysign(abs(c) ** (2 / kn), c), (kb - da) * math.copysign(abs(s_) ** (2 / kn), s_))))
        return out
    rapor_kaide = {"bicim": "elips" if kn == 2 else "superelips n=%g" % kn, "yari_eksen_m": [round(ka, 2), round(kb, 2)], "pay_m": P["kaide_pay"]}
    g = A.G("Zemin")
    alt = oval(0.0); ust = oval(up); ns = len(alt)
    a0 = [g.V(q, -kt) for q in alt]; a1 = [g.V(q, -up) for q in alt]; u1 = [g.V(q, 0.0) for q in ust]
    for i in range(ns):
        j = (i + 1) % ns
        g.F([a0[i], a0[j], a1[j], a1[i]], M["kaide_yan"]); g.F([a1[i], a1[j], u1[j], u1[i]], M["kaide_yan"])
    g.F(u1, M["zemin"]); g.F(a0[::-1], M["kaide_yan"])
    zemin_ob = g.obj()
    sw = P["serit_w"]
    g = A.G("Zemin_Serit"); ring(g, R4(OX + sw, OY + sw), R4(OX, OY), 0.0, 0.003, M["serit"], M["serit"]); serit_ob = g.obj()
    g = A.G("Zemin_Derz"); dz = 0.04; zr0, zr1 = 0.003, 0.004
    def kutu(x0, x1, y0, y1): g.prism([Vector((x0, y0)), Vector((x1, y0)), Vector((x1, y1)), Vector((x0, y1))], zr0, zr1, M["derz"], M["derz"])
    nx = int((OX + sw) // 1.0)
    for i in range(-nx, nx + 1):                                  # kuzey/güney şeritleri: 1,0 m karo (x), 0,5 m (y)
        x = float(i)
        for y0, y1 in ((OY, OY + sw), (-OY - sw, -OY)): kutu(x - dz / 2, x + dz / 2, y0, y1)
    for j in range(0, 7):
        y = OY + 0.5 * j
        for sg in (1, -1):
            yy = sg * y
            kutu(-OX - sw, OX + sw, yy - dz / 2, yy + dz / 2)
    ny = int(OY // 1.0)
    for i in range(-ny, ny + 1):                                  # doğu/batı şeritleri (köşeler kuzey/güney şeritlerinde)
        y = float(i)
        for x0, x1 in ((OX, OX + sw), (-OX - sw, -OX)): kutu(x0, x1, y - dz / 2, y + dz / 2)
    for j in range(0, 7):
        x = OX + 0.5 * j
        for sg in (1, -1): kutu(sg * x - dz / 2, sg * x + dz / 2, -OY, OY)
    g.obj(recalc=False)
    g = A.G("Zemin_Bordur"); ring(g, R4(OX + sw, OY + sw), R4(OX + sw - P["bordur_k"], OY + sw - P["bordur_k"]), 0.0, P["bordur_h"], M["bordur"], M["bordur"]); g.obj()
else:
    g = A.G("_Zemin_gecici"); g.prism(R4(OX + 40, OY + 40), -0.3, 0.0, M["zemin"], M["zemin"]); g.obj()

# ================= UV =================
def uv_kubbe(ob, merkezler, nseg, zb, rise_, mat):
    me = ob.data; uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
    idx = [i for i, s in enumerate(ob.material_slots) if s.material is mat]; seg = 2 * math.pi / nseg
    for p in me.polygons:
        if p.material_index not in idx: continue
        pc = p.center; c = min(merkezler, key=lambda q: (q.x - pc.x) ** 2 + (q.y - pc.y) ** 2)
        af = math.atan2(pc.y - c.y, pc.x - c.x)
        for li in p.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co; rr = math.hypot(co.x - c.x, co.y - c.y)
            if rr < 1e-3: u = 0.5
            else:
                da = (math.atan2(co.y - c.y, co.x - c.x) - af + math.pi) % (2 * math.pi) - math.pi; u = 0.5 + da / seg
            uvl.data[li].uv = (u, max((co.z - zb) / rise_, 0) * P["D_kubbe_sira"])
uv_kubbe(kubbe_ob, KUBBE_MERKEZ, P["D_kubbe_dilim"], P["salon_h"], rise, M["kubbe"])
def uv_bant_cati(ob):
    """Bant çatısı üst yüzü: ek çizgileri eğim doğrultusunda, 0,6 m aralıkla (kuzey/güney: u = x; doğu/batı: u = y)."""
    me = ob.data; uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
    idx = [i for i, s_ in enumerate(ob.material_slots) if s_.material is M["bant_cati"]]
    for p in me.polygons:
        if p.material_index not in idx: continue
        c = p.center; kg_ = (abs(c.y) - BY) / (OY + TAS_ - BY) >= (abs(c.x) - BX) / (OX + TAS_ - BX)
        for li in p.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            uvl.data[li].uv = ((co.x / 0.6, abs(co.y) / 0.6) if kg_ else (co.y / 0.6, abs(co.x) / 0.6))
uv_bant_cati(cati_ob)

def uv_almasik():
    """Dünya koordinatından: v04b kutu almaşık karosu 1,04 m × 0,88 m (iki sıra); sıralar yatay, bant ile gövde arasında kesintisiz."""
    kw_, kh_ = 1.04, 0.88
    for o in [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin"))]:
        idx = [i for i, s in enumerate(o.material_slots) if s.material is M["duvar"]]
        if not idx: continue
        me = o.data; uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
        for p in me.polygons:
            if p.material_index not in idx: continue
            n = p.normal; t = Vector((-n.y, n.x, 0)).normalized() if abs(n.z) < 0.7 else None
            for li in p.loop_indices:
                co = o.matrix_world @ me.vertices[me.loops[li].vertex_index].co
                uvl.data[li].uv = ((co.x * t.x + co.y * t.y) / kw_, co.z / kh_) if t is not None else (co.x / kw_, co.y / kh_)
uv_almasik()

# ================= FİGÜRLER (aşama C): ortak set akar3d.insan =================
FIGUR = []
if C_:
    dy = OY + 1.4
    # (ad, poz, boy, konum, yön°, kadın, renk)  — plan §5.4: kuzey ve batı girişlerinde ikişer, dükkân önlerinde dört
    for ad, poz, boy, kon, yon, kad, ren in (
        ("kuzey_kapi_yani", "ayakta", 1.78, (-2.6, OY + 1.6, 0.0), 270, False, 0),            # kapı 4,5 m ile ölçek karşılaştırması
        ("kuzey_basamak", "basamak", 1.68, (0.6, OY + 0.15, 0.0), 270, True, 1),
        ("bati_giris_1", "yuruyen", 1.75, (-OX - 1.8, 2.8, 0.0), 0, False, 2),
        ("bati_giris_2", "ayakta", 1.66, (-OX - 2.6, -2.6, 0.0), 180, True, 0),
        ("dukkan_1", "yuruyen", 1.80, (-14.0, OY + 1.8, 0.0), 0, False, 1),
        ("dukkan_2", "oturan", 1.72, (13.0, OY + 1.2, 0.0), 270, False, 2),
        ("dukkan_3", "ayakta", 1.65, (-9.0, -OY - 1.8, 0.0), 90, True, 1),
        ("dukkan_4", "yuruyen", 1.70, (19.0, -OY - 2.4, 0.0), 180, False, 0),
    ):
        FIGUR.append((ad, poz, boy, kon, yon, kad, ren))
    for i, (ad, poz, boy, kon, yon, kad, ren) in enumerate(FIGUR, 1):
        ob = A.insan(f"Olcek_Insan_{i:02d}", poz=poz, boy=boy, konum=kon, yon=yon, kadin=kad, renk=ren, adim_yuk=P["basamak_h"])

# ================= RENDER (genel standart §2: Cycles 24 örnek, Standard, güneş 1,25 / 35° / (50°, 0, −35°), dünya 0,80) =================
def render_kur(w, h, orn=24):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = orn; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
    sc.render.resolution_x, sc.render.resolution_y = w, h; sc.render.resolution_percentage = 100
    sc.render.film_transparent = True
    if bpy.data.objects.get("_sun") is None:
        wd = bpy.data.worlds.new("_w"); wd.use_nodes = True; sc.world = wd
        bg = next(n for n in wd.node_tree.nodes if n.type == "BACKGROUND")
        bg.inputs[0].default_value = (0.80, 0.80, 0.80, 1); bg.inputs[1].default_value = 1.0
        sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
        sun.data.energy = 1.25; sun.data.angle = math.radians(35); sun.rotation_euler = (math.radians(50), 0, math.radians(-35))

def kamera(ad, loc, hedef, orto=None, lens=35):
    cd = bpy.data.cameras.get(ad) or bpy.data.cameras.new(ad)
    if orto: cd.type = 'ORTHO'; cd.ortho_scale = orto
    else: cd.type = 'PERSP'; cd.lens = lens
    cd.clip_start = 0.5; cd.clip_end = 2000
    cam = bpy.data.objects.get(ad) or bpy.data.objects.new(ad, cd)
    if cam.name not in bpy.context.scene.collection.objects: bpy.context.scene.collection.objects.link(cam)
    cam.location = Vector(loc); cam.rotation_euler = (Vector(hedef) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    return cam

def cek(ad, loc, hedef, w, h, orto=None, lens=35, orn=24, klasor=None):
    if HIZLI: w, h, orn = w // 3, h // 3, 8
    render_kur(w, h, orn); cam = kamera("CAM_" + ad, loc, hedef, orto, lens)
    sc = bpy.context.scene; sc.camera = cam
    sc.render.filepath = os.path.join(klasor or KONTROL, f"{ad}.png"); bpy.ops.render.render(write_still=True)

def standart_kamera(d=200.0, az=45.0, el=32.0, hedef=(0, 0, 3)):
    a, e = math.radians(az), math.radians(el)
    return (hedef[0] + d * math.cos(e) * math.cos(a), hedef[1] + d * math.cos(e) * math.sin(a), hedef[2] + d * math.sin(e))

def foto2024_kamera():
    v = os.environ.get("AKAR_FOTO")
    if v: return [float(x) for x in v.split(",")]
    return [-100.4, 101.4, 25.6, -34.2, 27.1, 15.0, 70.0]      # 4 kontrol noktasından çözüldü (H): kuzeybatıdan bakış; foto Uludağ + Ulu Cami sarı kasnakları ile güneye bakıyor

CEKIMLER = os.environ.get("AKAR_CEKIM", "havadan,kuzey_orto,tepeden,foto2024,dukkan_yakin,giris_yakin,kuzey_giris,guney_kapi,doku_yakin,sokak").split(",")
def renderlar():
    """v04b: render seti teslim kontrollerinden ve AO'dan SONRA alınır (görüntü = teslim edilen model)."""
    if not A_ or os.environ.get("AKAR_RENDER_YOK"): return
    os.makedirs(KONTROL, exist_ok=True)
    kapsam = 2.0 if C_ else 1.0
    if "havadan" in CEKIMLER: cek("havadan", standart_kamera(), (0, 0, 3), 1800, 1600, orto=92 * (1.55 if C_ else 1.0))   # v05: oval kaide sığsın (1,28 → 1,55)
    if "kuzey_orto" in CEKIMLER: cek("kuzey_orto", (0, 150, 7), (0, 0, 7), 2400, 900, orto=76)
    if "tepeden" in CEKIMLER: cek("tepeden", (0, 1.0, 200), (0, 1.0, 0), 1775, 889, orto=82.6)
    if "foto2024" in CEKIMLER:
        f = foto2024_kamera(); cek("foto2024", f[0:3], f[3:6], 1500, 996, lens=f[6])
    if B_ and "kuzey_giris" in CEKIMLER: cek("kuzey_giris", (14, OY + 26, 12), (0, OY, 3.5), 1600, 1000, lens=40)
    if B_ and "guney_kapi" in CEKIMLER: cek("guney_kapi", (-3.5, -OY - 14, 3.0), (0, -OY, 3.4), 1600, 1000, lens=40)
    if B_ and "dukkan_yakin" in CEKIMLER: cek("dukkan_yakin", (-6.0, OY + 7.0, 1.9), (-12.5, OY, 2.0), 1600, 1000, lens=32)
    if B_ and "giris_yakin" in CEKIMLER: cek("giris_yakin", (5.5, OY + 10.5, 2.3), (0, OY, 2.6), 1600, 1000, lens=32)
    if B_ and "doku_yakin" in CEKIMLER: cek("doku_yakin", (-22, BY + 5.5, 7.4), (-22, BY, 7.2), 1600, 1000, lens=45)   # v04b: gövde duvarı almaşığı (bant daraldı)
    if C_ and "sokak" in CEKIMLER: cek("sokak", (-8, OY + 11, 1.65), (2, OY, 3.0), 1600, 1000, lens=26)

# ================= kontrol =================
os.makedirs(KONTROL, exist_ok=True)
mk = A.mesh_kontrol()
print("MESH", json.dumps({k: v for k, v in mk.items()}, ensure_ascii=False))
print("UCGEN", sum(v["ucgen"] for v in mk.values()))

# ================= ölçü doğrulama (plan §6.5): ölçüler modelden okunur =================
def bbox(ad):
    o = bpy.data.objects[ad]; vs = [o.matrix_world @ Vector(c) for c in o.bound_box]
    mn = Vector(map(min, *[(v.x, v.y, v.z) for v in vs])); mx = Vector(map(max, *[(v.x, v.y, v.z) for v in vs])); return mn, mx
def zmax_vert(ad): return max(v.co.z for v in bpy.data.objects[ad].data.vertices)
_bn, _bx = bbox("Dukkanlar"); _gn, _gx = bbox("Govde")
_kz = max(v.co.z for v in bpy.data.objects["Kubbeler"].data.vertices)
_cv = [v.co for v in bpy.data.objects["Cati"].data.vertices]
_ust_ic = max(v.z for v in _cv)
OLCU = {
    "govde_dis": [round(_gx.x - _gn.x, 3), round(_gx.y - _gn.y, 3)],
    "toplam_dis_bant_dahil": [round(_bx.x - _bn.x, 3), round(_bx.y - _bn.y, 3)],
    "bant_derinligi": {"kuzey_guney": round(OY - BY, 3), "dogu_bati": round(OX - BX, 3)},
    "bant_cati": {"govde_duvarinda_ust_kot": P["bant_cati_ic"], "dis_sacak_ust_kot": P["bant_cati_sacak"], "sacak_tasmasi": P["bant_cati_tasma"], "kalinlik": P["bant_cati_kalin"], "egim_kuzey_guney_yuzde": round((ZC_IC - ZC_SAC) / (OY + TAS_ - BY) * 100, 2), "egim_dogu_bati_yuzde": round((ZC_IC - ZC_SAC) / (OX + TAS_ - BX) * 100, 2)},
    "kapi": {"aciklik": P["kapi_w"], "uzengi": P["kapi_uzengi"], "tepe": P["kapi_h"], "esik": P["esik"], "kemer_bandi": P["kapi_bant_k"], "basamak": P["basamak_n"]},
    "govde_sacak_kotu": P["cati_h"], "dukkan_vitrin_varyant_dagilimi": {k: [v.count(i) for i in range(3)] for k, v in VARYANT.items()},
    "dukkan_sayisi_cephe": {"kuzey": SAYIM["K"], "guney": SAYIM["G"], "dogu": SAYIM["D"], "bati": SAYIM["B"], "toplam": sum(SAYIM.values())},
    "dukkan_dizilimi": {"kuzey_guney": "10 + giriş + 10", "dogu_bati": "4 + giriş + 4", "adim": P["dukkan_adim"],
                         "kose_kor_bolum_uzun": round(dukkan_merkezleri("K")[1], 3), "kose_kor_bolum_kisa": round(dukkan_merkezleri("D")[1], 3)},
    "ana_kubbe_tepe_kotu": round(_kz, 3), "ana_kubbe_sayisi": P["kubbe_nx"] * P["kubbe_ny"],
    "govde_penceresi_toplam": sum(PEN_SAYI.values()),
    "kalan_govde_penceresi": PEN_SAYI, "asama": ASAMA,
}
if FIGUR: OLCU["figur_boylari"] = {f"Olcek_Insan_{i:02d}": f[2] for i, f in enumerate(FIGUR, 1)}
json.dump(OLCU, open(os.path.join(KONTROL, "olcu_dogrulama.json"), "w"), ensure_ascii=False, indent=1)
print("OLCU", json.dumps(OLCU, ensure_ascii=False))

# ================= TESLİM (genel standart §5; plan §6): kontrol, renkler, AO, GLB, render, blend =================
import colorsys
TESLIM = C_ and not os.environ.get("AKAR_TESLIM_YOK")
if TESLIM:
    rapor = A.kontrol_hepsi(KONTROL, "kontrol")                # mesh + çakışma + 8 yönden arka yüz (kırmızı oran 0 olmalı)
    mk = A.mesh_kontrol()
    figur_u = sum(v["ucgen"] for k, v in mk.items() if k.startswith("Olcek_"))
    bina_u = sum(v["ucgen"] for k, v in mk.items() if not k.startswith(("Olcek_", "_")))
    rapor["parcalar"] = {k: v["ucgen"] for k, v in mk.items()}
    if C_: rapor["kaide"] = rapor_kaide
    rapor["butce"] = {"bina_ucgen": bina_u, "bina_sinir": 24000, "figur_ucgen": figur_u, "figur_sinir": 6000,
                      "toplam": bina_u + figur_u, "toplam_sinir": 30000,
                      "figur_basina": {k: v["ucgen"] for k, v in mk.items() if k.startswith("Olcek_")}}
    rapor["draw_call"] = sum(len(o.material_slots) for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin")))
    # renk denetimi: geniş yüzeylerde V ≥ 0,72. Zemin/kaide/şerit renkleri standart §1'in kendi değerleri (kullanıcı onaylı), ayrı işaretlenir
    GENIS = {"duvar", "cati", "kubbe", "bant_cati", "tas"}
    ZEMIN_STD = {"zemin", "kaide_yan", "serit", "derz", "bordur"}
    renkler = {}
    def hsv(hx_):
        r_, g_, b_ = [int(hx_[i:i + 2], 16) / 255 for i in (1, 3, 5)]; return [round(x, 3) for x in colorsys.rgb_to_hsv(r_, g_, b_)]
    for k, n, hx_, r_, m_ in MALZ:
        h_ = hsv(hx_)
        renkler[n] = {"hex": hx_, "hsv": h_, "genis_yuzey": k in GENIS, "zemin_standart_1": k in ZEMIN_STD, "V_>=_0.72": h_[2] >= 0.72}
    for o in bpy.data.objects:                                   # figür malzemeleri: ad "Olcek_EEE9DF" → hex
        if o.name.startswith("Olcek_") and o.material_slots:
            n_ = o.material_slots[0].material.name; hx_ = "#" + n_.split("_")[-1][:6]
            renkler[n_] = {"hex": hx_, "hsv": hsv(hx_), "figur": True}
    ist = json.load(open(os.path.join(DOKU, "doku_istatistik.json")))
    renkler["_almasik_doku_ortalamasi"] = {"rgb": ist["almasik_ortalama_rgb"], "sapma_yuzde": ist["kanal_sapma_yuzde"],
                                           "V": round(max(ist["almasik_ortalama_rgb"]) / 255, 3)}
    renkler["_genis_yuzey_V_alti_0_72"] = [n for n, v in renkler.items() if isinstance(v, dict) and v.get("genis_yuzey") and not v.get("V_>=_0.72")]
    json.dump(renkler, open(os.path.join(KONTROL, "renkler.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)

    # AO (standart §2): taban 0,70; kubbe 0,85. ao_vertex dokulu malzemede Base Color'ı sabit renge bağlar → doku yeniden bağlanır (Koza v12 yöntemi)
    if os.environ.get("AKAR_AO", "1") == "1":
        A.ao_vertex(samples=32)
        AO_TABAN = {"varsayilan": 0.70, "Kubbeler": 0.85}
        for o in [o for o in bpy.data.objects if o.type == "MESH" and o.data.color_attributes.get("AO")]:
            tb_ = AO_TABAN.get(o.name, AO_TABAN["varsayilan"])
            for d_ in o.data.color_attributes["AO"].data:
                c_ = tb_ + (1 - tb_) * d_.color[0]; d_.color = (c_, c_, c_, 1.0)
        for m_ in DOKULU:
            nt = m_.node_tree; tx = nt.nodes.get("DOKU"); mul = next((n for n in nt.nodes if n.type == "MIX" and n.blend_type == 'MULTIPLY'), None)
            if tx and mul: nt.links.new(tx.outputs["Color"], mul.inputs[6])
        rapor["ao"] = {"taban": AO_TABAN, "ornek": 32}

    os.makedirs(os.path.dirname(EXPORT), exist_ok=True)
    rapor["glb_bayt"] = A.disa_aktar(EXPORT, draco=True)       # zeminsiz, figürler dahil
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.data.objects:
        if o.type == "MESH" and not o.name.startswith(("REF", "_")): o.select_set(True)
    kw = dict(filepath=EXPORT_SUNUM, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
    try: bpy.ops.export_scene.gltf(export_draco_mesh_compression_enable=True, **kw)
    except Exception: bpy.ops.export_scene.gltf(**kw)
    # Draco: Blender'ın exporter'ında Draco kütüphanesi yoksa (pip bpy) gltf-transform ile sıkıştırılır (akar3d.disa_aktar notu)
    import shutil, subprocess
    gt = os.environ.get("AKAR_GLTF_TRANSFORM") or shutil.which("gltf-transform")
    rapor["draco"] = "blender"
    if gt:
        for yol in (EXPORT, EXPORT_SUNUM):
            gec = yol + ".draco.glb"
            r_ = subprocess.run([gt, "draco", yol, gec], capture_output=True, text=True)
            if r_.returncode == 0 and os.path.exists(gec) and os.path.getsize(gec) < os.path.getsize(yol):
                os.replace(gec, yol); rapor["draco"] = "gltf-transform"
            elif os.path.exists(gec): os.remove(gec)
    rapor["glb_bayt"] = os.path.getsize(EXPORT)
    rapor["glb_sunum_bayt"] = os.path.getsize(EXPORT_SUNUM)
    rapor["glb_sinir_bayt"] = 1_000_000
    json.dump(rapor, open(os.path.join(KONTROL, "kontrol_rapor.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("RAPOR", json.dumps(rapor, ensure_ascii=False))

renderlar()

if TESLIM:
    bpy.ops.file.pack_all()
    os.makedirs(os.path.dirname(BLEND), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
    print("BITTI", BLEND)
