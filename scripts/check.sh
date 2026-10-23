#!/usr/bin/env bash
# Runs the same checks as Frontend CI and API CI before a PR.
#   Repo typecheck + unit tests, API typecheck + integration tests (needs Docker), OpenAPI spec is current.
#   --e2e  also runs the web e2e suite (npm run test:e2e).
#   --web  skips API checks and does not require Docker.
#   --build  also runs the web and (unless --web) Vercel API production builds.
# The production Docker image is checked in CI.
set -euo pipefail
cd "$(dirname "$0")/.."

e2e=false
web_only=false
build=false
for arg in "$@"; do
  case $arg in
    --e2e) e2e=true ;;
    --web) web_only=true ;;
    --build) build=true ;;
    *)
      echo "check: bilinmeyen seçenek: $arg (--web, --build, --e2e)" >&2
      exit 2
      ;;
  esac
done

step() { echo "==> $*"; }

if ! $web_only; then
  command -v docker >/dev/null && docker info >/dev/null 2>&1 || {
    echo "check: Docker çalışmıyor; API testleri için Docker Desktop/OrbStack'i başlat." >&2
    exit 1
  }
fi

step "Tip kontrolü (web)"
npm run -s typecheck
step "Birim testleri (packages)"
npm test -s
if ! $web_only; then
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
fi
if $build; then
  step "Web üretim derlemesi"
  npm run -s build
  if ! $web_only; then
    step "Vercel API üretim derlemesi"
    npm run -s build -w @akar/api
  fi
fi
if $e2e; then
  step "E2E testleri (web)"
  npm run -s test:e2e
fi
step "Tüm kontroller geçti"
