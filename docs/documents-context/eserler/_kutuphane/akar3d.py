# AKAR · akar3d — vakıf eserleri için kodla 3D üretim kütüphanesi (Blender 4.2+/5.x, bpy)
# Ayasofya pilotundan (v01–v19) çıkarıldı. Kullanım:
#   import sys; sys.path.append(".../3d-eser/_kutuphane"); import akar3d as A
#   A.temizle(); M = A.palet(); g = A.G("Kubbe_Ana", ...); ...; g.obj()
#   A.kontrol_hepsi()   # her turun sonunda ZORUNLU
#
# Ayasofya'da yaşanan hatalara karşı varsayılanlar:
#   - prism/dome/lathe KAPALI hacim üretir (açık kabuk = uygulamada delik).
#   - decal (pencere) duvardan en az 3 cm önde durur (aynı düzlem = siyah titreme).
#   - minare(): alem tabanı külah ucuna sabitlenir (uçan alem olmaz).
#   - renk düz malzemedir; dokuya pişirilmez (bulanıklık). AO isteğe bağlı vertex color.
import bpy, bmesh, math, os, json
from mathutils import Vector
from mathutils.bvhtree import BVHTree

DECAL_OFF = 0.04          # pencere/levha duvardan bu kadar önde (m); 0.03'ten küçük OLMAZ
MIN_GAP = 0.0             # alem–külah gibi bağlantılarda boşluk

