"use client";

import { Archive, ArchiveRestore, Pencil } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";

import { setOrderArchiveStateInlineAction } from "@/features/orders/actions";
import { initialOrderFormState } from "@/features/orders/form-state";

export type OrderRowActionsDict = {
  edit: string;
  remove: string;
  restore: string;
  reason: string;
  confirmRemove: string;
  confirmRestore: string;
};

type OrderRowActionsProps = {
  orderId: string;
  version: number;
  archived: boolean;
  canArchive: boolean;
  editHref: string;
  dict: OrderRowActionsDict;
};

export function OrderRowActions({
  orderId,
  version,
  archived,
  canArchive,
  editHref,
  dict
}: OrderRowActionsProps) {
  const [state, formAction, pending] = useActionState(
    setOrderArchiveStateInlineAction,
    initialOrderFormState
  );

  return (
    <div className="row-actions">
      <Link className="row-action" href={editHref}>
        <Pencil size={16} aria-hidden="true" />
        <span>{dict.edit}</span>
      </Link>
      {canArchive ? (
        <form
          action={formAction}
          onSubmit={(event) => {
            if (!window.confirm(archived ? dict.confirmRestore : dict.confirmRemove)) {
              event.preventDefault();
            }
          }}
        >
          <input name="mode" type="hidden" value={archived ? "restore" : "archive"} />
          <input name="orderId" type="hidden" value={orderId} />
          <input name="version" type="hidden" value={String(version)} />
          <input name="reason" type="hidden" value={dict.reason} />
          <button className="row-action row-action--danger" disabled={pending} type="submit">
            {archived ? (
              <ArchiveRestore size={16} aria-hidden="true" />
            ) : (
              <Archive size={16} aria-hidden="true" />
            )}
            <span>{archived ? dict.restore : dict.remove}</span>
          </button>
        </form>
      ) : null}
      {state.formError ? <span className="field-error">{state.formError}</span> : null}
    </div>
  );
}
