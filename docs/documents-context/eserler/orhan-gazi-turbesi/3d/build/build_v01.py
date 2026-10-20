# AKAR · Orhan Gazi Türbesi · v01 (19 Ekim 2026) — sıfırdan ilk sürüm (SONNET_REVIZYON_PLANI.md §1–§6)
# Çalıştırma: blender -b --python 3d/build/build_v01.py      (ya da bpy modülüyle: python build_v01.py)
#   OGT_ASAMA=A → yalnız kütle (onay A render'ları)  ·  B → + detay  ·  C (varsayılan) → + renk/kaide/çevre/figür, AO, GLB, blend
#   OGT_RENDER=ad1,ad2 → render listesini daraltır; OGT_ORNEK=24 → Cycles örnek sayısı
# Girdi : ../ref/plan/yurt2024_pdf224_plan_yavas.png, ../ref/foto/*.jpg, ../../_kutuphane/akar3d.py
# Çıktı : 3d/blend/orhan-gazi-turbesi_v01.blend · 3d/export/orhan-gazi-turbesi_v01.glb (zeminsiz) · 3d/export/orhan-gazi-turbesi_v01_sunum.glb (daire kaideli)
#         3d/kontrol/v01/ (render'lar, olcu_dogrulama.json, renkler.json, kontrol_rapor.json) · geçici: 3d/kontrol/_tmp/
# Eksenler: +X doğu, +Y kuzey, +Z yukarı. Orijin: gövde karesinin merkezi, zemin z = 0. Giriş güneyde (−Y).
# Kaynak harfleri: P plan (Yurt 2024 PDF 224, dış kenar = 16,80 m ölçeğiyle) · E envanter C2 PDF 116–117 · W Yurt 2024 metni
#                  F fotoğraftan ölçüm (yöntemi olcu_dogrulama.json'da) · T tahmin · K kullanıcı kararı / genel standart
import sys, os, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 3, "_kutuphane")))
import bpy, bmesh
import akar3d as A
from mathutils import Vector, Matrix

SURUM = "v01"
URETIM = os.path.dirname(HERE)
ESER = os.path.dirname(URETIM)
KONTROL = os.path.join(URETIM, "kontrol", SURUM)
TMP = os.path.join(URETIM, "kontrol", "_tmp")
BLEND = os.path.join(URETIM, "blend", f"orhan-gazi-turbesi_{SURUM}.blend")
EXPORT = os.path.join(URETIM, "export", f"orhan-gazi-turbesi_{SURUM}.glb")
EXPORT_SUNUM = os.path.join(URETIM, "export", f"orhan-gazi-turbesi_{SURUM}_sunum.glb")
ASAMA = os.environ.get("OGT_ASAMA", "C")
DETAY, CEVRE = ASAMA in ("B", "C"), ASAMA == "C"

P = {
    # ---- gövde (plan §1) ----
    "dis": 16.80,            # E  C2 PDF 116 «16,80 × 16,80 m» (dış kenar, kare)
    "duvar": 1.30,           # E  C2 PDF 116 «duvar kalınlığı 1,30 m»; plan ölçeğiyle 1,27–1,29 (P)
    "pen_eksen": 4.15,       # P  pencere eksen aralığı (dört cephede ölçülen 4,06–4,24 ortalaması); orta pencere eksende
    "pen_plan_acik": 2.05,   # P  plandaki pencere açıklığı (dış yüz)
    "kapi_plan_acik": 2.20,  # P  güney ortadaki kapı açıklığı (dış yüz)
    "pen_w": 1.69,           # F  pencere net açıklığı (söve içi), pdf323 Levha 121
    "pen_sove": 0.25,        # F  mermer söve genişliği (söve dışı 2,19 ≈ plan açıklığı 2,05 + derz)
    "pen_esik": 0.78,        # F  pencere eşiği (şebeke altı)
    "pen_tepe": 3.97,        # F  kemer içi tepe (söve dışı tepe 4,22)
    "nis_d": 0.30,           # T  pencere nişi derinliği (iç mekân modellenmez; niş dibi koyu)
    "kapi_w": 1.50,          # F  kapı net açıklığı (pdf318 Levha 112 / pdf319 Levha 113: açıklık = mermer çerçevenin %58'i)
    "kapi_h": 2.42,          # F  kapı (dikdörtgen kanat) yüksekliği: Levha 112, yükseklik/genişlik 1,61
    "kapi_uzenge": 2.54,     # F  dilimli lünet tabanı (ahşap lento 0,12 üstü)
    "kapi_tepe": 3.36,       # F  dilimli kemer tepesi (Levha 112: lünet yüksekliği 0,61 × açıklık)
    "kapi_cerceve": 0.30,    # F  mermer söve-pilastr genişliği (Levha 113)
    "kapi_ust": 3.95,        # F  mermer çerçeve saçaklığı üstü (Levha 113: iki rozetli taş kuşak)
    "kapi_nis_d": 0.60,      # T  kapı nişi derinliği
    "subasman": 0.65,        # F  subasman (taban silmesi) üstü, Levha 121
    "subasman_tas": 0.05,    # T  subasman taşması
    "friz_alt": 6.77,        # F  pilastr başlığı / friz alt silmesi, Levha 121
    "korn_alt": 7.17,        # F  korniş başlangıcı, Levha 121
    "sacak": 8.03,           # F  korniş üstü = saçak kotu (Levha 121: 8,03; Levha 111: 8,05)
    "korn_tas": 0.35,        # F  korniş taşması (tepeden: saçak dış ölçüsü ≈ 17,50 m)
    "pilastr_w": 0.45,       # F  köşe pilastrı genişliği (Levha 121: 0,40; Levha 122 kaideyle 0,55)
    "pilastr_tas": 0.15,     # F  pilastr çıkıntısı (pdf324 Levha 122: köşede gölge payı ≈ 0,15)
    # ---- çatı eteği ve örtü (plan §1) ----
    "cati_tepe": 9.80,       # F  çatı eteğinin kasnağa bindiği kot (üç yöntem ortalaması, ±0,3)
    "cati_us": 1.6,          # T  içbükey eğri üssü (fotoğrafta saçakta yatık, kasnağa doğru dikleşen etek)
    "kasnak_r": 4.20,        # F  kasnak metal bandı yarıçapı (Ø 8,40)
    "kasnak_ust": 10.25,     # F  metal bandın üstü / konsollu korniş altı
    "korn_k_r": 4.40,        # F  kasnak kornişi dış yarıçapı (Ø 8,80; tepeden ölçek)
    "korn_k_ust": 11.10,     # F  kasnak kornişi üstü
    "kubbe_taban": 11.40,    # F  kubbe gövdesinin etek üstündeki tabanı
    "kubbe_r": 3.62,         # F  kubbe gövdesi taban yarıçapı (Ø 7,25)
    "kubbe_tepe": 14.30,     # F  kubbe tepesi (alem dibi), üç yöntem ortalaması ±0,4
    "alem_h": 1.20,          # F  alem yüksekliği (arsiv_dis_guneybati_havadan)
    "kasnak_pencere": 0,     # F  kasnakta pencere yok (konsollu korniş + metal bant; görülen siyah kutular projektör)
    # ---- giriş holü ve sundurma (plan §1) ----
    "hol_w": 6.00,           # F  hol dış genişliği (tepeden çatı 6,3 m − saçak; Levha 111 ön görünüş oranı)
    "hol_d": 3.20,           # F  hol derinliği (Levha 114/125: yan yüz = 2,7 × pencere genişliği)
    "hol_sacak_alt": 5.10,   # F  hol saçak tahtası altı (Levha 111 + Levha 125 ortalaması, ±0,4)
    "hol_sacak_ust": 5.60,   # F  hol saçak tahtası üstü
    "hol_cati_tepe": 6.25,   # T  hol kırma çatısı mahya kotu (tepeden: mahya holün ortasında)
    "hol_tas": 0.30,         # F  hol saçak taşması (tepeden çatı genişliği 6,3 m)
    "sun_d": 1.35,           # F  sundurma derinliği (Levha 125: 1,24 × pencere genişliği)
    "sun_w": 2.60,           # F  sundurma sütun dış aksı (Levha 111, sundurma düzleminde ölçek)
    "sun_cati_w": 3.30,      # F  sundurma çatı genişliği (Levha 111)
    "sun_sacak_alt": 5.05,   # F  sundurma saçak tahtası altı (hol saçağıyla aynı hizada okunuyor, ±0,4)
    "sun_sacak_ust": 5.45,   # F
    "sun_sutun_r": 0.11,     # T  sütunçe yarıçapı (iki ahşap sütunçe, E C2 PDF 117)
    "hol_duvar": 0.15,       # T  hol duvar kalınlığı (ahşap karkas + sıva)
    "hol_tavan": 4.80,       # T  hol tavanı (saçak tahtası altının 0,30 altı)
    "hol_kapi_w": 1.30,      # F  hol kapısı (Levha 111/112: iki kanatlı ahşap kapı, sundurma sütunları arasında)
    "hol_kapi_h": 2.60,      # F
    "hol_pen_w": 1.15,       # F  hol pencereleri (Levha 111: 1,13–1,31; Levha 125 oranları)
    "hol_pen_esik": 0.83,    # F  0,72 × pencere genişliği
    "hol_pen_tepe": 3.90,    # F  sivri kemer tepesi (3,38 × pencere genişliği)
    "konsol_n": 48,          # F  kasnak kornişi konsol sayısı (arsiv_dis_guneybati: ön yarıda ≈ 23 konsol)
}
D2 = P["dis"] / 2                     # 8,40
H_C = P["dis"] / 2 + P["korn_tas"]     # 8,75 saçak dış yarı ölçüsü
EPS = 0.002                            # parçalar arası en çok 2 mm gömülme (ortak kural 2)

# ---------------- malzemeler (genel standart §3; sapmalar renkler.json'da) ----------------
A.temizle()
for m in list(bpy.data.materials):
    if m.users == 0: bpy.data.materials.remove(m)
