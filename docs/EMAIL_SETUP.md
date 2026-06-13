# Email Setup

## Provider

MVP email delivery uses Resend with a database outbox. Phase 6 implements templates, dispatch, retry, and email modes.

## Sender

Recommended sender:

```text
Sun Container <tracking@updates.suncontainer.de>
```

The final sender domain and reply-to address require client approval.

## DNS

Production requires SPF, DKIM, and DMARC records for the approved sending domain.

## Modes

- `log`: Store and log redacted previews without calling Resend.
- `sandbox`: Send only to allowlisted internal addresses.
- `production`: Send to actual recipients from the verified production environment only.

## Webhook

Resend webhooks are implemented in Phase 7 at `/api/webhooks/resend` and must verify `RESEND_WEBHOOK_SECRET`.

## Retry and Bounce Handling

Retry scheduling, stale lock recovery, bounces, complaints, and suppressions are implemented in Phases 6 and 7.
