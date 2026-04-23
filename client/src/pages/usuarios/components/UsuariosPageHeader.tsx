import { Link } from "react-router-dom";
import { ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MaterialIcon } from "@/components/MaterialIcon";
import { SearchableSelect } from "@/components/SearchableSelect";

export function UsuariosPageHeader({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  canCreate,
  onOpenCreate,
}: {
  search: string;
  onSearchChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  canCreate: boolean;
  onOpenCreate: () => void;
}) {
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
          <MaterialIcon
            name="admin_panel_settings"
            className="text-erp-blue text-xl"
          />
          <div>
            <h1 className="text-lg font-bold text-slate-800">
              Usuários & Segurança
            </h1>
            <p className="text-xs text-slate-500">
              Controle de acesso e gestão de usuários do sistema
            </p>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex flex-col">
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Buscar usuário
          </Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 w-64 h-9"
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-col">
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1">
            Status
          </Label>
          <SearchableSelect
            className="w-32 h-9"
            value={statusFilter}
            onChange={onStatusFilterChange}
            options={[
              { value: "TODOS", label: "Todos" },
              { value: "ATIVOS", label: "Ativos" },
              { value: "INATIVOS", label: "Inativos" },
            ]}
          />
        </div>
        {canCreate && (
          <div className="flex flex-col">
            <Label className="text-[10px] font-bold text-slate-500 uppercase mb-1 opacity-0">
              Ação
            </Label>
            <Button
              className="bg-erp-blue hover:bg-blue-700 text-white text-sm font-bold h-9 px-4 rounded-sm"
              onClick={onOpenCreate}
            >
              <MaterialIcon name="person_add" className="text-lg mr-2" />
              Novo Usuário
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}
