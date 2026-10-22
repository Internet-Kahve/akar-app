"""Conservative photo-guided corrections; no uncalibrated global rescaling."""
import bpy, bmesh, math, json
from pathlib import Path
from mathutils import Matrix
P=Path(__file__).resolve().parent
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'v23/ayasofya_v23.blend'))
R=Matrix.Rotation(math.radians(32.68),4,'Z')
parts=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('V23_')]
for o in parts:
 o.data.transform(R@o.matrix_world);o.matrix_world=Matrix.Identity(4);o.name=o.name.replace('V23_','V24_',1)
report={'source':'v23','global_scale_changed':False,'corrections':[]}
def replace_mesh(o,verts,faces,smooth=False):
 mats=list(o.data.materials);old=o.data;me=bpy.data.meshes.new(o.name+'_Geometry');me.from_pydata(verts,[],faces);me.update();o.data=me
 for m in mats:me.materials.append(m)
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bmesh.ops.triangulate(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free()
 for p in me.polygons:p.use_smooth=smooth
 if old.users==0:bpy.data.meshes.remove(old)
# A spherical segment reaches the drum with a sloping tangent, unlike V23's
# half-ellipsoid whose tangent is vertical at the eave. Preserve rim and apex.
cx,cy,z0,r,h=-.1375,-.6635,45.9,17.14,8.16
sphere=(r*r+h*h)/(2*h)
def height(rho):return math.sqrt(max(0,sphere*sphere-rho*rho))-(sphere-h)
o=bpy.data.objects['V24_Ana_Kubbe']
for v in o.data.vertices:
 rho=math.hypot(v.co.x-cx,v.co.y-cy);v.co.z=z0+height(min(r,rho))
o.data.update()
old=bpy.data.objects['V24_Ana_Kubbe_Derz'];material=old.data.materials[0]
parts.remove(old);bpy.data.objects.remove(old,do_unlink=True)
cu=bpy.data.curves.new('V24_Ana_Kubbe_Derz','CURVE');cu.dimensions='3D';cu.bevel_depth=.024;cu.bevel_resolution=1
for i in range(40):
 angle=2*math.pi*i/40;spline=cu.splines.new('POLY');spline.points.add(64)
 for j,p in enumerate(spline.points):
  rho=r*(1-j/64);p.co=(cx+rho*math.cos(angle),cy+rho*math.sin(angle),z0+height(rho)+.027,1)
o=bpy.data.objects.new('V24_Ana_Kubbe_Derz',cu);bpy.context.collection.objects.link(o);cu.materials.append(material)
bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH');parts.append(bpy.context.object)
report['corrections'].append('Main dome spherical-cap profile; original 34.28 m outer rim and 54.06 m apex retained; 40 seams rebuilt on the new shell.')
# Reference west buttresses have pointed rather than sinusoidal intrados.
# Two circular arcs meet at the apex; retain outer silhouette and attachment.
for o in parts:
 if not o.name.startswith('V24_Ucan_Payanda_Kemer_'):continue
 lo=min(v.co.y for v in o.data.vertices);hi=max(v.co.y for v in o.data.vertices)
 a,b=-70,-55.344;L=b-a;rise=5.1;spring=6.93
 center=(rise*rise+(L/2)**2)/L
 lower=[]
 for j in range(65):
  t=j/64;u=L*min(t,1-t)
  lower.append((a+L*t,spring+math.sqrt(max(0,center*center-(u-center)**2))))
 profile=[(a,14),(b,17.554)]+list(reversed(lower));n=len(profile)
 verts=[(x,y,z) for y in (lo,hi) for x,z in profile]
 faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 replace_mesh(o,verts,faces)
report['corrections'].append('Four west buttress intrados rebuilt as paired circular pointed arches, preserving supports and roof caps.')
# Eaves must follow each tomb's actual wall footprint; V23 used a regular
# octagon even for chamfered-square and irregular footprints, producing ledges.
for label in ('Selim_II','Murad_III','Mehmed_III'):
 body=bpy.data.objects['V24_'+label+'_Gövde'];eave=bpy.data.objects['V24_'+label+'_Sacak']
 pts=set((round(v.co.x,4),round(v.co.y,4)) for v in body.data.vertices)
 x=sum(a for a,b in pts)/len(pts);y=sum(b for a,b in pts)/len(pts)
 outline=sorted(pts,key=lambda q:math.atan2(q[1]-y,q[0]-x))
 top=max(v.co.z for v in body.data.vertices)
 # 0.25 m radial overhang, rather than several metres at clipped corners.
 outline=[(a+(a-x)/math.hypot(a-x,b-y)*.25,b+(b-y)/math.hypot(a-x,b-y)*.25) for a,b in outline]
 n=len(outline);verts=[(a,b,z) for z in (top-.16,top+.16) for a,b in outline]
 faces=[tuple(reversed(range(n))),tuple(range(n,2*n))]+[(i,(i+1)%n,(i+1)%n+n,i+n) for i in range(n)]
 replace_mesh(eave,verts,faces)
report['corrections'].append('Three tomb cornices follow their individual wall outlines, removing incompatible regular-octagon ledges.')
# Rebuild the simplified tomb window surrounds: retain existing placement/count,
# rectangular lower tier, arched upper tier, with continuous stone heads and sills.
for label in ('Selim_II','Murad_III','Mehmed_III'):
 body=bpy.data.objects['V24_'+label+'_Gövde'];window=bpy.data.objects['V24_'+label+'_Pencere'];frame=bpy.data.objects['V24_'+label+'_Sove']
 pts=set((round(v.co.x,4),round(v.co.y,4)) for v in body.data.vertices)
 cx1=sum(a for a,b in pts)/len(pts);cy1=sum(b for a,b in pts)/len(pts)
 outline=sorted(pts,key=lambda q:math.atan2(q[1]-cy1,q[0]-cx1));height1=max(v.co.z for v in body.data.vertices)
 wv=[];wf=[];fv=[];ff=[]
 for a,b in zip(outline,outline[1:]+outline[:1]):
  dx,dy=b[0]-a[0],b[1]-a[1];length=math.hypot(dx,dy);dx/=length;dy/=length
  mx,my=(a[0]+b[0])/2,(a[1]+b[1])/2
  for upper in (False,True):
   cz=height1*(.73 if upper else .31);half=.55;hh=.575 if upper else .875
   inner=[(-half,-hh),(half,-hh)]
   if upper:
    spring=hh-half
    inner += [(half*math.cos(t*math.pi/16),spring+half*math.sin(t*math.pi/16)) for t in range(17)]
    outer=[(-half-.14,-hh-.14),(half+.14,-hh-.14)]+[((half+.14)*math.cos(t*math.pi/16),spring+(half+.14)*math.sin(t*math.pi/16)) for t in range(17)]
   else:
    inner += [(half,hh),(-half,hh)]
    outer=[(-half-.14,-hh-.14),(half+.14,-hh-.14),(half+.14,hh+.14),(-half-.14,hh+.14)]
   def point(q,depth):return (mx+dx*q[0]+dy*depth,my+dy*q[0]-dx*depth,cz+q[1])
   start=len(wv);wv.extend(point(q,.025) for q in inner);wf.append(tuple(range(start,start+len(inner))))
   n=len(inner);start=len(fv)
   for depth in (.035,.14):
    fv.extend(point(q,depth) for q in inner);fv.extend(point(q,depth) for q in outer)
   for i in range(n):
    j=(i+1)%n
    for ids in ((i,j,n+j,n+i),(2*n+i,3*n+i,3*n+j,2*n+j),(i,2*n+i,2*n+j,j),(n+i,n+j,3*n+j,3*n+i)):
     ff.append(tuple(start+k for k in ids))
 replace_mesh(window,wv,wf);replace_mesh(frame,fv,ff)
report['corrections'].append('Tomb upper windows now have arched heads; lower windows have complete rectangular surrounds. Counts and placement remain approximate source layout.')
# Preserve all gallery roof shapes and historic upper buttress steps.
for o in parts:o.data.transform(R.inverted());o.data.update()
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.export_scene.gltf(filepath=str(P/'ayasofya_v24.glb'),export_format='GLB',use_selection=True,export_apply=True)
bpy.context.preferences.filepaths.save_version=0
bpy.ops.wm.save_as_mainfile(filepath=str(P/'ayasofya_v24.blend'),compress=True)
(P/'build_report.json').write_text(json.dumps(report,indent=2)+'\n')
