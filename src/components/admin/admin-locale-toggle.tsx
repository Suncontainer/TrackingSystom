"use client";

import { Languages } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { ADMIN_LOCALE_COOKIE } from "@/i18n/admin";
import type { AppLocale } from "@/i18n/types";

type AdminLocaleToggleProps = {
  /** The language the button switches TO. */
  switchTo: AppLocale;
  /** Short label for the target language, e.g. "EN" or "DE". */
  switchLabel: string;
  /** Accessible label, e.g. "Language". */
  languageLabel: string;
};

export function AdminLocaleToggle({ switchTo, switchLabel, languageLabel }: AdminLocaleToggleProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleToggle() {
    document.cookie = `${ADMIN_LOCALE_COOKIE}=${switchTo}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      className="admin-locale-toggle"
      onClick={handleToggle}
      disabled={isPending}
      aria-label={`${languageLabel}: ${switchLabel}`}
    >
      <Languages size={16} aria-hidden="true" />
      <span>{switchLabel}</span>
    </button>
  );
}
