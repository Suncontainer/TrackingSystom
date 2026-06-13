import Link from "next/link";

export default function NotFoundPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">404</p>
          <h1 className="font-heading">Seite nicht gefunden</h1>
          <Link href="/">Zur Auftragssuche</Link>
        </div>
      </section>
    </main>
  );
}
