import type { UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import type { LoginFormData } from "@/types/login";

type LoginEmailFieldProps = {
  register: UseFormRegister<LoginFormData>;
  errorMessage?: string;
};

export function LoginEmailField({
  register,
  errorMessage,
}: LoginEmailFieldProps) {
  return (
    <div>
      <Label
        htmlFor="email"
        className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block"
      >
        E-mail
      </Label>
      <div className="relative">
        <MaterialIcon
          name="account_circle"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
        />
        <Input
          id="email"
          type="email"
          placeholder="usuario@empresa.com"
          autoComplete="email"
          className="h-10 pl-9 text-sm"
          {...register("email")}
        />
      </div>
      {errorMessage && (
        <p className="text-xs text-destructive mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
