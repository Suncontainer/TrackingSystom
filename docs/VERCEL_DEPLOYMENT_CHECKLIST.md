# Vercel Deployment Checklist

## Status

The application code is ready to deploy, but production cannot be fully completed from the repository alone. The remaining steps require access to Vercel, Supabase, DNS, Resend, Turnstile, Upstash, and Sentry accounts.

Temporary hardcoded admin login and demo admin data are currently enabled for live testing. Disable or environment-gate both before real customer traffic.

## Required External Inputs

- Vercel team and project.
- Vercel plan, including cron frequency support decision.
- Production domain: `tracking.suncontainer.de`.
- DNS access for `suncontainer.de`.
- Supabase project in an EU region.
- Initial Supabase Auth super-admin user.
- Employee names, emails, and roles.
- Resend account and verified sender domain.
- Reply-to mailbox.
- SPF, DKIM, and DMARC DNS records.
- Resend webhook secret.
- Cloudflare Turnstile site key and secret for the production hostname.
- Upstash Redis REST URL and token.
- Sentry DSN and auth token.
- Final privacy-policy and retention approvals.

## Vercel Project

1. Import `Suncontainer/TrackingSystom`.
2. Set framework preset to Next.js.
3. Confirm install command uses the package manager from `packageManager`: `pnpm install`.
4. Confirm build command: `npm run build` or `pnpm build`.
5. Confirm region `fra1` from `vercel.json`.
6. Add `tracking.suncontainer.de` as the production domain.
7. Confirm HTTPS is active.

## Environment Variables

Set these in Vercel production:

```text
NODE_ENV=production
VERCEL_ENV=production
NEXT_PUBLIC_APP_URL=https://tracking.suncontainer.de
NEXT_PUBLIC_MAIN_SITE_URL=https://suncontainer.de
APP_DEFAULT_LOCALE=de
TRACKING_LINK_SECRET=<strong random secret>
CRON_SECRET=<strong random secret>
NEXT_PUBLIC_SUPABASE_URL=<supabase project url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase publishable key>
SUPABASE_SECRET_KEY=<supabase service role key>
DATABASE_URL=<supabase pooled connection string>
DATABASE_DIRECT_URL=<supabase direct connection string>
RESEND_API_KEY=<resend production key>
RESEND_WEBHOOK_SECRET=<resend webhook signing secret>
EMAIL_FROM=Sun Container <tracking@updates.suncontainer.de>
EMAIL_REPLY_TO=<monitored reply-to address>
EMAIL_MODE=production
UPSTASH_REDIS_REST_URL=<upstash rest url>
UPSTASH_REDIS_REST_TOKEN=<upstash rest token>
NEXT_PUBLIC_TURNSTILE_SITE_KEY=<turnstile site key>
TURNSTILE_SECRET_KEY=<turnstile secret key>
SENTRY_DSN=<sentry dsn>
SENTRY_AUTH_TOKEN=<sentry auth token>
```

## Supabase

1. Create the project in the chosen EU region.
2. Disable public sign-ups.
3. Add auth redirect URLs for local, preview, and production.
4. Run migrations with `DATABASE_DIRECT_URL`.
5. Create the first Supabase Auth user.
6. Run `pnpm admin:create` with the real auth user ID.
7. Verify RLS remains enabled on business tables.

## Resend

1. Verify the approved sending subdomain.
2. Add SPF, DKIM, and DMARC records.
3. Configure webhook URL: `https://tracking.suncontainer.de/api/webhooks/resend`.
4. Subscribe to sent, delivered, bounced, complained, and delayed events.
5. Copy the webhook signing secret into `RESEND_WEBHOOK_SECRET`.
6. Send a production test email to an internal address first.

## Cron

The outbox processor route is:

```text
GET /api/cron/process-email-outbox
Authorization: Bearer <CRON_SECRET>
```

Vercel Hobby does not support every-five-minute cron jobs. Choose one:

- Upgrade the Vercel plan and add a frequent cron schedule.
- Use a daily Vercel Hobby cron.
- Use an external scheduler with the bearer secret.

## Smoke Tests

Run after production deployment:

1. Open `https://tracking.suncontainer.de/robots.txt` and confirm all crawling is disallowed.
2. Check response headers include `X-Robots-Tag: noindex, nofollow`.
3. Confirm HTTPS and HSTS on production.
4. Log in to `/admin/login` with a real Supabase admin user.
5. Create a customer order.
6. Confirm the customer confirmation email and salesperson email are queued.
7. Process the outbox and confirm Resend delivery.
8. Open the signed tracking link from the email.
9. Search manually with order/tracking reference plus customer email.
10. Move through all four statuses.
11. Confirm mandatory status emails queue.
12. Trigger a test bounce and confirm suppression.
13. Correct the email address and retry through `/admin/emails`.
14. Verify Sentry receives a test server error without cookies, auth headers, or request bodies.
15. Confirm no PII appears in browser console logs.

## Rollback

1. Disable cron or external scheduler.
2. Roll back to the previous successful Vercel deployment.
3. Verify `/api/health`, `/admin/login`, and `/`.
4. Review `email_outbox` before re-enabling the processor.
5. Use Supabase point-in-time recovery only for database corruption or destructive mistakes.
