# Ribermax integration (plugin)

Box templates from the legacy RBX calculator. This is a **tenant plugin**,
not the product core.

Code lives under `integrations/ribermax/`. Connection credentials are stored
in the database and edited at `/settings/integrations/ribermax` (RBX URL +
token) and `/settings/integrations/crm` (API secret). There are no
environment variables for this plugin.

RBX does not know factory actions. It sends preset names (and optional
`presetId`) plus structural `qty` and per-piece `actionUnits`. The app looks
up the preset, reads `action.unit_time`, and stores
`template_sub_tasks.expected_time = round(actionUnits * unit_time)`.

## RBX catalog (read-only)

`GET /api/integrations/ribermax/sub-task-presets` with header `Token`.

## Box template payload

`GET {baseUrl}/produtos?templateData={prodId}` with header `Token`.

See [RBX-PAYLOAD.md](./RBX-PAYLOAD.md) for the full PHP migration contract.

## CRM tasks API (core)

CRM creates/updates production tasks through the core REST API:

- `POST /api/tasks` (header `Token` = CRM API secret)
- `GET|PATCH /api/tasks/[id]`
- `GET|POST /api/templates/tasks` and `GET|PATCH|DELETE /api/templates/tasks/[id]`

Template resolution for new tasks:

1. Ancestral template with subtasks from `versions` (newest → oldest) → clone
2. Existing template for the current code (including empty shell) → reuse
3. Create from the `template` payload snapshot

Manual reset from RBX remains available via **Resetar modelo** on
template/task forms (fills the form only; save is explicit).
