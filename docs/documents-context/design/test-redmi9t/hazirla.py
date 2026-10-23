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

# Kimlik bilgileri envanterden (C1 s.19, s.96, s.104, s.108; C2 s.8, s.29, s.116). Konum: OSM merkezleri
# (veri/bursa/osm_secilen.csv; Orhan Bey Camii, Hamam ve Emir Hanı için OSM way merkezi). yaw: test sayfasıyla aynı (Ulucami 174: modelde kuzey cephesi
# güneye bakıyordu, 180° çevrildi).
ESERLER = [
    dict(id='ulu-cami', ad='Ulucami', yil='1399', yaptiran='Yıldırım Bayezid', tur='Cami', ikon='cami', rol='dini',
         kisa='Yıldırım Bayezid’in 1399’da yaptırdığı, yirmi kubbeli cami.', glb='ulu-cami_v26', yaw=174,
         lat=40.183929, lon=29.061759),
    dict(id='yildirim-bayezid-bedesteni', ad='Bedesten', uzun_ad='Yıldırım Bayezid Bedesteni', yil='14. yy',
         yaptiran='Yıldırım Bayezid', tur='Bedesten', ikon='han', rol='akar',
         kisa='Ulucami’ye gelir sağlamak için yapılan, Osmanlı’nın ilk bedesteni.', glb='bedesten_v06', yaw=4,
         lat=40.185173, lon=29.062054),
    dict(id='koza-han', ad='Koza Hanı', yil='1491', yaptiran='II. Bayezid', tur='Han', ikon='han', rol='akar',
         kisa='II. Bayezid’in 1491’de yaptırdığı, iki katlı ipek hanı.', glb='koza-han_v14', yaw=4,
         lat=40.184411, lon=29.063496),
    dict(id='orhan-bey-kulliyesi', ad='Orhan Bey Camii', yil='1339–40', yaptiran='Orhan Bey', tur='Cami', ikon='cami',
         rol='dini', kisa='Orhan Bey’in külliyesiyle birlikte yaptırdığı cami.', glb='orhan-bey-camii_v07', yaw=13,
         lat=40.1839745, lon=29.0641131),
    dict(id='orhan-bey-hamami', ad='Orhan Bey Hamamı', yil='1340', yaptiran='Orhan Bey', tur='Hamam', ikon='hamam',
         rol='akar', kisa='Orhan Bey’in külliyesine yaptırdığı çifte hamam; bugün Aynalı Çarşı.',
         glb='orhan-bey-hamami_v05', yaw=6, lat=40.184466, lon=29.062931),
    dict(id='emir-han', ad='Emir Hanı', yil='1339–40', yaptiran='Orhan Bey', tur='Han', ikon='han', rol='akar',
         kisa='Orhan Bey’in külliyesinin parçası olan, Bursa’nın ilk bedesteni sayılan han.', glb='emir-hani_v05', yaw=7,
         lat=40.184537, lon=29.062346),   # uydu görüntüsünden (22 Ekim); OSM'de adlı çokgeni yok
    dict(id='orhan-gazi-turbesi', ad='Orhan Gazi Türbesi', yil='', yaptiran='Hisar içi', tur='Türbe', ikon='turbe',
         rol='dini', kisa='Orhan Gazi’nin ve ailesinin gömülü olduğu kare planlı türbe.', glb='orhan-gazi-turbesi_v02',
         yaw=2, lat=40.186786, lon=29.057715),
]

