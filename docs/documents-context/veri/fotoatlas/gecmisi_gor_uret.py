#!/usr/bin/env python3
"""Foto Atlas eski fotoğraflarından Geçmişi Gör verisini üretir.

Ne yapar (her çalıştırmada baştan, aynı sonucu verir):
  1. tum.json'dan sadece durum = kullanilabilir / kullanilabilir-yas kayıtları alır.
  2. Her fotoğrafı eserlere eşler: ad (konular + başlık) ve konum (çekim noktası, yön, görüş açısı).
     eslesme_elle.csv'deki onay / ret kararları her şeyden önce gelir.
  3. Esere bağlanan (kesin ya da elle onaylı) fotoğrafları küçültür:
     cikti/gorseller/fa-<id>.webp (uzun kenar 1600) ve fa-<id>_k.webp (400).
     Artık kullanılmayan (durumu düşen, eşleşmesi kalkan) görselleri o klasörden siler.
  4. cikti/gecmisi-gor.json  -> eser -> fotoğraflar verisi (frontend ekibi kendi yerine alır)
     eslesme_raporu.md       -> sayılar, emin olunamayanlar, indirilmesi gerekenler

Betik SADECE bu klasöre (veri/fotoatlas) yazar; apps/ ve packages/ klasörlerine dokunmaz.

Kullanım (bu klasörde, durum_guncelle.py ile aynı yerde):
  python3 gecmisi_gor_uret.py              # her şeyi üret
  python3 gecmisi_gor_uret.py --deneme     # hiçbir dosyaya yazma, sadece özet
  python3 gecmisi_gor_uret.py --gorselsiz  # görselleri atla (hızlı), JSON + rapor

İzin gelince sıra: durum_guncelle.py -> (yeni görseller gerekiyorsa indir, gorseller/orijinal'e koy) -> bu betik.
Gerekli: Python 3.9+, Pillow (WebP destekli).
"""
import argparse, csv, json, math, re, sys, unicodedata
from datetime import date
from pathlib import Path

VERI = Path(__file__).resolve().parent          # bu klasör: veri/fotoatlas
ROOT = VERI
TUM = VERI / 'tum.json'
ESERLER = VERI / 'eser_konum.csv'
ELLE = VERI / 'eslesme_elle.csv'
ORIJINAL = VERI / 'gorseller/orijinal'
RAPOR = VERI / 'eslesme_raporu.md'
OUT_IMG = VERI / 'cikti/gorseller'
OUT_JSON = VERI / 'cikti/gecmisi-gor.json'
WEB_YOL = 'gorseller/'   # gecmisi-gor.json'a göre göreli yol; frontend kendi yerine kopyalar

KULLANILABILIR = {'kullanilabilir', 'kullanilabilir-yas'}
BUYUK, KUCUK = 1600, 400
KONI_TOLERANS = 10      # görüş açısının yarısına eklenen pay (derece)
MAKS_MESAFE = 2500      # bundan uzaktaki eser "görünüyor" sayılmaz (m)
YAKIN = 60              # bu mesafede çekim noktası eserin içinde / dibinde sayılır (m)
KONIDE_OLASI = 250      # adı geçmeyen ama konide bu kadar yakındaki eser "olası" önerilir (m)
IC_MEKAN_KONU = {'Mihrap', 'Minber'}
IC_ELLE = set()
IC_MEKAN_BASLIK = re.compile(r'içinden|iç mekân|mihrab|minber', re.I)


def norm(s):
    s = (s or '').replace('İ', 'i').replace('I', 'ı').lower().replace('ı', 'i')
    s = unicodedata.normalize('NFD', s)
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r'[^a-z0-9]+', ' ', s)
    s = re.sub(r'\bcamii\b', 'cami', s)
    return f' {s.strip()} '


def mesafe_yon(lat1, lng1, lat2, lng2):
    dy = (lat2 - lat1) * 111_000
    dx = (lng2 - lng1) * 111_000 * math.cos(math.radians((lat1 + lat2) / 2))
    return math.hypot(dx, dy), (math.degrees(math.atan2(dx, dy)) + 360) % 360


def aci_farki(a, b):
    return abs((a - b + 180) % 360 - 180)


ON_EK = {0: 'ler', 1: 'lar', 2: 'ler', 3: 'lar', 4: 'lar', 5: 'ler', 6: 'lar', 7: 'ler', 8: 'ler', 9: 'lar'}


