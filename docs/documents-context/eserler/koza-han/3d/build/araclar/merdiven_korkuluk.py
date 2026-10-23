# v09 sahnesinden merdiven korkuluklarının 4 yüzü (sol/sağ × iç/dış): blender -b --python merdiven_korkuluk.py
import bpy, math
from mathutils import Vector
URETIM = "/Users/ksenophon/Desktop/internet-kahve/akar-app/docs/documents-context/eserler/koza-han/3d"
bpy.ops.wm.open_mainfile(filepath=URETIM + "/blend/koza-han_v11.blend")
ap = 3.39; ph = math.radians(135); dv = Vector((math.cos(ph), math.sin(ph))); tv = Vector((-dv.y, dv.x))
P = lambda u, lat, z: Vector((dv.x * u + tv.x * lat, dv.y * u + tv.y * lat, z))
sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'; sc.render.film_transparent = False
for o in bpy.data.objects:
    if o.type == "MESH": o.hide_render = o.name.startswith(("Zemin", "Olcek", "Cevre"))
V = {"sag_dis_dik": (P(ap + 2.7, 7.0, 2.3), P(ap + 2.7, 1.2, 2.2)), "sol_dis_dik": (P(ap + 2.7, -7.0, 2.3), P(ap + 2.7, -1.2, 2.2)), "sag_ic_dik": (P(ap + 2.7, -0.35, 2.3), P(ap + 2.7, 1.1, 2.1)), "sol_ic_dik": (P(ap + 2.7, 0.35, 2.3), P(ap + 2.7, -1.1, 2.1)), "sag_ic": (P(ap + 0.9, -0.55, 4.0), P(ap + 3.0, 1.1, 2.3)), "sol_ic": (P(ap + 0.9, 0.55, 4.0), P(ap + 3.0, -1.1, 2.3)),
     "sag_dis": (P(ap + 1.6, 6.0, 2.6), P(ap + 2.8, 1.2, 2.2)), "sol_dis": (P(ap + 1.6, -6.0, 2.6), P(ap + 2.8, -1.2, 2.2))}
for ad, (l, t) in V.items():
    cd = bpy.data.cameras.new(ad); cd.lens = (40 if 'dis_dik' in ad else 20) if 'dik' in ad else 26; cd.clip_start = 0.05; c = bpy.data.objects.new(ad, cd); sc.collection.objects.link(c); c.location = l
    c.rotation_euler = (t - l).to_track_quat('-Z', 'Y').to_euler(); sc.camera = c
    sc.render.resolution_x, sc.render.resolution_y = 1200, 900; sc.render.filepath = f"{URETIM}/kontrol/v11/merdiven_kor_{ad}.png"; bpy.ops.render.render(write_still=True)
