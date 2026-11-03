"""AKAR · blend_hat pişirilmiş harita sürümü (3 Kasım 2026): ışık ve gölge dokuya, malzeme ışıksız (KHR_materials_unlit).

Her eserin build/pisir_harita.py dosyası ayarlarını (ışık değerleri, yerel güneş açısı, dosyalar) verip calistir() çağırır.
Blender -b --python <eser>/3d/build/pisir_harita.py -- [gunduz|gece|hepsi] [--hizli]

Yöntem
  1) Kaynak blend açılır; harita GLB'sinde olmayan parçalar silinir (Zemin*, Cevre*, Olcek*, model.json sunum_ek ve
     ic_parcalar, ışıklar, boşlar). Kalanların adı, dönüşümü, orijini ve köşeleri değişmez.
  2) Albedo, haritada kullanılan GLB'nin kendi malzemelerinden kurulur (renk çarpanı, doku, metal, alfa): gündüzde harita
     GLB'si, gecede gece GLB'si. Böylece pişmiş renk, uygulamanın bugün gösterdiği renkle aynı kaynaktan gelir.
  3) Yeni UV «Pisik» (Smart UV Project, 4 px kenar), tek atlas. Eski UV'ler pişirmede okunur, sonra dosyadan çıkar.
  4) Cycles: gündüz DIFFUSE (Direct + Indirect + Color); gece gece_uret.py ışıkları + ay + gök, aynı ton işlemi
     (renk = gece taban rengi × ton(ışınım)); parlayanlar (pencere, kandil, kafes, mahya) gece GLB'sindeki renginde.
     Gürültü giderme: kompozitör Denoise (OIDN), albedo kılavuzlu.
  5) Harita_Golge: tabanın 2 cm üstünde yatay düzlem; yalnız güneşin (ayın) yere düşen gölgesi, siyah, alfa kanalında.
  6) Tek ışıksız malzeme Harita_Pisik (+ Harita_Golge), yeni blend, glTF (Y-up, normal ve köşe rengi yok, WebP q80),
     pisik_unlit.mjs (unlit + alfa kipi), blend_son.mjs (Draco), pisik_dogrula.mjs (rapor), pisik_gorsel.mjs (görüntü).
"""
import bpy, bmesh, json, math, os, re, struct, subprocess, sys, tempfile
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree

AY = os.path.dirname(os.path.abspath(__file__)); KUT = os.path.dirname(AY); ESERLER = os.path.dirname(KUT)
REPO = os.path.normpath(os.path.join(ESERLER, '..', '..', '..'))
BL_UYARI = []


# ---------------------------------------------------------------- yardımcılar
def lin1(v): return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
def hexlin(h): h = h.lstrip('#'); return [lin1(int(h[i:i + 2], 16) / 255) for i in (0, 2, 4)]
def lum(c): return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def srgb(a): a = np.clip(a, 0, 1); return np.where(a <= 0.0031308, a * 12.92, 1.055 * np.power(a, 1 / 2.4) - 0.055)


def glb_oku(yol):
    b = open(yol, 'rb').read(); n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20 + n]); kal = b[20 + n:]
    binv = kal[8:8 + struct.unpack('<I', kal[0:4])[0]] if kal else b''
    return j, binv


def glb_resimleri(j, binv, klasor):
    """GLB içindeki resimleri dosyaya yazar; dizin → yol."""
    yol = {}
    for i, im in enumerate(j.get('images', [])):
        bv = j['bufferViews'][im['bufferView']]; o = bv.get('byteOffset', 0)
        uz = {'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp'}[im['mimeType']]
        p = os.path.join(klasor, f'r{i}{uz}'); open(p, 'wb').write(binv[o:o + bv['byteLength']]); yol[i] = p
    return yol


def glb_kutular(j):
    """Düğüm adı → dünya kutusu (glTF). Draco'da da accessor min/max yazılıdır. Düğümler düz (ebeveynsiz), dönüşsüz varsayılır."""
    k = {}
    for n in j['nodes']:
        if 'mesh' not in n: continue
        t = n.get('translation', [0, 0, 0]); mn = [1e9] * 3; mx = [-1e9] * 3
        for p in j['meshes'][n['mesh']]['primitives']:
            a = j['accessors'][p['attributes']['POSITION']]
            mn = [min(mn[i], a['min'][i] + t[i]) for i in range(3)]; mx = [max(mx[i], a['max'][i] + t[i]) for i in range(3)]
        k[n['name']] = {'mn': mn, 'mx': mx}
    return k


def bb(objs):
    p = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
    return Vector([min(q[i] for q in p) for i in range(3)]), Vector([max(q[i] for q in p) for i in range(3)])


def kos(*a):
    r = subprocess.run(a, capture_output=True, text=True); print(r.stdout[-3000:], r.stderr[-3000:] if r.returncode else '', flush=True)
    r.check_returncode(); return r.stdout


def cihaz(sc):
    pr = bpy.context.preferences.addons['cycles'].preferences
    for t in ('METAL', 'OPTIX', 'CUDA'):
        try:
            pr.compute_device_type = t; pr.get_devices()
            if any(d.type == t for d in pr.devices):
                for d in pr.devices: d.use = d.type == t
                sc.cycles.device = 'GPU'; return t
        except TypeError:
            pass
    sc.cycles.device = 'CPU'; return 'CPU'


def resim_oku(img):
    p = np.empty(img.size[0] * img.size[1] * 4, np.float32); img.pixels.foreach_get(p)
    return p.reshape(img.size[1], img.size[0], 4)


def gurultu_gider(img, albedo=None):
    """Kompozitör Denoise (OIDN, HDR, Accurate). Pişmiş görüntünün kendisine uygulanır; albedo verilirse kılavuz olur."""
    s = bpy.data.scenes.new('_dn'); s.render.engine = 'BLENDER_WORKBENCH'
    s.render.resolution_x, s.render.resolution_y = img.size; s.render.resolution_percentage = 100
    cam = bpy.data.objects.new('_dnk', bpy.data.cameras.new('_dnk')); s.collection.objects.link(cam); s.camera = cam
    nt = bpy.data.node_groups.new('_dn', 'CompositorNodeTree'); s.compositing_node_group = nt
    nt.interface.new_socket('Image', in_out='OUTPUT', socket_type='NodeSocketColor')
    i = nt.nodes.new('CompositorNodeImage'); i.image = img
    d = nt.nodes.new('CompositorNodeDenoise'); o = nt.nodes.new('NodeGroupOutput'); d.inputs['HDR'].default_value = True
    nt.links.new(i.outputs['Image'], d.inputs['Image']); nt.links.new(d.outputs[0], o.inputs[0])
    if albedo is not None:
        ia = nt.nodes.new('CompositorNodeImage'); ia.image = albedo; nt.links.new(ia.outputs['Image'], d.inputs['Albedo'])
    s.render.image_settings.file_format = 'OPEN_EXR'; s.render.image_settings.color_depth = '32'; s.view_settings.view_transform = 'Standard'
    f = os.path.join(tempfile.mkdtemp(prefix='pisik_dn_'), 'dn.exr'); s.render.filepath = f
    bpy.ops.render.render(write_still=True, scene=s.name)
    r = bpy.data.images.load(f); a = resim_oku(r)
    bpy.data.images.remove(r); bpy.data.objects.remove(cam); bpy.data.scenes.remove(s); bpy.data.node_groups.remove(nt)
    return a


def resim_yaz(ad, a, alfa):
    """Doğrusal float dizi → sRGB bayt resim, blend'e gömülü (PNG). Dışa aktarım WebP'ye çevirir."""
    h, w = a.shape[:2]; im = bpy.data.images.new(ad, w, h, alpha=alfa, float_buffer=False)
    b = np.empty((h, w, 4), np.float32); b[..., :3] = srgb(a[..., :3]); b[..., 3] = a[..., 3] if alfa else 1.0
    im.pixels.foreach_set(b.ravel()); im.update(); im.pack(); return im


