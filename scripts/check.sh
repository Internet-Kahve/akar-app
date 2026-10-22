#!/usr/bin/env bash
# Runs the same checks as Frontend CI and API CI before a PR (npm run check [-- --e2e]).
#   Repo typecheck + unit tests, API typecheck + integration tests (needs Docker), OpenAPI spec is current.
#   --e2e  also runs the web e2e suite (npm run test:e2e).
# Not covered: the production `docker build` and `next build` (left to CI).
set -euo pipefail
cd "$(dirname "$0")/.."

e2e=false
for arg in "$@"; do
  case $arg in
    --e2e) e2e=true ;;
    *)
      echo "check: bilinmeyen seçenek: $arg (yalnız --e2e)" >&2
      exit 2
      ;;
  esac
done

step() { echo "==> $*"; }

command -v docker >/dev/null && docker info >/dev/null 2>&1 || {
  echo "check: Docker çalışmıyor; API testleri için Docker Desktop/OrbStack'i başlat." >&2
  exit 1
}

step "Tip kontrolü (web)"
npm run -s typecheck
step "Birim testleri (packages)"
npm test -s
step "Tip kontrolü (API)"
npm run -s typecheck -w @akar/api
step "API testleri"
npm test -s -w @akar/api
step "OpenAPI şeması güncel mi"
npm run -s openapi -w @akar/api
git diff --exit-code docs/api/openapi.json || {
  echo "check: docs/api/openapi.json güncel değildi ve yeniden üretildi; değişikliği commit et." >&2
  exit 1
}
if $e2e; then
  step "E2E testleri (web)"
  npm run -s test:e2e
fi
step "Tüm kontroller geçti"
