import { MoreVertical } from "lucide-react";
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
import type {
  MarcaRastreador,
  ModeloRastreador,
} from "../domain/equipamentos-config.types";
import type { UseMutationResult } from "@tanstack/react-query";

type MarcaM = MarcaRastreador;
type ModeloM = ModeloRastreador;

type MarcasModelosPanelProps = {
  canEdit: boolean;
  searchMarcas: string;
  onSearchMarcas: (v: string) => void;
  expandedMarcaIds: Set<number>;
  filteredMarcas: MarcaM[];
  modelosByMarca: Map<number, ModeloM[]>;
  totalModelos: number;
  onToggleMarca: (marcaId: number) => void;
  onOpenCreateMarca: () => void;
  onOpenEditMarca: (m: MarcaM) => void;
  onToggleAtivoMarca: (m: MarcaM) => void;
  onDeleteMarca: (id: number) => void;
  onOpenCreateModelo: (marcaId?: number) => void;
  onOpenEditModelo: (m: ModeloM) => void;
  onToggleAtivoModelo: (m: ModeloM) => void;
  onDeleteModelo: (id: number) => void;
  deleteMarcaMutation: UseMutationResult<unknown, Error, number, unknown>;
  deleteModeloMutation: UseMutationResult<unknown, Error, number, unknown>;
};

export function MarcasModelosPanel({
  canEdit,
  searchMarcas,
  onSearchMarcas,
  expandedMarcaIds,
  filteredMarcas,
  modelosByMarca,
  totalModelos,
  onToggleMarca,
  onOpenCreateMarca,
  onOpenEditMarca,
  onToggleAtivoMarca,
  onDeleteMarca,
  onOpenCreateModelo,
  onOpenEditModelo,
  onToggleAtivoModelo,
  onDeleteModelo,
  deleteMarcaMutation,
  deleteModeloMutation,
}: MarcasModelosPanelProps) {
  return (
    <div className="col-span-7 flex flex-col">
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MaterialIcon name="sensors" className="text-blue-600" />
              Marcas e Modelos de Rastreador
            </h2>
            {canEdit && (
              <Button
                className="bg-erp-blue hover:bg-blue-700 text-white text-[10px] font-bold h-8 px-3 rounded-sm flex items-center gap-1.5 uppercase"
                onClick={() => onOpenCreateMarca()}
              >
                <MaterialIcon name="add" className="text-base" />
                Nova Marca
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
              placeholder="Pesquisar marca ou modelo..."
              value={searchMarcas}
              onChange={(e) => onSearchMarcas(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredMarcas.map((marca) => {
            const isExpanded = expandedMarcaIds.has(marca.id);
            const modelosDaMarca = modelosByMarca.get(marca.id) ?? [];
            return (
              <div
                key={marca.id}
                className="border-b border-slate-50 last:border-b-0"
              >
                <div
                  className={cn(
                    "flex items-center justify-between p-4 cursor-pointer transition-colors",
                    isExpanded ? "bg-slate-50/50" : "hover:bg-slate-50",
                  )}
                  onClick={() => onToggleMarca(marca.id)}
                >
                  <div className="flex items-center gap-3">
                    <MaterialIcon
                      name={isExpanded ? "expand_more" : "chevron_right"}
                      className="text-slate-400"
                    />
                    <span className="font-bold text-slate-800 text-sm tracking-tight">
                      {marca.nome}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-bold",
                        marca.ativo
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {String(marca._count.modelos).padStart(2, "0")} MODELOS
                    </span>
                  </div>
                  {canEdit && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-400 hover:text-slate-600"
                        >
                          <MaterialIcon name="edit" className="text-lg" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem
                          onClick={() => onOpenEditMarca(marca)}
                        >
                          <MaterialIcon
                            name="edit"
                            className="mr-2 text-base"
                          />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onToggleAtivoMarca(marca)}
                        >
                          <MaterialIcon
                            name={marca.ativo ? "visibility_off" : "visibility"}
                            className="mr-2 text-base"
                          />
                          {marca.ativo ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                        {marca._count.modelos === 0 && (
                          <DropdownMenuItem
                            onClick={() => onDeleteMarca(marca.id)}
                            className="text-red-600"
                            disabled={deleteMarcaMutation.isPending}
                          >
                            <MaterialIcon
                              name="delete"
                              className="mr-2 text-base"
                            />
                            Excluir
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                {isExpanded && (
                  <div className="bg-white">
                    {modelosDaMarca.length === 0 ? (
                      <div className="py-4 pl-10 pr-4 text-xs text-slate-500 flex items-center justify-between">
                        <span>Nenhum modelo cadastrado</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] h-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCreateModelo(marca.id);
                          }}
                        >
                          <MaterialIcon name="add" className="text-sm mr-1" />
                          Novo Modelo
                        </Button>
                      </div>
                    ) : (
                      modelosDaMarca.map((modelo) => (
                        <div
                          key={modelo.id}
                          className="flex items-center justify-between py-3 pl-10 pr-4 hover:bg-blue-50/30 border-l-2 border-transparent hover:border-blue-400 transition-all"
                        >
                          <span
                            className={cn(
                              "text-xs font-medium",
                              modelo.ativo
                                ? "text-slate-600"
                                : "text-slate-400 line-through",
                            )}
                          >
                            {modelo.nome}
                          </span>
                          <div className="flex items-center gap-4">
                            <span
                              className={cn(
                                "px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase border",
                                modelo.ativo
                                  ? "bg-green-50 text-green-700 border-green-100"
                                  : "bg-slate-100 text-slate-600 border-slate-200",
                              )}
                            >
                              {modelo.ativo ? "Ativo" : "Desativado"}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  onClick={(e) => e.stopPropagation()}
                                  className="text-slate-300 hover:text-slate-500"
                                >
                                  <MoreVertical className="h-5 w-5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => onOpenEditModelo(modelo)}
                                >
                                  <MaterialIcon
                                    name="edit"
                                    className="mr-2 text-base"
                                  />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onToggleAtivoModelo(modelo)}
                                >
                                  <MaterialIcon
                                    name={
                                      modelo.ativo
                                        ? "visibility_off"
                                        : "visibility"
                                    }
                                    className="mr-2 text-base"
                                  />
                                  {modelo.ativo ? "Desativar" : "Ativar"}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => onDeleteModelo(modelo.id)}
                                  className="text-red-600"
                                  disabled={deleteModeloMutation.isPending}
                                >
                                  <MaterialIcon
                                    name="delete"
                                    className="mr-2 text-base"
                                  />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      ))
                    )}
                    {modelosDaMarca.length > 0 && (
                      <div className="py-2 pl-10 pr-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[10px] h-7 text-blue-600"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCreateModelo(marca.id);
                          }}
                        >
                          <MaterialIcon name="add" className="text-sm mr-1" />
                          Novo Modelo
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filteredMarcas.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              Nenhuma marca encontrada
            </div>
          )}
        </div>
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Total: {filteredMarcas.length} Marcas / {totalModelos} Modelos
          </span>
        </div>
      </div>
    </div>
  );
}
