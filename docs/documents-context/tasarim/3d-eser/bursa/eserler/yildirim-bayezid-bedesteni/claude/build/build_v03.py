# AKAR · Yıldırım Bayezid Bedesteni · v03 İÇ BEDESTEN SOKAĞI + DIŞ HALKA ÇATISI + YÜKSELTİLMİŞ GİRİŞLER (tasarım sorumlusu, 17 Ekim 2026)
#   Dayanak: Yandex harita (İç Bedesten Sok. ana yapının dört yanını dolaşır, dış halka ana yapıya BİTİŞİK DEĞİL; Dış Bedesten Sok.
#   halkanın dışında), envanter cilt-2 s.28 tepeden fotoğraf (dış halka kırma çatılı: iç saçaktan ≈ 5 m içeride mahya, köşelerde
#   mahya çizgileri; batı ortasında ≈ 7,5 m genişliğinde ayrı çatı parçası), s.27 kuzeyden çapraz (kuzey ortasında halkadan yüksek,
#   kalkanı kuzeye bakan giriş çatısı), ref-img (dış halka uzun eğik metal çatı). Envanter s.29: 68 dükkân ilk yapıya ait değil.
#   - Gabriel planındaki bitişik dükkân halkası (70,4 × 32,8 m, 1958 yangını öncesi) bugünkü duruma uymuyor → kullanılmadı.
#   - Ana yapı (gövde, kurşun çatı, kubbeler, pencereler) v02c ile aynı; dört kapı ana yapının duvarına alındı (E: "dört cephede kapı").
# ---- v02c başlığı ----
# AKAR · Yıldırım Bayezid Bedesteni · v02c DIŞ DÜKKÂN DUVARLARINA ALMAŞIK (tasarım sorumlusu, 17 Ekim 2026)
#   En dış duvarlar (alçak bant / dükkânlar) krem düz renk yerine gövdeyle aynı almaşık karo. Dayanak: Alkan 2023 s.157
#   "üç sıra tuğla, bir sıra taş almaşık" (yapı geneli); envanter cilt-2 s.56 çarşı sokağı fotoğrafı
#   (ref-img/envanter_c2_s29_carsi_sokagi.png): dükkân vitrinlerinin üstünde tuğla kemerli taş–tuğla örgülü duvar.
# ---- v02b başlığı ----
# AKAR · Yıldırım Bayezid Bedesteni · v02b KAYNAK DENETİMİ DÜZELTMESİ (tasarım sorumlusunun isteği, 17 Ekim 2026)
#   Envanter cilt-2 s.28 tepeden fotoğrafı + s.27 kuzeyden çapraz fotoğraf: kurşun örtülü yüksek kütle yalnız merkez mekân
#   ve duvarları (59,5 × 18,0 m, oran 3,3); mahzen bandı ve dükkânlar onu saran ALÇAK bantta. v02'de mahzen bandı yüksek
#   gövdenin içindeydi (60,0 × 24,4 m) → düzeltildi. Gövde duvarı 10,0 m (P kesit, salon duvarı), kurşun çatı alçak kırma
#   (köşe mahya çizgileri tepeden fotoğrafta). Detay, renk ve doku v02 ile aynı.
# ---- v02 başlığı ----
# AKAR · Yıldırım Bayezid Bedesteni · v02 DETAY + RENK + ÇIKIŞ (kütle v01b'de donduruldu, ölçülerine dokunulmadı)
#   Ref: ref-img/685fff971922d.webp (havadan): tuğla kemerli pencereler, saçakta ince tuğla bant, dilimli kurşun kubbeler.
#   - Pencereler: uzun cephelerde göz başına 1 (7 + 7), kısa cephelerde 4 (P kesit: y = ±3,2 / ±5,0; foto doğu ucu 4 açıklık),
#     pencere 5,55–6,95 m (P kesit 5,6–7,6), tuğla yuvarlak kemer çerçeve + açık renk alınlık + parmaklıklı pencere.
#   - Kapilar: dört kenarın ortasında taş çerçeve + tuğla kemer bandı + koyu kahve kapı.
#   - Dukkan_Kapilari: dükkân halkasının dış yüzünde tuğla kemerli dükkân açıklıkları (68: uzun kenar 2 × 24, kısa 2 × 10).
#   - Sacak: almaşık gövdenin üstünde tek tuğla bant (foto; stil "gövde üstünde tek yatay çizgi").
#   - Kubbeler: 24 → 32 dilim (biçim aynı), dilim ve kurşun levha ekleri dokuyla (doku/kubbe_dilim.png).
#   - Gövde almaşık karo (tasarım sorumlusu kararı, A seçeneği; B "düz renk + tek saçak çizgisi" elendi).
# Çalıştırma:
#   blender -b --python docs/documents-context/tasarim/3d-eser/bursa/eserler/yildirim-bayezid-bedesteni/claude/build/build_v02.py
# Eksenler: +X = doğu, +Y = kuzey, +Z = yukarı. Orijin = ana salonun ortası.
# Kaynak kodları: P plan/kesit, E envanter, W Alkan 2023, F fotoğraf, H hesap, T tahmin (VARSAYIM, bedesten_notlar.md'de listeli).
import sys, os, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 5, "_kutuphane")))
import bpy
import akar3d as A
from mathutils import Vector

