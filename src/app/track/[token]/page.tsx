import Link from "next/link";

import { SunContainerLogo } from "@/components/brand/logo";
import { TrackingResult } from "@/components/tracking/tracking-result";
import { siteConfig } from "@/config/site";
import { getTrackingOrderByToken } from "@/features/tracking/lookup";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";
export const metadata = {
  robots: {
    follow: false,
    index: false,
    nocache: true
  },
  title: "Tracking"
};

type TrackingTokenPageProps = {
  params: Promise<{ token: string }>;
};

export default async function TrackingTokenPage({ params }: TrackingTokenPageProps) {
  const { token } = await params;
  const result = await getTrackingOrderByToken(decodeURIComponent(token));

  if (result.ok) {
    return (
      <div className="public-shell public-shell--result">
        <header className="public-header">
          <div className="public-header__inner">
            <Link href="/" aria-label="Sun Container Tracking">
              <SunContainerLogo variant="horizontal-dark" priority className="public-logo" />
            </Link>
          </div>
        </header>
        <main className="tracking-main">
          <TrackingResult order={result.order} />
        </main>
        <footer className="public-footer">
          <div className="public-footer__inner">
            <SunContainerLogo variant="horizontal-light" className="footer-logo" decorative />
            <div className="footer-links">
              <Link href="/privacy">Datenschutz</Link>
              <Link href={siteConfig.mainSiteUrl}>suncontainer.de</Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">Tracking</p>
          <h1 className="font-heading">Tracking-Link nicht verfügbar</h1>
          <p>Bitte nutzen Sie die manuelle Auftragssuche.</p>
          <Link href="/">Zur Auftragssuche</Link>
        </div>
      </section>
    </main>
  );
}
