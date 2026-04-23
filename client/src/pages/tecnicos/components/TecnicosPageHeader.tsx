import { ArrowLeft, Plus, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import { SearchableSelect } from "@/components/SearchableSelect";
import type { UF } from "@/hooks/useBrasilAPI";
import type { TecnicoFiltroStatus } from "../lib/tecnicos-table.utils";

type Props = {
  busca: string;
  onBuscaChange: (value: string) => void;
  filtroEstado: string;
  onFiltroEstadoChange: (value: string) => void;
  filtroStatus: TecnicoFiltroStatus;
  onFiltroStatusChange: (value: TecnicoFiltroStatus) => void;
  ufs: UF[];
  canCreate: boolean;
  onNovoTecnico: () => void;
};

export function TecnicosPageHeader({
  busca,
  onBuscaChange,
  filtroEstado,
  onFiltroEstadoChange,
  filtroStatus,
  onFiltroStatusChange,
  ufs,
  canCreate,
  onNovoTecnico,
}: Props) {
  return (
    <header className="flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="flex items-center gap-4">
        <Link
          to="/configuracoes"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <MaterialIcon name="engineering" className="text-erp-blue text-xl" />
          <div>
            <h1 className="text-lg font-bold text-slate-800">Técnicos</h1>
            <p className="text-xs text-slate-500">
              Cobertura regional e gestão de prestadores
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
            Busca
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-9 w-64 pl-9"
              placeholder="Nome ou CPF/CNPJ..."
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
            Estado
          </Label>
          <SearchableSelect
            className="h-9 w-52"
            value={filtroEstado}
            onChange={onFiltroEstadoChange}
            options={[
              { value: "todos", label: "Todos os estados" },
              ...ufs.map((uf) => ({
                value: uf.sigla,
                label: `${uf.sigla} – ${uf.nome}`,
              })),
            ]}
          />
        </div>
        <div className="flex flex-col">
          <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
            Status
          </Label>
          <SearchableSelect
            className="h-9 w-32"
            value={filtroStatus}
            onChange={(v) => onFiltroStatusChange(v as TecnicoFiltroStatus)}
            options={[
              { value: "todos", label: "Todos" },
              { value: "ativo", label: "Ativo" },
              { value: "inativo", label: "Inativo" },
            ]}
          />
        </div>
        {canCreate && (
          <div className="flex flex-col">
            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
              &nbsp;
            </Label>
            <Button className="h-9 gap-2" onClick={onNovoTecnico}>
              <Plus className="h-4 w-4" />
              Novo Técnico
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
