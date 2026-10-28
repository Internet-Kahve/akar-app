#!/usr/bin/env python3
"""AKAR · Redmi 9T prototipi için içerik paketi.

eserler/*/icerik/ altındaki hikâye, açı, fotoğraf ve «Eser hakkında» tablolarını okur;
<çıktı>/veri.json ve <çıktı>/medya/<eser>/<foto>.jpg (uzun kenar 1280 px) üretir.
Küçültülmüş fotoğraflar test-redmi9t/.onbellek/ altında saklanır, ikinci çalıştırmada yeniden üretilmez.

Kullanım: python3 hazirla.py <çıktı klasörü>
"""
import json
import math
import os
import re
import shutil
import subprocess
import sys

BURASI = os.path.dirname(os.path.abspath(__file__))
DC = os.path.normpath(os.path.join(BURASI, '..', '..'))          # docs/documents-context
ESER = os.path.join(DC, 'eserler')
ONBELLEK = os.path.join(BURASI, '.onbellek')

# 28 Ekim 2026: bu dosyada esere, şehre ya da rotaya özel hiçbir değer yok. Hepsi veriden okunur:
#   eserler/<eser>/eser.json        kimlik (ad, yıl, yaptıran, tür, rol, il, ilçe, konum, sıra)
#   eserler/<eser>/3d/model.json    model (glb, yaw, ana_parca, kaydirma_m, ortu_gruplari)
#   eserler/<eser>/icerik/*.md      hikâye, fotoğraflar, eser hakkında, parça kartları
#   eserler/<eser>/icerik/gorevler.json  görevler (soru, saha görevi) ve rozetler
#   veri/sehir/<sehir>.json         harita açılışı, şehir künyeleri
#   veri/rota/<rota>.json           rotalar
# Yeni eser eklemek için yeni bir eser klasörü (eser.json ile) yeter.


def json_oku(yol):
    with open(yol, encoding='utf-8') as f:
        d = json.load(f)
    return {k: v for k, v in d.items() if not k.startswith('_')}


def eserleri_bul():
    sonuc = []
    for ad in sorted(os.listdir(ESER)):
        yol = os.path.join(ESER, ad, 'eser.json')
        if os.path.exists(yol):
            sonuc.append(dict(json_oku(yol), id=ad))
    return sorted(sonuc, key=lambda e: (e.get('sira', 999), e['ad']))


def klasor_jsonlari(alt):
    k = os.path.join(DC, 'veri', alt)
    return [json_oku(os.path.join(k, f)) for f in sorted(os.listdir(k)) if f.endswith('.json')] if os.path.isdir(k) else []


def oku(yol):
    with open(yol, encoding='utf-8') as f:
        return f.read()


def hucreler(satir):
    return [h.strip() for h in satir.strip().strip('|').split('|')]


def tablo(metin, baslik_bas):
    """Başlık satırı baslik_bas ile başlayan ilk markdown tablosunun satırları (liste listesi)."""
    satirlar = metin.splitlines()
    for i, s in enumerate(satirlar):
        if s.startswith('|') and hucreler(s)[0] == baslik_bas:
            sonuc = []
            for t in satirlar[i + 2:]:
                if not t.startswith('|'):
                    break
                sonuc.append(hucreler(t))
            return sonuc
    return []


def ham(metin):
    return metin.replace('`', '').strip()


def kaynak_bicim(k):
    """'E cilt-1 PDF s.25, s.26; E cilt-2 PDF s.29' → 'Envanter Cilt 1 · s. 25, 26; Cilt 2 · s. 29'"""
    parcalar = []
    for p in [x.strip() for x in k.split(';') if x.strip()]:
        m = re.match(r'E cilt-(\d)\s*PDF\s*(.*)', p)
        if m:
            sayfalar = ', '.join(re.findall(r's\.\s*(\d+)', m.group(2)))
            parcalar.append(f'Cilt {m.group(1)} · s. {sayfalar}')
        else:
            parcalar.append(p)
    return ('Envanter ' + '; '.join(parcalar)) if parcalar and parcalar[0].startswith('Cilt') else '; '.join(parcalar)


