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

Phase 0 sets baseline noindex, referrer, content-type, and permissions headers. Phase 10 completes CSP, HSTS, Sentry, redaction, and retention controls.

## Incident Response

Before production, define the contact path, containment steps, credential rotation plan, and customer communication procedure.

## Retention

Lookup-attempt retention and completed-order retention require client-approved policies before production.
