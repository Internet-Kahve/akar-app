import bpy,json,math
from pathlib import Path
from collections import defaultdict
from mathutils import Matrix
D=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(D.parent/'v20/ayasofya_v20.blend'))
o=bpy.data.objects['Ayasofya_v20'];m=o.data;rot=Matrix.Rotation(math.radians(32.68),4,'Z');vs=[rot @ v.co for v in m.vertices]
raw={'vertices':[list(v) for v in vs],'faces':[list(p.vertices) for p in m.polygons],'materials':[ma.name for ma in m.materials],'material_indices':[p.material_index for p in m.polygons],'uvs':[[list(m.uv_layers.active.data[l].uv) for l in p.loop_indices] for p in m.polygons]}
(D/'base_geometry.json').write_text(json.dumps(raw))
adj=defaultdict(list)
for e in m.edges:a,b=e.vertices;adj[a].append(b);adj[b].append(a)
remaining=set(range(len(vs)));cs=[]
while remaining:
 seed=remaining.pop();stack=[seed];comp=[seed]
 while stack:
  for j in adj[stack.pop()]:
   if j in remaining:remaining.remove(j);stack.append(j);comp.append(j)
 if len(comp)>300:
  cs.append({'vertices':len(comp),'min':[round(min(vs[j][i] for j in comp),3) for i in range(3)],'max':[round(max(vs[j][i] for j in comp),3) for i in range(3)]})
print('COMPONENTS',json.dumps(cs),flush=True)
for ma,mat in enumerate(m.materials):
 ps=[p for p in m.polygons if p.material_index==ma];ids=set(v for p in ps for v in p.vertices)
 print(mat.name,len(ps),'bounds',[round(min(vs[j][i] for j in ids),2) for i in range(3)],[round(max(vs[j][i] for j in ids),2) for i in range(3)],flush=True)
for label,cond in [('main',lambda v:abs(v.x)<16.5 and abs(v.y)<16.5 and v.z>40),('halfeast',lambda v:17<v.x<35 and abs(v.y)<16 and v.z>30),('gallery',lambda v:abs(v.x)<12 and 18<v.y<33 and v.z>18)]:
 pts=[v for v in vs if cond(v)];print(label,sorted(set(round(v.z,2) for v in pts)),flush=True)
