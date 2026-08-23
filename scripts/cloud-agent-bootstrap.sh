#!/usr/bin/env bash
# Bootstrap for Cursor Cloud Agents (and local) against VPS postgres-dev.
# Requires secrets: DATABASE_URL, AUTH_SECRET, MEDIA_DRIVER/S3_* as needed.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required (VPS postgres-dev connection string)." >&2
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
