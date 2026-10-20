"""Ulu Cami v25 = v24 + AĞAÇ DOKUSU (19 Ekim 2026, kullanıcı isteği: Orhan Bey Camii v06'daki yaprak dokusu + gövdeye tahta/kabuk dokusu).
Yalnız ağaç malzemelerine doku bağlanır ve ağaç nesnelerine UV yazılır; bina, kaide, palet, figür, parça adları ve geometri v24 ile aynı.
Girdi : ../blend/ulu-cami_v24.blend
Çıktı : ../blend/ulu-cami_v25.blend, ../export/ulu-cami_v25.glb (kaidesiz, dünya koordinatlı), ../export/ulu-cami_v25_sunum.glb (kaide merkezi orijinde), ../kontrol/v25/
Çalıştır: Blender -b ../blend/ulu-cami_v24.blend --python build_v25.py -- A   (A: doku + GLB + blend)
          Blender -b ../blend/ulu-cami_v25.blend --python build_v25.py -- R   (R: ağaç yakın çekim + havadan render)
Doku: doku/yaprak_7FA35B.png, yaprak_93B46A.png, yaprak_6E9450.png (Orhan v06 ile aynı), yaprak_3F7A5C.png (servi), agac_govde.png;
      üretici ve UV kuralı: eserler/_kutuphane/agac_doku.py  (python agac_doku.py ulu-cami/3d/build/doku "#3F7A5C")
"""
import bpy, math, sys, os, json, hashlib
import numpy as np
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ESER = os.path.dirname(HERE)                                   # ulu-cami/3d
sys.path.insert(0, os.path.join(ESER, "..", "..", "_kutuphane"))
import agac_doku as AD

ASAMA = (sys.argv[sys.argv.index("--") + 1] if "--" in sys.argv else "A").upper()
KONTROL = os.path.join(ESER, "kontrol", "v25")
BLEND = os.path.join(ESER, "blend", "ulu-cami_v25.blend")
EXPORT = os.path.join(ESER, "export", "ulu-cami_v25.glb")
EXPORT_SUNUM = os.path.join(ESER, "export", "ulu-cami_v25_sunum.glb")
DOKU = os.path.join(HERE, "doku")
K_MERKEZ = Vector((0.55, 4.61))                                # v24 daire kaide merkezi (değişmedi)
sc = bpy.context.scene
os.makedirs(KONTROL, exist_ok=True)

YAPRAK = {"Agac_Yaprak_0": "yaprak_7FA35B.png", "Agac_Yaprak_1": "yaprak_93B46A.png", "Agac_Yaprak_2": "yaprak_6E9450.png", "Agac_Servi": "yaprak_3F7A5C.png"}
GOVDE = {"Agac_Govde": "agac_govde.png"}


def mesh_sha(o):
    me = o.data; mw = o.matrix_world
    v = np.array([tuple(mw @ p.co) for p in me.vertices], dtype=np.float64).round(5)
    f = [(tuple(p.vertices), p.material_index) for p in me.polygons]
    h = hashlib.sha256(); h.update(v.tobytes()); h.update(repr(f).encode()); return h.hexdigest()