MAT = [  # anahtar, malzeme adı, hex, rough, metal, geniş yüzey mi
    ("cephe", "Cephe_Krem", "#E9DFC6", 0.80, 0.0, True),      # C: standart «Krem sıva» #E8DFCB'den az sarı (S 0,125 → 0,150): bulutlu fotoğraf (Levha 121) nötr, gün batımı (arsiv) sarı; pilastr #ECEAE4 ayrı okunur (renkler.json). B'de #EADCB8 fazla sarıydı
    ("silme", "Silme_Beyaz", "#ECEAE4", 0.70, 0.0, True),     # pilastr, korniş, subasman: fotoğrafta cepheden açık, beyaza yakın gri
    ("mermer", "Mermer", "#ECEAE4", 0.40, 0.0, False),
    ("kursun", "Kursun", "#C3C9CD", 0.45, 0.20, True),
    ("dikis", "Kursun_Dikis", "#98A1A8", 0.45, 0.20, False),
    ("bosluk", "Pencere_Bosluk", "#3E4A55", 0.30, 0.0, False),
    ("sebeke", "Sebeke_Beyaz", "#F1EFEA", 0.60, 0.0, False),
    ("ahsap", "Ahsap_Koyu", "#4E3427", 0.75, 0.0, False),
    ("kapi", "Ahsap_Kapi", "#7A5134", 0.75, 0.0, False),
    ("hol_cam", "Hol_Cam", "#3E4A55", 0.30, 0.0, False),
    ("alem", "Alem", "#C9A13B", 0.35, 0.60, False),
    ("sove", "Sove_Tas", "#D5D6D2", 0.60, 0.0, False),          # pencere söveleri: fotoğrafta gri, damarlı (mermer gölge tonu, standart §3)
    ("sebeke_k", "Sebeke_Kapi", "#F1EFEA", 0.60, 0.0, False),
]
M = {k: A.mat(n, hx, r, mt) for k, n, hx, r, mt, _ in MAT}
DOKU = os.path.join(HERE, "doku")
def doku_bagla(m, dosya, alfa=False):
    """Dokuyu Base Color'a bağlar (genel standart: sınırlı doku). alfa=True: gerçek delik (alpha clip; glTF'te MASK)."""
    nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tx = nt.nodes.new("ShaderNodeTexImage"); tx.image = bpy.data.images.load(os.path.join(DOKU, dosya), check_existing=True); tx.name = "DOKU"
    tx.interpolation = 'Linear'; nt.links.new(tx.outputs["Color"], bsdf.inputs["Base Color"])
    if alfa:
        rn = nt.nodes.new("ShaderNodeMath"); rn.operation = 'ROUND'
        nt.links.new(tx.outputs["Alpha"], rn.inputs[0]); nt.links.new(rn.outputs[0], bsdf.inputs["Alpha"])
        for a_, v_ in (("blend_method", "CLIP"), ("alpha_threshold", 0.5), ("surface_render_method", "DITHERED")):
            try: setattr(m, a_, v_)
            except Exception: pass
        m.use_backface_culling = False
DOKULU = {"kursun": ("kursun_dikis.png", False), "sebeke": ("sebeke_pencere.png", True), "sebeke_k": ("sebeke_kapi.png", True), "hol_cam": ("hol_cam.png", False)}
if DETAY:
    for k_, (f_, a_) in DOKULU.items(): doku_bagla(M[k_], f_, a_)

# ---------------- yardımcılar ----------------
def kutu(g, x0, x1, y0, y1, z0, z1, m, mtop=None):
    g.prism([Vector((x0, y0)), Vector((x1, y0)), Vector((x1, y1)), Vector((x0, y1))], z0, z1, m, mtop or m)

def kemer_yuvarlak(w, z0, ztepe, n=10):
    """Yarım daire kemerli açıklık çokgeni (s, z), sol alt köşeden saat yönü tersine."""
    r = w / 2; zs = ztepe - r
    return [(-r, z0), (r, z0)] + [(r * math.cos(math.pi * k / n), zs + r * math.sin(math.pi * k / n)) for k in range(n + 1)]

def kemer_dilimli(w, z0, zus, ztepe, dilim=5, n=3):
    """Dilimli (lobed) kemer: üzengi zus, tepe ztepe; yarım daire üzerinde 'dilim' adet içbükey dilim."""
    r = w / 2; ky = (ztepe - zus) / r
    pts = [(-r, z0), (r, z0), (r, zus)]
    for d in range(dilim):
        a0, a1 = math.pi * d / dilim, math.pi * (d + 1) / dilim
        p0 = Vector((r * math.cos(a0), zus + ky * r * math.sin(a0))); p1 = Vector((r * math.cos(a1), zus + ky * r * math.sin(a1)))
        c = (p0 + p1) / 2; ch = (p1 - p0).length; nrm = Vector((-(p1 - p0).y, (p1 - p0).x)).normalized()
        if nrm.dot(c - Vector((0, zus))) < 0: nrm = -nrm
        for k in range(1, n + 1):
            t = k / (n + 1); q = p0 + (p1 - p0) * t + nrm * (0.22 * ch * math.sin(math.pi * t))
            pts.append((q.x, q.y))
        pts.append((p1.x, p1.y))
    pts = pts[:-1] + [(-r, zus)]
    mx = max(abs(x) for x, z in pts[3:-1])                     # lob'lar açıklık genişliğini aşmasın (Levha 113: lünet söve içinde)
    k_ = min(1.0, (r - 0.004) / mx)
    return pts[:3] + [(x * k_, z) for x, z in pts[3:-1]] + [pts[-1]]

def panel_uv(g, O, T, N, poly, o0, o1, m, m_yan=None):
    """panel() + ön/arka yüzlere çokgenin sınır kutusuna göre UV (doku tam oturur); yan yüzler m_yan."""
    uvl = g.bm.loops.layers.uv.verify()
    s0, s1 = min(p[0] for p in poly), max(p[0] for p in poly); z0, z1 = min(p[1] for p in poly), max(p[1] for p in poly)
    Pt = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
    a = [g.bm.verts.new(Pt(s, z, o0)) for s, z in poly]; b = [g.bm.verts.new(Pt(s, z, o1)) for s, z in poly]
    uv = {v: ((s - s0) / (s1 - s0), (z - z0) / (z1 - z0)) for (s, z), v in list(zip(poly, a)) + list(zip(poly, b))}
    for f in (g.F(a[::-1], m), g.F(b, m)):
        if f:
            for l in f.loops: l[uvl].uv = uv[l.vert]
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g.F([a[i], a[j], b[j], b[i]], m_yan or m)

def kemer_sivri(w, z0, ztepe, n=6):
    """Sivri (iki merkezli) kemerli açıklık: yarıçap 0,75 × açıklık (hol pencereleri, sundurma ön kemeri)."""
    r = 0.75 * w; zs = ztepe - math.sqrt(r * r - (r - w / 2) ** 2); cxl = -w / 2 + r
    a_top = math.acos((0 - cxl) / r)
    sag = [(w / 2 - (r - r * math.cos((math.pi - a_top) * k / n)) , zs + r * math.sin((math.pi - a_top) * k / n)) for k in range(n + 1)]
    return [(-w / 2, z0), (w / 2, z0)] + sag + [(-s_, z_) for s_, z_ in sag[-2::-1]]

def panel(g, O, T, N, poly, o0, o1, m):
    """Düşey düzlemde (O + T·s, z) kapalı çokgen; N yönünde o0 → o1 kalınlık (Koza Han v13 panel())."""
    Pt = lambda s, z, o: (O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z)
    a = [g.bm.verts.new(Pt(s, z, o0)) for s, z in poly]; b = [g.bm.verts.new(Pt(s, z, o1)) for s, z in poly]
    g.F(a[::-1], m); g.F(b, m)
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g.F([a[i], a[j], b[j], b[i]], m)

def cerceve(g, O, T, N, ic, dis, o0, o1, m):
    """İç ve dış çokgen arasındaki kapalı halka (söve). ic/dis aynı nokta sayısında ve aynı yönde."""
    Pt = lambda s, z, o: g.bm.verts.new((O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z))
    ia, ib = [Pt(s, z, o0) for s, z in ic], [Pt(s, z, o1) for s, z in ic]
    da, db = [Pt(s, z, o0) for s, z in dis], [Pt(s, z, o1) for s, z in dis]
    n = len(ic)
    for i in range(n):
        j = (i + 1) % n
        g.F([db[i], db[j], ib[j], ib[i]], m); g.F([ia[i], ia[j], da[j], da[i]], m)
        g.F([da[i], da[j], db[j], db[i]], m); g.F([ib[i], ib[j], ia[j], ia[i]], m)

def kes(hedef, kesici_):
    md = hedef.modifiers.new("kes", 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = kesici_; md.solver = 'EXACT'
    try: md.material_mode = 'TRANSFER'
    except Exception: pass
    bpy.context.view_layer.objects.active = hedef; bpy.ops.object.modifier_apply(modifier="kes")

def birlestir(ad, objs):
    objs = [o for o in objs if o]
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]; bpy.ops.object.join(); objs[0].name = ad; objs[0].data.name = ad
    return objs[0]

# Cephe çerçevesi: her cephe için (O: cephe dış yüzü ortası, T: cephe boyunca sağa (dışarıdan bakınca), N: dışa normal)
CEPHE = {"K": (Vector((0, D2)), Vector((-1, 0)), Vector((0, 1))), "G": (Vector((0, -D2)), Vector((1, 0)), Vector((0, -1))),
         "D": (Vector((D2, 0)), Vector((0, 1)), Vector((1, 0))), "B": (Vector((-D2, 0)), Vector((0, -1)), Vector((-1, 0)))}
PENCERELER = [(c, s) for c in ("K", "D", "B") for s in (-P["pen_eksen"], 0.0, P["pen_eksen"])] + [("G", -P["pen_eksen"]), ("G", P["pen_eksen"])]

# ======================= GÖVDE (kütle + nişler) =======================
g = A.G("Govde", [M["cephe"]])
kutu(g, -D2, D2, -D2, D2, 0.0, P["korn_alt"] + EPS, M["cephe"])
gov = g.obj()
gk = A.G("_kes_nis", [M["bosluk"]])
pw, pe, pt = P["pen_w"], P["pen_esik"], P["pen_tepe"]
for c, s in PENCERELER:
    O, T, N = CEPHE[c]
    panel(gk, O + T * s, T, N, kemer_yuvarlak(pw, pe, pt), -P["nis_d"], 0.30, M["bosluk"])
