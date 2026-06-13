import * as Sentry from "@sentry/nextjs";

function redactEvent(event: Sentry.ErrorEvent) {
  if (event.request?.headers) {
    delete event.request.headers.cookie;
    delete event.request.headers.authorization;
  }

  if (event.request?.data) {
    event.request.data = "[redacted]";
  }

  return event;
}

if (process.env.SENTRY_DSN) {
  Sentry.init({
    beforeSend: redactEvent,
    dsn: process.env.SENTRY_DSN,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.1 : 0
  });
}
