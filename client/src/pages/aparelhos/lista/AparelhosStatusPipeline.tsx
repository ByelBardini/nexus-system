import type { StatusAparelho } from "@/lib/aparelho-status";
import { cn } from "@/lib/utils";

type Props = {
  statusFilter: StatusAparelho | "TODOS";
  statusCounts: Record<StatusAparelho, number>;
  totalCount: number;
  onStatusClick: (status: StatusAparelho | "TODOS") => void;
};

export function AparelhosStatusPipeline({
  statusFilter,
  statusCounts,
  totalCount,
  onStatusClick,
}: Props) {
  return (
    <div
      className="flex w-full min-h-[88px] shadow-sm border border-slate-300 bg-white"
      data-testid="aparelhos-status-pipeline"
    >
      <button
        type="button"
        data-testid="aparelhos-status-total"
        onClick={() => onStatusClick("TODOS")}
        className={cn(
          "pipeline-item flex-1 bg-slate-50 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
          statusFilter === "TODOS" &&
            "border-t-2 border-b-2 border-t-blue-500 border-b-blue-500",
        )}
      >
        <div className="flex justify-between items-center border-l-4 border-erp-blue pl-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase font-condensed">
            Total
          </span>
          <span className="text-lg font-black text-slate-800">
            {totalCount}
          </span>
        </div>
      </button>
      <button
        type="button"
        data-testid="aparelhos-status-em_estoque"
        onClick={() => onStatusClick("EM_ESTOQUE")}
        className={cn(
          "pipeline-item flex-1 bg-amber-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
          statusFilter === "EM_ESTOQUE" &&
            "border-t-2 border-b-2 border-t-amber-500 border-b-amber-500",
        )}
      >
        <div className="flex justify-between items-center border-l-4 border-amber-500 pl-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
            Em Estoque
          </span>
          <span className="text-lg font-black text-slate-800">
            {statusCounts.EM_ESTOQUE}
          </span>
        </div>
      </button>
      <button
        type="button"
        data-testid="aparelhos-status-configurado"
        onClick={() => onStatusClick("CONFIGURADO")}
        className={cn(
          "pipeline-item flex-1 bg-blue-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
          statusFilter === "CONFIGURADO" &&
            "border-t-2 border-b-2 border-t-blue-500 border-b-blue-500",
        )}
      >
        <div className="flex justify-between items-center border-l-4 border-erp-blue pl-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
            Configurado
          </span>
          <span className="text-lg font-black text-slate-800">
            {statusCounts.CONFIGURADO}
          </span>
        </div>
      </button>
      <button
        type="button"
        data-testid="aparelhos-status-despachado"
        onClick={() => onStatusClick("DESPACHADO")}
        className={cn(
          "pipeline-item flex-1 bg-amber-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
          statusFilter === "DESPACHADO" &&
            "border-t-2 border-b-2 border-t-amber-500 border-b-amber-500",
        )}
      >
        <div className="flex justify-between items-center border-l-4 border-amber-500 pl-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
            Despachado
          </span>
          <span className="text-lg font-black text-slate-800">
            {statusCounts.DESPACHADO}
          </span>
        </div>
      </button>
      <button
        type="button"
        data-testid="aparelhos-status-com_tecnico"
        onClick={() => onStatusClick("COM_TECNICO")}
        className={cn(
          "pipeline-item flex-1 bg-orange-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
          statusFilter === "COM_TECNICO" &&
            "border-t-2 border-b-2 border-t-orange-500 border-b-orange-500",
        )}
      >
        <div className="flex justify-between items-center border-l-4 border-erp-orange pl-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
            Com Técnico
          </span>
          <span className="text-lg font-black text-slate-800">
            {statusCounts.COM_TECNICO}
          </span>
        </div>
      </button>
      <button
        type="button"
        data-testid="aparelhos-status-instalado"
        onClick={() => onStatusClick("INSTALADO")}
        className={cn(
          "pipeline-item flex-1 bg-green-100 p-3 flex flex-col justify-center text-left transition-colors",
          statusFilter === "INSTALADO" &&
            "border-t-2 border-b-2 border-t-emerald-500 border-b-emerald-500",
        )}
      >
        <div className="flex justify-between items-center border-l-4 border-erp-green pl-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase font-condensed">
            Instalado
          </span>
          <span className="text-lg font-black text-slate-800">
            {statusCounts.INSTALADO}
          </span>
        </div>
      </button>
    </div>
  );
}
