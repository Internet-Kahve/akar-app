# AKAR · Orhan Bey Külliyesi · Orhan Bey Hamamı · v04 = v03 kopyası + güney giriş kapısı ayrıntısı (19 Ekim 2026, kullanıcı isteği: «kapıyı detaylandır, yazıyı ekle»).
#   Kaynak F Levha 90–91 (yurt2024_pdf306) ve Aydın 2017 foto 33 (aydin2017_pdf178): oval rozet pencere + radyal tuğla halka + ferforje şebeke,
#   polikarbon cam saçak + 4 ferforje konsol + önde kıvrımlı friz, siyah çerçeveli camlı kapı ve yan camlar, ışınsal kollu tepe camı,
#   siyah tabela «ESKİ AYNALI ÇARŞI» (altın harf), kırmızı «↓ COVERED BAZAAR ↓» levhası, iki duvar feneri, üzengi taşları, sağda metal levha
#   (yazısı okunmuyor: boş bırakıldı). Bina kütlesi, öteki nesneler ve sahne v03 ile aynı.
# v03 KÜTLE, KUBBE DİZİLİMİ, GİRİŞLER, DOKU, SAHNE (SONNET_REVIZYON_PLANI.md, 19 Ekim 2026)
#   Onay adımı A (§1–§2): plan Ayverdi'den (yurt2024_pdf220, 40,1 px/m = çubuk × 1,035; oda iç ölçüleri E ile ±%1), batı ucu Ayverdi'nin su deposu
#   şeridinde biter (Çetintaş'ın külhan odası çıkarıldı; kullanıcı 19 Ekim). Yükseklikler Ayverdi kesitinden (yurt2024_pdf223, kendi çubuğu
#   46 px/m; v01–v02'deki × 1,16 düzeltmesi hatalıydı, tepe 16,2 → 14,5); Çetintaş AB kesiti ve fotoğraflardaki kasnak sırası sayımı aynı
#   yüksekliği veriyor. Aydın 2017 Plan 13 taraması düşeyde ≈ 0,87 basık. Kadın soğukluğu kesiti yok: kasnak fotoğraftan (6 almaşık periyot), tepe T.
#   12 kubbe (2 büyük etekli + ılıklık + sıcaklık + ılıklık halveti + 4 erkek halveti + kadın tarafında 3 küçük).
#   Onay adımı B (§3): kadınlar girişi, pencereler, kasnak pencereleri.
#   Onay adımı C (§4–§5) + web araştırması (19 Ekim, kullanıcı onayı): alınlıklı giriş bloğu GÜNEYDE (sıcaklığın güney eyvanı üstünde; tepeden
#   foto envanter_c1_pdf105, Flickr «Kapalıçarşı Girişi», içeride aşağı inen merdiven, TDV «güney ve batı cephelerine iki kapı»); kuzeyde
#   Kapalı Çarşı sokağına açılan düz cepheli kemerli kapı + yuvarlak pencere; güneyde +3,3 m sokak seti; eyvan tonozları kaldırıldı (tepeden
#   fotoğrafta düz dam); kadın tarafının üç küçük kubbesi parapetli kurşun kırma dam üstünde (Levha 95, pdf104); küçük ve orta kubbelerde
#   metal çerçeveli cam külah (W Aydın PDF 70); beden duvarlarında testere dişi saçak / tuğla korniş (Levha 95, 98, 104–105, 110; TDV
#   «tuğla kirpi saçak»); dokular, daire kaide, ağaç, figürler. Eklenmeyenler: batı kapısı (biçimi kaynakta yok), fil gözleri (bugün
#   görünmüyor), su deposu tonozu (bugün modern dükkân çatısı altında).
# Girdi : ref/plan/yurt2024_pdf220_plan_ayverdi.png, yurt2024_pdf223_kesit_ayverdi.png, ref/foto/*, 3d/build/doku/*.png (doku_uret_v03.py),
#         3d/build/cevre_v03.py, eserler/_kutuphane/akar3d.py
# Çıktı : 3d/blend/orhan-bey-hamami_v04.blend, 3d/export/orhan-bey-hamami_v04.glb (kaidesiz), ..._v04_sunum.glb (kaide + set), 3d/kontrol/hamam_v04/
# Çalıştırma:
#   /Applications/Blender.app/Contents/MacOS/Blender -b --python docs/documents-context/eserler/orhan-bey-hamami/3d/build/build_hamam_v04.py
#   HAMAM_RENDER=A,B,C (varsayılan): onay adımlarının render'ları.
# Eksenler: +X = doğu, +Y = kuzey, +Z = yukarı. Orijin = Ayverdi planındaki duvar kutusunun ortası (çizim pikseli 904,5 / 979,5);
#   X = (904,5 − x) / 40,1 , Y = (y − 979,5) / 40,1 (çizimde kuzey aşağıda, doğu solda). z = 0 bugünkü iç zemin = kuzey ve doğu avlusu.
# Kaynak kodları: P rölöve/ölçekli çizim, E envanter cilt-1, W tez/makale, F fotoğraf, H hesap, T tahmin.
import sys, os, math, json, colorsys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 3, "_kutuphane"))); sys.path.insert(0, HERE)
import bpy, bmesh
import akar3d as A
import cevre_v03 as CV
from mathutils import Vector

SURUM = "hamam_v04"
AD = "orhan-bey-hamami"
URETIM = os.path.dirname(HERE)
KONTROL = os.path.join(URETIM, "kontrol", SURUM)
BLEND = os.path.join(URETIM, "blend", f"{AD}_v04.blend")
EXPORT = os.path.join(URETIM, "export", f"{AD}_v04.glb")
EXPORT_SUNUM = os.path.join(URETIM, "export", f"{AD}_v04_sunum.glb")
DOKU = os.path.join(HERE, "doku")

P = {
    # ================= PLAN (P Ayverdi, 40,1 px/m) =================
    "erkek_govde": (-10.55, 4.02, 2.39, 16.28),            # x0, x1, y0, y1; iç 12,07 × 11,85 (E 11,95 × 11,86)
    "kadin_govde": [(2.82, -1.97), (15.53, -1.97), (15.53, 10.6), (4.02, 10.6), (4.02, 2.39), (2.82, 2.39)],   # iç 10,35 × 10,40 (E 10,35)
    "alcak": [(-10.55, 2.39), (2.82, 2.39), (2.82, -1.97), (8.88, -1.97), (8.88, -15.0), (3.77, -15.0), (3.77, -18.5),
              (-15.74, -18.5), (-15.74, -4.11), (-10.55, -4.11)],   # batı ucu Ayverdi duvarı (su deposu şeridi dahil). Çetintaş'taki ikinci oda (külhan, X → −22) çıkarıldı:
                                                                     # Ayverdi «külhan bugün dükkân, özgün biçimi bilinmiyor» (W Aydın PDF 71), E «külhan yıkıldı»; kullanıcı kararı 19 Ekim
    # ================= YÜKSEKLİKLER (P Ayverdi kesiti, yurt2024_pdf223, kendi çubuğu 46 px/m; z = 0 bugünkü zemin) =================
    # Çubuk doğru: erkek soğukluğu 11,83 (E 11,86), sıcaklık 5,04 (W 5,0), ılıklık 6,26 (E 6,45). Çetintaş AB kesiti (E genişliğine
    # kalibre) aynı kotları veriyor (saçak 7,5, kubbe 13,6–14,6). Aydın 2017 Plan 13 taraması bunların ≈ 0,87'si (düşeyde basık);
    # fotoğraflar (kasnakta 5–6 almaşık periyot ≈ 2,8–3,6 m) yüksek olanı destekliyor → Plan 13 kotları × 1,15 (kullanıcı 19 Ekim).
    "govde_h": 5.3,            # P: kare gövde üstü (tromp kuşağı başı); sekizgen kasnak bunun üstünde
    "alcak_h": 4.9,            # P: sıcaklık ve ılıklık arasındaki düz dam
    # büyük kubbeler: merkez, kasnak yüzden yüze, kasnak üstü (kirpi saçak üstü), dış tepe, oturma çapı, fener tepesi
    "erkek": dict(c=(-3.25, 9.25), kw=13.5, zk=7.6, zt=14.5, otur=12.6, fener=15.2, etek=0.25),   # P: saçak 7,5, dış tepe 14,6, fener 15,15; oturma 12,6: kesitte dış kabuk omzu; etek 0,25: doğu eteği kadın kasnağına binmesin
    "kadin": dict(c=(9.65, 4.3), kw=11.6, zk=8.3, zt=13.2, otur=11.2, fener=13.8, etek=0.35),     # F: kasnakta 6 periyot + kirpi (envanter_c1_pdf104); Levha 96: kasnak ≈ 0,55 × giriş bloğu yüksekliği → saçak 8,3; kubbe yükselişi T;
                                                                                                  #   merkez iç ortadan (9,27) 0,38 doğuda, kasnak 11,6: kirpi erkek eteğine girmesin
    # orta kubbeler (P Ayverdi kesiti)
    "iliklik": dict(c=(-6.15, -0.85), r=3.4, kasnak=(4.9, 5.2), zt=7.9, kulah=0.5),   # P: iç Ø 6,6 (E); E «yuvarlak kasnaklı»; W Aydın PDF 70: aydınlık deliğinde cam külah
    "sicaklik": dict(c=(-3.82, -11.27), kw=5.7, kasnak=(4.9, 5.25), r=2.75, zt=8.0, kulah=0.5),   # P: iç Ø 5,0 (W Yurt); sekizgen kasnak (W)
    # küçük kubbeler (merkez P Ayverdi; tepe T)
    "kucuk": [("Iliklik_Halveti", (0.05, -2.24), 2.0, 6.8),          # P: iç Ø 3,55–3,80 (W Yurt 3,80); tepe T
              ("Halvet_KB", (-8.12, -6.83), 1.85, 6.6), ("Halvet_KD", (0.72, -6.83), 1.85, 6.6),     # P: ≈ 3,40 × 3,60 (E); tepe T
              ("Halvet_GB", (-8.10, -15.57), 1.85, 6.6), ("Halvet_GD", (0.73, -15.55), 1.85, 6.6)],
    "kucuk_kasnak": 0.20, "kucuk_dudak": 0.15, "kulah_r": 0.42,     # W Aydın PDF 70: metal çerçeveli cam külah; F pdf104: Ø ≈ 0,8
    # kadın tarafı: üç küçük kubbe parapetli kurşun kırma dam üstünde (F envanter_c1_pdf104, pdf105, Levha 95)
    "kadin_kucuk": [("Kadin_Iliklik", (5.39, -3.82)), ("Kadin_Halvet_1", (5.76, -8.03)), ("Kadin_Halvet_2", (5.76, -12.37))],   # P merkez; Ø 3,50 (W Aydın PDF 69)
    "kadin_kucuk_r": 1.9, "kadin_kucuk_kasnak": (4.9, 5.5), "kadin_kucuk_tepe": 6.9,              # T: kasnak dam sırtının üstüne çıkar
    "kadin_dam": (3.6, 8.86, -14.98, -1.99), "kadin_dam_sirt": 5.45,                              # F: tepeden 5,6 m bant; sırt T
    "parapet_h": 5.6, "parapet_t": 0.2,                                                           # F Levha 95: doğu duvarı parapet, kubbeler arkasında
    # saçaklar (F Levha 95, 98, 104–105, 110)
    "sacak_tek": [(-0.002, -0.32), (0.04, -0.32), (0.04, -0.22), (0.10, -0.22), (0.10, 0.0), (-0.002, 0.0)],   # kare gövde: 1 sıra testere dişi
    "sacak_tek_m": ["tas", "kirpi", "kirpi", "kirpi", "cati", "tas"],
    "korn": [(-0.002, -0.25), (0.08, -0.25), (0.08, 0.02), (-0.002, 0.02)], "korn_m": ["tugla", "tugla", "cati", "tugla"],   # alçak duvar: tuğla korniş + kurşun kenar
    "D_kubbe_sira": 6,
    # ================= SAHNE (genel standart §1; kullanıcı 19 Ekim: güneyde sokak seti) =================
    "set_h": 3.3,              # P-oran: Çetintaş AB kesiti güney sokak kotu (aydin2017_pdf099), F Levha 92–93; E «14 basamak»
    "merdiven": (3.77, 5.27, -19.2, 15),   # F Levha 94: doğu avlusundan sete çıkan merdiven (x0, x1, alt ucu Y, basamak sayısı); T
    "agac": (-9.6, -20.6),     # F envanter_c1_pdf105: tek büyük ağaç güney duvarının batı ucunda
    "doseme": [(8.88, 15.53, -16.0, -4.97), (4.02, 15.53, 10.6, 16.28)],   # F pdf105: doğu (tuğla döşeli) ve kuzey avlusu
    "kaide_pay": 3.0,
}

