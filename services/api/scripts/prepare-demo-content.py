#!/usr/bin/env python3
"""Build an upload manifest from the reviewed editorial packages; no network or database writes."""
import argparse
import importlib.util
import json
import math
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import history_extras

parser = argparse.ArgumentParser()
parser.add_argument('--content', type=Path, required=True, help='docs/documents-context directory')
parser.add_argument('--output', type=Path, required=True)
parser.add_argument('--reader', type=Path, default=Path(__file__).resolve().parent / 'editorial_reader.py')
args = parser.parse_args()
root = args.content.resolve()
# Draft task packages must be reviewed before publication. Stop before generating/replacing a manifest;
# silently skipping them would delete existing tasks, badges and their progress on the next import.
for path in sorted(root.glob('eserler/*/icerik/gorevler.json')):
    if json.loads(path.read_text()).get('_taslak', False) is not False:
        raise ValueError(f'Unreviewed task file: {path.relative_to(root)}; review the content and set _taslak to false before preparing an import.')
# Readers only: identity, model and placement come from each site's eser.json and 3d/model.json.
spec = importlib.util.spec_from_file_location('editorial', args.reader)
editorial = importlib.util.module_from_spec(spec)
spec.loader.exec_module(editorial)
if hasattr(editorial, 'configure'):
    editorial.configure(root)
IDS = {'yildirim-bayezid-bedesteni': 'bedesten', 'orhan-bey-kulliyesi': 'orhan-gazi'}
KINDS = {'Cami': 'cami', 'Bedesten': 'bedesten', 'Han': 'han', 'Hamam': 'hamam', 'Türbe': 'turbe', 'Çeşme': 'cesme', 'Medrese': 'egitim'}
TRUST = {'Doğrulanmış': 'verified', 'Tarihsel çıkarım': 'inferred', 'Temsili içerik': 'representative'}
result = {'version': 1, 'sites': [], 'routes': [], 'retireSiteIds': ['bursa-cesme-demo', 'bursa-mektep-demo']}
city_records = [(path, json.loads(path.read_text())) for path in sorted((root / 'veri/sehir').glob('*.json'))]
inventories = {record['ad']: record.get('envanter_adi') for _, record in city_records}
skipped_traces = 0  # izler.json records that are not approved team samples; they are never imported

def viewpoint(image):
    """Where an archive photograph was taken from; `None` when the record does not say."""
    point = image.get('cekimNoktasi')
    if not point or image.get('yon') is None:
        return None
    return dict(lng=point['lng'], lat=point['lat'], bearingDeg=image['yon'], fieldDeg=image.get('gorusAcisi') or 60,
                interior=bool(image.get('icMekan')))

def flow(row):
    """«Akar akışı»: one row of a story; a target outside the catalog is a point."""
    if not row:
        return None
    return dict(fromSiteId=IDS.get(row['kaynak_eser'], row['kaynak_eser']),
                toSiteId=IDS.get(row['hedef_eser'], row['hedef_eser']) if row['hedef_eser'] else None,
                toPoint=row['hedef_nokta'], toName=row['hedef_ad'], label=row['etiket'], source=row['kaynak'],
                trust=trust(row['guven']))

def trust(value):
    if value not in TRUST:
        raise ValueError('Unknown trust label: ' + value)
    return TRUST[value]

def book_license(inventory):
    return f'Vakıf Katılım, {inventory} ve fotoğraf arşivi. Proje için verildi; kullanılabilir'

# Distance words of the "Açı" table, as fractions of the distance at which the whole model fits the view
# (prototype Sahne3D.aci); anything else ("bütün yapı", "kadrajın yarısı") is the whole building.
DISTANCE = [('yakın', 0.42), ('orta', 0.62), ('çatı', 0.85)]

def camera(angle):
    words = str(angle['uzaklik'] or '')
    # A number is the fraction itself (1 = the whole model fits), for angles closer than the words go.
    number = re.search(r'\d+[.,]\d+', words)
    target = angle['hedef']
    return dict(target=None if target in (None, 'Merkez') else target, azimuthDeg=angle['azimut'],
                elevationDeg=max(5, min(85, angle['egim'] if angle['egim'] is not None else 30)),
                distance=float(number.group().replace(',', '.')) if number else next((f for w, f in DISTANCE if w in words), 0.95))

