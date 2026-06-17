import { LogIn } from "lucide-react";
import Link from "next/link";

import { AdminLocaleToggle } from "@/components/admin/admin-locale-toggle";
import { SunContainerLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { signInAction } from "@/features/auth/actions";
import { devAdminCredentials, isDevAdminLoginEnabled } from "@/features/auth/dev-login";
import { getAdminContext } from "@/i18n/get-admin-locale";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin Login"
};

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const { t } = await getAdminContext();
  const a = t.auth;
  const params = searchParams ? await searchParams : {};
  const error = getSearchValue(params.error);
  const reason = getSearchValue(params.reason);
  const reset = getSearchValue(params.reset);
  const messageKey = error ?? reason;
  const showDevCredentials = isDevAdminLoginEnabled();

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="admin-login-title">
        <div className="auth-toolbar">
          <AdminLocaleToggle switchTo={t.switchToLocale} switchLabel={t.switchLabel} languageLabel={t.nav.language} />
        </div>
        <SunContainerLogo variant="stacked-dark" className="auth-logo" priority />
        <div className="auth-card">
          <p className="eyebrow">{a.intern}</p>
          <h1 id="admin-login-title" className="font-heading">
            {a.loginTitle}
          </h1>
          {messageKey ? (
            <p className="form-feedback form-feedback--error" role="alert">
              {(messageKey && a.messages[messageKey]) ?? a.loginFallback}
            </p>
          ) : null}
          {reset === "success" ? (
            <p className="form-feedback" role="status">
              {a.resetSuccess}
            </p>
          ) : null}
          {showDevCredentials ? (
            <div className="form-feedback" role="note">
              <strong>{a.tempLogin}</strong>
              <br />
              {a.emailLabel}: {devAdminCredentials.email}
              <br />
              {a.passwordLabel}: {devAdminCredentials.password}
            </div>
          ) : null}
          <form action={signInAction}>
            <div className="form-field">
              <label htmlFor="admin-email">{a.emailLabel}</label>
              <input id="admin-email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="form-field">
              <label htmlFor="admin-password">{a.passwordLabel}</label>
              <input
                id="admin-password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <Button type="submit" className="lookup-submit">
              <LogIn size={18} aria-hidden="true" />
              {a.signIn}
            </Button>
          </form>
          <p className="auth-link">
            <Link href={routes.admin.forgotPassword}>{a.forgotLink}</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
