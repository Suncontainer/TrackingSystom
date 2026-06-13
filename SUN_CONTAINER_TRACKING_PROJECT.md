# Sun Container Customer Order Tracking Portal
## Master Product, Architecture, Security, Design and Codex Implementation Specification

**Document version:** 1.0  
**Prepared:** 2026-06-13  
**Primary deployment:** `https://tracking.suncontainer.de`  
**Application type:** Private customer order-tracking portal and internal administration dashboard  
**Implementation:** Next.js App Router, TypeScript and Vercel  
**Primary language:** German  
**Secondary language:** English  
**Status:** Approved implementation baseline; visual polish will be refined in a later design phase

---

# 1. Purpose of This File

This file is the authoritative specification for Codex and all developers working on the Sun Container tracking portal.

Codex must read this entire document before changing the repository. It must use this file to:

1. Scaffold the project.
2. Establish the architecture.
3. Create the database schema and migrations.
4. Implement authentication and authorization.
5. Implement order creation and management.
6. Implement public customer tracking.
7. Implement reliable transactional email workflows.
8. Add security controls, audit history and tests.
9. Deploy the application to Vercel.
10. Apply the preliminary Sun Container visual language using the supplied assets.
11. Keep the code prepared for later design refinement without rewriting the business logic.

This document overrides assumptions made by code-generation tools. When the document is unclear, Codex must choose the safest, simplest and most maintainable implementation and record that decision in `docs/DECISIONS.md`.

---

# 2. Codex Operating Protocol

## 2.1 Required behavior

Codex must:

- Read this file before every major implementation phase.
- Inspect the existing repository before generating or replacing files.
- Preserve working code unless a change is necessary.
- Work phase by phase rather than creating the entire application as one uncontrolled change.
- Complete one phase, run validation, update progress documentation and then continue.
- Prefer small, reviewable commits.
- Use strict TypeScript.
- Never use `any` without a documented reason.
- Never commit secrets.
- Never expose server secrets to browser code.
- Never invent successful integrations when credentials are missing.
- Provide safe local mock or log behavior when an external service is not configured.
- Add tests for important business logic before considering a phase complete.
- Update `docs/PROGRESS.md` after every phase.
- Update `docs/DECISIONS.md` whenever an architectural decision is made.
- Update `.env.example` whenever a new environment variable is introduced.
- Run all mandatory checks before declaring a phase complete.

## 2.2 Phase execution rule

Default behavior is one implementation phase per Codex run.

When instructed to “continue,” Codex must:

1. Read `SUN_CONTAINER_TRACKING_PROJECT.md`.
2. Read `docs/PROGRESS.md`.
3. Identify the first incomplete phase.
4. Implement only that phase and directly required supporting work.
5. Run linting, type checking and relevant tests.
6. Update progress and decisions.
7. Summarize completed work, validation results and the next phase.

Codex may complete multiple phases only when explicitly instructed.

## 2.3 Mandatory validation commands

The final scripts may differ slightly, but the repository must provide equivalent commands:

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

At the end of each phase, run at least:

```bash
pnpm lint
pnpm typecheck
pnpm test
```

Before production readiness, run all five commands.

## 2.4 Do not overbuild

Do not implement future features in the MVP simply because they appear in the future-roadmap section.

Do not add:

- Microservices
- A separate Express server
- A separate React application
- Kubernetes
- Docker-based production infrastructure
- WebSocket servers
- A customer password/login system
- GPS tracking
- SMS or WhatsApp sending
- PDF invoice generation
- Support tickets
- Production photograph uploads
- Bulk marketing automation

The architecture must make those additions possible later, but the first release must remain focused.

---

# 3. Product Overview

Sun Container needs a dedicated customer order-tracking portal hosted on a subdomain of the existing website.

The portal reduces repeated communication between customers, sales representatives and operations staff. After an order deposit or payment is received, an administrator creates a tracking record. Customers can then view the current order status and estimated delivery date without contacting the sales team.

The system has two surfaces:

1. **Public customer portal**
   - No customer account.
   - Secure lookup using order/tracking reference plus email.
   - Secure direct link from transactional emails.
   - Current status, timeline and estimated delivery date.

2. **Private administration portal**
   - Authenticated employees only.
   - Create and edit tracking records.
   - Change statuses and dates.
   - Add internal notes.
   - View history.
   - Send optional emails manually.
   - Monitor email delivery.
   - Manage authorized staff according to role.

---

# 4. Business Objectives

The portal must:

- Reduce unnecessary customer status enquiries.
- Give customers transparent and current information.
- Make the order workflow consistent.
- Keep the sales team informed.
- Record who changed important information and when.
- Deliver mandatory status notifications reliably.
- Prevent duplicate emails.
- Prevent unauthorized access to another customer’s order.
- Work well on mobile and desktop.
- Remain simple enough for non-technical staff.
- Be maintainable by one developer.
- Support future operational integrations without a rewrite.

---

# 5. MVP Scope

## 5.1 Included

The MVP includes:

- Admin authentication.
- Admin role enforcement.
- Admin dashboard.
- Customer records.
- Order tracking records.
- Automatic order-number generation with optional manual entry.
- Automatic tracking-number generation.
- Four predefined order statuses.
- Estimated delivery date.
- Product description.
- Internal notes.
- Status change history.
- Estimated delivery date history.
- Audit history.
- Customer tracking lookup.
- Secure direct tracking links.
- Mandatory transactional emails.
- Internal salesperson notification.
- Optional single-customer email templates.
- Email outbox and retry mechanism.
- Email delivery history.
- Resend webhook processing.
- German and English customer-facing content.
- Search, filtering and pagination.
- Archive functionality.
- Rate limiting and bot protection.
- Responsive layout.
- Automated tests.
- Vercel deployment.
- Supabase PostgreSQL and Supabase Auth.
- Preliminary visual design based on the supplied Sun Container assets.

## 5.2 Explicitly excluded from MVP

The following are future features:

- Customer user accounts.
- Customer passwords.
- Customer dashboard containing several orders.
- PDF invoice downloads.
- Production photographs.
- GPS tracking.
- SMS.
- WhatsApp notifications.
- Electronic delivery signatures.
- Customer support tickets.
- ERP integration.
- Factory automation.
- Bulk promotional campaign management.
- Advanced analytics.
- Native mobile applications.

---

# 6. Security Correction to the Original Requirement

The original description allowed an order to be retrieved using an order number alone. That must not be implemented.

Order numbers are often sequential or predictable. An order-number-only lookup could expose another customer’s information.

## 6.1 Approved public access methods

### Method A — Manual lookup

The customer enters:

- Order number **or** tracking number
- Email address

Both values must match the same order/customer record.

The interface may use one field labeled:

> Order or tracking number

and one email field.

### Method B — Secure direct link

Mandatory emails contain a signed secure link. The link opens the correct order without requiring the customer to type the lookup fields.

Requirements:

- The token must be signed on the server.
- Do not include customer name, email, product description or other personal data in the token.
- Include order ID, token version and purpose only.
- Verify the signature and token version on every request.
- Provide a way for an administrator to invalidate existing links by incrementing `tracking_link_version`.
- Use a strong server-only `TRACKING_LINK_SECRET`.
- Return a generic unavailable/expired page for invalid tokens.
- Never expose internal database details in errors.

A recommended implementation is a signed token using `jose`, HMAC SHA-256 and a payload similar to:

```ts
{
  sub: orderId,
  ver: trackingLinkVersion,
  purpose: "customer-tracking"
}
```

---

# 7. Order Status Workflow

The application has exactly four operational statuses in the MVP:

```ts
type OrderStatus =
  | "ORDER_RECEIVED"
  | "IN_PRODUCTION"
  | "IN_TRANSIT"
  | "DELIVERED";
```

## 7.1 Standard transitions

```text
ORDER_RECEIVED
      ↓
IN_PRODUCTION
      ↓
IN_TRANSIT
      ↓
DELIVERED
```

## 7.2 Customer-facing status content

### ORDER_RECEIVED

German:

- Label: `Auftrag eingegangen`
- Message: `Ihr Auftrag wurde erfolgreich aufgenommen.`

English:

- Label: `Order received`
- Message: `Your order has been received.`

Mandatory email: Yes.

### IN_PRODUCTION

German:

- Label: `In Produktion`
- Message: `Ihr Auftrag befindet sich derzeit in Produktion.`

English:

- Label: `In production`
- Message: `Your order is currently in production.`

Mandatory email: Yes.

### IN_TRANSIT

German:

- Label: `Unterwegs`
- Message: `Ihr Auftrag wurde versandt und befindet sich auf dem Weg zu Ihnen.`

