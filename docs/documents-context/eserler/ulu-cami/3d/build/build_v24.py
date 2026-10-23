"""Ulu Cami v24 = v23 + DAİRE kaide (yalnız kaide değişir; bina, palet, parça adları, figür ve ağaçlar aynı).
Girdi : ../blend/ulu-cami_v23.blend   (v22 blend'i silindiği için build_v23.py baştan çalışmaz; v23 sahnesi açılıp yamanır)
Çıktı : ../blend/ulu-cami_v24.blend, ../export/ulu-cami_v24.glb (kaidesiz, v23 ile aynı), ../export/ulu-cami_v24_sunum.glb (kaide + daire merkezi orijinde), ../kontrol/v24/
Çalıştır: Blender -b ../blend/ulu-cami_v23.blend --python build_v24.py -- A     (A: kaide + kontrol + GLB + blend)
          Blender -b ../blend/ulu-cami_v24.blend --python build_v24.py -- R     (R: v24 render'ları + v23/v24 karşılaştırma)
          Blender -b ../blend/ulu-cami_v23.blend --python build_v24.py -- R23   (R23: karşılaştırma için v23 render'ları, kontrol/_tmp/)
Standart: eserler/_GENEL_SAHNE_STANDARDI.md §1 (19 Ekim 2026 "Kaide biçimi"); örnek: koza-han/3d/build/build_v12.py.

SİLİNEN ve yeniden üretilen nesne: yalnız `Zemin_Kaide` (dikdörtgen kaide, 44 üçgen).
DEĞİŞTİRİLEBİLEN nesneler (yalnız kenardan 1,5 m içeri kesmek gerekirse): Zemin_Avlu_Tas, Zemin_Avlu_Derz, Cevre_Tarh_01 (v24'te gerekmedi; kesme kodu koşulludur).
DOKUNULMAYAN: bina, kubbeler, minareler, şadırvanlar, palet, ağaçlar, figürler, parça adları, malzemeler.
"""
import bpy, bmesh, math, sys, os, json, hashlib
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ESER = os.path.dirname(HERE)                                   # ulu-cami/3d
sys.path.insert(0, os.path.join(ESER, "..", "..", "_kutuphane"))
import akar3d as A

ASAMA = (sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "A").upper()
KONTROL = os.path.join(ESER, "kontrol", "v24")
TMP = os.path.join(ESER, "kontrol", "_tmp")
BLEND = os.path.join(ESER, "blend", "ulu-cami_v24.blend")
EXPORT = os.path.join(ESER, "export", "ulu-cami_v24.glb")
EXPORT_SUNUM = os.path.join(ESER, "export", "ulu-cami_v24_sunum.glb")
sc = bpy.context.scene

# ---------------- kaide parametreleri (standart §1) ----------------
K_MERKEZ = Vector((0.55, 4.61))      # T: yapı + çevre noktalarının en küçük çevreleyen çemberinin merkezi (hesap: kontrol/v24/olcu_dogrulama.json)
K_PAY, K_SEG = 8.0, 96                   # kullanıcı kararı (19 Ekim 2026, onay turu): standart §1 payı 3 m idi; Ulu Cami için 8 m (v23 payı)
K_KAL, K_PAH, K_ZUST = 0.6, 0.15, -0.02    # v23'teki gibi: üst kot −0,02 (avlu taşı z = 0'da kalır, aynı düzlem yok)
K_ICERI = 1.5                         # döşeme, çim ve tarhların kaide kenarından en az uzaklığı
CEVRE_ONEK = ("Zemin_Kaide", "_", "REF")


def yapi_nesneleri():
    return [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(CEVRE_ONEK)]


def mesh_sha(o):
    """Dünya koordinatlı köşe + yüz + malzeme sırası özeti (1e-5 yuvarlak)."""
    me = o.data; mw = o.matrix_world
    v = np.array([tuple(mw @ p.co) for p in me.vertices], dtype=np.float64).round(5)
    f = [(tuple(p.vertices), p.material_index) for p in me.polygons]
    h = hashlib.sha256(); h.update(v.tobytes()); h.update(repr(f).encode()); h.update(repr([m.name if m else None for m in me.materials]).encode())
    return h.hexdigest()


def dunya_noktalari(o):
    return [(o.matrix_world @ p.co) for p in o.data.vertices]


