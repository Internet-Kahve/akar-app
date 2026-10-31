"""AKAR · Gece varyantı üretici (31 Ekim 2026).

Girdi GLB'ye dokunmaz. Sahneye gece ışıkları kurar, ışığı Cycles ile köşe rengine (COLOR_0) pişirir ve GLB'yi
KHR_materials_unlit ile yazar: renk = baseColor × COLOR_0. Böylece görünüş uygulamanın ışıklarından bağımsızdır; gündüz
ışıkları altında da gece kalır. Geometri, düğüm adları ve konumlar girdiyle aynıdır (duvarlar yalnız ışık geçişi için bölünür).

Kullanım:
  blender -b --python gece_uret.py -- ayar/<eser>.json [app|sunum|hepsi] [--hizli]
Çıktılar (ayar dosyasındaki `eser` ve `surum`dan):
  3d/export/night/<dosya>_night.glb, _night_sunum.glb
  3d/blend/<dosya>_night.blend, 3d/kontrol/night/*.png, kontrol_rapor.json
"""
import bpy, bmesh, json, math, os, random, re, struct, sys
from mathutils import Vector

ARG = sys.argv[sys.argv.index('--') + 1:]
AYAR = json.load(open(ARG[0], encoding='utf-8'))
HEDEF = ARG[1] if len(ARG) > 1 and not ARG[1].startswith('--') else 'hepsi'
HIZLI = '--hizli' in ARG
KUTUP = os.path.dirname(os.path.abspath(__file__))
ESER = os.path.normpath(os.path.join(KUTUP, '..', '..', AYAR['eser'], '3d'))
SICAK = (1.0, 0.70, 0.42)
ARA = AYAR.get('isik', {})


def glb_oku(yol):
    b = open(yol, 'rb').read()
    n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n])
    return j, b[20 + n:]


def glb_yaz(yol, j, kalan):
    t = json.dumps(j, ensure_ascii=False, separators=(',', ':')).encode('utf-8')
    t += b' ' * ((4 - len(t) % 4) % 4)
    with open(yol, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, 12 + 8 + len(t) + len(kalan)))
        f.write(struct.pack('<II', len(t), 0x4E4F534A)); f.write(t); f.write(kalan)


def lin(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return [x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c]


def sinif(ad):
    for k, d in AYAR['malzeme'].items():
        if re.search(k, ad):
            return d
    return {}


def yapi_nesneleri():
    return [o for o in bpy.context.scene.objects if o.type == 'MESH']


def kutu(ns):
    p = [o.matrix_world @ Vector(c) for o in ns for c in o.bound_box]
    return Vector((min(v.x for v in p), min(v.y for v in p), min(v.z for v in p))), Vector((max(v.x for v in p), max(v.y for v in p), max(v.z for v in p)))


def bol(o, L):
    """Uzun kenarları böler: az köşeli duvarda ışık geçişi köşe rengiyle taşınabilsin. Biçim değişmez."""
    bm = bmesh.new(); bm.from_mesh(o.data)
    for _ in range(4):
        uz = [e for e in bm.edges if e.calc_length() > L]
        if not uz:
            break
        bmesh.ops.subdivide_edges(bm, edges=uz, cuts=1, use_grid_fill=False)
        bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 3])
    bm.to_mesh(o.data); bm.free(); o.data.update()


def isik(ad, tur, konum, guc, renk=SICAK, hedef=None, koni=120, yaricap=0.3):
    l = bpy.data.lights.new(ad, tur); l.energy = guc; l.color = renk
    l.shadow_soft_size = yaricap
    if tur == 'SPOT':
        l.spot_size = math.radians(koni); l.spot_blend = 1.0
    o = bpy.data.objects.new(ad, l); bpy.context.scene.collection.objects.link(o)
    o.location = konum
    if hedef:
        o.rotation_mode = 'QUATERNION'
        o.rotation_quaternion = (Vector(hedef) - Vector(konum)).to_track_quat('-Z', 'Y')
    return o


