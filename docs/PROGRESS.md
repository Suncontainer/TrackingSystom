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
| Phase 6 - Email Templates and Outbox | Complete | 2026-06-14 |
| Phase 7 - Webhooks and Delivery Monitoring | Complete | 2026-06-14 |
| Phase 8 - Optional Emails | Not started | - |
| Phase 9 - Dashboard and Operational Polish | Partial | - |
| Phase 10 - Security, Monitoring and Production Readiness | Not started | - |
| Phase 11 - Vercel Deployment | Not started | - |

## Current Phase

Phase 7 added verified Resend webhook processing, event deduplication, delivery/bounce/complaint status mapping, hard-bounce suppression creation, and authorized retry controls on the admin email history page. The out-of-order Phase 9 dashboard slice remains complete, but the rest of Phase 9 is still pending.

## Validation Results

- `pnpm lint` - passed.
- `pnpm typecheck` - passed.
- `pnpm test` - passed. 15 test files, 54 tests.
- `pnpm db:generate` - passed. No schema changes after the initial migration.
- `pnpm db:validate:phase1` - passed against disposable local PostgreSQL on port `55432`.
- `pnpm db:seed` - passed against the same disposable local PostgreSQL database using a seeded Supabase Auth user ID.
- `npm run build` - passed. Public root, lookup API, `/track/[token]`, email cron route, and admin routes are dynamic.

## Known Blockers

- `DATABASE_URL` and `DATABASE_DIRECT_URL` are not configured for a real Supabase project.
- Supabase Auth URL and publishable key are not configured for a real project.
- Supabase public sign-ups must be disabled manually in the Supabase dashboard before production.
- Phase 3 order creation was validated through type-safe unit coverage and production build only; live create/update/note transactions were not exercised against a configured Supabase/PostgreSQL environment in this phase.
- Phase 4 workflow transactions were validated through unit coverage, type checking, linting, and production build only; live status/date/archive writes still need a configured Supabase/PostgreSQL environment.
- Phase 5 public lookup transactions were validated through unit coverage, type checking, linting, and production build only; live lookup, Turnstile, Upstash rate limiting, and lookup-attempt writes still need configured Supabase/PostgreSQL, Cloudflare Turnstile, and Upstash credentials.
- Phase 6 outbox behavior was validated through unit coverage, type checking, linting, and production build only; live delivery still needs a configured Supabase/PostgreSQL database, Resend credentials, sender DNS, `CRON_SECRET`, `TRACKING_LINK_SECRET`, and `NEXT_PUBLIC_APP_URL`.
- Phase 7 webhook behavior was validated through unit coverage, type checking, linting, and production build only; live webhook verification still needs the real Resend webhook secret and provider-side webhook configuration.
- Vercel Hobby does not allow the every-5-minute cron schedule from the original specification. The cron route exists, but scheduled execution must be handled manually, by a daily Hobby cron, or by upgrading the Vercel plan.
- The dashboard page is ready, but the wider Phase 9 scope still needs responsive admin navigation refinements, broader loading/error-state polish, and final accessibility/brand review.
- Production credentials and vendor accounts are not available yet.

## Next Phase

Phase 8 - Optional Emails.

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
