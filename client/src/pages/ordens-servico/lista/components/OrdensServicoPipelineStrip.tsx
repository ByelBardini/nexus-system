import { cn } from "@/lib/utils";
import type { OrdensServicoResumo } from "../../shared/ordens-servico.types";
import { totalOrdensFromResumo } from "../../shared/ordens-servico.constants";

type StageDef = {
  filter: string;
  label: string;
  count: (r: OrdensServicoResumo | undefined) => number;
  itemClass: string;
  labelClass: string;
  borderBarClass: string;
  activeBorderClass: string;
};

const STAGES: StageDef[] = [
  {
    filter: "TODOS",
    label: "Total",
    count: (r) => totalOrdensFromResumo(r),
    itemClass:
      "pipeline-item flex-1 bg-slate-50 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
    labelClass: "text-[10px] font-bold text-slate-500 uppercase font-condensed",
    borderBarClass: "border-l-4 border-erp-blue pl-2",
    activeBorderClass:
      "border-t-2 border-b-2 border-t-blue-500 border-b-blue-500",
  },
  {
    filter: "AGENDADO",
    label: "Agendado",
    count: (r) => r?.agendado ?? 0,
    itemClass:
      "pipeline-item flex-1 bg-yellow-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
    labelClass: "text-[10px] font-bold text-slate-500 uppercase font-condensed",
    borderBarClass: "border-l-4 border-erp-yellow pl-2",
    activeBorderClass:
      "border-t-2 border-b-2 border-t-yellow-500 border-b-yellow-500",
  },
  {
    filter: "EM_TESTES",
    label: "Em Testes",
    count: (r) => r?.emTestes ?? 0,
    itemClass:
      "pipeline-item flex-1 bg-blue-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
    labelClass: "text-[10px] font-bold text-slate-600 uppercase font-condensed",
    borderBarClass: "border-l-4 border-erp-blue pl-2",
    activeBorderClass:
      "border-t-2 border-b-2 border-t-blue-500 border-b-blue-500",
  },
  {
    filter: "TESTES_REALIZADOS",
    label: "Testes Realizados",
    count: (r) => r?.testesRealizados ?? 0,
    itemClass:
      "pipeline-item flex-1 bg-purple-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
    labelClass: "text-[10px] font-bold text-slate-600 uppercase font-condensed",
    borderBarClass: "border-l-4 border-erp-purple pl-2",
    activeBorderClass:
      "border-t-2 border-b-2 border-t-purple-500 border-b-purple-500",
  },
  {
    filter: "AGUARDANDO_CADASTRO",
    label: "Aguardando Cadastro",
    count: (r) => r?.aguardandoCadastro ?? 0,
    itemClass:
      "pipeline-item flex-1 bg-orange-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
    labelClass: "text-[10px] font-bold text-slate-600 uppercase font-condensed",
    borderBarClass: "border-l-4 border-erp-orange pl-2",
    activeBorderClass:
      "border-t-2 border-b-2 border-t-orange-500 border-b-orange-500",
  },
  {
    filter: "FINALIZADO",
    label: "Finalizado",
    count: (r) => r?.finalizado ?? 0,
    itemClass:
      "pipeline-item flex-1 bg-green-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
    labelClass: "text-[10px] font-bold text-slate-600 uppercase font-condensed",
    borderBarClass: "border-l-4 border-erp-green pl-2",
    activeBorderClass:
      "border-t-2 border-b-2 border-t-green-500 border-b-green-500",
  },
];

type Props = {
  statusFilter: string;
  resumo: OrdensServicoResumo | undefined;
  onStatusClick: (status: string) => void;
};

export function OrdensServicoPipelineStrip({
  statusFilter,
  resumo,
  onStatusClick,
}: Props) {
  return (
    <div
      className="flex w-full min-h-[88px] shadow-sm border border-slate-300 bg-white"
      data-testid="ordens-servico-pipeline-strip"
    >
      {STAGES.map((stage) => (
        <button
          key={stage.filter}
          type="button"
          data-testid={`ordens-servico-pipeline-${stage.filter}`}
          onClick={() => onStatusClick(stage.filter)}
          className={cn(
            stage.itemClass,
            statusFilter === stage.filter && stage.activeBorderClass,
          )}
        >
          <div
            className={cn(
              "flex justify-between items-center",
              stage.borderBarClass,
            )}
          >
            <span className={stage.labelClass}>{stage.label}</span>
            <span className="text-lg font-black text-slate-800">
              {stage.count(resumo)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
