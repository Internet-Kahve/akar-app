# AKAR · Orhan Bey Külliyesi · Emir Hanı · v03 (SONNET_REVIZYON_PLANI.md; build_emir_v02.py'den türetildi, v02'ye dokunulmadı)
# v03 = 46 × 50 dış ölçü (E Vakıf 1983), kenar başına 7 göz iki katlı revak (W bildiri), sokak +4,0 (dışarıdan tek kat; avlu 0),
#       güney revakı yarım daire alt kemer, kuzey asıl giriş + güney üst kat girişi, 38 baca, açık sekizgen şadırvan, genel sahne standardı.
# Yöntemler Koza Han v12 (koza-han/3d/build/build_v12.py) ve Ulu Cami v24'ten (ulu-cami/3d/build/v23_*.py, render_v24.py) alındı; yeni yöntem yok.
# Çalıştırma:  blender -b --python docs/documents-context/eserler/emir-han/3d/build/build_emir_v03.py
#   EMIR_ASAMA = A (§1–§2: kütle + arazi) | B (+ §3–§4) | C (+ §5–§6) | SON (C + kontrol seti)  — onay adımları plan §8.3
#   EMIR_RENDER = virgüllü render listesi (boş = aşamanın varsayılanı); EMIR_ORNEK = Cycles örnek sayısı (24)
#   EMIR_HIZLI=1 → yalnız mesh kontrol ve bütçe (render/AO/GLB yok)
# Girdi : build/doku/*.png (doku_uret_v03.py + kopya karolar), eserler/_kutuphane/akar3d.py
# Çıktı : blend/emir-hani_v03.blend, export/emir-hani_v03.glb (zeminsiz, figürler dahil), export/emir-hani_v03_sunum.glb (daire kaide + sokak, orijin = kaide merkezi),
#         kontrol/emir_v03/ (render, kontrol_rapor.json, olcu_dogrulama.json, renkler.json); geçici: kontrol/_tmp/
# Eksenler: +X doğu, +Y kuzey, +Z yukarı. Orijin = avlu ortası; z = 0 avlu zemini; sokak ve kaide üstü +4,0.
# Kaynak harfleri: P rölöve, E envanter, W makale/bildiri, O OSM, F fotoğraf, H hesap, T tahmin, K kullanıcı kararı.
import sys, os, math, json, colorsys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 3, "_kutuphane")))
import bpy, bmesh
import akar3d as A
from mathutils import Vector

SURUM = "emir_v03"
AD = "emir-hani"
URETIM = os.path.dirname(HERE)
KONTROL = os.path.join(URETIM, "kontrol", SURUM)
TMP = os.path.join(URETIM, "kontrol", "_tmp")
BLEND = os.path.join(URETIM, "blend", f"{AD}_v03.blend")
EXPORT = os.path.join(URETIM, "export", f"{AD}_v03.glb")
EXPORT_SUNUM = os.path.join(URETIM, "export", f"{AD}_v03_sunum.glb")
DOKU = os.path.join(HERE, "doku")
ASAMA = os.environ.get("EMIR_ASAMA", "A").upper()
SEVIYE = {"A": 1, "B": 2, "C": 3, "SON": 4}[ASAMA]
HIZLI = os.environ.get("EMIR_HIZLI", "0") == "1"
ORNEK = int(os.environ.get("EMIR_ORNEK", "24"))

P = {
    # ================= §1 KÜTLE =================
    "dis_dx": 46.0,          # E  Vakıf 1983 PDF 176 «dış ölçüleri, 46,00X50,00 metre» (D–B); E cilt-1 «≈ 45 × 45» yuvarlak değer (notlar §3)
    "dis_dy": 50.0,          # E  aynı (K–G); O K–G 50,9 ✓
    "avlu": 25.5,            # H  √650 m² (E PDF 108); W bildiri «kare planlı avlu»
    "kanat_x": 10.25,        # H  (46 − 25,5) / 2  doğu ve batı kanatları
    "kanat_y": 12.25,        # H  (50 − 25,5) / 2  kuzey ve güney kanatları
    "alt_h": 4.5,            # T  alt kat (kat silmesi +4,5); F avlu fotoğrafları
    "ust_h": 5.0,            # T  üst kat → saçak 9,5
    "sacak": 9.5,            # T  (v01 VARSAYIM'ı korunur)
    "mahya": 11.0,           # T  kurşun kırma çatı mahyası, kanat ortasında (F vakif_1983_pdf176)
    # ================= §2 ARAZİ =================
    "sokak": 4.0,            # T/H  20 basamak × 0,20 (W bildiri «yirmişer basamaklı merdiven»); F dış fotoğraflar: sokaktan tek kat
    "kaide_pay": 3.0,        # K  standart §1 (19 Ekim): en küçük çember + 3 m
    "kaide_alt": -0.6,       # T  kaide altı: yan yüz +4,0'dan −0,6'ya inen 4,6 m'lik duvar okunur (standart kalınlık 0,6 avlu kotunun altında)
    "kaide_pah": 0.15,       # K  standart §1
    "kaide_iceri": 1.5,      # K  döşeme ve tarhlar kaide kenarından 1,5 m içeride kesilir
    "kaide_gomme": 0.002,    # T  kaide deliği han ayak izinden 2 mm içeride (Koza v12 dersi: 3 cm gömülme AO'da siyah çizgi bırakır)
    "sokak_band": 6.0,       # T  hanın çevresinde döşeme şeridi (Koza v12 Cevre_Doseme yöntemi; F 1578509455/543 taş döşeme)
}
OX, OY = P["dis_dx"] / 2, P["dis_dy"] / 2
AX = AY = P["avlu"] / 2
assert abs((OX - AX) - P["kanat_x"]) < 1e-9 and abs((OY - AY) - P["kanat_y"]) < 1e-9
assert abs(P["alt_h"] + P["ust_h"] - P["sacak"]) < 1e-9
MX, MY = (OX + AX) / 2, (OY + AY) / 2                                # mahya halkası (kanat ortası)
ZS = P["sokak"]

# ---------------- yardımcılar (Koza Han v12'den, değiştirilmeden) ----------------
def R4(hx, hy, cx=0.0, cy=0.0):
    return [Vector((cx - hx, cy - hy)), Vector((cx + hx, cy - hy)), Vector((cx + hx, cy + hy)), Vector((cx - hx, cy + hy))]

def panel(g, O, T, N, poly, o0, o1, m):
    """Düşey düzlemde (O + T·s, z) kapalı çokgen; N yönünde o0→o1 kalınlık. Kapalı hacim."""
    Pt = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
    a = [g.bm.verts.new(Pt(s, z, o0)) for s, z in poly]; b = [g.bm.verts.new(Pt(s, z, o1)) for s, z in poly]
    g.F(a[::-1], m); g.F(b, m)
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g.F([a[i], a[j], b[j], b[i]], m)

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

def kes(hedef, kesici_, islem='DIFFERENCE'):
    md = hedef.modifiers.new("kes", 'BOOLEAN'); md.operation = islem; md.object = kesici_; md.solver = 'EXACT'
    try: md.material_mode = 'TRANSFER'
    except Exception: pass
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = hedef; hedef.select_set(True)
    bpy.ops.object.modifier_apply(modifier="kes")

# ---------------- sahne ve palet (standart §1 ve §3; plan §6) ----------------
A.temizle()
for m in list(bpy.data.materials):
    if m.users == 0: bpy.data.materials.remove(m)
# (anahtar, malzeme adı, hex, rough, metal) — geniş yüzeylerde V ≥ 0,72 (renkler.json'da denetlenir); sapmalar SAPMA sözlüğünde gerekçeli
P.update({
    # ================= §3 AVLU REVAKLARI =================
    "goz": 7,                # W  bildiri PDF 6 «avluya bakan cephesinde yedişer revak»; F vakif_1983_pdf176 → adım 25,5 / 7 = 3,643 (H)
    "ayak_w": 1.2,           # E/T «geniş ayaklar» (E PDF 108), plan §3 ≈ 1,2 × 1,2
    "ayak_d": 1.2,           # T  ayak derinliği (avlu çizgisinden içeri)
    "revak_d": 3.0,          # T  revak yürüme genişliği (F Kqg5B5q, emirhan-bursa-ulucami3) → oda duvarı avludan 4,2 m içeride
    "alt_bant": 0.9,         # T  alt kat kemer kuşağı (ayak tepesi 3,6 → döşeme 4,5)
    "ust_tepe": 8.5,         # T  üst kat ayak/kuşak tepesi; 8,5–9,1 almaşık kuşak, 9,1–9,5 kirpi saçak
    "kemer_k_alt": 0.55,     # T  sivri kemer yarıçap/açıklık (Koza v12 D_revak_kemer_k)
    "kemer_k_ust": 0.60,     # T  Koza v12 D_ust_kemer_k; F Emir-Hani-2/4: üst kat yüksek sivri kemer
    "kemer_bant": 0.35,      # F  kemerleri çeviren tuğla bant (Emir-Hani-4/5, 1578509890)
    "bolme_ofs": 0.6,        # E  «alt katta cam ve ahşap bölmelerle kapatılan revaklar» (PDF 108): bölme avlu yüzünden 0,6 m geride (T)
    "korkuluk_h": 1.0,       # F  beyaz demir korkuluk (Emir-Hani-2/4/5)
    "kirpi": (9.1, 9.5, 0.12),  # E  iki sıra kirpi saçak (PDF 108; Vakıf PDF 176): kot aralığı ve taşma (T)
    "kose_kubbe": (7.9, 1.4),   # E  «birinci kat revaklarının dört köşesindeki kubbeler» (PDF 108): küre merkezi kotu ve yarıçapı (T) → tepe 9,3
    "cati_tasma": 0.30,      # F  Emir-Hani-1: kısa saçak taşması (T)
    # ================= §4 GİRİŞLER, PENCERELER, BACALAR =================
    "oda_ns": 8, "oda_do": 11,  # E 38 oda (PDF 108–109) = K 8 + G 8 + D 11 + B 11 (T dağılım); K ve G ortasında giriş
    "giris_aralik": 6.8,     # F  685999…/Emir-Hani-1: giriş eksenindeki iki pencere arası ≈ 11,7 m → ortada 6,8 m'lik giriş bölmesi (H)
    "pen": (0.9, 4.6, 1.3),  # F  1578509543/455: pencere en, alt kotu (plan §4 ≈ +4,6), yükseklik (T)
    "pen_alinlik": (0.15, 0.18, 0.72),  # Koza v12 alınlık: iç pay, tuğla bant, sivri oran
    "baca": (0.6, 1.2, 2.6),  # E/F plan §4: 0,6 × 0,6 tuğla gövde, çatıdan 1,2; dış duvardan 2,6 m içeride (T)
    "giris_esik": 3.6,       # F  Emir-Hani-1/685999…: sokaktan kapıya inen rampa → eşik +3,6 (T)
    "giris_w": 2.6,          # T  plan §4 açıklık ≈ 2,6
    "giris_uzengi": 5.4,     # T  iç taş kemer üzengisi (yarım daire, F 1578509484: kesme taş kemer) → açıklık tepesi 6,7
    "giris_tugla": (3.4, 5.6, 0.45),  # F  dış tuğla sivri kemer iç açıklığı, üzengi, bant → tepe ≈ +7,9 (plan ≈ +7,6)
    "giris_blok": (8.6, 0.35, 10.1),  # F  685999…/7112FE8: girişin yükseltilmiş cephe bloğu en, çıkıntı, tepe (T)
    "peyke": (0.8, 2.5, 0.5),         # E  «kantarların yerleştirilmesi için inşa edilen peykeler, hanın girişinde» (PDF 108); plan §4 ölçüleri
    "rampa_L": 4.0,          # F  Emir-Hani-1: kapı önüne inen rampa boyu (T)
    "guney_giris": (2.2, 2.4, 0.35),  # W  «üst katta kesme taştan basık kemerli» (bildiri PDF 6): en, üzengi yüksekliği, basıklık (T)
})
RX = AX + P["ayak_d"] + P["revak_d"]; RY = AY + P["ayak_d"] + P["revak_d"]          # oda duvarı (revak arka yüzü)
MAT = [
    ("dis", "Duvar_Moloz", "#C8B49A", 0.70, 0.0),        # plan §6: moloz taş, ortalama ≈ #C8B49A (doku duvar_emir.png)
    ("dis_alt", "Duvar_Sokak_Alti", "#A39A8B", 0.90, 0.0),  # T: +4,0 altı (sunumda kaidenin içinde; zeminsiz GLB'de düz kaide yan rengi)
    ("almasik", "Duvar_Almasik", "#CFA986", 0.70, 0.0),   # standart §3 almaşık düz renk (doku almasik_emir.png, 2 tuğla + 1 küfeki)
    ("kursun", "Cati_Kursun", "#AEB6BC", 0.45, 0.20),     # K «görsellere göre uyarla» → Ulu Cami v24 Cati tonu (SAPMA)
    ("avlu", "Avlu_Tas", "#B3A590", 0.85, 0.0),          # standart §1 avlu/döşeme (doku parke.png, derz #A69A86)
    ("sokak", "Sokak_Tas", "#B3A590", 0.85, 0.0),        # standart §1 döşeme (doku parke.png)
    ("tugla", "Tugla", "#B06A4A", 0.70, 0.0),            # K «görsellere göre uyarla» (SAPMA)
    ("ayak", "Revak_Ayak", "#D2B693", 0.70, 0.0),        # kesme taş + tuğla hatıl (doku ayak_emir.png; E Vakıf PDF 176)
    ("kesme", "Kesme_Tas", "#D3BE98", 0.70, 0.0),        # Ulu Cami kesme taş; güney revak alt ayakları (E PDF 108), giriş kemerleri
    ("siva", "Siva_Tonoz", "#E8DFCB", 0.80, 0.0),        # plan §3 tonoz içleri açık sıva
    ("kirpi", "Kirpi_Sacak", "#B06A4A", 0.70, 0.0),      # doku kirpi_emir.png
    ("baca", "Baca_Tugla", "#B06A4A", 0.70, 0.0),        # doku baca_emir.png
    ("kapi", "Kapi_Ahsap", "#7A5134", 0.75, 0.0),        # standart §3 ahşap kapı
    ("cam", "Pencere_Cam", "#3E4A55", 0.30, 0.0),        # standart §3 (saf siyah yasak)
    ("pencere", "Pencere_Izgara", "#3E4A55", 0.30, 0.0), # doku pencere_v04.png (Koza: söve + cam + parmaklık)
    ("korkuluk", "Korkuluk_Beyaz", "#EDEBE6", 0.60, 0.20),  # F beyaz boyalı demir (SAPMA: plan #36413F); alpha kesme
]
SAPMA = {"Cati_Kursun": "Plan §6 #C3C9CD → #AEB6BC: kullanıcı 19 Ekim «görsellere göre uyarla»; fotoğraflarda kurşun koyu gri (Emir-Hani-1, 7112FE8), Ulu Cami v24 Cati ile aynı ton (yan yana uyum).",
         "Tugla": "Plan §6 #C0683F → #B06A4A (açık #BF7C5C, gölge #985A3E): kullanıcı «görsellere göre uyarla»; fotoğraflarda mat kırmızı-kahve (Emir-Hani-1/4, 685999); Ulu Cami minare #986B4D (V 0,60) ile plan arası. V 0,69 < 0,72: tuğla geniş yüzey değil (kemer bandı, saçak, baca).",
         "Kirpi_Sacak": "Tugla ile aynı gerekçe.", "Baca_Tugla": "Tugla ile aynı gerekçe.",
         "Korkuluk_Beyaz": "Plan §3 demir #36413F → #EDEBE6: bütün avlu fotoğraflarında korkuluk beyaz boyalı (Emir-Hani-2/4/5, 1578509890, 6141e917); kullanıcı «görsellere göre uyarla»."}