# ---------------- palet (AKAR canlı palet, Ayasofya v19'da onaylandı) ----------------
PALET = {
    "kubbe": "#8B96B0", "cati": "#8B96B0", "duvar": "#E3B09B", "pencere": "#88B4DE",
    "tugla": "#D97E51", "tas": "#D6CCBC", "minare_tas": "#E6D6BE", "alem": "#DCA320",
    "kor_kemer": "#C99580", "kapi": "#8A5A3A", "zemin": "#C8BFB0", "kasnak": "#5A646D",
}
def _s2l(c): return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
def mat(name, hx, rough=0.85, metal=0.0):
    m = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    r, g, b = [int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    m.use_nodes = True
    n = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    col = (_s2l(r), _s2l(g), _s2l(b), 1)
    n.inputs["Base Color"].default_value = col
    n.inputs["Roughness"].default_value = rough
    n.inputs["Metallic"].default_value = metal
    m.diffuse_color = col
    m.use_backface_culling = True          # uygulamadaki gibi: arka yüz görünmez
    return m
def palet(ek=None):
    """Malzeme sözlüğü döndürür. ek={"ad": "#hex"} ile esere özel renk eklenir."""
    p = dict(PALET); p.update(ek or {})
    return {k: mat(k.capitalize(), v, 0.35 if k == "alem" else 0.85, 0.6 if k == "alem" else 0.0) for k, v in p.items()}

def temizle():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for me in list(bpy.data.meshes): bpy.data.meshes.remove(me)

# ---------------- yardımcı geometri ----------------
def centroid(p): return sum(p, Vector((0, 0))) / len(p)
def circle(c, R, n=16, a0=0.0): return [c + Vector((R * math.cos(a0 + 2 * math.pi * k / n), R * math.sin(a0 + 2 * math.pi * k / n))) for k in range(n)]
def rect(c, w, d, rot=0.0):
    ca, sa = math.cos(rot), math.sin(rot)
    return [c + Vector((x * ca - y * sa, x * sa + y * ca)) for x, y in ((-w/2, -d/2), (w/2, -d/2), (w/2, d/2), (-w/2, d/2))]
def ccw(p):
    a = sum(p[i].x * p[(i+1) % len(p)].y - p[(i+1) % len(p)].x * p[i].y for i in range(len(p)))
    return p if a > 0 else p[::-1]

class G:
    """Bir parça (uygulamadaki dokunulabilir öğe). Ad = cue adı: Kubbe_Ana, Minare_1, Han_Avlu ..."""
    def __init__(self, name, mats=()):
        self.name, self.mats, self.bm = name, list(mats), bmesh.new()
    def mi(self, m):
        if m not in self.mats: self.mats.append(m)
        return self.mats.index(m)
    def V(self, p, z): return self.bm.verts.new((p.x, p.y, z))
    def F(self, vs, m):
        try:
            f = self.bm.faces.new(vs); f.material_index = self.mi(m); return f
        except ValueError: return None
    # --- kapalı hacimler ---
    def prism(self, p, z0, z1, wall, top, bottom=True, ztop=None):
        """Dikey prizma. Varsayılan KAPALI. top=False: üst kapak YOK (üstüne aynı halkayla kubbe/çatı
        oturacaksa; aynı yerde iki kapak = manifold olmayan kenar). ztop(q) ile eğik üst."""
        p = ccw(p); n = len(p); zt = ztop or (lambda q: z1)
        b = [self.V(q, z0) for q in p]; t = [self.V(q, zt(q)) for q in p]
        for i in range(n):
            j = (i + 1) % n; self.F([b[i], b[j], t[j], t[i]], wall)
        if top is not False: self.F(t, top or wall)
        if bottom: self.F(b[::-1], wall)
    def dome(self, p, zb, rise, m, rings=8, cap=True):
        """Basık/yarım küre kubbe; taban halkası p (çokgen). cap=True taban kapalı.
        Kasnak (prism) üstüne oturuyorsa: prism(..., top=False) + dome(..., cap=False), aynı p ile."""
        p = ccw(p); c = centroid(p); a = sum((q - c).length for q in p) / len(p)
        Rs = (a * a + rise * rise) / (2 * rise); am = math.atan2(a, Rs - rise); prev = None; base = None
        for k in range(rings + 1):
            al = am * (rings - k) / rings; s = math.sin(al) / math.sin(am)
            z = zb + Rs * (math.cos(al) - math.cos(am))
            ring = [self.V(c + (q - c) * s, z) for q in p] if k < rings else [self.V(c, z)]
            if k == 0: base = ring
            if prev is not None:
                for i in range(len(p)):
                    j = (i + 1) % len(p)
                    if len(ring) == 1: self.F([prev[i], prev[j], ring[0]], m)
                    else: self.F([prev[i], prev[j], ring[j], ring[i]], m)
            prev = ring
        if cap: self.F(base[::-1], m)
    def half_dome(self, c, R, zb, rise, dirv, m, wall, rings=6, seg=12):
        """Yarım kubbe (eksedra/apsis): dirv yönüne açılan çeyrek küre + KAPALI arka düzlem.
        Ayasofya'da kesilerek yapıldı ve içi açık kaldı; burada baştan kapalı üretilir."""
        d = Vector(dirv).normalized(); t = Vector((-d.y, d.x))
        rows = []
        for k in range(rings + 1):
            al = (math.pi / 2) * k / rings
            r = R * math.cos(al); z = zb + rise * math.sin(al)
            rows.append([self.V(c + (t * math.cos(math.pi * s / seg) + d * math.sin(math.pi * s / seg)) * r, z) for s in range(seg + 1)])
        for k in range(rings):
            for s in range(seg):
                self.F([rows[k][s], rows[k][s+1], rows[k+1][s+1], rows[k+1][s]], m)
        back = [rows[k][0] for k in range(rings + 1)] + [rows[k][seg] for k in range(rings, -1, -1)]
        self.F(back, wall)                                   # kesik yüz: duvar rengiyle kapalı
        self.F([rows[0][s] for s in range(seg, -1, -1)], wall)  # taban
    def lathe(self, c, prof, segs, mats_):
        """Dönel profil (minare, alem, kasnak). prof=[(r,z),...] aşağıdan yukarı; r=0 uçlar kapatır."""
        rings = []
        for (r, z) in prof:
            rings.append([self.V(c, z)] if r == 0 else [self.V(c + Vector((r * math.cos(2 * math.pi * j / segs), r * math.sin(2 * math.pi * j / segs))), z) for j in range(segs)])
        for i in range(len(prof) - 1):
            A_, B_ = rings[i], rings[i + 1]
            for j in range(segs):
                j2 = (j + 1) % segs
                q = [A_[j % len(A_)], A_[j2 % len(A_)], B_[j2 % len(B_)], B_[j % len(B_)]]
                out = [v for k, v in enumerate(q) if v is not q[k - 1]]
                if len(out) >= 3: self.F(out, mats_[min(i, len(mats_) - 1)])
        if len(rings[0]) > 1: self.F(rings[0][::-1], mats_[0])
        if len(rings[-1]) > 1: self.F(rings[-1], mats_[-1])
    def roof_pyr(self, p, zb, zapex, m):
        p = ccw(p); c = centroid(p); a = self.V(c, zapex); r = [self.V(q, zb) for q in p]
        for i in range(len(p)): self.F([r[i], r[(i + 1) % len(p)], a], m)
        self.F(r[::-1], m)
    def obj(self, recalc=True):
        if recalc: bmesh.ops.recalc_face_normals(self.bm, faces=self.bm.faces)
        bmesh.ops.remove_doubles(self.bm, verts=self.bm.verts, dist=1e-4)
        me = bpy.data.meshes.new(self.name); self.bm.to_mesh(me); self.bm.free()
        for m in self.mats: me.materials.append(m)
        ob = bpy.data.objects.new(self.name, me); bpy.context.scene.collection.objects.link(ob)
        return ob

# ---------------- cephe öğeleri ----------------
def arch_poly(w, z0, zs, seg=6):
    r = w / 2; pts = [(-r, z0), (r, z0), (r, zs)]
    pts += [(r * math.cos(math.pi * k / seg), zs + r * math.sin(math.pi * k / seg)) for k in range(1, seg)]
    return pts + [(-r, zs)]
def pencere(g, O, T, N, w, z0, zs, m, derinlik=0.06):
    """Kemerli pencere: duvardan DECAL_OFF önde, derinlikli ince levha (kapalı). Aynı düzlemde ASLA değil."""
    off = max(DECAL_OFF, 0.03); poly = arch_poly(w, z0, zs)
    P = lambda s, z, o: Vector((O.x + T.x * s + N.x * o, O.y + T.y * s + N.y * o, z))
    A_ = [g.bm.verts.new(P(s, z, off)) for s, z in poly]
    B_ = [g.bm.verts.new(P(s, z, off + derinlik)) for s, z in poly]
    g.F(B_, m); g.F(A_[::-1], m)
    for i in range(len(poly)):
        j = (i + 1) % len(poly); g.F([A_[i], A_[j], B_[j], B_[i]], m)
def silme(g, p, z0, z1, d, m):
    """Kat silmesi / korniş: çokgen çevresinde dışa taşan kapalı bant."""
    p = ccw(p); n = len(p); out = []
    for i in range(n):
        a, b, c = p[i - 1], p[i], p[(i + 1) % n]
        e1 = (b - a).normalized(); e2 = (c - b).normalized()
        n1 = Vector((e1.y, -e1.x)); n2 = Vector((e2.y, -e2.x)); bis = n1 + n2
        bis = bis / bis.length if bis.length > 1e-6 else n1
        out.append(b + bis * d / max(bis.dot(n1), 0.3))
    g.prism(out, z0, z1, m, m)

def minare(name, c, H, M, govde_r=1.6, kaide_w=None, kaide_h=None, serefe_oran=0.66, malzeme="minare_tas", segs=12):
    """Osmanlı minaresi tek parça: kaide (kare) → geçiş → gövde → şerefe → külah → ALEM (külah ucuna bitişik).
    Oranlar Ayasofya ref ölçümünden: külah %11,5 H, alem %6,5 H, şerefe 0,66 H, balkon R = 1,28 × gövde R."""
    g = G(name); kw = kaide_w or govde_r * 3.2; kh = kaide_h or H * 0.22
    g.prism(rect(c, kw, kw), 0, kh, M["tas"], M["tas"])
    gec = kh + H * 0.06
    g.lathe(c, [(kw * 0.62, kh), (govde_r, gec)], 8, [M["tas"]])
    kul = H * 0.115; alem = H * 0.065; zg = H - alem - kul
    zs = H * serefe_oran; rr = govde_r * 1.28
    g.lathe(c, [(govde_r, gec), (govde_r, zs - 1.0), (rr, zs - 0.3), (rr, zs + 0.6), (govde_r, zs + 0.6), (govde_r, zg)], segs, [M[malzeme]] * 5)
    g.lathe(c, [(govde_r * 1.05, zg), (0, zg + kul)], segs, [M["kubbe"]])
    z = zg + kul - 0.05                                  # alem külaha 5 cm gömülü: asla uçmaz
    g.lathe(c, [(0.12, z), (0.35, z + alem * 0.3), (0.12, z + alem * 0.55), (0.3, z + alem * 0.75), (0, z + alem)], 8, [M["alem"]] * 4)
    return g.obj()

# ---------------- ÖLÇEK FİGÜRLERİ (genel sahne standardı §4; tüm eserler bu seti kullanır) ----------------
FIGUR_RENKLER = ("#EEE9DF", "#D9D2C5", "#C9C1B3")        # kırık beyaz, açık greige, greige (standart §4)
FIGUR_POZLAR = ("ayakta", "yuruyen", "oturan", "basamak")
def _loft(g, halkalar, m, seg=8):
    """Kapalı hacim: halkalar=[(merkez Vector3, u Vector3, v Vector3)] (u,v yarı eksenler); iki uç kapalı."""
    rs = [[g.bm.verts.new(c + u * math.cos(2 * math.pi * k / seg) + v * math.sin(2 * math.pi * k / seg)) for k in range(seg)] for c, u, v in halkalar]
    for a_, b_ in zip(rs[:-1], rs[1:]):
        for k in range(seg): g.F([a_[k], a_[(k + 1) % seg], b_[(k + 1) % seg], b_[k]], m)
    g.F(rs[0][::-1], m); g.F(rs[-1], m)
def _yol_loft(g, noktalar, yaricaplar, m, seg=8, ref=Vector((0, 1, 0))):
    """Noktalar boyunca yarıçapı değişen kapalı tüp (uzuv). Son halka küçültülür: elsiz yuvarlak uç."""
    hs = []
    for i, p in enumerate(noktalar):
        d = (noktalar[min(i + 1, len(noktalar) - 1)] - noktalar[max(i - 1, 0)]).normalized()
        r_ = ref if abs(d.dot(ref)) < 0.9 else Vector((1, 0, 0))
        u = d.cross(r_).normalized(); v = d.cross(u).normalized(); r = yaricaplar[i]
        hs.append((p, u * r, v * r))
    _loft(g, hs, m, seg)
def _elipsoid(g, c, rx, ry, rz, m, seg=8, rings=4):
    hs = []
    for k in range(rings + 1):
        al = -math.pi / 2 + math.pi * k / rings; cz = math.sin(al); rr = max(math.cos(al), 0.12)
        hs.append((c + Vector((0, 0, rz * cz)), Vector((rx * rr, 0, 0)), Vector((0, ry * rr, 0))))
    _loft(g, hs, m, seg)
def _ik(a, b, l1, l2, bend):
    """İki kemikli uzuv (kalça→ayak bileği, omuz→bilek): ortadaki eklem (diz/dirsek), bend yönüne doğru bükülür."""
    d = b - a; L = max(min(d.length, (l1 + l2) * 0.999), 1e-4); dn = d.normalized()
    x = (L * L + l1 * l1 - l2 * l2) / (2 * L); h = math.sqrt(max(l1 * l1 - x * x, 0))
    bd = bend - dn * bend.dot(dn)
    bd = bd.normalized() if bd.length > 1e-6 else Vector((0, 1, 0))
    return a + dn * x + bd * h
def insan(ad, poz="ayakta", boy=1.75, konum=(0, 0, 0), yon=90.0, kadin=False, cocuk=False, renk=0, adim_yuk=0.25, oval=False):
    """Mimari maket figürü (yüz/el/parmak yok; tek renk; baş = boy/7,5; omuz 0,25 H). Kapalı manifold, 400–800 üçgen.
    oval=True: yumuşak gölgelendirilmiş (yuvarlak görünümlü) varyant, üçgen sayısı aynı.
    poz: ayakta | yuruyen | oturan (taburede, gövde öne eğik) | basamak (adim_yuk kadar yüksek basamağa çıkan).
    konum: ayak tabanı (dünya, m); yon: bakış yönü derece (0 = +X, 90 = +Y). Ad 'Olcek_Insan_NN', koleksiyon 'Olcek'."""
    assert poz in FIGUR_POZLAR and not (kadin and poz == "oturan")
    H = boy; hx, sx = 0.055 * H, 0.125 * H
    m = mat("Olcek_" + FIGUR_RENKLER[renk % 3][1:], FIGUR_RENKLER[renk % 3], 0.8)
    V3 = lambda x, y, z: Vector((x * H, y * H, z * H))
    L1 = L2 = 0.25 * H; A1, A2 = 0.17 * H, 0.15 * H
    stool = False; elb = {}
    if poz == "ayakta":
        P_, S_ = V3(0, 0, .52), V3(0, 0, .82); fl, fr = V3(-.06, 0, .035), V3(.06, 0, .035)
        wl, wr = V3(-.15, .02, .50), V3(.15, .02, .50)
    elif poz == "yuruyen":
        P_, S_ = V3(0, .01, .515), V3(0, .045, .815); fr, fl = V3(.06, .14, .035), V3(-.06, -.14, .075)
        wl, wr = V3(-.12, .21, .70), V3(.13, .00, .53)
        elb = {"l": V3(-.13, .075, .65), "r": V3(.13, -.07, .65)}      # ön kol: dirsek aşağıda, ön kol öne-yukarı; arka kol: neredeyse düz, geride
    elif poz == "oturan":
        stool = True; P_ = V3(0, -.01, .31); S_ = P_ + V3(0, .178, .228); fl, fr = V3(-.07, .26, .035), V3(.07, .26, .035)
        wl, wr = V3(-.10, .32, .38), V3(.10, .32, .38)
    else:
        rh = adim_yuk; P_, S_ = V3(0, .04, .52) + Vector((0, 0, rh * .45)), V3(0, .085, .815) + Vector((0, 0, rh * .45))
        fr, fl = V3(.06, .17, .035) + Vector((0, 0, rh)), V3(-.06, -.09, .035)
        dz = Vector((0, 0, rh * .45))
        wl, wr = V3(-.14, .07, .52) + dz, V3(.14, .10, .54) + dz
        elb = {"l": V3(-.14, 0.0, .66) + dz, "r": V3(.14, .0, .66) + dz}      # kollar hafif öne bükük (ön kol öne)
    hip_l, hip_r = P_ + Vector((-hx, 0, 0)), P_ + Vector((hx, 0, 0)); sh_l, sh_r = S_ + Vector((-sx, 0, 0)), S_ + Vector((sx, 0, 0))
    fw = Vector((0, 1, 0)); g = G(ad); head_r = H / 7.5 / 2
    # bacaklar (kalça → diz → ayak bileği), ayak = küçük oval
    for hp, fa in ((hip_l, fl), (hip_r, fr)):
        k_ = _ik(hp, fa, L1, L2, fw)
        r0, r1, r2 = 0.052 * H, 0.040 * H, 0.028 * H
        _yol_loft(g, [hp, k_, fa], [r0, r1, r2], m, seg=6)
        _elipsoid(g, fa + Vector((0, 0.045 * H, -0.012 * H)), 0.034 * H, 0.075 * H, 0.025 * H, m, seg=6, rings=2)
    # kollar (omuz → dirsek → bilek), el yok: yuvarlak uç
    for ks, sh, wr_ in (("l", sh_l, wl), ("r", sh_r, wr)):
        e_ = elb[ks] if ks in elb else _ik(sh, wr_, A1, A2, Vector((0, -1.0, -0.25)))      # dirsek geride, ön kol öne doğru kırılır
        _yol_loft(g, [sh, e_, wr_, wr_ + (wr_ - e_).normalized() * 0.02 * H], [0.034 * H, 0.028 * H, 0.022 * H, 0.012 * H], m, seg=6)
    # gövde (pelvis → omuz); kadında uzun pardösü: omuzdan dizin altına konik
    ax = (S_ - P_).normalized(); gen = Vector((1, 0, 0)); dp = Vector((0, 1, 0))
    ring_ = lambda c, w, d: (c, gen * w * H, dp * d * H)
    if not kadin:
        _loft(g, [ring_(P_ + ax * 0.0, .092, .060), ring_(P_ + (S_ - P_) * 0.40, .085, .055), ring_(P_ + (S_ - P_) * 0.80, .115, .066), ring_(S_, .125, .060)], m, seg=8)
    else:
        c_sh = S_; hem = Vector((P_.x, P_.y, 0.27 * H))
        _loft(g, [ring_(hem, .185, .150), ring_(P_ + Vector((0, 0, -0.05 * H)), .130, .105), ring_(P_ + (S_ - P_) * 0.45, .098, .070), ring_(P_ + (S_ - P_) * 0.82, .122, .072), ring_(S_, .125, .062)], m, seg=8)
        _loft(g, [ring_(S_ + Vector((0, 0, -0.005 * H)), .134, .072), ring_(S_ + Vector((0, 0, -0.050 * H)), .140, .078)], m, seg=8)        # omza inen kısa baş örtüsü eteği (küçük: göğüs kabartması yapmasın)
    # boyun ve baş (kadında hacim %10 büyük, yuvarlak; baş örtüsü)
    hs_ = 1.10 if kadin else 1.0
    hc = S_ + (S_ - P_).normalized() * (0.035 * H + head_r * hs_) + Vector((0, 0.012 * H, 0))      # baş gövde ekseninin devamında (eğik gövdede de bağlı)
    _yol_loft(g, [S_ + Vector((0, 0, -0.01 * H)), S_ + (hc - S_) * 0.55], [0.046 * H, 0.040 * H], m, seg=6)
    _elipsoid(g, hc, head_r * 0.92 * hs_, head_r * 1.0 * hs_, head_r * hs_, m, seg=8, rings=4)
    if kadin: _elipsoid(g, hc + Vector((0, -head_r * 0.18, -head_r * 0.12)), head_r * 1.04 * hs_, head_r * 1.08 * hs_, head_r * 1.0 * hs_, m, seg=8, rings=3)
    if stool: _loft(g, [(Vector((0, -0.01 * H, 0.0)), Vector((0.16 * H, 0, 0)), Vector((0, 0.16 * H, 0))), (Vector((0, -0.01 * H, 0.27 * H)), Vector((0.19 * H, 0, 0)), Vector((0, 0.19 * H, 0)))], m, seg=8)
    ob = g.obj()
    if oval:                                                          # oval sürüm: aynı geometri, yumuşak gölgelendirme (üçgen sayısı değişmez)
        for p_ in ob.data.polygons: p_.use_smooth = True
    th = math.radians(yon - 90.0); ct, st = math.cos(th), math.sin(th)
    for v in ob.data.vertices:
        x, y = v.co.x, v.co.y; v.co.x = ct * x - st * y + konum[0]; v.co.y = st * x + ct * y + konum[1]; v.co.z += konum[2]
    ob.data.update()
    col = bpy.data.collections.get("Olcek") or bpy.data.collections.new("Olcek")
    if col.name not in bpy.context.scene.collection.children: bpy.context.scene.collection.children.link(col)
    for c_ in list(ob.users_collection): c_.objects.unlink(ob)
    col.objects.link(ob)
    return ob

# ---------------- KONTROLLER (her turun sonunda zorunlu) ----------------
def mesh_kontrol(objs=None):
    """Açık kenar, manifold olmayan kenar, ters normal sayıları. Hepsi 0 olmalı (zemin hariç)."""
    rap = {}
    for o in objs or [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "Zemin"))]:
        bm = bmesh.new(); bm.from_mesh(o.data)
        acik = sum(1 for e in bm.edges if e.is_boundary)
        nm = sum(1 for e in bm.edges if not e.is_manifold and not e.is_boundary)
        rap[o.name] = {"acik_kenar": acik, "manifold_degil": nm, "ucgen": sum(len(f.verts) - 2 for f in bm.faces)}
        bm.free()
    return rap

