# Security

## Access Model

Customers do not have accounts in the MVP. Public lookup must require order/tracking reference plus email, or a signed secure tracking link.

Employees authenticate through Supabase Auth. Application roles are:

- `SUPER_ADMIN`
- `ADMIN`
- `SALES`
- `READ_ONLY`

Every protected operation must validate authorization on the server.

## Public Lookup Protection

Phase 5 implements:

- Generic lookup errors.
- Turnstile verification.
- IP and identifier/email rate limits.
- Hashed lookup-attempt logging.
- No-store responses.
- No public exposure of internal notes, staff data, audit history, email logs, or UUIDs.

## Secret Management

Secrets live only in environment variables. They must not be committed, exposed to client bundles, logged, or placed in URLs.

## Headers and Indexing

Phase 10 centralizes baseline security headers in `next.config.ts`:

- `Content-Security-Policy`
- `Referrer-Policy`
- `X-Content-Type-Options`
- `Permissions-Policy`
- `X-Robots-Tag: noindex, nofollow`
- `Strict-Transport-Security` when `VERCEL_ENV=production`

CSP intentionally allows Cloudflare Turnstile frames/scripts from `https://challenges.cloudflare.com`. Supabase, Sentry, and Upstash connect origins are added only when their environment variables are configured. The tracking subdomain remains noindex/nofollow through metadata, `robots.ts`, and response headers.

## Monitoring and Redaction

Sentry server and edge initialization is present but inactive until `SENTRY_DSN` is configured. Server-side events redact cookies, authorization headers, and request bodies before sending. Client-side Sentry is not enabled because no public DSN is configured yet.

## Incident Response

Production incident handling:

1. Triage in Vercel, Supabase, Resend, and Sentry.
2. Disable affected cron/webhook or rotate impacted credentials.
3. Use Vercel rollback for application regression.
4. Use Supabase point-in-time restore or backup restore for database corruption.
5. Notify the client contact and define customer communication only after impact is confirmed.

## Retention

- Lookup-attempt logs should be retained only briefly, with 30 days as the initial operating target unless the client approves otherwise.
- Completed orders should be archived rather than deleted during normal operations.
- Correction/anonymization requests should be handled by an admin procedure after confirming legal and accounting retention obligations.
- Raw provider webhook payloads are stored for inspection but should not be exposed to normal staff.

## Launch Blockers

- Temporary hardcoded admin login and production demo-data fallback are currently enabled for live Vercel access and must be removed or environment-gated before real production traffic.
- Real Supabase, Resend, Turnstile, Upstash, Sentry, DNS, and sender-domain credentials are still required.
