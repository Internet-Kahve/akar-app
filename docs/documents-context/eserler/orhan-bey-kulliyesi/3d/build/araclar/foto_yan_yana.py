# AKAR · Orhan Bey Camii · fotoğraf ↔ render yan yana (genel standart §5.4: solda fotoğraf, sağda render)
# Çalıştırma: uv run --no-project --python 3.12 --with pillow python foto_yan_yana.py <foto> <render.png> <cikti.png> [x0,y0,x1,y1]
#   Dördüncü argüman fotoğraftan kırpılacak kutudur (PDF sayfalarındaki levha için). Saydam render açık nötr gri zemine konur.
import sys
from PIL import Image

def main(foto, render, cikti, kutu=None, yuk=1000):
    f = Image.open(foto).convert("RGB")
    if kutu: f = f.crop(tuple(int(v) for v in kutu.split(",")))
    r = Image.open(render).convert("RGBA"); zemin = Image.new("RGBA", r.size, (231, 231, 231, 255)); zemin.alpha_composite(r); r = zemin.convert("RGB")
    f = f.resize((round(f.width * yuk / f.height), yuk), Image.LANCZOS); r = r.resize((round(r.width * yuk / r.height), yuk), Image.LANCZOS)
    s = Image.new("RGB", (f.width + r.width + 12, yuk), (255, 255, 255)); s.paste(f, (0, 0)); s.paste(r, (f.width + 12, 0)); s.save(cikti)

if __name__ == "__main__":
    main(*sys.argv[1:5])