def isiklari_kur(ana):
    """Yapı dibinden yukarı sıcak ışık, minare şerefeleri, iç mekân, dolgu."""
    sc = bpy.context.scene
    w = bpy.data.worlds.new('_gece'); w.use_nodes = True; sc.world = w
    bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs[0].default_value = (0.20, 0.32, 0.62, 1); bg.inputs[1].default_value = ARA.get('gok', 0.12)
    lo, hi = kutu(ana); adim = ARA.get('adim', 9.0); pay = ARA.get('pay', 3.0); yuk = ARA.get('hedef_yukseklik', 9.0)
    G = ARA.get('duvar_guc', 260)
    mx, my = (lo.x + hi.x) / 2, (lo.y + hi.y) / 2
    def kenar(a, b, n, z=0.3, hedef_z=None, guc=None, ara=None, renk=SICAK):
        # Duvar boyunca ışık şeridi: tek lambaların leke bırakmaması için alan ışığı
        from mathutils import Matrix
        hedef_z = yuk if hedef_z is None else hedef_z
        m, L = (a + b) / 2, (b - a).length
        p = m + n * (pay if ara is None else ara); p.z = z
        h = m.copy(); h.z = hedef_z
        o = isik(f'_u{len(bpy.data.lights)}', 'AREA', p, (guc or G) * L, tuple(renk))
        o.data.shape = 'RECTANGLE'; o.data.size = L; o.data.size_y = 1.5
        ex = (b - a).normalized(); ez = (p - h).normalized(); ey = ez.cross(ex).normalized()
        o.rotation_mode = 'XYZ'; o.rotation_euler = Matrix((ex, ey, ez)).transposed().to_euler()
    for u in ARA.get('serit', []):
        kenar(Vector(u['a']) + KAYMA, Vector(u['b']) + KAYMA, Vector(u['n']), u['z'], u['hedef_z'], u.get('guc'), u.get('pay'), u.get('renk', SICAK))
    n0 = Vector((1, 0, 0)); n1 = Vector((0, 1, 0))
    for x0, y0, x1, y1 in ARA.get('bloklar') or [[lo.x - KAYMA.x, lo.y - KAYMA.y, hi.x - KAYMA.x, hi.y - KAYMA.y]]:
        A, B = Vector((x0, y0, 0)) + KAYMA, Vector((x1, y0, 0)) + KAYMA
        C, D = Vector((x1, y1, 0)) + KAYMA, Vector((x0, y1, 0)) + KAYMA
        kenar(A, B, -n1); kenar(B, C, n0); kenar(C, D, n1); kenar(D, A, -n0)
    o0 = KAYMA
    for m in ARA.get('minare', []):
        ns = [o for o in yapi_nesneleri() if re.fullmatch(m['nesne'], o.name)]
        if not ns:
            continue
        c = Vector(m['merkez'])
        for z, r, g in m['kotlar']:   # [kot, yarıçap, güç]; merkez dünya koordinatı
            for a in range(8):
                t = a * math.pi / 4
                isik(f'_m{len(bpy.data.lights)}', 'POINT', (c.x + o0.x + r * math.cos(t), c.y + o0.y + r * math.sin(t), z), g, tuple(m.get('renk', SICAK)), yaricap=0.25)
    for p in ARA.get('nokta', []):
        isik(f'_n{len(bpy.data.lights)}', 'POINT', Vector(p['konum']) + KAYMA, p['guc'], tuple(p.get('renk', SICAK)), yaricap=p.get('r', 0.5))
    for k in ARA.get('kapi', []):
        isik(f'_k{len(bpy.data.lights)}', 'POINT', Vector(k['konum']) + KAYMA, k['guc'], yaricap=0.4)


