# Bir kerelik geçiş işiydi; kaynak artık Blender + malzeme-paleti.json (_kutuphane/blend_hat/). Yeniden kullanma.
"""AKAR · renk_ao_v3: fotoğraftan ölçülen palet + dokuya pişmiş AO + yer gölgesi düzlemi (28 Ekim 2026).
İş emri: promptlar/PROMPT_foto_renk_ve_ao_pisirme_7_eser.md (2. aşama).

Geometri değişmez. Yapılan:
  1) Renk: _kutuphane/malzeme-paleti.json (eser_malzeme: malzeme → rol). Düz malzemede renk düğümü hedef hex olur;
     dokulu malzemede doku, ortancası hedefe eşit olacak şekilde doğrusal uzayda kanal kanal çarpılır (desen korunur),
     yeni doku <eser>/3d/build/doku_palet_v3/ altına yazılır. Eskisi silinmez. Kodda renk sabiti yok.
  2) Köşe rengi AO'su kaldırılır: yapı parçalarında COLOR_0 tamamen 1,0 (renk iki kez kararmasın).
  3) AO: yapı parçalarına ikinci UV «UV_AO» (Smart UV Project + tek atlasa paketleme; Lightmap Pack küçük yüzleri yok ediyordu), Cycles AO pişirme, 0,5 + 0,5 × AO, glTF Material Output
     «Occlusion» girişine bağlanır (GLB'de occlusionTexture.texCoord = 1). Yalnız ortam ışığını kısar.
  4) «Yer_Golgesi»: taban kutusu + 5 m düzlem, z = taban + 0,02 m; AO pişirilir, alfa = (1 − AO) × 0,15, kenarda sıfıra iner.
  5) Dışa aktarım: eski GLB'lerle aynı konuma kaydırılmış ham uygulama ve sunum GLB'leri (son_adim.mjs Draco'lar).

Kullanım: Blender -b <eser>/3d/blend/<ad>_<eski>.blend --python renk_ao.py -- <eser> <ref.json> <gecici klasör>
Çevre/figür (Cevre_*, Olcek_Insan_*, Zemin*, Avlu_Agac, Avlu_Cim) bu işe girmez; sunumda eski hâliyle kalır.
"""
import bpy, bmesh, sys, os, json, math, time
import numpy as np
from mathutils import Vector

ESER, REF, TMP = sys.argv[sys.argv.index('--') + 1:][:3]
AY = os.path.dirname(os.path.abspath(__file__))
KUT = os.path.dirname(AY)
URETIM = os.path.join(os.path.dirname(KUT), ESER, '3d')
CFG = json.load(open(os.path.join(AY, 'eserler.json')))[ESER]
PAL = json.load(open(os.path.join(KUT, 'malzeme-paleti.json')))
REFJ = json.load(open(REF))
AD, YENI = CFG['ad'], CFG['yeni']
os.makedirs(TMP, exist_ok=True)
rapor = {'eser': ESER, 'surum': YENI, 'zaman': time.strftime('%Y-%m-%d %H:%M'), 'renk': {}, 'uyari': []}
t0 = time.time()


def lin(v): return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)
def srgb(v): v = np.clip(v, 0, 1); return np.where(v <= 0.0031308, v * 12.92, 1.055 * v ** (1 / 2.4) - 0.055)
def hex2lin(h): return lin(np.array([int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)]))
def lin2hex(c): return '#' + ''.join(f'{int(round(x * 255)):02X}' for x in srgb(np.asarray(c)))


# ---------------- yapı parçaları: eski uygulama GLB'sindeki mesh düğümleri ----------------
YAPI = set(REFJ['app'])
yapi = [o for o in bpy.data.objects if o.type == 'MESH' and o.name in YAPI]
eksik = YAPI - {o.name for o in yapi}
if eksik: rapor['uyari'].append(f'blendde olmayan GLB düğümü: {sorted(eksik)}')
digerleri = [o for o in bpy.data.objects if o.type == 'MESH' and o not in yapi and not o.name.startswith(('REF', '_'))]
print('YAPI', len(yapi), 'DIGER', len(digerleri))

