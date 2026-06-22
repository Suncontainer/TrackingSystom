export type TemplateFormState = {
  fieldErrors: Record<string, string[]>;
  formError: string | null;
};

export const initialTemplateFormState: TemplateFormState = {
  fieldErrors: {},
  formError: null
};