def pisir(ns, kaynak):
    """Geçici malzemelerle ışınımı COLOR_0'a pişirir; albedo baseColor'da kalır. Parlayan malzemeler ışık da verir."""
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'
    pr = bpy.context.preferences.addons['cycles'].preferences
    for t in ('OPTIX', 'CUDA', 'NONE'):
        try:
            pr.compute_device_type = t; pr.get_devices()
            if t == 'NONE' or any(d.type == t for d in pr.devices):
                for d in pr.devices:
                    d.use = d.type == t
                sc.cycles.device = 'GPU' if t != 'NONE' else 'CPU'
                print('Cihaz', t); break
        except TypeError:
            pass
    sc.cycles.samples = 16 if HIZLI else ARA.get('ornek', 96); sc.cycles.use_denoising = False
    gecici = {}
    for m in bpy.data.materials:
        d = sinif(m.name); y = bpy.data.materials.new('_b_' + m.name); y.use_nodes = True
        t = y.node_tree; t.nodes.clear(); out = t.nodes.new('ShaderNodeOutputMaterial')
        if d.get('parla') or d.get('dokulu'):
            n = t.nodes.new('ShaderNodeEmission'); n.inputs[0].default_value = (*lin(d.get('parla') or d['dokulu']), 1); n.inputs[1].default_value = d.get('isik', 3.0)
            t.links.new(n.outputs[0], out.inputs[0])
        else:
            n = t.nodes.new('ShaderNodeBsdfDiffuse'); n.inputs[0].default_value = (0.8, 0.8, 0.8, 1)
            t.links.new(n.outputs[0], out.inputs[0])
        gecici[m] = y
    asil = {o: [s.material for s in o.material_slots] for o in ns}
    for o in ns:
        for s in o.material_slots:
            if s.material:
                s.material = gecici[s.material]
    bpy.ops.object.select_all(action='DESELECT')
    for i, o in enumerate(ns):
        ca = o.data.color_attributes
        if AYAR.get('hdr'):
            # Kayan noktalı alan: 1'in üstü kesilmez, güçlü sıcak ışık griye dönmez (Ulucami ve Bedesten bayt alanla onaylandı)
            while len(ca):
                ca.remove(ca[0])
        if not ca:
            ca.new('Color', 'FLOAT_COLOR', 'CORNER')
        ca.active_color = ca[0]; ca.render_color_index = 0
        bpy.context.view_layer.objects.active = o; o.select_set(True)
        bpy.ops.object.bake(type='DIFFUSE', pass_filter={'DIRECT', 'INDIRECT'}, target='VERTEX_COLORS')
        o.select_set(False); print(f'pişti {i + 1}/{len(ns)} {o.name}', flush=True)
    for o, ml in asil.items():
        for s, m in zip(o.material_slots, ml):
            s.material = m
    for m in gecici.values():
        bpy.data.materials.remove(m)


def renk_isle(ns):
    """Işınımı görünür aralığa getirir, gece dolgusunu ekler, parlayan malzemede köşe rengini tam yapar (pencerelerin bir kısmı söner)."""
    rnd = random.Random(1453); poz = ARA.get('poz', 0.55); dolgu = ARA.get('dolgu', [0.045, 0.055, 0.09])
    for o in ns:
        me = o.data; ca = me.color_attributes[0]; dom = ca.domain
        d = [sinif(s.material.name if s.material else '') for s in o.material_slots] or [{}]
        ada = {}
        kokler = {}
        if any(x.get('parla') for x in d):
            bm = bmesh.new(); bm.from_mesh(me); bm.faces.ensure_lookup_table(); gor = set()
            for f in bm.faces:
                if f.index in gor or not d[min(f.material_index, len(d) - 1)].get('parla'):
                    continue
                y = [f]; gor.add(f.index); v = rnd.random()
                while y:
                    q = y.pop(); kokler[q.index] = v
                    for e in q.edges:
                        for r in e.link_faces:
                            if r.index not in gor and r.material_index == q.material_index:
                                gor.add(r.index); y.append(r)
            bm.free()
        def ton(r):
            # Parlaklık sıkıştırılır, renk tonu korunur: kuvvetli sıcak ışık griye kaçmaz
            L = max(r[0], r[1], r[2], 1e-6) * poz
            t = (1 - math.exp(-L * 1.7)) / L * poz
            return [min(1.0, r[k] * t + dolgu[k]) for k in range(3)]
        dat = ca.data
        for p in me.polygons:
            m = d[min(p.material_index, len(d) - 1)]
            for li, vi in zip(p.loop_indices, p.vertices):
                c = dat[li if dom == 'CORNER' else vi]
                if m.get('dokulu'):
                    c.color = (1, 1, 1, 1)
                elif m.get('parla'):
                    a = 1.0 if kokler.get(p.index, 0) <= m.get('oran', 1.0) else m.get('sonuk', 0.12)
                    c.color = (a, a, a, 1)
                else:
                    c.color = (*ton(c.color), 1)