O, T, N = CEPHE["G"]
panel(gk, O, T, N, kemer_dilimli(P["kapi_w"], 0.121, P["kapi_uzenge"], P["kapi_tepe"]), -P["kapi_nis_d"], 0.30, M["bosluk"])
kes(gov, gk.obj()); bpy.data.objects.remove(bpy.data.objects["_kes_nis"], do_unlink=True)

# ======================= PİLASTR VE SİLMELER =======================
g = A.G("Pilastr_Silme", [M["silme"]])
st = D2 + P["subasman_tas"]
kw_s = P["kapi_w"] / 2                                                                          # subasman bandı: kapı açıklığında boşluk (boolean yok: üst üste binen kutular kesilince EXACT pilastrları siliyordu)
kutu(g, -st, -kw_s, -st, -D2 + 0.6, 0.0, P["subasman"], M["silme"]); kutu(g, kw_s, st, -st, -D2 + 0.6, 0.0, P["subasman"], M["silme"])
kutu(g, -st, st, -D2 + 0.6 - EPS, st, 0.0, P["subasman"], M["silme"])
kutu(g, -D2 - 0.12, D2 + 0.12, -D2 - 0.12, D2 + 0.12, P["korn_alt"], 7.45, M["silme"])      # korniş 1. kademe
kutu(g, -D2 - 0.25, D2 + 0.25, -D2 - 0.25, D2 + 0.25, 7.45 - EPS, 7.80, M["silme"])         # 2. kademe
kutu(g, -H_C, H_C, -H_C, H_C, 7.80 - EPS, P["sacak"], M["silme"])                           # 3. kademe (saçak)
if DETAY:
    pt_, pw_ = P["pilastr_tas"], P["pilastr_w"]
    def kose_L(sx, sy, ic, dis, z0, z1):
        """Köşede iki yüzlü L, iki ince kutu: gövdeye en çok 2 mm gömülür (C: tek kutu 0,45–0,50 m gömülüyordu → kontrol_hepsi çakışması, AO kararması).
        İkinci kutu birinciye 1–3 mm girer; dış yüzü ve üst/alt yüzü 1 mm geride → köşe noktası çakışmaz (remove_doubles), aynı düzlemde binen yüz yok."""
        kutu(g, *sorted((sx * (D2 - EPS), sx * dis)), *sorted((sy * ic, sy * dis)), z0, z1, M["silme"])
        kutu(g, *sorted((sx * ic, sx * (D2 + 0.001))), *sorted((sy * (D2 - EPS), sy * (dis - 0.001))), z0 + 0.001, z1 - 0.001, M["silme"])
    for sx in (-1, 1):
        for sy in (-1, 1):                                                                      # köşe pilastrları (iki yüzlü L)
            kose_L(sx, sy, D2 - pw_, D2 + pt_, P["subasman"] - EPS, P["friz_alt"])
            kose_L(sx, sy, D2 - pw_ - 0.05, D2 + pt_ + 0.05, P["subasman"] - EPS, P["subasman"] + 0.22)                       # pilastr kaidesi
            kose_L(sx, sy, D2 - pw_ - 0.05, D2 + pt_ + 0.05, P["friz_alt"] - 0.22, P["friz_alt"] + EPS)                        # pilastr başlığı
    fr = D2 + 0.04
    kutu(g, -fr, fr, -fr, fr, P["friz_alt"], P["friz_alt"] + 0.10, M["silme"])                 # friz alt silmesi (pilastr başlığı hizası)
sil = g.obj()


# ======================= ÇATI ETEĞİ (içbükey kırma etek, kare saçaktan kasnağa) =======================
NC, NR = 64, 7
g = A.G("Cati_Etek", [M["kursun"]])
z0c, z1c, rk = P["sacak"] - 0.001, P["cati_tepe"], P["kasnak_r"] - EPS
halkalar = []
for t_i in range(NR + 1):
    t = t_i / NR; ring = []
    for k in range(NC):
        a = 2 * math.pi * k / NC
        ca, sa = math.cos(a), math.sin(a); sq = Vector((ca, sa)) * (H_C / max(abs(ca), abs(sa)))
        ci = Vector((ca, sa)) * rk
        q = sq + (ci - sq) * t
        ring.append(g.V(q, z0c + (z1c - z0c) * t ** P["cati_us"]))
    halkalar.append(ring)
for r0, r1 in zip(halkalar[:-1], halkalar[1:]):
    for k in range(NC):
        j = (k + 1) % NC; g.F([r0[k], r0[j], r1[j], r1[k]], M["kursun"])
g.F(halkalar[0][::-1], M["kursun"]); g.F(halkalar[-1], M["kursun"])
cati = g.obj()

# ======================= KASNAK =======================
NK = 48
g = A.G("Kasnak", [M["kursun"], M["silme"]])
g.prism(A.circle(Vector((0, 0)), P["kasnak_r"], NK), P["cati_tepe"] - 0.10, P["kasnak_ust"] + EPS, M["kursun"], M["kursun"])
g.prism(A.circle(Vector((0, 0)), P["korn_k_r"], NK), P["kasnak_ust"], P["korn_k_ust"], M["silme"], M["silme"])
kasnak = g.obj()

# ======================= KUBBE (etek + gövde + alem) =======================
g = A.G("Kubbe", [M["kursun"], M["alem"]])
prof = [(P["korn_k_r"] + 0.03, P["korn_k_ust"] - EPS), (P["kubbe_r"] + 0.05, P["kubbe_taban"])]
NPH = 9
for k in range(1, NPH + 1):
    ph = (math.pi / 2) * k / NPH
    prof.append((P["kubbe_r"] * math.cos(ph) if k < NPH else 0.0, P["kubbe_taban"] + (P["kubbe_tepe"] - P["kubbe_taban"]) * math.sin(ph)))
g.lathe(Vector((0, 0)), prof, NK, [M["kursun"]])
za, ha = P["kubbe_tepe"] - EPS, P["alem_h"]
g.lathe(Vector((0, 0)), [(0.16, za), (0.22, za + 0.10), (0.10, za + 0.22), (0.18, za + 0.40), (0.07, za + 0.62), (0.05, za + 0.85), (0.0, za + ha)], 8, [M["alem"]])
kubbe = g.obj()

# ======================= GİRİŞ HOLÜ VE SUNDURMA =======================
hw, hd, ht = P["hol_w"] / 2, P["hol_d"], P["hol_tas"]
t_ = P["hol_duvar"]; zt_ = P["hol_tavan"]
y_w = -D2 + EPS                       # hol arka yüzü gövdeye 2 mm gömülü
y_h = -D2 - hd                        # hol ön yüzü
kw2, kh2 = P["hol_kapi_w"] / 2, 0.12 + P["hol_kapi_h"]
g = A.G("Giris_Holu", [M["cephe"], M["ahsap"], M["kursun"], M["hol_cam"]])               # C: hol döşemesi cephe malzemesiyle (draw call ≤ 30; Levha 112: açık renk taş)
zs_ = P["hol_sacak_alt"] + EPS
if DETAY:   # kabuk: döşeme + üç duvar (önde kapı boşluğu) + tavan; holün içi kapıdan görünür, türbe iç mekânı modellenmez
    kutu(g, -hw, hw, y_h, y_w, 0.0, 0.12, M["cephe"])
    kutu(g, -hw, -hw + t_, y_h, y_w, 0.12 - EPS, zs_, M["cephe"])
    kutu(g, hw - t_, hw, y_h, y_w, 0.12 - EPS, zs_, M["cephe"])
    kutu(g, -hw + t_ - EPS, -kw2, y_h, y_h + t_, 0.12 - EPS, zs_, M["cephe"])
    kutu(g, kw2, hw - t_ + EPS, y_h, y_h + t_, 0.12 - EPS, zs_, M["cephe"])
    kutu(g, -kw2 - EPS, kw2 + EPS, y_h, y_h + t_, kh2, zs_, M["cephe"])
    kutu(g, -hw + t_ - EPS, hw - t_ + EPS, y_h + t_ - EPS, y_w, zt_, zt_ + 0.10, M["ahsap"])            # tavan (koyu ahşap)
    # ahşap dikmeler: ön köşeler (L), yan ortalar, kapı pervazı (pdf320 Levha 114, pdf325 Levha 125)
    for sx in (-1, 1):
        x0, x1 = sorted((sx * (hw - 0.14), sx * (hw + 0.03)))
        kutu(g, x0, x1, y_h - 0.03, y_h + 0.14, 0.40, zs_, M["ahsap"])
        x0, x1 = sorted((sx * (hw - EPS), sx * (hw + 0.03)))
        kutu(g, x0, x1, (y_h + y_w) / 2 - 0.07, (y_h + y_w) / 2 + 0.07, 0.40, zs_, M["ahsap"])
        kutu(g, x0, x1, y_w - 0.14, y_w, 0.40, zs_, M["ahsap"])
        x0, x1 = sorted((sx * kw2, sx * (kw2 + 0.14)))
        kutu(g, x0, x1, y_h - 0.03, y_h + EPS, 0.12, zs_, M["ahsap"])
    kutu(g, -kw2 + EPS, kw2 - EPS, y_h - 0.025, y_h + EPS, kh2, kh2 + 0.14, M["ahsap"])                 # kapı başlığı: dikmelerin arasında (üst üste binen yüz = siyah kare)
    # sivri kemerli camlı pencereler: önde 2, yanlarda 2'şer (ahşap kasa + koyu cam, kayıt dokuda)
    pw_h, pe_h, pt_h = P["hol_pen_w"], P["hol_pen_esik"], P["hol_pen_tepe"]
    hol_pen = [(Vector((sx * 1.85, y_h)), Vector((1, 0)), Vector((0, -1))) for sx in (-1, 1)] + \
              [(Vector((sx * hw, y_w - d_)), Vector((0, 1)), Vector((sx, 0))) for sx in (-1, 1) for d_ in (0.80, 2.40)]
    for O_, T_, N_ in hol_pen:
        panel_uv(g, O_, T_, N_, kemer_sivri(pw_h - 0.004, pe_h + 0.002, pt_h - 0.002), -EPS, 0.03, M["hol_cam"], M["ahsap"])
        cerceve(g, O_, T_, N_, kemer_sivri(pw_h, pe_h, pt_h), kemer_sivri(pw_h + 0.16, pe_h - 0.08, pt_h + 0.08), -EPS, 0.06, M["ahsap"])
