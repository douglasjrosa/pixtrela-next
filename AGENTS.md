# Agent instructions (Pixtrela Next)

This repo is **pixtrela-next** (`next/` of the monorepo). Stack: Next.js 16 +
Drizzle + Auth.js + Postgres. Canonical data: `DATA_BACKEND=drizzle`.

## Cloud Agent: start here (no SSH tunnel)

Secrets are injected by Cursor (My Secrets). Required:

| Secret | Purpose |
|--------|---------|
| `DATABASE_URL` | **Dev** Postgres on VPS: `postgresql://pixtrela:…@179.0.179.210:5433/pixtrela_dev` |
| `AUTH_SECRET` | Auth.js |
| `DATA_BACKEND` | `drizzle` |
| `MEDIA_DRIVER` / `S3_*` / `MEDIA_PUBLIC_BASE_URL` | Cloudflare R2 |

**Do not** open an SSH tunnel. Connect straight to `179.0.179.210:5433`.

### Bootstrap (every new Cloud Agent)

```bash
chmod +x scripts/cloud-agent-bootstrap.sh
./scripts/cloud-agent-bootstrap.sh
npm run dev
```

Forward port **3000** in Cursor Cloud for the preview URL.

Seed logins (after `db:seed`): `admin` / `PixtrelaAdmin1`, `code.1111` / `111111`.

### Do not

- Point `DATABASE_URL` at production (`:5432` / DB `pixtrela`) while developing.
- Commit `.env*`, passwords, or API keys.
- Run `db:migrate` against prod unless the user asked for a production deploy.

## Commit + push → deploy

When the user asks to **commit and push**:

1. Commit only intentional source/docs (never secrets).
2. `git push` to `origin` (usually `master`).
3. **Vercel** deploys the app automatically from GitHub.
4. **GitHub Action** `Deploy prod DB` runs `drizzle-kit migrate` against
   production Postgres (`DATABASE_URL` secret named `DATABASE_URL_PROD` in
   GitHub). Confirm the workflow succeeds.

If migrate fails, fix and push again; do not leave prod schema behind the app.

## Local laptop (optional)

Same `DATABASE_URL` host `179.0.179.210:5433` works without a tunnel.
`npm run db:tunnel` is optional legacy for localhost-only binds.

## Docs

- `docs/ENV-VERCEL-CURSOR.md` — env matrix
- `docs/VPS-POSTGRES.md` — dual Postgres on VPS
- `docs/CLOUD-AGENT.md` — Cloud Agent checklist
