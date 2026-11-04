"""python3 mahya_ekle.py ayar/<eser>.json (Pillow gerekir).

Minareler ön cepheden soldan sağa sıralanır. Merkezler ve kot uygulama
modelinin Blender dünyasındadır. Girdiler gece_uret.py'nin düz sahneleridir.
"""
import argparse
import io
import json
import math
import struct
from pathlib import Path

from PIL import Image, ImageColor

# 5 sütunlu ampul alfabesi. Her sayı soldan sağa bir satırın bitleri.
HARFLER = {
    'A': [14,17,17,31,17,17,17], 'B': [30,17,17,30,17,17,30],
    'C': [14,17,16,16,16,17,14], 'D': [30,17,17,17,17,17,30],
    'E': [31,16,16,30,16,16,31], 'F': [31,16,16,30,16,16,16],
    'G': [14,17,16,23,17,17,14], 'H': [17,17,17,31,17,17,17],
    'I': [31,4,4,4,4,4,31], 'J': [7,2,2,2,2,18,12],
    'K': [17,18,20,24,20,18,17], 'L': [16,16,16,16,16,16,31],
    'M': [17,27,21,21,17,17,17], 'N': [17,25,21,19,17,17,17],
    'O': [14,17,17,17,17,17,14], 'P': [30,17,17,30,16,16,16],
    'Q': [14,17,17,17,21,18,13], 'R': [30,17,17,30,20,18,17],
    'S': [15,16,16,14,1,1,30], 'T': [31,4,4,4,4,4,4],
    'U': [17,17,17,17,17,17,14], 'V': [17,17,17,17,17,10,4],
    'Y': [17,17,10,4,4,4,4], 'Z': [31,1,2,4,8,16,31],
}
HARFLER['Ş'] = HARFLER['S'] + [4,8]
HARFLER['Ç'] = HARFLER['C'] + [4,8]