else:
    kutu(g, -hw, hw, y_h, y_w, 0.0, zs_, M["cephe"])
kutu(g, -hw - 0.12, hw + 0.12, y_h - 0.12, y_w, P["hol_sacak_alt"], P["hol_sacak_ust"], M["ahsap"])
# kırma çatı: ön mahya noktası holün ortasında, mahya gövdeye dayanır (tepeden fotoğraf)
b0 = [Vector((-hw - ht, y_h - ht)), Vector((hw + ht, y_h - ht)), Vector((hw + ht, y_w)), Vector((-hw - ht, y_w))]
zr, zt = P["hol_sacak_ust"] - EPS, P["hol_cati_tepe"]
R1 = g.V(Vector((0, (y_h + y_w) / 2)), zt); R2 = g.V(Vector((0, y_w)), zt)
vb = [g.V(q, zr) for q in b0]
g.F([vb[0], vb[1], R1], M["kursun"]); g.F([vb[1], vb[2], R2, R1], M["kursun"]); g.F([vb[3], vb[0], R1, R2], M["kursun"])
g.F([vb[2], vb[3], R2], M["kursun"]); g.F(vb[::-1], M["kursun"])
# sundurma: iki sütunçe (E C2 PDF 117) + arka dikmeler + kemer alınlıkları + saçak + kırma çatı
sd, sw, sr = P["sun_d"], P["sun_w"] / 2, P["sun_sutun_r"]
y_s = y_h - sd
for sx in (-1, 1):
    g.lathe(Vector((sx * (sw - sr), y_s + sr)), [(sr * 1.35, 0.0), (sr * 1.35, 0.35), (sr, 0.42),
            (sr, P["sun_sacak_alt"] - 0.30), (sr * 1.4, P["sun_sacak_alt"] + EPS)], 8, [M["ahsap"]])
    if DETAY:
        x0, x1 = sorted((sx * (sw - 2 * sr), sx * sw))
        kutu(g, x0, x1, y_h - 0.10, y_h + EPS, 0.0, P["sun_sacak_alt"] + EPS, M["ahsap"])                # arka dikme (hol önüne bitişik; C: yere iner, 0,12 kotunda asılı kalıyordu)
        # yan yuvarlak kemer alınlığı (Levha 125)
        L_ = (y_h - 0.10) - (y_s + 2 * sr); Oy = (y_h - 0.10 + y_s + 2 * sr) / 2
        arc = kemer_yuvarlak(L_, 0, 4.45)[2:][::-1]
        al = [(-L_ / 2 - EPS, P["sun_sacak_alt"] + EPS), (-L_ / 2 - EPS, arc[0][1])] + arc + [(L_ / 2 + EPS, arc[-1][1]), (L_ / 2 + EPS, P["sun_sacak_alt"] + EPS)]
        panel(g, Vector((sx * (sw - sr), Oy)), Vector((0, 1)), Vector((sx, 0)), al, -0.04, 0.04, M["ahsap"])
if DETAY:   # ön sivri kemer alınlığı (Levha 111)
    Lf = 2 * (sw - 2 * sr)
    arc = kemer_sivri(Lf, 0, 4.60)[2:][::-1]
    al = [(-Lf / 2 - EPS, P["sun_sacak_alt"] + EPS), (-Lf / 2 - EPS, arc[0][1])] + arc + [(Lf / 2 + EPS, arc[-1][1]), (Lf / 2 + EPS, P["sun_sacak_alt"] + EPS)]
    panel(g, Vector((0, y_s + sr)), Vector((1, 0)), Vector((0, -1)), al, -0.04, 0.04, M["ahsap"])
cw = P["sun_cati_w"] / 2
kutu(g, -cw + 0.15, cw - 0.15, y_s - 0.05, y_h + EPS, P["sun_sacak_alt"], P["sun_sacak_ust"], M["ahsap"])
s0 = [Vector((-cw, y_s - 0.20)), Vector((cw, y_s - 0.20)), Vector((cw, y_h + EPS)), Vector((-cw, y_h + EPS))]
zs0, zs1 = P["sun_sacak_ust"] - EPS, P["sun_sacak_ust"] + 0.45
S1 = g.V(Vector((0, y_s + 0.55)), zs1); S2 = g.V(Vector((0, y_h + EPS)), zs1)
vs = [g.V(q, zs0) for q in s0]
g.F([vs[0], vs[1], S1], M["kursun"]); g.F([vs[1], vs[2], S2, S1], M["kursun"]); g.F([vs[3], vs[0], S1, S2], M["kursun"])
g.F([vs[2], vs[3], S2], M["kursun"]); g.F(vs[::-1], M["kursun"])
hol = g.obj()

# ======================= (B) DETAY: pencereler, kapı, kasnak konsolları, niş yanakları =======================
if DETAY:
    # --- Pencereler: mermer söve + akant kilit taşı + gerçek delikli demir şebeke (alfa kesme) ---
    g = A.G("Pencereler", [M["sove"], M["sebeke"]])                  # C: kilit taşı söve taşıyla aynı malzeme (draw call ≤ 30)
    sv = P["pen_sove"]
    for c, s_ in PENCERELER:
        O, T, N = CEPHE[c]; Oc = O + T * s_
        ic = kemer_yuvarlak(pw, pe, pt); dis = kemer_yuvarlak(pw + 2 * sv, pe - 0.06, pt + sv)
        cerceve(g, Oc, T, N, ic, dis, -EPS, 0.05, M["sove"])
        panel(g, Oc, T, N, [(-0.10, pt - 0.03), (0.10, pt - 0.03), (0.15, pt + sv), (-0.15, pt + sv)], 0.05 - EPS, 0.13, M["sove"])
        panel_uv(g, Oc, T, N, kemer_yuvarlak(pw - 0.004, pe + 0.002, pt - 0.002), -0.10, -0.094, M["sebeke"])
    pen = g.obj()

    # --- Kapi: türbe kapısı (gri mermer söve-pilastrlar, dilimli lünet, iki rozetli taş kuşak, ahşap lento ve kanatlar) + açık hol kapısı ---
    g = A.G("Kapi", [M["mermer"], M["sove"], M["kapi"], M["sebeke_k"]])          # C: lento kanatla aynı ahşap, lünet camı yok (arkada niş dibi koyu) → draw call ≤ 30
    O, T, N = CEPHE["G"]; kw, kc, ku, ktp = P["kapi_w"], P["kapi_cerceve"], P["kapi_uzenge"], P["kapi_tepe"]
    zb = ktp + 0.12
    for sx in (-1, 1):
        panel(g, O + T * (sx * (kw / 2 + kc / 2)), T, N, [(-kc / 2, 0.12), (kc / 2, 0.12), (kc / 2, zb), (-kc / 2, zb)], -EPS, 0.10, M["sove"])
        panel(g, O + T * (sx * (kw / 2 + kc / 2)), T, N, [(-kc / 2 - 0.04, zb), (kc / 2 + 0.04, zb), (kc / 2 + 0.04, zb + 0.14), (-kc / 2 - 0.04, zb + 0.14)], -EPS, 0.14, M["mermer"])
    dil = kemer_dilimli(kw, 0.0, ku, ktp)
    arc = dil[2:]                                                     # sağ üzengi → lob'lar → sol üzengi
    al = [(-kw / 2 - EPS, zb + 0.14), (-kw / 2 - EPS, ku)] + arc[::-1] + [(kw / 2 + EPS, ku), (kw / 2 + EPS, zb + 0.14)]
    panel(g, O, T, N, al, -EPS, 0.08, M["mermer"])                    # lünet çevresi (kemer köşeliği)
    panel(g, O, T, N, [(-kw / 2 - kc - 0.10, zb + 0.14), (kw / 2 + kc + 0.10, zb + 0.14), (kw / 2 + kc + 0.10, P["kapi_ust"]), (-kw / 2 - kc - 0.10, P["kapi_ust"])], -EPS, 0.16, M["mermer"])
    zr_ = (zb + 0.14 + P["kapi_ust"]) / 2
    for sx in (-1, 1):                                                # saçaklıktaki iki rozet (Levha 113), oval madalyon
        panel(g, O + T * (sx * (kw / 2 + kc / 2)), T, N, [(0.12 * math.cos(2 * math.pi * q / 10), zr_ + 0.17 * math.sin(2 * math.pi * q / 10)) for q in range(10)], 0.16 - EPS, 0.19, M["sove"])
    panel(g, O, T, N, [(-kw / 2, P["kapi_h"]), (kw / 2, P["kapi_h"]), (kw / 2, ku), (-kw / 2, ku)], -0.14, -0.04, M["kapi"])       # ahşap lento
    for a_, b_ in ((-kw / 2, -0.006), (0.006, kw / 2)):                                                                          # iki kanat (kapalı)
        panel(g, O, T, N, [(a_, 0.122), (b_, 0.122), (b_, P["kapi_h"]), (a_, P["kapi_h"])], -0.16, -0.10, M["kapi"])
    lunet = [(kw / 2 - 0.002, ku)] + arc[1:-1] + [(-kw / 2 + 0.002, ku)]
    panel_uv(g, O, T, N, lunet, -0.12, -0.114, M["sebeke_k"])                                                                    # lünet şebekesi
    for sx in (-1, 1):                                                # hol kapısı: iki kanat içe açık, yan duvara dik (pdf318 Levha 112)
        panel(g, Vector((sx * (kw2 - 0.03), y_h + t_ + 0.01)), Vector((0, 1)), Vector((1, 0)), [(0.0, 0.122), (kw2 - 0.02, 0.122), (kw2 - 0.02, kh2 - 0.01), (0.0, kh2 - 0.01)], -0.025, 0.025, M["kapi"])
    kapi = g.obj()

    # --- Kasnak konsolları: düz bant + 48 konsol + üst levha (arsiv_dis_guneybati_havadan) ---
    bpy.data.objects.remove(kasnak, do_unlink=True)
    g = A.G("Kasnak", [M["kursun"], M["silme"]])
    g.prism(A.circle(Vector((0, 0)), P["kasnak_r"], NK), P["cati_tepe"] - 0.10, P["kasnak_ust"] + EPS, M["kursun"], M["kursun"])
    g.prism(A.circle(Vector((0, 0)), P["kasnak_r"] + 0.14, NK), P["kasnak_ust"], 10.55, M["silme"], M["silme"])
    g.prism(A.circle(Vector((0, 0)), P["kasnak_r"] + 0.12, NK), 10.55 - EPS, 10.92 + EPS, M["silme"], M["silme"])      # konsollar arası zemin (sığ)
    for k in range(P["konsol_n"]):
        a = 2 * math.pi * (k + 0.5) / P["konsol_n"]; rm = P["kasnak_r"] + 0.109 + 0.045            # iç yüz 48-gen kirişinden 2 mm içeride
        g.prism(A.rect(Vector((rm * math.cos(a), rm * math.sin(a))), 0.09, 0.20, a), 10.55 - EPS, 10.92 + EPS, M["silme"], M["silme"])
    g.prism(A.circle(Vector((0, 0)), P["korn_k_r"], NK), 10.92, P["korn_k_ust"], M["silme"], M["silme"])
    kasnak = g.obj()