def R4(x0, x1, y0, y1): return [Vector((x0, y0)), Vector((x1, y0)), Vector((x1, y1)), Vector((x0, y1))]
def V2(q): return Vector(q)

PALET_RAPOR = {}
def mt(k, n, hx, rough=0.70, metal=0.0, not_=""):
    PALET_RAPOR[n] = {"hex": hx, "rough": rough, "metal": metal, "not": not_}
    return A.mat(n, hx, rough, metal)
M = {
    "duvar": mt("duvar", "Duvar", "#C8B49A", 0.70, 0.0, "kaba yontu / moloz taş beden, pembemsi horasan derz; hatıl yok (F Levha 95, 98, 104; doku duvar_moloz.png)"),
    "kasnak": mt("kasnak", "Kasnak", "#CFA986", 0.70, 0.0, "1 kesme taş + 3 tuğla almaşık (E PDF 106; doku kasnak_almasik.png, ortalama #D1A885)"),
    "kirpi": mt("kirpi", "Kirpi", "#C0683F", 0.70, 0.0, "testere dişi tuğla saçak (doku kirpi.png)"),
    "tas": mt("tas", "Tas", "#D8C6A2", 0.70, 0.0, "kesme taş silme"),
    "kubbe": mt("kubbe", "Kubbe", "#858E94", 0.55, 0.20, "kurşun dilimli (doku kubbe_dilim_v03.png); kullanıcı kararı (cami v06, 19 Ekim): #C3C9CD çok açık → #858E94"),
    "cati": mt("cati", "Cati", "#858E94", 0.55, 0.20, "düz kurşun dam, kırma dam, fener"),
    "kulah": mt("kulah", "Cam_Kulah", "#6E787E", 0.35, 0.40, "aydınlık deliklerinde metal çerçeveli cam külah (W Aydın PDF 70); küçük yüzey"),
    "tugla": mt("tugla", "Tugla", "#C0683F", 0.70, 0.0, "kemer, kemer halkası, korniş"),
    "kufeki": mt("kufeki", "Kufeki", "#E6D8BA", 0.70, 0.0, "kemer taşlarında küfeki (E PDF 106)"),
    "mermer": mt("mermer", "Mermer", "#ECEAE4", 0.40, 0.0, "kadınlar kapısı söveleri (F Levha 97)"),
    "kapi": mt("kapi", "Kapi", "#7A5134", 0.75, 0.0, "kapı kanatları, pencere doğraması"),
    "pencere": mt("pencere", "Pencere", "#3E4A55", 0.30, 0.0, "cam; saf siyah yasak"),
    "demir": mt("demir", "Demir", "#36413F", 0.60, 0.30, "yuvarlak pencere şebekesi"),
    "sebeke": mt("sebeke", "Sebeke", "#ECEAE4", 0.80, 0.0, "kasnak pencerelerinde delikli alçı şebeke, alpha-cutout (doku sebeke_alfa.png; F Levha 96, 98)"),
    "avlu": mt("avlu", "Avlu", "#B3A590", 0.85, 0.0, "avlu ve sokak taş döşemesi (doku avlu.png; standart §1)"),
    # v04 güney kapısı (F Levha 90, Aydın foto 33); küçük yüzeyler, hepsi Duz'a toplanır
    "altin": mt("altin", "Altin_Yazi", "#C9A54A", 0.45, 0.30, "tabela harfleri (F Levha 90)"),
    "beyaz_yazi": mt("beyaz_yazi", "Beyaz_Yazi", "#F1EEE6", 0.60, 0.0, "COVERED BAZAAR harfleri"),
    "tabela_k": mt("tabela_k", "Tabela_Kirmizi", "#A8322B", 0.60, 0.0, "COVERED BAZAAR levhası"),
    "sacak_cam": mt("sacak_cam", "Sacak_Cam", "#E3E7E6", 0.30, 0.0, "kapı üstü polikarbon saçak (Aydın foto 33: süt beyazı)"),
    "fener_cam": mt("fener_cam", "Fener_Cam", "#F3EBC8", 0.30, 0.0, "duvar feneri camı"),
    "koyu_cam": mt("koyu_cam", "Koyu_Cam", "#20272C", 0.25, 0.0, "kapı, tepe camı ve rozet pencere camı: içerisi karanlık, siyah kasa ve şebeke seçilsin (F Levha 90–91); saf siyah değil"),
    "levha": mt("levha", "Levha", "#7C8A84", 0.50, 0.30, "kapı sağındaki metal levha (yazısı okunmuyor, boş)"),
    "duz": mt("duz", "Duz", "#FFFFFF", 0.70, 0.0, "TOPLU düz renk malzemesi: renk köşe renginden (TINT × AO); tuğla, taş, küfeki, mermer, kapı, cam, demir, cam külah, figür ve ağaç renkleri (draw call ≤ 40; cami v06 yöntemi)"),
}
def doku_bagla(m, dosya, alfa=False):
    nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tx = nt.nodes.new("ShaderNodeTexImage"); tx.image = bpy.data.images.load(os.path.join(DOKU, dosya), check_existing=True)
    tx.name = "DOKU"; nt.links.new(tx.outputs["Color"], bsdf.inputs["Base Color"])
    if alfa:   # alpha-cutout: delikler şeffaf, çift yüzlü; glTF alphaMode MASK
        nt.links.new(tx.outputs["Alpha"], bsdf.inputs["Alpha"]); m.blend_method = 'CLIP'; m.alpha_threshold = 0.5; m.use_backface_culling = False
        tx.interpolation = 'Closest'
DOKU_DOSYA = [("duvar", "duvar_moloz.png", False), ("kasnak", "kasnak_almasik.png", False), ("kirpi", "kirpi.png", False),
              ("kubbe", "kubbe_dilim_v03.png", False), ("sebeke", "sebeke_alfa.png", True), ("avlu", "avlu.png", False)]
DOKULU = [M[k] for k, _, _ in DOKU_DOSYA]
for k, f, a_ in DOKU_DOSYA: doku_bagla(M[k], f, a_)

A.temizle()

# ================= KÜTLE =================
def prizma(ad, poly, z1, top=None):
    g = A.G(ad); g.prism([V2(q) for q in poly], 0.0, z1, M["duvar"], top or M["cati"]); return g
x0, x1, y0, y1 = P["erkek_govde"]
prizma("Hamam_Sogukluk_Erkek", R4(x0, x1, y0, y1), P["govde_h"]).obj()
prizma("Hamam_Sogukluk_Kadin", P["kadin_govde"], P["govde_h"]).obj()
prizma("Hamam_Sicaklik", P["alcak"], P["alcak_h"]).obj()

# ================= SAÇAK PROFİLLERİ (süpürme) =================
KP = [(-0.002, -0.48), (0.06, -0.48), (0.06, -0.40), (0.08, -0.40), (0.08, -0.20), (0.16, -0.20), (0.16, 0.0), (-0.002, 0.0)]   # kasnak: 2 sıra testere dişi
KP_M = ["kasnak", "tas", "kirpi", "kirpi", "kirpi", "kirpi", "kirpi", "kasnak"]
def supur(g, path, kapali, top, prof, mats, ext0=0.0, ext1=0.0):
    """Profili (dışa öteleme d, kot farkı dz) `path` boyunca süpürür (dışarısı yolun sağı; ccw dış hat). Köşeler gönye; açık uçlar kapak."""
    pts = path; n = len(pts)
    def nrm(a, b_): t = (b_ - a).normalized(); return Vector((t.y, -t.x)), t
    def off(i, d):
        p = pts[i]
        if kapali or 0 < i < n - 1:
            n0, _ = nrm(pts[i - 1], p); n1, _ = nrm(p, pts[(i + 1) % n]); return p + (n0 + n1) / (1 + n0.dot(n1)) * d
        if i == 0: n1, t = nrm(p, pts[1]); return p + n1 * d - t * ext0
        n0, t = nrm(pts[-2], p); return p + n0 * d + t * ext1
    rings = [[g.V(off(i, d), top + dz) for i in range(n)] for d, dz in prof]; m = len(prof)
    for k in range(m):
        k2 = (k + 1) % m
        for i in range(n if kapali else n - 1):
            j = (i + 1) % n; g.F([rings[k][i], rings[k][j], rings[k2][j], rings[k2][i]], M[mats[k]])
    if not kapali:
        g.F([rings[k][0] for k in range(m)][::-1], M[mats[0]]); g.F([rings[k][n - 1] for k in range(m)], M[mats[0]])

g = A.G("Sacak")
supur(g, A.ccw(R4(x0, x1, y0, y1)), True, P["govde_h"], P["sacak_tek"], P["sacak_tek_m"])                     # erkek kare gövde (F Levha 110)
supur(g, A.ccw([V2(q) for q in P["kadin_govde"]]), True, P["govde_h"], P["sacak_tek"], P["sacak_tek_m"])      # kadın kare gövde (F Levha 104–105)
_al = A.ccw([V2(q) for q in P["alcak"]])                     # alçak kütlenin dış kenarları: batı → güney → güneydoğu (iç kenarlar ve kadın tarafı parapeti hariç)
_i0 = next(i for i, q in enumerate(_al) if (q - Vector((-10.55, 2.39))).length < 1e-6)
_yol = [_al[(_i0 + k) % len(_al)] for k in range(6)]          # (−10,55; 2,39) → … → (3,77; −15,0)
supur(g, _yol, False, P["alcak_h"], P["korn"], P["korn_m"])
g.obj()

# ================= BÜYÜK KUBBELER (cami v06 etekli kubbe: kasnak + kirpi + sekizgen kurşun etek + kubbe) =================
def okt(c, ap):
    R = ap / math.cos(math.pi / 8); return [c + Vector((R * math.cos(math.radians(22.5 + 45 * i)), R * math.sin(math.radians(22.5 + 45 * i)))) for i in range(8)]