def maks_uzaklik(o):
    return max((Vector((w.x, w.y)) - K_MERKEZ).length for w in dunya_noktalari(o))


def kaide_olustur(R):
    mz = bpy.data.materials["Zemin_Sicak_Tas_Grisi_v22"]; my = bpy.data.materials["Zemin_Kaide_Yan"]     # #C4BDAF / #A39A8B (v23 malzemeleri)
    cevre = lambda r: [K_MERKEZ + Vector((r * math.cos(2 * math.pi * k / K_SEG), r * math.sin(2 * math.pi * k / K_SEG))) for k in range(K_SEG)]
    g = A.G("Zemin_Kaide")
    ust = [g.V(q, K_ZUST) for q in cevre(R - K_PAH)]; ors = [g.V(q, K_ZUST - K_PAH) for q in cevre(R)]; alt = [g.V(q, K_ZUST - K_KAL) for q in cevre(R)]; n = K_SEG
    g.F(ust, mz)
    for k in range(n):
        j = (k + 1) % n
        g.F([ust[j], ust[k], ors[k], ors[j]], my)               # üst pah
        g.F([ors[j], ors[k], alt[k], alt[j]], my)               # yan yüz
    g.F(alt[::-1], my)
    ob = g.obj()
    ob.data.color_attributes.new("AO", 'BYTE_COLOR', 'CORNER')   # zemine nötr (beyaz) AO: v23 zeminiyle aynı
    for d in ob.data.color_attributes["AO"].data: d.color = (1, 1, 1, 1)
    ob.data.color_attributes.active_color = ob.data.color_attributes["AO"]
    return ob


def kes_ic(ad, r_ic):
    """Nesneyi merkezli r_ic yarıçaplı silindirle kesiştir (kaide kenarından 1,5 m içeride kes)."""
    o = bpy.data.objects[ad]
    bpy.ops.mesh.primitive_cylinder_add(vertices=K_SEG, radius=r_ic, depth=4.0, location=(K_MERKEZ.x, K_MERKEZ.y, 0.0)); cyl = bpy.context.active_object
    md = o.modifiers.new("kes", 'BOOLEAN'); md.operation = 'INTERSECT'; md.object = cyl; md.solver = 'EXACT'
    bpy.ops.object.select_all(action='DESELECT'); bpy.context.view_layer.objects.active = o; o.select_set(True); bpy.ops.object.modifier_apply(modifier="kes")
    bpy.data.objects.remove(cyl, do_unlink=True)


# ---------------- kamera / render (v23 ile aynı kameralar) ----------------
def kamera(loc, tgt, lens=50, ortho=None, ad="_c"):
    cd = bpy.data.cameras.new(ad); cd.lens = lens; cd.clip_end = 3000
    if ortho: cd.type = 'ORTHO'; cd.ortho_scale = ortho
    cam = bpy.data.objects.new(ad, cd); sc.collection.objects.link(cam); sc.camera = cam; cam.location = loc
    cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return cam


def std_kamera(tgt=(0.5, 5, 12), uzak=300, ortho=170):
    el, az = math.radians(32), math.radians(45)                 # standart: yükseklik ≈32°, yatay ≈45° (kuzeybatıdan), ortografik
    d = Vector((math.cos(el) * math.sin(az), -math.cos(el) * math.cos(az), math.sin(el))) * uzak
    return kamera(Vector(tgt) + d, tgt, ortho=ortho)


def render(yol, res, saydam=False, ornek=24):
    sc.render.engine = 'CYCLES'; sc.cycles.samples = ornek; sc.cycles.device = 'CPU'
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.film_transparent = saydam
    sc.render.filepath = yol; bpy.ops.render.render(write_still=True)


def yukle(yol, h):
    im = bpy.data.images.load(yol); w0, h0 = im.size
    a = np.array(im.pixels[:], dtype=np.float32).reshape(h0, w0, 4); bpy.data.images.remove(im)
    ix = (np.arange(int(w0 * h / h0)) * (w0 / int(w0 * h / h0))).astype(int); iy = (np.arange(h) * (h0 / h)).astype(int)
    r = a[iy][:, ix]; r[..., 3] = 1; return r