def yumusat(ns):
    """Köşe başına örneklemenin gürültüsünü alır: komşu köşelerle ortalama. Kenar bağlantısı üzerinden gider, keskin köşede duvar ile çatı karışmaz."""
    for o in ns:
        me = o.data; ca = me.color_attributes[0]
        n = len(me.vertices)
        if ca.domain == 'CORNER':
            t = [[0.0, 0.0, 0.0, 0] for _ in range(n)]
            for l in me.loops:
                c = ca.data[l.index].color; q = t[l.vertex_index]
                q[0] += c[0]; q[1] += c[1]; q[2] += c[2]; q[3] += 1
            d = [[q[0] / max(q[3], 1), q[1] / max(q[3], 1), q[2] / max(q[3], 1)] for q in t]
        else:
            d = [list(c.color[:3]) for c in ca.data]
        yan = [[] for _ in range(n)]
        for e in me.edges:
            a, b = e.vertices; yan[a].append(b); yan[b].append(a)
        for _ in range(ARA.get('yumusatma', 3)):
            y = []
            for i, v in enumerate(d):
                if yan[i]:
                    k = len(yan[i])
                    y.append([0.4 * v[c] + 0.6 * sum(d[j][c] for j in yan[i]) / k for c in range(3)])
                else:
                    y.append(v)
            d = y
        if ca.domain == 'CORNER':
            for l in me.loops:
                ca.data[l.index].color = (*d[l.vertex_index], 1)
        else:
            for i, c in enumerate(ca.data):
                c.color = (*d[i], 1)


def son_islem(gecici, cikti, kaynak_j):
    """Unlit, gece renkleri; alfa ve çift yüz girdiden."""
    j, kalan = glb_oku(gecici)
    kay = {m['name']: m for m in kaynak_j.get('materials', [])}
    for m in j.get('materials', []):
        s = kay.get(m['name'], {}); d = sinif(m['name']); pbr = m.setdefault('pbrMetallicRoughness', {})
        sp = s.get('pbrMetallicRoughness', {})
        c = sp.get('baseColorFactor', [1, 1, 1, 1]); k = d.get('carpan', 1.0)
        pbr['baseColorFactor'] = [c[0] * k, c[1] * k, c[2] * k, c[3]]
        if d.get('renk'):
            r = lin(d['renk']); pbr['baseColorFactor'] = [*r, c[3]]
        if d.get('dokulu'):
            r = lin(d['dokulu']); pbr['baseColorFactor'] = [*r, c[3]]
        if d.get('parla'):
            r = lin(d['parla']); pbr['baseColorFactor'] = [*r, c[3]]; pbr.pop('baseColorTexture', None)
        pbr['metallicFactor'] = 0; pbr['roughnessFactor'] = 1; pbr.pop('metallicRoughnessTexture', None)
        for a in ('normalTexture', 'occlusionTexture', 'emissiveTexture', 'emissiveFactor'):
            m.pop(a, None)
        for a in ('alphaMode', 'alphaCutoff', 'doubleSided'):
            m.pop(a, None)
            if a in s:
                m[a] = s[a]
        m.setdefault('extensions', {})['KHR_materials_unlit'] = {}
    u = j.setdefault('extensionsUsed', [])
    if 'KHR_materials_unlit' not in u:
        u.append('KHR_materials_unlit')
    glb_yaz(cikti, j, kalan)