# ---------------- çevreyle paylaşılan malzeme: yapıya kopya (çevre eski malzemede kalır, adı _cevre; son_adim.mjs soneki siler) ----------------
yapi_mat = {}
for o in yapi:
    for s in o.material_slots:
        m = s.material
        if m is None: continue
        if m.name in yapi_mat: s.material = yapi_mat[m.name]; continue
        paylasimli = any(s2.material == m for o2 in digerleri for s2 in o2.material_slots)
        if paylasimli:
            ad = m.name; yeni = m.copy(); m.name = ad + '_cevre'; yeni.name = ad
            for o2 in yapi:
                for s2 in o2.material_slots:
                    if s2.material == m: s2.material = yeni
            m = yeni
        yapi_mat[m.name] = m
        s.material = m


def renk_girisi(m):
    """Base Color'a giden çarpma düğümünün renk (A) girişi ve kaynağı. Yapı: (RGB | DOKU | DOKU×RGB) × Color Attribute."""
    nt = m.node_tree
    bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    bl = bsdf.inputs['Base Color'].links
    if not bl: return None, bsdf
    mul = bl[0].from_node
    if mul.type in ('TEX_IMAGE', 'RGB'): return mul, None   # köşe rengi çarpımı olmadan doğrudan bağlı (ör. Ulucami taş dokuları)
    if mul.type != 'MIX': return None, bsdf
    a = next((l.from_node for l in nt.links if l.to_node == mul and l.to_socket.identifier.startswith('A')), None)
    return a, mul


def goruntu_ortanca(img):
    px = np.array(img.pixels[:], dtype=np.float32).reshape(-1, 4)
    a = px[:, 3] > 0.5
    return np.median(px[a, :3] if a.any() else px[:, :3], axis=0), px


DOKU_DIR = os.path.join(URETIM, 'build', 'doku_palet_v3'); os.makedirs(DOKU_DIR, exist_ok=True)
ESL = PAL['eser_malzeme'].get(ESER, {})
IST = PAL.get('eser_istisna', {}).get(ESER, {})
carpan = {}


def hedef_hex(rol): return IST.get(rol) or PAL[rol]['hex']


def boya(m, carp=None, hedef=None):
    """hedef: sRGB hex; carp: doğrusal çarpan (goreli). Dönüş: kullanılan çarpan."""
    a, mul = renk_girisi(m)
    if a is None: rapor['uyari'].append(f'{m.name}: renk düğümü bulunamadı'); return None
    if a.type == 'RGB':
        eski = np.array(a.outputs[0].default_value[:3])
        k = carp if carp is not None else hex2lin(hedef) / np.maximum(eski, 1e-5)
        a.outputs[0].default_value = (*(eski * k), 1.0)
        rapor['renk'][m.name] = {'tur': 'duz', 'eski': lin2hex(eski), 'yeni': lin2hex(eski * k)}
        return k
    if a.type == 'MIX':  # doku × renk (kurşun): renk düğümünü ayarla, dokuyu koru
        rgb = next(l.from_node for l in m.node_tree.links if l.to_node == a and l.from_node.type == 'RGB')
        tex = next(l.from_node for l in m.node_tree.links if l.to_node == a and l.from_node.type == 'TEX_IMAGE')
        med, _ = goruntu_ortanca(tex.image)
        eski = np.array(rgb.outputs[0].default_value[:3])
        k = carp if carp is not None else hex2lin(hedef) / np.maximum(lin(med) * eski, 1e-5)
        rgb.outputs[0].default_value = (*(eski * k), 1.0)
        rapor['renk'][m.name] = {'tur': 'doku×renk', 'eski': lin2hex(lin(med) * eski), 'yeni': lin2hex(lin(med) * eski * k)}
        return k
    if a.type == 'TEX_IMAGE':
        img = a.image
        med, px = goruntu_ortanca(img)
        k = carp if carp is not None else hex2lin(hedef) / np.maximum(lin(med), 1e-5)
        yeni = px.copy(); yeni[:, :3] = srgb(lin(px[:, :3]) * k)
        ad = f"{m.name.replace('.', '_')}_palet_v3"
        im2 = bpy.data.images.new(ad, img.size[0], img.size[1], alpha=True)
        im2.pixels[:] = yeni.ravel(); im2.filepath_raw = os.path.join(DOKU_DIR, ad + '.png'); im2.file_format = 'PNG'; im2.save()
        im2.colorspace_settings.name = 'sRGB'
        a.image = im2
        med2, _ = goruntu_ortanca(im2)
        rapor['renk'][m.name] = {'tur': 'doku', 'eski': lin2hex(lin(med)), 'yeni': lin2hex(lin(med2)), 'dosya': os.path.relpath(im2.filepath_raw, URETIM)}
        return k
    rapor['uyari'].append(f'{m.name}: tanınmayan renk düğümü {a.type}'); return None


