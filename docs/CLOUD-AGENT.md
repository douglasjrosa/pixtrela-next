# Cursor Cloud Agent checklist

## Goal

Start a Cloud Agent from this GitHub repo; it runs Next against **VPS
postgres-dev** with **no SSH tunnel**, then on commit+push deploys Vercel +
migrates **prod** DB.

## One-time setup (human)

### 1. Cursor → Cloud Agents → My Secrets

Paste (All repositories or this repo):

```env
DATABASE_URL=postgresql://pixtrela:<DEV_PG_PASSWORD>@179.0.179.210:5433/pixtrela_dev
AUTH_SECRET=<same as Vercel>
AUTH_URL=http://localhost:3000
AUTH_TRUST_HOST=true
MEDIA_DRIVER=s3
S3_ENDPOINT=https://cb84464acbde62844bb875cd72618993.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=pixtrela-media
S3_ACCESS_KEY_ID=<r2 key>
S3_SECRET_ACCESS_KEY=<r2 secret>
MEDIA_PUBLIC_BASE_URL=https://media.pixtrela.ribermax.com.br
```

`DATABASE_URL` must use **public IP + port 5433** (dev), not `127.0.0.1`.

### 2. VPS firewall + bind

`postgres-dev` listens on `0.0.0.0:5433`. UFW allows `5433/tcp`.
See `VPS-POSTGRES.md`.

### 3. GitHub → repo secrets

| Name | Value |
|------|--------|
| `DATABASE_URL_PROD` | `postgresql://pixtrela:<PROD_PASS>@179.0.179.210:5432/pixtrela` |

### 4. Vercel

Project linked to `douglasjrosa/pixtrela-next`, Production env includes
`DATABASE_URL` (prod `:5432`), Auth, R2. Push to `master` auto-deploys.

## Every new agent session

Agent follows `AGENTS.md`:

1. `./scripts/cloud-agent-bootstrap.sh`
2. `npm run dev` + forward port 3000
3. On user “commit and push”: commit → push → wait for Vercel +
   workflow **Deploy prod DB**
