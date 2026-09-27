# Realtime SSE hub

Node process that publishes board invalidation into local Redis and streams it
with server-sent events. It does not read Postgres.

## Local process

Requires Redis on `127.0.0.1:6379` and Node 22+.

```bash
cd services/realtime
cp .env.example .env
# edit both secrets (at least 32 characters)
npm install
npm test
npm run dev
```

- `GET http://127.0.0.1:8787/health`
- `POST http://127.0.0.1:8787/internal/publish` with
  `Authorization: Bearer <REALTIME_PUBLISH_SECRET>` and body `{"channel":"board"}`
- `GET http://127.0.0.1:8787/events/board?token=<jwt>`

## Docker Compose

From the Next repo root (`next/`):

```bash
cp services/realtime/.env.example services/realtime/.env
# edit both secrets
docker compose -f docker-compose.realtime.yml up --build
```

Redis and the hub are published only on `127.0.0.1`.
