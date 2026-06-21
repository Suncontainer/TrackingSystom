"use client";

import { useActionState } from "react";

import { createSellerAction, initialSellerFormState } from "@/features/sellers/actions";
import type { SellersDict } from "@/i18n/admin";

type SellerAddFormProps = {
  dict: SellersDict;
};

function fieldValue(values: Record<string, string> | undefined, field: string) {
  return values?.[field] ?? "";
}

export function SellerAddForm({ dict }: SellerAddFormProps) {
  const [state, formAction, pending] = useActionState(createSellerAction, initialSellerFormState);

  return (
    <form action={formAction} className="admin-form">
      {state.formError ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {state.formError}
        </p>
      ) : null}
      <div className="form-grid">
        <div className="form-field">
          <label htmlFor="seller-name">{dict.nameLabel}</label>
          <input
            defaultValue={fieldValue(state.values, "name")}
            id="seller-name"
            name="name"
            required
            type="text"
          />
          {state.fieldErrors.name?.[0] ? <p className="field-error">{state.fieldErrors.name[0]}</p> : null}
        </div>
        <div className="form-field">
          <label htmlFor="seller-email">{dict.emailLabel}</label>
          <input
            defaultValue={fieldValue(state.values, "email")}
            id="seller-email"
            name="email"
            required
            type="email"
          />
          {state.fieldErrors.email?.[0] ? <p className="field-error">{state.fieldErrors.email[0]}</p> : null}
        </div>
      </div>
      <button className="button-base button-primary" disabled={pending} type="submit">
        {pending ? dict.adding : dict.addSubmit}
      </button>
    </form>
  );
}
