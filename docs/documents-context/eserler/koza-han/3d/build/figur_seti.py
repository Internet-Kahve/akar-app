# AKAR · ortak ölçek figürü seti önizlemesi: 4 poz yakın plan (kontrol/<surum>/figur_seti.png) + kadın/çocuk varyantları (figur_seti_varyant.png)
# Çalıştırma: blender -b --python build/figur_seti.py
import sys, os, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.normpath(os.path.join(HERE, *[".."] * 3, "_kutuphane")))
import bpy, akar3d as A
from mathutils import Vector
KONTROL = os.path.join(os.path.dirname(HERE), "kontrol", "v03"); os.makedirs(KONTROL, exist_ok=True)
A.temizle()
def zemin():
    g = A.G("Zemin_Tahta"); g.prism([Vector((-6, -3)), Vector((6, -3)), Vector((6, 3)), Vector((-6, 3))], -0.3, 0.0, A.mat("Zemin", "#C4BDAF", 0.9), A.mat("Zemin", "#C4BDAF", 0.9)); g.obj()
sc = bpy.context.scene
sc.render.engine = 'CYCLES'; sc.cycles.samples = 48; sc.cycles.use_denoising = True; sc.cycles.device = 'CPU'
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND"); bg.inputs[0].default_value = (0.80, 0.80, 0.80, 1)
sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = 1.25; sun.data.angle = math.radians(35); sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
def cam(loc, hedef, lens=60):
    cd = bpy.data.cameras.new("_c"); cd.lens = lens; c = bpy.data.objects.new("_c", cd); sc.collection.objects.link(c); sc.camera = c
    c.location = Vector(loc); c.rotation_euler = (Vector(hedef) - c.location).to_track_quat('-Z', 'Y').to_euler()
OVAL = os.environ.get('FIGUR_OVAL', '0') == '1'
def sahne(liste, dosya, genis):
    for o in [o for o in bpy.data.objects if o.name.startswith(("Olcek", "Zemin"))]: bpy.data.objects.remove(o, do_unlink=True)
    zemin()
    for i, kw in enumerate(liste):
        A.insan(f"Olcek_Insan_{i + 1:02d}", oval=OVAL, **kw)
        if kw["poz"] == "basamak":
            f = Vector((math.cos(math.radians(kw["yon"])), math.sin(math.radians(kw["yon"])))); c = Vector(kw["konum"][:2]) + f * 0.30 * kw["boy"] / 1.75 + f * 0.1
            g = A.G("Zemin_Basamak"); mz = A.mat("Zemin", "#C4BDAF", 0.9); g.prism(A.rect(c, 0.9, 1.2, math.radians(kw["yon"])), 0.0, 0.25, mz, mz); g.obj()
    for c in [o for o in bpy.data.objects if o.type == "CAMERA"]: bpy.data.objects.remove(c, do_unlink=True)
    cam((0, -genis, 1.35), (0, 0, 0.9), lens=40)
    sc.render.resolution_x, sc.render.resolution_y = 2000, 800; sc.render.film_transparent = False
    sc.render.filepath = os.path.join(KONTROL, dosya); bpy.ops.render.render(write_still=True)
    print("TRI", dosya, {o.name: len(o.data.polygons) for o in bpy.data.objects if o.name.startswith("Olcek")}, flush=True)
    print("MESH", A.mesh_kontrol([o for o in bpy.data.objects if o.name.startswith("Olcek")]), flush=True)
adim = 1.55
def basamak_blok():
    g = A.G('Zemin_Basamak'); m = A.mat('Zemin', '#C4BDAF', 0.9); g.prism([Vector((1.4, -1)), Vector((4.4, -1)), Vector((4.4, 1)), Vector((1.4, 1))], 0, 0.25, m, m); g.obj()
sahne([dict(poz="ayakta", boy=1.76, konum=(-3 * adim / 2 * 1.2, 0, 0), yon=270, renk=0), dict(poz="yuruyen", boy=1.78, konum=(-adim / 2 * 1.2, 0, 0), yon=315, renk=1),
       dict(poz="oturan", boy=1.74, konum=(adim / 2 * 1.2, 0, 0), yon=300, renk=2), dict(poz="basamak", boy=1.72, konum=(3 * adim / 2 * 1.2, 0, 0), yon=300, renk=0)], ("figur_seti_oval.png" if OVAL else "figur_seti.png"), 9.5)
sahne([dict(poz="ayakta", boy=1.66, kadin=True, konum=(-3.0, 0, 0), yon=290, renk=1), dict(poz="yuruyen", boy=1.64, kadin=True, konum=(-1.0, 0, 0), yon=315, renk=0),
       dict(poz="basamak", boy=1.62, kadin=True, konum=(1.0, 0, 0), yon=300, renk=2), dict(poz="ayakta", boy=1.20, cocuk=True, konum=(3.0, 0, 0), yon=270, renk=1)], ("figur_seti_varyant_oval.png" if OVAL else "figur_seti_varyant.png"), 9.5)
