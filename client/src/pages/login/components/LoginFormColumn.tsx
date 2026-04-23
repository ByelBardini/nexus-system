import type { LoginFormFieldsProps } from "@/types/login";
import { LoginCopyrightFooter } from "./LoginCopyrightFooter";
import { LoginFormCard } from "./LoginFormCard";
import { LoginFormHeader } from "./LoginFormHeader";
import { LoginMobileBrand } from "./LoginMobileBrand";

export function LoginFormColumn({
  register,
  handleSubmit,
  onSubmit,
  errors,
  loading,
  showPassword,
  onTogglePassword,
}: LoginFormFieldsProps) {
  return (
    <main className="w-full lg:w-[45%] flex flex-col items-center justify-center p-6 md:p-12 bg-white">
      <LoginMobileBrand />

      <div className="w-full max-w-md">
        <LoginFormHeader />

        <LoginFormCard
          register={register}
          handleSubmit={handleSubmit}
          onSubmit={onSubmit}
          errors={errors}
          loading={loading}
          showPassword={showPassword}
          onTogglePassword={onTogglePassword}
        />

        <LoginCopyrightFooter />
      </div>
    </main>
  );
}