# önce doğrudan hedefliler, sonra göreliler
for ad, rol in ESL.items():
    if isinstance(rol, str) and ad in yapi_mat:
        carpan[ad] = boya(yapi_mat[ad], hedef=hedef_hex(rol))
        if ad in rapor['renk']: rapor['renk'][ad].update(rol=rol, hedef=hedef_hex(rol))
for ad, rol in ESL.items():
    if isinstance(rol, dict) and ad in yapi_mat:
        k = carpan.get(rol['goreli'])
        if k is None: rapor['uyari'].append(f'{ad}: göreli malzeme {rol["goreli"]} boyanmadı'); continue
        boya(yapi_mat[ad], carp=k)
        if ad in rapor['renk']: rapor['renk'][ad]['rol'] = rol['rol'] + ' (göreli: ' + rol['goreli'] + ')'
eksik_m = [a for a in ESL if a not in yapi_mat]
if eksik_m: rapor['uyari'].append(f'paletteki malzeme yapıda yok: {eksik_m}')
print('RENK', len(rapor['renk']), 'malzeme', f'{time.time() - t0:.0f}s')

# ---------------- köşe rengi: 1,0 ----------------
gor = set()
for o in yapi:
    me = o.data
    if me.name in gor: continue
    gor.add(me.name)
    for ca in me.color_attributes:
        n = len(ca.data)
        ca.data.foreach_set('color', np.ones(n * 4, dtype=np.float32))
rapor['kose_rengi'] = '1,0 (bütün yapı mesh\'lerinde)'

# ---------------- taban ve Yer_Golgesi düzlemi ----------------
bpy.context.view_layer.update()
P = np.array([o.matrix_world @ Vector(c) for o in yapi for c in o.bound_box])
mn, mx = P.min(axis=0), P.max(axis=0)
PAY = 5.0
z0 = float(mn[2]) + 0.02
me = bpy.data.meshes.new('Yer_Golgesi')
bm = bmesh.new()
x0, y0, x1, y1 = mn[0] - PAY, mn[1] - PAY, mx[0] + PAY, mx[1] + PAY
vs = [bm.verts.new((x, y, z0)) for x, y in ((x0, y0), (x1, y0), (x1, y1), (x0, y1))]
f = bm.faces.new(vs); uv = bm.loops.layers.uv.new('UVMap')
for l, (u, v) in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))): l[uv].uv = (u, v)
bm.to_mesh(me); bm.free()
golge = bpy.data.objects.new('Yer_Golgesi', me)
bpy.context.scene.collection.objects.link(golge)
rapor['yer_golgesi'] = {'kutu_m': [round(x1 - x0, 2), round(y1 - y0, 2)], 'z': round(z0, 3), 'pay_m': PAY}

# ---------------- UV_AO (ikinci UV, tek atlas) ----------------
ozgun = {}
for o in yapi: ozgun.setdefault(o.data.name, o)
for o in ozgun.values():
    me = o.data
    if len(me.uv_layers) > 1:   # UV_AO ikinci kanal (TEXCOORD_1) olmalı: dokuların kullandığı (render'da etkin) katman kalır, kullanılmayanlar silinir
        kal = next(u.name for u in me.uv_layers if u.active_render)
        for u in [u.name for u in me.uv_layers if u.name != kal]:
            me.uv_layers.remove(me.uv_layers[u]); rapor.setdefault('silinen_uv', []).append(f'{o.name}/{u}')
    if len(me.uv_layers) == 0: me.uv_layers.new(name='UVMap')   # TEXCOORD_0 yer tutucu: UV_AO ikinci kanal olsun
    if 'UV_AO' not in me.uv_layers: me.uv_layers.new(name='UV_AO')
    me.uv_layers.active = me.uv_layers['UV_AO']
