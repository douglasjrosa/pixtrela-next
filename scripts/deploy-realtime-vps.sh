#!/usr/bin/env bash
# Deploy the realtime SSE hub via the pixtrela-vps SSH alias.
# Secrets stay on the server (chmod 600). This script does not print them.
#
# Usage (from next/):
#   ./scripts/deploy-realtime-vps.sh

set -euo pipefail

SSH_HOST="${PIXTRELA_VPS_SSH:-pixtrela-vps}"
REMOTE_DIR="${PIXTRELA_REALTIME_DIR:-/var/www/pixtrela/realtime}"
SSE_HOST="${PIXTRELA_SSE_HOST:-sse.pixtrela.ribermax.com.br}"
MIN_SECRET_LENGTH=32
SECRET_FILE_MODE=600
SSE_PROXY_READ_TIMEOUT_SECONDS=86400
HUB_BIND_PORT=8787
HEALTH_WAIT_ATTEMPTS=24
HEALTH_WAIT_SECONDS=5

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
NGINX_SITE="${ROOT}/deploy/nginx/${SSE_HOST}.conf"
NGINX_SNIPPET="${ROOT}/deploy/nginx/pixtrela-sse-proxy.conf"

if ! command -v rsync >/dev/null 2>&1; then
  echo "rsync is required on PATH." >&2
  exit 1
fi

if [[ ! -f "${NGINX_SITE}" || ! -f "${NGINX_SNIPPET}" ]]; then
  echo "Missing Nginx files under deploy/nginx." >&2
  exit 1
fi

echo "Syncing realtime sources to ${SSH_HOST}:${REMOTE_DIR}"
ssh "${SSH_HOST}" "mkdir -p '${REMOTE_DIR}/services/realtime'"

# Exclude .env so --delete does not remove the server secret file.
rsync -az --delete \
  --exclude node_modules \
  --exclude dist \
  --exclude .env \
  --exclude '.env.*' \
  --exclude coverage \
  --exclude '*.log' \
  "${ROOT}/services/realtime/" \
  "${SSH_HOST}:${REMOTE_DIR}/services/realtime/"

rsync -az \
  "${ROOT}/docker-compose.realtime.yml" \
  "${SSH_HOST}:${REMOTE_DIR}/docker-compose.realtime.yml"

rsync -az \
  "${NGINX_SITE}" \
  "${NGINX_SNIPPET}" \
  "${SSH_HOST}:${REMOTE_DIR}/"

echo "Ensuring server secrets and starting compose"
ssh "${SSH_HOST}" \
  "REMOTE_DIR='${REMOTE_DIR}' \
MIN_SECRET_LENGTH='${MIN_SECRET_LENGTH}' \
SECRET_FILE_MODE='${SECRET_FILE_MODE}' \
HUB_BIND_PORT='${HUB_BIND_PORT}' \
HEALTH_WAIT_ATTEMPTS='${HEALTH_WAIT_ATTEMPTS}' \
HEALTH_WAIT_SECONDS='${HEALTH_WAIT_SECONDS}' \
bash -s" <<'REMOTE'
set -euo pipefail

env_file="${REMOTE_DIR}/services/realtime/.env"
umask 077
mkdir -p "$(dirname "${env_file}")"

read_secret() {
  local key="$1"
  local line=""
  if [[ ! -f "${env_file}" ]]; then
    printf ''
    return
  fi
  line="$(grep -E "^${key}=" "${env_file}" | tail -n 1 || true)"
  printf '%s' "${line#"${key}="}"
}

write_secret() {
  local key="$1"
  local value="$2"
  local tmp
  tmp="$(mktemp)"
  if [[ -f "${env_file}" ]]; then
    grep -E -v "^${key}=" "${env_file}" > "${tmp}" || true
  fi
  printf '%s=%s\n' "${key}" "${value}" >> "${tmp}"
  chmod "${SECRET_FILE_MODE}" "${tmp}"
  mv "${tmp}" "${env_file}"
  chmod "${SECRET_FILE_MODE}" "${env_file}"
}

