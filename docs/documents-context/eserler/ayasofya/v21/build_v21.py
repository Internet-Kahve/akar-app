import bpy,bmesh,json,math
from pathlib import Path
from mathutils import Vector,Matrix
P=Path(__file__).parent; (P/'renders').mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(P.parent/'v20/ayasofya_v20.blend'))
source=bpy.data.objects['Ayasofya_v20'];mats=list(source.data.materials);bpy.data.objects.remove(source,do_unlink=True)
d=json.loads((P/'base_geometry.json').read_text());trim=json.loads((P/'trimmed_roofs.json').read_text());removed=set(trim['removed']);parts=[]
def material(name,rgb):
 m=bpy.data.materials.new(name);m.diffuse_color=(*rgb,1);m.use_nodes=True;b=m.node_tree.nodes.get('Principled BSDF');b.inputs['Base Color'].default_value=(*rgb,1);b.inputs['Roughness'].default_value=.78;return m
lead=material('V21_Kursun',(.32,.36,.38));stone=material('V21_Mermer',(.68,.62,.50));wall=material('V21_Siva',(.56,.33,.23));dark=material('V21_Pencere',(.055,.067,.07));rib=material('V21_Kursun_Derz',(.24,.27,.29))
# Lighter lead and restrained wall tones, keeping source image textures.
for m in mats:
 if m.name in ['Color_004','Color_007']:
  m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.32,.36,.38,1)
 if m.name=='Color_A03':m.node_tree.nodes.get('Principled BSDF').inputs['Base Color'].default_value=(.56,.33,.23,1)
def mesh(name,verts,faces,materials,indices=None,uvs=None,smooth=False):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);parts.append(ob)
 for m in materials:me.materials.append(m)
 for i,p in enumerate(me.polygons):p.material_index=indices[i] if indices else 0;p.use_smooth=smooth
 if uvs:
  uv=me.uv_layers.new()
  for p,coords in zip(me.polygons,uvs):
   for l,co in zip(p.loop_indices,coords):uv.data[l].uv=co
 bm=bmesh.new();bm.from_mesh(me);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.00002);bmesh.ops.dissolve_degenerate(bm,dist=.0001,edges=list(bm.edges));bmesh.ops.recalc_face_normals(bm,faces=list(bm.faces));bm.to_mesh(me);bm.free();me.set_sharp_from_angle(angle=.65)
 return ob
verts=[];faces=[];mi=[];uv=[]
for i,f in enumerate(d['faces']):
 vs=[d['vertices'][j] for j in f];x,y,z=[sum(v[k] for v in vs)/3 for k in range(3)]
 tomb=(-104<y<-62 and -15<x<44)
 dome=(45.89<z<54.07 and (x+.1375)**2+(y+.6635)**2<18**2)
 if i in removed or tomb or dome:continue
 faces.append(tuple(range(len(verts),len(verts)+3)));verts.extend(vs);mi.append(d['material_indices'][i]);uv.append(d['uvs'][i])
mesh('V21_Tarihi_Cepheler',verts,faces,mats,mi,uv,smooth=True)
verts=[];faces=[];mi=[];uv=[]
for t in trim['triangles']:
 faces.append(tuple(range(len(verts),len(verts)+3)));verts.extend(t['v']);mi.append(t['m']);uv.append(t['uv'])
mesh('V21_Kesisimleri_Kesilmis_Catilar',verts,faces,mats,mi,uv)
def cylinder(name,c,r,depth,mat,n=64,r2=None):
 bpy.ops.mesh.primitive_cone_add(vertices=n,radius1=r,radius2=r if r2 is None else r2,depth=depth,location=c);o=bpy.context.object;o.name=name;o.data.materials.append(mat);parts.append(o);return o
def box(name,c,size,mat):
 bpy.ops.mesh.primitive_cube_add(size=1,location=c);o=bpy.context.object;o.name=name;o.dimensions=size;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.data.materials.append(mat);parts.append(o);return o
def curve(name,points,thick,mat):
 cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.bevel_depth=thick;cu.bevel_resolution=1;s=cu.splines.new('POLY');s.points.add(len(points)-1)
 for p,v in zip(s.points,points):p.co=(*v,1)
 o=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(o);o.data.materials.append(mat);parts.append(o)
def dome(name,c,r,h,seams=32):
 vs=[];fs=[];N=128;K=24
 for j in range(K+1):
  a=j/K*math.pi/2;rr=r*math.cos(a)
  for i in range(N):t=i/N*2*math.pi;vs.append((c[0]+rr*math.cos(t),c[1]+rr*math.sin(t),c[2]+h*math.sin(a)))
 for j in range(K):
  for i in range(N):a=j*N+i;b=j*N+(i+1)%N;fs.append((a,b,b+N,a+N))
 mesh(name,vs,fs,[lead],smooth=True)
 for i in range(seams):
  t=i/seams*2*math.pi;pts=[]
  for j in range(K+1):a=j/K*math.pi/2;rr=(r+.025)*math.cos(a);pts.append((c[0]+rr*math.cos(t),c[1]+rr*math.sin(t),c[2]+(h+.025)*math.sin(a)))
  curve(name+'_Derz',pts,.024,rib)
