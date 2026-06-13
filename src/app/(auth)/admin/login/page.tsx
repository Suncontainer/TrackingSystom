import { LogIn } from "lucide-react";
import Link from "next/link";

import { SunContainerLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { signInAction } from "@/features/auth/actions";
import { devAdminCredentials, isDevAdminLoginEnabled } from "@/features/auth/dev-login";

export const metadata = {
  title: "Admin Login"
};

type AdminLoginPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

const authMessages: Record<string, string> = {
  auth_required: "Bitte melden Sie sich an, um den Adminbereich zu nutzen.",
  auth_unconfigured: "Supabase Auth ist noch nicht konfiguriert.",
  callback_failed: "Der Anmeldelink konnte nicht bestätigt werden.",
  inactive: "Dieses Benutzerkonto ist deaktiviert.",
  invalid_credentials: "E-Mail-Adresse oder Passwort ist ungültig.",
  not_authorized: "Dieses Benutzerkonto hat keinen Zugriff auf diesen Bereich.",
  profile_missing: "Für diesen Login ist noch kein internes Benutzerprofil angelegt."
};

function getSearchValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = searchParams ? await searchParams : {};
  const error = getSearchValue(params.error);
  const reason = getSearchValue(params.reason);
  const reset = getSearchValue(params.reset);
  const messageKey = error ?? reason;
  const showDevCredentials = isDevAdminLoginEnabled();

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="admin-login-title">
        <SunContainerLogo variant="stacked-dark" className="auth-logo" priority />
        <div className="auth-card">
          <p className="eyebrow">Intern</p>
          <h1 id="admin-login-title" className="font-heading">
            Admin Login
          </h1>
          {messageKey ? (
            <p className="form-feedback form-feedback--error" role="alert">
              {authMessages[messageKey] ?? "Die Anmeldung konnte nicht abgeschlossen werden."}
            </p>
          ) : null}
          {reset === "success" ? (
            <p className="form-feedback" role="status">
              Das Passwort wurde aktualisiert. Bitte melden Sie sich erneut an.
            </p>
          ) : null}
          {showDevCredentials ? (
            <div className="form-feedback" role="note">
              <strong>Temporärer Login:</strong>
              <br />
              E-Mail: {devAdminCredentials.email}
              <br />
              Passwort: {devAdminCredentials.password}
            </div>
          ) : null}
          <form action={signInAction}>
            <div className="form-field">
              <label htmlFor="admin-email">E-Mail-Adresse</label>
              <input id="admin-email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="form-field">
              <label htmlFor="admin-password">Passwort</label>
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
              Anmelden
            </Button>
          </form>
          <p className="auth-link">
            <Link href={routes.admin.forgotPassword}>Passwort vergessen?</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
