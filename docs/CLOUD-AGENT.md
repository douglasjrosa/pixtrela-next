# Cursor Cloud Agent checklist

## Goal

Start a Cloud Agent from this GitHub repo; it runs Next against a **local
Postgres** on the agent VM (`127.0.0.1:5432`). Production lives on the VPS.

## One-time setup (human)

### 1. Cursor → Cloud Agents → My Secrets

Do **not** put a public VPS `:5433` URL here. The agent starts its own
Postgres with `docker compose --env-file .env.local.db up -d`.

```env
AUTH_SECRET=<dev secret>
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
DATABASE_URL=postgresql://pixtrela:<LOCAL_PG_PASSWORD>@127.0.0.1:5432/pixtrela
```

Optional R2 / SMTP keys only if that session needs media or mail.

### 2. GitHub

`DATABASE_URL_PROD` is unused by the current deploy path. Production
migrations run on the VPS (`scripts/deploy-app-vps.sh`).

### 3. Production

Push to `master` does not publish the Next app. Deploy with
`./scripts/deploy-app-vps.sh` after `npm run build`.

## Every new agent session

1. `docker compose --env-file .env.local.db up -d`
2. `./scripts/cloud-agent-bootstrap.sh`
3. `npm run dev` + forward port 3000
