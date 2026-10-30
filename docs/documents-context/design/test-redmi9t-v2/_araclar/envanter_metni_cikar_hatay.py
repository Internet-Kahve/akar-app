"""AKAR · Hatay İli Vakıf Eserleri kitabından bir kaydın Türkçe metnini çıkarır (30 Ekim 2026). Kitap düzeni Bursa/Konya ciltlerinden farklı: Times New Roman 14 pt, PDF sayfası çift kitap sayfası, Türkçe ve İngilizce bloklar karışık sırada. İngilizce bloklar sık İngilizce kelimelerle ayıklanır; 19 pt ve üstü bloklar kitabın bölüm başlıklarıdır (`baslik: true`).
Kullanım: python3 envanter_metni_cikar_hatay.py <pdf> <ilk_sayfa> <son_sayfa>  → JSON (sayfalar, metin, baslik) listesi stdout'a
"""
import pymupdf, json, re, sys
d = pymupdf.open(sys.argv[1]); ilk, son = int(sys.argv[2]), int(sys.argv[3])
EN = re.compile(r'\b(the|of|and|is|was|which|with|in the|to the)\b')
out = []
for pn in range(ilk, son + 1):
    p = d[pn - 1]; bl = []
    for b in p.get_text('dict')['blocks']:
        sp = [s for l in b.get('lines', []) for s in l['spans'] if s['text'].strip()]
        if not sp: continue
        size = max(s['size'] for s in sp)
        lines = [''.join(s['text'] for s in l['spans']).strip() for l in b['lines']]
        t = ''
        for s in lines:
            if not s: continue
            t = t[:-1] + s if t.endswith('-') and s[:1].islower() else (t + ' ' + s if t else s)
        t = re.sub(r'\s+', ' ', t).strip()
        if size < 13 or size > 21: continue
        if len(EN.findall(t)) >= max(2, len(t.split()) // 25): continue
        bl.append(((b['bbox'][0] >= p.rect.width / 2 - 2), round(b['bbox'][0] / 200), b['bbox'][1], round(size), t))
    for _, _, _, sz, t in sorted(bl):
        out.append(dict(sayfalar=[pn], metin=t, baslik=sz >= 19))
json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
