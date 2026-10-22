"""Validate edited components and gallery/front-wall joins, independently of renders."""
import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Matrix
P=Path(__file__).parent;bpy.ops.wm.open_mainfile(filepath=str(P/'ayasofya_v22.blend'))
R=Matrix.Rotation(math.radians(32.68),4,'Z');d=json.loads((P.parent/'v21/base_geometry.json').read_text());report={'closed_supports':{},'gallery_front_errors_m':{},'scope':'Topology after welding coincident glTF normal/UV seam vertices (0.02 mm). Gallery gable interiors exclude the two endpoints abutting vertical party walls. New upper buttress bodies and flying arch bands; front edges of six gallery roof meshes. Not a whole-building architectural accuracy claim.'}
for o in bpy.data.objects:
 if o.type!='MESH':continue
 if o.name.startswith(('V22_Yuksek_Payanda_','V22_Ucan_Payanda_Kemer_')):
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00002);report['closed_supports'][o.name]={'boundary_edges':sum(e.is_boundary for e in bm.edges),'nonmanifold_edges':sum(not e.is_manifold for e in bm.edges)};bm.free()
 if o.name.startswith('V22_Galeri_Butun_Cati_'):
  vs=[R@o.matrix_world@v.co for v in o.data.vertices];positive=sum(v.y for v in vs)>0;outer=max(v.y for v in vs) if positive else min(v.y for v in vs);front=[v for v in vs if abs(v.y-outer)<.0001];x0=min(v.x for v in front);x1=max(v.x for v in front);segs=[]
  for face,mi in zip(d['faces'],d['material_indices']):
   if d['materials'][mi]!='Color_004':continue
   vv=[d['vertices'][i] for i in face]
   for a,b in zip(vv,vv[1:]+vv[:1]):
    if abs(a[1]-outer)<.005 and abs(b[1]-outer)<.005 and abs(a[0]-b[0])>.0001 and min(a[2],b[2])>18 and max(a[2],b[2])<25.6 and min(a[0],b[0])<=x1+.001 and max(a[0],b[0])>=x0-.001:segs.append((a,b))
  errors=[];excluded=0
  for v in front:
   if v.x<x0+.001 or v.x>x1-.001:
    excluded+=1;continue
   vals=[18.768]
   for a,b in segs:
    if min(a[0],b[0])-.0001<=v.x<=max(a[0],b[0])+.0001:vals.append(a[2]+(b[2]-a[2])*(v.x-a[0])/(b[0]-a[0]))
   errors.append(abs(v.z-max(vals)))
   if errors[-1]>.001:print('GAP',o.name,list(v),max(vals))
  report['gallery_front_errors_m'][o.name]={'vertices_checked':len(errors),'party_wall_endpoints_excluded':excluded,'max':max(errors)}
report['pass']=len(report['closed_supports'])==8 and all(v['nonmanifold_edges']==0 for v in report['closed_supports'].values()) and len(report['gallery_front_errors_m'])==6 and all(v['max']<.001 for v in report['gallery_front_errors_m'].values())
(P/'junction_validation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report,indent=2))
