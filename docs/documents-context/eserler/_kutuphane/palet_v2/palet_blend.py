# AKAR · eski sürümün orijinal blend'ine ortak paleti + yumuşak AO'yu uygular, yeni adla kaydeder (21 Ekim 2026).
# Kullanım: Blender -b <eski.blend> --python palet_blend.py -- <ayar.json> <yeni.blend>
# Mantık GLB hattıyla (_kutuphane/palet_v2/palet.mjs) birebir aynıdır; ayar.json o hattın çıktısından gelir.
import bpy, sys, json, math, re
ayar_yol, cikti = sys.argv[sys.argv.index('--') + 1:][:2]
C = json.load(open(ayar_yol)); MATS = C['materials']; STRUCT = set(C['nodes']); YMIN, YMAX = C['ymin'], C['ymax']; DUZ = set(C['duz'])
H = YMAX - YMIN
def lin(v): return v / 12.92 if v <= 0.04045 else ((v + 0.055) / 1.055) ** 2.4
def hex2lin(h): return [lin(int(h[i:i + 2], 16) / 255) for i in (1, 3, 5)]
DUZ_ROLES = [('Tas', ['#D3BE98', '#D8C6A2']), ('Mermer', ['#ECEAE4']), ('Krem', ['#E8DFCB']), ('Tugla', ['#C0683F']), ('Ahsap_Kapi', ['#7A5134']),
             ('Ahsap_Koyu', ['#4E3427']), ('Pencere', ['#3E4A55']), ('Demir', ['#36413F']), ('Alem', ['#C9A13B']), ('Kursun_Dikis', ['#98A1A8']),
             ('Kursun', ['#C3C9CD']), ('Almasik', ['#CFA986'])]
def fit(c):
    mag = math.sqrt(sum(x * x for x in c)); best = None
    for ri, (n, olds) in enumerate(DUZ_ROLES):
        for h in olds:
            A = hex2lin(h); aa = sum(x * x for x in A); s = sum(c[k] * A[k] for k in range(3)) / aa
            res = math.sqrt(sum((c[k] - s * A[k]) ** 2 for k in range(3))) / max(mag, 1e-4) + ((s - 1.06) * 3 if s > 1.06 else 0)
            if best is None or res < best[0]: best = (res, ri, s)
    return best[1], best[2]
def ao(a, z): return (1 - (1 - min(1, a)) * (0.125 / 0.30)) * (0.92 + 0.08 * (z - YMIN) / H)
def spec_of(name):
    return MATS.get(name) or MATS.get(re.sub(r'\.\d{3}$', '', name))

struct = [o for o in bpy.data.objects if o.type == 'MESH' and o.name in STRUCT]
print('YAPI nesne', len(struct), '/', len(STRUCT))
# ---------- malzemeler ----------
def nodes_of(m):
    nt = m.node_tree; g = lambda t: next((n for n in nt.nodes if n.type == t), None)
    return nt, g('BSDF_PRINCIPLED'), g('TEX_IMAGE'), next((n for n in nt.nodes if n.type == 'MIX' and n.blend_type == 'MULTIPLY'), None), g('RGB')
def apply_spec(m, sp):
    nt, bsdf, tex, mul, rgb = nodes_of(m); col = (*sp['lin'][:3], sp['alpha'])
    if tex is not None:
        tex.image = bpy.data.images.load(sp['tex']); tex.image.colorspace_settings.name = 'sRGB'
        if sp['lead']:
            mc = nt.nodes.new('ShaderNodeMix'); mc.data_type = 'RGBA'; mc.blend_type = 'MULTIPLY'; mc.inputs[0].default_value = 1.0
            rn = nt.nodes.new('ShaderNodeRGB'); rn.outputs[0].default_value = col
            nt.links.new(tex.outputs['Color'], mc.inputs[6]); nt.links.new(rn.outputs[0], mc.inputs[7]); nt.links.new(mc.outputs[2], mul.inputs[6])
    else:
        if rgb is not None and mul is not None: rgb.outputs[0].default_value = col
        else: bsdf.inputs['Base Color'].default_value = col
    bsdf.inputs['Roughness'].default_value = sp['rough']; bsdf.inputs['Metallic'].default_value = sp['metal']
