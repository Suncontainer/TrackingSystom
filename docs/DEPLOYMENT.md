# Deployment

## Overview

Primary deployment target: `https://tracking.suncontainer.de` on Vercel, with Supabase Auth, Supabase PostgreSQL, Resend, Upstash Redis, Cloudflare Turnstile, and Sentry.

## Local

1. Install dependencies with `pnpm install`.
2. Copy `.env.example` to `.env.local`.
3. Keep `EMAIL_MODE=log`.
4. Run `pnpm dev`.

## Supabase

Phase 1 adds Drizzle migrations. Production requires:

- EU Supabase project.
- Auth public sign-up disabled.
- Redirect URLs for local, preview, and production.
- Transaction-pooler runtime `DATABASE_URL`.
- Direct migration `DATABASE_DIRECT_URL`.

## Vercel

1. Create a Vercel project.
2. Set production environment variables.
3. Configure `tracking.suncontainer.de`.
4. Confirm HTTPS.
5. Verify `fra1` region and cron support for the selected plan.

## Migrations

Migrations are implemented with Drizzle Kit in `src/db/migrations`.

Use the direct database URL for migrations:

```bash
DATABASE_DIRECT_URL=... pnpm db:migrate
```

Run migrations only against the intended environment. The initial migration expects a Supabase-compatible PostgreSQL database with the `auth.users` table.

For local migration validation without Supabase, `pnpm db:validate:phase1` creates an `auth.users` stub in a disposable validation database before applying the migration.

## Cron

`vercel.json` defines `/api/cron/process-email-outbox` every five minutes. The route is implemented in Phase 6 and must require `CRON_SECRET`.

## Rollback

Before launch, document the Vercel rollback target and database rollback/restore procedure for the selected Supabase project.

## Production Smoke Test

Use the checklist in `SUN_CONTAINER_TRACKING_PROJECT.md` section 41.4 before launch.
