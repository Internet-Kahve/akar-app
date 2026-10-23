# AKAR · ortak ağaç dokusu (19 Ekim 2026): yaprak dokusu (Orhan Bey Camii v06'dan) + gövde tahta/kabuk dokusu.
# İki bölüm:
#   1) Doku üretimi (PIL; Blender dışında çalışır):
#        uv run --no-project --python 3.12 --with pillow python agac_doku.py <hedef_doku_klasoru> [ek_yaprak_hex ...]
#        uv run --no-project --python 3.12 --with pillow python agac_doku.py <hedef_doku_klasoru> --notr   (yalnız agac_govde_notr.png)
#      Yazar: yaprak_7FA35B.png, yaprak_93B46A.png, yaprak_6E9450.png (standart §3 yaprak üçlüsü), agac_govde.png (#7A634B gövde),
#      ve istenirse ek yaprak tonları (ör. servi #3F7A5C → yaprak_3F7A5C.png). Karo ≤ 128 px, sarmalı çizilir (tekrarda dikiş yok).
#   2) Blender yardımcıları (bpy; build betiklerinden çağrılır):  agac_dokula(nesneler, doku_klasoru, yaprak={malzeme_adi: dosya}, govde={malzeme_adi: dosya})
#      (doku bağlar + UV); agac_uv(nesneler, yaprak_adlari, govde_adlari) (yalnız UV; Orhan v06 tek malzeme + köşe rengi düzeni için)
#      Yaprak yüzleri: Orhan v06 eşlemesi, dünya konumundan u = (x + 0,6·y) / 1,3, v = z / 1,3 (gürültülü doku, dikiş görünmez).
#      Gövde/dal yüzleri: gövde ekseni çevresinde silindirik eşleme (çevrede tam sayı karo, dikiş yok), dallarda yüzün uzun kenarı boyunca;
#      karo 0,6 m (çevre) × 1,2 m (boy), damarlar düşey.
import math, os, random

YAPRAK_KARO = 1.3                      # m (Orhan v06)
GOVDE_KARO_U, GOVDE_KARO_V = 0.6, 1.2  # m
YAPRAK_TONLARI = ("#7FA35B", "#93B46A", "#6E9450")
GOVDE_HEX = "#7A634B"


def hx(s): return tuple(int(s[i:i + 2], 16) for i in (1, 3, 5))


# ============================ 1) doku üretimi ============================
def yaprak(path, hexrenk, tohum, W=128, H=128):
    """Ağaç yaprağı (Orhan v06 doku_uret.py ile aynı): ana ton zemin, üstünde küçük yaprak öbekleri (±%12). Sarmalı çizilir."""
    from PIL import Image, ImageDraw
    rnd = random.Random(tohum); taban = hx(hexrenk); im = Image.new("RGB", (W, H), taban); d = ImageDraw.Draw(im)
    def ton(f): return tuple(max(0, min(255, round(c * f))) for c in taban)
    for _ in range(190):
        x, y = rnd.randrange(W), rnd.randrange(H); rx, ry = rnd.randint(3, 8), rnd.randint(2, 5); f = rnd.choice((0.88, 0.93, 1.06, 1.12))
        for ox in (-W, 0, W):
            for oy in (-H, 0, H): d.ellipse([x + ox - rx, y + oy - ry, x + ox + rx, y + oy + ry], fill=ton(f))
    im.save(path, optimize=True)


