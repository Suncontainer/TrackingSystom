export type SellerFormState = {
  fieldErrors: Record<string, string[]>;
  formError: string | null;
  values?: Record<string, string>;
};

export const initialSellerFormState: SellerFormState = {
  fieldErrors: {},
  formError: null
};
