# Environment: Vercel (prod) vs Cursor Cloud (dev)

## Topology

| Layer | Where | Database |
|-------|--------|----------|
| Next.js production | Vercel | `postgres-prod` on VPS (`:5432` / DB `pixtrela`) |
| Next.js development | Cursor Cloud / laptop | `postgres-dev` on VPS (`:5433` / DB `pixtrela_dev`) — **no tunnel** |
| Browser preview | Your laptop | Cursor **port forward 3000** → `npm run dev` |

Templates:

- App secrets: [`.env.example`](../.env.example) → `.env.local` / Vercel / Cursor Secrets
- VPS Postgres: [`env.db.example`](../env.db.example) → `.env.db` on the VPS
- Cloud Agents: [`CLOUD-AGENT.md`](CLOUD-AGENT.md), [`AGENTS.md`](../AGENTS.md)

## Vercel (Production / Preview)

| Variable | Production value |
|----------|------------------|
| `DATA_BACKEND` | `drizzle` |
| `AUTH_STRAPI_FALLBACK` | `0` |
| `DATABASE_URL` | `postgresql://USER:PASS@VPS_HOST:5432/pixtrela` (+ `sslmode=require` when TLS is on) |
| `AUTH_SECRET` | Strong secret |
| `AUTH_URL` | Canonical site URL |
| `AUTH_TRUST_HOST` | `true` |
| `MEDIA_DRIVER` / `S3_*` / `MEDIA_PUBLIC_BASE_URL` | Cloudflare R2 (`pixtrela-media`) |

Push to `master` → Vercel deploys the app. GitHub Action **Deploy prod DB** runs
`drizzle-kit migrate` using secret `DATABASE_URL_PROD`.

## Cursor Cloud (development)

Cursor **My Secrets** (All repositories or this repo):

```env
DATA_BACKEND=drizzle
AUTH_STRAPI_FALLBACK=0
AUTH_SECRET=...
AUTH_TRUST_HOST=true
AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://pixtrela:DEV_PASS@179.0.179.210:5433/pixtrela_dev
MEDIA_DRIVER=s3
S3_BUCKET=pixtrela-media
S3_REGION=auto
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
MEDIA_PUBLIC_BASE_URL=https://media.pixtrela.ribermax.com.br
S3_FORCE_PATH_STYLE=true
```

Bootstrap (agent does this — see `AGENTS.md`):

```bash
./scripts/cloud-agent-bootstrap.sh
npm run dev
```

Forward port **3000**. Never point the Cloud Agent at **prod** Postgres (`:5432`).

## GitHub Actions

Repo secret `DATABASE_URL_PROD` = production connection string (`:5432` / `pixtrela`).
Workflow: [`.github/workflows/deploy-prod-db.yml`](../.github/workflows/deploy-prod-db.yml).