def yan_yana(sol, sag, out, h=1000):
    a, b = yukle(sol, h), yukle(sag, h); ara = np.ones((h, 16, 4), np.float32)
    cat = np.concatenate([a, ara, b], axis=1)
    im = bpy.data.images.new("_o", cat.shape[1], h, alpha=True); im.pixels = cat.ravel()
    im.filepath_raw = out; im.file_format = 'PNG'; im.save(); bpy.data.images.remove(im)


# ======================= A: kaide + kontrol + dışa aktarım =======================
if ASAMA == "A":
    os.makedirs(KONTROL, exist_ok=True); os.makedirs(TMP, exist_ok=True)
    RAPOR = {"surum": "v24", "girdi": "blend/ulu-cami_v23.blend", "degisen": "yalnız Zemin_Kaide (dikdörtgen → daire)"}
    yapi = yapi_nesneleri()
    sha_once = {o.name: mesh_sha(o) for o in yapi}
    eski = bpy.data.objects.get("Zemin_Kaide")
    RAPOR["silinen"] = {"Zemin_Kaide": {"bicim": "dikdörtgen 86,6 × 89,6 m", "ucgen": A.mesh_kontrol([eski])["Zemin_Kaide"]["ucgen"]} if eski else None}

    # 1) en küçük çevreleyen çember (dış hat: dışbükey zarf + tüm üçlü/ikili çemberler) — yapı ve bütün çevre öğeleri
    pts = sorted({(round(w.x, 5), round(w.y, 5)) for o in yapi for w in dunya_noktalari(o)})
    cr = lambda o_, a_, b_: (a_[0] - o_[0]) * (b_[1] - o_[1]) - (a_[1] - o_[1]) * (b_[0] - o_[0])
    lo_ = []
    for p in pts:
        while len(lo_) >= 2 and cr(lo_[-2], lo_[-1], p) <= 0: lo_.pop()
        lo_.append(p)
    up_ = []
    for p in reversed(pts):
        while len(up_) >= 2 and cr(up_[-2], up_[-1], p) <= 0: up_.pop()
        up_.append(p)
    H = lo_[:-1] + up_[:-1]
    import itertools
    en = None
    def uygun(c, r): return all(math.dist(c, p) <= r + 1e-7 for p in H)
    for a_, b_ in itertools.combinations(H, 2):
        c_ = ((a_[0] + b_[0]) / 2, (a_[1] + b_[1]) / 2); r_ = math.dist(a_, c_)
        if (en is None or r_ < en[1]) and uygun(c_, r_): en = (c_, r_)
    for a_, b_, c3 in itertools.combinations(H, 3):
        d = 2 * (a_[0] * (b_[1] - c3[1]) + b_[0] * (c3[1] - a_[1]) + c3[0] * (a_[1] - b_[1]))
        if abs(d) < 1e-12: continue
        ux = ((a_[0] ** 2 + a_[1] ** 2) * (b_[1] - c3[1]) + (b_[0] ** 2 + b_[1] ** 2) * (c3[1] - a_[1]) + (c3[0] ** 2 + c3[1] ** 2) * (a_[1] - b_[1])) / d
        uy = ((a_[0] ** 2 + a_[1] ** 2) * (c3[0] - b_[0]) + (b_[0] ** 2 + b_[1] ** 2) * (a_[0] - c3[0]) + (c3[0] ** 2 + c3[1] ** 2) * (b_[0] - a_[0])) / d
        r_ = math.dist((ux, uy), a_)
        if (en is None or r_ < en[1]) and uygun((ux, uy), r_): en = ((ux, uy), r_)
    assert math.dist(en[0], K_MERKEZ) < 0.01, "K_MERKEZ en küçük çemberin merkezi değil: %s" % (en,)
    R_MIN = max(maks_uzaklik(o) for o in yapi)                       # sabit merkezden en uzak nokta (≈ en küçük çember yarıçapı)
    K_R = math.ceil((R_MIN + K_PAY) * 100) / 100
    RAPOR["kaide"] = {"bicim": "daire", "merkez_m": [round(K_MERKEZ.x, 2), round(K_MERKEZ.y, 2)], "en_kucuk_cember_merkez_m": [round(en[0][0], 3), round(en[0][1], 3)],
                      "en_kucuk_cember_R_m": round(en[1], 3), "merkezden_en_uzak_nokta_m": round(R_MIN, 3), "pay_m": K_PAY, "yaricap_m": K_R,
                      "kalinlik_m": K_KAL, "ust_pah_m": K_PAH, "ust_kot_m": K_ZUST, "kenar_sayisi": K_SEG,
                      "ust_renk": "#C4BDAF", "yan_renk": "#A39A8B"}

    # 2) kenar payı denetimi: döşeme/çim/tarh kaide kenarından ≥ 1,5 m içeride; ağaç/figür de (taşımak yok, ihlal olursa dur)
    gruplar = {"Zemin_Avlu_Tas": ["Zemin_Avlu_Tas"], "Zemin_Avlu_Derz": ["Zemin_Avlu_Derz"], "Cevre_Tarh_01": ["Cevre_Tarh_01"],
               "agaclar": [o.name for o in yapi if o.name.startswith("Cevre_Agac")], "figurler": [o.name for o in yapi if o.name.startswith("Olcek_")],
               "bina_ve_sadirvanlar": [o.name for o in yapi if not o.name.startswith(("Zemin_Avlu", "Cevre_", "Olcek_"))]}
    pay = {}
    for k, adlar in gruplar.items(): pay[k] = round(K_R - max(maks_uzaklik(bpy.data.objects[a]) for a in adlar), 3)
    RAPOR["kenar_payi_m"] = pay
    kesilen = []
    for ad in gruplar["Zemin_Avlu_Tas"] + gruplar["Zemin_Avlu_Derz"] + gruplar["Cevre_Tarh_01"]:
        if K_R - maks_uzaklik(bpy.data.objects[ad]) < K_ICERI: kes_ic(ad, K_R - K_ICERI); kesilen.append(ad)
    for ad in gruplar["agaclar"] + gruplar["figurler"]:
        if K_R - maks_uzaklik(bpy.data.objects[ad]) < K_ICERI: raise SystemExit("DUR: %s kaide kenarına %.2f m (<1,5) yakın: kullanıcıya sor" % (ad, K_R - maks_uzaklik(bpy.data.objects[ad])))
    RAPOR["kesilen_nesneler"] = kesilen

    # 3) kaideyi yeniden üret
    if eski: bpy.data.objects.remove(eski, do_unlink=True)
    KD = kaide_olustur(K_R)

    # 4) denetimler (yalnız kaide) + bina SHA-256
    mk = A.mesh_kontrol([KD])["Zemin_Kaide"]
    bm = bmesh.new(); bm.from_mesh(KD.data); hacim = bm.calc_volume(signed=True); bm.free()
    RAPOR["kaide_mesh"] = dict(mk, imzali_hacim_m3=round(hacim, 1), beklenen_hacim_m3_yaklasik=round(math.pi * K_R ** 2 * K_KAL, 1))
    sha_sonra = {o.name: mesh_sha(o) for o in yapi_nesneleri()}
    degisen = [a for a in sha_once if sha_once[a] != sha_sonra.get(a)]
    RAPOR["sha256"] = {"nesne_sayisi": len(sha_once), "degisen": degisen, "ayni": not degisen and set(sha_sonra) == set(sha_once)}
    tri = lambda o: sum(len(p.vertices) - 2 for p in o.data.polygons)
    RAPOR["ucgen"] = {"kaide": mk["ucgen"], "bina_ve_cevre_zeminsiz_glb": sum(tri(o) for o in yapi_nesneleri() if not o.name.startswith("Zemin_Avlu"))}
    RAPOR["ucgen"]["toplam_sunum"] = RAPOR["ucgen"]["bina_ve_cevre_zeminsiz_glb"] + sum(tri(bpy.data.objects[a]) for a in ("Zemin_Avlu_Tas", "Zemin_Avlu_Derz")) + mk["ucgen"]

    # kaide için arka yüz denetimi: yalnız kaide görünür, ters yüzler kırmızı (8 yön)
    red = bpy.data.materials.new("_ARKA"); red.use_nodes = True; nt = red.node_tree; nt.nodes.clear()
    geo = nt.nodes.new("ShaderNodeNewGeometry"); e1 = nt.nodes.new("ShaderNodeEmission"); e2 = nt.nodes.new("ShaderNodeEmission")
    e1.inputs[0].default_value = (0.75, 0.75, 0.75, 1); e2.inputs[0].default_value = (1, 0, 0, 1)
    mix = nt.nodes.new("ShaderNodeMixShader"); out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(geo.outputs["Backfacing"], mix.inputs[0]); nt.links.new(e1.outputs[0], mix.inputs[1]); nt.links.new(e2.outputs[0], mix.inputs[2]); nt.links.new(mix.outputs[0], out.inputs[0])
    saklı = [s.material for s in KD.material_slots]
    for s in KD.material_slots: s.material = red
    gizli = [(o, o.hide_render) for o in bpy.data.objects if o.type == "MESH" and o is not KD]
    for o, _ in gizli: o.hide_render = True
    sc.render.resolution_x = sc.render.resolution_y = 640; sc.render.film_transparent = True; sc.view_settings.view_transform = 'Standard'
    oranlar = []
    for k in range(8):
        a_ = 2 * math.pi * k / 8
        cam = kamera(Vector((K_MERKEZ.x + math.cos(a_) * 150, K_MERKEZ.y + math.sin(a_) * 150, 150 * 0.45)), (K_MERKEZ.x, K_MERKEZ.y, -0.3), lens=35, ad="_kcam")
        f_ = os.path.join(TMP, "arka_%d.png" % k); render(f_, (640, 640), True, 4)
        im = bpy.data.images.load(f_); px = np.array(im.pixels[:]).reshape(-1, 4); bpy.data.images.remove(im)
        vis = px[:, 3] > 0.5; kir = vis & (px[:, 0] > 0.6) & (px[:, 1] < 0.25)
        oranlar.append(round(float(kir.sum()) / max(int(vis.sum()), 1), 5))
        bpy.data.objects.remove(cam, do_unlink=True)
    for o, h_ in gizli: o.hide_render = h_
    for s, m in zip(KD.material_slots, saklı): s.material = m
    bpy.data.materials.remove(red)
    RAPOR["kaide_arka_yuz_kirmizi_oran_8_yon"] = oranlar

    # 5) dışa aktarım: ana GLB kaidesiz ve dünya koordinatlı (v23 ile aynı); sunum GLB daire merkezine ortalı
    for o in bpy.data.objects:
        if o.type == "MESH" and o.name.startswith("Zemin_Cim"): raise SystemExit("beklenmeyen Zemin_Cim")
    konum0 = {o.name: o.location.copy() for o in bpy.data.objects if o.type == "MESH"}
    def sec(zemin):
        bpy.ops.object.select_all(action='DESELECT')
        for o in bpy.data.objects:
            if o.type == "MESH" and not o.name.startswith(("REF", "_")) and (zemin or not o.name.startswith("Zemin")): o.select_set(True)
    def ortala(k):
        for o in bpy.data.objects:
            if o.type == "MESH" and not o.name.startswith(("REF", "_")):
                if k: o.location.x = konum0[o.name].x - K_MERKEZ.x; o.location.y = konum0[o.name].y - K_MERKEZ.y
                else: o.location = konum0[o.name].copy()
    kw = dict(export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
    os.makedirs(os.path.dirname(EXPORT), exist_ok=True); RAPOR["glb"] = {}
    # v23 dışa aktarımı şebeke dokusunun Alpha'sını doğrudan BSDF Alpha'ya bağlıyordu (glTF alphaMode BLEND); blend'de eşik düğümü (MASK) kalır. Yalnız dışa aktarımda aynı bağ kurulur.
    kafes_bag = []
    for a_ in ("Kafes_Beyaz", "Kafes_Beyaz.001"):
        nt_ = bpy.data.materials[a_].node_tree; bs_ = next(n for n in nt_.nodes if n.type == "BSDF_PRINCIPLED"); tx_ = next(n for n in nt_.nodes if n.type == "TEX_IMAGE")
        kafes_bag.append((nt_, bs_, [l.from_socket for l in bs_.inputs["Alpha"].links])); nt_.links.new(tx_.outputs["Alpha"], bs_.inputs["Alpha"])
    for yol, zemin in ((EXPORT, False), (EXPORT_SUNUM, True)):
        ortala(zemin); sec(zemin)
        try: bpy.ops.export_scene.gltf(filepath=yol, export_draco_mesh_compression_enable=True, **kw); dr = True
        except Exception: bpy.ops.export_scene.gltf(filepath=yol, **kw); dr = False
        RAPOR["glb"][os.path.basename(yol)] = {"draco": dr, "boyut_mb": round(os.path.getsize(yol) / 1e6, 3),
                                               "sha256": hashlib.sha256(open(yol, "rb").read()).hexdigest()}
    ortala(False)
    for nt_, bs_, eskiler in kafes_bag:
        for l in list(bs_.inputs["Alpha"].links): nt_.links.remove(l)
        for fs in eskiler: nt_.links.new(fs, bs_.inputs["Alpha"])
    RAPOR["glb_orijin"] = "sunum GLB: daire kaide merkezi (0,55; 4,61); yapı −merkez kadar kaydırıldı, blend dünya koordinatları değişmedi. Ana GLB: kaidesiz, dünya koordinatlı (v23 ile aynı)."
    v23g = os.path.join(ESER, "export", "ulu-cami_v23.glb")
    if os.path.exists(v23g): RAPOR["glb"]["ulu-cami_v24.glb"]["v23_ile_bayt_ayni"] = open(v23g, "rb").read() == open(EXPORT, "rb").read()
    RAPOR["blend_dunya_koordinati_degismedi"] = all((o.location - konum0[o.name]).length < 1e-9 for o in bpy.data.objects if o.type == "MESH")

    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
    with open(os.path.join(KONTROL, "olcu_dogrulama.json"), "w", encoding="utf-8") as fh: json.dump(RAPOR, fh, ensure_ascii=False, indent=1)
    print("TAMAM A", json.dumps({k: RAPOR[k] for k in ("kaide", "kenar_payi_m", "kesilen_nesneler", "kaide_mesh", "sha256", "ucgen", "kaide_arka_yuz_kirmizi_oran_8_yon", "glb", "blend_dunya_koordinati_degismedi")}, ensure_ascii=False, indent=1))

# ======================= R23: v23 render'ları (karşılaştırma için, kontrol/_tmp/) =======================
elif ASAMA == "R23":
    os.makedirs(TMP, exist_ok=True)
    std_kamera(); render(os.path.join(TMP, "v23_havadan.png"), (1800, 1600))
    std_kamera(); render(os.path.join(TMP, "v23_genel.png"), (1500, 1350), saydam=True)

# ======================= R: v24 render'ları + karşılaştırma =======================
elif ASAMA == "R":
    os.makedirs(KONTROL, exist_ok=True)
    kd = bpy.data.objects["Zemin_Kaide"]
    std_kamera(); render(os.path.join(KONTROL, "havadan.png"), (1800, 1600))
    std_kamera(); render(os.path.join(KONTROL, "v24_genel.png"), (1500, 1350), saydam=True)
    yan_yana(os.path.join(TMP, "v23_havadan.png"), os.path.join(KONTROL, "havadan.png"), os.path.join(KONTROL, "yan_yana_v23_v24.png"), 1000)
    # kenar yakın çekimleri: avlu döşemesinin kaideye en yakın köşesi
    P0 = Vector((23.55, -36.8)); u = (P0 - K_MERKEZ).normalized(); R = max((Vector((v.co.x, v.co.y)) - K_MERKEZ).length for v in kd.data.vertices)
    E = K_MERKEZ + u * R; t = Vector((-u.y, u.x)); mid = (P0 + E) / 2
    kamera((E.x + u.x * 14 + t.x * 4, E.y + u.y * 14 + t.y * 4, 9.0), (mid.x, mid.y, -0.3), lens=35); render(os.path.join(KONTROL, "kaide_kenar_yakin.png"), (1500, 1000))
    kamera((E.x + u.x * 5.5 + t.x * 3, E.y + u.y * 5.5 + t.y * 3, 2.4), (E.x - u.x * 1.0, E.y - u.y * 1.0, -0.25), lens=40); render(os.path.join(KONTROL, "kaide_pah_yakin.png"), (1500, 1000))
    kamera((E.x - u.x * 7 + t.x * 6, E.y - u.y * 7 + t.y * 6, 3.0), (P0.x + u.x * 2.0, P0.y + u.y * 2.0, 0.0), lens=35); render(os.path.join(KONTROL, "kaide_doseme_kesim.png"), (1500, 1000))
    print("TAMAM R")
