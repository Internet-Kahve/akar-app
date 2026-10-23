import bpy,math,json
from pathlib import Path
from mathutils import Vector,Matrix
D=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(D.parent/'v20'/'ayasofya_v20.blend'))
s=bpy.context.scene;s.cycles.samples=32;s.render.resolution_x=1500;s.render.resolution_y=1200
cam=s.camera;cam.location=(0,-12,250);cam.rotation_euler=(0,0,math.radians(57.32));cam.data.ortho_scale=205
s.render.filepath=str(D/'model_ust.png');bpy.ops.render.render(write_still=True)
# Match the southwest/front reading of the real photo, without claiming calibration.
target=Vector((0,-5,28));cam.location=Vector((-35,-230,90));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=180
s.render.filepath=str(D/'model_cephe.png');bpy.ops.render.render(write_still=True)
# Close inspection of crossing roof planes in local north-side galleries.
target=Matrix.Rotation(math.radians(-32.68),4,'Z') @ Vector((0,26,22));cam.location=target+Vector((60,110,65));cam.rotation_euler=(target-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.ortho_scale=65
s.render.filepath=str(D/'model_cati_birlesim.png');bpy.ops.render.render(write_still=True)
