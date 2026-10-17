# Koza Han · bir sürümün .blend dosyasını AÇIK Blender'a yükler (MCP for Blender eklentisi, port 9876).
# Kullanım: uv run --no-project --python 3.12 python blender_yukle.py v02o
# Önceki "KozaHan_v0*" koleksiyonlarını siler, seçilen sürümü "KozaHan_<sürüm>" koleksiyonuna ekler, görünümü dokulu yapar.
import json, os, socket, sys

surum = sys.argv[1] if len(sys.argv) > 1 else "v02o"
yol = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "blend", f"koza-han_{surum}.blend"))

CODE = f'''
import bpy
yol = r"{yol}"
for c in [c for c in bpy.data.collections if c.name.startswith("KozaHan_v0")]:
    for o in list(c.objects): bpy.data.objects.remove(o, do_unlink=True)
    bpy.data.collections.remove(c)
for o in [o for o in bpy.data.objects if o.get("koza_v01")]: bpy.data.objects.remove(o, do_unlink=True)
col = bpy.data.collections.new("KozaHan_{surum}"); bpy.context.scene.collection.children.link(col)
with bpy.data.libraries.load(yol, link=False) as (src, dst):
    dst.objects = [n for n in src.objects if not n.startswith("_")]
for o in dst.objects:
    if o is not None: o["koza_v01"] = True; col.objects.link(o)
for a in bpy.context.screen.areas:
    if a.type == "VIEW_3D":
        for s in a.spaces:
            if s.type == "VIEW_3D": s.shading.type = "SOLID"; s.shading.color_type = "TEXTURE"; s.clip_end = 2000
print("YUKLENDI", "{surum}")
'''

s = socket.create_connection(("localhost", 9876), timeout=60)
s.sendall(json.dumps({"type": "execute_code", "params": {"code": CODE}}).encode())
buf = b""
while True:
    chunk = s.recv(65536)
    if not chunk: break
    buf += chunk
    try:
        print(json.loads(buf)); break
    except json.JSONDecodeError:
        continue
s.close()
