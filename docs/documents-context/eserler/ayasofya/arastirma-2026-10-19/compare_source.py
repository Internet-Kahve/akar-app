import bpy,math,json
from pathlib import Path
from mathutils import Matrix
from mathutils.bvhtree import BVHTree
D=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(D.parent/'v20'/'ayasofya_v20.blend'))
o=bpy.data.objects['Ayasofya_v20'];m=o.data;v20=BVHTree.FromPolygons([v.co for v in m.vertices],[tuple(p.vertices) for p in m.polygons],all_triangles=True)
bpy.ops.import_scene.gltf(filepath='/Users/ksenophon/Desktop/3d-eser/ayasofya/img-ref5/ref5_dae_olcu.glb')
ref=[o for o in bpy.context.selected_objects if o.type=='MESH'][0]
DM=Matrix.Rotation(math.radians(-32.68),4,'Z') @ Matrix.Translation((-.3,-.6,0)) @ Matrix.Diagonal((1.32,1.32,59.8/52.7,1)) @ Matrix.Translation((-56.7,-43.2,0))
points=[DM @ v.co for v in ref.data.vertices];tree=BVHTree.FromPolygons(points,[tuple(p.vertices) for p in ref.data.polygons])
def measure(pts,bvh):
 ds=sorted(bvh.find_nearest(p)[3] for p in pts[::max(1,len(pts)//5000)])
 return {'samples':len(ds),'median_m':ds[len(ds)//2],'p95_m':ds[int(len(ds)*.95)],'maximum_m':max(ds),'within_1mm_percent':100*sum(d<.001 for d in ds)/len(ds)}
result={'old_reference_to_v20':measure(points,v20),'v20_to_old_reference':measure([v.co for v in m.vertices],tree)}
(D/'source_comparison.json').write_text(json.dumps(result,indent=2));print(json.dumps(result))
