import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import type { Operadora } from "../domain/equipamentos-config.types";
import type { UseMutationResult } from "@tanstack/react-query";

type OperadorasTablePanelProps = {
  canEdit: boolean;
  searchOperadoras: string;
  onSearchOperadoras: (v: string) => void;
  filteredOperadoras: Operadora[];
  onOpenCreateOperadora: () => void;
  onOpenEditOperadora: (o: Operadora) => void;
  onToggleAtivo: (o: Operadora) => void;
  onDelete: (id: number) => void;
  deleteOperadoraMutation: UseMutationResult<unknown, Error, number, unknown>;
};

export function OperadorasTablePanel({
  canEdit,
  searchOperadoras,
  onSearchOperadoras,
  filteredOperadoras,
  onOpenCreateOperadora,
  onOpenEditOperadora,
  onToggleAtivo,
  onDelete,
  deleteOperadoraMutation,
}: OperadorasTablePanelProps) {
  return (
    <div className="col-span-5 flex flex-col">
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MaterialIcon
                name="signal_cellular_alt"
                className="text-blue-600"
              />
              Operadoras
            </h2>
            {canEdit && (
              <Button
                className="bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold h-8 px-3 rounded-sm flex items-center gap-1.5 uppercase"
                onClick={onOpenCreateOperadora}
              >
                <MaterialIcon name="add" className="text-base" />
                Nova Operadora
              </Button>
            )}
          </div>
          <div className="relative">
            <MaterialIcon
              name="search"
              className="absolute left-3 top-2 text-slate-400 text-lg"
            />
            <Input
              className="h-9 pl-9 pr-3 w-full bg-slate-100 border-transparent focus:bg-white focus:ring-1 focus:ring-blue-500 text-xs rounded-sm"
              placeholder="Filtrar operadoras..."
              value={searchOperadoras}
              onChange={(e) => onSearchOperadoras(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Nome
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                  Status
                </th>
                {canEdit && (
                  <th className="px-4 py-2.5 w-10 border-b border-slate-100" />
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredOperadoras.map((operadora) => (
                <tr
                  key={operadora.id}
                  className={cn(
                    "hover:bg-slate-50/50 transition-colors",
                    !operadora.ativo && "opacity-60 bg-slate-50/20",
                  )}
                >
                  <td className="px-4 py-4">
                    <span
                      className={cn(
                        "text-xs font-bold",
                        operadora.ativo ? "text-slate-800" : "text-slate-500",
                      )}
                    >
                      {operadora.nome}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          operadora.ativo ? "bg-emerald-500" : "bg-slate-400",
                        )}
                      />
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase",
                          operadora.ativo ? "text-slate-600" : "text-slate-400",
                        )}
                      >
                        {operadora.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </td>
                  {canEdit && (
                    <td className="px-4 py-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button
                            type="button"
                            className="text-slate-400 hover:text-slate-600"
                          >
                            <MaterialIcon name="settings" className="text-lg" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onOpenEditOperadora(operadora)}
                          >
                            <MaterialIcon
                              name="edit"
                              className="mr-2 text-base"
                            />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onToggleAtivo(operadora)}
                          >
                            <MaterialIcon
                              name={
                                operadora.ativo
                                  ? "visibility_off"
                                  : "visibility"
                              }
                              className="mr-2 text-base"
                            />
                            {operadora.ativo ? "Desativar" : "Ativar"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(operadora.id)}
                            className="text-red-600"
                            disabled={deleteOperadoraMutation.isPending}
                          >
                            <MaterialIcon
                              name="delete"
                              className="mr-2 text-base"
                            />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  )}
                </tr>
              ))}
              {filteredOperadoras.length === 0 && (
                <tr>
                  <td
                    colSpan={canEdit ? 3 : 2}
                    className="px-4 py-12 text-center text-sm text-slate-500"
                  >
                    Nenhuma operadora encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Total: {filteredOperadoras.length} Operadoras Registradas
          </span>
        </div>
      </div>
    </div>
  );
}
