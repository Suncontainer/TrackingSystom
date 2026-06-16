import { Search } from "lucide-react";

import type { PublicDictionary } from "@/i18n/types";
import { lookupTrackingAction } from "@/features/tracking/actions";
import { genericLookupFailure } from "@/features/tracking/lookup";

import { Button } from "../ui/button";
import { TurnstileField } from "./turnstile-field";

type TrackingLookupFormProps = {
  dictionary: PublicDictionary;
  failed?: boolean;
  siteKey: string | undefined;
};

export function TrackingLookupForm({ dictionary, failed = false, siteKey }: TrackingLookupFormProps) {
  return (
    <section className="lookup-card" aria-label={dictionary.lookup.formAriaLabel}>
      {failed ? (
        <p className="form-feedback form-feedback--error" role="status">
          {genericLookupFailure}
        </p>
      ) : null}
      <form action={lookupTrackingAction}>
        <div className="form-field">
          <label htmlFor="identifier">{dictionary.lookup.identifierLabel}</label>
          <input
            id="identifier"
            name="identifier"
            type="text"
            autoComplete="off"
            placeholder={dictionary.lookup.identifierPlaceholder}
            required
          />
        </div>
        <div className="form-field">
          <label htmlFor="email">{dictionary.lookup.emailLabel}</label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            placeholder={dictionary.lookup.emailPlaceholder}
            required
          />
        </div>
        <TurnstileField siteKey={siteKey} />
        <Button className="lookup-submit" type="submit">
          <Search size={18} aria-hidden="true" />
          {dictionary.lookup.submit}
        </Button>
      </form>
    </section>
  );
}
