# Cutover checklist (complete)

Runtime Strapi DAL has been removed from this app. Persistence is **Drizzle +
Postgres** only. Keep this doc for production cutover and one-time ETL.

## Preflight

1. VPS `postgres-prod` / `postgres-dev` up
   ([`docs/VPS-POSTGRES.md`](docs/VPS-POSTGRES.md)); laptop may use
   `docker compose -f docker-compose.db.yml` or a single local Postgres.
2. Prod: `npm run db:migrate` against prod `DATABASE_URL` (never `db:push`).
   Dev: migrate + `npm run db:seed` (+ `db:seed:e2e` if needed).
3. Full UI verified on Cursor Cloud against `postgres-dev` (login, awards, tasks,
   board, teams, kiosk).
4. Vercel env set per [`docs/ENV-VERCEL-CURSOR.md`](docs/ENV-VERCEL-CURSOR.md).

## ETL (one-time, from legacy Strapi DB)

```bash
# Point at the legacy Strapi database (MySQL or Postgres)
export STRAPI_DATABASE_URL="..."
export DATABASE_URL="postgresql://[REDACTED]:[REDACTED]@127.0.0.1:5432/[REDACTED]"
npm run db:etl
# Copy media:
#   cp -r ../strapi/public/uploads/* ./storage/uploads/
```

## Production sign-off

1. Stop writes to Strapi (read-only or stop process).
2. Re-run ETL if needed.
3. Deploy Next with Postgres `DATABASE_URL` only (no Strapi env vars).
4. Confirm login works **with Strapi stopped**.
5. `npm test` + `RUN_DB_TESTS=1` integration + `npm run test:e2e`.

## Remove legacy (post sign-off)

```bash
# From repo root, after staging sign-off:
rm -rf strapi
```

Update CI to one Node service + Postgres only.

## Rollback

Restore `strapi/` from git and redeploy a pre-cutover Next commit that still
supported the Strapi dual-path (historical branches only).
