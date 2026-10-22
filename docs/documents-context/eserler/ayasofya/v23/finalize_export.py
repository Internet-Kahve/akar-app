"""Remove triangles collapsed by glTF float conversion; sync editable scene to delivery."""
import bpy,bmesh
from pathlib import Path
P=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(P/'ayasofya_v23.blend'))
for o in list(bpy.data.objects):
 if o.name.startswith('V23_'):bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(P/'ayasofya_v23.glb'));obs=list(bpy.context.selected_objects)
removed=0
for o in obs:
 if o.type!='MESH':continue
 m=o.data;m.calc_loop_triangles();bad={t.polygon_index for t in m.loop_triangles if t.area<1e-10}
 if bad:
  bm=bmesh.new();bm.from_mesh(m);bm.faces.ensure_lookup_table();bmesh.ops.delete(bm,geom=[bm.faces[i] for i in bad],context='FACES');bm.to_mesh(m);bm.free();removed+=len(bad)
bpy.ops.export_scene.gltf(filepath=str(P/'ayasofya_v23.glb'),export_format='GLB',use_selection=True,export_apply=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(P/'ayasofya_v23.blend'),compress=True)
print('Collapsed export triangles removed:',removed)
