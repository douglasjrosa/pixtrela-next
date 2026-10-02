#!/usr/bin/env bash
# Bootstrap for laptop / Cloud Agents against local Postgres on 127.0.0.1.
# Requires DATABASE_URL (and AUTH_SECRET for the app). Start Compose first:
#   docker compose --env-file .env.local.db up -d
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (local Postgres on 127.0.0.1:5432)." >&2
  exit 1
fi

echo "==> npm ci"
npm ci

echo "==> db:migrate (dev)"
npm run db:migrate

if [[ "${SKIP_SEED:-0}" != "1" ]]; then
  echo "==> db:seed (idempotent)"
  npm run db:seed || true
  echo "==> db:seed:branding (idempotent)"
  npm run db:seed:branding || true
fi

echo "==> Ready. Start the app with: npm run dev"
echo "    Then forward port 3000 in Cursor Cloud."