English:

- Label: `In transit`
- Message: `Your order is currently in transit.`

Mandatory email: Yes.

### DELIVERED

German:

- Label: `Geliefert`
- Message: `Ihr Auftrag wurde erfolgreich geliefert.`

English:

- Label: `Delivered`
- Message: `Your order has been delivered.`

Mandatory email: Yes.

## 7.3 Transition enforcement

Normal administrators may only move forward one status at a time.

A super administrator may:

- Skip a status.
- Move an order backward.
- Correct an incorrectly selected status.

An override requires:

- A reason.
- Confirmation.
- An audit-log entry.
- A status-history entry.
- An explicit decision about the customer email when correcting backward.

Mandatory forward-transition emails may not be silently disabled.

## 7.4 Delivered orders

When an order enters `DELIVERED`:

- Set `delivered_at`.
- Queue the delivery confirmation email.
- Keep the order visible in the delivered list.
- Do not automatically archive it.
- Do not allow ordinary users to edit status after delivery.
- Permit super-admin correction with a reason.

---

# 8. Estimated Delivery Date

Every order must have:

- `initial_estimated_delivery_date`
- `current_estimated_delivery_date`
- Optional `actual_delivery_date`

Requirements:

- The current estimated date is always visible to the customer.
- It may be updated by authorized staff.
- Every change creates a date-history record.
- The history records previous date, new date, reason, employee and timestamp.
- Date-only values use PostgreSQL `date`, not a timestamp.
- Display German dates as `DD.MM.YYYY`.
- Display English dates according to the selected English locale.
- A date change does not automatically send an email.
- The admin date-change dialog includes:
  - New date
  - Reason
  - `Notify customer` checkbox
- `Notify customer` is disabled by default.
- When selected, queue a separate `DELIVERY_DATE_UPDATED` email.

---

# 9. User Types and Permissions

## 9.1 Customers

Customers:

- Do not have accounts in the MVP.
- Can only access the public tracking view.
- Can view only their matched order.
- Cannot edit anything.
- Cannot see internal notes, staff details, logs or history comments.

## 9.2 Internal roles

Use these application roles:

```ts
type AppRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "SALES"
  | "READ_ONLY";
```

### SUPER_ADMIN

Can:

- Do everything.
- Manage internal users and roles.
- Override status transitions.
- Regenerate/invalidate tracking links.
- Archive orders.
- View all logs.
- Retry emails.
- Update system settings.

### ADMIN

Can:

- Create orders.
- Edit customer and order details.
- Change statuses using normal transitions.
- Change estimated dates.
- Add notes.
- Send approved optional emails.
- View email and status history.
- Search all orders.
- Retry failed mandatory emails.

Cannot:

- Manage super admins.
- Override protected transitions.
- permanently delete data.

### SALES

Can:

- View orders assigned to them.
- Search assigned orders.
- View customer-visible order details.
- View permitted internal notes.
- Add internal notes to assigned orders.

Cannot:

- Change status unless explicitly enabled later.
- Change delivery dates.
- send optional promotional messages.
- view other salespersons’ orders.
- manage users.

### READ_ONLY

Can:

- View permitted orders and history.

Cannot:

- Create, edit, send, retry, archive or manage anything.

## 9.3 Authorization rule

Authorization must be checked on the server for every protected operation.

Hiding a button in the browser is not authorization.

Create centralized server-only utilities such as:

```ts
requireUser()
requireRole(...)
requirePermission(...)
requireOrderAccess(orderId)
```

Do not duplicate permission logic across pages.

---

# 10. Recommended Technical Stack

Use stable, mutually compatible releases at the time the project is initialized. Lock versions in `pnpm-lock.yaml`. Do not use prerelease versions.

## 10.1 Core

- Next.js App Router
- TypeScript
- React
- Node.js runtime
- pnpm
- Tailwind CSS
- shadcn/ui
- Lucide icons

## 10.2 Database and authentication

- Supabase PostgreSQL
- Supabase Auth
- `@supabase/supabase-js`
- `@supabase/ssr`
- Drizzle ORM
- Drizzle Kit
- `postgres` driver using the Supabase transaction pooler at runtime
- Direct database URL for migrations only

## 10.3 Forms and validation

- Zod
- React Hook Form
- `@hookform/resolvers`
- Server-side validation for every mutation
- Client-side validation only as a user-experience enhancement

## 10.4 Email

- Resend
- React Email
- Signed webhook verification
- Database outbox
- Idempotency keys
- Vercel Cron for retry processing on a production-appropriate Vercel plan

## 10.5 Security and reliability

- Upstash Redis and `@upstash/ratelimit`
- Cloudflare Turnstile
- `jose` for signed tracking links
- Sentry for production error monitoring
- Security headers
- Structured logs with sensitive-value redaction

## 10.6 Testing

- Vitest
- React Testing Library
- Playwright
- Optional database integration test environment

## 10.7 Utility libraries

- `date-fns`
- `clsx`
- `tailwind-merge`
- `sonner`
- `server-only`

Avoid dependencies when a small standard-library implementation is clearer.

---

# 11. Repository Structure

Use a `src` directory.

```text
sun-container-tracking/
├── public/
│   └── brand/
│       ├── logo-stacked-dark.png
│       ├── logo-stacked-light.png
│       ├── logo-horizontal-dark.png
│       └── logo-horizontal-light.png
│
├── reference-assets/
│   └── screenshots/
│       ├── homepage-reference-desktop.png
│       └── homepage-reference-long.png
│
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   │   ├── page.tsx
│   │   │   ├── track/
│   │   │   │   └── [token]/
│   │   │   │       └── page.tsx
│   │   │   ├── privacy/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   └── admin/
│   │   │       ├── login/
│   │   │       │   └── page.tsx
│   │   │       ├── forgot-password/
│   │   │       └── reset-password/
│   │   │
│   │   ├── (admin)/
│   │   │   └── admin/
│   │   │       ├── page.tsx
│   │   │       ├── orders/
│   │   │       │   ├── page.tsx
│   │   │       │   ├── new/
│   │   │       │   │   └── page.tsx
│   │   │       │   └── [orderId]/
│   │   │       │       └── page.tsx
│   │   │       ├── customers/
│   │   │       │   └── [customerId]/
│   │   │       │       └── page.tsx
│   │   │       ├── emails/
│   │   │       │   └── page.tsx
│   │   │       ├── users/
│   │   │       │   └── page.tsx
│   │   │       ├── settings/
│   │   │       │   └── page.tsx
│   │   │       └── layout.tsx
│   │   │
│   │   ├── api/
│   │   │   ├── tracking/
│   │   │   │   └── lookup/
│   │   │   │       └── route.ts
│   │   │   ├── webhooks/
│   │   │   │   └── resend/
│   │   │   │       └── route.ts
│   │   │   ├── cron/
│   │   │   │   └── process-email-outbox/
│   │   │   │       └── route.ts
│   │   │   └── health/
│   │   │       └── route.ts
│   │   │
│   │   ├── auth/
│   │   │   ├── callback/
│   │   │   └── confirm/
│   │   ├── error.tsx
│   │   ├── global-error.tsx
│   │   ├── not-found.tsx
│   │   ├── layout.tsx
│   │   ├── robots.ts
│   │   └── globals.css
│   │
│   ├── components/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── brand/
│   │   ├── email/
│   │   ├── orders/
│   │   ├── tracking/
│   │   └── ui/
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── permissions.ts
│   │   ├── routes.ts
│   │   └── site.ts
│   │
│   ├── db/
│   │   ├── client.ts
│   │   ├── schema/
│   │   ├── queries/
│   │   ├── migrations/
│   │   └── seed.ts
│   │
│   ├── emails/
│   │   ├── components/
│   │   ├── templates/
│   │   │   ├── order-received.tsx
│   │   │   ├── production-started.tsx
│   │   │   ├── in-transit.tsx
│   │   │   ├── delivered.tsx
│   │   │   ├── salesperson-notification.tsx
│   │   │   ├── delivery-date-updated.tsx
│   │   │   ├── review-request.tsx
│   │   │   ├── satisfaction-survey.tsx
│   │   │   ├── maintenance-recommendation.tsx
│   │   │   └── warranty-reminder.tsx
│   │   ├── dispatcher.ts
│   │   ├── renderer.ts
│   │   └── types.ts
│   │
│   ├── features/
│   │   ├── admin-users/
│   │   ├── audit/
│   │   ├── customers/
│   │   ├── emails/
│   │   ├── orders/
│   │   └── tracking/
│   │
│   ├── i18n/
│   │   ├── de.ts
│   │   ├── en.ts
│   │   ├── get-locale.ts
│   │   └── types.ts
│   │
│   ├── lib/
│   │   ├── auth/
│   │   ├── crypto/
│   │   ├── errors/
│   │   ├── logging/
│   │   ├── rate-limit/
│   │   ├── supabase/
│   │   ├── turnstile/
│   │   └── utils/
│   │
│   └── proxy.ts
│
├── scripts/
│   ├── create-admin.ts
│   └── process-email-outbox.ts
│
├── tests/
│   ├── e2e/
│   ├── integration/
│   └── unit/
│
├── docs/
│   ├── DECISIONS.md
│   ├── PROGRESS.md
│   ├── DEPLOYMENT.md
│   ├── EMAIL_SETUP.md
│   ├── SECURITY.md
│   └── TESTING.md
│
├── .env.example
├── drizzle.config.ts
├── next.config.ts
├── vercel.json
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
└── SUN_CONTAINER_TRACKING_PROJECT.md
```

