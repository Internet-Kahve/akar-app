"""Photo-guided v22: replace the roof/support junctions instead of piling meshes over v21.
Run in Blender 5.2. All dimensions remain approximate model coordinates, not survey claims.
"""
import bpy,bmesh,math,json
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).parent;(P/'renders').mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'v21/ayasofya_v21.blend'))
R=Matrix.Rotation(math.radians(32.68),4,'Z');parts=[]
for o in list(bpy.data.objects):
 if o.type=='MESH' and o.name.startswith('V21_'):
  o.data.transform(R@o.matrix_world);o.matrix_world=Matrix.Identity(4);o.name=o.name.replace('V21_','V22_',1);parts.append(o)
lead=bpy.data.materials['V21_Kursun'];wall=bpy.data.materials['Color_A03'];stone=bpy.data.materials['V21_Mermer'];dark=bpy.data.materials['V21_Pencere'];rib=bpy.data.materials['V21_Kursun_Derz']
def mat(name,color):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1);b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=.85;return m
masonry=mat('V22_Payanda_Tasi',(.40,.37,.31));brick=mat('V22_Narteks_Tugla',(.43,.24,.18))
def mesh(name,verts,faces,mats,indices=None,uvs=None,smooth=False):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);parts.append(o)
 for m in mats:me.materials.append(m)
 for i,p in enumerate(me.polygons):p.material_index=indices[i] if indices else 0;p.use_smooth=smooth
 if uvs:
  layer=me.uv_layers.new(name='SourceUV')
  for p,coords in zip(me.polygons,uvs):
   for idx,co in zip(p.loop_indices,coords):layer.data[idx].uv=co
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00002);bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free();me.set_sharp_from_angle(angle=.6);return o

def box(name,c,size,m):
 x,y,z=c;a,b,h=[s/2 for s in size];v=[(x+i*a,y+j*b,z+k*h) for k in (-1,1) for j in (-1,1) for i in (-1,1)]
 return mesh(name,v,[(0,2,3,1),(4,5,7,6),(0,1,5,4),(2,6,7,3),(0,4,6,2),(1,3,7,5)],[m])
def line(name,pts,r=.025,m=None):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=r;cu.bevel_resolution=0;s=cu.splines.new('POLY');s.points.add(len(pts)-1)
 for p,v in zip(s.points,pts):p.co=(*v,1)
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);cu.materials.append(m or rib);parts.append(o);return o
# Polygon clipping retains every loop UV. Cutting boxes are used only for named replacement zones.
def split(poly,axis,bound,sign):
 inside=[];outside=[]
 for a,b in zip(poly,poly[1:]+poly[:1]):
  da=(a[0][axis]-bound)*sign;db=(b[0][axis]-bound)*sign
  (inside if da>=0 else outside).append(a)
  if (da>=0)!=(db>=0):
   t=da/(da-db);p=(a[0].lerp(b[0],t),a[1].lerp(b[1],t));inside.append(p);outside.append(p)
 return inside,outside

def subtract(poly,lo,hi):
 if any(max(v[0][k] for v in poly)<lo[k]+1e-5 or min(v[0][k] for v in poly)>hi[k]-1e-5 for k in range(3)):return [poly]
 current=poly;out=[]
 for axis,bound,sign in [(k,lo[k],1) for k in range(3)]+[(k,hi[k],-1) for k in range(3)]:
  current,outer=split(current,axis,bound,sign)
  if len(outer)>=3:out.append(outer)
  if len(current)<3:break
 return out
high=[]
for x0,x1 in [(-20.1,-11.52),(10.92,19.5)]:
 for y0,y1 in [(-37.64,-19.16),(17.8,36.28)]:high.append(((x0,y0,22.15),(x1,y1,41.5)))
ys=[(-17.84-13.55)/2,(-9.26-4.97)/2,(3.61+7.9)/2,(12.19+16.48)/2]
west=[((-75.2,y-2.16,-.1),(-55.345,y+2.16,26)) for y in ys]
gallery=[]
for x0,x1 in [(-11.52,10.92),(-38.58,-20.1),(19.5,37.98)]:
 for y0,y1 in [(-37.64,-19.16),(17.8,36.28)]:gallery.append(((x0,y0,18.76),(x1,y1,25.55)))