def tarih_etiketi(t):
    a, b = t.get('enErken'), t.get('enGec')
    yil = date.today().year
    if a and a > yil: a = None
    if b and b > yil: b = None
    if a and b and a == b: return str(a)
    if a and b:
        if a % 10 == 0 and b - a == 9: return f"{a}'{ON_EK[(a // 10) % 10]}"
        if str(a)[:2] == str(b)[:2]: return f'{a}–{str(b)[2:]}'
        return f'{a}–{b}'
    if a: return str(a)
    if b: return f'{b} öncesi'
    return 'Tarih bilinmiyor'


def lisans(r):
    if r.get('lisans'): return r['lisans']
    if r['durum'] == 'kullanilabilir-yas': return 'Kamu malı (yaş: 1955 öncesi, fotoğrafçı bilinmiyor)'
    return 'Yazılı izin'


def bolge(r):
    if (r.get('ilce') or '') == 'İznik': return 'iznik'
    if any('İznik' in k for k in (r.get('konular') or [])) or 'İznik' in r['baslik']: return 'iznik'
    c = r.get('cekimNoktasi')
    if c and c['lat'] > 40.3 and c['lng'] > 29.5: return 'iznik'
    return 'bursa'


def oku_eserler():
    E = []
    for row in csv.DictReader(open(ESERLER, encoding='utf-8')):
        row['adlar_n'] = [norm(a) for a in row['adlar'].split('|') if a.strip()]
        row['lat'] = float(row['lat']) if row['lat'] else None
        row['lng'] = float(row['lng']) if row['lng'] else None
        E.append(row)
    return E


def oku_elle():
    karar = {}
    if ELLE.exists():
        for row in csv.DictReader(open(ELLE, encoding='utf-8')):
            if not row.get('fotoAtlasId'): continue
            k = row['karar'].strip()
            if k == 'ic-mekan': IC_ELLE.add(int(row['fotoAtlasId'])); continue
            if row.get('eser'):
                karar[(int(row['fotoAtlasId']), row['eser'].strip())] = (k, row.get('not', ''))
    return karar


def eslestir(r, E, elle):
    metin = norm(' '.join((r.get('konular') or []) + [r['baslik']]))
    c, yon = r.get('cekimNoktasi'), r.get('yon')
    aci = (r.get('gorusAcisi') or 60) / 2 + KONI_TOLERANS
    b = bolge(r)
    sonuc, konum_oneri = [], []
    for e in E:
        if e['bolge'] != b: continue
        ad = any(a in metin for a in e['adlar_n'])
        geo = None
        if c and e['lat'] is not None:
            m, brg = mesafe_yon(c['lat'], c['lng'], e['lat'], e['lng'])
            konide = m <= YAKIN or (yon is not None and m <= MAKS_MESAFE and aci_farki(brg, yon) <= aci)
            geo = (round(m), round(brg), konide)
        k = elle.get((r['fotoAtlasId'], e['slug']))
        if k and k[0] == 'ret':
            continue
        if k and k[0] == 'onay':
            sonuc.append((e, 'elle', geo, k[1] or 'eslesme_elle.csv'))
        elif ad and geo and geo[2]:
            sonuc.append((e, 'kesin', geo, 'ad + konum'))
        elif ad and geo is None:
            sonuc.append((e, 'olasi', geo, 'ad tutuyor, konum yok' if not c else 'ad tutuyor, eserin konumu yok'))
        elif ad:
            sonuc.append((e, 'olasi', geo, f'ad tutuyor ama eser konide değil ({geo[0]} m, {geo[1]}°; fotoğraf {yon}°)'))
        elif geo and geo[2] and geo[0] <= KONIDE_OLASI:
            konum_oneri.append((e, 'olasi', geo, f'adı geçmiyor ama {geo[0]} m uzakta, konide'))
    # adı hiçbir esere uymayan fotoğraf için konum önerisi yap (yoksa gürültü olur)
    if not sonuc:
        sonuc = sorted(konum_oneri, key=lambda s: s[2][0])[:2]
    return sonuc


