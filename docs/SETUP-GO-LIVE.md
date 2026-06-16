# Go-Live Setup — Make the Tracking System Fully Functional

This project is **already complete and tested**. It only serves demo (cookie) data when
no database is configured. Connecting the services below switches the exact same code to
real data. Everything here uses **free tiers**.

| Capability        | Service              | Free tier | Required for |
|-------------------|----------------------|-----------|--------------|
| Database + Login  | **Supabase**         | Yes       | Core (admin + tracking) |
| Customer emails   | **Resend**           | Yes (3k/mo) | Real emails |
| Bot protection    | **Cloudflare Turnstile** | Yes   | Captcha on lookup |
| Rate limiting     | **Upstash Redis**    | Yes       | Lookup throttling |

> The app's login is built on **Supabase Auth**, and Supabase also gives you the Postgres
> database — so one Supabase project covers both. Add it to Vercel via the Marketplace
> integration so the DB/auth env vars are injected automatically.

---

## Step 1 — Supabase (database + auth)

1. In your **Vercel project → Storage / Integrations → Marketplace → Supabase → Add**
   (or create a project at supabase.com and link it). Choose the **Free** plan.
2. Supabase exposes two connection strings (Project → **Connect**):
   - **Pooled / Transaction** (host `...pooler.supabase.com`, port **6543**) → use for `DATABASE_URL`. Append `?sslmode=require`.
   - **Direct / Session** (port **5432**) → use for `DATABASE_DIRECT_URL` (migrations only). Append `?sslmode=require`.
3. From Project → **API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key → `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `service_role` key (secret) → `SUPABASE_SECRET_KEY`
4. Supabase Auth → **URL Configuration**: set Site URL to your Vercel domain and add
   `https://<your-domain>/auth/callback` and `https://<your-domain>/auth/confirm` as redirect URLs.

## Step 2 — Resend (emails)

1. Create an account at resend.com (Free).
2. Add & **verify your sending domain** (e.g. `updates.suncontainer.de`) via the DNS records Resend shows.
   - For first tests without a domain you can send only to your own address using `onboarding@resend.dev`.
3. Copy the **API key** → `RESEND_API_KEY`.
4. Create a webhook → URL `https://<your-domain>/api/webhooks/resend`, copy the signing secret → `RESEND_WEBHOOK_SECRET`.
5. Set `EMAIL_FROM` to a verified address, `EMAIL_REPLY_TO=info@suncontainer.de`, and `EMAIL_MODE=production`.

## Step 3 — Cloudflare Turnstile (captcha)

1. Cloudflare dashboard → **Turnstile** → Add site → your domain.
2. Copy **Site key** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, **Secret key** → `TURNSTILE_SECRET_KEY`.

## Step 4 — Upstash Redis (rate limiting)

1. Add **Upstash** via the Vercel Marketplace (or upstash.com), create a Redis database (Free).
2. Copy **REST URL** → `UPSTASH_REDIS_REST_URL`, **REST token** → `UPSTASH_REDIS_REST_TOKEN`.

## Step 5 — App secrets

Generate two random secrets (any long random string):

```bash
openssl rand -hex 32   # TRACKING_LINK_SECRET
openssl rand -hex 32   # CRON_SECRET
```

---

## ⚠️ Vercel variable-name mapping (important)

The Supabase Vercel integration injects variables under **different names** than this app
reads. You must add the app's names too (Project → Settings → Environment Variables):

| App expects (add this)              | Value to use (from the Supabase integration)            |
|-------------------------------------|---------------------------------------------------------|
| `DATABASE_URL`                      | `POSTGRES_URL` (pooled, port 6543)                      |
| `DATABASE_DIRECT_URL`               | `POSTGRES_URL_NON_POOLING` (port 5432)                  |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | the `sb_publishable_...` key                          |
| `SUPABASE_SECRET_KEY`               | the `sb_secret_...` key                                 |
| `NEXT_PUBLIC_SUPABASE_URL`          | already correct                                         |
| `DEMO_MODE`                         | `false`                                                 |

Also add `TRACKING_LINK_SECRET`, `CRON_SECRET`, the Resend/Turnstile/Upstash keys, and the
`EMAIL_*` values. Without `DATABASE_URL` the deployed site stays in **demo mode**.

## Step 6 — Set the variables

**On Vercel** (Project → Settings → Environment Variables) add every key from
`.env.local.example`. Set `DEMO_MODE=false`. If you used the Supabase/Upstash Marketplace
integrations, several of these are injected for you — just confirm the names match.

**Locally** (only needed to run migrations & create the admin) copy the template:

```bash
cp .env.local.example .env.local   # then fill in the values
```

## Step 7 — Create the database schema (migrations)

Uses `DATABASE_DIRECT_URL` (port 5432).

```bash
pnpm db:migrate
```

## Step 8 — Create your admin login

Admin users live in **Supabase Auth**; the app stores a matching profile row by the same UUID.

1. Supabase → **Authentication → Users → Add user** → enter your email + a password
   (tick "Auto confirm"). Copy that user's **UUID**.
2. Put these in `.env.local`:
   ```env
   CREATE_ADMIN_AUTH_USER_ID=<the-uuid-from-supabase>
   CREATE_ADMIN_EMAIL=you@example.com
   CREATE_ADMIN_FIRST_NAME=Your
   CREATE_ADMIN_LAST_NAME=Name
   CREATE_ADMIN_ROLE=SUPER_ADMIN
   ```
3. Run:
   ```bash
   pnpm admin:create
   ```
4. Log in at `https://<your-domain>/admin/login` with that email + password.

> Optional sample data (dev only): `pnpm db:seed`. Do **not** seed production.

## Step 9 — Cron for the email outbox

Outgoing emails are queued and flushed by `GET /api/cron/process-email-outbox`
(protected by `CRON_SECRET`). On Vercel add a Cron Job (Project → Settings → Cron) hitting
that path every few minutes, or call it from any scheduler with header
`Authorization: Bearer <CRON_SECRET>`.

---

## Verify it's live, not demo

- The homepage no longer shows the "Demo Lookup" hint.
- `/admin` shows real metrics from your database.
- Creating an order in the admin and looking it up at `/` returns the saved record.
- `GET /api/health` returns ok.

## How demo mode is decided (reference)

`isDemoMode()` is **true** only when `DEMO_MODE=true` **or** `DATABASE_URL` is empty /
`dummy` / contains `example.com`. A real `DATABASE_URL` + `DEMO_MODE=false` = fully live.
Captcha and rate-limiting **fail closed** in production if their keys are missing (requests
are blocked), so configure Steps 3–4 before launch or lookups will be rejected.
