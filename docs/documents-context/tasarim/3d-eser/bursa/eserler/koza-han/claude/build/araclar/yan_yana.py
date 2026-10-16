# Koza Han · render ile referans görseli aynı yükseklikte yan yana birleştirir (kontrol/vNN/yan_yana_*.png).
# Kullanım: uv run --no-project --python 3.12 --with pillow python yan_yana.py <render> <referans> <çıktı> [<render> <referans> <çıktı> ...]
import sys
from PIL import Image

def yan_yana(a, b, out, h=700):
    ims = [Image.open(p).convert("RGB") for p in (a, b)]
    ims = [im.resize((int(im.width * h / im.height), h)) for im in ims]
    c = Image.new("RGB", (sum(i.width for i in ims) + 20, h), (255, 255, 255))
    x = 0
    for im in ims:
        c.paste(im, (x, 0)); x += im.width + 20
    c.save(out)

args = sys.argv[1:]
for i in range(0, len(args), 3):
    yan_yana(*args[i:i + 3])
