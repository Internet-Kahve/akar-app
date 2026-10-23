"""AKAR · koza-han_v14: yalnız renk ve pişirilmiş ışık (21 Ekim 2026, ortak palet; _GENEL_SAHNE_STANDARDI.md §3).
Girdi : ../blend/koza-han_v13.blend (dokunulmaz)  ·  ayar: ../../../_kutuphane/palet_v2/ayar/koza-han.json
Çıktı : ../blend/koza-han_v14.blend (geometri, koleksiyon, parça adı aynı; malzeme baseColor + AO/yükseklik gradyanı yeni)
Çalıştır: Blender -b ../blend/koza-han_v13.blend --python build_v14.py
Mantık _kutuphane/palet_v2/palet_blend.py içindedir (GLB hattı palet.mjs ile birebir aynı değerler).
"""
import sys, os, runpy
_AY = os.path.dirname(os.path.abspath(__file__))
_K = os.path.normpath(os.path.join(_AY, "..", "..", "..", "_kutuphane", "palet_v2"))
sys.argv = [sys.argv[0], "--", os.path.join(_K, "ayar", "koza-han.json"), os.path.normpath(os.path.join(_AY, "..", "blend", "koza-han_v14.blend"))]
runpy.run_path(os.path.join(_K, "palet_blend.py"), run_name="__main__")
