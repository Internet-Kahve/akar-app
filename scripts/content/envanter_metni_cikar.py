"""AKAR · envanter kitabından bir eserin Türkçe metnini kitap sırasıyla çıkarır (28 Ekim 2026).
Kitap düzeni: her PDF sayfası iki kitap sayfası; Türkçe metin BrandonGrotesque-Regular, İngilizce Light. Bir blok = bir paragraf;
küçük harfle başlayan blok bir öncekinin devamıdır (sayfa geçişi). Satır sonu tirelemesi birleştirilir.
Kullanım: python3 envanter_metni_cikar.py <pdf> <ilk_sayfa> <son_sayfa>  → JSON (sayfa, metin) listesi stdout'a
"""
import sys, json, re, unicodedata
import pymupdf as fitz
pdf, ilk, son = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
LIG = {'ﬁ': 'fi', 'ﬂ': 'fl', 'ﬀ': 'ff', 'ﬃ': 'ffi', 'ﬄ': 'ffl'}
d = fitz.open(pdf); out = []
for pn in range(ilk - 1, son):
    bl = []
    for b in d[pn].get_text('dict')['blocks']:
        sp = [s for l in b.get('lines', []) for s in l['spans'] if s['text'].strip()]
        if not sp: continue
        tr = sum(len(s['text']) for s in sp if 'Regular' in s['font'] and 10.5 < s['size'] < 11.6)
        if tr * 2 < sum(len(s['text']) for s in sp): continue          # İngilizce, başlık, sayfa no
        satirlar = [''.join(s['text'] for s in l['spans']).strip() for l in b['lines']]
        metin = ''
        for s in satirlar:
            if not s: continue
            if metin.endswith('-') and s[:1].islower(): metin = metin[:-1] + s
            else: metin = (metin + ' ' + s) if metin else s
        for a, c in LIG.items(): metin = metin.replace(a, c)
        metin = re.sub(r'\s+', ' ', metin).strip()
        x0, y0 = b['bbox'][:2]
        bl.append(((x0 >= 850), round(x0 / 120), y0, metin))
    for _, _, _, m in sorted(bl):
        if out and (m[:1].islower() or out[-1]['metin'].endswith(('-',))):
            out[-1]['metin'] = (out[-1]['metin'][:-1] if out[-1]['metin'].endswith('-') else out[-1]['metin'] + ' ') + m
            if pn + 1 not in out[-1]['sayfalar']: out[-1]['sayfalar'].append(pn + 1)
        else:
            out.append(dict(sayfalar=[pn + 1], metin=m))
json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
