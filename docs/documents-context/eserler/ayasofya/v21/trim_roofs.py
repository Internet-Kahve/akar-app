"""Trim roof triangles to their upper envelope; preserve source UV by barycentric mapping."""
import sys,json
from pathlib import Path
sys.path.insert(0,'/tmp/ayasofya_geometry_tools')
import numpy as np
from shapely.geometry import Polygon
from shapely.strtree import STRtree
from shapely import constrained_delaunay_triangles
P=Path(__file__).parent;d=json.loads((P/'base_geometry.json').read_text());V=np.array(d['vertices']); records=[]
for i,(face,mi) in enumerate(zip(d['faces'],d['material_indices'])):
 t=V[face];n=np.cross(t[1]-t[0],t[2]-t[0]);c=t.mean(axis=0)
 if d['materials'][mi]=='Color_004' and abs(n[2])>1e-5 and -45<c[0]<45 and abs(c[1])<49 and 17<c[2]<42:
  poly=Polygon(t[:,:2]);plane=np.linalg.solve(np.c_[t[:,:2],np.ones(3)],t[:,2]);records.append((i,poly,plane,t))
tree=STRtree([r[1] for r in records]);out=[];changed=0
for k,(i,p,a,t) in enumerate(records):
 result=p
 for j in tree.query(p):
  if j==k:continue
  _,q,b,_=records[j];over=p.intersection(q)
  if over.area<1e-7:continue
  delta=b-a
  if np.linalg.norm(delta[:2])<1e-9:
   if delta[2]>1e-5 or (abs(delta[2])<1e-5 and j<k):result=result.difference(q)
   continue
  # clip a large square against the affine height difference
  pts=[(-300,-300),(300,-300),(300,300),(-300,300)];cl=[]
  for s,e in zip(pts,pts[1:]+pts[:1]):
   ds=np.dot(delta,[*s,1])-1e-6;de=np.dot(delta,[*e,1])-1e-6
   if ds>=0:cl.append(s)
   if (ds>=0)!=(de>=0):cl.append(tuple(np.array(s)+(np.array(e)-s)*ds/(ds-de)))
  if len(cl)>=3:result=result.difference(q.intersection(Polygon(cl)))
 if abs(result.area-p.area)>1e-6:changed+=1
 uv=np.array(d['uvs'][i]); inv=np.linalg.inv(np.c_[t[:,:2],np.ones(3)])
 for tri in constrained_delaunay_triangles(result).geoms:
  if tri.area<1e-8 or tri.difference(result).area>1e-8:continue
  xy=np.array(tri.exterior.coords)[:3];h=np.c_[xy,np.ones(3)];out.append({'v':np.c_[xy,h@a].tolist(),'uv':(h@inv@uv).tolist(),'m':d['material_indices'][i]})
(P/'trimmed_roofs.json').write_text(json.dumps({'removed':[r[0] for r in records],'triangles':out,'changed':changed}))
print('roof triangles',len(records),'trimmed',changed,'result',len(out))
