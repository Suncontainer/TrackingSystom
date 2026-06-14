import { ShieldCheck } from "lucide-react";
import Script from "next/script";

type TurnstileFieldProps = {
  siteKey: string | undefined;
};

export function TurnstileField({ siteKey }: TurnstileFieldProps) {
  if (!siteKey) {
    return (
      <div className="turnstile-placeholder" aria-label="Sicherheitsprüfung">
        <span>
          <ShieldCheck size={18} aria-hidden="true" />
          Sicherheitsprüfung
        </span>
        <input name="turnstileToken" type="hidden" value="development-bypass" />
      </div>
    );
  }

  return (
    <div className="turnstile-frame">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
      <div className="cf-turnstile" data-sitekey={siteKey} />
    </div>
  );
}
