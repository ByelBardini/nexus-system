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
import type { MarcaSimcard, PlanoSimcard } from "../domain/equipamentos-config.types";
import type { UseMutationResult } from "@tanstack/react-query";

type MarcasSimcardPanelProps = {
  canEdit: boolean;
  searchMarcasSimcard: string;
  onSearchMarcasSimcard: (v: string) => void;
  expandedMarcasSimcardIds: Set<number>;
  filteredMarcasSimcard: MarcaSimcard[];
  onToggleMarca: (id: number) => void;
  onOpenCreateMarca: () => void;
  onOpenEditMarca: (m: MarcaSimcard) => void;
  onToggleAtivo: (m: MarcaSimcard) => void;
  onDeleteMarca: (id: number) => void;
  onOpenCreatePlano: (marcaId: number) => void;
  onOpenEditPlano: (p: PlanoSimcard) => void;
  onDeletePlano: (id: number) => void;
  deleteMarcaSimcardMutation: UseMutationResult<unknown, Error, number, unknown>;
  deletePlanoSimcardMutation: UseMutationResult<unknown, Error, number, unknown>;
};

export function MarcasSimcardPanel({
  canEdit,
  searchMarcasSimcard,
  onSearchMarcasSimcard,
  expandedMarcasSimcardIds,
  filteredMarcasSimcard,
  onToggleMarca,
  onOpenCreateMarca,
  onOpenEditMarca,
  onToggleAtivo,
  onDeleteMarca,
  onOpenCreatePlano,
  onOpenEditPlano,
  onDeletePlano,
  deleteMarcaSimcardMutation,
  deletePlanoSimcardMutation,
}: MarcasSimcardPanelProps) {
  return (
    <div className="col-span-12 flex flex-col">
      <div className="bg-white border border-slate-200 rounded-sm shadow-sm flex flex-col flex-1 min-h-0">
        <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <MaterialIcon name="sim_card" className="text-blue-600" />
              Marcas de Simcard
            </h2>
            {canEdit && (
              <Button
                className="bg-erp-blue hover:bg-blue-700 text-white text-[10px] font-bold h-8 px-3 rounded-sm flex items-center gap-1.5 uppercase"
                onClick={onOpenCreateMarca}
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
              placeholder="Filtrar por marca ou operadora..."
              value={searchMarcasSimcard}
              onChange={(e) => onSearchMarcasSimcard(e.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto max-h-64">
          {filteredMarcasSimcard.map((m) => {
            const isExpanded = expandedMarcasSimcardIds.has(m.id);
            const planosDaMarca = (m.planos ?? []).filter((p) => p.ativo);
            return (
              <div
                key={m.id}
                className="border-b border-slate-50 last:border-b-0"
              >
                <div
                  className={cn(
                    "flex items-center justify-between p-4 cursor-pointer transition-colors",
                    isExpanded ? "bg-slate-50/50" : "hover:bg-slate-50",
                  )}
                  onClick={() => onToggleMarca(m.id)}
                >
                  <div className="flex items-center gap-3">
                    <MaterialIcon
                      name={isExpanded ? "expand_more" : "chevron_right"}
                      className="text-slate-400"
                    />
                    <span
                      className={cn(
                        "text-xs font-bold",
                        m.ativo ? "text-slate-800" : "text-slate-500",
                      )}
                    >
                      {m.nome}
                    </span>
                    <span className="text-xs text-slate-500">•</span>
                    <span className="text-xs text-slate-600">
                      {m.operadora.nome}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-bold",
                        m.temPlanos
                          ? "bg-blue-100 text-blue-700"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {m.temPlanos ? "Tem planos" : "Sem planos"}
                    </span>
                    <span
                      className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded font-bold",
                        m.ativo
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500",
                      )}
                    >
                      {m.ativo ? "Ativo" : "Inativo"}
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
                          <MaterialIcon
                            name="settings"
                            className="text-lg"
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <DropdownMenuItem
                          onClick={() => onOpenEditMarca(m)}
                        >
                          <MaterialIcon
                            name="edit"
                            className="mr-2 text-base"
                          />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onToggleAtivo(m)}
                        >
                          <MaterialIcon
                            name={m.ativo ? "visibility_off" : "visibility"}
                            className="mr-2 text-base"
                          />
                          {m.ativo ? "Desativar" : "Ativar"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDeleteMarca(m.id)}
                          className="text-red-600"
                          disabled={deleteMarcaSimcardMutation.isPending}
                        >
                          <MaterialIcon
                            name="delete"
                            className="mr-2 text-base"
                          />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
                {isExpanded && (
                  <div className="bg-white">
                    {m.temPlanos ? (
                      planosDaMarca.length === 0 ? (
                        <div className="py-4 pl-10 pr-4 text-xs text-slate-500 flex items-center justify-between">
                          <span>Nenhum plano cadastrado</span>
                          {canEdit && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-[10px] h-7"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenCreatePlano(m.id);
                              }}
                            >
                              <MaterialIcon
                                name="add"
                                className="text-sm mr-1"
                              />
                              Adicionar Plano
                            </Button>
                          )}
                        </div>
                      ) : (
                        <>
                          {planosDaMarca.map((plano) => (
                            <div
                              key={plano.id}
                              className="flex items-center justify-between py-3 pl-10 pr-4 hover:bg-blue-50/30 border-l-2 border-transparent hover:border-blue-400 transition-all"
                            >
                              <span className="text-xs font-medium text-slate-600">
                                {plano.planoMb} MB
                              </span>
                              {canEdit && (
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
                                      onClick={() => onOpenEditPlano(plano)}
                                    >
                                      <MaterialIcon
                                        name="edit"
                                        className="mr-2 text-base"
                                      />
                                      Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => onDeletePlano(plano.id)}
                                      className="text-red-600"
                                      disabled={deletePlanoSimcardMutation.isPending}
                                    >
                                      <MaterialIcon
                                        name="delete"
                                        className="mr-2 text-base"
                                      />
                                      Excluir
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </div>
                          ))}
                          {canEdit && (
                            <div className="py-2 pl-10 pr-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] h-7 text-blue-600"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onOpenCreatePlano(m.id);
                                }}
                              >
                                <MaterialIcon
                                  name="add"
                                  className="text-sm mr-1"
                                />
                                Adicionar Plano
                              </Button>
                            </div>
                          )}
                        </>
                      )
                    ) : (
                      <div className="py-4 pl-10 pr-4 text-xs text-slate-500">
                        Marca sem planos cadastrados. Edite a marca e marque
                        &quot;Tem planos&quot; para adicionar.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filteredMarcasSimcard.length === 0 && (
            <div className="p-8 text-center text-sm text-slate-500">
              Nenhuma marca de simcard encontrada
            </div>
          )}
        </div>
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            Total: {filteredMarcasSimcard.length} Marcas de Simcard
          </span>
        </div>
      </div>
    </div>
  );
}
