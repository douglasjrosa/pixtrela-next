#!/usr/bin/env bash
# OPTIONAL / legacy — prefer DATABASE_URL=@VPS_HOST:5433 (no tunnel).
# SSH local forward only if postgres-dev is bound to 127.0.0.1 again.
# Usage:
#   export PIXTRELA_VPS_SSH=pixtrela-vps
#   ./scripts/dev-db-tunnel.sh

set -euo pipefail

REMOTE="${PIXTRELA_VPS_SSH:?Set PIXTRELA_VPS_SSH e.g. pixtrela-vps}"
LOCAL_PORT="${DEV_PG_LOCAL_PORT:-5433}"
REMOTE_PORT="${DEV_PG_REMOTE_PORT:-5433}"

echo "Forwarding 127.0.0.1:${LOCAL_PORT} -> ${REMOTE}:127.0.0.1:${REMOTE_PORT}"
echo "(Prefer direct DATABASE_URL to VPS_HOST:5433 — see AGENTS.md)"
exec ssh -N -o ExitOnForwardFailure=yes -L "${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT}" "${REMOTE}"