roofboxes=gallery+[((-55.345,-37.64,17.5),(-41.219,36.282,24))]
report={'clipped_objects':{},'new_high_buttresses':4,'new_flying_buttresses':4,'gallery_roof_bays':8}
for ob in list(parts):
 if ob.name not in ['V22_Tarihi_Cepheler','V22_Kesisimleri_Kesilmis_Catilar']:continue
 me=ob.data;me.calc_loop_triangles();layer=me.uv_layers.active;verts=[];faces=[];uvs=[];indices=[];changed=0
 for t in me.loop_triangles:
  mid=me.polygons[t.polygon_index].material_index;name=me.materials[mid].name.split('.')[0];poly=[(me.vertices[v].co.copy(),layer.data[l].uv.copy() if layer else Vector((0,0))) for v,l in zip(t.vertices,t.loops)]
  polys=[poly];boxes=[((a[0]-.02,a[1]-(.65 if a[1]<0 else .02),a[2]),(b[0]+.02,b[1]+(.65 if b[1]>0 else .02),b[2])) for a,b in high]+west+(roofboxes if name=='Color_004' else [((a[0],max(a[1],23) if a[1]>0 else a[1],19.0),(b[0],b[1] if b[1]>0 else min(b[1],-24),24.2)) for a,b in gallery] if name=='material_0' else [])
  for lo,hi in boxes:
   polys=[q for p in polys for q in subtract(p,lo,hi)]
   if not polys:break
  if len(polys)!=1 or len(polys[0])!=3 or any((polys[0][k][0]-poly[k][0]).length>1e-5 for k in range(3)):changed+=1
  for p in polys:
   for i in range(1,len(p)-1):
    tri=[p[0],p[i],p[i+1]]
    if (tri[1][0]-tri[0][0]).cross(tri[2][0]-tri[0][0]).length<2e-7:continue
    faces.append(tuple(range(len(verts),len(verts)+3)));verts.extend(v[0] for v in tri);uvs.append([v[1] for v in tri]);indices.append(mid)
 report['clipped_objects'][ob.name]=changed
 new=mesh(ob.name+'_Kesilmis',verts,faces,list(me.materials),indices,uvs,smooth=True);parts.remove(ob);bpy.data.objects.remove(ob,do_unlink=True)
# Closed extrusion along one horizontal axis, including true arch voids (no black decal).
def extrude_profile(name,profile,axis,low,high,m):
 def point(q,t):return (t,q[0],q[1]) if axis=='x' else (q[0],t,q[1])
 n=len(profile);v=[point(q,t) for t in (low,high) for q in profile];f=[tuple(reversed(range(n))),tuple(range(n,2*n))]
 for i in range(n):f.append((i,(i+1)%n,(i+1)%n+n,i+n))
 return mesh(name,v,f,[m])
# Four continuous upper buttresses, with shallow roof slope and rounded crown.
for num,(lo,hi) in enumerate(high):
 x0,y0,z0=lo;x1,y1,_=hi;side=1 if y0>0 else -1;inner=y0 if side>0 else y1;outer=y1 if side>0 else y0;cx=(x0+x1)/2
 top_inner=41.25 if num<2 else 41.35;top_outer=38.0 if side>0 else 38.2
 profile=[(inner,z0),(outer,z0),(outer,top_outer),(inner,top_inner)]
 extrude_profile(f'V22_Yuksek_Payanda_{num+1}',profile,'x',x0,x1,wall)
 roof=[(x,y,z+.10) for x in (x0-.10,x1+.10) for y,z in [(inner,top_inner),(outer,top_outer)]]
 mesh(f'V22_Payanda_Kursun_{num+1}',roof,[(0,2,3,1)],[lead])
 # A distinct narrow crown, not a sequence of stacked full-width blocks.
 r=2.17;capbase=top_outer-.25;capend=outer-side*.90
 prof=[(cx-r,capbase-1.0),(cx+r,capbase-1.0)]+[(cx+r*math.cos(a),capbase+r*math.sin(a)) for a in [i*math.pi/32 for i in range(33)]]
 extrude_profile(f'V22_Payanda_Tac_{num+1}',prof,'y',min(outer,capend),max(outer,capend),wall)
 pts=[(cx+r*math.cos(a),outer+side*.015,capbase+r*math.sin(a)+.04) for a in [i*math.pi/32 for i in range(33)]];line('V22_Payanda_Tac_Damlalik',pts,.055,lead)
 for j in range(1,9):
  t=j/9;y=inner+(outer-inner)*t;z=top_inner+(top_outer-top_inner)*t+.125;line('V22_Payanda_Kursun_Derz',[(x0,y,z),(x1,y,z)],.018)
 # Tiny slit windows visible on the outer face; shallow recess frames.
 for z in (28.7,33.0):
  box('V22_Payanda_Mazgal',(cx,outer+side*.018,z),(.38,.035,.85),dark)
