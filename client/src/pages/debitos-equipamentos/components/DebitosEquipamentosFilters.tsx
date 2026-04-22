import { MaterialIcon } from "@/components/MaterialIcon";
import { SearchableSelect } from "@/components/SearchableSelect";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { hasFiltrosAtivos } from "../domain/debitos-equipamentos-helpers";
import type { StatusDebito } from "../domain/types";

const STATUS_TABS = [
  { value: "todos", label: "Todos" },
  { value: "aberto", label: "Aberto" },
  { value: "parcial", label: "Parcial" },
  { value: "quitado", label: "Quitado" },
] as const;

export interface DebitosEquipamentosFiltersProps {
  busca: string;
  onBuscaChange: (v: string) => void;
  filtroDevedor: string;
  onFiltroDevedorChange: (v: string) => void;
  filtroModelo: string;
  onFiltroModeloChange: (v: string) => void;
  filtroStatus: StatusDebito | "todos";
  onFiltroStatusChange: (v: StatusDebito | "todos") => void;
  opcoesDevedor: { value: string; label: string }[];
  opcoesModelo: { value: string; label: string }[];
  onClearFilters: () => void;
}

export function DebitosEquipamentosFilters({
  busca,
  onBuscaChange,
  filtroDevedor,
  onFiltroDevedorChange,
  filtroModelo,
  onFiltroModeloChange,
  filtroStatus,
  onFiltroStatusChange,
  opcoesDevedor,
  opcoesModelo,
  onClearFilters,
}: DebitosEquipamentosFiltersProps) {
  const showClear = hasFiltrosAtivos({
    busca,
    filtroDevedor,
    filtroModelo,
    filtroStatus,
  });

  return (
    <div className="space-y-3">
      <div className="flex items-end gap-3 flex-wrap">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Busca
          </label>
          <div className="relative w-52">
            <MaterialIcon
              name="search"
              className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base"
            />
            <Input
              className="pl-8 text-[11px]"
              placeholder="Devedor ou credor..."
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Devedor / Credor
          </label>
          <div className="w-52">
            <SearchableSelect
              options={opcoesDevedor}
              value={filtroDevedor}
              onChange={onFiltroDevedorChange}
              placeholder="Todos"
            />
          </div>
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Modelo
          </label>
          <div className="w-44">
            <SearchableSelect
              options={opcoesModelo}
              value={filtroModelo}
              onChange={onFiltroModeloChange}
              placeholder="Todos"
            />
          </div>
        </div>
        {showClear && (
          <div className="flex flex-col justify-end">
            <button
              type="button"
              onClick={onClearFilters}
              className="h-9 px-3 text-[11px] font-bold text-slate-500 hover:text-slate-700 border border-slate-200 rounded bg-white hover:bg-slate-50 flex items-center gap-1"
            >
              <MaterialIcon name="close" className="text-sm" />
              Limpar
            </button>
          </div>
        )}
      </div>

      <div className="flex gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onFiltroStatusChange(tab.value)}
            className={cn(
              "px-3 py-1 text-[11px] font-bold rounded border transition-colors",
              filtroStatus === tab.value
                ? "bg-erp-blue text-white border-erp-blue"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 hover:text-slate-700",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
