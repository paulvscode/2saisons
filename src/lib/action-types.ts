/** État de retour commun à toutes les server actions de formulaire. */
export type FormState = {
  ok?: boolean;
  message?: string;
  errors?: Record<string, string>;
};