M = {k: A.mat(n, hx, r, mt) for k, n, hx, r, mt in MAT}
def doku_bagla(m, dosya):
    nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tx = nt.nodes.new("ShaderNodeTexImage"); tx.image = bpy.data.images.load(os.path.join(DOKU, dosya), check_existing=True)
    tx.name = "DOKU"; nt.links.new(tx.outputs["Color"], bsdf.inputs["Base Color"])
DOKULU = {"dis": "duvar_emir.png", "almasik": "almasik_emir.png", "avlu": "parke.png", "sokak": "parke.png", "ayak": "ayak_emir.png",
          "kirpi": "kirpi_emir.png", "baca": "baca_emir.png", "pencere": "pencere_v04.png", "korkuluk": "korkuluk_beyaz_alpha.png"}
for k, f in DOKULU.items(): doku_bagla(M[k], f)
# korkuluk: delikler gerçek boşluk (Koza v12 merdiven korkuluğu alpha kesme ayarı, aynen)
_mk = M["korkuluk"]; _nt = _mk.node_tree; _bs = next(n for n in _nt.nodes if n.type == "BSDF_PRINCIPLED")
_nt.links.new(_nt.nodes["DOKU"].outputs["Alpha"], _bs.inputs["Alpha"])
for _a, _v in (("blend_method", "CLIP"), ("alpha_threshold", 0.5), ("shadow_method", "CLIP"), ("surface_render_method", "DITHERED")):
    try: setattr(_mk, _a, _v)
    except Exception: pass
_mk.use_backface_culling = False
# karo ölçüleri (u genişlik, v yükseklik, z0): Koza v12 uv_karolar yöntemi. pencere/baca/korkuluk UV'si parça kurulurken yazılır.
KAROLAR = {"dis": (2.0, 2.0, ZS), "almasik": (1.2, 0.71, 0.0), "avlu": (0.4, 0.4, 0.0), "sokak": (0.8, 0.8, 0.0), "ayak": (1.2, 1.2, 0.0),
           "kirpi": (0.4, 0.4, P["kirpi"][0])}
ELLE_UV = {"pencere", "baca", "korkuluk"}

# ---------------- Koza v12 kemer yardımcıları (değiştirilmeden) ----------------
def kemer(w, zs, sivri=True, n=6, kk=None):
    """Kemer içi noktaları, sol üzengiden sağ üzengiye. sivri: iki merkezli; değilse yarım daire. kk: yarıçap / açıklık."""
    if not sivri:
        return [(-(w / 2) * math.cos(math.pi * k / n), zs + (w / 2) * math.sin(math.pi * k / n)) for k in range(n + 1)]
    R = max(kk or P["kemer_k_alt"], 0.51) * w
    cx = -w / 2 + R; ta = math.acos((0 - cx) / R)
    sol = [(cx + R * math.cos(math.pi - (math.pi - ta) * k / n), zs + R * math.sin(math.pi - (math.pi - ta) * k / n)) for k in range(n + 1)]
    return sol + [(-s, z) for s, z in sol[-2::-1]]
def kemer_yuksek(w, sivri=True, kk=None):
    if not sivri: return w / 2
    R = max(kk or P["kemer_k_alt"], 0.51) * w; cx = -w / 2 + R
    return math.sqrt(R * R - cx * cx)
def kemer_alinlik(w, zs, ztop, sivri=True, e=0.002, n=6, kk=None):
    """Açıklığın üstündeki dolu kısım (kemer köşeliği): dikdörtgen eksi kemer. e: ayağa gömülme payı (Koza v12: 2 mm)."""
    return [(-w / 2 - e, ztop), (-w / 2 - e, zs)] + kemer(w, zs, sivri, n=n, kk=kk) + [(w / 2 + e, zs), (w / 2 + e, ztop)]
def kemer_halka(w, zs, b, sivri=True, n=6, kk=None):
    """Kemeri çeviren bant (Koza v12 ust_pencere alınlık yöntemi): dış kemer + ters iç kemer, eş merkezli."""
    if not sivri: return kemer(w + 2 * b, zs, False, n) + kemer(w, zs, False, n)[::-1]
    kk = kk or P["kemer_k_alt"]
    return kemer(w + 2 * b, zs, True, n, (kk * w + b) / (w + 2 * b)) + kemer(w, zs, True, n, kk)[::-1]
def ring(g, outer, inner, z0, z1o, z1i, m_side, m_top, m_in=None):
    """Delikli kapalı prizma (halka). outer/inner aynı köşe sayısında, ccw. (Koza v12)"""
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
def uv_panel(g, O, T, N, poly, o0, o1, m_on, m_yan, u0, uw, z0, zh, yan_uv=(0.5, 0.97)):
    """Koza v12 pencere_doku/korkuluk yöntemi: ön ve arka kapak dokulu (u = (s − u0)/uw, v = (z − z0)/zh), yanlar sabit UV."""
    uvl = g.bm.loops.layers.uv.verify()
    Pt = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
    a = [g.bm.verts.new(Pt(s, z, o0)) for s, z in poly]; b = [g.bm.verts.new(Pt(s, z, o1)) for s, z in poly]
    uv = {v: ((s - u0) / uw, (z - z0) / zh) for (s, z), v in list(zip(poly, a)) + list(zip(poly, b))}
    for f in (g.F(a[::-1], m_on), g.F(b, m_on)):
        if f:
            for l in f.loops: l[uvl].uv = uv[l.vert]
    for i in range(len(poly)):
        j = (i + 1) % len(poly); f = g.F([a[i], a[j], b[j], b[i]], m_yan)
        if f and m_yan is m_on:
            for l in f.loops: l[uvl].uv = yan_uv
def pencere_doku(g, O, T, N, w, z0, h, d=0.06):
    """Koza v12: dokulu pencere levhası (söve + cam + parmaklık tek karoda), duvardan DECAL_OFF önde, kapalı."""
    poly = [(-w / 2, z0), (w / 2, z0), (w / 2, z0 + h), (-w / 2, z0 + h)]
    uv_panel(g, O, T, N, poly, A.DECAL_OFF, A.DECAL_OFF + d, M["pencere"], M["pencere"], -w / 2, w, z0, h, yan_uv=(0.04, 0.5))   # yanlar sövenin açık taşı (draw call)
def yuzler(h_x, h_y, ice):
    """Dikdörtgenin 4 yüzü: (O, T, N, ad); ice=True → N avluya bakar."""
    out = []
    for nx, ny, ad in ((0, 1, "K"), (0, -1, "G"), (1, 0, "D"), (-1, 0, "B")):
        n = Vector((nx, ny)); O = Vector((nx * h_x, ny * h_y)); T = Vector((-ny, nx)) if ny else Vector((-ny, nx))
        out.append((O, T, -n if ice else n, ad))
    return out
def cati_z(x, y):
    """Dış çatı yüzü kotu (kırma çatı, mahya halkası MX/MY): kenardan mahyaya doğrusal."""
    t = min((OX - abs(x)) / (OX - MX), (OY - abs(y)) / (OY - MY))
    return P["sacak"] + (P["mahya"] - P["sacak"]) * max(0.0, min(1.0, t))

if SEVIYE == 1:
    # ======================= §1 KÜTLE (onay A görünümü) =======================
    g = A.G("Emir_Hani")
    dis, ic, mah = R4(OX, OY), R4(AX, AY), R4(MX, MY)
    ob = [g.V(q, 0.0) for q in dis]; os_ = [g.V(q, ZS) for q in dis]; ot = [g.V(q, P["sacak"]) for q in dis]
    ib = [g.V(q, 0.0) for q in ic]; ik = [g.V(q, P["alt_h"]) for q in ic]; it = [g.V(q, P["sacak"]) for q in ic]
    rm = [g.V(q, P["mahya"]) for q in mah]
    for i in range(4):
        j = (i + 1) % 4
        g.F([ob[i], ob[j], os_[j], os_[i]], M["dis_alt"]); g.F([os_[i], os_[j], ot[j], ot[i]], M["dis"])
        g.F([ib[j], ib[i], ik[i], ik[j]], M["almasik"]); g.F([ik[j], ik[i], it[i], it[j]], M["almasik"])
        g.F([ob[j], ob[i], ib[i], ib[j]], M["dis_alt"])
        g.F([ot[i], ot[j], rm[j], rm[i]], M["kursun"]); g.F([rm[i], rm[j], it[j], it[i]], M["kursun"])
    g.obj(recalc=False)
