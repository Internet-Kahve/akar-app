#!/usr/bin/env python3
"""Build an upload manifest from the seven reviewed editorial packages; no network or database writes."""
import argparse
import importlib.util
import json
import math
from pathlib import Path

parser = argparse.ArgumentParser()
parser.add_argument('--content', type=Path, required=True, help='docs/documents-context directory')
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
root = args.content.resolve()
# Readers only: identity, model and placement come from each site's eser.json and 3d/model.json.
spec = importlib.util.spec_from_file_location('editorial', root / 'design/test-redmi9t-v2/hazirla.py')
editorial = importlib.util.module_from_spec(spec)
spec.loader.exec_module(editorial)
IDS = {'yildirim-bayezid-bedesteni': 'bedesten', 'orhan-bey-kulliyesi': 'orhan-gazi'}
KINDS = {'Cami': 'cami', 'Bedesten': 'bedesten', 'Han': 'han', 'Hamam': 'hamam', 'Türbe': 'turbe'}
TRUST = {'Doğrulanmış': 'verified', 'Tarihsel çıkarım': 'inferred', 'Temsili içerik': 'representative'}
result = {'version': 1, 'sites': [], 'routes': [], 'retireSiteIds': ['bursa-cesme-demo', 'bursa-mektep-demo']}

def trust(value):
    if value not in TRUST:
        raise ValueError('Unknown trust label: ' + value)
    return TRUST[value]

# Distance words of the "Açı" table, as fractions of the distance at which the whole model fits the view
# (prototype Sahne3D.aci); anything else ("bütün yapı", "kadrajın yarısı") is the whole building.
DISTANCE = [('yakın', 0.42), ('orta', 0.62), ('çatı', 0.85)]

def camera(angle):
    words = angle['uzaklik'] or ''
    target = angle['hedef']
    return dict(target=None if target in (None, 'Merkez') else target, azimuthDeg=angle['azimut'],
                elevationDeg=max(5, min(85, angle['egim'] if angle['egim'] is not None else 30)),
                distance=next((f for w, f in DISTANCE if w in words), 0.95))

