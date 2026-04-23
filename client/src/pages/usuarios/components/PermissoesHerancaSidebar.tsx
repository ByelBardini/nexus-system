import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import { getModuloLabel, getAcaoLabel } from "../lib/permissoes-heranca";
import type { PermissoesPorModulo } from "@/types/usuarios";

export function PermissoesHerancaSidebar({
  setoresHabilitados,
  acoesAltoRisco,
  accessScore,
}: {
  setoresHabilitados: PermissoesPorModulo[];
  acoesAltoRisco: { modulo: string; permissao: string }[];
  accessScore: number;
}) {
  return (
    <aside className="w-96 bg-slate-50 border-l border-slate-200 flex flex-col h-full">
      <div className="p-6 border-b border-slate-200 bg-slate-100/50">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
          Resumo de Herança
        </h4>
        <p className="text-[11px] text-slate-400 mt-1">
          Permissões efetivas calculadas em tempo real
        </p>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-8">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block mb-4">
              Setores Habilitados
            </span>
            <div className="space-y-3">
              {setoresHabilitados.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  Selecione cargos para ver as permissões
                </p>
              ) : (
                setoresHabilitados.map((setor) => (
                  <div key={setor.modulo} className="flex items-start gap-3">
                    <MaterialIcon
                      name="check_circle"
                      className="text-emerald-500 text-base mt-0.5"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">
                        {getModuloLabel(setor.modulo)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {setor.acoes.map(getAcaoLabel).join(", ")}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase block mb-4">
              Ações de Alto Risco
            </span>
            <div className="space-y-3">
              {acoesAltoRisco.length === 0 ? (
                <div className="flex items-start gap-3">
                  <MaterialIcon
                    name="check_circle"
                    className="text-emerald-500 text-base"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-slate-700">
                      Nenhuma permissão de exclusão
                    </span>
                    <span className="text-[11px] text-slate-500 italic">
                      Usuário sem ações destrutivas
                    </span>
                  </div>
                </div>
              ) : (
                acoesAltoRisco.map((acao) => (
                  <div key={acao.permissao} className="flex items-start gap-3">
                    <MaterialIcon
                      name="warning"
                      className="text-amber-500 text-base mt-0.5"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-700">
                        Excluir {getModuloLabel(acao.modulo)}
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Acesso via cargos selecionados
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 bg-slate-800 text-white">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">
            Score de Acesso
          </span>
          <span
            className={cn(
              "text-sm font-bold",
              accessScore <= 25
                ? "text-emerald-400"
                : accessScore <= 50
                  ? "text-amber-400"
                  : accessScore <= 75
                    ? "text-orange-400"
                    : "text-red-400",
            )}
          >
            {accessScore}%
          </span>
        </div>
        <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              accessScore <= 25
                ? "bg-emerald-500"
                : accessScore <= 50
                  ? "bg-amber-500"
                  : accessScore <= 75
                    ? "bg-orange-500"
                    : "bg-red-500",
            )}
            style={{ width: `${accessScore}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
