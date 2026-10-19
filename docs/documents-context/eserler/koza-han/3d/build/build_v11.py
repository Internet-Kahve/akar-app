# AKAR · Koza Han · v11 = v10 kopyası + korkuluk kapakları iki dörtgen (altıgen üçgenlemesi eğimde UV'yi bozuyordu: sol iç ve sağ dış yüz) · v10 = v09 kopyası + merdiven korkuluğu delikleri eğimde yuvarlak (UV eğim telafisi) · v09 = v08 kopyası + kaynağa dayalı çevre (Cevre_Agac_NN, Cevre_Doseme) · v08 = v07 kopyası + kapı açıklıklarında artık parça temizliği, geniş mescit kubbesi · v07 = v06 kopyası + korkuluk UV düzeltmesi + oturan figür mermer halkada · v06 = v05 kopyası + İç Koza yeniden (moloz, 18+27 ayak, kemerli revak, dişli tuğla, metal çatı, havuz), yuvarlak kemerli geçit, gerçek delikli korkuluk, mescit kitabesi, dikdörtgen kaide, koyu kubbe · v05 = v04 kopyası + kapı içi derinliği, merdiven korkuluğu/duvarı mescit taşı, koyu ve uzun kubbe, mescit tabelası, İç Koza vaziyet planı çokgeni · v04 = v03 kopyası + kullanıcı düzeltmeleri (mescit pencereleri yukarı, merdiven altı boşluğu, çim tarhları kenara) · v03 (SONNET_REVIZYON_PLANI.md: kanat/avlu oranı, mescit rölöve, avlu zemini ve peyzajı, İç Koza, genel sahne standardı)
# build_v02o.py'den türetildi (v02o'ya dokunulmadı). Portal yüzü, pencere ve baca tipleri v02o'dan korunur.
# Çalıştırma: blender -b --python docs/documents-context/eserler/koza-han/3d/build/build_v11.py
# Eksenler: +X = doğu, +Y = kuzey (portal), +Z = yukarı. Orijin = ana avlunun ortası (mescit ekseni).
# Kaynak harfleri: P rölöve/plan, E envanter, W makale, O OSM, F fotoğraf, H plan ölçeklemesi, T tahmin, K kullanıcı kararı.
# Ortam: KOZA_FIGUR=1 → figürleri yerleştirir (figür seti kullanıcı onayından sonra). KOZA_HIZLI=1 → yalnız kontrol (render/AO/GLB yok).
import sys, os, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 3, "_kutuphane")))
import bpy, bmesh
import akar3d as A
from mathutils import Vector

SURUM = "v11"
URETIM = os.path.dirname(HERE)
KONTROL = os.path.join(URETIM, "kontrol", SURUM)
BLEND = os.path.join(URETIM, "blend", f"koza-han_{SURUM}.blend")
EXPORT = os.path.join(URETIM, "export", f"koza-han_{SURUM}.glb")
EXPORT_SUNUM = os.path.join(URETIM, "export", f"koza-han_{SURUM}_sunum.glb")
FIGUR = os.environ.get("KOZA_FIGUR", "0") == "1"
HIZLI = os.environ.get("KOZA_HIZLI", "0") == "1"

P = {
    # 1. Plan ve genel kütle (plan §1)
    "dis_dx": 64.0,          # H  dış ölçü ön/arka (portal) cephesi = kısa kenar (Demiralp planı + dik foto ≈ 64 × 72; OSM 51,7 yalnız konum)
    "dis_dy": 72.0,          # H  yan cepheler = uzun kenar
    "alt_h": 5.0,            # T  alt kat yüksekliği
    "ust_h": 4.5,            # T  üst kat yüksekliği (saçağa kadar)
    "avlu_dx": 38.0,         # E  föy N19 «46 x 38 metre iç ölçü»
    "avlu_dy": 46.0,         # E
    "kanat": 13.0,           # H  kanat: dış duvar dış yüzü → avlu kenarı (plan 13,0; dik foto 12,7)
    "dis_duvar": 1.4,        # H  dış duvar kalınlığı
    "oda_d": 5.6,            # H  oda derinliği (net)
    "oda_duvar": 1.0,        # H  oda–revak duvarı
    "revak_d": 3.40,         # E  föy «yaklaşık 3.40 metre»; plan 3,35
    "ayak_d": 1.6,           # H  revak ayağı (avlu tarafı) derinliği, ±0,3
    "ayak_w": 1.2,           # T  revak ayağı eni (kemer açıklığı = adım − ayak_w)
    "kemer_bant": 1.2,       # T  alt kat kemer kuşağı yüksekliği
    "bay_x": 9,              # K  kısa kenar avlu kemeri = kubbe sayısı
    "bay_y": 11,             # K  uzun kenar
    "cephe_oda_adim_x": 4.5, # H  dış cephe oda adımı kısa kenar (plan ≈ 4,5)
    "cephe_oda_adim_y": 4.35,# H  uzun kenar (plan ≈ 4,35); her cephede 11 normal oda + 2 köşe odası
    "oda_n": 11,             # H
    "D_dis_pen_say": 2,      # E  föy: üst katta her odada dışa açılan 2 pencere
    "dikme_w": 0.35,         # T
    # çatı bantları (F: kozahan_arsiv_010 dik foto), dıştan avluya: saçak 0,8 + tonoz 5,0 + vadi 1,6 + kubbe 4,8 + korkuluk 0,8 = 13,0
    "D_sacak_w": 0.8,        # F
    "D_tonoz_w": 5.0,        # F  beşik tonoz genişliği
    "D_vadi": 1.6,           # F
    "D_kubbe_bant": 4.8,     # F  kubbe sırası bandı
    "D_kubbe_derinlik": 4.5, # F  kubbe tabanı ≈ 4,2 × 4,5
    "D_parapet_w": 0.8,      # F  avlu korkuluğu bandı
    "D_parapet_t": 0.35,     # T  korkuluk duvarı kalınlığı
    "D_parapet_h": 0.8,      # M
    "D_sacak_h": 0.2,        # T
    "D_tonoz_rise": 1.6,     # T  genişlikle orantılı (v02o 0,9 / 3,5 m)
    "D_tonoz_n": 10,         # T
    "D_kubbe_rise": 2.2,     # v05: kullanıcı isteğiyle uzatıldı (v02–v04: 1,4)
    "D_kubbe_n_x": 9, "D_kubbe_n_y": 11,   # K
    "cati_tasma": 0.4,       # T
    # bacalar (v02i, korunur)
    "baca_w": 0.7, "D_baca_tasma": 0.15, "D_baca_sacak_h": 0.1, "D_baca_kulah_h": 0.5,
    # portal (v02o, korunur)
    "portal_w": 18.0, "portal_cikinti": 4.8, "portal_ek_h": 1.8, "portal_kubbe_rise": 1.9,
    "D_portal_kare": 4.2, "D_portal_kubbe_bosluk": 1.2, "D_portal_kubbe_ara": 0.55,
    "D_portal_on_cikinti": 0.45, "D_portal_on_pay": 0.2, "D_portal_on_w": 10.4, "D_portal_on_h": 10.6,
    "kapi_w": 5.0, "kapi_h": 7.8,
    "D_halat_r": 0.32, "D_halat_a": 0.38, "D_halat_b": 0.20, "D_halat_adim": 0.42, "D_halat_egim": 35,
    "D_korn_dis": 0.35, "D_korn_h": 0.35,
    # cephe detayları (v02b–v02i, korunur)
    "D_revak_kemer_k": 0.55, "D_ust_kemer_k": 0.6,
    "D_korkuluk_h": 0.9, "D_korkuluk_t": 0.12,
    "D_avlu_kapi_w": 1.4, "D_avlu_kapi_h": 2.7, "D_avlu_ust_w": 1.2, "D_avlu_ust_h": 2.6,
    "D_dis_ust_w": 0.9, "D_dis_ust_z0": 0.9, "D_dis_ust_h": 1.7,
    "D_alinlik_bosluk": 0.15, "D_alinlik_ic_pay": 0.15, "D_alinlik_bant": 0.18, "D_alinlik_k": 0.72, "D_alinlik_d": 0.12,
    "D_sove": 0.14, "D_dis_alt_w": 0.8, "D_dis_alt_z0": 1.8, "D_dis_alt_h": 1.1,
    "D_silme_h": 0.35, "D_silme_d": 0.12,
    # doğu geçidi (E: C2 PDF 9)
    "gecit_w": 3.66,         # E  hanın doğu duvarında İç Koza'ya geçit
    "gecit_h": 4.63,          # T
    # 2. Mescit (plan §2; kotlar z = avlu zemini)
    "m_hv_kot": 0.78,        # P  havuz kenarı / ayak kaideleri
    "m_uzenge": 2.00,        # P  kemer üzengisi, orta ayak başlığı
    "m_dosem": 3.50,         # P  üst kat döşemesi
    "m_sacak": 6.98,         # P  saçak ve kubbe eteği
    "m_kubbe_tepe": 9.6,     # P
    "m_alem_tepe": 10.5,     # P
    "m_ayak_R": 3.27,        # P  8 ayak merkezi çemberi
    "m_ayak_w": 0.66,        # P  beşgen ayak eni
    "m_ayak_mermer_h": 1.0,  # F  ayağın beyaz mermer alt kısmı
    "m_govde_ap": 3.39,      # P  sekizgen gövde yüzden yüze 6,78
    "m_duvar": 0.66,         # P
    "m_saçak_d": 0.16,       # P  saçak taşması
    "m_saçak_h": 0.10,       # P
    "m_havuz_R": 2.825,      # P  16 kenarlı havuz dış Ø 5,65
    "m_havuz_cidar": 0.20,   # P
    "m_su_ind": 0.12,        # P  su kenardan aşağıda
    "m_tas_halka_R": 3.85,   # P  mermer döşeme halkası Ø 7,7
    "m_tas_halka_h": 0.15,
    "m_orta_ayak_r": 0.25,   # P  Ø ≈ 0,5
    "m_orta_kaide_r": 0.425, # P  Ø ≈ 0,85
    "m_pen_w": 0.55, "m_pen_z0": 3.95, "m_pen_h": 1.35,   # P kesit: pencere 3,57–4,93
    "m_alinlik_k": 0.8,      # P  sivri alınlık oranı (kesitte 5,2–5,9)
    "m_kapi_w": 1.0, "m_kapi_ust": 5.96,                  # P/E
    "m_kubbe_govde_R": 3.7,  # v08: kullanıcı isteğiyle genişletildi (rölöve Ø ≈ 5,6 → 7,4; kasnak/gövde 6,78 yüzden yüze)
    "m_kubbe_govde_z": 7.5,
    "m_kubbe_etek_R": 4.05,  # v08: etek Ø 8,1 (rölöve 7,1)
    "m_kubbe_seg": 24,       # F  24 düşey dikiş
    "m_dikis_h": 0.03,       # E
    # merdiven (P, üst kat planı)
    "m_basamak": 14,         # E  «on dört basamaklı mermer merdiven»
    "m_rihr": 0.25,          # P  3,50 / 14
    "m_uzunluk": 4.94,       # P  yatay uzunluk, kapı yüzünden itibaren, sahanlık DAHİL (üst kat planı + batı cephesi; v03 ilk sürümde sahanlık üstüne eklenmişti)
    "m_net_w": 2.0,          # P  net genişlik
    "m_toplam_w": 2.47,      # P  korkuluklar dahil
    "m_sahanlik": 1.2,       # P  kapı önü sahanlık
    "m_korkuluk_h": 0.9, "m_bosluk_L": 2.3, "m_bosluk_ust": 0.5,   # F/T: v02k boşluğu yeni uzunluğa ölçeklendi
    "m_kapi_phi": 135.0,     # F  kapı ve merdiven kuzeybatı köşegen yüzü
    # 3. Avlu zemini ve peyzaj (plan §3; F/T: stilize)
    "halka_R": 8.0, "halka_bordur": 0.3,           # T  Ø 16 m daire, 0,3 m bordür
    "yol_w": 3.5, "yol_bordur": 0.2,               # T
    "tarh_pay": 7.0, "tarh_yol_ara": 1.0, "tarh_kaydir": 4.8, "tarh_olcek": 0.92, "tarh_pah": 1.5,   # T
    "cit_h": 0.45,                                 # T  alçak ahşap çit
    "agac_h": 12.0, "agac_taç_r": 3.4,             # T  çınar
    # 4. İç Koza (plan §4)
    "ic_dx": 44.0, "ic_dy": 49.0,    # H  dış ayak izi
    "ic_avlu_dx": 22.0, "ic_avlu_dy": 30.0,   # E  föy «22 x 30»
    "ic_h": 4.5,                     # T  saçak
    "ic_sirt": 5.7,                  # T  sırt (han doğu cephesi üst pencere altı 5,76 → pencereyi örtmesin)
    # Zemin (standart §1)
    "disk_A": 92.0, "disk_B": 80.0,
}
# İç Koza avlusunun ekseni han doğu revakında bir kemer gözünün ortasına oturtuldu (T): plan «kuzey kenarı ≈ 4,5 m güneyde» (±3 m)
# → kuzey kenar hanın kuzey cephesinden ≈ 3,1 m güneyde.

# ---------------- türetilen ölçüler ----------------
H = P["alt_h"] + P["ust_h"]
OX, OY = P["dis_dx"] / 2, P["dis_dy"] / 2
AX, AY = P["avlu_dx"] / 2, P["avlu_dy"] / 2
RX, RY = AX + P["revak_d"] + P["ayak_d"], AY + P["revak_d"] + P["ayak_d"]      # oda duvarı (revak arka yüzü)
assert abs((OX - AX) - P["kanat"]) < 1e-6 and abs((OY - AY) - P["kanat"]) < 1e-6
assert abs(P["dis_duvar"] + P["oda_d"] + P["oda_duvar"] + P["revak_d"] + P["ayak_d"] - P["kanat"]) < 1e-6, "kanat toplamı 13,0 değil"
ZONE = P["D_sacak_w"] + P["D_tonoz_w"] + P["D_vadi"] + P["D_kubbe_bant"] + P["D_parapet_w"]
assert abs(ZONE - P["kanat"]) < 1e-6, "çatı bantları 13,0 m değil"

def kemer(w, zs, sivri=True, n=6, kk=None):
    """Kemer içi noktaları, sol üzengiden sağ üzengiye. sivri: iki merkezli; değilse yarım daire. kk: yarıçap / açıklık."""
    if not sivri:
        return [(-(w / 2) * math.cos(math.pi * k / n), zs + (w / 2) * math.sin(math.pi * k / n)) for k in range(n + 1)]
    R = max(kk or P["D_revak_kemer_k"], 0.51) * w
    cx = -w / 2 + R; ta = math.acos((0 - cx) / R)
    sol = [(cx + R * math.cos(math.pi - (math.pi - ta) * k / n), zs + R * math.sin(math.pi - (math.pi - ta) * k / n)) for k in range(n + 1)]
    return sol + [(-s, z) for s, z in sol[-2::-1]]

def kemer_yuksek(w, sivri=True, kk=None):
    if not sivri: return w / 2
    R = max(kk or P["D_revak_kemer_k"], 0.51) * w; cx = -w / 2 + R
    return math.sqrt(R * R - cx * cx)

def panel(g, O, T, N, poly, o0, o1, m):
    """Düşey düzlemde (O + T·s, z) kapalı çokgen; N yönünde o0→o1 kalınlık. Kapalı hacim."""
    Pt = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
    a = [g.bm.verts.new(Pt(s, z, o0)) for s, z in poly]; b = [g.bm.verts.new(Pt(s, z, o1)) for s, z in poly]
    g.F(a[::-1], m); g.F(b, m)
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g.F([a[i], a[j], b[j], b[i]], m)

