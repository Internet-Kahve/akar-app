"""V23: restore V21 upper buttresses and gallery roofs; retain V22 west entrance repair.
This is a targeted rollback of the over-simplified V22 envelopes.
"""
import bpy,bmesh,math,json
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).parent;(P/'renders').mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'v21/ayasofya_v21.blend'))
R=Matrix.Rotation(math.radians(32.68),4,'Z');parts=[]
for o in list(bpy.data.objects):
 if o.type=='MESH' and o.name.startswith('V21_'):
  o.data.transform(R@o.matrix_world);o.matrix_world=Matrix.Identity(4);o.name=o.name.replace('V21_','V23_',1);parts.append(o)
lead=bpy.data.materials['V21_Kursun'];wall=bpy.data.materials['Color_A03'];stone=bpy.data.materials['V21_Mermer'];dark=bpy.data.materials['V21_Pencere'];rib=bpy.data.materials['V21_Kursun_Derz']
def mat(name,color):
 m=bpy.data.materials.new(name);m.use_nodes=True;m.diffuse_color=(*color,1);b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*color,1);b.inputs['Roughness'].default_value=.85;return m
masonry=mat('V23_Payanda_Tasi',(.40,.37,.31));brick=mat('V23_Narteks_Tugla',(.43,.24,.18))
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
high=[]
gallery=[]
roofboxes=gallery+[((-55.345,-37.64,17.5),(-41.219,36.282,24))]
report={'clipped_objects':{},'restored_v21_high_buttresses':4,'new_flying_buttresses':4,'restored_v21_gallery_roofs':True}
for ob in list(parts):
 if ob.name not in ['V23_Tarihi_Cepheler','V23_Kesisimleri_Kesilmis_Catilar']:continue
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
# Narthex continuous lead roof and four narrower flying buttresses.
def panel(name,coords):
 return mesh(name,coords,[(0,1,2,3)],[lead])
panel('V23_Narteks_Ust_Cati',[(-55.344,-37.639,17.554),(-48.744,-37.639,20.408),(-48.744,36.281,20.408),(-55.344,36.281,17.554)])
panel('V23_Narteks_Ust_Merkez',[(-48.744,-17.839,20.408),(-42.144,-17.839,23.262),(-42.144,16.481,23.262),(-48.744,16.481,20.408)])
for ya,yb in [(-37.639,-17.839),(16.481,36.281)]:
 panel('V23_Narteks_Yan_Cati',[(-48.744,ya,20.408),(-41.22,ya,20.408),(-41.22,yb,20.408),(-48.744,yb,20.408)])
# The outer narthex is low; it must not obscure the upper western windows.
panel('V23_Dis_Narteks_Cati',[(-64.558,-33.16,6.95),(-55.344,-33.16,6.95),(-55.344,33.18,6.95),(-64.558,33.18,6.95)])
for y in [i*1.25-36.7 for i in range(59)]:
 line('V23_Narteks_Derz',[(-55.344,y,17.58),(-48.744,y,20.434)],.017)
 if -17.839<y<16.481:line('V23_Narteks_Derz',[(-48.744,y,20.434),(-42.144,y,23.288)],.017)
for i,y in enumerate(ys):
 width=[2.4,2.15,2.25,2.55][i];a=-70;b=-55.344;topa=14.0;topb=17.554
 lower=[(a+(b-a)*t,6.93+5.1*math.sin(math.pi*t)) for t in [j/48 for j in range(49)]]
 profile=[(a,topa),(b,topb)]+list(reversed(lower))
 extrude_profile(f'V23_Ucan_Payanda_Kemer_{i+1}',profile,'y',y-width/2,y+width/2,masonry)
 box(f'V23_Ucan_Payanda_Dis_Ayak_{i+1}',(-72.6,y,topa/2),(5.2,width,topa),masonry)
 box(f'V23_Ucan_Payanda_Ic_Ayak_{i+1}',(-55.85,y,topb/2),(1.0,width,topb),wall)
 panel('V23_Ucan_Payanda_Kapak',[(a,y-width/2-.08,topa+.08),(b,y-width/2-.08,topb+.08),(b,y+width/2+.08,topb+.08),(a,y+width/2+.08,topa+.08)])
 for j in range(1,10):
  t=j/10;x=a+(b-a)*t;z=topa+(topb-topa)*t+.10;line('V23_Ucan_Payanda_Derz',[(x,y-width/2,z),(x,y+width/2,z)],.018)
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
parts=[o for o in bpy.data.objects if o.type=='MESH' and o.name.startswith('V23_')]
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.export_scene.gltf(filepath=str(P/'ayasofya_v23.glb'),export_format='GLB',use_selection=True,export_apply=True)
sc=bpy.context.scene;sc.cycles.samples=20;sc.render.resolution_x=1400;sc.render.resolution_y=1100
bpy.ops.wm.save_as_mainfile(filepath=str(P/'ayasofya_v23.blend'),compress=True)
report['objects']=len(parts)
(P/'build_report.json').write_text(json.dumps(report,indent=2))