# UV_AO: bütün yapı parçalarının geçici kopyaları tek nesnede birleştirilir, Smart UV Project bir kez çalışır (tek atlas, ortak ölçek),
# sonuç yüz etiketiyle asıl mesh'lere geri yazılır. (Lightmap Pack çok yüzlü modelde yüzlerin çoğunu < 1 px'e sıkıştırdı — Ulucami 52 337
# yüzün 31 865'i, AO hiç yazılmadı; çok nesneli smart_project/pack_islands ise arka plan kipinde nesneleri ayrı ayrı paketleyip üst üste koydu.)
ol = list(ozgun.values()); kop = []
for oi, o in enumerate(ol):
    k = o.copy(); k.data = o.data.copy(); sc_ = bpy.context.scene; sc_.collection.objects.link(k)
    for nm_, val in (('_k_nesne', oi), ('_k_yuz', None)):
        at = k.data.attributes.new(nm_, 'INT', 'FACE')
        at.data.foreach_set('value', [oi] * len(k.data.polygons) if val is not None else list(range(len(k.data.polygons))))
    for u in [u.name for u in k.data.uv_layers if u.name != 'UV_AO']: k.data.uv_layers.remove(k.data.uv_layers[u])
    k.data.uv_layers.active = k.data.uv_layers['UV_AO']
    kop.append(k)
bpy.ops.object.select_all(action='DESELECT')
for k in kop: k.select_set(True)
bpy.context.view_layer.objects.active = kop[0]
bpy.ops.object.join()
bir = bpy.context.view_layer.objects.active
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
bpy.context.scene.tool_settings.use_uv_select_sync = True   # bütün yüzler seçili = bütün UV'ler seçili
bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.0, area_weight=0.0, correct_aspect=True, scale_to_bounds=False)
# binlerce küçük adada sabit pay atlası tüketiyor: pay ada boyutuyla ölçeklenir (SCALED)
bpy.ops.uv.pack_islands(udim_source='CLOSEST_UDIM', rotate=True, scale=True, shape_method='CONCAVE', margin_method='SCALED', margin=0.002)
bpy.ops.object.mode_set(mode='OBJECT')
bm_ = bir.data; kn = [0] * len(bm_.polygons); ky = [0] * len(bm_.polygons)
bm_.attributes['_k_nesne'].data.foreach_get('value', kn); bm_.attributes['_k_yuz'].data.foreach_get('value', ky)
buv = np.zeros(len(bm_.loops) * 2, np.float32); bm_.uv_layers['UV_AO'].data.foreach_get('uv', buv); buv = buv.reshape(-1, 2)
hedefuv = {}
for o in ol:
    t = np.zeros(len(o.data.loops) * 2, np.float32); o.data.uv_layers['UV_AO'].data.foreach_get('uv', t); hedefuv[o.name] = t.reshape(-1, 2)
for p in bm_.polygons:
    o = ol[kn[p.index]]; q = o.data.polygons[ky[p.index]]
    hedefuv[o.name][q.loop_start:q.loop_start + q.loop_total] = buv[p.loop_start:p.loop_start + p.loop_total]
for o in ol:
    o.data.uv_layers['UV_AO'].data.foreach_set('uv', hedefuv[o.name].ravel()); o.data.update()
me_ = bir.data; bpy.data.objects.remove(bir); bpy.data.meshes.remove(me_)
# denetim: UV alanı 1 pikselden küçük yüz oranı
_kucuk = _top = 0
for o in ozgun.values():
    u = o.data.uv_layers['UV_AO'].data
    for p in o.data.polygons:
        q = [u[j].uv * CFG['atlas'] for j in p.loop_indices]
        a = abs(sum(q[j - 1].x * q[j].y - q[j].x * q[j - 1].y for j in range(len(q)))) / 2
        _top += 1; _kucuk += a < 1 and p.area > 0.01
_kap = 0.0
for o in ozgun.values():
    u = o.data.uv_layers['UV_AO'].data
    for p in o.data.polygons:
        q = [u[j].uv for j in p.loop_indices]; _kap += abs(sum(q[j - 1].x * q[j].y - q[j].x * q[j - 1].y for j in range(len(q)))) / 2
_R = 512; _say = np.zeros((_R, _R), np.int32)
for o in ozgun.values():
    u = o.data.uv_layers['UV_AO'].data
    for p in o.data.polygons:
        c = sum((u[j].uv for j in p.loop_indices), Vector((0, 0))) / len(p.loop_indices)
        _say[min(_R - 1, int(c.y * _R)), min(_R - 1, int(c.x * _R))] += 1