def kayit(r, e, guven, geo, gorsel):
    t = r['tarih']
    return {
        'fotoAtlasId': r['fotoAtlasId'],
        'gorsel': gorsel and WEB_YOL + gorsel[0], 'kucuk': gorsel and WEB_YOL + gorsel[1],
        'genislik': gorsel and gorsel[2], 'yukseklik': gorsel and gorsel[3],
        'baslik': r['baslik'],
        'altMetin': f"Eski fotoğraf: {r['baslik']}, {tarih_etiketi(t)}",
        'altMetinTaslak': True,
        'tarih': {'enErken': t.get('enErken'), 'enGec': t.get('enGec'), 'etiket': tarih_etiketi(t)},
        'fotografci': r.get('fotografci'),
        'kaynakSatiri': r['kaynakSatiri'],
        'asilKaynak': r.get('asilKaynak'), 'asilArsivId': (r.get('asilArsivId') or '').strip() or None,
        'asilArsivUrl': r.get('asilArsivUrl'), 'fotoAtlasUrl': r.get('fotoAtlasUrl'),
        'lisans': lisans(r), 'lisansNotu': r.get('durumNotu'),
        'duzenlenebilir': 'ND' not in (r.get('lisans') or ''),
        'cekimNoktasi': r.get('cekimNoktasi'), 'yon': r.get('yon'), 'gorusAcisi': r.get('gorusAcisi'),
        'icMekan': r['fotoAtlasId'] in IC_ELLE or bool(set(r.get('konular') or []) & IC_MEKAN_KONU) or bool(IC_MEKAN_BASLIK.search(r['baslik'])),
        'eslesme': guven, 'eserMesafesiM': geo and geo[0],
    }