# yumuşak gölgeleme: eğri yüzler (kubbe, kasnak, çatı eteği) 35° üstü kenarlar keskin kalır
for o in (kubbe, kasnak, cati):
    bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
    bpy.ops.object.shade_smooth_by_angle(angle=math.radians(35))

def niş_yanaklari():
    """Pencere ve kapı nişlerinin yan yüzleri söve taşı rengi; yalnız niş dibi koyu cam (Levha 117: söve nişin içine döner)."""
    me = gov.data
    if M["sove"].name not in [m.name for m in me.materials]: me.materials.append(M["sove"])
    i_b = [m.name for m in me.materials].index(M["bosluk"].name); i_s = [m.name for m in me.materials].index(M["sove"].name)
    for p_ in me.polygons:
        if p_.material_index != i_b: continue
        c = p_.center; d = D2 - max(abs(c.x), abs(c.y))           # dış yüzden derinlik
        kapi_nisi = c.y < -D2 + 1.0 and abs(c.x) < P["kapi_w"] / 2 + 0.05
        if d < (P["kapi_nis_d"] if kapi_nisi else P["nis_d"]) - 0.01: p_.material_index = i_s
def uv_kursun():
    """Kurşun dikiş dokusu için UV: kubbe/kasnak silindirik (dilim aralığı ≈ 0,6 m), çatı eteği saçağa dik dikişler (0,55 m), hol çatıları düzlemsel."""
    for o in [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith("_")]:
        me = o.data; idx = [i for i, m in enumerate(me.materials) if m and m.name == M["kursun"].name]
        if not idx: continue
        uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
        for p_ in me.polygons:
            if p_.material_index not in idx: continue
            cos_ = [me.vertices[me.loops[li].vertex_index].co for li in p_.loop_indices]
            if o.name in ("Kubbe", "Kasnak"):
                a0 = math.atan2(p_.center.y, p_.center.x)
                for li, co in zip(p_.loop_indices, cos_):
                    a = math.atan2(co.y, co.x)
                    while a - a0 > math.pi: a -= 2 * math.pi
                    while a0 - a > math.pi: a += 2 * math.pi
                    uvl.data[li].uv = (a / (2 * math.pi) * 40, co.z / 0.9)
            elif o.name == "Cati_Etek":
                ex = abs(p_.center.x) >= abs(p_.center.y)
                for li, co in zip(p_.loop_indices, cos_): uvl.data[li].uv = ((co.y if ex else co.x) / 0.55, co.z / 0.45)
            else:
                ex = abs(p_.normal.x) > abs(p_.normal.y)
                for li, co in zip(p_.loop_indices, cos_): uvl.data[li].uv = ((co.y if ex else co.x) / 0.5, co.z / 0.8)
if DETAY:
    niş_yanaklari(); uv_kursun()

# ======================= (C) ÇEVRE: ağaç, figür, daire kaide, döşeme ve çim (plan §3, standart §1 ve §4) =======================
# Kaynak okuması (tepeden fotoğraf ≈ 24–26 px/m; Levha 111, 116, 120–123; arsiv fotoğrafları DOĞUDAN çekilmiş, bkz. FOTO_KAM):
#   çınar: Levha 111'de gövde hol ekseninde (pencere ortalarına göre x ≈ +0,1), sundurmanın ≈ 1,5 m önünde; büyük batı kolu sola eğik
#   sedir: GÜNEYDOĞU. Levha 111 sağ üst (doğu), Levha 116 sol üst (doğu cephesinin güney ucu, anıt mezar yanında), arsiv fotoğraflarında solda
#   manolya: kuzey (Levha 121 kuzey cephe önünde, Levha 122 kuzeybatıdan solda) ve kuzeydoğu (Levha 120 önde; tepeden kuzeydoğu tacı)
#   döşeme: yapının çevresi taş; doğu çim şeridi 11,6–15,1 m doğuda, y −3,5…7,7 (tepeden; arsiv_havadan_kuzey önündeki çim ve levha); kuzey çimi yapıdan ≈ 2,6 m sonra
# Zemin kotları: kaide üstü 0 · döşeme 0,002 · çim 0,004 · toprak çanak 0,006 (aynı düzlem yok; gömülme ≤ 2 mm)
Z_DOS, Z_CIM, Z_TOP = 0.002, 0.004, 0.006
CEVRE_AGAC = [  # ad, tür, merkez (x, y), boy (m), zemin kotu
    ("Cevre_Agac_01", "cinar", (0.10, -14.50), 16.0, Z_TOP),      # F Levha 111: hol ekseninde, sundurmanın 1,5 m önünde; taç saçağın üstünde
    ("Cevre_Agac_02", "manolya", (10.00, 13.00), 8.0, Z_CIM),     # F Levha 120 (önde) + tepeden kuzeydoğu tacı; kuzey çiminde
    ("Cevre_Agac_03", "manolya", (-1.50, 12.40), 7.5, Z_CIM),     # F Levha 121 (kuzey cephe orta–batı penceresi önü), Levha 122 (solda)
    ("Cevre_Agac_04", "sedir", (12.00, -11.00), 13.0, Z_TOP),     # F Levha 111 sağ üst, Levha 116 sol üst, arsiv fotoğrafları solda: güneydoğu
]
CEVRE_FIGUR = [  # akar3d.insan(); hepsi girişe (kuzeye) yönelik. Ayak tabanı 0,002·H → döşemeye 2 mm gömülü
    dict(poz="basamak", boy=1.64, kadin=True, konum=(0.15, -11.78), yon=90, renk=0, adim_yuk=0.118),   # hol eşiğine (0,12) çıkan
    dict(poz="yuruyen", boy=1.78, konum=(1.45, -16.00), yon=97, renk=1),                                # çınarın doğusundan sundurmaya yürüyen
    dict(poz="yuruyen", boy=1.66, kadin=True, konum=(-2.10, -17.50), yon=78, renk=2),                  # çınarın batısından
    dict(poz="yuruyen", boy=1.20, cocuk=True, konum=(-1.40, -17.20), yon=78, renk=1, adim_yuk=0.0),    # kadının yanında çocuk
]
D_PAY = 3.0                                     # K standart §1: en küçük çember + 3 m
DOSEME_KUTU = (-12.0, 18.4, -20.0, 11.3)        # F tepeden: yapı çevresi taş döşeme, doğuda evlere kadar (x0, x1, y0, y1); kaide kenarından 1,5 m içeride kesilir
CIM_KUTULAR = [(-4.0, 12.5, 11.3, 15.4), (11.6, 15.1, -3.5, 7.7)]    # F tepeden + Levha 120–121: kuzey çimi ve doğu çim şeridi (döşemenin üstünde, 2 mm yüksek)

def _elips(g, c, rx, ry, rz, m, seg=7, rings=3):
    """Elipsoid (Ulu Cami v23_cevre._elips): lathe + xy ölçek."""
    c = Vector(c); once = set(g.bm.verts)
    prof = [(0.0, -rz)] + [(math.sin(math.pi * k / (rings + 1)), -rz * math.cos(math.pi * k / (rings + 1))) for k in range(1, rings + 1)] + [(0.0, rz)]
    g.lathe(c.xy, [(max(r, 0.0), c.z + z) for r, z in prof], seg, [m])
    for v in set(g.bm.verts) - once:
        v.co.x = c.x + (v.co.x - c.x) * rx; v.co.y = c.y + (v.co.y - c.y) * ry

def _dal(g, a, b, r, m, n=4, uc=0.7):
    """Kapalı n-gen gövde/dal (Ulu Cami v23_cevre._dal), a → b, uçta r·uc."""
    a, b = Vector(a), Vector(b); d = (b - a).normalized()
    u = d.cross(Vector((0, 0, 1)))
    if u.length < 1e-4: u = Vector((1, 0, 0))
    u.normalize(); w = d.cross(u).normalized()
    va = [g.bm.verts.new(a + (u * math.cos(2 * math.pi * k / n) + w * math.sin(2 * math.pi * k / n)) * r) for k in range(n)]
    vb = [g.bm.verts.new(b + (u * math.cos(2 * math.pi * k / n) + w * math.sin(2 * math.pi * k / n)) * r * uc) for k in range(n)]
    for k in range(n):
        j = (k + 1) % n; g.F([va[k], va[j], vb[j], vb[k]], m)
    g.F(va[::-1], m); g.F(vb, m)