rapor['uv_ao_cakisma_hucre_ust_uste'] = int((_say > 3).sum())
rapor['uv_ao'] = {'atlas_kullanimi': round(_kap, 3), 'yontem': 'birleşik geçici kopyada smart_project 66° + pack_islands (CONCAVE, pay ölçekli 0,002)', 'yuz': _top, 'alani_1px_alti_(0,01 m² ustu yuz)': _kucuk}
# Not: Cycles pişirmeyi ETKİN UV katmanına yapar (düğümdeki UV Map'e değil); UV_AO pişirme bitene kadar etkin kalır.
print('UV_AO', len(ozgun), 'mesh', f'{time.time() - t0:.0f}s')

# ---------------- Cycles AO pişirme ----------------
sc = bpy.context.scene
sc.render.engine = 'CYCLES'
try:
    pr = bpy.context.preferences.addons['cycles'].preferences
    pr.compute_device_type = 'METAL'; pr.get_devices()
    for d in pr.devices: d.use = True
    sc.cycles.device = 'GPU'
except Exception as e:
    rapor['uyari'].append(f'GPU yok, CPU: {e}')
sc.cycles.samples = 128
if sc.world is None: sc.world = bpy.data.worlds.new('_w')
sc.world.light_settings.distance = CFG['ao_m']
gizli = []
for o in bpy.data.objects:
    if o.type == 'MESH' and o not in yapi and o is not golge and not o.hide_render:
        o.hide_render = True; gizli.append(o)

N = CFG['atlas']
ao_img = bpy.data.images.new(f'{AD}_{YENI}_ao', N, N, alpha=False, float_buffer=False)
ao_img.colorspace_settings.name = 'Non-Color'
ao_img.generated_color = (1, 1, 1, 1)


def ao_dugumu(m, img, uvad):
    nt = m.node_tree
    t = nt.nodes.new('ShaderNodeTexImage'); t.name = t.label = 'AO_PISMIS'; t.image = img; t.interpolation = 'Linear'
    u = nt.nodes.new('ShaderNodeUVMap'); u.uv_map = uvad; nt.links.new(u.outputs['UV'], t.inputs['Vector'])
    t.location = (-900, -500); u.location = (-1100, -500)
    nt.nodes.active = t; t.select = True
    return t


aod = {m.name: ao_dugumu(m, ao_img, 'UV_AO') for m in yapi_mat.values()}

# Üst üste katmanlar: bazı modellerde kaplama (ör. kurşun) alttaki kabuğun 0–3 cm üstünde ayrı yüz olarak durur. Cycles bu
# katmanları birbirini tamamen örtüyor sayar ve görünen yüzün AO'su 0 olur (Ulucami kubbeleri, Türbe çatısı). Çözüm yalnız
# pişirme içindir: geçici kopyalardan, normali yönünde 5 cm içinde başka yüz bulunan (örtülü, görünmeyen) yüzler çıkarılır;
# AO bu kopyalara pişirilir (aynı UV_AO, aynı doku). Asıl mesh'ler değişmez.
bpy.context.view_layer.update()
dg = bpy.context.evaluated_depsgraph_get()
kopyalar, ortulu_say = [], 0
for o in ozgun.values():
    mw = o.matrix_world; nm = mw.to_3x3().inverted().transposed()
    sil = []
    for p in o.data.polygons:
        n = (nm @ p.normal).normalized(); c = mw @ p.center
        ok, *_ = sc.ray_cast(dg, c + n * 0.0005, n, distance=0.05)
        if ok: sil.append(p.index)
    k = o.copy(); k.data = o.data.copy(); k.name = '_ao_' + o.name; sc.collection.objects.link(k)
    if sil:
        bm = bmesh.new(); bm.from_mesh(k.data); bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[bm.faces[i] for i in sil], context='FACES_ONLY'); bm.to_mesh(k.data); bm.free()
    k.data.uv_layers.active = k.data.uv_layers['UV_AO']
    kopyalar.append(k); ortulu_say += len(sil)
