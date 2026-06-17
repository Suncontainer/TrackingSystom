import { Mail } from "lucide-react";
import Link from "next/link";

import { AdminLocaleToggle } from "@/components/admin/admin-locale-toggle";
import { SunContainerLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { forgotPasswordAction } from "@/features/auth/actions";
import { getAdminContext } from "@/i18n/get-admin-locale";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Passwort Zuruecksetzen"
};

type ForgotPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ForgotPasswordPage({ searchParams }: ForgotPasswordPageProps) {
  const { t } = await getAdminContext();
  const a = t.auth;
  const params = searchParams ? await searchParams : {};
  const sent = getSearchValue(params.sent);
  const error = getSearchValue(params.error);

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="forgot-password-title">
        <div className="auth-toolbar">
          <AdminLocaleToggle switchTo={t.switchToLocale} switchLabel={t.switchLabel} languageLabel={t.nav.language} />
        </div>
        <SunContainerLogo variant="stacked-dark" className="auth-logo" priority />
        <div className="auth-card">
          <p className="eyebrow">{a.intern}</p>
          <h1 id="forgot-password-title" className="font-heading">
            {a.forgotTitle}
          </h1>
          {sent === "1" ? (
            <p className="form-feedback" role="status">
              {a.forgotSent}
            </p>
          ) : null}
          {error ? (
            <p className="form-feedback form-feedback--error" role="alert">
              {a.forgotError}
            </p>
          ) : null}
          <form action={forgotPasswordAction}>
            <div className="form-field">
              <label htmlFor="forgot-email">{a.emailLabel}</label>
              <input id="forgot-email" name="email" type="email" autoComplete="email" required />
            </div>
            <Button type="submit" className="lookup-submit">
              <Mail size={18} aria-hidden="true" />
              {a.sendLink}
            </Button>
          </form>
          <p className="auth-link">
            <Link href={routes.admin.login}>{a.backToLogin}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
