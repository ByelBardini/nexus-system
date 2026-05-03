import { Plus, Search, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import { SearchableSelect } from "@/components/SearchableSelect";
import { FILTRO_TIPO_CONTRATO_OPTIONS } from "../shared/clientes-page.shared";

type Props = {
  busca: string;
  onBuscaChange: (v: string) => void;
  filtroTipoContrato: string;
  onFiltroTipoContratoChange: (v: string) => void;
  canCreate: boolean;
  onNovoCliente: () => void;
};

export function ClientesPageHeader({
  busca,
  onBuscaChange,
  filtroTipoContrato,
  onFiltroTipoContratoChange,
  canCreate,
  onNovoCliente,
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
          <MaterialIcon name="groups" className="text-erp-blue text-xl" />
          <div>
            <h1 className="text-lg font-bold text-slate-800">Clientes</h1>
            <p className="text-xs text-slate-500">
              Gestão de contatos e registros administrativos
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
            Busca Cliente
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              className="h-9 w-64 pl-9"
              placeholder="Razão Social ou CNPJ..."
              value={busca}
              onChange={(e) => onBuscaChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
            Tipo Contrato
          </Label>
          <SearchableSelect
            className="h-9 w-36"
            value={filtroTipoContrato}
            onChange={onFiltroTipoContratoChange}
            options={FILTRO_TIPO_CONTRATO_OPTIONS}
          />
        </div>
        {canCreate && (
          <div className="flex flex-col">
            <Label className="mb-1 block text-[10px] font-bold uppercase text-slate-500">
              &nbsp;
            </Label>
            <Button className="h-9 gap-2" onClick={onNovoCliente}>
              <Plus className="h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
