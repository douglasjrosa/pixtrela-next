# Greenfield: Next + Postgres + Drizzle

Strapi (`../strapi`) is **legacy reference only**. This app is **Drizzle-only**
at runtime; use `scripts/etl-from-strapi.ts` only for one-time cutover ETL.

## Quick start (laptop)

```bash
# repo root — single local Postgres on 5432
docker compose up -d

# next/
cp .env.example .env.local
npm run db:push
npm run db:seed
npm run dev
```

Default admin (seed): `admin` / `PixtrelaAdmin1`

## Cursor Cloud + VPS Postgres + Vercel

Target topology:

| Role | Runtime | Database |
|------|---------|----------|
| Production Next | Vercel | `postgres-prod` on the VPS |
| Development Next | Cursor Cloud VM | `postgres-dev` on `:5433` (direct, no tunnel) |
| Browser | Laptop | Cursor port-forward **3000** |

- VPS containers: [`docker-compose.db.yml`](docker-compose.db.yml) + [`env.db.example`](env.db.example)
- Deploy / firewall / SSL: [`docs/VPS-POSTGRES.md`](docs/VPS-POSTGRES.md)
- Env tables + daily loop: [`docs/ENV-VERCEL-CURSOR.md`](docs/ENV-VERCEL-CURSOR.md)
- SSH tunnel helper: [`scripts/dev-db-tunnel.sh`](scripts/dev-db-tunnel.sh) (legacy)

## Scripts

| Script | Purpose |
|--------|---------|
| `npm run db:generate` | Generate SQL migrations from schema |
| `npm run db:migrate` | Apply migrations |
| `npm run db:push` | Push schema (dev only) |
| `npm run db:seed` | Minimal admin + currency + steps |
| `npm run db:seed:e2e` | E2E manager user |
| `npm run db:etl` | Cutover ETL (needs `STRAPI_DATABASE_URL`) |
| `npm run test:db` | Domain/repos unit tests |
| `RUN_DB_TESTS=1 npm test -- lib/repos/repos.integration.test.ts` | Postgres integration |

## Env flags

| Var | Meaning |
|-----|---------|
| `DATABASE_URL` | Postgres connection (required) |
| `AUTH_SECRET` | Auth.js session signing (required) |
| `RUN_DB_TESTS=1` | Enable Drizzle integration tests |
| `STRAPI_DATABASE_URL` | Legacy DB for `npm run db:etl` only |

See also `MIGRATION.md` and `CUTOVER.md`.