Codex may adjust minor organization when a current framework convention requires it, but the separation of public, admin, database, email, authentication and business logic must remain clear.

---

# 12. Supplied Brand and Reference Assets

This specification package contains:

```text
reference-assets/
├── brand/
│   ├── logo-stacked-dark.png
│   ├── logo-stacked-light.png
│   ├── logo-horizontal-dark.png
│   └── logo-horizontal-light.png
└── screenshots/
    ├── homepage-reference-desktop.png
    └── homepage-reference-long.png
```

## 12.1 Asset installation

During project initialization:

- Copy the four logo files to `public/brand/`.
- Keep the two screenshots in `reference-assets/screenshots/` or `docs/design-reference/`.
- Do not expose reference screenshots as customer-facing production assets.
- Do not optimize, redraw, recolor, distort or regenerate the logos.
- Preserve transparency and aspect ratio.
- Use `next/image`.
- Add meaningful alt text:
  - `Sun Container`
- When the adjacent text already states the brand, an empty alt attribute may be used to prevent redundant screen-reader output.

## 12.2 Logo usage

Use:

- `logo-horizontal-dark.png` on white or light headers.
- `logo-horizontal-light.png` on dark backgrounds.
- `logo-stacked-dark.png` on light login or empty-state layouts where a stacked mark fits.
- `logo-stacked-light.png` on dark branded email/footer layouts where a stacked mark fits.

The horizontal dark logo is the default public navigation logo.

---

# 13. Preliminary Design Direction

The first implementation must be functional and branded, but not attempt final pixel-perfect design. The full visual refinement will happen after the application works.

## 13.1 Visual characteristics observed from the supplied website

The existing Sun Container website uses:

- Strong yellow as the main brand accent.
- Near-black typography and dark interface areas.
- White and very light gray backgrounds.
- Bold, uppercase or heavy-weight headings.
- Rectangular yellow call-to-action buttons.
- Low-radius or square cards.
- Thin gray borders.
- Product imagery and practical industrial presentation.
- Strong contrast.
- Spacious desktop sections.
- Direct, functional navigation.
- Minimal decorative effects.

## 13.2 Preliminary design tokens

Create CSS variables so they can be changed globally during the later design phase.

```css
:root {
  --brand-yellow: #ffcc00;
  --brand-yellow-hover: #e6b800;
  --brand-yellow-active: #cca300;

  --brand-black: #1e1e1e;
  --brand-black-deep: #111111;
  --brand-white: #ffffff;

  --background: #ffffff;
  --surface: #f7f7f7;
  --surface-muted: #f1f1f1;

  --text-primary: #1e1e1e;
  --text-secondary: #5f6368;
  --text-inverse: #ffffff;

  --border: #dedede;
  --border-strong: #bdbdbd;

  --success: #16794a;
  --warning: #a15c00;
  --danger: #b42318;
  --info: #175cd3;

  --radius-sm: 2px;
  --radius-md: 4px;
  --radius-lg: 8px;
}
```

These are provisional. Do not sample additional colors from screenshots and treat them as permanent brand standards.

## 13.3 Typography

Preliminary choice:

- Headings/navigation: Montserrat, bold to extra-bold.
- Body/forms/tables: Inter.
- Use `next/font`.
- Avoid loading many weights.
- Use strong, readable hierarchy.
- Avoid excessive letter spacing.
- Form labels must remain clear at mobile sizes.

If the exact production-site fonts become available later, replace them through centralized font variables.

## 13.4 Component style

- Primary buttons: yellow background, dark text, bold label.
- Secondary buttons: white background, dark border.
- Destructive buttons: reserved red treatment.
- Cards: white background, thin border, subtle or no shadow.
- Inputs: clear labels, visible borders and strong focus state.
- Tables: clean, dense enough for operations, responsive fallback.
- Status badges: accessible text plus color; never use color alone.
- Progress stepper: dark/yellow brand treatment with explicit labels.
- Loading states: skeletons or compact spinners.
- Empty states: simple, useful and action-oriented.
- Admin sidebar: dark background with light logo.
- Public header: white background with dark horizontal logo.
- Public footer: near-black background with light horizontal logo.

## 13.5 Layout

Public portal:

- Maximum content width around 1120–1200 px.
- Tracking form centered in a clear card.
- Mobile-first.
- Do not reproduce the marketing homepage hero.
- Keep the tracking task prominent.
- Include a subtle link back to the main Sun Container website.

Admin portal:

- Desktop sidebar.
- Mobile drawer.
- Sticky top bar when helpful.
- Main content max width sufficient for data tables.
- Avoid wide empty spaces.
- Keep actions consistent.

---

# 14. Project Initialization

Use pnpm.

A typical initialization command is:

```bash
pnpm create next-app@latest sun-container-tracking \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

After initialization:

1. Move this file to the project root.
2. Copy supplied logo assets into `public/brand/`.
3. Copy screenshot references into `reference-assets/screenshots/`.
4. Configure strict TypeScript.
5. Configure import aliases.
6. Add formatting and lint rules.
7. Add the approved dependencies.
8. Create `.env.example`.
9. Create initial docs.
10. Confirm the project builds before adding business functionality.

Do not initialize a second nested Git repository.

---

# 15. Environment Variables

Use validated environment variables in `src/config/env.ts`. Fail fast in production when a required value is missing.

Example:

```dotenv
# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_MAIN_SITE_URL=https://suncontainer.de
APP_DEFAULT_LOCALE=de
TRACKING_LINK_SECRET=
CRON_SECRET=

# Supabase Auth
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SECRET_KEY=

# PostgreSQL
DATABASE_URL=
DATABASE_DIRECT_URL=

# Email
RESEND_API_KEY=
RESEND_WEBHOOK_SECRET=
EMAIL_FROM="Sun Container <tracking@updates.suncontainer.de>"
EMAIL_REPLY_TO=info@suncontainer.de
EMAIL_MODE=log
EMAIL_RECIPIENT_ALLOWLIST=

# Rate limiting
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Turnstile
NEXT_PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=

# Monitoring
SENTRY_DSN=
SENTRY_AUTH_TOKEN=
```

## 15.1 Email modes

Support:

```ts
type EmailMode = "log" | "sandbox" | "production";
```

### log

- Do not call Resend.
- Store the outbox message.
- Log a redacted preview.
- Mark as simulated in development only.

### sandbox

- Send only to addresses in `EMAIL_RECIPIENT_ALLOWLIST`.
- Never send to the original customer.
- Include the intended recipient in the subject or internal metadata.

### production

- Send to actual recipients.
- Allowed only in production with verified domain configuration.

Preview deployments must never send real customer emails.

---

# 16. Database Strategy

Use Supabase PostgreSQL as the database.

Use:

- Drizzle ORM for application queries and transactions.
- Drizzle migrations committed to the repository.
- Supabase Auth for employee identity.
- Supabase browser client only for authentication.
- Server-only Drizzle access for business data.
- No business-table reads directly from browser components.
- No public PostgREST access to business tables.

Enable Row Level Security on business tables and create no permissive anonymous policies. Application business access goes through authorized server code.

Use UUID primary keys generated by PostgreSQL.

Use `created_at` and `updated_at` timestamps with timezone.

Use database constraints and indexes; do not rely only on TypeScript validation.

---

# 17. Database Model

The precise migration syntax may be adjusted, but the following model is required.

## 17.1 `profiles`

Links Supabase Auth users to application roles.

Fields:

```text
id uuid primary key references auth.users(id)
first_name text not null
last_name text not null
email text not null
role app_role not null
is_active boolean not null default true
last_login_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Indexes:

