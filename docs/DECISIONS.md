# Decisions

## 2026-06-13 - Project Root

The Next.js application is scaffolded in the current workspace root instead of creating a nested repository. The provided `sun-container-tracking-codex-package/` remains as source material, while the runtime assets and specification are copied into the expected project locations.

## 2026-06-13 - Font Loading

The application uses `next/font/local` with `@fontsource/inter` and `@fontsource/montserrat` files. This keeps the build deterministic in local, CI, and restricted-network environments while still using the font families required by the specification.

## 2026-06-13 - Environment Validation Timing

Server environment validation is centralized in `src/config/env.ts` and fails on production Vercel deployments when required values are missing. Local `next build` can run without production secrets so validation remains useful in CI before vendor credentials exist.

## 2026-06-13 - Phase 0 Scope

The public lookup and admin screens are branded shells only. Lookup, authentication, database mutations, email, rate limiting, and Turnstile are intentionally deferred to their assigned phases to avoid implementing business behavior before the required foundations exist.

## 2026-06-13 - Deployment Region

The initial Vercel configuration targets `fra1` to keep compute close to the intended EU Supabase region. This must be verified against the selected Vercel plan before production launch.

## 2026-06-13 - ESLint Configuration

The project uses the flat-config exports from `eslint-config-next` directly. The legacy `FlatCompat` adapter caused a circular-structure failure with the installed Next.js ESLint config.

## 2026-06-13 - TypeScript Version

TypeScript is pinned to 5.9.2, matching the current Next.js toolchain. TypeScript 6 emitted framework-config deprecation errors for the standard Next.js path alias setup during Phase 0 validation.

## 2026-06-13 - Database Access Method

Application business data uses Drizzle ORM with the `postgres` driver through a server-only lazy client in `src/db/client.ts`. Runtime code reads `DATABASE_URL`; migrations use `DATABASE_DIRECT_URL` through Drizzle Kit. Browser components must not import the database client.

## 2026-06-13 - Supabase Auth Foreign Key

The Drizzle schema keeps `profiles.id` as the application user primary key. The initial migration manually adds the foreign key to `auth.users(id)` because Supabase owns the `auth` schema and Drizzle should not create or manage that table.

## 2026-06-13 - Row Level Security

All business tables are created with row level security enabled and no permissive policies. Server-side application code will enforce authorization before database access, and browser/PostgREST access to business tables remains closed by default.

## 2026-06-13 - Order Number Counter

Phase 1 adds `order_number_counters` as a small support table for atomic `SC-YYYY-000001` generation. This avoids unsafe `last row plus one` behavior and supports the Phase 3 create-order transaction.

## 2026-06-13 - Seed Data Auth Requirement

Seed data requires `SEED_SUPER_ADMIN_AUTH_USER_ID` to reference an existing Supabase Auth user before inserting profile-linked rows. Optional admin, sales, and read-only seed users are inserted only when their corresponding auth user IDs are supplied.

## 2026-06-13 - CLI-Safe Core Modules

`src/config/env-core.ts` and `src/db/client-core.ts` contain script-safe logic for CLI tools such as seed and validation. `src/config/env.ts` and `src/db/client.ts` keep the `server-only` guard for application runtime imports.

## 2026-06-13 - Phase 1 Local Validation

Phase 1 live database behavior was validated with a disposable local PostgreSQL 16 container. The validation script creates an `auth.users` stub for local testing, runs the initial migration SQL, verifies RLS coverage, checks duplicate order/tracking constraints, and commits a representative order transaction.

## 2026-06-13 - Supabase SSR Auth Pattern

Phase 2 uses `@supabase/ssr` with `getAll` and `setAll` cookie methods. `src/proxy.ts` follows the current Next.js proxy convention for session refresh, while server components and actions create per-request Supabase clients through server-only helpers.

## 2026-06-13 - Auth Route Groups

The `/admin/login`, `/admin/forgot-password`, and `/admin/reset-password` URLs live in the public `(auth)` route group. The rest of `/admin` lives in the protected `(admin)` route group so a single admin layout can enforce server-side auth without protecting the login flow.

## 2026-06-13 - Dynamic Admin Routes

The protected admin layout exports `dynamic = "force-dynamic"`. This ensures admin pages always run the server auth guard at request time, even when local build-time Supabase credentials are absent.

## 2026-06-13 - Central Permission Matrix

Application role permissions are centralized in `src/features/auth/permissions.ts`. Pages and mutations must call server-side guard utilities instead of duplicating role checks or relying on hidden browser controls.

## 2026-06-13 - Initial Admin Bootstrap

`pnpm admin:create` creates or updates an application `profiles` row for an existing Supabase Auth user ID. It does not create public signup behavior, and production execution requires an explicit confirmation environment variable.

## 2026-06-13 - Public Signup

The application provides no public signup route. Supabase public sign-ups still need to be disabled in the Supabase project dashboard because that provider setting cannot be enforced from application code without project credentials.

## 2026-06-13 - Phase 3 Search Strategy

The initial order list search uses server-side prefix matching for order number, tracking number, and normalized email, while product description uses a simple contains match. This keeps the MVP search practical against the current indexes without committing to heavier text-search infrastructure before scale requires it.

## 2026-06-13 - Phase 3 Edit Scope

Phase 3 order editing covers customer identity/contact fields, assigned salesperson, fallback salesperson email, and product description only. Status transitions and estimated-delivery-date workflow remain separate Phase 4 mutations so version conflicts and history rules stay isolated.

## 2026-06-13 - Phase 3 Email Boundary

Order creation now queues the mandatory customer and salesperson emails in `email_outbox` with deterministic idempotency keys, but it does not attempt immediate dispatch yet. Actual outbox processing, retry behavior, and provider delivery handling remain in the Phase 6 and Phase 7 implementation scope.

