# AKAR · Yıldırım Bayezid Bedesteni · v02 DETAY + RENK + ÇIKIŞ (kütle v01b'de donduruldu, ölçülerine dokunulmadı)
#   Ref: ref-img/685fff971922d.webp (havadan): tuğla kemerli pencereler, saçakta ince tuğla bant, dilimli kurşun kubbeler.
#   - Pencereler: uzun cephelerde göz başına 1 (7 + 7), kısa cephelerde 4 (P kesit: y = ±3,2 / ±5,0; foto doğu ucu 4 açıklık),
#     pencere 5,55–6,95 m (P kesit 5,6–7,6), tuğla yuvarlak kemer çerçeve + açık renk alınlık + parmaklıklı pencere.
#   - Kapilar: dört kenarın ortasında taş çerçeve + tuğla kemer bandı + koyu kahve kapı.
#   - Dukkan_Kapilari: dükkân halkasının dış yüzünde tuğla kemerli dükkân açıklıkları (68: uzun kenar 2 × 24, kısa 2 × 10).
#   - Sacak: almaşık gövdenin üstünde tek tuğla bant (foto; stil "gövde üstünde tek yatay çizgi").
#   - Kubbeler: 24 → 32 dilim (biçim aynı), dilim ve kurşun levha ekleri dokuyla (doku/kubbe_dilim.png).
#   - Doku seçeneği ortam değişkeniyle: AKAR_DOKU=almasik (gövde almaşık karo) | cizgi (gövde düz renk, yalnız saçak bandı).
# Çalıştırma:
#   AKAR_DOKU=almasik blender -b --python docs/documents-context/tasarim/3d-eser/bursa/eserler/yildirim-bayezid-bedesteni/claude/build/build_v02.py
# Eksenler: +X = doğu, +Y = kuzey, +Z = yukarı. Orijin = ana salonun ortası.
# Kaynak kodları: P plan/kesit, E envanter, W Alkan 2023, F fotoğraf, H hesap, T tahmin (VARSAYIM, bedesten_notlar.md'de listeli).
import sys, os, math, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 5, "_kutuphane")))
import bpy
import akar3d as A
from mathutils import Vector

DOKU_SECIM = os.environ.get("AKAR_DOKU", "almasik")
assert DOKU_SECIM in ("almasik", "cizgi"), DOKU_SECIM
SURUM = "v02"
CLAUDE = os.path.dirname(HERE)
DOKU = os.path.join(HERE, "doku")
KONTROL = os.path.join(CLAUDE, "kontrol", f"{SURUM}_{DOKU_SECIM}")
BLEND = os.path.join(CLAUDE, "blend", f"bedesten_{SURUM}_{DOKU_SECIM}.blend")
EXPORT = os.path.join(CLAUDE, "export", f"bedesten_{SURUM}_{DOKU_SECIM}.glb")

P = {
    # ---- kütle (v01b'de DONDURULDU; değişmez) ----
    "salon_ic_x": 56.50,      # E: iç mekân doğu–batı (P 56,8)
    "salon_ic_y": 15.00,      # E: iç mekân kuzey–güney (P 15,3)
    "salon_duvar": 1.50,      # P: salon duvarı (doğu–batı uçlarda okunan)
    "dis_x": 70.4,            # P: dükkânlar dahil toplam dış ölçü doğu–batı
    "dis_y": 32.8,            # P: dükkânlar dahil toplam dış ölçü kuzey–güney (kesit 33,0)
    "govde_x": 60.0,          # P: salon bloğu (mahzen bandı dahil) doğu–batı — fotoğraftaki almaşık kütle
    "govde_y": 24.4,          # P: salon bloğu kuzey–güney (OSM 21,4; plan seçildi)
    "dukkan_h": 5.0,          # T: dükkân halkası düz çatısı
    "kubbe_nx": 7, "kubbe_ny": 2,   # P, E: 2 × 7 = 14 kubbe
    "cati_h": 8.5,            # P: mahzen bandı dış duvarı üstü
    "salon_h": 10.0,          # P: salon duvarı üstü
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
}
DX, DY = P["dis_x"] / 2, P["dis_y"] / 2
BX, BY = P["govde_x"] / 2, P["govde_y"] / 2
SX = P["salon_ic_x"] / 2 + P["salon_duvar"]
SY = P["salon_ic_y"] / 2 + P["salon_duvar"]
GX, GY = P["salon_ic_x"] / P["kubbe_nx"], P["salon_ic_y"] / P["kubbe_ny"]
c0 = Vector((0, 0))

