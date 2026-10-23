# v07 sahnesinden v08 kapı kameralarıyla "önce" render'ları: blender -b --python onceki_kapi.py
import bpy, math
from mathutils import Vector
URETIM = "/Users/ksenophon/Desktop/internet-kahve/akar-app/docs/documents-context/eserler/koza-han/3d"
bpy.ops.wm.open_mainfile(filepath=URETIM + "/blend/koza-han_v07.blend")
IC_CY = 8.36; OY = 36.0; AY = 23.0; RY = 28.0; y2 = OY + 4.8 + 0.45; HOL_E = OY - 1.4
KAM = {"kapi_gecit_dis": ((40.0, IC_CY, 1.8), (32.0, IC_CY, 2.6), 24), "kapi_gecit_ic": ((14.0, IC_CY, 1.8), (24.0, IC_CY, 2.4), 24), "kapi_gecit_orta": ((31.0, IC_CY, 1.6), (24.0, IC_CY, 2.4), 20),
       "kapi_portal_dis": ((0.0, y2 + 9.0, 2.2), (0.0, OY, 3.8), 28), "kapi_portal_ic": ((0.0, AY - 6.0, 1.8), (0.0, RY, 2.8), 24), "kapi_portal_orta": ((0.0, OY + 3.0, 1.7), (0.0, HOL_E, 3.4), 22)}
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 16; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'; sc.render.film_transparent = True
for o in bpy.data.objects:
    if o.type == "MESH" and o.name.startswith("Zemin"): o.hide_render = True
for ad, (l, t, ln) in KAM.items():
    cd = bpy.data.cameras.new(ad); cd.lens = ln; cd.clip_end = 2000; c = bpy.data.objects.new(ad, cd); sc.collection.objects.link(c); c.location = Vector(l)
    c.rotation_euler = (Vector(t) - c.location).to_track_quat('-Z', 'Y').to_euler(); sc.camera = c
    sc.render.resolution_x, sc.render.resolution_y = 1400, 1000; sc.render.filepath = f"{URETIM}/kontrol/v08/_once_{ad}.png"; bpy.ops.render.render(write_still=True)
