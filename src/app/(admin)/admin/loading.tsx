export default function AdminLoading() {
  return (
    <main className="admin-shell">
      <div className="admin-layout">
        <aside className="admin-sidebar" aria-hidden="true">
          <div className="skeleton skeleton-logo" />
          <div className="skeleton skeleton-nav" />
          <div className="skeleton skeleton-nav" />
          <div className="skeleton skeleton-nav" />
        </aside>
        <section className="admin-content" aria-label="Admin wird geladen">
          <div className="skeleton skeleton-eyebrow" />
          <div className="skeleton skeleton-title" />
          <div className="admin-grid">
            <div className="admin-card skeleton-card" />
            <div className="admin-card skeleton-card" />
            <div className="admin-card skeleton-card" />
            <div className="admin-card skeleton-card" />
          </div>
        </section>
      </div>
    </main>
  );
}
