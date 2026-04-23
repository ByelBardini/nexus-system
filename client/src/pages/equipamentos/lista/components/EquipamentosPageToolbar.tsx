import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MaterialIcon } from "@/components/MaterialIcon";
import { SearchableSelect } from "@/components/SearchableSelect";

type Props = {
  canCreate: boolean;
  busca: string;
  onBuscaChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  proprietarioFilter: "TODOS" | "INFINITY" | "CLIENTE";
  onProprietarioFilterChange: (value: "TODOS" | "INFINITY" | "CLIENTE") => void;
  marcaFilter: string;
  onMarcaFilterChange: (value: string) => void;
  marcas: string[];
  operadoraFilter: string;
  onOperadoraFilterChange: (value: string) => void;
  operadoras: string[];
};

export function EquipamentosPageToolbar({
  canCreate,
  busca,
  onBuscaChange,
  statusFilter,
  onStatusFilterChange,
  proprietarioFilter,
  onProprietarioFilterChange,
  marcaFilter,
  onMarcaFilterChange,
  marcas,
  operadoraFilter,
  onOperadoraFilterChange,
  operadoras,
}: Props) {
  return (
    <div
      className="flex items-end justify-between gap-4"
      data-testid="equipamentos-toolbar"
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
            placeholder="IMEI, ICCID, Técnico, Kit..."
            value={busca}
            onChange={(e) => onBuscaChange(e.target.value)}
            data-testid="equipamentos-busca-input"
          />
        </div>
      </div>
      <div className="flex items-end gap-2 flex-wrap">
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Status
          </label>
          <SearchableSelect
            className="w-[150px]"
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={[
              { value: "TODOS", label: "Todos" },
              { value: "CONFIGURADO", label: "Configurado" },
              { value: "EM_KIT", label: "Em Kit" },
              { value: "DESPACHADO", label: "Despachado" },
              { value: "COM_TECNICO", label: "Com Técnico" },
              { value: "INSTALADO", label: "Instalado" },
            ]}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Proprietário
          </label>
          <SearchableSelect
            className="w-[130px]"
            value={proprietarioFilter}
            onChange={(v) =>
              onProprietarioFilterChange(v as "TODOS" | "INFINITY" | "CLIENTE")
            }
            options={[
              { value: "TODOS", label: "Todos" },
              { value: "INFINITY", label: "Infinity" },
              { value: "CLIENTE", label: "Cliente" },
            ]}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Marca
          </label>
          <SearchableSelect
            className="w-[130px]"
            value={marcaFilter}
            onChange={onMarcaFilterChange}
            options={[
              { value: "TODOS", label: "Todas" },
              ...marcas.map((m) => ({ value: m, label: m })),
            ]}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Operadora
          </label>
          <SearchableSelect
            className="w-[130px]"
            value={operadoraFilter}
            onChange={onOperadoraFilterChange}
            options={[
              { value: "TODOS", label: "Todas" },
              ...operadoras.map((o) => ({ value: o, label: o })),
            ]}
          />
        </div>
        {canCreate && (
          <>
            <Link
              to="/equipamentos/pareamento"
              data-testid="equipamentos-link-montar"
            >
              <Button
                variant="outline"
                className="text-[11px] font-bold uppercase"
              >
                <MaterialIcon name="build" className="text-sm mr-1" />
                Montar Equipamento
              </Button>
            </Link>
            <Link
              to="/equipamentos/pareamento?modo=massa"
              data-testid="equipamentos-link-lote"
            >
              <Button className="bg-erp-blue hover:bg-blue-700 text-[11px] font-bold uppercase">
                <MaterialIcon name="inventory_2" className="text-sm mr-1" />
                Cadastro em Lote
              </Button>
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
