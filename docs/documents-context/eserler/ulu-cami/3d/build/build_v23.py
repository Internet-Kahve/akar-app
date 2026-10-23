"""Ulu Cami v23 (v22 temel). Plan: ../../SONNET_REVIZYON_PLANI.md, standart: ../../../_GENEL_SAHNE_STANDARDI.md
Girdi : ../blend/ulu-cami_v22.blend
Çıktı : ../blend/ulu-cami_v23.blend, ../export/ulu-cami_v23*.glb, ../kontrol/v23/
Çalıştır: Blender -b --python build_v23.py -- A     (A: dikey ölçek + minareler + palet; sonraki aşamalar onay sonrası eklenir)
Kütüphane: eserler/_kutuphane/akar3d.py (build/ altındaki eski kopya KULLANILMAZ).
Kaynak harfleri: P rölöve, E envanter, F fotoğraf, T tahmin.
"""
import bpy, bmesh, math, sys, os, json
import numpy as np
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
ESER = os.path.dirname(HERE)                                   # ulu-cami/3d
sys.path.insert(0, os.path.join(ESER, "..", "..", "_kutuphane"))
import akar3d as A
sys.path.append(HERE)      # v23_avlu.py (build/ altındaki eski akar3d.py kopyası KULLANILMAZ: akar3d zaten yüklü)

ASAMA = (sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "A").upper()
KONTROL = os.path.join(ESER, "kontrol", "v23"); os.makedirs(KONTROL, exist_ok=True)
GIRDI = os.path.join(ESER, "blend", "ulu-cami_v22.blend")
BLEND = os.path.join(ESER, "blend", "ulu-cami_v23.blend")
OFS = Vector((0.55, 8.9, 0.0))                                 # v22 nesne konumu (v16 yerel çerçevesi → sahne)

# ---------------- parametreler ----------------
S = 0.786                                                      # §1 dikey ölçek (P: 47,90/60,9; 13,58/17,3; 19,73/25,2)
W_, D_ = 68.7, 55.0
# Minare kotları: rölöve çizimlerinden (kul_pdf195/196) okunan kot zinciri. Tablo 5.18-5.19 toplamı (48,62 / 47,53) alemin altındaki
# külah ucuna kadardır; çizimde külah (5,82) üstünde ≈3,5 m ince uç/alem daha var ve +47,90 bu uca konur (P, çizim ölçümü).
SPIRE = 3.5
MIN = {
    "W": dict(ad="Minare_1", top=47.90, kaide=10.85, kup=3.37, govde=21.44, serefe=1.15, petek=5.99, kulah=5.82,
              r_alt=2.34, r_ust=2.06, r_petek=1.73, serefe_gen=1.25, kaide_a=2.96),
    "E": dict(ad="Minare_2", top=47.89, kaide=10.85, kup=3.00, govde=20.72, serefe=1.15, petek=5.99, kulah=5.82,
              r_alt=2.29, r_ust=2.29, r_petek=1.65, serefe_gen=1.35, kaide_a=2.96),
}
for k_, m_ in MIN.items():
    tot = m_["kaide"] + m_["kup"] + m_["govde"] + m_["serefe"] + m_["petek"] + m_["kulah"]
    m_["taban"] = m_["top"] - SPIRE - tot                      # kaide tabanı (zemin altında kalır)
    m_["z_kup0"] = m_["taban"] + m_["kaide"]; m_["z_kup1"] = m_["z_kup0"] + m_["kup"]
    m_["z_gov1"] = m_["z_kup1"] + m_["govde"]; m_["z_ser1"] = m_["z_gov1"] + m_["serefe"]
    m_["z_pet1"] = m_["z_ser1"] + m_["petek"]; m_["z_kul1"] = m_["z_pet1"] + m_["kulah"]
# Batı kaide v22 boyutunda (yarı 3,35; kaide tepesi 10,13 = plan 10,85 − 0,72); gövde tepeyi 47,90'a tutmak için kısalır (T)
MW = MIN["W"]; MW["kaide_a"] = 3.35; MW["z_kup0"] = 8.70; MW["z_kup1"] = MW["z_kup0"] + MW["kup"]; MW["govde"] = MW["z_gov1"] - MW["z_kup1"]
# Kullanıcı (aşama C): çizgili batı kaide 10,13 → 8,70 (biraz kısa); doğu kaide 7,73 → 4,20 (≈ yarı yarıya), mermer. Tepe 47,90'da kalır, gövde uzar (T)
ME = MIN["E"]; ME["z_kup0"] = 4.20; ME["z_kup1"] = ME["z_kup0"] + ME["kup"]; ME["govde"] = ME["z_gov1"] - ME["z_kup1"]
XM1, YM1 = W_ / 2 - 2.4, -D_ / 2 - 3.7                         # batı (sekizgen) minare ekseni, v16/v22 yerel (P Ayverdi)
XM2, YM2 = -(W_ / 2 - 5.92 / 2), -D_ / 2 - 0.9 - 5.92 / 2      # doğu (kare) minare ekseni, duvardan 0,9 m ayrık (modelde 0,9 korunur)
CEPHE_Y = -D_ / 2

# ---------------- yardımcılar ----------------
def hx(h): return [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]
def setmat(m, hexc, rough=None, metal=None):
    n = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    r, g, b = hx(hexc); col = (A._s2l(r), A._s2l(g), A._s2l(b), 1)
    if not n.inputs["Base Color"].is_linked: n.inputs["Base Color"].default_value = col
    else:   # AO ile çarpılan malzeme: RGB düğümü rengi
        for nd in m.node_tree.nodes:
            if nd.type == "RGB": nd.outputs[0].default_value = col
    m.diffuse_color = col
    if rough is not None: n.inputs["Roughness"].default_value = rough
    if metal is not None: n.inputs["Metallic"].default_value = metal
def tex_node(m): return next((n for n in m.node_tree.nodes if n.type == "TEX_IMAGE"), None)
def yaz_doku(img, fn):
    px = img.size[0]; a = np.ones((img.size[1], img.size[0], 4), np.float32)
    for y in range(img.size[1]):
        for x in range(img.size[0]): a[y, x, :3] = fn(x, y, px)
    img.pixels = a.ravel(); img.pack(); return a[..., :3].mean(axis=(0, 1))
def hsv_v(h): return max(hx(h))
def obj_tri(o): return sum(len(p.vertices) - 2 for p in o.data.polygons)

# ---------------- 0. girdi ----------------
bpy.ops.wm.open_mainfile(filepath=GIRDI)
sc = bpy.context.scene
for o in list(bpy.data.objects):
    if o.type in ("CAMERA", "LIGHT"): bpy.data.objects.remove(o, do_unlink=True)
M = {m.name: m for m in bpy.data.materials}
RAPOR = {"asama": ASAMA, "olcek": S, "degisen": []}

# ---------------- 1. dikey ölçek (§1) ----------------
GOVDE = ["Govde", "Cati", "Cephe_Kuzey", "Cephe_Guney", "Cephe_Dogu", "Cephe_Bati", "Mermer_Bant", "Silme_Ust", "Tac_Kapi", "Kapi_Dogu", "Kapi_Bati",
         "Kubbeler_19", "Kasnak_Pencereleri", "Sadirvan_Kubbe", "Sadirvan_Iskeleti", "Giris_Cikintili_Blok", "Portal_Silmeleri", "Pencere_Girintileri"]
DIGER = {"Alemler", "Minare_1", "Minare_2", "Merkez"}
beklenen = set(GOVDE) | DIGER
fazla = [o.name for o in bpy.data.objects if o.type == "MESH" and o.name not in beklenen
         and not o.name.startswith(("Zemin", "Avlu_", "Cevre_", "Olcek_"))]
RAPOR["olceklenen_disi_gövde_parcasi"] = fazla                 # boş olmalı; doluysa listeye eklenip raporlanır
STEP_H = 0.17
def tac_z(z):
    """Taç kapı: basamak 0,17 sabit, 6 → 5 basamak (T, yeni giriş kotu 0,85); üstü 0,85'ten itibaren ölçeklenir."""
    if z <= 1.021: return max(z - STEP_H, 0.0)
    return 0.85 + (z - 1.02) * ((16.5 * S - 0.85) / (16.5 - 1.02))