def onizleme_malzemeleri(j):
    """Blend'de ve kontrol render'ında GLB'nin gördüğü sonuç: taban × köşe rengi, ışıksız."""
    kay = {m['name']: m for m in j.get('materials', [])}
    for m in list(bpy.data.materials):
        s = kay.get(m.name)
        if not s or not m.use_nodes:
            continue
        p = s['pbrMetallicRoughness']; c = p.get('baseColorFactor', [1, 1, 1, 1])
        t = m.node_tree
        im = next((n for n in t.nodes if n.type == 'TEX_IMAGE'), None) if 'baseColorTexture' in p else None
        b = next((n for n in t.nodes if n.type == 'BSDF_PRINCIPLED'), None)
        ora = None
        if b and 'alphaMode' in s and b.inputs['Alpha'].is_linked:
            ora = b.inputs['Alpha'].links[0].from_socket
        out = next(n for n in t.nodes if n.type == 'OUTPUT_MATERIAL')
        ca = t.nodes.new('ShaderNodeVertexColor'); ca.layer_name = 'Color'
        mx = t.nodes.new('ShaderNodeMixRGB'); mx.blend_type = 'MULTIPLY'; mx.inputs[0].default_value = 1
        mx.inputs[1].default_value = (*c[:3], 1)
        kaynak = ca.outputs[0]
        if im:
            m2 = t.nodes.new('ShaderNodeMixRGB'); m2.blend_type = 'MULTIPLY'; m2.inputs[0].default_value = 1
            t.links.new(im.outputs[0], m2.inputs[1]); t.links.new(ca.outputs[0], m2.inputs[2]); kaynak = m2.outputs[0]
        t.links.new(kaynak, mx.inputs[2])
        e = t.nodes.new('ShaderNodeEmission'); t.links.new(mx.outputs[0], e.inputs[0])
        if ora is not None:
            sd = t.nodes.new('ShaderNodeMixShader'); tr = t.nodes.new('ShaderNodeBsdfTransparent')
            t.links.new(ora, sd.inputs[0]); t.links.new(tr.outputs[0], sd.inputs[1]); t.links.new(e.outputs[0], sd.inputs[2])
            t.links.new(sd.outputs[0], out.inputs[0])
        else:
            t.links.new(e.outputs[0], out.inputs[0])


def render_set(ns, ad):
    sc = bpy.context.scene; K = os.path.join(ESER, 'kontrol', 'night'); os.makedirs(K, exist_ok=True)
    for o in list(bpy.data.objects):
        if o.type == 'LIGHT':
            bpy.data.objects.remove(o)
    w = sc.world; bg = next(n for n in w.node_tree.nodes if n.type == 'BACKGROUND')
    bg.inputs[0].default_value = (*lin('#16233F'), 1); bg.inputs[1].default_value = 1
    sc.render.engine = 'BLENDER_EEVEE' if 'BLENDER_EEVEE' in [i.identifier for i in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'CYCLES'
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    sc.render.resolution_x, sc.render.resolution_y = 1500, 1200; sc.render.image_settings.file_format = 'PNG'
    lo, hi = kutu(ns); c = (lo + hi) / 2; R = (hi - lo).length
    cam = bpy.data.objects.new('_k', bpy.data.cameras.new('_k')); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.ortho_scale = R * 1.08; cam.data.clip_end = R * 8
    for ad2, yon, yk in (('havadan', 45, 32), ('havadan_guney', 200, 32), ('ust', 120, 58)):
        a, e = math.radians(yon), math.radians(yk)
        p = c + Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e))) * R * 2
        cam.location = p; cam.rotation_mode = 'QUATERNION'; cam.rotation_quaternion = (c - p).to_track_quat('-Z', 'Y')
        sc.render.filepath = os.path.join(K, f'{ad}_{ad2}.png'); bpy.ops.render.render(write_still=True)
    for y in AYAR.get('yakin', []):
        cam.data.ortho_scale = y['olcek']; a, e = math.radians(y['yon']), math.radians(y['yuk'])
        c2 = Vector(y['merkez']) + KAYMA
        p = c2 + Vector((math.sin(a) * math.cos(e), -math.cos(a) * math.cos(e), math.sin(e))) * R * 2
        cam.location = p; cam.rotation_quaternion = (c2 - p).to_track_quat('-Z', 'Y')
        sc.render.filepath = os.path.join(K, f"{ad}_yakin_{y['ad']}.png"); bpy.ops.render.render(write_still=True)
    bpy.data.objects.remove(cam)


def doku_tonla():
    """Gece dokusunu ışığın rengine çeker (taban rengi yalnız koyulaştırabildiği için). Desen kalır."""
    for m in bpy.data.materials:
        d = sinif(m.name)
        if not d.get('doku_renk') or not m.use_nodes:
            continue
        hd = lin(d['doku_renk']); k = d.get('doku_karisim', 0.6)
        for n in m.node_tree.nodes:
            if n.type == 'TEX_IMAGE' and n.image:
                px = list(n.image.pixels)
                for i in range(0, len(px), 4):
                    for c in range(3):
                        px[i + c] = px[i + c] * (1 - k) + hd[c] * k
                n.image.pixels = px; n.image.update(); n.image.pack()