def govde(path, hexrenk=GOVDE_HEX, tohum=11, W=64, H=128, notr=False):
    """Gövde tahta/kabuk dokusu: düşey, hafif dalgalı koyu yarıklar (×0,74) ve yanlarında açık sırtlar (×1,14), aralarda kısa
    kabuk plakaları. Karo 0,6 × 1,2 m (64 × 128 px, ~107 px/m). Yarıklar düşeyde tam periyotlu sinüsle kıvrılır → üst/alt dikişsiz;
    yatayda sarmalı. notr=True: gri (renk köşe rengiyle çarpılacaksa); ortalama 1,0'a yakın tutulur."""
    from PIL import Image
    rnd = random.Random(tohum); taban = (240, 240, 240) if notr else hx(hexrenk)
    f = [[1.0] * W for _ in range(H)]
    # kabuk plakaları: hafif açık/koyu düşey uzun lekeler
    for _ in range(26):
        x0, y0 = rnd.randrange(W), rnd.randrange(H); w_, h_ = rnd.randint(3, 7), rnd.randint(10, 30); k = rnd.choice((0.93, 0.96, 1.05, 1.08))
        for yy in range(y0 - h_, y0 + h_):
            for xx in range(x0 - w_, x0 + w_):
                if ((xx - x0) / w_) ** 2 + ((yy - y0) / h_) ** 2 <= 1: f[yy % H][xx % W] = k
    # düşey yarıklar
    n = 6
    for i in range(n):
        x0 = (i + rnd.uniform(-0.25, 0.25)) * W / n; a1, a2 = rnd.uniform(1.5, 3.0), rnd.uniform(0.5, 1.5); p1, p2 = rnd.uniform(0, 6.3), rnd.uniform(0, 6.3)
        k1, k2 = rnd.choice((1, 2)), rnd.choice((3, 4))
        kes = [(rnd.randrange(H), rnd.randint(6, 14)) for _ in range(rnd.randint(0, 2))]          # yarığın kesildiği yerler (sürekli çizgi olmasın)
        for y in range(H):
            if any((y - s) % H < L for s, L in kes): continue
            x = x0 + a1 * math.sin(2 * math.pi * k1 * y / H + p1) + a2 * math.sin(2 * math.pi * k2 * y / H + p2)
            xi = int(math.floor(x))
            f[y][xi % W] = 0.74; f[y][(xi + 1) % W] = min(f[y][(xi + 1) % W], 0.84)               # koyu yarık (2 px)
            f[y][(xi + 2) % W] = 1.14; f[y][(xi - 1) % W] = max(f[y][(xi - 1) % W], 1.06)          # açık sırt
    # kısa yatay çatlaklar (kabuk plakalarını ayırır)
    for _ in range(10):
        x0, y0, L = rnd.randrange(W), rnd.randrange(H), rnd.randint(3, 6)
        for dx in range(L): f[y0][(x0 + dx) % W] = 0.80
    ort = sum(map(sum, f)) / (W * H)
    im = Image.new("RGB", (W, H)); px = im.load()
    for y in range(H):
        for x in range(W):
            k = f[y][x] / ort; px[x, y] = tuple(max(0, min(255, round(c * k))) for c in taban)
    im.save(path, optimize=True)


def uret(klasor, ek=()):
    os.makedirs(klasor, exist_ok=True)
    for t, h in enumerate(YAPRAK_TONLARI + tuple(ek), 1): yaprak(os.path.join(klasor, f"yaprak_{h[1:].upper()}.png"), h, t)
    govde(os.path.join(klasor, "agac_govde.png"))


# ============================ 2) Blender yardımcısı ============================
def _doku_dugumu(m, dosya_yolu):
    """Malzemeye DOKU görüntü düğümü bağlar: AO çarpımı (MIX MULTIPLY) varsa A girişine, yoksa doğrudan Base Color'a. Yol blend'e göreli."""
    import bpy
    nt = m.node_tree; bs = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
    tx = nt.nodes.get("DOKU") or nt.nodes.new("ShaderNodeTexImage"); tx.name = "DOKU"
    tx.image = bpy.data.images.load(dosya_yolu, check_existing=True); tx.interpolation = 'Linear'; tx.extension = 'REPEAT'
    try: tx.image.filepath = bpy.path.relpath(dosya_yolu)
    except Exception: pass
    mul = next((n for n in nt.nodes if n.type == "MIX" and n.blend_type == 'MULTIPLY'), None)
    if mul is not None and any(o.is_linked for o in mul.outputs): nt.links.new(tx.outputs["Color"], next(i for i in mul.inputs if i.identifier == "A_Color"))
    else: nt.links.new(tx.outputs["Color"], bs.inputs["Base Color"])
    return tx


def _govde_eksenleri(pts):
    """Gövde köşelerini (dünya) xy'de 2,5 m eşikle kümeler; her küme için eksen = en alt 0,5 m'deki köşelerin xy ortalaması, yarıçap."""
    kume = []
    for p in pts:
        for k in kume:
            if (p.x - k[0].x) ** 2 + (p.y - k[0].y) ** 2 < 2.5 ** 2: k.append(p); break
        else: kume.append([p])
    eks = []
    for k in kume:
        zmin = min(p.z for p in k); alt = [p for p in k if p.z <= zmin + 0.5]
        cx = sum(p.x for p in alt) / len(alt); cy = sum(p.y for p in alt) / len(alt)
        r = sum(math.hypot(p.x - cx, p.y - cy) for p in alt) / len(alt)
        eks.append((cx, cy, max(r, 0.05)))
    return eks