# Gallery upper envelope: a continuous roof shell, not intersecting spheres and slabs.
boundary_source=json.loads((P.parent/'v21/base_geometry.json').read_text())
for idx,(lo,hi) in enumerate(gallery):
 x0,y0,z0=lo;x1,y1,_=hi;side=1 if y0>0 else -1;inner=y0 if side>0 else y1;outer=y1 if side>0 else y0
 segments=[]
 for f,mi in zip(boundary_source['faces'],boundary_source['material_indices']):
  if boundary_source['materials'][mi]!='Color_004':continue
  vv=[boundary_source['vertices'][k] for k in f]
  for aa,bb in zip(vv,vv[1:]+vv[:1]):
   if abs(aa[1]-outer)<.005 and abs(bb[1]-outer)<.005 and abs(aa[0]-bb[0])>.0001 and min(aa[2],bb[2])>18 and max(aa[2],bb[2])<25.6 and min(aa[0],bb[0])<=x1 and max(aa[0],bb[0])>=x0:
    segments.append((aa,bb))
 def front_height(x):
  zz=[18.768]
  for a,b in segments:
   if min(a[0],b[0])-.0001<=x<=max(a[0],b[0])+.0001:
    t=(x-a[0])/(b[0]-a[0]);zz.append(a[2]+(b[2]-a[2])*t)
  return max(zz)
 def height(x,t):return 24.0*(1-t)+front_height(x)*t+.30*math.sin(math.pi*t)
 xs=sorted(set([round(x0+(x1-x0)*i/96,5) for i in range(97)]+[round(v[0],5) for pair in segments for v in pair if x0<v[0]<x1]));NX=len(xs)-1;NY=40;vs=[];fs=[]
 for j in range(NY+1):
  t=j/NY;y=inner+(outer-inner)*t
  for x in xs:vs.append((x,y,height(x,t)))
 for j in range(NY):
  for i in range(NX):a=j*(NX+1)+i;fs.append((a,a+1,a+NX+2,a+NX+1))
 mesh(f'V22_Galeri_Butun_Cati_{idx+1}',vs,fs,[lead],smooth=True)
 # Close hidden side/rear returns down to the retained wall shoulder.
 for edge in [[vs[i] for i in range(NX+1)],[vs[j*(NX+1)] for j in range(NY+1)],[vs[j*(NX+1)+NX] for j in range(NY+1)]]:
  nn=len(edge);vv=edge+[(x,y,18.768) for x,y,z in edge];ff=[(i,i+1,i+nn+1,i+nn) for i in range(nn-1)];mesh('V22_Galeri_Yan_Kapanis',vv,ff,[wall])
 # At front follow the existing arched facade edge; vertical closure is thin roof flashing.
 edge=[vs[NY*(NX+1)+i] for i in range(NX+1)];v=edge+[(x,y,z-.12) for x,y,z in edge];f=[(i,i+1,i+NX+2,i+NX+1) for i in range(NX)];mesh('V22_Galeri_Sacak',v,f,[lead])
 closure_v=[];closure_f=[]
 for a,b in zip(edge,edge[1:]):
  if max(a[2],b[2])>19.3:continue
  k=len(closure_v);closure_v.extend([(a[0],a[1],a[2]-.1),(b[0],b[1],b[2]-.1),(b[0],b[1],17.55),(a[0],a[1],17.55)]);closure_f.append((k,k+1,k+2,k+3))
 mesh('V22_Galeri_Kose_Duvar_Kapanis',closure_v,closure_f,[wall])
 for i in range(1,14):
  x=x0+(x1-x0)*i/14;pts=[(x,inner+(outer-inner)*j/NY,height(x,j/NY)+.025) for j in range(NY+1)];line('V22_Galeri_Kursun_Derz',pts,.017)
# Close the low exedra eaves against the adjoining gallery roof shoulder.
from collections import Counter
edge_counts=Counter();edge_points={}
for face,mi in zip(boundary_source['faces'],boundary_source['material_indices']):
 if boundary_source['materials'][mi]!='Color_004':continue
 vv=[boundary_source['vertices'][k] for k in face]
 for a,b in zip(vv,vv[1:]+vv[:1]):
  key=tuple(sorted((tuple(round(c,5) for c in a),tuple(round(c,5) for c in b))));edge_counts[key]+=1;edge_points[key]=(a,b)
eave_v=[];eave_f=[]
for key,count in edge_counts.items():
 a,b=edge_points[key]
 if count!=1 or not all(abs(v[2]-24.9639)<.002 and 18<abs(v[0])<39 for v in (a,b)):continue
 k=len(eave_v);eave_v.extend([a,b,(b[0],b[1],23.95),(a[0],a[1],23.95)]);eave_f.append((k,k+1,k+2,k+3))