if ASAMA == "A":
    RAPOR = {}
    agaclar = [o for o in bpy.data.objects if o.type == "MESH" and o.name.startswith("Cevre_Agac")]
    sha0 = {o.name: mesh_sha(o) for o in bpy.data.objects if o.type == "MESH"}
    RAPOR["agac_yuz"] = AD.agac_dokula(agaclar, DOKU, YAPRAK, GOVDE)
    RAPOR["geometri_degismedi"] = all(mesh_sha(o) == sha0[o.name] for o in bpy.data.objects if o.type == "MESH")
    RAPOR["draw_call"] = sum(len(o.material_slots) for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_")))

    # dışa aktarım (v24 ile aynı yöntem): ana GLB kaidesiz ve dünya koordinatlı; sunum GLB daire merkezine ortalı
    konum0 = {o.name: o.location.copy() for o in bpy.data.objects if o.type == "MESH"}
    def sec(zemin):
        bpy.ops.object.select_all(action='DESELECT')
        for o in bpy.data.objects:
            if o.type == "MESH" and not o.name.startswith(("REF", "_")) and (zemin or not o.name.startswith("Zemin")): o.select_set(True)
    def ortala(k):
        for o in bpy.data.objects:
            if o.type == "MESH" and not o.name.startswith(("REF", "_")):
                if k: o.location.x = konum0[o.name].x - K_MERKEZ.x; o.location.y = konum0[o.name].y - K_MERKEZ.y
                else: o.location = konum0[o.name].copy()
    kw = dict(export_format='GLB', use_selection=True, export_apply=True, export_yup=True, export_cameras=False, export_lights=False)
    os.makedirs(os.path.dirname(EXPORT), exist_ok=True); RAPOR["glb"] = {}
    kafes_bag = []                                              # v24 notu: şebeke Alpha'sı yalnız dışa aktarımda doğrudan BSDF Alpha'ya
    for a_ in ("Kafes_Beyaz", "Kafes_Beyaz.001"):
        nt_ = bpy.data.materials[a_].node_tree; bs_ = next(n for n in nt_.nodes if n.type == "BSDF_PRINCIPLED"); tx_ = next(n for n in nt_.nodes if n.type == "TEX_IMAGE")
        kafes_bag.append((nt_, bs_, [l.from_socket for l in bs_.inputs["Alpha"].links])); nt_.links.new(tx_.outputs["Alpha"], bs_.inputs["Alpha"])
    for yol, zemin in ((EXPORT, False), (EXPORT_SUNUM, True)):
        ortala(zemin); sec(zemin)
        try: bpy.ops.export_scene.gltf(filepath=yol, export_draco_mesh_compression_enable=True, **kw); dr = True
        except Exception: bpy.ops.export_scene.gltf(filepath=yol, **kw); dr = False
        RAPOR["glb"][os.path.basename(yol)] = {"draco": dr, "boyut_mb": round(os.path.getsize(yol) / 1e6, 3)}
    ortala(False)
    for nt_, bs_, eskiler in kafes_bag:
        for l in list(bs_.inputs["Alpha"].links): nt_.links.remove(l)
        for fs in eskiler: nt_.links.new(fs, bs_.inputs["Alpha"])
    bpy.ops.file.pack_all()
    bpy.ops.wm.save_as_mainfile(filepath=BLEND)
    with open(os.path.join(KONTROL, "kontrol_rapor.json"), "w", encoding="utf-8") as fh: json.dump(RAPOR, fh, ensure_ascii=False, indent=1)
    print("TAMAM A", json.dumps(RAPOR, ensure_ascii=False))

elif ASAMA == "R":
    def kamera(loc, tgt, lens=50):
        cd = bpy.data.cameras.new("_c"); cd.lens = lens; cd.clip_end = 3000
        cam = bpy.data.objects.new("_c", cd); sc.collection.objects.link(cam); sc.camera = cam; cam.location = loc
        cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    def render(ad, res, ornek=32):
        sc.render.engine = 'CYCLES'; sc.cycles.samples = int(os.environ.get("RV25_ORNEK", ornek)); sc.cycles.device = 'CPU'
        sc.render.resolution_x, sc.render.resolution_y = res; sc.render.film_transparent = False
        sc.render.filepath = os.path.join(KONTROL, ad); bpy.ops.render.render(write_still=True)
    kamera((-3.0, -36.0, 3.2), (-8.8, -25.2, 4.2), lens=35); render("agac_yakin_cinar.png", (1400, 1000))
    kamera((-2.0, -48.0, 9.0), (1.5, -24.5, 5.0), lens=30); render("agac_avlu.png", (1600, 1000))