- Unique normalized email.
- Role.
- Active state.

Rules:

- No public sign-up.
- Super admin creates or invites staff.
- Deactivated employees may not access the admin portal.

## 17.2 `customers`

Fields:

```text
id uuid primary key
first_name text not null
last_name text not null
email text not null
email_normalized text not null
preferred_language text not null default 'de'
phone text null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
archived_at timestamptz null
```

Indexes:

- `email_normalized`
- name search support where appropriate

Do not force email uniqueness. Shared or reused business email addresses are possible.

## 17.3 `orders`

Fields:

```text
id uuid primary key
customer_id uuid not null references customers(id)
order_number text not null unique
tracking_number text not null unique
status order_status not null default 'ORDER_RECEIVED'
product_description text null
initial_estimated_delivery_date date not null
current_estimated_delivery_date date not null
actual_delivery_date date null
assigned_salesperson_id uuid null references profiles(id)
assigned_salesperson_email text null
tracking_link_version integer not null default 1
delivered_at timestamptz null
archived_at timestamptz null
version integer not null default 1
created_by uuid not null references profiles(id)
updated_by uuid not null references profiles(id)
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Indexes:

- `status`
- `current_estimated_delivery_date`
- `assigned_salesperson_id`
- `created_at`
- `archived_at`
- compound index for active orders and status

Rules:

- Use optimistic concurrency with `version`.
- Never expose the UUID as a customer-facing identifier.
- Archived orders remain in the database.
- Ordinary users cannot hard delete orders.

## 17.4 `order_status_history`

Fields:

```text
id uuid primary key
order_id uuid not null references orders(id)
previous_status order_status null
new_status order_status not null
estimated_delivery_date_snapshot date not null
change_type text not null
reason text null
is_override boolean not null default false
changed_by uuid not null references profiles(id)
created_at timestamptz not null default now()
```

Indexes:

- `order_id, created_at`
- `new_status`

Rules:

- Immutable after creation.
- Initial order creation adds the first history row.
- Do not update or delete history rows.

## 17.5 `delivery_date_history`

Fields:

```text
id uuid primary key
order_id uuid not null references orders(id)
previous_date date not null
new_date date not null
reason text null
customer_notification_requested boolean not null default false
changed_by uuid not null references profiles(id)
created_at timestamptz not null default now()
```

Rules:

- Immutable.
- Created only when the date changes.

## 17.6 `internal_notes`

Fields:

```text
id uuid primary key
order_id uuid not null references orders(id)
body text not null
created_by uuid not null references profiles(id)
updated_by uuid null references profiles(id)
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
deleted_at timestamptz null
```

Rules:

- Never return internal-note content from a public query.
- Soft delete only.
- Record edits in audit logs.

## 17.7 `email_outbox`

This table is the source of truth for intended outgoing emails and email history.

Fields:

```text
id uuid primary key
order_id uuid null references orders(id)
customer_id uuid null references customers(id)
email_type email_type not null
category email_category not null
recipient_email text not null
recipient_name text null
locale text not null default 'de'
template_key text not null
template_version integer not null default 1
template_variables jsonb not null
subject text not null
idempotency_key text not null unique
status email_status not null default 'QUEUED'
provider text not null default 'resend'
provider_message_id text null
attempt_count integer not null default 0
max_attempts integer not null default 5
next_attempt_at timestamptz not null default now()
locked_at timestamptz null
locked_by text null
last_error_code text null
last_error_message text null
queued_by uuid null references profiles(id)
sent_at timestamptz null
delivered_at timestamptz null
bounced_at timestamptz null
complained_at timestamptz null
failed_at timestamptz null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

Recommended email status enum:

```ts
type EmailStatus =
  | "QUEUED"
  | "PROCESSING"
  | "SENT"
  | "DELIVERED"
  | "BOUNCED"
  | "COMPLAINED"
  | "FAILED"
  | "SUPPRESSED"
  | "SIMULATED";
```

Recommended category enum:

```ts
type EmailCategory =
  | "TRANSACTIONAL"
  | "OPTIONAL_SERVICE"
  | "MARKETING"
  | "INTERNAL";
```

Indexes:

- `status, next_attempt_at`
- `order_id, created_at`
- `recipient_email`
- `provider_message_id`
- `email_type`

Rules:

- Do not store API keys or tracking-link secrets.
- Redact provider errors before showing them to normal admins.
- Keep idempotency keys stable for retries.
- Prevent duplicate rows through unique idempotency keys.

## 17.8 `email_delivery_events`

Stores verified provider webhook events.

Fields:

```text
id uuid primary key
provider_event_id text not null unique
provider_message_id text null
event_type text not null
email_outbox_id uuid null references email_outbox(id)
payload jsonb not null
received_at timestamptz not null default now()
processed_at timestamptz null
processing_error text null
```

Rules:

- Verify webhook signature before insertion.
- Process idempotently.
- Unknown event types are stored but do not fail the endpoint.
- Redact or limit payload retention if it contains unnecessary personal data.

## 17.9 `customer_communication_preferences`

Fields:

```text
id uuid primary key
customer_id uuid not null unique references customers(id)
review_request_allowed boolean not null default false
satisfaction_survey_allowed boolean not null default false
maintenance_recommendation_allowed boolean not null default false
warranty_reminder_allowed boolean not null default false
promotional_email_allowed boolean not null default false
marketing_consent_source text null
marketing_consent_at timestamptz null
marketing_withdrawn_at timestamptz null
updated_by uuid null references profiles(id)
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
```

All optional permissions default to false.

## 17.10 `email_suppressions`

Fields:

```text
id uuid primary key
email_normalized text not null
reason text not null
source text not null
provider_event_id text null
created_at timestamptz not null default now()
removed_at timestamptz null
removed_by uuid null references profiles(id)
```

Unique active suppression per email.

Marketing and optional emails must not be sent to an actively suppressed address.

Mandatory transactional email behavior for a suppressed address:

- Do not repeatedly retry a hard bounce.
- Mark the message suppressed/failed.
- Show an administrator warning.
- Preserve the order update.
- Allow staff to correct the email address and retry manually.

## 17.11 `audit_logs`

Fields:

```text
id uuid primary key
actor_user_id uuid null references profiles(id)
action text not null
entity_type text not null
entity_id uuid null
order_id uuid null references orders(id)
before_data jsonb null
after_data jsonb null
metadata jsonb null
request_id text null
ip_hash text null
created_at timestamptz not null default now()
```

Rules:

- Append-only.
- Never store passwords, auth tokens, tracking-link secrets or API keys.
- Avoid unnecessary raw IP retention.
- Hash IP addresses with a rotating or environment secret if required.
- Restrict access to authorized roles.

## 17.12 `tracking_lookup_attempts`

Fields:

```text
id uuid primary key
identifier_hash text null
email_hash text null
ip_hash text null
result text not null
user_agent_hash text null
created_at timestamptz not null default now()
```

Rules:

- Do not store the entered raw identifier or raw email in this table.
- Use it for abuse monitoring and rate-limit diagnostics.
- Apply a short retention period.

---

# 18. Number Generation

## 18.1 Order number

Support:

- Automatic generation.
- Manual entry by an administrator.

Recommended automatic pattern:

```text
SC-2026-000001
```

Requirements:

- Generated atomically in the database.
- Unique.
- Never rely on “last row plus one” without locking.
- Manual values are validated and checked for uniqueness.
- Make prefix/year behavior configurable.

Use a sequence or dedicated counter table.

## 18.2 Tracking number

Generate a random customer-facing tracking number.

Recommended display format:

```text
SC-7K9M-4XPQ-82DH
```

Requirements:

- Cryptographically secure random generation using Node `crypto`.
- Exclude confusing characters such as `0`, `O`, `1`, `I` when practical.
- Unique database constraint.
- Retry generation on collision.
- Case-insensitive normalization.
- Never use a sequential database ID.
- Store the normalized value.
- Display with separators.
- Accept lookup input with or without separators and normalize it server-side.

---

# 19. Core Business Transactions

Important workflows must be atomic.

## 19.1 Create order

Inside one database transaction:

1. Validate permission.
2. Validate customer input.
3. Normalize email.
4. Reuse or create customer according to explicit admin selection.
5. Generate or validate order number.
6. Generate tracking number.
7. Insert order with `ORDER_RECEIVED`.
8. Insert initial status-history row.
9. Insert optional initial internal note.
10. Insert mandatory customer confirmation into `email_outbox`.
11. Insert mandatory salesperson notification into `email_outbox`.
12. Insert audit log.
13. Commit.

