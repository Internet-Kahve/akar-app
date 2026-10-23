import bpy, sys, json, mathutils
key, outdir = sys.argv[sys.argv.index('--') + 1:][:2]
ref = json.load(open(f'/private/tmp/claude-501/gt/bx/ref_{key}.json'))
allm = [o for o in bpy.data.objects if o.type == 'MESH' and not o.name.startswith(('REF', '_'))]
def bb(o):
    pts = [o.matrix_world @ mathutils.Vector(c) for c in o.bound_box]
    return [min(p[i] for p in pts) for i in range(3)], [max(p[i] for p in pts) for i in range(3)]
def shift(which):
    bpy.context.view_layer.update()
    r = ref[which]; best = None
    for o in allm:
        if o.name in r and (best is None or len(o.data.vertices) > len(best.data.vertices)): best = o
    mn, mx = bb(best); g = r[best.name]  # g.mn/mx gltf: x, y(up), z
    tx = g['mn'][0] - mn[0]; ty = -(g['mx'][2] - (-mn[1]))
    return tx, ty, best.name
def export(which, objs, path, tx, ty):
    for o in allm: o.location.x += tx; o.location.y += ty
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs: o.select_set(True)
    kw = dict(filepath=path, export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
    try: bpy.ops.export_scene.gltf(export_draco_mesh_compression_enable=True, **kw)
    except Exception: bpy.ops.export_scene.gltf(**kw)
    for o in allm: o.location.x -= tx; o.location.y -= ty
    bpy.context.view_layer.update()
ENV = ('Zemin', 'Cevre_', 'Olcek_Insan_', 'Avlu_Agac', 'Avlu_Cim')
tx, ty, nm = shift('app'); print('SHIFT app', tx, ty, nm); export('app', [o for o in allm if not o.name.startswith(ENV)], f'{outdir}/{key}_app.glb', tx, ty)
tx, ty, nm = shift('sunum'); print('SHIFT sunum', tx, ty, nm); export('sunum', allm, f'{outdir}/{key}_sunum.glb', tx, ty)
