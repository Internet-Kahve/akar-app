import bpy, sys, math, mathutils
old, new, out_old, out_new = sys.argv[sys.argv.index('--')+1:][:4]
extra = sys.argv[sys.argv.index('--')+1:][4:]
W, Hh = 1800, 1600
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
def setup(sc):
    sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True
    try: sc.cycles.device = 'CPU'
    except: pass
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'
    sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
    w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
    bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND")
    bg.inputs[0].default_value = (0.80, 0.80, 0.80, 1); bg.inputs[1].default_value = 1.0
    sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
    sun.data.energy = 1.25; sun.data.angle = math.radians(35); sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
    sc.render.resolution_x = W; sc.render.resolution_y = Hh; sc.render.film_transparent = True
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
def bounds():
    pts = []
    for o in bpy.data.objects:
        if o.type == 'MESH':
            for c in o.bound_box: pts.append(o.matrix_world @ mathutils.Vector(c))
    return pts
cam_cfg = None
def camera(sc, pts, cfg):
    el, az = math.radians(32), math.radians(45)
    d = mathutils.Vector((math.sin(az)*math.cos(el), -math.cos(az)*math.cos(el), math.sin(el)))
    cam = bpy.data.objects.new("_cam", bpy.data.cameras.new("_cam")); sc.collection.objects.link(cam); sc.camera = cam
    cam.data.type = 'ORTHO'
    ctr = cfg['ctr'] if cfg else sum(pts, mathutils.Vector()) / len(pts)
    cam.location = ctr + d * 400
    cam.rotation_euler = (-d).to_track_quat('-Z', 'Y').to_euler()
    cam.data.clip_end = 2000
    if cfg: cam.data.ortho_scale = cfg['scale']
    else:
        q = cam.rotation_euler.to_quaternion().inverted()
        loc = [q @ (p - cam.location) for p in pts]
        xs = [v.x for v in loc]; ys = [v.y for v in loc]
        wx = max(xs) - min(xs); wy = max(ys) - min(ys)
        cam.data.ortho_scale = max(wx, wy * W / Hh) * 1.06
        # merkez kaydır
        cx = (max(xs) + min(xs)) / 2; cy = (max(ys) + min(ys)) / 2
        cam.location = cam.location + cam.rotation_euler.to_quaternion() @ mathutils.Vector((cx, cy, 0))
        cfg = {'ctr': ctr, 'scale': cam.data.ortho_scale, 'loc': cam.location.copy(), 'rot': cam.rotation_euler.copy()}
        return cfg
    cam.location = cfg['loc']; cam.rotation_euler = cfg['rot']
    return cfg
cfg = None
for path, outp in ((old, out_old), (new, out_new)):
    reset(); bpy.ops.import_scene.gltf(filepath=path)
    sc = bpy.context.scene; setup(sc)
    pts = bounds()
    if cfg is None: cfg = camera(sc, pts, None)
    else:
        cam = bpy.data.objects.new("_cam", bpy.data.cameras.new("_cam")); sc.collection.objects.link(cam); sc.camera = cam
        cam.data.type = 'ORTHO'; cam.data.ortho_scale = cfg['scale']; cam.location = cfg['loc']; cam.rotation_euler = cfg['rot']; cam.data.clip_end = 2000
    sc.render.filepath = outp; bpy.ops.render.render(write_still=True)
