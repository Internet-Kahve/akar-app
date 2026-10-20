import bpy,json,math
from pathlib import Path
from mathutils import Vector
D=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(D/'ayasofya_v20.blend'))
source=bpy.data.objects['Ayasofya_v20'];before=len(source.data.polygons)
bpy.data.objects.remove(source,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(D/'ayasofya_v20.glb'))
models=[o for o in bpy.context.selected_objects if o.type=='MESH']
triangles=sum(len(o.data.loop_triangles) for o in models)
for o in models:o.data.calc_loop_triangles()
triangles=sum(len(o.data.loop_triangles) for o in models)
assert triangles==before,(triangles,before)
assert all(math.isfinite(c) for o in models for v in o.data.vertices for c in v.co)
textures=[im for im in bpy.data.images if im.type=='IMAGE']
sc=bpy.context.scene;sc.camera=bpy.data.objects['Camera_guneydogu'];sc.cycles.samples=40
sc.render.filepath=str(D/'renders'/'glb_kontrol.png');bpy.ops.render.render(write_still=True)
cam=sc.camera;target=Vector((0,0,42));cam.location=target+Vector((1,-1,.5)).normalized()*180;cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=85
sc.render.filepath=str(D/'renders'/'detay.png');bpy.ops.render.render(write_still=True)
report={'glb_roundtrip':'PASS','triangles':triangles,'finite_coordinates':True,'mesh_count':len(models),'materials':sum(len(o.data.materials) for o in models)}
(D/'glb_dogrulama.json').write_text(json.dumps(report,indent=2))