After commit:

14. Attempt immediate processing of the newly queued messages.
15. If email sending fails, keep the order successfully created and leave the email queued/failed for retry.
16. Return the order page with email-status feedback.

Do not roll back a valid order merely because the external email provider is unavailable.

## 19.2 Change order status

Inside one transaction:

1. Load order with lock or optimistic version check.
2. Verify permission.
3. Validate transition.
4. Validate required override reason where applicable.
5. Update order status and version.
6. Set or clear delivery-related fields as required.
7. Insert status-history row.
8. Insert mandatory customer status email with a unique idempotency key.
9. Insert audit log.
10. Commit.

After commit:

11. Attempt immediate email processing.
12. Revalidate affected admin and public pages.

## 19.3 Update estimated delivery date

Inside one transaction:

1. Validate permission.
2. Confirm date is actually different.
3. Update current date and order version.
4. Insert delivery-date history.
5. If notification was requested, insert optional service email.
6. Insert audit log.
7. Commit.

## 19.4 Update customer information

- Validate email.
- Update normalized email.
- Write audit log.
- Do not silently alter previously recorded email recipient history.
- Future messages use the current corrected email.
- Show warning if a previous message bounced.

## 19.5 Archive order

- Soft archive.
- Record actor and reason.
- Invalidate public signed links by incrementing `tracking_link_version`.
- Manual lookup must not return archived orders.
- Audit the action.
- Super admin may restore with a reason.

---

# 20. Email Idempotency

Every email row needs a deterministic idempotency key.

Examples:

```text
order-created/customer/{orderId}
order-created/sales/{orderId}
status/{statusHistoryId}/customer
delivery-date/{deliveryDateHistoryId}/customer
optional/{optionalActionId}/customer
```

The database has a unique constraint on `idempotency_key`.

When calling Resend, pass the same idempotency key.

A retry must reuse the original key.

Do not generate a new key for a retry.

---

# 21. Email Outbox Processor

## 21.1 Processing algorithm

The worker must:

1. Authenticate the cron/internal request.
2. Select eligible rows:
   - `QUEUED` or retryable `FAILED`
   - `next_attempt_at <= now()`
   - `attempt_count < max_attempts`
3. Claim rows safely using a database lock strategy such as `FOR UPDATE SKIP LOCKED`.
4. Mark claimed rows `PROCESSING`.
5. Render template.
6. Apply suppression and environment-mode checks.
7. Send through Resend with idempotency key.
8. Update provider message ID and status.
9. On temporary failure:
   - Increment attempt count.
   - Set exponential backoff.
   - Return to retryable state.
10. On permanent failure:
   - Mark failed.
   - Store safe error details.
11. Release locks.
12. Log summary without exposing message content or secrets.

## 21.2 Retry schedule

Suggested backoff:

```text
Attempt 1: immediate
Attempt 2: +5 minutes
Attempt 3: +30 minutes
Attempt 4: +2 hours
Attempt 5: +12 hours
```

Make backoff testable and centralized.

## 21.3 Stale processing recovery

If a worker crashes after setting `PROCESSING`, another run must reclaim messages whose `locked_at` is older than a safe timeout.

## 21.4 Cron security

- Protect the cron route with `CRON_SECRET`.
- Reject unauthorized requests.
- Do not accept the secret in a query string.
- Use constant-time comparison where practical.
- Ensure the operation is idempotent because scheduled invocations may be duplicated.
- Configure a production-appropriate schedule, ideally every five minutes.

---

# 22. Resend Webhook Processing

Route:

```text
POST /api/webhooks/resend
```

Requirements:

1. Read the raw request body.
2. Verify provider signature using `RESEND_WEBHOOK_SECRET`.
3. Reject invalid signatures.
4. Extract provider event ID.
5. Insert event only if it has not already been received.
6. Match provider message ID to `email_outbox`.
7. Update delivery status.
8. Record bounces and complaints.
9. Add suppression records where appropriate.
10. Return quickly.
11. Store unknown verified events for inspection.
12. Never trust unverified webhook data.

The handler must be safe when the provider sends the same event more than once.

---

# 23. Mandatory Email Templates

All email templates must:

- Support German and English.
- Use shared branded components.
- Use an absolute tracking URL.
- Include order number and tracking number where appropriate.
- Avoid internal notes.
- Avoid salesperson details unless explicitly intended.
- Include the Sun Container identity.
- Include a monitored reply-to address.
- Use text and HTML output.
- Be responsive.
- Be readable when images are blocked.
- Avoid relying on color alone.
- Be versioned.

## 23.1 Order received

Template key:

```text
order-received
```

German subject:

```text
Auftragsbestätigung – Sun Container
```

English subject:

```text
Order Confirmation – Sun Container
```

Required variables:

- Customer name
- Order number
- Tracking number
- Estimated delivery date
- Secure tracking URL

## 23.2 Production started

Template key:

```text
production-started
```

German subject:

```text
Die Produktion Ihres Auftrags hat begonnen
```

English subject:

```text
Production Started
```

Required variables:

- Customer name
- Order number
- Estimated delivery date
- Tracking URL

## 23.3 In transit

Template key:

```text
in-transit
```

German subject:

```text
Ihr Auftrag ist unterwegs
```

English subject:

```text
Your Order Is On The Way
```

Required variables:

- Customer name
- Order number
- Estimated delivery date
- Tracking URL

## 23.4 Delivered

Template key:

```text
delivered
```

German subject:

```text
Lieferbestätigung – Sun Container
```

English subject:

```text
Delivery Confirmation
```

Required variables:

- Customer name
- Order number
- Tracking URL

## 23.5 Salesperson notification

Template key:

```text
salesperson-new-order
```

Required variables:

- Customer name
- Customer email
- Order number
- Tracking number
- Product description
- Estimated delivery date
- Authenticated admin order URL

The internal order URL must require login.

---

# 24. Optional Emails

Optional emails must never be sent automatically.

Supported MVP templates:

- Review request
- Satisfaction survey
- Maintenance recommendation
- Warranty reminder
- Promotional email placeholder, disabled unless marketing permission exists

## 24.1 Admin flow

The order page displays an optional communication section.

For each template show:

- Eligibility
- Customer permission state
- Previous send history
- Preview button
- `Send` action
- `Do not send` as the default state

Sending requires:

1. Authorized role.
2. Eligible customer.
3. No active suppression.
4. Preview.
5. Explicit confirmation.
6. New outbox row.
7. Audit-log entry.

A toggle changing from disabled to enabled must not itself send an email. The user must click a final confirmed send action.

## 24.2 Marketing restriction

Do not implement a bulk marketing campaign engine in the MVP.

Promotional email sending remains disabled unless:

- The customer has a recorded legal permission/consent basis.
- There is no withdrawal or suppression.
- The template contains required unsubscribe information.
- The client has approved the compliance process.

The software must not imply that an administrator toggle alone creates legal permission.

---

# 25. Public Customer Portal

## 25.1 Root page

`/` is the main tracking lookup page.

Content:

- Sun Container logo.
- Page heading.
- Short explanation.
- One combined order/tracking-number field.
- Email field.
- Turnstile widget.
- Submit button.
- Privacy link.
- Contact fallback.
- Link to main Sun Container website.
- German/English language switch.

Do not show an admin login link prominently to customers. A discreet link in the footer is acceptable.

## 25.2 Lookup response

On success, display:

- Customer first name or appropriate greeting.
- Order number.
- Tracking number, partially masked if desired.
- Product description.
- Current status.
- Four-stage progress timeline.
- Current estimated delivery date.
- Last updated date.
- Status-specific message.
- Sun Container support contact.
- Notice that dates are estimates where appropriate.

Never display:

- Customer email.
- Internal note.
- Internal reason.
- Salesperson email.
- Staff names.
- Audit information.
- Email logs.
- Database UUIDs.

## 25.3 Failed lookup

Use a generic response:

> We could not find an active order matching the information provided.

Do not reveal whether:

- The number exists.
- The email exists.
- The order is archived.
- The number and email belong to different records.

## 25.4 Secure-link page

Route:

```text
/track/[token]
```

Behavior:

- Verify signature.
- Verify purpose.
- Load order.
- Compare token version with `tracking_link_version`.
- Reject archived/unavailable orders.
- Render the same order result component.
- Do not include token in analytics or client logs.
- Add no-referrer protections where appropriate.
- Provide manual lookup fallback when invalid.

## 25.5 Caching

Customer order pages and public lookup results must not be statically cached or shared between users.

Use dynamic rendering and appropriate headers:

```text
Cache-Control: no-store
```

