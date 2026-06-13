import Link from "next/link";

import { SunContainerLogo } from "@/components/brand/logo";
import { siteConfig } from "@/config/site";

export const metadata = {
  title: "Datenschutz"
};

export default function PrivacyPage() {
  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <Link href="/">
          <SunContainerLogo variant="stacked-dark" className="auth-logo" priority />
        </Link>
        <div className="auth-card">
          <p className="eyebrow">Datenschutz</p>
          <h1 className="font-heading">Datenschutzhinweise</h1>
          <p>
            Diese Seite wird vor dem Produktivbetrieb mit der final freigegebenen
            Datenschutzerklärung ergänzt.
          </p>
          <p>
            Bei Fragen wenden Sie sich bitte an{" "}
            <a href={`mailto:${siteConfig.supportEmail}`}>{siteConfig.supportEmail}</a>.
          </p>
          <Link href="/">Zurück zur Auftragssuche</Link>
        </div>
      </section>
    </main>
  );
}