def pencere_doku(g, O, T, N, w, z0, h, d=0.06):
    """Dokulu pencere levhası (söve + cam + parmaklık tek karoda, doku/pencere_v03.png). Duvardan DECAL_OFF önde, kapalı."""
    uvl = g.bm.loops.layers.uv.verify(); off = A.DECAL_OFF
    poly = [(-w / 2, z0), (w / 2, z0), (w / 2, z0 + h), (-w / 2, z0 + h)]
    Pt = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
    a = [g.bm.verts.new(Pt(s, z, off)) for s, z in poly]; b = [g.bm.verts.new(Pt(s, z, off + d)) for s, z in poly]
    uv = {v: ((s + w / 2) / w, (z - z0) / h) for (s, z), v in list(zip(poly, a)) + list(zip(poly, b))}
    fs = [g.F(a[::-1], M["pencere"]), g.F(b, M["pencere"])] + [g.F([a[i], a[(i + 1) % 4], b[(i + 1) % 4], b[i]], M["sacak"]) for i in range(4)]
    for f in fs:
        if f:
            for l in f.loops: l[uvl].uv = uv[l.vert]

def kemer_alinlik(w, zs, ztop, sivri=True, e=0.03, n=6, kk=None):
    """Açıklığın üstündeki dolu kısım (kemer köşeliği): dikdörtgen eksi kemer. e: ayağa gömülme payı."""
    return [(-w / 2 - e, ztop), (-w / 2 - e, zs)] + kemer(w, zs, sivri, n=n, kk=kk) + [(w / 2 + e, zs), (w / 2 + e, ztop)]

def R4(hx, hy, cx=0.0, cy=0.0):
    return [Vector((cx - hx, cy - hy)), Vector((cx + hx, cy - hy)), Vector((cx + hx, cy + hy)), Vector((cx - hx, cy + hy))]

def ring(g, outer, inner, z0, z1o, z1i, m_side, m_top, m_in=None):
    """Delikli kapalı prizma (halka). outer/inner aynı köşe sayısında, ccw."""
    n = len(outer)
    ob = [g.V(q, z0) for q in outer]; ot = [g.V(q, z1o) for q in outer]
    ib = [g.V(q, z0) for q in inner]; it = [g.V(q, z1i) for q in inner]
    for i in range(n):
        j = (i + 1) % n
        g.F([ob[i], ob[j], ot[j], ot[i]], m_side)
        g.F([ib[j], ib[i], it[i], it[j]], m_in or m_side)
        g.F([ot[i], ot[j], it[j], it[i]], m_top)
        g.F([ob[j], ob[i], ib[i], ib[j]], m_side)

def bay_centers(n, half):
    s = 2 * half / n
    return [-half + s * (k + 0.5) for k in range(n)], [-half + s * k for k in range(n + 1)]

def extrude_yz(g, prof, x0, x1, m):
    a = [g.bm.verts.new((x0, y, z)) for y, z in prof]; b = [g.bm.verts.new((x1, y, z)) for y, z in prof]
    g.F(a[::-1], m); g.F(b, m)
    for i in range(len(prof)):
        j = (i + 1) % len(prof); g.F([a[i], a[j], b[j], b[i]], m)

def ofs(poly, d):
    """Çokgeni d kadar dışa (d<0 içe) kaydırır (köşede gönye); köşe sayısı aynı kalır."""
    p = A.ccw(poly); n = len(p); out = []
    for i in range(n):
        a, b, c = p[i - 1], p[i], p[(i + 1) % n]
        e1 = (b - a).normalized(); e2 = (c - b).normalized()
        n1 = Vector((e1.y, -e1.x)); n2 = Vector((e2.y, -e2.x)); bis = n1 + n2
        bis = bis / bis.length if bis.length > 1e-6 else n1
        out.append(b + bis * d / max(bis.dot(n1), 0.3))
    return out

def elips(c, rx, ry, n=16): return [c + Vector((rx * math.cos(2 * math.pi * k / n), ry * math.sin(2 * math.pi * k / n))) for k in range(n)]

# ---------------- sahne ----------------
A.temizle()
for m in list(bpy.data.materials):
    if m.users == 0: bpy.data.materials.remove(m)
# genel sahne standardı §3 paleti (plan §5)
MAT = [
    ("duvar", "Duvar_Almasik", "#CFA986", 0.70, 0.0), ("cati", "Cati_Kursun", "#7C858C", 0.45, 0.20),
    ("sacak", "Sacak", "#AEB6BC", 0.45, 0.20), ("baca_kulah", "Baca_Kulah", "#8E9498", 0.70, 0.0),
    ("ahsap", "Ahsap", "#7A5134", 0.75, 0.0), ("avlu", "Avlu_Zemin", "#B3A590", 0.85, 0.0),
    ("halka", "Avlu_Halka", "#B3A590", 0.85, 0.0), ("kursun", "Kursun", "#7C858C", 0.45, 0.20),
    ("dikis", "Kursun_Dikis", "#5E676E", 0.45, 0.20), ("mermer", "Mermer_Beyaz", "#ECEAE4", 0.40, 0.0),
    ("petek", "Petek_Sebeke", "#ECEAE4", 0.40, 0.0), ("korkuluk_m", "Merdiven_Korkuluk", "#E6D8BA", 0.70, 0.0),
    ("tas_portal", "Tas_Portal", "#D8C6A2", 0.70, 0.0), ("tas_acik", "Tas_Acik", "#E6D8BA", 0.70, 0.0),
    ("su", "Su", "#8CC3C6", 0.10, 0.0), ("kapi", "Kapi", "#3E4A55", 0.30, 0.0), ("tugla", "Tugla", "#CC7A52", 0.70, 0.0),
    ("kesme", "Kesme_Tas", "#E6D8BA", 0.70, 0.0), ("korkuluk", "Korkuluk_Beyaz", "#F1EFEA", 0.70, 0.0),
    ("portal_on", "Portal_On", "#E2D1AF", 0.70, 0.0), ("baca", "Baca_Tugla", "#CC7A52", 0.70, 0.0),
    ("cini", "Cini_Mavi", "#4F9BD0", 0.60, 0.0), ("pencere", "Pencere_Izgara", "#3E4A55", 0.30, 0.0),
    ("tabela", "Tabela", "#ECEAE4", 0.40, 0.0), ("siva", "Siva", "#EDE8DC", 0.85, 0.0), ("moloz", "Moloz", "#CBB49C", 0.75, 0.0),
    ("disli", "Disli_Tugla", "#C68767", 0.70, 0.0), ("arnavut", "Arnavut", "#B3A590", 0.85, 0.0), ("metal", "Cati_Metal", "#C3C9CD", 0.45, 0.20), ("alem", "Alem", "#C9A13B", 0.35, 0.60), ("cim", "Cim", "#9DB86A", 0.95, 0.0),
    ("kiremit", "Kiremit", "#C26B43", 0.75, 0.0), ("yaprak1", "Yaprak_1", "#7FA35B", 0.90, 0.0), ("yaprak2", "Yaprak_2", "#93B46A", 0.90, 0.0),
    ("govde", "Agac_Govde", "#7A634B", 0.90, 0.0), ("yaprak3", "Yaprak_3", "#6E9450", 0.90, 0.0), ("toprak", "Agac_Toprak", "#A5845F", 0.95, 0.0),
]
M = {k: A.mat(n, hx, r, mt) for k, n, hx, r, mt in MAT}
M["revak"] = M["duvar"]
DOKU = os.path.join(HERE, "doku")
def doku_bagla(m, dosya):
    nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tx = nt.nodes.new("ShaderNodeTexImage"); tx.image = bpy.data.images.load(os.path.join(DOKU, dosya), check_existing=True)
    tx.name = "DOKU"; nt.links.new(tx.outputs["Color"], bsdf.inputs["Base Color"])
DOKULU = {"duvar": "almasik_v04.png", "pencere": "pencere_v04.png", "kesme": "kesme_tas_v04.png", "korkuluk": "korkuluk.png",
          "portal_on": "portal_on_v04.png", "baca": "baca_v04.png", "petek": "petek.png", "korkuluk_m": "korkuluk_kesme_alpha.png", "tabela": "kitabe_mescit.png", "moloz": "moloz.png", "disli": "disli_tugla.png", "arnavut": "arnavut.png",
          "avlu": "parke.png", "halka": "parke_halka.png"}
for k, f in DOKULU.items(): doku_bagla(M[k], f)
# merdiven korkuluğu: delikler gerçek boşluk (alpha kesme); iki yüzde de delik, arkası görünür
_mk = M["korkuluk_m"]; _nt = _mk.node_tree; _bs = next(n for n in _nt.nodes if n.type == "BSDF_PRINCIPLED")
_nt.links.new(_nt.nodes["DOKU"].outputs["Alpha"], _bs.inputs["Alpha"])
for _a, _v in (("blend_method", "CLIP"), ("alpha_threshold", 0.5), ("shadow_method", "CLIP"), ("surface_render_method", "DITHERED")):
    try: setattr(_mk, _a, _v)
    except Exception: pass
_mk.use_backface_culling = False
KARO_W, KARO_H = 1.2, 0.6

# ======================= HAN =======================
# --- Govde_Dis: iki katlı oda kanatları (dış duvar → revak arka duvarı); oda içleri modellenmez ---
g = A.G("Govde_Dis")
ring(g, R4(OX, OY), R4(RX, RY), 0, H, H, M["duvar"], M["cati"], M["revak"])
gov = g.obj()

