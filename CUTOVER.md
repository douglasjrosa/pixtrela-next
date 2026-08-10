# Cutover checklist (Phase I)

## Preflight

1. VPS `postgres-prod` / `postgres-dev` up
   ([`docs/VPS-POSTGRES.md`](docs/VPS-POSTGRES.md)); laptop may use
   `docker compose -f docker-compose.db.yml` or a single local Postgres.
2. Prod: `npm run db:migrate` against prod `DATABASE_URL` (never `db:push`).
   Dev: migrate + `npm run db:seed` (+ `db:seed:e2e` if needed).
3. `DATA_BACKEND=drizzle` and prefer `AUTH_STRAPI_FALLBACK=0` for final cutover.
4. Full dual-path UI verified under drizzle (login, awards, tasks, board, teams,
   kiosk) on Cursor Cloud against `postgres-dev`.
5. Vercel env set per [`docs/ENV-VERCEL-CURSOR.md`](docs/ENV-VERCEL-CURSOR.md).

## ETL

```bash
# Point at the legacy Strapi database (MySQL or Postgres)
export STRAPI_DATABASE_URL="..."
export DATABASE_URL="postgresql://pixtrela:pixtrela@127.0.0.1:5432/pixtrela"
npm run db:etl
# Copy media:
#   cp -r ../strapi/public/uploads/* ./storage/uploads/
```

## Freeze Strapi + Auth cutover

1. Stop writes to Strapi (read-only or stop process).
2. Re-run ETL if needed.
3. Set in `.env.local`:
   ```
   DATA_BACKEND=drizzle
   AUTH_STRAPI_FALLBACK=0
   ```
4. Restart Next. Confirm login works **with Strapi stopped**.
5. `npm test` + `RUN_DB_TESTS=1` integration + `npm run test:e2e`.

## Remove legacy

```bash
# From repo root, after staging sign-off:
rm -rf strapi
# Remove Next Strapi DAL leftovers once no imports remain:
#   lib/strapi/** (except migration-guard until deleted)
#   STRAPI_URL / STRAPI_SYNC_API_TOKEN from env
```

Update CI to one Node service + Postgres only.

## Rollback

Restore `strapi/` from git, set `AUTH_STRAPI_FALLBACK=1` or `DATA_BACKEND=strapi`, restart both apps.
