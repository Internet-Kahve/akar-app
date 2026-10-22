import bpy,json,math
from pathlib import Path
from mathutils import Vector
P=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(P/'ayasofya_v22.blend'))
for o in list(bpy.data.objects):
 if o.name.startswith('V22_'):bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(P/'ayasofya_v22.glb'))
obs=list(bpy.context.selected_objects); report={'objects':len(obs),'triangles':0,'vertices':0,'nonfinite_vertices':0,'degenerate_triangles':0}
for o in obs:
 if o.type!='MESH':continue
 m=o.data;m.calc_loop_triangles();report['vertices']+=len(m.vertices);report['triangles']+=len(m.loop_triangles)
 report['nonfinite_vertices']+=sum(not all(math.isfinite(c) for c in v.co) for v in m.vertices)
 report['degenerate_triangles']+=sum(t.area<1e-10 for t in m.loop_triangles)
sc=bpy.context.scene;sc.cycles.samples=16;sc.camera=bpy.data.objects['Camera_guneydogu'];sc.render.filepath=str(P/'renders/glb_kontrol.png');bpy.ops.render.render(write_still=True)
# Roof overview with the imported deliverable.
bpy.ops.object.camera_add(location=(0,0,240));cam=bpy.context.object;cam.rotation_euler=(Vector((0,0,0))-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=205;sc.camera=cam;sc.render.filepath=str(P/'renders/ust.png');bpy.ops.render.render(write_still=True)
(P/'validation.json').write_text(json.dumps(report,indent=2));print(report)