# --- doğu geçidi (E: C2 PDF 9, 3,66 m): İç Koza ekseninde, hanın doğu kanadını boydan boya keser ---
# İç Koza dış çokgeni ve avlusu: vaziyet planı (ref/plan/alan-baskanligi_pdf021_vaziyet.jpg) han ayak iziyle ölçeklendi (64 × 72 m ↔ 350 × 390 px), ±3 m (H).
# Avlu doğrudan hanın doğu duvarına açılır (batı kanadı yok); güneydoğu kenar eğik, kuzey kanat doğuya uzun kol; avlunun doğu kenarı örülmüş.
IC_OUT = [Vector(p_) for p_ in ((32.0, -14.6), (56.7, -14.6), (73.2, 12.0), (87.8, 26.8), (87.8, 32.3), (32.0, 32.3))]
IC_AVLU = [Vector(p_) for p_ in ((32.0, -8.0), (52.0, -8.0), (60.0, 4.0), (60.0, 22.0), (32.0, 22.0))]     # E: avlu 28 × 30 (C2 PDF 21); batısı hanın doğu duvarı
IC_HALL = [Vector((31.0, q.y)) if q.x < 34.0 else q for q in ofs(IC_OUT, -1.2)]                # iç mekân (ahır salonu) çokgeni: dış duvar 1,2 m
IC_CX = sum(p_.x for p_ in IC_AVLU) / len(IC_AVLU)
IC_Y0, IC_Y1 = min(p_.y for p_ in IC_OUT), max(p_.y for p_ in IC_OUT)
IC_AY0, IC_AY1 = min(p_.y for p_ in IC_AVLU), max(p_.y for p_ in IC_AVLU)
IC_CY = bay_centers(P["bay_y"], AY)[0][7]                          # T: han doğu revak gözü ortası (y = 8,36)
gw, gh = P["gecit_w"], P["gecit_h"]
GR = gw / 2; GSP = gh - GR                                         # E: 3,66 m; kemer YARIM DAİRE (foto ic-koza streetview 01)
gc = A.G("_kes")
extrude_yz(gc, [(IC_CY - GR, -0.05), (IC_CY + GR, -0.05)] + [(IC_CY + GR * math.cos(math.pi * q / 16), GSP + GR * math.sin(math.pi * q / 16)) for q in range(17)], RX - 1.0, OX + 1.0, M["siva"])
gcut = gc.obj()
md = gov.modifiers.new("gecit", 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = gcut; md.solver = 'EXACT'
try: md.material_mode = 'TRANSFER'
except Exception: pass
bpy.context.view_layer.objects.active = gov; bpy.ops.object.modifier_apply(modifier="gecit")
bpy.data.objects.remove(gcut, do_unlink=True)
# geçit donanımı: dış yüzde tek sıra radyal tuğla kemer bandı (0,45 m), ortada daha dar ikinci yuvarlak kemer (tuğla bantlı) + koyu ahşap çift kanatlı kapı + üstünde parmaklıklı pencere
gg = A.G("_gecit"); Oe, Te, Ne = Vector((OX, IC_CY)), Vector((0, 1)), Vector((1, 0))
for q in range(18):
    a0, a1 = math.pi * q / 18 + 0.012, math.pi * (q + 1) / 18 - 0.012
    pw_ = [((r_ * math.cos(a_)), GSP + r_ * math.sin(a_)) for r_, a_ in ((GR, a0), (GR + 0.45, a0), (GR + 0.45, a1), (GR, a1))]
    panel(gg, Oe, Te, Ne, pw_, 0.0, 0.10, M["tugla"])
PX = 28.0; Op_ = Vector((PX, IC_CY)); RI, SI = 1.2, 2.0                # ara perde duvarı x = 28; iç kemer Ø 2,4
yay_d = [((GR + 0.02) * math.cos(math.pi * q / 16), GSP + (GR + 0.02) * math.sin(math.pi * q / 16)) for q in range(17)]
yay_i = [(RI * math.cos(math.pi * (16 - q) / 16), SI + RI * math.sin(math.pi * (16 - q) / 16)) for q in range(17)]
top_ = [(GR + 0.03, SI), (GR + 0.03, GSP)] + yay_d + [(-(GR + 0.03), GSP), (-(GR + 0.03), SI), (-RI, SI)] + yay_i[1:-1] + [(RI, SI)]
panel(gg, Op_, Te, Ne, top_, -0.2, 0.2, M["siva"])                          # ara perde: iç yuvarlak kemer ile tünel kemeri arasındaki bant (tek çokgen; donanım boolean'lardan sonra katılır)
for sg in (-1, 1): panel(gg, Op_, Te, Ne, [(sg * RI, 0.0), (sg * (GR + 0.03), 0.0), (sg * (GR + 0.03), GSP), (sg * RI, GSP)], -0.2, 0.21, M["siva"])      # jamb yayın üzengisine kadar çıkar, ön yüzü 1 cm önde: bant ile jamb arasında çizgi kalmaz
for q in range(12):
    a0, a1 = math.pi * q / 12 + 0.015, math.pi * (q + 1) / 12 - 0.015
    pw_ = [((r_ * math.cos(a_)), SI + r_ * math.sin(a_)) for r_, a_ in ((RI, a0), (RI + 0.3, a0), (RI + 0.3, a1), (RI, a1))]
    panel(gg, Op_, Te, Ne, pw_, 0.19, 0.25, M["tugla"])
for sg in (-1, 1):                                                      # koyu ahşap çift kanat: AÇIK; menteşe iç kemerin kenarında, kanat ucu yan duvara yaslanır (≈ 30° açıyla), açıklık boş
    fi_ = math.asin((GR - 0.04 - RI) / 1.2); dk = Vector((math.cos(fi_), sg * math.sin(fi_))); nk = Vector((-dk.y, dk.x))
    panel(gg, Vector((PX + 0.2, IC_CY + sg * RI)), dk, nk, [(0, 0), (1.2, 0), (1.2, 2.9), (0, 2.9)], -0.03, 0.03, M["ahsap"])
pencere_doku(gg, Vector((PX + 0.2, IC_CY)), Te, Ne, 0.5 + 2 * P["D_sove"], 3.7, 0.6 + 2 * P["D_sove"])
gg_obj = gg.obj()                                                   # v08: donanım, kuzey kanat boolean'larından SONRA han gövdesine katılır (exact boolean ara perdeyi siliyordu)

# --- Avlu_Revak: alt/üst kat ayaklar (1,6 derin), kemer kuşağı, sivri kemerler, korkuluk ---
g = A.G("Avlu_Revak")
aw, ad = P["ayak_w"], P["ayak_d"]
z_ayak = P["alt_h"] - P["kemer_bant"]
_, xs = bay_centers(P["bay_x"], AX); _, ys = bay_centers(P["bay_y"], AY)
pier_rects = []                                                     # (merkez, en x, en y)
for x in xs[1:-1]:
    for s in (-1, 1): pier_rects.append((Vector((x, s * (AY + ad / 2))), aw, ad))
for y in ys[1:-1]:
    for s in (-1, 1): pier_rects.append((Vector((s * (AX + ad / 2), y)), ad, aw))
for sx in (-1, 1):                                                  # köşe blokları: iki yöndeki kemer açıklıkları eşit kalsın
    for sy in (-1, 1): pier_rects.append((Vector((sx * (AX + (ad - aw / 2) / 2), sy * (AY + (ad - aw / 2) / 2))), ad + aw / 2, ad + aw / 2))
def pier_pts_poly(c, wx, wy): return A.rect(c, wx, wy)
for c, wx, wy in pier_rects:
    g.prism(pier_pts_poly(c, wx, wy), 0, z_ayak, M["duvar"], M["duvar"])
ring(g, R4(RX, RY), R4(AX, AY), z_ayak, P["alt_h"], P["alt_h"], M["duvar"], M["kesme"], M["duvar"])
z_d1 = H - 0.8
for c, wx, wy in pier_rects:
    g.prism(pier_pts_poly(c, wx, wy), P["alt_h"], z_d1, M["kesme"], M["kesme"])
ring(g, R4(RX, RY), R4(AX, AY), z_d1, H, H, M["kesme"], M["kesme"])
def revak_kemerleri(sinirlar, sabit, yatay, ztop, kk, m):
    for s in (-1, 1):
        for a, b in zip(sinirlar[:-1], sinirlar[1:]):
            w = (b - a) - aw; mid = (a + b) / 2
            zs = ztop - kemer_yuksek(w, kk=kk) - 0.15
            if yatay: O, T, N = Vector((mid, s * sabit)), Vector((1, 0)), Vector((0, s))
            else:     O, T, N = Vector((s * sabit, mid)), Vector((0, 1)), Vector((s, 0))
            panel(g, O, T, N, kemer_alinlik(w, zs, ztop, n=4, kk=kk), 0.0, ad, m)
for sinir, sabit, yatay in ((xs, AY, True), (ys, AX, False)):
    revak_kemerleri(sinir, sabit, yatay, z_ayak, P["D_revak_kemer_k"], M["duvar"])
    revak_kemerleri(sinir, sabit, yatay, z_d1, P["D_ust_kemer_k"], M["kesme"])
ring(g, R4(AX + 0.5, AY + 0.5), R4(AX + 0.5 - P["D_korkuluk_t"], AY + 0.5 - P["D_korkuluk_t"]),
     P["alt_h"], P["alt_h"] + P["D_korkuluk_h"], P["alt_h"] + P["D_korkuluk_h"], M["korkuluk"], M["korkuluk"])
# (v06: üst kat 2 cm kaplama halkası kaldırıldı: avlu_genel render'larında kemer köşelerinde ince siyah çizgi yapıyordu)
g.obj()

# --- çatı bantları (dıştan avluya; u = avlu çizgisinden uzaklık) ---
cx_list, bx_list = bay_centers(P["bay_x"], AX)
cy_list, by_list = bay_centers(P["bay_y"], AY)
Dd, vd = P["D_kubbe_derinlik"], P["D_vadi"]
u_par = P["D_parapet_w"]
u_kub = u_par + P["D_kubbe_bant"] / 2
u_vadi = u_par + P["D_kubbe_bant"] + vd / 2
u_kab0 = u_par + P["D_kubbe_bant"] + vd
sw = P["D_sacak_w"]; ct = P["cati_tasma"]
a = (OX - sw - (AX + u_kab0)) / 2                                  # tonoz yarı genişliği (= 2,5)
assert abs(2 * a - P["D_tonoz_w"]) < 1e-6
rz = P["D_tonoz_rise"]; Rv = (a * a + rz * rz) / (2 * rz); nv = P["D_tonoz_n"]
cxv, cyv = AX + u_kab0 + a, AY + u_kab0 + a
kub_x, _ = bay_centers(P["D_kubbe_n_x"], AX)
kub_y, _ = bay_centers(P["D_kubbe_n_y"], AY)

g = A.G("Cati")
ring(g, R4(OX + ct, OY + ct), R4(OX - sw, OY - sw), H - 0.05, H + P["D_sacak_h"], H + P["D_sacak_h"], M["sacak"], M["sacak"])
tonoz = [(-a, H - 0.05)] + [(-a + 2 * a * k / nv, H + math.sqrt(max(Rv * Rv - (-a + 2 * a * k / nv) ** 2, 0)) - (Rv - rz)) for k in range(nv + 1)] + [(a, H - 0.05)]
for s in (-1, 1):
    panel(g, Vector((0, s * cyv)), Vector((0, 1)), Vector((1, 0)), tonoz, -(cxv + a) - 0.02, cxv + a + 0.02, M["cati"])
    panel(g, Vector((s * cxv, 0)), Vector((1, 0)), Vector((0, 1)), tonoz, -(cyv - a) - 0.02, cyv - a + 0.02, M["cati"])
pt = P["D_parapet_t"]
ring(g, R4(AX + pt, AY + pt), R4(AX, AY), H - 0.05, H + P["D_parapet_h"], H + P["D_parapet_h"], M["duvar"], M["duvar"])
g.obj()

g = A.G("Kubbe_Avlu")
px, py = AX / P["D_kubbe_n_x"], AY / P["D_kubbe_n_y"]
kubbeler = [(Vector((x, s * (AY + u_kub))), px - 0.02, Dd / 2) for x in kub_x for s in (-1, 1)] \
         + [(Vector((s * (AX + u_kub), y)), Dd / 2, py - 0.02) for y in kub_y for s in (-1, 1)] \
         + [(Vector((sx * (AX + u_kub), sy * (AY + u_kub))), Dd / 2, Dd / 2) for sx in (-1, 1) for sy in (-1, 1)]
for c, rx, ry in kubbeler:
    g.dome(elips(c, rx, ry, 12), H - 0.05, P["D_kubbe_rise"], M["cati"], rings=3)
g.obj()

g = A.G("Baca")
bw = P["baca_w"]
def baca(c, z0, z1):
    """v02i bacası (korunur): tuğla gövde, yüz başına iki sivri açıklık + dişli kuşak dokuda, saçak levhası + piramit külah."""
    uvl = g.bm.loops.layers.uv.verify()
    q = A.ccw(A.rect(c, bw, bw)); alt = [g.V(p, z0) for p in q]; ust = [g.V(p, z1) for p in q]
    for i in range(4):
        j = (i + 1) % 4; f = g.F([alt[i], alt[j], ust[j], ust[i]], M["baca"])
        if f:
            for l, uv in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))): l[uvl].uv = uv
    g.F(alt[::-1], M["tugla"]); g.F(ust, M["tugla"])
    ov, et, kh = P["D_baca_tasma"], P["D_baca_sacak_h"], P["D_baca_kulah_h"]
    q2 = A.ccw(A.rect(c, bw + 2 * ov, bw + 2 * ov))
    s0 = [g.V(p, z1) for p in q2]; s1 = [g.V(p, z1 + et) for p in q2]; tepe = g.V(c, z1 + et + kh)
    g.F(s0[::-1], M["baca_kulah"])
    for i in range(4):
        j = (i + 1) % 4
        g.F([s0[i], s0[j], s1[j], s1[i]], M["baca_kulah"]); g.F([s1[i], s1[j], tepe], M["baca_kulah"])
for x in kub_x:
    for s in (-1, 1):
        baca(Vector((x, s * (AY + u_vadi))), H - 0.05, H + rz + 0.7)
        baca(Vector((x, s * cyv)), H + rz - 0.1, H + rz + 1.0)
for y in kub_y:
    for s in (-1, 1):
        baca(Vector((s * (AX + u_vadi), y)), H - 0.05, H + rz + 0.7)
        baca(Vector((s * cxv, y)), H + rz - 0.1, H + rz + 1.0)
for sx in (-1, 1):
    for sy in (-1, 1):
        baca(Vector((sx * (OX - sw / 2), sy * (OY - sw / 2))), H + P["D_sacak_h"] - 0.15, H + 1.4)
g.obj()

# --- Portal (v02o'dan aynen; yalnız renkler ve dokular v03) ---
g = A.G("Portal")
pw, pc = P["portal_w"], P["portal_cikinti"]
y0, y1 = OY - 0.2, OY + pc
g.prism([Vector((-pw / 2, y0)), Vector((pw / 2, y0)), Vector((pw / 2, y1)), Vector((-pw / 2, y1))], 0, H + P["portal_ek_h"], M["duvar"], M["sacak"])
sw_, sd_ = P["D_portal_on_w"] + 2 * P["D_portal_on_pay"], P["D_portal_on_cikinti"]
y2 = y1 + sd_
g.prism([Vector((-sw_ / 2, y1 - 0.02)), Vector((sw_ / 2, y1 - 0.02)), Vector((sw_ / 2, y2)), Vector((-sw_ / 2, y2))], 0, H + P["portal_ek_h"], M["tas_portal"], M["sacak"])
zp = H + P["portal_ek_h"]; yc_ = (y0 + y1) / 2; kk_ = P["D_portal_kare"]; kb, ka = P["D_portal_kubbe_bosluk"], P["D_portal_kubbe_ara"]
db = (y1 - y0) - 2 * 0.6
orta = pw - 2 * kb - 2 * ka - 2 * kk_
def dik_taban(c, w, d, n=4):
    p = []
    for (ax, ay), (bx, by) in zip(((-1, -1), (1, -1), (1, 1), (-1, 1)), ((1, -1), (1, 1), (-1, 1), (-1, -1))):
        for i in range(n):
            t = i / n; p.append(c + Vector(((ax + (bx - ax) * t) * w / 2, (ay + (by - ay) * t) * d / 2)))
    return p
for cx_, w_ in ((-(orta / 2 + ka + kk_ / 2), kk_), (0.0, orta), (orta / 2 + ka + kk_ / 2, kk_)):
    g.dome(dik_taban(Vector((cx_, yc_)), w_, db), zp - 0.05, P["portal_kubbe_rise"], M["cati"], rings=4)
O, T, N = Vector((0, y2)), Vector((1, 0)), Vector((0, 1))
Wp_, Hp_ = P["D_portal_on_w"], P["D_portal_on_h"]
kzs = P["kapi_h"] - P["kapi_w"] / 2; rk = P["kapi_w"] / 2
levha = [(-Wp_ / 2, 0), (-rk, 0), (-rk, kzs)] + [(-rk * math.cos(math.pi * k / 16), kzs + rk * math.sin(math.pi * k / 16)) for k in range(1, 16)] \
      + [(rk, kzs), (rk, 0), (Wp_ / 2, 0), (Wp_ / 2, Hp_), (-Wp_ / 2, Hp_)]
uvl = g.bm.loops.layers.uv.verify()
Pt3 = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
la = [g.bm.verts.new(Pt3(s, z, -0.02)) for s, z in levha]; lb = [g.bm.verts.new(Pt3(s, z, 0.03)) for s, z in levha]
luv = {v: ((s + Wp_ / 2) / Wp_, z / Hp_) for (s, z), v in list(zip(levha, la)) + list(zip(levha, lb))}
for f in [g.F(la[::-1], M["portal_on"]), g.F(lb, M["portal_on"])] + \
         [g.F([la[i], la[(i + 1) % len(levha)], lb[(i + 1) % len(levha)], lb[i]], M["tas_portal"]) for i in range(len(levha))]:
    if f:
        for l in f.loops: l[uvl].uv = luv[l.vert]
def halat(yol):
    adim, a_, b_, c_ = P["D_halat_adim"], P["D_halat_a"], P["D_halat_b"], P["D_halat_r"]
    eg = math.radians(P["D_halat_egim"]); ce, se = math.cos(eg), math.sin(eg); nl = 6
    seg = [(Vector(yol[i]), Vector(yol[i + 1])) for i in range(len(yol) - 1)]
    top = sum((q - p).length for p, q in seg); d = adim / 2
    while d < top:
        kalan = d
        for p0, p1 in seg:
            l = (p1 - p0).length
            if kalan <= l: break
            kalan -= l
        t = (p1 - p0).normalized(); p = p0 + t * kalan
        u = Vector((t.x * ce - t.y * se, t.x * se + t.y * ce)); v = Vector((-u.y, u.x))
        halkalar = []
        for al in (0.0, math.radians(35), math.radians(68)):
            halkalar.append([g.bm.verts.new(Pt3(*(p + u * (a_ * math.cos(al) * math.cos(2 * math.pi * j / nl))
                                                 + v * (b_ * math.cos(al) * math.sin(2 * math.pi * j / nl))), 0.02 + c_ * math.sin(al)))
                             for j in range(nl)])
        tepe = g.bm.verts.new(Pt3(*p, 0.02 + c_))
        g.F(halkalar[0][::-1], M["tas_acik"])
        for h0, h1 in zip(halkalar[:-1], halkalar[1:]):
            for j in range(nl): g.F([h0[j], h0[(j + 1) % nl], h1[(j + 1) % nl], h1[j]], M["tas_acik"])
        for j in range(nl): g.F([halkalar[-1][j], halkalar[-1][(j + 1) % nl], tepe], M["tas_acik"])
        d += adim
