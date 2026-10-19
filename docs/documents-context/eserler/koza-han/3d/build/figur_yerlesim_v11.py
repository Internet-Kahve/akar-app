# AKAR · Koza Han v11 · 10 ölçek figürü (plan §6; set: _kutuphane/akar3d.py insan(), kenarlı sürüm, kullanıcı onaylı). build_v11.py içinden exec ile çalışır.
# Dağılım: portal önü 2, avlu yollarında yürüyen 3, şadırvan taburesinde oturan 1, mescit merdiveninde çıkan 1, üst kat galerisinde 2, İç Koza avlusunda 1.
# Dört kadın siluet + bir çocuk (İç Koza). Zemin kotları: kaide 0, parke 0,03, yol 0,045, halka 0,05.
_ay = math.radians(YOL_ACI[0]); _dE = Vector((math.cos(_ay), math.sin(_ay)))
_u = y_san + 5.5 * run                                       # merdivende 6. basamak (tread ortası)
_zst = zb - 6 * rih                                          # o basamağın kotu
_f = [
    dict(poz="ayakta",  boy=1.78, konum=(-2.4, OY + P["portal_cikinti"] + P["D_portal_on_cikinti"] + 1.8, 0.0), yon=90,  renk=0),             # portal önü, erkek
    dict(poz="ayakta",  boy=1.66, kadin=True, konum=(2.2, OY + P["portal_cikinti"] + P["D_portal_on_cikinti"] + 2.6, 0.0), yon=70, renk=1),  # portal önü, kadın
    dict(poz="yuruyen", boy=1.76, konum=(0.5, 15.0, Z_YOL), yon=270, renk=2),                                                                # kuzey yolu, kapıdan mescide
    dict(poz="yuruyen", boy=1.64, kadin=True, konum=(-13.0, 0.4, Z_YOL), yon=0, renk=0),                                                    # batı yolu, mescide doğru
    dict(poz="yuruyen", boy=1.80, konum=(_dE.x * 13.5, _dE.y * 13.5, Z_YOL), yon=math.degrees(_ay) + 180, renk=1),                             # İç Koza yolundan mescide
    dict(poz="oturan",  boy=1.74, konum=(0.0, -3.55, P["m_tas_halka_h"]), yon=90, renk=2),                                                              # şadırvan taburesi (güney kemer gözü), abdest pozu
    dict(poz="basamak", boy=1.62, kadin=True, konum=(dv.x * _u, dv.y * _u, _zst), yon=math.degrees(phi_k) + 180, renk=0, adim_yuk=rih),   # merdivende çıkan
    dict(poz="ayakta",  boy=1.77, konum=(-6.3, AY + 2.2, P["alt_h"]), yon=270, renk=1),                                                      # üst kat galerisi (kuzey kanat), korkuluk önü
    dict(poz="ayakta",  boy=1.63, kadin=True, konum=(2.1, AY + 2.2, P["alt_h"]), yon=270, renk=2),                                           # üst kat galerisi, kadın
    dict(poz="ayakta",  boy=1.20, cocuk=True, konum=(42.0, 2.5, 0.03), yon=200, renk=0),                                       # İç Koza avlusu, çocuk
]
for _i, _kw in enumerate(_f): A.insan(f"Olcek_Insan_{_i + 1:02d}", **_kw)
