"""v20: v16 sahnesine kaynaklara dayalı kuzey avlu su yapıları ekler.
Çalıştır: /Applications/Blender.app/Contents/MacOS/Blender -b --python build_v20.py
Girdi v16 korunur. Sayısal avlu ölçüleri stilize fotoğraf tahminidir (rölöve değil).
"""
import bpy, bmesh, math, sys, json, os, hashlib
from pathlib import Path
from mathutils import Vector
sys.path.insert(0,str(Path(__file__).parent))
import akar3d as A
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'kontrol/v20'; OUT.mkdir(parents=True,exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(ROOT/'blend/ulu-cami_v16.blend'))
# Rotated drums were regenerated against the original roof surface, including window clipping.
TARGETS=('Kubbeler_19','Sadirvan_Kubbe','Kasnak_Pencereleri','Sadirvan_Iskeleti')
for name in TARGETS: bpy.data.objects.remove(bpy.data.objects[name],do_unlink=True)
with bpy.data.libraries.load(str(ROOT/'blend/ulu-cami_v20_kubbe_taban.blend'),link=False) as (src,dst):
 dst.objects=list(TARGETS)
for ob in dst.objects: bpy.context.scene.collection.objects.link(ob)
# Sahnenin bina geometrisinin değişmediğini kanıtlayan parça özeti.
def fingerprint(o):
 return hashlib.sha256(b''.join(__import__('struct').pack('fff',*v.co) for v in o.data.vertices)+str([tuple(p.vertices) for p in o.data.polygons]).encode()).hexdigest()
base={o.name:fingerprint(o) for o in bpy.data.objects if o.type=='MESH'}
M={k:A.mat('Avlu_'+k,c,rough=.65 if k=='metal' else .85,metal=.35 if k in ('metal','pirinc') else 0) for k,c in {'ahsap':'#4F3528','krem':'#D9CBB0','mermer':'#D6D6CB','metal':'#87939C','derz':'#59646A','su':'#71A7A7','pirinc':'#AA8951','tas':'#C9BDA8'}.items()}
PARAM={'sadirvan_centers':[[-15,-39],[15,-39]],'sadirvan_post_radius':2.65,'sadirvan_roof_radius':3.42,'sadirvan_total_height':9.17,'mermer_center':[0,-39],'mermer_body_width':1.15,'mermer_total_height':2.70,'note':'Koordinat ve şadırvan boyutları fotoğrafa dayalı tahmin; çeşmenin 2.70x1.15 ölçüsü bu turda yükseklik/gövde genişliği olarak yorumlandı, eksenler kaynakta adlandırılmıyor.'}

def box(g,x,y,z,w,d,h,m):g.prism(A.rect(Vector((x,y)),w,d),z,z+h,m,m)
def rod(g,a,b,r,m,n=6):
 a,b=Vector(a),Vector(b);axis=(b-a).normalized();u=axis.cross(Vector((0,0,1)))
 if u.length<.01:u=axis.cross(Vector((0,1,0)))
 u.normalize();v=axis.cross(u); rings=[]
 for c in (a,b):rings.append([g.bm.verts.new(c+r*(u*math.cos(2*math.pi*i/n)+v*math.sin(2*math.pi*i/n))) for i in range(n)])
 g.F(rings[0][::-1],m);g.F(rings[1],m)
 for i in range(n):j=(i+1)%n;g.F([rings[0][i],rings[0][j],rings[1][j],rings[1][i]],m)
def panel(g,O,T,N,poly,thick,m):
 rings=[[g.bm.verts.new(Vector((O.x+T.x*u+N.x*off,O.y+T.y*u+N.y*off,z))) for u,z in poly] for off in (-thick/2,thick/2)]
 # Concave faces are explicitly triangulated to preserve the trefoil opening in glTF.
 for ring in (rings[0][::-1],rings[1]):
  f=g.F(ring,m)
  if f:
   f.normal_update()
   bmesh.ops.triangulate(g.bm,faces=[f])
 for i in range(len(poly)):j=(i+1)%len(poly);g.F([rings[0][i],rings[0][j],rings[1][j],rings[1][i]],m)
