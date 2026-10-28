#!/bin/zsh
# Bir kerelik geçiş işiydi; kaynak artık Blender + malzeme-paleti.json (_kutuphane/blend_hat/). Yeniden kullanma.
# AKAR · renk_ao_v3: bir ya da birkaç eser için bütün hat. Kullanım: GT_DIR=<kurulum> TMPK=<geçici> ./hepsi.sh <eser> [<eser> ...]
set -e
AY=${0:A:h}; ES=${AY:h:h}; BL=/Applications/Blender.app/Contents/MacOS/Blender
for e in "$@"; do
  ad=$(python3 -c "import json;print(json.load(open('$AY/eserler.json'))['$e']['ad'])")
  eski=$(python3 -c "import json;print(json.load(open('$AY/eserler.json'))['$e']['eski'])")
  yeni=$(python3 -c "import json;print(json.load(open('$AY/eserler.json'))['$e']['yeni'])")
  U=$ES/$e/3d; T=$TMPK/$e; mkdir -p $T $U/kontrol/$yeni
  echo "== $e $eski -> $yeni"
  node $AY/ref.mjs $U/export/${ad}_${eski}.glb $U/export/${ad}_${eski}_sunum.glb $T/ref.json
  $BL -b $U/blend/${ad}_${eski}.blend --python $AY/renk_ao.py -- $e $T/ref.json $T 2>&1 | grep -E "^(YAPI|RENK|UV_AO|BAKE|AO |KAYDED|BITTI|Traceback|.*Error)"
  node $AY/son_adim.mjs $T/app_ham.glb $T/sunum_ham.glb $U/export/${ad}_${yeni}.glb $U/export/${ad}_${yeni}_sunum.glb $T/ref.json $U/kontrol/$yeni/kontrol_rapor.json
  node $ES/_kutuphane/glb_temizle.mjs $U/export/${ad}_${yeni}.glb
  cp $T/blender_rapor.json $U/kontrol/$yeni/renkler.json
done
