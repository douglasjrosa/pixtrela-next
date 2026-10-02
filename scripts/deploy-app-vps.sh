#!/usr/bin/env bash
# Deploy the standalone Next app via the pixtrela-vps SSH alias.
# Build on this machine. Secrets stay on the server (chmod 600).
#
# Usage (from next/):
#   ./scripts/deploy-app-vps.sh

set -euo pipefail

SSH_HOST="${PIXTRELA_VPS_SSH:-pixtrela-vps}"
REMOTE_DIR="${PIXTRELA_APP_DIR:-/var/www/pixtrela/app}"
APP_HOST="${PIXTRELA_APP_HOST:-pixtrela.ribermax.com.br}"
SECRET_FILE_MODE=600
APP_BIND_PORT=3000
HEALTH_WAIT_ATTEMPTS=24
HEALTH_WAIT_SECONDS=5

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STANDALONE_DIR="${ROOT}/.next/standalone"
STATIC_DIR="${ROOT}/.next/static"
PUBLIC_DIR="${ROOT}/public"
COMPOSE_FILE="${ROOT}/docker-compose.app.yml"
NGINX_SITE="${ROOT}/deploy/nginx/${APP_HOST}.conf"

if [[ ! -f "${STANDALONE_DIR}/server.js" ]]; then
  echo "Missing ${STANDALONE_DIR}/server.js. Run npm run build first." >&2
  exit 1
fi

if [[ ! -f "${COMPOSE_FILE}" || ! -f "${NGINX_SITE}" ]]; then
  echo "Missing docker-compose.app.yml or Nginx site." >&2
  exit 1
fi

echo "Syncing standalone app to ${SSH_HOST}:${REMOTE_DIR}"
ssh "${SSH_HOST}" "mkdir -p '${REMOTE_DIR}/standalone'"

sync_tree() {
  local src="$1"
  local dest="$2"
  tar -C "${src}" -cf - . | ssh "${SSH_HOST}" \
    "rm -rf '${dest}' && mkdir -p '${dest}' && tar -C '${dest}' -xf -"
}

sync_tree "${STANDALONE_DIR}" "${REMOTE_DIR}/standalone"

if [[ -d "${STATIC_DIR}" ]]; then
  ssh "${SSH_HOST}" "mkdir -p '${REMOTE_DIR}/standalone/.next/static'"
  sync_tree "${STATIC_DIR}" "${REMOTE_DIR}/standalone/.next/static"
fi

if [[ -d "${PUBLIC_DIR}" ]]; then
  ssh "${SSH_HOST}" "mkdir -p '${REMOTE_DIR}/standalone/public'"
  tar -C "${PUBLIC_DIR}" -cf - . | ssh "${SSH_HOST}" \
    "mkdir -p '${REMOTE_DIR}/standalone/public' && tar -C '${REMOTE_DIR}/standalone/public' -xf -"
fi

if [[ -d "${ROOT}/drizzle" ]]; then
  ssh "${SSH_HOST}" "rm -rf '${REMOTE_DIR}/standalone/drizzle' && mkdir -p '${REMOTE_DIR}/standalone/drizzle'"
  tar -C "${ROOT}/drizzle" -cf - . | ssh "${SSH_HOST}" \
    "tar -C '${REMOTE_DIR}/standalone/drizzle' -xf -"
fi

scp -q "${COMPOSE_FILE}" "${NGINX_SITE}" "${SSH_HOST}:${REMOTE_DIR}/"

echo "Applying drizzle migrations from this machine, then starting the app"
ssh "${SSH_HOST}" \
  "REMOTE_DIR='${REMOTE_DIR}' \
APP_BIND_PORT='${APP_BIND_PORT}' \
HEALTH_WAIT_ATTEMPTS='${HEALTH_WAIT_ATTEMPTS}' \
HEALTH_WAIT_SECONDS='${HEALTH_WAIT_SECONDS}' \
SECRET_FILE_MODE='${SECRET_FILE_MODE}' \
bash -s" <<'REMOTE'
set -euo pipefail