else:
    # ======================= §1 KÜTLE (B ve sonrası): oda kanatları dış duvar → revak arka duvarı; çatı ayrı kapalı kabuk =======================
    g = A.G("Emir_Hani")
    dis, ic = R4(OX, OY), R4(RX, RY)
    ob = [g.V(q, 0.0) for q in dis]; os_ = [g.V(q, ZS) for q in dis]; ot = [g.V(q, P["sacak"]) for q in dis]
    ib = [g.V(q, 0.0) for q in ic]; ik = [g.V(q, P["alt_h"]) for q in ic]; it = [g.V(q, P["sacak"]) for q in ic]
    for i in range(4):
        j = (i + 1) % 4
        g.F([ob[i], ob[j], os_[j], os_[i]], M["dis_alt"]); g.F([os_[i], os_[j], ot[j], ot[i]], M["dis"])
        g.F([ib[j], ib[i], ik[i], ik[j]], M["almasik"]); g.F([ik[j], ik[i], it[i], it[j]], M["siva"])     # üst revak arka duvarı: beyaz sıva (F Kqg5B5q)
        g.F([ob[j], ob[i], ib[i], ib[j]], M["dis_alt"]); g.F([ot[i], ot[j], it[j], it[i]], M["kursun"])
    gov = g.obj(recalc=False)
    # çatı: kırma, kurşun; dışta ve avluda 0,30 m saçak taşması, alt yüz duvar tepesiyle aynı kotta (gömülü köşe yok → AO çizgisi yok)
    g = A.G("_cati"); ct = P["cati_tasma"]; zs_ = P["sacak"]
    co, ci, cm = R4(OX + ct, OY + ct), R4(AX - ct, AY - ct), R4(MX, MY)
    bo = [g.V(q, zs_) for q in co]; bi = [g.V(q, zs_) for q in ci]
    eo = [g.V(q, zs_ + 0.08) for q in co]; ei = [g.V(q, zs_ + 0.08) for q in ci]; rm = [g.V(q, P["mahya"]) for q in cm]
    for i in range(4):
        j = (i + 1) % 4
        g.F([bo[i], bo[j], eo[j], eo[i]], M["kursun"]); g.F([bi[j], bi[i], ei[i], ei[j]], M["kursun"])
        g.F([eo[i], eo[j], rm[j], rm[i]], M["kursun"]); g.F([rm[i], rm[j], ei[j], ei[i]], M["kursun"])
        g.F([bo[j], bo[i], bi[i], bi[j]], M["kursun"])
    cati = g.obj(recalc=False)
    bpy.ops.object.select_all(action='DESELECT'); gov.select_set(True); cati.select_set(True)
    bpy.context.view_layer.objects.active = gov; bpy.ops.object.join(); gov.name = "Emir_Hani"; gov.data.name = "Emir_Hani"

g = A.G("Han_Avlu"); _ha = (AX - 0.01) if SEVIYE == 1 else (RX - 0.002); g.prism(R4(_ha, _ha + (0 if SEVIYE == 1 else RY - RX)), 0.0, 0.03, M["avlu"], M["avlu"]); g.obj()   # B+: revak altları dahil (Koza v12 Avlu_Zemin)

