import { Button } from "@/components/ui/button";
import { MaterialIcon } from "@/components/MaterialIcon";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import type { SidePanelDerivations } from "../side-panel.utils";

type Props = {
  deriv: Pick<
    SidePanelDerivations,
    | "estaConcluido"
    | "podeAvançar"
    | "podeRetroceder"
    | "bloqueiaAvançoParaConfigurado"
    | "mostraConcluir"
    | "progress"
    | "total"
    | "progressPct"
  >;
  podeEditar: boolean;
  onAvançar: () => void;
  onRetroceder: () => void;
  statusMutation: { isPending: boolean };
};

export function SidePanelProgressoEStatus({
  deriv,
  podeEditar,
  onAvançar,
  onRetroceder,
  statusMutation,
}: Props) {
  const {
    estaConcluido,
    podeAvançar,
    podeRetroceder,
    bloqueiaAvançoParaConfigurado,
    mostraConcluir,
    progress,
    total,
    progressPct,
  } = deriv;

  return (
    <div className="p-6 border-b border-slate-100">
      {estaConcluido ? (
        <div className="flex items-center gap-2 py-2 mb-4">
          <MaterialIcon
            name="check_circle"
            className="text-emerald-500 text-xl"
          />
          <span className="text-sm font-bold text-emerald-700">Concluído</span>
        </div>
      ) : (
        podeEditar &&
        (podeAvançar || podeRetroceder) && (
          <div className="flex gap-2 mb-4 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={onRetroceder}
              disabled={!podeRetroceder || statusMutation.isPending}
              className="flex-1 text-[10px] font-bold uppercase"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Retroceder
            </Button>
            <Button
              size="sm"
              onClick={onAvançar}
              disabled={!podeAvançar || statusMutation.isPending}
              className="flex-1 bg-erp-blue hover:bg-blue-700 text-[10px] font-bold uppercase"
            >
              {statusMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : mostraConcluir ? (
                <>
                  Concluir
                  <MaterialIcon name="check" className="text-sm ml-1" />
                </>
              ) : (
                <>
                  Avançar
                  <ChevronRight className="h-4 w-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        )
      )}
      <div className="flex items-end justify-between mb-2">
        <span className="text-xs font-bold text-slate-700 uppercase">
          Progresso da Configuração
        </span>
        <div className="text-right">
          <span className="text-3xl font-bold text-erp-blue leading-none">
            {progress}
          </span>
          <span className="text-slate-400 font-medium"> / {total}</span>
        </div>
      </div>
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-erp-blue rounded-full transition-all"
          style={{ width: `${progressPct}%` }}
        />
      </div>
      {bloqueiaAvançoParaConfigurado && (
        <p className="text-[10px] text-amber-600 mt-1.5">
          Vincule todos os rastreadores ({progress}/{total}) para avançar
        </p>
      )}
    </div>
  );
}