ensure_secret() {
  local key="$1"
  local current
  current="$(read_secret "${key}")"
  if [[ "${#current}" -ge "${MIN_SECRET_LENGTH}" ]]; then
    return
  fi
  local generated
  generated="$(openssl rand -hex "${MIN_SECRET_LENGTH}")"
  write_secret "${key}" "${generated}"
}

touch "${env_file}"
chmod "${SECRET_FILE_MODE}" "${env_file}"
ensure_secret REALTIME_PUBLISH_SECRET
ensure_secret REALTIME_JWT_SECRET
chmod "${SECRET_FILE_MODE}" "${env_file}"

cd "${REMOTE_DIR}"
docker compose -f docker-compose.realtime.yml up -d --build --remove-orphans
docker compose -f docker-compose.realtime.yml ps

attempt=1
while [[ "${attempt}" -le "${HEALTH_WAIT_ATTEMPTS}" ]]; do
  if curl -fsS "http://127.0.0.1:${HUB_BIND_PORT}/health" >/dev/null; then
    echo "Hub health check passed."
    exit 0
  fi
  sleep "${HEALTH_WAIT_SECONDS}"
  attempt=$((attempt + 1))
done

echo "Hub did not become healthy on 127.0.0.1:${HUB_BIND_PORT}." >&2
exit 1
REMOTE

echo "Installing Nginx site (HTTP until TLS can be issued)"
ssh "${SSH_HOST}" \
  "REMOTE_DIR='${REMOTE_DIR}' \
SSE_HOST='${SSE_HOST}' \
SSE_PROXY_READ_TIMEOUT_SECONDS='${SSE_PROXY_READ_TIMEOUT_SECONDS}' \
bash -s" <<'REMOTE'
set -euo pipefail

site_src="${REMOTE_DIR}/${SSE_HOST}.conf"
snippet_src="${REMOTE_DIR}/pixtrela-sse-proxy.conf"
site_available="/etc/nginx/sites-available/${SSE_HOST}"
site_enabled="/etc/nginx/sites-enabled/${SSE_HOST}"
snippet_dest="/etc/nginx/snippets/pixtrela-sse-proxy.conf"
timeout="${SSE_PROXY_READ_TIMEOUT_SECONDS}s"

mkdir -p /etc/nginx/snippets
sed "s/__SSE_PROXY_READ_TIMEOUT__/${timeout}/g" \
  "${snippet_src}" > "${snippet_dest}"

if [[ -f "${site_available}" ]] && grep -q 'ssl_certificate' "${site_available}"; then
  echo "Nginx site already has a certificate; leaving that file in place."
else
  cp "${site_src}" "${site_available}"
  ln -sfn "${site_available}" "${site_enabled}"
fi

nginx -t
systemctl reload nginx

resolved="$(dig +short A "${SSE_HOST}" | head -n 1 | tr -d '[:space:]' || true)"
public_ip="$(curl -4 -fsS --max-time 10 https://ifconfig.me | tr -d '[:space:]' || true)"
has_cert=0
if [[ -f "${site_available}" ]] && grep -q 'ssl_certificate' "${site_available}"; then
  has_cert=1
fi

if [[ "${has_cert}" -eq 1 ]]; then
  echo "TLS certificate already configured for ${SSE_HOST}."
  exit 0
fi

if [[ -n "${resolved}" && "${resolved}" == "${public_ip}" ]]; then
  certbot --nginx --non-interactive --agree-tos --redirect \
    --key-type ecdsa -d "${SSE_HOST}"
  echo "TLS certificate issued for ${SSE_HOST}."
  exit 0
fi

echo "Certbot skipped. ${SSE_HOST} does not resolve to this VPS (${public_ip})."
echo "Create DNS A ${SSE_HOST} -> ${public_ip} before HTTPS works."
echo "Use DNS-only (Cloudflare proxy off) so HTTP-01 reaches this Nginx."
REMOTE

echo "Realtime deploy finished. Port 6379 was not opened in UFW."
