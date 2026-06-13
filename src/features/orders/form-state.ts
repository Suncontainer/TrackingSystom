export type OrderFormState = {
  fieldErrors: Record<string, string[]>;
  formError: string | null;
};

export const initialOrderFormState: OrderFormState = {
  fieldErrors: {},
  formError: null
};
