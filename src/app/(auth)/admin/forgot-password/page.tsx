import { Mail } from "lucide-react";
import Link from "next/link";

import { SunContainerLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { forgotPasswordAction } from "@/features/auth/actions";

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
  const params = searchParams ? await searchParams : {};
  const sent = getSearchValue(params.sent);
  const error = getSearchValue(params.error);

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="forgot-password-title">
        <SunContainerLogo variant="stacked-dark" className="auth-logo" priority />
        <div className="auth-card">
          <p className="eyebrow">Intern</p>
          <h1 id="forgot-password-title" className="font-heading">
            Passwort zuruecksetzen
          </h1>
          {sent === "1" ? (
            <p className="form-feedback" role="status">
              Wenn die Adresse berechtigt ist, wurde ein Link zum Zuruecksetzen gesendet.
            </p>
          ) : null}
          {error ? (
            <p className="form-feedback form-feedback--error" role="alert">
              Bitte geben Sie eine gueltige E-Mail-Adresse ein.
            </p>
          ) : null}
          <form action={forgotPasswordAction}>
            <div className="form-field">
              <label htmlFor="forgot-email">E-Mail-Adresse</label>
              <input id="forgot-email" name="email" type="email" autoComplete="email" required />
            </div>
            <Button type="submit" className="lookup-submit">
              <Mail size={18} aria-hidden="true" />
              Link senden
            </Button>
          </form>
          <p className="auth-link">
            <Link href={routes.admin.login}>Zur Anmeldung</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