dome('V21_Ana_Kubbe',(-.1375,-.6635,45.9),17.14,8.16,40)
# Three separate plans, porch roofs and material treatments, based on photographs.
def tomb(name,c,r,height,n,phase,mat,roofh):
 x,y=c;outline=[(x+r*math.cos(phase+2*math.pi*i/n),y+r*math.sin(phase+2*math.pi*i/n)) for i in range(n)]
 if 'Selim' in name:
  cut=.30; rr=r*.86; outline=[(x+a*rr,y+b*rr) for a,b in [(-1,-1+cut),(-1+cut,-1),(1-cut,-1),(1,-1+cut),(1,1-cut),(1-cut,1),(-1+cut,1),(-1,1-cut)]]
 if 'Murad' in name:
  rr=r*.89; outline=[(x+a*rr,y+b*rr) for a,b in [(-1,-.55),(-.55,-1),(.55,-1),(1,-.55),(1,.55),(.65,1),(-.65,1),(-1,.55)]];n=8
 vs=[(a,b,z) for z in (0,height) for a,b in outline];fs=[tuple(reversed(range(n))),tuple(range(n,2*n))]
 for i in range(n):fs.append((i,(i+1)%n,(i+1)%n+n,i+n))
 mesh(name+'_Gövde',vs,fs,[mat]);cylinder(name+'_Kasnak',(x,y,height+.55),r*.86,1.1,stone,n=32);dome(name+'_Kubbe',(x,y,height+1.1),r*.87,roofh,24)
 cylinder(name+'_Sacak',(x,y,height),r*1.035,.32,stone,n=n)
 # Windows mounted flush to each wall with slender stone jambs, two distinct tiers.
 for i in range(n):
  a=Vector((*outline[i],0));b=Vector((*outline[(i+1)%n],0));mid=(a+b)/2;direction=(b-a).normalized();out=Vector((direction.y,-direction.x,0));theta=math.atan2(direction.y,direction.x)
  for z in (height*.31,height*.73):
   pos=mid+out*.018;pos.z=z
   w=box(name+'_Pencere',pos,(1.1,.045,1.75 if z<height/2 else 1.15),dark);w.rotation_euler.z=theta
   for dx in (-.64,.64):
    p=pos+direction*dx;o=box(name+'_Sove',p,(.15,.13,2 if z<height/2 else 1.4),stone);o.rotation_euler.z=theta
 # Entrance faces the open north courtyard; four columns and a low roof.
 front=y+r*.92;roofz=height*.57
 box(name+'_Revak_Doseme',(x,front+2,.18),(r*1.35,4.8,.36),stone)
 for dx in (-.56,-.19,.19,.56):
  cylinder(name+'_Revak_Sutun',(x+r*dx,front+3.7,roofz/2),.22,roofz,stone,24)
  cylinder(name+'_Baslik',(x+r*dx,front+3.7,roofz-.13),.34,.26,stone,16)
 box(name+'_Revak',(x,front+2,roofz),(r*1.4,4.8,.35),stone)
 if 'Selim' in name:
  for dx in (-.44,0,.44):dome(name+'_Revak_Kubbe',(x+r*dx,front+2,roofz+.18),r*.23,1.15,12)
 else:
  box(name+'_Revak_Kursun',(x,front+2,roofz+.24),(r*1.42,4.9,.16),lead)
tomb('V21_Selim_II',(-22,-74),10.1,12.1,8,math.pi/8,stone,5.4)
tomb('V21_Mehmed_III',(24,-77),9.1,13.8,8,0,wall,5.7)
tomb('V21_Murad_III',(1,-74),9.6,12.8,6,math.pi/6,stone,5.8)
# Thin layered balcony mouldings differentiate the four existing minarets.
for label,x,y,z,r in [('BatiKuzey',-51.12,35,55.0,2.65),('BatiGuney',-51.12,-38.1,55.0,2.65),('DoguTugla',56.089,-38.294,46.7,1.65),('DoguTas',56.62,37.932,47.1,1.75)]:
 for dz,scale in [(-.42,.94),(-.2,1.02),(0,1.07)]:
  cylinder('V21_'+label+'_Serefe_Silme',(x,y,z+dz),r*scale,.13,stone,64)
# Convert lead seams to exportable mesh so Blender and GLB agree.
for o in list(parts):
 if o.type=='CURVE':
  bpy.ops.object.select_all(action='DESELECT');o.select_set(True);bpy.context.view_layer.objects.active=o;bpy.ops.object.convert(target='MESH')
# Restore common orientation for compatibility with v20.
rot=Matrix.Rotation(math.radians(-32.68),4,'Z')
for o in parts:
 o.matrix_world=rot@o.matrix_world
 if o.type=='MESH':
  o.data.transform(o.matrix_world);o.matrix_world=Matrix.Identity(4)
  bm=bmesh.new();bm.from_mesh(o.data);bmesh.ops.triangulate(bm,faces=list(bm.faces));bmesh.ops.delete(bm,geom=[f for f in bm.faces if f.calc_area()<1e-5],context='FACES');bm.to_mesh(o.data);bm.free();o.data.update()
bpy.ops.object.select_all(action='DESELECT')
for o in parts:o.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.export_scene.gltf(filepath=str(P/'ayasofya_v21.glb'),export_format='GLB',use_selection=True,export_apply=True)
sc=bpy.context.scene;sc.cycles.samples=16;sc.render.resolution_x=1200;sc.render.resolution_y=1000
bpy.ops.wm.save_as_mainfile(filepath=str(P/'ayasofya_v21.blend'),compress=True)
for name in ['guneydogu','kuzeydogu','kuzeybati','guneybati']:
 sc.camera=bpy.data.objects['Camera_'+name];sc.render.filepath=str(P/'renders'/f'{name}.png');bpy.ops.render.render(write_still=True)
(P/'build_report.json').write_text(json.dumps({'roof_triangles_trimmed':trim['changed'],'objects':len(parts),'glb_bytes':(P/'ayasofya_v21.glb').stat().st_size},indent=2))