rapor['ortulu_yuz_pisirmeden_cikan'] = ortulu_say
for o in yapi: o.hide_render = True
bpy.ops.object.select_all(action='DESELECT')
for k in kopyalar: k.select_set(True)
bpy.context.view_layer.objects.active = kopyalar[0]
t1 = time.time()
# use_clear=False: doku beyazla (1,0) başlar; pişirmeden çıkarılan örtülü yüzler siyah değil «açık» kalır
bpy.ops.object.bake(type='AO', margin=8, use_clear=False, target='IMAGE_TEXTURES')
print('BAKE yapi', f'{time.time() - t1:.0f}s', 'ortulu', ortulu_say)
for k in kopyalar:
    me_ = k.data; bpy.data.objects.remove(k); bpy.data.meshes.remove(me_)
for o in yapi: o.hide_render = False
for o in ozgun.values():  # dışa aktarımda TEXCOORD_0 ilk katman kalsın
    o.data.uv_layers.active = o.data.uv_layers[0]
    o.data.uv_layers[0].active_render = True

# ---------------- AO yumuşatma: 0,5 + 0,5 × AO ----------------
# Hedef (iş emri): en koyu ≈ 0,45–0,55, büyük düz yüz ≈ 0,95–1,0. Ham AO'da başka parçayla aynı düzlemdeki (çakışan) yüzler 0 çıkıyor
# ve çatıda siyah leke yapıyordu; doğrusal sıkıştırma hem hedefi tutturur hem bu lekeleri hafif griye indirir.
ham = np.array(ao_img.pixels[:], dtype=np.float32).reshape(N, N, 4)
ham_r = ham[:, :, 0].copy()
ham[:, :, :3] = 0.5 + 0.5 * ham[:, :, :3]
ao_img.pixels[:] = ham.ravel()
rapor['ao_ham'] = {'min': round(float(ham_r.min()), 3), 'ortanca': round(float(np.median(ham_r)), 3), 'sifira_yakin_oran': round(float((ham_r < 0.05).mean()), 3)}

# ---------------- AO istatistiği, kayıt ----------------
px = np.array(ao_img.pixels[:], dtype=np.float32).reshape(N, N, 4)[:, :, 0]
# kullanılan pikseller: UV adalarının içi (pişmemiş alan 1,0 kalır, bu yüzden < 0,999 olanlar + istatistik için ayrı)
dolu = px < 0.999
rapor['ao'] = {'atlas_px': N, 'mesafe_m': CFG['ao_m'], 'ornek': 128,
               'min': round(float(px.min()), 3), 'p01': round(float(np.percentile(px, 1)), 3), 'p05': round(float(np.percentile(px, 5)), 3),
               'ortanca': round(float(np.median(px)), 3), 'dolu_oran': round(float(dolu.mean()), 3)}
DOKU_EXP = os.path.join(URETIM, 'export', 'doku'); os.makedirs(DOKU_EXP, exist_ok=True)
ao_img.filepath_raw = os.path.join(DOKU_EXP, f'{AD}_{YENI}_ao.png'); ao_img.file_format = 'PNG'; ao_img.save()
print('AO', rapor['ao'])

# ---------------- glTF Material Output: Occlusion ----------------
grp = bpy.data.node_groups.get('glTF Material Output')
if grp is None:
    grp = bpy.data.node_groups.new('glTF Material Output', 'ShaderNodeTree')
    grp.interface.new_socket('Occlusion', in_out='INPUT', socket_type='NodeSocketFloat')
    grp.interface.new_socket('Thickness', in_out='INPUT', socket_type='NodeSocketFloat')
for ad, t in aod.items():
    nt = yapi_mat[ad].node_tree
    sep = nt.nodes.new('ShaderNodeSeparateColor'); sep.location = (-650, -500)
    g = nt.nodes.new('ShaderNodeGroup'); g.node_tree = grp; g.location = (-400, -500)
    nt.links.new(t.outputs['Color'], sep.inputs['Color']); nt.links.new(sep.outputs[0], g.inputs['Occlusion'])

