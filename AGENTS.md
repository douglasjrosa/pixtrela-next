# Agent instructions (Pixtrela Next)

This repo is **pixtrela-next** (`next/` of the monorepo). Stack: Next.js 16 +
Drizzle + Auth.js + Postgres.

## Laptop / Cloud Agent: local Postgres

Development uses a local Docker Postgres on `127.0.0.1:5432` (database
`pixtrela`). Do not point `DATABASE_URL` at the VPS.

```bash
cp env.local.db.example .env.local.db
# set LOCAL_PG_PASSWORD
docker compose --env-file .env.local.db up -d
cp .env.example .env.local
# DATABASE_URL=postgresql://pixtrela:PASSWORD@127.0.0.1:5432/pixtrela
npm run db:migrate
npm run db:seed
npm run db:seed:branding
npm run dev
```

A Cloud Agent VM must start that same Compose (or another local Postgres) and
set `DATABASE_URL` to `127.0.0.1`. There is no shared public `:5433` database.

Seed logins (after `db:seed`): `admin` / `PixtrelaAdmin1`, `code.1111` / `111111`.

### Do not

- Point `DATABASE_URL` at production (`pixtrela-postgres-prod` / VPS `:5432`)
  while developing.
- Commit `.env*`, passwords, or API keys.
- Run `db:migrate` against prod unless the user asked for a production deploy.

## Commit + push → deploy

When the user asks to **commit and push**:

1. Commit only intentional source/docs (never secrets).
2. `git push` to `origin` (usually `master`).
3. GitHub Action **Deploy VPS** builds the standalone app and runs
   `scripts/deploy-app-vps.sh` over SSH. Do not also deploy from the laptop
   unless the user asks or that workflow is failing.
4. GitHub Action `Deploy prod DB` is a no-op (migrations run inside Deploy
   VPS on the Docker network).

If migrate fails on the VPS, fix and deploy again; do not leave prod schema
behind the app.

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
- `docs/VPS-POSTGRES.md` — VPS Postgres
- `docs/CLOUD-AGENT.md` — Cloud Agent checklist
