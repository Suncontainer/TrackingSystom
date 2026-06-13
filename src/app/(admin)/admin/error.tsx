"use client";

type AdminErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AdminErrorPage({ error, reset }: AdminErrorPageProps) {
  console.error(error);

  return (
    <main className="admin-shell">
      <section className="auth-panel" role="alert">
        <div className="auth-card">
          <p className="eyebrow">Admin</p>
          <h1 className="font-heading">Die Ansicht konnte nicht geladen werden</h1>
          <p className="empty-copy">Bitte erneut versuchen. Falls der Fehler bleibt, pruefe die Server-Logs.</p>
          <button className="button-base button-primary" type="button" onClick={reset}>
            Erneut versuchen
          </button>
        </div>
      </section>
    </main>
  );
}