def gorsel_uret(fid, kaydet):
    src = next(iter(sorted(ORIJINAL.glob(f'fa-{fid}.*'))), None)
    if not src: return None
    b, k = f'fa-{fid}.webp', f'fa-{fid}_k.webp'
    from PIL import Image, ImageOps
    with Image.open(src) as im:
        im = ImageOps.exif_transpose(im).convert('RGB')
        w, h = im.size
        s = min(1, BUYUK / max(w, h)); W, H = round(w * s), round(h * s)
        if kaydet:
            OUT_IMG.mkdir(parents=True, exist_ok=True)
            if not (OUT_IMG / b).exists() or (OUT_IMG / b).stat().st_mtime < src.stat().st_mtime:
                im.resize((W, H), Image.LANCZOS).save(OUT_IMG / b, 'WEBP', quality=80, method=6)
                t = im.copy(); t.thumbnail((KUCUK, KUCUK), Image.LANCZOS); t.save(OUT_IMG / k, 'WEBP', quality=72, method=6)
    return (b, k, W, H)


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--deneme', action='store_true'); p.add_argument('--gorselsiz', action='store_true')
    a = p.parse_args()
    kaydet = not a.deneme
    d = json.load(open(TUM, encoding='utf-8'))
    R = [r for r in d['kayitlar'] if r.get('il') == 'Bursa' and r['durum'] in KULLANILABILIR]
    E = oku_eserler(); elle = oku_elle()
    eser_foto = {e['slug']: [] for e in E}; olasi = []; eslesmeyen = []; eksik_orijinal = []; tarih_sorunu = []
    gorseller = {}
    for r in R:
        t = r['tarih']
        if any(x and x > date.today().year for x in (t.get('enErken'), t.get('enGec'))): tarih_sorunu.append(r)
        S = eslestir(r, E, elle)
        bagli = [s for s in S if s[1] in ('kesin', 'elle')]
        olasi += [(r, s) for s in S if s[1] == 'olasi']
        if not S: eslesmeyen.append(r)
        if not bagli: continue
        fid = r['fotoAtlasId']
        if fid not in gorseller:
            gorseller[fid] = None if a.gorselsiz else gorsel_uret(fid, kaydet)
            if not a.gorselsiz and gorseller[fid] is None: eksik_orijinal.append(r)
        for e, guven, geo, _ in bagli:
            eser_foto[e['slug']].append(kayit(r, e, guven, geo, gorseller[fid]))
    for L in eser_foto.values():
        L.sort(key=lambda x: (x['tarih']['enErken'] or x['tarih']['enGec'] or 9999, x['fotoAtlasId']))
    cikti = {
        '_aciklama': 'veri/fotoatlas/gecmisi_gor_uret.py üretir; elle düzenleme. Kaynak: Foto Atlas (tum.json), sadece kullanılabilir kayıtlar. '
                     'Her fotoğrafta kaynakSatiri gösterilmeli; duzenlenebilir=false (ND) ise kırpma / ekranı doldur yok. altMetinTaslak=true olanlar elden geçirilmeli.',
        'uretildi': date.today().isoformat(),
        'eserler': {e['slug']: {'ad': e['ad'], 'konum': [e['lat'], e['lng']] if e['lat'] is not None else None,
                                 'fotograflar': eser_foto[e['slug']]} for e in E if eser_foto[e['slug']]},
    }
    # kullanılmayan görselleri temizle
    silinen = []
    if kaydet and not a.gorselsiz and OUT_IMG.exists():
        gecerli = {x for g in gorseller.values() if g for x in g[:2]}
        for f in OUT_IMG.glob('fa-*.webp'):
            if f.name not in gecerli: silinen.append(f.name); f.unlink()
    # rapor
    sat = [f'# Foto Atlas → Geçmişi Gör eşleştirme raporu', '',
           f'Üretildi: {date.today().isoformat()} · `gecmisi_gor_uret.py` · elle düzenleme, betik yeniden yazar.', '',
           f'- Kullanılabilir Bursa kaydı: **{len(R)}**',
           f'- Esere bağlanan fotoğraf: **{len({x["fotoAtlasId"] for L in eser_foto.values() for x in L})}** (uygulamaya giden; kesin + elle onay)',
           f'- Emin olunamayan öneri: **{len(olasi)}** (aşağıda; onay/ret için `eslesme_elle.csv`)',
           f'- Hiçbir esere yakın olmayan (sokak, manzara vb.): **{len(eslesmeyen)}**', '',
           '## Eser başına', '', '| Eser | Fotoğraf | Tarihler |', '|---|---|---|']
    for e in E:
        L = eser_foto[e['slug']]
        if L: sat.append(f"| {e['ad']} | {len(L)} | {', '.join(x['tarih']['etiket'] for x in L)} |")
    sat.append(f"\nFotoğrafı olmayan eserler: {', '.join(e['ad'] for e in E if not eser_foto[e['slug']])}\n")
    sat += ['## Emin olunamayanlar', '', 'Onaylamak ya da reddetmek için `eslesme_elle.csv` dosyasına satır ekle: `fotoAtlasId,eser,karar,not` (karar: onay | ret | ic-mekan; ic-mekan için eser boş kalabilir).', '',
            '| fotoAtlasId | Fotoğraf | Eser | Neden | Foto Atlas |', '|---|---|---|---|---|']
    for r, (e, _, geo, neden) in sorted(olasi, key=lambda x: (x[1][0]['slug'], x[0]['fotoAtlasId'])):
        sat.append(f"| {r['fotoAtlasId']} | {r['baslik']} ({tarih_etiketi(r['tarih'])}) | {e['slug']} | {neden} | {r['fotoAtlasUrl']} |")
    if eksik_orijinal:
        sat += ['', '## İndirilmesi gerekenler', '', 'Esere bağlı ama `gorseller/orijinal/` içinde dosyası olmayan kayıtlar (yeni izin gelmiş olabilir):', '']
        sat += [f"- {r['fotoAtlasId']} · {r['baslik']} · {r['fotoAtlasUrl']}" for r in eksik_orijinal]
    if tarih_sorunu:
        sat += ['', '## Tarihi hatalı görünenler', ''] + [f"- {r['fotoAtlasId']} · {r['baslik']} · {r['tarih']}" for r in tarih_sorunu]
    if silinen:
        sat += ['', f'## Bu çalıştırmada kaldırılan görseller ({len(silinen)})', '', ', '.join(sorted(silinen))]
    ozet = f"{len(R)} kayıt · {len(cikti['eserler'])} eser · {sum(len(v['fotograflar']) for v in cikti['eserler'].values())} bağlantı · {len(olasi)} olası · eksik görsel {len(eksik_orijinal)}"
    if kaydet:
        OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
        json.dump(cikti, open(OUT_JSON, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        RAPOR.write_text('\n'.join(sat) + '\n', encoding='utf-8')
        print('Yazıldı:', OUT_JSON.relative_to(ROOT), '·', RAPOR.relative_to(ROOT))
    else:
        print('\n'.join(sat[:40])); print('(deneme: dosya yazılmadı)')
    print(ozet)


if __name__ == '__main__':
    sys.exit(main())
