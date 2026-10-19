# Executed inside build_v20.py after architectural meshes are complete.
# Context objects are schematic scale references, not surveyed trees or identifiable people.
skin=A.mat('Insan_Ten','#C68F6C');hair=A.mat('Insan_Sac','#43352D');pants=A.mat('Insan_Pantolon','#4F5864');shoe=A.mat('Insan_Ayakkabi','#403C37')
leaf=[A.mat('Agac_Yaprak_'+str(i),c) for i,c in enumerate(['#73835B','#89946A','#647650'])];bark=A.mat('Agac_Govde','#78634B')
def ellipsoid(g,c,rx,ry,rz,mat,n=12):
 before=set(g.bm.verts);c=Vector(c)
 prof=[(0,c.z-rz)]+[(math.sin(math.pi*k/8),c.z-rz*math.cos(math.pi*k/8)) for k in range(1,8)]+[(0,c.z+rz)]
 lathe(g,c.xy,prof,n,mat)
 for v in set(g.bm.verts)-before:
  v.co.x=c.x+(v.co.x-c.x)*rx;v.co.y=c.y+(v.co.y-c.y)*ry
for index,(x,y,h) in enumerate([(-42,-4,9),(41,8,8)]):
 g=A.G('Cevre_Agac_'+str(index+1))
 rod(g,(x,y,-.10),(x+.15,y,5.5),.22,bark,8)
 for j,(dx,dy,dz) in enumerate([(-1.6,0,0),(1.5,.3,.25),(0,1.35,.45),(0,-1.25,.15),(0,0,1.5)]):
  rod(g,(x,y,3.8),(x+dx,y+dy,h-2.5+dz),.10,bark,6)
  ellipsoid(g,(x+dx,y+dy,h-2.4+dz),2,1.8,1.8,leaf[j%3],12)
 g.obj()
people=[('Erkek_1',-8,-35,1.78,'#557A87',False),('Kadin_1',-6.8,-35.3,1.65,'#A56D59',True),('Cocuk_1',-5.8,-35.4,1.12,'#C7A34D',False),('Erkek_2',8,-42,1.74,'#6B7762',False),('Kadin_2',9.3,-41.7,1.68,'#7F718E',True),('Cocuk_2',10.3,-41.3,1.28,'#658DA7',False)]
CONTEXT_REPORT={'trees':2,'people':[]}
for name,x,y,H,color,skirt in people:
 g=A.G('Olcek_'+name);shirt=A.mat('Giysi_'+name,color)
 # Normalized anatomical proportions: feet at 0; head top at 1.
 def pt(a,b,z):return (x+a*H,y+b*H,.015+z*H)
 for side in (-1,1):
  rod(g,pt(side*.09,0,.06),pt(side*.075,0,.47),H*.045,pants,8)
  ellipsoid(g,pt(side*.09,-.025,.035),H*.05,H*.085,H*.035,shoe,10)
  rod(g,pt(side*.14,0,.74),pt(side*.20,-.015,.49),H*.033,shirt,8)
  ellipsoid(g,pt(side*.20,-.015,.475),H*.034,H*.035,H*.045,skin,10)
 if skirt:
  before=set(g.bm.verts);lathe(g,Vector((x,y)),[(.19*H,.015+.30*H),(.11*H,.015+.60*H)],12,shirt)
  for v in set(g.bm.verts)-before:v.co.y=y+(v.co.y-y)*.6
 ellipsoid(g,pt(0,0,.61),H*.135,H*.08,H*.18,shirt,12)
 rod(g,pt(0,0,.76),pt(0,0,.83),H*.035,skin,8)
 ellipsoid(g,pt(0,0,.89),H*.066,H*.063,H*.11,skin,12)
 ellipsoid(g,pt(0,.012,.94),H*.068,H*.062,H*.059,hair,12)
 ob=g.obj();ob['height_m']=H;CONTEXT_REPORT['people'].append({'name':ob.name,'height_m':H})
# Color all visible base surfaces explicitly in sRGB.
ground=A.mat('Zemin_F5F2EA','#F5F2EA')
for ob in bpy.data.objects:
 if ob.type=='MESH' and ob.name.startswith('Zemin'):
  ob.data.materials.clear();ob.data.materials.append(ground)
  for p in ob.data.polygons:p.material_index=0
# Center the entire composition including courtyard paving, trees and people as a single group.
base_names={'Zemin_Golge','Zemin_Kaide','Zemin_Cim'}
group=[o for o in bpy.data.objects if o.type=='MESH' and o.name not in base_names and not o.name.startswith(('_','REF'))]
bpy.context.view_layer.update()
coords=[o.matrix_world@Vector(c) for o in group for c in o.bound_box]
lo=Vector((min(v.x for v in coords),min(v.y for v in coords),0));hi=Vector((max(v.x for v in coords),max(v.y for v in coords),0))
SHIFT=-(lo+hi)/2
for ob in group:ob.location+=SHIFT
bpy.context.view_layer.update()
CENTER_REPORT={'translation_xy':list(SHIFT)[:2],'bounds_before':[list(lo)[:2],list(hi)[:2]],'bounds_after':[list(lo+SHIFT)[:2],list(hi+SHIFT)[:2]],'method':'world-space XY bounding box of complete composition excluding display base'}
# The complete footprint must stay within the existing elliptical display base.
assert max(((o.matrix_world@Vector(c)).x/59.8)**2+((o.matrix_world@Vector(c)).y/53.8)**2 for o in group for c in o.bound_box)<1
(OUT/'cevre_ve_ortalama.json').write_text(json.dumps({'centering':CENTER_REPORT,'context':CONTEXT_REPORT},ensure_ascii=False,indent=2))