if SEVIYE >= 2:
    # ======================= §3 AVLU REVAKLARI (Koza v12 Avlu_Revak kurgusu) =======================
    g = A.G("Avlu_Revaklari")
    aw, ad = P["ayak_w"], P["ayak_d"]; zA = P["alt_h"]; z_ayak = zA - P["alt_bant"]; z_d1 = P["ust_tepe"]; zH = P["sacak"]
    cx_list, xs = bay_centers(P["goz"], AX); cy_list, ys = bay_centers(P["goz"], AY)
    pier_rects = []                                                     # (merkez, en x, en y, güney mü)
    for x in xs[1:-1]:
        for s in (-1, 1): pier_rects.append((Vector((x, s * (AY + ad / 2))), aw, ad, s == -1))
    for y in ys[1:-1]:
        for s in (-1, 1): pier_rects.append((Vector((s * (AX + ad / 2), y)), ad, aw, False))
    KOSE = []                                                           # köşe ayakları: L biçimi (iki yöndeki yarım ayak + köşe karesi), avluya taşmaz
    for sx in (-1, 1):
        for sy in (-1, 1):
            h_ = aw / 2; L = [(AX - h_, AY), (AX, AY), (AX, AY - h_), (AX + ad, AY - h_), (AX + ad, AY + ad), (AX - h_, AY + ad)]
            KOSE.append(([Vector((sx * x_, sy * y_)) for x_, y_ in L], sy == -1))
    for c, wx, wy, guney in pier_rects:                                 # alt kat ayakları: güneyde muntazam kesme taş (E PDF 108), diğerleri taş + tuğla hatıl
        g.prism(A.rect(c, wx, wy), 0.03, z_ayak, M["kesme"] if guney else M["ayak"], M["ayak"])   # avlu döşemesi üstünden (gömülme yok)
    for poly_, guney in KOSE:
        g.prism(A.ccw(poly_), 0.03, z_ayak, M["kesme"] if guney else M["ayak"], M["ayak"])
    ring(g, R4(RX, RY), R4(AX, AY), z_ayak, zA, zA, M["almasik"], M["kesme"], M["almasik"])         # alt kemer kuşağı + üst kat döşemesi (kesme taş; draw call ≤ 40)
    for c, wx, wy, _ in pier_rects:
        g.prism(A.rect(c, wx, wy), zA, z_d1, M["ayak"], M["ayak"])
    for poly_, _ in KOSE:
        g.prism(A.ccw(poly_), zA, z_d1, M["ayak"], M["ayak"])
    ring(g, R4(RX, RY), R4(AX, AY), z_d1, zH, zH, M["siva"], M["siva"], M["almasik"])               # üst kuşak; alt yüzü revak tavanı (açık sıva)
    def bay_ON(s, mid, yatay):
        if yatay: return Vector((mid, s * AY)), Vector((1, 0)), Vector((0, s))
        return Vector((s * AX, mid)), Vector((0, 1)), Vector((s, 0))
    REVAK_GOZ = []                                                      # (O, T, N, w, yön) — korkuluk, bölme ve kapılar için
    for sinir, yatay in ((xs, True), (ys, False)):
        for s in (-1, 1):
            for a_, b_ in zip(sinir[:-1], sinir[1:]):
                w = (b_ - a_) - aw; mid = (a_ + b_) / 2; O, T, N = bay_ON(s, mid, yatay)
                yon = ("K" if s == 1 else "G") if yatay else ("D" if s == 1 else "B")
                REVAK_GOZ.append((O, T, N, w, yon, mid))
                guney_alt = yon == "G"                                  # E Vakıf PDF 176: güney revakın alt kemerleri yarım daire
                for kat, ztop, kk, mal in (("alt", z_ayak, P["kemer_k_alt"], M["almasik"]), ("ust", z_d1, P["kemer_k_ust"], M["almasik"])):
                    sivri = not (guney_alt and kat == "alt")
                    zs = ztop - kemer_yuksek(w, sivri, kk) - P["kemer_bant"] - 0.10
                    panel(g, O, T, N, kemer_alinlik(w, zs, ztop, sivri, e=0.002, n=4, kk=kk), 0.0, ad, mal)
                    if sivri or kat == "ust":                           # tuğla kemer bandı, köşelik yüzünden 3,5 cm önde (5 mm gömülü)
                        panel(g, O, T, N, kemer_halka(w, zs, P["kemer_bant"], True, 4, kk), -0.035, 0.005, M["tugla"])
                    else:                                               # E PDF 108: güney alt kemerler «yuvarlak ve almaşık» → kesme taş / tuğla dönüşümlü kemer taşları
                        R0, R1, nk = w / 2, w / 2 + P["kemer_bant"], 9
                        for q in range(nk):
                            a0, a1 = math.pi * q / nk + 0.004, math.pi * (q + 1) / nk - 0.004
                            pq = [(r_ * math.cos(t_), zs + r_ * math.sin(t_)) for r_, t_ in ((R0, a0), (R1, a0), (R1, a1), (R0, a1))]
                            panel(g, O, T, N, pq, -0.035, 0.005, M["kesme"] if q % 2 == 0 else M["tugla"])
                    if kat == "alt":                                    # bölme (E PDF 108): alt dikdörtgen ahşap, kemer kısmı cam; avlu yüzünden 0,6 m geride
                        hw = w / 2 - 0.002
                        panel(g, O, T, N, [(-hw, 0.0), (hw, 0.0), (hw, zs), (-hw, zs)], P["bolme_ofs"], P["bolme_ofs"] + 0.06, M["kapi"])
                        ark = kemer(w - 0.004, zs, sivri, 4, kk)
                        panel(g, O, T, N, [(hw, zs)] + ark[::-1][1:-1] + [(-hw, zs)], P["bolme_ofs"] + 0.015, P["bolme_ofs"] + 0.045, M["cam"])   # ahşap bölmeden farklı kalınlık: ortak köşe yok
    # üst kat döşeme kenarı silmesi (F: avlu fotoğraflarında döşeme hizasında ince bant), alt kemerlerin üstünde kalır
    for O, T, N, yon in yuzler(AX, AY, True):
        L_ = AX + 0.08 if yon in ("K", "G") else AX - 0.08               # köşede üst üste binmesin (aynı düzlemde yüz yok)
        panel(g, O, T, N, [(-L_, zA - 0.22), (L_, zA - 0.22), (L_, zA), (-L_, zA)], -0.005, 0.08, M["kesme"])
    # korkuluk: göz başına gerçek delikli beyaz demir levha (alpha kesme), avlu yüzünden 0,3 m içeride
    for O, T, N, w, yon, mid in REVAK_GOZ:
        hw = w / 2 - 0.003; kh = P["korkuluk_h"]
        uv_panel(g, O, T, N, [(-hw, zA), (hw, zA), (hw, zA + kh), (-hw, zA + kh)], 0.30, 0.33, M["korkuluk"], M["korkuluk"], -hw, 1.0, zA, kh)
    # kirpi saçak (avlu yüzü): iki sıra, 0,12 taşma
    zk0, zk1, kd = P["kirpi"]
    ring(g, R4(AX - 0.001, AY - 0.001), R4(AX - kd, AY - kd), zk0, zk1, zk1, M["kirpi"], M["kirpi"], M["kirpi"])   # üst kuşakla ortak köşe yok
    rev = g.obj()
    # köşe kubbeleri (E PDF 108): dört köşe gözünde üst kuşağa oyulan küresel kubbe (içten; dışarıdan görünmez)
    zk, rk = P["kose_kubbe"]; kc = AX + ad + P["revak_d"] / 2
    for sx in (-1, 1):
        for sy in (-1, 1):
            bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=rk, location=(sx * kc, sy * kc, zk)); sp = bpy.context.active_object
            sp.data.materials.append(M["siva"]); kes(rev, sp); bpy.data.objects.remove(sp, do_unlink=True)

    # ======================= §4 DIŞ CEPHE: pencereler, kirpi saçak =======================
    g = A.G("Dis_Cephe")
    pw, pz0, ph = P["pen"]; ipay, bant, akk = P["pen_alinlik"]; sv = 0.14
    def dis_pencere(O, T, N):
        pencere_doku(g, O, T, N, pw + 2 * sv, pz0 - sv, ph + 2 * sv)
        zs = pz0 + ph + sv + 0.02; wi = pw + 2 * ipay; wo = wi + 2 * bant
        dis_ = kemer(wo, zs, True, n=4, kk=akk)
        panel(g, O, T, N, [(wo / 2, zs)] + dis_[::-1][1:-1] + [(-wo / 2, zs)], -0.02, 0.08, M["tugla"])   # tuğla sivri kemer + dolu alınlık tek levha (F 1578509543; üçgen bütçesi)
    gh = P["giris_aralik"] / 2; oda_ns = P["oda_ns"] // 2; adim_ns = (OX - gh) / oda_ns
    ODALAR = {"K": [s * (gh + adim_ns * (k + 0.5)) for s in (-1, 1) for k in range(oda_ns)],
              "G": [s * (gh + adim_ns * (k + 0.5)) for s in (-1, 1) for k in range(oda_ns)]}
    y_do = OY - (OX - gh) / oda_ns                                      # doğu/batı odaları köşe odalarının arasında (T)
    ODALAR["D"] = ODALAR["B"] = [-y_do + 2 * y_do * (k + 0.5) / P["oda_do"] for k in range(P["oda_do"])]
    PENCERESIZ = {("G", max(ODALAR["G"])), ("D", min(ODALAR["D"]))}    # E PDF 109: güneydoğu köşesindeki iki oda penceresiz
    CIFT = {("D", max(ODALAR["D"])), ("B", min(ODALAR["B"]))}          # E PDF 109: 2 odada 2 pencere (yer T: kuzey uçlar)
    pen_say = 0
    for O, T, N, yon in yuzler(OX, OY, False):
        for s in ODALAR[yon]:
            if (yon, s) in PENCERESIZ: continue
            for ds in ((-0.85, 0.85) if (yon, s) in CIFT else (0.0,)):
                dis_pencere(O + T * (s + ds), T, N); pen_say += 1
    zk0, zk1, kd = P["kirpi"]                                            # kirpi saçak (dış yüz), çatı alt yüzüne değer
    ring(g, R4(OX + kd, OY + kd), R4(OX, OY), zk0, zk1, zk1, M["kirpi"], M["kirpi"], M["kirpi"])
    g.obj()

    # ======================= §4 BACALAR (Koza v12 baca(): tuğla gövde + saçak levhası + piramit külah; plan: kurşun başlık) =======================
    g = A.G("Bacalar"); bw, bh, bic = P["baca"]
    def baca(c):
        uvl = g.bm.loops.layers.uv.verify(); zc = cati_z(c.x, c.y); z1 = zc + bh
        z0 = min(cati_z(c.x + dx, c.y + dy) for dx in (-bw / 2, bw / 2) for dy in (-bw / 2, bw / 2)) - 0.05   # en alçak köşede 5 cm gömülü (kalça üstünde de)
        q = A.ccw(A.rect(c, bw, bw)); alt = [g.V(p, z0) for p in q]; ust = [g.V(p, z1) for p in q]
        for i in range(4):
            j = (i + 1) % 4; f = g.F([alt[i], alt[j], ust[j], ust[i]], M["baca"])
            if f:
                for l, uv in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))): l[uvl].uv = uv
        g.F(alt[::-1], M["baca"]); g.F(ust, M["baca"])
        q2 = A.ccw(A.rect(c, bw + 0.3, bw + 0.3)); s0 = [g.V(p, z1) for p in q2]; s1 = [g.V(p, z1 + 0.08) for p in q2]; tepe = g.V(c, z1 + 0.08 + 0.45)
        g.F(s0[::-1], M["kursun"])
        for i in range(4):
            j = (i + 1) % 4; g.F([s0[i], s0[j], s1[j], s1[i]], M["kursun"]); g.F([s1[i], s1[j], tepe], M["kursun"])
    baca_say = 0
    for O, T, N, yon in yuzler(OX, OY, False):
        for s in ODALAR[yon]:
            baca(O + T * s - N * bic); baca_say += 1
    g.obj()

    # ======================= §4 GİRİŞLER =======================
    # Kuzey (asıl giriş, F Emir-Hani-1 / 685999… / 7112FE8 / 1578509484 / 1578509629): yükseltilmiş cephe bloğu, dış tuğla sivri kemer + tuğla alınlık,
    # iç kesme taş yarım daire kemer, kapıya inen rampa ve iki yanında taş peykeler; geçit üst kat revakına aynı kotta çıkar (1578509629).
    gk = A.G("Giris_Kuzey"); Ok, Tk, Nk = Vector((0, OY)), Vector((1, 0)), Vector((0, 1))
    bW, bC, bZ = P["giris_blok"]; esik = P["giris_esik"]; gw2 = P["giris_w"] / 2; zu = P["giris_uzengi"]
    tw, tzs, tb = P["giris_tugla"]
    blok = [(-bW / 2, ZS - 0.6), (bW / 2, ZS - 0.6), (bW / 2, bZ), (-bW / 2, bZ)]
    acik = [(-gw2, esik), (gw2, esik)] + kemer(P["giris_w"], zu, False, 8)[::-1]
    gb = A.G("_gk_blok"); panel(gb, Ok, Tk, Nk, blok, -0.002, bC, M["dis"]); gk_blok = gb.obj()   # tek kapalı hacim: geçit boolean'ı yalnız buna uygulanır
    panel(gk, Ok, Tk, Nk, [(-bW / 2 - 0.12, bZ), (bW / 2 + 0.12, bZ), (bW / 2 + 0.12, bZ + 0.12), (-bW / 2 - 0.12, bZ + 0.12)], -0.12, bC + 0.12, M["kursun"])   # blok başlığı
    panel(gk, Ok, Tk, Nk, kemer_halka(tw, tzs, tb, True, 8, 0.55), bC - 0.02, bC + 0.06, M["tugla"])                # dış tuğla sivri kemer
    Rt = gw2 + 0.351; a0t = math.asin((tzs - zu) / Rt)                                                                # alınlık = tuğla kemer içi − taş kemer sırtı (açıklık açık kalır)
    tim = kemer(tw, tzs, True, 8, 0.55) + [(Rt * math.cos(a0t + (math.pi - 2 * a0t) * q / 8), zu + Rt * math.sin(a0t + (math.pi - 2 * a0t) * q / 8)) for q in range(9)]
    panel(gk, Ok, Tk, Nk, tim, bC - 0.015, bC + 0.03, M["tugla"])                                                   # tuğla alınlık dolgusu
    panel(gk, Ok, Tk, Nk, kemer_halka(P["giris_w"], zu, 0.35, False, 8) , bC - 0.02, bC + 0.08, M["kesme"])        # kesme taş kemer
    for sg in (-1, 1):                                                                                                # kesme taş söveler
        panel(gk, Ok, Tk, Nk, [(sg * gw2, esik), (sg * (gw2 + 0.35), esik), (sg * (gw2 + 0.35), zu - 0.001), (sg * gw2, zu - 0.001)], bC - 0.02, bC + 0.08, M["kesme"])
    lev = [(-0.9, tzs + kemer_yuksek(tw + 2 * tb, True, (0.55 * tw + tb) / (tw + 2 * tb)) + 0.15)]; lz = lev[0][1]   # EMİRHANI levhası: düz taş panel (yazı yok)
    panel(gk, Ok, Tk, Nk, [(-0.9, lz), (0.9, lz), (0.9, lz + 0.35), (-0.9, lz + 0.35)], bC - 0.01, bC + 0.05, M["kesme"])
    pW, pL, pH = P["peyke"]                                                                                           # peykeler + rampa
    for sg in (-1, 1):
        gk.prism(A.rect(Vector((sg * (gw2 + 0.35 + pW / 2), OY + bC + pL / 2)), pW, pL), esik, ZS + pH, M["kesme"], M["kesme"])
    rL = P["rampa_L"]; y0, y1 = OY - 0.001, OY + bC + rL; xr = gw2 + 0.35
    rp = [(y0, esik - 0.02), (y1, ZS - 0.02), (y1, esik - 0.3), (y0, esik - 0.3)]
    a_ = [gk.bm.verts.new((-xr, yy, zz)) for yy, zz in rp]; b_ = [gk.bm.verts.new((xr, yy, zz)) for yy, zz in rp]
    gk.F(a_, M["kesme"]); gk.F(b_[::-1], M["kesme"])
    for i in range(4): j = (i + 1) % 4; gk.F([a_[j], a_[i], b_[i], b_[j]], M["kesme"])
    gir_k = gk.obj()
    # Güney (W bildiri PDF 6 «üst katta kesme taştan basık kemerli»; E PDF 109 Ulucami avlusundan): +4,0 düzeyinde kesme taş çerçeveli basık kemer
    gg = A.G("Giris_Guney"); Og, Tg, Ng = Vector((0, -OY)), Vector((-1, 0)), Vector((0, -1))
    gW, gU, gB = P["guney_giris"]; zu_g = ZS + gU
    bas = [(gW / 2 * math.cos(math.pi * q / 8), zu_g + gB * math.sin(math.pi * q / 8)) for q in range(9)]           # basık (eliptik) kemer
    bas_o = [((gW / 2 + 0.4) * math.cos(math.pi * q / 8), zu_g + (gB + 0.4) * math.sin(math.pi * q / 8)) for q in range(9)]
    panel(gg, Og, Tg, Ng, bas_o + bas[::-1], -0.02, 0.10, M["kesme"])
    for sg in (-1, 1):
        panel(gg, Og, Tg, Ng, [(sg * gW / 2, ZS), (sg * (gW / 2 + 0.4), ZS), (sg * (gW / 2 + 0.4), zu_g - 0.001), (sg * gW / 2, zu_g - 0.001)], -0.02, 0.10, M["kesme"])
    gir_g = gg.obj()
    # geçitler: Koza v12 kes() yöntemi — açıklık profili kanadı boydan boya oyar (taban eşik kotunda); geçit tabanı rampa ile revak döşemesine (+4,5) bağlanır
    def gecit(O, T, N, prof, derin, z_esik, ad_):
        gk_ = A.G("_kes_" + ad_); panel(gk_, O, T, N, prof, -0.6, derin, M["siva"]); kc_ = gk_.obj()
        for hedef in ((gov, gk_blok) if ad_ == "k" else (gov,)):
            kes(hedef, kc_)
        bpy.data.objects.remove(kc_, do_unlink=True)
    gecit(Ok, Tk, -Nk, [(-gw2, esik), (gw2, esik)] + kemer(P["giris_w"], zu, False, 8)[::-1][1:-1], OY - RY + 0.001, esik, "k")
    gecit(Og, Tg, -Ng, [(-gW / 2, ZS), (gW / 2, ZS)] + bas[1:-1], OY - RY + 0.001, ZS, "g")
    KAIDE_KES = [((0.0, OY + (bC + rL) / 2 - 0.002), (2 * xr, bC + rL + 0.004)),                       # rampa çukuru (kaide ve sokak döşemesinden)
                 ((-(xr + pW / 2), OY + (bC + pL) / 2 - 0.002), (pW, bC + pL + 0.004)), ((xr + pW / 2, OY + (bC + pL) / 2 - 0.002), (pW, bC + pL + 0.004))]
    KAIDE_KES_Z = esik - 0.3
    bpy.ops.object.select_all(action='DESELECT'); gir_k.select_set(True); gk_blok.select_set(True)
    bpy.context.view_layer.objects.active = gir_k; bpy.ops.object.join()
    bpy.ops.object.select_all(action='DESELECT'); gir_k.select_set(True); gir_g.select_set(True)                       # iki giriş tek nesne (draw call bütçesi ≤ 40)
    bpy.context.view_layer.objects.active = gir_k; bpy.ops.object.join(); gir_k.name = "Girisler"; gir_k.data.name = "Girisler"
    gr = A.G("_gecit_taban")                                             # geçit tabanı: eşikten revak döşemesine eğimli
    for (yA, yB, zA_, zB_, hw) in ((OY + 0.001, RY - 0.001, esik, P["alt_h"], gw2 - 0.002), (-OY - 0.001, -RY + 0.001, ZS, P["alt_h"], gW / 2 - 0.002)):
        pr = [(yA, zA_ - 0.001), (yB, zB_ - 0.001), (yB, zA_ - 0.25), (yA, zA_ - 0.25)]
        a_ = [gr.bm.verts.new((-hw, yy, zz)) for yy, zz in pr]; b_ = [gr.bm.verts.new((hw, yy, zz)) for yy, zz in pr]
        sgn = 1 if yB > yA else -1
        gr.F(a_ if sgn > 0 else a_[::-1], M["dis_alt"]); gr.F(b_[::-1] if sgn > 0 else b_, M["dis_alt"])
        for i in range(4):
            j = (i + 1) % 4; gr.F([a_[j], a_[i], b_[i], b_[j]] if sgn > 0 else [a_[i], a_[j], b_[j], b_[i]], M["dis_alt"])
    gt = gr.obj()
    bpy.ops.object.select_all(action='DESELECT'); gov.select_set(True); gt.select_set(True)
    bpy.context.view_layer.objects.active = gov; bpy.ops.object.join(); gov.name = "Emir_Hani"
    # üst revak arka duvarında göz başına oda kapısı (F Kqg5B5q, emirhan-bursa-ulucami3: beyaz duvarda kemerli kapılar); geçit gözleri hariç
    g = A.G("_kapilar")
    for O, T, N, w, yon, mid in REVAK_GOZ:
        if yon in ("K", "G") and abs(mid) < 0.1: continue
        Ob = Vector((O.x + N.x * (RX - AX), O.y + N.y * (RY - AY)))
        panel(g, Ob, T, -N, [(-0.55, P["alt_h"] + 0.01), (0.55, P["alt_h"] + 0.01)] + kemer(1.1, P["alt_h"] + 2.0, False, 4)[::-1][1:-1], A.DECAL_OFF, A.DECAL_OFF + 0.05, M["kapi"])   # kemerli oda kapısı
    kp = g.obj()
    bpy.ops.object.select_all(action='DESELECT'); rev.select_set(True); kp.select_set(True)
    bpy.context.view_layer.objects.active = rev; bpy.ops.object.join(); rev.name = "Avlu_Revaklari"
    SAYIM = {"pencere": pen_say, "baca": baca_say, "oda": sum(len(v) for v in ODALAR.values()), "goz_kenar_basina": P["goz"],
             "goz_adimi_m": round(2 * AX / P["goz"], 3), "kemer_acikligi_m": round(2 * AX / P["goz"] - P["ayak_w"], 3)}
    print("SAYIM", SAYIM, flush=True)