SURUM = "v03"
CLAUDE = os.path.dirname(HERE)
DOKU = os.path.join(HERE, "doku")
KONTROL = os.path.join(CLAUDE, "kontrol", SURUM)
BLEND = os.path.join(CLAUDE, "blend", f"bedesten_{SURUM}.blend")
EXPORT = os.path.join(CLAUDE, "export", f"bedesten_{SURUM}.glb")

P = {
    # ---- kütle (v01b'de DONDURULDU; değişmez) ----
    "salon_ic_x": 56.50,      # E: iç mekân doğu–batı (P 56,8)
    "salon_ic_y": 15.00,      # E: iç mekân kuzey–güney (P 15,3)
    "salon_duvar": 1.50,      # P: salon duvarı (doğu–batı uçlarda okunan)
    "dis_x": 70.4,            # P: dükkânlar dahil toplam dış ölçü doğu–batı
    "dis_y": 32.8,            # P: dükkânlar dahil toplam dış ölçü kuzey–güney (kesit 33,0)
    "govde_x": 59.5,          # v02b · H: iç 56,50 (E) + 2 × 1,50 duvar (P); tepeden foto kurşun dikdörtgeni ≈ 58,7 (F)
    "govde_y": 18.0,          # v02b · H: iç 15,00 (E) + 2 × 1,50 duvar (P); tepeden foto ≈ 18,0 (F, oran 3,3). v02: 24,4 (mahzen bandı dahil, HATALI)
    "dukkan_h": 5.0,          # T: alçak bant (mahzen bandı + dükkânlar) düz çatısı; fotoğrafta pencereler bu çatının hemen üstünde.
                              #    P kesit 8,7 gösteriyor ama uzun cephe pencereleri (P 5,6–7,6) fotoğrafta bantın üstünde görünüyor → foto seçildi
    "kubbe_nx": 7, "kubbe_ny": 2,   # P, E: 2 × 7 = 14 kubbe
    "cati_h": 10.0,           # v02b · P kesit: salon duvarı üstü = almaşık gövdenin saçağı (v02: 8,5, mahzen bandı duvarıydı)
    "salon_h": 10.25,         # v02b · T: alçak kırma kurşun çatının iç kenarı (kubbe tabanı); eğim tepeden fotoğraftaki köşe çizgilerinden
    "kubbe_dis_d": 7.4,       # P kesit: kubbe dış çapı
    "kubbe_tepe": 13.5,       # v01b: fotoğrafa göre dolgun
    "kapi_w": 3.0,            # P: kuzey kapısı geçit genişliği
    "kapi_h": 4.5,            # T
    "zemin_pay": 6.0,         # T
    "golge_pay": 1.06,        # Koza Han ile aynı
    # ---- v02 detay (D_) ----
    "D_kubbe_dilim": 32,      # F: fotoğrafta ≈ 30–32 dilim
    "D_kubbe_sira": 5,        # F: kurşun levha sırası (yatay ek)
    "D_sacak_h": 0.35,        # T: saçak tuğla bandı yüksekliği (8,15 → 8,5)
    "D_sacak_d": 0.10,        # T: banttaki taşma
    "D_pen_alt": 5.55,        # P kesit: pencere altı ≈ 5,6 (dükkân çatısının 0,55 m üstü)
    "D_pen_ust": 6.95,        # T: dikdörtgen pencere üstü
    "D_pen_w": 0.9,           # T
    "D_pen_cerceve_w": 1.6,   # T: tuğla kemer çerçeve genişliği
    "D_pen_kemer_z": 7.15,    # T: çerçeve kemer üzengisi (tepe 7,95 < saçak 8,15)
    "D_pen_kisa_y": (-5.0, -3.2, 3.2, 5.0),   # P kesit: kısa cephe pencereleri
    "D_kapi_cerceve_w": 4.4, "D_kapi_cerceve_h": 4.7,   # T: taş çerçeve (dükkân çatısı 5,0'ın altında)
    "D_kapi_bant_w": 3.6,     # T: tuğla kemer bandı dış genişliği
    "D_dukkan_n_uzun": 25,    # H: 24 dükkân + orta kapı modülü (uzun kenar)
    "D_dukkan_n_kisa": 11,    # H: 10 dükkân + orta kapı modülü (kısa kenar) → 2 × 24 + 2 × 10 = 68 (W)
    "D_dukkan_bant_w": 2.2, "D_dukkan_w": 1.8, "D_dukkan_kemer_z": 2.4,   # T
    "D_karo_w": 1.2, "D_karo_h": 0.6,   # almaşık karo (Koza Han ile aynı)
    # ---- v03 dış halka ve sokak (dis_x, dis_y, dukkan_h artık kullanılmıyor: Gabriel'in bitişik halkası) ----
    "D_sokak_kg": 6.2,        # F: İç Bedesten Sok. kuzey/güney genişliği (tepeden foto: gövde → halka saçağı 5,6) + T saçak taşması 0,6
    "D_sokak_db": 3.1,        # F: doğu/batı (tepeden foto 2,5) + 0,6
    "D_halka_d": 8.8,         # F+T: dış halka duvar derinliği (mahya iç saçaktan ≈ 5,0 m içeride; çatı simetrik kabul → saçaktan saçağa 10,0)
    "D_halka_sacak_tasma": 0.6,   # T
    "D_halka_sacak": 4.5,     # T: dış halka saçak yüksekliği (kaynakta yok)
    "D_halka_mahya": 6.5,     # T: dış halka mahyası
    "D_giris_w": 7.5,         # F: batı girişindeki ayrı çatı parçası ≈ 7,5 m (tepeden foto); dördü için aynı alındı
    "D_giris_duvar": 6.6,     # T: giriş bölümü saçağı (halka mahyasının üstünde: "biraz yükseltilmiş")
    "D_giris_mahya": 8.0,     # T: giriş kalkanının tepesi (kalkan sokağa ve dışarıya bakar, s.27 kuzey girişi)
    "D_gecit_w": 3.0, "D_gecit_kemer_z": 2.6,   # T: giriş geçidi açıklığı
    "D_dukkan_adim": 2.9,     # P: Gabriel dükkân modülü ≈ 2,9 m
}
BX, BY = P["govde_x"] / 2, P["govde_y"] / 2
WIX, WIY = BX + P["D_sokak_db"], BY + P["D_sokak_kg"]        # v03: dış halkanın sokağa bakan duvar yüzü
DX, DY = WIX + P["D_halka_d"], WIY + P["D_halka_d"]          # v03: dış halkanın dış duvar yüzü
SX = P["salon_ic_x"] / 2 + P["salon_duvar"]
SY = P["salon_ic_y"] / 2 + P["salon_duvar"]
GX, GY = P["salon_ic_x"] / P["kubbe_nx"], P["salon_ic_y"] / P["kubbe_ny"]
c0 = Vector((0, 0))