def agac_uv(nesneler, yaprak_adlari, govde_adlari):
    """Yalnız UV yazar (doku bağlamaz). yaprak_adlari / govde_adlari: malzeme adı kümeleri. Dönen: {nesne: (yaprak_yüz, gövde_yüz)}."""
    rapor = {}
    for o in nesneler:
        me = o.data; mw = o.matrix_world; uvl = me.uv_layers.active or me.uv_layers.new(name="UVMap")
        adlar = [s.material.name if s.material else None for s in o.material_slots]
        W = [mw @ v.co for v in me.vertices]
        g_pts = [W[i] for p in me.polygons if adlar[p.material_index] in govde_adlari for i in p.vertices]
        eks = _govde_eksenleri(g_pts) if g_pts else []
        ny = ng = 0
        for p in me.polygons:
            ad = adlar[p.material_index]
            if ad in yaprak_adlari:
                ny += 1
                for li in p.loop_indices:
                    c = W[me.loops[li].vertex_index]; uvl.data[li].uv = ((c.x + 0.6 * c.y) / YAPRAK_KARO, c.z / YAPRAK_KARO)
            elif ad in govde_adlari:
                ng += 1
                pc = mw @ p.center; n = (mw.to_3x3() @ p.normal).normalized()
                cx, cy, r = min(eks, key=lambda e: (e[0] - pc.x) ** 2 + (e[1] - pc.y) ** 2)
                if abs(n.z) < 0.35 and math.hypot(pc.x - cx, pc.y - cy) < r * 1.6 + 0.05:
                    # gövde: silindirik; çevrede tam sayı karo
                    nk = max(1, round(2 * math.pi * r / GOVDE_KARO_U)); af = math.atan2(pc.y - cy, pc.x - cx)
                    for li in p.loop_indices:
                        c = W[me.loops[li].vertex_index]
                        da = (math.atan2(c.y - cy, c.x - cx) - af + math.pi) % (2 * math.pi) - math.pi
                        uvl.data[li].uv = ((af + da) / (2 * math.pi) * nk, c.z / GOVDE_KARO_V)
                elif abs(n.z) >= 0.9:
                    for li in p.loop_indices:                                            # kapak: düz
                        c = W[me.loops[li].vertex_index]; uvl.data[li].uv = (c.x / GOVDE_KARO_U, c.y / GOVDE_KARO_V)
                else:
                    # dal: yüzün en uzun kenarı dal ekseni sayılır (damar onun boyunca)
                    vs = [W[i] for i in p.vertices]; kenar = max(((vs[i], vs[(i + 1) % len(vs)]) for i in range(len(vs))), key=lambda e: (e[1] - e[0]).length)
                    d = (kenar[1] - kenar[0]).normalized()
                    if d.z < 0: d = -d
                    w = n.cross(d).normalized()
                    for li in p.loop_indices:
                        c = W[me.loops[li].vertex_index]; uvl.data[li].uv = (c.dot(w) / GOVDE_KARO_U, c.dot(d) / GOVDE_KARO_V)
        rapor[o.name] = (ny, ng)
    return rapor


def agac_dokula(nesneler, doku_klasoru, yaprak, govde):
    """yaprak / govde: {malzeme adı: dosya adı}. Malzemelere doku bağlar ve UV yazar (agac_uv). Dönen: {nesne: (yaprak_yüz, gövde_yüz)}."""
    import bpy
    for ad, dosya in list(yaprak.items()) + list(govde.items()):
        m = bpy.data.materials.get(ad)
        if m is not None: _doku_dugumu(m, os.path.join(doku_klasoru, dosya))
    return agac_uv(nesneler, set(yaprak), set(govde))


if __name__ == "__main__":
    import sys
    if "--notr" in sys.argv:      # tek malzeme + köşe rengi düzeni (Orhan v06): yalnız gri gövde dokusu
        govde(os.path.join(sys.argv[1], "agac_govde_notr.png"), notr=True)
    else:
        uret(sys.argv[1], sys.argv[2:])
