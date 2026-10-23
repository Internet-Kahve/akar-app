import bpy,math,json,hashlib,sys
from pathlib import Path
from mathutils import Matrix,Vector
P=Path(__file__).parent
bpy.ops.wm.open_mainfile(filepath=str(P/'ayasofya_v24.blend'))
for o in list(bpy.data.objects):
 if o.name.startswith('V24_'):bpy.data.objects.remove(o,do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(P/'ayasofya_v24.glb'))
obs=list(bpy.context.selected_objects);r=Matrix.Rotation(math.radians(32.68),4,'Z');report={'nonfinite_vertices':0,'degenerate_triangles':0,'triangles':0,'minarets':{}}
intervals={'tugla':[],'tas':[]}
for o in obs:
 if o.type!='MESH':continue
 m=o.data;m.calc_loop_triangles();v=[r@o.matrix_world@p.co for p in m.vertices]
 report['nonfinite_vertices']+=sum(not all(math.isfinite(c) for c in p) for p in v)
 for t in m.loop_triangles:
  report['triangles']+=1;report['degenerate_triangles']+=t.area<1e-10
  pts=[v[i] for i in t.vertices]
  for label,x,y in [('tugla',56.089,-38.294),('tas',56.62,37.932)]:
   if all(abs(p.x-x)<3 and abs(p.y-y)<3 and p.z>=28 for p in pts):intervals[label].append((min(p.z for p in pts),max(p.z for p in pts)))
for label,spans in intervals.items():
 spans.sort();end=spans[0][1];gaps=[]
 for a,b in spans[1:]:
  if a>end+.001:gaps.append([end,a])
  end=max(end,b)
 report['minarets'][label]={'vertical_coverage_gaps_over_1mm':gaps,'checked_height':[spans[0][0],end],'limitation':'Vertical coverage plus close render; not a watertightness proof.'}
report['sha256']=hashlib.sha256((P/'ayasofya_v24.glb').read_bytes()).hexdigest()
(P/'validation.json').write_text(json.dumps(report,indent=2))
s=bpy.context.scene;s.cycles.samples=16;s.render.resolution_x=1400;s.render.resolution_y=1050;s.render.resolution_percentage=70
R=r.inverted()
for name,pos,target,scale in [
 ('genel',(160,-190,160),(0,-12,25),205),
 ('galeri',(5,-150,92),(0,-23,28),105),
 ('ince_minare_tugla',(115,-88,55),(56,-38.294,46),60),
 ('ince_minare_tas',(115,-12,55),(56,37.932,46),60),
 ('bati_giris',(-150,65,85),(-55,0,17),100)]:
 if '--minarets' in sys.argv and not name.startswith('ince_minare'):continue
 s.render.resolution_x=1000 if name.startswith('ince_minare') else 1400
 s.render.resolution_y=1200 if name.startswith('ince_minare') else 1050
 pos=R@Vector(pos);target=R@Vector(target);bpy.ops.object.camera_add(location=pos);c=bpy.context.object;c.rotation_euler=(target-pos).to_track_quat('-Z','Y').to_euler();c.data.type='ORTHO';c.data.ortho_scale=scale;s.camera=c;s.render.filepath=str(P/'renders'/f'{name}.png');bpy.ops.render.render(write_still=True)
print(report)
