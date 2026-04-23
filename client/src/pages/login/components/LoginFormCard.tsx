import type { LoginFormFieldsProps } from "@/types/login";
import { LoginEmailField } from "./LoginEmailField";
import { LoginPasswordField } from "./LoginPasswordField";
import { LoginSubmitButton } from "./LoginSubmitButton";
import { LoginSupportNote } from "./LoginSupportNote";

export function LoginFormCard({
  register,
  handleSubmit,
  onSubmit,
  errors,
  loading,
  showPassword,
  onTogglePassword,
}: LoginFormFieldsProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-sm shadow-sm p-8">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <LoginEmailField
          register={register}
          errorMessage={errors.email?.message}
        />
        <LoginPasswordField
          register={register}
          errorMessage={errors.password?.message}
          showPassword={showPassword}
          onToggleVisibility={onTogglePassword}
        />
        <LoginSubmitButton loading={loading} />
      </form>

      <LoginSupportNote />
    </div>
  );
}