if SEVIYE >= 3:
    # Ulu Cami v24 çevre/şadırvan yöntemleri (değiştirilmeden içe aktarılır): v23_avlu (oct_pts, tup_poly, rod, plaka), v23_cevre (cinar, tarh, _elips, _dal)
    sys.path.append(os.path.normpath(os.path.join(HERE, *[".."] * 3, "ulu-cami", "3d", "build")))
    import v23_avlu as UA, v23_cevre as UC
    P.update({
        # ================= §5 AVLU =================
        "sad_ap": 2.0,           # E/F plan §5: sekizgen havuz yüzden yüze ≈ 4,0 (E PDF 109 «fıskiyeli şadırvan»; F emirhan-bursa-ulucami2)
        "sad_h": 0.7,            # plan §5 kenar yüksekliği
        "sad_cidar": 0.2,        # T  Ulu Cami iç şadırvan cidarı (0,20)
        "sad_basamak": (0.35, 0.15),  # T  tek basamaklı mermer taban (taşma, yükseklik); Ulu avlu şadırvanı platformu
        "fiskiye": (0.15, 1.2),  # plan §5: sütun Ø 0,3, yükseklik 1,2
        # ağaçlar (en çok 4; Cevre_Agac_NN, ≤ 300 üçgen): yerler T, fotoğrafa dayanak yanında
        "agaclar": [("cinar", (-7.2, 6.4)),    # E «tarihi çınar ağaçları»; F Emir-Hani-4 (revak önünde büyük çınar), 6141e917
                    ("cinar", (7.0, -6.8)),    # E; F envanter_c1_pdf109 (şadırvan çevresinde tarhlı çınarlar)
                    ("sedir", (7.2, 6.8)),     # F emirhan-bursa-ulucami4/6, Emir-Hani-5: avluda iri sedir (#3F7A5C)
                    ("palmiye", (-7.0, -6.6))],  # F Emir-Hani-4/5, emirhan-bursa-ulucami2: yelpaze palmiye
        "tarh": (1.8, 0.48, 0.24),   # Ulu v23 tarh(): R, yükseklik, bordür kalınlığı (F envanter_c1_pdf109: tarhlı ağaçlar)
    })
    MS = {"mer": A.mat("Sad_Mermer", "#ECEAE4", 0.40), "gol": A.mat("Sad_Mermer_Gol", "#D5D6D2", 0.45), "su": A.mat("Sad_Su", "#8CC3C6", 0.10)}   # Ulu Cami v23_avlu.malz() tonları
    for k_, (n_, hx_, r_) in {"mer": ("Sad_Mermer", "#ECEAE4", 0.40), "gol": ("Sad_Mermer_Gol", "#D5D6D2", 0.45), "su": ("Sad_Su", "#8CC3C6", 0.10)}.items():
        MAT.append(("sad_" + k_, n_, hx_, r_, 0.0))
    # ======================= §5 ŞADIRVAN: açık sekizgen mermer havuz + fıskiye (Ulu iç şadırvan dili; parçalar arasında boşluk/gömülme yok) =======================
    g = A.G("Sadirvan"); c0 = Vector((0.0, 0.0)); z0 = 0.03
    R0 = P["sad_ap"] / math.cos(math.radians(22.5)); Ri = R0 - P["sad_cidar"] / math.cos(math.radians(22.5)); bt, bh_ = P["sad_basamak"]
    zb = z0 + bh_; zr = z0 + P["sad_h"]
    g.prism(UA.oct_pts(c0, R0 + bt / math.cos(math.radians(22.5))), z0, zb, MS["mer"], MS["mer"])                 # mermer basamak (avlu döşemesi üstüne oturur)
    UA.tup_poly(g, UA.oct_pts(c0, R0), UA.oct_pts(c0, Ri), zb, zr - 0.08, MS["mer"])                              # havuz cidarı (basamağa tam oturur)
    UA.tup_poly(g, UA.oct_pts(c0, R0 + 0.06), UA.oct_pts(c0, Ri - 0.01), zr - 0.08, zr, MS["mer"])                # kenar kapağı: 6 cm taşar (ortak köşe yok)
    g.prism([c0 + (q - c0) * 0.995 for q in UA.oct_pts(c0, Ri)], zb, zr - 0.12, MS["su"], MS["su"])               # su, kenardan 0,12 aşağıda (Ulu iç şadırvan)
    ap_ = R0 * math.cos(math.radians(22.5)); fw = R0 * math.sin(math.radians(22.5)) - 0.18
    for k in range(8):                                                                                              # her yüzde çökertilmiş pano (Ulu iç havuz panosu, gölge tonu)
        a = math.radians(45 * k); nn = Vector((math.cos(a), math.sin(a))); tt = Vector((-nn.y, nn.x))
        UA.plaka(g, c0 + nn * ap_, tt, nn, [(-fw, zb + 0.10), (fw, zb + 0.10), (fw, zr - 0.16), (-fw, zr - 0.16)], 0.0, 0.006, MS["gol"])
    fr, fh = P["fiskiye"]
    g.lathe(c0, [(fr * 1.6, zb), (fr * 1.6, zb + 0.12), (fr, zb + 0.18), (fr, z0 + fh - 0.10), (0.34, z0 + fh - 0.02), (0.31, z0 + fh + 0.02), (0.0, z0 + fh - 0.05)],
            12, [MS["mer"]] * 3 + [MS["gol"]] * 3)                                                                   # fıskiye sütunu Ø 0,3 + lotus çanak tek dönel profil (Ulu iç havuz fıskiyesi; boşluk/gömülme yok)
    g.obj()

    # ======================= §5 AĞAÇLAR + TARHLAR (Ulu v23_cevre) — Orhan Bey v06 yöntemi: tek "Agac" malzemesi = nötr yaprak dokusu × köşe rengi =======================
    # (yaprak tonları, gövde, toprak, tarh bordürü ve çim köşe rengine yazılır; AO ile çarpılıp tek renk katmanında kalır → ağaç başına 1 draw call)
    TON = {"Agac_Yaprak_0": "#7FA35B", "Agac_Yaprak_1": "#93B46A", "Agac_Yaprak_2": "#6E9450", "Agac_Govde": "#7A634B",
           "Agac_Servi": "#3F7A5C", "Agac_Toprak": "#A5845F", "Tarh_Bordur": "#D2C3A4", "Tarh_Cim": "#9DB86A"}                          # standart §1/§3
    M["agac"] = A.mat("Agac", "#FFFFFF", 0.90); doku_bagla(M["agac"], "yaprak_notr.png"); DOKULU["agac"] = "yaprak_notr.png"
    MAT.append(("agac", "Agac", "#FFFFFF", 0.90, 0.0))
    mb_ = A.mat("Tarh_Bordur", "#D2C3A4", 0.85); mc_ = A.mat("Tarh_Cim", "#9DB86A", 0.95)
    def _lin(hx_): return tuple(A._s2l(int(hx_[i:i + 2], 16) / 255) for i in (1, 3, 5))
    def atlasla(o):
        """Orhan v06 konsolide(): yüz rengi TINT köşe rengine (÷0,94: doku ortalaması telafisi), UV dünya konumundan (x + 0,6·y, z) / 1,3 m; tek Agac malzemesi."""
        me = o.data; uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
        if "AO" not in me.color_attributes: me.color_attributes.new("AO", 'BYTE_COLOR', 'CORNER')
        tl = me.color_attributes.new("TINT", 'FLOAT_COLOR', 'CORNER')
        for p in me.polygons:
            t = tuple(min(1.0, c / 0.94) for c in _lin(TON.get(me.materials[p.material_index].name.split(".")[0], "#7FA35B")))
            for li in p.loop_indices:
                co = me.vertices[me.loops[li].vertex_index].co; uvl.data[li].uv = ((co.x + 0.6 * co.y) / 1.3, co.z / 1.3); tl.data[li].color = (*t, 1.0)
            p.material_index = 0
        me.materials.clear(); me.materials.append(M["agac"]); me.color_attributes.active_color = me.color_attributes["AO"]
    def birlestir(ana, ek):
        bpy.ops.object.select_all(action='DESELECT'); ana.select_set(True); ek.select_set(True)
        bpy.context.view_layer.objects.active = ana; bpy.ops.object.join(); return ana
    tR, tH, tK = P["tarh"]; zc_ = z0 + 0.38                                                                          # tarh çim kotu (Ulu tarh: bordür − 0,10)
    def sedir(ad, c, boy=15.0):
        """Ulu v23_cevre.servi() yöntemi (lathe), sedir oranları: geniş, katmanlı taç (F emirhan-bursa-ulucami4/6). ≤ 300 üçgen."""
        g = A.G(ad); yes = A.mat("Agac_Servi", "#3F7A5C", 0.90); kab = A.mat("Agac_Govde", "#7A634B", 0.90); k = boy / 15.0
        g.lathe(c, [(0.30, zc_ - 0.05), (0.26, zc_ + 2.2 * k)], 6, [kab])
        g.lathe(c, [(0.9 * k, zc_ + 2.0 * k), (3.4 * k, zc_ + 3.6 * k), (2.3 * k, zc_ + 4.4 * k), (3.6 * k, zc_ + 6.2 * k), (2.3 * k, zc_ + 7.2 * k),
                    (3.0 * k, zc_ + 8.8 * k), (1.8 * k, zc_ + 9.8 * k), (2.2 * k, zc_ + 11.2 * k), (1.0 * k, zc_ + 12.6 * k), (0.0, zc_ + boy - 0.4)], 8, [yes])
        return g.obj()
    def palmiye(ad, c, boy=7.0):
        """Yelpaze palmiye (F Emir-Hani-4/5, emirhan-bursa-ulucami2): Ulu _dal gövde + 10 yaprak (yassı sekiz yüzlü). ≤ 300 üçgen."""
        g = A.G(ad); yap = A.mat("Agac_Yaprak_2", "#6E9450", 0.90); kab = A.mat("Agac_Govde", "#7A634B", 0.90)
        tepe = Vector((c.x + 0.25, c.y, zc_ + boy))
        UC._dal(g, (c.x, c.y, zc_ - 0.05), tuple(tepe), 0.20, kab, 6)
        for q in range(10):
            a = 2 * math.pi * q / 10; d = Vector((math.cos(a), math.sin(a), 0.0)); L = 2.5
            tip = tepe + d * L + Vector((0, 0, -0.9 + 0.5 * (q % 2))); mid = tepe + d * (L * 0.45) + Vector((0, 0, 0.25))
            yan = Vector((-d.y, d.x, 0)) * 0.55
            vs = [g.bm.verts.new(p) for p in (tepe + Vector((0, 0, -0.02)), mid + yan, mid + Vector((0, 0, 0.06)), mid - yan, mid + Vector((0, 0, -0.06)), tip)]
            b_, s1, u_, s2, d_, t_ = vs
            for f_ in ((b_, s1, u_), (b_, u_, s2), (b_, s2, d_), (b_, d_, s1), (t_, u_, s1), (t_, s2, u_), (t_, d_, s2), (t_, s1, d_)): g.F(list(f_), yap)
        return g.obj()
    AGAC_ADLAR = []
    for i, (tur, (x_, y_)) in enumerate(P["agaclar"], 1):
        c = Vector((x_, y_)); ad = f"Cevre_Agac_{i:02d}"
        if tur == "cinar":
            o = UC.cinar(ad, c)                                                                                         # Ulu: tarh toprağı +0,38'den çıkar; avlu döşemesi +0,03 → +0,03 kaydır, ×1,35 büyüt (F: han yüksekliğini aşan çınar)
            for v in o.data.vertices:
                v.co.z += z0; v.co = Vector((c.x, c.y, zc_)) + (v.co - Vector((c.x, c.y, zc_))) * 1.35
            o.data.update()
        elif tur == "sedir": o = sedir(ad, c)
        else: o = palmiye(ad, c)
        t_ = UC.tarh("_tarh", c, tR, tH, tK, mb_, mc_, ztaban=z0)
        o = birlestir(o, t_); o.name = ad; o.data.name = ad; atlasla(o); AGAC_ADLAR.append(ad)

    # ======================= §6 FİGÜRLER: A.insan (Ulu Cami/Koza ile aynı set ve boylar) =======================
    # (poz, boy, konum, yön°, kadın, çocuk, renk) — plan §6: avluda 4 (şadırvan yanında 2), üst kat revakında 2, girişte peykelerin yanında 2; en az 3 kadın
    FIG = [("ayakta", 1.64, (2.95, 0.9, z0), 200, True, False, 1),                    # şadırvan yanında (kadın)
           ("oturan", 1.76, (-2.95, -1.0, z0), 15, False, False, 0),                  # şadırvan yanında taburede
           ("yuruyen", 1.74, (-4.2, -9.6, z0), 80, False, False, 2),                  # avlu
           ("yuruyen", 1.62, (4.6, 9.4, z0), 260, True, False, 0),                    # avlu (kadın)
           ("ayakta", 1.78, (-5.6, AY + P["ayak_d"] + 1.6, P["alt_h"]), 270, False, False, 1),   # üst kat kuzey revakı, avluya bakar
           ("yuruyen", 1.66, (AX + P["ayak_d"] + 1.5, 3.2, P["alt_h"]), 90, True, False, 2),     # üst kat doğu revakı (kadın)
           ("ayakta", 1.72, (3.3, OY + 2.1, ZS), 200, False, False, 0),               # girişte peykenin yanında
           ("yuruyen", 1.60, (-3.7, OY + 4.6, ZS), 330, True, False, 1)]              # girişe yürüyen (kadın)
    for i, (pz, bo, kn, yo, kd, co, rn) in enumerate(FIG, 1):
        A.insan("Olcek_Insan_%02d" % i, pz, bo, kn, yo, kd, co, rn)
    FIGUR_RAPOR = [{"ad": "Olcek_Insan_%02d" % i, "poz": f[0], "boy_m": f[1], "konum": [round(x, 2) for x in f[2]], "kadin": f[4]} for i, f in enumerate(FIG, 1)]

