import type { FieldErrors } from "react-hook-form";
import { toast } from "sonner";
import type { LoteFormValues } from "./schema";

export function toastLoteFormValidationErrors(
  errors: FieldErrors<LoteFormValues>,
) {
  const msg = Object.values(errors)
    .map((e) => (typeof e?.message === "string" ? e.message : null))
    .filter(Boolean)
    .join(", ");
  toast.error(msg || "Verifique os campos do formulário");
}
