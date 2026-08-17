# Agent instructions (Pixtrela Next)

This repo is **pixtrela-next** (`next/` of the monorepo). Stack: Next.js 16 +
Drizzle + Auth.js + Postgres.

## Cloud Agent: start here (no SSH tunnel)

Secrets are injected by Cursor (My Secrets). Required:

| Secret | Purpose |
|--------|---------|
| `DATABASE_URL` | **Dev** Postgres on VPS: `postgresql://pixtrela:…@179.0.179.210:5433/pixtrela_dev` |
| `AUTH_SECRET` | Auth.js |
| `MEDIA_DRIVER` / `S3_*` / `MEDIA_PUBLIC_BASE_URL` | Cloudflare R2 |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_SECURE` / `SMTP_USER` / `SMTP_PASS` / `FROM_EMAIL` | Password reset emails |

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

## Local laptop

Same `DATABASE_URL` → `179.0.179.210:5433` (VPS postgres-dev). No local Docker
Desktop Postgres. `npm run db:tunnel` is legacy-only.

## /optimize (project command)

Slash command: `.cursor/commands/optimize.md`. Merge conflicts during that
cycle: skill `.cursor/skills/optimize-merge/SKILL.md`. Both travel with the
repo (any machine that clones `pixtrela-next`).

### UI testing (`computerUse`)

- **Default (all agent tasks):** **Vitest is enough.** Do not run browser
  automation (`computerUse`), `RecordScreen`, or manual GUI walkthroughs.
- **`/optimize` only:** When the user explicitly invokes **`/optimize`**, you
  may use `computerUse` and screen recording for UI validation as part of that
  release cycle.
- **`/optimize-min` and every other circumstance:** Vitest only — no
  `computerUse`, no `RecordScreen`, no manual browser tests.

## Docs

- `docs/ENV-VERCEL-CURSOR.md` — env matrix
- `docs/VPS-POSTGRES.md` — dual Postgres on VPS
- `docs/CLOUD-AGENT.md` — Cloud Agent checklist

## Cursor Cloud specific instructions

Dependency install runs automatically on VM startup. `scripts/cloud-agent-bootstrap.sh`
still works for a full bootstrap (install + `db:migrate` + `db:seed`), but it uses
`npm ci`, which fails if `package-lock.json` drifts from `package.json`; if it errors on
a missing package, run `npm install` instead.

- Start the app with `npm run dev` (Next.js + Turbopack on port 3000; forward it in
  Cursor Cloud). The dev server does not need `db:seed` to have run, but the seeded
  logins documented above require it.
- `MEDIA_PUBLIC_BASE_URL` may be unset in the cloud env; the app boots and core flows
  (login, dashboards, users) work without it. Only R2 media serving needs it.
- Scripts (`lint`, `test`, `db:*`) read `DATABASE_URL` from the injected env — no `.env`
  file is required. Tests (`npm test`) hit the dev DB and take ~3 min.
- `npm run lint` currently reports pre-existing errors/warnings unrelated to setup; it is
  not a clean gate.
- See **UI testing (`computerUse`)** under `/optimize` — Vitest only unless the user
  ran `/optimize`.
