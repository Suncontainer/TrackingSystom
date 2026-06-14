import { ClipboardCheck, LockKeyhole, MailCheck, PackageCheck, Route } from "lucide-react";
import Link from "next/link";

import { SunContainerLogo } from "@/components/brand/logo";
import { TrackingLookupForm } from "@/components/tracking/tracking-lookup-form";
import { siteConfig } from "@/config/site";
import { orderStatuses, orderStatusContent } from "@/features/orders/status";
import { getPublicDictionary } from "@/i18n/get-locale";
import type { AppLocale } from "@/i18n/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type HomePageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

function getLocale(params: Record<string, string | string[] | undefined>): AppLocale {
  return getQueryValue(params, "lang") === "en" ? "en" : "de";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = searchParams ? await searchParams : {};
  const locale = getLocale(params);
  const dictionary = getPublicDictionary(locale);
  const failed = getQueryValue(params, "lookup") === "failed";
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const demoMode = process.env.DEMO_MODE === "true" || !process.env.DATABASE_URL;
  const journeyCards = [
    {
      icon: ClipboardCheck,
      label: locale === "de" ? "Auftrag erfasst" : "Order received"
    },
    {
      icon: MailCheck,
      label: locale === "de" ? "E-Mail simuliert" : "Email simulated"
    },
    {
      icon: Route,
      label: locale === "de" ? "Status live" : "Live status"
    },
    {
      icon: LockKeyhole,
      label: locale === "de" ? "Geschützter Zugriff" : "Protected access"
    }
  ];

  return (
    <div className="public-shell">
      <header className="public-header">
        <div className="public-header__inner">
          <Link href="/" aria-label="Sun Container Tracking">
            <SunContainerLogo variant="horizontal-dark" priority className="public-logo" />
          </Link>
          <nav className="language-switch" aria-label="Sprache">
            <Link href="/?lang=de" aria-current={locale === "de" ? "true" : undefined}>
              DE
            </Link>
            <Link href="/?lang=en" aria-current={locale === "en" ? "true" : undefined}>
              EN
            </Link>
          </nav>
        </div>
      </header>

      <main className="public-main">
        <section className="lookup-copy" aria-labelledby="lookup-title">
          <p className="eyebrow">
            <PackageCheck size={20} aria-hidden="true" />
            {dictionary.lookup.eyebrow}
          </p>
          <h1 id="lookup-title" className="hero-title">
            Sun Container <span>{dictionary.lookup.title}</span>
          </h1>
          <p className="hero-intro">{dictionary.lookup.intro}</p>

          <div className="journey-card-grid" aria-label="Tracking Journey">
            {journeyCards.map((card) => {
              const Icon = card.icon;

              return (
                <div className="journey-card" key={card.label}>
                  <Icon size={20} aria-hidden="true" />
                  <span>{card.label}</span>
                </div>
              );
            })}
          </div>

          <div className="status-strip" aria-label="Statusschritte">
            {orderStatuses.map((status) => (
              <div className="status-chip" key={status}>
                {orderStatusContent[status][locale].label}
              </div>
            ))}
          </div>

          {demoMode ? (
            <div className="demo-lookup-panel">
              <strong>{locale === "de" ? "Demo Lookup" : "Demo lookup"}</strong>
              <span>SC-2026-000001</span>
              <span>max.mustermann@example.com</span>
            </div>
          ) : null}
        </section>

        <TrackingLookupForm dictionary={dictionary} failed={failed} siteKey={siteKey} />
      </main>

      <footer className="public-footer">
        <div className="public-footer__inner">
          <SunContainerLogo variant="horizontal-light" className="footer-logo" decorative />
          <div className="footer-links">
            <Link href="/privacy">Datenschutz</Link>
            <Link href="/admin/login">Admin</Link>
            <Link href={siteConfig.mainSiteUrl}>suncontainer.de</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