if CEVRE:
    M["govde_a"] = A.mat("Agac_Govde", "#7A634B", 0.90)
    M["yap_cinar"] = A.mat("Agac_Yaprak_Cinar", "#7FA35B", 0.90)
    M["yap_manolya"] = A.mat("Agac_Yaprak_Manolya", "#6E9450", 0.90)
    M["yap_sedir"] = A.mat("Agac_Sedir", "#3F7A5C", 0.90)

    def agac(ad, tur, c, boy, zg):
        x, y = c; z0 = zg - EPS
        if tur == "cinar":        # yaşlı çınar: kalın, hafif eğik gövde; geniş taç saçak kotunun üstünde (Levha 111)
            g = A.G(ad, [M["govde_a"], M["yap_cinar"]]); k = boy / 16.0
            tepe = (x + 0.30, y - 0.25, z0 + 8.6 * k)
            _dal(g, (x, y, z0), tepe, 0.38, M["govde_a"], 6, uc=0.62)
            _dal(g, (x - 0.05, y, z0 + 2.4 * k), (x - 1.9, y + 0.1, z0 + 10.8 * k), 0.20, M["govde_a"], 4)   # Levha 111: batıya eğik büyük kol
            TAC = [(-1.7, 0.5, 11.6, 3.0, 2.2), (1.5, -0.9, 12.2, 2.8, 2.2), (0.0, 1.0, 14.0, 2.6, 1.9), (-0.6, -1.9, 10.8, 2.3, 1.6)]
            for dx, dy, dz, rx, rz in TAC:
                _dal(g, tepe, (x + dx * 0.8, y + dy * 0.8, z0 + dz * k - 0.6), 0.15, M["govde_a"], 3)
                _elips(g, (x + dx, y + dy, z0 + dz * k), rx * k, rx * 0.95 * k, rz * k, M["yap_cinar"], 7, 3)
        elif tur == "manolya":    # yaprak dökmeyen, koyu parlak, oval taç (Levha 120–121)
            g = A.G(ad, [M["govde_a"], M["yap_manolya"]]); k = boy / 8.0
            _dal(g, (x, y, z0), (x, y, z0 + 3.2 * k), 0.15, M["govde_a"], 5)
            _elips(g, (x, y, z0 + 4.6 * k), 2.5 * k, 2.4 * k, 3.3 * k, M["yap_manolya"], 8, 4)
            _elips(g, (x + 1.3 * k, y - 0.9 * k, z0 + 3.6 * k), 1.6 * k, 1.5 * k, 1.7 * k, M["yap_manolya"], 6, 3)
            _elips(g, (x - 1.1 * k, y + 1.0 * k, z0 + 5.9 * k), 1.5 * k, 1.5 * k, 1.6 * k, M["yap_manolya"], 6, 3)
        else:                     # sedir: katlı, eteği yere inen taç; gövde görünmez (arsiv_dis_guneybati) → tek malzeme
            g = A.G(ad, [M["yap_sedir"]]); k = boy / 13.0
            prof = [(0.0, z0), (3.3, 0.9), (2.1, 3.0), (2.8, 3.3), (1.7, 5.6), (2.3, 5.9), (1.2, 8.3), (1.6, 8.6), (0.6, 10.9), (0.0, 13.0)]
            g.lathe(Vector((x, y)), [(r * k, z if i == 0 else z * k) for i, (r, z) in enumerate(prof)], 8, [M["yap_sedir"]])
        return g.obj()
    AGACLAR = [agac(*a_) for a_ in CEVRE_AGAC]

    FIGURLER = []
    for i_, kw_ in enumerate(CEVRE_FIGUR, 1):
        kw_ = dict(kw_); x_, y_ = kw_.pop("konum")
        FIGURLER.append(A.insan(f"Olcek_Insan_{i_:02d}", konum=(x_, y_, Z_DOS - EPS + 0.002 * kw_["boy"]), **kw_))

    # --- en küçük çevreleyen çember (Welzl): yapı + sundurma + ağaç + figür köşeleri (xy) ---
    def _cember2(a, b): c = (a + b) / 2; return c, (a - c).length
    def _cember3(a, b, c):
        d = 2 * (a.x * (b.y - c.y) + b.x * (c.y - a.y) + c.x * (a.y - b.y))
        if abs(d) < 1e-12: return max((_cember2(p, q) for p, q in ((a, b), (a, c), (b, c))), key=lambda t: t[1])
        ux = ((a.length_squared) * (b.y - c.y) + (b.length_squared) * (c.y - a.y) + (c.length_squared) * (a.y - b.y)) / d
        uy = ((a.length_squared) * (c.x - b.x) + (b.length_squared) * (a.x - c.x) + (c.length_squared) * (b.x - a.x)) / d
        o = Vector((ux, uy)); return o, (a - o).length
    def mec(pts):
        import random as _r
        pts = list(pts); _r.Random(1).shuffle(pts); ic = lambda c, p: (p - c[0]).length <= c[1] + 1e-7
        c = (pts[0], 0.0)
        for i, p in enumerate(pts):
            if ic(c, p): continue
            c = (p, 0.0)
            for j in range(i):
                q = pts[j]
                if ic(c, q): continue
                c = _cember2(p, q)
                for k in range(j):
                    if not ic(c, pts[k]): c = _cember3(p, q, pts[k])
        return c
    _pts = {}
    for o in bpy.data.objects:
        if o.type == "MESH" and not o.name.startswith(("_", "Zemin", "REF")):
            for v in o.data.vertices:
                w_ = o.matrix_world @ v.co; _pts[(round(w_.x, 3), round(w_.y, 3))] = Vector((w_.x, w_.y))
    K_MERKEZ, R_IC = mec(_pts.values()); K_R = R_IC + D_PAY
    K_SEG = 128

    # --- kaide: daire, kalınlık 0,6, üst pah 0,15 (Koza Han v13 kaide(), daireye uyarlandı) ---
    MZ = {"ust": A.mat("Zemin", "#C4BDAF", 0.90), "yan": A.mat("Zemin_Yan", "#A39A8B", 0.90), "dos": A.mat("Zemin_Doseme", "#B3A590", 0.85),
          "cim": A.mat("Zemin_Cim", "#9DB86A", 0.95), "top": A.mat("Zemin_Toprak", "#A5845F", 0.95)}
    doku_bagla(MZ["dos"], "doseme_tas.png")                          # AO'dan önce bağlanır (AO çarpımı Base Color bağlantısını devralır)
    def halka(r): return [K_MERKEZ + Vector((r * math.cos(2 * math.pi * k / K_SEG), r * math.sin(2 * math.pi * k / K_SEG))) for k in range(K_SEG)]
    def kaide():
        pah = 0.15; gz = A.G("Zemin_Kaide", [MZ["ust"], MZ["yan"]])
        ust = [gz.V(q, 0.0) for q in halka(K_R - pah)]; ors = [gz.V(q, -pah) for q in halka(K_R)]; alt = [gz.V(q, -0.6) for q in halka(K_R)]
        gz.F(ust, MZ["ust"])
        for k in range(K_SEG):
            j = (k + 1) % K_SEG
            gz.F([ust[j], ust[k], ors[k], ors[j]], MZ["yan"]); gz.F([ors[j], ors[k], alt[k], alt[j]], MZ["yan"])
        gz.F(alt[::-1], MZ["yan"])
        return gz.obj()
    KAIDE = kaide()

    def kirp(poly, kesici):
        """Sutherland–Hodgman: dışbükey poly ∩ dışbükey kesici (ikisi de saat yönü tersi)."""
        out = list(poly)
        for i in range(len(kesici)):
            a, b = kesici[i], kesici[(i + 1) % len(kesici)]; ic = lambda p: (b - a).cross(p - a) >= 0
            inp, out = out, []
            for j in range(len(inp)):
                p, q = inp[j], inp[(j + 1) % len(inp)]
                kes_ = lambda: p + (q - p) * ((b - a).cross(a - p) / (b - a).cross(q - p))
                if ic(q):
                    if not ic(p): out.append(kes_())
                    out.append(q)
                elif ic(p): out.append(kes_())
            if not out: break
        return out
    SINIR = halka(K_R - 1.5)                         # döşeme ve tarhlar kaide kenarından 1,5 m içeride
    kutu_p = lambda x0, x1, y0, y1: [Vector((x0, y0)), Vector((x1, y0)), Vector((x1, y1)), Vector((x0, y1))]
    gd = A.G("Zemin_Doseme", [MZ["dos"]]); gd.prism(kirp(kutu_p(*DOSEME_KUTU), SINIR), -EPS, Z_DOS, MZ["dos"], MZ["dos"]); zdos = gd.obj()
    gc = A.G("Zemin_Cim", [MZ["cim"], MZ["top"]])
    CIM_ALAN = 0.0
    for kt in CIM_KUTULAR:
        pc = kirp(kutu_p(*kt), SINIR)
        if len(pc) >= 3:
            gc.prism(pc, -EPS, Z_CIM, MZ["cim"], MZ["cim"])
            CIM_ALAN += 0.5 * abs(sum(pc[i].x * pc[(i + 1) % len(pc)].y - pc[(i + 1) % len(pc)].x * pc[i].y for i in range(len(pc))))
    for ad_, tur_, c_, boy_, zg_ in CEVRE_AGAC:                       # toprak çanağı (çim üstündekiler hariç)
        if zg_ == Z_TOP: gc.prism(A.circle(Vector(c_), 1.4 if tur_ == "sedir" else 1.1, 8), -0.001, Z_TOP, MZ["top"], MZ["top"])
    gc.obj()
    uvl_ = zdos.data.uv_layers.new(name="UVMap")                     # döşeme dokusu: karo 1,6 m, dünya xy
    for l_ in zdos.data.loops:
        co_ = zdos.data.vertices[l_.vertex_index].co; uvl_.data[l_.index].uv = (co_.x / 1.6, co_.y / 1.6)
    CEVRE_RAPOR = {"kaide": {"bicim": "daire", "merkez_m": [round(K_MERKEZ.x, 2), round(K_MERKEZ.y, 2)], "R_ic_m": round(R_IC, 2), "pay_m": D_PAY,
                             "R_m": round(K_R, 2), "kalinlik_m": 0.6, "ust_pah_m": 0.15},
                   "cim_orani": round(CIM_ALAN / (math.pi * K_R ** 2), 3)}
    print("CEVRE", json.dumps(CEVRE_RAPOR))

    # --- AO (standart §2: taban 0,70; Kubbe ve Kasnak 0,85), sonra dokular MIX (multiply) A girişine; alfa bağlantısı (şebeke) dokunulmaz ---
    A.ao_vertex(samples=32)
    AO_TABAN = {"Kubbe": 0.85, "Kasnak": 0.85}
    for o in [o for o in bpy.data.objects if o.type == "MESH" and o.data.color_attributes.get("AO")]:
        tb_ = AO_TABAN.get(o.name, 0.70)
        for d_ in o.data.color_attributes["AO"].data:
            c_ = tb_ + (1 - tb_) * d_.color[0]; d_.color = (c_, c_, c_, 1.0)
    for m_ in [M[k_] for k_ in DOKULU] + [MZ["dos"]]:
        nt = m_.node_tree; tx = nt.nodes.get("DOKU"); mul = next((n for n in nt.nodes if n.type == "MIX" and n.blend_type == 'MULTIPLY'), None)
        if tx and mul: nt.links.new(tx.outputs["Color"], next(i for i in mul.inputs if i.identifier == "A_Color"))
    import agac_doku as AD                                             # ağaç dokusu AO çarpımından sonra (Koza Han v13)
    CEVRE_RAPOR["agac_doku"] = AD.agac_dokula(AGACLAR, DOKU, {"Agac_Yaprak_Cinar": "yaprak_7FA35B.png", "Agac_Yaprak_Manolya": "yaprak_6E9450.png",
                                                              "Agac_Sedir": "yaprak_3F7A5C.png"}, {"Agac_Govde": "agac_govde.png"})