for entry in editorial.eserleri_bul():
    folder = entry['id']
    sid = IDS.get(folder, folder)
    inventory = inventories.get(entry['il'])
    if not inventory:
        raise ValueError(f'No inventory name in the city record: {folder} {entry["il"]}')
    sources = []
    def source(title, kind='book', url='', author='', credibility='verified'):
        for item in sources:
            if item['title'] == title and item['url'] == url:
                return item['id']
        key = f'{sid}-editorial-source-{len(sources)+1}'
        sources.append(dict(id=key, title=title, kind=kind, url=url, author=author,
                            year='', page='', trust=credibility))
        return key
    # English (ICERIK_INGILIZCE.md): icerik/en/ beside the Turkish files; what is missing stays Turkish.
    photo_rows = editorial.tablo(editorial.oku(root / 'eserler' / folder / 'icerik/fotograflar.md'), 'Dosya')
    photo_en = [dict(dosya=editorial.ham(h[0])) for h in photo_rows if h and editorial.ham(h[0])]
    story_items, card_items, headings = editorial.hikaye_oku(folder), editorial.parcalar_oku(folder), editorial.hakkinda_oku(folder)
    editorial.en_oku(folder, story_items, card_items, photo_en, headings)
    photo_en = {f['dosya']: f for f in photo_en}
    photos = []
    for h in photo_rows:
        if len(h) < 9:
            raise ValueError('Incomplete photograph metadata: ' + folder)
        filename = editorial.ham(h[0])
        rel = f'eserler/{folder}/icerik/foto/{filename}'
        if not (root / rel).is_file() or not h[7].strip():
            raise ValueError('Missing image/license: ' + rel)
        photos.append(dict(id=f'{sid}-photo-{Path(filename).stem.split("_")[0]}', file=rel, src='', alt=h[5],
                           title=h[3], titleEn=photo_en.get(filename, {}).get('baslik_en', ''), description=h[4], license=h[7], trust=trust(h[8]),
                           sourceId=source(editorial.kaynak_bicim(h[6])),
                           galleryPosition=int(h[2]) if h[2].isdigit() else None))
    # Keyed by the path under icerik/foto/: a photo-only site's gallery is its kitap/ crops.
    by_name = {p['file'].split('/icerik/foto/', 1)[1]: p for p in photos}
    stories = []
    for item in story_items:
        photo = by_name.get(item['foto'])
        if not photo:
            raise ValueError(f'Missing story photograph: {folder} {item["foto"]}')
        stories.append(dict(id=f'{sid}-story-{item["no"]}', title=photo['title'], text=item['metin'],
                            simple=item['metin'], trust=trust(item['guven']), photoId=photo['id'],
                            sourceId=source(item['kaynak']), showCard=item['kart'], highlights=item['vurgu'],
                            interior=item['ic'], routeOnly=bool(item.get('rota')), flow=flow(item.get('akis')),
                            **({'textEn': item['metin_en'], 'simpleEn': item['metin_en'], 'titleEn': photo['titleEn']} if item.get('metin_en') else {}),
                            **({'camera': camera(item['aci'])} if item['aci'] else {})))
    # "Eser hakkında": one chapter per heading of eser-hakkinda.md and its paragraphs, as in the prototype (a site
    # without eser-hakkinda-okuma.md still gets the reading page, with its plain text); the reading layer of
    # eser-hakkinda-okuma.md (verbatim-checked by okuma_oku, which warns and drops what the book text lacks) and the
    # book photographs of kitap-fotograflari.md.
    terms = editorial.okuma_oku(folder, headings)
    sections, chapters, pages = [], [], []
    for section in headings:
        name = section['baslik']
        kind = 'waqf' if any(w in name.lower() for w in ['vakıf', 'akar']) else 'architecture' if 'mimari' in name.lower() else 'history'
        chapter_id = f'{sid}-chapter-{len(chapters)+1}'
        reading = section.get('okuma') or dict(ozet=[], rakam=[], alinti=[], zaman=[], ucd=None)
        view = reading['ucd']
        parts = [x for x in view['parcalar'] if x != 'Merkez'] if view else []
        text = ' '.join(p['metin'] for p in section['paragraflar'])
        chapters.append(dict(id=chapter_id, title=name, **({'titleEn': section['baslik_en']} if section.get('baslik_en') else {}), kind=kind, reading=dict(
            summary=reading['ozet'],
            figures=[dict(value=r['deger'], label=r['etiket'], evidence=r['kanit']) for r in reading['rakam']],
            quotes=[dict(text=q['metin'], by=q['kim'] or None) for q in reading['alinti']],
            timeline=[dict(year=t['yil'], evidence=t['kanit']) for t in reading['zaman']],
            terms=[dict(word=t['kelime'], definition=t['tanim']) for t in terms if t['kelime'] in text],
            camera=camera(dict(hedef=view['parcalar'][0], azimut=view['azimut'], egim=view['egim'], uzaklik=view['uzaklik'])) if view else None,
            interior=bool(view and view['ici']), focusParts=parts)))
        for p in section['paragraflar']:
            sections.append(dict(id=f'{sid}-section-{len(sections)+1}', kind=kind, title=name, chapterId=chapter_id,
                                 body=p['metin'], **({'bodyEn': p['metin_en']} if p.get('metin_en') else {}), **({'titleEn': section['baslik_en']} if section.get('baslik_en') else {}),
                                 trust=trust(p['guven']), sourceId=source(p['kaynak']), photos=[]))
            pages.append(p['_sayfa'])
    # Book photographs (kitap-fotograflari.md): each goes after the last paragraph that starts on or before its page,
    # as in the prototype's kitap_fotolari; the paragraphs outside the photographed pages do not take any. A photograph
    # before the first paragraph goes after the first one. A file that is also a gallery photograph is that same media.
    book_photos = []
    book_path = root / 'eserler' / folder / 'icerik/kitap-fotograflari.md'
    if book_path.is_file() and sections:
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
            if rel in by_name:
                media_id = by_name[rel]['id']
            else:
                media_id = f'{sid}-book-{Path(rel).stem}'
                book_photos.append(dict(id=media_id, file=f'eserler/{folder}/icerik/foto/{rel}', alt=h[4], title=f'{entry["ad"]} · Envanter Cilt {page[0]} · s. {page[1]}',
                                        description=h[5], license=book_license(inventory), trust='verified',
                                        sourceId=source(f'Envanter Cilt {page[0]} · s. {page[1]}')))
            target['photos'].append(dict(id=media_id, aspect=float(h[3].replace(',', '.')), alt=h[4]))
    cover_name = entry.get('hakkinda_kapak')
    if cover_name and cover_name not in by_name:
        raise ValueError(f'Missing about cover photograph: {folder} {cover_name}')
    part_cards = []
    for card in card_items:
        missing = [f for f in card['fotolar'] if f not in by_name]
        if missing:
            raise ValueError(f'Missing part card photograph: {folder} {", ".join(missing)}')
        part_cards.append(dict(id=f'{sid}-part-{len(part_cards)+1}', parts=card['adlar'], title=card['baslik'],
                               body=card['metin'], **({'titleEn': card['baslik_en']} if card.get('baslik_en') else {}), **({'bodyEn': card['metin_en']} if card.get('metin_en') else {}), photoIds=[by_name[f]['id'] for f in card['fotolar']],
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
    # A photo-only site may have no archive package; the viewer then says there is no old image yet.
    archive_path = root / 'eserler' / folder / 'gecmisi-gor/gecmisi-gor.json'
    archive = json.loads(archive_path.read_text()) if archive_path.is_file() else dict(fotograflar=[])
    for image in archive['fotograflar']:
        credibility = 'verified' if image['eslesme'] in ['kesin', 'elle'] else 'inferred'
        # Keep the full credit and licence; the web viewer displays the uncropped original.
        key = f'{sid}-archive-{image["fotoAtlasId"]}'
        history.append(dict(id=key, file=f'eserler/{folder}/gecmisi-gor/{image["gorsel"]}',
                            caption=image['baslik'], dateLabel=image['tarih']['etiket'],
                            alt=image['altMetin'], license=image['lisans'], credit=image['kaynakSatiri'],
                            trust=credibility, viewpoint=viewpoint(image), sourceId=source(image['kaynakSatiri'], 'archive',
                            image.get('asilArsivUrl') or image['fotoAtlasUrl'], image.get('fotografci', ''), credibility)))
    # Present-day pairs (bugunku-esler.json) and the team's İz Bırak samples (izler.json), §11.47.
    sample_traces, skipped = history_extras.read_extras(
        root / 'eserler' / folder / 'gecmisi-gor', f'eserler/{folder}/gecmisi-gor', sid,
        {image['fotoAtlasId']: entry for image, entry in zip(archive['fotograflar'], history)})
    skipped_traces += skipped
    # A site without a 3d/ folder is a photo-only site; a 3d/ folder without its model.json is a broken package.
    model_info = editorial.model_oku(folder)
    if not model_info and (root / 'eserler' / folder / '3d').exists():
        raise ValueError('Missing 3d/model.json: ' + folder)
    shift = (model_info or {}).get('kaydirma_m') or {}
    east, north = shift.get('dogu', 0), shift.get('kuzey', 0)
    coords = [entry['lon'] + east/(111320*math.cos(math.radians(entry['lat']))), entry['lat'] + north/110540]
    # model.json: yaw → heading, on_yonu → façade direction for the map sun, ana_parca → base point part, ic_parcalar → interior parts.
    model = dict(name=entry['ad']+' · temsili 3B model', file=f'eserler/{folder}/3d/export/{model_info["glb"]}_sunum.glb',
                 src='', bytes=0, parts=[], trust='representative', coverGroups=model_info.get('ortu_gruplari') or [],
                 interiorParts=model_info.get('ic_parcalar') or [],
                 placement=dict(lng=coords[0], lat=coords[1], headingDeg=model_info.get('yaw') or 0, frontDeg=model_info.get('on_yonu'), scale=1, altitudeM=0,
                                anchorNode=model_info.get('ana_parca') or None, hiddenPoints=[], keptPoints=[])) if model_info else None
    # Night theme model (1 Nov 2026): `glb_gece` names its export like `glb`; the presentation file is the one used.
    if model and model_info.get('glb_gece'):
        model['nightFile'] = f'eserler/{folder}/3d/export/{model_info["glb_gece"]}_sunum.glb'
    # Gallery photographs' 3D views (model.json `foto_acilari`, 2 Nov 2026): the site page's ‹ › arrows beside
    # «İçini göster» go through them. Each names a gallery photograph by its number and gives the "Açı" words of a
    # story sentence (hedef, azimut, egim, uzaklik); `ic` opens the model for it. A view set in the panel wins.
    if model:
        by_id = {p['id']: p for p in photos}
        for view in model_info.get('foto_acilari') or []:
            p = by_id.get(f'{sid}-photo-{view["foto"]}')
            if not p or p['galleryPosition'] is None:
                raise ValueError(f'foto_acilari names no gallery photograph: {folder} {view["foto"]}')
            p['camera'] = dict(camera(dict(hedef=view.get('hedef'), azimut=view['azimut'], egim=view.get('egim'),
                                           uzaklik=view.get('uzaklik'))), **({'interior': True} if view.get('ic') else {}))

    # eser.json `sira` (§11.48): map draw priority, a whole number from 1 up; absent = unranked (None).
    display_order = entry.get('sira')
    if display_order is not None and (isinstance(display_order, bool) or not isinstance(display_order, int) or display_order < 1):
        raise ValueError(f'sira must be an integer of at least 1: {folder} {display_order!r}')
    gallery = sorted((p for p in photos if p['galleryPosition'] is not None), key=lambda p:p['galleryPosition'])
    result['sites'].append(dict(id=sid, name=entry['ad'], **({'nameEn': entry['ad_en']} if entry.get('ad_en') else {}), **({'descriptionEn': entry['kisa_en']} if entry.get('kisa_en') else {}), city=entry['il'],
        district=entry['ilce'], year=entry['yil'], architect='—',
        patron=entry['yaptiran'], kind=KINDS[entry['tur']], coordinates=coords, minutes=max(1,round(sum(len(s['text'].split()) for s in stories)/130)) if stories else 0,
        displayOrder=display_order,
        description=entry['kisa'], status='published', tier='Hero' if sid=='ulu-cami' else 'Tier 2',
        source=f'{inventory} · ekip tarafından hazırlanan kaynaklı içerik',
        role='akar' if entry['rol']=='akar' else 'hayrat', stories=stories, photos=photos, sources=sources,
        coverPhotoId=gallery[0]['id'], **({'model': model} if model else {}), historyImages=history, sampleTraces=sample_traces, sections=sections, chapters=chapters, bookPhotos=book_photos,
        aboutCoverPhotoId=by_name[cover_name]['id'] if cover_name else None, partCards=part_cards,
        tasks=tasks, badges=badges,
        relatedSiteId={'bedesten':'ulu-cami','orhan-bey-hamami':'orhan-gazi','emir-han':'orhan-gazi'}.get(sid)))
result['routes'] = [
 dict(id='hanlar',name='Hanlar Bölgesi Vakıf Yürüyüşü',description='Ulucami, Bedesten, Koza Hanı ve Orhan Bey Camii arasında vakıf mirası.',siteIds=['ulu-cami','bedesten','koza-han','orhan-gazi'],theme='Vakıf kültürü',minutes=0,distance=''),
 dict(id='akar-hayrat',name='Akar ve Hayrat',description='Gelir sağlayan yapılar ile hizmet sunan yapılar arasındaki ilişki.',siteIds=['bedesten','ulu-cami','emir-han','orhan-gazi','orhan-bey-hamami'],theme='Vakıf kültürü',minutes=0,distance=''),
 dict(id='hanlar-ticaret',name='Hanların İzinde',description='Bedesten, Emir Hanı ve Koza Hanı arasında bir yürüyüş.',siteIds=['bedesten','emir-han','koza-han'],theme='Ticaret yapıları',minutes=0,distance='')]
# City records (veri/sehir/<city>.json): every city, with or without sites in the app (§11.45: globe markers, «Yakında»).
# Scene (§11.42): model light from harita_isik, viewer background from kimlik; without both scene stays null (default light).
# Identity (§11.49): kimlik.zemin, desen and desen_renk, all three or none; the pattern is a file of design/desenler.
# A city whose pattern is not drawn yet has no identity: its screens stay neutral.
LIGHT = dict(azimuthDeg='yon', elevationDeg='yukseklik', saturation='doygunluk', groundShadow='yer_golgesi')
# The record dropped these with the prototype's new rig (ENTEGRASYON §3); the product's lights keep the last reviewed values.
LIGHT_RIG = dict(ambient=2, sun=1, fill=1)
result['cities'] = []
LOOK = dict(accent='zemin', pattern='desen', patternColour='desen_renk')
for path, record in city_records:
    light, kimlik = record.get('harita_isik'), record.get('kimlik') or {}
    scene = dict(light=dict(LIGHT_RIG, **{k: light[v] for k, v in LIGHT.items()}), backgroundTop=kimlik['sahne_ust'],
        backgroundBottom=kimlik['sahne_alt']) if light and kimlik.get('sahne_ust') and kimlik.get('sahne_alt') else None
    look = {k: kimlik.get(v) for k, v in LOOK.items()}
    if look['pattern'] and not all(look.values()):
        raise ValueError(f"{path.name}: kimlik needs zemin, desen and desen_renk together")
    if look['pattern'] and not (root / 'design/desenler' / look['pattern']).is_file():
        raise ValueError(f"{path.name}: pattern file design/desenler/{look['pattern']} is missing")
    # kimlik.desen_olcek: the tile's size against the standard width (a tile with several repeats is drawn larger).
    scale = kimlik.get('desen_olcek')
    if scale is not None and (isinstance(scale, bool) or not isinstance(scale, (int, float)) or not 0.25 <= scale <= 8):
        raise ValueError(f"{path.name}: desen_olcek must be a number from 0.25 to 8")
    # kimlik.amblem (and amblem_kucuk, its cut for 14-32 px): files of design/desenler like the pattern.
    emblems = {k: kimlik.get(v) for k, v in dict(emblem='amblem', emblemSmall='amblem_kucuk').items() if kimlik.get(v)}
    if 'emblemSmall' in emblems and 'emblem' not in emblems:
        raise ValueError(f"{path.name}: amblem_kucuk needs amblem")
    for file in emblems.values():
        if not (root / 'design/desenler' / file).is_file():
            raise ValueError(f"{path.name}: emblem file design/desenler/{file} is missing")
    center = record.get('merkez')
    inventory = {k: record.get(v) for k, v in dict(name='envanter_adi', publisher='envanter_yayinci', year='envanter_yili',
        siteCount='envanter_eser_sayisi').items()}
    result['cities'].append(dict(id=record['id'], name=record['ad'], isDefault=bool(record.get('varsayilan')), scene=scene,
        identity=(dict(look, **({'patternScale': scale} if scale is not None else {}), **emblems)) if all(look.values()) else None,
        map=dict(center=center, zoom=record['zoom'], zoomDesktop=record.get('zoom_masaustu')) if center else None,
        inventory=inventory if any(v is not None for v in inventory.values()) else None))
args.output.write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'sites':len(result['sites']),'photos':sum(len(s['photos']) for s in result['sites']),
 'stories':sum(len(s['stories']) for s in result['sites']),'tasks':sum(len(s['tasks']) for s in result['sites']),'history':sum(len(s['historyImages']) for s in result['sites']),
 'presentPhotos':sum(1 for s in result['sites'] for h in s['historyImages'] if h['present']),'sampleTraces':sum(len(s['sampleTraces']) for s in result['sites']),'skippedTraces':skipped_traces}))
