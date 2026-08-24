# Ribermax integration (plugin)

Import of CRM `pedido` rows into core tasks and box templates from the
legacy RBX calculator. This is a **tenant plugin**, not the product core.

Code lives under `integrations/ribermax/`. Time rates (cut / adhesive /
fastener seconds) are edited at `/settings/integrations/ribermax`.

They apply only to **new** templates. Existing templates and tasks do not
change.

## Environment

| Variable | Description |
|----------|-------------|
| `CRM_WEBHOOK_SECRET` | HMAC secret (must match the CRM webhook secret) |
| `LEGACY_RBX_URL` / `LEGACY_RBX_TOKEN` | Box template API (`prodId`) |

## Webhook

`POST /api/webhooks/crm-pedido` (legacy URL used by CRM today)

`POST /api/integrations/ribermax/crm-pedido` (canonical)

Header: HMAC-SHA256 of the raw JSON body, `sha256=<hex>`
(see `CRM_SIGNATURE_HEADER` in the route).

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
2. Plugin validates signature and payload schema.
3. For each item: ensure `template-task` for `prodId` (legacy RBX if missing).
4. **Create** task when `crmItemKey` (`pedidoId:index`) does not exist.
5. **Update** existing task fields `name`, `qty`, `deliveryDate` only.
6. Template subtasks are copied from the template on first create.
7. `revalidateTag(drizzle:tasks)` invalidates board/tasks cache when tasks change.

Duplicate webhooks upsert via `crmItemKey`. Items removed in CRM are **not**
auto-deactivated.

## CRM configuration

Point the CRM lifecycle at `POST /api/webhooks/crm-pedido` with the same
HMAC secret as `CRM_WEBHOOK_SECRET`.

## Local testing

```bash
node -e "const c=require('crypto');const b=JSON.stringify({pedidoId:1,Bpedido:'B-1',itens:[{Qtd:1,prodId:2,nomeProd:'X'}],empresaNome:'Test'});console.log(c.createHmac('sha256',process.env.CRM_WEBHOOK_SECRET).update(b).digest('hex'))"

curl -X POST <APP_ORIGIN>/api/webhooks/crm-pedido \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer unused" \
  -H "X-Webhook-Signature: sha256=<hex>" \
  -d '{"pedidoId":1,"Bpedido":"B-1","itens":[{"Qtd":1,"prodId":2,"nomeProd":"X"}],"empresaNome":"Test"}'
```

Use the HMAC header name implemented in the webhook route, not the placeholder above.
