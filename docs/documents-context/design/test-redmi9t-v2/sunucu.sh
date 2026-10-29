#!/bin/bash
# AKAR · Redmi 9T prototipi v2 (index.html) ve performans testini (test.html) yerel ağda sunar (telefon bilgisayarla aynı Wi-Fi'de olmalı). Eser, model, şehir ve rota bilgisi veriden okunur.
# Kullanım:  bash docs/documents-context/design/test-redmi9t-v2/sunucu.sh [port]
# Yalnız bu klasörün sayfaları, harita stili, eserlerin GLB'leri (model.json'dan; normal + sunum) ve hazirla.py'nin ürettiği veri.json + küçültülmüş
# eser fotoğrafları paylaşılır; repodaki başka dosyalar paylaşılmaz.
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
for f in index.html test.html app.js app.css temalar.css; do ln -s "$PWD/$f" "$TMP/$f"; done
echo "İçerik hazırlanıyor (ilk çalıştırmada fotoğraflar küçültülür)…"
python3 "$PWD/hazirla.py" "$TMP"
ln -s "$DC/design/harita/akar-style-ozel-v2.json" "$TMP/akar-style.json"   # kullanıcının seçtiği renkler (önizleme v3 ile aynı); ortak akar-style.json'a v1 bağlı, ona dokunulmaz
for t in buzlu cam; do ln -s "$DC/design/harita/akar-style-$t.json" "$TMP/akar-style-$t.json"; done   # temaların harita stilleri
ln -s "$DC/design/logo/logo-web.png" "$TMP/logo.png"   # marka logosu (design/logo/logo.png'nin 800 px kopyası)
ln -s "$DC/design/desenler" "$TMP/desenler"   # şehir desenleri (SEHIR.kimlik.desen)
# GLB listesi koddan değil veriden: modeli olan her eserin 3d/model.json → glb (normal + _sunum)
python3 - "$DC" <<'PY' | while IFS= read -r f; do [ -f "$f" ] && ln -s "$f" "$TMP/modeller/$(basename "$f")" || echo "UYARI: $f yok"; done
import json, os, sys
dc = sys.argv[1]; es = os.path.join(dc, 'eserler')
for ad in sorted(os.listdir(es)):
    m = os.path.join(es, ad, '3d', 'model.json')
    if os.path.exists(os.path.join(es, ad, 'eser.json')) and os.path.exists(m):
        g = json.load(open(m, encoding='utf-8')).get('glb')
        if g:
            for ek in ('', '_sunum'): print(os.path.join(es, ad, '3d', 'export', g + ek + '.glb'))
PY
IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo 'BILGISAYAR_IP')"
echo
echo "Telefonda aç:   http://$IP:$PORT        (performans testi: /test.html)"
echo "Bu bilgisayarda: http://localhost:$PORT"
echo "(durdurmak için Ctrl+C)"
echo
python3 -m http.server "$PORT" --bind 0.0.0.0 --directory "$TMP"