def tac_adim_sil(o):
    bm = bmesh.new(); bm.from_mesh(o.data)
    ilk = [f for f in bm.faces if max(v.co.z for v in f.verts) <= STEP_H + 1e-3 and max(abs(v.co.x) for v in f.verts) > 7.9]
    assert len(ilk) == 6, len(ilk)                             # en alttaki (en geniş) basamak plakası
    bmesh.ops.delete(bm, geom=ilk, context='FACES')
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    bm.to_mesh(o.data); bm.free()
def tac_mukarnas_11(o):
    """Taç kapı kavsarası: v22'deki 8 sıra (76 hücre) silinir, 11 sıra yeniden kurulur (plan §6/1; F foto 001/004: kademeli sarkıt koni).
    v16 formülleri aynen (v22 koordinatı, ölçekten ÖNCE): niş 4,2 m, tepe 12,0 m, kemer K=0,8, cephe düzlemi y=-27,5, dış ağız 1,77 m."""
    bm = bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table(); seen = set(); sil = []; mi = 0
    for f0 in bm.faces:
        if f0.index in seen: continue
        st = [f0]; seen.add(f0.index); fs = []
        while st:
            f = st.pop(); fs.append(f)
            for e in f.edges:
                for nf in e.link_faces:
                    if nf.index not in seen: seen.add(nf.index); st.append(nf)
        zc = sum(v.co.z for f in fs for v in f.verts) / sum(len(f.verts) for f in fs)
        if len(fs) == 13 and 8.6 < zc < 12.0: sil += fs
    assert len(sil) == 76 * 13, len(sil)
    mi = sil[0].material_index
    bmesh.ops.delete(bm, geom=sil, context='FACES'); bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context='VERTS')
    nw, tepe, K, Y0 = 4.2, 12.0, 0.8, -27.5
    R = K * nw; zs_ = tepe - R * math.sin(math.acos((R - nw / 2) / R))
    def yari(z):
        if z <= zs_: return nw / 2
        return max(0.0, (nw / 2 - R) + math.sqrt(max(0.0, R * R - (z - zs_) ** 2)))
    P3 = lambda u, z, d: Vector((u, Y0 - d, z)); yeni = []; rows = 11
    for row in range(rows):
        z0 = zs_ + row * (tepe - zs_ - .12) / rows; z1 = zs_ + (row + 1) * (tepe - zs_ - .12) / rows
        rx0 = max(.08, yari(z0) - .035); rx1 = max(.04, yari(z1) - .035)
        dep0 = 1.65 * (1 - row / rows) ** .65; dep1 = 1.65 * (1 - (row + 1) / rows) ** .65
        count = max(3, 13 - row)
        for j in range(count):
            a0 = math.pi * j / count + .009; a1 = math.pi * (j + 1) / count - .009; am = (a0 + a1) / 2
            xyz = [(rx0 * math.cos(a0), 1.77 - dep0 * math.sin(a0), z0), (rx0 * math.cos(am), 1.77 - dep0 * math.sin(am), z0 - .14), (rx0 * math.cos(a1), 1.77 - dep0 * math.sin(a1), z0),
                   (rx1 * math.cos(a1), 1.77 - dep1 * math.sin(a1), z1 - .008), (rx1 * math.cos(am), 1.77 - dep1 * math.sin(am), z1 - .008), (rx1 * math.cos(a0), 1.77 - dep1 * math.sin(a0), z1 - .008)]
            fr = [bm.verts.new(P3(x, z, d)) for x, d, z in xyz]; bk = [bm.verts.new(P3(x, z, d - .20)) for x, d, z in xyz]
            ce = bm.verts.new(P3(sum(p[0] for p in xyz) / 6, sum(p[2] for p in xyz) / 6, sum(p[1] for p in xyz) / 6 - .10))
            for k in range(6):
                yeni.append(bm.faces.new([fr[k], fr[(k + 1) % 6], ce])); yeni.append(bm.faces.new([fr[k], bk[k], bk[(k + 1) % 6], fr[(k + 1) % 6]]))
            yeni.append(bm.faces.new(bk[::-1]))
    for f in yeni: f.material_index = mi
    bmesh.ops.recalc_face_normals(bm, faces=yeni)
    bm.to_mesh(o.data); bm.free(); RAPOR["tac_kapi_mukarnas_sira"] = rows; RAPOR["tac_kapi_mukarnas_hucre"] = sum(max(3, 13 - r) for r in range(rows))
for ad in GOVDE:
    o = bpy.data.objects[ad]
    if ad == "Tac_Kapi": tac_mukarnas_11(o); tac_adim_sil(o)
    uvl = o.data.uv_layers.active
    for v in o.data.vertices: v.co.z = tac_z(v.co.z) if ad == "Tac_Kapi" else v.co.z * S
    if uvl:                                                    # taş ve kafes karo ölçüsü korunur (düşey yüzlerde v ölçeklenir)
        yeni = {m.name for m in o.data.materials if m and (m.name.startswith(("Tas_Orgusu", "Kafes_Beyaz", "Izgara")))}
        for p in o.data.polygons:
            if abs(p.normal.z) < 0.5 and o.data.materials[p.material_index] and o.data.materials[p.material_index].name in yeni:
                for li in p.loop_indices: uvl.data[li].uv[1] *= S
    o.data.update()
# alemler: ölçeklenmez, yeni kubbe tepesine taşınır
ao = bpy.data.objects["Alemler"]; bm = bmesh.new(); bm.from_mesh(ao.data)
gor = set(); adalar = []
for v0 in bm.verts:
    if v0.index in gor: continue
    st = [v0]; gor.add(v0.index); ada = []
    while st:
        v = st.pop(); ada.append(v)
        for e in v.link_edges:
            u = e.other_vert(v)
            if u.index not in gor: gor.add(u.index); st.append(u)
    adalar.append(ada)
for ada in adalar:
    dz = min(v.co.z for v in ada) * (S - 1.0)
    for v in ada: v.co.z += dz
bm.to_mesh(ao.data); bm.free(); RAPOR["alem_sayisi"] = len(adalar)

# ---------------- 2. palet (§6 + standart §3) ----------------
def pal(ad, h, r=None, m=None):
    if ad in M: setmat(M[ad], h, r, m)
for ad in ("Mermer", "Mermer.001"): pal(ad, "#ECEAE4", 0.40, 0.0)
pal("Cati", "#AEB6BC", 0.45, 0.20)          # Kubbe.001 v22 rengi (#939FA8) korunur (kullanıcı kararı)
pal("Kasnak.001", "#EBD58A", 0.80, 0.0); pal("Pencere", "#3E4A55", 0.30, 0.0); pal("Demir_Yesil", "#36413F", 0.60, 0.30)
pal("Kapi_Kahverengi", "#7A5134", 0.75, 0.0); pal("Ahsap", "#6B4A3A", 0.75, 0.0); pal("Bant_koyu", "#505955", 0.70, 0.0)
pal("Alem_kursun", "#C9A13B", 0.35, 0.60); pal("Minare_Ust_Tas_Tonu", "#E6D8BA", 0.70, 0.0)
pal("Zemin_Sicak_Tas_Grisi_v22", "#C4BDAF", 0.90, 0.0); pal("Avlu_Koyu_Tas_v22", "#B3A590", 0.85, 0.0)
M["Kapi_Yesil"] = A.mat("Kapi_Yesil", "#2F6B55", 0.75, 0.0)
tk = bpy.data.objects["Tac_Kapi"]                              # yalnız taç kapı kanadı yeşil (foto 001); yan kapılar #7A5134
tk.data.materials[list(tk.data.materials).index(M["Kapi_Kahverengi"])] = M["Kapi_Yesil"]
# cephe taşı: kesme taş #D3BE98 (nişte #BFA982); doku karosu yeniden boyanır
PAL_T = ["#B8B8AE", "#CDAE9A", "#D8CDB8", "#AFA795", "#C2B5A2", "#D5C4A8"]
def taş_fn(base):
    b = np.array(hx(base))
    def f(x, y, n):
        row = y // 32; shift = 32 * (row % 2); col = ((x + shift) % n) // 64
        mix = b * .76 + np.array(hx(PAL_T[(row * 97 + col * 53 + row * col * 19) % 6])) * .24
        return [float(c) for c in (b * .93 if (y % 32 < 1 or (x + shift) % 64 < 1) else mix)]
    return f
