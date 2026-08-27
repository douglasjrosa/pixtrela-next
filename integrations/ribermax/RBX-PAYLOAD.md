# RBX box template payload (Ribermax integration)

Contract for the legacy RBX calculator endpoint consumed by the Ribermax
plugin in the app (`integrations/ribermax/`). RBX sends preset names plus
structural quantities; the app resolves factory actions and effort time.

## HTTP contract (unchanged)

```
GET {baseUrl}/produtos?templateData={prodId}
Header: Token: <token configured in the app Settings → Integrations → Ribermax>
Accept: application/json
```

- `baseUrl` and `token` are stored in the the app database (not environment
  variables).
- the app client timeout: **55 seconds**.
- Response body must be valid JSON.

### Error responses

| Situation | Response |
|-----------|----------|
| Business error | HTTP 4xx/5xx + `{ "error": "message" }` |
| Success | HTTP 200 + payload below |

---

## Required payload shape

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

### Root fields

| Field | Type | Required | the app usage |
|-------|------|----------|----------------|
| `prodId` | `number` | yes | Becomes `template.code` (= RBX product id) |
| `empresaNome` | `string` | yes | Part of template name: `"{empresaNome} - {boxName}"` |
| `boxName` | `string` | yes | Part of template name |
| `subtasks` | `array` | yes | Explicit list of template subtasks |

### Each `subtasks[]` item

| Field | Type | Required | Semantics |
|-------|------|----------|-----------|
| `presetName` | `string` | yes | **Exact** name of a row in the app `sub_task_presets`. Match is case-sensitive after `.trim()`. |
| `qty` | `number \| string` | yes | Structural quantity of this subtask **in the template** (e.g. 2 laterals). Coerced to integer ≥ 1. |
| `actionUnits` | `number \| string` | yes | Atomic action units **per piece** (same value as the modal prompt when applying the preset manually in the app). Coerced to number; if ≤ 0 → `expected_time = 0`. |

Numbers may arrive as strings (legacy PHP serialization). the app parses them.

---

## What the app does with the payload

For each `subtasks[]` entry:

1. Look up preset by `presetName`.
   - Missing → import fails with `presetNotFound:<presetName>`.
2. Copy from preset: `sharingType`, `maxSameTimeWorkers`, `subTaskCategoryId`.
3. Compute template effort:
   ```
   template_sub_task.expected_time = round(preset.action.unit_time * actionUnits)
   ```
4. Apply dependency rules **inside the app** (RBX does not send dependencies).
5. When creating a task from the template:
   ```
   sub.qty = template.qty * task.qty
   sub.expected_time = round(template.expected_time * sub.qty)
   ```

**RBX does not know factory actions.** It only picks a preset by name and sends
`qty` + `actionUnits`. The action `unit_time` lives in the the app catalog.

---

## Removed fields (breaking change)

Do **not** send these anymore in `templateData` responses:

| Removed | Reason |
|---------|--------|
| `montagem[]` | Counts become `actionUnits` per preset |
| `base`, `lateral`, `cabeceira`, `tampa` | the app no longer infers subtasks from part presence |
| `info` (`qPes`, dimensions, etc.) | Not used for template import |
| Rates (`cutSeconds`, `adhesiveSeconds`, `fastenerSeconds`) | Effort calculation moved out of the app |
| Pre-computed `expected_time` | the app computes via preset + action |

The old import path breaks until PHP returns only the new shape.

---

## Migration guide (old PHP → new)

### Old behaviour (the app derived everything)

PHP sent physical structure + indexed `montagem` array:

```javascript
// montagem[0] = null
const MONTAGEM_CODE = {
  pe: 1,
  base: 2,
  lateralQuadros: 3,
  lateralChapa: 4,
  cabeceiraQuadros: 7,
  cabeceiraChapa: 8,
  tampaQuadros: 10,
  tampaChapa: 11,
};
```

the app applied fixed rates: `cutSeconds = 60`, `adhesiveSeconds = 30`,
`fastenerSeconds = 1`, and decided which subtasks to include based on whether
`base` / `lateral` / etc. were present.

### New behaviour (PHP decides everything)

PHP must:

1. **Include only applicable subtasks** (omit absent ones; do not send `qty: 0`).
2. Map each subtask to an existing the app `presetName`.
3. Set `actionUnits` to the atomic count **per piece** (not seconds).

### Reference table — standard compensado box

Canonical preset names (from the former the app mapper):

