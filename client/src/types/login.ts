import { z } from "zod";
import type {
  FieldErrors,
  SubmitHandler,
  UseFormHandleSubmit,
  UseFormRegister,
} from "react-hook-form";

export const loginFormSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha obrigatória"),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;

export type LoginFormFieldsProps = {
  register: UseFormRegister<LoginFormData>;
  handleSubmit: UseFormHandleSubmit<LoginFormData>;
  onSubmit: SubmitHandler<LoginFormData>;
  errors: FieldErrors<LoginFormData>;
  loading: boolean;
  showPassword: boolean;
  onTogglePassword: () => void;
};