KUBBE = {}; KUBBE_NESNE = {}; DOME_OLCU = {}
ETEK_D, ETEK_T, ETEK_EG = 0.45, 0.10, math.radians(22)
def etekli_kubbe(g, c, kw, zk, zt, otur, ad, segs=24, rings=8, etek_d=ETEK_D):
    """Kasnak üstü kirpi + sekizgen düz yüzlü kurşun etek + basık küre kubbe (Orhan Bey Camii v06 etekli_kubbe ile aynı kurgu)."""
    ap_l = kw / 2 + etek_d; a = otur / 2; run = ap_l - a; zl = zk + ETEK_T; zf = zl + run * math.tan(ETEK_EG); rise = zt - zf; zb = zk - 0.002
    supur(g, okt(c, kw / 2), True, zk, KP, KP_M)
    Lb = [g.V(q, zb) for q in okt(c, ap_l)]; Lt = [g.V(q, zl) for q in okt(c, ap_l)]; Tp = [g.V(q, zf) for q in okt(c, a)]
    for i in range(8):
        j = (i + 1) % 8; g.F([Lb[i], Lb[j], Lt[j], Lt[i]], M["cati"]); g.F([Lt[i], Lt[j], Tp[j], Tp[i]], M["cati"])
    g.F(Lb[::-1], M["cati"])
    st = 360 / segs; k3 = segs // 8
    ang = lambda m: math.radians(22.5 + st * m)
    Cc = [g.V(c + Vector((a * math.cos(ang(k)), a * math.sin(ang(k)))), zf) for k in range(segs)]
    for i in range(8):
        g.F([Tp[i], Tp[(i + 1) % 8]] + [Cc[(k3 * i + k3 - m) % segs] for m in range(k3 + 1)], M["cati"])
    Rs = (a * a + rise * rise) / (2 * rise); am = math.atan2(a, Rs - rise); prev = Cc
    for k in range(1, rings + 1):
        al = am * (rings - k) / rings
        if k < rings:
            r_ = Rs * math.sin(al); z_ = zf + Rs * (math.cos(al) - math.cos(am))
            ring = [g.V(c + Vector((r_ * math.cos(ang(m)), r_ * math.sin(ang(m)))), z_) for m in range(segs)]
            for m in range(segs): g.F([prev[m], prev[(m + 1) % segs], ring[(m + 1) % segs], ring[m]], M["kubbe"])
            prev = ring
        else:
            ap_ = g.V(c, zt)
            for m in range(segs): g.F([prev[m], prev[(m + 1) % segs], ap_], M["kubbe"])
    DOME_OLCU[ad] = {"merkez_xy_m": [round(c.x, 2), round(c.y, 2)], "kasnak_yuzden_yuze_m": kw, "kasnak_ustu_m": zk, "etek_dudak_yuzden_yuze_m": round(2 * ap_l, 2),
                     "oturma_cap_m": otur, "oturma_kotu_m": round(zf, 2), "tepe_m": zt, "yukseklik_yaricap_orani": round(rise / a, 2)}
    KUBBE.setdefault(ad, []).append((c, zf, rise, segs)); KUBBE_NESNE[ad] = g.name

GF = A.G("Fenerler")       # bütün fener ve cam külahlar tek nesnede (draw call)
def fener_buyuk(c, zt, ztop, r=0.55):
    """E PDF 107 «aydınlık feneri»; F pdf104: kısa sekizgen gövde + basık kurşun külah."""
    GF.lathe(c, [(r, zt - 0.25), (r, ztop - 0.25), (r + 0.12, ztop - 0.25), (0, ztop)], 8, [M["cati"]] * 3)
def cam_kulah(c, zt, r):
    """W Aydın PDF 70: «kubbelerde yer alan aydınlık deliklere metal çerçeveli cam külahlar eklenmiştir»; F pdf104, Levha 95: sivri külah + uç."""
    GF.lathe(c, [(r, zt - 0.12), (r, zt + 0.02), (0.07, zt + 0.55 * r / 0.42), (0.07, zt + 0.62 * r / 0.42), (0, zt + 0.68 * r / 0.42)], 8, [M["kulah"]] * 4)

for ad, k in (("Kubbe_Sogukluk_Erkek", P["erkek"]), ("Kubbe_Sogukluk_Kadin", P["kadin"])):
    g = A.G(ad); c = V2(k["c"]); q = okt(c, k["kw"] / 2)
    g.prism(q, P["govde_h"] - 0.002, k["zk"], M["kasnak"], M["kasnak"])
    etekli_kubbe(g, c, k["kw"], k["zk"], k["zt"], k["otur"], ad, etek_d=k.get("etek", ETEK_D)); g.obj()
    fener_buyuk(c, k["zt"], k["fener"])

# ================= ORTA VE KÜÇÜK KUBBELER (dönel profil) =================
def kure_profil(r, zb, zt, n=6):
    """Taban yarıçapı r, taban kotu zb, tepe zt olan basık küre kesiti (r, z) listesi; taban → tepe (r = 0)."""
    rise = zt - zb; Rs = (r * r + rise * rise) / (2 * rise); am = math.atan2(r, Rs - rise)
    return [(Rs * math.sin(am * (n - k) / n), zb + Rs * (math.cos(am * (n - k) / n) - math.cos(am))) for k in range(n)] + [(0.0, zt)]
def donel_kubbe(g, ad, c, r, z0, zk, zt, segs=16, dudak=0.0, kasnak_m=None):
    """Silindir kasnak (z0 → zk) + kurşun etek dudağı + kubbe; tek kapalı dönel hacim."""
    prof = [(r, z0 - 0.002), (r, zk)]
    if dudak: prof += [(r + dudak, zk), (r + dudak, zk + 0.10), (r, zk + 0.10)]
    kub = kure_profil(r, prof[-1][1], zt)
    prof += kub[1:]
    mats = [kasnak_m or M["kasnak"]] + ([M["cati"]] * 3 if dudak else []) + [M["kubbe"]] * (len(prof) - (5 if dudak else 2))
    g.lathe(c, prof, segs, mats)
    zb_ = prof[-len(kub)][1]
    KUBBE.setdefault(ad, []).append((c, zb_, zt - zb_, segs)); KUBBE_NESNE[ad] = g.name
    DOME_OLCU[ad] = {"merkez_xy_m": [round(c.x, 2), round(c.y, 2)], "dis_cap_m": round(2 * r, 2), "kasnak_m": [z0, zk], "tepe_m": zt}

k = P["iliklik"]; g = A.G("Kubbe_Iliklik"); c = V2(k["c"])
donel_kubbe(g, "Kubbe_Iliklik", c, k["r"], k["kasnak"][0], k["kasnak"][1], k["zt"], segs=24, dudak=0.12); g.obj(); cam_kulah(c, k["zt"], k["kulah"])
k = P["sicaklik"]; g = A.G("Kubbe_Sicaklik"); c = V2(k["c"])
g.prism(okt(c, k["kw"] / 2), k["kasnak"][0] - 0.002, k["kasnak"][1], M["kasnak"], M["kasnak"])          # W Yurt: sekizgen kasnak
donel_kubbe(g, "Kubbe_Sicaklik", c, k["r"], k["kasnak"][1] - 0.002, k["kasnak"][1] + 0.05, k["zt"], segs=24, dudak=0.12)
g.obj(); cam_kulah(c, k["zt"], k["kulah"])
g = A.G("Kubbe_Halvetler")   # erkek tarafındaki 5 küçük kubbe tek nesnede
for ad, cc, r, zt in P["kucuk"]:
    c = V2(cc); donel_kubbe(g, "Kubbe_" + ad, c, r, P["alcak_h"], P["alcak_h"] + P["kucuk_kasnak"], zt, segs=16, dudak=P["kucuk_dudak"])
    cam_kulah(c, zt, P["kulah_r"])
g.obj()

# --- Kubbe_Kadin_Halvetler: kadın tarafının üç küçük kubbesi + kurşun kırma dam + doğu/güney parapeti (F pdf104, pdf105, Levha 95) ---
def kirma(g, p4, z0, z1, m):
    """Dikdörtgen üstüne kırma dam (sırt uzun kenar boyunca; Orhan Bey Camii v06 ile aynı) + alt yüz."""
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
    g.F(b[::-1], m)
g = A.G("Kubbe_Kadin_Halvetler")
kirma(g, R4(*P["kadin_dam"]), P["alcak_h"] - 0.002, P["kadin_dam_sirt"], M["cati"])
z0k, zkk = P["kadin_kucuk_kasnak"]
for ad, cc in P["kadin_kucuk"]:
    c = V2(cc); donel_kubbe(g, "Kubbe_" + ad, c, P["kadin_kucuk_r"], z0k, zkk, P["kadin_kucuk_tepe"], segs=16, dudak=P["kucuk_dudak"])
    cam_kulah(c, P["kadin_kucuk_tepe"], P["kulah_r"])
pt_, ph_ = P["parapet_t"], P["parapet_h"]
g.prism(R4(8.88 - pt_, 8.88, -15.0, -1.97 - 0.002), P["alcak_h"] - 0.002, ph_, M["duvar"], M["cati"])                       # doğu parapeti
g.prism(R4(P["kadin_dam"][0], 8.88 - pt_ - 0.002, -15.0, -15.0 + pt_), P["alcak_h"] - 0.002, ph_, M["duvar"], M["cati"])   # güney parapeti
g.obj()
GF.obj()

# ================= CEPHE ÖĞELERİ =================
def panel(g, O, T, N, poly, o0, o1, m, m_yan=None, uv=False):
    """Düşey düzlemde (O + T·s, z) kapalı levha; N yönünde o0 → o1 kalınlık (cami v06 ile aynı). uv=True: ön ve arka yüze 0..1 UV."""
    Pt = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
    a = [g.bm.verts.new(Pt(s, z, o0)) for s, z in poly]; b = [g.bm.verts.new(Pt(s, z, o1)) for s, z in poly]
    on = g.F(b, m); ar = g.F(a[::-1], m if uv else (m_yan or m))
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g.F([a[i], a[j], b[j], b[i]], m_yan or m)
    if uv:
        uvl = g.bm.loops.layers.uv.verify()
        s0_, s1_ = min(s for s, _ in poly), max(s for s, _ in poly); z0_, z1_ = min(z for _, z in poly), max(z for _, z in poly)
        for f_, vs in ((on, b), (ar, a)):
            if not f_: continue
            for l in f_.loops:
                s, z = poly[vs.index(l.vert)]; l[uvl].uv = ((s - s0_) / (s1_ - s0_), (z - z0_) / (z1_ - z0_))
def yuvarlak(w, z0, zs, n=8):
    """Yuvarlak kemerli açıklık (s, z); zs üzengi."""
    return [(-w / 2, z0), (w / 2, z0)] + [((w / 2) * math.cos(math.pi * k / n), zs + (w / 2) * math.sin(math.pi * k / n)) for k in range(n + 1)][:-1] + [(-w / 2, zs)]
def daire(cz, r, n=16, s0=0.0): return [(s0 + r * math.cos(2 * math.pi * k / n), cz + r * math.sin(2 * math.pi * k / n)) for k in range(n)]
def yuz(O, T, N): return (V2(O), V2(T), V2(N))
def at(f, s): O, T, N = f; return (O + T * s, T, N)
def kemer_taslari(g, f, s, zs, r0, r1, desen, o0, o1, a0=0.0, a1=math.pi):
    """Radyal kemer taşları (yay a0 → a1, iç r0, dış r1); desen: her taşın malzeme anahtarı, sırayla tekrar eder."""
    O, T, N = at(f, s); n = len(desen); dz_ = 0.0015 / max(r0, 0.05)     # 1,5 mm derz: komşu taşlar köşe paylaşmasın (manifold)
    for i in range(n):
        b0 = a0 + (a1 - a0) * i / n + dz_; b1 = a0 + (a1 - a0) * (i + 1) / n - dz_; bm = (b0 + b1) / 2
        poly = [(r0 * math.cos(b0), zs + r0 * math.sin(b0)), (r0 * math.cos(b1), zs + r0 * math.sin(b1)),
                (r1 * math.cos(b1), zs + r1 * math.sin(b1)), (r1 * math.cos(bm), zs + r1 * math.sin(bm)), (r1 * math.cos(b0), zs + r1 * math.sin(b0))]
        panel(g, O, T, N, poly, o0, o1, M[desen[i]])
