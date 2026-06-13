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
6. Confirm response headers include CSP, HSTS, noindex, and nofollow.

## Migrations

Migrations are implemented with Drizzle Kit in `src/db/migrations`.

Use the direct database URL for migrations:

```bash
DATABASE_DIRECT_URL=... pnpm db:migrate
```

Run migrations only against the intended environment. The initial migration expects a Supabase-compatible PostgreSQL database with the `auth.users` table.

For local migration validation without Supabase, `pnpm db:validate:phase1` creates an `auth.users` stub in a disposable validation database before applying the migration.

## Cron

`/api/cron/process-email-outbox` is implemented and requires `Authorization: Bearer <CRON_SECRET>`.

Vercel Hobby rejects the original every-five-minute schedule, so `vercel.json` intentionally does not include a cron entry. Use one of these before launch:

- Upgrade to a Vercel plan that supports the desired frequency and add the cron.
- Use a daily Hobby cron if acceptable.
- Use an external scheduler that calls the route with the bearer secret.
- Manually invoke the route only for testing.

## Rollback

Application rollback:

1. Use the previous successful Vercel deployment from the project dashboard.
2. Confirm `/api/health`, `/admin/login`, and `/track/[token]` after rollback.

Database rollback:

1. Stop cron/external schedulers before database restore.
2. Use Supabase backup or point-in-time recovery for destructive database incidents.
3. Re-run smoke tests after restore.
4. Re-enable cron only after email outbox state has been reviewed.

## Production Smoke Test

Use the detailed [Vercel deployment checklist](VERCEL_DEPLOYMENT_CHECKLIST.md) during launch.

Before launch:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `npm run build`
- `VERCEL_ENV=production npm run build`
- `pnpm audit --audit-level high`

After deployment:

- HTTPS works on `tracking.suncontainer.de`.
- `X-Robots-Tag` and `robots.txt` confirm noindex/nofollow.
- Admin login works with real Supabase credentials.
- Customer lookup works with Turnstile and rate limiting.
- Mandatory email sends through Resend.
- Resend delivery webhook updates email history.
- Failed email retry works after correcting an address.
- No PII appears in browser console logs or client-visible errors.
