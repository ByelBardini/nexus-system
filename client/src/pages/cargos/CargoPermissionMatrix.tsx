import { ChevronDown, ChevronRight } from "lucide-react";
import {
  NOMES_ITEM,
  NOMES_SETOR,
  ORDEM_ACOES,
  ORDEM_ITENS,
  ORDEM_SETORES,
  type EstruturaPermissoes,
} from "@/pages/cargos/permissionMatrix";
import {
  PermissionCheckbox,
  SectorCheckbox,
} from "@/pages/cargos/CargoModalPermissionToggles";

export function CargoPermissionMatrix({
  estrutura,
  expandedSectors,
  selectedPermIds,
  onToggleSectorExpanded,
  onToggleAllSectorPermissions,
  isSectorFullySelected,
  onTogglePermission,
}: {
  estrutura: EstruturaPermissoes;
  expandedSectors: string[];
  selectedPermIds: number[];
  onToggleSectorExpanded: (setor: string) => void;
  onToggleAllSectorPermissions: (setor: string, checked: boolean) => void;
  isSectorFullySelected: (setor: string) => boolean;
  onTogglePermission: (id: number) => void;
}) {
  return (
    <div className="flex-1 overflow-y-auto border-r border-slate-200 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-slate-100 [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full">
      <div className="p-4 bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
          Matriz de Permissões
        </h3>
      </div>

      {ORDEM_SETORES.map((setor) => {
        const itens = estrutura[setor];
        if (!itens) return null;
        const isExpanded = expandedSectors.includes(setor);
        const isFullySelected = isSectorFullySelected(setor);
        const ordemItens = ORDEM_ITENS[setor] ?? Object.keys(itens);

        return (
          <div key={setor} className="border-b border-slate-100">
            <div
              className="flex items-center justify-between bg-slate-50 px-4 py-2 border-y border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors"
              onClick={() => onToggleSectorExpanded(setor)}
            >
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4 text-slate-400" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-400" />
                )}
                <span className="text-xs font-bold text-slate-700 uppercase">
                  {NOMES_SETOR[setor] || setor}
                </span>
              </div>
              <div
                className="flex items-center gap-2"
                onClick={(e) => e.stopPropagation()}
              >
                <span className="text-[9px] font-bold text-slate-500 uppercase">
                  Acesso Total ao Setor
                </span>
                <SectorCheckbox
                  checked={isFullySelected}
                  onChange={(checked) =>
                    onToggleAllSectorPermissions(setor, checked)
                  }
                />
              </div>
            </div>

            {isExpanded && (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-left">
                      Recurso
                    </th>
                    <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">
                      Visualizar
                    </th>
                    <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">
                      Criar
                    </th>
                    <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">
                      Editar
                    </th>
                    <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">
                      Deletar
                    </th>
                    <th className="px-3 py-2 bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-600 text-center w-24">
                      Executar
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ordemItens.map((item) => {
                    const acoes = itens[item];
                    if (!acoes?.length) return null;
                    const acoesMapeadas = ORDEM_ACOES.map((acao) => {
                      const found = acoes.find((a) => a.acao === acao);
                      return found ? found.permissao : null;
                    });
                    return (
                      <tr
                        key={item}
                        className="border-b border-slate-100 hover:bg-slate-50 transition-colors bg-white"
                      >
                        <td className="px-4 py-2 text-xs font-medium text-slate-600">
                          {NOMES_ITEM[item] || item}
                        </td>
                        {acoesMapeadas.map((perm, idx) => (
                          <td key={idx} className="px-4 py-3 text-center">
                            {perm ? (
                              <div className="flex justify-center">
                                <PermissionCheckbox
                                  checked={selectedPermIds.includes(perm.id)}
                                  onChange={() => onTogglePermission(perm.id)}
                                />
                              </div>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        );
      })}
    </div>
  );
}