# Haritada OSM bina izine oturtma düzeltmesi (m, doğu / kuzey). 22 Ekim 2026'da tepeden görüntüde modelin ana gövdesi
# OSM bina sınırlarıyla karşılaştırıldı (Ulucami, Koza Han, Orhan Bey Camii ve Hamam'da çokgen merkezi; Bedesten, Emir Hanı ve
# türbede çokgen dükkânları da içerdiği için kenarlardan ölçüldü). Emir Hanı için seçilen OSM çokgeni (way 1271724730) batıdaki başka
# bir binaydı; han uydu görüntüsünde Ulucami'nin kuzeydoğu köşesinde ölçülüp doğrudan konum olarak yazıldı (48 m doğuya).
OSM_DUZELTME = {
    'ulu-cami': (10.6, -0.6), 'yildirim-bayezid-bedesteni': (6.1, -3.9), 'koza-han': (3.8, -4.0),
    'orhan-bey-kulliyesi': (-2.2, -5.6), 'orhan-bey-hamami': (1.2, 4.2), 'emir-han': (0, 0), 'orhan-gazi-turbesi': (-1.8, -1.1),
}

ROTALAR = [
    dict(id='hanlar-bolgesi', ad='Hanlar Bölgesi Vakıf Yürüyüşü', zorluk='Kolay', sure='~10 dk', mesafe='0,5 km',
         aciklama='Ulucami’den Bedesten’e, Koza Hanı’na ve Orhan Bey Camii’ne: Bursa’nın vakıf çarşısı.',
         duraklar=['ulu-cami', 'yildirim-bayezid-bedesteni', 'koza-han', 'orhan-bey-kulliyesi']),
]


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
    for h in tablo(govde, '#'):
        if len(h) < 7 or not h[0].isdigit():
            continue
        vurgu = [] if h[4] in ('—', '-', '') else [v.strip() for v in h[4].split(',') if v.strip()]
        cumleler.append(dict(no=int(h[0]), metin=h[1], foto=ham(h[2]), kart=h[3].lower().startswith('evet'),
                             vurgu=vurgu, kaynak=kaynak_bicim(h[5]), guven=h[6]))
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
            paragraflar.append(dict(metin=p[:m.start()].strip(), kaynak=kaynak_bicim(m.group(1)), guven=m.group(2)))
        if paragraflar:
            bolumler.append(dict(baslik=baslik, paragraflar=paragraflar))
    return bolumler


def gecmis_oku(eid, cikti):
    """eserler/<eser>/gecmisi-gor/ paketi (Foto Atlas, gecmisi_gor_uret.py yazar): fotoğraflar + WebP'ler gg/<eser>/'e."""
    yol = os.path.join(ESER, eid, 'gecmisi-gor', 'gecmisi-gor.json')
    if not os.path.exists(yol):
        return []
    with open(yol, encoding='utf-8') as f:
        fotolar = json.load(f)['fotograflar']
    for g in fotolar:
        for alan in ('gorsel', 'kucuk'):
            hedef = os.path.join(cikti, 'gg', eid, os.path.basename(g[alan]))
            os.makedirs(os.path.dirname(hedef), exist_ok=True)
            shutil.copyfile(os.path.join(ESER, eid, 'gecmisi-gor', g[alan]), hedef)
            g[alan] = f'gg/{eid}/{os.path.basename(g[alan])}'
    return fotolar


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
    veri = dict(eserler=[], rotalar=ROTALAR)
    for e in ESERLER:
        eid = e['id']
        dogu, kuzey = OSM_DUZELTME.get(eid, (0, 0))
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
        kayit = dict(e, fotolar=fotolar, hikaye=hikaye, hakkinda=hakkinda_oku(eid), gecmis=gecmis_oku(eid, cikti),
                     sure=max(1, round(sum(len(c['metin'].split()) for c in hikaye) / 130)) if hikaye else 0)
        veri['eserler'].append(kayit)
    with open(os.path.join(cikti, 'veri.json'), 'w', encoding='utf-8') as f:
        json.dump(veri, f, ensure_ascii=False, indent=1)
    ozet = ', '.join(f"{e['ad']} {len(e['hikaye'])}c/{len(e['fotolar'])}f/{len(e['gecmis'])}g" for e in veri['eserler'])
    print('veri.json hazır:', ozet)


if __name__ == '__main__':
    main()
