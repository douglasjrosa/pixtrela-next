# Realtime SSE hub

The Next.js app on Vercel owns mutations and Postgres. After a board change it
POSTs a short invalidation to this hub. A long-running process on the VPS
forwards that signal with server-sent events. The browser then calls the
existing board revision poll. The 10 second poll stays as a fallback.

```
Browser --EventSource--> Nginx :443 --> 127.0.0.1:8787 (realtime)
Next (Vercel) --POST /internal/publish--> Nginx --> realtime
realtime <--> Redis 127.0.0.1:6379
Browser --pollBoardRevision--> Next
```

Redis and the Node process are bound to loopback. Nginx on port 443 is the
public endpoint. Do not open `6379` or `8787` in UFW.

## Hostname

`sse.pixtrela.ribermax.com.br` (same VPS as the other vhosts, `179.0.179.210`).

TLS is Let's Encrypt via Certbot's nginx plugin (ECDSA), the same stack as the
existing sites. A page served over HTTPS must call this hub over HTTPS.

## Deploy

From `next/`, with `rsync` on `PATH`:

```bash
./scripts/deploy-realtime-vps.sh
```

The script uses only `ssh pixtrela-vps`. It rsyncs `services/realtime` and
`docker-compose.realtime.yml` to `/var/www/pixtrela/realtime`, then runs
`docker compose -f docker-compose.realtime.yml up -d --build` on the VPS.

Secrets are created on the server when missing or shorter than 32 characters:

`/var/www/pixtrela/realtime/services/realtime/.env` (`chmod 600`)

That file is excluded from rsync and must never be committed. Do not copy its
values into git, logs, or this document. Copy `REALTIME_PUBLISH_SECRET` and
`REALTIME_JWT_SECRET` into the Vercel project by hand after deploy.

The script installs the Nginx site from `deploy/nginx/`. Buffering is off and
`proxy_read_timeout` is 86400 seconds. It does not change UFW.

## TLS and DNS

The A record (Cloudflare DNS-only, proxy off, so HTTP-01 hits this host):

```
A  sse.pixtrela.ribermax.com.br  179.0.179.210
```

Certbot issued an ECDSA Let's Encrypt certificate for this name. Nginx redirects
HTTP to HTTPS and proxies to `127.0.0.1:8787` with buffering off. Renewal is
scheduled by Certbot. The deploy script skips Certbot when that certificate is
already present.

Public health check:

```bash
curl -fsS https://sse.pixtrela.ribermax.com.br/health
```

Loopback check on the VPS:

```bash
ssh pixtrela-vps 'curl -fsS http://127.0.0.1:8787/health'
```

## Vercel environment

Set these in production. Leave them empty in development to disable publishing.

| Variable | Value |
| --- | --- |
| `REALTIME_PUBLISH_URL` | `https://sse.pixtrela.ribermax.com.br/internal/publish` |
| `REALTIME_PUBLISH_SECRET` | Same as the server `.env` (not stored in git) |
| `REALTIME_JWT_SECRET` | Same as the server `.env` (not stored in git) |
| `NEXT_PUBLIC_REALTIME_SSE_URL` | `https://sse.pixtrela.ribermax.com.br` |

`REALTIME_PUBLISH_URL` is the public HTTPS path `POST /internal/publish`.

An empty `REALTIME_PUBLISH_URL` makes the app a no-op publisher. A failed
publish must not fail the user's action.
