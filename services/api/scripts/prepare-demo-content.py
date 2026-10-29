#!/usr/bin/env python3
"""Build an upload manifest from the seven reviewed editorial packages; no network or database writes."""
import argparse
import importlib.util
import json
import math
import re
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

BOOK_LICENSE = 'Vakıf Katılım, Bursa Vakıf Eserleri Envanteri ve fotoğraf arşivi. Proje için verildi; kullanılabilir'

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
    # "Eser hakkında": one chapter per heading of eser-hakkinda.md, its paragraphs, the reading layer of
    # eser-hakkinda-okuma.md (verbatim-checked by okuma_oku, which warns and drops what the book text lacks) and the
    # book photographs of kitap-fotograflari.md.
    headings = editorial.hakkinda_oku(folder)
    terms = editorial.okuma_oku(folder, headings)
    has_reading = (root / 'eserler' / folder / 'icerik/eser-hakkinda-okuma.md').is_file()
    sections, chapters, pages = [], [], []
    for section in headings:
        name = section['baslik']
        kind = 'waqf' if any(w in name.lower() for w in ['vakıf', 'akar']) else 'architecture' if 'mimari' in name.lower() else 'history'
        chapter_id = None
        if has_reading:
            chapter_id = f'{sid}-chapter-{len(chapters)+1}'
            reading = section.get('okuma') or dict(ozet=[], rakam=[], alinti=[], zaman=[], ucd=None)
            view = reading['ucd']
            parts = [x for x in view['parcalar'] if x != 'Merkez'] if view else []
            text = ' '.join(p['metin'] for p in section['paragraflar'])
            chapters.append(dict(id=chapter_id, title=name, kind=kind, reading=dict(
                summary=reading['ozet'],
                figures=[dict(value=r['deger'], label=r['etiket'], evidence=r['kanit']) for r in reading['rakam']],
                quotes=[dict(text=q['metin'], by=q['kim'] or None) for q in reading['alinti']],
                timeline=[dict(year=t['yil'], evidence=t['kanit']) for t in reading['zaman']],
                terms=[dict(word=t['kelime'], definition=t['tanim']) for t in terms if t['kelime'] in text],
                camera=camera(dict(hedef=view['parcalar'][0], azimut=view['azimut'], egim=view['egim'], uzaklik=view['uzaklik'])) if view else None,
                interior=bool(view and view['ici']), focusParts=parts)))
        for p in section['paragraflar']:
            sections.append(dict(id=f'{sid}-section-{len(sections)+1}', kind=kind, title=name, chapterId=chapter_id,
                                 body=p['metin'], trust=trust(p['guven']), sourceId=source(p['kaynak']), photos=[]))
            pages.append(p['_sayfa'])
    # Book photographs (kitap-fotograflari.md): each goes after the last paragraph that starts on or before its page,
    # as in the prototype's kitap_fotolari; the paragraphs outside the photographed pages do not take any. A photograph
    # before the first paragraph goes after the first one. A file that is also a gallery photograph is that same media.
    book_photos = []
    book_path = root / 'eserler' / folder / 'icerik/kitap-fotograflari.md'
    if book_path.is_file() and sections:
        by_rel = {p['file'].split('/icerik/foto/', 1)[1]: p for p in photos}
        found = []
        for h in editorial.tablo(editorial.oku(book_path), 'Dosya'):
            if len(h) < 6:
                continue
            page = re.match(r'E cilt-(\d)\s*PDF\s*s\.\s*(\d+)', h[2])
            rel = editorial.ham(h[0])
            if not page or not (root / 'eserler' / folder / 'icerik/foto' / rel).is_file():
                raise ValueError(f'Missing book photograph: {folder} {rel}')
            found.append((rel, h, (int(page.group(1)), int(page.group(2)))))
        volumes = {f[2][0] for f in found}
        first, last = min(f[2] for f in found), max(f[2] for f in found)
        eligible = [i for i, pg in enumerate(pages) if pg and pg[0] in volumes and first <= pg <= last]
        for rel, h, page in found:
            earlier = [i for i in eligible if pages[i] <= page]
            target = sections[earlier[-1] if earlier else 0]
            if rel in by_rel:
                media_id = by_rel[rel]['id']
            else:
                media_id = f'{sid}-book-{Path(rel).stem}'
                book_photos.append(dict(id=media_id, file=f'eserler/{folder}/icerik/foto/{rel}', alt=h[4], title=f'{entry["ad"]} · Envanter Cilt {page[0]} · s. {page[1]}',
                                        description=h[5], license=BOOK_LICENSE, trust='verified',
                                        sourceId=source(f'Envanter Cilt {page[0]} · s. {page[1]}')))
            target['photos'].append(dict(id=media_id, aspect=float(h[3].replace(',', '.')), alt=h[4]))
    cover_name = entry.get('hakkinda_kapak')
    if cover_name and cover_name not in by_name:
        raise ValueError(f'Missing about cover photograph: {folder} {cover_name}')
    part_cards = []
    for card in editorial.parcalar_oku(folder):
        missing = [f for f in card['fotolar'] if f not in by_name]
        if missing:
            raise ValueError(f'Missing part card photograph: {folder} {", ".join(missing)}')
        part_cards.append(dict(id=f'{sid}-part-{len(part_cards)+1}', parts=card['adlar'], title=card['baslik'],
                               body=card['metin'], photoIds=[by_name[f]['id'] for f in card['fotolar']],
                               trust=trust(card['guven']), sourceId=source(card['kaynak'])))
    # Site tasks and badges (§11.44): icerik/gorevler.json where the site has one. The photograph is a gallery photograph
    # named in fotograflar.md (like a story's); the model part names are checked against the model by the importer.
    tasks, badges = [], []
    tasks_path = root / 'eserler' / folder / 'icerik/gorevler.json'
    if tasks_path.is_file():
        data = json.loads(tasks_path.read_text())
        for g in data['gorevler']:
            where = f'{folder} {g.get("id")}'
            photo_name = g.get('gorsel')
            if photo_name and photo_name not in by_name:
                raise ValueError(f'Missing task photograph: {where} {photo_name}')
            common = dict(id=g['id'], title=g['baslik'], photoId=by_name[photo_name]['id'] if photo_name else None,
                          source=g.get('kaynak') or None, trust=trust(g['guven']))
            if g['tur'] == 'soru':
                options = g['secenekler']
                if not 2 <= len(options) <= 6 or not isinstance(g['dogru'], int) or not 0 <= g['dogru'] < len(options):
                    raise ValueError(f'Bad options or answer: {where}')
                tasks.append(dict(common, kind='quiz', prompt=g['soru'], part=g.get('parca') or None, correctIndex=g['dogru'],
                                  details=dict(options=options, hints=g.get('ipuclari') or [], correctText=g['dogru_metin'],
                                               wrongText=g['yanlis_metin'], fromHome=bool(g.get('evden_cozulur')))))
            elif g['tur'] == 'saha':
                home = g.get('evden')
                tasks.append(dict(common, kind='field', prompt=g['gorev'], part=None, correctIndex=None,
                                  details=dict(onSite=dict(text=g['yerinde']['yap'], radiusM=int(g['yerinde']['konum_yaricap_m'])),
                                               fromHome=dict(text=home['yap'], part=home['parca']) if home else None,
                                               doneText=g['tamam_metin'])))
            else:
                raise ValueError(f'Unknown task type: {where} {g["tur"]}')
        task_ids = {t['id'] for t in tasks}
        if len(task_ids) != len(tasks):
            raise ValueError(f'Duplicate task id: {folder}')
        for b in data['rozetler']:
            condition = b['kosul']
            if condition.get('hikaye_bitti'):
                kind, task_id = 'story', None
            elif condition.get('gorev') in task_ids:
                kind, task_id = 'task', condition['gorev']
            else:
                raise ValueError(f'Badge condition names no task: {folder} {b["id"]}')
            badges.append(dict(id=b['id'], title=b['ad'], text=b['metin'], condition=kind, taskId=task_id,
                               onSiteLabel=bool(b.get('yerinde_etiketi'))))
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
        coverPhotoId=gallery[0]['id'], model=model, historyImages=history, sections=sections, chapters=chapters, bookPhotos=book_photos,
        aboutCoverPhotoId=by_name[cover_name]['id'] if cover_name else None, partCards=part_cards,
        tasks=tasks, badges=badges,
        relatedSiteId={'bedesten':'ulu-cami','orhan-bey-hamami':'orhan-gazi','emir-han':'orhan-gazi'}.get(sid)))