ORT = {}
for ad, base in (("Tas_Orgusu_Hafif", "#D3BE98"), ("Tas_Orgusu_Nis", "#BFA982")):
    ORT[ad] = [round(float(c), 3) for c in yaz_doku(tex_node(M[ad]).image, taş_fn(base))]
# kafes: boşluk rengi saf siyah olamaz (#3E4A55); alpha-cutout dönüşümü sonraki aşamada
def kafes_fn(x, y, n):
    cx = cy = (n - 1) / 2; r = 0.30 * n
    return hx("#3E4A55") if (x - cx) ** 2 + (y - cy) ** 2 <= r * r else hx("#F2F3E5")
def kafes_kes():
    """Plan/kullanıcı kuralı 5: şebeke delikleri gerçek boşluk (alpha-cutout, 64 px karo). Levhanın duvara bakan arka yüzü koyu (#3E4A55)."""
    n = 64; cx = cy = (n - 1) / 2; r = 0.30 * n; a = np.ones((n, n, 4), np.float32)
    for y in range(n):
        for x in range(n):
            ic = (x - cx) ** 2 + (y - cy) ** 2 <= r * r; a[y, x, :3] = hx("#3E4A55" if ic else "#F2F3E5"); a[y, x, 3] = 0.0 if ic else 1.0
    for ad in ("Kafes_Beyaz", "Kafes_Beyaz.001"):
        m = M[ad]; tx = tex_node(m); im = bpy.data.images.new(ad + "_kes", n, n, alpha=True); im.alpha_mode = 'STRAIGHT'; im.pixels = a.ravel(); im.pack(); tx.image = im
        RAPOR.setdefault("kafes_doku", {})[ad] = {"boyut": list(im.size), "alfa_ortalama": round(float(np.array(im.pixels[:]).reshape(-1, 4)[:, 3].mean()), 3)}
        bs = next(nd for nd in m.node_tree.nodes if nd.type == "BSDF_PRINCIPLED")
        th = m.node_tree.nodes.new("ShaderNodeMath"); th.operation = 'GREATER_THAN'; th.inputs[1].default_value = 0.5
        m.node_tree.links.new(tx.outputs["Alpha"], th.inputs[0]); m.node_tree.links.new(th.outputs[0], bs.inputs["Alpha"])
        m.surface_render_method = 'DITHERED'; m.use_backface_culling = False
    from mathutils.bvhtree import BVHTree
    mk = M["Pencere"]; say = 0
    for ad, duvar in (("Cephe_Kuzey", "Govde"), ("Cephe_Guney", "Govde"), ("Cephe_Dogu", "Govde"), ("Cephe_Bati", "Govde"), ("Kasnak_Pencereleri", "Kubbeler_19")):
        o = bpy.data.objects[ad]; w = bpy.data.objects[duvar]
        bv = BVHTree.FromPolygons([w.matrix_world @ v.co for v in w.data.vertices], [tuple(p.vertices) for p in w.data.polygons])
        mats = list(o.data.materials); ki = [i for i, mm in enumerate(mats) if mm and mm.name.startswith("Kafes_Beyaz")][0]
        if mk not in mats: o.data.materials.append(mk)
        di = list(o.data.materials).index(mk)
        bm = bmesh.new(); bm.from_mesh(o.data); bm.faces.ensure_lookup_table()
        kf = [f for f in bm.faces if f.material_index == ki]; ctr = {f.index: f.calc_center_median() for f in kf}
        for f in kf:                                            # levha iki kapaklı (dış/iç, 2 cm): duvara yakın olan kapak koyu arka yüz olur
            g = next((h for h in bm.faces if h is not f and len(h.verts) == len(f.verts) and h.normal.dot(f.normal) < -0.9 and (h.calc_center_median() - ctr[f.index]).length < 0.06), None)
            if g is None: continue
            df = bv.find_nearest(o.matrix_world @ ctr[f.index])[3]; dg = bv.find_nearest(o.matrix_world @ g.calc_center_median())[3]
            ic = f if df < dg else g
            if ic.material_index != di: ic.material_index = di; say += 1
        bm.to_mesh(o.data); bm.free()
    RAPOR["kafes_koyu_arka_yuz"] = say
kafes_kes()
def izgara_fn(x, y, n): return hx("#36413F") if (x < 4 or y < 4) else hx("#3E4A55")

# ---------------- 3. minareler (§2) ----------------
M["Minare_Kulah"] = A.mat("Minare_Kulah", "#E6D8BA", 0.70, 0.0)          # şerefe ile aynı bej (kullanıcı kararı)
M["Kaide_Mermer"] = A.mat("Minare_Kaide_Mermer", "#E4E3DC", 0.85, 0.0)   # v22 kaide mermeri
M["Minare_Tas"] = A.mat("Minare_Kesme_Tas", "#D3BE98", 0.70, 0.0)
Mt = M["Minare_Tugla_Derzi"]
TUGLA, HARC = "#986B4D", "#B8A78E"          # v22 minare tuğlası (kullanıcı kararı)
def tugla_fn(x, y, n):
    b, h = np.array(hx(TUGLA)), np.array(hx(HARC))
    row = y // 32; xx = (x + (32 if row % 2 else 0)) % 64
    return [float(c) for c in (h if (y % 32 < 2 or xx < 2) else b)]
ORT["Minare_Tugla_Derzi"] = [round(float(c), 3) for c in yaz_doku(tex_node(Mt).image, tugla_fn)]
Mm, Mb, Mk, Mu, Ma = M["Kaide_Mermer"], M["Bant_koyu"], M["Minare_Kulah"], M["Minare_Ust_Tas_Tonu"], M["Alem_kursun"]

def tup(g, c, ri, ro, z0, z1, m, n=24):
    """Kapalı içi boş halka (parapet, bilezik)."""
    ang = [2 * math.pi * k / n for k in range(n)]
    P_ = lambda r, z, a: g.V(c + Vector((r * math.cos(a), r * math.sin(a))), z)
    ib = [P_(ri, z0, a) for a in ang]; ob = [P_(ro, z0, a) for a in ang]; it = [P_(ri, z1, a) for a in ang]; ot = [P_(ro, z1, a) for a in ang]
    for k in range(n):
        j = (k + 1) % n
        g.F([ib[k], ob[k], ob[j], ib[j]], m); g.F([ob[k], ot[k], ot[j], ob[j]], m)
        g.F([ot[k], it[k], it[j], ot[j]], m); g.F([it[k], ib[k], ib[j], it[j]], m)
def gecis(g, c, apts, rb, z0, z1, m):
    """Kare/sekizgen → daire geçişi: üçgen (baklava) yüzlü kapalı küp. apts: 16 noktalı taban çevresi."""
    n = len(apts); a = [g.V(c + p, z0) for p in apts]; b = []
    for k in range(n):
        mid = apts[k] + apts[(k + 1) % n]; an = math.atan2(mid.y, mid.x)
        b.append(g.V(c + Vector((rb * math.cos(an), rb * math.sin(an))), z1))
    for k in range(n):
        j = (k + 1) % n; g.F([a[k], a[j], b[k]], m); g.F([a[j], b[j], b[k]], m)
    g.F(a[::-1], m); g.F(b, m)
def sekizgen16(ap):
    R = ap / math.cos(math.pi / 8); pts = []
    for j in range(8):
        a1 = math.radians(45 * j - 22.5); a2 = math.radians(45 * j + 22.5)       # köşe, köşe (yüz ortası arada)
        c1 = Vector((R * math.cos(a1), R * math.sin(a1))); c2 = Vector((R * math.cos(a2), R * math.sin(a2)))
        pts += [c1, (c1 + c2) / 2]
    return pts