| presetName | Typical qty | Old PHP source |
|------------|-------------|----------------|
| `Corte dos pés da base` | 1 | if `base.pe` or `base.toco` exists |
| `Corte das tábuas da base` | 1 | if `base.tabua` exists |
| `Corte dos sarrafos da embalagem` | 1 | if `lateral` / `cabeceira` / `tampa` exists |
| `Corte das chapas das laterais` | 2 | if `lateral` exists |
| `Corte das chapas das cabeceiras` | 2 | if `cabeceira` exists |
| `Corte da chapa da tampa` | 1 | if `tampa` exists |
| `Montagem dos pés` | `max(1, info.qPes)` | `actionUnits = montagem[1]` (nails per foot) |
| `Montagem da base` | 1 | `actionUnits = montagem[2]` |
| `Montagem dos quadros das laterais` | 2 | `actionUnits = montagem[3]` (staples per lateral) |
| `Fixação das chapas das laterais` | 2 | `actionUnits = montagem[4]` |
| `Fixação dos adesivos das laterais` | 2 | `actionUnits = adhesives per lateral` (0–2: `fragil` + `adExtra`) |
| `Montagem dos quadros das cabeceiras` | 2 | `actionUnits = montagem[7]` |
| `Fixação das chapas das cabeceiras` | 2 | `actionUnits = montagem[8]` |
| `Fixação dos adesivos das cabeceiras` | 2 | `actionUnits = adhesives per headboard` |
| `Montagem dos quadros da tampa` | 1 | `actionUnits = montagem[10]` |
| `Fixação das chapas da tampa` | 1 | `actionUnits = montagem[11]` |
| `Fixação dos adesivos da tampa` | 1 | `actionUnits = adhesives on lid |

**Cut presets (`sharingType = duration`):** old fixed time was 60 seconds. Now:

```
actionUnits = round(desired_seconds / preset.action.unit_time)
```

Example: preset linked to action with `unit_time = 1.66` → for ~60 s,
`actionUnits ≈ 36`.

**Assembly / fastening presets (`sharingType = qty`):** `actionUnits` = raw value
from `montagem[code]` (staples, nails, etc.) **per piece**.

**Adhesives:** `actionUnits` = adhesive count **per piece** (1 or 2 when both
`fragil` and `adExtra` exist). Do not multiply by `qty` inside `actionUnits`;
`qty` already represents laterals / headboards / lid count.

---

## Extra-large variants

RBX picks a **different presetName** for XL parts, for example:

- `Fixar adesivo - Extra Grande`
- `Grampear quadro - Extra Grande`
- `Fechar caixa - Extra Grande`

The name must exist as a preset in the app. Matching is literal on the preset
name string.

---

## Subtask dependencies (the app-side only)

RBX does **not** send `dependencies`. the app applies them by preset name after
building the array:

| Subtask | Depends on |
|---------|------------|
| `Montagem dos pés` | `Corte dos pés da base` |
| `Montagem da base` | `Corte das tábuas da base`, `Montagem dos pés` |
| `Montagem dos quadros das laterais` | `Corte dos sarrafos da embalagem` |
| `Montagem dos quadros das cabeceiras` | `Corte dos sarrafos da embalagem` |
| `Montagem dos quadros da tampa` | `Corte dos sarrafos da embalagem` |
| `Fixação das chapas das laterais` | `Montagem dos quadros das laterais`, `Corte das chapas das laterais` |
| `Fixação das chapas das cabeceiras` | `Montagem dos quadros das cabeceiras`, `Corte das chapas das cabeceiras` |
| `Fixação das chapas da tampa` | `Montagem dos quadros da tampa`, `Corte da chapa da tampa` |
| `Fixação dos adesivos das laterais` | `Fixação das chapas das laterais` |
| `Fixação dos adesivos das cabeceiras` | `Fixação das chapas das cabeceiras` |

Dependencies resolve by **index in `subtasks`**. If a predecessor is omitted,
that dependency link is skipped silently. Include predecessors when the
dependency graph must stay intact.

---

## Full example

```json
{
  "prodId": 45678,
  "empresaNome": "Cliente ABC",
  "boxName": "Caixa Exportação 120x80",
  "subtasks": [
    { "presetName": "Corte dos pés da base", "qty": 1, "actionUnits": 1 },
    { "presetName": "Corte das tábuas da base", "qty": 1, "actionUnits": 1 },
    { "presetName": "Corte dos sarrafos da embalagem", "qty": 1, "actionUnits": 36 },
    { "presetName": "Corte das chapas das laterais", "qty": 2, "actionUnits": 1 },
    { "presetName": "Corte das chapas das cabeceiras", "qty": 2, "actionUnits": 1 },
    { "presetName": "Corte da chapa da tampa", "qty": 1, "actionUnits": 1 },
    { "presetName": "Montagem dos pés", "qty": 4, "actionUnits": 8 },
    { "presetName": "Montagem da base", "qty": 1, "actionUnits": 12 },
    { "presetName": "Montagem dos quadros das laterais", "qty": 2, "actionUnits": 30 },
    { "presetName": "Fixação das chapas das laterais", "qty": 2, "actionUnits": 15 },
    { "presetName": "Fixação dos adesivos das laterais", "qty": 2, "actionUnits": 2 },
    { "presetName": "Montagem dos quadros das cabeceiras", "qty": 2, "actionUnits": 28 },
    { "presetName": "Fixação das chapas das cabeceiras", "qty": 2, "actionUnits": 14 },
    { "presetName": "Montagem dos quadros da tampa", "qty": 1, "actionUnits": 25 },
    { "presetName": "Fixação das chapas da tampa", "qty": 1, "actionUnits": 10 }
  ]
}
```

With action `Grampear quadro` (`unit_time = 1.00`) and `actionUnits = 30` →
`expected_time = 30` on the template row. With `qty = 2` on the task →
`expected_time = 60` on the task subtask.

---

## PHP implementation checklist

1. Change the `?templateData={prodId}` handler to return **only** the new JSON.
2. Move “which subtasks exist” logic from the app into PHP (from calculated
   parts).
3. Map `montagem[]` counts into `actionUnits` for the matching preset.
4. Ensure every `presetName` exists in the app (`sub_task_presets` seed +
   tenant presets).
5. Handle XL variants by choosing an alternate `presetName`.
6. Keep `prodId`, `empresaNome`, `boxName` as today.
7. Test via CRM webhook import or `ensureTemplateTaskForProdId(prodId)` in
   the app.

---

## the app reference files

| File | Purpose |
|------|---------|
| `integrations/ribermax/rbx/rbx-types.ts` | Payload TypeScript types |
| `integrations/ribermax/box/template-from-box.ts` | Consumption and time math |
| `integrations/ribermax/box/template-subtask-dependencies.ts` | Dependency graph |
| `integrations/ribermax/rbx/rbx-client.ts` | HTTP client + validation |
| `integrations/ribermax/README.md` | Short integration overview |
| `lib/actions/default-actions.ts` | Factory action catalog (`unit_time`) |
