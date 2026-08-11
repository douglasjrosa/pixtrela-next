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

## Local laptop

Same `DATABASE_URL` → `179.0.179.210:5433` (VPS postgres-dev). No local Docker
Desktop Postgres. `npm run db:tunnel` is legacy-only.

## /optimize (project commands)

- **Full test gate:** `.cursor/commands/optimize.md` — runs `npm run lint` and
  the full Vitest suite (`npm test`).
- **Affected tests only:** `.cursor/commands/optimize-min.md` — same release
  flow; Vitest with `--changed origin/master` instead of the full suite.

Both commands require **descriptive commit messages** (what changed), not
workflow names like `optimize` or `review release`.

Merge conflicts during either cycle: skill
`.cursor/skills/optimize-merge/SKILL.md`. Commands and skill travel with the
repo (any machine that clones `pixtrela-next`).

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
