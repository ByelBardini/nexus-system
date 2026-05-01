import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaterialIcon } from "@/components/MaterialIcon";
import { SearchableSelect } from "@/components/SearchableSelect";
import {
  STATUS_CONFIG_APARELHO,
  type StatusAparelho,
} from "@/lib/aparelho-status";
import type { ProprietarioTipo, TipoAparelho } from "./aparelhos-page.shared";
import {
  asProprietarioFilter,
  asStatusFilter,
  asTipoFilter,
} from "./aparelhos-list.helpers";

type Props = {
  canCreate: boolean;
  canList: boolean;
  busca: string;
  onBuscaChange: (v: string) => void;
  statusFilter: StatusAparelho | "TODOS";
  onStatusFilterChange: (v: StatusAparelho | "TODOS") => void;
  tipoFilter: TipoAparelho | "TODOS";
  onTipoFilterChange: (v: TipoAparelho | "TODOS") => void;
  proprietarioFilter: ProprietarioTipo | "TODOS";
  onProprietarioFilterChange: (v: ProprietarioTipo | "TODOS") => void;
  marcaFilter: string;
  onMarcaFilterChange: (v: string) => void;
  marcas: string[];
};

export function AparelhosToolbar({
  canCreate,
  canList,
  busca,
  onBuscaChange,
  statusFilter,
  onStatusFilterChange,
  tipoFilter,
  onTipoFilterChange,
  proprietarioFilter,
  onProprietarioFilterChange,
  marcaFilter,
  onMarcaFilterChange,
  marcas,
}: Props) {
  return (
    <div
      className="flex items-end justify-between gap-4"
      data-testid="aparelhos-toolbar"
    >
      <div className="flex flex-col">
        <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
          Busca
        </label>
        <div className="relative w-64">
          <MaterialIcon
            name="search"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-base"
          />
          <Input
            className="pl-8 text-[11px]"
            placeholder="IMEI, ICCID, Lote, Técnico..."
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            data-testid="aparelhos-busca-input"
          />
        </div>
      </div>
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex flex-col" data-testid="aparelhos-filter-status">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Status
          </label>
          <SearchableSelect
            className="w-[160px]"
            value={statusFilter}
            onChange={(v) => onStatusFilterChange(asStatusFilter(v))}
            options={[
              { value: "TODOS", label: "Todos" },
              ...(Object.keys(STATUS_CONFIG_APARELHO) as StatusAparelho[]).map(
                (s) => ({
                  value: s,
                  label: STATUS_CONFIG_APARELHO[s].label,
                }),
              ),
            ]}
          />
        </div>
        <div className="flex flex-col" data-testid="aparelhos-filter-tipo">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Tipo
          </label>
          <SearchableSelect
            className="w-[140px]"
            value={tipoFilter}
            onChange={(v) => onTipoFilterChange(asTipoFilter(v))}
            options={[
              { value: "TODOS", label: "Todos" },
              { value: "RASTREADOR", label: "Rastreador" },
              { value: "SIM", label: "SIM Card" },
            ]}
          />
        </div>
        <div
          className="flex flex-col"
          data-testid="aparelhos-filter-proprietario"
        >
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Proprietário
          </label>
          <SearchableSelect
            className="w-[130px]"
            value={proprietarioFilter}
            onChange={(v) =>
              onProprietarioFilterChange(asProprietarioFilter(v))
            }
            options={[
              { value: "TODOS", label: "Todos" },
              { value: "INFINITY", label: "Infinity" },
              { value: "CLIENTE", label: "Cliente" },
            ]}
          />
        </div>
        <div className="flex flex-col" data-testid="aparelhos-filter-marca">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Marca / Operadora
          </label>
          <SearchableSelect
            className="w-[140px]"
            value={marcaFilter}
            onChange={(v) => onMarcaFilterChange(v)}
            options={[
              { value: "TODOS", label: "Todas" },
              ...marcas.map((m) => ({ value: m, label: m })),
            ]}
          />
        </div>
        {canCreate && (
          <Link to="/aparelhos/lote" data-testid="aparelhos-link-lote">
            <Button
              variant="outline"
              className="text-[11px] font-bold uppercase"
            >
              <MaterialIcon name="inventory_2" className="text-sm mr-1" />
              Entrada de Lote
            </Button>
          </Link>
        )}
        {(canCreate || canList) && (
          <div className="flex flex-col items-end gap-1">
            {canList && (
              <Link
                to="/equipamentos/descartados"
                data-testid="aparelhos-link-descartados"
                className="flex items-center gap-0.5 text-[10px] text-slate-400 hover:text-slate-600 transition-colors"
              >
                <MaterialIcon name="delete_sweep" className="text-xs" />
                Descartados
              </Link>
            )}
            {canCreate && (
              <Link
                to="/aparelhos/individual"
                data-testid="aparelhos-link-individual"
              >
                <Button className="bg-erp-blue hover:bg-blue-700 text-[11px] font-bold uppercase">
                  <MaterialIcon name="add" className="text-sm mr-1" />
                  Criar Manual
                </Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