def cakisma_kontrol(min_derinlik=0.3):
    """Parçalar arası kesişme: bir parçanın köşesi başka parçanın ≥ min_derinlik içinde mi."""
    objs = [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "Zemin"))]
    trees = {}
    for o in objs:
        bm = bmesh.new(); bm.from_mesh(o.data); bm.transform(o.matrix_world)
        trees[o.name] = (BVHTree.FromBMesh(bm), [v.co.copy() for v in bm.verts]); bm.free()
    out = []
    for a, (ta, va) in trees.items():
        for b, (tb, _) in trees.items():
            if a == b: continue
            derin = 0.0
            for v in va[::3]:
                hits = 0
                for d in (Vector((0, 0, 1)), Vector((1, 0, 0)), Vector((0, 1, 0))):
                    h = tb.ray_cast(v, d)
                    if h[0] is not None and h[1].dot(d) > 0: hits += 1
                if hits >= 2:
                    loc, n, i, dist = tb.find_nearest(v); derin = max(derin, dist or 0)
            if derin >= min_derinlik: out.append((a, b, round(derin, 2)))
    return out

def arka_yuz_render(klasor, ad="kontrol", n=8, yukseklik=0.45, cozunurluk=640):
    """8 yönden render; ARKA YÜZLER KIRMIZI. Kırmızı piksel oranını döndürür; 0 olmalı.
    Açık kabuk, ters normal, içi görünen kubbe → kırmızı görünür. Rapor bu görüntü olmadan kabul edilmez."""
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = 4; sc.cycles.device = 'CPU'
    sc.render.resolution_x = sc.render.resolution_y = cozunurluk; sc.render.film_transparent = True
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'   # AgX kırmızıyı soldurur
    red = bpy.data.materials.get("_ARKA") or bpy.data.materials.new("_ARKA"); red.use_nodes = True
    nt = red.node_tree; nt.nodes.clear()
    geo = nt.nodes.new("ShaderNodeNewGeometry"); e1 = nt.nodes.new("ShaderNodeEmission"); e2 = nt.nodes.new("ShaderNodeEmission")
    e1.inputs[0].default_value = (0.75, 0.75, 0.75, 1); e2.inputs[0].default_value = (1, 0, 0, 1)
    mix = nt.nodes.new("ShaderNodeMixShader"); out = nt.nodes.new("ShaderNodeOutputMaterial")
    nt.links.new(geo.outputs["Backfacing"], mix.inputs[0]); nt.links.new(e1.outputs[0], mix.inputs[1])
    nt.links.new(e2.outputs[0], mix.inputs[2]); nt.links.new(mix.outputs[0], out.inputs[0])
    objs = [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "Zemin"))]
    saved = {o.name: [s.material for s in o.material_slots] for o in objs}
    for o in objs:
        for s in o.material_slots: s.material = red
    mn = Vector((1e9,) * 3); mx = Vector((-1e9,) * 3)
    for o in objs:
        for c in o.bound_box:
            w = o.matrix_world @ Vector(c); mn = Vector(map(min, mn, w)); mx = Vector(map(max, mx, w))
    ctr = (mn + mx) / 2; R = (mx - mn).length * 0.95
    cd = bpy.data.cameras.new("_kcam"); cd.lens = 35; cam = bpy.data.objects.new("_kcam", cd); sc.collection.objects.link(cam); sc.camera = cam
    os.makedirs(klasor, exist_ok=True); oranlar = []
    for k in range(n):
        a = 2 * math.pi * k / n
        cam.location = ctr + Vector((math.cos(a) * R, math.sin(a) * R, R * yukseklik))
        cam.rotation_euler = (ctr - cam.location).to_track_quat('-Z', 'Y').to_euler()
        f = os.path.join(klasor, f"{ad}_{k}.png"); sc.render.filepath = f
        bpy.ops.render.render(write_still=True)
        img = bpy.data.images.load(f); px = list(img.pixels); bpy.data.images.remove(img)
        kir = tot = 0
        for i in range(0, len(px), 4):
            if px[i + 3] > 0.5:
                tot += 1
                if px[i] > 0.6 and px[i + 1] < 0.25: kir += 1
        oranlar.append(kir / max(tot, 1))
    for o in objs:
        for s, m in zip(o.material_slots, saved[o.name]): s.material = m
    bpy.data.objects.remove(cam, do_unlink=True)
    return oranlar

