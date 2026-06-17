export type OrderFormState = {
  fieldErrors: Record<string, string[]>;
  formError: string | null;
  // Submitted values echoed back so the form can repopulate after an error.
  // React 19 auto-resets uncontrolled form fields once a form action returns,
  // so without this the user's input is wiped whenever the submit fails.
  values?: Record<string, string>;
};

export const initialOrderFormState: OrderFormState = {
  fieldErrors: {},
  formError: null
};