Do not place private tracking content in a public CDN cache.

---

# 26. Public Lookup Security

Implement:

- Server-side Turnstile verification.
- IP-based rate limit.
- Identifier/email based rate limit using hashes.
- Generic errors.
- Request-size limits.
- Zod validation.
- Normalization.
- Structured security logging.
- Temporary lockout behavior.
- No raw PII in lookup-attempt logs.

Suggested starting limits:

- 10 lookup attempts per 10 minutes per IP.
- 5 attempts per 15 minutes per identifier/email combination.
- A stricter limit after repeated failures.

Make limits configurable.

Do not trust client-provided IP headers indiscriminately. Use the deployment platform’s trusted request metadata.

---

# 27. Administration Dashboard

## 27.1 Dashboard page

Display:

- Active orders.
- Order received count.
- In production count.
- In transit count.
- Delivered during a selected period.
- Overdue active orders.
- Orders due within seven days.
- Failed/bounced mandatory emails.
- Recent status changes.
- Quick action to create an order.

Counts must respect the current employee’s permissions.

## 27.2 Order list

Columns:

- Order number.
- Tracking number.
- Customer.
- Product description summary.
- Status.
- Estimated delivery date.
- Assigned salesperson.
- Email warning.
- Last update.

Features:

- Search.
- Status filter.
- Salesperson filter.
- Delivery-date range.
- Overdue filter.
- Active/archived filter.
- Sort.
- Server-side pagination.
- Responsive mobile card view or horizontal table treatment.
- URL-based filter state where useful.

## 27.3 Create order page

Fields:

- First name.
- Last name.
- Email.
- Preferred language.
- Assigned salesperson.
- Fallback salesperson email.
- Order number:
  - Auto-generate default
  - Manual entry option
- Tracking number:
  - Generated automatically
  - Regeneration before save allowed
- Estimated delivery date.
- Product description.
- Initial internal note.

Display:

- Mandatory confirmation email notice.
- Mandatory salesperson notification notice.
- Data-validation errors.
- Final summary before creation where useful.

## 27.4 Order details page

Sections:

1. Order header and status.
2. Customer details.
3. Order details.
4. Status action.
5. Estimated delivery date action.
6. Customer-facing preview.
7. Status timeline.
8. Date-change history.
9. Internal notes.
10. Mandatory email history.
11. Optional communication.
12. Audit information according to role.

Use tabs or sections without hiding critical status information.

## 27.5 Status-change dialog

Show:

- Current status.
- Next permitted status.
- Estimated delivery date.
- Mandatory email subject/preview.
- Confirmation.
- Override controls only for super admin.

Disable duplicate submission.

## 27.6 Email history

Display:

- Email type.
- Recipient.
- Category.
- Queued time.
- Current state.
- Sent/delivered/bounced time.
- Attempts.
- Safe error summary.
- Retry action when allowed.

Do not display raw provider payloads to normal staff.

## 27.7 User management

Super admin only:

- List employees.
- Invite/create employee.
- Assign role.
- Deactivate.
- Reactivate.
- See last login.
- Prevent the final active super admin from being deactivated.
- Audit every role or activation change.

No public employee registration.

---

# 28. Authentication

Use Supabase Auth with server-side cookie sessions.

Requirements:

- Email/password login.
- Forgot-password flow.
- Reset-password flow.
- Secure cookie configuration.
- Session validation on the server.
- Protected admin layouts.
- No public sign-up route.
- Disable public sign-ups in Supabase configuration.
- Active-profile check after authentication.
- Role check for every protected operation.
- Logout.
- Optional MFA foundation, with MFA enabled before or shortly after production launch.

Use the current Supabase SSR pattern and current Next.js proxy convention. Do not copy outdated middleware code without verification.

Do not trust email or role values from browser-submitted forms.

---

# 29. Server Components, Server Actions and Route Handlers

Use Server Components by default.

Use Client Components only where needed for:

- Interactive forms.
- Dialogs.
- Tables requiring client interaction.
- Toasts.
- Turnstile.
- Language switching.
- Optimistic UI where justified.

Use Server Actions for authenticated admin mutations where appropriate.

Use Route Handlers for:

- Public lookup API.
- Resend webhook.
- Cron worker.
- Health check.
- Authentication callbacks required by provider flow.

All mutation logic must live in reusable server-side feature services, not directly in UI components.

Example layering:

```text
page/component
    ↓
server action / route handler
    ↓
authorization
    ↓
validation
    ↓
feature service
    ↓
transaction/query
    ↓
audit/outbox
```

---

# 30. Error Handling

Create typed application errors such as:

```ts
AppError
ValidationError
AuthenticationError
AuthorizationError
NotFoundError
ConflictError
RateLimitError
ExternalServiceError
```

Requirements:

- User-safe messages.
- Internal error codes.
- Request/correlation ID.
- No stack trace in production responses.
- No secret values in logs.
- No customer PII in generic error monitoring unless explicitly controlled.
- Friendly error boundary pages.
- Retryable UI for temporary failures.
- Conflict handling for concurrent order edits.

---

# 31. Optimistic Concurrency

Two administrators may edit the same order.

Use the `orders.version` column:

- Include current version in mutation input.
- Update only when version matches.
- Increment on success.
- Return a conflict when stale.
- Prompt the user to reload rather than silently overwriting newer data.

Status and date changes must be protected against stale writes.

---

# 32. Audit Requirements

Audit at least:

- User login where practical.
- User invited.
- User role changed.
- User activated/deactivated.
- Customer created.
- Customer edited.
- Order created.
- Order edited.
- Status changed.
- Status override.
- Estimated date changed.
- Internal note added/edited/deleted.
- Tracking link invalidated.
- Mandatory email queued.
- Email manually retried.
- Optional email sent.
- Order archived/restored.

Before/after data must exclude:

- Passwords.
- Auth tokens.
- Tracking-link secret.
- API keys.
- Full email HTML.
- Turnstile token.
- Raw session cookies.

---

# 33. Internationalization

Support `de` and `en`.

Default locale: German.

Store customer preferred language on the customer record.

Use centralized dictionaries:

```text
src/i18n/de.ts
src/i18n/en.ts
```

Do not scatter customer-facing copy across business logic.

Email locale comes from the customer’s stored preference.

Admin language may follow the authenticated user’s preference later; MVP may default to German with an English option.

Formatting:

- German date: `DD.MM.YYYY`.
- English date: localized readable format.
- Do not localize internal enum values directly; map them to labels.
- Keep email template variables locale-neutral.

---

# 34. Accessibility

Target WCAG 2.2 AA where practical.

Requirements:

- Keyboard access.
- Visible focus.
- Proper labels.
- Error messages associated with fields.
- Status not communicated by color alone.
- Sufficient contrast.
- Accessible dialogs.
- Semantic headings.
- Screen-reader descriptions for progress.
- Reduced-motion support.
- Minimum touch-target size.
- Responsive tables.
- Alt text rules.
- No placeholder-only labels.

---

# 35. Privacy and Data Protection

The application handles personal and order data.

Implement:

- Data minimization.
- No unnecessary analytics.
- No marketing trackers in the MVP.
- No customer data in URLs except signed opaque token data.
- No PII in client logs.
- Noindex and nofollow for the entire tracking subdomain.
- Short retention for lookup-attempt logs.
- Configurable retention plan for completed orders.
- Archive rather than delete during normal operations.
- Admin procedure for correction/anonymization.
- Processor/vendor documentation.
- Privacy page linked from the public portal.
- Cookie-free experience where possible.

`robots.ts` should disallow indexing, and private pages should include noindex metadata.

---

# 36. Security Headers

Configure appropriate headers centrally, including:

- Content-Security-Policy
- Referrer-Policy
- X-Content-Type-Options
- Permissions-Policy
- frame-ancestors through CSP
- Strict-Transport-Security in production
- X-Robots-Tag where applicable

CSP must support required services without using broad unsafe wildcards.

Do not break Turnstile or Supabase auth callbacks. Document exceptions.

---

# 37. Search and Pagination

Admin search must be server-side.

Support:

- Order number exact/partial.
- Tracking number exact/partial.
- Customer name.
- Customer email.
- Product description where useful.

Normalize inputs.

Use pagination; do not load all orders into the browser.

Avoid leading-wildcard searches on very large tables without suitable indexing. Start with practical indexes and document scaling improvements.

---

# 38. Email Deliverability Setup

Production launch requires:

- Dedicated sending domain or subdomain.
- SPF.
- DKIM.
- DMARC.
- Verified Resend domain.
- Monitored reply-to address.
- Proper sender identity.
- Bounce and complaint webhooks.
- Production recipient testing.
- Text and HTML versions.
- No sending from a personal mailbox.