def kare16(h):
    pts = []
    for (x0, y0, x1, y1) in ((h, -h, h, h), (h, h, -h, h), (-h, h, -h, -h), (-h, -h, h, -h)):
        for t in (0, .25, .5, .75): pts.append(Vector((x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)))
    return pts
# külah profili: (r, z göreli) — rölöve çizimi kul_pdf195/196 (P ölçümü, ±0,1 m); z>6,9 ince uç + alem (pirinç)
KULAH = [(2.04, 0.0), (2.04, 0.14), (1.88, 0.24), (1.58, 0.40), (1.46, 0.70), (1.42, 1.05), (1.42, 1.55), (1.46, 1.72), (1.30, 1.80),
         (1.50, 2.05), (1.58, 2.62), (1.42, 3.05), (1.12, 3.40), (1.00, 3.52), (1.12, 3.62), (1.12, 3.95), (1.00, 4.05), (1.04, 4.50),
         (1.06, 4.90), (0.95, 5.30), (0.62, 5.60), (0.36, 5.78), (0.33, 5.82), (0.34, 6.30), (0.52, 6.38), (0.58, 6.70), (0.30, 6.80),
         (0.14, 6.90), (0.14, 7.20), (0.20, 7.45), (0.12, 7.62), (0.12, 7.85), (0.17, 8.00), (0.10, 8.15), (0.08, 8.60), (0.12, 8.80),
         (0.06, 8.95), (0.04, 9.20), (0.0, 9.32)]
def minare(tip, c):
    mm = MIN[tip]; g = A.G(mm["ad"]); gt = mm["z_kup0"]; Z0 = -0.2
    rg0, rg1, rp = mm["r_alt"], mm["r_ust"], mm["r_petek"]; rs = rp + mm["serefe_gen"]
    z_muk0 = mm["z_gov1"] - 2.4                                # şerefe altı mukarnas kuşağı (son ≈2,4 m, P)
    rg_muk = rg0 + (rg1 - rg0) * (z_muk0 - mm["z_kup1"]) / mm["govde"]
    # --- kaide + küp ---
    if tip == "W":
        ap = mm["kaide_a"]; R = ap / math.cos(math.pi / 8); k_ = gt / 15.0           # v22 kaide oranları (15 m kaide → gt)
        bantlar = [(1.0 * k_, 7.2 * k_, Mm), (7.2 * k_, 7.9 * k_, Mb), (7.9 * k_, 8.8 * k_, Mm), (8.8 * k_, 9.5 * k_, Mb), (9.5 * k_, gt, Mm)]
        kp = [(3.6 / math.cos(math.pi / 8), Z0), (R, 1.0 * k_)] + [(R, z1) for _, z1, _ in bantlar]
        g.lathe(c, kp, 8, [Mm] + [m for _, _, m in bantlar])
        bmesh.ops.rotate(g.bm, cent=(c.x, c.y, 0), matrix=Matrix.Rotation(math.pi / 8, 3, 'Z'), verts=g.bm.verts)
        for j in range(8):                                      # üst kaidede çok loblu/kemerli kabartma panolar (F foto 016); geçit yüzlerinde yok
            ang = 2 * math.pi * j / 8; nn = Vector((math.cos(ang), math.sin(ang))); tt = Vector((-nn.y, nn.x))
            if nn.y > 0.3: continue
            oo = c + nn * ap; dis = _sivri(1.30, 1.4 * k_, 6.5 * k_); ic = _sivri(1.12, 1.5 * k_, 6.36 * k_)
            _levha(g, oo, tt, nn, ic, 0.008, 0.012, Mm); _kabuk_off(g, oo, tt, nn, dis, [ic], 0.025, 0.055, Mm)
        gecit_w(g, c, ap, gt)
        apts = sekizgen16(ap)
        gecis(g, c, apts, rg0, gt - 0.03, mm["z_kup1"], Mm)
    else:
        h = mm["kaide_a"]; g.prism(A.rect(c, 2 * h, 2 * h), Z0, gt, Mm, Mm)                                  # doğu kaide mermer (kullanıcı)
        gecis(g, c, kare16(h), rg0, gt - 0.03, mm["z_kup1"], Mm)
    # --- gövde (tuğla, yukarı incelir) ---
    g.lathe(c, [(rg0, mm["z_kup1"] - 0.02), (rg_muk, z_muk0)], 32, [Mt])
    # --- şerefe altı mukarnas: 3 kuşak basamaklı destek + 18 motif × 6 sıra ---
    bands, rows, count = 3, 6, 18; bh = (mm["z_gov1"] - z_muk0) / bands; pitch = 2 * math.pi / count
    out_son = rs - 0.29
    for b in range(bands):
        core = rg_muk + (out_son - rg_muk) * b / (bands - 1)
        g.lathe(c, [(core + 0.02, z_muk0 + b * bh - 0.01), (core + 0.02, z_muk0 + (b + 1) * bh)], 24, [Mt])
        for j in range(count):
            ang = (j + .5 * (b % 2)) * pitch; nn = Vector((math.cos(ang), math.sin(ang))); tt = Vector((-nn.y, nn.x))
            for row in range(rows):
                z = z_muk0 + b * bh + row * bh / rows; front = core + .07 + .22 * (row + 1) / rows; back = core - .035
                wd = 2 * front * math.tan(pitch / 2) * .94 * (row + 1) / rows
                g.prism([c + nn * back - tt * wd / 2, c + nn * front - tt * wd / 2, c + nn * front + tt * wd / 2, c + nn * back + tt * wd / 2],
                        z + .002, z + bh / rows - .002, Mt, Mt)
    # --- şerefe: taban plakası, parapet 1,15 × 0,05 (beton), 24 düşey bölme; petek ---
    g.lathe(c, [(rs - 0.01, mm["z_gov1"] - 0.14), (rs - 0.01, mm["z_gov1"])], 24, [Mu])
    tup(g, c, rs - 0.05, rs, mm["z_gov1"], mm["z_ser1"], Mu)
    tup(g, c, rs - 0.08, rs + 0.03, mm["z_ser1"] - 0.08, mm["z_ser1"], Mu)
    for j in range(24):
        a = 2 * math.pi * j / 24; ctr = c + Vector((math.cos(a), math.sin(a))) * (rs + 0.02)
        g.prism(A.rect(ctr, 0.10, 0.12, a), mm["z_gov1"] + 0.02, mm["z_ser1"] - 0.10, Mu, Mu)
    g.lathe(c, [(rp, mm["z_gov1"] - 0.02), (rp, mm["z_pet1"] + 0.05)], 24, [Mt])
    tup(g, c, rp - 0.01, rp + 0.10, mm["z_gov1"], mm["z_gov1"] + 0.20, Mu)          # petek dibinde ince halka (P çizimi)
    # --- külah (sıvalı gri) + ince uç ve alem (pirinç) ---
    pr = [(r, mm["z_pet1"] + z) for r, z in KULAH]
    g.lathe(c, pr, 24, [Mk if KULAH[i + 1][1] <= 6.9 else Ma for i in range(len(KULAH) - 1)])
    ob = g.obj(); ob.location = OFS
    return ob
# kaide kabartma yardımcıları (v16 sivri/levha/kabuk_off)
def _sivri(w, z0, tepe, k=0.8, n=4):
    R = k * w; ta = math.acos((R - w / 2) / R); zs = tepe - R * math.sin(ta); assert zs >= z0 - 1e-9, (w, z0, tepe)
    pts = [(-w / 2, z0), (w / 2, z0)]
    if zs > z0 + 1e-6: pts.append((w / 2, zs))
    for i in range(1, n + 1): t = ta * i / n; pts.append(((w / 2 - R) + R * math.cos(t), zs + R * math.sin(t)))
    for i in range(n - 1, 0, -1): t = ta * i / n; pts.append((-((w / 2 - R) + R * math.cos(t)), zs + R * math.sin(t)))
    if zs > z0 + 1e-6: pts.append((-w / 2, zs))
    return pts
