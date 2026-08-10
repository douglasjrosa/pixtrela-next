#!/usr/bin/env bash
# SSH local forward: Cursor Cloud VM (or laptop) → VPS postgres-dev on 5433.
# Usage:
#   export PIXTRELA_VPS_SSH=deploy@your-vps.example
#   ./scripts/dev-db-tunnel.sh
#
# Then in next/.env.local:
#   DATABASE_URL=postgresql://USER:PASS@127.0.0.1:5433/pixtrela_dev

set -euo pipefail

REMOTE="${PIXTRELA_VPS_SSH:?Set PIXTRELA_VPS_SSH e.g. deploy@vps.example}"
LOCAL_PORT="${DEV_PG_LOCAL_PORT:-5433}"
REMOTE_PORT="${DEV_PG_REMOTE_PORT:-5433}"

echo "Forwarding 127.0.0.1:${LOCAL_PORT} -> ${REMOTE}:127.0.0.1:${REMOTE_PORT}"
exec ssh -N -o ExitOnForwardFailure=yes -L "${LOCAL_PORT}:127.0.0.1:${REMOTE_PORT}" "${REMOTE}"
