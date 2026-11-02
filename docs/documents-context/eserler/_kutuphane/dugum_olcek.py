"""AKAR · düğüm ölçeği (2 Kasım 2026): aynı düzlemde çakışan iki parçayı (z-fighting) GLB'yi yeniden dışa aktarmadan ayırır.

Bir kök düğüme, kendi kutusunun ortasına göre yatay ölçek verir (glTF'de Y yukarı; X ve Z ölçeklenir, yükseklik
değişmez). Düğümün dönüşü olmamalı. Sıkıştırılmış geometri, malzemeler ve öbür düğümler olduğu gibi kalır.

Kullanım:  python3 dugum_olcek.py <ayar.json> <dosya.glb> [<dosya.glb> ...]
ayar.json: {"Revak_Tonozlari": 0.998, "Cati": 1.001}   (dosyada olmayan düğüm atlanır)

Nasıl bulunur: çakışan yüz çiftleri Blender'da düzlem eşlemesiyle taranır; alt yüzler (aşağı bakan) görünmediği
için yalnız yan ve üst yüzler ele alınır. Ölçek, iki yüzü birkaç santim ayıracak kadar küçük seçilir.
"""
import json, struct, sys


def read_glb(path):
    data = open(path, "rb").read()
    magic, version, total = struct.unpack_from("<III", data, 0)
    assert magic == 0x46546C67, path
    length, kind = struct.unpack_from("<II", data, 12)
    assert kind == 0x4E4F534A
    gltf = json.loads(data[20:20 + length])
    rest = data[20 + length:]
    return gltf, rest


def write_glb(path, gltf, rest):
    text = json.dumps(gltf, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    text += b" " * ((4 - len(text) % 4) % 4)
    head = struct.pack("<III", 0x46546C67, 2, 12 + 8 + len(text) + len(rest))
    open(path, "wb").write(head + struct.pack("<II", len(text), 0x4E4F534A) + text + rest)


def mesh_box(gltf, mesh):
    lo, hi = [float("inf")] * 3, [float("-inf")] * 3
    for prim in gltf["meshes"][mesh]["primitives"]:
        acc = gltf["accessors"][prim["attributes"]["POSITION"]]
        lo = [min(a, b) for a, b in zip(lo, acc["min"])]
        hi = [max(a, b) for a, b in zip(hi, acc["max"])]
    return lo, hi


def scale_node(gltf, name, s):
    node = next((n for n in gltf["nodes"] if n.get("name") == name), None)
    if node is None:
        return False
    assert "matrix" not in node and not any(abs(r) > 1e-9 for r in node.get("rotation", [0, 0, 0, 1])[:3]), name
    assert "mesh" in node and not node.get("children"), f"{name}: yalnız alt düğümü olmayan parça"
    t = node.get("translation", [0, 0, 0])
    old = node.get("scale", [1, 1, 1])
    lo, hi = mesh_box(gltf, node["mesh"])
    # Kutunun dünya ortası (X, Z); ölçek bu nokta sabit kalacak biçimde uygulanır.
    c = [t[i] + old[i] * (lo[i] + hi[i]) / 2 for i in range(3)]
    k = [s, 1, s]
    node["scale"] = [old[i] * k[i] for i in range(3)]
    node["translation"] = [c[i] + k[i] * (t[i] - c[i]) for i in range(3)]
    return True


if __name__ == "__main__":
    ayar = json.load(open(sys.argv[1]))
    for path in sys.argv[2:]:
        gltf, rest = read_glb(path)
        done = [n for n, s in ayar.items() if scale_node(gltf, n, s)]
        write_glb(path, gltf, rest)
        print(path.split("/")[-1], "→", ", ".join(done) or "değişiklik yok")