def sebeke_demir(g, f, s, cz, r, o0, o1, kol=8, t=0.035):
    """Yuvarlak pencerede demir şebeke: kollar + dış halka (gerçek çubuk; plan §6.2: boyalı daire yok)."""
    O, T, N = at(f, s)
    for k in range(kol):
        a = math.pi * k / kol; ca, sa = math.cos(a), math.sin(a); nx, nz = -sa * t, ca * t
        panel(g, O, T, N, [(-r * ca - nx, cz - r * sa - nz), (r * ca - nx, cz + r * sa - nz), (r * ca + nx, cz + r * sa + nz), (-r * ca + nx, cz - r * sa + nz)], o0, o1, M["demir"])
    kemer_taslari(g, f, s, cz, r * 0.86, r, ["demir"] * 16, o0, o1, 0.0, 2 * math.pi)
    kemer_taslari(g, f, s, cz, r * 0.30, r * 0.40, ["demir"] * 8, o0, o1, 0.0, 2 * math.pi)

# --- Hamam_Giris: güneydeki alınlıklı giriş bloğu, sokak setinin üstünde (F Levha 90–91, envanter_c1_pdf105 tepeden, Flickr «Kapalıçarşı Girişi»;
#     ölçü: tepeden fotoğrafta 5,0 × 5,4 m (27,8 px/m), cephe oranı Levha 90'dan: saçak 0,82, tepe 1,0, kapı 0,47, kemer tepesi 0,59, pencere 0,78 × genişlik) ---
P.update({"G_c_x": -3.6, "G_w": 5.2, "G_on": -18.9, "G_arka": -14.3,       # F: tepeden kutu X −6,1…−1,1; arka yüz sıcaklık kasnağının önünde (kasnak −14,12)
          "G_sacak": 4.26, "G_tepe": 5.2, "G_kapi_w": 2.45, "G_kapi_tepe": 3.06, "G_kemer_b": 0.40,   # sokak kotundan (set_h); E: 3 tuğla + 1 küfeki
          "G_pen_z": 4.05, "G_pen_r": 0.43, "G_pen_halka": 0.26,
          "G_ortu_t": 0.14, "G_ortu_tasma": 0.25, "G_silme": 0.15})
zS = P["set_h"]; gx = P["G_c_x"]; hw = P["G_w"] / 2; yF, yB = P["G_on"], P["G_arka"]; yW = P["alcak"][7][1]
eave, tepe = zS + P["G_sacak"], zS + P["G_tepe"]; sl = (tepe - eave) / hw
g = A.G("Hamam_Giris")
def besgen(g, ya, yb, zb_):
    kesit = [(-hw, zb_), (hw, zb_), (hw, eave), (0.0, tepe), (-hw, eave)]
    r0 = [g.V(Vector((gx + x, ya)), z) for x, z in kesit]; r1 = [g.V(Vector((gx + x, yb)), z) for x, z in kesit]
    for i in range(5):
        j = (i + 1) % 5; g.F([r0[i], r0[j], r1[j], r1[i]], M["cati"] if i in (2, 3) else M["kasnak"])
    g.F(r0[::-1], M["kasnak"]); g.F(r1, M["kasnak"])
besgen(g, yF, yW - 0.002, 0.0)                      # ön dilim: güney duvarının dışında, set içine gömülü kısmı dahil zemine iner
besgen(g, yW, yB, P["alcak_h"] - 0.002)             # arka gövde: alçak damın üstünde
zb = lambda x: tepe - sl * abs(x); t_, ot = P["G_ortu_tasma"], P["G_ortu_t"]
ortu = [(-hw - t_, zb(hw + t_)), (0.0, tepe), (hw + t_, zb(hw + t_)), (hw + t_, zb(hw + t_) + ot), (0.0, tepe + ot), (-hw - t_, zb(hw + t_) + ot)]
q0 = [g.V(Vector((gx + x, yB)), z) for x, z in ortu]; q1 = [g.V(Vector((gx + x, yF - t_)), z) for x, z in ortu]
for i in range(6):
    j = (i + 1) % 6; g.F([q0[i], q0[j], q1[j], q1[i]], M["cati"])
g.F(q0[::-1], M["cati"]); g.F(q1, M["cati"])
fG = yuz((gx, yF), (-1, 0), (0, -1))                # güney yüzü, dışarı −Y; s = −(X − gx)
for k, o1_ in enumerate((0.06, 0.03)):              # alınlık kenarında iki sıra dişli tuğla silme
    a_, b_ = k * P["G_silme"] + 0.002 * k, (k + 1) * P["G_silme"]
    panel(g, *at(fG, 0.0), [(-hw, zb(hw) - a_), (0.0, tepe - a_), (hw, zb(hw) - a_), (hw, zb(hw) - b_), (0.0, tepe - b_), (-hw, zb(hw) - b_)], -0.002, o1_, M["tugla"])
kw_, kb_ = P["G_kapi_w"], P["G_kemer_b"]; zs = zS + P["G_kapi_tepe"] - kw_ / 2
kemer_taslari(g, fG, 0.0, zs, kw_ / 2, kw_ / 2 + kb_, ["tugla", "tugla", "tugla", "kufeki"] * 6 + ["tugla"] * 3, -0.002, 0.05)   # F Levha 90

# --- v04: güney kapısı ayrıntısı (F Levha 90–91, Aydın 2017 foto 33). Ölçüler Levha 90'dan, 74,6 px/m (cephe 5,2 m = 388 px); z sokak kotundan ---
P.update({"G_pen_r": 0.27, "G_pen_halka": 0.15, "G_pen_kx": 1.67,          # F Levha 90–91: rozet pencere OVAL (cam 0,90 × 0,54; halka ≈ 0,15 dikine tuğla)
          "G_tabela": (1.45, 1.835), "G_kayit": (0.0, 0.45, 0.85, 1.20),     # F: siyah tabela bandı tabanı 1,45, üstü üzengi; kapı yatay kayıtları
          "G_dikme": (0.0, 0.46, 0.92, 1.19),                                 # F: orta, kanat ortası, kanat / yan cam, kasa dikmeleri (±s)
          "G_sacak_z": (3.50, 3.28), "G_sacak_d": 0.95, "G_sacak_w": 3.7,    # F: saçak duvarda 3,50, önde 3,28 (Levha 90: 3,24–3,49); derinlik T (Aydın foto 33 ≈ 1 m)
          "G_konsol": (1.48, 0.48), "G_konsol_alt": (2.55, 3.05),            # F Levha 90: konsollar x 385/460/530/605 → s ±1,48, ±0,48; dış konsol daha uzun (Aydın foto 33)
          "G_fener_s": 1.38, "G_fener_z": (1.42, 1.62), "G_levha": (-2.25, -1.72, 2.22, 2.50)})   # F: fenerler üzengi taşlarının altında; levha sağda (doğu)
def cubuk(g, f, a, b, t, o0, o1, m):
    """(s, z) düzleminde a → b, t genişliğinde çubuk."""
    d = Vector((b[0] - a[0], b[1] - a[1])); d.normalize(); n = Vector((-d.y, d.x)) * (t / 2)
    panel(g, *at(f, 0.0), [(a[0] - n.x, a[1] - n.y), (b[0] - n.x, b[1] - n.y), (b[0] + n.x, b[1] + n.y), (a[0] + n.x, a[1] + n.y)], o0, o1, m)
def elips(kx, fn, *a, **kw):
    """fn içindeki bütün panel() çağrılarında s ekseni kx ile ölçeklenir (yuvarlak öğeyi ovale çevirir; merkez s = 0)."""
    global panel
    p0 = panel; panel = lambda g_, O, T, N, poly, *r, **k: p0(g_, O, T, N, [(s * kx, z) for s, z in poly], *r, **k)
    try: fn(*a, **kw)
    finally: panel = p0
def halka(g, f, s, zc, r0, r1, n, o0, o1, m):
    """Küçük ferforje kıvrımı: n dörtgen dilimli halka (kemer_taslari'nin beşgen taşlarından ucuz; 12 üçgen/dilim)."""
    O, T, N = at(f, s); dz_ = 0.0015 / r0
    for i in range(n):
        b0, b1 = 2 * math.pi * i / n + dz_, 2 * math.pi * (i + 1) / n - dz_
        panel(g, O, T, N, [(r0 * math.cos(b0), zc + r0 * math.sin(b0)), (r0 * math.cos(b1), zc + r0 * math.sin(b1)),
                           (r1 * math.cos(b1), zc + r1 * math.sin(b1)), (r1 * math.cos(b0), zc + r1 * math.sin(b0))], o0, o1, m)
def kutu(g, cx, cy, w, d, z0, z1, m): g.prism(R4(cx - w / 2, cx + w / 2, cy - d / 2, cy + d / 2), z0, z1, m, m)
# camlı kapı: açıklığın tamamı cam, önünde siyah kasa ızgarası (saf siyah yerine Demir #36413F)
panel(g, *at(fG, 0.0), yuvarlak(kw_ - 0.006, zS, zs, 16), -0.002, 0.008, M["koyu_cam"])
zT0, zT1 = zS + P["G_tabela"][0], zs
for s_ in P["G_dikme"]:
    for sg in ((1,) if s_ == 0 else (1, -1)):
        t_d = 0.07 if s_ in (0.0, 1.19) else 0.045
        cubuk(g, fG, (sg * s_, zS), (sg * s_, zT0), t_d, 0.008, 0.035, M["demir"])
for z_ in P["G_kayit"]:
    t_k = 0.12 if z_ == 0.0 else 0.045
    cubuk(g, fG, (-1.19, zS + z_ + t_k / 2), (1.19, zS + z_ + t_k / 2), t_k, 0.008, 0.032, M["demir"])   # dikmelerin 3 mm arkası: eş düzlem kesişim siyah kare bırakır
for sg in (1, -1): cubuk(g, fG, (sg * 0.07, zS + 0.90), (sg * 0.07, zS + 1.10), 0.025, 0.035, 0.05, M["altin"])   # kapı kolları
# tabela bandı (F: «ESKİ AYNALI ÇARŞI», altın harf siyah zemin) ve tepe camı kolları (F: ışınsal 5 kol)
panel(g, *at(fG, 0.0), [(-kw_ / 2 + 0.003, zT0), (kw_ / 2 - 0.003, zT0), (kw_ / 2 - 0.003, zT1), (-kw_ / 2 + 0.003, zT1)], 0.008, 0.05, M["demir"])
kemer_taslari(g, fG, 0.0, zs, kw_ / 2 - 0.07, kw_ / 2 - 0.004, ["demir"] * 10, 0.008, 0.035)
for k in range(1, 6):
    a_ = math.pi * k / 6; r_ = kw_ / 2 - 0.06
    cubuk(g, fG, (0.0, zs + 0.01), (r_ * math.cos(a_), zs + r_ * math.sin(a_)), 0.035, 0.008, 0.026 + 0.0015 * k, M["demir"])   # kollar kademeli derinlikte
