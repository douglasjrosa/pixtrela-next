# Greenfield: Next + Postgres + Drizzle

This app is **Drizzle-only** at runtime. Optional `npm run db:etl` imports from a
legacy source database (one-time cutover).

## Quick start (laptop)

```bash
cp env.local.db.example .env.local.db
# set LOCAL_PG_PASSWORD
docker compose --env-file .env.local.db up -d

cp .env.example .env.local
# DATABASE_URL=postgresql://pixtrela:PASSWORD@127.0.0.1:5432/pixtrela
npm run db:migrate
npm run db:seed
npm run dev
```

Default admin (seed): `admin` / `PixtrelaAdmin1`

## Production

Next and Postgres run on the VPS. See [`docs/VPS-POSTGRES.md`](docs/VPS-POSTGRES.md)
and `scripts/deploy-app-vps.sh`.

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run db:generate` | Generate SQL migrations from schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema (dev only) |
| `npm run db:seed` | Minimal admin + currency + steps |
| `npm run db:seed:e2e` | E2E manager user |
| `npm run db:etl` | One-time cutover ETL (needs `LEGACY_SOURCE_DATABASE_URL` or `STRAPI_DATABASE_URL`) |
| `npm run test:db` | Domain/repos unit tests |
| `RUN_DB_TESTS=1 npm test -- lib/repos/repos.integration.test.ts` | Postgres integration |

## Env flags

| Var | Meaning |
|-----|---------|
| `DATABASE_URL` | Postgres connection (required) |
| `AUTH_SECRET` | Auth.js session signing (required) |
| `RUN_DB_TESTS=1` | Enable Drizzle integration tests |
| `STRAPI_DATABASE_URL` | Legacy source DB for `npm run db:etl` only (optional) |

See also `MIGRATION.md` and `CUTOVER.md`.
