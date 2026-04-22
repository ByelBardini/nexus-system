import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaterialIcon } from "@/components/MaterialIcon";
import { SearchableSelect } from "@/components/SearchableSelect";
import { ORDENS_SERVICO_STATUS_LABELS } from "../../shared/ordens-servico.constants";

type Props = {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  canCreate: boolean;
};

export function OrdensServicoListToolbar({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  canCreate,
}: Props) {
  const navigate = useNavigate();

  return (
    <div
      className="flex items-end justify-between gap-4"
      data-testid="ordens-servico-toolbar"
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
            placeholder="OS, placa ou cliente"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            data-testid="ordens-servico-busca-input"
          />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div
          className="flex flex-col"
          data-testid="ordens-servico-status-select-wrap"
        >
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Status
          </label>
          <SearchableSelect
            className="w-[180px]"
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={[
              { value: "TODOS", label: "Todos" },
              ...Object.entries(ORDENS_SERVICO_STATUS_LABELS).map(([k, v]) => ({
                value: k,
                label: v,
              })),
            ]}
          />
        </div>
        {canCreate && (
          <Button
            onClick={() => navigate("/ordens-servico/nova")}
            className="bg-erp-blue hover:bg-blue-700 text-[11px] font-bold uppercase"
            data-testid="ordens-servico-btn-nova"
          >
            <MaterialIcon name="add" className="text-sm mr-1" />
            Nova OS
          </Button>
        )}
      </div>
    </div>
  );
}
