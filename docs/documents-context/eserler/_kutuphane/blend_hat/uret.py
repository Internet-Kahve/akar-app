"""AKAR · blend_hat zinciri (29 Ekim 2026): blend → teslim GLB'leri. Her eserin build_vXX.py dosyası bunu çağırır.
Adımlar: (1) ref.mjs: konum referansı GLB'lerinin düğüm kutuları  (2) Blender + blend_cikti.py: palet, Yer_Golgesi temizliği, yeni blend, ham GLB
         (3) blend_son.mjs: AO tek kanal JPEG, COLOR_0 ve sıfır alanlı üçgen temizliği, Draco  (4) glb_temizle.mjs (uygulama GLB'si; standart §5.5)
Kullanım: GT_DIR=<gltf-transform + draco3dgltf + sharp> python3 uret.py <eser> <girdi_surum> <yeni_surum> <konum_ref_surum> [cikis_klasoru]
  cikis_klasoru verilmezse ../<eser>/3d/export/ (üzerine yazar).
"""
import sys, os, json, subprocess, tempfile
AY = os.path.dirname(os.path.abspath(__file__)); ES = os.path.dirname(os.path.dirname(AY))
BL = os.environ.get('BLENDER', '/Applications/Blender.app/Contents/MacOS/Blender'); NODE = os.environ.get('NODE', 'node')
eser, girdi, yeni, konum = sys.argv[1:5]
C = json.load(open(os.path.join(AY, 'eserler.json')))[eser]; ad = C['ad']
U = os.path.join(ES, eser, '3d'); X = os.path.join(U, 'export'); cikis = sys.argv[5] if len(sys.argv) > 5 else X
os.makedirs(cikis, exist_ok=True); T = tempfile.mkdtemp(prefix=f'blend_hat_{eser}_')
def kos(*a): r = subprocess.run(a, capture_output=True, text=True); print(r.stdout[-2000:], r.stderr[-2000:] if r.returncode else ''); r.check_returncode(); return r.stdout
kos(NODE, os.path.join(AY, 'ref.mjs'), os.path.join(X, f'{ad}_{konum}.glb'), os.path.join(X, f'{ad}_{konum}_sunum.glb'), os.path.join(T, 'ref.json'))
kos(BL, '-b', os.path.join(U, 'blend', f'{ad}_{girdi}.blend'), '--python', os.path.join(AY, 'blend_cikti.py'), '--', eser, yeni, os.path.join(T, 'ref.json'), T)
for ek in ('', '_sunum'):
    kos(NODE, os.path.join(AY, 'blend_son.mjs'), os.path.join(T, ('app' if not ek else 'sunum') + '_ham.glb'), os.path.join(cikis, f'{ad}_{yeni}{ek}.glb'), str(C['ao_px']))
kos(NODE, os.path.join(ES, '_kutuphane', 'glb_temizle.mjs'), os.path.join(cikis, f'{ad}_{yeni}.glb'))
os.makedirs(os.path.join(U, 'kontrol', yeni), exist_ok=True)
os.replace(os.path.join(T, 'blend_rapor.json'), os.path.join(U, 'kontrol', yeni, 'blend_rapor.json'))
print('URET', eser, yeni, '→', cikis)