def curve_path(points,steps=4):
 # Catmull-Rom interpolation through measured silhouette-style control points.
 out=[];p=[points[0]]+points+[points[-1]]
 for i in range(1,len(p)-2):
  a,b,c,d=[Vector(q) for q in p[i-1:i+3]]
  for k in range(steps):
   t=k/steps;out.append(tuple(.5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t)))
 return out+[points[-1]]
def arch(g,O,T,N,w,z,top,m,edge=None):
 # Three-lobed opening, cream spandrel above it, dark bead below.
 pts=[(-.5,0),(-.48,.18),(-.38,.24),(-.27,.20),(-.24,.22),(-.24,.49),(-.17,.65),(0,.85),(.17,.65),(.24,.49),(.24,.22),(.27,.20),(.38,.24),(.48,.18),(.5,0)]
 path=curve_path([(u*w,z+h*w) for u,h in pts],2)
 panel(g,O,T,N,path+[(w/2,top),(-w/2,top)],.15,m)
 if edge:
  for off in (-.095,.095):
   for a,b in zip(path,path[1:]):rod(g,(O.x+T.x*a[0]+N.x*off,O.y+T.y*a[0]+N.y*off,a[1]),(O.x+T.x*b[0]+N.x*off,O.y+T.y*b[0]+N.y*off,b[1]),.028,edge,4)
def lathe(g,c,prof,seg,m):g.lathe(c,prof,seg,[m]*(len(prof)-1))
def basin(g,c,r,z,h,n=8):
 # Hollow, closed-section basin with inset water; circumference never capped across the opening.
 lathe(g,c,[(0,z),(r,z),(r,z+h-.09),(r+.055,z+h-.04),(r+.055,z+h+.03),(r-.16,z+h+.03),(r-.16,z+.12),(0,z+.12)],n,M['mermer'])
 lathe(g,c,[(0,z+.13),(r-.18,z+.13),(r-.18,z+.15),(0,z+.15)],n,M['su'])
def gazebo(name,c):
 g=A.G(name);c=Vector(c);n=8;rr=2.65
 lathe(g,c,[(0,.01),(3.18,.01),(3.18,.12),(3.03,.20),(0,.20)],8,M['mermer'])
 pts=A.circle(c,rr,8,math.pi/8)
 for q in pts:
  box(g,q.x,q.y,.19,.25,.25,3.23,M['ahsap'])
  box(g,q.x,q.y,.19,.35,.35,.17,M['mermer'])
  box(g,q.x,q.y,3.25,.32,.32,.18,M['ahsap'])
 for i in range(n):
  a,b=pts[i],pts[(i+1)%n];mid=(a+b)/2;t=(b-a).normalized();normal=(mid-c).normalized();width=(b-a).length-.18
  arch(g,mid,t,normal,width,3.00,4.62,M['krem'],M['ahsap'])
  # Two opposing entry bays remain open; railings are an explicitly simplified arrangement.
  if i not in (1,5):
   for z in (.36,1.12):rod(g,(*a,z),(*b,z),.055,M['ahsap'])
   rod(g,(*a,.39),(*b,1.09),.045,M['ahsap']);rod(g,(*a,1.09),(*b,.39),.045,M['ahsap'])
 # Layered octagonal cornice and soffit.
 for rad,z,h,mat in [(2.98,4.53,.13,'ahsap'),(3.20,4.64,.16,'krem'),(3.42,4.78,.09,'ahsap'),(3.38,4.85,.10,'krem')]:
  lathe(g,c,[(rad,z),(rad,z+h)],8,M[mat])
 # Flared metal skirt projects directly from the onion base over the wider cornice.
 lathe(g,c,[(0,4.94),(3.40,4.94),(3.40,5.02),(2.59,5.12),(0,5.12)],48,M['metal'])
 prof=[(0,5.07),(2.59,5.07),(2.73,5.34),(2.77,5.70),(2.70,6.03),(2.48,6.36),(2.10,6.65),(1.60,6.91),(1.13,7.17),(.77,7.44),(.49,7.73),(.29,7.99),(.16,8.19),(0,8.23)]
 lathe(g,c,prof,48,M['metal'])
 for i in range(16):
  angle=2*math.pi*i/16
  for (r,z),(r2,z2) in zip(prof[1:-1],prof[2:-1]):rod(g,(c.x+(r+.018)*math.cos(angle),c.y+(r+.018)*math.sin(angle),z),(c.x+(r2+.018)*math.cos(angle),c.y+(r2+.018)*math.sin(angle),z2),.022,M['derz'],5)
 lathe(g,c,[(.06,8.18),(.10,8.24),(.05,8.29),(0,8.35)],10,M['pirinc'])
 basin(g,c,1.38,.23,.90)
 lathe(g,c,[(.16,.37),(.13,1.1),(.28,1.22),(.09,1.31),(0,1.39)],12,M['mermer'])
 for i in range(8):
  a=(i+.5)*math.tau/8;d=Vector((math.cos(a),math.sin(a)));p=c+d*1.30
  rod(g,(*p,.81),(*(p+d*.17),.81),.035,M['pirinc']);rod(g,(*(p+d*.17),.81),(*(p+d*.17),.72),.035,M['pirinc'])
  seat=c+d*2.04
  lathe(g,seat,[(.10,.2),(.10,.55),(.26,.55),(.26,.64)],10,M['mermer'])
 ob=g.obj();ob['source']='Envanter C1 PDF38-39; Canbakış PDF54';ob['dimensions_status']='photo estimate';return ob
