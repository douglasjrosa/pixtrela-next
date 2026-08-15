/**
 * Migration tracker: Strapi → Drizzle (complete).
 * Runtime Strapi DAL removed; use `scripts/etl-from-strapi.ts` only for one-time cutover ETL.
 */

| Domain | Next target | Status |
|--------|-------------|--------|
| Auth / identify | Auth.js + `lib/repos/users`, `lib/repos/kiosk` | done |
| Kiosk | `lib/repos/kiosk-subtasks`, `lib/kiosk/*` | done |
| Dashboard | `lib/dashboard/*` | done |
| Profile | profile actions + `lib/repos/users` | done |
| Balances / exchange | `lib/repos/balances`, `lib/repos/exchanges` | done |
| Tasks / board / sub-tasks | `lib/repos/tasks`, Server Actions | done |
| Awards / steps / settings | `lib/repos/*`, settings loaders | done |
| Teams / templates | `lib/repos/teams`, `lib/repos/templates` | done |
| Sub-task presets | `lib/repos/sub-task-presets` | done |
| Media | `lib/media/*`, `/api/media`, `/api/media-proxy` | done |
| ETL | `scripts/etl-from-strapi.ts` | archival CLI |

## Completion gate

All domains pass when:

1. Pure rules live in `lib/domain` with Vitest.
2. Persistence goes through `lib/repos`.
3. No `strapiFetch` or `lib/strapi/*` imports in application code.
4. `npm test` and `npm run build` succeed on `dev`.
