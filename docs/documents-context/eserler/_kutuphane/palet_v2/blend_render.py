import bpy, sys, math, mathutils
mode, outdir = sys.argv[sys.argv.index('--') + 1:][:2]   # mode: eski | yeni
W, Hh = 1800, 1600
sc = bpy.context.scene
for o in list(bpy.data.objects):
    if o.type in ('LIGHT', 'CAMERA'): bpy.data.objects.remove(o)
    elif o.type == 'MESH':
        hid = o.name.startswith(('REF', '_'))
        o.hide_render = hid; o.hide_viewport = hid
for c in bpy.data.collections: c.hide_render = False
sc.render.engine = 'CYCLES'; sc.cycles.samples = 24; sc.cycles.use_denoising = True
sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0; sc.view_settings.gamma = 1.0
w = bpy.data.worlds.new("_w"); w.use_nodes = True; sc.world = w
bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND"); bg.inputs[0].default_value = (0.8,0.8,0.8,1); bg.inputs[1].default_value = 1.0
sun = bpy.data.objects.new("_sun", bpy.data.lights.new("_sun", 'SUN')); sc.collection.objects.link(sun)
sun.data.energy = 1.25; sun.data.angle = math.radians(35); sun.rotation_euler = (math.radians(50), 0, math.radians(-35))
sc.render.resolution_x = W; sc.render.resolution_y = Hh; sc.render.film_transparent = True
sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
cam = bpy.data.objects.new("_cam", bpy.data.cameras.new("_cam")); sc.collection.objects.link(cam); sc.camera = cam
cam.data.type = 'ORTHO'; cam.data.clip_end = 2000
pts = [o.matrix_world @ mathutils.Vector(c) for o in bpy.data.objects if o.type == 'MESH' and not o.hide_render for c in o.bound_box]
ctr = sum(pts, mathutils.Vector()) / len(pts)
def aim(azdeg):
    el, az = math.radians(32), math.radians(azdeg)
    d = mathutils.Vector((math.sin(az)*math.cos(el), -math.cos(az)*math.cos(el), math.sin(el)))
    cam.location = ctr + d*400; cam.rotation_euler = (-d).to_track_quat('-Z','Y').to_euler()
    q = cam.rotation_euler.to_quaternion().inverted(); loc = [q @ (p - cam.location) for p in pts]
    xs=[v.x for v in loc]; ys=[v.y for v in loc]
    cam.data.ortho_scale = max(max(xs)-min(xs), (max(ys)-min(ys))*W/Hh)*1.06
    cam.location = cam.location + cam.rotation_euler.to_quaternion() @ mathutils.Vector(((max(xs)+min(xs))/2,(max(ys)+min(ys))/2,0))
views = (('guneydogu',45),) if mode == 'eski' else (('guneydogu',45),('kuzeydogu',135),('kuzeybati',225),('guneybati',315))
for name, az in views:
    aim(az); sc.render.filepath = f'{outdir}/{name}.png'; bpy.ops.render.render(write_still=True)
