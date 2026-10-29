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
    # 29 Ekim 2026 · Akar akışı: «## Akar akışı» tablosu → cümlenin `akis` alanı (app.js akisUygula haritada gelir yolunu çizer)
    # | # | Akar (gelir veren) | Hayrat (gelir alan) | Hayrat adı | Etiket | Kaynak | Güven |   Hayrat: eser kimliği ya da «enlem, boylam»
    if '## Akar akışı' in metin:
        for h in tablo(metin.split('## Akar akışı', 1)[1], '#'):
            if len(h) < 7 or not h[0].strip().isdigit():
                continue
            m = re.match(r'\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$', h[2])
            akis = dict(kaynak_eser=ham(h[1]), hedef_eser=None if m else ham(h[2]),
                        hedef_nokta=[float(m.group(2)), float(m.group(1))] if m else None,
                        hedef_ad=h[3], etiket=h[4], kaynak=kaynak_bicim(h[5]), guven=h[6])
            for c in cumleler:
                if c['no'] == int(h[0]):
                    c['akis'] = akis
            for k in (akis['kaynak_eser'], akis['hedef_eser']):
                if k and not os.path.exists(os.path.join(ESER, k, 'eser.json')):
                    print(f'UYARI: {eid} hikaye.md Akar akışı: «{k}» diye eser yok')
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


def okuma_oku(eid, bolumler):
    """icerik/eser-hakkinda-okuma.md: «Eser hakkında» okuma katmanı (özet, rakam, alıntı, zaman, terim, 3D açısı) bölüme `okuma` olarak eklenir.
    Yeni metin yazılmaz: özet cümlesi, alıntı, kanıt ve terim tanımı envanter metninde birebir geçmeli; geçmeyen satır atlanır ve uyarı yazılır."""
    yol = os.path.join(ESER, eid, 'icerik', 'eser-hakkinda-okuma.md')
    if not os.path.exists(yol):
        return []
    bol = {b['baslik']: b for b in bolumler}
    tum = ' '.join(p['metin'] for b in bolumler for p in b['paragraflar'])
    uyari = []
    terimler = []
    def var(parca, metin, ne):
        if parca and parca in metin:
            return True
        uyari.append(f'{ne}: «{parca[:60]}»')
        return False
    for parca in re.split(r'(?m)^## ', oku(yol))[1:]:
        baslik, _, govde = parca.partition('\n')
        b = bol.get(baslik.strip())
        if not b:
            continue
        metin = ' '.join(p['metin'] for p in b['paragraflar'])
        o = dict(ozet=[], rakam=[], alinti=[], zaman=[], ucd=None)
        ozette = False
        for satir in govde.splitlines():
            satir = satir.rstrip()
            if satir.startswith('Özet:'):
                ozette = True; continue
            if ozette and satir.startswith('- '):
                c = satir[2:].strip()
                if var(c, metin, f'{baslik.strip()} özet'):
                    o['ozet'].append(c)
                continue
            ozette = False
            ad, _, deger = satir.partition(':')
            alan = [x.strip() for x in deger.split('|')]
            if ad == 'Rakam' and len(alan) == 3 and var(alan[2], metin, f'{baslik.strip()} rakam kanıtı'):
                o['rakam'].append(dict(deger=alan[0], etiket=alan[1], kanit=alan[2]))
            elif ad == 'Alıntı' and alan[0] and var(alan[0], metin, f'{baslik.strip()} alıntı'):
                kim = alan[1] if len(alan) > 1 else ''
                if kim and not any(alan[0] in p['metin'] and kim in p['metin'] for p in b['paragraflar']):
                    uyari.append(f'{baslik.strip()} alıntı sahibi aynı paragrafta yok: «{kim}»'); kim = ''
                o['alinti'].append(dict(metin=alan[0], kim=kim))
            elif ad == 'Zaman' and len(alan) == 2 and var(alan[1], metin, f'{baslik.strip()} zaman kanıtı'):
                o['zaman'].append(dict(yil=alan[0], kanit=alan[1]))
            elif ad == 'Terim' and len(alan) == 2 and var(alan[0], tum, 'terim') and var(alan[1], tum, f'terim tanımı ({alan[0]})'):
                terimler.append(dict(kelime=alan[0], tanim=alan[1]))
            elif ad == '3D' and len(alan) == 5:
                o['ucd'] = dict(parcalar=[x.strip() for x in alan[0].split(',') if x.strip()], azimut=float(alan[1]), egim=float(alan[2]),
                                uzaklik=alan[3], ici=alan[4].lower().startswith('e'))
        b['okuma'] = o
    for u in uyari:
        print(f'  ! {eid} eser-hakkinda-okuma.md kitapta birebir yok, atlandı → {u}')
    return terimler