def _p3(O, T, N, u, z, o): return Vector((O.x + T.x * u + N.x * o, O.y + T.y * u + N.y * o, z))
def _levha(g, O, T, N, poly, off, dep, m):
    a = [g.bm.verts.new(_p3(O, T, N, u, z, off)) for u, z in poly]; b = [g.bm.verts.new(_p3(O, T, N, u, z, off + dep)) for u, z in poly]
    g.F(b, m); g.F(a[::-1], m)
    for i in range(len(poly)): j = (i + 1) % len(poly); g.F([a[i], a[j], b[j], b[i]], m)
def _kabuk_off(g, O, T, N, dis, delikler, off, dep, m):
    kenar = []
    for loop in [dis] + delikler:
        vs = [g.bm.verts.new(_p3(O, T, N, u, z, off)) for u, z in loop]
        kenar += [g.bm.edges.new((vs[i], vs[(i + 1) % len(vs)])) for i in range(len(vs))]
    r = bmesh.ops.triangle_fill(g.bm, use_beauty=True, use_dissolve=False, edges=kenar, normal=Vector((N.x, N.y, 0)))
    yuz = [f for f in r["geom"] if isinstance(f, bmesh.types.BMFace)]
    for f in yuz: f.material_index = g.mi(m)
    ex = bmesh.ops.extrude_face_region(g.bm, geom=yuz, use_keep_orig=True)
    for v in [e for e in ex["geom"] if isinstance(e, bmesh.types.BMVert)]: v.co += Vector((N.x, N.y, 0)) * dep
def gecit_w(g, c, ap, h):
    """Batı kaidesini kuzey cepheye bağlayan çapraz geçit (plan): yüksekliği kaide tepesine kadar."""
    hw = 1.0; dvec = Vector((-1, 1)).normalized(); t = Vector((1, 1)).normalized()
    fc = c + dvec * ap; a_, b_ = fc + t * hw, fc - t * hw; yw = CEPHE_Y
    a2 = a_ + dvec * ((yw - a_.y) / dvec.y); b2 = b_ + dvec * ((yw - b_.y) / dvec.y)
    g.prism([a_, b_, b2, a2], -0.2, h - 0.05, Mm, Mm)
for ad in ("Minare_1", "Minare_2"): bpy.data.objects.remove(bpy.data.objects[ad], do_unlink=True)
for tip, c in (("W", Vector((XM1, YM1))), ("E", Vector((XM2, YM2)))):
    ob = minare(tip, c)
    uv = ob.data.uv_layers.new(name="UVMap"); ti = [i for i, m in enumerate(ob.data.materials) if m == Mt]
    for f in ob.data.polygons:
        if f.material_index not in ti: continue
        an = [math.atan2(ob.data.vertices[ob.data.loops[li].vertex_index].co.y - c.y, ob.data.vertices[ob.data.loops[li].vertex_index].co.x - c.x) for li in f.loop_indices]
        if max(an) - min(an) > math.pi: an = [a + 2 * math.pi if a < 0 else a for a in an]
        rg = MIN[tip]["r_alt"]
        for li, a in zip(f.loop_indices, an): uv.data[li].uv = (a * rg / 1.28, ob.data.vertices[ob.data.loops[li].vertex_index].co.z / 0.64)


# ---------------- 3B. avlu yapıları ve iç şadırvan (Aşama B; plan §3–§5) ----------------
SAD_C = {"Avlu_Sadirvan_Dogu": Vector((-15.0, -39.0)), "Avlu_Sadirvan_Bati": Vector((15.0, -39.0))}
CESME_C = Vector((0.0, -39.0)); IC_C = Vector((0.0, -6.4))        # iç şadırvan: P["ACIK"]=(2,1) bölme merkezi (kolon x=0, sıra y=-6,4)
if ASAMA in ("B", "C", "D"):
    import v23_avlu as AV
    for ad in ("Avlu_Sadirvan_Dogu", "Avlu_Sadirvan_Bati", "Avlu_Mermer_Cesme"): bpy.data.objects.remove(bpy.data.objects[ad], do_unlink=True)
    MV = AV.malz()
    for ad, c in SAD_C.items(): AV.sadirvan(ad, c, MV).location = OFS
    AV.cesme("Avlu_Mermer_Cesme", CESME_C, MV).location = OFS
    # iç şadırvan: fenerin altına, Govde ve Cati'da boşluk (boolean) açılır; zemin halısı + havuz + fıskiye
    kg = A.G("_kuyu"); kg.lathe(IC_C, [(5.45, 0.0), (5.45, 40.0)], 32, [MV["duv"]]); ku = kg.obj(); ku.location = OFS
    for ad in ("Govde", "Cati"):
        o = bpy.data.objects[ad]; md = o.modifiers.new("kuyu", 'BOOLEAN'); md.operation = 'DIFFERENCE'; md.object = ku; md.solver = 'EXACT'; md.material_mode = 'TRANSFER'
        for x in bpy.context.view_layer.objects: x.select_set(False)
        bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.modifier_apply(modifier="kuyu")
    bpy.data.objects.remove(ku, do_unlink=True)
    zg = A.G("Ic_Zemin"); zg.prism(A.rect(IC_C, 13.7, 12.8), -0.01, 0.02, MV["halı"], MV["halı"]); zg.obj().location = OFS
    AV.ic_sadirvan(IC_C, MV).location = OFS + Vector((0, 0, 0.02))
    ma = M["Sadirvan_Cam.001"]; setmat(ma, "#9FB8C0", 0.30, 0.0)
    nb = next(n for n in ma.node_tree.nodes if n.type == "BSDF_PRINCIPLED"); nb.inputs["Alpha"].default_value = 0.40
    ma.surface_render_method = 'DITHERED'
    sk = bpy.data.objects["Sadirvan_Kubbe"]                     # fener tabanındaki içe dönük koni yüzleri opak krem idi, havuzu örtüyordu: cama çevrilir (hacim kapalı kalır)
    gi = list(sk.data.materials).index(ma)
    for p_ in sk.data.polygons:
        if sk.data.materials[p_.material_index].name == "Kasnak.001" and p_.normal.z < -0.5: p_.material_index = gi
    Wb = lambda ad: [bpy.data.objects[ad].matrix_world @ v.co for v in bpy.data.objects[ad].data.vertices]
    RAPOR["uc_b"] = {"sadirvan_toplam_boy_zeminden_m": round(max(v.z for v in Wb("Avlu_Sadirvan_Dogu")), 2), "sadirvan_boy_platform_ustunden_m": round(max(v.z for v in Wb("Avlu_Sadirvan_Dogu")) - 0.30, 2),
                     "sadirvan_direk_yaricapi_m": 2.75, "sadirvan_sacak_yaricapi_m": 3.45, "cesme_boy_m": round(max(v.z for v in Wb("Avlu_Mermer_Cesme")), 2),
                     "cesme_govde_genislik_m": 1.15, "ic_sadirvan_havuz_dis_cap_m": 6.5, "ic_sadirvan_fiskiye_tepe_m": round(max(v.z for v in Wb("Ic_Sadirvan_Havuz")), 2)}