new=[gazebo('Avlu_Sadirvan_Dogu',(-15,-39)),gazebo('Avlu_Sadirvan_Bati',(15,-39))]

def fountain():
 g=A.G('Avlu_Mermer_Cesme');c=Vector((0,-39))
 lathe(g,c,[(0,.01),(1.03,.01),(1.03,.12),(.92,.20),(0,.20)],8,M['mermer'])
 basin(g,c,.84,.2,.31,16)
 box(g,0,-39,.21,1.15,1.15,.72,M['mermer'])
 # Four piers and open, trefoil-arched upper structure.
 for x in (-.46,.46):
  for y in (-.46,.46):box(g,x,-39+y,.92,.226,.226,1.38,M['mermer'])
 for i in range(4):
  a=math.pi/2*i;N=Vector((math.cos(a),math.sin(a)));T=Vector((-N.y,N.x));O=c+N*.46
  arch(g,O,T,N,.72,1.54,2.35,M['mermer'])
  p=c+N*.59;rod(g,(*p,.65),(*(p+N*.13),.65),.024,M['pirinc']);rod(g,(*(p+N*.13),.65),(*(p+N*.13),.57),.024,M['pirinc'])
 for w,z,h in [(1.19,2.28,.10),(1.31,2.37,.09),(1.4,2.44,.07)]:box(g,0,-39,z,w,w,h,M['mermer'])
 for i in range(4):
  a=math.pi/2*i;N=Vector((math.cos(a),math.sin(a)));T=Vector((-N.y,N.x));O=c+N*.64
  for u in (-.53,-.27,0,.27,.53):
   p=O+T*u;lathe(g,p,[(.045,2.50),(.07,2.56),(.045,2.62),(0,2.70)],6,M['mermer'])
 ob=g.obj();ob['source']='Envanter C1 PDF38-39; Bursa Kitabeleri PDF124-127';ob['dimensions_status']='2.70 height / 1.15 body width interpreted, not verified';return ob
new.append(fountain())
# Stretch only the onion covering and its finial, anchored at the metal skirt.
for ob in new[:2]:
 for v in ob.data.vertices:
  if v.co.z>5.07: v.co.z=5.07+(v.co.z-5.07)*1.25
 ob.data.update()