done = {}
for o in struct:
    for slot in o.material_slots:
        old = slot.material
        if old is None: continue
        uid = old.session_uid
        if uid in done: slot.material = done[uid]; continue
        sp = spec_of(old.name)
        if sp is None and not (old.name in DUZ): print('UYARI spec yok', old.name); done[uid] = old; continue
        if old.name in DUZ: done[uid] = old; continue
        shared = any(o2.type == 'MESH' and o2.name not in STRUCT and any(s.material == old for s in o2.material_slots) for o2 in bpy.data.objects)
        key = old.name
        if shared:
            nm = old.copy(); old.name = key + '_cevre'; nm.name = key
        else: nm = old
        apply_spec(nm, sp); done[uid] = nm; slot.material = nm
# ---------- Duz rol malzemeleri ----------
role_mat = {}
def role_material(ri, duz_old):
    n = DUZ_ROLES[ri][0]
    if n not in role_mat:
        m = duz_old.copy(); m.name = n; sp = MATS[n]; apply_spec(m, {**sp, 'tex': None}); role_mat[n] = m
    return role_mat[n]
# ---------- köşe rengi ----------
stat = {'gray': 0, 'duz_loops': 0}
for o in struct:
    me = o.data; attr = me.color_attributes.get('AO') or me.color_attributes[0]; D = attr.data; mw = o.matrix_world
    zs = [(mw @ v.co).z for v in me.vertices]
    duz_idx = [i for i, s in enumerate(o.material_slots) if s.material and s.material.name in DUZ]
    duz_old = o.material_slots[duz_idx[0]].material if duz_idx else None
    prole = {}
    if duz_idx:
        vrole = {}
        for p in me.polygons:
            if p.material_index not in duz_idx: continue
            rr = []
            for li in p.loop_indices:
                c = list(D[li].color)[:3]; r, s = fit(c); rr.append(r); vrole[me.loops[li].vertex_index] = r
            prole[p.index] = rr[0] if (rr[0] == rr[1] or rr[0] == rr[2]) else rr[1] if rr[1] == rr[2] else rr[0]
        for _ in range(12):
            vc = {}
            for pi, r in prole.items():
                for vi in me.polygons[pi].vertices: vc.setdefault(vi, {}); vc[vi][r] = vc[vi].get(r, 0) + 1
            vm = {}
            for vi, d in vc.items():
                b, bc = None, -1
                for r, c in d.items():
                    if c > bc or (c == bc and r == vrole.get(vi)): b, bc = r, c
                vm[vi] = b
            ch = 0
            for pi in list(prole):
                vs = [vm[v] for v in me.polygons[pi].vertices[:3]]
                nr = vs[0] if (vs[0] == vs[1] or vs[0] == vs[2]) else vs[1] if vs[1] == vs[2] else prole[pi]
                if nr != prole[pi]: prole[pi] = nr; ch += 1
            if not ch: break
    for p in me.polygons:
        isduz = p.index in prole
        for li in p.loop_indices:
            z = zs[me.loops[li].vertex_index]; c = list(D[li].color)
            if isduz:
                _, s = fit(c[:3]); a = max(0.70, min(1.0, s)); stat['duz_loops'] += 1
            else: a = (c[0] + c[1] + c[2]) / 3; stat['gray'] += 1
            v = ao(a, z); D[li].color = (v, v, v, 1.0)
    if duz_idx:
        roles = sorted(set(prole.values())); slotof = {}
        for r in roles:
            m = role_material(r, duz_old); me.materials.append(m); slotof[r] = len(me.materials) - 1
        for pi, r in prole.items(): me.polygons[pi].material_index = slotof[r]
        for di in sorted(duz_idx, reverse=True): me.materials.pop(index=di)
# ---------- kalıntı temizliği: yapı malzemelerinde hiçbir çıkışı bağlı olmayan düğümler (eski renk düğümü vb.) ----------
used = {sl.material for o in struct for sl in o.material_slots if sl.material}
for m in sorted(used, key=lambda x: x.name):
    nt = m.node_tree; rem = []
    while True:
        dead = [n for n in nt.nodes if n.type not in ('BSDF_PRINCIPLED', 'OUTPUT_MATERIAL', 'VERTEX_COLOR') and not any(l for o_ in n.outputs for l in o_.links)]
        if not dead: break
        for n in dead: rem.append(n.type + ':' + n.name); nt.nodes.remove(n)
    if rem: print('TEMIZLIK', m.name, rem)
print('SAYIM', stat, 'roller', sorted(role_mat))
bpy.ops.file.make_paths_relative()
bpy.ops.wm.save_as_mainfile(filepath=cikti)
print('KAYDEDILDI', cikti)
