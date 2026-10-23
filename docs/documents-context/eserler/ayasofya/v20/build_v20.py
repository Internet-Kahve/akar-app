"""Ayasofya v20: preserve user-provided SketchUp reference geometry and UVs.
Run with Blender --background --python build_v20.py.
Original reference stays untouched. No decimation or inferred architectural additions.
"""
import bpy, bmesh, math, json, sys, xml.etree.ElementTree as ET
from pathlib import Path
from collections import defaultdict
from mathutils import Matrix, Vector
OUT=Path(__file__).resolve().parent
SOURCE=OUT/'source'/'model.dae'
OUT.mkdir(exist_ok=True); (OUT/'renders').mkdir(exist_ok=True)
bpy.ops.object.select_all(action='SELECT'); bpy.ops.object.delete(use_global=False)
r=ET.parse(SOURCE).getroot(); ns={'c':r.tag.split('}')[0][1:]}
def find(e,p): return e.find(p,ns)
def all(e,p): return e.findall(p,ns)
def lin(v): return v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4
images={x.get('id'):find(x,'c:init_from').text for x in all(r,'c:library_images/c:image')}
effects={x.get('id'):x for x in all(r,'c:library_effects/c:effect')}
materials={}; material_info={}
# Retain the source material distinctions; replace oversaturated SketchUp defaults.
palette={'Color_A03':'C98F79','Color_D02':'D8C5A4','Color_007':'505860','Color_004':'777E82','Color_009':'30383B','material':'929A9E','material_0':'DDD2BE','Color_000':'E7DECD'}
for m in all(r,'c:library_materials/c:material'):
 mid=m.get('id'); name=m.get('name'); fx=effects[find(m,'c:instance_effect').get('url')[1:]]
 mat=bpy.data.materials.new(name);mat.use_nodes=True; mat.use_backface_culling=False
 bs=mat.node_tree.nodes.get('Principled BSDF');bs.inputs['Roughness'].default_value=.82
 d=find(fx,'.//c:diffuse'); color=find(d,'c:color') if d is not None else None
 rgba=list(map(float,color.text.split())) if color is not None else [.65,.65,.65,1]
 if name in palette: rgba=[int(palette[name][i:i+2],16)/255 for i in (0,2,4)]+[1]
 bs.inputs['Base Color'].default_value=tuple([lin(v) for v in rgba[:3]]+[1]);mat.diffuse_color=tuple(rgba)
 tx=find(d,'c:texture') if d is not None else None
 path=None
 if tx is not None:
  sampler=find(fx,'.//c:newparam[@sid="'+tx.get('texture')+'"]'); sid=find(sampler,'c:sampler2D/c:source').text
  surface=find(fx,'.//c:newparam[@sid="'+sid+'"]'); iid=find(surface,'c:surface/c:init_from').text
  path=SOURCE.parent/images[iid]
  im=bpy.data.images.load(str(path),check_existing=True);im.pack()
  node=mat.node_tree.nodes.new('ShaderNodeTexImage');node.image=im;mat.node_tree.links.new(node.outputs['Color'],bs.inputs['Base Color'])
 materials[mid]=mat;material_info[mid]={'name':name,'texture':str(path) if path else None}
geo={}
for g in all(r,'c:library_geometries/c:geometry'):
 mesh=find(g,'c:mesh'); sources={}
 for s in all(mesh,'c:source'):
  fa=find(s,'c:float_array')
  if fa is None: continue
  ac=find(s,'c:technique_common/c:accessor');stride=int(ac.get('stride','1'))
  vals=list(map(float,fa.text.split()));sources[s.get('id')]=[vals[i:i+stride] for i in range(0,len(vals),stride)]
 verts={v.get('id'):find(v,'c:input[@semantic="POSITION"]').get('source')[1:] for v in all(mesh,'c:vertices')}
 blocks=[]
 for tr in all(mesh,'c:triangles'):
  inputs={i.get('semantic'):(int(i.get('offset')),i.get('source')[1:]) for i in all(tr,'c:input')}
  stride=max(int(i.get('offset')) for i in all(tr,'c:input'))+1
  idx=list(map(int,find(tr,'c:p').text.split())); data=[]
  for j in range(0,len(idx),stride):
   po,ps=inputs['VERTEX'];pos=sources[verts[ps]][idx[j+po]]
   uv=(0,0)
   if 'TEXCOORD' in inputs:
    uo,us=inputs['TEXCOORD'];uv=sources[us][idx[j+uo]][:2]
   norm=None
   if 'NORMAL' in inputs:
    no,nso=inputs['NORMAL'];norm=sources[nso][idx[j+no]][:3]
   data.append((pos,uv,norm))
  blocks.append((tr.get('material'),data))
 geo[g.get('id')]=blocks
