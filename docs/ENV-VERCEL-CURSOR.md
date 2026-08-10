# Environment: Vercel (prod) vs Cursor Cloud (dev)

## Topology

| Layer | Where | Database |
|-------|--------|----------|
| Next.js production | Vercel | `postgres-prod` on VPS (`DATABASE_URL` + SSL) |
| Next.js development | Cursor Cloud VM | `postgres-dev` via SSH tunnel → `127.0.0.1:5433` |
| Browser preview | Your laptop | Cursor **port forward 3000** → VM `npm run dev` |

See also [`docs/VPS-POSTGRES.md`](VPS-POSTGRES.md) and
[`scripts/dev-db-tunnel.sh`](../scripts/dev-db-tunnel.sh).

## Vercel (Production / Preview)

Set in the Vercel project → Settings → Environment Variables:

| Variable | Production value |
|----------|------------------|
| `DATA_BACKEND` | `drizzle` |
| `AUTH_STRAPI_FALLBACK` | `0` after cutover (`1` only during coexistence) |
| `DATABASE_URL` | `postgresql://USER:PASS@VPS_HOST:5432/pixtrela?sslmode=require` |
| `AUTH_SECRET` | Strong secret (≠ dev) |
| `AUTH_URL` | Canonical site URL, e.g. `https://pixtrela.com` |
| `AUTH_TRUST_HOST` | `true` |
| `MEDIA_DRIVER` | `s3` (recommended) + `S3_*` keys |
| `STRAPI_URL` / `STRAPI_SYNC_API_TOKEN` | Only while coexistence; remove after cutover |
| `CRM_WEBHOOK_SECRET` / `LEGACY_RBX_*` | If still used |

Deploy checklist:

1. Prod migrations applied.
2. Redeploy Next.
3. Smoke: login + create a step.

## Cursor Cloud VM (development)

### Secrets

Prefer Cursor **Environment Variables** / Secrets for the VM, or a gitignored
`next/.env.local`:

```env
DATA_BACKEND=drizzle
AUTH_STRAPI_FALLBACK=0
AUTH_SECRET=dev-cloud-secret-change-me
AUTH_TRUST_HOST=true
# Must match the URL you open after Cursor port-forward (usually localhost:3000).
AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://DEV_USER:DEV_PASS@127.0.0.1:5433/pixtrela_dev
MEDIA_DRIVER=local
```

### Daily loop

```bash
# 1) Tunnel VPS postgres-dev → local 5433 on the VM
export PIXTRELA_VPS_SSH=deploy@your-vps.example
./scripts/dev-db-tunnel.sh   # leave running

# 2) App
cd next
npm ci
npm run db:migrate
npm run db:seed
npm run dev
```

3. In Cursor UI: **Forward port 3000** and open the forwarded URL in the browser.
4. Never point the Cloud VM `DATABASE_URL` at **prod**.

### Auth.js host tip

If the forwarded URL is not `http://localhost:3000`, set `AUTH_URL` to that
exact origin to avoid callback / redirect loops.
