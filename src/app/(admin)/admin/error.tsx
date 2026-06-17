"use client";

import { useEffect, useSyncExternalStore } from "react";

import { ADMIN_LOCALE_COOKIE, getAdminDictionary } from "@/i18n/admin";
import type { AppLocale } from "@/i18n/types";

type AdminErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

function readLocaleFromCookie(): AppLocale {
  if (typeof document === "undefined") {
    return "de";
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${ADMIN_LOCALE_COOKIE}=([^;]*)`));
  return match?.[1] === "en" ? "en" : "de";
}

// The cookie is client-only, so the value differs between server and client.
// useSyncExternalStore reads it hydration-safely (server snapshot "de", then the
// client snapshot from the cookie) without a setState-in-effect cascade.
const subscribeToNothing = () => () => {};

export default function AdminErrorPage({ error, reset }: AdminErrorPageProps) {
  const locale = useSyncExternalStore<AppLocale>(
    subscribeToNothing,
    readLocaleFromCookie,
    () => "de"
  );

  useEffect(() => {
    console.error(error);
  }, [error]);

  const t = getAdminDictionary(locale).errorBoundary;

  return (
    <main className="admin-shell">
      <section className="auth-panel" role="alert">
        <div className="auth-card">
          <p className="eyebrow">{t.eyebrow}</p>
          <h1 className="font-heading">{t.title}</h1>
          <p className="empty-copy">{t.body}</p>
          <button className="button-base button-primary" type="button" onClick={reset}>
            {t.retry}
          </button>
        </div>
      </section>
    </main>
  );
}