# Same measured alignment used in v15-v19; keep all reference relative positions.
align=Matrix.Rotation(math.radians(-32.68),4,'Z') @ Matrix.Translation((-.3,-.6,0)) @ Matrix.Diagonal((1.32,1.32,59.8/52.7,1)) @ Matrix.Translation((-56.7,-43.2,0))
unit=float(find(r,'c:asset/c:unit').get('meter'))
rootmat=align @ Matrix.Diagonal((unit,unit,unit,1))
vertices=[];faces=[];uvs=[];normals=[];mids=[];seen={};duplicates=0;instances=0
library_nodes={n.get('id'):n for n in all(r,'c:library_nodes/c:node')}
def visit(node,parent):
 global duplicates,instances
 transform=parent.copy()
 for mx in all(node,'c:matrix'):
  a=list(map(float,mx.text.split()));transform=transform @ Matrix([a[i:i+4] for i in range(0,16,4)])
 normalmat=transform.to_3x3().inverted().transposed()
 for inst in all(node,'c:instance_geometry'):
  instances+=1
  bindings={i.get('symbol'):i.get('target')[1:] for i in all(inst,'c:bind_material/c:technique_common/c:instance_material')}
  for symbol,data in geo[inst.get('url')[1:]]:
   mid=bindings[symbol]
   for i in range(0,len(data),3):
    tri=data[i:i+3];coords=[transform @ Vector(v[0][:3]) for v in tri]
    key=tuple(sorted(tuple(round(c,5) for c in v) for v in coords))
    if key in seen:
     duplicates+=1
     previous=seen[key]
     # SketchUp exports coincident front/back faces. Prefer authored material
     # over the default white/back-face material, retaining that side's UVs.
     def priority(m): return 0 if m in ('ID6','ID13','ID94') else 1
     if priority(mid)>priority(mids[previous]):
      mids[previous]=mid
      replacement={tuple(round(c,5) for c in co):v[1] for co,v in zip(coords,tri)}
      uvs[previous*3:previous*3+3]=[replacement[tuple(round(c,5) for c in co)] for co in vertices[previous*3:previous*3+3]]
     continue
    if (coords[1]-coords[0]).cross(coords[2]-coords[0]).length<1e-9: continue
    seen[key]=len(faces);base=len(vertices);vertices.extend(coords);faces.append((base,base+1,base+2));mids.append(mid)
    uvs.extend(v[1] for v in tri)
    face_normal=(coords[1]-coords[0]).cross(coords[2]-coords[0]).normalized()
    normals.extend((normalmat @ Vector(v[2])).normalized() if v[2] else face_normal for v in tri)
 for child in all(node,'c:node'):visit(child,transform)
 for inst in all(node,'c:instance_node'):visit(library_nodes[inst.get('url')[1:]],transform)
