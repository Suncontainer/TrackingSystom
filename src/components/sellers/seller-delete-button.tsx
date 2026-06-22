"use client";

import { Trash2 } from "lucide-react";
import { useActionState } from "react";

import { deleteSellerAction } from "@/features/sellers/actions";
import { initialSellerFormState } from "@/features/sellers/form-state";

type SellerDeleteButtonProps = {
  sellerId: string;
  label: string;
  confirmMessage: string;
};

export function SellerDeleteButton({ sellerId, label, confirmMessage }: SellerDeleteButtonProps) {
  const [state, formAction, pending] = useActionState(deleteSellerAction, initialSellerFormState);

  return (
    <form
      action={formAction}
      onSubmit={(event) => {
        if (!window.confirm(confirmMessage)) {
          event.preventDefault();
        }
      }}
    >
      <input name="sellerId" type="hidden" value={sellerId} />
      <button className="row-action row-action--danger" disabled={pending} type="submit">
        <Trash2 size={16} aria-hidden="true" />
        <span>{label}</span>
      </button>
      {state.formError ? <span className="field-error">{state.formError}</span> : null}
    </form>
  );
}