def kontrol_hepsi(klasor, ad="kontrol"):
    """Tur sonu: mesh + çakışma + arka yüz render. Rapora aynen yapıştırılır."""
    mk = mesh_kontrol(); ck = cakisma_kontrol(); ay = arka_yuz_render(klasor, ad)
    sorun = {k: v for k, v in mk.items() if v["acik_kenar"] or v["manifold_degil"]}
    rap = {"ucgen_toplam": sum(v["ucgen"] for v in mk.values()), "acik_ya_da_manifold_degil": sorun,
           "cakismalar(>=0.3m)": ck, "kirmizi_oran_8_yon": [round(x, 5) for x in ay],
           "GECTI": (not sorun) and (not ck) and max(ay) < 0.001}
    with open(os.path.join(klasor, f"{ad}_rapor.json"), "w", encoding="utf-8") as fh: json.dump(rap, fh, ensure_ascii=False, indent=1)
    return rap

# ---------------- AO (isteğe bağlı) ve dışa aktarım ----------------
def ao_vertex(objs=None, samples=32):
    """Hafif ortam kapanması vertex rengine pişirilir (doku yok → bulanıklık yok). Renk malzemede kalır."""
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'; sc.cycles.samples = samples; sc.cycles.device = 'CPU'
    for o in objs or [o for o in bpy.data.objects if o.type == "MESH" and not o.name.startswith(("REF", "_"))]:
        if not o.data.color_attributes: o.data.color_attributes.new("AO", 'BYTE_COLOR', 'CORNER')
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.bake(type='AO', target='VERTEX_COLORS')
    # AO'yu malzemeye bağla (bağlanmazsa glTF dışa aktarmaz): Base Color = renk × AO
    for m in {s.material for o in bpy.data.objects if o.type == "MESH" for s in o.material_slots if s.material and not s.material.name.startswith("_")}:
        nt = m.node_tree; bsdf = next(n for n in nt.nodes if n.type == "BSDF_PRINCIPLED")
        if any(n.type == "VERTEX_COLOR" for n in nt.nodes): continue
        col = tuple(bsdf.inputs["Base Color"].default_value)
        rgb = nt.nodes.new("ShaderNodeRGB"); rgb.outputs[0].default_value = col
        va = nt.nodes.new("ShaderNodeVertexColor"); va.layer_name = "AO"
        mul = nt.nodes.new("ShaderNodeMix"); mul.data_type = 'RGBA'; mul.blend_type = 'MULTIPLY'; mul.inputs[0].default_value = 1.0
        nt.links.new(rgb.outputs[0], mul.inputs[6]); nt.links.new(va.outputs[0], mul.inputs[7])
        nt.links.new(mul.outputs[2], bsdf.inputs["Base Color"])

def disa_aktar(yol, draco=True):
    """Yalnız bina parçaları (REF_*, _*, Zemin hariç), Y-up, modifiers uygulanmış .glb."""
    bpy.ops.object.select_all(action='DESELECT')
    for o in bpy.data.objects:
        if o.type == "MESH" and not o.name.startswith(("REF", "_", "Zemin")): o.select_set(True)
    kw = dict(filepath=yol, export_format='GLB', use_selection=True, export_apply=True, export_yup=True,
              export_cameras=False, export_lights=False)
    try: bpy.ops.export_scene.gltf(export_draco_mesh_compression_enable=draco, **kw)
    except Exception: bpy.ops.export_scene.gltf(**kw)
    # Draco kütüphanesi yoksa: npx @gltf-transform/cli draco girdi.glb cikti.glb
    return os.path.getsize(yol)
