import bpy,math
from pathlib import Path
from mathutils import Matrix,Vector
P=Path(__file__).parent;bpy.ops.wm.open_mainfile(filepath=str(P/'ayasofya_v22.blend'));R=Matrix.Rotation(math.radians(-32.68),4,'Z');sc=bpy.context.scene;sc.cycles.samples=24;sc.render.resolution_x=1400;sc.render.resolution_y=1000
for name,pos,target,scale in [('giris_detay',(-115,55,48),(-60,0,13),72),('galeri_detay',(5,120,65),(0,24,28),83)]:
 pos=R@Vector(pos);target=R@Vector(target);bpy.ops.object.camera_add(location=pos);c=bpy.context.object;c.rotation_euler=(target-pos).to_track_quat('-Z','Y').to_euler();c.data.type='ORTHO';c.data.ortho_scale=scale;sc.camera=c;sc.render.filepath=str(P/'renders'/f'{name}.png');bpy.ops.render.render(write_still=True)