for entry in editorial.eserleri_bul():
    folder = entry['id']
    sid = IDS.get(folder, folder)
    sources = []
    def source(title, kind='book', url='', author='', credibility='verified'):
        for item in sources:
            if item['title'] == title and item['url'] == url:
                return item['id']
        key = f'{sid}-editorial-source-{len(sources)+1}'
        sources.append(dict(id=key, title=title, kind=kind, url=url, author=author,
                            year='', page='', trust=credibility))
        return key
    photos = []
    for h in editorial.tablo(editorial.oku(root / 'eserler' / folder / 'icerik/fotograflar.md'), 'Dosya'):
        if len(h) < 9:
            raise ValueError('Incomplete photograph metadata: ' + folder)
        filename = editorial.ham(h[0])
        rel = f'eserler/{folder}/icerik/foto/{filename}'
        if not (root / rel).is_file() or not h[7].strip():
            raise ValueError('Missing image/license: ' + rel)
        photos.append(dict(id=f'{sid}-photo-{filename.split("_")[0]}', file=rel, src='', alt=h[5],
                           title=h[3], titleEn='', description=h[4], license=h[7], trust=trust(h[8]),
                           sourceId=source(editorial.kaynak_bicim(h[6])),
                           galleryPosition=int(h[2]) if h[2].isdigit() else None))
    by_name = {Path(p['file']).name: p for p in photos}
    stories = []
    for item in editorial.hikaye_oku(folder):
        photo = by_name.get(item['foto'])
        if not photo:
            raise ValueError(f'Missing story photograph: {folder} {item["foto"]}')
        stories.append(dict(id=f'{sid}-story-{item["no"]}', title=photo['title'], text=item['metin'],
                            simple=item['metin'], trust=trust(item['guven']), photoId=photo['id'],
                            sourceId=source(item['kaynak']), showCard=item['kart'], highlights=item['vurgu'],
                            interior=item['ic'], **({'camera': camera(item['aci'])} if item['aci'] else {})))
    sections = []
    for section in editorial.hakkinda_oku(folder):
        name = section['baslik']
        kind = 'waqf' if any(w in name.lower() for w in ['vakıf', 'akar']) else 'architecture' if 'mimari' in name.lower() else 'history'
        for p in section['paragraflar']:
            sections.append(dict(id=f'{sid}-section-{len(sections)+1}', kind=kind, title=name,
                                 body=p['metin'], trust=trust(p['guven']), sourceId=source(p['kaynak'])))
    part_cards = []
    for card in editorial.parcalar_oku(folder):
        missing = [f for f in card['fotolar'] if f not in by_name]
        if missing:
            raise ValueError(f'Missing part card photograph: {folder} {", ".join(missing)}')
        part_cards.append(dict(id=f'{sid}-part-{len(part_cards)+1}', parts=card['adlar'], title=card['baslik'],
                               body=card['metin'], photoIds=[by_name[f]['id'] for f in card['fotolar']],
                               trust=trust(card['guven']), sourceId=source(card['kaynak'])))
    history = []
    archive = json.loads((root / 'eserler' / folder / 'gecmisi-gor/gecmisi-gor.json').read_text())
    for image in archive['fotograflar']:
        credibility = 'verified' if image['eslesme'] in ['kesin', 'elle'] else 'inferred'
        # Keep the full credit and licence; the web viewer displays the uncropped original.
        key = f'{sid}-archive-{image["fotoAtlasId"]}'
        history.append(dict(id=key, file=f'eserler/{folder}/gecmisi-gor/{image["gorsel"]}',
                            caption=image['baslik'], dateLabel=image['tarih']['etiket'],
                            alt=image['altMetin'], license=image['lisans'], credit=image['kaynakSatiri'],
                            trust=credibility, sourceId=source(image['kaynakSatiri'], 'archive',
                            image.get('asilArsivUrl') or image['fotoAtlasUrl'], image.get('fotografci', ''), credibility)))
    model_info = editorial.model_oku(folder)
    if not model_info:
        raise ValueError('Missing 3d/model.json: ' + folder)
    shift = model_info.get('kaydirma_m') or {}
    east, north = shift.get('dogu', 0), shift.get('kuzey', 0)
    coords = [entry['lon'] + east/(111320*math.cos(math.radians(entry['lat']))), entry['lat'] + north/110540]
    model = dict(name=entry['ad']+' · temsili 3B model', file=f'eserler/{folder}/3d/export/{model_info["glb"]}_sunum.glb',
                 src='', bytes=0, parts=[], trust='representative', coverGroups=model_info.get('ortu_gruplari') or [])
    gallery = sorted((p for p in photos if p['galleryPosition'] is not None), key=lambda p:p['galleryPosition'])
    result['sites'].append(dict(id=sid, name=entry.get('uzun_ad') or entry['ad'], city='Bursa',
        district='Hisar' if folder=='orhan-gazi-turbesi' else 'Hanlar Bölgesi', year=entry['yil'], architect='—',
        patron=entry['yaptiran'], kind=KINDS[entry['tur']], coordinates=coords, minutes=max(1,round(sum(len(s['text'].split()) for s in stories)/130)) if stories else 0,
        description=entry['kisa'], status='published', tier='Hero' if sid=='ulu-cami' else 'Tier 2',
        source='Bursa Vakıf Eserleri Envanteri · ekip tarafından hazırlanan kaynaklı içerik',
        role='akar' if entry['rol']=='akar' else 'hayrat', stories=stories, photos=photos, sources=sources,
        coverPhotoId=gallery[0]['id'], model=model, historyImages=history, sections=sections, partCards=part_cards,
        relatedSiteId={'bedesten':'ulu-cami','orhan-bey-hamami':'orhan-gazi','emir-han':'orhan-gazi'}.get(sid)))
result['routes'] = [
 dict(id='hanlar',name='Hanlar Bölgesi Vakıf Yürüyüşü',description='Ulucami, Bedesten, Koza Hanı ve Orhan Bey Camii arasında vakıf mirası.',siteIds=['ulu-cami','bedesten','koza-han','orhan-gazi'],theme='Vakıf kültürü',minutes=0,distance=''),
 dict(id='akar-hayrat',name='Akar ve Hayrat',description='Gelir sağlayan yapılar ile hizmet sunan yapılar arasındaki ilişki.',siteIds=['bedesten','ulu-cami','emir-han','orhan-gazi','orhan-bey-hamami'],theme='Vakıf kültürü',minutes=0,distance=''),
 dict(id='hanlar-ticaret',name='Hanların İzinde',description='Bedesten, Emir Hanı ve Koza Hanı arasında bir yürüyüş.',siteIds=['bedesten','emir-han','koza-han'],theme='Ticaret yapıları',minutes=0,distance='')]
args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sites':len(result['sites']),'photos':sum(len(s['photos']) for s in result['sites']),
 'stories':sum(len(s['stories']) for s in result['sites']),'history':sum(len(s['historyImages']) for s in result['sites'])}))
