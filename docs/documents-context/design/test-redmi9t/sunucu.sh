#!/bin/bash
# AKAR · Redmi 9T test sayfasını yerel ağda sunar (telefon bilgisayarla aynı Wi-Fi'de olmalı).
# Kullanım:  bash docs/documents-context/design/test-redmi9t/sunucu.sh [port]
# Yalnız test sayfası, harita stili ve 14 GLB (7 normal + 7 sunum) paylaşılır; repodaki başka dosyalar paylaşılmaz.
set -e
cd "$(dirname "$0")"
DC="$(cd ../.. && pwd)"                      # docs/documents-context
PORT="${1:-8080}"
if lsof -nP -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT zaten kullanımda; sunucu başka bir sekmede açık olabilir (adresi doğrudan aç)."
  echo "Yeni bir sunucu için başka port dene:  bash $0 8081"
  exit 1
fi
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
mkdir "$TMP/modeller"
ln -s "$PWD/index.html" "$TMP/index.html"
ln -s "$DC/design/harita/akar-style.json" "$TMP/akar-style.json"
for yol in \
  ulu-cami/3d/export/ulu-cami_v26 \
  yildirim-bayezid-bedesteni/3d/export/bedesten_v06 \
  koza-han/3d/export/koza-han_v14 \
  orhan-bey-kulliyesi/3d/export/orhan-bey-camii_v07 \
  orhan-bey-hamami/3d/export/orhan-bey-hamami_v05 \
  emir-han/3d/export/emir-hani_v04 \
  orhan-gazi-turbesi/3d/export/orhan-gazi-turbesi_v02; do
  for ek in "" "_sunum"; do
    f="$DC/eserler/$yol$ek.glb"
    [ -f "$f" ] && ln -s "$f" "$TMP/modeller/$(basename "$f")" || echo "UYARI: $f yok"
  done
done
IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 'BILGISAYAR_IP')"
echo
echo "Telefonda aç:   http://$IP:$PORT"
echo "Bu bilgisayarda: http://localhost:$PORT"
echo "(durdurmak için Ctrl+C)"
echo
python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$TMP"