def en_oku(eid, hikaye, parcalar, fotolar, hakkinda):
    """İngilizce içerik (29 Ekim 2026): eserler/<eser>/icerik/en/ altında, Türkçe dosyalara DOKUNMADAN paralel dosyalar.
    Biçim: docs/documents-context/ICERIK_INGILIZCE.md. Bulunan her çeviri Türkçe kaydın yanına `<alan>_en` olarak eklenir;
    olmayan alan boş kalır, uygulama Türkçesini gösterir. Eşleşmeyen satır uyarı verir, sessizce atlanmaz."""
    kok = os.path.join(ESER, eid, 'icerik', 'en')
    if not os.path.isdir(kok):
        return 0
    uyari, n = [], 0
    yol = os.path.join(kok, 'hikaye.md')
    if os.path.exists(yol):
        no = {c['no']: c for c in hikaye}
        for h in tablo(oku(yol), '#'):
            if len(h) >= 2 and h[0].isdigit() and h[1]:
                if int(h[0]) in no: no[int(h[0])]['metin_en'] = h[1]; n += 1
                else: uyari.append(f'hikaye.md: {h[0]}. cümle Türkçede yok')
    yol = os.path.join(kok, 'parcalar.md')
    if os.path.exists(yol):
        anahtar = {', '.join(p['adlar']): p for p in parcalar}
        for h in tablo(oku(yol), 'Parçalar'):
            if len(h) < 3:
                continue
            k = ', '.join(x.strip() for x in h[0].split(',') if x.strip())
            if k in anahtar:
                if h[1]: anahtar[k]['baslik_en'] = h[1]; n += 1
                if h[2]: anahtar[k]['metin_en'] = h[2]; n += 1
            else: uyari.append(f'parcalar.md: «{k}» Türkçe kartlarda yok')
    yol = os.path.join(kok, 'fotograflar.md')
    if os.path.exists(yol):
        dosya = {f['dosya']: f for f in fotolar}
        for h in tablo(oku(yol), 'Dosya'):
            if len(h) < 4:
                continue
            f = dosya.get(ham(h[0]))
            if not f: uyari.append(f'fotograflar.md: {ham(h[0])} Türkçede yok'); continue
            for i, alan in ((1, 'baslik'), (2, 'kisa'), (3, 'alt')):
                if h[i]: f[alan + '_en'] = h[i]; n += 1
    yol = os.path.join(kok, 'eser-hakkinda.md')
    if os.path.exists(yol):
        bol = {b['baslik']: b for b in hakkinda}
        for parca in re.split(r'(?m)^## ', oku(yol))[1:]:
            bas, _, govde = parca.partition('\n')
            tr, _, en = bas.partition('|')
            b = bol.get(tr.strip())
            if not b: uyari.append(f'eser-hakkinda.md: «{tr.strip()}» bölümü Türkçede yok'); continue
            if en.strip(): b['baslik_en'] = en.strip(); n += 1
            pler = [x.strip() for x in govde.split('\n\n') if x.strip()]
            if len(pler) != len(b['paragraflar']):
                uyari.append(f'eser-hakkinda.md: «{tr.strip()}» {len(pler)} paragraf, Türkçede {len(b["paragraflar"])}; bölüm atlandı'); continue
            for p, t in zip(b['paragraflar'], pler):
                p['metin_en'] = t; n += 1
    for u in uyari:
        print(f'  ! {eid} icerik/en/{u}')
    return n


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
    veri = dict(eserler=[], rotalar=klasor_jsonlari('rota'), sehir=next((x for x in sehirler if x.get('varsayilan')), sehirler[0] if sehirler else None), sehirler=sehirler)
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
        terimler = okuma_oku(eid, hakkinda)
        for b in hakkinda:
            for p in b['paragraflar']:
                p.pop('_sayfa', None)
        parcalar = parcalar_oku(eid)
        en = en_oku(eid, hikaye, parcalar, fotolar, hakkinda)
        kayit = dict(e, fotolar=fotolar, hikaye=hikaye, hakkinda=hakkinda, terimler=terimler, gecmis=gecmis_oku(eid, cikti), izler=izler_oku(eid, cikti), parcalar=parcalar, model=model, en_alan=en,
                     gorevler=gorevler_oku(eid)[0], rozetler=gorevler_oku(eid)[1],
                     sure=max(1, round(sum(len(c['metin'].split()) for c in hikaye) / 130)) if hikaye else 0)
        veri['eserler'].append(kayit)
    with open(os.path.join(cikti, 'veri.json'), 'w', encoding='utf-8') as f:
        json.dump(veri, f, ensure_ascii=False, indent=1)
    ozet = ', '.join(f"{e['ad']} {len(e['hikaye'])}c/{len(e['fotolar'])}f/{len(e['gecmis'])}g" for e in veri['eserler'])
    print('veri.json hazır:', ozet)


if __name__ == '__main__':
    main()
