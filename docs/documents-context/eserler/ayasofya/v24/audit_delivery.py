"""Read-only audit of the delivered GLB. Run with Blender --background --python.
Open roof sheets and ornamental curves are intentional; manifold checks apply
only to the four newly built structural arch bands, after welding UV seams.
"""
import bpy, bmesh, hashlib, json, math, struct
from pathlib import Path
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

P = Path(__file__).resolve().parent
asset = P / 'ayasofya_v24.glb'
raw = asset.read_bytes()
magic, version, total = struct.unpack_from('<4sII', raw)
size, kind = struct.unpack_from('<II', raw, 12)
doc = json.loads(raw[20:20 + size])
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=str(asset))
r = Matrix.Rotation(math.radians(32.68), 4, 'Z')
report = {
    'sha256': hashlib.sha256(raw).hexdigest(),
    'valid_glb_header': magic == b'glTF' and version == 2 and total == len(raw) and kind == 0x4E4F534A,
    'external_resources': [v['uri'] for key in ('buffers', 'images') for v in doc.get(key, []) if 'uri' in v and not v['uri'].startswith('data:')],
    'nonfinite_vertices': 0, 'degenerate_triangles': 0,
    'duplicate_triangles': 0, 'triangles': 0, 'closed_arches': {},
    'roof_side_join_samples': [],
}
seen = set()
vertices, triangles = [], []
for o in bpy.context.scene.objects:
    if o.type != 'MESH':
        continue
    m = o.data
    m.calc_loop_triangles()
    vs = [r @ o.matrix_world @ v.co for v in m.vertices]
    report['nonfinite_vertices'] += sum(not all(math.isfinite(c) for c in v) for v in vs)
    base = len(vertices)
    vertices.extend(vs)
    for t in m.loop_triangles:
        pts = [vs[i] for i in t.vertices]
        report['triangles'] += 1
        report['degenerate_triangles'] += (pts[1]-pts[0]).cross(pts[2]-pts[0]).length / 2 < 1e-10
        key = tuple(sorted(tuple(round(c, 4) for c in v) for v in pts))
        report['duplicate_triangles'] += key in seen
        seen.add(key)
        triangles.append(tuple(base+i for i in t.vertices))
    if o.name.startswith('V24_Ucan_Payanda_Kemer_'):
        bm = bmesh.new()
        bm.from_mesh(m)
        bmesh.ops.remove_doubles(bm, verts=list(bm.verts), dist=.00002)
        report['closed_arches'][o.name] = {'nonmanifold_edges': sum(not e.is_manifold for e in bm.edges), 'signed_volume': bm.calc_volume()}
        bm.free()
bvh = BVHTree.FromPolygons(vertices, triangles, all_triangles=True)
for y in (-17.839, 16.481):
    for x in (-47, -45, -43):
        z = 20.408 + (x+48.744)*2.854/6.6/2
        hit = bvh.ray_cast(Vector((x, y-.05, z)), Vector((0, 1, 0)), .1)
        report['roof_side_join_samples'].append({'position': [x, y, z], 'surface_present': hit[0] is not None})
report['pass'] = (
    report['valid_glb_header'] and not report['external_resources']
    and all(report[k] == 0 for k in ('nonfinite_vertices', 'degenerate_triangles', 'duplicate_triangles'))
    and len(report['closed_arches']) == 4
    and all(v['nonmanifold_edges'] == 0 and v['signed_volume'] > 0 for v in report['closed_arches'].values())
    and all(v['surface_present'] for v in report['roof_side_join_samples'])
)
report['scope'] = 'Technical delivery audit and six sampled roof joins; not whole-building watertightness or historical accuracy certification.'
(P / 'delivery_audit.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
if not report['pass']:
    raise RuntimeError('Delivery audit failed')
