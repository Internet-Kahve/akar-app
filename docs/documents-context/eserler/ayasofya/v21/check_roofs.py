import json,sys
from pathlib import Path
sys.path.insert(0,'/tmp/ayasofya_geometry_tools')
import numpy as np
from shapely.geometry import Polygon
from shapely.strtree import STRtree
p=Path(__file__).parent;d=json.loads((p/'trimmed_roofs.json').read_text());ts=[np.array(t['v']) for t in d['triangles']];ps=[Polygon(t[:,:2]) for t in ts];tree=STRtree(ps);cross=0;overlaps=0
for i,t in enumerate(ts):
 a=np.linalg.solve(np.c_[t[:,:2],np.ones(3)],t[:,2])
 for j in tree.query(ps[i]):
  if j<=i:continue
  ov=ps[i].intersection(ps[j])
  if ov.area<1e-6:continue
  overlaps+=1;b=np.linalg.solve(np.c_[ts[j][:,:2],np.ones(3)],ts[j][:,2]);coords=np.array(ov.convex_hull.exterior.coords);dif=np.c_[coords,np.ones(len(coords))]@(a-b)
  if min(dif)<-.001 and max(dif)>.001:cross+=1
report={'roof_triangles':len(ts),'projected_overlap_pairs_over_1e_minus_6_m2':overlaps,'crossings_over_1mm':cross,'scope':'Only rebuilt roof surface; excludes vertical fascias, facades, ornaments and other parts.'};(p/'roof_validation.json').write_text(json.dumps(report,indent=2));print(report)
