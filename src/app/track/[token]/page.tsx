import Link from "next/link";

import { SunContainerLogo } from "@/components/brand/logo";
import { TrackingResult } from "@/components/tracking/tracking-result";
import { siteConfig } from "@/config/site";
import { getTrackingOrderByToken } from "@/features/tracking/lookup";
import { getPublicDictionary } from "@/i18n/get-locale";
import type { AppLocale } from "@/i18n/types";

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
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getQueryValue(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

// The status page defaults to the customer's saved language, but a ?lang= override
// lets the recipient switch via the on-page toggle.
function getLangOverride(params: Record<string, string | string[] | undefined>): AppLocale | null {
  const value = getQueryValue(params, "lang");
  if (value === "en") {
    return "en";
  }
  if (value === "de") {
    return "de";
  }
  return null;
}

function LanguageSwitch({ token, locale }: { token: string; locale: AppLocale }) {
  return (
    <nav className="language-switch" aria-label={locale === "de" ? "Sprache" : "Language"}>
      <Link href={`/track/${token}?lang=de`} aria-current={locale === "de" ? "true" : undefined}>
        DE
      </Link>
      <Link href={`/track/${token}?lang=en`} aria-current={locale === "en" ? "true" : undefined}>
        EN
      </Link>
    </nav>
  );
}

export default async function TrackingTokenPage({ params, searchParams }: TrackingTokenPageProps) {
  const { token } = await params;
  const query = searchParams ? await searchParams : {};
  const langOverride = getLangOverride(query);
  const result = await getTrackingOrderByToken(decodeURIComponent(token));

  if (result.ok) {
    const locale = langOverride ?? result.order.locale;
    const dictionary = getPublicDictionary(locale);

    return (
      <div className="public-shell public-shell--result">
        <header className="public-header">
          <div className="public-header__inner">
            <Link href="/" aria-label="Sun Container Tracking">
              <SunContainerLogo variant="horizontal-dark" priority className="public-logo" />
            </Link>
            <LanguageSwitch token={token} locale={locale} />
          </div>
        </header>
        <main className="tracking-main">
          <TrackingResult order={result.order} locale={locale} />
        </main>
        <footer className="public-footer">
          <div className="public-footer__inner">
            <SunContainerLogo variant="horizontal-light" className="footer-logo" decorative />
            <div className="footer-links">
              <Link href="/privacy">{dictionary.lookup.privacy}</Link>
              <Link href={siteConfig.mainSiteUrl}>suncontainer.de</Link>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  const locale = langOverride ?? "de";
  const dictionary = getPublicDictionary(locale);

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="auth-card">
          <p className="eyebrow">{dictionary.tokenError.eyebrow}</p>
          <h1 className="font-heading">{dictionary.tokenError.title}</h1>
          <p>{dictionary.tokenError.body}</p>
          <Link href="/">{dictionary.tokenError.cta}</Link>
        </div>
      </section>
    </main>
  );
}
