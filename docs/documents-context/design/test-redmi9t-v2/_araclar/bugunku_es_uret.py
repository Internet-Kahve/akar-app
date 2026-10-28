"""AKAR · Geçmişi Gör «bugünkü eş» ve İz Bırak örnek görsellerini üretir (28 Ekim 2026).
Her eserin gecmisi-gor/ klasöründe bugunku-esler.json (esler) ve izler.json (izler) aranır. kaynakDosya'sı olan kayıt için
asıl dosya (docs/documents-context'e göre yol) okunur, kirpma varsa kesilir, gorsel/kucuk WebP olarak yazılır ve
genislik/yukseklik json'a işlenir. Küçültme ayarları veri/fotoatlas/gecmisi_gor_uret.py'den gelir (BUYUK, KUCUK; kalite 80/72).
Asıl dosyaya dokunulmaz. Kullanım: python3 bugunku_es_uret.py   (eser adı verilmez; bütün eserler taranır)
"""
import json, re, sys, importlib.util
from pathlib import Path
from PIL import Image, ImageOps

DC = Path(__file__).resolve().parents[3]          # docs/documents-context
ESER = DC / 'eserler'
ureten = DC / 'veri/fotoatlas/gecmisi_gor_uret.py'
kaynak = ureten.read_text(encoding='utf-8')
m = re.search(r'^BUYUK, KUCUK = (\d+), (\d+)', kaynak, re.M)
BUYUK, KUCUK = int(m.group(1)), int(m.group(2))
KALITE_B = int(re.search(r"\(OUT_IMG / b, 'WEBP', quality=(\d+)", kaynak).group(1))
KALITE_K = int(re.search(r"\(OUT_IMG / k, 'WEBP', quality=(\d+)", kaynak).group(1))


def uret(kok, kayit):
    if not kayit.get('kaynakDosya'):
        return False
    with Image.open(DC / kayit['kaynakDosya']) as im:
        im = ImageOps.exif_transpose(im).convert('RGB')
        k = kayit.get('kirpma')
        if k:
            im = im.crop((k['x'], k['y'], k['x'] + k['w'], k['y'] + k['h']))
        w, h = im.size
        s = min(1, BUYUK / max(w, h)); W, H = round(w * s), round(h * s)
        for alan in ('gorsel', 'kucuk'):
            (kok / kayit[alan]).parent.mkdir(parents=True, exist_ok=True)
        im.resize((W, H), Image.LANCZOS).save(kok / kayit['gorsel'], 'WEBP', quality=KALITE_B, method=6)
        t = im.copy(); t.thumbnail((KUCUK, KUCUK), Image.LANCZOS); t.save(kok / kayit['kucuk'], 'WEBP', quality=KALITE_K, method=6)
    kayit['genislik'], kayit['yukseklik'] = W, H
    return True


for kok in sorted(ESER.glob('*/gecmisi-gor')):
    for dosya, liste in (('bugunku-esler.json', 'esler'), ('izler.json', 'izler')):
        yol = kok / dosya
        if not yol.exists():
            continue
        veri = json.loads(yol.read_text(encoding='utf-8'))
        n = sum(uret(kok, x) for x in veri.get(liste, []))
        yol.write_text(json.dumps(veri, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
        print(f'{kok.parent.name}/{dosya}: {n} görsel (uzun kenar {BUYUK}, küçük {KUCUK}, WebP {KALITE_B}/{KALITE_K})')
