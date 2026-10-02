#!/usr/bin/env bash
# Build /var/www/pixtrela/app/.env from known local files. Prints no secrets.
# Requires: .env.production.local on this machine and SSH to pixtrela-vps.
#
# Usage (from next/):
#   ./scripts/write-vps-app-env.sh

set -euo pipefail

SSH_HOST="${PIXTRELA_VPS_SSH:-pixtrela-vps}"
REMOTE_DIR="${PIXTRELA_APP_DIR:-/var/www/pixtrela/app}"
SECRET_FILE_MODE=600
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PROD_ENV="${ROOT}/.env.production.local"
REALTIME_ENV_REMOTE="/var/www/pixtrela/realtime/services/realtime/.env"
PG_ENV_REMOTE="/var/www/pixtrela/postgres/.env.db"

if [[ ! -f "${PROD_ENV}" ]]; then
  echo "Missing ${PROD_ENV}." >&2
  exit 1
fi

wanted_keys=(
  AUTH_SECRET
  AUTH_TRUST_HOST
  AUTH_URL
  MEDIA_DRIVER
  S3_BUCKET
  S3_REGION
  S3_ENDPOINT
  S3_ACCESS_KEY_ID
  S3_SECRET_ACCESS_KEY
  S3_PUBLIC_URL
  S3_FORCE_PATH_STYLE
  SMTP_HOST
  SMTP_PORT
  SMTP_SECURE
  SMTP_USER
  SMTP_PASS
  FROM_EMAIL
  LEGACY_RBX_URL
  LEGACY_RBX_TOKEN
  CRM_WEBHOOK_SECRET
  DATA_BACKEND
)
umask 077
: > /tmp/pixtrela-app.env.keys
missing=()
for key in "${wanted_keys[@]}"; do
  line="$(grep -E "^${key}=" "${PROD_ENV}" | tail -n 1 || true)"
  if [[ -z "${line}" ]]; then
    missing+=("${key}")
    continue
  fi
  printf '%s\n' "${line}" >> /tmp/pixtrela-app.env.keys
done
if [[ "${#missing[@]}" -gt 0 ]]; then
  echo "Missing keys in .env.production.local: ${missing[*]}" >&2
  rm -f /tmp/pixtrela-app.env.keys
  exit 1
fi

echo "Writing ${REMOTE_DIR}/.env on ${SSH_HOST} (values not printed)"
scp -q /tmp/pixtrela-app.env.keys "${SSH_HOST}:/tmp/pixtrela-app.env.keys"
rm -f /tmp/pixtrela-app.env.keys

ssh "${SSH_HOST}" \
  "REMOTE_DIR='${REMOTE_DIR}' \
SECRET_FILE_MODE='${SECRET_FILE_MODE}' \
REALTIME_ENV_REMOTE='${REALTIME_ENV_REMOTE}' \
PG_ENV_REMOTE='${PG_ENV_REMOTE}' \
bash -s" <<'REMOTE'
set -euo pipefail

umask 077
mkdir -p "${REMOTE_DIR}"
env_file="${REMOTE_DIR}/.env"
tmp="$(mktemp)"
cat /tmp/pixtrela-app.env.keys > "${tmp}"
rm -f /tmp/pixtrela-app.env.keys

read_kv() {
  local file="$1"
  local key="$2"
  if [[ ! -f "${file}" ]]; then
    return
  fi
  grep -E "^${key}=" "${file}" | tail -n 1 | cut -d= -f2-
}

pg_user="$(read_kv "${PG_ENV_REMOTE}" PROD_PG_USER)"
pg_pass="$(read_kv "${PG_ENV_REMOTE}" PROD_PG_PASSWORD)"
pg_db="$(read_kv "${PG_ENV_REMOTE}" PROD_PG_DB)"
if [[ -z "${pg_user}" || -z "${pg_pass}" ]]; then
  echo "Missing PROD_PG_USER or PROD_PG_PASSWORD in ${PG_ENV_REMOTE}." >&2
  exit 1
fi
pg_db="${pg_db:-pixtrela}"

python3 - "${tmp}" "${pg_user}" "${pg_pass}" "${pg_db}" <<'PY'
import sys
from pathlib import Path
from urllib.parse import quote

path, user, password, db = sys.argv[1], sys.argv[2], sys.argv[3], sys.argv[4]
url = f"postgresql://{quote(user, safe='')}:{quote(password, safe='')}@pixtrela-postgres-prod:5432/{db}"
text = Path(path).read_text(encoding="utf-8")
Path(path).write_text(text + f"\nDATABASE_URL={url}\n", encoding="utf-8")
PY

publish="$(read_kv "${REALTIME_ENV_REMOTE}" REALTIME_PUBLISH_SECRET)"
jwt="$(read_kv "${REALTIME_ENV_REMOTE}" REALTIME_JWT_SECRET)"
if [[ -n "${publish}" ]]; then
  printf 'REALTIME_PUBLISH_SECRET=%s\n' "${publish}" >> "${tmp}"
fi
if [[ -n "${jwt}" ]]; then
  printf 'REALTIME_JWT_SECRET=%s\n' "${jwt}" >> "${tmp}"
fi

{
  echo "NEXT_PUBLIC_APP_URL=https://pixtrela.ribermax.com.br"
  echo "NEXT_PUBLIC_REALTIME_SSE_URL=https://sse.pixtrela.ribermax.com.br"
  echo "REALTIME_PUBLISH_URL=http://host.docker.internal:8787/internal/publish"
} >> "${tmp}"

# CRON_SECRET is not present in local snapshots. Leave unset until provided.

chmod "${SECRET_FILE_MODE}" "${tmp}"
mv "${tmp}" "${env_file}"
chmod "${SECRET_FILE_MODE}" "${env_file}"
echo "Wrote ${env_file}. Keys:"
cut -d= -f1 "${env_file}" | sort
REMOTE
