import { MaterialIcon } from "@/components/MaterialIcon";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { categoriaCargoParaBadge } from "@/types/cargo";
import type { CargoWithPermissions } from "../lib/types";

export function CargosAtribuicaoBlock({
  selectedRoleIds,
  cargosComPermissoes,
  cargosPorSetor,
  showSelector,
  onToggleShowSelector,
  onToggleRole,
  chipsLabel,
}: {
  selectedRoleIds: number[];
  cargosComPermissoes: CargoWithPermissions[];
  cargosPorSetor: Record<string, CargoWithPermissions[]>;
  showSelector: boolean;
  onToggleShowSelector: () => void;
  onToggleRole: (roleId: number) => void;
  chipsLabel: string;
}) {
  return (
    <section>
      <h3 className="text-xs font-bold text-slate-400 uppercase mb-5 flex items-center gap-2">
        <span className="w-2 h-2 bg-erp-blue rounded-full" />
        Atribuição de Cargos
      </h3>
      <div className="space-y-4">
        <div>
          <Label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">
            {chipsLabel}
          </Label>
          <div className="border border-slate-300 p-4 min-h-[52px] flex flex-wrap gap-2 items-center bg-white rounded">
            {selectedRoleIds.length === 0 ? (
              <span className="text-sm text-slate-400 italic">
                Nenhum cargo selecionado
              </span>
            ) : (
              selectedRoleIds.map((roleId) => {
                const cargo = cargosComPermissoes.find((c) => c.id === roleId);
                if (!cargo) return null;
                const catConfig = categoriaCargoParaBadge(cargo.categoria);
                return (
                  <span
                    key={roleId}
                    className={cn(
                      "px-3 py-1 rounded text-xs font-bold uppercase border flex items-center gap-2",
                      catConfig.className,
                    )}
                  >
                    {cargo.nome}
                    <button
                      type="button"
                      onClick={() => onToggleRole(roleId)}
                      className="hover:opacity-70"
                    >
                      <MaterialIcon name="close" className="text-sm" />
                    </button>
                  </span>
                );
              })
            )}
          </div>
          <p className="mt-2 text-[11px] text-slate-400 italic">
            As permissões serão herdadas automaticamente com base nos cargos
            selecionados.
          </p>
        </div>

        <button
          type="button"
          onClick={onToggleShowSelector}
          className="w-full flex items-center justify-between px-4 py-3 border border-slate-300 rounded bg-slate-50 hover:bg-slate-100 transition-colors"
        >
          <span className="text-sm font-medium text-slate-600">
            {showSelector
              ? "Fechar seleção de cargos"
              : "Selecionar cargos"}
          </span>
          <MaterialIcon
            name={showSelector ? "expand_less" : "expand_more"}
            className="text-slate-400"
          />
        </button>

        {showSelector && (
          <div className="space-y-4 border border-slate-200 rounded p-4 bg-slate-50 max-h-64 overflow-y-auto">
            {Object.entries(cargosPorSetor).map(([setorNome, setorCargos]) => (
              <div key={setorNome}>
                <p className="text-xs font-bold text-slate-500 uppercase mb-3">
                  {setorNome}
                </p>
                <div className="flex flex-wrap gap-2">
                  {setorCargos.map((cargo) => {
                    const isSelected = selectedRoleIds.includes(cargo.id);
                    const catConfig = categoriaCargoParaBadge(cargo.categoria);
                    return (
                      <button
                        key={cargo.id}
                        type="button"
                        onClick={() => onToggleRole(cargo.id)}
                        className={cn(
                          "px-3 py-1.5 rounded text-xs font-bold uppercase border transition-all",
                          isSelected
                            ? cn(
                                catConfig.className,
                                "ring-2 ring-blue-500 ring-offset-1",
                              )
                            : "bg-white text-slate-600 border-slate-300 hover:border-slate-400",
                        )}
                      >
                        {cargo.nome}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            {Object.keys(cargosPorSetor).length === 0 && (
              <p className="text-sm text-slate-400 italic">Carregando cargos...</p>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
