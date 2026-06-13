# Testing

## Commands

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

## Unit Tests

Unit tests use Vitest and live in `tests/unit`.

## End-to-End Tests

E2E tests use Playwright and live in `tests/e2e`. Phase 0 includes a public-shell smoke test. Later phases add authenticated and tracking workflows.

## Database Tests

Phase 1 includes schema and migration SQL tests that do not require live credentials.

Live migration, transaction, and unique-constraint checks can be run with:

```bash
PHASE1_DATABASE_URL=postgres://... pnpm db:validate:phase1
```

The Phase 1 local run used a disposable PostgreSQL 16 container and passed migration, RLS, unique-constraint, and transaction validation.

For real environments, use either:

- A Supabase development database with `DATABASE_URL` and `DATABASE_DIRECT_URL`.
- Or an unpaused local PostgreSQL environment compatible with the Supabase `auth` schema expectation.

Development seed data also requires `SEED_SUPER_ADMIN_AUTH_USER_ID` to point to an existing Supabase Auth user.

## Turnstile

Use Cloudflare Turnstile test keys for automated browser tests once public lookup is implemented.

## Email

Use `EMAIL_MODE=log` locally and `EMAIL_MODE=sandbox` for preview deployments. Preview environments must never send real customer email.

## CI

The initial CI workflow runs install, lint, typecheck, unit tests, and build.