M = {k: A.mat(n, hx) for k, n, hx in [
    ("duvar", "Duvar", "#E2B7A4"),       # eser.md Palet: gövde pembe-kahve; almaşık doku bağlanır
    ("cati", "Cati", "#B9C6CC"),         # T: düz kurşun çatı
    ("kubbe", "Kubbe", "#95AEBA"),       # eser.md Palet: kurşun mavi-gri (vurgu 1), dilim dokusu bağlanır
    ("kapi", "Kapi", "#6B4A3A"),         # eser.md Palet: koyu kahve
    ("tugla", "Tugla", "#C6755B"),       # _ortak_stil tuğla kırmızı (açık ton): saçak, kemer bantları
    ("tas", "Tas", "#F2F3E5"),           # _ortak_stil krem/beyaz taş: kapı çerçevesi, pencere alınlığı
    ("pencere", "Pencere", "#1E1F21"),   # parmaklıklı pencere dokusu
    ("dukkan", "Dukkan", "#415072"),     # _ortak_stil lacivert: dükkân kepenkleri
    ("halka_cati", "Halka_Cati", "#C9C3B6"),   # v03 · F: dış halka metal çatı (tepeden ve çapraz fotoğrafta açık gri-bej)
    ("sokak", "Sokak", "#D9D1C3"),       # v03 · T: İç Bedesten Sokağı taş döşeme
    ("gecit", "Gecit", "#2A2522"),       # v03 · T: giriş geçidinin karanlık içi
    ("cim", "Zemin_Cim", "#A0B46C"),
    ("golge", "Zemin_Golge", "#E29B87"),
]}

