import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { MaterialIcon } from "@/components/MaterialIcon";
import { cn } from "@/lib/utils";
import type { ModoPareamento } from "../domain/types";

const subtituloPorModo: Record<ModoPareamento, string> = {
  individual: "Pareamento individual (rastreador + SIM)",
  massa: "Cadastro em massa (colagem de IMEIs e ICCIDs)",
  csv: "Importação via arquivo CSV",
};

type Props = {
  modo: ModoPareamento;
  onModoChange: (m: ModoPareamento) => void;
};

export function PareamentoPageHeader({ modo, onModoChange }: Props) {
  return (
    <header className="sticky -top-4 z-10 flex h-20 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-8">
      <div className="flex items-center gap-4">
        <Link
          to="/equipamentos"
          className="flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex items-center gap-3">
          <MaterialIcon name="link" className="text-blue-600 text-xl" />
          <div>
            <h1 className="text-lg font-bold text-slate-800 uppercase tracking-tight">
              Pareamento de Equipamentos
            </h1>
            <p className="text-xs text-slate-500">{subtituloPorModo[modo]}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        {(
          [
            ["individual", "Individual"],
            ["massa", "Em Massa (Colagem)"],
            ["csv", "Importação CSV"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onModoChange(key)}
            className={cn(
              "px-4 py-2 text-[11px] font-bold uppercase rounded-sm border transition-all",
              modo === key
                ? "bg-slate-800 text-white border-slate-800"
                : "bg-white text-slate-500 border-slate-200 hover:bg-slate-50",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </header>
  );
}
