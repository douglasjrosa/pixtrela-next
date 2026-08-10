# VPS Postgres (prod + dev containers)

Greenfield Postgres runs as **two Docker containers** on the Strapi VPS via
[`docker-compose.db.yml`](../docker-compose.db.yml). Strapi's legacy DB is
untouched.

## Install (once on the VPS)

1. Install Docker Engine + Compose plugin.
2. Clone or copy the repo (or just the compose files) onto the VPS.
3. Create secrets:

   ```bash
   cp env.db.example .env.db
   # edit .env.db — strong unique passwords for prod and dev
   chmod 600 .env.db
   ```

4. Start:

   ```bash
   docker compose -f docker-compose.db.yml --env-file .env.db up -d
   docker compose -f docker-compose.db.yml --env-file .env.db ps
   ```

5. Apply schema (from a machine that can reach the DB):

   ```bash
   # Prod — prefer migrate, never db:push in production
   DATABASE_URL='postgresql://USER:PASS@VPS_HOST:5432/pixtrela?sslmode=require' \
     npm run db:migrate --prefix next

   # Dev (via SSH tunnel to 5433 — see scripts/dev-db-tunnel.sh)
   DATABASE_URL='postgresql://USER:PASS@127.0.0.1:5433/pixtrela_dev' \
     npm run db:migrate --prefix next
   DATABASE_URL='...' npm run db:seed --prefix next
   ```

## Firewall

| Port | Bind | Policy |
|------|------|--------|
| `5432` (prod) | `0.0.0.0` | Allow only known clients (Vercel egress / office VPN). Prefer `sslmode=require`. |
| `5433` (dev) | `127.0.0.1` | **Do not** open on the WAN. Access via SSH `-L 5433`. |

Example UFW (adjust source CIDRs):

```bash
ufw allow OpenSSH
# Optional: restrict Postgres prod to specific nets
# ufw allow from VERCEL_OR_OFFICE_CIDR to any port 5432 proto tcp
ufw enable
```

## SSL for production

Vercel must use `?sslmode=require` (or `verify-full` with a real cert). Options:

1. **Postgres SSL** — mount server cert/key into `postgres-prod` and set
   `ssl=on` via a custom `postgresql.conf` / `command`.
2. **Stunnel / reverse TLS terminator** in front of 5432.
3. **Managed Postgres** (Neon/Supabase) if self-hosted TLS is too heavy — keep
   `postgres-dev` on the VPS for Cursor Cloud.

Until TLS is configured, treat prod DB exposure as temporary and keep the
firewall tight.

## Coexistence with Strapi

Strapi keeps its existing MySQL/Postgres volume. Do **not** point Strapi at
`pixtrela_pg_prod` / `pixtrela_pg_dev`. After cutover, stop Strapi writes and
run ETL into prod Postgres (`CUTOVER.md`).
