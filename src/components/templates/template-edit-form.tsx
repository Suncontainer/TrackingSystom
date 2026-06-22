"use client";

import { useActionState } from "react";

import { updateTemplateAction } from "@/features/templates/actions";
import { initialTemplateFormState } from "@/features/templates/form-state";
import type { TemplatesDict } from "@/i18n/admin";

type TemplateEditFormProps = {
  template: {
    id: string;
    name: string;
    subjectDe: string;
    bodyDe: string;
    subjectEn: string;
    bodyEn: string;
  };
  dict: TemplatesDict;
};

function fieldError(errors: Record<string, string[]>, field: string) {
  return errors[field]?.[0] ?? null;
}

export function TemplateEditForm({ template, dict }: TemplateEditFormProps) {
  const [state, formAction, pending] = useActionState(updateTemplateAction, initialTemplateFormState);

  return (
    <form action={formAction} className="admin-form admin-form--stacked">
      <input name="id" type="hidden" value={template.id} />
      {state.formError ? (
        <p className="form-feedback form-feedback--error" role="alert">
          {state.formError}
        </p>
      ) : null}

      <div className="form-field">
        <label htmlFor="template-name">{dict.nameLabel}</label>
        <input defaultValue={template.name} id="template-name" name="name" required type="text" />
        {fieldError(state.fieldErrors, "name") ? (
          <p className="field-error">{fieldError(state.fieldErrors, "name")}</p>
        ) : null}
      </div>

      <p className="hint-text">{dict.placeholders}</p>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{dict.germanHeading}</h2>
        </div>
        <div className="form-field">
          <label htmlFor="template-subject-de">{dict.subjectLabel}</label>
          <input defaultValue={template.subjectDe} id="template-subject-de" name="subjectDe" required type="text" />
          {fieldError(state.fieldErrors, "subjectDe") ? (
            <p className="field-error">{fieldError(state.fieldErrors, "subjectDe")}</p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="template-body-de">{dict.bodyLabel}</label>
          <textarea defaultValue={template.bodyDe} id="template-body-de" name="bodyDe" required rows={8} />
          {fieldError(state.fieldErrors, "bodyDe") ? (
            <p className="field-error">{fieldError(state.fieldErrors, "bodyDe")}</p>
          ) : null}
        </div>
      </section>

      <section className="admin-card admin-section">
        <div className="section-heading">
          <h2 className="font-heading">{dict.englishHeading}</h2>
        </div>
        <div className="form-field">
          <label htmlFor="template-subject-en">{dict.subjectLabel}</label>
          <input defaultValue={template.subjectEn} id="template-subject-en" name="subjectEn" required type="text" />
          {fieldError(state.fieldErrors, "subjectEn") ? (
            <p className="field-error">{fieldError(state.fieldErrors, "subjectEn")}</p>
          ) : null}
        </div>
        <div className="form-field">
          <label htmlFor="template-body-en">{dict.bodyLabel}</label>
          <textarea defaultValue={template.bodyEn} id="template-body-en" name="bodyEn" required rows={8} />
          {fieldError(state.fieldErrors, "bodyEn") ? (
            <p className="field-error">{fieldError(state.fieldErrors, "bodyEn")}</p>
          ) : null}
        </div>
      </section>

      <button className="button-base button-primary" disabled={pending} type="submit">
        {pending ? dict.saving : dict.save}
      </button>
    </form>
  );
}