zK = zs + 0.04                                                                     # F: kırmızı levha bandın hemen üstünde, ≈ 1,0 × 0,13 m
panel(g, *at(fG, 0.0), [(-0.50, zK), (0.50, zK), (0.50, zK + 0.13), (-0.50, zK + 0.13)], 0.035, 0.06, M["tabela_k"])
# üzengi taşları (F: açık renk taş blok, kemer başlangıcında iki yanda) ve fenerler (F: siyah gövde, açık cam; üzengi altında)
for sg in (1, -1):
    panel(g, *at(fG, 0.0), [(sg * kw_ / 2, zs - 0.14), (sg * (kw_ / 2 + 0.30), zs - 0.14), (sg * (kw_ / 2 + 0.30), zs - 0.003), (sg * kw_ / 2, zs - 0.003)][::sg], -0.002, 0.07, M["tas"])
    cx_, cy_ = gx - sg * P["G_fener_s"], yF - 0.20; f0, f1 = zS + P["G_fener_z"][0], zS + P["G_fener_z"][1]
    kutu(g, cx_, yF - 0.10, 0.03, 0.20, f0 + 0.10, f0 + 0.13, M["demir"])                 # kol
    kutu(g, cx_, cy_, 0.15, 0.15, f0 - 0.04, f0, M["demir"]); kutu(g, cx_, cy_, 0.12, 0.12, f0, f1 - 0.04, M["fener_cam"])
    kutu(g, cx_, cy_, 0.17, 0.17, f1 - 0.04, f1 - 0.01, M["demir"]); g.roof_pyr(R4(cx_ - 0.075, cx_ + 0.075, cy_ - 0.075, cy_ + 0.075), f1 - 0.01, f1 + 0.05, M["demir"])
l0, l1, lz0, lz1 = P["G_levha"]
panel(g, *at(fG, 0.0), [(l1, zS + lz0), (l0, zS + lz0), (l0, zS + lz1), (l1, zS + lz1)], -0.002, 0.02, M["levha"])
# cam saçak (Aydın foto 33: süt beyazı polikarbon, öne eğik) + 4 ferforje konsol + önde kıvrımlı friz
zb_, zf_ = zS + P["G_sacak_z"][0], zS + P["G_sacak_z"][1]; sd_, sw_ = P["G_sacak_d"], P["G_sacak_w"] / 2; yb_, yf_ = yF - 0.06, yF - P["G_sacak_d"]
qs = [g.V(Vector((gx + x_, y_)), z_ + dz) for dz in (0.0, -0.02) for x_, y_, z_ in ((-sw_, yb_, zb_), (sw_, yb_, zb_), (sw_, yf_, zf_), (-sw_, yf_, zf_))]
g.F(qs[0:4], M["sacak_cam"]); g.F(qs[4:8][::-1], M["sacak_cam"])
for i in range(4): j = (i + 1) % 4; g.F([qs[i], qs[4 + i], qs[4 + j], qs[j]], M["sacak_cam"])
for s_k in P["G_konsol"]:
    for sg in (1, -1):
        fK = yuz((gx - sg * s_k, yF), (0, -1), (1, 0))                             # konsol düzlemi: s = duvardan dışarı uzaklık
        za = zS + (P["G_konsol_alt"][0] if s_k > 1 else P["G_konsol_alt"][1])
        ust = lambda u: zb_ - 0.035 + (zf_ - zb_) * (u - 0.06) / (sd_ - 0.06)       # saçak alt yüzünün hemen altı
        cubuk(g, fK, (0.065, za), (0.065, ust(0.065)), 0.03, -0.012, 0.012, M["demir"])
        cubuk(g, fK, (0.065, ust(0.065)), (sd_ - 0.06, ust(sd_ - 0.06)), 0.025, -0.011, 0.011, M["demir"])
        cubuk(g, fK, (0.08, za + 0.12), (sd_ - 0.22, ust(sd_ - 0.22) - 0.02), 0.022, -0.010, 0.010, M["demir"])
        rk = min(0.12, (ust(0.3) - za) * 0.3)
        halka(g, fK, 0.30, ust(0.30) - rk - 0.04, rk * 0.8, rk, 5, -0.009, 0.009, M["demir"])   # kıvrım
fF = yuz((gx, yf_ + 0.02), (-1, 0), (0, -1))
cubuk(g, fF, (-sw_ + 0.05, zf_ - 0.045), (sw_ - 0.05, zf_ - 0.045), 0.03, -0.012, 0.012, M["demir"])
cubuk(g, fF, (-sw_ + 0.05, zf_ - 0.215), (sw_ - 0.05, zf_ - 0.215), 0.025, -0.012, 0.012, M["demir"])
for k in range(7): halka(g, fF, -sw_ + 0.25 + k * (2 * sw_ - 0.50) / 6, zf_ - 0.13, 0.05, 0.065, 5, -0.010, 0.010, M["demir"])
# oval rozet pencere (F Levha 91): radyal tuğla halka, cam, ferforje şebeke (8 kol, iç ve dış halka, 8 kıvrım)
pz, pr, kx_ = zS + P["G_pen_z"], P["G_pen_r"], P["G_pen_kx"]
elips(kx_, halka, g, fG, 0.0, pz, pr, pr + P["G_pen_halka"], 22, -0.002, 0.04, M["tugla"])
panel(g, *at(fG, 0.0), [(s * kx_, z) for s, z in daire(pz, pr + 0.002, 24)], -0.002, 0.01, M["koyu_cam"])
def sebeke_oval(r, kol=8, t=0.03):
    for k in range(kol):
        a = math.pi * k / kol; ca, sa = math.cos(a), math.sin(a); nx, nz = -sa * t, ca * t
        panel(g, *at(fG, 0.0), [(-r * ca - nx, pz - r * sa - nz), (r * ca - nx, pz + r * sa - nz), (r * ca + nx, pz + r * sa + nz), (-r * ca + nx, pz - r * sa + nz)],
              0.01, 0.026 + 0.001 * k, M["demir"])
    halka(g, fG, 0.0, pz, r * 0.86, r, 16, 0.01, 0.036, M["demir"]); halka(g, fG, 0.0, pz, r * 0.22, r * 0.34, 8, 0.01, 0.037, M["demir"])
elips(kx_, sebeke_oval, pr)
for k in range(8):
    a_ = math.pi * (2 * k + 1) / 8; rr = pr * 0.63
    elips(kx_, halka, g, at(fG, rr * math.cos(a_) * kx_), 0.0, pz + rr * math.sin(a_), pr * 0.11, pr * 0.17, 5, 0.01, 0.0345, M["demir"])
ob_giris = g.obj()
# yazılar (F Levha 90, Aydın foto 33): metin eğriden mesh'e, 3 mm kalınlık, cephenin önünde; Hamam_Giris'e birleştirilir
def metin_bm(metin):
    """Metni font biriminde kapalı bmesh'e çevirir (çözünürlük 1, 3 mm kalınlık, harf aralığı 1,1: bitişik harfler ortak köşe paylaşmasın)."""
    cu = bpy.data.curves.new("_t", 'FONT'); cu.body = metin; cu.resolution_u = 1; cu.extrude = 0.003; cu.space_character = 1.1
    ob = bpy.data.objects.new("_t", cu); bpy.context.scene.collection.objects.link(ob)
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get())); bpy.data.objects.remove(ob); bpy.data.curves.remove(cu)
    bm = bmesh.new(); bm.from_mesh(me); bpy.data.meshes.remove(me); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5); return bm
def yazi(metin, m, cx, cz, y, gen, boy, ad, cengel=()):
    """cengel: Ş'nin çengeli bitişik glifte kapalı mesh vermiyor; metinde S yazılır, bu indislerdeki harfin altına ayrı '¸' glifi konur."""
    bm = metin_bm(metin)
    for i in cengel:
        b0_, b1_ = metin_bm(metin[:i]), metin_bm(metin[:i + 1])
        x0 = max(v.co.x for v in b0_.verts); x1 = max(v.co.x for v in b1_.verts); b0_.free(); b1_.free()
        bc = metin_bm("\u00b8"); cx_ = (min(v.co.x for v in bc.verts) + max(v.co.x for v in bc.verts)) / 2
        bmesh.ops.translate(bc, verts=bc.verts, vec=((x0 + x1) / 2 + 0.03 - cx_, 0, 0))
        me_ = bpy.data.meshes.new("_c"); bc.to_mesh(me_); bc.free(); bm.from_mesh(me_); bpy.data.meshes.remove(me_)
    xs = [v.co.x for v in bm.verts]; ys = [v.co.y for v in bm.verts]
    xm, ym, sx, sy = (min(xs) + max(xs)) / 2, (min(ys) + max(ys)) / 2, gen / (max(xs) - min(xs)), boy / (max(ys) - min(ys))
    for v in bm.verts: v.co = Vector((cx + (v.co.x - xm) * sx, y - v.co.z, cz + (v.co.y - ym) * sy))   # görüş −Y'den: okuma yönü +X
    me = bpy.data.meshes.new(ad); bm.to_mesh(me); bm.free(); me.materials.append(m)
    o = bpy.data.objects.new(ad, me); bpy.context.scene.collection.objects.link(o); return o
YAZI = [yazi("ESKİ  AYNALI  ÇARSI", M["altin"], gx, (zT0 + zT1) / 2, yF - 0.054, 2.15, 0.25, "_yazi_tabela", cengel=(17,)),   # F: bandı neredeyse doldurur
        yazi("COVERED BAZAAR", M["beyaz_yazi"], gx, zK + 0.065, yF - 0.064, 0.70, 0.065, "_yazi_levha")]
g = A.G("_oklar")                                                                  # F: levhanın iki ucunda aşağı ok
for sg in (1, -1):
    a0 = sg * 0.42; z0_ = zK + 0.025
    panel(g, *at(fG, 0.0), [(a0 - 0.007, z0_ + 0.035), (a0 - 0.007, z0_ + 0.085), (a0 + 0.007, z0_ + 0.085), (a0 + 0.007, z0_ + 0.035),
                            (a0 + 0.022, z0_ + 0.035), (a0, z0_), (a0 - 0.022, z0_ + 0.035)], 0.06, 0.064, M["beyaz_yazi"])
YAZI.append(g.obj())
bpy.ops.object.select_all(action='DESELECT')
for o_ in YAZI + [ob_giris]: o_.select_set(True)
bpy.context.view_layer.objects.active = ob_giris; bpy.ops.object.join(); ob_giris.name = "Hamam_Giris"

# --- Hamam_Giris_Kadin: kadın soğukluğunun güneyindeki giriş bloğu (plan §3.2; F Levha 96–97, envanter_c1_pdf107; kapı 1,2 m ölçek ≈ 50 px/m) ---
P.update({"K_x": (8.88, 15.53), "K_y": (-4.97, -1.97), "K_h": 4.3, "K_kapi_x": 10.8, "K_kapi": (1.2, 2.36), "K_sove": 0.15,
          "K_kemer": (2.62, 0.62, 0.85), "K_korn": 0.25})          # F: blok 322 px ≈ 6,4 m (kadın genişliği 6,65), yükseklik 215 px; kemer üzengi, iç / dış yarıçap
x0k, x1k = P["K_x"]; y0k, y1k = P["K_y"]
g = A.G("Hamam_Giris_Kadin")
g.prism(R4(x0k, x1k, y0k, y1k + 0.002), 0.0, P["K_h"], M["duvar"], M["cati"],
        ztop=lambda q: P["K_h"] + (q.y - y0k) / (y1k - y0k) * (P["govde_h"] - P["K_h"]))   # F Levha 96: tek eğimli kurşun dam kasnağın dibine dayanır
