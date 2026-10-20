# AKAR · Emir Hanı v03 · yan yana karşılaştırma (Ulu Cami render_v24.py yan_yana() düzeni: solda fotoğraf, sağda render, 16 px beyaz ara, aynı yükseklik)
# Kullanım: python yan_yana_v03.py <foto> <render> <çıktı> [yükseklik=1000] [döndür=0]
#   döndür: fotoğrafı saat yönünde derece (vakif_1983_pdf176 sağ yarısı 90° dönük basılmış: -90 ile düzeltilir; model döndürülmez)
#   kırp: foto adı 'vakif_1983_pdf176' ise sayfanın sağ yarısı alınır.
import sys, os
from PIL import Image


def yan_yana(foto, rnd, out, h=1000, dondur=0):
    f = Image.open(foto).convert("RGB")
    if "vakif_1983_pdf176" in os.path.basename(foto):
        w, hh = f.size; f = f.crop((w // 2 + 5, 0, w, hh))
    if dondur: f = f.rotate(-dondur, expand=True)
    r = Image.open(rnd).convert("RGBA"); bg = Image.new("RGBA", r.size, (204, 204, 204, 255)); r = Image.alpha_composite(bg, r).convert("RGB")
    f = f.resize((round(f.width * h / f.height), h), Image.LANCZOS); r = r.resize((round(r.width * h / r.height), h), Image.LANCZOS)
    o = Image.new("RGB", (f.width + 16 + r.width, h), (255, 255, 255)); o.paste(f, (0, 0)); o.paste(r, (f.width + 16, 0))
    o.save(out, optimize=True); return out


if __name__ == "__main__":
    a = sys.argv[1:]
    yan_yana(a[0], a[1], a[2], int(a[3]) if len(a) > 3 else 1000, int(a[4]) if len(a) > 4 else 0)
