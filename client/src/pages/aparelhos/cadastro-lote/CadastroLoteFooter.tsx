import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

type CadastroLoteFooterProps = {
  canCreate: boolean;
  podeSalvar: boolean;
  isPending: boolean;
};

export function CadastroLoteFooter({
  canCreate,
  podeSalvar,
  isPending,
}: CadastroLoteFooterProps) {
  const navigate = useNavigate();
  return (
    <div className="sticky -bottom-4 z-10 h-20 border-t border-slate-200 px-6 flex items-center justify-end gap-4 bg-white">
      <Button
        type="button"
        variant="ghost"
        onClick={() => navigate("/aparelhos")}
        className="h-11 px-6 text-[11px] font-bold text-slate-500 uppercase"
      >
        Cancelar
      </Button>
      <Button
        type="submit"
        disabled={!canCreate || !podeSalvar || isPending}
        className="h-11 px-8 bg-erp-blue hover:bg-blue-700 text-white text-[11px] font-bold uppercase gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Registrando...
          </>
        ) : (
          <>
            <CheckCircle className="h-4 w-4" />
            Registrar Lote
          </>
        )}
      </Button>
    </div>
  );
}
