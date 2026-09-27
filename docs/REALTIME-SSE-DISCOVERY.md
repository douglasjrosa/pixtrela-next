# SSE hub: VPS discovery (read-only)

Inspected with `ssh pixtrela-vps` only. Nothing was installed or changed.
Later deploy should use that same SSH alias.

## Recommended HTTPS hostname

`https://sse.pixtrela.ribermax.com.br`

This name has no DNS A record yet. Add an A record to the same address as the
existing vhosts (`db`, `webmin`, and `strapi` all resolve to `179.0.179.210`),
then issue a certificate with the host's existing Certbot nginx plugin.

Do not reuse the live names below. They already reverse-proxy other services
(Adminer on `127.0.0.1:8080`, Webmin on `127.0.0.1:10000`). `strapi` has a
certificate but no enabled Nginx site.

Public app names (`pixtrela.com`, `pixtrela.com.br`) have no A/CNAME here and
are not suitable for the VPS hub. HTTPS pages must call this hub over HTTPS.

## Proxy

Nginx is the reverse proxy (`nginx` active, listening on `0.0.0.0:80` and
`:443`). Caddy is not installed. Enabled sites:

| server_name | TLS cert | Upstream |
| --- | --- | --- |
| `db.pixtrela.ribermax.com.br` | Let's Encrypt | `http://127.0.0.1:8080` |
| `webmin.pixtrela.ribermax.com.br` | Let's Encrypt | `http://127.0.0.1:10000` |

HTTP on those names redirects to HTTPS (`return 301`), then a Certbot stub
returns 404. There is no SSE location yet. For the new site, turn buffering
off and raise `proxy_read_timeout` (the db vhost uses `300` today).

## TLS

Let's Encrypt via Certbot 5.8.0, nginx authenticator and installer, ECDSA
keys, ACME `https://acme-v02.api.letsencrypt.org/directory`.

Live cert names:

- `db.pixtrela.ribermax.com.br` (also lists `webmin` in one cert)
- `webmin.pixtrela.ribermax.com.br`
- `strapi.pixtrela.ribermax.com.br`

Issue the SSE cert the same way after the A record exists. Do not invent a
second TLS stack.

## Port 443

Open. UFW is active (default deny incoming) and allows `443/tcp` (and `80/tcp`)
from anywhere. Nginx is bound to 443 on IPv4 and IPv6.

Also allowed today: `22/tcp`, `5432/tcp`, `5433/tcp`. Leave those as they are.

## Constraint

Do not open `6379` in UFW. Redis was not listening at inspection time. When
the realtime compose is added, publish Redis only on `127.0.0.1:6379`. Publish
the Node hub only on localhost and let Nginx be the public TLS endpoint.

Docker at inspection time: `pixtrela-postgres-prod` (`0.0.0.0:5432`),
`pixtrela-postgres-dev` (`0.0.0.0:5433`), `pixtrela-adminer`
(`127.0.0.1:8080`). No realtime or Redis container.