def doku_bagla(m, dosya):
    """Malzemenin Base Color'ına küçük tekrar eden karo bağlar (glTF'e gömülür)."""
    nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tx = nt.nodes.new("ShaderNodeTexImage"); tx.image = bpy.data.images.load(os.path.join(DOKU, dosya), check_existing=True)
    tx.name = "DOKU"; nt.links.new(tx.outputs["Color"], bsdf.inputs["Base Color"])
DOKULU = [M["kubbe"], M["pencere"], M["duvar"]]
doku_bagla(M["kubbe"], "kubbe_dilim.png")
doku_bagla(M["pencere"], "pencere.png")
doku_bagla(M["duvar"], "almasik.png")

def R4(hx, hy, cx=0.0, cy=0.0): return A.rect(Vector((cx, cy)), 2 * hx, 2 * hy)

def ring(g, outer, inner, z0, z1, m_side, m_top):
    """Kapalı halka (dış ve iç çokgen aynı köşe sayısında, ikisi de ccw)."""
    n = len(outer)
    ob, ot = [g.V(q, z0) for q in outer], [g.V(q, z1) for q in outer]
    ib, it = [g.V(q, z0) for q in inner], [g.V(q, z1) for q in inner]
    for i in range(n):
        j = (i + 1) % n
        g.F([ob[i], ob[j], ot[j], ot[i]], m_side)
        g.F([ib[j], ib[i], it[i], it[j]], m_side)
        g.F([ot[i], ot[j], it[j], it[i]], m_top)
        g.F([ob[j], ob[i], ib[i], ib[j]], m_side)