# ---------------- 3C. kaide, ağaçlar, tarh, figürler (Aşama C; plan §7 + kullanıcı güncellemeleri) ----------------
if ASAMA in ("C", "D"):
    import v23_cevre as CV
    for o in list(bpy.data.objects):
        if o.name.startswith(("Cevre_", "Olcek_", "Zemin_Cim", "Zemin_Golge", "Zemin_Kaide")): bpy.data.objects.remove(o, do_unlink=True)
    lo = Vector((1e9, 1e9)); hi = Vector((-1e9, -1e9))
    for o in bpy.data.objects:                                  # yapı + avlu ayak izi (zemin dışı her şey)
        if o.type != "MESH" or o.name.startswith(("Zemin_Kaide", "_", "REF")): continue
        for cc in o.bound_box:
            w = o.matrix_world @ Vector(cc); lo.x = min(lo.x, w.x); lo.y = min(lo.y, w.y); hi.x = max(hi.x, w.x); hi.y = max(hi.y, w.y)
    PAY = 8.0
    mt = A.mat("Zemin_Sicak_Tas_Grisi_v22", "#C4BDAF", 0.90); my = A.mat("Zemin_Kaide_Yan", "#A39A8B", 0.90)
    KD = CV.kaide(lo.x - PAY, hi.x + PAY, lo.y - PAY, hi.y + PAY, 1.5, 0.6, -0.02, 0.15, mt, my)
    RAPOR["kaide"] = {"ayak_izi_x": [round(lo.x, 2), round(hi.x, 2)], "ayak_izi_y": [round(lo.y, 2), round(hi.y, 2)], "pay_m": PAY,
                      "kaide_x": [round(lo.x - PAY, 2), round(hi.x + PAY, 2)], "kaide_y": [round(lo.y - PAY, 2), round(hi.y + PAY, 2)], "kose_pah_m": 1.5, "kalinlik_m": 0.6, "ust_pah_m": 0.15}
    # tarh + çınar (F foto 009: çınar sol şadırvanın yanında, taç kapı merdiveninin batısında; foto 094: taş bordürlü tarhın içinde) ve servi (F foto 009: merdivenin sağında)
    CINAR = Vector((-9.0, -25.3)); SERVI = Vector((10.8, -24.6))
    mb = A.mat("Tarh_Bordur", "#D2C3A4", 0.85); mc = A.mat("Tarh_Cim", "#9DB86A", 0.95)
    CV.tarh("Cevre_Tarh_01", CINAR, 1.8, 0.48, 0.24, mb, mc)
    CV.cinar("Cevre_Agac_01", CINAR); CV.servi("Cevre_Agac_02", SERVI)
    # figürler: A.insan (Koza Han turunda onaylı); (poz, boy, konum, yön°, kadın, çocuk, renk, adim_yuk)
    cD = Vector((-14.45, -30.1)); cB = Vector((15.55, -30.1)); cC = Vector((0.55, -30.1))
    def tab(c, a): return (c.x + 2.32 * math.cos(math.radians(a)), c.y + 2.32 * math.sin(math.radians(a)), 0.30)
    FIG = [("oturan", 1.75, tab(cD, 135), 225, False, False, 0, 0), ("ayakta", 1.64, (cD.x, cD.y + 4.3, 0.0), 270, True, False, 1, 0),
           ("oturan", 1.78, tab(cB, 45), 135, False, False, 2, 0), ("ayakta", 1.18, (cB.x, cB.y + 4.3, 0.0), 270, False, True, 0, 0),
           ("ayakta", 1.62, (cC.x + 1.75, cC.y, 0.0), 180, True, False, 1, 0),
           ("yuruyen", 1.76, (1.6, -26.2, 0.0), 90, False, False, 2, 0), ("yuruyen", 1.64, (-1.0, -27.6, 0.0), 90, True, False, 0, 0),
           ("yuruyen", 1.20, (0.0, -27.2, 0.0), 90, False, True, 1, 0), ("basamak", 1.66, (2.6, -23.05, 0.17), 90, True, False, 2, 0.17),
           ("yuruyen", 1.74, (37.3, 2.4, 0.0), 180, False, False, 0, 0)]
    for i, (pz, bo, kn, yo, kd, co, rn, ay) in enumerate(FIG, 1):
        A.insan("Olcek_Insan_%02d" % i, pz, bo, kn, yo, kd, co, rn, ay or 0.25)
    mk0 = A.mesh_kontrol()
    RAPOR["uc_c"] = {"figur_sayisi": len(FIG), "figur_ucgen": sum(v["ucgen"] for k, v in mk0.items() if k.startswith("Olcek_")),
                     "agac_ucgen": {k: v["ucgen"] for k, v in mk0.items() if k.startswith("Cevre_Agac")}}

# ---------------- 4. ışık, AO, render ----------------
def isik():
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
    w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND"); bg.inputs[0].default_value = (0.80, 0.80, 0.80, 1); bg.inputs[1].default_value = 1.0
    sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
    sun.data.energy = 1.25; sun.data.angle = math.radians(35); sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
def ao_pisir():
    objs = [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("Zemin", "_", "REF"))]
    for o in objs:
        if not o.data.color_attributes.get("AO"): o.data.color_attributes.new("AO", 'BYTE_COLOR', 'CORNER')
        o.data.color_attributes.active_color = o.data.color_attributes["AO"]
    A.ao_vertex(objs=objs, samples=32)
    for o in bpy.data.objects:                                  # A.ao_vertex bütün malzemeleri AO'ya bağlar: zemine nötr (beyaz) AO ver
        if o.type == "MESH" and o.name.startswith("Zemin"):
            if not o.data.color_attributes.get("AO"): o.data.color_attributes.new("AO", 'BYTE_COLOR', 'CORNER')
            for d in o.data.color_attributes["AO"].data: d.color = (1, 1, 1, 1)
    tb = {"Kubbeler_19": .85, "Sadirvan_Kubbe": .85, "Kasnak_Pencereleri": .85, "Alemler": .85}
    for o in objs:
        t = tb.get(o.name, 0.70)                                # standart §2: taban 0,70; kubbe/kasnak/alem 0,85
        for d in o.data.color_attributes["AO"].data: c_ = t + (1 - t) * d.color[0]; d.color = (c_, c_, c_, 1.0)
def kamera(loc, tgt, lens=50, ortho=None, ad="_c"):
    cd = bpy.data.cameras.new(ad); cd.lens = lens; cd.clip_end = 3000
    if ortho: cd.type = 'ORTHO'; cd.ortho_scale = ortho
    cam = bpy.data.objects.new(ad, cd); sc.collection.objects.link(cam); sc.camera = cam; cam.location = loc
    cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return cam
def render(ad, res, saydam=False):
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.film_transparent = saydam
    sc.render.filepath = os.path.join(KONTROL, ad); bpy.ops.render.render(write_still=True)
def std_kamera(tgt=(0.5, 5, 12), uzak=300, ortho=170):
    el, az = math.radians(32), math.radians(45)                 # standart: yükseklik ≈32°, yatay ≈45° (kuzeybatıdan), ortografik
    d = Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el))) * uzak
    return kamera(Vector(tgt) + d, tgt, ortho=ortho)
