"use client";

import { ArchiveRestore, Archive } from "lucide-react";
import { useActionState } from "react";

import { setOrderArchiveStateAction } from "@/features/orders/actions";
import { initialOrderFormState } from "@/features/orders/form-state";

type ArchiveOrderFormProps = {
  archived: boolean;
  orderId: string;
  version: number;
};

export function ArchiveOrderForm({ archived, orderId, version }: ArchiveOrderFormProps) {
  const [state, formAction, pending] = useActionState(setOrderArchiveStateAction, initialOrderFormState);

  return (
    <form action={formAction} className="admin-form">
      <input name="mode" type="hidden" value={archived ? "restore" : "archive"} />
      <input name="orderId" type="hidden" value={orderId} />
      <input name="version" type="hidden" value={String(version)} />
      {state.formError ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {state.formError}
        </p>
      ) : null}
      <div className="form-field">
        <label htmlFor="archive-reason">{archived ? "Restore-Grund" : "Archivierungsgrund"}</label>
        <textarea id="archive-reason" name="reason" required rows={3} />
        {state.fieldErrors.reason?.[0] ? <p className="field-error">{state.fieldErrors.reason[0]}</p> : null}
      </div>
      <button className="button-base button-secondary" disabled={pending} type="submit">
        {archived ? <ArchiveRestore size={18} aria-hidden="true" /> : <Archive size={18} aria-hidden="true" />}
        {pending ? "Speichert..." : archived ? "Auftrag wiederherstellen" : "Auftrag archivieren"}
      </button>
    </form>
  );
}
