"use client";

import { ShieldCheck } from "lucide-react";
import Script from "next/script";
import { useEffect } from "react";

type TurnstileFieldProps = {
  siteKey: string | undefined;
};

declare global {
  interface Window {
    turnstile?: { reset: (widget?: string | HTMLElement) => void };
  }
}

export function TurnstileField({ siteKey }: TurnstileFieldProps) {
  useEffect(() => {
    if (!siteKey) {
      return;
    }

    // A Turnstile token is single-use. After a lookup the user often presses the
    // browser back button, which restores this page (and its already-spent token)
    // from the back/forward cache — so the next submit fails verification and
    // surfaces as a misleading "no order found". Reset the widget on bfcache
    // restore so it issues a fresh token.
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        window.turnstile?.reset();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [siteKey]);

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
      <div className="cf-turnstile" data-sitekey={siteKey} data-refresh-expired="auto" />
    </div>
  );
}
