import { cn } from "@/lib/utils";
import type { EquipamentoPipelineFilter } from "../equipamentos-page.shared";

export type PipelineCounts = {
  total: number;
  configurados: number;
  emKit: number;
  despachados: number;
  comTecnico: number;
  instalados: number;
};

type StageDef = {
  filter: EquipamentoPipelineFilter;
  label: string;
  count: (c: PipelineCounts) => number;
  itemClass: string;
  labelClass: string;
  borderBarClass: string;
  activeBorderClass: string;
};

const STAGES: StageDef[] = [
  {
    filter: "TODOS",
    label: "Total",
    count: (c) => c.total,
    itemClass:
      "pipeline-item flex-1 bg-slate-50 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
    labelClass: "text-[10px] font-bold text-slate-500 uppercase font-condensed",
    borderBarClass: "border-l-4 border-erp-blue pl-2",
    activeBorderClass: "border-t-2 border-b-2 border-t-blue-500 border-b-blue-500",
  },
  {
    filter: "CONFIGURADO",
    label: "Configurados",
    count: (c) => c.configurados,
    itemClass:
      "pipeline-item flex-1 bg-blue-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
    labelClass: "text-[10px] font-bold text-slate-600 uppercase font-condensed",
    borderBarClass: "border-l-4 border-erp-blue pl-2",
    activeBorderClass: "border-t-2 border-b-2 border-t-blue-500 border-b-blue-500",
  },
  {
    filter: "EM_KIT",
    label: "Em Kit",
    count: (c) => c.emKit,
    itemClass:
      "pipeline-item flex-1 bg-purple-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
    labelClass: "text-[10px] font-bold text-slate-600 uppercase font-condensed",
    borderBarClass: "border-l-4 border-purple-500 pl-2",
    activeBorderClass:
      "border-t-2 border-b-2 border-t-purple-500 border-b-purple-500",
  },
  {
    filter: "DESPACHADO",
    label: "Despachados",
    count: (c) => c.despachados,
    itemClass:
      "pipeline-item flex-1 bg-amber-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
    labelClass: "text-[10px] font-bold text-slate-600 uppercase font-condensed",
    borderBarClass: "border-l-4 border-amber-500 pl-2",
    activeBorderClass:
      "border-t-2 border-b-2 border-t-amber-500 border-b-amber-500",
  },
  {
    filter: "COM_TECNICO",
    label: "Com Técnico",
    count: (c) => c.comTecnico,
    itemClass:
      "pipeline-item flex-1 bg-orange-100 border-r border-slate-200 p-3 flex flex-col justify-center text-left transition-colors",
    labelClass: "text-[10px] font-bold text-slate-600 uppercase font-condensed",
    borderBarClass: "border-l-4 border-erp-orange pl-2",
    activeBorderClass:
      "border-t-2 border-b-2 border-t-orange-500 border-b-orange-500",
  },
  {
    filter: "INSTALADO",
    label: "Instalados",
    count: (c) => c.instalados,
    itemClass:
      "pipeline-item flex-1 bg-green-100 p-3 flex flex-col justify-center text-left transition-colors",
    labelClass: "text-[10px] font-bold text-slate-600 uppercase font-condensed",
    borderBarClass: "border-l-4 border-erp-green pl-2",
    activeBorderClass:
      "border-t-2 border-b-2 border-t-emerald-500 border-b-emerald-500",
  },
];

type Props = {
  pipelineFilter: EquipamentoPipelineFilter;
  pipelineCounts: PipelineCounts;
  onStageClick: (filter: EquipamentoPipelineFilter) => void;
};

export function EquipamentosPipelineStrip({
  pipelineFilter,
  pipelineCounts,
  onStageClick,
}: Props) {
  return (
    <div
      className="flex w-full min-h-[88px] shadow-sm border border-slate-300 bg-white"
      data-testid="equipamentos-pipeline-strip"
    >
      {STAGES.map((stage) => (
        <button
          key={stage.filter}
          type="button"
          data-testid={`equipamentos-pipeline-${stage.filter}`}
          onClick={() => onStageClick(stage.filter)}
          className={cn(
            stage.itemClass,
            pipelineFilter === stage.filter && stage.activeBorderClass,
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
              {stage.count(pipelineCounts)}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
