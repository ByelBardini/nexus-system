import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type LoginSubmitButtonProps = {
  loading: boolean;
};

export function LoginSubmitButton({ loading }: LoginSubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={loading}
      className="w-full h-11 bg-erp-blue hover:bg-blue-700 text-white text-sm font-bold uppercase tracking-wide gap-2 group transition-all shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20"
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Entrando...
        </>
      ) : (
        <>
          Entrar
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </>
      )}
    </Button>
  );
}