# ---------------- Yer_Golgesi: AO pişir → RGBA ----------------
GN = 512 if max(x1 - x0, y1 - y0) < 60 else 1024
g_img = bpy.data.images.new('Yer_Golgesi_ao', GN, GN, alpha=False)
g_img.colorspace_settings.name = 'Non-Color'
gm = bpy.data.materials.new('Yer_Golgesi'); gm.use_nodes = True
golge.data.materials.append(gm)
gt = gm.node_tree.nodes.new('ShaderNodeTexImage'); gt.image = g_img; gm.node_tree.nodes.active = gt
sc.world.light_settings.distance = max(CFG['ao_m'], 4.0)
bpy.ops.object.select_all(action='DESELECT'); golge.select_set(True); bpy.context.view_layer.objects.active = golge
t1 = time.time()
bpy.ops.object.bake(type='AO', margin=4, use_clear=True, target='IMAGE_TEXTURES')
print('BAKE golge', f'{time.time() - t1:.0f}s')
a = np.array(g_img.pixels[:], dtype=np.float32).reshape(GN, GN, 4)[:, :, 0]
# kenarda sıfıra yumuşak iniş (dış 1,5 m)
xs = np.linspace(x0, x1, GN); ys = np.linspace(y0, y1, GN)
kenar = np.minimum.outer(np.minimum(ys - y0, y1 - ys), np.minimum(xs - x0, x1 - xs))
yum = np.clip(kenar / 1.5, 0, 1); yum = yum * yum * (3 - 2 * yum)
alfa = np.clip((1 - a) * 0.15, 0, 0.15) * yum
rgba = np.zeros((GN, GN, 4), dtype=np.float32); rgba[:, :, 3] = alfa
s_img = bpy.data.images.new(f'{AD}_{YENI}_yer_golgesi', GN, GN, alpha=True)
s_img.pixels[:] = rgba.ravel()
s_img.filepath_raw = os.path.join(DOKU_EXP, f'{AD}_{YENI}_yer_golgesi.png'); s_img.file_format = 'PNG'; s_img.save()
s_img.colorspace_settings.name = 'sRGB'
nt = gm.node_tree; nt.nodes.remove(gt)
bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
st = nt.nodes.new('ShaderNodeTexImage'); st.image = s_img
bsdf.inputs['Base Color'].default_value = (0, 0, 0, 1)
nt.links.new(st.outputs['Alpha'], bsdf.inputs['Alpha'])
bsdf.inputs['Roughness'].default_value = 1.0
gm.surface_render_method = 'BLENDED'; gm.use_backface_culling = True
golge.visible_shadow = False
rapor['yer_golgesi'].update({'px': GN, 'alfa_max': round(float(alfa.max()), 3), 'alfa_ort': round(float(alfa.mean()), 4)})

for o in gizli: o.hide_render = False

# ---------------- kaydet ----------------
bpy.ops.file.make_paths_relative()
BLEND = os.path.join(URETIM, 'blend', f'{AD}_{YENI}.blend')
bpy.ops.wm.save_as_mainfile(filepath=BLEND)
print('KAYDEDILDI', BLEND)

# ---------------- dışa aktarım (eski GLB'lerle aynı konum) ----------------
tum = [o for o in bpy.data.objects if o.type == 'MESH' and not o.name.startswith(('REF', '_'))]


def bb(o):
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return [min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)]


def kaydirma(hangi):
    bpy.context.view_layer.update()
    r = REFJ[hangi]
    en = max((o for o in tum if o.name in r), key=lambda o: len(o.data.vertices))
    mn_, _ = bb(en); g = r[en.name]
    return g['mn'][0] - mn_[0], -g['mx'][2] - mn_[1], g['mn'][1] - mn_[2], en.name


def disa(objs, yol, tx, ty, tz):
    for o in tum: o.location += Vector((tx, ty, tz))
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=yol, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_cameras=False, export_lights=False, export_image_format='AUTO')
    for o in tum: o.location -= Vector((tx, ty, tz))
    bpy.context.view_layer.update()


rapor['kaydirma'] = {}
for hangi, objs in (('app', yapi + [golge]), ('sunum', tum)):
    tx, ty, tz, ref = kaydirma(hangi)
    rapor['kaydirma'][hangi] = {'x': round(tx, 4), 'y': round(ty, 4), 'z': round(tz, 4), 'ref': ref}
    disa(objs, os.path.join(TMP, f'{hangi}_ham.glb'), tx, ty, tz)
json.dump(rapor, open(os.path.join(TMP, 'blender_rapor.json'), 'w'), ensure_ascii=False, indent=1, default=float)
print('BITTI', f'{time.time() - t0:.0f}s')