M = {k: A.mat(n, hx) for k, n, hx in [
    ("duvar", "Duvar", "#E2B7A4"),       # eser.md Palet: gövde pembe-kahve (almaşık seçeneğinde doku bağlanır)
    ("dukkan_duvar", "Dukkan_Duvar", "#E9E3D3"),   # T: dükkân halkası krem (_ortak_stil krem taş), gövdeden ayrışsın
    ("cati", "Cati", "#B9C6CC"),         # T: düz kurşun çatı
    ("kubbe", "Kubbe", "#95AEBA"),       # eser.md Palet: kurşun mavi-gri (vurgu 1), dilim dokusu bağlanır
    ("kapi", "Kapi", "#6B4A3A"),         # eser.md Palet: koyu kahve
    ("tugla", "Tugla", "#C6755B"),       # _ortak_stil tuğla kırmızı (açık ton): saçak, kemer bantları
    ("tas", "Tas", "#F2F3E5"),           # _ortak_stil krem/beyaz taş: kapı çerçevesi, pencere alınlığı
    ("pencere", "Pencere", "#1E1F21"),   # parmaklıklı pencere dokusu
    ("dukkan", "Dukkan", "#415072"),     # _ortak_stil lacivert: dükkân kepenkleri
    ("cim", "Zemin_Cim", "#A0B46C"),
    ("golge", "Zemin_Golge", "#E29B87"),
]}

def doku_bagla(m, dosya):
    """Malzemenin Base Color'ına küçük tekrar eden karo bağlar (glTF'e gömülür)."""
    nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tx = nt.nodes.new("ShaderNodeTexImage"); tx.image = bpy.data.images.load(os.path.join(DOKU, dosya), check_existing=True)
    tx.name = "DOKU"; nt.links.new(tx.outputs["Color"], bsdf.inputs["Base Color"])
DOKULU = [M["kubbe"], M["pencere"]]
if DOKU_SECIM == "almasik": DOKULU.append(M["duvar"])
doku_bagla(M["kubbe"], "kubbe_dilim.png")
doku_bagla(M["pencere"], "pencere.png")
if DOKU_SECIM == "almasik": doku_bagla(M["duvar"], "almasik.png")

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

g = A.G("Dukkanlar")
ring(g, R4(DX, DY), R4(BX - 0.05, BY - 0.05), 0.0, P["dukkan_h"], M["dukkan_duvar"], M["cati"])
g.obj(recalc=False)

g = A.G("Cati")
lo = [g.V(q, P["cati_h"] - 0.05) for q in R4(BX, BY)]
hi = [g.V(q, P["salon_h"]) for q in R4(SX, SY)]
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

# --- Kapilar: dört kenarın ortasında taş çerçeve + tuğla kemer bandı + koyu kahve kapı ---
g = A.G("Kapilar"); Yd = yuzler(DX, DY)
kw, kh = P["kapi_w"], P["kapi_h"]; zs = kh - kw / 2; bw = P["D_kapi_bant_w"]
fw, fh = P["D_kapi_cerceve_w"], P["D_kapi_cerceve_h"]
for k in ("K", "G", "D", "B"):
    O, T, N = Yd[k]
    panel(g, O, T, N, [(-fw / 2, 0), (fw / 2, 0), (fw / 2, fh), (-fw / 2, fh)], 0.04, 0.12, M["tas"])
    panel(g, O, T, N, kemerli(bw, 0, fh - bw / 2), 0.12, 0.16, M["tugla"])
    panel(g, O, T, N, kemerli(kw, 0, zs), 0.16, 0.22, M["kapi"])
g.obj()

# --- Dukkan_Kapilari: dükkân halkasının dış yüzünde tuğla kemerli kepenkler; orta modül kapıya ayrılır ---
g = A.G("Dukkan_Kapilari"); zk = P["D_dukkan_kemer_z"]
for k, n, L in (("K", P["D_dukkan_n_uzun"], 2 * DX), ("G", P["D_dukkan_n_uzun"], 2 * DX),
                ("D", P["D_dukkan_n_kisa"], 2 * DY), ("B", P["D_dukkan_n_kisa"], 2 * DY)):
    O, T, N = Yd[k]; adim = L / n
    for i in range(n):
        if i == n // 2: continue                                   # orta modül = ana kapı
        s = -L / 2 + adim * (i + 0.5); O2 = O + T * s
        panel(g, O2, T, N, kemerli(P["D_dukkan_bant_w"], 0, zk), 0.04, 0.08, M["tugla"])
        panel(g, O2, T, N, kemerli(P["D_dukkan_w"], 0, zk), 0.08, 0.12, M["dukkan"])
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
if DOKU_SECIM == "almasik": uv_almasik()

# ================= kontrol =================
os.makedirs(KONTROL, exist_ok=True)
rapor = A.kontrol_hepsi(KONTROL, "kontrol")
mk = A.mesh_kontrol()
rapor["parcalar"] = {k: v["ucgen"] for k, v in mk.items()}
rapor["draw_call"] = sum(len(o.material_slots) for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin")))
rapor["doku"] = DOKU_SECIM
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

os.makedirs(os.path.dirname(BLEND), exist_ok=True)
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print("BITTI", BLEND)
