# CRM pedidos webhook (Ribermax → Pixtrela)

Real-time import of CRM `pedido` rows into Pixtrela tasks via webhook push from
sys-rbx-backend when `Bpedido` is set or relevant fields change.

## Environment variables (Next.js)

| Variable | Description |
|----------|-------------|
| `CRM_WEBHOOK_SECRET` | Shared HMAC secret (must match `PIXTRELA_WEBHOOK_SECRET` on CRM) |
| `STRAPI_SYNC_API_TOKEN` | Pixtrela Strapi API token with write access (see below) |
| `LEGACY_RBX_URL` / `LEGACY_RBX_TOKEN` | Legacy box template API (subtasks by `prodId`) |

## Pixtrela Strapi API token

Create a **Full access** or custom API token in Pixtrela Strapi admin with:

- `task`: find, findOne, create, update
- `template-task`: find, findOne, create, update
- `step`: find (read default queue step)

Store as `STRAPI_SYNC_API_TOKEN` on Vercel / server env. Never expose to the browser.

## Webhook endpoint

`POST /api/webhooks/crm-pedido`

Header: `X-Pixtrela-Signature: sha256=<hmac-hex>` (HMAC-SHA256 of the raw JSON body).

### Payload

```json
{
  "pedidoId": 123,
  "Bpedido": "B-456",
  "itens": [],
  "dataEntrega": "2026-07-15",
  "empresaNome": "Cliente X"
}
```

## Behaviour

1. CRM Strapi (sys-rbx-backend) fires webhook on `pedido` create/update when `Bpedido` is set.
2. Pixtrela validates signature and payload schema.
3. For each item: ensure `template-task` for `prodId` (legacy RBX if missing).
4. **Create** task when `crmItemKey` (`pedidoId:index`) does not exist.
5. **Update** existing task fields `name`, `qty`, `deliveryDate` only (no step/status/subtask changes).
6. Strapi task `afterCreate` lifecycle copies template subtasks on first create.
7. `revalidateTag(strapi:tasks)` invalidates board/tasks cache when tasks change.

## Idempotency

Duplicate webhooks (same pedido edited twice) upsert safely via `crmItemKey`. Tasks removed
from a pedido in CRM are **not** auto-deactivated; managers handle that in Pixtrela.

## CRM configuration

See [sys-rbx-backend/docs/pixtrela-webhook.md](../../sys-rbx-backend/docs/pixtrela-webhook.md).

| CRM env | Description |
|---------|-------------|
| `PIXTRELA_WEBHOOK_URL` | e.g. `https://app.pixtrela.com.br/api/webhooks/crm-pedido` |
| `PIXTRELA_WEBHOOK_SECRET` | Same value as `CRM_WEBHOOK_SECRET` |

## Rollout

1. Deploy Pixtrela with webhook route and `CRM_WEBHOOK_SECRET`.
2. Test with signed `curl` before enabling CRM lifecycle.
3. Deploy sys-rbx-backend with lifecycle + webhook env vars.
4. Remove legacy polling (`BoardCrmSync`) — already removed in this migration.

## Optional historical backfill

Pedidos with `Bpedido` created before webhooks were enabled can be imported manually:

1. Export pedidos from CRM admin or use a one-off script.
2. POST each payload to `/api/webhooks/crm-pedido` with a valid signature.
3. Upsert is idempotent; existing `crmItemKey` rows are updated, not duplicated.

## Database cleanup

After deploy, the obsolete `crm_syncs` table (former single type) may be dropped manually:

```sql
DROP TABLE IF EXISTS crm_syncs;
```

## Local testing

```bash
# Generate signature (Node)
node -e "const c=require('crypto');const b=JSON.stringify({pedidoId:1,Bpedido:'B-1',itens:[{Qtd:1,prodId:2,nomeProd:'X'}],empresaNome:'Test'});console.log(c.createHmac('sha256',process.env.CRM_WEBHOOK_SECRET).update(b).digest('hex'))"

curl -X POST http://localhost:3000/api/webhooks/crm-pedido \
  -H "Content-Type: application/json" \
  -H "X-Pixtrela-Signature: sha256=<hex>" \
  -d '{"pedidoId":1,"Bpedido":"B-1","itens":[{"Qtd":1,"prodId":2,"nomeProd":"X"}],"empresaNome":"Test"}'
```
