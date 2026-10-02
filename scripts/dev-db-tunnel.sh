#!/usr/bin/env bash
# Removed: VPS postgres-dev no longer exists.
# Use local Docker: docker compose --env-file .env.local.db up -d
# DATABASE_URL=postgresql://pixtrela:PASSWORD@127.0.0.1:5432/pixtrela

echo "VPS development Postgres was removed. Use local docker-compose.yml." >&2
exit 1