g.prism(R4(x0k + 0.002, x1k + 0.06, y0k - 0.06, y0k + 0.30), P["K_h"] - P["K_korn"], P["K_h"] + 0.02, M["tugla"], M["tugla"])   # ön yüzde tuğla korniş (F)
fK = (Vector((0, y0k)), Vector((-1, 0)), Vector((0, -1)))  # güney yüzü, dışarı −Y; s = −X
sK = -P["K_kapi_x"]; kw2, kh2 = P["K_kapi"]; sv = P["K_sove"]
panel(g, *at(fK, sK), [(-kw2 / 2 - sv, 0.0), (kw2 / 2 + sv, 0.0), (kw2 / 2 + sv, kh2 + sv), (-kw2 / 2 - sv, kh2 + sv)], -0.002, 0.05, M["mermer"])
panel(g, *at(fK, sK), [(-kw2 / 2, 0.0), (kw2 / 2, 0.0), (kw2 / 2, kh2), (-kw2 / 2, kh2)], 0.05, 0.07, M["kapi"])
zs2, ri2, ro2 = P["K_kemer"]
kemer_taslari(g, fK, sK, zs2, ri2, ro2, ["tugla"] * 13, -0.002, 0.03)
panel(g, *at(fK, sK), yuvarlak(2 * ri2 - 0.006, zs2, zs2, 10)[2:] + [(-ri2 + 0.003, zs2)], -0.002, 0.012, M["tugla"])                  # kemer içi tuğla dolgu (F Levha 97)
g.obj()

# --- Cephe_Pencereler: kadın soğukluğu pencereleri, kasnak pencereleri, kuzey kapısı ---
P.update({"W_kuzey_x": [7.25, 10.95], "W_dogu_y": [2.8, 6.35], "W_w": 1.1, "W_z0": 1.3, "W_tepe": 3.4, "W_halka": 0.32,   # P Ayverdi, W Aydın PDF 69; P-oran Çetintaş; T boyut (Levha 102, 106–107)
          "KW": {"Kubbe_Sogukluk_Kadin": [270, 0, 90], "Kubbe_Sogukluk_Erkek": [270, 180, 90]},        # E: kadın kasnağında 3; erkek T
          "KW_w": 0.8, "KW_z0": 0.35, "KW_tepe": 1.45,                                                     # kasnak tabanından
          "N_x": -3.25, "N_kapi_w": 2.2, "N_kapi_tepe": 3.4, "N_kemer_b": 0.36, "N_pen_z": 4.2, "N_pen_r": 0.40, "N_pen_halka": 0.22})   # F Flickr 17001294166; T ölçü
g = A.G("Cephe_Pencereler")
def pencere_yuv(g, f, s, w, z0, tepe_, halka, sebeke=False):
    zs_ = tepe_ - w / 2
    kemer_taslari(g, f, s, zs_, w / 2, w / 2 + halka, ["tugla"] * 15, -0.002, 0.04)       # dikine tuğla kemer halkası (F Levha 102)
    O, T, N = at(f, s)
    panel(g, O, T, N, yuvarlak(w, z0, zs_), -0.002, 0.02, M["kapi"] if not sebeke else M["pencere"])
    if sebeke: panel(g, O, T, N, yuvarlak(w * 0.9, z0 + 0.05, zs_), 0.02, 0.035, M["sebeke"], M["mermer"], uv=True)   # alpha-cutout delikli şebeke
    else:
        panel(g, O, T, N, yuvarlak(w - 0.16, z0 + 0.08, zs_), 0.02, 0.03, M["pencere"])
        panel(g, O, T, N, [(-0.03, z0 + 0.08), (0.03, z0 + 0.08), (0.03, tepe_ - 0.08), (-0.03, tepe_ - 0.08)], 0.03, 0.045, M["kapi"])   # orta kayıt
yKN = P["kadin_govde"][2][1]; xKD = P["kadin_govde"][1][0]
for x_ in P["W_kuzey_x"]: pencere_yuv(g, yuz((x_, yKN), (-1, 0), (0, 1)), 0.0, P["W_w"], P["W_z0"], P["W_tepe"], P["W_halka"])
for y_ in P["W_dogu_y"]: pencere_yuv(g, yuz((xKD, y_), (0, 1), (1, 0)), 0.0, P["W_w"], P["W_z0"], P["W_tepe"], P["W_halka"])
for ad, yonler in P["KW"].items():
    k = P["erkek"] if "Erkek" in ad else P["kadin"]; c = V2(k["c"]); ap = k["kw"] / 2
    for th in yonler:
        n_ = Vector((math.cos(math.radians(th)), math.sin(math.radians(th)))); t_ = Vector((-n_.y, n_.x))
        pencere_yuv(g, (c + n_ * ap, t_, n_), 0.0, P["KW_w"], P["govde_h"] + P["KW_z0"], P["govde_h"] + P["KW_tepe"], 0.22, sebeke=True)
# kuzey kapısı: erkek soğukluğunun kuzey duvarında, Kapalı Çarşı sokağına açılan düz cepheli kemerli camlı kapı + üstte yuvarlak pencere (E PDF 106; F Flickr 17001294166)
fN = yuz((P["N_x"], P["erkek_govde"][3]), (1, 0), (0, 1)); nw_ = P["N_kapi_w"]; nzs = P["N_kapi_tepe"] - nw_ / 2
kemer_taslari(g, fN, 0.0, nzs, nw_ / 2, nw_ / 2 + P["N_kemer_b"], ["tugla", "tugla", "tugla", "kufeki"] * 5 + ["tugla"] * 3, -0.002, 0.05)
panel(g, *at(fN, 0.0), [(-nw_ / 2, 0.0), (nw_ / 2, 0.0), (nw_ / 2, nzs), (-nw_ / 2, nzs)], -0.002, 0.03, M["kapi"])
panel(g, *at(fN, 0.0), [(-nw_ / 2 + 0.15, 0.25), (nw_ / 2 - 0.15, 0.25), (nw_ / 2 - 0.15, nzs - 0.12), (-nw_ / 2 + 0.15, nzs - 0.12)], 0.03, 0.04, M["pencere"])   # camlı kanatlar
panel(g, *at(fN, 0.0), yuvarlak(nw_ - 0.006, nzs + 0.003, nzs + 0.003)[2:] + [(-nw_ / 2 + 0.003, nzs + 0.003)], -0.002, 0.02, M["pencere"])                   # tepe camı
npz, npr = P["N_pen_z"], P["N_pen_r"]
kemer_taslari(g, fN, 0.0, npz, npr, npr + P["N_pen_halka"], ["tugla"] * 20, -0.002, 0.04, 0.0, 2 * math.pi)
panel(g, *at(fN, 0.0), daire(npz, npr + 0.002, 20), -0.002, 0.01, M["pencere"])
sebeke_demir(g, fN, 0.0, npz, npr, 0.01, 0.035)
g.obj()

# ================= ÇEVRE: döşeme, ağaç, figürler (standart §1, §4) =================
g = A.G("Cevre_Doseme")
for bx in P["doseme"]: g.prism(R4(*bx), 0.0, 0.02, M["avlu"], M["avlu"])
g.obj()
AGAC = ("Cevre_Agac_01", V2(P["agac"]), "#7FA35B", P["set_h"])
CV.cinar(AGAC[0], AGAC[1], AGAC[2], AGAC[3])
FIG = [("yuruyen", 1.76, (-3.1, -21.6, zS), 90, dict(renk=0)),                       # güney girişine yürüyen (sette)
       ("ayakta", 1.64, (-4.9, -22.4, zS), 60, dict(kadin=True, renk=1)),            # güney girişi önünde
       ("yuruyen", 1.22, (-2.0, -22.9, zS), 100, dict(cocuk=True, renk=2)),          # çocuk
       ("yuruyen", 1.62, (12.4, -9.5, 0.02), 90, dict(kadin=True, renk=2)),          # doğu avlusu
       ("ayakta", 1.78, (14.2, -12.6, 0.02), 150, dict(renk=1)),                     # doğu avlusu
       ("ayakta", 1.66, (10.8, -6.3, 0.02), 90, dict(kadin=True, renk=0))]           # kadınlar kapısı önünde
for i_, (poz_, boy_, kon_, yon_, kw_) in enumerate(FIG, start=1): A.insan(f"Olcek_Insan_{i_:02d}", poz=poz_, boy=boy_, konum=kon_, yon=yon_, **kw_)

# ================= UV =================
def uv_kubbe():
    """Her dilim bir karo (u 0..1), v = kurşun levha sırası; yalnız kubbe malzemeli yüzler, en yakın kubbe."""
    nesne_kubbe = {}
    for ad, liste in KUBBE.items(): nesne_kubbe.setdefault(KUBBE_NESNE[ad], []).extend(liste)
    for on, liste in nesne_kubbe.items():
        o = bpy.data.objects[on]; me = o.data; uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
        ki = [i for i, s_ in enumerate(o.material_slots) if s_.material is M["kubbe"]]
        for p_ in me.polygons:
            if p_.material_index not in ki: continue
            pc = p_.center; c, zb_, rise, segs = min(liste, key=lambda q: (q[0].x - pc.x) ** 2 + (q[0].y - pc.y) ** 2); seg = 2 * math.pi / segs
            af = math.atan2(pc.y - c.y, pc.x - c.x)
            for li in p_.loop_indices:
                co = me.vertices[me.loops[li].vertex_index].co
                if math.hypot(co.x - c.x, co.y - c.y) < 1e-3: u = 0.5
                else: da = (math.atan2(co.y - c.y, co.x - c.x) - af + math.pi) % (2 * math.pi) - math.pi; u = 0.5 + da / seg
                uvl.data[li].uv = (u, max(co.z - zb_, 0) / rise * P["D_kubbe_sira"])
HUCRE_UV = [(M["duvar"], 1.2, 1.2, 0.0), (M["kasnak"], 1.53, 1.02, P["govde_h"]), (M["avlu"], 1.5, 1.5, 0.0)]   # doku_uret_v03.py karo ölçüleri; kasnak taş sırası gövde üstünde başlar
def uv_hucre(objs):
    """Dünya koordinatından periyodik UV: u = yüz boyunca / karo genişliği, v = (z − z0) / karo yüksekliği; yatay yüzler düzlemsel."""
    for o in objs:
        me = o.data
        for mat, kw_, kh_, z0_ in HUCRE_UV:
            idx = [i for i, s in enumerate(o.material_slots) if s.material is mat]
            if not idx: continue
            uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
            for p in me.polygons:
                if p.material_index not in idx: continue
                n = p.normal; t_ = Vector((-n.y, n.x, 0)).normalized() if abs(n.z) < 0.7 else None
                for li in p.loop_indices:
                    co = o.matrix_world @ me.vertices[me.loops[li].vertex_index].co
                    uvl.data[li].uv = ((co.x * t_.x + co.y * t_.y) / kw_, (co.z - z0_) / kh_) if t_ is not None else (co.x / kw_, co.y / kh_)
def uv_kirpi(objs):
    """Kirpi saçak: düşey yüzler; u = yüz boyunca / 0,4, v = 0,2 m'lik bant = karonun yarısı (cami v06 ile aynı)."""
    for o in objs:
        me = o.data; idx = [i for i, s_ in enumerate(o.material_slots) if s_.material is M["kirpi"]]
        if not idx: continue
        uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
        for p in me.polygons:
            if p.material_index not in idx: continue
            n = p.normal; zm = min(me.vertices[me.loops[li].vertex_index].co.z for li in p.loop_indices)
            t_ = Vector((-n.y, n.x, 0)).normalized() if abs(n.z) < 0.7 else None
            for li in p.loop_indices:
                co = me.vertices[me.loops[li].vertex_index].co
                uvl.data[li].uv = ((co.x * t_.x + co.y * t_.y) / 0.4, (co.z - zm) / 0.2 * 0.5) if t_ is not None else (co.x / 0.4, co.y / 0.4)