def hikaye_oku(eid):
    yol = os.path.join(ESER, eid, 'icerik', 'hikaye.md')
    if not os.path.exists(yol):
        return []
    metin = oku(yol)
    govde = metin.split('## Açı')[0]
    cumleler = []
    bas = next((hucreler(s) for s in govde.splitlines() if s.startswith('| #')), [])
    ic_i = next((i for i, b in enumerate(bas) if b.startswith(('İç', 'iç'))), None)      # v2: «İç mekân (3D)» sütunu
    for h in tablo(govde, '#'):
        if len(h) < 7 or not h[0].isdigit():
            continue
        vurgu = [] if h[4] in ('—', '-', '') else [v.strip() for v in h[4].split(',') if v.strip()]
        cumleler.append(dict(no=int(h[0]), metin=h[1], foto=ham(h[2]), kart=h[3].lower().startswith('evet'),
                             vurgu=vurgu, kaynak=kaynak_bicim(h[5]), guven=h[6],
                             ic=ic_i is not None and len(h) > ic_i and h[ic_i].lower().startswith('evet')))
    # açı önerisi tablosu
    acilar = {}
    if '## Açı' in metin:
        for h in tablo(metin.split('## Açı', 1)[1], '#'):
            if len(h) < 5:
                continue
            nolar = [int(x) for x in re.findall(r'\d+', h[0])]
            if not nolar:
                continue
            aralik = range(nolar[0], (nolar[1] if len(nolar) > 1 else nolar[0]) + 1)
            az = re.search(r'(-?\d+)\s*°', h[2])
            eg = re.search(r'(\d+)\s*°', h[3])
            for n in aralik:
                acilar[n] = dict(hedef=None if h[1] in ('—', '-', '') else h[1],
                                 azimut=int(az.group(1)) if az else None,
                                 egim=int(eg.group(1)) if eg else None,
                                 uzaklik=h[4])
    onceki = None
    for c in cumleler:
        a = acilar.get(c['no'])
        if a and a['azimut'] is not None:
            onceki = a
        c['aci'] = onceki
    return cumleler


def parcalar_oku(eid):
    """v2: 3D parça kartları (eserler/<eser>/icerik/parcalar.md). Bir satır = bir kart; «Parçalar» sütunundaki bütün model adları o kartı açar."""
    yol = os.path.join(ESER, eid, 'icerik', 'parcalar.md')
    if not os.path.exists(yol):
        return []
    sonuc = []
    for h in tablo(oku(yol), 'Parçalar'):
        if len(h) < 6:
            continue
        sonuc.append(dict(adlar=[x.strip() for x in h[0].split(',') if x.strip()], baslik=h[1], metin=h[2],
                          fotolar=[ham(x) for x in h[3].split(',') if ham(x)], kaynak=kaynak_bicim(h[4]), guven=h[5]))
    return sonuc


def gorevler_oku(eid):
    """Görevler ve rozetler (eserler/<eser>/icerik/gorevler.json). Yoksa ([], []).
    Rozet koşulu: {"hikaye_bitti": true} ya da {"gorev": "<görev id>"}; görev id'leri dosya içinde tutarlı olmalı."""
    yol = os.path.join(ESER, eid, 'icerik', 'gorevler.json')
    if not os.path.exists(yol):
        return [], []
    d = json_oku(yol)
    gorevler, rozetler = d.get('gorevler', []), d.get('rozetler', [])
    idler = {g['id'] for g in gorevler}
    for r in rozetler:
        k = r.get('kosul', {})
        if 'gorev' in k and k['gorev'] not in idler:
            sys.exit(f'{eid}/icerik/gorevler.json: rozet {r["id"]} olmayan göreve bağlı: {k["gorev"]}')
    return gorevler, rozetler


def model_oku(eid):
    """v2: eserin 3D model ayarı (eserler/<eser>/3d/model.json): glb adı, «İçini göster» grupları. Yoksa None."""
    yol = os.path.join(ESER, eid, '3d', 'model.json')
    return json_oku(yol) if os.path.exists(yol) else None


def foto_oku(eid):
    yol = os.path.join(ESER, eid, 'icerik', 'fotograflar.md')
    if not os.path.exists(yol):
        return []
    sonuc = []
    for h in tablo(oku(yol), 'Dosya'):
        if len(h) < 9:
            continue
        sira = int(h[2]) if h[2].isdigit() else None
        sonuc.append(dict(dosya=ham(h[0]), sira=sira, baslik=h[3], kisa=h[4], alt=h[5],
                          kaynak=kaynak_bicim(re.sub(r'\s*\(fotoğraf:.*?\)', '', h[6])), guven=h[8]))
    return sonuc


