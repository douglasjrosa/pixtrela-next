# Environment: VPS production vs local development

## Topology

| Layer | Where | Database |
|-------|--------|----------|
| Next.js production | Docker on the VPS (`127.0.0.1:3000` behind Nginx) | `pixtrela-postgres-prod` on the Docker network |
| Next.js development | Laptop / Cloud Agent | local Docker `127.0.0.1:5432` / DB `pixtrela` |
| Browser preview | Laptop | `npm run dev` on port 3000 |

Templates:

- App secrets: [`.env.example`](../.env.example) → `.env.local`
- Laptop Postgres: [`env.local.db.example`](../env.local.db.example) → `.env.local.db`
- VPS Postgres: [`env.db.example`](../env.db.example) → `.env.db` on the VPS
- Cloud Agents: [`CLOUD-AGENT.md`](CLOUD-AGENT.md), [`AGENTS.md`](../AGENTS.md)

## Production (VPS `/var/www/pixtrela/app/.env`)

Written by `scripts/write-vps-app-env.sh` from `.env.production.local` plus
the VPS Postgres and realtime secret files. `DATABASE_URL` uses hostname
`pixtrela-postgres-prod`. `CRON_SECRET` stays unset until provided.

Ribermax URL/token and the CRM webhook secret also live in the database
(`/settings/integrations`). See
[`integrations/ribermax/README.md`](../integrations/ribermax/README.md).

## Local development

```env
AUTH_SECRET=...
AUTH_TRUST_HOST=true
AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://pixtrela:PASSWORD@127.0.0.1:5432/pixtrela
```

```bash
docker compose --env-file .env.local.db up -d
npm run db:migrate
npm run db:seed
npm run dev
```

Never point the Cloud Agent at **prod** Postgres.

## Deploy

Push to `master` runs GitHub Action **Deploy VPS**: it builds the standalone
app on the runner and publishes with `scripts/deploy-app-vps.sh` (including
`drizzle-kit migrate` on the VPS Docker network). GitHub Action
`Deploy prod DB` is a no-op.

Manual fallback from a laptop: `npm run build` then
`./scripts/deploy-app-vps.sh`.