def kemerli(w, z0, zs, n=6):
    """Düşey düzlemde (s, z) yuvarlak kemerli açıklık çokgeni (ccw): alt kenar + sağ üzengi → kemer → sol üzengi."""
    arc = [((w / 2) * math.cos(math.pi * k / n), zs + (w / 2) * math.sin(math.pi * k / n)) for k in range(n + 1)]
    return [(-w / 2, z0), (w / 2, z0)] + arc

def panel(g, O, T, N, poly, o0, o1, m, m_yan=None, uv=False):
    """Düşey düzlemde (O + T·s, z) kapalı levha; N yönünde o0 → o1 kalınlık. uv=True: ön yüze 0..1 UV (doku)."""
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

# yüzler: (orta nokta, T, N) — N dışa, T yüze teğet
def yuzler(hx, hy):
    return {"K": (Vector((0, hy)), Vector((1, 0)), Vector((0, 1))), "G": (Vector((0, -hy)), Vector((1, 0)), Vector((0, -1))),
            "D": (Vector((hx, 0)), Vector((0, 1)), Vector((1, 0))), "B": (Vector((-hx, 0)), Vector((0, 1)), Vector((-1, 0)))}

A.temizle()

# ================= KÜTLE (v01b, donduruldu) =================
g = A.G("Govde"); g.prism(R4(BX, BY), 0.0, P["cati_h"], M["duvar"], M["cati"]); g.obj()

# --- v03 Dukkanlar: ana yapıdan İç Bedesten Sokağı ile ayrılan dış halka (almaşık duvar) + kırma metal çatı ---
def kirma_halka(g, Eo, Ei, Rr, ze, zr, m):
    """Üçgen kesitli kapalı çatı halkası: dış saçak Eo, iç saçak Ei (ze), mahya Rr (zr); köşeler kırma."""
    eo = [g.V(q, ze) for q in Eo]; ei = [g.V(q, ze) for q in Ei]; rr = [g.V(q, zr) for q in Rr]
    for i in range(4):
        j = (i + 1) % 4
        g.F([eo[i], eo[j], rr[j], rr[i]], m); g.F([rr[i], rr[j], ei[j], ei[i]], m); g.F([eo[j], eo[i], ei[i], ei[j]], m)
g = A.G("Dukkanlar"); e = P["D_halka_sacak_tasma"]; ze = P["D_halka_sacak"]
ring(g, R4(DX, DY), R4(WIX, WIY), 0.0, ze + 0.1, M["duvar"], M["duvar"])
kirma_halka(g, R4(DX + e, DY + e), R4(WIX - e, WIY - e), R4((DX + WIX) / 2, (DY + WIY) / 2), ze, P["D_halka_mahya"], M["halka_cati"])
g.obj()

# --- v03 Girisler: dört eksende halkayı enine kesen, halkadan yüksek kalkanlı giriş bölümleri ---
def kalkanli(g, c, ex, ey, ridge_x, zw, zt, m_duvar, m_cati):
    """Kapalı kutu + beşik çatı. ridge_x=True: mahya x yönünde (kalkanlar ±x yüzlerinde)."""
    (a, b) = (ey, ex) if ridge_x else (ex, ey)        # a: mahyaya dik yarı genişlik
    def P3(u, v, z): return g.V(Vector((c.x + u, c.y + v)) if ridge_x else Vector((c.x + v, c.y + u)), z)
    # yerel: u mahya yönü (±b), v mahyaya dik (±a)
    bl = [P3(-b, -a, 0), P3(b, -a, 0), P3(b, a, 0), P3(-b, a, 0)]
    tl = [P3(-b, -a, zw), P3(b, -a, zw), P3(b, a, zw), P3(-b, a, zw)]
    r0, r1 = P3(-b, 0, zt), P3(b, 0, zt)
    g.F(bl[::-1], m_duvar)
    g.F([bl[0], bl[1], tl[1], tl[0]], m_duvar); g.F([bl[2], bl[3], tl[3], tl[2]], m_duvar)          # uzun yüzler
    g.F([bl[1], bl[2], tl[2], r1, tl[1]], m_duvar); g.F([bl[3], bl[0], tl[0], r0, tl[3]], m_duvar)  # kalkanlı uçlar
    g.F([tl[0], tl[1], r1, r0], m_cati); g.F([tl[2], tl[3], r0, r1], m_cati)