def hakkinda_oku(eid):
    yol = os.path.join(ESER, eid, 'icerik', 'eser-hakkinda.md')
    if not os.path.exists(yol):
        return []
    bolumler = []
    for parca in re.split(r'(?m)^## ', oku(yol))[1:]:
        baslik, _, govde = parca.partition('\n')
        baslik = baslik.strip()
        if baslik.lower().startswith(('kaynak', 'not')):
            continue
        paragraflar = []
        for p in [x.strip() for x in govde.split('\n\n') if x.strip()]:
            m = re.search(r'`\[(.+?)\]`\s*·\s*\*\*(.+?)\*\*\s*$', p)
            if not m:
                continue
            ks = re.match(r'E cilt-(\d)\s*PDF\s*s\.\s*(\d+)', m.group(1))   # kitaptaki ilk sayfa: fotoğraflar buna göre yerleşir
            paragraflar.append(dict(metin=p[:m.start()].strip(), kaynak=kaynak_bicim(m.group(1)), guven=m.group(2),
                                    _sayfa=(int(ks.group(1)), int(ks.group(2))) if ks else None))
        if paragraflar:
            bolumler.append(dict(baslik=baslik, paragraflar=paragraflar))
    return bolumler


def kitap_fotolari(eid, bolumler, cikti):
    """icerik/kitap-fotograflari.md: envanterdeki fotoğraflar kitap sırasıyla. Her fotoğraf, kitapta kendi sayfasına
    kadar gelen son paragrafın arkasına konur (paragrafın `_sayfa`sı); sayfası ilk paragraftan önceyse ilk bölümün başına."""
    yol = os.path.join(ESER, eid, 'icerik', 'kitap-fotograflari.md')
    if not os.path.exists(yol):
        return
    fotolar = []
    for h in tablo(oku(yol), 'Dosya'):   # Dosya | Asıl dosya | Kitap sayfası | Kitaptaki oran | Alt metin | Eşleşme | Not
        if len(h) < 6:
            continue
        ks = re.match(r'E cilt-(\d)\s*PDF\s*s\.\s*(\d+)', h[2])
        kaynak = os.path.join(ESER, eid, 'icerik', 'foto', ham(h[0]))
        if not ks or not os.path.exists(kaynak):
            continue
        hedef = os.path.join('medya', eid, ham(h[0]))
        kucult(kaynak, os.path.join(cikti, hedef))
        fotolar.append(dict(url=hedef, alt=h[4], oran=float(h[3].replace(',', '.')), sayfa=(int(ks.group(1)), int(ks.group(2))),
                            kunye=f'Envanter Cilt {ks.group(1)} · s. {ks.group(2)}'))
    if not fotolar:
        return
    ciltler = {f['sayfa'][0] for f in fotolar}
    ilk, son = min(f['sayfa'] for f in fotolar), max(f['sayfa'] for f in fotolar)
    sirali = [p for b in bolumler for p in b['paragraflar'] if p['_sayfa'] and p['_sayfa'][0] in ciltler and ilk <= p['_sayfa'] <= son]
    for f in fotolar:
        onceki = [p for p in sirali if p['_sayfa'] <= f['sayfa']]
        (onceki[-1].setdefault('fotolar', []) if onceki else bolumler[0].setdefault('fotolar', [])).append(f)


def gecmis_oku(eid, cikti):
    """eserler/<eser>/gecmisi-gor/ paketi (Foto Atlas, gecmisi_gor_uret.py yazar): fotoğraflar + WebP'ler gg/<eser>/'e."""
    yol = os.path.join(ESER, eid, 'gecmisi-gor', 'gecmisi-gor.json')
    if not os.path.exists(yol):
        return []
    with open(yol, encoding='utf-8') as f:
        fotolar = json.load(f)['fotograflar']
    for g in fotolar:
        gg_kopyala(eid, g, cikti)
    # Bugünkü eş (A1b): ekibin seçtiği eş (bugunku-esler.json) varsa o; yoksa o fotoğrafa bağlı onaylanmış en yeni iz
    esler = {x['fotoAtlasId']: x for x in gg_liste(eid, 'bugunku-esler.json', 'esler')}
    izler = izler_oku(eid, cikti)
    for g in fotolar:
        es = esler.get(g['fotoAtlasId'])
        if es:
            gg_kopyala(eid, es, cikti)
            g['bugun'] = dict(gorsel=es['gorsel'], kucuk=es['kucuk'], aciBenzerligi=es['aciBenzerligi'], kaynakSatiri=es['kaynakSatiri'],
                              kim='AKAR arşivi', ornek=False, tur='admin')
            continue
        uygun = sorted((i for i in izler if i.get('ayniAciFotoAtlasId') == g['fotoAtlasId']), key=lambda i: i['tarih'])
        if uygun:
            i = uygun[-1]
            g['bugun'] = dict(gorsel=i['gorsel'], kucuk=i['kucuk'], aciBenzerligi=i['aciBenzerligi'], kaynakSatiri=i['kaynakSatiri'],
                              kim=i['kullanici'], ornek=bool(i.get('ornek')), tur='katki')
    return fotolar


