import { aggregateResumoAparelhosDoKit } from "../side-panel.utils";
import type { AparelhoNoKit } from "../../shared/pedidos-config-types";
import { cn } from "@/lib/utils";

type Props = {
  aparelhos: AparelhoNoKit[] | null | undefined;
  className?: string;
};

export function SidePanelKitResumoAparelhos({ aparelhos, className }: Props) {
  const { marcasModelos, operadoras, empresas } =
    aggregateResumoAparelhosDoKit(aparelhos);
  const vazio =
    marcasModelos.length === 0 &&
    operadoras.length === 0 &&
    empresas.length === 0;

  return (
    <div className={cn("grid grid-cols-1 gap-2 text-[11px]", className)}>
      {marcasModelos.length > 0 && (
        <div className="p-2 bg-white rounded border border-slate-200">
          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1.5">
            Marcas / Modelos
          </p>
          <div className="flex flex-wrap gap-1">
            {marcasModelos.map((mm) => (
              <span
                key={mm}
                className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700"
              >
                {mm}
              </span>
            ))}
          </div>
        </div>
      )}
      {operadoras.length > 0 && (
        <div className="p-2 bg-white rounded border border-slate-200">
          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1.5">
            Operadoras
          </p>
          <div className="flex flex-wrap gap-1">
            {operadoras.map((op) => (
              <span
                key={op}
                className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-700"
              >
                {op}
              </span>
            ))}
          </div>
        </div>
      )}
      {empresas.length > 0 && (
        <div className="p-2 bg-white rounded border border-slate-200">
          <p className="text-[9px] font-bold text-slate-500 uppercase mb-1.5">
            Empresas
          </p>
          <div className="flex flex-wrap gap-1">
            {empresas.map((emp) => (
              <span
                key={emp}
                className="bg-emerald-50 px-1.5 py-0.5 rounded text-emerald-700"
              >
                {emp}
              </span>
            ))}
          </div>
        </div>
      )}
      {vazio && (
        <p className="text-slate-500 italic text-[11px]">
          Nenhum aparelho no kit.
        </p>
      )}
    </div>
  );
}
