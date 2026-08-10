# VPS Postgres (prod + dev containers)

Greenfield Postgres runs as **two Docker containers** on the Pixtrela VPS via
[`docker-compose.db.yml`](../docker-compose.db.yml).

## Install (once on the VPS)

1. Install Docker Engine + Compose plugin.
2. Copy compose + env onto the VPS (e.g. `/var/www/pixtrela/postgres/`).
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

5. Apply schema from any machine that can reach the VPS:

   ```bash
   # Prod (Vercel / CI)
   DATABASE_URL='postgresql://USER:PASS@VPS_HOST:5432/pixtrela' \
     npm run db:migrate

   # Dev (Cursor Cloud / laptop — public :5433, no tunnel)
   DATABASE_URL='postgresql://USER:PASS@VPS_HOST:5433/pixtrela_dev' \
     npm run db:migrate
   DATABASE_URL='...' npm run db:seed
   ```

## Firewall

| Port | Bind | Policy |
|------|------|--------|
| `5432` (prod) | `0.0.0.0` | Prefer restrict to Vercel egress / known IPs. Prefer `sslmode=require`. |
| `5433` (dev) | `0.0.0.0` | Open for Cursor Cloud Agents + laptop. Strong `DEV_PG_PASSWORD`. |

```bash
ufw allow OpenSSH
ufw allow 5433/tcp comment 'pixtrela postgres-dev'
# Optional: lock prod to known CIDRs
# ufw allow from VERCEL_OR_OFFICE_CIDR to any port 5432 proto tcp
ufw enable
```

## SSL for production

Vercel should use `?sslmode=require` when TLS is enabled on Postgres. Until then,
keep firewall tight on `5432`.

## Cursor Cloud

See [`CLOUD-AGENT.md`](CLOUD-AGENT.md) and root [`AGENTS.md`](../AGENTS.md).
No SSH tunnel: `DATABASE_URL` → `VPS_HOST:5433/pixtrela_dev`.