# ======================= kontrol ve render =======================
os.makedirs(KONTROL, exist_ok=True); os.makedirs(TMP, exist_ok=True)
with open(os.path.join(TMP, "P_v01.json"), "w", encoding="utf-8") as fh: json.dump(P, fh, ensure_ascii=False, indent=1)
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = int(os.environ.get("OGT_ORNEK", "24")); sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
bg.inputs[0].default_value = (0.80, 0.80, 0.80, 1); bg.inputs[1].default_value = 1.0
sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = 1.25; sun.data.angle = math.radians(35); sun.rotation_euler = (math.radians(50), 0, math.radians(-35))

def kamera(ad, loc, hedef=None, orto=None, lens=35, rotm=None, sensor=36.0):
    cd = bpy.data.cameras.get(ad) or bpy.data.cameras.new(ad)
    if orto: cd.type = 'ORTHO'; cd.ortho_scale = orto
    else: cd.type = 'PERSP'; cd.lens = lens
    cd.sensor_fit = 'HORIZONTAL'; cd.sensor_width = sensor; cd.clip_start = 0.1; cd.clip_end = 2000
    cam = bpy.data.objects.get(ad) or bpy.data.objects.new(ad, cd)
    if cam.name not in sc.collection.objects: sc.collection.objects.link(cam)
    cam.location = Vector(loc)
    if rotm is not None: cam.rotation_euler = rotm.to_euler()
    else: cam.rotation_euler = (Vector(hedef) - cam.location).to_track_quat('-Z', 'Y').to_euler()
    return cam

def kamera_foto(ad, loc, r, u, f, fpx, W):
    """Fotoğraftan çözülmüş kamera (kontrol/_tmp çözümü): r sağ, u yukarı, f ileri; fpx odak (piksel), W görüntü genişliği."""
    m = Matrix((r, u, [-c for c in f])).transposed()
    return kamera(ad, loc, rotm=m, lens=fpx * 36.0 / W)

def render(cam, ad, res, saydam=True, klasor=None):
    sc.camera = cam; sc.render.resolution_x, sc.render.resolution_y = res; sc.render.resolution_percentage = 100
    sc.render.film_transparent = saydam
    sc.render.filepath = os.path.join(klasor or KONTROL, f"{ad}.png"); bpy.ops.render.render(write_still=True)
    return sc.render.filepath

# geçici zemin (yalnız A/B render'ı; adı '_' ile başlar → GLB'ye girmez). C'de kaide ve döşeme var.
if not CEVRE:
    zg = A.G("_zemin_tmp", [A.mat("_Zemin_tmp", "#C4BDAF", 0.90)])
    zg.prism(A.circle(Vector((0, -2)), 40.0, 48), -0.30, -0.001, A.mat("_Zemin_tmp", "#C4BDAF", 0.90), A.mat("_Zemin_tmp", "#C4BDAF", 0.90))
    zemin_tmp = zg.obj()
else:
    zemin_tmp = bpy.data.objects["Zemin_Kaide"]

if CEVRE: RENDERLER_VARS = "havadan,ust_orto,sunum_havadan_kd,sunum_havadan_dogu,sunum_guney,sunum_kd,sunum_gd,kapi_ic,kasnak_yakin,sundurma_yakin,kose_yakin"
else: RENDERLER_VARS = "kutle_havadan,ust_orto,kuzey_havadan" + (",guney_cephe,pencere_yakin,kose_yakin,kapi_yakin,kapi_ic,kasnak_yakin,sundurma_yakin" if DETAY else "")
RENDERLER = os.environ.get("OGT_RENDER", RENDERLER_VARS).split(",")
FOTO_KAM = {
    # C düzeltmesi: iki arsiv fotoğrafı da DOĞUDAN çekilmiş; A/B'deki kuzeybatı/kuzey çözümü kare gövdenin 90° simetrisi yüzünden eşdeğer hata
    # veriyordu. Kanıt: arsiv_havadan_kuzey önündeki çim şeridi ve beyaz levha tepeden fotoğrafta DOĞU şeridinde, önündeki kırmızı çatılı
    # evler doğuda; arsiv_dis_guneybati ön cephesinin sol ucundaki anıt mezar parmaklığı anahtar plandaki 5 numaralı noktada (doğu cephesi
    # güney ucu, Levha 116). Çözümler z ekseni çevresinde −90° döndürüldü: (x, y) → (y, −x); piksel hataları aynı (25 / 19 px).
    # arsiv_dis_guneybati_havadan.jpg (2400 × 1835): kuzeydoğudan, ön cephe = doğu cephesi, sağdaki yan yüz = kuzey cephesi; arkada Uludağ eteği
    "gb": dict(loc=(24.71, 10.75, 9.05), r=(-0.4071, 0.9132, -0.0199), u=(-0.0720, -0.0103, 0.9974), f=(-0.9105, -0.4075, -0.0699), fpx=1736.3, W=2400, H=1835),
    # arsiv_havadan_kuzey.jpg (2400 × 1797): dosya adı «kuzey» ama çekim DOĞUDAN; ön cephe = doğu cephesi
    "kuzey": dict(loc=(53.19, 2.05, 25.97), r=(-0.0392, 0.9992, -0.0099), u=(-0.1596, 0.0035, 0.9872), f=(-0.9864, -0.0403, -0.1593), fpx=1587.8, W=2400, H=1797),
}
if "kutle_havadan" in RENDERLER:
    k = FOTO_KAM["gb"]; cam = kamera_foto("CAM_GB", k["loc"], k["r"], k["u"], k["f"], k["fpx"], k["W"])
    render(cam, "kutle_havadan_ham", (1200, int(1200 * k["H"] / k["W"])), saydam=False, klasor=TMP)
if "ust_orto" in RENDERLER:
    zemin_tmp.hide_render = not CEVRE                                # C: kaide, döşeme, çim ve ağaçlar tepeden fotoğrafla karşılaştırılır
    render(kamera("CAM_Ust", (0, -2.0, 120), (0, -2.0, 0), orto=30.0), "ust_orto_ham", (1000, 1000), saydam=True, klasor=TMP)
    zemin_tmp.hide_render = False
if "kuzey_havadan" in RENDERLER:
    k = FOTO_KAM["kuzey"]; cam = kamera_foto("CAM_Kuzey", k["loc"], k["r"], k["u"], k["f"], k["fpx"], k["W"])
    render(cam, "kuzey_havadan_ham", (1200, int(1200 * k["H"] / k["W"])), saydam=False, klasor=TMP)

# --- onay B: fotoğraf açıları (yurt2024 sayfa fotoğrafları; kamera konumu perspektif ölçümünden: göz 1,6 m) ---
B_KAM = {
    "guney_cephe": dict(loc=(-0.3, -23.4, 1.6), tgt=(-0.3, -8.4, 4.14), lens=28.0, res=(1386, 786)),     # pdf318 Levha 111: cepheden ≈ 15 m
    "pencere_yakin": dict(loc=(13.2, 0.0, 2.45), tgt=(8.4, 0.0, 2.45), lens=50.0, res=(700, 1130)),      # pdf321 Levha 117: doğu orta pencere
    "kose_yakin": dict(loc=(-21.0, 20.5, 1.6), tgt=(-7.0, 5.5, 4.4), lens=24.0, res=(1386, 950)),       # pdf324 Levha 122: kuzeybatı köşe pilastrı
    "kapi_yakin": dict(loc=(0.0, -15.2, 1.65), tgt=(0.0, -8.4, 2.0), lens=30.0, res=(1100, 1100)),      # sundurmadan hol kapısı ve türbe kapısı
    "kasnak_yakin": dict(loc=(-9.0, 15.0, 13.0), tgt=(0.0, 0.0, 10.8), lens=50.0, res=(1300, 900)),     # konsollu korniş, etek–kasnak birleşimi
    "kapi_ic": dict(loc=(0.0, -11.35, 1.55), tgt=(0.0, -8.4, 2.1), lens=24.0, res=(1000, 1100), isik=True),   # hol içinden türbe kapısı (yalnız render ışığı)
    "sundurma_yakin": dict(loc=(6.5, -15.5, 2.2), tgt=(0.5, -10.5, 3.2), lens=26.0, res=(1300, 1000)),  # pdf320 Levha 114 benzeri: sundurma ve hol yanı
}
for ad_, k_ in B_KAM.items():
    if ad_ in RENDERLER:
        li = None
        if k_.get("isik"):
            li = bpy.data.objects.new("_ic_isik", bpy.data.lights.new("_ic_isik", 'POINT')); sc.collection.objects.link(li)
            li.data.energy = 250; li.data.shadow_soft_size = 0.8; li.location = (0.0, -10.0, 4.3)
        render(kamera("CAM_" + ad_, k_["loc"], k_["tgt"], lens=k_["lens"]), ad_ + "_ham", k_["res"], saydam=False, klasor=TMP)
        if li: bpy.data.objects.remove(li, do_unlink=True)

