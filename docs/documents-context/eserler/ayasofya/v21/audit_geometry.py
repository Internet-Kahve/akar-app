import bpy,bmesh,json,math
from pathlib import Path
from collections import Counter,defaultdict
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.geometry import intersect_point_tri
D=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(D/'ayasofya_v21.blend'))
bpy.ops.object.select_all(action='DESELECT')
for ob in bpy.data.objects:
 if ob.type=='MESH' and ob.name.startswith('V21_'):ob.select_set(True)
bpy.context.view_layer.objects.active=bpy.context.selected_objects[0]
bpy.ops.object.join()
o=bpy.context.object
bpy.ops.object.transform_apply(location=True,rotation=True,scale=True)
m=o.data;m.calc_loop_triangles();verts=[v.co.copy() for v in m.vertices];tris=[tuple(t.vertices) for t in m.loop_triangles]
bm=bmesh.new();bm.from_mesh(m)
stats={'vertices':len(verts),'triangles':len(tris),'boundary_edges':sum(e.is_boundary for e in bm.edges),'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges)}
adj=defaultdict(list)
for e in m.edges: a,b=e.vertices;adj[a].append(b);adj[b].append(a)
remaining=set(range(len(verts)));components=[]
while remaining:
 seed=remaining.pop();stack=[seed];comp=[seed]
 while stack:
  for j in adj[stack.pop()]:
   if j in remaining:remaining.remove(j);stack.append(j);comp.append(j)
 components.append(comp)
stats['connected_components']=len(components);stats['largest_components_vertices']=sorted(map(len,components),reverse=True)[:20]
bvh=BVHTree.FromPolygons(verts,tris,all_triangles=True)
pairs=bvh.overlap(bvh);crossings=[]
def intersection(a,b):
 pts=[];normal=(b[1]-b[0]).cross(b[2]-b[0]).normalized()
 distances=[normal.dot(v-b[0]) for v in a]
 if max(abs(d) for d in distances)<.0001:return []
 for k in range(3):
  j=(k+1)%3;d,e=distances[k],distances[j]
  if d*e < -1e-10:
   p=a[k]+(a[j]-a[k])*(d/(d-e))
   if intersect_point_tri(p,*b):pts.append(p)
 return pts
for i,j in pairs:
 if i>=j or set(tris[i])&set(tris[j]):continue
 a=[verts[v] for v in tris[i]];b=[verts[v] for v in tris[j]]
 pts=intersection(a,b)+intersection(b,a)
 if len(pts)<2:continue
 p,q=max(((p,q) for p in pts for q in pts),key=lambda pq:(pq[0]-pq[1]).length)
 length=(p-q).length
 if length<.05:continue
 center=(p+q)/2;visible=[]
 for name in ['guneydogu','kuzeydogu','kuzeybati','guneybati']:
  origin=bpy.data.objects['Camera_'+name].location;direction=center-origin;hit=bvh.ray_cast(origin,direction.normalized(),direction.length+.02)
  if hit[0] and abs(hit[3]-direction.length)<.08:visible.append(name)
 if visible:crossings.append({'triangles':[i,j],'length_m':round(length,3),'center':list(center),'views':visible,'materials':[m.materials[m.polygons[m.loop_triangles[t].polygon_index].material_index].name for t in (i,j)]})
stats['visible_crossing_segments']=len(crossings);stats['crossings']=sorted(crossings,key=lambda c:-c['length_m'])[:100]
(D/'geometry_audit.json').write_text(json.dumps(stats,indent=2));print(json.dumps({k:v for k,v in stats.items() if k!='crossings'}),flush=True)