hr = P["D_halat_r"]; xr = Wp_ / 2 - hr; ri_ = rk + hr
halat([(-xr, 0.3), (-xr, Hp_ - hr), (xr, Hp_ - hr), (xr, 0.3)])
halat([(-ri_, 0.3), (-ri_, kzs)] + [(-ri_ * math.cos(math.pi * k / 24), kzs + ri_ * math.sin(math.pi * k / 24)) for k in range(1, 24)] + [(ri_, kzs), (ri_, 0.3)])
zt_ = H + P["portal_ek_h"]; kd, kh = P["D_korn_dis"], P["D_korn_h"]
panel(g, Vector((0, y1)), T, N, [(-pw / 2, zt_ - 0.15), (-sw_ / 2 - 0.01, zt_ - 0.15), (-sw_ / 2 - 0.01, zt_ + 0.03), (-pw / 2, zt_ + 0.03)], -0.02, 0.2, M["tugla"])
panel(g, Vector((0, y1)), T, N, [(sw_ / 2 + 0.01, zt_ - 0.15), (pw / 2, zt_ - 0.15), (pw / 2, zt_ + 0.03), (sw_ / 2 + 0.01, zt_ + 0.03)], -0.02, 0.2, M["tugla"])
panel(g, O, T, N, [(-sw_ / 2, zt_ - 0.15), (sw_ / 2, zt_ - 0.15), (sw_ / 2, zt_ + 0.03), (-sw_ / 2, zt_ + 0.03)], -0.02, 0.2, M["tugla"])
for k in range(int(sw_ // kd)):
    s0 = -sw_ / 2 + (sw_ - int(sw_ // kd) * kd) / 2 + k * kd
    panel(g, O, T, N, [(s0 + 0.01, zt_ - 0.13), (s0 + kd - 0.01, zt_ - 0.13), (s0 + kd / 2, zt_ - 0.15 - kh)], -0.02, 0.12, M["tugla"])
portal_obj = g.obj()

# --- kapı içi (foto portal_web_*): derin giriş holü + taş çerçeveli iç kapı; kuzey kanadı boydan boya geçit ---
def kes(hedef, kesici_, self_=False):
    md = hedef.modifiers.new("kapi", 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = kesici_; md.solver = 'EXACT'
    try: md.material_mode = 'TRANSFER'
    except Exception: pass
    if self_:
        try: md.use_self = True
        except Exception: pass
    bpy.context.view_layer.objects.active = hedef; bpy.ops.object.modifier_apply(modifier="kapi")
def kesici(ad, poly, O, o0, o1, m):
    gk_ = A.G(ad); panel(gk_, O, Vector((1, 0)), Vector((0, 1)), poly, o0, o1, m); return gk_.obj()
HOL_E = OY - 1.4                                                   # T: hol sonu (foto: giriş holü ≈ 6–7 m derin)
kw_ = P["kapi_w"] - 0.03; kzs_ = P["kapi_h"] - P["kapi_w"] / 2                  # v08: hol genişliği levha açıklığıyla aynı (5,0 m); v07'de 4,9 idi ve yanlarda 5 cm'lik siyah boşluk kalıyordu
hol = [(-kw_ / 2, -0.05), (kw_ / 2, -0.05)] + [(kw_ / 2 * math.cos(math.pi * q / 16), kzs_ + kw_ / 2 * math.sin(math.pi * q / 16)) for q in range(17)]
ik_w, ik_z = 3.0, 2.6                                              # iç kapı: han kemer gözü (3,0 m); sivri kemer tepesi ≈ 4,4 m
ik = [(-ik_w / 2, -0.05), (ik_w / 2, -0.05)] + list(reversed(kemer(ik_w, ik_z, True, n=6, kk=0.6)))
c1 = kesici("_kes_hol_p", hol, Vector((0, HOL_E)), 0.0, (y2 + 0.6) - HOL_E, M["tas_portal"]); kes(portal_obj, c1, True); bpy.data.objects.remove(c1, do_unlink=True)
c2 = kesici("_kes_hol_g", hol, Vector((0, HOL_E)), 0.0, (y2 + 0.6) - HOL_E, M["duvar"]); kes(gov, c2); bpy.data.objects.remove(c2, do_unlink=True)
c3 = kesici("_kes_ic", ik, Vector((0, RY - 1.0)), 0.0, (HOL_E + 0.6) - (RY - 1.0), M["duvar"]); kes(gov, c3); bpy.data.objects.remove(c3, do_unlink=True)
gi = A.G("_hol_ic"); Oh, Th, Nh = Vector((0, HOL_E)), Vector((1, 0)), Vector((0, 1)); hw = kw_ / 2 - 0.012
tu = [(-hw, 4.9), (hw, 4.9), (hw, kzs_)] + [(hw * math.cos(math.pi * q / 16), kzs_ + hw * math.sin(math.pi * q / 16)) for q in range(1, 16)] + [(-hw, kzs_)]
panel(gi, Oh, Th, Nh, tu, 0.0, 0.08, M["duvar"])                                                                                   # hol sonu üst yarı: tuğla/almaşık
panel(gi, Oh, Th, Nh, [(-1.75, 4.95), (1.75, 4.95), (1.75, 5.70), (-1.75, 5.70)], 0.08, 0.14, M["tas_acik"])                          # «KOZA HAN» levhası
for sx_ in (-1, 1): pencere_doku(gi, Vector((sx_ * 0.9, HOL_E + 0.08)), Th, Nh, 0.7 + 2 * P["D_sove"], 5.85, 1.0 + 2 * P["D_sove"])   # iki parmaklıklı pencere
fo, fi = kemer(ik_w + 0.7, ik_z, True, n=6, kk=0.6), kemer(ik_w, ik_z, True, n=6, kk=0.6)
panel(gi, Oh, Th, Nh, fo + fi[::-1], 0.0, 0.10, M["tas_portal"])                                                                   # iç kapı taş çerçevesi
for sx_ in (-1, 1): panel(gi, Oh, Th, Nh, [(sx_ * ik_w / 2, 0.0), (sx_ * (ik_w / 2 + 0.35), 0.0), (sx_ * (ik_w / 2 + 0.35), ik_z + 0.012), (sx_ * ik_w / 2, ik_z + 0.012)], 0.0, 0.10, M["tas_portal"])
hol_ic = gi.obj()
bpy.ops.object.select_all(action='DESELECT'); portal_obj.select_set(True); hol_ic.select_set(True)
bpy.context.view_layer.objects.active = portal_obj; bpy.ops.object.join(); portal_obj.name = "Portal"
bpy.ops.object.select_all(action='DESELECT'); gov.select_set(True); gg_obj.select_set(True)
bpy.context.view_layer.objects.active = gov; bpy.ops.object.join()

# ======================= MESCİT (Güler 2020 rölövesi, plan §2) =======================
c0 = Vector((0, 0))
Rp, ap = P["m_ayak_R"], P["m_govde_ap"]
Rb = ap / math.cos(math.pi / 8)                                     # gövde çevrel yarıçapı (3,669); ayak ucu = 3,27 + 0,40 ≈ gövde köşesi
z_hv, z_uz, z_do, z_sa = P["m_hv_kot"], P["m_uzenge"], P["m_dosem"], P["m_sacak"]
gp = A.circle(c0, Rb, 8, math.pi / 8)                               # düz yüzler han eksenlerine paralel (yüz merkezleri 0°, 45°, …)
g = A.G("Avlu_Mescit")
# taban: mermer döşeme halkası (16 kenarlı, Ø 7,7) + 16 kenarlı havuz
g.prism(A.circle(c0, P["m_tas_halka_R"], 16, math.pi / 16), 0.0, P["m_tas_halka_h"], M["mermer"], M["mermer"])
hv_dis = A.circle(c0, P["m_havuz_R"], 16, math.pi / 16); hv_ic = A.circle(c0, P["m_havuz_R"] - P["m_havuz_cidar"], 16, math.pi / 16)
ring(g, hv_dis, hv_ic, 0.10, z_hv, z_hv, M["mermer"], M["mermer"], M["mermer"])
g.prism(A.circle(c0, P["m_havuz_R"] - P["m_havuz_cidar"] - 0.01, 16, math.pi / 16), 0.12, z_hv - P["m_su_ind"], M["su"], M["su"])
for k in range(16):                                                  # E: alt kenarlarda musluklar (16)
    phi = math.pi / 16 + k * math.pi / 8
    g.prism(A.rect(Vector((math.cos(phi), math.sin(phi))) * (P["m_havuz_R"] + 0.06), 0.14, 0.05, phi), 0.44, 0.50, M["alem"], M["alem"])
# 8 beşgen ayak (dışa sivri), alt 1,0 m beyaz mermer, üstü kesme taş
pw_ = P["m_ayak_w"] / 2
for k in range(8):
    phi = math.pi / 8 + k * math.pi / 4
    rh = Vector((math.cos(phi), math.sin(phi))); th = Vector((-rh.y, rh.x))
    pent = [rh * (Rp + r_) + th * t_ for t_, r_ in ((-pw_, -pw_), (pw_, -pw_), (pw_, 0.10), (0.0, 0.40), (-pw_, 0.10))]
    g.prism(pent, 0.0, P["m_ayak_mermer_h"], M["mermer"], False)
    g.prism(pent, P["m_ayak_mermer_h"], z_do, M["kesme"], M["kesme"], bottom=False)
# orta ayak: basamaklı kaide, sekizgen gövde, mukarnas başlık, her yüzde bir boru
g.prism(A.circle(c0, P["m_orta_kaide_r"], 8, 0.0), 0.12, 0.45, M["mermer"], M["mermer"])
g.prism(A.circle(c0, P["m_orta_kaide_r"] - 0.1, 8, 0.0), 0.45, z_hv, M["mermer"], M["mermer"])
ra = P["m_orta_ayak_r"]
g.lathe(c0, [(ra, z_hv), (ra, 1.62), (ra * 1.5, 1.70), (ra * 1.95, 1.82), (ra * 2.2, z_uz), (ra * 2.0, 2.10), (ra * 1.3, 2.28), (ra, 2.40), (ra, z_do)], 8, [M["kesme"]] * 8)
for k in range(8):
    phi = k * math.pi / 4
    g.prism(A.rect(Vector((math.cos(phi), math.sin(phi))) * (ra + 0.05), 0.20, 0.05, phi), 1.02, 1.08, M["alem"], M["alem"])
# gövde: düzgün sekizgen, kesme taş; 3,50 → 6,88, saçak 6,88 → 6,98
g.prism(gp, z_do, z_sa - P["m_saçak_h"], M["kesme"], M["kesme"])
A.silme(g, gp, z_sa - P["m_saçak_h"], z_sa, P["m_saçak_d"], M["kesme"])
# 8 yüzde: yuvarlak kemer kuşağı; KB (135°) kapı, GD (315°) mihrap (penceresiz), kalan 6 yüzde pencere
w_ac = 2 * Rp * math.sin(math.pi / 8) - P["m_ayak_w"]               # ayaklar arası kemer açıklığı
Lb = 2 * Rb * math.sin(math.pi / 8)
for k in range(8):
    phi = k * math.pi / 4
    n = Vector((math.cos(phi), math.sin(phi))); t = Vector((-n.y, n.x))
    panel(g, n * ap, t, n, kemer_alinlik(w_ac, z_uz, z_do, sivri=False, e=(Lb - w_ac) / 2 - 0.01, n=8), -P["m_duvar"] / 2 - 0.03, -0.01, M["kesme"])
    if abs(math.degrees(phi) - P["m_kapi_phi"]) < 1:
        A.pencere(g, n * ap, t, n, P["m_kapi_w"], z_do + 0.02, P["m_kapi_ust"] - P["m_kapi_w"] / 2, M["ahsap"])
        # kapı üstü kitabe tabelası (foto Koza_Han_mescidinin_giriş_kapısı, kozahan_arsiv_043): açık mermer levha, üzerinde yazı (içerik okunamıyor: soyut yazı satırları)
        tw_, th_, tz_ = 1.21, 0.25, P["m_kapi_ust"] + 0.19           # H: foto oranı: genişlik ≈ 1,2 × kapı açıklığı, en-boy ≈ 5:1, kemerin ≈ 0,19 m üstünde
        uvt = g.bm.loops.layers.uv.verify(); O4 = n * ap
        P4 = lambda s_, z_, o_: (O4.x + t.x * s_ + n.x * o_, O4.y + t.y * s_ + n.y * o_, z_)
        pt_ = [(-tw_ / 2, tz_), (tw_ / 2, tz_), (tw_ / 2, tz_ + th_), (-tw_ / 2, tz_ + th_)]
        ta = [g.bm.verts.new(P4(s_, z_, -0.02)) for s_, z_ in pt_]; tb = [g.bm.verts.new(P4(s_, z_, 0.03)) for s_, z_ in pt_]      # duvardan 3 cm çıkıntılı ince mermer panel
        tuv = {v_: ((s_ + tw_ / 2) / tw_, (z_ - tz_) / th_) for (s_, z_), v_ in list(zip(pt_, ta)) + list(zip(pt_, tb))}
        for f_ in [g.F(ta[::-1], M["tabela"]), g.F(tb, M["tabela"])] + [g.F([ta[i_], ta[(i_ + 1) % 4], tb[(i_ + 1) % 4], tb[i_]], M["mermer"]) for i_ in range(4)]:
            if f_:
                for l_ in f_.loops: l_[uvt].uv = tuv[l_.vert]
    elif abs(math.degrees(phi) - 315.0) > 1:
        sv = P["D_sove"]; pw2, ph2 = P["m_pen_w"], P["m_pen_h"]; z0p = P["m_pen_z0"]
        pencere_doku(g, n * ap, t, n, pw2 + 2 * sv, z0p - sv, ph2 + 2 * sv)
        rl = pw2 / 2 + sv; zl = z0p + ph2 + sv + P["D_alinlik_bosluk"]
        yay = kemer(2 * rl, zl, True, n=8, kk=P["m_alinlik_k"]); hh = max(z for _, z in yay) - zl
        uvl_ = g.bm.loops.layers.uv.verify(); off = A.DECAL_OFF; O3 = n * ap
        P3 = lambda s, z, o: (O3.x + t.x * s + n.x * o, O3.y + t.y * s + n.y * o, z)
        va = [g.bm.verts.new(P3(s, z, off)) for s, z in yay]; vb = [g.bm.verts.new(P3(s, z, off + 0.05)) for s, z in yay]
        uvd = {v: ((s + rl) / (2 * rl), (z - zl) / hh) for (s, z), v in list(zip(yay, va)) + list(zip(yay, vb))}
        for f in [g.F(va[::-1], M["petek"]), g.F(vb, M["petek"])] + [g.F([va[i], va[(i + 1) % len(yay)], vb[(i + 1) % len(yay)], vb[i]], M["mermer"]) for i in range(len(yay))]:
            if f:
                for l in f.loops: l[uvl_].uv = uvd[l.vert]
# merdiven (KB yüzde, kapıya dik, kuzeybatıya iner). Rölöve batı cephesi + foto 043: toplam 4,94 m (sahanlık 1,2 DAHİL), 14 rıht, yanlarda yere inen dolu
# taş duvar, duvarın mescit tarafında büyük kemerli boşluk, üstünde iki sıra yuvarlak delikli korkuluk ve 4 çift başlıklı dikme.
phi_k = math.radians(P["m_kapi_phi"])
dv = Vector((math.cos(phi_k), math.sin(phi_k))); tv = Vector((-dv.y, dv.x))
nb, rih = P["m_basamak"], P["m_rihr"]
y_kapi = ap - 0.1; y_san = ap + P["m_sahanlik"]; y_son = ap + P["m_uzunluk"]
run = (y_son - y_san) / (nb - 1)                                   # 13 basamak yüzü arası; son rıht zemine iner
zb = z_do; assert abs(nb * rih - zb) < 1e-6
Lq, zu = P["m_bosluk_L"], zb - P["m_bosluk_ust"]
prof = [(y_kapi, zu), (y_kapi, zb)]
for k in range(nb):
    x_ = y_san + k * run
    prof += [(x_, zb - k * rih), (x_, zb - (k + 1) * rih)]
prof += [(y_kapi + Lq * math.cos(math.radians(t_)), zu * math.sin(math.radians(t_))) for t_ in [90 * q / 10 for q in range(10)]]      # v04: boşluk yayının merkezi köşede (zemin ∩ kapı yüzü): büyük oval boşluk
def loc(u, lat, z): return (dv.x * u + tv.x * lat, dv.y * u + tv.y * lat, z)
mw = P["m_net_w"]; kt2 = (P["m_toplam_w"] - mw) / 2; kh2 = P["m_korkuluk_h"]
sa = [g.bm.verts.new(loc(u, -mw / 2, z)) for u, z in prof]; sb = [g.bm.verts.new(loc(u, mw / 2, z)) for u, z in prof]
g.F(sa[::-1], M["mermer"]); g.F(sb, M["mermer"])
for i in range(len(prof)):
    j = (i + 1) % len(prof); g.F([sa[i], sa[j], sb[j], sb[i]], M["mermer"])
z_burun = zb - (nb - 1) * rih                                     # son basamak burnu (0,25)
def z_ust(u): return zb if u <= y_san else zb + (z_burun - zb) * (u - y_san) / (y_son - y_san)     # duvar üstü = basamak burunları çizgisi
# yan duvarlar: yere kadar dolu taş, mescit tarafında kemerli boşluk (ön yüzü açık, aynı boşluk profili)
duvar = [(y_kapi, zb), (y_san, zb), (y_son, z_burun), (y_son, 0.0), (y_kapi + Lq, 0.0)] + [(y_kapi + Lq * math.cos(math.radians(t_)), zu * math.sin(math.radians(t_))) for t_ in [90 * q / 10 for q in range(1, 10)]] + [(y_kapi, zu)]
for s_ in (-1, 1):
    wa = [g.bm.verts.new(loc(u, s_ * (mw / 2 - 0.001), z)) for u, z in duvar]; wb = [g.bm.verts.new(loc(u, s_ * (mw / 2 + kt2), z)) for u, z in duvar]
    g.F(wa[::-1], M["kesme"]); g.F(wb, M["kesme"])
    for i in range(len(duvar)):
        j = (i + 1) % len(duvar); g.F([wa[i], wa[j], wb[j], wb[i]], M["kesme"])
# korkuluk: duvar üstünde, 4 cm içeride; iki sıra yuvarlak delik (doku/korkuluk_daire.png)
kprof = [(y_kapi, zb, 0), (y_san, zb, 0), (y_son, z_burun, 0), (y_son, z_burun + kh2, 1), (y_san, zb + kh2, 1), (y_kapi, zb + kh2, 1)]
COS_E = (y_son - y_san) / math.hypot(y_son - y_san, zb - z_burun)       # eğim açısının kosinüsü
def yay_u(u):
    """v10: delikler eğimde de yuvarlak kalsın: eğimli kesitte dikey 0,9 m, levha düzleminde 0,9·cos(α) olur; u ekseni aynı oranda sıkıştırılır."""
    düz = (min(u, y_san) - y_kapi) / 0.5
    egim = 0.0 if u <= y_san else math.hypot(y_son - y_san, zb - z_burun) * (u - y_san) / (y_son - y_san) / (0.5 * COS_E)
    return düz + egim
uvk = g.bm.loops.layers.uv.verify()
for s_ in (-1, 1):
    l0, l1 = sorted((s_ * (mw / 2 + 0.04), s_ * (mw / 2 + kt2 - 0.04)))
    ka = [g.bm.verts.new(loc(u, l0, z + 0.02)) for u, z, v in kprof]; kb_ = [g.bm.verts.new(loc(u, l1, z + 0.02)) for u, z, v in kprof]
    uvd = {vv: (yay_u(u), float(v)) for (u, z, v), vv in list(zip(kprof, ka)) + list(zip(kprof, kb_))}
    nk = len(kprof)
    kapaklar = []
    for qd in ((0, 1, 4, 5), (1, 2, 3, 4)):                                     # v11: kapak = sahanlık dörtgeni + eğim dörtgeni (paralel kenarlı: UV doğrusal kalır)
        kapaklar += [g.F([ka[i] for i in reversed(qd)], M["korkuluk_m"]), g.F([kb_[i] for i in qd], M["korkuluk_m"])]
    for f in kapaklar + [g.F([ka[i], ka[(i + 1) % nk], kb_[(i + 1) % nk], kb_[i]], M["kesme"]) for i in range(nk)]:
        if f:
            for l in f.loops: l[uvk].uv = uvd[l.vert]
    # 4 dikme (sahanlık ucu, eğimde iki ara, zemin ucu): kare gövde + piramit başlık; sahanlıkta da kapı tarafında bir dikme
    for u_ in (y_kapi + 0.12, y_san, y_san + (y_son - y_san) / 2, y_son - 0.13):
        c_ = Vector(loc(u_, s_ * (mw / 2 + kt2 / 2), 0)[:2]); zt = z_ust(u_)
        g.prism(A.rect(c_, 0.26, 0.26, math.atan2(dv.y, dv.x)), zt - 0.05, zt + kh2 + 0.12, M["kesme"], M["kesme"])
        g.roof_pyr(A.rect(c_, 0.32, 0.32, math.atan2(dv.y, dv.x)), zt + kh2 + 0.12, zt + kh2 + 0.34, M["kesme"])
g.obj()

# kubbe: kurşun, çan eteği (Ø 7,1 → gövde Ø 5,6, z 7,5), yarım küreye yakın; alem + hilal (v02j alemi)
g = A.G("Mescit_Kubbe")
Rg, zg_ = P["m_kubbe_govde_R"], P["m_kubbe_govde_z"]; Re = P["m_kubbe_etek_R"]; zt_k = P["m_kubbe_tepe"]
etek = [(Re, z_sa), (Re - 0.15, z_sa + 0.05), (Rg + 0.12, z_sa + 0.14), (Rg + 0.03, z_sa + 0.30), (Rg, zg_)]
ust = [(Rg * math.cos(math.radians(a_)), zg_ + (zt_k - zg_) * math.sin(math.radians(a_)) * (1.0 if a_ < 90 else 1.0)) for a_ in (18, 36, 54, 72, 84)]
profil = [(0, z_sa)] + etek + ust + [(0, zt_k)]
g.lathe(c0, profil, P["m_kubbe_seg"], [M["kursun"]] * (len(profil) - 1))
za = zt_k - 0.05
g.lathe(c0, [(0.1, za), (0.16, za + 0.12), (0.06, za + 0.22), (0.2, za + 0.42), (0.06, za + 0.62), (0.13, za + 0.74), (0.04, za + 0.86), (0, za + 0.9)], 8, [M["alem"]] * 7)
zh = za + 0.86 + 0.32; hr_, hi_ = 0.34, 0.27
hilal = [(hr_ * math.cos(a_), zh + hr_ * math.sin(a_)) for a_ in [math.radians(200 + 140 * k / 10) for k in range(11)]]
ic = [(hi_ * math.cos(a_), zh + 0.1 + hi_ * math.sin(a_)) for a_ in [math.radians(340 - 140 * k / 10) for k in range(11)]]
O_, T_, N_ = Vector((0, 0)), Vector((1, 0)), Vector((0, 1))
panel(g, O_, T_, N_, hilal + ic, -0.03, 0.03, M["alem"])
yildiz = [((0.1 if q % 2 == 0 else 0.04) * math.cos(math.pi / 2 + math.pi * q / 5), zh + 0.2 + (0.1 if q % 2 == 0 else 0.04) * math.sin(math.pi / 2 + math.pi * q / 5)) for q in range(10)]
panel(g, O_, T_, N_, yildiz, -0.03, 0.03, M["alem"])
g.lathe(c0, [(0.03, za + 0.84), (0.03, zh - hr_ + 0.03), (0, zh - hr_ + 0.04)], 6, [M["alem"]] * 2)
g.obj()
# 24 düşey dikiş (kurşun şerit, 0,03 kabarık)
g = A.G("Mescit_Dikis")
pf = [(Rg, zg_)] + [(r_, z_) for r_, z_ in ust if r_ > 0.45]
def pn(i):
    a0 = pf[max(i - 1, 0)]; a1 = pf[min(i + 1, len(pf) - 1)]
    tr, tz = a1[0] - a0[0], a1[1] - a0[1]; l = math.hypot(tr, tz) or 1
    return tz / l, -tr / l                                          # profil yukarı ve içe giderken dışa bakan normal
for j in range(P["m_kubbe_seg"]):
    th = 2 * math.pi * j / P["m_kubbe_seg"]; cs, sn = math.cos(th), math.sin(th)
    halkalar = []
    for i, (r_, z_) in enumerate(pf):
        nr, nz = pn(i); dth = 0.02 / max(r_, 0.3); br, bz = r_ - nr * 0.012, z_ - nz * 0.012; dh = P["m_dikis_h"]
        halkalar.append([g.bm.verts.new((br * math.cos(th - dth), br * math.sin(th - dth), bz)), g.bm.verts.new((br * math.cos(th + dth), br * math.sin(th + dth), bz)),
                         g.bm.verts.new(((r_ + nr * dh) * cs, (r_ + nr * dh) * sn, z_ + nz * dh))])
    for h0, h1 in zip(halkalar[:-1], halkalar[1:]):
        g.F([h0[0], h1[0], h1[1], h0[1]], M["dikis"]); g.F([h0[1], h1[1], h1[2], h0[2]], M["dikis"]); g.F([h0[2], h1[2], h1[0], h0[0]], M["dikis"])
    g.F(halkalar[0][::-1], M["dikis"]); g.F(halkalar[-1], M["dikis"])
g.obj()

# ======================= CEPHELER (dış pencereler) =======================
def ust_pencere(g, O, T, N):
    w, z0, h = P["D_dis_ust_w"], P["alt_h"] + P["D_dis_ust_z0"], P["D_dis_ust_h"]
    sv = P["D_sove"]
    pencere_doku(g, O, T, N, w + 2 * sv, z0 - sv, h + 2 * sv)
    h = h + sv
    wi = w + 2 * P["D_alinlik_ic_pay"]; wo = wi + 2 * P["D_alinlik_bant"]
    zs = z0 + h + P["D_alinlik_bosluk"]; kk = P["D_alinlik_k"]
    dis = kemer(wo, zs, True, n=4, kk=kk)
    ic = kemer(wi, zs, True, n=4, kk=(kk * wo - P["D_alinlik_bant"]) / wi)
    panel(g_, O, T, N, dis + ic[::-1], -0.02, P["D_alinlik_d"], M["tugla"])

def cephe(ad, odalar, T, N, sabit, adim, yari, atla=lambda s: False, atla_alt=None, ek=None):
    global g_
    g_ = g = A.G(ad)
    atla_alt = atla_alt or atla
    for s in odalar:
        if atla_alt(s): continue
        O = T * s + N * sabit
        sv = P["D_sove"]
        pencere_doku(g, O, T, N, P["D_dis_alt_w"] + 2 * sv, P["D_dis_alt_z0"] - sv, P["D_dis_alt_h"] + 2 * sv)
    j = 0
    while adim * (j + 0.5) <= yari - 0.9:
        for s in (-adim * (j + 0.5), adim * (j + 0.5)):
            if not atla(s): ust_pencere(g, T * s + N * sabit, T, N)
        j += 1
    if ek: ek(g)
    return g.obj()
def oda_merkezleri(adim, yari):
    on = P["oda_n"]; ort = [(k - (on - 1) / 2) * adim for k in range(on)]
    kose = (on * adim / 2 + yari) / 2
    return ort + [-kose, kose]
dxa, dya = P["cephe_oda_adim_x"], P["cephe_oda_adim_y"]
odalar_x = oda_merkezleri(dxa, OX); odalar_y = oda_merkezleri(dya, OY)
portal_onu = lambda s: abs(s) < pw / 2 + 0.6
ic_ortuk = lambda s: (IC_Y0 - 0.6 <= s <= IC_AY0 + 0.6) or (IC_AY1 - 0.6 <= s <= IC_Y1 + 0.6) or abs(s - IC_CY) < GR + 0.9      # + geçit açıklığına denk gelen alt pencere (v07: açıklıkta asılı kalıyordu)      # İç Koza'nın arkasında kalan alt kat pencereleri (avlu önündekiler açık)
def portal_yan(g):
    for s in (-1, 1):
        for f_ in (0.25, 0.75):
            ust_pencere(g, Vector((s * pw / 2, OY + P["portal_cikinti"] * f_)), Vector((0, 1)), Vector((s, 0)))
        for x_ in (sw_ / 2 + 0.9, sw_ / 2 + 2.7):
            ust_pencere(g, Vector((s * x_, OY + P["portal_cikinti"])), Vector((1, 0)), Vector((0, 1)))
cephe("Cephe_Kuzey", odalar_x, Vector((1, 0)), Vector((0, 1)), OY, dxa / 2, OX, portal_onu, ek=portal_yan)
cephe("Cephe_Guney", odalar_x, Vector((1, 0)), Vector((0, -1)), OY, dxa / 2, OX)
cephe("Cephe_Dogu", odalar_y, Vector((0, 1)), Vector((1, 0)), OX, dya / 2, OY, lambda s: False, ic_ortuk)
cephe("Cephe_Bati", odalar_y, Vector((0, 1)), Vector((-1, 0)), OX, dya / 2, OY)

# draw call ≤ 60 (figürler +10 yuva): dört dış cephe nesnesi tek mesh'e birleştirilir
bpy.ops.object.select_all(action='DESELECT')
for _n in ("Cephe_Kuzey", "Cephe_Guney", "Cephe_Dogu", "Cephe_Bati"): bpy.data.objects[_n].select_set(True)
bpy.context.view_layer.objects.active = bpy.data.objects["Cephe_Kuzey"]; bpy.ops.object.join(); bpy.context.active_object.name = "Cephe"; bpy.context.active_object.data.name = "Cephe"

# --- Avlu_Cephe: oda duvarında göz başına alt kat dükkân kapısı + üst kat oda kapısı (doğuda geçit gözü hariç) ---
g = A.G("Avlu_Cephe")
for liste, T, eksen in ((cx_list, Vector((1, 0)), "y"), (cy_list, Vector((0, 1)), "x")):
    for s in (-1, 1):
        N = Vector((0, -s)) if eksen == "y" else Vector((-s, 0))
        for c in liste:
            O = T * c - N * (RY if eksen == "y" else RX)
            gecit_goz = (eksen == "x" and s == 1 and abs(c - IC_CY) < 0.1) or (eksen == "y" and s == 1 and abs(c) < 0.1)      # doğu geçit gözü + kuzey portal geçidi gözü
            if not gecit_goz:
                A.pencere(g, O, T, N, P["D_avlu_kapi_w"], 0.03, P["D_avlu_kapi_h"] - P["D_avlu_kapi_w"] / 2, M["ahsap"])
            z0 = P["alt_h"] + 0.05
            A.pencere(g, O, T, N, P["D_avlu_ust_w"], z0, z0 + P["D_avlu_ust_h"] - P["D_avlu_ust_w"] / 2, M["kapi"])
g.obj()
g = A.G("Silme_Kat")
sh, sd = P["D_silme_h"], P["D_silme_d"]
ring(g, R4(OX + sd, OY + sd), R4(OX - 0.1, OY - 0.1), P["alt_h"] - sh / 2, P["alt_h"] + sh / 2, P["alt_h"] + sh / 2, M["tugla"], M["tugla"])
silme_obj = g.obj()
# kat silmesi iki kapı açıklığında (doğu geçidi tuğla kemer bandı dahil, kuzey portal) kesilir: kemer bandının üstünden geçmez
for ad_, O_, T_, N_, ha, o0, o1 in (("_kes_s1", Vector((OX, IC_CY)), Vector((0, 1)), Vector((1, 0)), GR + 0.5, -1.0, 1.0), ("_kes_s2", Vector((0, OY)), Vector((1, 0)), Vector((0, 1)), (P["kapi_w"] - 0.1) / 2 + 0.1, -1.0, 1.0)):
    gk_ = A.G(ad_); panel(gk_, O_, T_, N_, [(-ha, 4.5), (ha, 4.5), (ha, 5.6), (-ha, 5.6)], o0, o1, M["tugla"]); kc_ = gk_.obj()
    md_ = silme_obj.modifiers.new("kes", 'BOOLEAN'); md_.operation = 'DIFFERENCE'; md_.object = kc_; md_.solver = 'EXACT'
    bpy.context.view_layer.objects.active = silme_obj; bpy.ops.object.modifier_apply(modifier="kes"); bpy.data.objects.remove(kc_, do_unlink=True)

# ======================= AVLU ZEMİNİ VE PEYZAJ (plan §3) =======================
HALKA_R, YOL_W, YOL_B = P["halka_R"], P["yol_w"], P["yol_bordur"]
Z_YOL, Z_HALKA, Z_BORDUR, Z_CIM = 0.045, 0.05, 0.10, 0.10
YOL_ACI = [math.degrees(math.atan2(IC_CY, AX)), 90.0, 180.0, 270.0]
SAH = (P["m_kapi_phi"], P["m_toplam_w"] / 2 + 0.5, 7.0, 9.1)          # T: merdiven ayağı Ø 16 m halkanın dışına taşar (r ≈ 9,2) → önüne taş sahanlık (açı, yarı en, r0, r1)        # doğu yolu İç Koza geçidine (y = IC_CY) yönelir
def yol_seg(aci, r0, r1):
    d_ = Vector((math.cos(math.radians(aci)), math.sin(math.radians(aci))))
    return A.rect(d_ * ((r0 + r1) / 2), r1 - r0, YOL_W, math.radians(aci)), d_
g = A.G("Avlu_Zemin")
g.prism(R4(RX, RY), 0.0, 0.03, M["avlu"], M["avlu"])                          # ana avlu + revak altı parke
ic_ax0 = OX
g.prism(IC_AVLU, 0.0, 0.03, M["arnavut"], M["arnavut"])                                                    # İç Koza avlusu: Arnavut kaldırımı
g.prism(IC_HALL, 0.0, 0.028, M["avlu"], M["avlu"])                                                       # iç mekân zemini
g.prism([Vector((RX - 0.01, IC_CY - gw / 2)), Vector((ic_ax0 + 0.01, IC_CY - gw / 2)), Vector((ic_ax0 + 0.01, IC_CY + gw / 2)), Vector((RX - 0.01, IC_CY + gw / 2))], 0.0, 0.03, M["avlu"], M["avlu"])   # geçit zemini
for aci in YOL_ACI:
    r_son = (AX / abs(math.cos(math.radians(aci)))) if abs(math.cos(math.radians(aci))) > 0.5 else AY
    poly, d_ = yol_seg(aci, 6.0, r_son)
    g.prism(poly, 0.0, Z_YOL, M["avlu"], M["avlu"])
d_s = Vector((math.cos(math.radians(SAH[0])), math.sin(math.radians(SAH[0])))); nrm_s = Vector((-d_s.y, d_s.x))
g.prism(A.rect(d_s * ((SAH[2] + SAH[3]) / 2), SAH[3] - SAH[2], 2 * SAH[1], math.radians(SAH[0])), 0.0, Z_YOL, M["avlu"], M["avlu"])   # merdiven önü sahanlık (bordürsüz)
g.obj()
# mescit halkası: Ø 16 m, daire desenli parke (radyal + eşmerkezli derz, kutupsal UV) + 0,3 m bordür
g = A.G("Avlu_Halka")
NS = 20
def halka_halka(r0, r1, z, mat, uv_ok=True):
    uvl_ = g.bm.loops.layers.uv.verify()
    for j in range(NS):
        a0, a1 = 2 * math.pi * j / NS, 2 * math.pi * (j + 1) / NS
        vs = [g.V(Vector((r_ * math.cos(a_), r_ * math.sin(a_))), z) for r_, a_ in ((r0, a0), (r1, a0), (r1, a1), (r0, a1))]
        f = g.F(vs, mat)
        if f and uv_ok:
            for l, (u_, v_) in zip(f.loops, ((j, r0 / 0.4), (j, r1 / 0.4), (j + 1, r1 / 0.4), (j + 1, r0 / 0.4))): l[uvl_].uv = (u_, v_)
r_bord = HALKA_R                                                          # v04: krem bordür çizgileri kaldırıldı; halka düz parke
uvh = g.bm.loops.layers.uv.verify()
cap = g.F([g.V(Vector((0.4 * math.cos(2 * math.pi * j / NS), 0.4 * math.sin(2 * math.pi * j / NS))), Z_HALKA) for j in range(NS)], M["halka"])
for l in cap.loops: l[uvh].uv = (0.5, 0.5)
halka_halka(0.4, 4.0, Z_HALKA, M["halka"]); halka_halka(4.0, r_bord, Z_HALKA, M["halka"])
# paving kenarı (r_bord) + taban kapağı: kapalı hacim; bordür halkası ayrı kapalı hacim (4 mm aralıkla, köşe birleşmesin)
for j in range(NS):
    a0, a1 = 2 * math.pi * j / NS, 2 * math.pi * (j + 1) / NS
    q = lambda a_, z: g.V(Vector((r_bord * math.cos(a_), r_bord * math.sin(a_))), z)
    g.F([q(a1, Z_HALKA), q(a0, Z_HALKA), q(a0, 0.0), q(a1, 0.0)], M["halka"])
g.F([g.V(Vector((r_bord * math.cos(2 * math.pi * j / NS), r_bord * math.sin(2 * math.pi * j / NS))), 0.0) for j in range(NS)][::-1], M["halka"])
g.obj(recalc=False)                                                       # sarma yönleri elle doğru; birleşmemiş köşelerde otomatik yön hesabı yanılıyordu

# çim tarhları: yolların ayırdığı dört çeyrek; revak ayaklarından 3 m içeride, köşeleri 1,5 m pahlı
def klip(poly, nrm, c):
    out = []
    for i in range(len(poly)):
        p, q = poly[i], poly[(i + 1) % len(poly)]
        dp, dq = nrm.dot(p) - c, nrm.dot(q) - c
        if dp <= 0: out.append(p)
        if (dp < 0 < dq) or (dq < 0 < dp):
            out.append(p + (q - p) * (dp / (dp - dq)))
    return out
def disk_kes(poly, R, narc=2, cikinti=None):
    ins = [p.length < R for p in poly]; n = len(poly)
    if not any(ins): return poly                                              # v04: tarh halkadan uzakta, kesilecek bir şey yok
    def kesisim(p, q):
        d_ = q - p; aa = d_.dot(d_); bb = 2 * p.dot(d_); cc = p.dot(p) - R * R
        dsc = max(bb * bb - 4 * aa * cc, 0); ts = [(-bb + s_ * math.sqrt(dsc)) / (2 * aa) for s_ in (-1, 1)]
        t_ = [t for t in ts if 0 <= t <= 1][0]; return p + d_ * t_
    ib = next(i for i in range(n) if ins[i] and not ins[(i + 1) % n])          # içeriden dışarı (B)
    ia = next(i for i in range(n) if not ins[i] and ins[(i + 1) % n])          # dışarıdan içeri (A)
    B = kesisim(poly[ib], poly[(ib + 1) % n]); Aa = kesisim(poly[ia], poly[(ia + 1) % n])
    yeni = [B]; k = (ib + 1) % n
    while k != (ia + 1) % n:
        yeni.append(poly[k]); k = (k + 1) % n
    yeni.append(Aa)
    ta = math.atan2(Aa.y, Aa.x); tb = math.atan2(B.y, B.x)
    dt = (tb - ta + math.pi) % (2 * math.pi) - math.pi
    if dt > 0: dt -= 2 * math.pi
    arc = lambda t0, t1, n_: [Vector((R * math.cos(t0 + (t1 - t0) * q / (n_ + 1)), R * math.sin(t0 + (t1 - t0) * q / (n_ + 1)))) for q in range(1, n_ + 1)]
    if cikinti is None:
        return yeni + arc(ta, ta + dt, narc)
    aci, hw, rend = cikinti; ac = math.radians(aci); da = math.asin(hw / R)       # sahanlık çıkıntısı: çim tarhı sahanlığın çevresinde girinti yapar
    d_ = Vector((math.cos(ac), math.sin(ac))); n_ = Vector((-d_.y, d_.x))
    sp, sm = Vector((R * math.cos(ac + da), R * math.sin(ac + da))), Vector((R * math.cos(ac - da), R * math.sin(ac - da)))
    return yeni + arc(ta, ac + da, 1) + [sp, d_ * rend + n_ * hw, d_ * rend - n_ * hw, sm] + arc(ac - da, tb, 1)
def centroid_a(poly):
    A_ = sum(poly[i].x * poly[(i + 1) % len(poly)].y - poly[(i + 1) % len(poly)].x * poly[i].y for i in range(len(poly))) / 2
    cx = sum((poly[i].x + poly[(i + 1) % len(poly)].x) * (poly[i].x * poly[(i + 1) % len(poly)].y - poly[(i + 1) % len(poly)].x * poly[i].y) for i in range(len(poly))) / (6 * A_)
    cy = sum((poly[i].y + poly[(i + 1) % len(poly)].y) * (poly[i].x * poly[(i + 1) % len(poly)].y - poly[(i + 1) % len(poly)].x * poly[i].y) for i in range(len(poly))) / (6 * A_)
    return Vector((cx, cy))
def tarh(a1, a2):
    m_ = YOL_W / 2 + P["tarh_yol_ara"]; xb, yb = AX - P["tarh_pay"], AY - P["tarh_pay"]
    poly = [Vector((-200, -200)), Vector((200, -200)), Vector((200, 200)), Vector((-200, 200))]
    r1, r2 = math.radians(a1), math.radians(a2)
    poly = klip(poly, Vector((math.sin(r1), -math.cos(r1))), -m_)             # yol 1'in solunda
    poly = klip(poly, Vector((-math.sin(r2), math.cos(r2))), -m_)             # yol 2'nin sağında
    for nx, ny, c in ((1, 0, xb), (-1, 0, xb), (0, 1, yb), (0, -1, yb)): poly = klip(poly, Vector((nx, ny)), c)
    for sx in (-1, 1):
        for sy in (-1, 1): poly = klip(poly, Vector((sx, sy)), xb + yb - P["tarh_pah"])
    cik = (SAH[0], SAH[1] + P["tarh_yol_ara"], SAH[3] + P["tarh_yol_ara"]) if r1 < math.radians(SAH[0]) + 1e-9 < r2 or r1 < math.radians(SAH[0]) < r2 else None
    poly = disk_kes(poly, HALKA_R + 0.5)
    # v04: v03'ün tarh şekli korunur; revaka doğru kaydırılıp biraz küçültülür
    ma = math.radians((a1 + a2) / 2); kay = Vector((P["tarh_kaydir"] * (1 if math.cos(ma) >= 0 else -1), P["tarh_kaydir"] * (1 if math.sin(ma) >= 0 else -1)))
    poly = [p_ + kay for p_ in poly]; cc = centroid_a(A.ccw(poly)); poly = [cc + (p_ - cc) * P["tarh_olcek"] for p_ in poly]
    return A.ccw(poly)
acilar = sorted(YOL_ACI); acilar_c = acilar + [acilar[0] + 360]
TARHLAR = [tarh(acilar_c[i], acilar_c[i + 1]) for i in range(4)]
def alan(poly): return abs(sum(poly[i].x * poly[(i + 1) % len(poly)].y - poly[(i + 1) % len(poly)].x * poly[i].y for i in range(len(poly)))) / 2
CIM_ALAN = [round(alan(p_), 1) for p_ in TARHLAR]; CIM_ORAN = sum(CIM_ALAN) / (P["avlu_dx"] * P["avlu_dy"])
print("CIM", CIM_ALAN, round(CIM_ORAN, 3), flush=True)
g = A.G("Avlu_Cim")
for poly in TARHLAR:
    g.prism(poly, 0.0, Z_CIM, M["cim"], M["cim"])
    cit = ofs(poly, -0.15); n_ = len(cit)
    for z0r in (Z_CIM + 0.12, Z_CIM + 0.30):                                # iki kayıt
        ring(g, ofs(cit, 0.025), ofs(cit, -0.025), z0r, z0r + 0.06, z0r + 0.06, M["ahsap"], M["ahsap"])
    for i in range(n_):                                                      # dikmeler (≤ 4,5 m aralık)
        p, q = cit[i], cit[(i + 1) % n_]; kn = max(1, math.ceil((q - p).length / 7.0))
        for s_ in range(kn):
            c = p + (q - p) * (s_ / kn)
            g.prism(A.rect(c, 0.09, 0.09), Z_CIM - 0.02, Z_CIM + P["cit_h"], M["ahsap"], M["ahsap"])
g.obj()
# çınarlar (en çok 6: çeyrek tarhlarda 4 + İç Koza avlusunda 1)
def agac(g, c, h=None, r=None, i=0):
    h = h or P["agac_h"]; r = r or P["agac_taç_r"]
    g.prism(A.circle(c, 0.45, 6), -0.1, h * 0.55, M["govde"], M["govde"])
    zc = h * 0.78
    prof = [(0, h * 0.50), (r * 0.62, h * 0.54), (r * 0.98, h * 0.66), (r, zc), (r * 0.85, h * 0.92), (r * 0.45, h * 0.99), (0, h * 1.02)]
    g.lathe(c, prof, 7, [M["yaprak1"]] * (len(prof) - 1))
    c2 = c + Vector((0.9, -0.6)) * (1 if i % 2 == 0 else -1)
    prof2 = [(0, zc + 0.5), (r * 0.5, zc + 0.9), (r * 0.62, zc + 1.9), (r * 0.3, zc + 2.7), (0, zc + 2.9)]
    g.lathe(c2, prof2, 6, [M["yaprak2"]] * (len(prof2) - 1))
g = A.G("Avlu_Agac")
AGAC_YER = [centroid_a(p) for p in TARHLAR]          # çeyrek tarhlarda 4 çınar (İç Koza avlusuna ağaç konmadı: avlu bütçesi ≤ 2 500)
for i, c in enumerate(AGAC_YER): agac(g, c, i=i)
g.obj()

# ======================= İÇ KOZA HANI (plan §4: yalnız basit kütle) =======================
g = A.G("Ic_Koza"); h_e, h_r, H_TAV = P["ic_h"], P["ic_sirt"], 3.95
p_o = A.ccw(IC_OUT); cen = sum(p_o, Vector((0, 0))) / len(p_o)
g.prism(p_o, 0.0, h_e, M["moloz"], False)
re_ = [g.V(q, h_e) for q in p_o]; rr_ = [g.V(cen + (q - cen) * 0.5, h_r) for q in p_o]
for i_ in range(len(p_o)): g.F([re_[i_], re_[(i_ + 1) % len(p_o)], rr_[(i_ + 1) % len(p_o)], rr_[i_]], M["metal"])      # alçak kırma çatı, gri metal
g.F(rr_, M["metal"])
ic_obj = g.obj(recalc=False)
for ad_, poly_, z1_, m_ in (("_kes_hol", IC_HALL, H_TAV, M["siva"]), ("_kes_avlu", [Vector((31.0, q.y)) if abs(q.x - 32.0) < 1e-6 else q for q in IC_AVLU], 9.0, M["moloz"])):
    gk_ = A.G(ad_); gk_.prism(poly_, -1.0, z1_, m_, m_); kc_ = gk_.obj(); kes(ic_obj, kc_); bpy.data.objects.remove(kc_, do_unlink=True)    # iç mekân + açık avlu oyulur
ga = A.G("_ic_arkad"); piers = {}
def pier(pt, d, out):
    key = (round(pt.x, 2), round(pt.y, 2))
    if key in piers: return
    piers[key] = 1; ga.prism(A.rect(pt + out * 0.5, 1.0, 1.0, math.atan2(d.y, d.x)), 0.0, H_TAV + 0.05, M["moloz"], M["moloz"])        # 1,0 × 1,0 m taş ayak (E: 18)
KEMER_TEPE = 3.4
for i_ in range(len(IC_AVLU) - 1):                                         # son kenar = batı (han duvarı): revak yok
    P0, P1 = IC_AVLU[i_], IC_AVLU[i_ + 1]; L = (P1 - P0).length; d = (P1 - P0) / L; out = Vector((d.y, -d.x))
    nb = max(1, round(L / 4.6)); pitch = L / nb; ortulu = i_ in (1, 2)       # güneydoğu eğik ve doğu düz kenarın kemerleri örülü (E)
    for j_ in range(nb + 1): pier(P0 + d * pitch * j_, d, out)
    for k_ in range(nb):
        c = P0 + d * pitch * (k_ + 0.5); w = pitch - 1.0; sp = KEMER_TEPE - w / 2
        panel(ga, c, d, out, kemer_alinlik(w, sp, H_TAV + 0.05, sivri=False, e=0.03, n=6), 0.0, 1.0, M["moloz"])
        ro = w / 2 + 0.4
        halka = [(ro * math.cos(math.pi * q / 6), sp + ro * math.sin(math.pi * q / 6)) for q in range(7)] + [(w / 2 * math.cos(math.pi * q / 6), sp + w / 2 * math.sin(math.pi * q / 6)) for q in range(6, -1, -1)]
        panel(ga, c, d, -out, halka, -0.02, 0.12, M["tugla"])                  # geniş yuvarlak tuğla kemer bandı (avlu yüzü)
        if ortulu:
            panel(ga, c, d, out, [(-w / 2, 0.0), (w / 2, 0.0)] + list(reversed(kemer(w, sp, False, n=6))), 0.45, 0.70, M["moloz"])   # örülü dolgu, geri çekik
            if k_ % 2 == 0: A.pencere(ga, c + out * 0.45, d, -out, 1.0, 0.0, 1.9, M["ahsap"])
            else: A.pencere(ga, c + out * 0.45, d, -out, min(w - 0.8, 2.2), 0.5, 1.7, M["kapi"])
    L_ = L; panel(ga, P0, d, -out, [(0, 4.0), (L_ - 0.03, 4.0), (L_ - 0.03, 4.5), (0, 4.5)], 0.0, 0.10, M["disli"])    # saçak altı 3 sıra dişli tuğla (avlu yüzü)
for i_ in range(len(p_o) - 1):                                              # dış duvar: dişli tuğla bant + küçük pencereler (≈ 2,5 m aralık); batı kenar (han) hariç
    P0, P1 = p_o[i_], p_o[i_ + 1]; L = (P1 - P0).length; d = (P1 - P0) / L; out = Vector((d.y, -d.x))
    panel(ga, P0, d, out, [(0, 4.0), (L - 0.03, 4.0), (L - 0.03, 4.5), (0, 4.5)], 0.0, 0.10, M["disli"])
    nw_ = max(1, round(L / 2.5))
    for m_ in range(nw_):
        pos = P0 + d * (L * (m_ + 0.5) / nw_); sv = P["D_sove"]
        pencere_doku(ga, pos, d, out, 0.6 + 2 * sv, 1.9 - sv, 1.0 + 2 * sv)
        panel(ga, pos, d, out, [(-0.46, 3.1), (0.46, 3.1), (0.46, 3.25), (0.0, 3.6), (-0.46, 3.25)], -0.02, 0.10, M["tugla"])   # tuğla kemerli alınlık
def icinde(poly, pt):
    c_ = False
    for a_, b_ in zip(poly, poly[1:] + poly[:1]):
        if (a_.y > pt.y) != (b_.y > pt.y) and pt.x < (b_.x - a_.x) * (pt.y - a_.y) / (b_.y - a_.y) + a_.x: c_ = not c_
    return c_
sal = ofs(IC_HALL, -1.6); avl_g = ofs(IC_AVLU, 3.0); aday = []
for sp_ in (4.67, 4.2, 3.8, 3.4):
    aday = [Vector((33.5 + sp_ * a_, -13.0 + sp_ * b_)) for a_ in range(30) for b_ in range(20)]
    aday = [q for q in aday if icinde(sal, q) and not icinde(avl_g, q)]
    if len(aday) >= 27: break
sec = [aday[int(q * len(aday) / 27)] for q in range(27)] if len(aday) > 27 else aday
for q in sec: ga.prism(A.rect(q, 1.0, 1.0), 0.0, H_TAV + 0.05, M["moloz"], M["moloz"])              # E: toplam 45 ayak = 18 revak + 27 iç mekân
IC_AYAK = (len(piers), len(sec))
ga_obj = ga.obj()
bpy.ops.object.select_all(action='DESELECT'); ic_obj.select_set(True); ga_obj.select_set(True)
bpy.context.view_layer.objects.active = ic_obj; bpy.ops.object.join(); ic_obj.name = "Ic_Koza"
# avlu ortasında 12 kenarlı beyaz mermer havuz (Street View 04): iki basamaklı kaide Ø 4,6, havuz Ø 3,2, yükseklik 0,7 (ölçüler T)
HV = Vector((46.5, 7.0)); gh2 = A.G("_ic_havuz"); gon = lambda R_: A.circle(HV, R_, 12, math.pi / 12)
gh2.prism(gon(2.3), 0.0, 0.12, M["mermer"], M["mermer"]); gh2.prism(gon(2.0), 0.12, 0.26, M["mermer"], M["mermer"])
ring(gh2, gon(1.6), gon(1.4), 0.26, 0.72, 0.72, M["mermer"], M["mermer"], M["mermer"]); gh2.prism(gon(1.38), 0.26, 0.45, M["mermer"], M["mermer"])
gh2.lathe(HV, [(0.12, 0.45), (0.18, 0.52), (0.1, 0.62), (0, 0.68)], 8, [M["mermer"]] * 3)
hv_obj = gh2.obj(); bpy.ops.object.select_all(action='DESELECT'); hv_obj.select_set(True); bpy.data.objects["Avlu_Mescit"].select_set(True)
bpy.context.view_layer.objects.active = bpy.data.objects["Avlu_Mescit"]; bpy.ops.object.join()
gt_ = A.G("_ic_agac"); agac(gt_, Vector((40.0, 15.5)), i=0); at_ = gt_.obj()                          # İç Koza avlusunda 1 büyük ağaç
bpy.ops.object.select_all(action='DESELECT'); at_.select_set(True); bpy.data.objects["Avlu_Agac"].select_set(True)
bpy.context.view_layer.objects.active = bpy.data.objects["Avlu_Agac"]; bpy.ops.object.join()

# ======================= ÇEVRE: AĞAÇ VE DÖŞEME (yalnız kaynakta olan yerlere) =======================
# Kaynak okuması: kozahan_arsiv_010 (drone; sol = güney) 18,7 px/m ölçeğiyle: güney cephe boyunca ≈ 6 büyük çınar (F);
# alan-baskanligi_pdf021_vaziyet.jpg (H, han ayak iziyle ölçekli): İç Koza'nın güneyinde 3 ağaç işareti (x ≈ 42–62, y ≈ −15…−21) → ikisi alındı (üçüncüsü kaide dışında);
# İç Koza avlusunda 1 ağaç: Street View 04 + avlu (Avlu_Agac'ta). Batı ve kuzey/portal önünde kaynakta ağaç YOK → konmadı (istek: batı 2–3, kuzey ≤ 2; kaynak göstermiyor).
# Ağaç başına ≤ 300 üçgen, boy 12–16 m, taç yaprak #7FA35B/#93B46A/#6E9450, dipte toprak çanağı #A5845F.
CEVRE_AGAC = [(-20.0, -41.0, 15.0, 0), (-12.0, -41.5, 13.5, 1), (-4.0, -41.0, 16.0, 2), (9.0, -41.2, 14.0, 0), (18.0, -41.5, 15.5, 1), (27.0, -41.0, 13.0, 2),   # güney cephe boyunca (F: drone)
              (41.0, -19.0, 14.5, 1), (50.0, -20.0, 13.0, 2)]                                                                                          # İç Koza güneyi (H: vaziyet)
def cevre_agac(i, x, y, h, v):
    g = A.G(f"Cevre_Agac_{i:02d}"); c = Vector((x, y)); r = 3.2 + 0.1 * (v % 3)
    g.prism(A.circle(c, 1.5, 8), 0.0, 0.05, M["toprak"], M["toprak"])                                      # toprak çanağı
    g.prism(A.circle(c, 0.45, 6), 0.0, h * 0.5, M["govde"], M["govde"])
    ton = (M["yaprak1"], M["yaprak2"], M["yaprak3"])
    prof = [(0, h * 0.46), (r * 0.62, h * 0.50), (r * 0.98, h * 0.64), (r, h * 0.78), (r * 0.85, h * 0.92), (r * 0.45, h * 0.99), (0, h * 1.02)]
    g.lathe(c, prof, 7, [ton[v % 3]] * (len(prof) - 1))
    c2 = c + Vector((0.9, -0.6)) * (1 if v % 2 == 0 else -1); zc = h * 0.78
    g.lathe(c2, [(0, zc + 0.5), (r * 0.5, zc + 0.9), (r * 0.62, zc + 1.9), (r * 0.3, zc + 2.7), (0, zc + 2.9)], 6, [ton[(v + 1) % 3]] * 4)
    return g.obj()
for _i, (_x, _y, _h, _v) in enumerate(CEVRE_AGAC, 1): cevre_agac(_i, _x, _y, _h, _v)
# döşeme: bina çevresinde 8 m genişliğinde Arnavut kaldırımı sokak şeridi (kalan alan ana zemin #C4BDAF)
gd = A.G("Cevre_Doseme"); DS = 8.0
han_poly = [Vector((-OX - DS, -OY - DS)), Vector((OX + DS, -OY - DS)), Vector((OX + DS, OY + P["portal_cikinti"] + P["D_portal_on_cikinti"] + DS)), Vector((-OX - DS, OY + P["portal_cikinti"] + P["D_portal_on_cikinti"] + DS))]
gd.prism(han_poly, -0.002, 0.020, M["arnavut"], M["arnavut"])
gd.prism(ofs(A.ccw(IC_OUT), DS), -0.002, 0.021, M["arnavut"], M["arnavut"])                               # İç Koza çevresi (1 mm daha yüksek: ortak düzlem yok)
gd.obj()

# ======================= FİGÜRLER (kullanıcı onayından sonra) =======================
if FIGUR:
    exec(compile(open(os.path.join(HERE, "figur_yerlesim_v11.py"), encoding="utf-8").read(), "figur_yerlesim_v11.py", "exec"))

# ======================= UV, kontrol, AO, dışa aktarım =======================
KAROLAR = [(M["duvar"], KARO_W, KARO_H, 0.0, False), (M["kesme"], KARO_W, KARO_H, 0.0, False),
           (M["korkuluk"], 0.6, P["D_korkuluk_h"], P["alt_h"], True), (M["avlu"], 0.4, 0.4, 0.0, False),
           (M["moloz"], 1.2, 1.2, 0.0, False), (M["disli"], 0.6, 0.5, 4.0, False), (M["arnavut"], 1.2, 1.2, 0.0, False)]
def uv_karolar():
    for o in [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin"))]:
        me = o.data
        for mat, kw_, kh_, z0_, ust_sabit in KAROLAR:
            idx = [i for i, s in enumerate(o.material_slots) if s.material is mat]
            if not idx: continue
            uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
            for p in me.polygons:
                if p.material_index not in idx: continue
                n = p.normal
                t = Vector((-n.y, n.x, 0)).normalized() if abs(n.z) < 0.7 else None
                for li in p.loop_indices:
                    co = o.matrix_world @ me.vertices[me.loops[li].vertex_index].co
                    if t is not None: uvl.data[li].uv = ((co.x * t.x + co.y * t.y) / kw_, (co.z - z0_) / kh_)
                    elif ust_sabit:   uvl.data[li].uv = (0.5, 0.95)
                    else:             uvl.data[li].uv = (co.x / kw_, co.y / kh_)
uv_karolar()
os.makedirs(KONTROL, exist_ok=True)

def acik_hacim_say():
    """İki kapı açıklığının (iç hacim) içinde kalan yabancı yüz sayısı: Govde_Dis ve Portal (açıklığın kendi duvar/tonoz/ara perde/kapı donanımı) ve zemin dışındaki nesnelerde 0 olmalı."""
    def doguda(p):
        if not (RX - 0.1 <= p.x <= OX + 0.6) or p.z < 0.06: return False
        dy = p.y - IC_CY; r_ = GR - 0.02
        return abs(dy) < r_ if p.z <= GSP else dy * dy + (p.z - GSP) ** 2 < r_ * r_
    def kuzeyde(p):
        if not (RY - 1.1 <= p.y <= y2 + 0.6) or p.z < 0.06: return False
        if p.y > HOL_E - 0.01: w2, sp_ = kw_ / 2 - 0.02, kzs_
        else: w2, sp_ = ik_w / 2 - 0.02, ik_z
        if p.z <= sp_: return abs(p.x) < w2
        return (p.x * p.x + (p.z - sp_) ** 2 < w2 * w2) if p.y > HOL_E - 0.01 else (abs(p.x) < w2 and p.z < 4.35)
    sonuc = {"kapi_gecit": {}, "kapi_portal": {}}
    for o in bpy.data.objects:
        if o.type != "MESH" or o.name.startswith(("REF", "_", "Zemin", "Avlu_Zemin")) or o.name in ("Govde_Dis", "Portal"): continue
        for adi, f in (("kapi_gecit", doguda), ("kapi_portal", kuzeyde)):
            n_ = sum(1 for p in o.data.polygons if f(o.matrix_world @ p.center))
            if n_: sonuc[adi][o.name] = n_
    return sonuc
GRUPLAR = {"han": lambda n: not n.startswith(("Cevre_", "Avlu_Mescit", "Mescit_", "Ic_Koza", "Olcek", "Avlu_Zemin", "Avlu_Halka", "Avlu_Cim", "Avlu_Agac")),
           "cevre": lambda n: n.startswith("Cevre_"), "mescit": lambda n: n.startswith(("Avlu_Mescit", "Mescit_")), "ic_koza": lambda n: n.startswith("Ic_Koza"),
           "avlu": lambda n: n.startswith(("Avlu_Zemin", "Avlu_Halka", "Avlu_Cim", "Avlu_Agac")), "figur": lambda n: n.startswith("Olcek")}
def butce(mk):
    return {k: sum(v["ucgen"] for n, v in mk.items() if f(n)) for k, f in GRUPLAR.items()}

if HIZLI:
    mk = A.mesh_kontrol()
    print("HIZLI_BUTCE", json.dumps(butce(mk)), "TOPLAM", sum(v["ucgen"] for v in mk.values()))
    for _n in ("Ic_Koza", "Govde_Dis"):
        _bm = bmesh.new(); _bm.from_mesh(bpy.data.objects[_n].data)
        _nm = [e for e in _bm.edges if not e.is_manifold and not e.is_boundary]
        print("NM", _n, [tuple(round(c, 2) for c in (e.verts[0].co + e.verts[1].co) / 2) for e in _nm[:14]]); _bm.free()
    print("HIZLI_SORUN", json.dumps({k: v for k, v in mk.items() if v["acik_kenar"] or v["manifold_degil"]}))
    for k, v in sorted(mk.items(), key=lambda kv: -kv[1]["ucgen"])[:40]: print("  ", k, v["ucgen"])
    raise SystemExit

KONTROL_ATLA = os.environ.get("KOZA_KONTROL", "1") == "0"
rapor = {"ucgen_toplam": sum(v["ucgen"] for v in A.mesh_kontrol().values())} if KONTROL_ATLA else A.kontrol_hepsi(KONTROL, "kontrol")
mk = A.mesh_kontrol()
rapor["parcalar"] = {k: v["ucgen"] for k, v in mk.items()}
rapor["butce"] = butce(mk); rapor["cevre_agac_ucgen"] = {k: v["ucgen"] for k, v in mk.items() if k.startswith("Cevre_Agac")}
rapor["draw_call"] = sum(len(o.material_slots) for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin")))
with open(os.path.join(KONTROL, "kontrol_rapor.json"), "w", encoding="utf-8") as fh: json.dump(rapor, fh, ensure_ascii=False, indent=1)
print("RAPOR", json.dumps(rapor, ensure_ascii=False))

# ---------------- ölçü doğrulama (mesh'ten ölçülen / kurgu parametresi ayrımıyla) ----------------
def verts_of(ad):
    o = bpy.data.objects[ad]; return [o.matrix_world @ v.co for v in o.data.vertices]
vg = verts_of("Govde_Dis")
dis_olc = (max(v.x for v in vg) - min(v.x for v in vg), max(v.y for v in vg) - min(v.y for v in vg))
vr = verts_of("Avlu_Revak")
av_x = min(abs(v.x) for v in vr if abs(v.z - P["alt_h"]) < 1e-4 and abs(v.y) < AY - 1) * 2
av_y = min(abs(v.y) for v in vr if abs(v.z - P["alt_h"]) < 1e-4 and abs(v.x) < AX - 1) * 2
vm = verts_of("Avlu_Mescit"); vk = verts_of("Mescit_Kubbe")
zset = lambda vs, lo, hi: sorted({round(v.z, 2) for v in vs if lo <= v.z <= hi})
kota = {"havuz_kenari": z_hv in zset(vm, 0.7, 0.9) and z_hv, "uzenge": z_uz in zset(vm, 1.9, 2.1) and z_uz, "dosem": z_do in zset(vm, 3.4, 3.6) and z_do,
        "sacak_ve_kubbe_eteği": z_sa in zset(vm, 6.9, 7.1) and z_sa, "kubbe_tepe": round(max(v.z for v in vk if abs(v.x) < 0.01 and abs(v.y) < 0.01 and v.z < 9.7), 2)}
govde_ap_olc = min(abs(Vector(((a_.x + b_.x) / 2, (a_.y + b_.y) / 2)).length) for a_, b_ in zip(gp, gp[1:] + gp[:1]))
etek_r = max(math.hypot(v.x, v.y) for v in vk if abs(v.z - z_sa) < 1e-3)
kub_gov_r = max(math.hypot(v.x, v.y) for v in vk if abs(v.z - zg_) < 0.02 and v.z < 8)
rapor_olcu = {
    "dis_olcu_olculen_m": [round(dis_olc[0], 2), round(dis_olc[1], 2)], "dis_olcu_hedef_m": [64.0, 72.0],
    "avlu_olculen_m": [round(av_x, 2), round(av_y, 2)], "avlu_hedef_m": [38.0, 46.0],
    "kanat_m": round((dis_olc[0] - av_x) / 2, 2), "kanat_hedef_m": 13.0,
    "mescit": {"kotlar_m": kota, "ayak_cemberi_R_m": P["m_ayak_R"], "ayak_sayisi": 8, "govde_yuzden_yuze_m": round(2 * govde_ap_olc, 3),
               "kubbe_etek_cap_m": round(2 * etek_r, 2), "kubbe_govde_cap_m": round(2 * kub_gov_r, 2),
               "havuz_dis_cap_m": round(2 * P["m_havuz_R"], 2), "havuz_kenar_sayisi": 16,
               "merdiven": {"basamak": nb, "rihr_m": rih, "yatay_uzunluk_m": round(nb * run, 2), "sahanlik_m": P["m_sahanlik"], "net_genislik_m": mw,
                            "toplam_genislik_m": round(mw + 2 * kt2, 2)},
               "kapi_yuzu_yonu_derece": P["m_kapi_phi"], "kapi_yuzu": "kuzeybati", "mihrap_yuzu": "guneydogu (315 derece, penceresiz)"},
    "ic_koza": {"dis_cokgen_m": [[round(q.x, 1), round(q.y, 1)] for q in IC_OUT], "avlu_cokgen_m": [[round(q.x, 1), round(q.y, 1)] for q in IC_AVLU],
                "dis_kutu_m": [round(max(q.x for q in IC_OUT) - 32.0, 1), round(IC_Y1 - IC_Y0, 1)], "avlu_kutu_m": [round(max(q.x for q in IC_AVLU) - 32.0, 1), round(IC_AY1 - IC_AY0, 1)],
                "kuzey_kenar_han_kuzeyinin_guneyinde_m": round(OY - IC_Y1, 2), "gecit_m": gw, "revak_ayak": IC_AYAK[0], "ic_ayak": IC_AYAK[1], "toplam_ayak": sum(IC_AYAK),
                "kemer_acikligi_m": [3.5, 4.0], "kemer_tepe_m": KEMER_TEPE, "ayak_m": 1.0, "havuz_cap_m": 3.2, "havuz_kaide_cap_m": 4.6, "havuz_yukseklik_m": 0.72},
}
with open(os.path.join(KONTROL, "olcu_dogrulama.json"), "w", encoding="utf-8") as fh: json.dump(rapor_olcu, fh, ensure_ascii=False, indent=1)
rapor_olcu["acik_hacim_yabanci_yuz"] = acik_hacim_say()
with open(os.path.join(KONTROL, "olcu_dogrulama.json"), "w", encoding="utf-8") as fh: json.dump(rapor_olcu, fh, ensure_ascii=False, indent=1)
print("ACIK_HACIM", json.dumps(rapor_olcu["acik_hacim_yabanci_yuz"], ensure_ascii=False))
print("OLCU", json.dumps(rapor_olcu, ensure_ascii=False))
GENIS = {"duvar", "cati", "sacak", "avlu", "halka", "kursun", "mermer", "tas_portal", "tas_acik", "tugla", "kesme", "portal_on", "baca", "cim", "kiremit", "yaprak1", "yaprak2", "govde"}
renkler = {}
for k, n, hx, r, mt in MAT:
    rr, gg, bb = [int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    import colorsys
    h_, s_, v_ = colorsys.rgb_to_hsv(rr, gg, bb)
    renkler[n] = {"hex": hx, "hsv": [round(h_, 3), round(s_, 3), round(v_, 3)], "geniş_yüzey": k in GENIS, "V_>=_0.72": v_ >= 0.72}
with open(os.path.join(KONTROL, "renkler.json"), "w", encoding="utf-8") as fh: json.dump(renkler, fh, ensure_ascii=False, indent=1)

# ---------------- AO (taban 0,70; kubbe/alem 0,85) ve GLB ----------------
if os.environ.get("KOZA_AO", "1") == "1": A.ao_vertex(samples=32)
AO_TABAN = {"varsayilan": 0.70, "Kubbe_Avlu": 0.85, "Mescit_Kubbe": 0.85, "Mescit_Dikis": 0.85}
for o in [o for o in bpy.data.objects if o.type == "MESH" and o.data.color_attributes.get("AO")]:
    tb_ = AO_TABAN.get(o.name, AO_TABAN["varsayilan"])
    for d_ in o.data.color_attributes["AO"].data:
        c_ = tb_ + (1 - tb_) * d_.color[0]; d_.color = (c_, c_, c_, 1.0)
for k in (DOKULU if os.environ.get("KOZA_AO", "1") == "1" else {}):
    nt = M[k].node_tree; tx = nt.nodes.get("DOKU"); mul = next((n for n in nt.nodes if n.type == "MIX" and n.blend_type == 'MULTIPLY'), None)
    if tx and mul: nt.links.new(tx.outputs["Color"], mul.inputs[6])
os.makedirs(os.path.dirname(EXPORT), exist_ok=True)
YAZMA = os.environ.get("KOZA_YAZMA", "1") == "1"
rapor["glb_bayt"] = A.disa_aktar(EXPORT, draco=True) if YAZMA else 0

# ---------------- kaide (genel standart §1): elips disk, kenar pahı; yalnız sunum GLB ve render'larda ----------------
def kaide():
    """Genel standart §1 (18 Ekim 2026): yapıyı (İç Koza dahil) saran DİKDÖRTGEN kaide, her yönde 8 m pay, 1,5 m pahlı köşeler, kalınlık 0,6 m, üst kenarda 0,15 m pah."""
    xmin, xmax = -OX, max(q.x for q in IC_OUT); ymin, ymax = min(-OY, IC_Y0), max(OY + pc + P["D_portal_on_cikinti"], IC_Y1)
    pay, ch, pah = 8.0, 1.5, 0.15; x0, x1, y0, y1 = xmin - pay, xmax + pay, ymin - pay, ymax + pay
    def cevre(ins):
        a_, b_, c_, d_ = x0 + ins, x1 - ins, y0 + ins, y1 - ins
        return [Vector(p_) for p_ in ((a_ + ch, c_), (b_ - ch, c_), (b_, c_ + ch), (b_, d_ - ch), (b_ - ch, d_), (a_ + ch, d_), (a_, d_ - ch), (a_, c_ + ch))]
    gz = A.G("Zemin_Kaide"); mz = A.mat("Zemin", "#C4BDAF", 0.90); my = A.mat("Zemin_Yan", "#A39A8B", 0.90)
    ust = [gz.V(q, 0.0) for q in cevre(pah)]; ors = [gz.V(q, -pah) for q in cevre(0.0)]; alt = [gz.V(q, -0.6) for q in cevre(0.0)]; n = len(ust)
    gz.F(ust, mz)
    for k in range(n):
        j = (k + 1) % n
        gz.F([ust[j], ust[k], ors[k], ors[j]], my); gz.F([ors[j], ors[k], alt[k], alt[j]], my)
    gz.F(alt[::-1], my)
    return gz.obj()
KAIDE = kaide()
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
    if o.type == "MESH" and not o.name.startswith(("REF", "_")): o.select_set(True)
kw = dict(filepath=EXPORT_SUNUM, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
if YAZMA:
    try: bpy.ops.export_scene.gltf(export_draco_mesh_compression_enable=True, **kw)
    except Exception: bpy.ops.export_scene.gltf(**kw)
    rapor["glb_sunum_bayt"] = os.path.getsize(EXPORT_SUNUM)
    with open(os.path.join(KONTROL, "kontrol_rapor.json"), "w", encoding="utf-8") as fh: json.dump(rapor, fh, ensure_ascii=False, indent=1)
print("GLB", EXPORT, rapor["glb_bayt"], EXPORT_SUNUM, rapor.get("glb_sunum_bayt"))

# ---------------- render: genel standart §2 (Cycles 24, Standard, güneş 1,25 / 35°, kontrol render'ları saydam) ----------------
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = int(os.environ.get("KOZA_ORNEK", "24")); sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.80, 0.80, 0.80, 1); bg.inputs[1].default_value = 1.0
sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = 1.25; sun.data.angle = math.radians(35); sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
def kamera(ad, loc, hedef, orto=None, lens=35, clip0=0.1):
    cd = bpy.data.cameras.get(ad) or bpy.data.cameras.new(ad)
    if orto: cd.type = 'ORTHO'; cd.ortho_scale = orto
    else: cd.type = 'PERSP'; cd.lens = lens
    cd.clip_start = clip0; cd.clip_end = 2000
    cam = bpy.data.objects.get(ad) or bpy.data.objects.new(ad, cd)
    if cam.name not in bpy.context.scene.collection.objects: bpy.context.scene.collection.objects.link(cam)
    cam.location = Vector(loc); cam.rotation_euler = (Vector(hedef) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    return cam
def render(cam, ad, res=(1400, 900), saydam=True, kaide_goster=True):
    sc.camera = cam; sc.render.resolution_x, sc.render.resolution_y = res; sc.render.film_transparent = saydam
    KAIDE.hide_render = not kaide_goster
    sc.render.filepath = os.path.join(KONTROL, f"{ad}.png"); bpy.ops.render.render(write_still=True)
def kamera_iso(ad, hedef, d, el_d, az_d, orto, **kw):
    el, az = math.radians(el_d), math.radians(az_d); t = Vector(hedef)
    return kamera(ad, t + Vector((d * math.cos(el) * math.cos(az), d * math.cos(el) * math.sin(az), d * math.sin(el))), t, orto=orto, **kw)
ORT = (28.0, 2.5, 3.0)                                              # sahne merkezi (han + İç Koza)
RENDERLER = os.environ.get("KOZA_RENDER", "havadan,avlu_genel,ic_koza,ic_koza_avlu,ic_koza_dis,gecit,kapi,merdiven_ic,kitabe,portal,havadan_dik,mescit_kesit,mescit_foto,mescit_yakin,merdiven,cati,revak").split(",")
def yalniz(adlar):
    for o in bpy.data.objects:
        if o.type == "MESH" and not o.name.startswith("_kes_"): o.hide_render = o.name not in adlar
def hepsini_ac():
    for o in bpy.data.objects:
        if o.type == "MESH": o.hide_render = o.name.startswith("_kes_")
if "havadan" in RENDERLER: render(kamera_iso("CAM_Havadan", ORT, 280, 32, 45, 205), "havadan", (1800, 1600))
if "havadan_dik" in RENDERLER: render(kamera("CAM_Dik", (22, 2.4, 300), (22, 2.4, 0), orto=150), "havadan_dik_ham", (1600, 1300), kaide_goster=False)
if "avlu_genel" in RENDERLER: render(kamera("CAM_Avlu_Genel", (-14, -14, 20), (6, 10, 3), lens=24), "avlu_genel", (1600, 1000))
if "ic_koza_avlu" in RENDERLER: render(kamera("CAM_Ic_Avlu", (41.0, -3.0, 2.0), (52.0, 15.0, 2.0), lens=22), "ic_koza_avlu", (1600, 1100), kaide_goster=False)
if "ic_koza_dis" in RENDERLER: render(kamera("CAM_Ic_Dis", (52.0, -27.0, 2.2), (68.0, 0.0, 2.6), lens=26), "ic_koza_dis", (1600, 1100), kaide_goster=False)
KAPI_KAM = {"kapi_gecit_dis": ((40.0, IC_CY, 1.8), (32.0, IC_CY, 2.6), 24), "kapi_gecit_ic": ((14.0, IC_CY, 1.8), (24.0, IC_CY, 2.4), 24), "kapi_gecit_orta": ((31.0, IC_CY, 1.6), (24.0, IC_CY, 2.4), 20),
            "kapi_portal_dis": ((0.0, y2 + 9.0, 2.2), (0.0, OY, 3.8), 28), "kapi_portal_ic": ((0.0, AY - 6.0, 1.8), (0.0, RY, 2.8), 24), "kapi_portal_orta": ((0.0, OY + 3.0, 1.7), (0.0, HOL_E, 3.4), 22)}
if "kapi" in RENDERLER:
    for _ad, (_l, _t, _ln) in KAPI_KAM.items(): render(kamera("CAM_" + _ad, _l, _t, lens=_ln), _ad, (1400, 1000), kaide_goster=False)
if "gecit" in RENDERLER: render(kamera("CAM_Gecit", (43.0, 3.5, 1.7), (32.0, 8.4, 2.7), lens=22), "gecit_ic_koza", (1400, 1100), kaide_goster=False)
if "merdiven_ic" in RENDERLER:
    for _o in bpy.data.objects:
        if _o.name.startswith("Olcek_Insan_07"): _o.hide_render = True
    render(kamera("CAM_Merdiven_Ic", (dv.x * 6.6 + tv.x * -0.5, dv.y * 6.6 + tv.y * -0.5, 2.9), (dv.x * 5.5 + tv.x * 1.1, dv.y * 5.5 + tv.y * 1.1, 3.3), lens=24), "merdiven_ic", (1400, 1000), kaide_goster=False)
    for _o in bpy.data.objects:
        if _o.name.startswith("Olcek_Insan_07"): _o.hide_render = False
if "kitabe" in RENDERLER: render(kamera("CAM_Kitabe", (-math.sqrt(0.5) * (ap + 3.0), math.sqrt(0.5) * (ap + 3.0), 4.9), (-math.sqrt(0.5) * ap, math.sqrt(0.5) * ap, 5.6), lens=35), "kitabe_yakin", (1000, 1500), kaide_goster=False)
if "ic_koza" in RENDERLER: render(kamera("CAM_Ic_Koza", (132, -42, 42), (62, 8, 3), lens=30), "ic_koza", (1600, 1000))
if "portal" in RENDERLER: render(kamera("CAM_Portal", (6, OY + 26, 7), (0, OY + 3.5, 5.5), lens=40), "portal", (1400, 1000))
if "mescit_kesit" in RENDERLER:
    # A–A kesiti: mescit y = 0 düzleminden kesilir (bisect), kesit yüzü dolgulu; yalnız kesilmiş kopyalar çizilir
    mk_ = bpy.data.materials.get("_Kesit") or A.mat("_Kesit", "#5A5148", 0.9)
    for ad in ("Avlu_Mescit", "Mescit_Kubbe", "Mescit_Dikis"):
        src = bpy.data.objects[ad]; me2 = src.data.copy(); ob = bpy.data.objects.new("_kes_" + ad, me2); sc.collection.objects.link(ob)
        bm = bmesh.new(); bm.from_mesh(me2)
        r_ = bmesh.ops.bisect_plane(bm, geom=bm.verts[:] + bm.edges[:] + bm.faces[:], plane_co=(0, 0, 0), plane_no=(0, 1, 0), clear_inner=True)
        bm.to_mesh(me2); bm.free()
    for o in bpy.data.objects:
        if o.type == "MESH": o.hide_render = not o.name.startswith("_kes_")
    render(kamera("CAM_Mescit_Kesit", (0, -60, 5.0), (0, 0, 5.0), orto=14), "mescit_kesit_ham", (1500, 1100), kaide_goster=False)
    hepsini_ac()
if "mescit_foto" in RENDERLER: render(kamera("CAM_Mescit_Foto", (-15.5, -3.0, 6.5), (0.0, 0.5, 4.2), lens=32), "mescit_foto_ham", (1400, 1100))
if "mescit_yakin" in RENDERLER: render(kamera("CAM_Mescit_Yakin", (9, -12, 7), (0, 0, 4.5), lens=40), "mescit_yakin", (1400, 1000))
if "merdiven" in RENDERLER: render(kamera("CAM_Merdiven", (-14, 12, 5), (-5.5, 5.0, 2.2), lens=35), "mescit_merdiven", (1400, 1000))
if "cati" in RENDERLER: render(kamera("CAM_Cati", (-24, OY + 14, 30), (2, OY - 12, 8), lens=30), "cati", (1400, 1000))
if "revak" in RENDERLER: render(kamera("CAM_Revak", (-6, -12, 2.5), (2, AY, 4.5), lens=24), "avlu_revak", (1400, 1000))
for o in [o for o in bpy.data.objects if o.name.startswith("_kes_")]: bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.file.pack_all()
if YAZMA:
    os.makedirs(os.path.dirname(BLEND), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("BITTI", BLEND)
