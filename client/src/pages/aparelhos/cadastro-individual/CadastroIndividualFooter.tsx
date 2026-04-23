import { Loader2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/MaterialIcon";

type CadastroIndividualFooterProps = {
  canCreate: boolean;
  podeSalvar: boolean;
  isPending: boolean;
  onLimpar: () => void;
  onCadastrarOutro: () => void;
  onFinalizar: () => void;
};

export function CadastroIndividualFooter({
  canCreate,
  podeSalvar,
  isPending,
  onLimpar,
  onCadastrarOutro,
  onFinalizar,
}: CadastroIndividualFooterProps) {
  return (
    <div className="z-10 flex h-20 shrink-0 items-center justify-end gap-4 border-t border-slate-200 bg-white px-8">
      <Button
        type="button"
        variant="ghost"
        onClick={onLimpar}
        className="h-11 px-6 text-[11px] font-bold text-slate-500 uppercase"
      >
        Limpar Campos
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={onCadastrarOutro}
        disabled={!canCreate || !podeSalvar || isPending}
        className="h-11 px-6 text-[11px] font-bold uppercase gap-2 border-blue-200 text-erp-blue hover:bg-blue-50"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
        Cadastrar Outro Equipamento
      </Button>
      <Button
        type="button"
        onClick={onFinalizar}
        disabled={!canCreate || !podeSalvar || isPending}
        className="h-11 px-8 bg-erp-blue hover:bg-blue-700 text-white text-[11px] font-bold uppercase gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Cadastrando...
          </>
        ) : (
          <>
            <MaterialIcon name="save" className="text-lg" />
            Finalizar Cadastro
          </>
        )}
      </Button>
    </div>
  );
}
