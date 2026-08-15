/**
 * Live migration tracker: Strapi custom routes / lifecycles → Drizzle.
 * Update Status as each domain clears the gate (no :1337 calls + e2e).
 */

| Strapi source | Next target | Tests | Status |
|---------------|-------------|-------|--------|
| `auth-identify/*` | `lib/repos/kiosk` + login actions | domain + e2e kiosk | done |
| `kiosk/*` | `lib/repos/kiosk-subtasks`, `lib/kiosk/*` | integration + e2e kiosk | done |
| `dashboard/*` | `lib/dashboard/*` Drizzle SQL | monthly ranking dual-path | done |
| `profile/*` | profile actions + repos/users | dual-path | done |
| `balances/me/current` | `lib/repos/balances` | integration + private-home | done |
| `exchange` create | `lib/repos/exchanges.redeemAward` | integration | done |
| `task` find/findOne | `lib/repos/tasks` + load-task-list | dual-path | done |
| lifecycle `activity` | `recordActivity` → kiosk start/stop + work-currency | domain + integration | done |
| lifecycle `sub-task` / `task` | createTask template copy | integration | done |
| awards / steps / settings | repos + settings pages | dual-path | done |
| teams / templates | repos + app actions | dual-path | done |
| media upload | `lib/media/*`, `/api/media` | dual-path | done |
| ETL users | `scripts/etl-from-strapi.ts` | CLI | done |

## Gates

A domain is **done** when:

1. Pure rules live in `lib/domain` with Vitest.
2. Persistence goes through `lib/repos` (transactions where Strapi used lifecycles).
3. UI/Server Actions do not call `strapiFetch` for that domain.
4. E2E for the path passes with `DATA_BACKEND=drizzle` and `AUTH_STRAPI_FALLBACK=0`.

## Harness

- `lib/strapi/migration-guard.ts` — `assertStrapiAllowed(domain)` throws when domain is marked migrated and Strapi is disabled.
- Migrated domains listed in `MIGRATED_DOMAINS`.
