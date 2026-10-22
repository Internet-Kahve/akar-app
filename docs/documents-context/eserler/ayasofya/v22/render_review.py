import bpy, math, hashlib, json
from pathlib import Path
from mathutils import Matrix, Vector

P = Path(__file__).parent
OUT = P / 'inceleme-2026-10-22'
OUT.mkdir(exist_ok=True)
bpy.ops.wm.open_mainfile(filepath=str(P / 'ayasofya_v22.blend'))
for obj in list(bpy.data.objects):
    if obj.name.startswith('V22_'):
        bpy.data.objects.remove(obj, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=str(P / 'ayasofya_v22.glb'))
scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.cycles.use_denoising = True
scene.render.resolution_x = 1600
scene.render.resolution_y = 1200
scene.render.resolution_percentage = 100
R = Matrix.Rotation(math.radians(-32.68), 4, 'Z')
views = [
    ('01_guneydogu', (160,-190,160), (0,-12,25), 205),
    ('02_kuzeybati', (-170,175,150), (-5,-8,25), 205),
    ('03_dogu_detay', (150,-95,100), (22,0,30), 113),
    ('04_galeri_detay', (5,-150,92), (0,-23,28), 105),
    ('05_bati_giris', (-150,65,85), (-55,0,17), 100),
    ('06_ust', (0,-10,250), (0,-10,0), 205),
]
for name, pos, target, scale in views:
    pos, target = R @ Vector(pos), R @ Vector(target)
    bpy.ops.object.camera_add(location=pos)
    camera = bpy.context.object
    camera.rotation_euler = (target-pos).to_track_quat('-Z','Y').to_euler()
    camera.data.type = 'ORTHO'
    camera.data.ortho_scale = scale
    scene.camera = camera
    scene.render.filepath = str(OUT / (name+'.png'))
    bpy.ops.render.render(write_still=True)
(OUT / 'render_manifest.json').write_text(json.dumps({
    'source': 'ayasofya_v22.glb',
    'sha256': hashlib.sha256((P/'ayasofya_v22.glb').read_bytes()).hexdigest(),
    'views': [v[0] for v in views], 'samples': 32,
    'note': 'Delivered GLB reimported into existing studio; geometry unchanged.'
}, indent=2))