def doku(m):
    noktalar = []
    x = 1
    for harf in m['yazi']:
        if harf == ' ':
            x += m['kelime_araligi']
            continue
        for y, satir in enumerate(HARFLER[harf]):
            noktalar.extend((x+i, y+1) for i in range(5) if satir & (16 >> i))
        x += 5 + m['harf_araligi']
    adim = min(20, 2048 // (x+1))
    if adim < 4:
        raise ValueError('Yazı dokuya sığmıyor')
    renk = ImageColor.getrgb(m['renk'])
    resim = Image.new('RGBA', ((x+1)*adim, 11*adim), (*renk, 0))
    piksel = resim.load()
    for cx, cy in noktalar:
        for dy in range(-adim, adim):
            for dx in range(-adim, adim):
                r = math.hypot(dx, dy)/adim
                alfa = round(255 * math.exp(-8 * max(0, r-0.32)))
                px, py = cx*adim+dx, cy*adim+dy
                if alfa > piksel[px, py][3]:
                    piksel[px, py] = (*renk, alfa)
    png = io.BytesIO()
    resim.save(png, 'PNG')
    return png.getvalue()


def oku(yol):
    veri = yol.read_bytes()
    n = struct.unpack_from('<I', veri, 12)[0]
    return json.loads(veri[20:20+n]), bytearray(veri[28+n:])


def konum(j, ad):
    return next(n for n in j['nodes'] if n['name'] == ad).get('translation', [0,0,0])


def ekle(j, veri, ayar, referans, png):
    m = ayar['mahya']

    def ek(alan, deger):
        liste = j.setdefault(alan, [])
        liste.append(deger)
        return len(liste)-1

    def gorunum(b):
        veri.extend(bytes(-len(veri) % 4))
        ofset = len(veri)
        veri.extend(b)
        return ek('bufferViews', dict(buffer=0, byteOffset=ofset, byteLength=len(b)))

    def alan(noktalar):
        boy = len(noktalar[0])
        b = b''.join(struct.pack('<'+'f'*boy, *p) for p in noktalar)
        return ek('accessors', dict(bufferView=gorunum(b), componentType=5126,
                  count=len(noktalar), type=f'VEC{boy}', min=list(map(min, zip(*noktalar))),
                  max=list(map(max, zip(*noktalar)))))

    merkez = {a['nesne']: a['merkez'] for a in ayar['isik']['minare']}
    uclar = []
    for ad in m['minareler']:
        dx, dy, dz = [a-b for a,b in zip(konum(j, ad), konum(referans, ad))]
        x, y = merkez[ad]
        uclar.append((x+dx, m['kot']+dy, -y+dz))
    a,b = uclar
    uzunluk = math.hypot(b[0]-a[0], b[2]-a[2])
    ux, uz = (b[0]-a[0])/uzunluk, (b[2]-a[2])/uzunluk

    def nokta(t, yuk, derinlik=0):
        return (a[0]+t*(b[0]-a[0])-uz*derinlik,
                a[1]+t*(b[1]-a[1])+yuk, a[2]+t*(b[2]-a[2])+ux*derinlik)

    def sark(t):
        return m['sarkma']*(math.cosh(2*t-1)-math.cosh(1))/(math.cosh(1)-1)

    im = ek('images', dict(bufferView=gorunum(png), mimeType='image/png'))
    tex = ek('textures', dict(source=im))
    unlit = {'KHR_materials_unlit': {}}
    yazi = ek('materials', dict(name='Mahya_Yazi', extensions=unlit, alphaMode='BLEND',
             doubleSided=False, pbrMetallicRoughness=dict(baseColorTexture=dict(index=tex))))
    rgb = [v/255 for v in ImageColor.getrgb(m['tel_rengi'])]
    tel = ek('materials', dict(name='Mahya_Tel', extensions=unlit, pbrMetallicRoughness=dict(
        baseColorFactor=[v/12.92 if v <= .04045 else ((v+.055)/1.055)**2.4 for v in rgb]+[1])))
    sol = (1-m['genislik']/uzunluk)/2
    ust = sark(.5)
    h = m['yukseklik']
    poz, uv = [], []
    for yon in (1,-1):
        for i,k in [(0,0),(1,0),(1,1),(0,0),(1,1),(0,1)]:
            t = i if yon == 1 else 1-i
            poz.append(nokta(sol+t*(1-2*sol), ust-h+k*h, yon*.006))
            uv.append((i,1-k))
    prim = [dict(attributes=dict(POSITION=alan(poz), TEXCOORD_0=alan(uv)), material=yazi)]
    poz = []
    n = m['tel_parcalari']
    if not 8 <= n <= 12 or not 0 < sol < .5:
        raise ValueError('Tel bölüm sayısı veya yazı genişliği uygun değil')
    for seviye in (0,-h):
        halkalar = []
        for i in range(n+1):
            t = i/n
            halkalar.append([nokta(t, seviye+sark(t)+m['tel_yaricapi']*math.cos(k*math.pi/2),
                             m['tel_yaricapi']*math.sin(k*math.pi/2)) for k in range(4)])
        for ilk, son in zip(halkalar, halkalar[1:]):
            for k in range(4):
                l = (k+1)%4
                poz.extend((ilk[k],ilk[l],son[l],ilk[k],son[l],son[k]))
    prim.append(dict(attributes=dict(POSITION=alan(poz)), material=tel))
    mesh = ek('meshes', dict(name='Mahya', primitives=prim))
    j['scenes'][j.get('scene',0)]['nodes'].append(ek('nodes', dict(name='Mahya', mesh=mesh)))
    j['buffers'][0]['byteLength'] = len(veri)
    veri.extend(bytes(-len(veri) % 4))
    metin = json.dumps(j, ensure_ascii=False, separators=(',',':')).encode()
    metin += b' ' * (-len(metin) % 4)
    return (struct.pack('<4s4I', b'glTF',2,28+len(metin)+len(veri),len(metin),
            0x4E4F534A) + metin + struct.pack('<I4s',len(veri),b'BIN\0') + veri)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('ayar', type=Path)
    ayar = json.loads(parser.parse_args().ayar.read_text())
    klasor = Path(__file__).resolve().parents[2]/ayar['eser']/'3d/export/night'
    kok = ayar['dosya']+'_night'
    referans, _ = oku(klasor/(kok+'.glb'))
    png = doku(ayar['mahya'])
    for ek in ('','_sunum'):
        hedef = klasor/(kok+'_v2'+ek+'.glb')
        j, veri = oku(klasor/(kok+ek+'.glb'))
        sonuc = ekle(j, veri, ayar, referans, png)
        with hedef.open('xb') as f:
            f.write(sonuc)


if __name__ == '__main__':
    main()
