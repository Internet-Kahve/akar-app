"""AKAR · ulu-cami_v26: yalnız renk ve pişirilmiş ışık (21 Ekim 2026, ortak palet; _GENEL_SAHNE_STANDARDI.md §3).
Girdi : ../blend/ulu-cami_v25.blend (dokunulmaz)  ·  ayar: ../../../_kutuphane/palet_v2/ayar/ulu-cami.json
Çıktı : ../blend/ulu-cami_v26.blend (geometri, koleksiyon, parça adı aynı; malzeme baseColor + AO/yükseklik gradyanı yeni)
Çalıştır: Blender -b ../blend/ulu-cami_v25.blend --python build_v26.py
Mantık _kutuphane/palet_v2/palet_blend.py içindedir (GLB hattı palet.mjs ile birebir aynı değerler).
"""
import sys, os, runpy
_AY = os.path.dirname(os.path.abspath(__file__))
_K = os.path.normpath(os.path.join(_AY, "..", "..", "..", "_kutuphane", "palet_v2"))
sys.argv = [sys.argv[0], "--", os.path.join(_K, "ayar", "ulu-cami.json"), os.path.normpath(os.path.join(_AY, "..", "blend", "ulu-cami_v26.blend"))]
runpy.run_path(os.path.join(_K, "palet_blend.py"), run_name="__main__")
