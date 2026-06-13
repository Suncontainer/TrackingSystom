"use client";

import { useActionState } from "react";

import { addInternalNoteAction } from "@/features/orders/actions";
import { initialOrderFormState } from "@/features/orders/form-state";

type InternalNoteFormProps = {
  orderId: string;
};

export function InternalNoteForm({ orderId }: InternalNoteFormProps) {
  const [state, formAction, pending] = useActionState(addInternalNoteAction, initialOrderFormState);

  return (
    <form action={formAction} className="admin-form">
      <input name="orderId" type="hidden" value={orderId} />
      {state.formError ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {state.formError}
        </p>
      ) : null}
      <div className="form-field">
        <label htmlFor="note-body">Neue interne Notiz</label>
        <textarea id="note-body" name="body" rows={4} />
        {state.fieldErrors.body?.[0] ? <p className="field-error">{state.fieldErrors.body[0]}</p> : null}
      </div>
      <button className="button-base button-secondary" disabled={pending} type="submit">
        {pending ? "Speichert..." : "Notiz hinzufuegen"}
      </button>
    </form>
  );
}