def cizgi(z, y, x0, x1, ad, hex_="#D02020"):
    """Kot çizgisi: ince şerit (+ yazı) — yalnız kontrol render'ı, '_' ile başlar (kontrol ve GLB dışında)."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=((x0 + x1) / 2, y, z)); o = bpy.context.object; o.name = "_cizgi_" + ad
    o.scale = (abs(x1 - x0), 0.05, 0.08); me = o.data; me.materials.append(A.mat("_cizgi" + hex_[1:], hex_, 0.9))
    return o
def yazi(metin, loc, boy=1.6, hex_="#B01010", rotz=0.0):
    bpy.ops.object.text_add(location=loc, rotation=(math.pi / 2, 0, rotz)); o = bpy.context.object; o.name = "_yazi"; o.data.body = metin; o.data.size = boy
    o.data.materials.append(A.mat("_yazi" + hex_[1:], hex_, 0.9)); return o

# ---------------- 5. doğrulama ----------------
def olcu():
    W = lambda o: [o.matrix_world @ v.co for v in o.data.vertices]
    top = lambda ad: max(v.z for v in W(bpy.data.objects[ad]))
    r = {}
    for k, m in MIN.items():
        o = bpy.data.objects[m["ad"]]; zs = [v.z for v in W(o)]
        r["minare_" + k + "_tepe_m"] = round(max(zs), 2); r["minare_" + k + "_hedef_m"] = m["top"]
        r["minare_" + k + "_taban_m"] = round(min(zs), 2); r["minare_" + k + "_kup_alt_ust"] = [round(m["z_kup0"], 2), round(m["z_kup1"], 2)]
        r["minare_" + k + "_govde_ust_m"] = round(m["z_gov1"], 2); r["minare_" + k + "_serefe_tepe_m"] = round(m["z_ser1"], 2)
        r["minare_" + k + "_kulah_tepe_alemsiz_m"] = round(m["z_kul1"], 2)
    r["sacak_govde_ust_m"] = round(top("Govde"), 2); r["sacak_cephe_ust_m"] = round(top("Cephe_Dogu"), 2); r["sacak_hedef_m"] = 13.58
    ko = Vector((-25.2, -19.2, 0)) + OFS; kub = [v for v in W(bpy.data.objects["Kubbeler_19"]) if (Vector((v.x, v.y, 0)) - ko).length < 7.0]
    r["kose_kubbe_tepe_m"] = round(max(v.z for v in kub), 2); r["kose_kubbe_hedef_m"] = 19.73
    bmk = bmesh.new(); bmk.from_mesh(bpy.data.objects["Kubbeler_19"].data); gor = set(); tz = []
    for v0 in bmk.verts:                                        # her kubbe ayrı ada: ada başına tepe kotu
        if v0.index in gor: continue
        st = [v0]; gor.add(v0.index); mz = v0.co.z
        while st:
            v = st.pop(); mz = max(mz, v.co.z)
            for e in v.link_edges:
                u = e.other_vert(v)
                if u.index not in gor: gor.add(u.index); st.append(u)
        tz.append(round(mz, 2))
    bmk.free(); tepeler = {"ada_sayisi": len(tz), "benzersiz_tepe_kotlari": sorted(set(tz))}
    r["kubbe_tepeleri_m"] = tepeler; r["tac_kapi_ust_m"] = round(top("Tac_Kapi"), 2)
    r["tac_kapi_basamak_sayisi"] = 5; r["tac_kapi_giris_kotu_m"] = 0.85
    return r

if __name__ == "__main__" or True:
    isik()
    ao_pisir()
    RAPOR["olcu"] = olcu(); RAPOR["ortalama_doku_rengi"] = ORT
    RAPOR["minare_kotlari"] = {k: {a: round(b, 2) for a, b in v.items() if isinstance(b, float)} for k, v in MIN.items()}
    mk = A.mesh_kontrol(); RAPOR["mesh"] = {k: v for k, v in mk.items() if v["acik_kenar"] or v["manifold_degil"]}
    RAPOR["ucgen"] = {k: v["ucgen"] for k, v in mk.items() if k.startswith(("Minare", "Kubbeler", "Govde", "Tac", "Avlu", "Ic_", "Sadirvan"))}
    RAPOR["ucgen_toplam"] = sum(v["ucgen"] for v in mk.values())
    if ASAMA in ("B", "C", "D"):
        ay = A.arka_yuz_render(KONTROL, "arka_yuz"); RAPOR["kirmizi_oran_8_yon"] = [round(x, 5) for x in ay]
        for f_ in os.listdir(KONTROL):
            if f_.startswith("arka_yuz_") and f_.endswith(".png"): os.remove(os.path.join(KONTROL, f_))
    with open(os.path.join(KONTROL, "olcu_dogrulama.json"), "w", encoding="utf-8") as fh: json.dump(RAPOR, fh, ensure_ascii=False, indent=1)
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
    if ASAMA in ("A", "D"):
        std_kamera(); render("havadan.png", (1800, 1600))
        # kuzey ortografik: kot çizgileriyle
        for z, ad in ((0, "z0"), (13.58, "sacak"), (19.73, "kubbe"), (47.9, "tepe")):
            cizgi(z, -60, -45, 45, ad); yazi("%.2f" % z, (46, -60, z - 0.5), 1.8)
        kamera((0.55, -300, 24), (0.55, 0, 24), ortho=84); render("kuzey_orto.png", (1800, 1300))
        # minare ölçü: batıdan yandan ortografik (0 / 13,6 / 47,9 kot çizgileri)
        for o in [o for o in bpy.data.objects if o.name.startswith(("_cizgi", "_yazi"))]: bpy.data.objects.remove(o, do_unlink=True)
        cw = Vector((XM1, YM1, 0)) + OFS
        for z, ad in ((0, "z0"), (13.6, "sacak"), (47.9, "tepe")):
            o = cizgi(z, cw.y, cw.x - 8, cw.x + 8, ad); o.scale = (1, 16, 1) if False else o.scale
            o.location = (cw.x, cw.y, z); o.scale = (0.05, 16, 0.08); yazi("%.1f" % z, (cw.x, cw.y - 9, z + 0.4), 1.6, rotz=math.pi / 2)
        kamera((cw.x + 300, cw.y, 22), (cw.x, cw.y, 22), ortho=62); render("minare_olcu.png", (900, 1400))
        for o in [o for o in bpy.data.objects if o.name.startswith(("_cizgi", "_yazi"))]: bpy.data.objects.remove(o, do_unlink=True)
        # minare yakın çekimler (batı ve doğu): şerefe+külah, kaide+küp
        ce = Vector((XM2, YM2, 0)) + OFS
        kamera(cw + Vector((11, -14, 40)), cw + Vector((0, 0, 40)), lens=70); render("minare_serefe_yakin_W.png", (1100, 1100))
        kamera(cw + Vector((12, -15, 9)), cw + Vector((0, 0, 7.5)), lens=50); render("minare_kaide_yakin_W.png", (1100, 1100))
        kamera(ce + Vector((11, -14, 40)), ce + Vector((0, 0, 40)), lens=70); render("minare_serefe_yakin_E.png", (1100, 1100))
        kamera(ce + Vector((12, -15, 9)), ce + Vector((0, 0, 8)), lens=50); render("minare_kaide_yakin_E.png", (1100, 1100))
        print("TAMAM", ASAMA)

    FOTO = os.path.join(ESER, "..", "ref", "foto")
    def yukle(p, h):
        im = bpy.data.images.load(p); w0, h0 = im.size
        a = np.array(im.pixels[:], dtype=np.float32).reshape(h0, w0, 4); bpy.data.images.remove(im)
        im2 = bpy.data.images.new("_t", w0, h0, alpha=True); im2.pixels = a.ravel(); im2.scale(int(w0 * h / h0), h)
        r = np.array(im2.pixels[:], dtype=np.float32).reshape(h, int(w0 * h / h0), 4); bpy.data.images.remove(im2); r[..., 3] = 1; return r
    def yan_yana(foto, rnd, out):
        r = yukle(os.path.join(KONTROL, rnd), 1100); f = yukle(os.path.join(FOTO, foto), 1100)
        im = bpy.data.images.new("_o", f.shape[1] + 16 + r.shape[1], 1100, alpha=True)
        im.pixels = np.concatenate([f, np.ones((1100, 16, 4), np.float32), r], axis=1).ravel()
        im.filepath_raw = os.path.join(KONTROL, out); im.file_format = 'PNG'; im.save(); bpy.data.images.remove(im)
    SD = Vector((-15.0, -39.0, 0)) + OFS; SB = Vector((15.0, -39.0, 0)) + OFS; CC = Vector((0, -39.0, 0)) + OFS; IC3 = Vector((IC_C.x, IC_C.y, 0)) + OFS
    if ASAMA in ("B", "D"):
        kamera(SD + Vector((-0.0, 11.3, 1.5)), SD + Vector((0, 0, 3.7)), lens=26); render("sadirvan_095_render.png", (880, 1100))
        yan_yana("ulucamii_095_avlu_sadirvan_ust_ortu.jpg", "sadirvan_095_render.png", "yan_yana_avlu_sadirvan.png")
        kamera(SD + Vector((7.5, -8.5, 2.2)), SD + Vector((0, 0, 3.0)), lens=40); render("sadirvan_yakin_dogu.png", (1100, 1100))
        kamera(CC + Vector((4.2, -1.8, 1.5)), CC + Vector((-5.0, 1.8, 1.9)), lens=20); render("cesme_096_render.png", (1650, 1100))
        yan_yana("ulucamii_096_avlu_mermer_cesme.jpg", "cesme_096_render.png", "yan_yana_mermer_cesme.png")
        kamera(CC + Vector((2.8, -2.6, 1.7)), CC + Vector((0, 0, 1.4)), lens=45); render("cesme_yakin.png", (1100, 1100))
        li = bpy.data.objects.new("_ic_isik", bpy.data.lights.new("_ic_isik", 'POINT')); sc.collection.objects.link(li)   # yalnız kontrol render'ı: iç mekâna ışık (model dışa aktarımında yok)
        li.data.energy = 1200; li.data.shadow_soft_size = 2.0; li.location = IC3 + Vector((0, 0, 11.0))
        kamera(IC3 + Vector((-5.1, -0.8, 2.0)), IC3 + Vector((0, 0.3, 0.8)), lens=20); render("ic_sadirvan_105_render.png", (1650, 1100))
        yan_yana("ulucamii_105_ic_sadirvan_havuz_yakin.jpg", "ic_sadirvan_105_render.png", "yan_yana_ic_sadirvan.png")
        kamera(IC3 + Vector((0, 0, 60)), IC3, ortho=16); sc.camera.rotation_euler = (0, 0, 0); render("ust_cam_fener.png", (1200, 1200))
        bpy.data.objects.remove(li, do_unlink=True)
        kamera(SD + Vector((18, -26, 22)), SD + Vector((6, 5, 2)), ortho=44); render("avlu_B_havadan.png", (1400, 1100))
    print("TAMAM", ASAMA)
    if ASAMA in ("C", "D"):
        std_kamera(); render("havadan.png", (1800, 1600))
        kamera((-30, -66, 24), (0.5, -28, 3), lens=32); render("avlu_genel.png", (1800, 1100))
        kamera((0.5, -43, 3.4), (0.5, -20, 6.0), lens=30); render("tac_kapi_onu.png", (1600, 1100))
        kamera((-8, -41, 3.0), (-14, -29, 1.4), lens=40); render("insan_sadirvan_dogu.png", (1400, 1000))
        kamera((-60, -60, 20), (-34, -36, 0), lens=35); render("kaide_kose.png", (1400, 1000))
        kamera((20.5, -37, 7), (32.5, -22.3, 10), lens=35); render("minare_bati_kaide.png", (1100, 1300))
        kamera((-19, -38, 5.5), (-30.8, -22.5, 7), lens=35); render("minare_dogu_kaide.png", (1100, 1300))
        kamera((-24.5, -28.5, 7.2), (-26.85, -18.66, 6.9), lens=45); render("pencere_yakin_on.png", (1300, 1000))
        kamera((-20.5, -25.5, 8.2), (-26.85, -18.66, 6.9), lens=45); render("pencere_yakin_yan.png", (1300, 1000))
        kamera((0.5, -31, 7.5), (0.5, -19.2, 7.6), lens=60); render("tac_kapi_kavsara.png", (1300, 1000))
        kamera((43.5, 3.3, 3.2), (35.2, 2.45, 2.9), lens=40); render("kapi_bati_yakin.png", (1300, 1000))
        kamera((-44.5, 3.3, 3.2), (-33.9, 2.45, 2.9), lens=40); render("kapi_dogu_yakin.png", (1300, 1000))
    if ASAMA == "D":
        # ---- teslim: v23_genel, kuzeybatı karşılaştırma, renkler.json, GLB, sunum render'ları ----
        std_kamera(); render("v23_genel.png", (1500, 1350), saydam=True)
        kamera((70, -96, 60), (0, -2, 6), lens=36); render("kuzeybati_render.png", (1650, 1100))
        yan_yana("ulucamii_009_havadan_kuzeybati.jpg", "kuzeybati_render.png", "yan_yana_kuzeybati.png")
        sc.cycles.samples = 96
        SUNUM = [("sunum_01_kuzeybati.png", (66, -92, 40), (0, -6, 12), 28, (1800, 1200)),
                 ("sunum_02_tac_kapi_avlu.png", (0.5, -58, 7.5), (0.5, -22, 7.5), 30, (1800, 1200)),
                 ("sunum_03_guneydogu.png", (-84, 82, 40), (0, -2, 10), 34, (1800, 1200)),
                 ("sunum_04_bati_cephe_minare.png", (78, -30, 13), (33, 0, 18), 30, (1800, 1200)),
                 ("sunum_05_sadirvan.png", (-3, -42, 3.4), (-14.5, -30, 4.5), 30, (1800, 1200))]
        for ad, cl, tg, ln, rs in SUNUM: kamera(cl, tg, lens=ln); render(ad, rs)
        # ---- renkler.json (standart §5/3) ----
        import collections
        alan = collections.Counter()
        for o in bpy.data.objects:
            if o.type == "MESH" and not o.name.startswith(("_", "REF")):
                for p in o.data.polygons:
                    mm = o.data.materials[p.material_index] if p.material_index < len(o.data.materials) else None
                    if mm: alan[mm.name] += p.area
        s2l_inv = lambda c: 12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055
        import colorsys
        RK = []
        for m in bpy.data.materials:
            if not m.use_nodes or m.name not in alan: continue
            bs = next((n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"), None)
            if bs is None: continue
            tx = next((n for n in m.node_tree.nodes if n.type == "TEX_IMAGE" and n.image), None)
            if tx: rgb = np.array(tx.image.pixels[:]).reshape(-1, 4)[:, :3].mean(0).tolist()
            else:
                rn = next((n for n in m.node_tree.nodes if n.type == "RGB"), None)
                lin = rn.outputs[0].default_value[:3] if rn else bs.inputs["Base Color"].default_value[:3]
                rgb = [s2l_inv(c) for c in lin]
            h_, s_, v_ = colorsys.rgb_to_hsv(*rgb)
            RK.append({"ad": m.name, "hex": "#%02X%02X%02X" % tuple(round(max(0, min(1, c)) * 255) for c in rgb), "hsv_v": round(v_, 3), "doku": bool(tx),
                       "rough": round(bs.inputs["Roughness"].default_value, 2), "metal": round(bs.inputs["Metallic"].default_value, 2), "alan_m2": round(alan[m.name], 1)})
        RK.sort(key=lambda r: -r["alan_m2"])
        with open(os.path.join(KONTROL, "renkler.json"), "w", encoding="utf-8") as fh:
            json.dump({"malzemeler": RK, "genis_yuzey_V_0.72_alti": [r["ad"] for r in RK if r["alan_m2"] > 40 and r["hsv_v"] < 0.72]}, fh, ensure_ascii=False, indent=1)
        # ---- GLB (zeminsiz + sunum/kaideli); kafes alpha'sı dışa aktarım için doğrudan bağlanır ----
        for ad in ("Kafes_Beyaz", "Kafes_Beyaz.001"):
            m = M[ad]; bs = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED"); tx = tex_node(m)
            m.node_tree.links.new(tx.outputs["Alpha"], bs.inputs["Alpha"])
        os.makedirs(os.path.join(ESER, "export"), exist_ok=True)
        g1 = os.path.join(ESER, "export", "ulu-cami_v23.glb"); g2 = os.path.join(ESER, "export", "ulu-cami_v23_sunum.glb")
        for yol, zemin in ((g1, False), (g2, True)):
            bpy.ops.object.select_all(action='DESELECT')
            for o in bpy.data.objects:
                if o.type == "MESH" and not o.name.startswith(("REF", "_")) and (zemin or not o.name.startswith("Zemin")): o.select_set(True)
            kw = dict(filepath=yol, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
            try: bpy.ops.export_scene.gltf(export_draco_mesh_compression_enable=True, **kw); RAPOR.setdefault("glb", {})[os.path.basename(yol)] = {"draco": True}
            except Exception as e_: bpy.ops.export_scene.gltf(**kw); RAPOR.setdefault("glb", {})[os.path.basename(yol)] = {"draco": False, "hata": str(e_)[:80]}
            RAPOR["glb"][os.path.basename(yol)]["boyut_mb"] = round(os.path.getsize(yol) / 1e6, 2)
        with open(os.path.join(KONTROL, "olcu_dogrulama.json"), "w", encoding="utf-8") as fh: json.dump(RAPOR, fh, ensure_ascii=False, indent=1)
        print("TAMAM D-bitti")