# ======================= UV (Koza v12 uv_karolar) =======================
def uv_karolar():
    for o in [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_"))]:
        me = o.data
        for k, (kw_, kh_, z0_) in KAROLAR.items():
            idx = [i for i, s in enumerate(o.material_slots) if s.material is M[k]]
            if not idx: continue
            uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
            for p in me.polygons:
                if p.material_index not in idx: continue
                n = p.normal; t = Vector((-n.y, n.x, 0)).normalized() if abs(n.z) < 0.7 else None
                for li in p.loop_indices:
                    co = o.matrix_world @ me.vertices[me.loops[li].vertex_index].co
                    uvl.data[li].uv = ((co.x * t.x + co.y * t.y) / kw_, (co.z - z0_) / kh_) if t is not None else (co.x / kw_, co.y / kh_)

# ======================= kontrol ve bütçe =======================
os.makedirs(KONTROL, exist_ok=True); os.makedirs(TMP, exist_ok=True)
GRUPLAR = {"han": lambda n: not n.startswith(("Cevre_", "Olcek", "Sadirvan", "Zemin")),
           "sadirvan_agac": lambda n: n.startswith(("Sadirvan", "Cevre_")), "figur": lambda n: n.startswith("Olcek")}
def butce(mk): return {k: sum(v["ucgen"] for n, v in mk.items() if f(n)) for k, f in GRUPLAR.items()}
uv_karolar()
if HIZLI:
    exec(open(os.environ["EMIR_EK"]).read()) if os.environ.get("EMIR_EK") else None
    mk = A.mesh_kontrol(); print("HIZLI", json.dumps(mk), json.dumps(butce(mk))); raise SystemExit

# ======================= kaide çemberi: yapı + çevre öğeleri (sokak hariç) → en küçük çember + 3 m =======================
def en_kucuk_cember(pts):
    """Welzl (yinelemeli, karıştırılmış). pts: Vector2 listesi → (merkez, R)."""
    import random
    ps = list(pts); random.Random(3).shuffle(ps)
    def c2(a, b): c = (a + b) / 2; return c, (a - c).length
    def c3(a, b, c):
        d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y))
        if abs(d) < 1e-12: return None
        ux = ((a.length_squared) * (b.y - c.y) + (b.length_squared) * (c.y - a.y) + (c.length_squared) * (a.y - b.y)) / d
        uy = ((a.length_squared) * (c.x - b.x) + (b.length_squared) * (a.x - c.x) + (c.length_squared) * (b.x - a.x)) / d
        o = Vector((ux, uy)); return o, (a - o).length
    ic_ = lambda c, p: (p - c[0]).length <= c[1] + 1e-7
    C = (ps[0], 0.0)
    for i, p in enumerate(ps):
        if ic_(C, p): continue
        C = (p, 0.0)
        for j, q in enumerate(ps[:i]):
            if ic_(C, q): continue
            C = c2(p, q)
            for r in ps[:j]:
                if ic_(C, r): continue
                C = c3(p, q, r) or C
    return C
def yapi_noktalari():
    pts = []
    for o in bpy.data.objects:
        if o.type != "MESH" or o.name.startswith(("REF", "_", "Zemin")): continue
        pts += [(o.matrix_world @ v.co).xy for v in o.data.vertices]
    # dışbükey zarf (Andrew) → Welzl hızlı
    pts = sorted({(round(p.x, 4), round(p.y, 4)) for p in pts})
    def cr(o, a, b): return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])
    lo, hi = [], []
    for p in pts:
        while len(lo) >= 2 and cr(lo[-2], lo[-1], p) <= 0: lo.pop()
        lo.append(p)
    for p in reversed(pts):
        while len(hi) >= 2 and cr(hi[-2], hi[-1], p) <= 0: hi.pop()
        hi.append(p)
    return [Vector(p) for p in lo[:-1] + hi[:-1]]
K_C, K_R0 = en_kucuk_cember(yapi_noktalari())
K_MERKEZ = Vector((round(K_C.x, 2), round(K_C.y, 2))); K_R = round(K_R0 + P["kaide_pay"], 2); K_SEG = 96
print("KAIDE_CEMBER", K_MERKEZ, K_R0, K_R, flush=True)

# ======================= kontrol (mesh, çakışma, arka yüz 8 yön) =======================
KONTROL_ATLA = os.environ.get("EMIR_KONTROL", "1") == "0"
rapor = {"ucgen_toplam": sum(v["ucgen"] for v in A.mesh_kontrol().values())} if KONTROL_ATLA else A.kontrol_hepsi(KONTROL, "kontrol")
mk = A.mesh_kontrol()
rapor["asama"] = ASAMA
rapor["parcalar"] = {k: v["ucgen"] for k, v in mk.items()}
rapor["butce"] = butce(mk)
def acik_hacim_say():
    """Koza v12: geçit açıklıklarının (iç hacim) içinde kalan yabancı yüz sayısı. Emir_Hani (geçit duvar/taban) ve giriş nesneleri dışında 0 olmalı."""
    if SEVIYE < 2: return {}
    gw2_, zu_, esik_ = P["giris_w"] / 2 - 0.02, P["giris_uzengi"], P["giris_esik"]; gW_, gU_, gB_ = P["guney_giris"]
    def kuzey(p):
        if not (RY + 0.05 <= p.y <= OY - 0.05) or p.z < P["alt_h"] + 0.05: return False
        return abs(p.x) < gw2_ if p.z <= zu_ else p.x * p.x + (p.z - zu_) ** 2 < gw2_ * gw2_
    def guney(p):
        if not (-OY + 0.05 <= p.y <= -RY - 0.05) or p.z < P["alt_h"] + 0.05: return False
        zu_g = ZS + gU_; hw = gW_ / 2 - 0.02
        return abs(p.x) < hw if p.z <= zu_g else (p.x / hw) ** 2 + ((p.z - zu_g) / gB_) ** 2 < 1
    out = {"gecit_kuzey": {}, "gecit_guney": {}}
    for o in bpy.data.objects:
        if o.type != "MESH" or o.name.startswith(("REF", "_", "Zemin")) or o.name == "Emir_Hani": continue
        for ad_, f in (("gecit_kuzey", kuzey), ("gecit_guney", guney)):
            n_ = sum(1 for p in o.data.polygons if f(o.matrix_world @ p.center))
            if n_: out[ad_][o.name] = n_
    return out