Recommended sender:

```text
Sun Container <tracking@updates.suncontainer.de>
```

Actual DNS and sender values require client approval.

---

# 39. Deployment Architecture

```text
Customer / Employee Browser
           │
           ▼
tracking.suncontainer.de
           │
           ▼
Vercel / Next.js App Router
├── Public tracking pages
├── Admin pages
├── Server Actions
├── Route Handlers
├── Webhook endpoint
└── Cron email worker
           │
           ├────────► Supabase Auth
           │
           ├────────► Supabase PostgreSQL
           │
           ├────────► Upstash rate limit
           │
           ├────────► Cloudflare Turnstile verification
           │
           ├────────► Resend
           │                 │
           │                 └──── Verified webhooks
           │
           └────────► Sentry
```

## 39.1 Region

Prefer an EU deployment close to the database.

Target:

- Vercel Function region: Frankfurt (`fra1`) when supported by the selected plan.
- Supabase project: Frankfurt or closest appropriate EU region.

Keep compute and database close.

## 39.2 Vercel configuration

Create `vercel.json` with:

- Region preference where supported.
- Cron schedule.
- No secrets.
- Appropriate function configuration only when required.

Example shape:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "regions": ["fra1"],
  "crons": [
    {
      "path": "/api/cron/process-email-outbox",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

Verify the selected Vercel plan supports the desired region and cron frequency before relying on this configuration.

## 39.3 Environments

### Local

- Development database or local Supabase.
- `EMAIL_MODE=log`.
- Turnstile test keys.
- No customer data.

### Preview

- Separate staging database.
- `EMAIL_MODE=sandbox`.
- Allowlist internal test addresses.
- No production customer data.
- Separate webhook configuration where possible.

### Production

- Production Supabase project.
- Production Resend key.
- Verified domain.
- Real recipient sending.
- Production Turnstile.
- Sentry enabled.
- Cron enabled.
- Backups verified.

---

# 40. Subdomain Setup

Production steps:

1. Deploy project to Vercel.
2. Add `tracking.suncontainer.de`.
3. Configure the DNS record requested by Vercel.
4. Confirm HTTPS.
5. Set production application URL.
6. Configure Supabase allowed redirect URLs.
7. Configure Resend webhook URL.
8. Configure Turnstile allowed hostname.
9. Configure sender DNS records.
10. Test from an external network.
11. Verify no preview environment can send customer email.
12. Verify secure links use the production host.

---

# 41. Testing Strategy

## 41.1 Unit tests

Test:

- Status transition rules.
- Role permission matrix.
- Order-number normalization.
- Tracking-number generation.
- Tracking-number normalization.
- Signed link creation and verification.
- Link-version invalidation.
- Email idempotency-key generation.
- Retry backoff.
- Date validation.
- Locale formatting.
- Suppression logic.
- Redaction utilities.

## 41.2 Integration tests

Test:

- Create-order transaction.
- Duplicate order number handling.
- Tracking-number collision retry.
- Status update transaction.
- Status history creation.
- Delivery-date history creation.
- Outbox insertion.
- Outbox claim concurrency.
- Webhook idempotency.
- Bounce suppression.
- Archive and restore.
- Public lookup success.
- Public lookup generic failure.
- Authorization query scoping.

## 41.3 End-to-end tests

Test:

1. Admin signs in.
2. Admin creates an order.
3. Confirmation and salesperson emails appear in outbox.
4. Customer performs manual lookup.
5. Customer opens secure tracking link.
6. Admin changes status.
7. Customer sees new status.
8. Email history reflects queued/simulated state.
9. Admin changes delivery date.
10. Customer sees new date.
11. Optional email remains disabled by default.
12. Sales user cannot access another salesperson’s order.
13. Read-only user cannot mutate.
14. Invalid token displays generic failure.
15. Repeated lookup triggers rate limiting.
16. Archived order is unavailable publicly.

Use Turnstile test keys for automated browser tests.

## 41.4 Production smoke test

Before launch:

- Create a real internal test order.
- Send all four mandatory email types to internal addresses.
- Verify links.
- Verify mobile layout.
- Verify webhook delivery state.
- Verify bounce test.
- Verify retry.
- Verify role restrictions.
- Verify database backup.
- Verify privacy/noindex behavior.
- Archive test data.

---

# 42. Seed Data

Provide a development seed script.

Include:

- One super-admin profile placeholder linked only after a real auth user exists.
- One admin.
- One sales user.
- One read-only user.
- Several fake customers.
- Orders in every status.
- One overdue order.
- One failed email example.
- One delivered order.
- One optional-email eligible example.

Use reserved fake domains such as `example.com`.

Seed commands must refuse to run against production unless an explicit safety override is provided.

Never commit real credentials or personal customer data.

---

# 43. Observability

Implement:

- Sentry error reporting.
- Structured server logs.
- Request ID.
- Cron summary logs.
- Webhook processing logs.
- Email state dashboard.
- Failed mandatory email dashboard alert.
- Health endpoint with non-sensitive checks.

The health endpoint must not expose:

- Database credentials.
- Provider keys.
- Customer counts unless approved.
- Stack traces.
- Environment variable values.

Suggested response:

```json
{
  "status": "ok",
  "app": "sun-container-tracking",
  "timestamp": "..."
}
```

A deeper authenticated health check may verify external dependencies later.

---

# 44. Performance

Requirements:

- Server-render first customer view.
- Avoid unnecessary client JavaScript.
- Paginate admin lists.
- Use database indexes.
- Avoid N+1 queries.
- Use `next/image` for logos.
- Use dynamic/no-store behavior for customer-specific data.
- Keep dashboard aggregations efficient.
- Use loading states.
- Avoid large UI libraries.
- Do not fetch the same order repeatedly in one request.
- Cache only non-sensitive static configuration.

---

# 45. Code Quality Rules

- Strict TypeScript.
- Named domain types.
- No magic status strings outside centralized definitions.
- No duplicated permission matrices.
- No duplicated email-type mappings.
- No direct database calls from React client components.
- No direct provider calls from UI components.
- No hardcoded production URL.
- No hardcoded secrets.
- No business logic embedded in Tailwind-heavy components.
- Use feature services.
- Use transactions.
- Use unique constraints.
- Use explicit error handling.
- Write comments for why, not what.
- Keep files focused.
- Prefer composition.
- Avoid premature abstractions.
- Remove dead code.
- Do not leave placeholder security TODOs at launch.

---

# 46. Required Documentation

Codex must create and maintain:

## `docs/PROGRESS.md`

Contains:

- Phase checklist.
- Completed date.
- Validation results.
- Known blockers.
- Next phase.
- Manual setup still required.

## `docs/DECISIONS.md`

Architecture decision records for:

- Database access method.
- Auth/session strategy.
- Tracking-link strategy.
- Email outbox strategy.
- Rate-limit strategy.
- Locale strategy.
- Deployment region.
- Any deviation from this file.

## `docs/DEPLOYMENT.md`

Contains:

- Supabase setup.
- Vercel setup.
- DNS.
- Environment variables.
- Migrations.
- Cron.
- Webhooks.
- Rollback.
- Production smoke test.

## `docs/EMAIL_SETUP.md`

Contains:

- Resend domain setup.
- SPF/DKIM/DMARC.
- Sender.
- Webhook.
- Test modes.
- Retry.
- Bounce handling.

## `docs/SECURITY.md`

Contains:

- Threat model.
- Access model.
- Public lookup protection.
- Secret management.
- Incident response.
- Retention.
- Audit access.
- Security headers.

## `docs/TESTING.md`

Contains:

- Commands.
- Test database setup.
- Turnstile test keys.
- Email test mode.
- E2E setup.
- CI behavior.

---

# 47. Implementation Phases

# Phase 0 — Repository and Documentation

Tasks:

- Initialize Next.js.
- Add this file.
- Add assets.
- Add core dependencies.
- Add scripts.
- Add environment validation.
- Add initial docs.
- Add CI workflow.
- Create base layouts.
- Confirm build.

Acceptance:

- App runs locally.
- Logos render.
- Lint passes.
- Typecheck passes.
- Unit test runner works.
- Build passes.
- No secrets committed.

# Phase 1 — Database Foundation

Tasks:

- Configure Drizzle.
- Create enums.
- Create all MVP tables.
- Add constraints.
- Add indexes.
- Add timestamps.
- Add migration.
- Add database client.
- Add seed safety.
- Add database tests.

Acceptance:

- Fresh database migrates.
- Seed works only in non-production.
- Unique order/tracking constraints work.
- Tables are not publicly readable.
- Transaction test passes.

# Phase 2 — Authentication and Authorization

Tasks:

- Supabase SSR clients.
- Proxy/session refresh.
- Login.
- Logout.
- Forgot/reset password.
- Profile loading.
- Role utilities.
- Protected admin layout.
- Initial admin script.
- Disable public signup.
- Permission tests.

Acceptance:

- Unauthenticated users cannot access admin.
- Inactive users cannot access admin.
- Role checks run server-side.
- Read-only mutation is rejected.
- No auth secrets reach browser bundles.

# Phase 3 — Order and Customer Management

Tasks:

- Customer create/reuse flow.
- Order number generation.
- Tracking number generation.
- Create order transaction.
- Order list.
- Search/filter/pagination.
- Order details.
- Edit allowed fields.
- Internal notes.
- Audit logs.
- Concurrency version checks.

Acceptance:

- Admin creates an order.
- Initial history exists.
- Duplicate identifiers fail safely.
- Sales sees only assigned orders.
- Notes never appear in public DTOs.
- Stale edits return conflict.

# Phase 4 — Status and Delivery Date Workflow

Tasks:

- Transition rules.
- Status-change action.
- Override action.
- Status timeline.
- Date-change action.
- Date history.
- Delivered behavior.
- Archive/restore.
- Customer preview component.
- Tests.

Acceptance:

- Normal sequence enforced.
- Override requires reason.
- Every change creates immutable history.
- Current date updates correctly.
- Archive invalidates public access.

# Phase 5 — Public Tracking Portal

Tasks:

- Branded public layout.
- Lookup form.
- Turnstile adapter.
- Rate-limit adapter.
- Lookup endpoint.
- Secure signed links.
- Result page.
- Generic errors.
- No-store behavior.
- German/English copy.
- Accessibility.
- Tests.

Acceptance:

- Correct order can be retrieved.
- Wrong combinations reveal nothing.
- Secure link works.
- Invalidated link fails.
- Internal fields are absent.
- Rate limit works.
- Customer pages are not cached or indexed.

# Phase 6 — Email Templates and Outbox

Tasks:

- React Email foundation.
- Mandatory templates.
- Salesperson template.
- Outbox service.
- Deterministic idempotency keys.
- Immediate dispatch.
- Retry worker.
- Cron route.
- Environment email modes.
- Admin email history.
- Tests.

Acceptance:

- Order creation queues two emails.
- Status change queues one mandatory customer email.
- Retrying does not duplicate.
- External failure does not roll back order.
- Preview cannot send to a real customer.
- Stale processing locks recover.

# Phase 7 — Webhooks and Delivery Monitoring

Tasks:

- Verified Resend webhook.
- Event deduplication.
- Status mapping.
- Bounce handling.
- Complaint handling.
- Suppression list.
- Admin warnings.
- Retry controls.
- Tests.

Acceptance:

- Invalid signature rejected.
- Duplicate event processed once.
- Delivery updates history.
- Hard bounce suppresses repeated sending.
- Corrected email can be retried through authorized flow.

# Phase 8 — Optional Emails

Tasks:

- Preference model UI.
- Template previews.
- Review request.
- Satisfaction survey.
- Maintenance recommendation.
- Warranty reminder.
- Explicit confirmation.
- Eligibility checks.
- Audit.
- Promotional placeholder disabled by default.

Acceptance:

- Nothing sends automatically.
- Defaults are disabled.
- Suppressed customers cannot receive optional mail.
- Promotional email requires permission.
- Every send is audited.

# Phase 9 — Dashboard and Operational Polish

Tasks:

- Dashboard metrics.
- Overdue alerts.
- Failed email alerts.
- Responsive admin navigation.
- Empty/loading/error states.
- Mobile order cards.
- Accessibility pass.
- Preliminary Sun Container styling.
- Brand email styling.

Acceptance:

- Dashboard data respects role scope.
- Mobile workflows are usable.
- Brand assets used correctly.
- No final-design dependency blocks operation.

# Phase 10 — Security, Monitoring and Production Readiness

Tasks:

- Security headers.
- CSP.
- Sentry.
- Redaction.
- Noindex.
- Retention settings/documentation.
- Full test run.
- Dependency review.
- Preview/production separation.
- Production deployment documentation.
- Backup and rollback procedure.
- Smoke test checklist.

Acceptance:

- All validation commands pass.
- No high-severity known security issue.
- No customer email from preview.
- Production env validation works.
- Deployment documentation complete.
- Client setup actions clearly listed.

# Phase 11 — Vercel Deployment

Tasks:

- Create Vercel project.
- Configure EU region.
- Configure environment variables.
- Configure production domain.
- Configure cron.
- Run migrations.
- Configure Supabase URLs.
- Configure Resend webhook.
- Configure Turnstile hostname.
- Verify DNS/email.
- Execute smoke tests.

Acceptance:

- `tracking.suncontainer.de` uses HTTPS.
- Admin login works.
- Customer lookup works.
- Mandatory email works.
- Delivery webhook works.
- Failed email retry works.
- Noindex confirmed.
- Monitoring receives test error.
- Rollback procedure tested.

---

# 48. Definition of Done

The MVP is done only when:

- An administrator can create a tracking record.
- A customer confirmation email is queued automatically.
- The assigned salesperson is notified automatically.
- A customer can track using reference plus email.
- A customer can open a secure email link.
- Four statuses work with controlled transitions.
- Every mandatory status email is queued.
- Estimated date is always shown and editable.
- Status and date histories are immutable.
- Internal notes remain private.
- Optional emails require explicit action.
- Email delivery history is visible.
- Failed emails can be retried safely.
- Duplicate emails are prevented.
- Roles are enforced server-side.
- Lookup abuse is limited.
- Public pages are not cached or indexed.
- German and English content works.
- Desktop and mobile layouts work.
- Lint, typecheck, tests and build pass.
- Vercel production deployment works.
- Deployment and operational documentation is complete.

---

# 49. Manual Client Inputs Required Before Production

Codex must maintain a checklist for information the developer/client must supply:

- Supabase organization/project.
- Chosen EU database region.
- Initial super-admin email.
- Internal employee names, emails and roles.
- Vercel team/project.
- Vercel plan.
- DNS access for `suncontainer.de`.
- Resend account.
- Approved sender subdomain.
- Reply-to address.
- SPF/DKIM/DMARC access.
- Resend webhook secret.
- Cloudflare Turnstile account and hostname.
- Upstash account.
- Final privacy-policy text.
- Data-retention period.
- German and English email copy approval.
- Optional-email compliance approval.
- Main website return URL.
- Final support phone/email.
- Final preferred admin language.
- Confirmation of MFA launch requirement.

Do not invent these values.

---

# 50. Future Architecture Hooks

The following future features should be possible without changing core order identity:

## Customer accounts

Add customer authentication and map customer users to customer records.

## PDF invoices

Add document metadata and private object storage with signed URLs.

## Production photographs

Add order media table and private storage.

## GPS shipment tracking

Add shipment and location-event tables. Keep operational order status separate from raw GPS events.

## WhatsApp/SMS

Add provider adapters and new outbox channels. Do not overload the email table; create a generalized notification layer during that phase.

## Electronic delivery confirmation

Add delivery event, signer, timestamp, evidence and audit records.

## Support tickets

Add ticket/thread/message model linked to order and customer.

Do not implement these hooks as empty tables in the MVP. Maintain clean IDs and service boundaries so they can be added later.

---

# 51. First Codex Instruction

After placing this file and the supplied assets in the repository, use this instruction:

```text
Read SUN_CONTAINER_TRACKING_PROJECT.md completely.

Inspect the repository and begin with the first incomplete implementation phase. Do not skip phases and do not attempt final visual design yet. Follow the architecture, security requirements, database rules, email reliability requirements, asset usage rules and validation process in the specification.

Create or update docs/PROGRESS.md and docs/DECISIONS.md. Complete the current phase, run the required validation commands, fix failures and then stop with a summary of completed work, files changed, commands run, any manual setup required and the next phase.
```

---

# 52. Final Implementation Principle

The portal is not merely a status webpage. It is a small operational system handling customer data and mandatory communication.

Prioritize, in this order:

1. Data protection.
2. Correct authorization.
3. Reliable state changes.
4. Reliable email delivery.
5. Clear audit history.
6. Simple staff workflows.
7. Simple customer experience.
8. Responsive and accessible interface.
9. Brand consistency.
10. Later visual refinement.

Do not trade security or reliability for visual speed.
