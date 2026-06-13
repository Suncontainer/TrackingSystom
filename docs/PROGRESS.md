# Progress

## Phase Checklist

| Phase | Status | Completed |
| --- | --- | --- |
| Phase 0 - Repository and Documentation | Complete | 2026-06-13 |
| Phase 1 - Database Foundation | Complete | 2026-06-13 |
| Phase 2 - Authentication and Authorization | Complete | 2026-06-13 |
| Phase 3 - Order and Customer Management | Complete | 2026-06-13 |
| Phase 4 - Status and Delivery Date Workflow | Complete | 2026-06-13 |
| Phase 5 - Public Tracking Portal | Complete | 2026-06-13 |
| Phase 6 - Email Templates and Outbox | Not started | - |
| Phase 7 - Webhooks and Delivery Monitoring | Not started | - |
| Phase 8 - Optional Emails | Not started | - |
| Phase 9 - Dashboard and Operational Polish | Partial | - |
| Phase 10 - Security, Monitoring and Production Readiness | Not started | - |
| Phase 11 - Vercel Deployment | Not started | - |

## Current Phase

Phase 5 added the public tracking portal. After that, an out-of-order Phase 9 dashboard slice was completed: `/admin` now shows role-scoped operational metrics, overdue and due-soon order alerts, failed mandatory-email warnings, recent status changes, period selection, and a quick create-order action. The rest of Phase 9 remains incomplete.

## Validation Results

- `pnpm lint` - passed.
- `pnpm typecheck` - passed.
- `pnpm test` - passed. 11 test files, 43 tests.
- `pnpm db:generate` - passed. No schema changes after the initial migration.
- `pnpm db:validate:phase1` - passed against disposable local PostgreSQL on port `55432`.
- `pnpm db:seed` - passed against the same disposable local PostgreSQL database using a seeded Supabase Auth user ID.
- `pnpm build` - passed. Public root, lookup API, `/track/[token]`, and admin routes are dynamic.

## Known Blockers

- `DATABASE_URL` and `DATABASE_DIRECT_URL` are not configured for a real Supabase project.
- Supabase Auth URL and publishable key are not configured for a real project.
- Supabase public sign-ups must be disabled manually in the Supabase dashboard before production.
- Phase 3 order creation was validated through type-safe unit coverage and production build only; live create/update/note transactions were not exercised against a configured Supabase/PostgreSQL environment in this phase.
- Phase 4 workflow transactions were validated through unit coverage, type checking, linting, and production build only; live status/date/archive writes still need a configured Supabase/PostgreSQL environment.
- Phase 5 public lookup transactions were validated through unit coverage, type checking, linting, and production build only; live lookup, Turnstile, Upstash rate limiting, and lookup-attempt writes still need configured Supabase/PostgreSQL, Cloudflare Turnstile, and Upstash credentials.
- The dashboard page is ready, but the wider Phase 9 scope still needs responsive admin navigation refinements, broader loading/error-state polish, and final accessibility/brand review.
- Production credentials and vendor accounts are not available yet.

## Next Phase

Phase 6 - Email Templates and Outbox.

## Manual Setup Still Required

- Supabase organization/project and EU region.
- Initial super-admin email.
- Supabase Auth user ID for `SEED_SUPER_ADMIN_AUTH_USER_ID` before running development seed data.
- Optional Supabase Auth user IDs for seeded admin, sales, and read-only profiles.
- Existing Supabase Auth user ID and profile details before running `pnpm admin:create`.
- A configured Supabase/PostgreSQL environment before manually validating live order creation, edits, and note/audit persistence.
- Vercel team/project and plan.
- DNS access for `suncontainer.de`.
- Resend account, sender domain, DNS records, and webhook secret.
- Cloudflare Turnstile site and secret keys.
- Upstash Redis REST credentials.
- Final privacy-policy text and retention policy.
