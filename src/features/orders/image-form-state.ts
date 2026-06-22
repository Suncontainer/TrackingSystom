export type ImageActionState = {
  formError: string | null;
  ok: boolean;
};

export const initialImageActionState: ImageActionState = {
  formError: null,
  ok: false
};