# ---------------------------------------------------------------- sahne
class Hat:
    def __init__(s, C, kip):
        s.C = C; s.kip = kip; s.gece = kip == 'gece'
        s.U = C['URETIM']; s.hizli = C['HIZLI']
        s.atlas = C['ATLAS_PX']; s.ornek = 16 if s.hizli else C['ORNEK']   # atlas küçülmez: 4 px kenar ada sayısıyla birlikte sığmayabilir
        s.rapor = {'kip': kip, 'uyari': [], 'not': []}
        s.MJ = json.load(open(os.path.join(s.U, 'model.json'), encoding='utf-8'))
        s.ref_ad = C['GLB_GECE'] if s.gece else C['GLB']
        s.ref_yol = os.path.join(s.U, 'export', s.ref_ad + '.glb')
        s.ref_j, s.ref_bin = glb_oku(s.ref_yol)
        s.T = tempfile.mkdtemp(prefix=f'pisik_{kip}_')

    # 1) blend ve harita parçaları
    def ac(s):
        bpy.ops.wm.open_mainfile(filepath=os.path.join(s.U, s.C['BLEND']))
        s.sc = bpy.context.scene; s.sc.render.engine = 'CYCLES'; s.rapor['cihaz'] = cihaz(s.sc)
        EK = ('Zemin', 'Cevre', 'Olcek', 'Yer_Golgesi', *s.MJ.get('sunum_ek', [])); IC = set(s.MJ.get('ic_parcalar', []))
        sil = [o for o in bpy.data.objects if o.type != 'MESH' or o.name.startswith(EK) or o.name in IC or o.name.startswith(('REF', '_'))]
        s.rapor['silinen'] = sorted(o.name for o in sil)
        for o in sil: bpy.data.objects.remove(o)
        bpy.data.orphans_purge(do_recursive=True)
        s.objs = sorted([o for o in bpy.data.objects if o.type == 'MESH'], key=lambda o: o.name)
        ref = [n['name'] for n in s.ref_j['nodes'] if 'mesh' in n]
        fark = sorted((set(ref) ^ {o.name for o in s.objs}) - {'Mahya'})
        if fark: s.rapor['uyari'].append(f'blend parçaları ile {s.ref_ad} düğümleri farklı: {fark}')
        for o in s.objs:
            if o.data.users > 1: o.data = o.data.copy()
            if len(o.data.uv_layers) and o.data.uv_layers[0].name != 'UVMap': o.data.uv_layers[0].name = 'UVMap'
        # dışa aktarım kaydırması: ref GLB'deki ana parça kutusu (blend_cikti.kaydirma ile aynı hesap)
        rk = glb_kutular(s.ref_j); ana = s.C['ANA_PARCA'] if s.C['ANA_PARCA'] in rk else max(rk, key=lambda n: len(bpy.data.objects[n].data.vertices) if n in bpy.data.objects else -1)
        mn, _ = bb([bpy.data.objects[ana]]); g = rk[ana]
        s.KAY = Vector((g['mn'][0] - mn[0], -g['mx'][2] - mn[1], g['mn'][1] - mn[2]))
        s.rapor['kaydirma'] = [round(x, 5) for x in s.KAY]

    # 2) albedo malzemeleri (GLB'den)
    def glb_malzemeleri(s):
        res = glb_resimleri(s.ref_j, s.ref_bin, s.T); s.img = {}
        tex = s.ref_j.get('textures', []); smp = s.ref_j.get('samplers', [])
        s.gm = {m['name']: m for m in s.ref_j['materials']}
        # COLOR_0'sız primitive'lerin malzemesi (gece: mahya): görünüş = taban rengi, ışıktan bağımsız
        s.renksiz = set()
        for me in s.ref_j['meshes']:
            for p in me['primitives']:
                if 'COLOR_0' not in p['attributes'] and 'material' in p: s.renksiz.add(s.ref_j['materials'][p['material']]['name'])

        def resim(ti):
            t = tex[ti['index']]; src = t.get('source', t.get('extensions', {}).get('EXT_texture_webp', {}).get('source'))
            if src not in s.img:
                s.img[src] = bpy.data.images.load(res[src]); s.img[src].colorspace_settings.name = 'sRGB'
            yak = smp[t['sampler']].get('magFilter') == 9728 if 'sampler' in t else False
            return s.img[src], yak
        s.resim = resim

    def albedo_malzeme(s, ad):
        gm = s.gm.get(ad)
        m = bpy.data.materials.new('PK_' + ad); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links
        b = next(n for n in N if n.type == 'BSDF_PRINCIPLED'); s.pk_kok[m.name] = ad
        if gm is None:
            s.rapor['uyari'].append(f'{ad}: {s.ref_ad} içinde yok, gri 0,8'); b.inputs['Base Color'].default_value = (0.8, 0.8, 0.8, 1); return m
        p = gm.get('pbrMetallicRoughness', {}); f = p.get('baseColorFactor', [1, 1, 1, 1])
        unlit = 'KHR_materials_unlit' in gm.get('extensions', {})
        b.inputs['Metallic'].default_value = 0.0 if unlit else p.get('metallicFactor', 1.0)
        b.inputs['Roughness'].default_value = p.get('roughnessFactor', 1.0)
        renk = b.inputs['Base Color']; alfa = None
        if 'baseColorTexture' in p:
            im, yak = s.resim(p['baseColorTexture'])
            uv = N.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap' if p['baseColorTexture'].get('texCoord', 0) == 0 else 'UV_AO'
            t = N.new('ShaderNodeTexImage'); t.image = im; t.interpolation = 'Closest' if yak else 'Linear'; L.new(uv.outputs[0], t.inputs[0])
            mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs[0].default_value = 1
            L.new(t.outputs['Color'], mx.inputs[6]); mx.inputs[7].default_value = (*f[:3], 1); L.new(mx.outputs[2], renk)
            alfa = t.outputs['Alpha']
        else:
            renk.default_value = (*f[:3], 1)
        mod = gm.get('alphaMode', 'OPAQUE')
        if ad.startswith('Sadirvan_Cam'):
            mod = 'OPAQUE'
            if not s.gece:
                renk.default_value = (*hexlin('#B9C9BF'), 1)
        if mod in ('MASK', 'BLEND'):
            a = alfa
            if f[3] < 1:
                k = N.new('ShaderNodeMath'); k.operation = 'MULTIPLY'; k.inputs[1].default_value = f[3]
                if a is not None: L.new(a, k.inputs[0])
                else: k.inputs[0].default_value = 1.0
                a = k.outputs[0]
            if a is not None and mod == 'MASK':
                k = N.new('ShaderNodeMath'); k.operation = 'GREATER_THAN'; k.inputs[1].default_value = gm.get('alphaCutoff', 0.5); L.new(a, k.inputs[0]); a = k.outputs[0]
            if a is not None: L.new(a, b.inputs['Alpha'])
        s.pk_alfa[m.name] = alfa if (mod == 'BLEND' and alfa is not None) else None   # atlas alfası: yalnız dokulu BLEND (mahya yazısı)
        return m

    # gece: mahya, gece GLB'sinden
    def mahya_al(s):
        once = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=s.ref_yol)
        s.gece_obj = {}
        for o in set(bpy.data.objects) - once:
            if o.type != 'MESH': bpy.data.objects.remove(o); continue
            s.gece_obj[re.sub(r'\.\d{3}$', '', o.name)] = o
        if 'Mahya' in s.gece_obj:
            o = s.gece_obj.pop('Mahya'); o.name = 'Mahya'; o.data.name = 'Mahya'
            o.location -= s.KAY
            if len(o.data.uv_layers): o.data.uv_layers[0].name = 'UVMap'
            bpy.context.view_layer.update(); s.objs.append(o); s.objs.sort(key=lambda o: o.name)
            for sl in o.material_slots:
                if sl.material: sl.material.name = re.sub(r'\.\d{3}$', '', sl.material.name)
            s.rapor['not'].append('Mahya düğümü gece GLB\'sinden alındı (dönüşümsüz; köşeler aynı).')

    def pencereler(s):
        """Parlayan malzemede yüz başına yanık/sönük: gece GLB'sindeki aynı yerin COLOR_0'ı (en yakın yüz)."""
        AYAR = s.C['GECE_AYAR_J']
        def sinif(ad):
            for k, d in AYAR['malzeme'].items():
                if re.search(k, ad): return d
            return {}
        s.sinif = sinif; say = [0, 0]
        dg = bpy.context.evaluated_depsgraph_get()
        for o in s.objs:
            me = o.data; n = len(me.loops); v = np.zeros((n, 4), np.float32); v[:, 3] = 1
            g = s.gece_obj.get(o.name); bvh = None
            if g is not None and g.data.color_attributes:
                bvh = BVHTree.FromObject(g, dg); ca = g.data.color_attributes[0]; gm = g.data
                cr = np.empty(len(ca.data) * 4, np.float32); ca.data.foreach_get('color', cr); cr = cr.reshape(-1, 4)
                gw = g.matrix_world.inverted()
            for p in me.polygons:
                ad = o.material_slots[p.material_index].material.name if o.material_slots and o.material_slots[p.material_index].material else ''
                d = sinif(ad); em = bool(d.get('parla') or d.get('dokulu')) or ad in s.renksiz
                a = 1.0
                if d.get('parla') and bvh is not None:
                    q = gw @ (o.matrix_world @ p.center + s.KAY); _, _, fi, _ = bvh.find_nearest(q)
                    if fi is not None:
                        gp = gm.polygons[fi]
                        a = float(np.mean([cr[li if ca.domain == 'CORNER' else gm.loops[li].vertex_index][0] for li in gp.loop_indices]))
                        say[a > 0.5] += 1
                for li in p.loop_indices: v[li] = (1.0 if em else 0.0, a, 0, 1)
            at = me.color_attributes.new('PK_Maske', 'FLOAT_COLOR', 'CORNER'); at.data.foreach_set('color', v.ravel()); me.update()
        s.rapor['pencere'] = {'yanik_yuz': say[1], 'sonuk_yuz': say[0]}
        for g in s.gece_obj.values():
            me = g.data; bpy.data.objects.remove(g); bpy.data.meshes.remove(me)
        bpy.data.orphans_purge(do_recursive=True)

    # 3a) görünürlük (4 Kasım 2026): yansıtmanın bakış yönlerinden (pisik_yansit.mjs bakislar) ışın atılır; hiçbir yönden dışarı
    # çıkamayan yüz (iç mekân, cephe arkası, kafes arkasındaki cam: pişmiş dosyada kafes ve cam opaktır) atlasta çok küçük alır.
    def gorunurluk(s):
        V, P = [], []
        for o in s.objs:
            M = o.matrix_world; b = len(V); V += [M @ v.co for v in o.data.vertices]; P += [[b + i for i in p.vertices] for p in o.data.polygons]
        bvh = BVHTree.FromPolygons(V, P)
        yon = [(i * 30 + 6, 30) for i in range(12)] + [(i * 45 + 28, 12) for i in range(8)] + [(i * 45 + 6, 55) for i in range(8)] + [(0, 88)]
        D = [Vector((math.sin(math.radians(a)) * math.cos(math.radians(e)), math.cos(math.radians(a)) * math.cos(math.radians(e)), math.sin(math.radians(e)))) for a, e in yon]
        s.gor = {}; say = [0, 0]; alan = [0.0, 0.0]
        for o in s.objs:
            M = o.matrix_world; Nm = M.to_3x3().inverted().transposed(); g = np.zeros(len(o.data.polygons), np.int32)
            for p in o.data.polygons:
                n = (Nm @ p.normal).normalized(); c = M @ p.center
                pts = [c] + [c.lerp(M @ o.data.vertices[v].co, 0.7) for v in list(p.vertices)[:4]]
                ok = False
                for d in D:
                    if n.dot(d) < 0.2: continue
                    for q in pts:
                        if bvh.ray_cast(q + n * 0.01, d, 1000.0)[0] is None: ok = True; break
                    if ok: break
                g[p.index] = ok; say[ok] += 1; alan[ok] += p.area * (M.to_scale()[0] * M.to_scale()[1])
            s.gor[o.name] = g
        s.rapor['gorunurluk'] = {'gorunur_yuz': say[1], 'gorunmez_yuz': say[0], 'gorunur_m2': round(alan[1]), 'gorunmez_m2': round(alan[0]), 'yon': len(D)}
        print('GÖRÜNÜRLÜK', s.rapor['gorunurluk'], flush=True)

    # 3) Pisik UV
    def uv(s):
        """Tek atlas: parçaların kopyaları tek nesnede birleşir, orada açılır (Smart UV Project + paketleme), UV'ler köşe kimliğiyle
        özgün parçalara yazılır. Özgün parçalar düzenleme kipine girmez: Blender 5.2'de çok nesneli düzenlemeden sonra Cycles
        pişirmesi boş çıkıyor (3 Kasım 2026 denemesi); ayrıca çok nesneli Smart UV adaları 0–1'e sığdırmıyor."""
        pay = s.C['KENAR_PX'] / s.atlas; kop = []
        for i, o in enumerate(s.objs):
            u = o.data.uv_layers.new(name='Pisik'); o.data.uv_layers.active = u; u.active_render = True
            me = o.data.copy(); n = len(me.loops)
            me.attributes.new('pk_parca', 'INT', 'CORNER').data.foreach_set('value', np.full(n, i, np.int32))
            me.attributes.new('pk_dongu', 'INT', 'CORNER').data.foreach_set('value', np.arange(n, dtype=np.int32))
            yaz = np.zeros(len(me.polygons), np.int32)
            if s.gece and o.name == 'Mahya':   # mahya yazısı atlasta okunur kalsın: adaları büyütülür
                yaz = np.array([1 if (o.material_slots[p.material_index].material and o.material_slots[p.material_index].material.name.startswith('Mahya_Yazi')) else 0 for p in me.polygons], np.int32)
            me.attributes.new('pk_yazi', 'INT', 'FACE').data.foreach_set('value', yaz)
            me.attributes.new('pk_gor', 'INT', 'FACE').data.foreach_set('value', s.gor[o.name])
            kf = np.array([1 if s.asil.get((o.name, p.material_index), '').startswith('Kafes_Beyaz') else 0 for p in me.polygons], np.int32)
            me.attributes.new('pk_kafes', 'INT', 'FACE').data.foreach_set('value', kf)
            c = bpy.data.objects.new(f'_uv{i}', me); s.sc.collection.objects.link(c); c.matrix_world = o.matrix_world; kop.append(c)
        bpy.ops.object.select_all(action='DESELECT')
        for c in kop: c.select_set(True)
        bpy.context.view_layer.objects.active = kop[0]; bpy.ops.object.join(); j = kop[0]; me = j.data
        me.uv_layers.active = me.uv_layers['Pisik']
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
        bpy.ops.uv.smart_project(angle_limit=math.radians(66), margin_method='FRACTION', island_margin=pay, area_weight=0.0)
        bpy.ops.object.mode_set(mode='OBJECT')
        uvd = me.uv_layers['Pisik'].data; a0 = np.empty(len(uvd) * 2, np.float32); uvd.foreach_get('uv', a0); a0 = a0.reshape(-1, 2)
        yaz = np.empty(len(me.polygons), np.int32); me.attributes['pk_yazi'].data.foreach_get('value', yaz)
        gor = np.empty(len(me.polygons), np.int32); me.attributes['pk_gor'].data.foreach_get('value', gor)
        kaf = np.empty(len(me.polygons), np.int32); me.attributes['pk_kafes'].data.foreach_get('value', kaf)
        parts = np.empty(len(me.loops), np.int32)
        me.attributes['pk_parca'].data.foreach_get('value', parts)
        ls = np.empty(len(me.polygons), np.int32); me.polygons.foreach_get('loop_start', ls); lt = np.empty(len(me.polygons), np.int32); me.polygons.foreach_get('loop_total', lt)
        A3 = np.empty(len(me.polygons), np.float32); me.polygons.foreach_get('area', A3)
        olcek = np.empty(len(me.polygons), np.float32)
        for p in me.polygons:
            obj = s.objs[parts[p.loop_start]]
            sc_ = 0.55
            if obj.name.startswith(('Kubbeler', 'Cati', 'Govde', 'Minare')): sc_ = 1.75
            if obj.name.startswith('Sadirvan_'): sc_ = 2.5
            if p.normal.z < -0.15: sc_ = 0.20
            if yaz[p.index]: sc_ *= s.C.get('MAHYA_UV_OLCEK', 6.0)
            if not gor[p.index] and not yaz[p.index]: sc_ = s.C.get('GIZLI_UV_OLCEK', 0.03)
            olcek[p.index] = sc_
        # 4 Kasım 2026: YOGUNLUK verilirse ölçek ada başına: her ada önce kendi 3B alanına göre eşitlenir (Smart UV adaları
        # farklı ölçekte çıkıyor: aynı sınıfta cephe 10, taç kapı 25 cm/px ölçüldü), sonra sınıf ağırlığıyla büyütülür.
        # Sınıf: kafes, gizli, aşağı bakan, şadırvan, alem, diğer görünür (ağırlık doğrusal yoğunluk çarpanıdır).
        Y = s.C.get('YOGUNLUK')
        if Y:
            # ada: UV'de ortak köşeyi paylaşan yüzler (birleşim-bul)
            vi = np.empty(len(me.loops), np.int32); me.loops.foreach_get('vertex_index', vi)
            key = {}; par = np.arange(len(ls))
            def bul(x):
                while par[x] != x: par[x] = par[par[x]]; x = par[x]
                return x
            fl = np.repeat(np.arange(len(ls)), lt)
            for li in range(len(vi)):
                k = (int(vi[li]), round(float(a0[li, 0]), 6), round(float(a0[li, 1]), 6)); f = fl[li]
                if k in key:
                    r1, r2 = bul(f), bul(key[k])
                    if r1 != r2: par[r1] = r2
                else: key[k] = f
            ada = np.array([bul(i) for i in range(len(ls))])
            uvA = np.zeros(len(ls)); q = a0[ls]
            for k in range(1, int(lt.max()) - 1):
                m = lt > k + 1; p1 = a0[ls[m] + k]; p2 = a0[ls[m] + k + 1]; q0 = q[m]
                uvA[m] += 0.5 * np.abs((p1[:, 0] - q0[:, 0]) * (p2[:, 1] - q0[:, 1]) - (p2[:, 0] - q0[:, 0]) * (p1[:, 1] - q0[:, 1]))
            sinif = np.full(len(ls), Y['diger'], np.float32)
            nzz = np.array([p.normal.z for p in me.polygons])
            for p in me.polygons:
                ob = s.objs[parts[p.loop_start]].name
                if ob.startswith('Sadirvan_'): sinif[p.index] = Y.get('sadirvan', Y['diger'])
                if ob.startswith('Alemler'): sinif[p.index] = Y.get('alem', Y['diger'])
            sinif[nzz < -0.15] = Y['asagi']
            sinif[(kaf == 1) & (gor == 1)] = Y['kafes']
            sinif[yaz == 1] = Y['diger'] * s.C.get('MAHYA_UV_OLCEK', 6.0) / 1.75
            sinif[(gor == 0) & (yaz == 0)] = Y['gizli']
            u, inv = np.unique(ada, return_inverse=True)
            A3a = np.bincount(inv, A3, len(u)); uva = np.bincount(inv, uvA, len(u)); sa = np.bincount(inv, sinif * A3, len(u)) / np.maximum(A3a, 1e-12)
            fak = sa * np.sqrt(A3a / np.maximum(uva, 1e-12))   # ada ölçeği: hedef yoğunluk / şimdiki
            fak[uva <= 1e-12] = 0.0
            cen = np.zeros((len(u), 2)); cw = np.bincount(inv, uvA + 1e-12, len(u))
            for c in range(2): cen[:, c] = np.bincount(inv, (uvA + 1e-12) * a0[ls, c], len(u)) / cw
            fi = inv[fl]
            a0 = (a0 - cen[fi]) * fak[fi][:, None] + cen[fi]
            olcek = np.ones(len(ls), np.float32)
            s.rapor['uv_ada'] = {'ada': int(len(u)), 'sinif': {k: float(v) for k, v in Y.items()}}
        def alan_uv(a):
            tot = np.zeros(len(ls)); q = a[ls]
            for k in range(1, int(lt.max()) - 1):
                m = lt > k + 1; p1 = a[ls[m] + k]; p2 = a[ls[m] + k + 1]; q0 = q[m]
                tot[m] += 0.5 * np.abs((p1[:, 0] - q0[:, 0]) * (p2[:, 1] - q0[:, 1]) - (p2[:, 0] - q0[:, 0]) * (p1[:, 1] - q0[:, 1]))
            return tot
        # Kafes: hedef en çok KAFES_CM cm/piksel; ölçek paketlemeden sonra ölçülür, gerekirse büyütülüp yeniden paketlenir
        hedef = s.C.get('KAFES_CM', 3.0); kk = s.C.get('KAFES_UV_OLCEK', 4.0); s.rapor['kafes_deneme'] = []
        lidx = np.repeat(np.arange(len(ls)), lt)
        for deneme in range(6):
            o_ = olcek * (np.where(kaf & gor, kk / 0.55, 1.0) if not Y else np.where(kaf & gor, kk / Y['kafes'], 1.0))   # kafes yüzü 0,55 (ya da sınıf ağırlığı) yerine kk
            a = a0 * o_[lidx][:, None]
            uvd.foreach_set('uv', a.ravel())
            # Smart UV bu seçeneklerle adaları 0–1'e ölçeklemiyor (5.2): paketleme her zaman
            bpy.context.scene.tool_settings.use_uv_select_sync = True
            bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
            bpy.ops.uv.pack_islands(rotate=True, rotate_method='ANY', scale=True, margin_method='FRACTION', margin=pay, shape_method='CONCAVE')
            bpy.ops.object.mode_set(mode='OBJECT')
            uvd = me.uv_layers['Pisik'].data; a = np.empty(len(uvd) * 2, np.float32); uvd.foreach_get('uv', a); a = a.reshape(-1, 2)
            tot = alan_uv(a); m = (kaf == 1) & (gor == 1)
            cm = 100 * math.sqrt(float(A3[m].sum()) / max(float(tot[m].sum()), 1e-12)) / s.atlas if m.any() else 0.0
            gm = (gor == 1) & (kaf == 0); cg = 100 * math.sqrt(float(A3[gm].sum()) / max(float(tot[gm].sum()), 1e-12)) / s.atlas
            s.rapor['kafes_deneme'].append({'olcek': round(kk, 3), 'kafes_cm': round(cm, 2), 'diger_gorunur_cm': round(cg, 2), 'doluluk': round(float(tot.sum()), 3)})
            print('KAFES', s.rapor['kafes_deneme'][-1], flush=True)
            if cm <= hedef or not m.any(): break
            kk *= (cm / (0.97 * hedef)) ** 2
        pp = np.empty(len(me.loops), np.int32); me.attributes['pk_parca'].data.foreach_get('value', pp)
        dd = np.empty(len(me.loops), np.int32); me.attributes['pk_dongu'].data.foreach_get('value', dd)
        for i, o in enumerate(s.objs):
            m = pp == i; b = np.zeros((len(o.data.loops), 2), np.float32); b[dd[m]] = a[m]
            o.data.uv_layers['Pisik'].data.foreach_set('uv', b.ravel()); o.data.update()   # update yoksa Cycles eski (boş) UV'yi görür
        ls = np.empty(len(me.polygons), np.int32); me.polygons.foreach_get('loop_start', ls); lt = np.empty(len(me.polygons), np.int32); me.polygons.foreach_get('loop_total', lt)
        tot = np.zeros(len(ls)); q = a[ls]
        for k in range(1, int(lt.max()) - 1):
            m = lt > k + 1; p1 = a[ls[m] + k]; p2 = a[ls[m] + k + 1]; q0 = q[m]
            tot[m] += 0.5 * np.abs((p1[:, 0] - q0[:, 0]) * (p2[:, 1] - q0[:, 1]) - (p2[:, 0] - q0[:, 0]) * (p1[:, 1] - q0[:, 1]))
        A3 = np.empty(len(me.polygons), np.float32); me.polygons.foreach_get('area', A3)
        s.rapor['uv'] = {'aralik': [[round(float(x), 4) for x in a.min(0)], [round(float(x), 4) for x in a.max(0)]], 'doluluk': round(float(tot.sum()), 3),
                         'sifir_alanli_yuz': int((tot < 1e-12).sum()), 'yuz': len(ls), 'yuzey_m2': round(float(A3.sum())),
                         'cm_piksel': round(100 * math.sqrt(float(A3.sum()) / max(float(tot.sum()), 1e-9)) / s.atlas, 1)}
        nz = np.array([p.normal.z for p in me.polygons])
        for i, obj in enumerate(s.objs):
            if obj.name.startswith(('Sadirvan_Kubbe','Kubbeler','Govde','Cati','Minare')):
                mask = (pp[ls] == i) & (nz >= -0.15)
                if mask.any() and tot[mask].sum() > 0:
                    cm = 100 * math.sqrt(A3[mask].sum() / tot[mask].sum()) / s.atlas
                    s.rapor['uv'].setdefault('dis_yuz_cm_piksel', {})[obj.name] = round(cm, 2)
        gp = gor
        for i, obj in enumerate(s.objs):
            mask = (pp[ls] == i) & (gp == 1)
            if mask.any() and tot[mask].sum() > 0:
                s.rapor['uv'].setdefault('gorunur_cm_piksel', {})[obj.name] = round(100 * math.sqrt(A3[mask].sum() / tot[mask].sum()) / s.atlas, 2)
        mk = (kaf == 1) & (gp == 1)
        if mk.any(): s.rapor['uv']['kafes_cm_piksel'] = round(100 * math.sqrt(A3[mk].sum() / tot[mk].sum()) / s.atlas, 2)
        mg = gp == 0
        if mg.any(): s.rapor['uv']['gorunmez_doluluk'] = round(float(tot[mg].sum()), 4)
        print('UV', s.rapor['uv'], flush=True)
        me_ = j.data; bpy.data.objects.remove(j); bpy.data.meshes.remove(me_); bpy.context.view_layer.update()

    # 4) pişirme
    def malzeme_takimi(s, yap):
        """Her nesnenin her yuvasına yap(özgün ad) ile kurulan malzeme; aynı ad bir kez kurulur."""
        hazir = {}
        for o in s.objs:
            for i, sl in enumerate(o.material_slots):
                ad = s.asil[(o.name, i)]
                if ad not in hazir: hazir[ad] = yap(ad)
                sl.material = hazir[ad]
        return list(hazir.values())

    def hedef(s, malz, img):
        for m in malz:
            N = m.node_tree.nodes; t = next((n for n in N if n.name == '_hedef'), None)
            if t is None:
                t = N.new('ShaderNodeTexImage'); t.name = '_hedef'
                uv = N.new('ShaderNodeUVMap'); uv.uv_map = 'Pisik'; m.node_tree.links.new(uv.outputs[0], t.inputs[0])
            t.image = img; N.active = t; t.select = True

    def pisir(s, objs, tur, filtre, img, ornek):
        s.sc.cycles.samples = ornek; s.sc.cycles.use_denoising = False
        b = s.sc.render.bake; b.margin = 8; b.margin_type = 'EXTEND'; b.use_clear = True; b.target = 'IMAGE_TEXTURES'
        bpy.ops.object.select_all(action='DESELECT')
        for o in objs: o.select_set(True)
        bpy.context.view_layer.objects.active = objs[0]
        print(f'PİŞİR {tur} {sorted(filtre)} {img.name} {img.size[0]}px {ornek} örnek', flush=True)
        bpy.ops.object.bake(type=tur, pass_filter=filtre, use_clear=True, margin=8, uv_layer='Pisik')
        a = resim_oku(img); s.rapor.setdefault('pisirme', []).append({'tur': tur, 'gecis': sorted(filtre), 'resim': img.name, 'ornek': ornek, 'ort': [round(float(x), 4) for x in a.reshape(-1, 4).mean(0)], 'en': [round(float(x), 4) for x in a.reshape(-1, 4).max(0)]})
        print('  →', s.rapor['pisirme'][-1], flush=True)

    def dunya(s, gok, zemin, guc):
        w = bpy.data.worlds.new('_pisik'); w.use_nodes = True; s.sc.world = w; N = w.node_tree.nodes; L = w.node_tree.links
        bg = next(n for n in N if n.type == 'BACKGROUND')
        tc = N.new('ShaderNodeTexCoord'); sp = N.new('ShaderNodeSeparateXYZ'); L.new(tc.outputs['Generated'], sp.inputs[0])
        gt = N.new('ShaderNodeMath'); gt.operation = 'GREATER_THAN'; gt.inputs[1].default_value = 0.0; L.new(sp.outputs[2], gt.inputs[0])
        mx = N.new('ShaderNodeMix'); mx.data_type = 'RGBA'; L.new(gt.outputs[0], mx.inputs[0])
        mx.inputs[6].default_value = (*hexlin(zemin), 1); mx.inputs[7].default_value = (*hexlin(gok), 1)
        L.new(mx.outputs[2], bg.inputs[0]); bg.inputs[1].default_value = guc
        s.dunya_bg = bg

    def gunes(s, renk, guc):
        C = s.C; a, e = math.radians(C['YEREL_AZIMUT']), math.radians(C['YUKSEKLIK'])
        s.d = Vector((math.sin(a) * math.cos(e), math.cos(a) * math.cos(e), math.sin(e)))   # güneşe doğru (Blender, Z yukarı, +Y kuzey)
        l = bpy.data.lights.new('_gunes', 'SUN'); l.energy = guc; l.color = hexlin(renk); l.angle = math.radians(C['GUNES_ACI'])
        o = bpy.data.objects.new('_gunes', l); s.sc.collection.objects.link(o)
        lo, hi = bb(s.objs); c = (lo + hi) / 2
        o.location = c + s.d * (hi - lo).length; o.rotation_mode = 'QUATERNION'; o.rotation_quaternion = (c - o.location).to_track_quat('-Z', 'Y')
        s.gunes_o = o

    def golge_duzlemi(s):
        lo, hi = bb(s.objs); z = lo.z + 0.02; s.taban = lo.z
        ks = [Vector((x, y, zz)) for x in (lo.x, hi.x) for y in (lo.y, hi.y) for zz in (lo.z, hi.z)]
        uz = [k - s.d * ((k.z - z) / s.d.z) for k in ks] + ks
        m = s.C['GOLGE_PAY_M']; x0 = min(p.x for p in uz) - m; x1 = max(p.x for p in uz) + m; y0 = min(p.y for p in uz) - m; y1 = max(p.y for p in uz) + m
        me = bpy.data.meshes.new('Harita_Golge'); me.from_pydata([(x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z)], [], [(0, 1, 2, 3)])
        u = me.uv_layers.new(name='Pisik')
        for li, c in zip(range(4), ((0, 0), (1, 0), (1, 1), (0, 1))): u.data[li].uv = c
        o = bpy.data.objects.new('Harita_Golge', me); s.sc.collection.objects.link(o)
        s.golge = o; s.golge_kutu = (x0, y0, x1, y1, z)
        s.rapor['harita_golge'] = {'blend_kutu': [round(v, 3) for v in (x0, y0, x1, y1)], 'kot': round(z, 3), 'taban': round(lo.z, 3), 'pay_m': m}

    def golge_pisir(s, opak):
        """Yalnız düzlem seçili; model ışığı keser. Işık beyaz, gök kapalı; değer / açık alan değeri = görünürlük."""
        px = s.C['GOLGE_PX']; img = bpy.data.images.new('_golge', px, px, float_buffer=True)
        m = bpy.data.materials.new('_golge_b'); m.use_nodes = True; b = next(n for n in m.node_tree.nodes if n.type == 'BSDF_PRINCIPLED')
        b.inputs['Base Color'].default_value = (1, 1, 1, 1); b.inputs['Roughness'].default_value = 1
        s.golge.data.materials.clear(); s.golge.data.materials.append(m); s.hedef([m], img)
        s.malzeme_takimi(s.albedo_malzeme)   # gölgeyi yalnız ay/güneş versin: gecenin ışıyan malzemeleri düzlemi aydınlatmasın
        gg, rr = s.dunya_bg.inputs[1].default_value, tuple(s.gunes_o.data.color)
        s.dunya_bg.inputs[1].default_value = 0.0; s.gunes_o.data.color = (1, 1, 1)
        s.golge.hide_render = False
        s.pisir([s.golge], 'DIFFUSE', {'DIRECT'}, img, s.ornek)
        s.dunya_bg.inputs[1].default_value = gg; s.gunes_o.data.color = rr
        a = gurultu_gider(img)[..., 1]; acik = np.percentile(a, 99)
        g = np.clip(a / max(acik, 1e-6), 0, 1)
        x0, y0, x1, y1, _ = s.golge_kutu; h, w = g.shape
        xs = (np.arange(w) + 0.5) / w * (x1 - x0); ys = (np.arange(h) + 0.5) / h * (y1 - y0)
        kx = np.minimum(xs, (x1 - x0) - xs); ky = np.minimum(ys, (y1 - y0) - ys)
        kenar = np.minimum(kx[None, :], ky[:, None]) / s.C['GOLGE_PAY_M']
        fade = np.clip(kenar, 0, 1); fade = fade * fade * (3 - 2 * fade)
        A = np.zeros((h, w, 4), np.float32); A[..., 3] = opak * (1 - g) * fade
        s.rapor['harita_golge'].update(opaklik=opak, en_koyu_alfa=round(float(A[..., 3].max()), 3), acik_alan_degeri=round(float(acik), 4))
        bpy.data.images.remove(img); s.golge.data.materials.clear()
        return resim_yaz('Harita_Golge', A, True)

    # ---------------------------------------------------------------- gece ışıkları (gece_uret.py isiklari_kur ile aynı; KAYMA = −kaydırma)
    def gece_isiklari(s):
        AYAR = s.C['GECE_AYAR_J']; ARA = AYAR.get('isik', {}); SICAK = (1.0, 0.70, 0.42); KAYMA = -s.KAY; sc = s.sc
        from mathutils import Matrix

        def isik(ad, tur, konum, guc, renk=SICAK, yaricap=0.3):
            l = bpy.data.lights.new(ad, tur); l.energy = guc; l.color = renk; l.shadow_soft_size = yaricap
            o = bpy.data.objects.new(ad, l); sc.collection.objects.link(o); o.location = konum; return o
        ana = [o for o in s.objs if o.name != 'Mahya' and not re.match(AYAR.get('ana_disi', r'Cevre_|Olcek_|Zemin'), o.name) and not re.match(r'Minare|.*Sadirvan|.*Cesme', o.name)]
        lo, hi = bb(ana); pay = ARA.get('pay', 3.0); yuk = ARA.get('hedef_yukseklik', 9.0); G = ARA.get('duvar_guc', 260)
        lo = lo - KAYMA; hi = hi - KAYMA   # gece_uret: kutu GLB dünyasında (kaydırılmış)

        def kenar(a, b, n, z=0.3, hedef_z=None, guc=None, ara=None, renk=SICAK):
            hedef_z = yuk if hedef_z is None else hedef_z
            m, L = (a + b) / 2, (b - a).length
            p = m + n * (pay if ara is None else ara); p.z = z
            h = m.copy(); h.z = hedef_z
            o = isik(f'_u{len(bpy.data.lights)}', 'AREA', p, (guc or G) * L, tuple(renk))
            o.data.shape = 'RECTANGLE'; o.data.size = L; o.data.size_y = 1.5
            ex = (b - a).normalized(); ez = (p - h).normalized(); ey = ez.cross(ex).normalized()
            o.rotation_mode = 'XYZ'; o.rotation_euler = Matrix((ex, ey, ez)).transposed().to_euler()
        # gece_uret'te KAYMA = sunum↔uygulama farkı (uygulama GLB'si için 0); burada GLB dünyası → blend dünyası
        for u in ARA.get('serit', []):
            kenar(Vector(u['a']) + KAYMA, Vector(u['b']) + KAYMA, Vector(u['n']), u['z'], u['hedef_z'], u.get('guc'), u.get('pay'), u.get('renk', SICAK))
        n0 = Vector((1, 0, 0)); n1 = Vector((0, 1, 0))
        for x0, y0, x1, y1 in ARA.get('bloklar') or [[lo.x, lo.y, hi.x, hi.y]]:
            A, B = Vector((x0, y0, 0)) + KAYMA, Vector((x1, y0, 0)) + KAYMA
            Cc, D = Vector((x1, y1, 0)) + KAYMA, Vector((x0, y1, 0)) + KAYMA
            kenar(A, B, -n1); kenar(B, Cc, n0); kenar(Cc, D, n1); kenar(D, A, -n0)
        for m in ARA.get('minare', []):
            if not [o for o in s.objs if re.fullmatch(m['nesne'], o.name)]: continue
            c = Vector(m['merkez'])
            for z, r, g in m['kotlar']:
                for a in range(8):
                    t = a * math.pi / 4
                    isik(f'_m{len(bpy.data.lights)}', 'POINT', (c.x + KAYMA.x + r * math.cos(t), c.y + KAYMA.y + r * math.sin(t), z + KAYMA.z), g, tuple(m.get('renk', SICAK)), yaricap=0.25)
        for p in ARA.get('nokta', []):
            isik(f'_n{len(bpy.data.lights)}', 'POINT', Vector(p['konum']) + KAYMA, p['guc'], tuple(p.get('renk', SICAK)), yaricap=p.get('r', 0.5))
        for k in ARA.get('kapi', []):
            isik(f'_k{len(bpy.data.lights)}', 'POINT', Vector(k['konum']) + KAYMA, k['guc'], yaricap=0.4)
        s.rapor['gece_isik_sayisi'] = len([o for o in bpy.data.objects if o.type == 'LIGHT']) - 1

    def gece_isik_malzemesi(s, ad):
        """gece_uret.pisir: parla/dokulu kendi ışığı (renk × isik), diğerleri 0,8 beyaz diffuse. Mahya yazısı: ayar renginde, alfa maskeli."""
        d = s.sinif(ad); m = bpy.data.materials.new('_gi_' + ad); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links
        N.clear(); out = N.new('ShaderNodeOutputMaterial')
        if d.get('parla') or d.get('dokulu') or ad.startswith('Mahya_Yazi'):
            e = N.new('ShaderNodeEmission')
            if ad.startswith('Mahya_Yazi'):
                mh = s.C['GECE_AYAR_J'].get('mahya', {}); e.inputs[0].default_value = (*hexlin(mh.get('renk', '#FFE2A8')), 1); e.inputs[1].default_value = s.C['MAHYA_ISIK']
                p = s.gm[ad]['pbrMetallicRoughness']; im, _ = s.resim(p['baseColorTexture'])
                uv = N.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'; t = N.new('ShaderNodeTexImage'); t.image = im; L.new(uv.outputs[0], t.inputs[0])
                tr = N.new('ShaderNodeBsdfTransparent'); mx = N.new('ShaderNodeMixShader'); L.new(t.outputs['Alpha'], mx.inputs[0])
                L.new(tr.outputs[0], mx.inputs[1]); L.new(e.outputs[0], mx.inputs[2]); L.new(mx.outputs[0], out.inputs[0])
            else:
                e.inputs[0].default_value = (*hexlin(d.get('parla') or d['dokulu']), 1); e.inputs[1].default_value = d.get('isik', 3.0); L.new(e.outputs[0], out.inputs[0])
        else:
            n = N.new('ShaderNodeBsdfDiffuse'); n.inputs[0].default_value = (0.8, 0.8, 0.8, 1); L.new(n.outputs[0], out.inputs[0])
        return m

    def maske_malzemesi(s, ad):
        """Yayım: R = ışıktan bağımsız (parlayan/köşe rengisiz), G = yanık oranı (gece GLB'si), B = atlas alfası."""
        m = bpy.data.materials.new('_mk_' + ad); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links
        N.clear(); out = N.new('ShaderNodeOutputMaterial'); e = N.new('ShaderNodeEmission'); e.inputs[1].default_value = 1.0
        at = N.new('ShaderNodeAttribute'); at.attribute_name = 'PK_Maske'; sp = N.new('ShaderNodeSeparateColor'); L.new(at.outputs['Color'], sp.inputs[0])
        cb = N.new('ShaderNodeCombineColor'); L.new(sp.outputs[0], cb.inputs[0]); L.new(sp.outputs[1], cb.inputs[1]); cb.inputs[2].default_value = 1.0
        gm = s.gm.get(ad, {}); p = gm.get('pbrMetallicRoughness', {})
        if gm.get('alphaMode') == 'BLEND' and 'baseColorTexture' in p:
            im, _ = s.resim(p['baseColorTexture']); uv = N.new('ShaderNodeUVMap'); uv.uv_map = 'UVMap'
            t = N.new('ShaderNodeTexImage'); t.image = im; L.new(uv.outputs[0], t.inputs[0]); L.new(t.outputs['Alpha'], cb.inputs[2])
        L.new(cb.outputs[0], e.inputs[0]); L.new(e.outputs[0], out.inputs[0])
        return m

    # ---------------------------------------------------------------- akış
    def calistir(s):
        C = s.C; s.ac(); s.glb_malzemeleri()
        if s.gece:
            s.mahya_al()
        s.asil = {(o.name, i): sl.material.name if sl.material else '' for o in s.objs for i, sl in enumerate(o.material_slots)}
        s.pk_kok = {}; s.pk_alfa = {}
        if s.gece: s.pencereler()
        s.gorunurluk(); s.uv()
        W = s.atlas
        if s.gece:
            gok_guc = C['GECE_GOK_GUC']; s.dunya(C['GECE_GOK'], C['GECE_ZEMIN'], gok_guc); s.gunes(C['AY_RENK'], C['AY_GUC'])
        else:
            s.dunya(C['GOK'], C['ZEMIN'], C['GOK_GUC']); s.gunes(C['GUNES_RENK'], C['GUNES_GUC'])
        # Geçişler ayrı pişer, sonra ayar oranlarıyla birleşir (3 Kasım 2026, ikinci deneme: ölçülerek mevcut görünüme yaklaştırıldı).
        # PISIK_ONBELLEK=<klasör> verilirse gürültüsü giderilmiş geçişler oraya yazılır / oradan okunur (yalnız oran ayarı için).
        on = os.environ.get('PISIK_ONBELLEK')
        def gecis(ad, malz, tur, filtre, ornek, kilavuz=None, hazirla=None, geri=None):
            f = on and os.path.join(on, f'{s.kip}_{ad}.npy')
            if f and os.path.exists(f): print('ÖNBELLEK', f, flush=True); return np.load(f)
            if hazirla: hazirla()
            img = bpy.data.images.new('_' + ad, W, W, float_buffer=True); s.hedef(malz, img)
            s.pisir(s.objs, tur, filtre, img, ornek)
            a = gurultu_gider(img, kilavuz) if kilavuz is not False else resim_oku(img)
            if geri: geri()
            if f: os.makedirs(on, exist_ok=True); np.save(f, a)
            return a
        bg = s.dunya_bg; gg = bg.inputs[1].default_value; gu = s.gunes_o.data.energy
        dunya_kapa = lambda: setattr(bg.inputs[1], 'default_value', 0.0); dunya_ac = lambda: setattr(bg.inputs[1], 'default_value', gg)
        malz = s.malzeme_takimi(s.albedo_malzeme); s.malz_albedo = malz
        A = gecis('albedo', malz, 'DIFFUSE', {'COLOR'}, 4 if s.hizli else 16, kilavuz=False)
        A_img = bpy.data.images.new('_albedo_k', W, W, float_buffer=True); A_img.pixels.foreach_set(A.ravel())
        AY_ = {k: C[k] for k in ('ORTAM_YUMUSAT', 'PARLAMA', 'AY_KATKI') if k in C}; s.rapor['birlesim'] = AY_
        if not s.gece:
            Dg = gecis('gunes', malz, 'DIFFUSE', {'DIRECT'}, s.ornek, A_img, dunya_kapa, dunya_ac)[..., :3]            # güneş, doğrudan, gölgeli
            Dt = gecis('tum', malz, 'DIFFUSE', {'DIRECT', 'INDIRECT'}, s.ornek, A_img)[..., :3]                         # güneş + gök + sekmeler
            G = gecis('parlama', malz, 'GLOSSY', {'DIRECT', 'COLOR'}, max(16, s.ornek // 4), A_img, dunya_kapa, dunya_ac)[..., :3]
            s.sc.render.bake.normal_space = 'OBJECT'
            Nn = gecis('normal', malz, 'NORMAL', set(), 4, kilavuz=False)[..., :3] * 2 - 1
            ortam = np.maximum(Dt - Dg, 0)
            nz = np.clip(Nn[..., 2:3], -1, 1); yari = C['GOK_GUC'] * (np.array(hexlin(C['GOK'])) * (0.5 + 0.5 * nz) + np.array(hexlin(C['ZEMIN'])) * (0.5 - 0.5 * nz))
            w = C.get('ORTAM_YUMUSAT', 0.0)   # 0 = Cycles ortam gölgesi aynen, 1 = gölgesiz yarımküre (uygulamanın HemisphereLight'ı)
            isik = Dg + (1 - w) * ortam + w * yari
            son = np.zeros_like(A); son[..., :3] = A[..., :3] * isik + C.get('PARLAMA', 0.0) * G; son[..., 3] = 1.0
            # Karşılaştırma aracı bu uç ile gölgesiz yarımküreyi aynı texellerde ölçer.
            sifir = son.copy()
            sifir[..., :3] = A[..., :3] * Dt + C.get('PARLAMA', 0.0) * G
            im = resim_yaz('Ortam_0', sifir, False)
            klasor = os.path.join(s.U, 'kontrol', C['SURUM'] + '_pisik')
            os.makedirs(klasor, exist_ok=True)
            im.filepath_raw = os.path.join(klasor, 'ortam_0.png')
            im.file_format = 'PNG'
            im.save()
            golge_opak = C['GOLGE_OPAK']
        else:
            mk = s.malzeme_takimi(s.maske_malzemesi)
            M = gecis('maske', mk, 'EMIT', set(), 4 if s.hizli else 16, kilavuz=False)
            s.gece_isiklari(); isiklar = [o for o in bpy.data.objects if o.type == 'LIGHT' and o is not s.gunes_o]
            gi = s.malzeme_takimi(s.gece_isik_malzemesi)
            def ay_kapa(): s.gunes_o.data.energy = 0.0
            def ay_ac(): s.gunes_o.data.energy = gu
            Lg = gecis('gece_isik', gi, 'DIFFUSE', {'DIRECT', 'INDIRECT'}, s.ornek, None, ay_kapa, ay_ac)[..., :3]      # gece_uret ışıkları + gök
            beyaz = bpy.data.materials.new('_beyaz'); beyaz.use_nodes = True
            next(n for n in beyaz.node_tree.nodes if n.type == 'BSDF_PRINCIPLED').inputs['Base Color'].default_value = (0.8, 0.8, 0.8, 1)
            bm = s.malzeme_takimi(lambda ad: beyaz)
            def yalniz_ay():
                dunya_kapa()
                for o in isiklar: o.hide_render = True
            def geri_al():
                dunya_ac()
                for o in isiklar: o.hide_render = False
            Lm = gecis('ay', bm, 'DIFFUSE', {'DIRECT', 'INDIRECT'}, s.ornek, None, yalniz_ay, geri_al)[..., :3]         # yalnız ay, gölgeli
            Lr = Lg + C.get('AY_KATKI', 1.0) * Lm
            ARA = C['GECE_AYAR_J'].get('isik', {}); poz = ARA.get('poz', 0.55); dolgu = np.array(ARA.get('dolgu', [0.045, 0.055, 0.09]), np.float32)
            Lmx = np.maximum(Lr.max(axis=2, keepdims=True), 1e-6) * poz
            ton = np.minimum(1.0, Lr * ((1 - np.exp(-Lmx * 1.7)) / Lmx * poz) + dolgu)      # gece_uret.renk_isle.ton
            em = M[..., 0:1] > 0.5
            son = np.zeros_like(A); son[..., :3] = np.where(em, A[..., :3] * M[..., 1:2], A[..., :3] * ton); son[..., 3] = M[..., 2]
            golge_opak = C['GOLGE_OPAK_GECE']
            for o in isiklar: bpy.data.objects.remove(o)
        s.rapor['atlas'] = {'px': W, 'ornek': s.ornek, 'en_parlak': [round(float(x), 3) for x in son[..., :3].reshape(-1, 3).max(axis=0)],
                           'p99': round(float(np.percentile(son[..., :3], 99)), 3)}
        atlas = resim_yaz('Harita_Pisik', son, s.gece)
        s.golge_duzlemi(); golge = s.golge_pisir(golge_opak)   # düzlem model pişirmesinden sonra kurulur
        s.sonlandir(atlas, golge)

    def sonlandir(s, atlas, golge):
        C = s.C
        m = bpy.data.materials.new('Harita_Pisik'); m.use_nodes = True; N = m.node_tree.nodes; L = m.node_tree.links
        b = next(n for n in N if n.type == 'BSDF_PRINCIPLED'); b.inputs['Roughness'].default_value = 1; b.inputs['Metallic'].default_value = 0
        uv = N.new('ShaderNodeUVMap'); uv.uv_map = 'Pisik'; t = N.new('ShaderNodeTexImage'); t.image = atlas; L.new(uv.outputs[0], t.inputs[0])
        L.new(t.outputs['Color'], b.inputs['Base Color'])
        if s.gece: L.new(t.outputs['Alpha'], b.inputs['Alpha']); m.surface_render_method = 'DITHERED'
        g = bpy.data.materials.new('Harita_Golge'); g.use_nodes = True; N = g.node_tree.nodes; L = g.node_tree.links
        b = next(n for n in N if n.type == 'BSDF_PRINCIPLED'); b.inputs['Base Color'].default_value = (0, 0, 0, 1); b.inputs['Roughness'].default_value = 1
        uv = N.new('ShaderNodeUVMap'); uv.uv_map = 'Pisik'; t = N.new('ShaderNodeTexImage'); t.image = golge; L.new(uv.outputs[0], t.inputs[0])
        L.new(t.outputs['Color'], b.inputs['Base Color']); L.new(t.outputs['Alpha'], b.inputs['Alpha']); g.surface_render_method = 'BLENDED'
        for o in s.objs:
            me = o.data; me.materials.clear(); me.materials.append(m)
            for u in [u for u in me.uv_layers if u.name != 'Pisik']: me.uv_layers.remove(u)
            while len(me.color_attributes): me.color_attributes.remove(me.color_attributes[0])
        s.golge.data.materials.append(g); s.golge.hide_render = False
        for x in [x for x in bpy.data.materials if x not in (m, g)]: bpy.data.materials.remove(x)
        for x in [x for x in bpy.data.images if x not in (atlas, golge)]: bpy.data.images.remove(x)
        for o in [o for o in bpy.data.objects if o.type == 'LIGHT']: bpy.data.objects.remove(o)
        for w in list(bpy.data.worlds):
            if w.name.startswith('_pisik'): bpy.data.worlds.remove(w)
        bpy.data.orphans_purge(do_recursive=True)
        ad = C['BLEND_PISIK_GECE'] if s.gece else C['BLEND_PISIK']
        bpy.ops.file.make_paths_relative()
        bpy.ops.wm.save_as_mainfile(filepath=os.path.join(s.U, ad), compress=True, copy=True)
        s.rapor['blend'] = ad
        # dışa aktarım: kaydırma uygulanır, sonra geri alınır (blend_cikti.disa gibi)
        T = s.objs + [s.golge]
        for o in T: o.location += s.KAY
        bpy.context.view_layer.update(); bpy.ops.object.select_all(action='DESELECT')
        for o in T: o.select_set(True)
        ham = os.path.join(s.T, 'ham.glb')
        bpy.ops.export_scene.gltf(filepath=ham, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                                  export_cameras=False, export_lights=False, export_normals=False, export_vertex_color='NONE',
                                  export_image_format='WEBP', export_image_quality=80, export_materials='EXPORT')
        for o in T: o.location -= s.KAY
        cikti = os.path.join(s.U, 'export', (C['GLB_GECE'] if s.gece else C['GLB']) + '_harita_pisik.glb')
        if os.path.exists(cikti) and not C.get('YENIDEN_YAZ', True): raise SystemExit(f'{cikti} var')
        GT = os.environ.get('GT_DIR'); NODE = os.environ.get('NODE', 'node')
        if not GT: raise SystemExit('GT_DIR gerekli (gltf-transform + draco3dgltf + sharp)')
        ham2 = os.path.join(s.T, 'ham_unlit.glb')
        kos(NODE, os.path.join(AY, 'pisik_unlit.mjs'), ham, ham2, 'MASK' if s.gece else 'OPAQUE')
        kos(NODE, os.path.join(AY, 'blend_son.mjs'), ham2, cikti, '0')
        import shutil; shutil.copyfile(cikti, os.path.join(s.U, 'blend', os.path.basename(cikti).replace('.glb', '_cycles.glb')))   # yansıtma girdisi
        s.rapor['cikti'] = os.path.relpath(cikti, s.U)
        json.dump(s.rapor, open(os.path.join(s.T, 'blend_rapor.json'), 'w'), ensure_ascii=False, indent=1)
        s.blend_rapor = os.path.join(s.T, 'blend_rapor.json')
        print('PISIK', s.kip, '→', cikti, json.dumps(s.rapor['uyari'], ensure_ascii=False), flush=True)


def calistir(C):
    arg = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    hedef = next((a for a in arg if not a.startswith('--')), 'hepsi'); C['HIZLI'] = '--hizli' in arg
    C['GECE_AYAR_J'] = json.load(open(os.path.join(KUT, 'gece', C['GECE_AYAR']), encoding='utf-8'))
    raporlar = {}
    for kip in (('gunduz', 'gece') if hedef == 'hepsi' else (hedef,)):
        h = Hat(C, kip); h.calistir(); raporlar[kip] = h.blend_rapor
    K = os.path.join(C['URETIM'], 'kontrol', C['SURUM'] + '_pisik'); os.makedirs(K, exist_ok=True)
    NODE = os.environ.get('NODE', 'node')
    for kip, r in raporlar.items():
        os.replace(r, os.path.join(K, f'blend_rapor_{kip}.json'))
    kos(NODE, os.path.join(AY, 'pisik_dogrula.mjs'), C['URETIM'], C['SURUM'])
    if not C['HIZLI'] or '--gorsel' in arg:
        # 4 Kasım 2026: atlas mevcut harita dosyasından yoğun yansıtılır, sonra uygulama kamerasından ölçülür (pisik_olcum.mjs)
        kos(NODE, os.path.join(AY, 'pisik_gorsel.mjs'), C['URETIM'], C['SURUM'], '--yansit-uygulama', '--uygulama', C.get('OLCUM_ETIKET', 'son'))
        kos(NODE, os.path.join(AY, 'pisik_dogrula.mjs'), C['URETIM'], C['SURUM'])
    print('BITTI', K)
