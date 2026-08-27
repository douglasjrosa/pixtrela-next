# Ribermax integration (plugin)

Import of CRM `pedido` rows into core tasks and box templates from the
legacy RBX calculator. This is a **tenant plugin**, not the product core.

Code lives under `integrations/ribermax/`. Connection credentials are stored
in the database and edited at `/settings/integrations/ribermax` (RBX URL +
token) and `/settings/integrations/crm` (webhook HMAC secret). There are no
environment variables for this plugin.

RBX does not know factory actions. It sends preset names plus structural
`qty` and per-piece `actionUnits`. The app looks up the preset, reads
`action.unit_time`, and stores
`template_sub_tasks.expected_time = round(actionUnits * unit_time)`.

Extra-large variants are distinct preset names chosen by RBX (for example
`Fixar adesivo - Extra Grande`). Keep preset names unique in practice even
though the database does not enforce uniqueness.

## Box template payload

`GET {baseUrl}/produtos?templateData={prodId}` with header `Token`.

```json
{
  "prodId": 123,
  "empresaNome": "Max Brasil",
  "boxName": "Caixotona",
  "subtasks": [
    {
      "presetName": "Montagem dos quadros das laterais",
      "qty": 2,
      "actionUnits": 30
    }
  ]
}
```

Unknown `presetName` fails the import (`presetNotFound:<name>`).

## Webhook

`POST /api/webhooks/crm-pedido` (legacy URL used by CRM today)

`POST /api/integrations/ribermax/crm-pedido` (canonical)

Header: HMAC-SHA256 of the raw JSON body, `sha256=<hex>`
(see `CRM_SIGNATURE_HEADER` in the route). Secret comes from
`/settings/integrations/crm`.

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

1. CRM fires webhook on `pedido` create/update when `Bpedido` is set.
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
HMAC secret saved in Settings → Integrations → CRM.
