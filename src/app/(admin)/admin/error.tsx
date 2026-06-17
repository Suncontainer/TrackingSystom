"use client";

import { useEffect, useState } from "react";

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

export default function AdminErrorPage({ error, reset }: AdminErrorPageProps) {
  // Default to German on the server render, then sync to the saved locale on the client
  // to avoid a hydration mismatch.
  const [locale, setLocale] = useState<AppLocale>("de");

  useEffect(() => {
    console.error(error);
    setLocale(readLocaleFromCookie());
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
