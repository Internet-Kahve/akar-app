#!/usr/bin/env bash
# Web uygulamasını yerel API'ye bağlı açar (repo kökünden: npm run dev:api).
# Gerekli: `npm run api` çalışıyor olmalı (Supabase + API). Port 3001: 3000 demo istemcisine ayrılmıştır.
set -euo pipefail
cd "$(dirname "$0")/.."

command -v supabase >/dev/null || {
  echo "web-api: Supabase CLI bulunamadı: brew install supabase/tap/supabase" >&2
  exit 1
}
status=$(supabase status -o env 2>/dev/null) || {
  echo "web-api: yerel Supabase çalışmıyor; önce başka bir terminalde: npm run api" >&2
  exit 1
}
sb() { echo "$status" | grep -E "^$1=" | head -1 | cut -d= -f2- | tr -d '"'; }
supabase_url=$(sb API_URL)
anon_key=$(sb ANON_KEY)
[ -n "$supabase_url" ] && [ -n "$anon_key" ] || {
  echo "web-api: supabase status API_URL/ANON_KEY vermedi." >&2
  exit 1
}

export NEXT_PUBLIC_API_URL="http://127.0.0.1:4000"
export NEXT_PUBLIC_SUPABASE_URL="$supabase_url"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="$anon_key"
export NEXT_DIST_DIR=".next/api"
echo "==> Web: http://127.0.0.1:3001 → API $NEXT_PUBLIC_API_URL, Supabase $supabase_url"
cd ../..
exec npm run dev -w @akar/web -- --port 3001
