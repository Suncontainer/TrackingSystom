"use client";

import { useActionState } from "react";

import { sendTemplatedEmailAction } from "@/features/templates/actions";
import { initialTemplateFormState } from "@/features/templates/form-state";
import type { TemplatesDict } from "@/i18n/admin";

type TemplateOption = { id: string; name: string };
type OrderOption = { id: string; label: string };

type SendTemplateFormProps = {
  orderId?: string;
  orders?: OrderOption[];
  templates: TemplateOption[];
  dict: TemplatesDict["send"];
};

export function SendTemplateForm({ orderId, orders, templates, dict }: SendTemplateFormProps) {
  const [state, formAction, pending] = useActionState(sendTemplatedEmailAction, initialTemplateFormState);

  return (
    <form action={formAction} className="admin-form">
      {orderId ? (
        <input name="orderId" type="hidden" value={orderId} />
      ) : (
        <div className="form-field">
          <label htmlFor="send-template-order">{dict.orderLabel}</label>
          <select defaultValue="" id="send-template-order" name="orderId" required>
            <option disabled value="">
              {dict.chooseOrder}
            </option>
            {(orders ?? []).map((order) => (
              <option key={order.id} value={order.id}>
                {order.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="form-field">
        <label htmlFor="send-template-template">{dict.templateLabel}</label>
        <select defaultValue="" id="send-template-template" name="templateId" required>
          <option disabled value="">
            {dict.choose}
          </option>
          {templates.map((template) => (
            <option key={template.id} value={template.id}>
              {template.name}
            </option>
          ))}
        </select>
      </div>

      {state.formError ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {state.formError}
        </p>
      ) : null}

      <button className="button-base button-primary" disabled={pending} type="submit">
        {pending ? dict.sending : dict.submit}
      </button>
    </form>
  );
}
