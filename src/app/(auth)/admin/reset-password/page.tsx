import { KeyRound } from "lucide-react";
import Link from "next/link";

import { AdminLocaleToggle } from "@/components/admin/admin-locale-toggle";
import { SunContainerLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { resetPasswordAction } from "@/features/auth/actions";
import { getAdminContext } from "@/i18n/get-admin-locale";

export const metadata = {
  title: "Neues Passwort"
};

type ResetPasswordPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { t } = await getAdminContext();
  const a = t.auth;
  const params = searchParams ? await searchParams : {};
  const error = getSearchValue(params.error);

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="reset-password-title">
        <div className="auth-toolbar">
          <AdminLocaleToggle switchTo={t.switchToLocale} switchLabel={t.switchLabel} languageLabel={t.nav.language} />
        </div>
        <SunContainerLogo variant="stacked-dark" className="auth-logo" priority />
        <div className="auth-card">
          <p className="eyebrow">{a.intern}</p>
          <h1 id="reset-password-title" className="font-heading">
            {a.resetTitle}
          </h1>
          {error ? (
            <p className="form-feedback form-feedback--error" role="alert">
              {a.resetError}
            </p>
          ) : null}
          <form action={resetPasswordAction}>
            <div className="form-field">
              <label htmlFor="new-password">{a.newPasswordLabel}</label>
              <input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                minLength={10}
                required
              />
            </div>
            <div className="form-field">
              <label htmlFor="new-password-confirm">{a.confirmPasswordLabel}</label>
              <input
                id="new-password-confirm"
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                minLength={10}
                required
              />
            </div>
            <Button type="submit" className="lookup-submit">
              <KeyRound size={18} aria-hidden="true" />
              {a.savePassword}
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