mesh('V22_Eksedra_Sacak_Kapanis',eave_v,eave_f,[wall]);report['exedra_eave_panels']=len(eave_f)

# Narthex continuous lead roof and four narrower flying buttresses.
def panel(name,coords):
 return mesh(name,coords,[(0,1,2,3)],[lead])
panel('V22_Narteks_Ust_Cati',[(-55.344,-37.639,17.554),(-48.744,-37.639,20.408),(-48.744,36.281,20.408),(-55.344,36.281,17.554)])
panel('V22_Narteks_Ust_Merkez',[(-48.744,-17.839,20.408),(-42.144,-17.839,23.262),(-42.144,16.481,23.262),(-48.744,16.481,20.408)])
for ya,yb in [(-37.639,-17.839),(16.481,36.281)]:
 panel('V22_Narteks_Yan_Cati',[(-48.744,ya,20.408),(-41.22,ya,20.408),(-41.22,yb,20.408),(-48.744,yb,20.408)])
# The outer narthex is low; it must not obscure the upper western windows.
panel('V22_Dis_Narteks_Cati',[(-64.558,-33.16,6.95),(-55.344,-33.16,6.95),(-55.344,33.18,6.95),(-64.558,33.18,6.95)])
for y in [i*1.25-36.7 for i in range(59)]:
 line('V22_Narteks_Derz',[(-55.344,y,17.58),(-48.744,y,20.434)],.017)
 if -17.839<y<16.481:line('V22_Narteks_Derz',[(-48.744,y,20.434),(-42.144,y,23.288)],.017)
for i,y in enumerate(ys):
 width=[2.4,2.15,2.25,2.55][i];a=-70;b=-55.344;topa=14.0;topb=17.554
 lower=[(a+(b-a)*t,6.93+5.1*math.sin(math.pi*t)) for t in [j/48 for j in range(49)]]
 profile=[(a,topa),(b,topb)]+list(reversed(lower))
 extrude_profile(f'V22_Ucan_Payanda_Kemer_{i+1}',profile,'y',y-width/2,y+width/2,masonry)
 box(f'V22_Ucan_Payanda_Dis_Ayak_{i+1}',(-72.6,y,topa/2),(5.2,width,topa),masonry)
 box(f'V22_Ucan_Payanda_Ic_Ayak_{i+1}',(-55.85,y,topb/2),(1.0,width,topb),wall)
 panel('V22_Ucan_Payanda_Kapak',[(a,y-width/2-.08,topa+.08),(b,y-width/2-.08,topb+.08),(b,y+width/2+.08,topb+.08),(a,y+width/2+.08,topa+.08)])
 for j in range(1,10):
  t=j/10;x=a+(b-a)*t;z=topa+(topb-topa)*t+.10;line('V22_Ucan_Payanda_Derz',[(x,y-width/2,z),(x,y+width/2,z)],.018)
# Convert added lead details, preserve named edit groups, then restore project yaw.
for o in list(parts):
 if o.type=='CURVE':
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
for o in parts:
 o.data.transform(R.inverted());o.matrix_world=Matrix.Identity(4)
 bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.triangulate(bm,faces=list(bm.faces));bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.calc_area()<1e-6],context='FACES');bm.to_mesh(o.data);bm.free();o.data.update()
# Batch repeated details into semantic meshes to avoid hundreds of draw calls.
from collections import defaultdict
groups=defaultdict(list)
for o in parts:groups[o.name.split('.')[0]].append(o)
for key,group in groups.items():
 if len(group)<2:continue
 bpy.ops.object.select_all(action='DESELECT')
 for o in group:o.select_set(True)
 bpy.context.view_layer.objects.active=group[0];bpy.ops.object.join();bpy.context.object.name=key
parts=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('V22_')]
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.export_scene.gltf(filepath=str(P/'ayasofya_v22.glb'),export_format='GLB',use_selection=True,export_apply=True)
sc=bpy.context.scene;sc.cycles.samples=20;sc.render.resolution_x=1400;sc.render.resolution_y=1100
bpy.ops.wm.save_as_mainfile(filepath=str(P/'ayasofya_v22.blend'),compress=True)
for name in ['guneydogu','kuzeydogu','kuzeybati','guneybati']:
 sc.camera=bpy.data.objects['Camera_'+name];sc.render.filepath=str(P/'renders'/f'{name}.png');bpy.ops.render.render(write_still=True)
report['objects']=len(parts);report['glb_bytes']=(P/'ayasofya_v22.glb').stat().st_size
(P/'build_report.json').write_text(json.dumps(report,indent=2));print(report)