def kayma_bul(kj):
    """Sunum GLB'si yapıyı kaydırır; ayardaki konumlar uygulama GLB'sinin dünyasındadır."""
    a, _ = glb_oku(os.path.join(ESER, 'export', AYAR['dosya'] + '.glb'))
    ta = {n.get('name'): n.get('translation', [0, 0, 0]) for n in a['nodes'] if 'mesh' in n}
    tb = {n.get('name'): n.get('translation', [0, 0, 0]) for n in kj['nodes'] if 'mesh' in n}
    ad = AYAR.get('ana_parca') if AYAR.get('ana_parca') in ta else next(iter(ta))
    d = [y - x for x, y in zip(ta[ad], tb[ad])]
    return Vector((d[0], -d[2], d[1]))


def calistir(tur):
    global KAYMA
    tab = AYAR['dosya']; ek = '' if tur == 'app' else '_sunum'
    girdi = os.path.join(ESER, 'export', tab + ek + '.glb'); ad = f'{tab}_night{ek}'
    os.makedirs(os.path.join(ESER, 'export', 'night'), exist_ok=True); os.makedirs(os.path.join(ESER, 'blend'), exist_ok=True)
    cikti = os.path.join(ESER, 'export', 'night', ad + '.glb'); gec = cikti + '.tmp.glb'
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=girdi)
    kj, _ = glb_oku(girdi)
    KAYMA = kayma_bul(kj)
    ns = yapi_nesneleri(); once = sum(len(o.data.polygons) for o in ns)
    for o in ns:
        if re.fullmatch(AYAR.get('bolunecek', '$^'), o.name):
            bol(o, ARA.get('kenar', 3.0))
        if re.fullmatch(AYAR.get('ince_bolunecek', '$^'), o.name):
            bol(o, ARA.get('ince_kenar', 2.0))
    ana = [o for o in ns if not re.match(AYAR.get('ana_disi', r'Cevre_|Olcek_|Zemin'), o.name) and not re.match(r'Minare|.*Sadirvan|.*Cesme', o.name)]
    isiklari_kur(ana)
    pisir(ns, kj); yumusat(ns); renk_isle(ns); doku_tonla()
    for o in list(bpy.data.objects):
        if o.type == 'LIGHT':
            bpy.data.objects.remove(o)
    bpy.ops.export_scene.gltf(filepath=gec, export_format='GLB', export_vertex_color='ACTIVE', export_all_vertex_colors=False,
                              export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=6, export_draco_position_quantization=14, export_draco_normal_quantization=8,
                              export_draco_texcoord_quantization=10, export_draco_color_quantization=6, export_normals=False, export_cameras=False, export_lights=False)
    son_islem(gec, cikti, kj); os.remove(gec)
    j, _ = glb_oku(cikti)
    kd = {n.get('name'): n.get('translation') for n in kj['nodes']}; yd = {n.get('name'): n.get('translation') for n in j['nodes']}
    kayip = sorted(set(kd) - set(yd)); oynayan = [k for k in kd if k in yd and kd[k] and yd[k] and max(abs(a - b) for a, b in zip(kd[k], yd[k])) > 0.001]
    onizleme_malzemeleri(j)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ESER, 'blend', ad + '.blend'), compress=True)
    render_set(ns, ad)
    sonra = sum(len(o.data.polygons) for o in ns)
    r = dict(girdi=os.path.basename(girdi), cikti=os.path.basename(cikti), bayt=os.path.getsize(cikti), ucgen_once=once, ucgen_sonra=sonra, kayip_dugum=kayip, oynayan_dugum=oynayan,
             malzeme=len(j.get('materials', [])), unlit=sum('KHR_materials_unlit' in m.get('extensions', {}) for m in j.get('materials', [])))
    print('RAPOR', json.dumps(r, ensure_ascii=False))
    k = os.path.join(ESER, 'kontrol', 'night', 'kontrol_rapor.json'); os.makedirs(os.path.dirname(k), exist_ok=True)
    e = json.load(open(k, encoding='utf-8')) if os.path.exists(k) else {}; e[ad] = r
    json.dump(e, open(k, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)


for t in (('app', 'sunum') if HEDEF == 'hepsi' else (HEDEF,)):
    calistir(t)