def gg_liste(eid, dosya, alan):
    yol = os.path.join(ESER, eid, 'gecmisi-gor', dosya)
    return json_oku(yol).get(alan, []) if os.path.exists(yol) else []


def gg_kopyala(eid, g, cikti):
    """gecmisi-gor/ altındaki gorsel/kucuk'u gg/<eser>/'e kopyalar, yolları uygulamaya göre yazar."""
    for alan in ('gorsel', 'kucuk'):
        hedef = os.path.join(cikti, 'gg', eid, os.path.basename(g[alan]))
        os.makedirs(os.path.dirname(hedef), exist_ok=True)
        shutil.copyfile(os.path.join(ESER, eid, 'gecmisi-gor', g[alan]), hedef)
        g[alan] = f'gg/{eid}/{os.path.basename(g[alan])}'


def izler_oku(eid, cikti):
    """gecmisi-gor/izler.json: İz Bırak katkıları; prototipte yalnız onaylanmışlar (e.izler, ileride Yaşayan hafıza)."""
    izler = [i for i in gg_liste(eid, 'izler.json', 'izler') if i.get('durum') == 'onaylandi']
    for i in izler:
        gg_kopyala(eid, i, cikti)
        for alan in ('kaynakDosya', 'kirpma'):
            i.pop(alan, None)
    return izler


def kucult(kaynak, hedef):
    """sips (macOS) ile uzun kenar 1280 px, JPEG kalite 72; önbellekte varsa kopyalar."""
    os.makedirs(os.path.dirname(hedef), exist_ok=True)
    anahtar = os.path.join(ONBELLEK, os.path.relpath(kaynak, ESER))
    if not os.path.exists(anahtar) or os.path.getmtime(anahtar) < os.path.getmtime(kaynak):
        os.makedirs(os.path.dirname(anahtar), exist_ok=True)
        r = subprocess.run(['sips', '-Z', '1280', '-s', 'format', 'jpeg', '-s', 'formatOptions', '72',
                            kaynak, '--out', anahtar], capture_output=True)
        if r.returncode != 0:
            shutil.copyfile(kaynak, anahtar)
    shutil.copyfile(anahtar, hedef)


def main():
    if len(sys.argv) != 2:
        sys.exit('Kullanım: python3 hazirla.py <çıktı klasörü>')
    cikti = sys.argv[1]
    sehirler = klasor_jsonlari('sehir')
    veri = dict(eserler=[], rotalar=klasor_jsonlari('rota'), sehir=sehirler[0] if sehirler else None, sehirler=sehirler)
    for e in eserleri_bul():
        eid = e['id']
        model = model_oku(eid)
        if model:
            e['glb'], e['yaw'] = model.get('glb'), model.get('yaw', 0)
            k = model.get('kaydirma_m') or {}
            dogu, kuzey = k.get('dogu', 0), k.get('kuzey', 0)
        else:
            dogu = kuzey = 0
        e = dict(e, lat=round(e['lat'] + kuzey / 110540, 7),
                 lon=round(e['lon'] + dogu / (111320 * math.cos(math.radians(e['lat']))), 7))
        fotolar = foto_oku(eid)
        for f in fotolar:
            k = os.path.join(ESER, eid, 'icerik', 'foto', f['dosya'])
            if os.path.exists(k):
                kucult(k, os.path.join(cikti, 'medya', eid, f['dosya']))
                f['url'] = f'medya/{eid}/{f["dosya"]}'
        fotolar = [f for f in fotolar if f.get('url')]
        hikaye = hikaye_oku(eid)
        hakkinda = hakkinda_oku(eid)
        kitap_fotolari(eid, hakkinda, cikti)
        for b in hakkinda:
            for p in b['paragraflar']:
                p.pop('_sayfa', None)
        kayit = dict(e, fotolar=fotolar, hikaye=hikaye, hakkinda=hakkinda, gecmis=gecmis_oku(eid, cikti), izler=izler_oku(eid, cikti), parcalar=parcalar_oku(eid), model=model,
                     gorevler=gorevler_oku(eid)[0], rozetler=gorevler_oku(eid)[1],
                     sure=max(1, round(sum(len(c['metin'].split()) for c in hikaye) / 130)) if hikaye else 0)
        veri['eserler'].append(kayit)
    with open(os.path.join(cikti, 'veri.json'), 'w', encoding='utf-8') as f:
        json.dump(veri, f, ensure_ascii=False, indent=1)
    ozet = ', '.join(f"{e['ad']} {len(e['hikaye'])}c/{len(e['fotolar'])}f/{len(e['gecmis'])}g" for e in veri['eserler'])
    print('veri.json hazır:', ozet)


if __name__ == '__main__':
    main()
