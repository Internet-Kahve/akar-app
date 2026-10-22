#!/usr/bin/env python3
"""Foto Atlas kayıtlarının izin durumunu kurum bazında günceller.

Kurumdan cevap gelince çalıştır. tum.json'daki o kurumun kayıtlarını günceller,
tum-liste.csv'yi yeniden üretir ve kurum-izin-listesi.csv'ye cevabı işler.

Kullanım (bu klasörde):
  python3 durum_guncelle.py --kurum "BSA SPHS Image Collection" --durum kullanilabilir \
      --not "BSA izin verdi, 02.11.2026 e-posta"
  python3 durum_guncelle.py --kurum "Deutsche Fotothek" --durum kullanma --not "Reddetti, 30.10.2026"
  python3 durum_guncelle.py --liste        # kurum adlarını ve durum sayılarını gösterir
  python3 durum_guncelle.py ... --deneme   # hiçbir dosyayı değiştirmeden ne olacağını gösterir

--kurum: tum.json'daki "asilKaynak" değeriyle birebir aynı olmalı (--liste ile bak).
--durum: kullanilabilir | kullanilabilir-yas | izin-bekleniyor | belirsiz | kullanma
Varsayılan olarak sadece "izin-bekleniyor" durumundaki kayıtlar değişir
(açık lisanslı kayıtlar korunur). Hepsini değiştirmek için --hepsi ekle.
"""
import argparse, csv, json, sys
from collections import Counter

DURUMLAR = ['kullanilabilir', 'kullanilabilir-yas', 'izin-bekleniyor', 'belirsiz', 'kullanma']
JSON, LISTE, KURUM = 'tum.json', 'tum-liste.csv', 'kurum-izin-listesi.csv'
H = ['durum','durum_notu','asil_kaynak','lisans','il','ilce','baslik','fotografci','tarih','asil_arsiv_id',
     'kaynak_satiri','asil_arsiv_url','fotoatlas_url','konum_var','yon_var','fotoatlas_id']
s = lambda x: '' if x is None else str(x)

def satir(r):
    t = r['tarih']; tarih = ' – '.join(s(x) for x in [t['enErken'], t['enGec']] if x)
    return [r['durum'], r['durumNotu'], s(r['asilKaynak']), s(r['lisans']), s(r['il']), s(r['ilce']), r['baslik'],
            s(r['fotografci']), tarih, s(r['asilArsivId']), r['kaynakSatiri'], s(r['asilArsivUrl']), r['fotoAtlasUrl'],
            'evet' if r['cekimNoktasi'] else 'hayır', 'evet' if r['yon'] is not None else 'hayır', r['fotoAtlasId']]

def liste_yaz(R):
    sira = {d: i for i, d in enumerate(DURUMLAR)}
    rows = sorted(R, key=lambda r: (sira[r['durum']], r['il'] != 'Bursa', r['asilKaynak'] or 'zzz', r['il'] or 'zzz', r['baslik']))
    with open(LISTE, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.writer(f); w.writerow(H); [w.writerow(satir(r)) for r in rows]

def main():
    p = argparse.ArgumentParser()
    p.add_argument('--kurum'); p.add_argument('--durum', choices=DURUMLAR); p.add_argument('--not', dest='notu', default='')
    p.add_argument('--hepsi', action='store_true'); p.add_argument('--deneme', action='store_true'); p.add_argument('--liste', action='store_true')
    a = p.parse_args()
    d = json.load(open(JSON, encoding='utf-8')); R = d['kayitlar']
    if a.liste:
        g = {}
        for r in R: g.setdefault(r['asilKaynak'] or '(kaynak yok)', Counter())[r['durum']] += 1
        for k, c in sorted(g.items(), key=lambda x: -sum(x[1].values())): print(f"{sum(c.values()):6}  {k}  {dict(c)}")
        return
    if not (a.kurum and a.durum): p.error('--kurum ve --durum gerekli (ya da --liste)')
    hedef = [r for r in R if r['asilKaynak'] == a.kurum]
    if not hedef: sys.exit(f'"{a.kurum}" bulunamadı. Doğru adı görmek için: python3 durum_guncelle.py --liste')
    degisecek = [r for r in hedef if a.hepsi or r['durum'] == 'izin-bekleniyor']
    print(f'{a.kurum}: {len(hedef)} kayıt, {len(degisecek)} tanesi "{a.durum}" olacak. Önce: {dict(Counter(r["durum"] for r in hedef))}')
    if a.deneme: print('(deneme: dosyalar değişmedi)'); return
    for r in degisecek:
        r['durum'] = a.durum; r['durumNotu'] = a.notu or r['durumNotu']
    json.dump(d, open(JSON, 'w', encoding='utf-8'), ensure_ascii=False)
    liste_yaz(R)
    rows = list(csv.reader(open(KURUM, encoding='utf-8-sig'))); h = rows[0]; n = len(h)
    for r in rows[1:]:
        r.extend([''] * (n - len(r)))
        if r[0] == a.kurum:
            r[h.index('karar')] = a.durum; r[h.index('cevap')] = a.notu or r[h.index('cevap')]
    csv.writer(open(KURUM, 'w', newline='', encoding='utf-8-sig')).writerows(rows)
    print('Güncellendi: tum.json, tum-liste.csv, kurum-izin-listesi.csv. IZIN_DURUMU.md tablosunu elle güncelle.')

if __name__ == '__main__':
    main()
