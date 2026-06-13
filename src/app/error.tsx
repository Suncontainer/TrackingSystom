"use client";

import { useEffect } from "react";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Fehler</p>
          <h1 className="font-heading">Die Seite konnte nicht geladen werden.</h1>
          <button className="button-base button-primary" type="button" onClick={reset}>
            Erneut versuchen
          </button>
        </div>
      </section>
    </main>
  );
}