env_file="${REMOTE_DIR}/.env"
if [[ ! -f "${env_file}" ]]; then
  echo "Missing ${env_file}. Create it before the first deploy." >&2
  exit 1
fi
chmod "${SECRET_FILE_MODE}" "${env_file}"

cd "${REMOTE_DIR}"
set -a
# shellcheck disable=SC1090
. "${env_file}"
set +a

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is missing in ${env_file}." >&2
  exit 1
fi

echo "Running drizzle-kit migrate on the Docker network"
cat > "${REMOTE_DIR}/drizzle.config.cjs" <<'CFG'
/** @type {import("drizzle-kit").Config} */
module.exports = {
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
};
CFG

docker run --rm \
  --network postgres_default \
  --env-file "${env_file}" \
  -v "${REMOTE_DIR}/standalone/drizzle:/app/drizzle" \
  -v "${REMOTE_DIR}/drizzle.config.cjs:/app/drizzle.config.cjs" \
  -w /app \
  node:22-bookworm-slim \
  sh -c "npm install --no-save --silent drizzle-kit@0.31.10 drizzle-orm@0.45.2 postgres@3.4.9 && npx drizzle-kit migrate --config=drizzle.config.cjs"

docker compose -f docker-compose.app.yml up -d --force-recreate --remove-orphans
docker compose -f docker-compose.app.yml ps

attempt=1
while [[ "${attempt}" -le "${HEALTH_WAIT_ATTEMPTS}" ]]; do
  if curl -fsS -o /dev/null "http://127.0.0.1:${APP_BIND_PORT}/login"; then
    echo "App health check passed."
    exit 0
  fi
  sleep "${HEALTH_WAIT_SECONDS}"
  attempt=$((attempt + 1))
done

echo "App did not become healthy on 127.0.0.1:${APP_BIND_PORT}." >&2
exit 1
REMOTE

echo "Installing Nginx site (HTTP until TLS can be issued)"
ssh "${SSH_HOST}" \
  "REMOTE_DIR='${REMOTE_DIR}' \
APP_HOST='${APP_HOST}' \
bash -s" <<'REMOTE'
set -euo pipefail

site_src="${REMOTE_DIR}/${APP_HOST}.conf"
site_available="/etc/nginx/sites-available/${APP_HOST}"
site_enabled="/etc/nginx/sites-enabled/${APP_HOST}"

if [[ -f "${site_available}" ]] && grep -q 'ssl_certificate' "${site_available}"; then
  echo "Nginx site already has a certificate; leaving that file in place."
else
  cp "${site_src}" "${site_available}"
  ln -sfn "${site_available}" "${site_enabled}"
fi

nginx -t
systemctl reload nginx

resolved="$(dig +short A "${APP_HOST}" | head -n 1 | tr -d '[:space:]' || true)"
public_ip="$(curl -4 -fsS --max-time 10 https://ifconfig.me | tr -d '[:space:]' || true)"
has_cert=0
if [[ -f "${site_available}" ]] && grep -q 'ssl_certificate' "${site_available}"; then
  has_cert=1
fi

if [[ "${has_cert}" -eq 1 ]]; then
  echo "TLS certificate already configured for ${APP_HOST}."
  exit 0
fi

if [[ -n "${resolved}" && "${resolved}" == "${public_ip}" ]]; then
  certbot --nginx --non-interactive --agree-tos --redirect \
    --key-type ecdsa -d "${APP_HOST}"
  echo "TLS certificate issued for ${APP_HOST}."
  exit 0
fi

echo "Certbot skipped. ${APP_HOST} does not resolve to this VPS (${public_ip})."
echo "Create DNS A ${APP_HOST} -> ${public_ip} before HTTPS works."
echo "Use DNS-only (Cloudflare proxy off) so HTTP-01 reaches this Nginx."
REMOTE

echo "App deploy finished."