rapor["acik_hacim_yabanci_yuz"] = acik_hacim_say()
rapor["draw_call"] = sum(len(o.material_slots) for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin")))

# ---------------- ölçü doğrulama (mesh'ten ölçülen) ----------------
def verts_of(ad):
    o = bpy.data.objects[ad]; return [o.matrix_world @ v.co for v in o.data.vertices]
vh = verts_of("Emir_Hani")
vd_ = [v for v in vh if v.z < P["sacak"] - 0.01]                                     # duvarlar (çatı saçak taşması hariç)
dis_olc = (max(v.x for v in vd_) - min(v.x for v in vd_), max(v.y for v in vd_) - min(v.y for v in vd_))
if SEVIYE == 1:
    av_x = 2 * min(abs(v.x) for v in vh if abs(v.y) < AY + 1e-6 and abs(v.x) < OX - 1)
    av_y = 2 * min(abs(v.y) for v in vh if abs(v.x) < AX + 1e-6 and abs(v.y) < OY - 1)
else:
    vr = verts_of("Avlu_Revaklari")
    av_x = 2 * min(abs(v.x) for v in vr if abs(v.z - P["ust_tepe"]) < 1e-4 and abs(v.y) < AY - 1)
    av_y = 2 * min(abs(v.y) for v in vr if abs(v.z - P["ust_tepe"]) < 1e-4 and abs(v.x) < AX - 1)
olcu = {
    "dis_olcu_olculen_m": [round(dis_olc[0], 3), round(dis_olc[1], 3)], "dis_olcu_hedef_m": [46.0, 50.0], "dis_olcu_kaynak": "E Vakıf 1983 PDF 176",
    "avlu_olculen_m": [round(av_x, 3), round(av_y, 3)], "avlu_hedef_m": [25.5, 25.5], "avlu_kaynak": "H √650 (E PDF 108)",
    "kanat_dogu_bati_m": round((dis_olc[0] - av_x) / 2, 3), "kanat_kuzey_guney_m": round((dis_olc[1] - av_y) / 2, 3), "kanat_kaynak": "H",
    "kat_silmesi_m": P["alt_h"], "sacak_m": round(max(v.z for v in vh if abs(abs(v.x) - OX) < 1e-6), 3), "mahya_m": round(max(v.z for v in vh), 3), "yukseklik_kaynak": "T",
    "sokak_kotu_m": ZS, "sokak_kaynak": "T/H (20 basamak × 0,20; W bildiri)", "avlu_kotu_m": 0.0,
    "disaridan_gorunen_duvar_m": round(P["sacak"] - ZS, 3),
    "kaide": {"bicim": "daire", "merkez_m": [K_MERKEZ.x, K_MERKEZ.y], "en_kucuk_cember_R_m": round(K_R0, 3), "pay_m": P["kaide_pay"], "R_m": K_R,
              "ust_kot_m": ZS, "alt_kot_m": P["kaide_alt"], "ust_pah_m": P["kaide_pah"], "doseme_iceri_m": P["kaide_iceri"]},
}
if SEVIYE >= 2:
    olcu.update({"revak": dict(SAYIM, kaynak="W bildiri PDF 6 (7 göz); H adım; T ayak 1,2 × 1,2, revak 3,0"),
                 "oda_dagilimi": {k: len(v) for k, v in ODALAR.items()}, "pencereli_oda": sum(len(v) for v in ODALAR.values()) - len(PENCERESIZ),
                 "penceresiz_oda": sorted(f"{a}:{b:+.2f}" for a, b in PENCERESIZ), "cift_pencereli_oda": sorted(f"{a}:{b:+.2f}" for a, b in CIFT),
                 "pencere_kaynak": "E PDF 109: 34 odada 1, 2 odada 2 pencere, GD köşede 2 oda penceresiz → 38 pencere", "baca_kaynak": "E PDF 108–109: 38 ocaklı oda",
                 "giris_kuzey": {"esik_m": P["giris_esik"], "aciklik_m": P["giris_w"], "acik_tepe_m": P["giris_uzengi"] + P["giris_w"] / 2, "peyke_m": P["peyke"], "rampa_m": P["rampa_L"]},
                 "giris_guney": {"kot_m": ZS, "en_m": P["guney_giris"][0], "tepe_m": round(ZS + P["guney_giris"][1] + P["guney_giris"][2], 2)}})
if SEVIYE >= 3:
    vs_ = verts_of("Sadirvan")
    olcu["sadirvan"] = {"bicim": "açık sekizgen mermer havuz + fıskiye", "yuzden_yuze_m": round(2 * P["sad_ap"], 2), "kenar_yukseklik_m": P["sad_h"],
                        "fiskiye_m": {"cap": 2 * P["fiskiye"][0], "yukseklik": P["fiskiye"][1]}, "ust_kot_olculen_m": round(max(v.z for v in vs_), 2), "kaynak": "E PDF 109; F emirhan-bursa-ulucami2; ölçü plan §5"}
    olcu["agaclar"] = [{"ad": f"Cevre_Agac_{i:02d}", "tur": t, "konum_m": list(xy), "ucgen": A.mesh_kontrol([bpy.data.objects[f"Cevre_Agac_{i:02d}"]])[f"Cevre_Agac_{i:02d}"]["ucgen"],
                        "boy_m": round(max(v.z for v in verts_of(f"Cevre_Agac_{i:02d}")), 2)} for i, (t, xy) in enumerate(P["agaclar"], 1)]
    olcu["figurler"] = [dict(f, olculen_boy_m=round(max(v.z for v in verts_of(f["ad"])) - f["konum"][2], 2)) for f in FIGUR_RAPOR]
with open(os.path.join(KONTROL, "olcu_dogrulama.json"), "w", encoding="utf-8") as fh: json.dump(olcu, fh, ensure_ascii=False, indent=1)
print("OLCU", json.dumps(olcu, ensure_ascii=False), flush=True)
GENIS = {"dis", "almasik", "kursun", "avlu", "sokak", "ayak", "kesme", "siva", "sad_mer"}
renkler = {}
for k, n, hx, r, mt in MAT:
    rr, gg, bb = [int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    h_, s_, v_ = colorsys.rgb_to_hsv(rr, gg, bb)
    renkler[n] = {"hex": hx, "hsv": [round(h_, 3), round(s_, 3), round(v_, 3)], "rough": r, "metal": mt, "genis_yuzey": k in GENIS, "V_>=_0.72": v_ >= 0.72}
    if n in SAPMA: renkler[n]["sapma"] = SAPMA[n]
renkler["Zemin_Kaide"] = {"hex": "#C4BDAF", "yan": "#A39A8B", "kaynak": "standart §1"}
with open(os.path.join(KONTROL, "renkler.json"), "w", encoding="utf-8") as fh: json.dump(renkler, fh, ensure_ascii=False, indent=1)

# ---------------- AO (taban 0,70; Koza v12 ile aynı) ----------------
if os.environ.get("EMIR_AO", "1") == "1":
    A.ao_vertex(samples=32)
    for o in [o for o in bpy.data.objects if o.type == "MESH" and o.data.color_attributes.get("AO")]:
        tb_ = 0.90 if o.name == "Sadirvan" else 0.85 if o.name.startswith(("Cevre_", "Olcek_")) else 0.70   # Koza v12 AO_TABAN; şadırvan 0,90 (Ulu v24 hata 2: havuz tabanında siyah şerit)
        ti_ = o.data.color_attributes.get("TINT")
        for k_, d_ in enumerate(o.data.color_attributes["AO"].data):
            c_ = tb_ + (1 - tb_) * d_.color[0]; t_ = ti_.data[k_].color if ti_ else (1, 1, 1)
            d_.color = (c_ * t_[0], c_ * t_[1], c_ * t_[2], 1.0)                                                    # Orhan v06: AO × ağaç tonu tek katmanda
        if ti_: o.data.color_attributes.remove(ti_)
    for k in DOKULU:
        nt = M[k].node_tree; tx = nt.nodes.get("DOKU"); mul = next((n for n in nt.nodes if n.type == "MIX" and n.blend_type == 'MULTIPLY'), None)
        if tx and mul: nt.links.new(tx.outputs["Color"], mul.inputs[6])

# ======================= §2 ARAZİ: daire kaide (+4,0) ve sokak döşemesi — yalnız _sunum.glb =======================
def rampa_kes(o_):
    """B+: kuzey girişin rampa çukuru ve peyke yerleri kaideden/döşemeden oyulur (rampa ve peykeler Giris_Kuzey içinde)."""
    if SEVIYE < 2: return
    for (cx_, cy_), (wx_, wy_) in KAIDE_KES:
        gk_ = A.G("_kes_rampa"); gk_.prism(A.rect(Vector((cx_, cy_)), wx_, wy_), KAIDE_KES_Z, ZS + 1.0, M["sokak"], M["sokak"]); kc_ = gk_.obj()
        kes(o_, kc_); bpy.data.objects.remove(kc_, do_unlink=True)
def kaide():
    """Koza v12 kaide() + Ulu v24 daire: üst yüz +4,0, 0,15 pah, alt −0,6; han ayak izi (avlu çukuru dahil) boolean ile oyulur."""
    pah = P["kaide_pah"]; zt, za = ZS, P["kaide_alt"]
    cevre = lambda r: [K_MERKEZ + Vector((r * math.cos(2 * math.pi * k / K_SEG), r * math.sin(2 * math.pi * k / K_SEG))) for k in range(K_SEG)]
    mz = A.mat("Zemin", "#C4BDAF", 0.90); my = A.mat("Zemin_Yan", "#A39A8B", 0.90)
    gz = A.G("Zemin_Kaide")
    ust = [gz.V(q, zt) for q in cevre(K_R - pah)]; ors = [gz.V(q, zt - pah) for q in cevre(K_R)]; alt = [gz.V(q, za) for q in cevre(K_R)]
    gz.F(ust, mz)
    for k in range(K_SEG):
        j = (k + 1) % K_SEG
        gz.F([ust[j], ust[k], ors[k], ors[j]], my); gz.F([ors[j], ors[k], alt[k], alt[j]], my)
    gz.F(alt[::-1], my)
    ob_ = gz.obj()
    gk = A.G("_kes_kaide"); gk.prism(R4(OX - P["kaide_gomme"], OY - P["kaide_gomme"]), za - 1.0, zt + 1.0, my, my); kc = gk.obj()
    kes(ob_, kc); bpy.data.objects.remove(kc, do_unlink=True)
    rampa_kes(ob_)
    return ob_
def sokak():
    """Koza v12 Cevre_Doseme yöntemi: hanın çevresinde şerit, kaide kenarından 1,5 m içeride kesilir (boolean kesişim)."""
    DS = P["sokak_band"]; g_ = A.G("Zemin_Sokak")
    g_.prism(R4(OX + DS, OY + DS), ZS - 0.002, ZS + 0.020, M["sokak"], M["sokak"]); o_ = g_.obj()
    gk = A.G("_kes_sokak"); gk.prism(R4(OX - P["kaide_gomme"], OY - P["kaide_gomme"]), ZS - 1.0, ZS + 1.0, M["sokak"], M["sokak"]); kc = gk.obj()
    kes(o_, kc); bpy.data.objects.remove(kc, do_unlink=True); rampa_kes(o_)
    bpy.ops.mesh.primitive_cylinder_add(vertices=K_SEG, radius=K_R - P["kaide_iceri"], depth=2.0, location=(K_MERKEZ.x, K_MERKEZ.y, ZS)); cyl = bpy.context.active_object
    kes(o_, cyl, 'INTERSECT'); bpy.data.objects.remove(cyl, do_unlink=True)
    return o_
KAIDE = kaide(); SOKAK = sokak()
uv_karolar()
for ob_ in (KAIDE, SOKAK):                                           # Ulu v24: zemine nötr (beyaz) AO
    ob_.data.color_attributes.new("AO", 'BYTE_COLOR', 'CORNER')
    for d_ in ob_.data.color_attributes["AO"].data: d_.color = (1, 1, 1, 1)
rapor["kaide"] = olcu["kaide"]

# ======================= GLB: ana (zeminsiz) + sunum (kaideli, orijin = kaide merkezi) — Koza v12 ortala() =======================
YAZMA = os.environ.get("EMIR_YAZMA", "1") == "1"
def ortala(k):
    for o in bpy.data.objects:
        if o.type == "MESH" and not o.name.startswith(("REF", "_")): o.location.x -= k * K_MERKEZ.x; o.location.y -= k * K_MERKEZ.y
os.makedirs(os.path.dirname(EXPORT), exist_ok=True)
def tek_uv():
    for o in bpy.data.objects:
        if o.type == "MESH":
            while len(o.data.uv_layers) > 1: o.data.uv_layers.remove(o.data.uv_layers[1 if o.data.uv_layers[0].active else 0])
def draco_garanti(yol):
    """Blender'ın Draco kütüphanesi yoksa (bpy modülü) gltf-transform ile sıkıştır (akar3d.disa_aktar notu: npx @gltf-transform/cli draco)."""
    import struct, shutil, subprocess
    b_ = open(yol, "rb").read(); n_ = struct.unpack("<I", b_[12:16])[0]
    if "KHR_draco_mesh_compression" in b_[20:20 + n_].decode("utf-8", "ignore"): return "blender"
    gt_ = os.environ.get("EMIR_GLTF_TRANSFORM") or shutil.which("gltf-transform")
    if not gt_: return "YOK"
    subprocess.run([gt_, "draco", yol, yol], check=True, capture_output=True); return "gltf-transform"
tek_uv()
if YAZMA:
    rapor["glb_bayt"] = A.disa_aktar(EXPORT, draco=True); rapor["draco"] = draco_garanti(EXPORT); rapor["glb_bayt"] = os.path.getsize(EXPORT)
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.data.objects:
        if o.type == "MESH" and not o.name.startswith(("REF", "_")): o.select_set(True)
    kw = dict(filepath=EXPORT_SUNUM, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
    ortala(1)
    try: bpy.ops.export_scene.gltf(export_draco_mesh_compression_enable=True, **kw)
    except Exception: bpy.ops.export_scene.gltf(**kw)
    ortala(-1)
    draco_garanti(EXPORT_SUNUM); rapor["glb_sunum_bayt"] = os.path.getsize(EXPORT_SUNUM)
    rapor["glb_orijin"] = f"ana GLB: avlu ortası; sunum GLB: daire kaide merkezi ({K_MERKEZ.x:+.2f}; {K_MERKEZ.y:+.2f}) orijinde"
def glb_adlari(yol):
    import struct
    b_ = open(yol, "rb").read(); n_ = struct.unpack("<I", b_[12:16])[0]; j_ = json.loads(b_[20:20 + n_])
    return sorted(nd.get("name", "?") for nd in j_.get("nodes", []))
if YAZMA: rapor["glb_nesneleri"] = glb_adlari(EXPORT); rapor["glb_sunum_nesneleri"] = glb_adlari(EXPORT_SUNUM)
with open(os.path.join(KONTROL, "kontrol_rapor.json"), "w", encoding="utf-8") as fh: json.dump(rapor, fh, ensure_ascii=False, indent=1)
print("RAPOR", json.dumps(rapor, ensure_ascii=False), flush=True)

# ======================= render: genel standart §2 =======================
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = ORNEK; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.80, 0.80, 0.80, 1); bg.inputs[1].default_value = 1.0
sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = 1.25; sun.data.angle = math.radians(35); sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
def kamera(ad, loc, hedef, orto=None, lens=35, rot=None):
    cd = bpy.data.cameras.get(ad) or bpy.data.cameras.new(ad)
    if orto: cd.type = 'ORTHO'; cd.ortho_scale = orto
    else: cd.type = 'PERSP'; cd.lens = lens
    cd.clip_start = 0.1; cd.clip_end = 2000
    cam = bpy.data.objects.get(ad) or bpy.data.objects.new(ad, cd)
    if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
    cam.location = Vector(loc); cam.rotation_euler = rot if rot else (Vector(hedef) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    return cam
def render(cam, yol, res=(1400, 900), saydam=False, kaide_goster=True):
    sc.camera = cam; sc.render.resolution_x, sc.render.resolution_y = res; sc.render.film_transparent = saydam
    KAIDE.hide_render = SOKAK.hide_render = not kaide_goster
    sc.render.filepath = yol; bpy.ops.render.render(write_still=True)
def kamera_iso(ad, hedef, d, el_d, az_d, orto):
    el, az = math.radians(el_d), math.radians(az_d); t = Vector(hedef)
    return kamera(ad, t + Vector((d * math.cos(el) * math.cos(az), d * math.cos(el) * math.sin(az), d * math.sin(el))), t, orto=orto)
# ölçü çizgileri (yalnız render; Ulu v23 cizgi/yazi yöntemi). Ad '_olcu_*' → GLB'ye girmez.
def olcu_cizgi(a, b, z, ad, metin, ofs_yazi, renk="#C01818", boy=1.5):
    m = A.mat("_olcu" + renk[1:], renk, 0.9); a, b = Vector(a), Vector(b); d = b - a; L = d.length
    bpy.ops.mesh.primitive_cube_add(size=1.0, location=((a.x + b.x) / 2, (a.y + b.y) / 2, z)); o = bpy.context.active_object; o.name = "_olcu_" + ad
    o.scale = (L, 0.12, 0.05); o.rotation_euler = (0, 0, math.atan2(d.y, d.x)); o.data.materials.append(m)
    for p in (a, b):                                                     # uç çentikleri
        bpy.ops.mesh.primitive_cube_add(size=1.0, location=(p.x, p.y, z)); t_ = bpy.context.active_object; t_.name = "_olcu_" + ad + "_uc"
        t_.scale = (0.12, 1.4, 0.05); t_.rotation_euler = (0, 0, math.atan2(d.y, d.x)); t_.data.materials.append(m)
    cu = bpy.data.curves.new("_olcu_yazi_" + ad, 'FONT'); cu.body = metin; cu.size = boy; cu.align_x = 'CENTER'; cu.align_y = 'CENTER'
    ty = bpy.data.objects.new("_olcu_yazi_" + ad, cu); sc.collection.objects.link(ty); ty.data.materials.append(m)
    ty.location = ((a.x + b.x) / 2 + ofs_yazi[0], (a.y + b.y) / 2 + ofs_yazi[1], z + 0.1)
    ang = math.atan2(d.y, d.x); ty.rotation_euler = (0, 0, ang if abs(ang) < 2 else ang - math.pi)
def olculeri_kur():
    zt = P["mahya"] + 0.5
    olcu_cizgi((-OX, -OY - 4), (OX, -OY - 4), zt, "dx", "46,00 m (D–B)  E Vakıf 1983", (0, -1.6))
    olcu_cizgi((OX + 4, -OY), (OX + 4, OY), zt, "dy", "50,00 m (K–G)  E Vakıf 1983", (1.6, 0))
    olcu_cizgi((-AX, -2.0), (AX, -2.0), 1.0, "ax", "avlu 25,50 m  H √650", (0, -1.4), "#1848C0", 1.2)
    olcu_cizgi((2.0, -AY), (2.0, AY), 1.0, "ay", "25,50 m", (1.3, 0), "#1848C0", 1.2)
    olcu_cizgi((OX - P["kanat_x"], 6.0), (OX, 6.0), zt, "kx", "10,25", (0, 1.0), "#1848C0", 1.1)
    olcu_cizgi((-6.0, OY - P["kanat_y"]), (-6.0, OY), zt, "ky", "12,25", (-1.2, 0), "#1848C0", 1.1)
    olcu_cizgi((K_MERKEZ.x - K_R, -OY - 9.5), (K_MERKEZ.x + K_R, -OY - 9.5), ZS + 0.3, "kaide", f"daire kaide Ø {2 * K_R:.2f} m (en küçük çember R {K_R0:.2f} + 3 m)".replace(".", ","), (0, 1.5), "#505050", 1.3)
    cu = bpy.data.curves.new("_olcu_yazi_K", 'FONT'); cu.body = "K ↑"; cu.size = 2.4
    ty = bpy.data.objects.new("_olcu_yazi_K", cu); sc.collection.objects.link(ty); ty.data.materials.append(A.mat("_olcuC01818", "#C01818", 0.9))
    ty.location = (OX + 2, OY + 4, P["mahya"] + 0.6)
def olculeri_sil():
    for o in [o for o in bpy.data.objects if o.name.startswith("_olcu")]: bpy.data.objects.remove(o, do_unlink=True)

VARSAYILAN = {"SON": "havadan,havadan_vakif,ust_orto,dis_cephe,guney_ulucami,kuzey_sokak,avlu_ici,avlu_genel,guney_revak,yakin,yakin_sadirvan,yakin_figurler,yakin_giris_figur,yakin_agac,sunum,dort_yon", "C": "havadan,avlu_genel,avlu_ici,yakin_sadirvan,yakin_figurler,yakin_giris_figur", "A": "havadan,havadan_vakif,ust_orto,dis_cephe,guney_ulucami,kuzey_sokak", "B": "havadan,havadan_vakif,dis_cephe,guney_ulucami,kuzey_sokak,avlu_ici,guney_revak,yakin"}
RENDERLER = [r for r in (os.environ.get("EMIR_RENDER") or VARSAYILAN.get(ASAMA, "havadan")).split(",") if r]
KM = (K_MERKEZ.x, K_MERKEZ.y, 3.0)
if "havadan" in RENDERLER: render(kamera_iso("CAM_Havadan", KM, 260, 32, 225, 2.05 * K_R + 4), os.path.join(KONTROL, "havadan.png"), (1800, 1600))      # standart kamera (güneybatıdan, Ulu Cami tarafı)
if "havadan_vakif" in RENDERLER: render(kamera("CAM_Vakif", (-6.0, -50.0, 40.0), (7.0, 6.0, 1.0), lens=26), os.path.join(TMP, "havadan_vakif.png"), (1460, 1000))   # F vakif_1983_pdf176: Ulu Cami batı minaresinden kuzeydoğuya
if "ust_orto" in RENDERLER:
    olculeri_kur(); render(kamera("CAM_Ust", (K_MERKEZ.x, K_MERKEZ.y, 200), None, orto=2 * K_R + 6, rot=(0, 0, 0)), os.path.join(KONTROL, "ust_orto.png"), (1600, 1600)); olculeri_sil()
if "dis_cephe" in RENDERLER: render(kamera("CAM_Dis", (-16.0, -32.0, ZS + 1.6), (8.0, -25.0, ZS + 3.2), lens=17), os.path.join(TMP, "dis_cephe.png"), (1500, 1000))   # F 1578509543: güney cephe, güneybatı köşeden
if "guney_ulucami" in RENDERLER: render(kamera("CAM_Guney", (16.0, -32.0, ZS + 1.6), (-10.0, -25.0, ZS + 3.2), lens=17), os.path.join(TMP, "guney_ulucami.png"), (1500, 1000))   # F 1578509455: güney cephe, Ulu Cami doğu minaresi yanından
if "kuzey_sokak" in RENDERLER: render(kamera("CAM_Kuzey", (0.0, OY + 9.0, ZS + 1.6), (0.0, OY, ZS + 3.2), lens=20), os.path.join(TMP, "kuzey_sokak.png"), (1500, 1000))   # F Emir-Hani-1: kuzey (asıl giriş) sokaktan
if "avlu_genel" in RENDERLER: render(kamera("CAM_AvluGenel", (1.5, AY - 0.6, 8.6), (-0.5, -5.0, 0.6), lens=22), os.path.join(TMP, "avlu_genel.png"), (1600, 1200))   # F emirhan-bursa-ulucami2: kuzey üst revaktan güneye
if "yakin_sadirvan" in RENDERLER: render(kamera("CAM_SadYakin", (3.2, -3.4, 1.3), (0.0, 0.0, 0.4), lens=30), os.path.join(KONTROL, "yakin_sadirvan_taban.png"), (1300, 950))   # Ulu v24 hata 2 kontrolü
if "yakin_figurler" in RENDERLER: render(kamera("CAM_FigYakin", (6.5, -6.0, 2.0), (-1.0, 1.0, 0.9), lens=30), os.path.join(KONTROL, "yakin_figurler.png"), (1400, 1000))
if "yakin_giris_figur" in RENDERLER: render(kamera("CAM_GirFig", (5.5, OY + 8.0, ZS + 1.8), (0.0, OY + 1.5, ZS + 1.2), lens=28), os.path.join(KONTROL, "yakin_giris_figur.png"), (1400, 1000))
if "yakin_agac" in RENDERLER: render(kamera("CAM_AgacYakin", (-2.0, 1.5, 6.0), (-7.2, 6.4, 7.5), lens=32), os.path.join(KONTROL, "yakin_agac.png"), (1300, 950))   # yaprak dokusu (Orhan v06 yöntemi)
if "sunum" in RENDERLER:                                                     # 5 sunum açısı (Ulu render_v24 SUNUM düzeni), açık gri arka plan, kaideli
    _o = sc.cycles.samples; sc.cycles.samples = max(ORNEK, 48)
    for ad_, l_, t_, ln_ in (("sunum_01_guneybati", (-62.0, -70.0, 40.0), (0.0, 0.0, 3.0), 30), ("sunum_02_kuzey_giris", (14.0, OY + 27.0, 12.0), (0.0, OY, 6.0), 30),
                             ("sunum_03_kuzeydogu", (70.0, 62.0, 42.0), (0.0, 0.0, 3.0), 30), ("sunum_04_avlu", (-AX + 2.5, -AY + 2.5, 6.6), (5.0, 8.0, 3.6), 20),
                             ("sunum_05_sadirvan", (4.6, -6.6, 2.0), (0.0, 0.0, 1.0), 28)):
        render(kamera("CAM_" + ad_, l_, t_, lens=ln_), os.path.join(KONTROL, ad_ + ".png"), (1800, 1200))
    sc.cycles.samples = _o
if "dort_yon" in RENDERLER:                                                  # dört yönden ortografik (Ulu render_v24 düzeni): üst sıra kuzey, doğu; alt sıra güney, batı
    import numpy as np
    def _yukle(yol, h):
        im = bpy.data.images.load(yol); w0, h0 = im.size; a = np.array(im.pixels[:], dtype=np.float32).reshape(h0, w0, 4); bpy.data.images.remove(im)
        w = int(w0 * h / h0); ix = (np.arange(w) * (w0 / w)).astype(int); iy = (np.arange(h) * (h0 / h)).astype(int); r = a[iy][:, ix]; r[..., 3] = 1; return r
    tum = {}
    for ad_, d_ in (("Kuzey", (0, 1)), ("Dogu", (1, 0)), ("Guney", (0, -1)), ("Bati", (-1, 0))):
        render(kamera("CAM_Orto_" + ad_, (K_MERKEZ.x + d_[0] * 200, K_MERKEZ.y + d_[1] * 200, ZS + 2.0), (K_MERKEZ.x, K_MERKEZ.y, ZS + 2.0), orto=2 * K_R + 4), os.path.join(TMP, f"_dy_{ad_}.png"), (1000, 700))
        tum[ad_] = _yukle(os.path.join(TMP, f"_dy_{ad_}.png"), 700)
    ara = np.ones((700, 16, 4), np.float32); sat = np.ones((16, 2016, 4), np.float32)
    dy = np.concatenate([np.concatenate([tum["Guney"], ara, tum["Bati"]], 1), sat, np.concatenate([tum["Kuzey"], ara, tum["Dogu"]], 1)], 0)   # Blender satırları alttan başlar
    im_ = bpy.data.images.new("_dy", dy.shape[1], dy.shape[0], alpha=True); im_.pixels = dy.ravel(); im_.filepath_raw = os.path.join(KONTROL, "dort_yon.png"); im_.file_format = 'PNG'; im_.save(); bpy.data.images.remove(im_)
if "avlu_ici" in RENDERLER: render(kamera("CAM_Avlu", (AX - 1.2, -AY + 1.5, 6.4), (AX - 0.6, AY - 2.0, 4.6), lens=19), os.path.join(TMP, "avlu_ici.png"), (1500, 1000))   # F Emir-Hani-4: üst kat hizasından revak boyunca
if "guney_revak" in RENDERLER: render(kamera("CAM_GRevak", (0.0, 7.0, 2.6), (0.0, -AY, 3.6), lens=22), os.path.join(KONTROL, "guney_revak.png"), (1500, 1000))   # yarım daire alt kemerler (E Vakıf PDF 176)
if "yakin" in RENDERLER:
    for ad_, l_, t_, ln_ in (("yakin_revak_kose", (-AX + 4.0, -AY + 4.0, 2.2), (-AX, -AY, 3.6), 30), ("yakin_korkuluk", (3.0, AY - 3.5, 5.8), (1.8, AY + 0.3, 5.0), 30),
                             ("yakin_kapi_kuzey", (0.0, OY + 4.5, ZS + 1.4), (0.0, OY, ZS + 2.6), 26), ("yakin_gecit_ic", (0.0, RY - 1.0, P["alt_h"] + 1.6), (0.0, OY, P["alt_h"] + 1.0), 24),
                             ("yakin_kapi_guney", (0.0, -OY - 6.0, ZS + 1.6), (0.0, -OY, ZS + 2.2), 26), ("yakin_pencere_baca", (-12.0, -OY - 6.0, ZS + 2.0), (-14.0, -OY, ZS + 4.0), 28)):
        render(kamera("CAM_" + ad_, l_, t_, lens=ln_), os.path.join(KONTROL, ad_ + ".png"), (1300, 950))
bpy.ops.file.pack_all()
if YAZMA:
    os.makedirs(os.path.dirname(BLEND), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("BITTI", ASAMA, BLEND)