sceneid=find(r,'c:scene/c:instance_visual_scene').get('url')[1:]
scene=find(r,'c:library_visual_scenes/c:visual_scene[@id="'+sceneid+'"]')
for node in all(scene,'c:node'):visit(node,rootmat)
mesh=bpy.data.meshes.new('Ayasofya_v20_DetailedReference');mesh.from_pydata(vertices,[],faces);mesh.update()
ob=bpy.data.objects.new('Ayasofya_v20',mesh);bpy.context.collection.objects.link(ob)
used=list(dict.fromkeys(mids));mapping={m:i for i,m in enumerate(used)}
for mid in used: mesh.materials.append(materials[mid])
for poly,mid in zip(mesh.polygons,mids):poly.material_index=mapping[mid];poly.use_smooth=True
uv=mesh.uv_layers.new(name='Source_UV')
for i,co in enumerate(uvs):uv.data[i].uv=co
# Weld coincident positions without dissolving detail or altering loop UVs.
bm=bmesh.new();bm.from_mesh(mesh);bmesh.ops.remove_doubles(bm,verts=list(bm.verts),dist=.0001);bm.to_mesh(mesh);bm.free();mesh.update()
mesh.set_sharp_from_angle(angle=math.radians(30))
ob['source']='User-provided 3D Warehouse / SketchUp DAE; direct geometry adaptation'
ob['alignment']='v15-v19 alignment: horizontal 1.32; vertical 59.8/52.7; yaw -32.68 degrees'
ob['version']='v20';ob['preserved']='Reference geometry, UV coordinates, source normals, material distinctions'
# Export the architectural model without presentation floor or lights.
bpy.context.view_layer.objects.active=ob;ob.select_set(True)
bpy.ops.export_scene.gltf(filepath=str(OUT/'ayasofya_v20.glb'),export_format='GLB',use_selection=True,export_apply=True)
# Studio scene; neutral surroundings and physically lit materials.
sc=bpy.context.scene;sc.render.engine='CYCLES';sc.cycles.samples=24;sc.cycles.use_denoising=True
sc.world.color=(.25,.25,.25);sc.world.use_nodes=True;sc.world.node_tree.nodes['Background'].inputs[0].default_value=(.65,.72,.82,1);sc.world.node_tree.nodes['Background'].inputs[1].default_value=.6
sc.view_settings.view_transform='AgX'
bpy.ops.mesh.primitive_plane_add(size=2000,location=(0,0,-.12));floor=bpy.context.object;floor.name='Studio_Floor'
mat=bpy.data.materials.new('Studio_Stone');mat.diffuse_color=(.64,.65,.64,1);floor.data.materials.append(mat)
bpy.ops.object.light_add(type='SUN',location=(80,-120,180));sun=bpy.context.object;sun.rotation_euler=(math.radians(25),math.radians(-25),math.radians(-25));sun.data.energy=2.4;sun.data.angle=math.radians(15)
lo=Vector(tuple(min(v[i] for v in vertices) for i in range(3)));hi=Vector(tuple(max(v[i] for v in vertices) for i in range(3)));center=(lo+hi)/2
print('BOUNDS',list(lo),list(hi),flush=True)
views={'guneydogu':(1,-1,.75),'kuzeydogu':(1,1,.75),'kuzeybati':(-1,1,.75),'guneybati':(-1,-1,.75)}
sc.render.resolution_x=1200;sc.render.resolution_y=1000;sc.render.resolution_percentage=100
cameras={}
for name,direction in views.items():
 bpy.ops.object.camera_add(location=center+Vector(direction).normalized()*260)
 cam=bpy.context.object;cam.name='Camera_'+name;cam.rotation_euler=(center-cam.location).to_track_quat('-Z','Y').to_euler();cam.data.type='ORTHO';cam.data.ortho_scale=max(hi.x-lo.x,hi.y-lo.y)*1.3;cam.data.clip_end=2000;cameras[name]=cam
sc.camera=cameras['guneydogu']
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'ayasofya_v20.blend'),compress=True)
report={'source':str(SOURCE),'instances':instances,'triangles':len(faces),'duplicate_triangles_removed':duplicates,'materials':len(used),'bounds_m':[list(lo),list(hi)],'material_sources':{k:material_info[k] for k in used},'glb_bytes':(OUT/'ayasofya_v20.glb').stat().st_size}
(OUT/'kontrol_raporu.json').write_text(json.dumps(report,indent=2,ensure_ascii=False))
for name,cam in cameras.items():
 sc.camera=cam;sc.render.filepath=str(OUT/'renders'/f'{name}.png');bpy.ops.render.render(write_still=True)
