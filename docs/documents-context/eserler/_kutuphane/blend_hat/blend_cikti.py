"""AKAR · blend_hat (29 Ekim 2026): uygulama modellerinin Blender kaynağı → GLB. Tek doğruluk kaynağı: blend + _kutuphane/malzeme-paleti.json.

Yapılan (Blender içinde):
  1) Renk: eser_malzeme'deki her malzeme için
       - eser_doku'da dokusu varsa o doku (doku_palet_v2) bağlanır; doku × renk düğümlü malzemede (kurşun) renk düğümü rol hex'i olur;
       - düz malzemede renk düğümü rol hex'i olur (eser_istisna önce). Kodda renk sabiti yok.
     Paletin dışındaki malzemeler blend'deki renginde kalır.
  2) «Yer_Golgesi» nesnesi, mesh'i, malzemesi ve resimleri silinir (yer gölgesini web çiziyor).
  3) Pişmiş AO (UV_AO + glTF Material Output/Occlusion) blend'de kalır; yeniden pişirilmez. Küçültme ve JPEG blend_son.mjs'de.
  4) Kaydet: ../blend/<ad>_<yeni>.blend; dışa aktar: ham uygulama ve sunum GLB'si (konum: ref.json'daki şimdiki GLB'lerle aynı).
Sonra: node blend_son.mjs (AO tek kanal JPEG q80, COLOR_0 ve sıfır alanlı üçgen temizliği, Draco) ve glb_temizle.mjs. build_vXX.py hepsini sırayla çağırır.

Kullanım: Blender -b <girdi.blend> --python blend_cikti.py -- <eser> <yeni> <ref.json> <ham klasörü>
"""
import bpy, sys, os, json
import numpy as np
from mathutils import Vector

ESER, YENI, REF, HAM = sys.argv[sys.argv.index('--') + 1:][:4]
AY = os.path.dirname(os.path.abspath(__file__)); KUT = os.path.dirname(AY)
URETIM = os.path.join(os.path.dirname(KUT), ESER, '3d')
PAL = json.load(open(os.path.join(KUT, 'malzeme-paleti.json')))
AD = json.load(open(os.path.join(AY, 'eserler.json')))[ESER]['ad']
REFJ = json.load(open(REF))
os.makedirs(HAM, exist_ok=True)
rapor = {'eser': ESER, 'surum': YENI, 'girdi': os.path.basename(bpy.data.filepath), 'renk': {}, 'uyari': []}


def lin(v): return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
def hex2lin(h): return [lin(int(h[i:i + 2], 16) / 255) for i in (1, 3, 5)]


ESL = PAL['eser_malzeme'].get(ESER, {}); IST = PAL.get('eser_istisna', {}).get(ESER, {}); DOK = PAL.get('eser_doku', {}).get(ESER, {})


def rol_hex(rol): return IST.get(rol) or PAL[rol]['hex']


def taban(m):
    """Base Color'a giden zincir: (dokü düğümü, renk düğümü)."""
    nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED')
    l = bsdf.inputs['Base Color'].links
    if not l: return None, None, bsdf
    n = l[0].from_node
    if n.type == 'MIX':   # (A) × köşe rengi
        a = next((x.from_node for x in nt.links if x.to_node == n and x.to_socket.identifier.startswith('A')), None)
        n = a
    if n is None: return None, None, bsdf
    if n.type == 'TEX_IMAGE': return n, None, bsdf
    if n.type == 'RGB': return None, n, bsdf
    if n.type == 'MIX':   # doku × renk
        t = next((x.from_node for x in nt.links if x.to_node == n and x.from_node.type == 'TEX_IMAGE'), None)
        r = next((x.from_node for x in nt.links if x.to_node == n and x.from_node.type == 'RGB'), None)
        return t, r, bsdf
    return None, None, bsdf


for ad, rol in ESL.items():
    m = bpy.data.materials.get(ad)
    if m is None: rapor['uyari'].append(f'palette var, blendde yok: {ad}'); continue
    rr = rol if isinstance(rol, str) else rol['rol']
    t, r, bsdf = taban(m); kayit = {'rol': rr}
    if ad in DOK:
        if t is None: rapor['uyari'].append(f'{ad}: paletteki doku için doku düğümü yok'); continue
        yol = os.path.join(URETIM, DOK[ad]); img = bpy.data.images.load(yol, check_existing=True); img.colorspace_settings.name = 'sRGB'
        t.image = img; kayit['doku'] = DOK[ad]
        if r is not None:
            r.outputs[0].default_value = (*hex2lin(rol_hex(rr)), 1.0); kayit['renk'] = rol_hex(rr)
    else:
        if t is not None and r is None:
            rapor['uyari'].append(f'{ad}: dokulu ama palette dokusu yok; değiştirilmedi'); continue
        h = rol_hex(rr)
        if r is not None: r.outputs[0].default_value = (*hex2lin(h), 1.0)
        else: bsdf.inputs['Base Color'].default_value = (*hex2lin(h), 1.0)
        kayit['renk'] = h
    rapor['renk'][ad] = kayit

# Yer_Golgesi
for o in [o for o in bpy.data.objects if o.name.startswith('Yer_Golgesi')]:
    me = o.data; bpy.data.objects.remove(o); bpy.data.meshes.remove(me); rapor['yer_golgesi'] = 'silindi'
for m in [m for m in bpy.data.materials if m.name.startswith('Yer_Golgesi')]: bpy.data.materials.remove(m)
for i in [i for i in bpy.data.images if 'yer_golgesi' in i.name.lower() or i.name.startswith('Yer_Golgesi')]: bpy.data.images.remove(i)
bpy.data.orphans_purge(do_recursive=True)

bpy.ops.file.make_paths_relative()
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(URETIM, 'blend', f'{AD}_{YENI}.blend'))

# dışa aktarım (şimdiki GLB'lerle aynı konum)
tum = [o for o in bpy.data.objects if o.type == 'MESH' and not o.name.startswith(('REF', '_'))]


def bb(o):
    p = [o.matrix_world @ Vector(c) for c in o.bound_box]
    return [min(q[i] for q in p) for i in range(3)], [max(q[i] for q in p) for i in range(3)]


def kaydirma(h):
    bpy.context.view_layer.update(); r = REFJ[h]
    en = max((o for o in tum if o.name in r), key=lambda o: len(o.data.vertices)); mn, _ = bb(en); g = r[en.name]
    return g['mn'][0] - mn[0], -g['mx'][2] - mn[1], g['mn'][1] - mn[2]


def disa(objs, yol, k):
    for o in tum: o.location += Vector(k)
    bpy.context.view_layer.update(); bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=yol, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
                              export_cameras=False, export_lights=False, export_image_format='AUTO')
    for o in tum: o.location -= Vector(k)
    bpy.context.view_layer.update()


app = [o for o in tum if o.name in REFJ['app']]
for h, objs in (('app', app), ('sunum', tum)):
    k = kaydirma(h); rapor.setdefault('kaydirma', {})[h] = [round(x, 4) for x in k]
    disa(objs, os.path.join(HAM, f'{h}_ham.glb'), k)
json.dump(rapor, open(os.path.join(HAM, 'blend_rapor.json'), 'w'), ensure_ascii=False, indent=1)
print('BITTI', json.dumps(rapor['uyari'], ensure_ascii=False))
