#!/usr/bin/env bash
# Local stack for development and manual testing (run through npm: local, local:up, local:down, local:reset).
#   up     Supabase (auth, storage, mail) + API database, fills empty .env values, migrates, seeds an empty DB.
#          Safe to repeat: running services are left alone, set .env values are never overwritten.
#   down   Stops Supabase and the API database; data is kept.
#   reset  Deletes the API database volume, then runs `up` (fresh migrate + seed). Supabase users stay.
set -euo pipefail
cd "$(dirname "$0")/.."

die() {
  echo "local: $*" >&2
  exit 1
}
step() { echo "==> $*"; }

require_tools() {
  command -v docker >/dev/null || die "Docker bulunamadı (Docker Desktop ya da OrbStack kur)."
  docker info >/dev/null 2>&1 || die "Docker çalışmıyor; Docker Desktop/OrbStack'i başlat."
  command -v supabase >/dev/null || die "Supabase CLI bulunamadı: brew install supabase/tap/supabase"
}

# set_env KEY VALUE: writes VALUE only when KEY is missing or empty in .env.
set_env() {
  local key=$1 value=$2 current
  current=$(grep -E "^${key}=" .env | head -1 | cut -d= -f2- || true)
  [ -n "$current" ] && return 0
  if grep -qE "^${key}=" .env; then
    local tmp
    tmp=$(mktemp)
    awk -v k="$key" -v v="$value" 'index($0, k "=") == 1 { print k "=" v; next } { print }' .env >"$tmp"
    mv "$tmp" .env
  else
    printf '%s=%s\n' "$key" "$value" >>.env
  fi
  echo "    .env: $key dolduruldu"
}

fill_env() {
  [ -f .env ] || {
    cp .env.example .env
    echo "    .env oluşturuldu (.env.example'dan)"
  }
  local status
  status=$(supabase status -o env 2>/dev/null) || die "supabase status okunamadı."
  sb() { echo "$status" | grep -E "^$1=" | head -1 | cut -d= -f2- | tr -d '"'; }
  set_env SUPABASE_SERVICE_ROLE_KEY "$(sb SERVICE_ROLE_KEY)"
  set_env STORAGE_S3_ACCESS_KEY_ID "$(sb S3_PROTOCOL_ACCESS_KEY_ID)"
  set_env STORAGE_S3_SECRET_ACCESS_KEY "$(sb S3_PROTOCOL_ACCESS_KEY_SECRET)"
  set_env RECEIPT_SECRET "$(openssl rand -base64 48 | tr -d '\n')"
}

db_has_sites() {
  local n
  n=$(docker compose exec -T db psql -U akar -d akar -tAc "select count(*) from sites" 2>/dev/null | tr -d '[:space:]')
  [ -n "$n" ] && [ "$n" != 0 ]
}

# `supabase status` exits 0 while optional services are stopped or the stack is shutting down, so the
# services the API needs are probed directly.
supabase_ready() {
  local base=http://127.0.0.1:54321
  curl -sf -o /dev/null --max-time 3 "$base/auth/v1/health" && curl -sf -o /dev/null --max-time 3 "$base/storage/v1/status"
}

up() {
  require_tools
  # A fresh clone (including CI) has no signing key. Never replace an existing local key.
  if [ ! -f supabase/signing_keys.json ]; then
    step "Yerel JWT imzalama anahtarı"
    node scripts/local-signing-key.mjs
  fi
  step "Supabase"
  local out
  if supabase_ready; then
    echo "    zaten çalışıyor"
  else
    echo "    başlatılıyor (ilk seferde imajlar iner, birkaç dakika sürebilir)"
    out=$(supabase start 2>&1) || die "supabase start başarısız:"$'\n'"$out"
    supabase_ready || die "Supabase başladı ama Auth/Storage yanıt vermiyor (http://127.0.0.1:54321)."
  fi
  out=$(supabase seed buckets --local 2>&1) || die "Supabase kovaları oluşturulamadı:"$'\n'"$out"
  step ".env"
  fill_env
  step "API veritabanı (PostGIS 127.0.0.1:5433)"
  npm run -s db:up
  npm run -s db:migrate
  if db_has_sites; then
    echo "    veri var, tohum atlandı (sıfırlamak için: npm run local:reset)"
  else
    step "Demo verisi (db:seed)"
    npm run -s db:seed
  fi
  cat <<'EOF'

Hazır.
  API            npm run dev   → http://127.0.0.1:4000  (Swagger: /docs)
  Token          npm run -s local:token -- --email ben@akar.test --role admin   (repo kökünden: npm run api:token -- …)
  E-posta kutusu http://127.0.0.1:54324   Supabase Studio http://127.0.0.1:54323
EOF
}

down() {
  require_tools
  step "API veritabanı durduruluyor"
  docker compose stop db
  step "Supabase durduruluyor"
  supabase stop
}

reset() {
  require_tools
  step "API veritabanı siliniyor (Supabase kullanıcıları ve dosyalar kalır)"
  docker compose down -v
  up
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  reset) reset ;;
  *) die "kullanım: scripts/local.sh up|down|reset" ;;
esac
