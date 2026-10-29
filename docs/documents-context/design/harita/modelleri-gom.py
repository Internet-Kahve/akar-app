#!/usr/bin/env python3
"""akar-harita-onizleme.html için eser modellerini tek bir JS dosyasına gömer (28 Ekim 2026).

Önizleme file:// ile açıldığı için tarayıcı GLB'leri fetch ile okuyamaz; bu yüzden modeller base64 olarak
akar-harita-modeller.js içine yazılır ve sayfa onu <script src> ile yükler. Eser listesi koddan değil veriden gelir:
eser.json'ı ve 3d/model.json'ı olan her eser (glb, yaw, ana_parca, kaydirma_m), konum hesabı hazirla.py ile aynı.
Model güncellenince yeniden çalıştır:  python3 docs/documents-context/design/harita/modelleri-gom.py
"""
import base64, json, math, os

BURASI = os.path.dirname(os.path.abspath(__file__))
ESER = os.path.join(BURASI, '..', '..', 'eserler')
modeller = []
for ad in sorted(os.listdir(ESER)):
    ej, mj = os.path.join(ESER, ad, 'eser.json'), os.path.join(ESER, ad, '3d', 'model.json')
    if not (os.path.exists(ej) and os.path.exists(mj)):
        continue
    e, m = json.load(open(ej, encoding='utf-8')), json.load(open(mj, encoding='utf-8'))
    glb = os.path.join(ESER, ad, '3d', 'export', f"{m.get('glb')}.glb")
    if not m.get('glb') or not os.path.exists(glb) or 'lat' not in e:
        print('atlandı:', ad); continue
    k = m.get('kaydirma_m') or {}
    lat = e['lat'] + k.get('kuzey', 0) / 110540
    lon = e['lon'] + k.get('dogu', 0) / (111320 * math.cos(math.radians(e['lat'])))
    modeller.append(dict(id=e.get('id', ad), ad=e.get('ad', ad), lat=round(lat, 7), lon=round(lon, 7), yaw=m.get('yaw', 0),
                         ana_parca=m.get('ana_parca'), glb=base64.b64encode(open(glb, 'rb').read()).decode()))
    print('eklendi:', ad, m['glb'])
hedef = os.path.join(BURASI, 'akar-harita-modeller.js')
with open(hedef, 'w', encoding='utf-8') as f:
    f.write('// modelleri-gom.py üretir, elle düzenleme.\nwindow.AKAR_MODELLER=' + json.dumps(modeller, ensure_ascii=False) + ';\n')
print(hedef, round(os.path.getsize(hedef) / 1e6, 1), 'MB')