## 2026-06-13 - Server-Only Order Services

The order query and transaction module stays fully server-only. Client order forms import only action functions and a tiny serializable form-state module so Next.js does not pull database code or cache revalidation APIs into the browser build.

## 2026-06-13 - Phase 4 Override Email Decisions

Standard forward status transitions always queue the mandatory customer status email. Super-admin override transitions require a reason and an explicit `send` or `skip` customer-email decision, matching the requirement that backward/corrective changes must not silently notify or silently suppress notification.

## 2026-06-13 - Phase 4 Delivered Fields

When an order enters `DELIVERED`, the workflow sets `actual_delivery_date` from the submitted value or the current date and sets `delivered_at`. Moving away from `DELIVERED` clears both delivery-completion fields so corrective overrides do not leave stale delivered metadata.

## 2026-06-13 - Phase 4 Archive Link Invalidation

Archive and restore both increment `tracking_link_version`. Archiving invalidates public access immediately, and restoring still requires newly generated public links rather than reviving previously distributed signed links.

## 2026-06-13 - Phase 4 Email Dispatch Boundary

Status and delivery-date workflow mutations queue `email_outbox` rows with deterministic idempotency keys. Actual immediate dispatch remains deferred until the email outbox processor phase, preserving the same boundary chosen for Phase 3 order creation.

## 2026-06-13 - Phase 5 Public Tracking Security

Manual public lookup requires both an order/tracking identifier and the customer email to match the same active order. The lookup endpoint and form return a generic failure for validation errors, missing records, archived records, rate limits, and Turnstile failures so customers cannot distinguish which field matched.

## 2026-06-13 - Phase 5 Signed Link Tokens

Public tracking links use HMAC-signed `jose` tokens with only the order ID subject, token version, and `customer-tracking` purpose. Customer email, names, product descriptions, and other PII are never embedded in the token. Token access compares the signed version with `orders.tracking_link_version`, so archive/restore or an explicit version increment invalidates previously issued links.

## 2026-06-13 - Phase 5 Vendor Adapter Behavior

Turnstile and Upstash rate-limit adapters fail closed in production when credentials are missing, while local and test environments skip those vendor checks so builds and unit tests remain deterministic before accounts are available. Lookup attempts are still designed to log only HMAC hashes of identifier, email, IP, and user-agent values.

## 2026-06-13 - Out-of-Order Dashboard Slice

The admin dashboard was implemented before Phase 6-8 because the user requested it explicitly. The page uses the same server-side role scoping as order access: sales users see only assigned-order metrics and activity, while broader roles see all orders. This does not mark the full Phase 9 operational-polish phase complete.

## 2026-06-14 - Phase 6 Email Rendering

Transactional templates use React Email components with `@react-email/render` instead of direct `react-dom/server` rendering. Next.js/Turbopack blocks direct `react-dom/server` imports from app route dependency graphs, and the dedicated renderer preserves the React Email foundation without breaking production builds.

## 2026-06-14 - Phase 6 Outbox Dispatch Boundary

Order creation, mandatory status changes, and optional delivery-date notifications still queue emails inside the database transaction, then trigger the outbox processor after the transaction commits. Provider failures are caught by the processor and stored on `email_outbox`, so they do not roll back order/customer workflow changes.

## 2026-06-14 - Vercel Hobby Cron Limitation

The email outbox cron endpoint is implemented at `/api/cron/process-email-outbox`, but the every-5-minute schedule is not stored in `vercel.json` because Vercel Hobby rejects cron expressions that run more than once per day. Scheduled execution remains a deployment configuration decision: use a daily Hobby cron, an external scheduler, manual invocation, or a Vercel Pro plan for the original cadence.

## 2026-06-14 - Phase 7 Resend Webhook Verification

Resend webhook handling uses `standardwebhooks` with support for both `webhook-*` and legacy `svix-*` header names. The verified header event ID is the dedupe key stored in `email_delivery_events.provider_event_id`, and unknown verified events are stored even when they do not map to an outbox status.

## 2026-06-14 - Phase 7 Retry Controls

Manual email retry is restricted to roles with `emails:retry`. Retrying a failed, bounced, complained, or suppressed row refreshes the recipient from the current customer record, clears delivery failure fields, replaces the provider idempotency key for a new send attempt, and then triggers the outbox processor after the update.

## 2026-06-14 - Phase 8 Optional Email Guardrails

Optional service emails are customer-by-customer only. Preference toggles default off and never send by themselves; each send requires a delivered order, no active suppression, a saved preference, preview acknowledgement, and explicit confirmation. Promotional email remains disabled in the MVP even if a checkbox-like preference exists in the schema.

## 2026-06-14 - Phase 9 Mobile Admin Tables

Admin tables now remain horizontally scrollable on mobile by default. The order list is the only table hidden below the small-screen breakpoint because it has purpose-built mobile order cards; other operational tables must remain visible unless they receive their own mobile card equivalent.

## 2026-06-14 - Phase 10 CSP and Monitoring

Security headers are generated centrally in `next.config.ts`. CSP is intentionally restrictive but allows Cloudflare Turnstile, configured Supabase/Sentry/Upstash connect origins, local fonts/assets, and inline styles/scripts required by the current Next.js runtime. Sentry is server/edge only until a public client DSN is intentionally introduced.

## 2026-06-14 - Phase 10 Dependency Audit

`pnpm audit --audit-level high` initially reported high `esbuild` advisories through dev tooling. A pnpm override forces `esbuild@0.28.1` across the tree; the high-severity audit now passes, with one moderate advisory remaining for later dependency review.
