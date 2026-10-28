#!/bin/zsh
# Bir kerelik geçiş işiydi; kaynak artık Blender + malzeme-paleti.json (_kutuphane/blend_hat/). Yeniden kullanma.
# AKAR · pastel_kucuk hattı (29 Ekim 2026). Kullanım: GT_DIR=<kurulum> ./pastel_hepsi.sh
# Satır: eser  ad  girdi(fotoğraf renkli)  referans(pastel)  yeni  ao_px
set -e
AY=${0:A:h}; ES=${AY:h:h}
while read e ad g r y px; do
  U=$ES/$e/3d; mkdir -p $U/kontrol/$y
  for ek in "" "_sunum"; do
    node $AY/pastel_kucuk.mjs $U/export/${ad}_${g}${ek}.glb $U/export/${ad}_${r}${ek}.glb $U/export/${ad}_${y}${ek}.glb $px $U/kontrol/$y/renkler${ek}.json 2>&1 | grep -v "^prune"
  done
  node $ES/_kutuphane/glb_temizle.mjs $U/export/${ad}_${y}.glb
done <<'LISTE'
ulu-cami ulu-cami v28 v27 v29 1024
yildirim-bayezid-bedesteni bedesten v07 v06 v08 512
koza-han koza-han v15 v14 v16 1024
orhan-bey-kulliyesi orhan-bey-camii v08 v07 v09 512
orhan-bey-hamami orhan-bey-hamami v06 v05 v07 512
emir-han emir-hani v06 v05 v07 512
orhan-gazi-turbesi orhan-gazi-turbesi v03 v02 v04 512
LISTE