g = A.G("Girisler"); gw = P["D_giris_w"] / 2
for c, ex, ey, rx in ((Vector((0, (WIY + DY) / 2)), gw, (DY - WIY) / 2 + e + 0.1, False),
                      (Vector((0, -(WIY + DY) / 2)), gw, (DY - WIY) / 2 + e + 0.1, False),
                      (Vector(((WIX + DX) / 2, 0)), (DX - WIX) / 2 + e + 0.1, gw, True),
                      (Vector((-(WIX + DX) / 2, 0)), (DX - WIX) / 2 + e + 0.1, gw, True)):
    kalkanli(g, c, ex, ey, rx, P["D_giris_duvar"], P["D_giris_mahya"], M["duvar"], M["halka_cati"])
g.obj()

# --- v03 Ic_Bedesten_Sokagi: ana yapı ile dış halka arasındaki sokak döşemesi ---
g = A.G("Ic_Bedesten_Sokagi")
ring(g, R4(WIX + 0.05, WIY + 0.05), R4(BX - 0.05, BY - 0.05), 0.0, 0.04, M["sokak"], M["sokak"])
g.obj(recalc=False)

g = A.G("Cati")
lo = [g.V(q, P["cati_h"] - 0.05) for q in R4(BX, BY)]
hi = [g.V(q, P["salon_h"]) for q in R4(P["salon_ic_x"] / 2, P["salon_ic_y"] / 2)]   # v02b: iç mekân kenarına
for i in range(4):
    j = (i + 1) % 4; g.F([lo[i], lo[j], hi[j], hi[i]], M["cati"])
g.F(hi, M["cati"]); g.F(lo[::-1], M["cati"])
g.obj(recalc=False)

g = A.G("Kubbeler"); r = P["kubbe_dis_d"] / 2; rise = P["kubbe_tepe"] - P["salon_h"]
KUBBE_MERKEZ = []
for i in range(P["kubbe_nx"]):
    for j in range(P["kubbe_ny"]):
        c = Vector((-P["salon_ic_x"] / 2 + GX * (i + 0.5), -P["salon_ic_y"] / 2 + GY * (j + 0.5))); KUBBE_MERKEZ.append(c)
        g.dome(A.circle(c, r, P["D_kubbe_dilim"]), P["salon_h"] - 0.05, rise + 0.05, M["kubbe"], rings=8)
kubbe_ob = g.obj()

# ================= v02 DETAY =================
# --- Sacak: almaşık gövdenin üstünde tek tuğla bant ---
g = A.G("Sacak"); sd = P["D_sacak_d"]
ring(g, R4(BX + sd, BY + sd), R4(BX - 0.05, BY - 0.05), P["cati_h"] - P["D_sacak_h"], P["cati_h"], M["tugla"], M["tugla"])
g.obj(recalc=False)

# --- Pencereler: tuğla kemer çerçeve + taş alınlık + parmaklıklı pencere ---
g = A.G("Pencereler")
def pencere(O, T, N, s):
    O2 = O + T * s; cw, pw = P["D_pen_cerceve_w"], P["D_pen_w"]; z0, z1, zk = P["D_pen_alt"], P["D_pen_ust"], P["D_pen_kemer_z"]
    panel(g, O2, T, N, kemerli(cw, z0 - 0.15, zk), 0.04, 0.08, M["tugla"])
    panel(g, O2, T, N, kemerli(cw - 0.4, z1 + 0.05, zk), 0.08, 0.10, M["tas"])
    panel(g, O2, T, N, [(-pw / 2, z0), (pw / 2, z0), (pw / 2, z1), (-pw / 2, z1)], 0.08, 0.12, M["pencere"], M["tas"], uv=True)
