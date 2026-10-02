# VPS Postgres

Production Postgres is `pixtrela-postgres-prod` on the Docker network
`postgres_default`. Port `5432` is bound to `127.0.0.1` only.

Development Postgres is **local** (`docker-compose.yml` on the laptop). There
is no `postgres-dev` container or volume on the VPS.

## Files on the VPS

`/var/www/pixtrela/postgres/docker-compose.db.yml` + `.env.db` (`chmod 600`).

## App connection

The Next container joins `postgres_default` and uses
`DATABASE_URL=postgresql://USER:PASS@pixtrela-postgres-prod:5432/pixtrela`.

Migrations run during `scripts/deploy-app-vps.sh`, not from GitHub Actions.

## Adminer

`db.pixtrela.ribermax.com.br` still proxies `127.0.0.1:8080` and defaults to
`postgres-prod`.
