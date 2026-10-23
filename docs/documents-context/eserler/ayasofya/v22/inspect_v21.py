import bpy,math
from pathlib import Path
from mathutils import Matrix,Vector
P=Path(__file__).parent; (P/'inspection').mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'v21/ayasofya_v21.blend'))
for o in bpy.data.objects:
 if o.type=='MESH' and o.name.startswith('V21_'):o.matrix_world=Matrix.Rotation(math.radians(32.68),4,'Z')@o.matrix_world
sc=bpy.context.scene;sc.cycles.samples=12;sc.render.resolution_x=1600;sc.render.resolution_y=1000
for name,pos,target,scale in [('north',(0,180,70),(0,15,23),125),('west',(-180,0,65),(-35,0,20),110),('top',(0,0,230),(0,0,0),180)]:
 bpy.ops.object.camera_add(location=pos);c=bpy.context.object;c.rotation_euler=(Vector(target)-c.location).to_track_quat('-Z','Y').to_euler();c.data.type='ORTHO';c.data.ortho_scale=scale;sc.camera=c;sc.render.filepath=str(P/'inspection'/f'{name}.png');bpy.ops.render.render(write_still=True)