# --- onay C: standart havadan + 5 sunum açısı (sunum: kaideli, dünya rengi 0,80 gri; fotoğraflı olanlar kontrol_v01.py C ile yan yana) ---
if CEVRE:
    ORT = (K_MERKEZ.x, K_MERKEZ.y, 3.0)
    def kamera_iso(ad, hedef, d, el_d, az_d, orto):
        el, az = math.radians(el_d), math.radians(az_d); t = Vector(hedef)
        return kamera(ad, t + Vector((d * math.cos(el) * math.cos(az), d * math.cos(el) * math.sin(az), d * math.sin(el))), t, orto=orto)
    if "havadan" in RENDERLER:                                        # standart §2: yükseklik 32°, yatay 45°, ortografik, 1800 × 1600, saydam
        render(kamera_iso("CAM_Havadan", ORT, 150.0, 32, 45, round(2.5 * K_R, 1)), "havadan", (1800, 1600))
    for ad_, fk_ in (("sunum_havadan_kd", "gb"), ("sunum_havadan_dogu", "kuzey")):   # arsiv fotoğraflarının çözülmüş kameraları (doğudan)
        if ad_ in RENDERLER:
            k = FOTO_KAM[fk_]; render(kamera_foto("CAM_" + ad_, k["loc"], k["r"], k["u"], k["f"], k["fpx"], k["W"]), ad_, (1600, int(1600 * k["H"] / k["W"])), saydam=False)
    SUNUM_KAM = {
        "sunum_guney": dict(loc=(-0.3, -23.4, 1.6), tgt=(-0.3, -8.4, 4.14), lens=28.0, res=(1600, 907)),   # Levha 111 (açı 1), B guney_cephe kamerası
        "sunum_kd": dict(loc=(10.5, 24.0, 1.6), tgt=(-6.0, 7.0, 3.6), lens=24.0, res=(1600, 907)),         # Levha 120 (açı 6): kuzeydoğudan, kuzey cephe sağa kaçar, manolya önde
        "sunum_gd": dict(loc=(15.0, -35.0, 14.0), tgt=(0.5, -4.0, 3.0), lens=30.0, res=(1600, 1100)),     # güneyden-güneydoğudan genel: giriş, sundurma, figürler, kaide
    }
    for ad_, k_ in SUNUM_KAM.items():
        if ad_ in RENDERLER: render(kamera("CAM_" + ad_, k_["loc"], k_["tgt"], lens=k_["lens"]), ad_, k_["res"], saydam=False)

mk = A.mesh_kontrol()
rap = {"asama": ASAMA, "ucgen_toplam": sum(v["ucgen"] for v in mk.values()), "parcalar": mk,
       "draw_call": sum(len(o.material_slots) for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin")))}
if CEVRE:
    grup = lambda n: "agac" if n.startswith("Cevre_Agac") else "figur" if n.startswith("Olcek_") else "yapi"
    rap["butce"] = {g_: sum(v["ucgen"] for n, v in mk.items() if grup(n) == g_) for g_ in ("yapi", "agac", "figur")}
    rap.update(CEVRE_RAPOR)
with open(os.path.join(TMP, f"kontrol_{ASAMA}.json"), "w", encoding="utf-8") as fh: json.dump(rap, fh, ensure_ascii=False, indent=1)
print("RAPOR", json.dumps({k: v for k, v in rap.items() if k != "parcalar"}, ensure_ascii=False), {k: v for k, v in mk.items() if v["acik_kenar"] or v["manifold_degil"]})

# ======================= (C) TESLİM: GLB (zeminsiz + sunum), GLB denetimi, kontrol_hepsi, renkler.json, blend =======================
# OGT_TESLIM=1 yalnız onay C'den sonra: export/, blend/ ve kontrol/v01/ raporları yazılır. Aksi halde GLB'ler kontrol/_tmp/ altına deneme olarak yazılır.
def glb_denetle(yol):
    """GLB JSON bölümünü açar: boyut, Draco, düğüm adları, malzeme alphaMode."""
    with open(yol, "rb") as fh: veri = fh.read()
    n_ = int.from_bytes(veri[12:16], "little"); js = json.loads(veri[20:20 + n_].decode("utf-8"))
    return {"bayt": len(veri), "draco": "KHR_draco_mesh_compression" in js.get("extensionsUsed", []),
            "dugumler": sorted(nd.get("name", "") for nd in js.get("nodes", []) if "mesh" in nd),
            "alphaMode": {m.get("name"): m.get("alphaMode", "OPAQUE") for m in js.get("materials", []) if m.get("alphaMode", "OPAQUE") != "OPAQUE" or "Sebeke" in m.get("name", "")},
            "alphaCutoff": {m.get("name"): m.get("alphaCutoff") for m in js.get("materials", []) if "alphaCutoff" in m}}

if CEVRE:
    TESLIM = os.environ.get("OGT_TESLIM", "0") == "1"
    def ortala(k):
        """_sunum.glb'de orijin = kaide merkezi: dışa aktarım sırasında bütün nesneler −K_MERKEZ kaydırılır (k = 1), sonra geri alınır (k = −1)."""
        for o in bpy.data.objects:
            if o.type == "MESH" and not o.name.startswith(("REF", "_")): o.location.x -= k * K_MERKEZ.x; o.location.y -= k * K_MERKEZ.y
    g_ana, g_sun = (EXPORT, EXPORT_SUNUM) if TESLIM else (os.path.join(TMP, "deneme.glb"), os.path.join(TMP, "deneme_sunum.glb"))
    os.makedirs(os.path.dirname(g_ana), exist_ok=True)
    A.disa_aktar(g_ana, draco=True)                                   # zeminsiz (Zemin_* hariç), figürler dahil, orijin yapı merkezi
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.data.objects:
        if o.type == "MESH" and not o.name.startswith(("REF", "_")): o.select_set(True)
    kw_ = dict(filepath=g_sun, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
    ortala(1)
    try: bpy.ops.export_scene.gltf(export_draco_mesh_compression_enable=True, **kw_)
    except Exception: bpy.ops.export_scene.gltf(**kw_)
    ortala(-1)
    rap["glb"], rap["glb_sunum"] = glb_denetle(g_ana), glb_denetle(g_sun)
    rap["glb_orijin"] = {"ana": "yapı merkezi (gövde karesinin ortası, z = 0)", "sunum": f"kaide merkezi (yapı merkezine göre {K_MERKEZ.x:+.2f} doğu, {K_MERKEZ.y:+.2f} kuzey)"}
    print("GLB", json.dumps({k: rap[k] for k in ("glb", "glb_sunum")}, ensure_ascii=False))
    if TESLIM:
        rap["kontrol_hepsi"] = A.kontrol_hepsi(KONTROL, "kontrol")
        # renk denetimi (standart §5.3): bina malzemeleri; zemin (§1), bitki (§3) ve figür (§4) standart sabit değerleri ayrı sınıfta
        import colorsys
        SAPMA = {"Cephe_Krem": "standart «Krem sıva» #E8DFCB → #E9DFC6 (S 0,125 → 0,150): pilastr ve silmeler (#ECEAE4) cepheden ayrı okunsun; Levha 121 nötr, arsiv fotoğrafı sıcak krem",
                 "Silme_Beyaz": "pilastr, korniş, subasman: standart «Mermer» ana tonu (fotoğrafta beyaza yakın, cepheden açık)",
                 "Sove_Tas": "pencere ve kapı söveleri, kilit taşı: standart «Mermer» gölge tonu (fotoğrafta gri, damarlı)",
                 "Sebeke_Beyaz": "standart «Demir şebeke» #36413F yerine beyaz: şebekeler fotoğraflarda beyaz boyalı (Levha 117, 121)",
                 "Sebeke_Kapi": "kapı lüneti şebekesi beyaz (Levha 113)"}
        renk = {}
        for k_, n_, hx_, r_, mt_, gen_ in MAT:
            renk[n_] = (hx_, r_, mt_, "bina_genis" if gen_ else "bina_detay")
        for n_, hx_, r_, sinif_ in (("Agac_Govde", "#7A634B", 0.90, "bitki_standart_3"), ("Agac_Yaprak_Cinar", "#7FA35B", 0.90, "bitki_standart_3"),
                                    ("Agac_Yaprak_Manolya", "#6E9450", 0.90, "bitki_standart_3"), ("Agac_Sedir", "#3F7A5C", 0.90, "bitki_standart_3"),
                                    ("Zemin", "#C4BDAF", 0.90, "zemin_standart_1"), ("Zemin_Yan", "#A39A8B", 0.90, "zemin_standart_1"), ("Zemin_Doseme", "#B3A590", 0.85, "zemin_standart_1"),
                                    ("Zemin_Cim", "#9DB86A", 0.95, "zemin_standart_1"), ("Zemin_Toprak", "#A5845F", 0.95, "zemin_standart_1")):
            renk[n_] = (hx_, r_, 0.0, sinif_)
        for hx_ in A.FIGUR_RENKLER: renk["Olcek_" + hx_[1:]] = (hx_, 0.8, 0.0, "figur_standart_4")
        kullanilan = {s_.material.name for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("_", "REF")) for s_ in o.material_slots if s_.material}
        renkler = {"aciklama": "Orhan Gazi Türbesi v01 malzeme renkleri. Kural (standart §3): bina_genis malzemelerde HSV V ≥ 0,72. Zemin (§1), bitki (§3) ve figür (§4) renkleri standartta sabit; V kuralı onlara uygulanmaz.",
                   "malzemeler": {}}
        for n_ in sorted(kullanilan):
            hx_, r_, mt_, sinif_ = renk[n_]
            h_, s_, v_ = colorsys.rgb_to_hsv(*[int(hx_[i:i + 2], 16) / 255 for i in (1, 3, 5)])
            renkler["malzemeler"][n_] = {"hex": hx_, "hsv": [round(h_ * 360, 1), round(s_, 3), round(v_, 3)], "rough": r_, "metal": mt_, "sinif": sinif_,
                                         **({"V_>=_0.72": v_ >= 0.72} if sinif_ == "bina_genis" else {}), **({"sapma": SAPMA[n_]} if n_ in SAPMA else {})}
        renkler["GECTI"] = all(m_.get("V_>=_0.72", True) for m_ in renkler["malzemeler"].values())
        with open(os.path.join(KONTROL, "renkler.json"), "w", encoding="utf-8") as fh: json.dump(renkler, fh, ensure_ascii=False, indent=1)
        with open(os.path.join(KONTROL, "kontrol_rapor.json"), "w", encoding="utf-8") as fh: json.dump(rap, fh, ensure_ascii=False, indent=1)
        for o in [o for o in bpy.data.objects if o.type == "LIGHT" and o.name.startswith("_ic")]: bpy.data.objects.remove(o, do_unlink=True)
        bpy.ops.file.pack_all()
        os.makedirs(os.path.dirname(BLEND), exist_ok=True)
        bpy.ops.wm.save_as_mainfile(filepath=BLEND)
        print("TESLIM", BLEND, rap["kontrol_hepsi"].get("GECTI"), renkler["GECTI"])