YAPI = [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin"))]
uv_kubbe(); uv_hucre(YAPI); uv_kirpi(YAPI)

# ================= draw call toplama (≤ 40; Orhan Bey Camii v06 konsolide yöntemi) =================
DUZ_ADLAR = {"Tugla", "Tas", "Kufeki", "Mermer", "Kapi", "Pencere", "Demir", "Cam_Kulah",
             "Altin_Yazi", "Beyaz_Yazi", "Tabela_Kirmizi", "Sacak_Cam", "Fener_Cam", "Levha", "Koyu_Cam"}   # v04 kapı ayrıntısı
KUBBEYE = {"Cati"}                                   # düz kurşun dam = kubbe rengi; UV dilim dokusunun düz orta bölgesine
def tint_of(m):
    bs = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"); return tuple(bs.inputs["Base Color"].default_value)[:3]
def konsolide():
    for o in [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin"))]:
        me = o.data
        if "AO" not in me.color_attributes: me.color_attributes.new("AO", 'BYTE_COLOR', 'CORNER')
        if "TINT" not in me.color_attributes: me.color_attributes.new("TINT", 'FLOAT_COLOR', 'CORNER')
        uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap"); uvl.name = "UVMap"
        eski = [sl.material for sl in o.material_slots]; yeni_mat = []; tint_pl = []
        for p_ in me.polygons:
            m = eski[p_.material_index]; nm = m.name; t = (1.0, 1.0, 1.0)
            if nm in KUBBEYE:
                m2 = M["kubbe"]
                for li in p_.loop_indices: uvl.data[li].uv = (0.5, 0.5)
            elif nm in DUZ_ADLAR or nm.startswith(("Olcek_", "Agac_")): m2 = M["duz"]; t = tint_of(m)
            else: m2 = m
            yeni_mat.append(m2); tint_pl.append(t)
        liste = []
        for m2 in yeni_mat:
            if m2 not in liste: liste.append(m2)
        for _ in range(len(o.material_slots)): me.materials.pop(index=0)
        for m2 in liste: me.materials.append(m2)
        tl = me.color_attributes["TINT"]
        for p_, m2, t in zip(me.polygons, yeni_mat, tint_pl):
            p_.material_index = liste.index(m2)
            for li in p_.loop_indices: tl.data[li].color = (*t, 1.0)
        me.color_attributes.active_color = me.color_attributes["AO"]
    for ad_, parcalar in (("Hamam_Detay", ["Sacak", "Fenerler", "Cephe_Pencereler"]), ("Kubbe_Halvetler", ["Kubbe_Halvetler", "Kubbe_Kadin_Halvetler"])):
        bpy.ops.object.select_all(action='DESELECT'); ilk = bpy.data.objects[parcalar[0]]
        for n_ in parcalar: bpy.data.objects[n_].select_set(True)
        bpy.context.view_layer.objects.active = ilk; bpy.ops.object.join(); ilk.name = ad_; ilk.data.name = ad_
        me = ilk.data; sl = [s_.material for s_ in ilk.material_slots]; uniq = []
        for m_ in sl:
            if m_ not in uniq: uniq.append(m_)
        if len(uniq) != len(sl):
            idx = [uniq.index(m_) for m_ in sl]
            for p_ in me.polygons: p_.material_index = idx[p_.material_index]
            for _ in range(len(sl)): me.materials.pop(index=0)
            for m_ in uniq: me.materials.append(m_)
konsolide()

# ================= kontrol =================
os.makedirs(KONTROL, exist_ok=True)
rapor = A.kontrol_hepsi(KONTROL, "kontrol")
# beklenen kesişmeler: ağaç dalları ve taç kendi nesnesinde; figürler setin üstünde ayrı nesne
mk = A.mesh_kontrol()
rapor["parcalar"] = {k_: v["ucgen"] for k_, v in mk.items()}
rapor["kubbeler"] = DOME_OLCU
rapor["draw_call"] = sum(len(o.material_slots) for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin")))
print("RAPOR", json.dumps({k_: rapor[k_] for k_ in ("ucgen_toplam", "acik_ya_da_manifold_degil", "cakismalar(>=0.3m)", "kirmizi_oran_8_yon", "GECTI", "draw_call")}, ensure_ascii=False))

# ================= AO + doku bağlama =================
A.ao_vertex(samples=32)
AO_TABAN = 0.70; AO_KUBBE = 0.85   # standart §2
for o in [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_")) and "TINT" in o.data.color_attributes]:
    tb_ = AO_KUBBE if o.name.startswith("Kubbe_") else AO_TABAN
    ao_, ti_ = o.data.color_attributes["AO"].data, o.data.color_attributes["TINT"].data
    for d_, t_c in zip(ao_, ti_):
        c_ = tb_ + (1 - tb_) * d_.color[0]; d_.color = (c_ * t_c.color[0], c_ * t_c.color[1], c_ * t_c.color[2], 1.0)
    o.data.color_attributes.remove(o.data.color_attributes["TINT"])
for m in DOKULU:
    nt = m.node_tree; tx = nt.nodes.get("DOKU"); mul = next((n for n in nt.nodes if n.type == "MIX" and n.blend_type == 'MULTIPLY'), None)
    if tx and mul: nt.links.new(tx.outputs["Color"], mul.inputs[6])

# ================= kaide (standart §1, 19 Ekim: DAİRE, en küçük çember + 3 m pay) ve güney sokak seti (kullanıcı 19 Ekim) =================
_nk = [V2(q) for q in P["alcak"]] + R4(*P["erkek_govde"]) + [V2(q) for q in P["kadin_govde"]] + R4(x0k, x1k, y0k, y1k)
_tg = P["G_ortu_tasma"]; _nk += [Vector((gx - hw - _tg, yF - _tg)), Vector((gx + hw + _tg, yF - _tg))]
_nk += [AGAC[1] + Vector((4.4 * math.cos(math.radians(45 * i)), 4.4 * math.sin(math.radians(45 * i)))) for i in range(8)]
_nk += [Vector((f_[2][0], f_[2][1])) for f_ in FIG]
for bx in P["doseme"]: _nk += R4(*bx)
K_MERKEZ, K_R0 = CV.en_kucuk_cember(_nk); K_PAY, K_SEG = P["kaide_pay"], 96; K_R = K_R0 + K_PAY
def kaide():
    R = K_R; pah = 0.15
    rapor["kaide"] = {"bicim": "daire", "merkez_m": [round(K_MERKEZ.x, 2), round(K_MERKEZ.y, 2)], "yaricap_m": round(R, 2), "pay_m": K_PAY, "kalinlik_m": 0.6, "ust_pah_m": pah,
                      "en_kucuk_cember_yaricap_m": round(K_R0, 2)}
    cev = lambda r: [K_MERKEZ + Vector((r * math.cos(2 * math.pi * k / K_SEG), r * math.sin(2 * math.pi * k / K_SEG))) for k in range(K_SEG)]
    gz = A.G("Zemin_Kaide"); mz = A.mat("Zemin", "#C4BDAF", 0.90); my = A.mat("Zemin_Yan", "#A39A8B", 0.90)
    ust = [gz.V(q, 0.0) for q in cev(R - pah)]; ors = [gz.V(q, -pah) for q in cev(R)]; alt = [gz.V(q, -0.6) for q in cev(R)]; n = len(ust)
    gz.F(ust, mz)
    for k in range(n):
        j = (k + 1) % n; gz.F([ust[j], ust[k], ors[k], ors[j]], my); gz.F([ors[j], ors[k], alt[k], alt[j]], my)
    gz.F(alt[::-1], my)
    return gz.obj()
def sokak_seti():
    """Güney ve güneybatıda +3,3 m döşeli set (P-oran Çetintaş AB kesiti; F Levha 92–94): bina güney yüzü (Y −18,5) ile batı su deposu yüzü (X −15,74)
    arasından kaide kenarının 1,5 m içine kadar; doğu kenarı X 3,77. Yan yüzler moloz taş istinat duvarı. Doğu avlusundan sete merdiven (Levha 94)."""
    R = K_R - 1.5; cx, cy = K_MERKEZ.x, K_MERKEZ.y; yN_ = P["alcak"][9][1]; xW_ = P["alcak"][7][0]; yS_ = P["alcak"][7][1]; xE_ = P["alcak"][6][0]
    xa = cx - math.sqrt(R * R - (yN_ - cy) ** 2); yb = cy - math.sqrt(R * R - (xE_ - cx) ** 2)
    ta, tb = math.atan2(yN_ - cy, xa - cx), math.atan2(yb - cy, xE_ - cx)
    if tb < ta: tb += 2 * math.pi
    yay = [Vector((cx + R * math.cos(ta + (tb - ta) * k / 40), cy + R * math.sin(ta + (tb - ta) * k / 40))) for k in range(41)]
    poly = [Vector((xE_, yS_)), Vector((xW_, yS_)), Vector((xW_, yN_))] + yay
    gs = A.G("Zemin_Set"); gs.prism(poly, 0.0, P["set_h"], M["duvar"], M["avlu"])
    mx0, mx1, my0, n_ = P["merdiven"]; h_ = P["set_h"] / n_; d_ = 0.33
    for i in range(n_):
        gs.prism(R4(mx0 + 0.002, mx1, my0 - (i + 1) * d_, my0 - i * d_ + (0.002 if i else 0.0)), 0.0, (i + 1) * h_, M["duvar"], M["avlu"])
    rapor["sokak_seti"] = {"kot_m": P["set_h"], "basamak": n_, "basamak_yuksekligi_m": round(h_, 3), "merdiven_y_m": [round(my0 - n_ * d_, 2), my0]}
    return gs.obj()
KAIDE = kaide(); SET = sokak_seti(); print("KAIDE", rapor["kaide"])
uv_hucre([SET])
for o in (KAIDE, SET):
    o.data.color_attributes.new("AO", 'BYTE_COLOR', 'CORNER')
    for d_ in o.data.color_attributes["AO"].data: d_.color = (1, 1, 1, 1)

# ================= .glb: kaidesiz (yapı + çevre + figür) ve sunum (kaide + set); orijin = kaide merkezi =================
def ortala(k):
    for o in bpy.data.objects:
        if o.type == "MESH" and not o.name.startswith(("REF", "_")): o.location.x -= k * K_MERKEZ.x; o.location.y -= k * K_MERKEZ.y
os.makedirs(os.path.dirname(EXPORT), exist_ok=True)
ortala(1); rapor["glb_bayt"] = A.disa_aktar(EXPORT, draco=True); ortala(-1)
bpy.ops.object.select_all(action='DESELECT')
for o in bpy.data.objects:
    if o.type == "MESH" and not o.name.startswith(("REF", "_")): o.select_set(True)
_kw = dict(filepath=EXPORT_SUNUM, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
ortala(1)
try: bpy.ops.export_scene.gltf(export_draco_mesh_compression_enable=True, **_kw)
except Exception: bpy.ops.export_scene.gltf(**_kw)
ortala(-1); rapor["glb_sunum_bayt"] = os.path.getsize(EXPORT_SUNUM); rapor["glb_orijin"] = "daire kaide merkezi; GLB'de yapı bu noktaya ortalandı"
with open(os.path.join(KONTROL, "kontrol_rapor.json"), "w", encoding="utf-8") as fh: json.dump(rapor, fh, ensure_ascii=False, indent=1)
print("GLB", rapor["glb_bayt"], rapor["glb_sunum_bayt"])

# ================= teslim raporları: renkler.json ve olcu_dogrulama.json (plan §7.4, standart §5.3) =================
def _hsv(hx):
    r, g_, b_ = [int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5)]; h, s_, v = colorsys.rgb_to_hsv(r, g_, b_); return round(h * 360), round(s_, 2), round(v, 2)
GENIS = {"Duvar", "Kasnak", "Kubbe", "Cati", "Avlu", "Tas"}
renkler = {}
for ad_, d_ in PALET_RAPOR.items():
    h_, s_, v_ = _hsv(d_["hex"]); renkler[ad_] = {**d_, "hsv": [h_, s_, v_], "genis_yuzey": ad_ in GENIS, "V_kural_ihlali": bool(ad_ in GENIS and v_ < 0.72 and ad_ not in ("Kubbe", "Cati", "Avlu"))}
renkler["_not"] = ("Kubbe/Cati (kurşun) #858E94, V 0,58: kullanıcı kararı (19 Ekim 2026, Orhan Bey Camii v06 ile aynı), standart §3 V ≥ 0,72 kuralından bilinçli sapma. "
                   "Avlu #B3A590 V 0,70: standart §1'in kullanıcı onaylı rengi. Kurşun roughness 0,55 (cami v06). Taş ve tuğla 0,70, mermer 0,40.")
renkler["_kullanilan_malzemeler"] = sorted({s_.material.name for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_")) for s_ in o.material_slots})
with open(os.path.join(KONTROL, "renkler.json"), "w", encoding="utf-8") as fh: json.dump(renkler, fh, ensure_ascii=False, indent=1)
mk2 = A.mesh_kontrol()
nesne = {o.name: {"ucgen": mk2[o.name]["ucgen"], "malzeme_sayisi": len(o.material_slots)} for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin"))}
def _boy(o): zs_ = [v.co.z for v in o.data.vertices]; return round(max(zs_) - min(zs_), 2)
olcu = {
    "surum": SURUM, "kaynak_harfleri": "P rölöve/ölçekli çizim, E envanter, W makale, F fotoğraf, H hesap, T tahmin",
    "oda_ic_olculeri_m": {"erkek_sogukluk": {"model": [12.07, 11.85], "E": [11.95, 11.86]}, "kadin_sogukluk": {"model": [10.35, 10.40], "E": [10.35, 10.35]},
                          "erkek_iliklik": {"model": [6.59, 6.50], "E": [6.60, 6.45]}, "kaynak": "P Ayverdi planı 40,1 px/m (yurt2024_pdf220)"},
    "dis_olcu_m": {"dogu_bati": round(15.53 - P["alcak"][7][0], 2), "kuzey_guney": round(16.28 - P["alcak"][7][1], 2), "not": "OSM K–G 34,9"},
    "kotlar_m": {"alcak_dam": P["alcak_h"], "kare_govde": P["govde_h"], "erkek_kasnak_ustu": P["erkek"]["zk"], "kadin_kasnak_ustu": P["kadin"]["zk"], "sokak_seti": P["set_h"],
                 "kaynak": "P Ayverdi kesiti (46 px/m); kadın F; set P-oran Çetintaş AB"},
    "kubbeler": DOME_OLCU,
    "giris_bloklari": {"guney_alinlikli": {"merkez_x": gx, "genislik": P["G_w"], "y": [yF, yB], "sacak_mutlak": round(eave, 2), "tepe_mutlak": round(tepe, 2),
                                           "kapi_genislik": P["G_kapi_w"], "kaynak": "F tepeden (pdf105) + Levha 90 oranı"},
                       "kadinlar": {"x": P["K_x"], "y": P["K_y"], "yukseklik": P["K_h"], "kapi": P["K_kapi"], "kaynak": "F Levha 96–97"},
                       "kuzey_kapi": {"x": P["N_x"], "genislik": P["N_kapi_w"], "kemer_tepesi": P["N_kapi_tepe"], "pencere_merkez_z": P["N_pen_z"], "kaynak": "E PDF 106, F Flickr 17001294166; ölçü T"}},
    "kaide": rapor["kaide"], "sokak_seti": rapor["sokak_seti"],
    "figurler": {o.name: {"boy_m": _boy(o), "poz": FIG[int(o.name[-2:]) - 1][0]} for o in bpy.data.objects if o.name.startswith("Olcek_Insan_")},
    "eklenmeyenler": {"bati_kapisi": "TDV: 1958 sonrası batı cephesine kapı açıldı; biçimi kaynakta yok, bugün dükkânlar arasında",
                      "fil_gozleri": "E/W sözü geçiyor, bugünkü fotoğraflarda görünmüyor (yalnız cam külahlar)",
                      "su_deposu_tonozu": "Çetintaş tonozlu çiziyor; TDV su deposu dükkân, tepeden fotoğrafta modern çatı altında",
                      "eyvan_tonozlari": "tepeden fotoğrafta (envanter_c1_pdf105) düz dam; kaldırıldı"},
    "butce": {"ucgen_toplam": sum(v["ucgen"] for v in nesne.values()), "draw_call": sum(v["malzeme_sayisi"] for v in nesne.values()), "glb_bayt": rapor["glb_bayt"], "glb_sunum_bayt": rapor["glb_sunum_bayt"],
              "sinirlar": {"ucgen": 18000, "hamam_ucgen": 14000, "figur_ucgen": 4000, "draw_call": 40, "glb_bayt": 1048576}},
    "nesneler": nesne}
with open(os.path.join(KONTROL, "olcu_dogrulama.json"), "w", encoding="utf-8") as fh: json.dump(olcu, fh, ensure_ascii=False, indent=1)
print("BUTCE", json.dumps(olcu["butce"], ensure_ascii=False))

# ================= render: genel standart §2 =================
RENDERLER = os.environ.get("HAMAM_RENDER", "A,B,C").split(",")
def kurulum_render():
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
    w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND"); bg.inputs[0].default_value = (0.80, 0.80, 0.80, 1); bg.inputs[1].default_value = 1.0
    sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
    sun.data.energy = 1.25; sun.data.angle = math.radians(35); sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
    sc.render.film_transparent = True
def kamera(ad, loc, hedef, orto=None, lens=35):
    cd = bpy.data.cameras.get(ad) or bpy.data.cameras.new(ad)
    if orto: cd.type = 'ORTHO'; cd.ortho_scale = orto
    else: cd.type = 'PERSP'; cd.lens = lens
    cd.clip_end = 2000
    cam = bpy.data.objects.get(ad) or bpy.data.objects.new(ad, cd)
    if cam.name not in bpy.context.scene.collection.objects: bpy.context.scene.collection.objects.link(cam)
    cam.location = Vector(loc); cam.rotation_euler = (Vector(hedef) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    return cam
def render(cam, ad, res=(1400, 900), zemin=False):
    for o in (KAIDE, SET): o.hide_render = not zemin
    sc = bpy.context.scene; sc.camera = cam; sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.filepath = os.path.join(KONTROL, f"{ad}.png"); bpy.ops.render.render(write_still=True)

# render ölçekleri (araclar/yan_yana_hamam.py ile aynı): üst orto merkez (−3, −1), 44 m / 1100 px = 25 px/m; doğu orto merkez (Y −1, z 6), 44 m / 1400 px
UST_C, UST_O, UST_PX = (-3.0, -1.0), 44.0, 1100
DOGU_C, DOGU_O, DOGU_RES = (-1.0, 6.0), 44.0, (1400, 700)
kurulum_render()
if "A" in RENDERLER:   # onay adımı A: kütle ve kubbe dizilimi
    _c = kamera("CAM_Ust_Orto", (UST_C[0], UST_C[1], 150), (UST_C[0], UST_C[1], 0), orto=UST_O); _c.rotation_euler = (0, 0, 0)
    render(_c, "ust_orto", (UST_PX, UST_PX))
    render(kamera("CAM_Dogu_Orto", (120, DOGU_C[0], DOGU_C[1]), (0, DOGU_C[0], DOGU_C[1]), orto=DOGU_O), "dogu_orto", DOGU_RES)
    render(kamera("CAM_Kuzey_Orto", (-3.0, 120, 6.0), (-3.0, 0, 6.0), orto=DOGU_O), "kuzey_orto", DOGU_RES)
    render(kamera("CAM_Foto104", (6.5, -25.0, 13.5), (3.0, 6.0, 5.0), lens=22), "foto104_acisi", (1600, 1000), zemin=True)   # envanter_c1_pdf104
    _k = kamera("CAM_Dogu_Kesit", (120, DOGU_C[0], DOGU_C[1]), (0, DOGU_C[0], DOGU_C[1]), orto=DOGU_O); _k.data.clip_start = 120 + 3.5   # X = −3,5'te kesit
    render(_k, "dogu_kesit", DOGU_RES); _k.data.clip_start = 0.1
if "B" in RENDERLER:   # onay adımı B: giriş cepheleri
    render(kamera("CAM_Guney_Giris", (-3.4, -29.5, zS + 1.7), (-3.6, -18.9, zS + 3.0), lens=26), "guney_giris", (1000, 1100), zemin=True)   # Levha 90 açısı (setten karşıdan)
    render(kamera("CAM_Guney_Kapi_Yakin", (gx - 0.9, yF - 7.2, zS + 1.6), (gx, yF, zS + 2.3), lens=32), "guney_kapi_yakin", (1300, 1000), zemin=True)   # v04: Aydın foto 33 açısı (sağdan, aşağıdan)
    render(kamera("CAM_Guney_Rozet", (gx, yF - 4.0, zS + 3.9), (gx, yF, zS + 4.05), lens=40), "guney_rozet_yakin", (1300, 800), zemin=True)          # v04: Levha 91
    render(kamera("CAM_Dogu_Avlu", (11.5, -23.0, 1.7), (11.2, 0.0, 5.6), lens=40), "dogu_avlu", (1100, 1100), zemin=True)   # Levha 96: blok ≈ 18 m uzakta
    render(kamera("CAM_Kuzey_Kapi", (-3.25, 24.0, 1.7), (-3.25, 16.28, 2.8), lens=30), "kuzey_kapi", (1100, 1000))   # Flickr 17001294166: Kapalı Çarşı sokağından
if "C" in RENDERLER:   # onay adımı C: doku, saçak, renk, kaide, set, ağaç, figürler
    _el, _az, _d = math.radians(32), math.radians(45), 160
    render(kamera("CAM_Havadan", (K_MERKEZ.x + _d * math.cos(_el) * math.cos(_az), K_MERKEZ.y + _d * math.cos(_el) * math.sin(_az), 3 + _d * math.sin(_el)), (K_MERKEZ.x, K_MERKEZ.y, 3), orto=2.15 * K_R), "havadan", (1800, 1600), zemin=True)
    render(kamera("CAM_Havadan_GB", (K_MERKEZ.x - 95, K_MERKEZ.y - 95, 85), (K_MERKEZ.x, K_MERKEZ.y, 3), orto=2.15 * K_R), "havadan_guneybati", (1800, 1600), zemin=True)
    render(kamera("CAM_Kubbe_Yakin", (12.8, -13.5, 2.0), (9.8, 3.0, 8.6), lens=34), "kubbe_yakin", (1200, 1000), zemin=True)       # yurt2024_pdf310 Levha 98–99: doğu avlusundan kasnak ve testere saçak
    render(kamera("CAM_Kadin_Dam", (16.0, -22.0, 9.5), (5.6, -8.0, 5.4), lens=30), "kadin_dam", (1400, 900), zemin=True)          # Levha 95 / pdf104: kadın tarafı parapet ve küçük kubbeler
    _c = kamera("CAM_Ust_Orto_K", (UST_C[0], UST_C[1] - 2, 150), (UST_C[0], UST_C[1] - 2, 0), orto=52.0); _c.rotation_euler = (0, 0, 0)
    render(_c, "ust_orto_sahne", (1100, 1100), zemin=True)
os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("BITTI", BLEND)
