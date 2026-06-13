import { KeyRound } from "lucide-react";
import Link from "next/link";

import { SunContainerLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { routes } from "@/config/routes";
import { resetPasswordAction } from "@/features/auth/actions";

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
  const params = searchParams ? await searchParams : {};
  const error = getSearchValue(params.error);

  return (
    <main className="auth-shell">
      <section className="auth-panel" aria-labelledby="reset-password-title">
        <SunContainerLogo variant="stacked-dark" className="auth-logo" priority />
        <div className="auth-card">
          <p className="eyebrow">Intern</p>
          <h1 id="reset-password-title" className="font-heading">
            Neues Passwort
          </h1>
          {error ? (
            <p className="form-feedback form-feedback--error" role="alert">
              Das Passwort muss mindestens 10 Zeichen haben und beide Eingaben muessen uebereinstimmen.
            </p>
          ) : null}
          <form action={resetPasswordAction}>
            <div className="form-field">
              <label htmlFor="new-password">Neues Passwort</label>
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
              <label htmlFor="new-password-confirm">Passwort wiederholen</label>
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
              Passwort speichern
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