Y = yuzler(BX, BY)
xs = [-P["salon_ic_x"] / 2 + GX * (i + 0.5) for i in range(P["kubbe_nx"])]
for k in ("K", "G"):
    for x in xs: pencere(*Y[k], x)
for k in ("D", "B"):
    for y in P["D_pen_kisa_y"]: pencere(*Y[k], y)
g.obj()

# --- Kapilar: v03 · ana yapının dört cephesinin ortasında (E s.29), taş çerçeve + tuğla kemer bandı + koyu kahve kapı ---
g = A.G("Kapilar"); Yd = yuzler(BX, BY)
kw, kh = P["kapi_w"], P["kapi_h"]; zs = kh - kw / 2; bw = P["D_kapi_bant_w"]
fw, fh = P["D_kapi_cerceve_w"], P["D_kapi_cerceve_h"]
for k in ("K", "G", "D", "B"):
    O, T, N = Yd[k]
    panel(g, O, T, N, [(-fw / 2, 0), (fw / 2, 0), (fw / 2, fh), (-fw / 2, fh)], 0.04, 0.12, M["tas"])
    panel(g, O, T, N, kemerli(bw, 0, fh - bw / 2), 0.12, 0.16, M["tugla"])
    panel(g, O, T, N, kemerli(kw, 0, zs), 0.16, 0.22, M["kapi"])
g.obj()

# --- Dukkan_Kapilari: v03 · dış halkanın dış yüzünde (Dış Bedesten Sok.) tuğla kemerli kepenkler, ~2,9 m modül;
#     giriş bölümlerinin önü boş. İç yüz (İç Bedesten Sok.) için kaynak yok → açıklık konmadı ---
g = A.G("Dukkan_Kapilari"); zk = P["D_dukkan_kemer_z"]; Yo = yuzler(DX, DY)
for k, L in (("K", 2 * DX), ("G", 2 * DX), ("D", 2 * DY), ("B", 2 * DY)):
    O, T, N = Yo[k]; n = round(L / P["D_dukkan_adim"]); adim = L / n
    for i in range(n):
        s = -L / 2 + adim * (i + 0.5)
        if abs(s) < P["D_giris_w"] / 2 + P["D_dukkan_bant_w"] / 2 + 0.6: continue   # giriş bölümü
        O2 = O + T * s
        panel(g, O2, T, N, kemerli(P["D_dukkan_bant_w"], 0, zk), 0.04, 0.08, M["tugla"])
        panel(g, O2, T, N, kemerli(P["D_dukkan_w"], 0, zk), 0.08, 0.12, M["dukkan"])
g.obj()

# --- Gecitler: v03 · giriş bölümlerinin iki kalkan yüzünde (sokağa ve dışarıya) tuğla kemerli geçit açıklığı ---
g = A.G("Gecitler"); gw2 = P["D_gecit_w"]; gz = P["D_gecit_kemer_z"]
for k in ("K", "G", "D", "B"):
    for hx, hy, ic in ((DX + e + 0.1, DY + e + 0.1, False), (WIX - e - 0.1, WIY - e - 0.1, True)):
        O, T, N = yuzler(hx, hy)[k]
        if ic: N = -N                                              # sokağa bakan kalkan
        panel(g, O, T, N, kemerli(gw2 + 0.6, 0, gz), 0.04, 0.08, M["tugla"])
        panel(g, O, T, N, kemerli(gw2, 0, gz), 0.08, 0.12, M["gecit"], M["tugla"])
g.obj()

# --- Zemin (kaide diski + gölge elipsi; .glb'ye girmez) ---
zr = math.hypot(DX, DY) + P["zemin_pay"]
g = A.G("Zemin"); g.prism(A.circle(c0, zr, 48), -0.4, 0.0, M["cim"], M["cim"]); g.obj()
g = A.G("Zemin_Golge")
g.prism([Vector((q.x * P["golge_pay"], q.y * P["golge_pay"] * 0.97 - 1.5)) for q in A.circle(c0, zr, 48)], -0.9, -0.5, M["golge"], M["golge"]); g.obj()