result['routes'] = [
 dict(id='hanlar',name='Hanlar Bölgesi Vakıf Yürüyüşü',description='Ulucami, Bedesten, Koza Hanı ve Orhan Bey Camii arasında vakıf mirası.',siteIds=['ulu-cami','bedesten','koza-han','orhan-gazi'],theme='Vakıf kültürü',minutes=0,distance=''),
 dict(id='akar-hayrat',name='Akar ve Hayrat',description='Gelir sağlayan yapılar ile hizmet sunan yapılar arasındaki ilişki.',siteIds=['bedesten','ulu-cami','emir-han','orhan-gazi','orhan-bey-hamami'],theme='Vakıf kültürü',minutes=0,distance=''),
 dict(id='hanlar-ticaret',name='Hanların İzinde',description='Bedesten, Emir Hanı ve Koza Hanı arasında bir yürüyüş.',siteIds=['bedesten','emir-han','koza-han'],theme='Ticaret yapıları',minutes=0,distance='')]
# City scene (§11.42): model light from veri/sehir/<city>.json harita_isik, viewer background from kimlik.
# A city record without both keeps scene null in the database (clients use the default light).
LIGHT = dict(ambient='ortam', sun='gunes', fill='dolgu', azimuthDeg='yon', elevationDeg='yukseklik',
             saturation='doygunluk', groundShadow='yer_golgesi')
result['cities'] = []
for path in sorted((root / 'veri/sehir').glob('*.json')):
    record = json.loads(path.read_text())
    light, identity = record.get('harita_isik'), record.get('kimlik') or {}
    if record['ad'] not in {s['city'] for s in result['sites']} or not light or not identity.get('sahne_ust') or not identity.get('sahne_alt'):
        continue
    result['cities'].append(dict(name=record['ad'], scene=dict(light={k: light[v] for k, v in LIGHT.items()},
        backgroundTop=identity['sahne_ust'], backgroundBottom=identity['sahne_alt'])))
args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sites':len(result['sites']),'photos':sum(len(s['photos']) for s in result['sites']),
 'stories':sum(len(s['stories']) for s in result['sites']),'tasks':sum(len(s['tasks']) for s in result['sites']),'history':sum(len(s['historyImages']) for s in result['sites'])}))
