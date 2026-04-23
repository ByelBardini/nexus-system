import { Eye, EyeOff } from "lucide-react";
import type { UseFormRegister } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import type { LoginFormData } from "@/types/login";

type LoginPasswordFieldProps = {
  register: UseFormRegister<LoginFormData>;
  errorMessage?: string;
  showPassword: boolean;
  onToggleVisibility: () => void;
};

export function LoginPasswordField({
  register,
  errorMessage,
  showPassword,
  onToggleVisibility,
}: LoginPasswordFieldProps) {
  return (
    <div>
      <Label
        htmlFor="password"
        className="text-[10px] font-bold uppercase text-slate-500 mb-1.5 block"
      >
        Senha
      </Label>
      <div className="relative">
        <MaterialIcon
          name="lock"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg"
        />
        <Input
          id="password"
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          autoComplete="current-password"
          className="h-10 pl-9 pr-10 text-sm"
          {...register("password")}
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
          aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
        >
          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}
        </button>
      </div>
      {errorMessage && (
        <p className="text-xs text-destructive mt-1">{errorMessage}</p>
      )}
    </div>
  );
}