# ================= UV =================
def uv_kubbe(ob):
    """Her dilim bir karo (u 0..1, kenarlarda ek çizgisi), v = kurşun levha sırası. Tepe noktası u = 0,5."""
    me = ob.data; uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
    seg = 2 * math.pi / P["D_kubbe_dilim"]; zb = P["salon_h"]
    for p in me.polygons:
        pc = p.center; c = min(KUBBE_MERKEZ, key=lambda q: (q.x - pc.x) ** 2 + (q.y - pc.y) ** 2)
        af = math.atan2(pc.y - c.y, pc.x - c.x)
        for li in p.loop_indices:
            co = me.vertices[me.loops[li].vertex_index].co
            rr = math.hypot(co.x - c.x, co.y - c.y)
            if rr < 1e-3: u = 0.5
            else:
                da = (math.atan2(co.y - c.y, co.x - c.x) - af + math.pi) % (2 * math.pi) - math.pi
                u = 0.5 + da / seg
            uvl.data[li].uv = (u, (co.z - zb) / rise * P["D_kubbe_sira"])
uv_kubbe(kubbe_ob)

def uv_almasik():
    """Almaşık karo: düşey yüzlerde dünya koordinatından (yatay eksen yüzün doğrultusu), karo 1,2 × 0,6 m."""
    kw_, kh_ = P["D_karo_w"], P["D_karo_h"]
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

# ================= kontrol =================
os.makedirs(KONTROL, exist_ok=True)
rapor = A.kontrol_hepsi(KONTROL, "kontrol")
mk = A.mesh_kontrol()
rapor["parcalar"] = {k: v["ucgen"] for k, v in mk.items()}
rapor["draw_call"] = sum(len(o.material_slots) for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin")))
print("RAPOR", json.dumps(rapor, ensure_ascii=False))

# ================= AO + .glb =================
A.ao_vertex(samples=32)
for m in DOKULU:                       # dokulu malzemede renk = doku × AO
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
d = 150; el = math.radians(33); az = math.radians(55)
render(kamera("CAM_Havadan", (d * math.cos(el) * math.cos(az), d * math.cos(el) * math.sin(az), d * math.sin(el)), (0, 0, 4)), "havadan")
render(kamera("CAM_Foto", (-48, 78, 30), (2, 0, 5), lens=32), "foto_acisi")
render(kamera("CAM_Kuzey_Orto", (0, 120, 7), (0, 0, 7), orto=76), "kuzey_orto")
render(kamera("CAM_Bati_Orto", (-120, 0, 7), (0, 0, 7), orto=40), "bati_orto")
render(kamera("CAM_Kubbe", (-14, 26, 17), (2, 0, 10.5), lens=30), "kubbe_yakin")
render(kamera("CAM_Dogu_Uc", (48, 22, 16), (30, 2, 7), lens=35), "dogu_uc")          # ref kırpıntısı: doğu ucu pencereleri
render(kamera("CAM_Kapi", (7, DY + 16, 5), (0, DY, 3), lens=35), "kuzey_kapi")
# v02b: envanter fotoğraflarıyla aynı kadraj (s.28 tepeden 82,6 × 41,3 m; s.27 kuzeyden çapraz)
sc = bpy.context.scene; sc.render.resolution_x, sc.render.resolution_y = 1775, 889
render(kamera("CAM_Envanter_Ust", (0, 0.001, 200), (0, 0, 0), orto=82.6), "envanter_ust")
sc.render.resolution_x, sc.render.resolution_y = 1460, 900
render(kamera("CAM_Envanter_Kuzey", (0, 150, 120), (0, -2, 4), lens=70), "envanter_kuzey")

os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("BITTI", BLEND)