# A modest paved forecourt anchors the three additions on the existing presentation plinth.
g=A.G('Zemin_Avlu_Tas')
box(g,0,-38.1,-.075,46,15.2,.08,M['tas'])
paving=g.obj()
# Thin visible paving joints; explicitly stylized, not a reconstructed paving survey.
g=A.G('Zemin_Avlu_Derz')
for x in range(-22,23,2):box(g,x,-38.1,.006,.018,15.18,.004,M['mermer'])
for k in range(8):box(g,0,-45.1+k*2,.006,45.98,.018,.004,M['mermer'])
g.obj()
assert all(fingerprint(bpy.data.objects[k])==v for k,v in base.items()),'Existing meshes changed'
(OUT/'yerlesim_ve_olcu.json').write_text(json.dumps(PARAM,ensure_ascii=False,indent=2))
mk=A.mesh_kontrol(new)
(OUT/'yeni_parca_mesh_kontrol.json').write_text(json.dumps(mk,ensure_ascii=False,indent=2))
print('NEW_MESH',mk,flush=True)
assert all(not v['acik_kenar'] and not v['manifold_degil'] for v in mk.values())
exec(compile((Path(__file__).parent/'v20_cevre.py').read_text(),str(Path(__file__).parent/'v20_cevre.py'),'exec'))
sc=bpy.context.scene
sc.render.engine='CYCLES';sc.cycles.samples=20;sc.cycles.use_denoising=True;sc.cycles.device='CPU'
sc.render.resolution_percentage=100;sc.render.image_settings.file_format='PNG'
sc.view_settings.view_transform='Standard';sc.view_settings.look='None'

def camera(loc,target,scale):
 cd=bpy.data.cameras.new('_v20cam');cd.type='ORTHO';cd.ortho_scale=scale;cd.clip_end=1000
 ob=bpy.data.objects.new('_v20cam',cd);sc.collection.objects.link(ob);ob.location=loc;ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler();sc.camera=ob

def render(name,loc,target,scale,res):
 offset=Vector((SHIFT.x,SHIFT.y,0));camera(Vector(loc)+offset,Vector(target)+offset,scale);sc.render.resolution_x,sc.render.resolution_y=res;sc.render.film_transparent=True;sc.render.filepath=str(OUT/name);bpy.ops.render.render(write_still=True)
render('v20_kuzey_kubbeler.png',(0,-120,40),(0,0,22),80,(1600,1000))
render('v20_genel.png',(110,-145,118),(0,-3,20),150,(1500,1350))
render('v20_avlu.png',(38,-70,22),(0,-38,3),51,(1800,950))
render('v20_sadirvan.png',(25,-54,10),(15,-39,4.1),11,(1100,1100))
render('v20_mermer_cesme.png',(4,-45,3.7),(0,-39,1.35),3.8,(1000,1100))
render('v20_ust_yerlesim.png',(0,-4,150),(0,-4,0),125,(1300,1300))
# Required library checks: full scene topology, coarse inter-object collision, eight backface renders.
report=A.kontrol_hepsi(str(OUT),'v20')
report['centering']=CENTER_REPORT;report['context']=CONTEXT_REPORT;report['dome_rotation_degrees']=22.5;report['dome_count']=20;report['new_meshes']=mk;report['dimensions']=PARAM
# Export both building + courtyard, and complete presentation.
for suffix,with_ground in [('',False),('_sunum',True)]:
 bpy.ops.object.select_all(action='DESELECT')
 for ob in bpy.data.objects:
  if ob.type=='MESH' and not ob.name.startswith(('_','REF')) and (with_ground or not ob.name.startswith('Zemin')):ob.select_set(True)
 path=ROOT/'export'/('ulu-cami_v20'+suffix+'.glb')
 bpy.ops.export_scene.gltf(filepath=str(path),export_format='GLB',use_selection=True,export_apply=True,export_yup=True,export_cameras=False,export_lights=False)
 report[path.name+'_bytes']=path.stat().st_size
camera((110,-145,118),(0,0,20),150)
sc.render.resolution_x=1500;sc.render.resolution_y=1350;sc.cycles.samples=24
bpy.ops.file.pack_all();bpy.ops.wm.save_as_mainfile(filepath=str(ROOT/'blend/ulu-cami_v20.blend'))
(OUT/'teslim_raporu.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print('FINISHED',json.dumps(report,ensure_ascii=False),flush=True)
