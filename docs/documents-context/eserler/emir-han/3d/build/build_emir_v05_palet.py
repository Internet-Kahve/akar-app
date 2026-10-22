"""AKAR · emir-hani_v05 · 2. adım: ham blend'e ortak palet + yumuşak AO (v04 ile aynı ayar), sonra GLB'ler (22 Ekim 2026).
Girdi : ../kontrol/_tmp/emir-hani_v05_ham.blend (build_emir_v05.py; v03 paleti, AO, CAM_* kameraları)
        ayar: ../../../_kutuphane/palet_v2/ayar/emir-han.json (v04'te kullanılanın aynısı; dosyaya dokunulmaz)
Çıktı : ../blend/emir-hani_v05.blend
        ../export/emir-hani_v05.glb        uygulama: yalnız yapı (Cevre_*, Olcek_Insan_*, Zemin_* yok), Blender Draco, orijin avlu ortası
        ../export/emir-hani_v05_sunum.glb  kaide + sokak + ağaç + figür; orijin kaide merkezi; gltf-transform ile Draco (v04 finalize.mjs adımı)
Çalıştır: Blender -b ../kontrol/_tmp/emir-hani_v05_ham.blend --python build_emir_v05_palet.py
GT_DIR: @gltf-transform + draco3dgltf kurulu klasör (varsayılan /private/tmp/claude-501/gt; kurulum _kutuphane/glb_temizle.mjs başında).
v04 hattı: _kutuphane/palet_v2/palet_blend.py + blend_export.py + finalize.mjs; burada aynı adımlar tek betikte.
"""
import sys, os, json, runpy, subprocess
import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
URETIM = os.path.dirname(HERE)
KUT = os.path.normpath(os.path.join(HERE, "..", "..", "..", "_kutuphane"))
TMP = os.path.join(URETIM, "kontrol", "_tmp")
BLEND = os.path.join(URETIM, "blend", "emir-hani_v05.blend")
EXPORT = os.path.join(URETIM, "export", "emir-hani_v05.glb")
EXPORT_SUNUM = os.path.join(URETIM, "export", "emir-hani_v05_sunum.glb")
GT_DIR = os.environ.get("GT_DIR", "/private/tmp/claude-501/gt")
NODE = os.environ.get("NODE", "node")

# ---------- 1) ortak palet (v04 ile aynı ayar ve mantık) ----------
sys.argv = [sys.argv[0], "--", os.path.join(KUT, "palet_v2", "ayar", "emir-han.json"), BLEND]
runpy.run_path(os.path.join(KUT, "palet_v2", "palet_blend.py"), run_name="__main__")

# ---------- 2) GLB (blend_export.py: aynı ayarlar; ham blend avlu ortasında, kaide merkezi olcu_dogrulama.json'dan) ----------
olcu = json.load(open(os.path.join(TMP, "emir_v05_ham", "olcu_dogrulama.json"), encoding="utf-8"))
kx, ky = olcu["kaide"]["merkez_m"]
YAPI_DISI = ("Zemin", "Cevre_", "Olcek_Insan_")
tum = [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_"))]
def disa_aktar(objs, yol, tx=0.0, ty=0.0):
    for o in tum: o.location.x += tx; o.location.y += ty
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs: o.select_set(True)
    kw = dict(filepath=yol, export_format="GLB", use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
    try: bpy.ops.export_scene.gltf(export_draco_mesh_compression_enable=True, **kw)
    except Exception: bpy.ops.export_scene.gltf(**kw)
    for o in tum: o.location.x -= tx; o.location.y -= ty
    bpy.context.view_layer.update()
disa_aktar([o for o in tum if not o.name.startswith(YAPI_DISI)], EXPORT)
ham_sunum = os.path.join(TMP, "emir-hani_v05_sunum_ham.glb")
disa_aktar(tum, ham_sunum, -kx, -ky)

# ---------- 3) sunum: _cevre soneki + gltf-transform Draco (v04 finalize.mjs); uygulama: glb_temizle (son adım, standart §5.5) ----------
fin = os.path.join(TMP, "_finalize_v05.mjs")
with open(fin, "w") as fh:
    fh.write("""// palet_v2/lib.mjs writeDraco ile aynı ayar (EDGEBREAKER, QP 14); paketler GT_DIR'den (glb_temizle.mjs yöntemi)
import { createRequire } from 'module'; import path from 'path';
const require = createRequire(path.join(process.env.GT_DIR, 'x.js'));
const { NodeIO } = require('@gltf-transform/core'); const { ALL_EXTENSIONS, KHRDracoMeshCompression } = require('@gltf-transform/extensions');
const { prune } = require('@gltf-transform/functions'); const draco3d = require('draco3dgltf');
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'draco3d.decoder': await draco3d.createDecoderModule(), 'draco3d.encoder': await draco3d.createEncoderModule() });
const doc = await io.read(process.argv[2]); let n = 0;
for (const m of doc.getRoot().listMaterials()) if (/_cevre$/.test(m.getName())) { m.setName(m.getName().replace(/_cevre$/, '')); n++; }
await doc.transform(prune({ keepLeaves: true }));
const ext = doc.getRoot().listExtensionsUsed().find(e => e.extensionName === 'KHR_draco_mesh_compression') || doc.createExtension(KHRDracoMeshCompression); ext.setRequired(true);
ext.setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER, quantizationBits: { POSITION: 14, NORMAL: 10, COLOR: 8, TEX_COORD: 12, GENERIC: 12 } });
await io.write(process.argv[3], doc); console.log('FINALIZE _cevre soneki kaldırılan', n);
""")
env = dict(os.environ, GT_DIR=GT_DIR)
for arg in ([fin, ham_sunum, EXPORT_SUNUM], [os.path.join(KUT, "glb_temizle.mjs"), EXPORT]):
    r = subprocess.run([NODE] + arg, env=env, capture_output=True, text=True); print(r.stdout, r.stderr); r.check_returncode()
os.remove(fin)
print("GLB", EXPORT, os.path.getsize(EXPORT), EXPORT_SUNUM, os.path.getsize(EXPORT_SUNUM))
